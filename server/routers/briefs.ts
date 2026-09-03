import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { nanoid } from "nanoid";
import {
  createContentBrief,
  getContentBriefs,
  getContentBriefsForUser,
  getContentBriefByToken,
  getContentBriefById,
  updateContentBrief,
  deleteContentBrief,
} from "../db";
import { assertBrief, assertClient } from "../authz";

export const briefsRouter = router({
  // List all briefs (admin view)
  list: protectedProcedure
    .input(z.object({ clientId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (input?.clientId) {
        await assertClient(ctx.user.id, input.clientId);
        return getContentBriefs(input.clientId);
      }
      // No client specified: only briefs across clients this user owns.
      return getContentBriefsForUser(ctx.user.id);
    }),

  // Get a single brief by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertBrief(ctx.user.id, input.id);
      return getContentBriefById(input.id);
    }),

  // Generate a shareable brief link for a client
  generateLink: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await assertClient(ctx.user.id, input.clientId);
      const shareToken = nanoid(32);
      const id = await createContentBrief({
        clientId: input.clientId,
        shareToken,
        status: "submitted",
      });
      return { id, shareToken };
    }),

  // Public endpoint: Get brief form by share token (no auth required)
  getByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      return getContentBriefByToken(input.token);
    }),

  // Public endpoint: Submit a brief via share token (no auth required)
  submit: publicProcedure
    .input(z.object({
      token: z.string(),
      title: z.string().min(1),
      targetKeywords: z.string().optional(),
      targetAudience: z.string().optional(),
      tonePreference: z.enum(["professional", "casual", "technical", "friendly", "authoritative", "conversational"]).optional(),
      contentType: z.enum(["blog-post", "how-to", "listicle", "case-study", "guide", "news"]).optional(),
      additionalNotes: z.string().optional(),
      wordCountTarget: z.number().min(100).max(10000).optional(),
      submittedBy: z.string().optional(),
      submittedEmail: z.string().email().optional(),
    }))
    .mutation(async ({ input }) => {
      const { token, ...briefData } = input;
      const brief = await getContentBriefByToken(token);
      if (!brief) throw new Error("Invalid or expired brief link");

      await updateContentBrief(brief.id, {
        ...briefData,
        status: "submitted",
      });

      return { success: true };
    }),

  // Update brief status (admin)
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["submitted", "in_review", "accepted", "rejected"]),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertBrief(ctx.user.id, input.id);
      await updateContentBrief(input.id, { status: input.status });
      return { success: true };
    }),

  // Delete a brief
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await assertBrief(ctx.user.id, input.id);
      await deleteContentBrief(input.id);
      return { success: true };
    }),
});
