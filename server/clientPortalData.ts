/**
 * Portal-scoped data access. Every function here is called only from `portalProcedure`
 * endpoints, so `clientId` comes from a signed client-portal token and is authoritative —
 * these functions never trust a clientId supplied by the caller directly.
 */
import { and, asc, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  aiBrands,
  aiPrompts,
  aiVisibilityResults,
  clientPortalUsers,
  clients,
  content as contentTable,
  contentAnalytics,
  portalBranding,
  portalFeedback,
  rankSnapshots,
  trackedKeywords,
} from "../drizzle/schema";
import { normalizeDomain } from "./lib/dataforseo";

async function db() {
  const d = await getDb();
  if (!d) throw new Error("Database not available");
  return d;
}

/** Human-friendly engine labels for the raw provider ids stored on scan results. */
const PROVIDER_LABELS: Record<string, string> = {
  openai: "ChatGPT",
  claude: "Claude",
  gemini: "Google Gemini",
  perplexity: "Perplexity",
};

export function providerLabel(provider: string): string {
  return PROVIDER_LABELS[provider] ?? provider;
}

/** Map a search-intent code (or already-friendly value) to a human label. */
const INTENT_LABELS: Record<string, string> = {
  i: "Informational",
  n: "Navigational",
  c: "Commercial",
  t: "Transactional",
};
export function intentLabel(intent: string | null | undefined): string | null {
  if (!intent) return null;
  // Semrush encodes intent as one or more single letters (e.g. "I", "I,T").
  const parts = intent
    .split(/[,\s/]+/)
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  if (!parts.length) return null;
  const labels = parts.map((p) => INTENT_LABELS[p] ?? (p.charAt(0).toUpperCase() + p.slice(1)));
  return Array.from(new Set(labels)).join(" / ");
}

export async function getPortalMe(clientId: number, role: string, email: string) {
  const d = await db();
  const [client] = await d
    .select({ id: clients.id, name: clients.name, company: clients.company })
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);
  return {
    clientId,
    role,
    email,
    clientName: client?.name ?? "",
    clientCompany: client?.company ?? "",
  };
}

export async function getPortalBranding(clientId: number) {
  const d = await db();
  const [row] = await d
    .select()
    .from(portalBranding)
    .where(eq(portalBranding.clientId, clientId))
    .limit(1);
  return row ?? null;
}

export async function getPortalContentList(clientId: number) {
  const d = await db();
  return d
    .select()
    .from(contentTable)
    .where(eq(contentTable.clientId, clientId))
    .orderBy(desc(contentTable.createdAt));
}

export async function getPortalContentById(clientId: number, id: number) {
  const d = await db();
  const [row] = await d
    .select()
    .from(contentTable)
    .where(and(eq(contentTable.id, id), eq(contentTable.clientId, clientId)))
    .limit(1);
  return row ?? null;
}

export async function getPortalStats(clientId: number) {
  const rows = await getPortalContentList(clientId);
  return {
    totalContent: rows.length,
    pendingApproval: rows.filter((r) => r.status !== "approved").length,
    approved: rows.filter((r) => r.status === "approved").length,
    recent: rows.slice(0, 5).map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      createdAt: r.createdAt,
    })),
  };
}

/** Approve content on the client's behalf. Scoped by clientId; returns false if not theirs. */
export async function portalApproveContent(clientId: number, contentId: number) {
  const d = await db();
  const existing = await getPortalContentById(clientId, contentId);
  if (!existing) return false;
  await d
    .update(contentTable)
    .set({ status: "approved", wasApproved: 1, approvedAt: new Date(), progress: 100 })
    .where(and(eq(contentTable.id, contentId), eq(contentTable.clientId, clientId)));
  return true;
}

