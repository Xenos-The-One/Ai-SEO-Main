/**
 * TEMP demo-seed: second mock client "Giancarlo Anduray" (Miami real-estate agent),
 * scaled to ~3 months of data (vs Peakflow's 6+). Self-contained + re-runnable
 * (wipes the prior Giancarlo client + its domain-matched brand first). Safe to delete.
 *
 * Run (Git Bash):  NODE_ENV=development npx tsx server/_seedGiancarlo.ts
 */
import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { getDb } from "./db";
import { encryptSecret } from "./_core/crypto";
import { hashPassword } from "./clientPortalAuth";
import { generateImage } from "./_core/imageGeneration";
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

const OWNER = 20;
const DOMAIN = "andurayrealestate.com";
const WEBSITE = "https://www.andurayrealestate.com";
const PORTAL_EMAIL = "giancarlo@andurayrealestate.com";
const PORTAL_PASSWORD = "AndurayDemo2026!";
const CLIENT_NAME = "Giancarlo Anduray";

const DAY = 24 * 60 * 60 * 1000;
const addDays = (b: Date, d: number) => new Date(b.getTime() + d * DAY);
const rand = (n: number) => Math.floor(Math.random() * n);
const round = Math.round;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const wordCountOf = (md: string) => md.replace(/[#>*_`\-]/g, " ").split(/\s+/).filter(Boolean).length;
function hex(n: number) {
  let s = "";
  while (s.length < n) s += Math.random().toString(16).slice(2);
  return s.slice(0, n);
}
async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<T>((_, r) => setTimeout(() => r(new Error("timeout")), ms))]);
}

// ---- Hero images (real-estate themed) ----
const IMAGE_PROMPTS = [
  "Luxury Miami waterfront condo tower at dusk, palm trees, modern glass architecture, warm lights, no text",
  "Bright modern luxury living room with floor-to-ceiling windows overlooking the ocean, elegant interior, no text",
  "Aerial view of Miami Beach coastline with high-rise condos and turquoise water, sunny, no text",
  "Elegant modern kitchen in a luxury condo, white marble island, warm natural light, no text",
  "A 'Sold' real estate sign in front of an upscale Miami home on a sunny day, palm trees, no text",
  "Professional real estate agent shaking hands with a happy couple in a bright modern office, no text",
];

async function buildImagePool(): Promise<string[]> {
  const results = await Promise.allSettled(
    IMAGE_PROMPTS.map((prompt, i) =>
      withTimeout(generateImage({ prompt }), 40000).then((r) => {
        if (!r.url) throw new Error("no url");
        console.log(`  image ${i} ok`);
        return r.url;
      })
    )
  );
  return results.map((r, i) =>
    r.status === "fulfilled" ? r.value : `https://picsum.photos/seed/anduray-${i}/1200/630`
  );
}

