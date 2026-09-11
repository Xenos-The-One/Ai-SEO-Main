/**
 * TEMP demo-seed script (safe to delete). Creates one fully-populated mock client
 * "Peakflow" owned by agency user 20, with 6+ months of realistic analytics across
 * every portal surface: AI-visibility scans, rank tracking, content + content analytics,
 * backlinks, and a site audit. Re-runnable: it wipes the prior Peakflow demo first.
 *
 * Run (Git Bash):  NODE_ENV=development npx tsx server/_seedDemoClient.ts
 */
import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { getDb } from "./db";
import { encryptSecret } from "./_core/crypto";
import { hashPassword } from "./clientPortalAuth";
import {
  aiBrands,
  aiPrompts,
  aiVisibilityResults,
  backlinkSnapshots,
  clientPortalUsers,
  clients,
  content as contentTable,
  contentAnalytics,
  portalBranding,
  rankSnapshots,
  siteAudits,
  siteAuditPages,
  trackedKeywords,
} from "../drizzle/schema";

const OWNER = 20; // Thailer Somerville (thailer@yugensystem.com)
const DOMAIN = "getpeakflow.com";
const WEBSITE = "https://www.getpeakflow.com";
const PORTAL_EMAIL = "demo@getpeakflow.com";
const PORTAL_PASSWORD = "PeakflowDemo2026!";

const DAY = 24 * 60 * 60 * 1000;
function addDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * DAY);
}
function rand(n: number): number {
  return Math.floor(Math.random() * n);
}
function hex(n: number): string {
  let s = "";
  while (s.length < n) s += Math.random().toString(16).slice(2);
  return s.slice(0, n);
}
const round = Math.round;

