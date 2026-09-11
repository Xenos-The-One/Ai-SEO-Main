/**
 * TEMP re-seed of Peakflow (client #5) CONTENT to match the service plan cadence:
 * 4 blogs + 2 newsletters per month across Feb–Sep 2026, every piece with a hero image,
 * plus the client's service-plan JSON. Safe to delete. Re-runnable (wipes prior content).
 *
 * Run (Git Bash):  NODE_ENV=development npx tsx server/_seedPeakflowContent.ts
 */
import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { getDb } from "./db";
import { generateImage } from "./_core/imageGeneration";
import {
  clients,
  content as contentTable,
  contentAnalytics,
} from "../drizzle/schema";

const CLIENT_ID = 5;
const OWNER = 20;
const WEBSITE = "https://www.getpeakflow.com";

const DAY = 24 * 60 * 60 * 1000;
function rand(n: number) {
  return Math.floor(Math.random() * n);
}
const round = Math.round;

// ---- Hero image prompts (one per topic cluster). Generated via the product's own
// Gemini→Supabase pipeline; falls back to a stable placeholder if generation is unavailable.
const IMAGE_PROMPTS = [
  "Editorial hero image, distributed remote team collaborating over a video call on laptops, bright modern home office, soft natural light, professional, no text",
  "Clean modern project management software dashboard with a kanban board on a large monitor, minimal UI, blue accents, no text",
  "Agile sprint planning session, colorful sticky notes on a glass wall, small team pointing, bright startup office, no text",
  "Abstract gantt chart timeline visualization, flowing horizontal bars, indigo and teal gradient, professional, no text",
  "Calm organized desk with a laptop, notebook and coffee, a tidy checklist, warm minimal productivity scene, no text",
  "Marketing agency team brainstorming in a creative studio, mood board and screens, energetic, no text",
  "Business analytics report with clean charts and graphs on a screen, data visualization, professional lighting, no text",
  "Newsletter and email concept, a stylized envelope with a paper plane, modern flat 3D, indigo palette, no text",
];

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
  ]);
}

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
    r.status === "fulfilled"
      ? r.value
      : `https://picsum.photos/seed/peakflow-hero-${i}/1200/630`
  );
}