// ---- Blog pool (12 = 4/month × 3 months). `img` indexes the image pool. ----
type Blog = { t: string; topic: string; img: number; intro: string };
const BLOGS: Blog[] = [
  { t: "How to Buy a Waterfront Condo in Miami: A 2026 Guide", topic: "buying a waterfront condo in Miami", img: 0, intro: "A waterfront condo is the dream for a lot of Miami buyers — but the process has a few wrinkles that catch first-timers off guard. Here's how to buy one with your eyes open." },
  { t: "Miami Real Estate Market Update: What Buyers Need to Know", topic: "the Miami real estate market", img: 2, intro: "Miami's market moves fast, and headlines rarely tell the full story. Here's a grounded look at where prices, inventory, and demand actually stand right now." },
  { t: "5 Neighborhoods Every Miami Luxury Buyer Should Consider", topic: "choosing a Miami neighborhood", img: 2, intro: "The right neighborhood matters as much as the right home. These five areas consistently deliver for luxury buyers — each for a very different reason." },
  { t: "Selling Your Miami Home: How to Price It Right", topic: "pricing your Miami home to sell", img: 4, intro: "Price your home too high and it sits; too low and you leave money on the table. Getting it right the first week is the single biggest lever a seller has." },
  { t: "First-Time Homebuyer's Guide to Miami Beach", topic: "buying your first home in Miami Beach", img: 1, intro: "Buying your first place in Miami Beach is exciting — and a little overwhelming. This guide walks you through it step by step so nothing catches you by surprise." },
  { t: "What $1M Buys You in Miami Right Now", topic: "what a million dollars buys in Miami", img: 1, intro: "A million dollars is a very different home depending on where you look in Miami. Here's an honest tour of what that budget gets you across the city today." },
  { t: "The Truth About Miami Condo HOA Fees", topic: "Miami condo HOA fees", img: 3, intro: "HOA fees can make or break the math on a condo, yet buyers routinely underestimate them. Here's how to read them properly before you fall in love with a unit." },
  { t: "Relocating to Miami: A Complete Neighborhood Breakdown", topic: "relocating to Miami", img: 2, intro: "Moving to Miami from out of state? The city rewards people who understand its neighborhoods before they sign a lease or a contract. Let's break them down." },
  { t: "Investing in Miami Short-Term Rentals: What to Know", topic: "investing in Miami short-term rentals", img: 0, intro: "Short-term rentals can be a strong Miami investment — or a compliance headache. The difference usually comes down to a few things you check before you buy." },
  { t: "Staging Secrets That Sell Miami Condos Faster", topic: "staging a Miami condo to sell", img: 1, intro: "Great staging can shave weeks off your sale and add real dollars to the offer. Here are the moves that actually move the needle for Miami condos." },
  { t: "Understanding Miami's Luxury Closing Process", topic: "the Miami luxury closing process", img: 5, intro: "The closing table is where good deals get finished or fall apart. Knowing how a Miami luxury closing works keeps you calm and in control at the finish line." },
  { t: "New Construction vs Resale: Buying in Miami", topic: "new construction vs resale in Miami", img: 0, intro: "Shiny new tower or established resale? Both can be the right call in Miami — it just depends on what you value most. Here's how to decide with confidence." },
];

function reExtra(topic: string, idx: number): string {
  const variants = [
    `## A quick story

I recently worked with a client weighing ${topic}. They came in anxious, convinced they'd have to compromise on either location or budget. By slowing down, getting clear on their must-haves, and moving quickly when the right opportunity appeared, we closed on a home that checked every box — and did it under their original budget. The lesson repeats constantly in Miami: preparation plus decisiveness beats endless searching.`,
    `## Common questions

**How fast do I need to move?** In the segments buyers care about most, the best homes go quickly. Being pre-approved and clear on your criteria lets you act without rushing.

**Is it a buyer's or seller's market?** It varies by neighborhood and price point — that's exactly why a local read matters more than a national headline.

**Do I really need an agent?** For anything involving ${topic}, a local advocate usually saves you far more than they cost, in both money and stress.`,
    `## A checklist before you commit

Before you move forward with ${topic}, make sure you can check these off:

- You're pre-approved (or have proof of funds) and know your true all-in budget.
- You've factored in taxes, insurance, and HOA or maintenance costs — not just the price.
- You've seen comparable recent sales, not just active listings.
- You understand the timeline and what each contingency actually protects.
- You have someone local in your corner who negotiates for you, not the deal.`,
  ];
  return variants[idx % variants.length];
}

