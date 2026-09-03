import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { wordpressPublishHistory, content, wordpressConnections } from "../../drizzle/schema";
import { and, eq, desc, gte, sql } from "drizzle-orm";
import { assertContent } from "../authz";

/**
 * Publishing Analytics Router - tracks and analyzes WordPress publishing performance
 */
export const publishingAnalyticsRouter = router({
  // Get overall publishing statistics
  getOverallStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // WordPress stats — this owner's content only
    const [wpStats] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        successful: sql<number>`SUM(CASE WHEN ${wordpressPublishHistory.success} = 1 THEN 1 ELSE 0 END)`,
        failed: sql<number>`SUM(CASE WHEN ${wordpressPublishHistory.success} = 0 THEN 1 ELSE 0 END)`,
      })
      .from(wordpressPublishHistory)
      .innerJoin(content, eq(wordpressPublishHistory.contentId, content.id))
      .where(eq(content.createdBy, ctx.user.id));

    return {
      wordpress: {
        total: Number(wpStats?.total || 0),
        successful: Number(wpStats?.successful || 0),
        failed: Number(wpStats?.failed || 0),
        successRate: wpStats?.total ? (Number(wpStats.successful) / Number(wpStats.total)) * 100 : 0,
      },
      combined: {
        total: Number(wpStats?.total || 0),
        successful: Number(wpStats?.successful || 0),
        failed: Number(wpStats?.failed || 0),
      },
    };
  }),

  // Get publishing history for a specific content
  getContentPublishHistory: protectedProcedure
    .input(z.object({ contentId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertContent(ctx.user.id, input.contentId);
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // WordPress history
      const wpHistory = await db
        .select({
          id: wordpressPublishHistory.id,
          platform: sql<string>`'wordpress'`,
          siteName: wordpressConnections.siteName,
          url: wordpressPublishHistory.wordpressPostUrl,
          success: wordpressPublishHistory.success,
          errorMessage: wordpressPublishHistory.errorMessage,
          publishedAt: wordpressPublishHistory.publishedAt,
        })
        .from(wordpressPublishHistory)
        .leftJoin(wordpressConnections, eq(wordpressPublishHistory.connectionId, wordpressConnections.id))
        .where(eq(wordpressPublishHistory.contentId, input.contentId))
        .orderBy(desc(wordpressPublishHistory.publishedAt));

      return wpHistory;
    }),

  // Get top performing content by publish count
  getTopPublishedContent: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Get this owner's content with publish counts
      const topContent = await db
        .select({
          contentId: content.id,
          title: content.title,
          wpPublishCount: sql<number>`(
            SELECT COUNT(*)
            FROM ${wordpressPublishHistory}
            WHERE ${wordpressPublishHistory.contentId} = ${content.id}
            AND ${wordpressPublishHistory.success} = 1
          )`,
        })
        .from(content)
        .where(eq(content.createdBy, ctx.user.id))
        .orderBy(sql`(
          SELECT COUNT(*) FROM ${wordpressPublishHistory} WHERE ${wordpressPublishHistory.contentId} = ${content.id} AND ${wordpressPublishHistory.success} = 1
        ) DESC`)
        .limit(input.limit);

      return topContent.map(item => ({
        ...item,
        totalPublishes: Number(item.wpPublishCount),
      }));
    }),

  // Get recent publishing activity
  getRecentActivity: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // WordPress recent activity — this owner's content only
      const wpActivity = await db
        .select({
          id: wordpressPublishHistory.id,
          platform: sql<string>`'wordpress'`,
          contentTitle: content.title,
          siteName: wordpressConnections.siteName,
          url: wordpressPublishHistory.wordpressPostUrl,
          success: wordpressPublishHistory.success,
          publishedAt: wordpressPublishHistory.publishedAt,
        })
        .from(wordpressPublishHistory)
        .innerJoin(content, eq(wordpressPublishHistory.contentId, content.id))
        .leftJoin(wordpressConnections, eq(wordpressPublishHistory.connectionId, wordpressConnections.id))
        .where(eq(content.createdBy, ctx.user.id))
        .orderBy(desc(wordpressPublishHistory.publishedAt))
        .limit(input.limit);

      return wpActivity;
    }),

  // Get publishing trends over time (last 30 days)
  getPublishingTrends: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // WordPress trends — this owner's content only
    const wpTrends = await db
      .select({
        date: sql<string>`DATE(${wordpressPublishHistory.publishedAt}) as date`,
        count: sql<number>`COUNT(*) as count`,
        successful: sql<number>`SUM(CASE WHEN ${wordpressPublishHistory.success} = 1 THEN 1 ELSE 0 END) as successful`,
      })
      .from(wordpressPublishHistory)
      .innerJoin(content, eq(wordpressPublishHistory.contentId, content.id))
      .where(and(gte(wordpressPublishHistory.publishedAt, thirtyDaysAgo), eq(content.createdBy, ctx.user.id)))
      .groupBy(sql`date`)
      .orderBy(sql`date`);

    return {
      wordpress: wpTrends,
    };
  }),
});