/** Send content back for revision (flip to in_progress). Scoped by clientId. */
export async function portalRequestRevision(clientId: number, contentId: number) {
  const d = await db();
  const existing = await getPortalContentById(clientId, contentId);
  if (!existing) return false;
  await d
    .update(contentTable)
    .set({ status: "in_progress", wasApproved: 0, approvedAt: null })
    .where(and(eq(contentTable.id, contentId), eq(contentTable.clientId, clientId)));
  return true;
}

/** List a client's feedback notes on a piece of content (newest first). Scoped by clientId. */
export async function getPortalFeedback(clientId: number, contentId: number) {
  const d = await db();
  const owned = await getPortalContentById(clientId, contentId);
  if (!owned) return [];
  return d
    .select()
    .from(portalFeedback)
    .where(and(eq(portalFeedback.contentId, contentId), eq(portalFeedback.clientId, clientId)))
    .orderBy(desc(portalFeedback.createdAt));
}

/** Agency-side read: all portal feedback for a piece of content (caller must own it). */
export async function getFeedbackForContent(contentId: number) {
  const d = await db();
  return d
    .select()
    .from(portalFeedback)
    .where(eq(portalFeedback.contentId, contentId))
    .orderBy(desc(portalFeedback.createdAt));
}

/** Add a feedback note from a portal user. Scoped by clientId; returns null if not their content. */
export async function addPortalFeedback(
  clientId: number,
  userId: number,
  email: string,
  contentId: number,
  note: string
) {
  const d = await db();
  const owned = await getPortalContentById(clientId, contentId);
  if (!owned) return null;

  // Resolve a display name from the portal user row when it's a real account.
  let authorName = "Client";
  if (userId > 0) {
    const [u] = await d
      .select({ name: clientPortalUsers.name })
      .from(clientPortalUsers)
      .where(eq(clientPortalUsers.id, userId))
      .limit(1);
    if (u?.name) authorName = u.name;
  } else {
    authorName = "Agency (preview)";
  }

  const [row] = await d
    .insert(portalFeedback)
    .values({ contentId, clientId, authorName, authorEmail: email, note })
    .returning();
  return row;
}

/**
 * Match a client to an AI brand by normalized website domain (same agency owner).
 * AI brands aren't linked to clients directly, so this is the join. Returns null if none.
 */
async function findClientBrandId(clientId: number): Promise<number | null> {
  const d = await db();
  const [client] = await d
    .select({ createdBy: clients.createdBy, websiteUrl: clients.websiteUrl, businessWebsite: clients.businessWebsite })
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);
  if (!client) return null;
  const domainSource = client.websiteUrl || client.businessWebsite || "";
  if (!domainSource) return null;
  const clientDomain = normalizeDomain(domainSource);
  const brands = await d
    .select({ id: aiBrands.id, domain: aiBrands.domain })
    .from(aiBrands)
    .where(eq(aiBrands.createdBy, client.createdBy));
  const match = brands.find((b) => b.domain && normalizeDomain(b.domain) === clientDomain);
  return match?.id ?? null;
}

/**
 * Content performance analytics for a client: totals, per-type (channel) breakdown, and a
 * per-piece library. Numbers come from the latest `contentAnalytics` snapshot per content
 * piece; `hasData` is false until any analytics have been recorded.
 */