function reBlogBody(b: Blog, idx: number): string {
  const topic = b.topic;
  const T = cap(topic);
  return `${b.intro}

Below, I'll walk through what's happening in the Miami market, what it means for you, and how I help clients handle ${topic} without the guesswork.

## The Miami market right now

Miami remains one of the most dynamic real estate markets in the country, shaped by steady in-migration, international demand, and a limited supply of truly prime inventory. That combination keeps desirable homes competitive even when the broader headlines sound cautious. When it comes to ${topic}, the citywide averages you read online matter far less than what's actually happening in your specific neighborhood and price band — two identical-sounding condos a few blocks apart can tell completely different stories.

The buyers and sellers who do well here aren't the ones chasing the market; they're the ones who understand it. They know what recent comparable homes actually sold for, how long they sat, and where negotiating leverage really lies.

## What this means for you

Whether you're buying or selling, ${topic} comes down to a handful of decisions that matter far more than the rest. Get those right and the process feels smooth; get them wrong and you either overpay, undersell, or lose the home you wanted to someone who was simply better prepared.

The good news is that none of it requires insider access — it requires local knowledge and a plan. That's the entire job of a good agent: turning a stressful, high-stakes decision into a clear set of steps you feel confident about.

## What to keep in mind

- **Location within the location.** In Miami, the building, the line, and even the floor can matter as much as the neighborhood.
- **The all-in number.** Taxes, insurance, and HOA or maintenance costs shape affordability as much as the sticker price.
- **Timing and leverage.** Knowing how long comparable homes sat tells you where you can push and where you can't.
- **Condition vs. potential.** Sometimes the right move is the move-in-ready home; sometimes it's the one with upside.
- **Your real timeline.** The best decisions come from knowing your own must-haves and deadlines before you start.

${reExtra(topic, idx)}

## How I help my clients

Real estate is intensely local, and the details are where deals are won or lost. I spend my time on the parts that actually move the outcome for you: reading the right comparable sales, spotting issues before they become expensive surprises, and negotiating hard on the terms that matter. My clients don't get a salesperson — they get an advocate who tells them the truth, even when it's "keep looking."

When it comes to ${topic}, that combination of local knowledge and honest guidance is exactly what keeps you from overpaying, over-worrying, or missing the right opportunity.

## Ready to make your move?

If you're thinking about ${topic} in Miami, the best first step is a quick, no-pressure conversation about your goals, your budget, and your timeline. From there I'll build you a clear plan and a shortlist worth your time. Reach out whenever you're ready — the earlier we talk, the more options you'll have.`;
}

// ---- Newsletters (6 = 2/month). A monthly market report + a themed note. ----
function marketReport(monthLabel: string): string {
  return `Hi there,

Welcome to The Anduray Report for ${monthLabel} — your quick, no-hype read on where Miami real estate actually stands this month. Two minutes, no jargon.

## The headline

Demand for well-priced, move-in-ready homes stayed strong this month, especially in the waterfront and luxury-condo segments. Inventory ticked up slightly, which is quietly good news for buyers who've been waiting for a little more room to negotiate — without any sign of prices falling off a cliff.

## What it means if you're buying

You have a bit more selection than you did earlier in the year, and sellers of homes that have sat are more open to conversation. Being pre-approved and decisive still wins the best listings, but you're not competing quite as fiercely as the peak.

## What it means if you're selling

Pricing right in the first week matters more than ever. Homes that launch at the correct number are still moving quickly and near ask; the ones that reach get stale and end up chasing the market down.

## Let's talk

Curious what your home is worth today, or what your budget really buys right now? Reply to this email and I'll put together a straight answer — no obligation.

Talk soon,
Giancarlo Anduray`;
}

function themedNote(kind: string, monthLabel: string): string {
  return `Hi there,

A quick note this month on ${kind} — one of the questions I get asked most by Miami buyers and sellers right now.

## Why it's on my mind

Every ${monthLabel}, I see the same handful of decisions make or break a deal, and ${kind} is near the top of the list. Handled early, it's a non-issue; handled late, it's the thing that adds stress and costs money at the worst possible moment.

## What I'd tell a friend

Get clear on your numbers before you fall in love with a home. Look at what actually sold, not just what's listed. And lean on someone local who negotiates for you — the right guidance on ${kind} usually pays for itself many times over.

## Here to help

If you want a candid read on ${kind} for your specific situation, just reply. I answer every message personally, and there's never any pressure.

Talk soon,
Giancarlo Anduray`;
}

