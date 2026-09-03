import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc } from "drizzle-orm";
import { getDb } from "../db";
import { assertClient } from "../authz";
import { limitData } from "../_core/rateLimiters";
import { clients, backlinkSnapshots } from "../../drizzle/schema";

async function db() {
  const d = await getDb();
  if (!d) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  return d;
}

async function clientDomain(d: Awaited<ReturnType<typeof db>>, clientId: number): Promise<string> {
  const [client] = await d.select().from(clients).where(eq(clients.id, clientId));
  if (!client?.websiteUrl) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This client has no website URL. Add one on the client's page first.",
    });
  }
  return client.websiteUrl;
}

export const backlinksRouter = router({
  // Fetch the live backlink profile (summary + referring domains + anchors) and snapshot it.
  profile: protectedProcedure
    .use(limitData)
    .input(z.object({ clientId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await assertClient(ctx.user.id, input.clientId);
      const d = await db();
      const domain = await clientDomain(d, input.clientId);

      const { backlinkSummary, referringDomains, backlinkAnchors, normalizeDomain } = await import(
        "../lib/dataforseo"
      );
      const target = normalizeDomain(domain);
      const [summary, refDomains, anchors] = await Promise.all([
        backlinkSummary(target),
        referringDomains(target, 100),
        backlinkAnchors(target, 100),
      ]);

      const [snapshot] = await d
        .insert(backlinkSnapshots)
        .values({
          clientId: input.clientId,
          createdBy: ctx.user.id,
          target,
          backlinks: summary.backlinks,
          referringDomains: summary.referringDomains,
          referringMainDomains: summary.referringMainDomains,
          rank: summary.rank,
          brokenBacklinks: summary.brokenBacklinks,
          summary: JSON.stringify(summary),
          topReferringDomains: JSON.stringify(refDomains),
          topAnchors: JSON.stringify(anchors),
        })
        .returning();

      return { snapshot, summary, referringDomains: refDomains, anchors };
    }),

  // The most recent snapshot for a client (with parsed detail lists), or null.
  latest: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertClient(ctx.user.id, input.clientId);
      const d = await db();
      const [snap] = await d
        .select()
        .from(backlinkSnapshots)
        .where(and(eq(backlinkSnapshots.clientId, input.clientId), eq(backlinkSnapshots.createdBy, ctx.user.id)))
        .orderBy(desc(backlinkSnapshots.createdAt))
        .limit(1);
      if (!snap) return null;
      return {
        snapshot: snap,
        referringDomains: safeParse(snap.topReferringDomains),
        anchors: safeParse(snap.topAnchors),
      };
    }),

  // Competitor link gap: referring domains linking to the given competitors but not the client.
  linkGap: protectedProcedure
    .use(limitData)
    .input(z.object({ clientId: z.number(), competitors: z.array(z.string().min(1)).min(1).max(5) }))
    .mutation(async ({ ctx, input }) => {
      await assertClient(ctx.user.id, input.clientId);
      const d = await db();
      const domain = await clientDomain(d, input.clientId);
      const { linkGap, normalizeDomain } = await import("../lib/dataforseo");
      const rows = await linkGap(normalizeDomain(domain), input.competitors, 100);
      return rows;
    }),

  // Toxic-link analysis: backlinks whose spam score meets the threshold, plus a disavow file.
  toxicLinks: protectedProcedure
    .use(limitData)
    .input(z.object({ clientId: z.number(), threshold: z.number().min(0).max(100).optional() }))
    .mutation(async ({ ctx, input }) => {
      await assertClient(ctx.user.id, input.clientId);
      const d = await db();
      const domain = await clientDomain(d, input.clientId);
      const { toxicBacklinks, normalizeDomain } = await import("../lib/dataforseo");
      return toxicBacklinks(normalizeDomain(domain), 200, input.threshold ?? 50);
    }),

  // Aggregate trend (backlinks / referring domains over time) for the overview chart.
  history: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertClient(ctx.user.id, input.clientId);
      const d = await db();
      const rows = await d
        .select({
          backlinks: backlinkSnapshots.backlinks,
          referringDomains: backlinkSnapshots.referringDomains,
          rank: backlinkSnapshots.rank,
          createdAt: backlinkSnapshots.createdAt,
        })
        .from(backlinkSnapshots)
        .where(and(eq(backlinkSnapshots.clientId, input.clientId), eq(backlinkSnapshots.createdBy, ctx.user.id)))
        .orderBy(backlinkSnapshots.createdAt)
        .limit(60);
      return rows;
    }),
});

function safeParse(json: string | null): any[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