export async function getPortalContentAnalytics(clientId: number) {
  const d = await db();
  const rows = await d
    .select({
      id: contentTable.id,
      title: contentTable.title,
      contentType: contentTable.contentType,
      status: contentTable.status,
      createdAt: contentTable.createdAt,
    })
    .from(contentTable)
    .where(eq(contentTable.clientId, clientId));

  const empty = {
    hasData: false,
    totalPieces: rows.length,
    totalViews: 0,
    avgEngagement: 0,
    aiCitationsEarned: 0,
    byType: [] as { type: string; views: number; engagement: number }[],
    viewsOverTime: [] as Record<string, number | string>[],
    types: [] as string[],
    library: [] as any[],
  };

  // AI citations earned = mentions across the client's matched brand (if any).
  let aiCitationsEarned = 0;
  const brandId = await findClientBrandId(clientId);
  if (brandId != null) {
    const [m] = await d
      .select({ n: sql<number>`count(*)` })
      .from(aiVisibilityResults)
      .where(and(eq(aiVisibilityResults.brandId, brandId), eq(aiVisibilityResults.mentioned, 1)));
    aiCitationsEarned = Number(m?.n ?? 0);
  }
  empty.aiCitationsEarned = aiCitationsEarned;

  if (rows.length === 0) return empty;

  const ids = rows.map((r) => r.id);
  const analytics = await d
    .select()
    .from(contentAnalytics)
    .where(inArray(contentAnalytics.contentId, ids))
    .orderBy(desc(contentAnalytics.recordedAt));

  if (analytics.length === 0) return empty;

  // Latest snapshot per content piece.
  const latest = new Map<number, typeof analytics[number]>();
  for (const a of analytics) if (!latest.has(a.contentId)) latest.set(a.contentId, a);

  let totalViews = 0;
  let engSum = 0;
  let engCount = 0;
  const byType = new Map<string, { views: number; engSum: number; count: number }>();
  const library = rows.map((r) => {
    const a = latest.get(r.id);
    const views = a?.views ?? 0;
    const engagement = a?.engagementRate ?? 0;
    const conversions = a?.conversions ?? 0;
    totalViews += views;
    if (a) {
      engSum += engagement;
      engCount += 1;
      const t = byType.get(r.contentType) ?? { views: 0, engSum: 0, count: 0 };
      t.views += views;
      t.engSum += engagement;
      t.count += 1;
      byType.set(r.contentType, t);
    }
    return {
      id: r.id,
      title: r.title,
      type: r.contentType,
      status: r.status,
      publishedAt: r.createdAt,
      views,
      engagement,
      conversions,
    };
  });

  library.sort((a, b) => b.views - a.views);

  // Views over time: sum snapshot views per calendar month, split by content type.
  const typeById = new Map(rows.map((r) => [r.id, r.contentType]));
  const typesPresent = Array.from(new Set(rows.map((r) => r.contentType)));
  const monthMap = new Map<string, { sort: number; row: Record<string, number | string> }>();
  for (const a of analytics) {
    const dt = new Date(a.recordedAt);
    const key = `${dt.getFullYear()}-${String(dt.getMonth()).padStart(2, "0")}`;
    const label = dt.toLocaleString("en-US", { month: "short" });
    const type = typeById.get(a.contentId) ?? "other";
    const entry = monthMap.get(key) ?? { sort: dt.getTime(), row: { label } };
    entry.row[type] = ((entry.row[type] as number) ?? 0) + a.views;
    monthMap.set(key, entry);
  }
  const viewsOverTime = Array.from(monthMap.values())
    .sort((a, b) => a.sort - b.sort)
    .map((e) => e.row);

  return {
    hasData: true,
    totalPieces: rows.length,
    totalViews,
    avgEngagement: engCount > 0 ? Math.round((engSum / engCount) * 10) / 10 : 0,
    aiCitationsEarned,
    byType: Array.from(byType.entries()).map(([type, t]) => ({
      type,
      views: t.views,
      engagement: t.count > 0 ? Math.round((t.engSum / t.count) * 10) / 10 : 0,
    })),
    viewsOverTime,
    types: typesPresent,
    library,
  };
}

/**
 * A single line item in a client's service plan (shown on the portal Performance page).
 * `check` = included/not-included; `level` = a coverage badge (Full/Basic/Monthly/…);
 * `quota` = a per-month deliverable target whose `delivered` count the server fills in.
 */