async function main() {
  const db = await getDb();
  if (!db) throw new Error("No DATABASE_URL — cannot seed.");

  // ---- Cleanup prior demo ----
  const priorClients = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.name, CLIENT_NAME), eq(clients.createdBy, OWNER)));
  for (const c of priorClients) await db.delete(clients).where(eq(clients.id, c.id));
  const priorBrands = await db
    .select({ id: aiBrands.id })
    .from(aiBrands)
    .where(and(eq(aiBrands.domain, DOMAIN), eq(aiBrands.createdBy, OWNER)));
  for (const b of priorBrands) await db.delete(aiBrands).where(eq(aiBrands.id, b.id));

  const onboardedAt = new Date("2026-06-12T15:00:00Z"); // ~3 months ago (today = 2026-09-10)
  const now = new Date();

  // ---- Client ----
  const [client] = await db
    .insert(clients)
    .values({
      name: CLIENT_NAME,
      email: PORTAL_EMAIL,
      company: "Anduray Real Estate Group",
      notes:
        "Luxury real-estate personal brand (Miami). Solo agent under a boutique brokerage. Retainer: local SEO + GBP, content, and AI-visibility to win high-intent buyer/seller searches. Onboarded ~3 months ago.",
      createdBy: OWNER,
      createdAt: onboardedAt,
      updatedAt: onboardedAt,
      monthlyBudget: "1500.00",
      budgetAlertThreshold: 80,
      phone: "+1 (305) 555-0147",
      address: "1101 Brickell Ave, Suite 800",
      city: "Miami",
      state: "FL",
      zipCode: "33131",
      country: "United States",
      businessName: "Anduray Real Estate Group",
      businessType: "Real Estate Agent",
      industry: "Real Estate",
      businessPhone: "+1 (305) 555-0100",
      businessEmail: PORTAL_EMAIL,
      businessWebsite: WEBSITE,
      businessAddress: "1101 Brickell Ave, Suite 800, Miami, FL 33131",
      websiteUrl: WEBSITE,
      websitePlatform: "WordPress",
      websiteLoginUrl: "https://www.andurayrealestate.com/wp-admin",
      websiteUsername: "seo-team",
      websitePassword: encryptSecret("Anduray!2026") ?? "Anduray!2026",
      websiteNotes: "WP + Yoast. Listings via IDX plugin. Blog under /blog.",
      socialFacebook: "https://facebook.com/andurayrealestate",
      socialInstagram: "https://instagram.com/giancarloanduray",
      socialLinkedin: "https://linkedin.com/in/giancarloanduray",
      socialTwitter: "https://x.com/andurayhomes",
    })
    .returning({ id: clients.id });
  const clientId = client.id;

  // ---- Branding + portal login ----
  await db.insert(portalBranding).values({
    clientId,
    primaryColor: "#0f766e",
    secondaryColor: "#134e4a",
    portalName: "Anduray Real Estate — SEO & AI-Visibility Portal",
    welcomeMessage:
      "Welcome, Giancarlo. This is your live view into content, local keyword rankings, and how often AI assistants recommend you to Miami buyers and sellers.",
    createdAt: onboardedAt,
    updatedAt: onboardedAt,
  });
  await db.insert(clientPortalUsers).values({
    clientId,
    email: PORTAL_EMAIL,
    passwordHash: await hashPassword(PORTAL_PASSWORD),
    name: "Giancarlo Anduray",
    role: "client_admin",
    isActive: 1,
    lastLoginAt: addDays(now, -3),
    createdAt: onboardedAt,
    updatedAt: onboardedAt,
  });

  // ---- Images ----
  console.log("Generating hero images (with graceful fallback)…");
  const images = await buildImagePool();
  const nlImage = images[4];

  // ---- Content: 3 months (Jul, Aug, Sep 2026), 4 blogs + 2 newsletters each ----
  const monthDefs = [
    { idx: 6, label: "July 2026" },
    { idx: 7, label: "August 2026" },
    { idx: 8, label: "September 2026" }, // current
  ];
  const isCurrent = (mi: number) => mi === 8;
  const blogDays = (mi: number) => (isCurrent(mi) ? [1, 4, 7, 9] : [5, 12, 19, 26]);
  const nlDays = (mi: number) => (isCurrent(mi) ? [3, 8] : [8, 22]);
  const themes = ["Miami condo HOA fees", "pricing your home right", "waterfront closing timelines"];

  type Row = { title: string; topic: string; body: string; type: "blog" | "newsletter"; img: string; date: Date; status: "approved" | "in_progress"; words: number };
  const rows: Row[] = [];

  monthDefs.forEach((md, mIdx) => {
    const bd = blogDays(md.idx);
    for (let i = 0; i < 4; i++) {
      const gi = mIdx * 4 + i;
      const b = BLOGS[gi];
      const body = reBlogBody(b, gi);
      const status = isCurrent(md.idx) ? (i < 2 ? "approved" : "in_progress") : "approved";
      rows.push({
        title: b.t,
        topic: b.topic,
        body,
        type: "blog",
        img: images[b.img] ?? images[0],
        date: new Date(2026, md.idx, bd[i], 10 + i, 0, 0),
        status,
        words: wordCountOf(body),
      });
    }
    const nd = nlDays(md.idx);
    const report = marketReport(md.label);
    rows.push({
      title: `The Anduray Report — ${md.label}`,
      topic: `Miami market report ${md.label}`,
      body: report,
      type: "newsletter",
      img: nlImage,
      date: new Date(2026, md.idx, nd[0], 9, 0, 0),
      status: "approved",
      words: wordCountOf(report),
    });
    const note = themedNote(themes[mIdx], md.label);
    rows.push({
      title: `Buyer & Seller Note: ${cap(themes[mIdx])}`,
      topic: `client note ${themes[mIdx]}`,
      body: note,
      type: "newsletter",
      img: nlImage,
      date: new Date(2026, md.idx, nd[1], 9, 0, 0),
      status: isCurrent(md.idx) ? "in_progress" : "approved",
      words: wordCountOf(note),
    });
  });

  let blogCount = 0;
  let nlCount = 0;
  for (const r of rows) {
    if (r.type === "blog") blogCount++;
    else nlCount++;
    const approved = r.status === "approved";
    const slug = r.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
    const [ins] = await db
      .insert(contentTable)
      .values({
        clientId,
        createdBy: OWNER,
        title: r.title,
        topic: r.topic,
        content: r.body,
        imageUrl: r.img,
        imagePrompt: "Auto-generated hero image",
        publishedUrl: approved ? `${WEBSITE}/${r.type === "blog" ? "blog/" : "newsletter/"}${slug}` : null,
        status: r.status,
        progress: approved ? 100 : 55,
        contentType: r.type,
        aiModel: "claude-opus-5",
        inputTokens: 1100 + rand(700),
        outputTokens: round(r.words * 1.4),
        totalTokens: 1100 + round(r.words * 1.4),
        wordCount: r.words,
        wasApproved: approved ? 1 : 0,
        approvedAt: approved ? addDays(r.date, 2) : null,
        generationTimeMs: 8000 + rand(9000),
        createdAt: r.date,
        updatedAt: addDays(r.date, 2),
      })
      .returning({ id: contentTable.id });

    if (!approved) continue;

    const ageDays = Math.max(1, Math.round((now.getTime() - r.date.getTime()) / DAY));
    const maturity = Math.min(1.4, 0.5 + ageDays / 90);
    const base = r.type === "blog" ? 1400 : 700; // local realtor: smaller audience than a SaaS
    const latestViews = round(base * maturity * (0.75 + Math.random() * 0.5));
    const midViews = round(latestViews * (0.45 + Math.random() * 0.2));
    const eng = (r.type === "blog" ? 46 : 40) + rand(24);
    const timeOnPage = r.type === "blog" ? 120 + rand(180) : 55 + rand(60);
    const conv = round(latestViews * (0.01 + Math.random() * 0.03)); // leads
    const mkClicks = (v: number) => round(v * (0.12 + Math.random() * 0.1));
    const mkShares = (v: number) => round(v * (0.01 + Math.random() * 0.03));
    await db.insert(contentAnalytics).values({
      contentId: ins.id,
      views: midViews,
      clicks: mkClicks(midViews),
      shares: mkShares(midViews),
      engagementRate: Math.max(25, eng - 6),
      avgTimeOnPage: Math.max(30, timeOnPage - 20),
      conversions: round(conv * 0.4),
      recordedAt: addDays(now, -Math.round(ageDays / 2)),
    });
    await db.insert(contentAnalytics).values({
      contentId: ins.id,
      views: latestViews,
      clicks: mkClicks(latestViews),
      shares: mkShares(latestViews),
      engagementRate: eng,
      avgTimeOnPage: timeOnPage,
      conversions: conv,
      recordedAt: addDays(now, -2),
    });
  }

  // ---- AI brand + prompts ----
  const competitors = ["Compass", "Douglas Elliman", "ONE Sotheby's", "The Jills Zeder Group", "Coldwell Banker"];
  const [brand] = await db
    .insert(aiBrands)
    .values({
      name: "Giancarlo Anduray",
      domain: DOMAIN,
      competitors: JSON.stringify(competitors),
      createdBy: OWNER,
      createdAt: onboardedAt,
      updatedAt: onboardedAt,
    })
    .returning({ id: aiBrands.id });
  const brandId = brand.id;

  const promptTexts = [
    "Who is the best real estate agent in Miami for luxury condos?",
    "Which realtor should I use to sell a waterfront home in Miami?",
    "Best real estate agents in Miami Beach for first-time buyers?",
    "Who are the top luxury real estate agents in Miami?",
  ];
  const promptIds: number[] = [];
  for (const text of promptTexts) {
    const [pr] = await db
      .insert(aiPrompts)
      .values({ brandId, prompt: text, createdBy: OWNER, createdAt: onboardedAt })
      .returning({ id: aiPrompts.id });
    promptIds.push(pr.id);
  }

  // ---- AI-visibility: 3 monthly scans (M1..M3) ----
  const providers = ["openai", "claude", "gemini"] as const;
  const traj: Record<string, Record<string, [number, number]>> = {
    p0: { openai: [15, 3], claude: [17, 5], gemini: [20, 11] },
    p1: { openai: [12, 2], claude: [14, 4], gemini: [18, 9] },
    p2: { openai: [19, 6], claude: [22, 8], gemini: [26, 16] },
    p3: { openai: [11, 2], claude: [13, 4], gemini: [16, 10] },
  };
  const sentiments = ["positive", "positive", "neutral", "positive"] as const;
  const scanMonths = [
    new Date("2026-07-15T12:00:00Z"),
    new Date("2026-08-15T12:00:00Z"),
    new Date("2026-09-08T12:00:00Z"),
  ];
  for (let s = 0; s < scanMonths.length; s++) {
    const scanId = `ga-m${s + 1}-${hex(6)}`;
    for (let pi = 0; pi < promptTexts.length; pi++) {
      const key = `p${pi}` as keyof typeof traj;
      for (const provider of providers) {
        const [m1, m3] = traj[key][provider];
        const rankPos = Math.max(1, round(m1 + ((m3 - m1) * s) / 2));
        const mentioned = rankPos <= 14 ? 1 : 0;
        await db.insert(aiVisibilityResults).values({
          scanId,
          brandId,
          promptId: promptIds[pi],
          provider,
          mentioned,
          position: mentioned ? rankPos : null,
          sentiment: mentioned ? sentiments[pi] : null,
          competitorsMentioned: JSON.stringify(competitors.slice(0, 2 + rand(3))),
          answerExcerpt: mentioned
            ? `Giancarlo Anduray is recommended (position ${rankPos}) for "${promptTexts[pi].replace(/\?$/, "")}", cited for deep Miami market knowledge and strong client outcomes.`
            : null,
          summary: mentioned
            ? `Recommended at position ${rankPos}; cited alongside ${competitors.slice(0, 3).join(", ")}.`
            : null,
          createdAt: scanMonths[s],
        });
      }
    }
  }

  // ---- Tracked keywords + weekly snapshots (~13 weeks) ----
  const keywords: { kw: string; start: number; end: number; slug: string }[] = [
    { kw: "miami real estate agent", start: 44, end: 7, slug: "" },
    { kw: "luxury condos miami for sale", start: 38, end: 5, slug: "blog/how-to-buy-a-waterfront-condo-in-miami-a-2026-guide" },
    { kw: "miami waterfront homes", start: 41, end: 8, slug: "blog/how-to-buy-a-waterfront-condo-in-miami-a-2026-guide" },
    { kw: "sell my house miami", start: 35, end: 4, slug: "blog/selling-your-miami-home-how-to-price-it-right" },
    { kw: "miami beach realtor", start: 48, end: 9, slug: "blog/first-time-homebuyer-s-guide-to-miami-beach" },
    { kw: "best real estate agent miami", start: 52, end: 11, slug: "" },
  ];
  const WEEKS = 13;
  for (const k of keywords) {
    const [tk] = await db
      .insert(trackedKeywords)
      .values({
        clientId,
        createdBy: OWNER,
        keyword: k.kw,
        locationName: "Miami, Florida, United States",
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
      const noise = Math.round((Math.random() - 0.5) * 4);
      let pos: number | null = Math.max(1, Math.round(ideal + noise));
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

  // ---- Backlinks: 4 monthly snapshots (Jun..Sep) ----
  const blMonths = [
    new Date("2026-06-20T12:00:00Z"),
    new Date("2026-07-20T12:00:00Z"),
    new Date("2026-08-20T12:00:00Z"),
    new Date("2026-09-08T12:00:00Z"),
  ];
  const topRef = [
    { domain: "zillow.com", backlinks: 34, rank: 941 },
    { domain: "realtor.com", backlinks: 22, rank: 928 },
    { domain: "redfin.com", backlinks: 15, rank: 903 },
    { domain: "miamiherald.com", backlinks: 9, rank: 872 },
    { domain: "miami.eater.com", backlinks: 6, rank: 811 },
  ];
  const topAnchors = [
    { anchor: "Giancarlo Anduray", count: 210 },
    { anchor: "Anduray Real Estate", count: 96 },
    { anchor: "andurayrealestate.com", count: 74 },
    { anchor: "Miami real estate agent", count: 41 },
    { anchor: "luxury condos miami", count: 28 },
  ];
  for (let i = 0; i < blMonths.length; i++) {
    const f = i / (blMonths.length - 1);
    const backlinks = round(78 + (430 - 78) * f);
    const refDomains = round(22 + (98 - 22) * f);
    const refMain = round(refDomains * 0.88);
    const dfRank = round(120 + (252 - 120) * f);
    const broken = 1 + rand(4);
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
        referring_pages: round(backlinks * 1.5),
        dofollow: round(backlinks * 0.68),
        nofollow: round(backlinks * 0.32),
      }),
      topReferringDomains: JSON.stringify(topRef.map((d) => ({ ...d, backlinks: round(d.backlinks * (0.5 + f)) }))),
      topAnchors: JSON.stringify(topAnchors.map((a) => ({ ...a, count: round(a.count * (0.5 + f)) }))),
      createdAt: blMonths[i],
    });
  }

  // ---- Site audit ----
  const [audit] = await db
    .insert(siteAudits)
    .values({
      clientId,
      createdBy: OWNER,
      taskId: hex(24),
      target: DOMAIN,
      status: "complete",
      pagesCrawled: 34,
      onpageScore: "85.50",
      criticalCount: 2,
      warningCount: 15,
      checks: JSON.stringify({
        broken_links: 3,
        duplicate_title_tags: 1,
        duplicate_meta_descriptions: 4,
        pages_without_h1: 2,
        low_content_rate: 5,
        no_image_alt: 22,
        slow_pages: 4,
        https: true,
      }),
      createdAt: addDays(now, -5),
      updatedAt: addDays(now, -5),
    })
    .returning({ id: siteAudits.id });
  const auditPages = [
    { url: `${WEBSITE}/`, code: 200, score: "92.00", issues: ["no_image_alt"] },
    { url: `${WEBSITE}/listings`, code: 200, score: "88.00", issues: ["low_content_rate", "no_image_alt"] },
    { url: `${WEBSITE}/blog/selling-your-miami-home-how-to-price-it-right`, code: 200, score: "95.00", issues: [] },
    { url: `${WEBSITE}/about`, code: 200, score: "90.00", issues: ["duplicate_meta_descriptions"] },
    { url: `${WEBSITE}/neighborhoods/brickell`, code: 200, score: "87.00", issues: ["slow_pages"] },
    { url: `${WEBSITE}/listings/old-2025-feature`, code: 404, score: "0.00", issues: ["broken_page", "4xx_status_code"] },
  ];
  for (const pg of auditPages) {
    await db.insert(siteAuditPages).values({
      auditId: audit.id,
      url: pg.url,
      statusCode: pg.code,
      onpageScore: pg.score,
      issues: JSON.stringify(pg.issues),
      createdAt: addDays(now, -5),
    });
  }

  // ---- Service plan (tailored slightly for a local realtor) ----
  const servicePlan = [
    { key: "seo_strategy", label: "SEO Strategy & Keyword Research", type: "check", included: true },
    { key: "tech_seo", label: "Technical SEO Monitoring", type: "level", level: "Full" },
    { key: "onpage", label: "On-Page SEO", type: "check", included: true },
    { key: "internal_linking", label: "Internal Linking", type: "check", included: true },
    { key: "local_seo", label: "Local SEO / GBP", type: "level", level: "Full" },
    { key: "competitor_tracking", label: "Competitor Tracking", type: "level", level: "Full" },
    { key: "ai_search_opt", label: "AI Search Optimization", type: "level", level: "Full" },
    { key: "ai_visibility", label: "ChatGPT / Gemini / Perplexity Visibility", type: "check", included: true },
    { key: "schema", label: "Schema & Entity Optimization", type: "check", included: true },
    { key: "blogs", label: "SEO Blogs", type: "quota", target: 4, unit: "month", source: "content:blog" },
    { key: "local_list", label: "Local List Ranking", type: "check", included: true },
    { key: "newsletters", label: "Newsletters", type: "quota", target: 2, unit: "month", source: "content:newsletter" },
    { key: "website_dev", label: "Website Development / Overhaul", type: "check", included: false },
    { key: "page_opts", label: "Existing Page Optimizations", type: "quota", target: 5, unit: "month", source: "manual", delivered: 4 },
    { key: "content_strategy", label: "Content Strategy", type: "check", included: true },
    { key: "monthly_reporting", label: "Monthly Reporting", type: "check", included: true },
    { key: "strategy_call", label: "Strategy Call", type: "level", level: "Monthly" },
    { key: "backlink_strategy", label: "Backlink / Outreach Strategy", type: "level", level: "Basic" },
  ];
  await db.update(clients).set({ servicePlan: JSON.stringify(servicePlan) }).where(eq(clients.id, clientId));

  console.log(
    JSON.stringify(
      {
        ok: true,
        clientId,
        brandId,
        auditId: audit.id,
        content: rows.length,
        blogs: blogCount,
        newsletters: nlCount,
        keywords: keywords.length,
        weeks: WEEKS,
        aiScans: scanMonths.length,
        backlinkSnapshots: blMonths.length,
        imagesGenerated: images.filter((u) => !u.includes("picsum")).length,
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
