import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { eq, and, desc, asc } from "drizzle-orm";
import { getDb } from "../db";
import { assertBrand, assertAiPrompt } from "../authz";
import { limitLlmBatch } from "../_core/rateLimiters";
import { aiBrands, aiPrompts, aiVisibilityResults } from "../../drizzle/schema";

async function db() {
  const d = await getDb();
  if (!d) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  return d;
}

export const aiVisibilityRouter = router({
  // Which AI engines are configured (have keys).
  providers: protectedProcedure.query(async () => {
    const { configuredProviders } = await import("../lib/aiProviders");
    return configuredProviders();
  }),

  // --- Brands ---
  createBrand: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      domain: z.string().optional(),
      competitors: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const d = await db();
      const [row] = await d.insert(aiBrands).values({
        name: input.name,
        domain: input.domain || null,
        competitors: JSON.stringify(input.competitors ?? []),
        createdBy: ctx.user.id,
      }).returning();
      return row;
    }),

  listBrands: protectedProcedure.query(async ({ ctx }) => {
    const d = await db();
    return d.select().from(aiBrands).where(eq(aiBrands.createdBy, ctx.user.id)).orderBy(desc(aiBrands.createdAt));
  }),

  deleteBrand: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await assertBrand(ctx.user.id, input.id);
      const d = await db();
      await d.delete(aiBrands).where(eq(aiBrands.id, input.id));
      return { success: true };
    }),

  // --- Prompts ---
  addPrompt: protectedProcedure
    .input(z.object({ brandId: z.number(), prompt: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await assertBrand(ctx.user.id, input.brandId);
      const d = await db();
      const [row] = await d.insert(aiPrompts).values({
        brandId: input.brandId,
        prompt: input.prompt,
        createdBy: ctx.user.id,
      }).returning();
      return row;
    }),

  listPrompts: protectedProcedure
    .input(z.object({ brandId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertBrand(ctx.user.id, input.brandId);
      const d = await db();
      return d.select().from(aiPrompts).where(eq(aiPrompts.brandId, input.brandId)).orderBy(asc(aiPrompts.createdAt));
    }),

  deletePrompt: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await assertAiPrompt(ctx.user.id, input.id);
      const d = await db();
      await d.delete(aiPrompts).where(eq(aiPrompts.id, input.id));
      return { success: true };
    }),

  // --- Scan ---
  runScan: protectedProcedure
    .use(limitLlmBatch)
    .input(z.object({ brandId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await assertBrand(ctx.user.id, input.brandId);
      const d = await db();
      const { configuredProviders } = await import("../lib/aiProviders");
      const { scanPrompt } = await import("../lib/aiVisibility");

      const [brand] = await d.select().from(aiBrands).where(eq(aiBrands.id, input.brandId));
      if (!brand) throw new TRPCError({ code: "NOT_FOUND", message: "Brand not found" });

      const prompts = await d.select().from(aiPrompts).where(eq(aiPrompts.brandId, input.brandId));
      if (prompts.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Add at least one prompt first" });

      const providers = configuredProviders();
      if (providers.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No AI providers configured. Set ANTHROPIC_API_KEY / GEMINI_API_KEY / OPENAI_API_KEY / PERPLEXITY_API_KEY." });
      }

      const competitors: string[] = brand.competitors ? JSON.parse(brand.competitors) : [];
      const scanId = nanoid();
      let mentioned = 0;
      let total = 0;

      for (const p of prompts.slice(0, 20)) {
        const results = await scanPrompt(brand.name, competitors, p.prompt, providers);
        for (const r of results) {
          total += 1;
          if (r.mentioned) mentioned += 1;
          await d.insert(aiVisibilityResults).values({
            scanId,
            brandId: brand.id,
            promptId: p.id,
            provider: r.provider,
            mentioned: r.mentioned ? 1 : 0,
            position: r.position,
            sentiment: r.sentiment,
            competitorsMentioned: JSON.stringify(r.competitorsMentioned),
            answerExcerpt: r.answerExcerpt,
            summary: r.summary,
          });
        }
      }

      return {
        scanId,
        providers,
        promptsScanned: prompts.length,
        results: total,
        score: total > 0 ? Math.round((mentioned / total) * 100) : 0,
      };
    }),

  // Most recent scan's per-prompt/provider results.
  latestResults: protectedProcedure
    .input(z.object({ brandId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertBrand(ctx.user.id, input.brandId);
      const d = await db();
      const [latest] = await d
        .select({ scanId: aiVisibilityResults.scanId })
        .from(aiVisibilityResults)
        .where(eq(aiVisibilityResults.brandId, input.brandId))
        .orderBy(desc(aiVisibilityResults.createdAt))
        .limit(1);
      if (!latest) return { scanId: null as string | null, results: [] as any[] };

      const rows = await d
        .select({
          id: aiVisibilityResults.id,
          provider: aiVisibilityResults.provider,
          prompt: aiPrompts.prompt,
          mentioned: aiVisibilityResults.mentioned,
          position: aiVisibilityResults.position,
          sentiment: aiVisibilityResults.sentiment,
          competitorsMentioned: aiVisibilityResults.competitorsMentioned,
          summary: aiVisibilityResults.summary,
        })
        .from(aiVisibilityResults)
        .leftJoin(aiPrompts, eq(aiVisibilityResults.promptId, aiPrompts.id))
        .where(and(eq(aiVisibilityResults.brandId, input.brandId), eq(aiVisibilityResults.scanId, latest.scanId)));

      return { scanId: latest.scanId, results: rows };
    }),

  // Visibility score per scan over time.
  trend: protectedProcedure
    .input(z.object({ brandId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertBrand(ctx.user.id, input.brandId);
      const d = await db();
      const rows = await d
        .select({
          scanId: aiVisibilityResults.scanId,
          mentioned: aiVisibilityResults.mentioned,
          createdAt: aiVisibilityResults.createdAt,
        })
        .from(aiVisibilityResults)
        .where(eq(aiVisibilityResults.brandId, input.brandId))
        .orderBy(asc(aiVisibilityResults.createdAt));

      const byScan = new Map<string, { date: Date; mentioned: number; total: number }>();
      for (const r of rows) {
        const entry = byScan.get(r.scanId) ?? { date: r.createdAt, mentioned: 0, total: 0 };
        entry.total += 1;
        if (r.mentioned) entry.mentioned += 1;
        byScan.set(r.scanId, entry);
      }

      return Array.from(byScan.entries()).map(([scanId, e]) => ({
        scanId,
        date: e.date,
        score: e.total > 0 ? Math.round((e.mentioned / e.total) * 100) : 0,
        total: e.total,
      }));
    }),
});
