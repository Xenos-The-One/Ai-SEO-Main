/**
 * Background scheduler. Currently runs one weekly job: refresh SERP positions for every
 * active tracked keyword and append a snapshot to its time series.
 *
 * NOTE: in-process and single-instance (like the rate limiter). If the app is scaled to
 * multiple instances this would run once per instance — move to a dedicated job runner
 * (or a leader-elected cron) at that point. It only runs while the server process is up.
 */
import cron from "node-cron";
import { eq, and } from "drizzle-orm";
import { getDb } from "../db";
import { ENV } from "./env";
import { clients, trackedKeywords, rankSnapshots } from "../../drizzle/schema";

const WEEKLY_MON_0600 = "0 6 * * 1";
const MAX_KEYWORDS_PER_RUN = 500; // bound DataForSEO spend per weekly run
const CONCURRENCY = 5;

/**
 * Check every active tracked keyword once and store a rank snapshot. System-wide job —
 * not scoped to a user. Each keyword is isolated in try/catch so one failure can't abort
 * the run. Returns how many keywords were checked.
 */
export async function runWeeklyRankCheck(): Promise<{ checked: number }> {
  const dbh = await getDb();
  if (!dbh) return { checked: 0 };
  const d = dbh; // non-null handle captured for the worker closures below

  const { checkKeywordRank } = await import("../lib/dataforseo");

  // Active keywords joined to their client's domain.
  const rows = await d
    .select({
      keywordId: trackedKeywords.id,
      keyword: trackedKeywords.keyword,
      locationName: trackedKeywords.locationName,
      languageName: trackedKeywords.languageName,
      device: trackedKeywords.device,
      websiteUrl: clients.websiteUrl,
    })
    .from(trackedKeywords)
    .innerJoin(clients, eq(trackedKeywords.clientId, clients.id))
    .where(eq(trackedKeywords.isActive, 1))
    .limit(MAX_KEYWORDS_PER_RUN);

  const jobs = rows.filter((r) => r.websiteUrl);
  let checked = 0;

  // Simple bounded-concurrency worker pool.
  let cursor = 0;
  async function worker() {
    while (cursor < jobs.length) {
      const job = jobs[cursor++];
      try {
        const rank = await checkKeywordRank(job.keyword, job.websiteUrl!, {
          locationName: job.locationName,
          languageName: job.languageName,
          device: job.device,
        });
        await d.insert(rankSnapshots).values({
          keywordId: job.keywordId,
          position: rank.position,
          url: rank.url,
        });
        checked += 1;
      } catch {
        // Skip a keyword that errors; keep going.
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, worker));
  return { checked };
}

let started = false;

/** Register cron jobs. Idempotent and a no-op when the scheduler is disabled. */
export function startScheduler(): void {
  if (started || !ENV.enableScheduler) return;
  started = true;
  cron.schedule(WEEKLY_MON_0600, () => {
    runWeeklyRankCheck()
      .then((r) => console.log(`[scheduler] weekly rank check done: ${r.checked} keywords`))
      .catch((err) => console.error("[scheduler] weekly rank check failed:", err));
  });
  console.log("[scheduler] weekly rank check registered (Mon 06:00)");
}