export type ServicePlanItem = {
  key: string;
  label: string;
  type: "check" | "level" | "quota";
  included?: boolean; // check
  level?: string; // level
  target?: number; // quota target per period
  unit?: string; // quota period label, e.g. "month"
  source?: string; // quota source: "content:blog" | "content:newsletter" | "manual"
  delivered?: number; // quota: filled by the server (or stored, for "manual")
};

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}
function currentMonthLabel(): string {
  return new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
}

/**
 * The client's service plan plus live tracking. `quota` items sourced from content
 * (`content:<type>`) report how many of that content type were produced for the client in
 * the current calendar month; other quota items use their stored `delivered` value.
 */
export async function getPortalServicePlan(clientId: number) {
  const d = await db();
  const [client] = await d
    .select({ servicePlan: clients.servicePlan })
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);

  let items: ServicePlanItem[] = [];
  try {
    items = client?.servicePlan ? (JSON.parse(client.servicePlan) as ServicePlanItem[]) : [];
  } catch {
    items = [];
  }
  if (!items.length) return { hasPlan: false, monthLabel: currentMonthLabel(), items: [] as ServicePlanItem[] };

  // Count content produced this calendar month, by type, for content-sourced quota items.
  const counts = new Map<string, number>();
  const needsContentCounts = items.some(
    (i) => i.type === "quota" && typeof i.source === "string" && i.source.startsWith("content:")
  );
  if (needsContentCounts) {
    const rows = await d
      .select({ type: contentTable.contentType, n: sql<number>`count(*)` })
      .from(contentTable)
      .where(and(eq(contentTable.clientId, clientId), gte(contentTable.createdAt, startOfCurrentMonth())))
      .groupBy(contentTable.contentType);
    for (const r of rows) counts.set(r.type, Number(r.n));
  }

  const enriched = items.map((i) => {
    if (i.type === "quota") {
      let delivered = i.delivered ?? 0;
      if (typeof i.source === "string" && i.source.startsWith("content:")) {
        delivered = counts.get(i.source.split(":")[1]) ?? 0;
      }
      return { ...i, delivered };
    }
    return i;
  });

  return { hasPlan: true, monthLabel: currentMonthLabel(), items: enriched };
}

/**
 * Assemble the AI-visibility + rank-tracking dashboard for a client.
 *
 * AI brands aren't linked to clients directly (they're keyed by domain), so we match the
 * client's website domain to a brand owned by the same agency user. Rank tracking is already
 * per-client. Everything degrades gracefully: `hasAiData`/`hasKeywordData` tell the UI which
 * sections have real numbers to show.
 */
/**
 * A domain-level SEO snapshot shown on the portal Performance page. Stored on
 * `clients.seoOverview` as JSON (e.g. captured from Semrush) with three optional sections.
 */
export type SeoOverviewSnapshot = {
  source?: string;
  updatedAt?: string;
  domainOverview?: {
    authorityScore?: number;
    organicTraffic?: number;
    organicTrafficLabel?: string;
    organicKeywords?: number;
    organicKeywordsLabel?: string;
    referringDomains?: number;
    backlinks?: number;
    trafficShare?: string;
    aiVisibility?: number;
    aiMentions?: number;
    aiCitedPages?: number;
    engines?: { label: string; mentions: number; citedPages: number }[];
    topCitedSources?: { domain: string; mentions: number }[];
  } | null;
  siteAudit?: {
    siteHealth?: number;
    pagesCrawled?: number;
    errors?: number;
    warnings?: number;
    broken?: number;
    aiSearchHealth?: number;
    issues?: { label: string; count: number; severity?: string }[];
  } | null;
  backlinks?: {
    referringDomains?: number;
    referringDomainsDelta?: string;
    total?: number;
    totalDelta?: string;
    authorityScore?: number;
    follow?: number;
    nofollow?: number;
    followPct?: number;
    topAnchors?: { anchor: string; count?: number }[];
    topCountries?: { country: string; domains: number }[];
    categories?: { name: string; domains: number }[];
  } | null;
};