async function main() {
  const db = await getDb();
  if (!db) throw new Error("No DATABASE_URL — cannot seed.");

  // ---- 1. Clean any prior Peakflow demo (client cascade + the domain-matched brand) ----
  const priorClients = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.name, "Peakflow"), eq(clients.createdBy, OWNER)));
  for (const c of priorClients) {
    await db.delete(clients).where(eq(clients.id, c.id)); // cascades content/keywords/backlinks/etc.
  }
  const priorBrands = await db
    .select({ id: aiBrands.id })
    .from(aiBrands)
    .where(and(eq(aiBrands.domain, DOMAIN), eq(aiBrands.createdBy, OWNER)));
  for (const b of priorBrands) {
    await db.delete(aiBrands).where(eq(aiBrands.id, b.id)); // cascades prompts + results
  }

  const onboardedAt = new Date("2026-02-14T15:00:00Z"); // ~7 months ago

  // ---- 2. Client (every field filled out) ----
  const [client] = await db
    .insert(clients)
    .values({
      name: "Peakflow",
      email: "hello@getpeakflow.com",
      company: "Peakflow, Inc.",
      notes:
        "Mid-market B2B SaaS. Growth-stage project-management platform competing with Asana/Monday. Retainer: content + technical SEO + AI-visibility (GEO). Primary KPI: organic + AI-answer citations driving trial signups.",
      createdBy: OWNER,
      createdAt: onboardedAt,
      updatedAt: onboardedAt,
      monthlyBudget: "2500.00",
      budgetAlertThreshold: 80,
      phone: "+1 (619) 555-0182",
      address: "600 B Street, Suite 300",
      city: "San Diego",
      state: "CA",
      zipCode: "92101",
      country: "United States",
      businessName: "Peakflow, Inc.",
      businessType: "SaaS",
      industry: "Project Management Software",
      businessPhone: "+1 (619) 555-0100",
      businessEmail: "hello@getpeakflow.com",
      businessWebsite: WEBSITE,
      businessAddress: "600 B Street, Suite 300, San Diego, CA 92101",
      websiteUrl: WEBSITE,
      websitePlatform: "WordPress",
      websiteLoginUrl: "https://www.getpeakflow.com/wp-admin",
      websiteUsername: "seo-team",
      websitePassword: encryptSecret("Pf!ntegration2026") ?? "Pf!ntegration2026",
      websiteNotes: "WP + Yoast. Blog under /blog. Staging at staging.getpeakflow.com (basic auth).",
      socialFacebook: "https://facebook.com/getpeakflow",
      socialInstagram: "https://instagram.com/getpeakflow",
      socialLinkedin: "https://linkedin.com/company/getpeakflow",
      socialTwitter: "https://x.com/getpeakflow",
    })
    .returning({ id: clients.id });
  const clientId = client.id;

  // ---- 3. Portal branding + login ----
  await db.insert(portalBranding).values({
    clientId,
    primaryColor: "#4f46e5",
    secondaryColor: "#312e81",
    portalName: "Peakflow SEO & AI-Visibility Portal",
    welcomeMessage:
      "Welcome, Peakflow team. This is your live view into content, keyword rankings, and how often AI assistants recommend Peakflow. Numbers refresh weekly.",
    createdAt: onboardedAt,
    updatedAt: onboardedAt,
  });
  await db.insert(clientPortalUsers).values({
    clientId,
    email: PORTAL_EMAIL,
    passwordHash: await hashPassword(PORTAL_PASSWORD),
    name: "Dana Reyes",
    role: "client_admin",
    isActive: 1,
    lastLoginAt: addDays(new Date(), -2),
    createdAt: onboardedAt,
    updatedAt: onboardedAt,
  });

  // ---- 4. Content pieces ----
  type Piece = {
    title: string;
    topic: string;
    type: string;
    status: "draft" | "in_progress" | "approved";
    words: number;
    slug: string;
    daysAgo: number;
    body: string;
  };
  const pieces: Piece[] = [
    {
      title: "How Remote Teams Stay Aligned: 7 Project Management Habits That Actually Work",
      topic: "remote team project management habits",
      type: "blog",
      status: "approved",
      words: 1840,
      slug: "remote-team-alignment-habits",
      daysAgo: 205,
      body:
        "## Remote alignment is a system, not a vibe\n\nDistributed teams don't drift because people stop caring — they drift because context lives in too many places. The teams that stay aligned build a small set of repeatable habits and let the tooling carry the memory.\n\n### 1. One source of truth for status\nEvery in-flight initiative gets a single board. If it isn't on the board, it isn't happening.\n\n### 2. Async-first updates\nReplace the daily standup with a written thread. People read on their own schedule and nothing blocks on a timezone.\n\n### 3. Make the deadline visible\nA due date nobody can see is a suggestion. Surface it on the card, the dashboard, and the weekly digest.\n\n> Peakflow customers who adopted a weekly written review shipped 22% more on-time in their first quarter.\n\nThe rest of this guide walks through the remaining four habits and the templates we use to run them.",
    },
    {
      title: "Asana vs Monday vs Peakflow: An Honest 2026 Comparison",
      topic: "project management software comparison",
      type: "blog",
      status: "approved",
      words: 2470,
      slug: "asana-vs-monday-vs-peakflow-2026",
      daysAgo: 176,
      body:
        "## Picking a tool you won't outgrow in a year\n\nThere is no single best project management tool — only the best fit for how your team actually works. Here's an honest look at three popular options in 2026.\n\n### Asana\nStrong for structured task management and reporting. Pricing climbs quickly as you add seats and automations.\n\n### Monday.com\nFlexible and colorful, great for cross-functional ops. The flexibility can become sprawl without a strong admin.\n\n### Peakflow\nBuilt for lean teams that want speed without a services engagement. Flat pricing, fast onboarding, and native async reviews.\n\nWe break down pricing, onboarding time, and the three questions to ask before you commit.",
    },
    {
      title: "The Complete Guide to Sprint Planning for Small Teams",
      topic: "sprint planning small teams",
      type: "blog",
      status: "approved",
      words: 2110,
      slug: "sprint-planning-small-teams",
      daysAgo: 141,
      body:
        "## Sprint planning without the ceremony overhead\n\nSmall teams don't need the full Scrum apparatus — they need a predictable cadence and a way to say no. This guide covers a lightweight, two-week planning loop that fits a five-to-fifteen person team.\n\n### Capacity before commitment\nStart from real available hours, not optimism. Subtract meetings, support, and the inevitable interrupt work.\n\n### One goal per sprint\nIf everything is a priority, nothing is. Name a single outcome the sprint is judged on.\n\nIncludes a copy-paste planning template and a retro checklist.",
    },
    {
      title: "Project Management Built for Marketing Agencies",
      topic: "project management for marketing agencies landing page",
      type: "landing",
      status: "approved",
      words: 720,
      slug: "for-marketing-agencies",
      daysAgo: 138,
      body:
        "# Run every client, every deadline, in one place\n\nAgencies juggle a dozen clients, each with its own approvals, assets, and deadlines. Peakflow keeps them all straight.\n\n- **Client workspaces** that keep work siloed and reporting clean\n- **Approval flows** your clients can actually use\n- **Capacity views** so you stop over-committing the team\n\nStart a free 14-day trial — no credit card required.",
    },
    {
      title: "Peakflow Monthly: Ship Faster in Q2",
      topic: "product newsletter Q2",
      type: "newsletter",
      status: "approved",
      words: 640,
      slug: "newsletter-q2-ship-faster",
      daysAgo: 108,
      body:
        "## What's new this month\n\nWe shipped async approvals, a faster board, and a new agency reporting view. Here's how to get the most out of each.\n\n### Async approvals\nSend a deliverable for sign-off without booking a meeting. Clients approve or comment right on the card.\n\n### Faster boards\nLarge boards now load ~2x faster. Nothing to configure.\n\nReply and tell us what to build next.",
    },
    {
      title: "10 Gantt Chart Best Practices for On-Time Delivery",
      topic: "gantt chart best practices",
      type: "blog",
      status: "approved",
      words: 1960,
      slug: "gantt-chart-best-practices",
      daysAgo: 74,
      body:
        "## Gantt charts fail when they become wall art\n\nA Gantt chart is only useful if it changes behavior. These ten practices keep yours honest and current.\n\n### 1. Model dependencies, not wishes\nIf task B truly can't start until A finishes, link them. Fake parallelism hides risk.\n\n### 2. Keep the critical path visible\nEveryone should know which slip actually moves the launch date.\n\nCovers buffers, milestone hygiene, and when a Gantt chart is the wrong tool.",
    },
    {
      title: "5 signs your team has outgrown spreadsheets",
      topic: "social thread outgrowing spreadsheets",
      type: "social",
      status: "approved",
      words: 220,
      slug: "outgrown-spreadsheets-thread",
      daysAgo: 41,
      body:
        "Spreadsheets are where good projects go to quietly derail. 5 signs it's time to graduate 🧵\n\n1. Nobody's sure which tab is current\n2. Status is a color someone forgot to update\n3. Deadlines live in three different places\n4. Onboarding a new hire takes a week\n5. You dread the Monday update\n\nIf you nodded at 3+, your process is the bottleneck — not your team.",
    },
    {
      title: "How to Run a Retrospective Your Team Won't Dread",
      topic: "effective retrospectives",
      type: "blog",
      status: "in_progress",
      words: 1730,
      slug: "better-retrospectives",
      daysAgo: 12,
      body:
        "## The retro problem\n\nMost retrospectives collapse into either silence or a blame session. A good retro is structured, time-boxed, and produces exactly one thing: change.\n\n### Start with data, not feelings\nBring the sprint's real numbers — completed vs planned, cycle time, escaped bugs — before anyone opines.\n\n### End with one owned action\nTen ideas nobody owns beat zero. Pick one, name an owner, and check it next retro.\n\n(Draft — pending client review.)",
    },
  ];

  const now = new Date();
  const contentIds: { id: number; type: string; daysAgo: number }[] = [];
  for (const p of pieces) {
    const createdAt = addDays(now, -p.daysAgo);
    const approved = p.status === "approved";
    const [row] = await db
      .insert(contentTable)
      .values({
        clientId,
        createdBy: OWNER,
        title: p.title,
        topic: p.topic,
        content: p.body,
        publishedUrl: approved ? `${WEBSITE}/blog/${p.slug}` : null,
        status: p.status,
        progress: approved ? 100 : 60,
        contentType: p.type,
        aiModel: "claude-opus-5",
        inputTokens: 1200 + rand(800),
        outputTokens: round(p.words * 1.4),
        totalTokens: 1200 + round(p.words * 1.4),
        wordCount: p.words,
        wasApproved: approved ? 1 : 0,
        approvedAt: approved ? addDays(createdAt, 2) : null,
        generationTimeMs: 8000 + rand(9000),
        createdAt,
        updatedAt: addDays(createdAt, 2),
      })
      .returning({ id: contentTable.id });
    contentIds.push({ id: row.id, type: p.type, daysAgo: p.daysAgo });
  }

  // ---- 5. Content analytics (two snapshots each: mid + latest) so numbers have history ----
  const viewsByType: Record<string, number> = {
    blog: 6800,
    landing: 3100,
    newsletter: 1900,
    social: 4200,
  };
  for (const c of contentIds) {
    if (c.type === "blog" && c.daysAgo < 20) continue; // the in-progress draft: no analytics yet
    const base = viewsByType[c.type] ?? 2500;
    // Older pieces have accumulated more views.
    const maturity = Math.min(1.4, 0.5 + c.daysAgo / 180);
    const latestViews = round(base * maturity * (0.8 + Math.random() * 0.5));
    const midViews = round(latestViews * (0.45 + Math.random() * 0.2));
    const eng = 42 + rand(28); // engagement %
    const timeOnPage = c.type === "social" ? 40 + rand(50) : 120 + rand(200);
    const conv = round(latestViews * (0.006 + Math.random() * 0.02));
    const mkClicks = (v: number) => round(v * (0.12 + Math.random() * 0.1));
    const mkShares = (v: number) => round(v * (0.01 + Math.random() * 0.03));
    // mid snapshot
    await db.insert(contentAnalytics).values({
      contentId: c.id,
      views: midViews,
      clicks: mkClicks(midViews),
      shares: mkShares(midViews),
      engagementRate: Math.max(30, eng - 6),
      avgTimeOnPage: Math.max(30, timeOnPage - 20),
      conversions: round(conv * 0.4),
      recordedAt: addDays(now, -Math.round(c.daysAgo / 2)),
    });
    // latest snapshot
    await db.insert(contentAnalytics).values({
      contentId: c.id,
      views: latestViews,
      clicks: mkClicks(latestViews),
      shares: mkShares(latestViews),
      engagementRate: eng,
      avgTimeOnPage: timeOnPage,
      conversions: conv,
      recordedAt: addDays(now, -2),
    });
  }

  // ---- 6. AI brand + prompts ----
  const competitors = ["Asana", "Monday.com", "ClickUp", "Trello", "Wrike"];
  const [brand] = await db
    .insert(aiBrands)
    .values({
      name: "Peakflow",
      domain: DOMAIN,
      competitors: JSON.stringify(competitors),
      createdBy: OWNER,
      createdAt: onboardedAt,
      updatedAt: onboardedAt,
    })
    .returning({ id: aiBrands.id });
  const brandId = brand.id;

  const promptTexts = [
    "What is the best project management software for remote teams?",
    "What are good Asana alternatives for a growing startup?",
    "Which project management tools work best for marketing agencies?",
    "What is an affordable tool to track team tasks and deadlines?",
  ];
  const promptIds: number[] = [];
  for (const text of promptTexts) {
    const [pr] = await db
      .insert(aiPrompts)
      .values({ brandId, prompt: text, createdBy: OWNER, createdAt: onboardedAt })
      .returning({ id: aiPrompts.id });
    promptIds.push(pr.id);
  }

  // ---- 7. AI-visibility scans: 6 monthly runs (M1..M6), improving over time ----
  // rank[promptIndex][provider] = [M1rank, M6rank]; interpolated; mentioned when rank <= 14.
  const providers = ["openai", "claude", "gemini"] as const;
  const traj: Record<string, Record<string, [number, number]>> = {
    p0: { openai: [16, 4], claude: [18, 6], gemini: [22, 13] },
    p1: { openai: [12, 2], claude: [14, 3], gemini: [17, 9] },
    p2: { openai: [20, 7], claude: [24, 10], gemini: [28, 18] },
    p3: { openai: [11, 3], claude: [13, 5], gemini: [16, 11] },
  };
  const sentiments = ["positive", "neutral", "positive", "positive"] as const;
  const excerptFor = (prompt: string, pos: number) =>
    `Peakflow is listed among the top recommendations (position ${pos}) for "${prompt.replace(/\?$/, "")}", highlighted for fast onboarding, flat pricing, and async approvals.`;
  const summaryFor = (pos: number) =>
    `Recommended at position ${pos}; cited for value and ease of use alongside ${competitors
      .slice(0, 3)
      .join(", ")}.`;

  const scanMonths = [
    new Date("2026-03-15T12:00:00Z"),
    new Date("2026-04-15T12:00:00Z"),
    new Date("2026-05-15T12:00:00Z"),
    new Date("2026-06-15T12:00:00Z"),
    new Date("2026-07-15T12:00:00Z"),
    new Date("2026-08-15T12:00:00Z"),
  ];
  for (let s = 0; s < scanMonths.length; s++) {
    const scanId = `pf-m${s + 1}-${hex(6)}`;
    const scanDate = scanMonths[s];
    for (let pi = 0; pi < promptTexts.length; pi++) {
      const key = `p${pi}` as keyof typeof traj;
      for (const provider of providers) {
        const [m1, m6] = traj[key][provider];
        const rankF = m1 + ((m6 - m1) * s) / 5;
        const rankPos = Math.max(1, round(rankF));
        const mentioned = rankPos <= 14 ? 1 : 0;
        const compShown = competitors.slice(0, 2 + rand(3));
        await db.insert(aiVisibilityResults).values({
          scanId,
          brandId,
          promptId: promptIds[pi],
          provider,
          mentioned,
          position: mentioned ? rankPos : null,
          sentiment: mentioned ? sentiments[pi] : null,
          competitorsMentioned: JSON.stringify(compShown),
          answerExcerpt: mentioned ? excerptFor(promptTexts[pi], rankPos) : null,
          summary: mentioned ? summaryFor(rankPos) : null,
          createdAt: scanDate,
        });
      }
    }
  }

  // ---- 8. Tracked keywords + weekly rank snapshots (~26 weeks) ----
  const keywords: { kw: string; start: number; end: number; slug: string }[] = [
    { kw: "project management software", start: 47, end: 9, slug: "blog/asana-vs-monday-vs-peakflow-2026" },
    { kw: "asana alternatives", start: 33, end: 4, slug: "blog/asana-vs-monday-vs-peakflow-2026" },
    { kw: "project management for agencies", start: 41, end: 6, slug: "for-marketing-agencies" },
    { kw: "team task tracking software", start: 52, end: 11, slug: "blog/outgrown-spreadsheets-thread" },
    { kw: "best project management tools 2026", start: 61, end: 14, slug: "blog/asana-vs-monday-vs-peakflow-2026" },
    { kw: "remote team collaboration software", start: 44, end: 8, slug: "blog/remote-team-alignment-habits" },
    { kw: "project management software for startups", start: 29, end: 3, slug: "" },
    { kw: "gantt chart software online", start: 56, end: 12, slug: "blog/gantt-chart-best-practices" },
  ];
  const WEEKS = 26;
  for (const k of keywords) {
    const [tk] = await db
      .insert(trackedKeywords)
      .values({
        clientId,
        createdBy: OWNER,
        keyword: k.kw,
        locationName: "United States",
        languageName: "English",
        device: "desktop",
        isActive: 1,
        createdAt: addDays(now, -WEEKS * 7),
      })
      .returning({ id: trackedKeywords.id });
    const url = `${WEBSITE}/${k.slug}`.replace(/\/$/, k.slug ? "" : "");
    for (let w = 0; w < WEEKS; w++) {
      const frac = w / (WEEKS - 1);
      const ideal = k.start + (k.end - k.start) * frac;
      const noise = Math.round((Math.random() - 0.5) * 4); // ±2 wobble
      let pos: number | null = Math.max(1, Math.round(ideal + noise));
      // Hard keywords aren't ranked in the first couple weeks.
      if (k.start > 45 && w < 2) pos = null;
      await db.insert(rankSnapshots).values({
        keywordId: tk.id,
        position: pos,
        url: pos ? url : null,
        checkedAt: addDays(now, -(WEEKS - 1 - w) * 7),
        createdAt: addDays(now, -(WEEKS - 1 - w) * 7),
      });
    }
  }

  // ---- 9. Backlink snapshots (monthly, growing) ----
  const blMonths = [
    new Date("2026-02-20T12:00:00Z"),
    new Date("2026-03-20T12:00:00Z"),
    new Date("2026-04-20T12:00:00Z"),
    new Date("2026-05-20T12:00:00Z"),
    new Date("2026-06-20T12:00:00Z"),
    new Date("2026-07-20T12:00:00Z"),
    new Date("2026-08-20T12:00:00Z"),
  ];
  const topRefDomains = [
    { domain: "producthunt.com", backlinks: 42, rank: 812 },
    { domain: "g2.com", backlinks: 88, rank: 786 },
    { domain: "capterra.com", backlinks: 61, rank: 743 },
    { domain: "zapier.com", backlinks: 27, rank: 901 },
    { domain: "medium.com", backlinks: 134, rank: 954 },
    { domain: "getapp.com", backlinks: 33, rank: 688 },
  ];
  const topAnchors = [
    { anchor: "Peakflow", count: 1240 },
    { anchor: "peakflow project management", count: 318 },
    { anchor: "getpeakflow.com", count: 205 },
    { anchor: "project management software", count: 142 },
    { anchor: "click here", count: 96 },
    { anchor: "asana alternative", count: 71 },
  ];
  for (let i = 0; i < blMonths.length; i++) {
    const f = i / (blMonths.length - 1);
    const backlinks = round(340 + (2870 - 340) * f);
    const refDomains = round(58 + (412 - 58) * f);
    const refMain = round(refDomains * 0.86);
    const dfRank = round(182 + (374 - 182) * f);
    const broken = 3 + rand(9);
    await db.insert(backlinkSnapshots).values({
      clientId,
      createdBy: OWNER,
      target: DOMAIN,
      backlinks,
      referringDomains: refDomains,
      referringMainDomains: refMain,
      rank: dfRank,
      brokenBacklinks: broken,
      summary: JSON.stringify({
        target: DOMAIN,
        backlinks,
        referring_domains: refDomains,
        referring_main_domains: refMain,
        rank: dfRank,
        broken_backlinks: broken,
        referring_pages: round(backlinks * 1.6),
        dofollow: round(backlinks * 0.71),
        nofollow: round(backlinks * 0.29),
      }),
      topReferringDomains: JSON.stringify(
        topRefDomains.map((d) => ({ ...d, backlinks: round(d.backlinks * (0.5 + f)) }))
      ),
      topAnchors: JSON.stringify(
        topAnchors.map((a) => ({ ...a, count: round(a.count * (0.5 + f)) }))
      ),
      createdAt: blMonths[i],
    });
  }

  // ---- 10. Site audit + a few crawled pages ----
  const [audit] = await db
    .insert(siteAudits)
    .values({
      clientId,
      createdBy: OWNER,
      taskId: hex(24),
      target: DOMAIN,
      status: "complete",
      pagesCrawled: 142,
      onpageScore: "88.50",
      criticalCount: 3,
      warningCount: 27,
      checks: JSON.stringify({
        broken_links: 4,
        duplicate_title_tags: 2,
        duplicate_meta_descriptions: 5,
        pages_without_h1: 3,
        low_content_rate: 6,
        large_page_size: 2,
        no_image_alt: 19,
        slow_pages: 3,
        redirect_chains: 1,
        https: true,
      }),
      createdAt: addDays(now, -6),
      updatedAt: addDays(now, -6),
    })
    .returning({ id: siteAudits.id });
  const auditPages = [
    { url: `${WEBSITE}/`, code: 200, score: "94.00", issues: ["no_image_alt"] },
    { url: `${WEBSITE}/pricing`, code: 200, score: "91.00", issues: ["duplicate_meta_descriptions"] },
    { url: `${WEBSITE}/blog/asana-vs-monday-vs-peakflow-2026`, code: 200, score: "96.00", issues: [] },
    { url: `${WEBSITE}/for-marketing-agencies`, code: 200, score: "89.00", issues: ["low_content_rate", "no_image_alt"] },
    { url: `${WEBSITE}/blog/gantt-chart-best-practices`, code: 200, score: "92.00", issues: ["large_page_size"] },
    { url: `${WEBSITE}/features/old-roadmap`, code: 404, score: "0.00", issues: ["broken_page", "4xx_status_code"] },
  ];
  for (const pg of auditPages) {
    await db.insert(siteAuditPages).values({
      auditId: audit.id,
      url: pg.url,
      statusCode: pg.code,
      onpageScore: pg.score,
      issues: JSON.stringify(pg.issues),
      createdAt: addDays(now, -6),
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        clientId,
        brandId,
        auditId: audit.id,
        content: contentIds.length,
        keywords: keywords.length,
        rankSnapshotsPerKeyword: WEEKS,
        aiScans: scanMonths.length,
        backlinkSnapshots: blMonths.length,
        portalLogin: { email: PORTAL_EMAIL, password: PORTAL_PASSWORD },
      },
      null,
      2
    )
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
