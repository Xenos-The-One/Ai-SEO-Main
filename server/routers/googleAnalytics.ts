import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { googleAnalyticsConnections } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { assertClient } from "../authz";
import {
  getGAConnection,
  fetchGAMetrics,
  fetchGAPageMetrics,
  fetchKeywordData,
  syncContentPerformance,
} from "../googleAnalytics";

export const googleAnalyticsRouter = router({
  // Get GA connection for a client
  get: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertClient(ctx.user.id, input.clientId);
      return getGAConnection(input.clientId);
    }),

  // Create or update GA connection
  upsert: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        propertyId: z.string(),
        viewId: z.string().optional(),
        serviceAccountEmail: z.string().optional(),
        serviceAccountKey: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertClient(ctx.user.id, input.clientId);
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if connection exists
      const existing = await getGAConnection(input.clientId);

      if (existing) {
        // Update existing
        await db
          .update(googleAnalyticsConnections)
          .set({
            propertyId: input.propertyId,
            viewId: input.viewId,
            serviceAccountEmail: input.serviceAccountEmail,
            serviceAccountKey: input.serviceAccountKey,
            updatedAt: new Date(),
          })
          .where(eq(googleAnalyticsConnections.id, existing.id));

        return { success: true, id: existing.id };
      } else {
        // Create new
        await db.insert(googleAnalyticsConnections).values({
          clientId: input.clientId,
          propertyId: input.propertyId,
          viewId: input.viewId,
          serviceAccountEmail: input.serviceAccountEmail,
          serviceAccountKey: input.serviceAccountKey,
          isActive: 1,
          createdBy: ctx.user.id,
        });

        return { success: true };
      }
    }),

  // Delete GA connection
  delete: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await assertClient(ctx.user.id, input.clientId);
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const connection = await getGAConnection(input.clientId);
      if (!connection) {
        return { success: false, message: "Connection not found" };
      }

      await db
        .delete(googleAnalyticsConnections)
        .where(eq(googleAnalyticsConnections.id, connection.id));

      return { success: true };
    }),

  // Fetch traffic metrics
  getMetrics: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      await assertClient(ctx.user.id, input.clientId);
      return fetchGAMetrics(input.clientId, input.startDate, input.endDate);
    }),

  // Fetch page metrics
  getPageMetrics: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        startDate: z.string(),
        endDate: z.string(),
        limit: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      await assertClient(ctx.user.id, input.clientId);
      return fetchGAPageMetrics(
        input.clientId,
        input.startDate,
        input.endDate,
        input.limit
      );
    }),

  // Fetch keyword data
  getKeywords: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        startDate: z.string(),
        endDate: z.string(),
        limit: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      await assertClient(ctx.user.id, input.clientId);
      return fetchKeywordData(
        input.clientId,
        input.startDate,
        input.endDate,
        input.limit
      );
    }),

  // Sync content performance
  sync: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await assertClient(ctx.user.id, input.clientId);
      return syncContentPerformance(input.clientId);
    }),
});
