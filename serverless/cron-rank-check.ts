/**
 * Source for the Vercel Cron function (weekly rank check). Bundled by the build step into
 * `api/cron/rank-check.js`. Scheduled in vercel.json ("0 6 * * 1"). Vercel Cron sends
 * `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set; we require it so the
 * endpoint can't be triggered by anyone.
 */
import { runWeeklyRankCheck } from "../server/_core/scheduler";

export default async function handler(req: any, res: any) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers?.authorization;
    if (auth !== `Bearer ${secret}`) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
  }
  try {
    const result = await runWeeklyRankCheck();
    res.status(200).json({ ok: true, ...result });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message ?? "unknown" });
  }
}
