import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc } from "drizzle-orm";
import { getDb } from "../db";
import { assertClient, assertSiteAudit } from "../authz";
import { limitData } from "../_core/rateLimiters";
import { clients, siteAudits, siteAuditPages } from "../../drizzle/schema";

async function db() {
  const d = await getDb();
  if (!d) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  return d;
}

export const siteAuditRouter = router({
  // Kick off a full-site crawl for a client's domain (async — poll checkStatus after).
  run: protectedProcedure
    .use(limitData)
    .input(z.object({ clientId: z.number(), maxPages: z.number().min(1).max(1000).optional() }))
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

      const { startSiteAudit } = await import("../lib/siteAudit");
      const { normalizeDomain } = await import("../lib/dataforseo");
      const target = normalizeDomain(client.websiteUrl);
      const { taskId } = await startSiteAudit(target, { maxPages: input.maxPages });

      const [row] = await d
        .insert(siteAudits)
        .values({ clientId: input.clientId, createdBy: ctx.user.id, taskId, target, status: "crawling" })
        .returning();
      return row;
    }),

  // Poll a crawl. While still crawling, checks DataForSEO; once finished, stores pages + aggregates.
  checkStatus: protectedProcedure
    .use(limitData)
    .input(z.object({ auditId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await assertSiteAudit(ctx.user.id, input.auditId);
      const d = await db();
      const [audit] = await d.select().from(siteAudits).where(eq(siteAudits.id, input.auditId));
      if (!audit) throw new TRPCError({ code: "NOT_FOUND", message: "Audit not found" });
      if (audit.status !== "crawling") return audit;

      const { getSiteAuditSummary, getSiteAuditPages, countCritical, countWarnings } = await import(
        "../lib/siteAudit"
      );

      let summary;
      try {
        summary = await getSiteAuditSummary(audit.taskId);
      } catch (err: any) {
        const [failed] = await d
          .update(siteAudits)
          .set({ status: "failed", checks: JSON.stringify({ error: err?.message ?? "unknown" }) })
          .where(eq(siteAudits.id, input.auditId))
          .returning();
        return failed;
      }

      if (summary.crawlProgress !== "finished") {
        // Still crawling — surface live progress without finalizing.
        const [row] = await d
          .update(siteAudits)
          .set({ pagesCrawled: summary.pagesCrawled })
          .where(eq(siteAudits.id, input.auditId))
          .returning();
        return row;
      }

      // Finished — pull pages and persist.
      const pages = await getSiteAuditPages(audit.taskId, 100);
      if (pages.length > 0) {
        await d.insert(siteAuditPages).values(
          pages.map((p) => ({
            auditId: audit.id,
            url: p.url,
            statusCode: p.statusCode,
            onpageScore: p.onpageScore != null ? String(p.onpageScore) : null,
            issues: JSON.stringify(p.issues),
          }))
        );
      }

      const [row] = await d
        .update(siteAudits)
        .set({
          status: "complete",
          pagesCrawled: summary.pagesCrawled,
          onpageScore: summary.onpageScore != null ? String(summary.onpageScore) : null,
          criticalCount: countCritical(summary.checks),
          warningCount: countWarnings(summary.checks),
          checks: JSON.stringify(summary.checks),
        })
        .where(eq(siteAudits.id, input.auditId))
        .returning();
      return row;
    }),

  // Recent audits for a client (newest first).
  list: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertClient(ctx.user.id, input.clientId);
      const d = await db();
      return d
        .select()
        .from(siteAudits)
        .where(and(eq(siteAudits.clientId, input.clientId), eq(siteAudits.createdBy, ctx.user.id)))
        .orderBy(desc(siteAudits.createdAt))
        .limit(20);
    }),

  // Per-page results for one audit.
  pages: protectedProcedure
    .input(z.object({ auditId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertSiteAudit(ctx.user.id, input.auditId);
      const d = await db();
      return d
        .select()
        .from(siteAuditPages)
        .where(eq(siteAuditPages.auditId, input.auditId))
        .orderBy(siteAuditPages.onpageScore)
        .limit(200);
    }),
});
