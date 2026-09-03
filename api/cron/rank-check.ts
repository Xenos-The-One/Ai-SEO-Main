/**
 * Vercel Cron endpoint — replaces the in-process node-cron weekly rank check (which can't
 * run on serverless). Scheduled in vercel.json ("0 6 * * 1"). Vercel Cron sends
 * `Authorization: Bearer <CRON_SECRET>` when a CRON_SECRET env var is set; we require it so
 * the endpoint can't be triggered by anyone.
 */
import { runWeeklyRankCheck } from "../../server/_core/scheduler";

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
