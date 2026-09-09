/**
 * Portal-scoped data access. Every function here is called only from `portalProcedure`
 * endpoints, so `clientId` comes from a signed client-portal token and is authoritative —
 * these functions never trust a clientId supplied by the caller directly.
 */
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
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
    library,
  };
}

/**
 * Assemble the AI-visibility + rank-tracking dashboard for a client.
 *
 * AI brands aren't linked to clients directly (they're keyed by domain), so we match the
 * client's website domain to a brand owned by the same agency user. Rank tracking is already
 * per-client. Everything degrades gracefully: `hasAiData`/`hasKeywordData` tell the UI which
 * sections have real numbers to show.
 */
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
    aiVisibility = await buildAiVisibility(brandId);
  }

  const keywords = await buildKeywordRankings(clientId);

  return {
    profile,
    hasAiData: aiVisibility.hasAiData,
    hasKeywordData: keywords.length > 0,
    visibilityScore: aiVisibility.visibilityScore,
    bestRank: aiVisibility.bestRank,
    topEngine: aiVisibility.topEngine,
    // "verified" only when the brand was actually cited by an engine, not merely scanned.
    citationStatus: aiVisibility.citations.length > 0 ? "verified" : "none",
    engines: aiVisibility.engines,
    rankProgression: aiVisibility.rankProgression,
    startVsCurrent: aiVisibility.startVsCurrent,
    citations: aiVisibility.citations,
    keywords,
  };
}

function emptyAiVisibility() {
  return {
    hasAiData: false,
    visibilityScore: null as number | null,
    bestRank: null as number | null,
    topEngine: null as string | null,
    engines: [] as EngineSummary[],
    rankProgression: [] as Record<string, number | string | null>[],
    startVsCurrent: [] as { provider: string; label: string; start: number | null; current: number | null }[],
    citations: [] as Citation[],
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

async function buildAiVisibility(brandId: number) {
  const d = await db();
  const rows = await d
    .select({
      scanId: aiVisibilityResults.scanId,
      provider: aiVisibilityResults.provider,
      mentioned: aiVisibilityResults.mentioned,
      position: aiVisibilityResults.position,
      sentiment: aiVisibilityResults.sentiment,
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

  return {
    hasAiData: true,
    visibilityScore,
    bestRank,
    topEngine,
    engines,
    rankProgression,
    startVsCurrent,
    citations,
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
    };
  });
}