function parseSeoOverview(raw: string | null): {
  domainOverview: SeoOverviewSnapshot["domainOverview"] | null;
  siteAudit: SeoOverviewSnapshot["siteAudit"] | null;
  backlinks: SeoOverviewSnapshot["backlinks"] | null;
} {
  if (!raw) return { domainOverview: null, siteAudit: null, backlinks: null };
  try {
    const parsed = JSON.parse(raw) as SeoOverviewSnapshot;
    return {
      domainOverview: parsed.domainOverview ?? null,
      siteAudit: parsed.siteAudit ?? null,
      backlinks: parsed.backlinks ?? null,
    };
  } catch {
    return { domainOverview: null, siteAudit: null, backlinks: null };
  }
}

export async function getPortalPerformance(clientId: number) {
  const d = await db();

  const [client] = await d.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!client) throw new Error("Client not found");

  const onboardedAt = client.createdAt;
  const monthsActive = Math.max(
    0,
    Math.round((Date.now() - new Date(onboardedAt).getTime()) / (30 * 24 * 60 * 60 * 1000))
  );
  const locationParts = [client.city, client.state].filter(Boolean);
  const profile = {
    name: client.businessName || client.name,
    location: locationParts.join(", "),
    industry: client.industry || client.businessType || "",
    onboardedAt,
    monthsActive,
  };

  // Match an AI brand by domain (same agency owner) — brands aren't linked to clients directly.
  const brandId = await findClientBrandId(clientId);

  let aiVisibility = emptyAiVisibility();
  if (brandId != null) {
    aiVisibility = await buildAiVisibility(brandId, profile.name);
  }

  const keywords = await buildKeywordRankings(clientId);

  // Domain-level SEO snapshot (domain overview, site audit, backlinks) — e.g. from Semrush.
  const seo = parseSeoOverview(client.seoOverview);

  return {
    profile,
    domainOverview: seo.domainOverview,
    siteAudit: seo.siteAudit,
    backlinks: seo.backlinks,
    hasSeoData: !!(seo.domainOverview || seo.siteAudit || seo.backlinks),
    hasAiData: aiVisibility.hasAiData,
    hasKeywordData: keywords.length > 0,
    visibilityScore: aiVisibility.visibilityScore,
    weightedScore: aiVisibility.weightedScore,
    bestRank: aiVisibility.bestRank,
    topEngine: aiVisibility.topEngine,
    // "verified" only when the brand was actually cited by an engine, not merely scanned.
    citationStatus: aiVisibility.citations.length > 0 ? "verified" : "none",
    engines: aiVisibility.engines,
    rankProgression: aiVisibility.rankProgression,
    startVsCurrent: aiVisibility.startVsCurrent,
    citations: aiVisibility.citations,
    shareOfVoice: aiVisibility.shareOfVoice,
    radar: aiVisibility.radar,
    estMonthlyVisits: aiVisibility.estMonthlyVisits,
    visitsDeltaPct: aiVisibility.visitsDeltaPct,
    referralTraffic: aiVisibility.referralTraffic,
    competitors: aiVisibility.competitors,
    competitorRank: aiVisibility.competitorRank,
    milestones: aiVisibility.milestones,
    milestonesHit: aiVisibility.milestonesHit,
    keywords,
  };
}

function emptyAiVisibility() {
  return {
    hasAiData: false,
    visibilityScore: null as number | null,
    weightedScore: null as number | null,
    bestRank: null as number | null,
    topEngine: null as string | null,
    engines: [] as EngineSummary[],
    rankProgression: [] as Record<string, number | string | null>[],
    startVsCurrent: [] as { provider: string; label: string; start: number | null; current: number | null }[],
    citations: [] as Citation[],
    shareOfVoice: [] as { provider: string; label: string; mentions: number; pct: number }[],
    radar: [] as { dimension: string; value: number }[],
    estMonthlyVisits: null as number | null,
    visitsDeltaPct: null as number | null,
    referralTraffic: [] as Record<string, number | string>[],
    competitors: [] as { name: string; isYou: boolean; score: number; rank: number }[],
    competitorRank: null as { rank: number; total: number } | null,
    milestones: [] as { label: string; month: number; done: boolean }[],
    milestonesHit: { done: 0, total: 0 },
  };
}

