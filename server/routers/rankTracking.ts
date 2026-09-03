import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, inArray, desc, asc } from "drizzle-orm";
import { getDb } from "../db";
import { assertClient, assertTrackedKeyword } from "../authz";
import { limitData } from "../_core/rateLimiters";
import { clients, trackedKeywords, rankSnapshots } from "../../drizzle/schema";

async function db() {
  const d = await getDb();
  if (!d) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  return d;
}

export const rankTrackingRouter = router({
  addKeyword: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        keyword: z.string().min(1).max(255),
        locationName: z.string().optional(),
        languageName: z.string().optional(),
        device: z.enum(["desktop", "mobile"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertClient(ctx.user.id, input.clientId);
      const d = await db();
      const [row] = await d
        .insert(trackedKeywords)
        .values({
          clientId: input.clientId,
          createdBy: ctx.user.id,
          keyword: input.keyword.trim(),
          locationName: input.locationName ?? "United States",
          languageName: input.languageName ?? "English",
          device: input.device ?? "desktop",
        })
        .returning();
      return row;
    }),

  removeKeyword: protectedProcedure
    .input(z.object({ keywordId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await assertTrackedKeyword(ctx.user.id, input.keywordId);
      const d = await db();
      await d.delete(trackedKeywords).where(eq(trackedKeywords.id, input.keywordId));
      return { success: true };
    }),

  // Keywords for a client, each with its current + previous position (for the delta).
  listKeywords: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertClient(ctx.user.id, input.clientId);
      const d = await db();
      const keywords = await d
        .select()
        .from(trackedKeywords)
        .where(and(eq(trackedKeywords.clientId, input.clientId), eq(trackedKeywords.createdBy, ctx.user.id)))
        .orderBy(asc(trackedKeywords.createdAt));

      if (keywords.length === 0) return [];

      const ids = keywords.map((k) => k.id);
      const snaps = await d
        .select()
        .from(rankSnapshots)
        .where(inArray(rankSnapshots.keywordId, ids))
        .orderBy(desc(rankSnapshots.checkedAt));

      // Group snapshots by keyword (already newest-first) → [current, previous].
      const byKeyword = new Map<number, typeof snaps>();
      for (const s of snaps) {
        const list = byKeyword.get(s.keywordId) ?? [];
        list.push(s);
        byKeyword.set(s.keywordId, list);
      }

      return keywords.map((k) => {
        const history = byKeyword.get(k.id) ?? [];
        const current = history[0] ?? null;
        const previous = history[1] ?? null;
        return {
          ...k,
          currentPosition: current?.position ?? null,
          previousPosition: previous?.position ?? null,
          lastCheckedAt: current?.checkedAt ?? null,
          rankingUrl: current?.url ?? null,
        };
      });
    }),

  // Check all active keywords for a client right now and store snapshots.
  runCheck: protectedProcedure
    .use(limitData)
    .input(z.object({ clientId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await assertClient(ctx.user.id, input.clientId);
      const d = await db();
      const [client] = await d.select().from(clients).where(eq(clients.id, input.clientId));
      if (!client?.websiteUrl) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This client has no website URL. Add one on the client's page first.",
        });
      }

      const keywords = await d
        .select()
        .from(trackedKeywords)
        .where(and(eq(trackedKeywords.clientId, input.clientId), eq(trackedKeywords.isActive, 1)));
      if (keywords.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Add at least one keyword first." });
      }

      const { checkKeywordRank } = await import("../lib/dataforseo");
      let checked = 0;
      for (const k of keywords) {
        try {
          const rank = await checkKeywordRank(k.keyword, client.websiteUrl, {
            locationName: k.locationName,
            languageName: k.languageName,
            device: k.device,
          });
          await d.insert(rankSnapshots).values({
            keywordId: k.id,
            position: rank.position,
            url: rank.url,
          });
          checked += 1;
        } catch {
          // Skip a keyword that errors; keep going.
        }
      }

      return { checked, total: keywords.length };
    }),

  // Position time series for one keyword (oldest → newest) for the trend chart.
  history: protectedProcedure
    .input(z.object({ keywordId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertTrackedKeyword(ctx.user.id, input.keywordId);
      const d = await db();
      return d
        .select({
          position: rankSnapshots.position,
          url: rankSnapshots.url,
          checkedAt: rankSnapshots.checkedAt,
        })
        .from(rankSnapshots)
        .where(eq(rankSnapshots.keywordId, input.keywordId))
        .orderBy(asc(rankSnapshots.checkedAt));
    }),
});