// ---- Blog pool: 32 entries (4/month × 8 months). `img` indexes the image pool cluster.
type Blog = { t: string; topic: string; img: number; intro: string };
const BLOGS: Blog[] = [
  { t: "How Remote Teams Stay Aligned: 7 Habits That Actually Work", topic: "remote team alignment habits", img: 0, intro: "Distributed teams don't drift because people stop caring — they drift because context lives in too many places. The teams that stay aligned build a few repeatable habits and let the tooling carry the memory." },
  { t: "The Async-First Playbook for Distributed Teams", topic: "async-first communication", img: 0, intro: "Meetings are expensive coordination. An async-first team writes things down first and meets only when a decision genuinely needs a live conversation." },
  { t: "Running Effective Standups Across Time Zones", topic: "async standups time zones", img: 0, intro: "The daily standup breaks the moment your team spans more than a couple of time zones. A written thread keeps the ritual's value without the 7am calls." },
  { t: "Building Team Trust When Nobody Shares an Office", topic: "remote team trust", img: 0, intro: "Trust on a remote team isn't built at the water cooler — it's built through visible, reliable follow-through. Here's how to make reliability the default." },
  { t: "Asana vs Monday vs Peakflow: An Honest 2026 Comparison", topic: "project management software comparison", img: 1, intro: "There is no single best project management tool — only the best fit for how your team actually works. Here's an honest look at three popular options in 2026." },
  { t: "When to Graduate From Spreadsheets to a Real PM Tool", topic: "spreadsheets to project management tool", img: 1, intro: "Spreadsheets are where good projects quietly derail. If three of these five signs sound familiar, your process — not your team — is the bottleneck." },
  { t: "Choosing Project Management Software You Won't Outgrow", topic: "choosing project management software", img: 1, intro: "Switching tools mid-flight is painful, so the real question isn't which tool is best today — it's which one still fits when your team doubles." },
  { t: "Trello Alternatives for Teams That Have Scaled Past Boards", topic: "trello alternatives scaling", img: 1, intro: "A simple board is perfect until it isn't. When dependencies, reporting and capacity start to matter, it's time for something with more structure." },
  { t: "The Complete Guide to Sprint Planning for Small Teams", topic: "sprint planning small teams", img: 2, intro: "Small teams don't need the full Scrum apparatus — they need a predictable cadence and a way to say no. This is a lightweight two-week planning loop." },
  { t: "Story Points Without the Arguments: A Practical Guide", topic: "story points estimation", img: 2, intro: "Estimation debates burn more time than the work they estimate. A few simple rules keep pointing fast, honest, and argument-free." },
  { t: "How to Run a Retrospective Your Team Won't Dread", topic: "effective retrospectives", img: 2, intro: "Most retros collapse into silence or a blame session. A good one is structured, time-boxed, and produces exactly one thing: change." },
  { t: "Backlog Grooming: Keeping Your Roadmap Honest", topic: "backlog grooming roadmap", img: 2, intro: "A backlog is a promise you keep making to your future self. Left ungroomed, it becomes a graveyard nobody trusts." },
  { t: "10 Gantt Chart Best Practices for On-Time Delivery", topic: "gantt chart best practices", img: 3, intro: "A Gantt chart is only useful if it changes behavior. These ten practices keep yours honest, current, and worth looking at." },
  { t: "Managing Project Dependencies Before They Bite", topic: "project dependencies management", img: 3, intro: "The task that sinks a launch is rarely the one you're watching — it's the quiet dependency two steps upstream. Here's how to surface them early." },
  { t: "Buffer Time: The Estimating Trick Nobody Teaches", topic: "buffer time estimation", img: 3, intro: "Optimistic estimates aren't lies — they're averages pretending to be commitments. Buffers turn a hopeful plan into a dependable one." },
  { t: "Milestones vs Deadlines: Why the Difference Matters", topic: "milestones vs deadlines", img: 3, intro: "Treating every date as a deadline exhausts a team. Milestones mark progress; deadlines mark commitments — and confusing them costs trust." },
  { t: "The Weekly Review That Keeps Projects on Track", topic: "weekly review project management", img: 4, intro: "Thirty minutes on the same day each week does more for delivery than any tool. The weekly review is where drift gets caught before it compounds." },
  { t: "Cutting Meeting Load Without Losing Alignment", topic: "reducing meetings alignment", img: 4, intro: "You can delete half your meetings and get more aligned, not less — if you replace them with the right written rituals." },
  { t: "Deep Work for Delivery Teams: A Field Guide", topic: "deep work delivery teams", img: 4, intro: "Shipping hard things requires uninterrupted focus, which no team gets by accident. Protecting deep work is a scheduling decision, not a personality trait." },
  { t: "Prioritization Frameworks That Actually Survive Reality", topic: "prioritization frameworks", img: 4, intro: "Every framework looks tidy in a blog post and messy on Monday. These are the ones that hold up when everything is suddenly urgent." },
  { t: "Project Management Built for Marketing Agencies", topic: "project management for marketing agencies", img: 5, intro: "Agencies juggle a dozen clients, each with its own approvals, assets, and deadlines. Keeping them all straight is the whole job." },
  { t: "How Agencies Keep 12 Clients Straight Without Chaos", topic: "agency client management", img: 5, intro: "The difference between a calm agency and a chaotic one isn't talent — it's a system where nothing lives only in someone's head." },
  { t: "Client Approvals That Don't Stall Your Pipeline", topic: "client approval workflow", img: 5, intro: "Approvals are where agency work goes to wait. A tight review loop keeps deliverables moving without endless follow-up emails." },
  { t: "Resourcing Across Clients: Capacity Planning for Agencies", topic: "agency capacity planning", img: 5, intro: "Over-commit the team and quality slips; under-commit and margin evaporates. Capacity planning is how agencies stay on the right side of that line." },
  { t: "The Metrics That Actually Predict On-Time Delivery", topic: "delivery metrics", img: 6, intro: "Most project dashboards measure activity, not outcomes. A few leading indicators tell you weeks early whether a deadline is real." },
  { t: "Building a Weekly Status Report Leaders Will Read", topic: "weekly status report", img: 6, intro: "A status report nobody reads is worse than none — it creates false confidence. Here's a format that earns thirty seconds of a busy leader's attention." },
  { t: "Cycle Time vs Lead Time: What to Measure and Why", topic: "cycle time lead time", img: 6, intro: "Speed has two very different meanings, and conflating them hides your real bottleneck. Measuring both tells you where to actually improve." },
  { t: "Turning Project Data Into Decisions", topic: "project data decisions", img: 6, intro: "Collecting metrics is easy; changing behavior because of them is the hard part. Data earns its keep only when it settles an argument." },
  { t: "Setting Quarterly Goals Your Team Can Actually Hit", topic: "quarterly goal setting", img: 7, intro: "Ambitious goals inspire; unrealistic ones corrode. The trick is setting targets that stretch the team without quietly guaranteeing failure." },
  { t: "The Kickoff Meeting Checklist for New Projects", topic: "project kickoff checklist", img: 7, intro: "A weak kickoff haunts a project for months. Thirty minutes of the right questions up front prevents a dozen confused threads later." },
  { t: "Scope Creep: Spotting It Early and Saying No Well", topic: "scope creep management", img: 7, intro: "Scope creep rarely arrives as a big ask — it's a hundred small yeses. Catching it early, and declining gracefully, protects the whole timeline." },
  { t: "Stakeholder Updates That Build Trust", topic: "stakeholder communication", img: 7, intro: "Stakeholders don't need more detail — they need to trust that you're on top of it. The right update cadence buys you room to do the work." },
];

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function wordCountOf(md: string): number {
  return md.replace(/[#>*_`\-]/g, " ").split(/\s+/).filter(Boolean).length;
}

// Rotating "extra" section so 32 articles don't read identically.
function extraSection(topic: string, idx: number): string {
  const variants = [
    `## A quick example

Picture a five-person team that kept missing its Friday commitments. Nothing was wrong with the people — the work simply wasn't visible until it was late. They put every task on one board, gave each a named owner and an honest due date, and added a fifteen-minute Monday review. Within a month the "surprise" slips were gone, not because anyone worked harder, but because ${topic} finally had a system behind it. The lesson repeats across nearly every team we work with: visibility plus a steady cadence beats heroics every time.`,
    `## Frequently asked questions

**Isn't this just more process?** Not really. The goal is *less* overhead, not more — one board and one short weekly review replace a dozen scattered status pings.

**Does team size change the approach?** The principles hold from three people to thirty; larger teams just need clearer ownership and tighter interfaces between groups.

**What if leadership wants more detail?** Give them the weekly review view instead of a custom report. Same source of truth, zero extra work, and far more trust in the numbers.`,
    `## A checklist to keep handy

Before you consider ${topic} "handled," make sure you can answer yes to each of these:

- Is every in-flight task visible in one place?
- Does each one have a single named owner and a realistic date?
- Have you added buffer for the unknowns you can't yet see?
- Is there a fixed weekly moment to catch drift?
- When something slips, do you adjust the plan openly instead of hoping?

If any answer is "no," that's your highest-leverage fix this week.`,
  ];
  return variants[idx % variants.length];
}

function blogBody(b: Blog, idx: number): string {
  const topic = b.topic;
  const T = cap(topic);
  return `${b.intro}

Below, we'll break down why ${topic} trips up so many teams, the framework we use with our own clients, and the specific steps you can put in place this week.

## Why ${topic} matters more than teams admit

Most teams don't lose a week all at once — they lose it fifteen minutes at a time. A status that never got updated, a dependency nobody flagged, a hand-off that sat in an inbox over the weekend. ${T} is where those small losses either get caught or quietly compound. Handled well, it turns a stressful scramble into a calm, predictable rhythm; ignored, it's the reason "we're basically done" turns into another two weeks.

The teams that consistently ship on time treat this as a system rather than a personality trait. They don't rely on one heroic organizer to hold everything in their head. Instead, they make the work visible, agree on what "done" actually means, and review often enough to catch drift while it's still cheap to fix.

## The mistakes that quietly cost you

A few patterns show up again and again when ${topic} isn't working:

- **Invisible work.** If a task only lives in someone's head or a private note, it can't be planned around — and it will surprise you at the worst possible moment.
- **Fuzzy ownership.** "The team" owning something means nobody does. Every meaningful piece of work needs a single, named owner.
- **Optimistic estimates treated as commitments.** Estimates are averages, not promises. Without buffers, one slip cascades into three.
- **Reviewing too late.** A monthly check-in can't catch a problem that started in week one. Cadence beats intensity.
- **Tooling that fights you.** If keeping things current is tedious, people stop doing it, and your single source of truth quietly rots.

None of these are dramatic on their own. Together, they're the difference between a team that ships and one that's perpetually "almost there."

## A framework you can actually run

You don't need a heavyweight process to fix ${topic}. You need a short loop you can repeat:

1. **Make it visible.** One board, one place, every in-flight item on it. If it isn't on the board, it isn't happening.
2. **Assign a clear owner and a real date.** Not a hope — a date the owner agrees is achievable given everything else on their plate.
3. **Size honestly and add a buffer.** Pad for the unknowns you can't yet see. You'll be right more often than you expect.
4. **Review on a fixed cadence.** A short weekly review catches drift while it's a nudge, not a rescue.
5. **Close the loop.** When something slips, adjust the plan openly instead of hoping it catches up on its own.

Run that loop consistently and ${topic} stops being a recurring fire drill.

## What good looks like in practice

On a healthy team, anyone can answer "what's the status?" in about thirty seconds without pinging three people. Deadlines are visible on the card, the dashboard, and the weekly digest — not buried in a thread. When a risk appears, it's raised early and calmly, because the culture rewards flagging problems over hiding them.

That predictability isn't just nice internally; it's what earns trust from clients and leadership. A team that reliably does what it said it would do gets more autonomy, more interesting work, and far fewer anxious check-ins.

${extraSection(topic, idx)}

## Measuring whether it's working

You'll know ${topic} is improving when a few numbers move in the right direction: fewer missed deadlines, shorter cycle time from "started" to "done," and less time spent in status meetings. Track them for a couple of months and let the trend — not any single noisy week — tell the story.

## How Peakflow helps

This is exactly what Peakflow is built for. A single shared board keeps every task visible, each with a clear owner and due date. Async approvals move sign-offs forward without booking a meeting, and a weekly review view gives everyone — including your stakeholders — the same honest picture of where things stand.

> Teams that adopt a simple, visible weekly rhythm ship noticeably more predictably within their first quarter — and spend far less energy chasing updates.

## Getting started this week

Don't try to fix everything at once. Pick one habit from this guide — usually "make it visible" or "review weekly" — and run it for two full weeks. Keep it only if it earns its place, then layer in the next one. Small, durable changes compound faster than a big process overhaul nobody sticks to.

Start there, measure the difference, and iterate from what you learn.`;
}

// ---- Newsletters: 2/month. A monthly digest + a themed product feature note.
const FEATURES = [
  "Async Approvals",
  "Faster Boards",
  "Agency Reporting View",
  "Custom Dashboards",
  "Automations 2.0",
  "Time Tracking, Reimagined",
  "Calendar Sync",
  "AI Standups",
];

function digestBody(monthLabel: string): string {
  return `Hi there,

Welcome to the ${monthLabel} edition of Peakflow Monthly — a quick roundup of what shipped, what we're reading, and one habit worth stealing for your team this month. As always, it's a two-minute read.

## What shipped this month

We focused on the things you told us slow you down. Boards now load noticeably faster, even the big ones, so switching between projects feels instant. Approvals got tighter: reviewers can sign off or leave a comment right on the card, no meeting required. And we cleared out a batch of smaller papercuts you reported — the full changelog lives in the app under **What's New**.

## One habit to steal

If you try one thing this month, make it a **30-minute weekly review** on the same day every week. Pull up every in-flight project, confirm each has an owner and a realistic date, and flag anything drifting. It sounds almost too simple, but it's the single highest-leverage habit we see across the teams that consistently hit their deadlines. Drift gets caught while it's still a gentle nudge instead of a weekend rescue.

## From the community

A marketing team using Peakflow shared how they cut their status-update meetings in half by moving to a single shared board and a written Monday recap. Their takeaway: the goal isn't more process, it's making the work visible so the meetings become optional.

## What's next

We're heads-down on richer reporting and a few automations we think you'll like. Want to shape what we build? Just reply to this email — a real person reads every response, and your notes go straight into our roadmap discussions.

Thanks for building with us,
The Peakflow Team`;
}

function featureBody(feature: string): string {
  return `Hi there,

We just shipped something we're genuinely excited about: **${feature}**. Here's what it does, why it matters, and how to get value from it in about five minutes.

## What's new

${feature} is now live in every Peakflow workspace. It takes a step your team was almost certainly doing by hand and makes it automatic — fewer clicks, fewer dropped hand-offs, and less of the low-value busywork that quietly eats a workday.

## Why it matters

Small friction adds up. Every manual step is a chance for something to slip through the cracks, and those cracks are where deadlines go to quietly die. By removing that friction, ${feature} gives your team back time and attention for the work that actually moves projects forward — and it makes your process more reliable without anyone having to remember an extra thing.

## How to get started

1. Open **Settings → Features** in your workspace.
2. Turn on **${feature}** (it's off by default so nothing changes without you deciding).
3. Try it on your next project and see how it fits your flow.

There's nothing to install and nothing to migrate — it works with the boards and projects you already have.

## We'd love your feedback

Features get better when real teams put them through their paces. Once you've tried ${feature}, hit reply and tell us what's working and what you'd change. We read every message, and your feedback directly shapes what we ship next.

Thanks for building with us,
The Peakflow Team`;
}

async function main() {
  const db = await getDb();
  if (!db) throw new Error("No DATABASE_URL — cannot seed.");

  // Reuse hero images already generated for this client (avoids re-hitting Gemini on re-runs).
  const existing = await db
    .select({ img: contentTable.imageUrl })
    .from(contentTable)
    .where(eq(contentTable.clientId, CLIENT_ID));
  const distinctImgs = Array.from(
    new Set(existing.map((e) => e.img).filter((u): u is string => !!u))
  );
  let images: string[];
  if (distinctImgs.length >= 8) {
    console.log(`Reusing ${distinctImgs.length} existing hero images`);
    images = distinctImgs.slice(0, 8);
  } else {
    console.log("Generating hero images (with graceful fallback)…");
    images = await buildImagePool();
  }
  const nlImage = images[7] ?? images[0];

  // Wipe prior Peakflow content (cascades contentAnalytics).
  await db.delete(contentTable).where(eq(contentTable.clientId, CLIENT_ID));

  // Months Feb..Sep 2026 (8). September is the current, partial month.
  // new Date(2026, idx, day): idx is the 0-based month index (1 = February … 8 = September).
  const monthDefs = [
    { idx: 1, label: "February 2026" },
    { idx: 2, label: "March 2026" },
    { idx: 3, label: "April 2026" },
    { idx: 4, label: "May 2026" },
    { idx: 5, label: "June 2026" },
    { idx: 6, label: "July 2026" },
    { idx: 7, label: "August 2026" },
    { idx: 8, label: "September 2026" }, // current month (today = Sep 10)
  ];

  const now = new Date();
  const isCurrentMonth = (mi: number) => mi === 8;
  const blogDays = (mi: number) => (isCurrentMonth(mi) ? [1, 4, 7, 9] : [4, 11, 18, 25]);
  const nlDays = (mi: number) => (isCurrentMonth(mi) ? [3, 8] : [7, 21]);

  type Row = {
    title: string;
    topic: string;
    body: string;
    type: "blog" | "newsletter";
    img: string;
    date: Date;
    status: "approved" | "in_progress";
    words: number;
  };
  const rows: Row[] = [];

  monthDefs.forEach((md, mIdx) => {
    const days = blogDays(md.idx);
    // 4 blogs this month
    for (let i = 0; i < 4; i++) {
      const gi = mIdx * 4 + i;
      const b = BLOGS[gi];
      const date = new Date(2026, md.idx, days[i], 10 + i, 0, 0);
      // Current month: first two approved, last two still in progress.
      const status = isCurrentMonth(md.idx) ? (i < 2 ? "approved" : "in_progress") : "approved";
      const body = blogBody(b, gi);
      rows.push({
        title: b.t,
        topic: b.topic,
        body,
        type: "blog",
        img: images[b.img] ?? images[0],
        date,
        status,
        words: wordCountOf(body),
      });
    }
    // 2 newsletters this month
    const nd = nlDays(md.idx);
    const digestStatus = "approved" as const;
    const featureStatus = isCurrentMonth(md.idx) ? ("in_progress" as const) : ("approved" as const);
    const digest = digestBody(md.label);
    rows.push({
      title: `Peakflow Monthly — ${md.label}`,
      topic: `monthly digest ${md.label}`,
      body: digest,
      type: "newsletter",
      img: nlImage,
      date: new Date(2026, md.idx, nd[0], 9, 0, 0),
      status: digestStatus,
      words: wordCountOf(digest),
    });
    const feature = FEATURES[mIdx];
    const featBody = featureBody(feature);
    rows.push({
      title: `New in Peakflow: ${feature}`,
      topic: `product feature ${feature}`,
      body: featBody,
      type: "newsletter",
      img: nlImage,
      date: new Date(2026, md.idx, nd[1], 9, 0, 0),
      status: featureStatus,
      words: wordCountOf(featBody),
    });
  });

  // Insert content + analytics.
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
        clientId: CLIENT_ID,
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
        inputTokens: 1200 + rand(700),
        outputTokens: round(r.words * 1.4),
        totalTokens: 1200 + round(r.words * 1.4),
        wordCount: r.words,
        wasApproved: approved ? 1 : 0,
        approvedAt: approved ? new Date(r.date.getTime() + 2 * DAY) : null,
        generationTimeMs: 8000 + rand(9000),
        createdAt: r.date,
        updatedAt: new Date(r.date.getTime() + 2 * DAY),
      })
      .returning({ id: contentTable.id });

    if (!approved) continue; // in-progress pieces have no published analytics yet

    const ageDays = Math.max(1, Math.round((now.getTime() - r.date.getTime()) / DAY));
    const maturity = Math.min(1.5, 0.5 + ageDays / 150);
    const base = r.type === "blog" ? 6500 : 1500;
    const latestViews = round(base * maturity * (0.75 + Math.random() * 0.5));
    const midViews = round(latestViews * (0.45 + Math.random() * 0.2));
    const eng = (r.type === "blog" ? 45 : 38) + rand(25);
    const timeOnPage = r.type === "blog" ? 130 + rand(200) : 60 + rand(70);
    const conv = round(latestViews * (0.006 + Math.random() * 0.02));
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
      recordedAt: new Date(now.getTime() - Math.round(ageDays / 2) * DAY),
    });
    await db.insert(contentAnalytics).values({
      contentId: ins.id,
      views: latestViews,
      clicks: mkClicks(latestViews),
      shares: mkShares(latestViews),
      engagementRate: eng,
      avgTimeOnPage: timeOnPage,
      conversions: conv,
      recordedAt: new Date(now.getTime() - 2 * DAY),
    });
  }

  // ---- Service plan (matches the client's plan sheet) ----
  const servicePlan = [
    { key: "seo_strategy", label: "SEO Strategy & Keyword Research", type: "check", included: true },
    { key: "tech_seo", label: "Technical SEO Monitoring", type: "level", level: "Full" },
    { key: "onpage", label: "On-Page SEO", type: "check", included: true },
    { key: "internal_linking", label: "Internal Linking", type: "check", included: true },
    { key: "local_seo", label: "Local SEO / GBP", type: "check", included: true },
    { key: "competitor_tracking", label: "Competitor Tracking", type: "level", level: "Full" },
    { key: "ai_search_opt", label: "AI Search Optimization", type: "level", level: "Full" },
    { key: "ai_visibility", label: "ChatGPT / Gemini / Perplexity Visibility", type: "check", included: true },
    { key: "schema", label: "Schema & Entity Optimization", type: "check", included: true },
    { key: "blogs", label: "SEO Blogs", type: "quota", target: 4, unit: "month", source: "content:blog" },
    { key: "local_list", label: "Local List Ranking", type: "check", included: false },
    { key: "newsletters", label: "Newsletters", type: "quota", target: 2, unit: "month", source: "content:newsletter" },
    { key: "website_dev", label: "Website Development / Overhaul", type: "check", included: false },
    { key: "page_opts", label: "Existing Page Optimizations", type: "quota", target: 5, unit: "month", source: "manual", delivered: 5 },
    { key: "content_strategy", label: "Content Strategy", type: "check", included: true },
    { key: "monthly_reporting", label: "Monthly Reporting", type: "check", included: true },
    { key: "strategy_call", label: "Strategy Call", type: "level", level: "Monthly" },
    { key: "backlink_strategy", label: "Backlink / Outreach Strategy", type: "level", level: "Basic" },
  ];
  await db.update(clients).set({ servicePlan: JSON.stringify(servicePlan) }).where(eq(clients.id, CLIENT_ID));

  console.log(
    JSON.stringify(
      {
        ok: true,
        blogs: blogCount,
        newsletters: nlCount,
        total: rows.length,
        imagesGenerated: images.filter((u) => !u.includes("picsum")).length,
        imagesFallback: images.filter((u) => u.includes("picsum")).length,
        servicePlanItems: servicePlan.length,
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
