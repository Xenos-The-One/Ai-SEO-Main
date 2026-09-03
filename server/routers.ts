import { COOKIE_NAME, SESSION_TTL_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { sdk } from "./_core/sdk";
import { getUserByEmail, createUser } from "./db";
import type { User } from "../drizzle/schema";

/** Strip sensitive fields (passwordHash) before returning a user to the client. */
function publicUser(user: User) {
  const { passwordHash, ...safe } = user;
  return safe;
}
import { 
  getClientsByUser, 
  createClient, 
  updateClient, 
  deleteClient,
  getClientById,
  getContentWithClient,
  getContentById,
  createContent,
  updateContent,
  deleteContent
} from "./db";
import { invokeLLM, DEFAULT_TEXT_MODEL } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { assertClient, assertContent, assertABTest, assertPortalUser, assertRevision } from "./authz";
import { limitLlmSingle, limitLlmBatch, limitData } from "./_core/rateLimiters";
import { bulkRouter } from "./routers/bulk";
import { templatesRouter } from "./routers/templates";
import { collaborationRouter } from "./routers/collaboration";
import { analyticsRouter } from "./routers/analytics";
import { repurposingRouter } from "./routers/repurposing";
import { socialRouter, newsletterRouter } from "./routers/distribution";
import { aiVisibilityRouter } from "./routers/aiVisibility";
import { qualityScoreRouter } from "./routers/qualityScore";
import { webhooksRouter } from "./routers/webhooks";
import { briefsRouter } from "./routers/briefs";
import { notificationsRouter } from "./routers/notifications";
import { seoAuditRouter } from "./routers/seoAudit";
import { agencySettingsRouter } from "./routers/agencySettings";
import { recurringPlansRouter } from "./routers/recurringPlans";
import { googleAnalyticsRouter } from "./routers/googleAnalytics";
import { wordpressRouter } from "./routers/wordpress";
import { designStandardsRouter } from "./routers/designStandards";
import { bulkPublishingRouter } from "./routers/bulkPublishing";
import { publishingAnalyticsRouter } from "./routers/publishingAnalytics";
import { siteAuditRouter } from "./routers/siteAudit";
import { rankTrackingRouter } from "./routers/rankTracking";
import { backlinksRouter } from "./routers/backlinks";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => (opts.ctx.user ? publicUser(opts.ctx.user) : null)),
    signup: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(8, "Password must be at least 8 characters"),
        name: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const existing = await getUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists" });
        }
        const passwordHash = await bcrypt.hash(input.password, 10);
        const openId = nanoid();
        const user = await createUser({
          openId,
          email: input.email,
          name: input.name || null,
          passwordHash,
          loginMethod: "email",
          lastSignedIn: new Date(),
        });
        const token = await sdk.createSessionToken(openId, { name: user.name || "", ver: user.tokenVersion ?? 0, expiresInMs: SESSION_TTL_MS });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: SESSION_TTL_MS });
        return publicUser(user);
      }),
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await getUserByEmail(input.email);
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        }
        const ok = await bcrypt.compare(input.password, user.passwordHash);
        if (!ok) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        }
        const token = await sdk.createSessionToken(user.openId, { name: user.name || "", ver: user.tokenVersion ?? 0, expiresInMs: SESSION_TTL_MS });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: SESSION_TTL_MS });
        return publicUser(user);
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    // Revoke every session for the current user (this device and all others).
    logoutAllDevices: protectedProcedure.mutation(async ({ ctx }) => {
      const { incrementUserTokenVersion } = await import("./db");
      await incrementUserTokenVersion(ctx.user.id);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Client management
  clients: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getClientsByUser(ctx.user.id);
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertClient(ctx.user.id, input.id);
        return getClientById(input.id);
      }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        company: z.string().optional(),
        notes: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
        businessName: z.string().optional(),
        businessType: z.string().optional(),
        industry: z.string().optional(),
        businessPhone: z.string().optional(),
        businessEmail: z.string().email().optional().or(z.literal("")),
        businessWebsite: z.string().optional(),
        businessAddress: z.string().optional(),
        websiteUrl: z.string().optional(),
        websitePlatform: z.string().optional(),
        websiteLoginUrl: z.string().optional(),
        websiteUsername: z.string().optional(),
        websitePassword: z.string().optional(),
        websiteNotes: z.string().optional(),
        socialFacebook: z.string().optional(),
        socialInstagram: z.string().optional(),
        socialLinkedin: z.string().optional(),
        socialTwitter: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const clientId = await createClient({
          ...input,
          createdBy: ctx.user.id,
        });
        return { id: clientId };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional().or(z.literal("")),
        company: z.string().optional(),
        notes: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
        businessName: z.string().optional(),
        businessType: z.string().optional(),
        industry: z.string().optional(),
        businessPhone: z.string().optional(),
        businessEmail: z.string().email().optional().or(z.literal("")),
        businessWebsite: z.string().optional(),
        businessAddress: z.string().optional(),
        websiteUrl: z.string().optional(),
        websitePlatform: z.string().optional(),
        websiteLoginUrl: z.string().optional(),
        websiteUsername: z.string().optional(),
        websitePassword: z.string().optional(),
        websiteNotes: z.string().optional(),
        socialFacebook: z.string().optional(),
        socialInstagram: z.string().optional(),
        socialLinkedin: z.string().optional(),
        socialTwitter: z.string().optional(),
        monthlyBudget: z.string().optional(),
        budgetAlertThreshold: z.number().min(0).max(100).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        await assertClient(ctx.user.id, id);
        await updateClient(id, updates);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await assertClient(ctx.user.id, input.id);
        await deleteClient(input.id);
        return { success: true };
      }),
    getMonthlyCost: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertClient(ctx.user.id, input.clientId);
        const { getClientMonthlyCost } = await import("./budgetTracking");
        return { cost: await getClientMonthlyCost(input.clientId) };
      }),
    getBudgetStatus: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertClient(ctx.user.id, input.clientId);
        const { checkClientBudgetAlert } = await import("./budgetTracking");
        return await checkClientBudgetAlert(input.clientId);
      }),
  }),

  // Model performance tracking
  modelPerformance: router({
    getMetrics: protectedProcedure.query(async ({ ctx }) => {
      const { getModelPerformanceMetrics } = await import("./modelPerformance");
      return await getModelPerformanceMetrics(ctx.user.id);
    }),
    compareModels: protectedProcedure
      .input(z.object({
        model1: z.string(),
        model2: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        const { compareModels } = await import("./modelPerformance");
        return await compareModels(input.model1, input.model2, ctx.user.id);
      }),
  }),

  // Content management and generation
  content: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getContentWithClient(ctx.user.id);
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertContent(ctx.user.id, input.id);
        return getContentById(input.id);
      }),
    listByClient: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ ctx, input }) => {
        const allContent = await getContentWithClient(ctx.user.id);
        return allContent.filter((item) => item.content.clientId === input.clientId).map((item) => item.content);
      }),
    generate: protectedProcedure
      .use(limitLlmSingle)
      .input(z.object({
        clientId: z.number(),
        topic: z.string().min(1),
        customPrompt: z.string().optional(),
        shouldGenerateImage: z.boolean().default(true),
        aiModel: z.string().optional(),
        contentType: z.enum(["blog", "newsletter", "social", "landing", "email"]).default("blog"),
      }))
      .mutation(async ({ ctx, input }) => {
        const { clientId, topic, customPrompt, shouldGenerateImage, aiModel, contentType } = input;
        await assertClient(ctx.user.id, clientId);
        const { assertClientWithinBudget } = await import("./budgetTracking");
        await assertClientWithinBudget(clientId);

        // Token + timing tracking
        let inputTokens = 0;
        let outputTokens = 0;
        const generationStartTime = Date.now();

        // Content-type-specific prompting
        const TYPE_PROMPTS: Record<string, { system: string; instruction: string }> = {
          blog: {
            system: "You are an expert SEO content writer. Create engaging, well-structured blog posts that are informative and optimized for search engines. Use markdown with a clear H1 title and H2/H3 sections.",
            instruction: "Write a comprehensive, SEO-optimized blog post about",
          },
          newsletter: {
            system: "You are an expert email newsletter writer. Write warm, scannable newsletters with a compelling subject line as the first line, short sections, and a clear call-to-action.",
            instruction: "Write an email newsletter about",
          },
          social: {
            system: "You are a social media copywriter. Write short, punchy, shareable posts (under ~280 characters where appropriate) with a strong hook and 3-5 relevant hashtags.",
            instruction: "Write an engaging social media post about",
          },
          landing: {
            system: "You are a conversion copywriter. Write persuasive landing page copy with a headline, subheadline, benefit-driven sections, and a strong call-to-action.",
            instruction: "Write landing page copy for",
          },
          email: {
            system: "You are an email marketing expert. Write a persuasive marketing email with a subject line as the first line, a personal tone, and one clear call-to-action.",
            instruction: "Write a marketing email about",
          },
        };
        const typeConfig = TYPE_PROMPTS[contentType] ?? TYPE_PROMPTS.blog;
        const systemPrompt = customPrompt || typeConfig.system;
        const userPrompt = `${typeConfig.instruction}: ${topic}`;

        const llmResponse = await invokeLLM({
          model: aiModel || DEFAULT_TEXT_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });

        const messageContent = llmResponse.choices[0]?.message?.content;
        const generatedContent = typeof messageContent === 'string' ? messageContent : "";
        inputTokens = llmResponse.usage?.prompt_tokens || 0;
        outputTokens = llmResponse.usage?.completion_tokens || 0;

        // Extract title from content (first line or generate one)
        const lines = generatedContent.split("\n").filter(l => l.trim());
        const title = lines[0]?.replace(/^#\s*/, "").substring(0, 500) || topic;

        // Generate featured image if requested
        let imageUrl = "";
        let imagePrompt = "";
        if (shouldGenerateImage) {
          try {
            imagePrompt = `Professional blog header image for: ${topic}`;
            const imageResult = await generateImage({ prompt: imagePrompt });
            imageUrl = imageResult.url || "";
          } catch (error) {
            console.error("Image generation failed:", error);
          }
        }

        // Calculate performance metrics
        const { calculateWordCount } = await import("./modelPerformance");
        const wordCount = calculateWordCount(generatedContent);
        const generationTimeMs = Date.now() - generationStartTime;

        // Save content to database
        const contentId = await createContent({
          clientId,
          createdBy: ctx.user.id,
          title,
          topic,
          content: generatedContent,
          imageUrl,
          imagePrompt,
          status: "draft",
          progress: 75,
          contentType,
          aiModel: aiModel || DEFAULT_TEXT_MODEL,
          customPrompt: customPrompt || null,
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          wordCount,
          generationTimeMs,
        });

        // Check budget and send alert if needed
        try {
          const { checkAndAlertAfterGeneration } = await import("./budgetTracking");
          await checkAndAlertAfterGeneration(clientId);
        } catch (error) {
          console.error("Budget check failed:", error);
        }

        return { id: contentId, title, content: generatedContent, imageUrl };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        status: z.enum(["draft", "in_progress", "approved"]).optional(),
        progress: z.number().min(0).max(100).optional(),
        scheduledPublishDate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, scheduledPublishDate, ...updates } = input;
        await assertContent(ctx.user.id, id);

        // Convert scheduledPublishDate string to Date if provided
        const finalUpdates: any = { ...updates };
        if (scheduledPublishDate) {
          finalUpdates.scheduledPublishDate = new Date(scheduledPublishDate);
        }
        
        // Check if status is changing to approved
        if (updates.status === "approved") {
          const contentData = await getContentById(id);
          if (contentData && contentData.status !== "approved") {
            // Update performance tracking
            const { calculateWordCount } = await import("./modelPerformance");
            const wordCount = calculateWordCount(contentData.content || "");
            await updateContent(id, {
              wasApproved: 1,
              approvedAt: new Date(),
              wordCount,
            });
            // Send approval notification to owner
            try {
              const { notifyOwner } = await import("./_core/notification");
              const contentPreview = contentData.content
                ? contentData.content.replace(/[#*\[\]()_`>-]/g, "").substring(0, 500)
                : "No content preview available";
              
              await notifyOwner({
                title: `Content Approved: ${contentData.title}`,
                content: `The blog post "${contentData.title}" has been approved by ${ctx.user.name || ctx.user.email || "a team member"}.\n\nTopic: ${contentData.topic || "N/A"}\n\nPreview:\n${contentPreview}...\n\nYou can now publish this content to the client's CMS via the Publishing page.`,
              });
            } catch (e) {
              console.error("Failed to send approval notification:", e);
            }
          }
        }
        
        await updateContent(id, finalUpdates);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await assertContent(ctx.user.id, input.id);
        await deleteContent(input.id);
        return { success: true };
      }),
    regenerate: protectedProcedure
      .use(limitLlmSingle)
      .input(z.object({
        id: z.number(),
        aiModel: z.string(),
        customPrompt: z.string().optional(),
        shouldGenerateImage: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, aiModel, customPrompt, shouldGenerateImage } = input;
        await assertContent(ctx.user.id, id);

        // Get original content
        const originalContent = await getContentById(id);
        if (!originalContent) {
          throw new Error("Content not found");
        }
        const { assertClientWithinBudget } = await import("./budgetTracking");
        await assertClientWithinBudget(originalContent.clientId);

        // Track generation start time
        const generationStartTime = Date.now();
        let inputTokens = 0;
        let outputTokens = 0;

        // Generate new content with AI
        const systemPrompt = customPrompt || "You are an expert SEO content writer. Create engaging, well-structured blog posts that are informative and optimized for search engines.";
        const userPrompt = `Write a comprehensive blog post about: ${originalContent.topic}`;

        const llmResponse = await invokeLLM({
          model: aiModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });

        const messageContent = llmResponse.choices[0]?.message?.content;
        const generatedContent = typeof messageContent === 'string' ? messageContent : "";
        inputTokens = llmResponse.usage?.prompt_tokens || 0;
        outputTokens = llmResponse.usage?.completion_tokens || 0;

        // Extract title from content
        const lines = generatedContent.split("\n").filter(l => l.trim());
        const title = lines[0]?.replace(/^#\s*/, "").substring(0, 500) || originalContent.topic;

        // Generate featured image if requested
        let imageUrl = originalContent.imageUrl || "";
        let imagePrompt = originalContent.imagePrompt || "";
        if (shouldGenerateImage) {
          try {
            imagePrompt = `Professional blog header image for: ${originalContent.topic}`;
            const imageResult = await generateImage({ prompt: imagePrompt });
            imageUrl = imageResult.url || "";
          } catch (error) {
            console.error("Image generation failed:", error);
          }
        }

        // Calculate performance metrics
        const { calculateWordCount } = await import("./modelPerformance");
        const wordCount = calculateWordCount(generatedContent);
        const generationTimeMs = Date.now() - generationStartTime;

        // Update content with regenerated version
        await updateContent(id, {
          title,
          content: generatedContent,
          imageUrl,
          imagePrompt,
          aiModel,
          customPrompt: customPrompt || null,
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          urlsFetched: 0,
          urlsFailed: 0,
          webSearches: 0,
          wordCount,
          generationTimeMs,
          status: "draft",
          wasApproved: 0,
          approvedAt: null,
        });

        // Check budget and send alert if needed
        try {
          const { checkAndAlertAfterGeneration } = await import("./budgetTracking");
          await checkAndAlertAfterGeneration(originalContent.clientId);
        } catch (error) {
          console.error("Budget check failed:", error);
        }

        return { id, title, content: generatedContent, imageUrl };
      }),
    exportHtml: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertContent(ctx.user.id, input.id);
        const content = await getContentById(input.id);
        if (!content) throw new Error("Content not found");
        return {
          title: content.title,
          content: content.content,
          imageUrl: content.imageUrl,
          topic: content.topic,
          status: content.status,
          aiModel: content.aiModel,
          createdAt: content.createdAt,
        };
      }),
    schedule: protectedProcedure
      .input(z.object({
        contentId: z.number(),
        scheduledPublishDate: z.date(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertContent(ctx.user.id, input.contentId);
        await updateContent(input.contentId, {
          scheduledPublishDate: input.scheduledPublishDate,
          isScheduled: 1,
        });
        return { success: true };
      }),
  }),

  bulk: bulkRouter,
  templates: templatesRouter,
  collaboration: collaborationRouter,
  analytics: analyticsRouter,
  repurposing: repurposingRouter,
  social: socialRouter,
  newsletter: newsletterRouter,
  aiVisibility: aiVisibilityRouter,
  qualityScore: qualityScoreRouter,
  webhooks: webhooksRouter,
  briefs: briefsRouter,
  notifications: notificationsRouter,
  seoAudit: seoAuditRouter,
  siteAudit: siteAuditRouter,
  rankTracking: rankTrackingRouter,
  backlinks: backlinksRouter,
  agencySettings: agencySettingsRouter,
  recurringPlans: recurringPlansRouter,

  // Keyword Research
  keywords: router({
    suggest: protectedProcedure
      .use(limitData)
      .input(z.object({
        topic: z.string().min(1),
        count: z.number().min(1).max(20).optional(),
      }))
      .mutation(async ({ input }) => {
        const { getKeywordSuggestions } = await import("./keywordResearch");
        return await getKeywordSuggestions(input.topic, input.count);
      }),
    analyze: protectedProcedure
      .input(z.object({
        content: z.string().min(1),
        targetKeywords: z.array(z.string()),
      }))
      .mutation(async ({ input }) => {
        const { analyzeContentKeywords } = await import("./keywordResearch");
        return await analyzeContentKeywords(input.content, input.targetKeywords);
      }),
    optimize: protectedProcedure
      .use(limitLlmSingle)
      .input(z.object({
        content: z.string().min(1),
        targetKeywords: z.array(z.string()),
      }))
      .mutation(async ({ input }) => {
        const { optimizeContentForKeywords } = await import("./keywordResearch");
        return await optimizeContentForKeywords(input.content, input.targetKeywords);
      }),
  }),

  // Competitor Research (DataForSEO Labs)
  competitors: router({
    find: protectedProcedure
      .use(limitData)
      .input(z.object({
        domain: z.string().min(1),
        limit: z.number().min(1).max(50).optional(),
      }))
      .mutation(async ({ input }) => {
        const { competitorDomains } = await import("./lib/dataforseo");
        return await competitorDomains(input.domain, { limit: input.limit ?? 20 });
      }),
    compare: protectedProcedure
      .use(limitData)
      .input(z.object({
        yourDomain: z.string().min(1),
        competitorDomain: z.string().min(1),
        limit: z.number().min(1).max(100).optional(),
      }))
      .mutation(async ({ input }) => {
        const { domainIntersection } = await import("./lib/dataforseo");
        return await domainIntersection(input.yourDomain, input.competitorDomain, { limit: input.limit ?? 50 });
      }),
  }),

  // Performance Tracking
  performance: router({
    getContentPerformance: protectedProcedure
      .input(z.object({ contentId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertContent(ctx.user.id, input.contentId);
        const { getContentPerformance } = await import("./performanceTracking");
        return await getContentPerformance(input.contentId);
      }),
    getTopPerforming: protectedProcedure
      .input(z.object({ limit: z.number().default(10) }))
      .query(async ({ ctx, input }) => {
        const { getTopPerformingContent } = await import("./performanceTracking");
        return await getTopPerformingContent(input.limit, ctx.user.id);
      }),
    getSummary: protectedProcedure.query(async ({ ctx }) => {
      const { getPerformanceSummary } = await import("./performanceTracking");
      return await getPerformanceSummary(ctx.user.id);
    }),
    trackView: protectedProcedure
      .input(z.object({ contentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await assertContent(ctx.user.id, input.contentId);
        const { trackContentView } = await import("./performanceTracking");
        return await trackContentView(input.contentId);
      }),
    trackClick: protectedProcedure
      .input(z.object({ contentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await assertContent(ctx.user.id, input.contentId);
        const { trackContentClick } = await import("./performanceTracking");
        return await trackContentClick(input.contentId);
      }),
    getTrends: protectedProcedure
      .input(z.object({ days: z.number().default(30) }))
      .query(async ({ ctx, input }) => {
        const { getPerformanceTrends } = await import("./performanceTracking");
        return await getPerformanceTrends(input.days, ctx.user.id);
      }),
  }),

  // Google Analytics Integration
  googleAnalytics: googleAnalyticsRouter,
  wordpress: wordpressRouter,
  designStandards: designStandardsRouter,
  bulkPublishing: bulkPublishingRouter,
  publishingAnalytics: publishingAnalyticsRouter,

  // Portal Branding
  portalBranding: router({
    get: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertClient(ctx.user.id, input.clientId);
        const { getPortalBranding } = await import("./db");
        return await getPortalBranding(input.clientId);
      }),

    upsert: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        logoUrl: z.string().optional(),
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        portalName: z.string().optional(),
        welcomeMessage: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertClient(ctx.user.id, input.clientId);
        const { upsertPortalBranding } = await import("./db");
        return await upsertPortalBranding(input);
      }),
  }),

  // Client Portal Authentication
  clientPortal: router({
    // Invitation management
    createInvitation: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        email: z.string().email(),
        name: z.string(),
        role: z.enum(["client_admin", "client_viewer"]).default("client_viewer"),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertClient(ctx.user.id, input.clientId);
        const { createClientPortalInvitation } = await import("./clientPortalAuth");
        return await createClientPortalInvitation(input.clientId, input.email, input.name, input.role);
      }),
    
    // Accept invitation (public endpoint)
    acceptInvitation: publicProcedure
      .input(z.object({
        token: z.string(),
        password: z.string().min(8),
      }))
      .mutation(async ({ input }) => {
        const { acceptInvitation } = await import("./clientPortalAuth");
        return await acceptInvitation(input.token, input.password);
      }),
    
    // Login (public endpoint)
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { loginClientPortalUser } = await import("./clientPortalAuth");
        return await loginClientPortalUser(input.email, input.password);
      }),
    
    // Get current user (requires client portal token)
    me: publicProcedure.query(async ({ ctx }) => {
      // This would need custom context handling for client portal tokens
      // For now, return null if not authenticated
      return null;
    }),
    
    // List portal users for a client
    listUsers: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertClient(ctx.user.id, input.clientId);
        const { listClientPortalUsers } = await import("./clientPortalAuth");
        return await listClientPortalUsers(input.clientId);
      }),
    
    // Change password
    changePassword: publicProcedure
      .input(z.object({
        userId: z.number(),
        oldPassword: z.string(),
        newPassword: z.string().min(8),
      }))
      .mutation(async ({ input }) => {
        const { changeClientPortalPassword } = await import("./clientPortalAuth");
        return await changeClientPortalPassword(input.userId, input.oldPassword, input.newPassword);
      }),
    
    // Deactivate user
    deactivateUser: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await assertPortalUser(ctx.user.id, input.userId);
        const { deactivateClientPortalUser } = await import("./clientPortalAuth");
        return await deactivateClientPortalUser(input.userId);
      }),
  }),

  // Approval Workflow
  approvals: router({
    requestApproval: protectedProcedure
      .input(z.object({ contentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await assertContent(ctx.user.id, input.contentId);
        const { requestApproval } = await import("./approvalWorkflow");
        return await requestApproval(input.contentId, ctx.user.id);
      }),
    approve: protectedProcedure
      .input(z.object({ contentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await assertContent(ctx.user.id, input.contentId);
        const { approveContent } = await import("./approvalWorkflow");
        return await approveContent(input.contentId, ctx.user.id);
      }),
    requestRevision: protectedProcedure
      .input(z.object({
        contentId: z.number(),
        reason: z.string().min(1)
      }))
      .mutation(async ({ ctx, input }) => {
        await assertContent(ctx.user.id, input.contentId);
        const { requestRevision } = await import("./approvalWorkflow");
        return await requestRevision(input.contentId, ctx.user.id, input.reason);
      }),
    getPendingApprovals: protectedProcedure.query(async ({ ctx }) => {
      const { getPendingApprovals } = await import("./approvalWorkflow");
      return await getPendingApprovals(ctx.user.id);
    }),
    getRevisionRequests: protectedProcedure
      .input(z.object({ contentId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertContent(ctx.user.id, input.contentId);
        const { getRevisionRequests } = await import("./approvalWorkflow");
        return await getRevisionRequests(input.contentId);
      }),
    completeRevision: protectedProcedure
      .input(z.object({ revisionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await assertRevision(ctx.user.id, input.revisionId);
        const { completeRevision } = await import("./approvalWorkflow");
        return await completeRevision(input.revisionId);
      }),
    addComment: protectedProcedure
      .input(z.object({
        contentId: z.number(),
        comment: z.string().min(1)
      }))
      .mutation(async ({ ctx, input }) => {
        await assertContent(ctx.user.id, input.contentId);
        const { addComment } = await import("./approvalWorkflow");
        return await addComment(input.contentId, ctx.user.id, input.comment);
      }),
    getStats: protectedProcedure.query(async ({ ctx }) => {
      const { getApprovalStats } = await import("./approvalWorkflow");
      return await getApprovalStats(ctx.user.id);
    }),
  }),

  // A/B Testing
  abTests: router({
    list: protectedProcedure.query(async () => {
      const { listABTests } = await import("./abTesting");
      return await listABTests();
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertABTest(ctx.user.id, input.id);
        const { getABTestById } = await import("./abTesting");
        return await getABTestById(input.id);
      }),
    create: protectedProcedure
      .use(limitLlmBatch)
      .input(z.object({
        clientId: z.number(),
        topic: z.string(),
        customPrompt: z.string().optional(),
        shouldGenerateImage: z.boolean().default(false),
        modelA: z.string(),
        modelB: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertClient(ctx.user.id, input.clientId);
        const { assertClientWithinBudget } = await import("./budgetTracking");
        await assertClientWithinBudget(input.clientId);
        const { createABTest, updateABTestResults } = await import("./abTesting");
        const { calculateWordCount } = await import("./modelPerformance");
        
        // Create A/B test record
        const testId = await createABTest({
          ...input,
          createdBy: ctx.user.id,
        });

        // Generate both versions
        const systemPrompt = input.customPrompt || "You are an expert SEO content writer. Create engaging, well-structured blog posts that are informative and optimized for search engines.";
        const userPrompt = `Write a comprehensive blog post about: ${input.topic}`;

        // Generate Version A
        const startTimeA = Date.now();
        const responseA = await invokeLLM({
          model: input.modelA,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });
        const contentA = typeof responseA.choices[0]?.message?.content === 'string' 
          ? responseA.choices[0].message.content 
          : "";
        const titleA = contentA.split("\n").filter(l => l.trim())[0]?.replace(/^#\s*/, "").substring(0, 500) || input.topic;
        const generationTimeMsA = Date.now() - startTimeA;

        await updateABTestResults(testId, {
          version: "A",
          content: contentA,
          title: titleA,
          wordCount: calculateWordCount(contentA),
          generationTimeMs: generationTimeMsA,
          inputTokens: responseA.usage?.prompt_tokens || 0,
          outputTokens: responseA.usage?.completion_tokens || 0,
        });

        // Generate Version B
        const startTimeB = Date.now();
        const responseB = await invokeLLM({
          model: input.modelB,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });
        const contentB = typeof responseB.choices[0]?.message?.content === 'string' 
          ? responseB.choices[0].message.content 
          : "";
        const titleB = contentB.split("\n").filter(l => l.trim())[0]?.replace(/^#\s*/, "").substring(0, 500) || input.topic;
        const generationTimeMsB = Date.now() - startTimeB;

        await updateABTestResults(testId, {
          version: "B",
          content: contentB,
          title: titleB,
          wordCount: calculateWordCount(contentB),
          generationTimeMs: generationTimeMsB,
          inputTokens: responseB.usage?.prompt_tokens || 0,
          outputTokens: responseB.usage?.completion_tokens || 0,
        });

        return { id: testId };
      }),
    setWinner: protectedProcedure
      .input(z.object({
        id: z.number(),
        winner: z.enum(["A", "B"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertABTest(ctx.user.id, input.id);
        const { setABTestWinner } = await import("./abTesting");
        await setABTestWinner(input.id, input.winner, input.notes);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await assertABTest(ctx.user.id, input.id);
        const { deleteABTest } = await import("./abTesting");
        await deleteABTest(input.id);
        return { success: true };
      }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