type EngineSummary = {
  provider: string;
  label: string;
  currentRank: number | null;
  startRank: number | null;
  delta: number | null;
  status: string;
};
type Citation = {
  provider: string;
  label: string;
  prompt: string;
  excerpt: string;
  position: number | null;
  mentioned: boolean;
};

/** Modeled monthly referral visits attributed to each current AI mention. */
const VISITS_PER_MENTION = 30;

async function buildAiVisibility(brandId: number, clientName: string) {
  const d = await db();
  const [brand] = await d.select({ competitors: aiBrands.competitors }).from(aiBrands).where(eq(aiBrands.id, brandId)).limit(1);
  const rows = await d
    .select({
      scanId: aiVisibilityResults.scanId,
      provider: aiVisibilityResults.provider,
      mentioned: aiVisibilityResults.mentioned,
      position: aiVisibilityResults.position,
      sentiment: aiVisibilityResults.sentiment,
      competitorsMentioned: aiVisibilityResults.competitorsMentioned,
      summary: aiVisibilityResults.summary,
      answerExcerpt: aiVisibilityResults.answerExcerpt,
      prompt: aiPrompts.prompt,
      createdAt: aiVisibilityResults.createdAt,
    })
    .from(aiVisibilityResults)
    .leftJoin(aiPrompts, eq(aiVisibilityResults.promptId, aiPrompts.id))
    .where(eq(aiVisibilityResults.brandId, brandId))
    .orderBy(asc(aiVisibilityResults.createdAt));

  if (rows.length === 0) return emptyAiVisibility();

  // Order scans chronologically.
  const scanOrder: string[] = [];
  for (const r of rows) if (!scanOrder.includes(r.scanId)) scanOrder.push(r.scanId);
  const firstScan = scanOrder[0];
  const lastScan = scanOrder[scanOrder.length - 1];

  const providers = Array.from(new Set(rows.map((r) => r.provider)));

  // Best (lowest) rank per provider within a given scan; falls back to null when unranked.
  const bestRankIn = (scanId: string, provider: string): number | null => {
    const positions = rows
      .filter((r) => r.scanId === scanId && r.provider === provider && r.position != null)
      .map((r) => r.position as number);
    return positions.length ? Math.min(...positions) : null;
  };

  const engines: EngineSummary[] = providers.map((provider) => {
    const currentRank = bestRankIn(lastScan, provider);
    const startRank = bestRankIn(firstScan, provider);
    const delta =
      currentRank != null && startRank != null ? startRank - currentRank : null; // + = improved
    let status = "Holding";
    if (delta != null && delta > 0) status = `↑ ${delta} position${delta > 1 ? "s" : ""}`;
    else if (delta != null && delta < 0) status = `↓ ${Math.abs(delta)}`;
    return { provider, label: providerLabel(provider), currentRank, startRank, delta, status };
  });

  // Visibility score = mention rate across the latest scan.
  const latestRows = rows.filter((r) => r.scanId === lastScan);
  const mentioned = latestRows.filter((r) => r.mentioned).length;
  const visibilityScore = latestRows.length
    ? Math.round((mentioned / latestRows.length) * 100)
    : 0;

  const rankedEngines = engines.filter((e) => e.currentRank != null);
  const bestRank = rankedEngines.length
    ? Math.min(...rankedEngines.map((e) => e.currentRank as number))
    : null;
  const topEngine =
    rankedEngines.length
      ? rankedEngines.reduce((a, b) =>
          (a.currentRank as number) <= (b.currentRank as number) ? a : b
        ).label
      : null;

  // Rank progression: one row per scan, best rank per provider (labelled M1..Mn).
  const rankProgression = scanOrder.map((scanId, i) => {
    const row: Record<string, number | string | null> = { label: `M${i + 1}` };
    for (const p of providers) row[p] = bestRankIn(scanId, p);
    return row;
  });

  const startVsCurrent = engines.map((e) => ({
    provider: e.provider,
    label: e.label,
    start: e.startRank,
    current: e.currentRank,
  }));

  // Citations: mentioned results from the latest scan, one per provider (best position first).
  const citations: Citation[] = [];
  for (const provider of providers) {
    const best = latestRows
      .filter((r) => r.provider === provider && r.mentioned)
      .sort((a, b) => (a.position ?? 999) - (b.position ?? 999))[0];
    if (best) {
      citations.push({
        provider,
        label: providerLabel(provider),
        prompt: best.prompt ?? "",
        excerpt: best.summary || best.answerExcerpt || "",
        position: best.position,
        mentioned: true,
      });
    }
  }

  // --- Share of Voice: each engine's share of the latest scan's mentions ---
  const mentionsByProvider = providers.map((p) => ({
    provider: p,
    label: providerLabel(p),
    mentions: latestRows.filter((r) => r.provider === p && r.mentioned).length,
  }));
  const totalMentions = mentionsByProvider.reduce((s, x) => s + x.mentions, 0);
  const shareOfVoice = mentionsByProvider.map((x) => ({
    ...x,
    pct: totalMentions > 0 ? Math.round((x.mentions / totalMentions) * 100) : 0,
  }));

  // --- AI Visibility Radar: per-engine mention rate + citation trust + momentum ---
  const radar = providers.map((p) => {
    const pr = latestRows.filter((r) => r.provider === p);
    const rate = pr.length ? Math.round((pr.filter((r) => r.mentioned).length / pr.length) * 100) : 0;
    return { dimension: providerLabel(p), value: rate };
  });
  const mentionedLatest = latestRows.filter((r) => r.mentioned);
  const citationTrust = mentionedLatest.length
    ? Math.round((mentionedLatest.filter((r) => r.sentiment === "positive").length / mentionedLatest.length) * 100)
    : 0;
  const firstRows = rows.filter((r) => r.scanId === firstScan);
  const firstRate = firstRows.length ? (firstRows.filter((r) => r.mentioned).length / firstRows.length) * 100 : 0;
  const momentum = Math.max(0, Math.min(100, Math.round(50 + (visibilityScore - firstRate))));
  radar.push({ dimension: "Citation Trust", value: citationTrust });
  radar.push({ dimension: "Momentum", value: momentum });

  // --- Weighted visibility score: mention rate tempered by average position quality ---
  const posRows = mentionedLatest.filter((r) => r.position != null);
  const posQuality = posRows.length
    ? posRows.reduce((s, r) => s + Math.max(0, 1 - ((r.position as number) - 1) / 10), 0) / posRows.length
    : 0;
  const weightedScore = Math.round(visibilityScore * 0.6 + posQuality * 100 * 0.4);

  // --- Modeled referral traffic per scan + estimated monthly visits ---
  const referralTraffic = scanOrder.map((scanId, i) => {
    const row: Record<string, number | string> = { label: `M${i + 1}` };
    for (const p of providers) {
      row[p] = rows.filter((r) => r.scanId === scanId && r.provider === p && r.mentioned).length * VISITS_PER_MENTION;
    }
    return row;
  });
  const estMonthlyVisits = totalMentions * VISITS_PER_MENTION;
  const firstVisits = firstRows.filter((r) => r.mentioned).length * VISITS_PER_MENTION;
  const visitsDeltaPct = firstVisits > 0 ? Math.round(((estMonthlyVisits - firstVisits) / firstVisits) * 100) : null;

  // --- Competitor comparison: rank the client among tracked peers by mention frequency ---
  let competitorNames: string[] = [];
  try {
    competitorNames = brand?.competitors ? JSON.parse(brand.competitors) : [];
  } catch {
    competitorNames = [];
  }
  const compCounts = new Map<string, number>(competitorNames.map((n) => [n, 0]));
  for (const r of latestRows) {
    if (!r.competitorsMentioned) continue;
    let arr: string[] = [];
    try {
      arr = JSON.parse(r.competitorsMentioned);
    } catch {
      arr = [];
    }
    for (const nm of arr) if (compCounts.has(nm)) compCounts.set(nm, (compCounts.get(nm) ?? 0) + 1);
  }
  const compEntries = [
    { name: clientName, isYou: true, score: totalMentions },
    ...competitorNames.map((n) => ({ name: n, isYou: false, score: compCounts.get(n) ?? 0 })),
  ].sort((a, b) => b.score - a.score);
  const competitors = compEntries.map((e, i) => ({ ...e, rank: i + 1 }));
  const youRank = competitors.find((c) => c.isYou)?.rank ?? null;
  const competitorRank = youRank != null ? { rank: youRank, total: competitors.length } : null;

  // --- Achievement milestones: derived from the best rank ever reached ---
  const rankedEver = rows.filter((r) => r.position != null).map((r) => r.position as number);
  const bestEver = rankedEver.length ? Math.min(...rankedEver) : null;
  const everMentioned = rows.some((r) => r.mentioned);
  const multiEngine = providers.filter((p) => latestRows.some((r) => r.provider === p && r.mentioned)).length >= 2;
  const milestones = [
    { label: "Onboarded to AI Knowledge Graph", month: 1, done: true },
    { label: "First AI citation detected", month: 2, done: everMentioned },
    { label: "Reached Top 10", month: 3, done: bestEver != null && bestEver <= 10 },
    { label: "Reached Top 3", month: 4, done: bestEver != null && bestEver <= 3 },
    { label: "Multi-engine coverage", month: 5, done: multiEngine },
    { label: "#1 Position secured", month: 6, done: bestEver === 1 },
  ];
  const milestonesHit = { done: milestones.filter((m) => m.done).length, total: milestones.length };

  return {
    hasAiData: true,
    visibilityScore,
    weightedScore,
    bestRank,
    topEngine,
    engines,
    rankProgression,
    startVsCurrent,
    citations,
    shareOfVoice,
    radar,
    estMonthlyVisits,
    visitsDeltaPct,
    referralTraffic,
    competitors,
    competitorRank,
    milestones,
    milestonesHit,
  };
}

/** Per-keyword SERP ranks from rank tracking: latest position + the one before it. */
async function buildKeywordRankings(clientId: number) {
  const d = await db();
  const keywords = await d
    .select()
    .from(trackedKeywords)
    .where(and(eq(trackedKeywords.clientId, clientId), eq(trackedKeywords.isActive, 1)));
  if (keywords.length === 0) return [];

  const ids = keywords.map((k) => k.id);
  const snaps = await d
    .select()
    .from(rankSnapshots)
    .where(inArray(rankSnapshots.keywordId, ids))
    .orderBy(desc(rankSnapshots.checkedAt));

  return keywords.map((k) => {
    const history = snaps.filter((s) => s.keywordId === k.id);
    const current = history[0]?.position ?? null;
    const prev = history[1]?.position ?? null;
    let status = "New";
    if (prev != null && current != null) {
      if (current < prev) status = "Rising";
      else if (current > prev) status = "Falling";
      else status = "Stable";
    } else if (current != null && prev == null && history.length > 1) {
      status = "Stable";
    }
    return {
      keyword: k.keyword,
      location: k.locationName,
      position: current,
      prev,
      status,
      volume: k.searchVolume ?? null,
      intent: intentLabel(k.intent),
    };
  });
}
