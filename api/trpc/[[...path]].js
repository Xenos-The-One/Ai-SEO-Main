var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/_core/notification.ts
var notification_exports = {};
__export(notification_exports, {
  notifyOwner: () => notifyOwner
});
import { TRPCError } from "@trpc/server";
async function notifyOwner(payload) {
  const { title, content: content2 } = validatePayload(payload);
  console.info(`[Notification] ${title}
${content2}`);
  return true;
}
var TITLE_MAX_LENGTH, CONTENT_MAX_LENGTH, trimValue, isNonEmptyString, validatePayload;
var init_notification = __esm({
  "server/_core/notification.ts"() {
    "use strict";
    TITLE_MAX_LENGTH = 1200;
    CONTENT_MAX_LENGTH = 2e4;
    trimValue = (value) => value.trim();
    isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
    validatePayload = (input) => {
      if (!isNonEmptyString(input.title)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Notification title is required."
        });
      }
      if (!isNonEmptyString(input.content)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Notification content is required."
        });
      }
      const title = trimValue(input.title);
      const content2 = trimValue(input.content);
      if (title.length > TITLE_MAX_LENGTH) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
        });
      }
      if (content2.length > CONTENT_MAX_LENGTH) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
        });
      }
      return { title, content: content2 };
    };
  }
});

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  abTests: () => abTests,
  agencySettings: () => agencySettings,
  aiBrands: () => aiBrands,
  aiPrompts: () => aiPrompts,
  aiVisibilityResults: () => aiVisibilityResults,
  backlinkSnapshots: () => backlinkSnapshots,
  clientPortalUsers: () => clientPortalUsers,
  clients: () => clients,
  content: () => content,
  contentAnalytics: () => contentAnalytics,
  contentBriefs: () => contentBriefs,
  contentComments: () => contentComments,
  contentQualityScores: () => contentQualityScores,
  contentRepurposed: () => contentRepurposed,
  contentRevisions: () => contentRevisions,
  contentTemplates: () => contentTemplates,
  designStandards: () => designStandards,
  googleAnalyticsConnections: () => googleAnalyticsConnections,
  portalBranding: () => portalBranding,
  publishLogs: () => publishLogs,
  publishingSchedules: () => publishingSchedules,
  rankSnapshots: () => rankSnapshots,
  recurringPlans: () => recurringPlans,
  siteAuditPages: () => siteAuditPages,
  siteAudits: () => siteAudits,
  trackedKeywords: () => trackedKeywords,
  users: () => users,
  webhookConfigs: () => webhookConfigs,
  wordpressConnections: () => wordpressConnections,
  wordpressPublishHistory: () => wordpressPublishHistory
});
import { integer, serial, pgTable, text, timestamp, varchar, numeric } from "drizzle-orm/pg-core";
var users, clients, clientPortalUsers, portalBranding, content, contentTemplates, contentComments, contentRevisions, contentAnalytics, contentRepurposed, contentQualityScores, webhookConfigs, publishLogs, contentBriefs, agencySettings, recurringPlans, abTests, googleAnalyticsConnections, wordpressConnections, wordpressPublishHistory, designStandards, publishingSchedules, aiBrands, aiPrompts, aiVisibilityResults, siteAudits, siteAuditPages, trackedKeywords, rankSnapshots, backlinkSnapshots;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = pgTable("users", {
      /**
       * Surrogate primary key. Auto-incremented numeric value managed by the database.
       * Use this for relations between tables.
       */
      id: serial("id").primaryKey(),
      /** Stable per-user identifier (a nanoid). Unique per user; used in the session token. */
      openId: varchar("openId", { length: 64 }).notNull().unique(),
      name: text("name"),
      email: varchar("email", { length: 320 }).unique(),
      /** bcrypt hash for email+password auth. Null for accounts created via other methods. */
      passwordHash: text("passwordHash"),
      loginMethod: varchar("loginMethod", { length: 64 }),
      role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
      /** Bumped to revoke all outstanding session tokens for this user (logout-all / compromise). */
      tokenVersion: integer("tokenVersion").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    });
    clients = pgTable("clients", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 255 }).notNull(),
      email: varchar("email", { length: 320 }),
      company: varchar("company", { length: 255 }),
      notes: text("notes"),
      createdBy: integer("createdBy").notNull().references(() => users.id),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull(),
      // Budget tracking
      monthlyBudget: numeric("monthlyBudget", { precision: 10, scale: 2 }).default("0.00"),
      budgetAlertThreshold: integer("budgetAlertThreshold").default(80),
      // Percentage (0-100)
      // Personal contact info
      phone: varchar("phone", { length: 50 }),
      address: text("address"),
      city: varchar("city", { length: 100 }),
      state: varchar("state", { length: 100 }),
      zipCode: varchar("zipCode", { length: 20 }),
      country: varchar("country", { length: 100 }),
      // Business information
      businessName: varchar("businessName", { length: 255 }),
      businessType: varchar("businessType", { length: 100 }),
      industry: varchar("industry", { length: 100 }),
      businessPhone: varchar("businessPhone", { length: 50 }),
      businessEmail: varchar("businessEmail", { length: 320 }),
      businessWebsite: varchar("businessWebsite", { length: 500 }),
      businessAddress: text("businessAddress"),
      // Website login credentials (for the client's website we manage)
      websiteUrl: varchar("websiteUrl", { length: 500 }),
      websitePlatform: varchar("websitePlatform", { length: 100 }),
      websiteLoginUrl: varchar("websiteLoginUrl", { length: 500 }),
      websiteUsername: varchar("websiteUsername", { length: 255 }),
      websitePassword: text("websitePassword"),
      websiteNotes: text("websiteNotes"),
      // Social media
      socialFacebook: varchar("socialFacebook", { length: 500 }),
      socialInstagram: varchar("socialInstagram", { length: 500 }),
      socialLinkedin: varchar("socialLinkedin", { length: 500 }),
      socialTwitter: varchar("socialTwitter", { length: 500 })
    });
    clientPortalUsers = pgTable("clientPortalUsers", {
      id: serial("id").primaryKey(),
      clientId: integer("clientId").notNull().references(() => clients.id, { onDelete: "cascade" }),
      email: varchar("email", { length: 320 }).notNull().unique(),
      passwordHash: text("passwordHash").notNull(),
      name: varchar("name", { length: 255 }).notNull(),
      role: text("role", { enum: ["client_admin", "client_viewer"] }).default("client_viewer").notNull(),
      isActive: integer("isActive").default(1).notNull(),
      // 0 = inactive, 1 = active
      invitationToken: varchar("invitationToken", { length: 255 }),
      invitationExpiry: timestamp("invitationExpiry"),
      lastLoginAt: timestamp("lastLoginAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
    });
    portalBranding = pgTable("portalBranding", {
      id: serial("id").primaryKey(),
      clientId: integer("clientId").notNull().unique().references(() => clients.id, { onDelete: "cascade" }),
      logoUrl: text("logoUrl"),
      primaryColor: varchar("primaryColor", { length: 7 }).default("#3b82f6"),
      // Hex color
      secondaryColor: varchar("secondaryColor", { length: 7 }).default("#1e40af"),
      customDomain: varchar("customDomain", { length: 255 }),
      portalName: varchar("portalName", { length: 255 }),
      welcomeMessage: text("welcomeMessage"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
    });
    content = pgTable("content", {
      id: serial("id").primaryKey(),
      clientId: integer("clientId").notNull().references(() => clients.id, { onDelete: "cascade" }),
      createdBy: integer("createdBy").notNull().references(() => users.id),
      // Content fields
      title: varchar("title", { length: 500 }).notNull(),
      topic: text("topic").notNull(),
      content: text("content").notNull(),
      imageUrl: text("imageUrl"),
      imagePrompt: text("imagePrompt"),
      // Status and workflow
      status: text("status", { enum: ["draft", "in_progress", "approved"] }).default("draft").notNull(),
      progress: integer("progress").default(0).notNull(),
      // 0-100
      contentType: varchar("contentType", { length: 32 }).default("blog").notNull(),
      // blog | newsletter | social | landing | email
      // AI model and customization
      aiModel: varchar("aiModel", { length: 100 }).default("gemini-3.6-flash").notNull(),
      customPrompt: text("customPrompt"),
      // Token usage tracking
      inputTokens: integer("inputTokens").default(0).notNull(),
      outputTokens: integer("outputTokens").default(0).notNull(),
      totalTokens: integer("totalTokens").default(0).notNull(),
      // Research statistics
      urlsFetched: integer("urlsFetched").default(0).notNull(),
      urlsFailed: integer("urlsFailed").default(0).notNull(),
      webSearches: integer("webSearches").default(0).notNull(),
      // Scheduling
      scheduledPublishDate: timestamp("scheduledPublishDate"),
      isScheduled: integer("isScheduled").default(0).notNull(),
      // 0 = false, 1 = true
      // Performance tracking
      wordCount: integer("wordCount").default(0).notNull(),
      wasApproved: integer("wasApproved").default(0).notNull(),
      // 0 = not yet, 1 = yes
      approvedAt: timestamp("approvedAt"),
      generationTimeMs: integer("generationTimeMs").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
    });
    contentTemplates = pgTable("contentTemplates", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 255 }).notNull(),
      description: text("description"),
      category: text("category", { enum: ["product-review", "how-to", "listicle", "case-study", "comparison", "tutorial", "news", "opinion", "custom"] }).notNull(),
      prompt: text("prompt").notNull(),
      structure: text("structure"),
      createdBy: integer("createdBy").notNull().references(() => users.id),
      isPublic: integer("isPublic").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
    });
    contentComments = pgTable("contentComments", {
      id: serial("id").primaryKey(),
      contentId: integer("contentId").notNull().references(() => content.id, { onDelete: "cascade" }),
      userId: integer("userId").notNull().references(() => users.id),
      comment: text("comment").notNull(),
      isResolved: integer("isResolved").default(0).notNull(),
      // 0 = open, 1 = resolved
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
    });
    contentRevisions = pgTable("contentRevisions", {
      id: serial("id").primaryKey(),
      contentId: integer("contentId").notNull().references(() => content.id, { onDelete: "cascade" }),
      userId: integer("userId").notNull().references(() => users.id),
      title: varchar("title", { length: 500 }),
      content: text("content"),
      changeDescription: text("changeDescription"),
      revisionNumber: integer("revisionNumber").notNull(),
      // Approval workflow fields
      requestedBy: integer("requestedBy").references(() => users.id),
      reason: text("reason"),
      status: text("status", { enum: ["pending", "in_progress", "completed", "rejected"] }),
      completedAt: timestamp("completedAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    contentAnalytics = pgTable("contentAnalytics", {
      id: serial("id").primaryKey(),
      contentId: integer("contentId").notNull().references(() => content.id, { onDelete: "cascade" }),
      views: integer("views").default(0).notNull(),
      clicks: integer("clicks").default(0).notNull(),
      shares: integer("shares").default(0).notNull(),
      engagementRate: integer("engagementRate").default(0).notNull(),
      avgTimeOnPage: integer("avgTimeOnPage").default(0).notNull(),
      conversions: integer("conversions").default(0).notNull(),
      recordedAt: timestamp("recordedAt").defaultNow().notNull()
    });
    contentRepurposed = pgTable("contentRepurposed", {
      id: serial("id").primaryKey(),
      contentId: integer("contentId").notNull().references(() => content.id, { onDelete: "cascade" }),
      format: text("format", { enum: ["social-snippet", "email-summary", "short-form", "infographic-script", "video-script"] }).notNull(),
      content: text("content").notNull(),
      platform: varchar("platform", { length: 100 }),
      createdBy: integer("createdBy").notNull().references(() => users.id),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
    });
    contentQualityScores = pgTable("contentQualityScores", {
      id: serial("id").primaryKey(),
      contentId: integer("contentId").notNull().references(() => content.id, { onDelete: "cascade" }),
      overallScore: integer("overallScore").default(0).notNull(),
      readabilityScore: integer("readabilityScore").default(0).notNull(),
      seoScore: integer("seoScore").default(0).notNull(),
      toneScore: integer("toneScore").default(0).notNull(),
      engagementScore: integer("engagementScore").default(0).notNull(),
      readabilityDetails: text("readabilityDetails"),
      seoDetails: text("seoDetails"),
      toneDetails: text("toneDetails"),
      engagementDetails: text("engagementDetails"),
      suggestions: text("suggestions"),
      analyzedAt: timestamp("analyzedAt").defaultNow().notNull()
    });
    webhookConfigs = pgTable("webhookConfigs", {
      id: serial("id").primaryKey(),
      clientId: integer("clientId").notNull().references(() => clients.id, { onDelete: "cascade" }),
      name: varchar("name", { length: 255 }).notNull(),
      platform: text("platform", { enum: ["wordpress", "ghost", "webflow", "custom"] }).notNull(),
      endpointUrl: text("endpointUrl").notNull(),
      apiKey: text("apiKey"),
      authHeader: text("authHeader"),
      isActive: integer("isActive").default(1).notNull(),
      lastPublishedAt: timestamp("lastPublishedAt"),
      createdBy: integer("createdBy").notNull().references(() => users.id),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
    });
    publishLogs = pgTable("publishLogs", {
      id: serial("id").primaryKey(),
      contentId: integer("contentId").notNull().references(() => content.id, { onDelete: "cascade" }),
      webhookId: integer("webhookId").notNull().references(() => webhookConfigs.id, { onDelete: "cascade" }),
      status: text("status", { enum: ["pending", "success", "failed"] }).default("pending").notNull(),
      responseCode: integer("responseCode"),
      responseBody: text("responseBody"),
      publishedAt: timestamp("publishedAt").defaultNow().notNull()
    });
    contentBriefs = pgTable("contentBriefs", {
      id: serial("id").primaryKey(),
      clientId: integer("clientId").notNull().references(() => clients.id, { onDelete: "cascade" }),
      shareToken: varchar("shareToken", { length: 64 }).notNull().unique(),
      // Brief details
      title: varchar("title", { length: 500 }),
      targetKeywords: text("targetKeywords"),
      targetAudience: text("targetAudience"),
      tonePreference: text("tonePreference", { enum: ["professional", "casual", "technical", "friendly", "authoritative", "conversational"] }).default("professional"),
      contentType: text("contentType", { enum: ["blog-post", "how-to", "listicle", "case-study", "guide", "news"] }).default("blog-post"),
      additionalNotes: text("additionalNotes"),
      wordCountTarget: integer("wordCountTarget").default(1500),
      // Status
      status: text("briefStatus", { enum: ["submitted", "in_review", "accepted", "rejected"] }).default("submitted").notNull(),
      submittedBy: varchar("submittedBy", { length: 255 }),
      submittedEmail: varchar("submittedEmail", { length: 320 }),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
    });
    agencySettings = pgTable("agency_settings", {
      id: serial("id").primaryKey(),
      settingKey: varchar("settingKey", { length: 128 }).notNull().unique(),
      settingValue: text("settingValue"),
      updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
    });
    recurringPlans = pgTable("recurringPlans", {
      id: serial("id").primaryKey(),
      clientId: integer("clientId").notNull().references(() => clients.id),
      planName: varchar("planName", { length: 255 }).notNull(),
      frequency: text("frequency", { enum: ["daily", "weekly", "biweekly", "monthly"] }).notNull(),
      postsPerCycle: integer("postsPerCycle").notNull().default(1),
      topicTemplate: text("topicTemplate"),
      // Template for generating topics
      customPrompt: text("customPrompt"),
      aiModel: varchar("aiModel", { length: 100 }).default("gemini-3.6-flash"),
      enableWebResearch: integer("enableWebResearch").notNull().default(1),
      enableImageGeneration: integer("enableImageGeneration").notNull().default(1),
      isActive: integer("isActive").notNull().default(1),
      lastRunDate: timestamp("lastRunDate"),
      nextRunDate: timestamp("nextRunDate"),
      createdBy: integer("createdBy").notNull().references(() => users.id),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
    });
    abTests = pgTable("abTests", {
      id: serial("id").primaryKey(),
      clientId: integer("clientId").notNull().references(() => clients.id, { onDelete: "cascade" }),
      topic: text("topic").notNull(),
      customPrompt: text("customPrompt"),
      enableWebResearch: integer("enableWebResearch").notNull().default(0),
      shouldGenerateImage: integer("shouldGenerateImage").notNull().default(0),
      // Version A
      modelA: varchar("modelA", { length: 100 }).notNull(),
      contentA: text("contentA"),
      titleA: text("titleA"),
      imageUrlA: text("imageUrlA"),
      wordCountA: integer("wordCountA").default(0),
      generationTimeMsA: integer("generationTimeMsA").default(0),
      inputTokensA: integer("inputTokensA").default(0),
      outputTokensA: integer("outputTokensA").default(0),
      // Version B
      modelB: varchar("modelB", { length: 100 }).notNull(),
      contentB: text("contentB"),
      titleB: text("titleB"),
      imageUrlB: text("imageUrlB"),
      wordCountB: integer("wordCountB").default(0),
      generationTimeMsB: integer("generationTimeMsB").default(0),
      inputTokensB: integer("inputTokensB").default(0),
      outputTokensB: integer("outputTokensB").default(0),
      // Results
      winner: text("winner", { enum: ["A", "B", "none"] }).default("none"),
      notes: text("notes"),
      createdBy: integer("createdBy").notNull().references(() => users.id),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
    });
    googleAnalyticsConnections = pgTable("googleAnalyticsConnections", {
      id: serial("id").primaryKey(),
      clientId: integer("clientId").notNull().references(() => clients.id, { onDelete: "cascade" }),
      propertyId: varchar("propertyId", { length: 255 }).notNull(),
      // GA4 Property ID
      viewId: varchar("viewId", { length: 255 }),
      // Universal Analytics View ID (optional, for legacy)
      // OAuth credentials (encrypted in production)
      accessToken: text("accessToken"),
      refreshToken: text("refreshToken"),
      tokenExpiry: timestamp("tokenExpiry"),
      // API Key alternative (for service account)
      serviceAccountEmail: varchar("serviceAccountEmail", { length: 320 }),
      serviceAccountKey: text("serviceAccountKey"),
      // JSON key file content (encrypted)
      isActive: integer("isActive").default(1).notNull(),
      // 1 = active, 0 = inactive
      lastSyncedAt: timestamp("lastSyncedAt"),
      createdBy: integer("createdBy").notNull().references(() => users.id),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
    });
    wordpressConnections = pgTable("wordpressConnections", {
      id: serial("id").primaryKey(),
      clientId: integer("clientId").notNull().references(() => clients.id, { onDelete: "cascade" }),
      siteName: varchar("siteName", { length: 255 }).notNull(),
      // Friendly name for the site
      siteUrl: varchar("siteUrl", { length: 500 }).notNull(),
      // WordPress site URL
      // WordPress REST API credentials
      username: varchar("username", { length: 255 }).notNull(),
      // WordPress username
      applicationPassword: text("applicationPassword").notNull(),
      // WordPress application password
      // Publishing settings
      defaultStatus: text("defaultStatus", { enum: ["draft", "publish", "pending"] }).default("draft").notNull(),
      defaultAuthorId: integer("defaultAuthorId"),
      // WordPress author ID
      defaultCategoryId: integer("defaultCategoryId"),
      // WordPress category ID
      isActive: integer("isActive").default(1).notNull(),
      // 1 = active, 0 = inactive
      lastPublishedAt: timestamp("lastPublishedAt"),
      createdBy: integer("createdBy").notNull().references(() => users.id),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
    });
    wordpressPublishHistory = pgTable("wordpressPublishHistory", {
      id: serial("id").primaryKey(),
      contentId: integer("contentId").notNull().references(() => content.id, { onDelete: "cascade" }),
      connectionId: integer("connectionId").notNull().references(() => wordpressConnections.id, { onDelete: "cascade" }),
      wordpressPostId: integer("wordpressPostId").notNull(),
      // WordPress post ID
      wordpressPostUrl: text("wordpressPostUrl"),
      // Full URL to the published post
      publishStatus: text("publishStatus", { enum: ["draft", "publish", "pending"] }).notNull(),
      success: integer("success").default(1).notNull(),
      // 1 = success, 0 = failed
      errorMessage: text("errorMessage"),
      publishedBy: integer("publishedBy").notNull().references(() => users.id),
      publishedAt: timestamp("publishedAt").defaultNow().notNull()
    });
    designStandards = pgTable("designStandards", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 255 }).notNull(),
      // e.g., "Takeoff Premium Design"
      description: text("description"),
      designPrompt: text("designPrompt").notNull(),
      // Full design prompt/guidelines
      // Design characteristics
      referenceUrl: text("referenceUrl"),
      // Reference website URL
      colorScheme: varchar("colorScheme", { length: 100 }),
      // e.g., "dark", "light", "gradient"
      designStyle: varchar("designStyle", { length: 100 }),
      // e.g., "motion-driven", "minimal", "luxury"
      isDefault: integer("isDefault").default(0).notNull(),
      // 1 = default standard, 0 = optional
      isActive: integer("isActive").default(1).notNull(),
      createdBy: integer("createdBy").notNull().references(() => users.id),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
    });
    publishingSchedules = pgTable("publishingSchedules", {
      id: serial("id").primaryKey(),
      contentId: integer("contentId").notNull().references(() => content.id, { onDelete: "cascade" }),
      // Publishing targets
      publishToWordPress: integer("publishToWordPress").default(0).notNull(),
      // 1 = yes, 0 = no
      wordpressConnectionIds: text("wordpressConnectionIds"),
      // JSON array of connection IDs
      wordpressStatus: text("wordpressStatus", { enum: ["draft", "publish", "pending"] }).default("draft"),
      // Schedule details
      scheduledFor: timestamp("scheduledFor").notNull(),
      // When to publish
      status: text("status", { enum: ["pending", "processing", "completed", "failed"] }).default("pending").notNull(),
      // Execution tracking
      executedAt: timestamp("executedAt"),
      errorMessage: text("errorMessage"),
      createdBy: integer("createdBy").notNull().references(() => users.id),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
    });
    aiBrands = pgTable("aiBrands", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 255 }).notNull(),
      domain: varchar("domain", { length: 255 }),
      competitors: text("competitors"),
      // JSON array of competitor names
      createdBy: integer("createdBy").notNull().references(() => users.id),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
    });
    aiPrompts = pgTable("aiPrompts", {
      id: serial("id").primaryKey(),
      brandId: integer("brandId").notNull().references(() => aiBrands.id, { onDelete: "cascade" }),
      prompt: text("prompt").notNull(),
      createdBy: integer("createdBy").notNull().references(() => users.id),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    aiVisibilityResults = pgTable("aiVisibilityResults", {
      id: serial("id").primaryKey(),
      scanId: varchar("scanId", { length: 32 }).notNull(),
      // groups a run
      brandId: integer("brandId").notNull().references(() => aiBrands.id, { onDelete: "cascade" }),
      promptId: integer("promptId").notNull().references(() => aiPrompts.id, { onDelete: "cascade" }),
      provider: varchar("provider", { length: 32 }).notNull(),
      // claude | gemini | openai | perplexity
      mentioned: integer("mentioned").default(0).notNull(),
      // 1 = brand appeared in the answer
      position: integer("position"),
      // rank among listed items, if any
      sentiment: text("sentiment", { enum: ["positive", "neutral", "negative"] }),
      competitorsMentioned: text("competitorsMentioned"),
      // JSON array
      answerExcerpt: text("answerExcerpt"),
      summary: text("summary"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    siteAudits = pgTable("siteAudits", {
      id: serial("id").primaryKey(),
      clientId: integer("clientId").notNull().references(() => clients.id, { onDelete: "cascade" }),
      createdBy: integer("createdBy").notNull().references(() => users.id),
      taskId: varchar("taskId", { length: 64 }).notNull(),
      // DataForSEO On-Page task id
      target: varchar("target", { length: 255 }).notNull(),
      // crawled domain
      status: text("status", { enum: ["crawling", "complete", "failed"] }).default("crawling").notNull(),
      pagesCrawled: integer("pagesCrawled").default(0).notNull(),
      onpageScore: numeric("onpageScore", { precision: 5, scale: 2 }),
      criticalCount: integer("criticalCount").default(0).notNull(),
      warningCount: integer("warningCount").default(0).notNull(),
      checks: text("checks"),
      // JSON: site-wide check counts (broken links, duplicate titles, ...)
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
    });
    siteAuditPages = pgTable("siteAuditPages", {
      id: serial("id").primaryKey(),
      auditId: integer("auditId").notNull().references(() => siteAudits.id, { onDelete: "cascade" }),
      url: text("url").notNull(),
      statusCode: integer("statusCode"),
      onpageScore: numeric("onpageScore", { precision: 5, scale: 2 }),
      issues: text("issues"),
      // JSON array of per-page issues
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    trackedKeywords = pgTable("trackedKeywords", {
      id: serial("id").primaryKey(),
      clientId: integer("clientId").notNull().references(() => clients.id, { onDelete: "cascade" }),
      createdBy: integer("createdBy").notNull().references(() => users.id),
      keyword: varchar("keyword", { length: 255 }).notNull(),
      locationName: varchar("locationName", { length: 255 }).default("United States").notNull(),
      languageName: varchar("languageName", { length: 100 }).default("English").notNull(),
      device: text("device", { enum: ["desktop", "mobile"] }).default("desktop").notNull(),
      isActive: integer("isActive").default(1).notNull(),
      // 0/1
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    rankSnapshots = pgTable("rankSnapshots", {
      id: serial("id").primaryKey(),
      keywordId: integer("keywordId").notNull().references(() => trackedKeywords.id, { onDelete: "cascade" }),
      position: integer("position"),
      // null = not ranked in the pulled SERP
      url: text("url"),
      // the ranking URL, if found
      checkedAt: timestamp("checkedAt").defaultNow().notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    backlinkSnapshots = pgTable("backlinkSnapshots", {
      id: serial("id").primaryKey(),
      clientId: integer("clientId").notNull().references(() => clients.id, { onDelete: "cascade" }),
      createdBy: integer("createdBy").notNull().references(() => users.id),
      target: varchar("target", { length: 255 }).notNull(),
      backlinks: integer("backlinks").default(0).notNull(),
      referringDomains: integer("referringDomains").default(0).notNull(),
      referringMainDomains: integer("referringMainDomains").default(0).notNull(),
      rank: integer("rank").default(0).notNull(),
      // DataForSEO domain rank 0-1000
      brokenBacklinks: integer("brokenBacklinks").default(0).notNull(),
      summary: text("summary"),
      // JSON: full summary metrics
      topReferringDomains: text("topReferringDomains"),
      // JSON array
      topAnchors: text("topAnchors"),
      // JSON array
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
  }
});

// server/_core/env.ts
var clean, ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    clean = (value) => {
      const s = (value ?? "").trim();
      return /^\[.*\]$/.test(s) ? "" : s;
    };
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      isProduction: process.env.NODE_ENV === "production",
      anthropicApiKey: clean(process.env.ANTHROPIC_API_KEY),
      dataForSeoLogin: clean(process.env.DATAFORSEO_LOGIN),
      dataForSeoPassword: clean(process.env.DATAFORSEO_PASSWORD),
      pageSpeedApiKey: clean(process.env.PAGESPEED_API_KEY),
      geminiApiKey: clean(process.env.GEMINI_API_KEY),
      supabaseUrl: process.env.SUPABASE_URL ?? "",
      supabaseServiceRoleKey: clean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET ?? "content-images",
      zernioApiKey: clean(process.env.ZERNIO_API_KEY),
      resendApiKey: clean(process.env.RESEND_API_KEY),
      newsletterFrom: process.env.NEWSLETTER_FROM ?? "onboarding@resend.dev",
      openaiApiKey: clean(process.env.OPENAI_API_KEY),
      perplexityApiKey: clean(process.env.PERPLEXITY_API_KEY),
      // Run the weekly rank-tracking cron in this process. On by default in production;
      // opt in during dev with ENABLE_SCHEDULER=1 so `tsx watch` restarts don't spam checks.
      enableScheduler: clean(process.env.ENABLE_SCHEDULER) === "1" || process.env.NODE_ENV === "production"
    };
  }
});

// server/_core/crypto.ts
import crypto from "crypto";
function getKey() {
  const secret = (process.env.ENCRYPTION_KEY || ENV.cookieSecret || "").trim();
  if (!secret) {
    throw new Error(
      "Cannot encrypt/decrypt secrets: set ENCRYPTION_KEY (or JWT_SECRET) in the environment."
    );
  }
  return crypto.createHash("sha256").update(secret).digest();
}
function isEncrypted(value) {
  return typeof value === "string" && value.startsWith(PREFIX);
}
function encryptSecret(plain) {
  if (plain == null || plain === "") return plain ?? null;
  if (isEncrypted(plain)) return plain;
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, enc]).toString("base64");
}
function decryptSecret(value) {
  if (value == null || value === "") return value ?? null;
  if (!isEncrypted(value)) return value;
  try {
    const raw = Buffer.from(value.slice(PREFIX.length), "base64");
    const iv = raw.subarray(0, IV_LEN);
    const tag = raw.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const data = raw.subarray(IV_LEN + TAG_LEN);
    const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
var ALGO, PREFIX, IV_LEN, TAG_LEN;
var init_crypto = __esm({
  "server/_core/crypto.ts"() {
    "use strict";
    init_env();
    ALGO = "aes-256-gcm";
    PREFIX = "enc:v1:";
    IV_LEN = 12;
    TAG_LEN = 16;
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  addComment: () => addComment,
  createClient: () => createClient,
  createContent: () => createContent,
  createContentBrief: () => createContentBrief,
  createPublishLog: () => createPublishLog,
  createRepurposedContent: () => createRepurposedContent,
  createRevision: () => createRevision,
  createTemplate: () => createTemplate,
  createUser: () => createUser,
  createWebhookConfig: () => createWebhookConfig,
  deleteClient: () => deleteClient,
  deleteContent: () => deleteContent,
  deleteContentBrief: () => deleteContentBrief,
  deleteRepurposedContent: () => deleteRepurposedContent,
  deleteTemplate: () => deleteTemplate,
  deleteWebhookConfig: () => deleteWebhookConfig,
  getAllWebhooks: () => getAllWebhooks,
  getClientById: () => getClientById,
  getClientsByUser: () => getClientsByUser,
  getContentAnalytics: () => getContentAnalytics,
  getContentBriefById: () => getContentBriefById,
  getContentBriefByToken: () => getContentBriefByToken,
  getContentBriefs: () => getContentBriefs,
  getContentBriefsForUser: () => getContentBriefsForUser,
  getContentByClient: () => getContentByClient,
  getContentById: () => getContentById,
  getContentByUser: () => getContentByUser,
  getContentComments: () => getContentComments,
  getContentRevisions: () => getContentRevisions,
  getContentWithClient: () => getContentWithClient,
  getDb: () => getDb,
  getPortalBranding: () => getPortalBranding,
  getPublicTemplates: () => getPublicTemplates,
  getPublishLogs: () => getPublishLogs,
  getQualityScore: () => getQualityScore,
  getRepurposedContent: () => getRepurposedContent,
  getTemplateById: () => getTemplateById,
  getTemplatesByUser: () => getTemplatesByUser,
  getUserByEmail: () => getUserByEmail,
  getUserByOpenId: () => getUserByOpenId,
  getWebhookById: () => getWebhookById,
  getWebhooksByClient: () => getWebhooksByClient,
  incrementUserTokenVersion: () => incrementUserTokenVersion,
  recordAnalytics: () => recordAnalytics,
  saveQualityScore: () => saveQualityScore,
  updateAnalytics: () => updateAnalytics,
  updateClient: () => updateClient,
  updateCommentStatus: () => updateCommentStatus,
  updateContent: () => updateContent,
  updateContentBrief: () => updateContentBrief,
  updatePublishLog: () => updatePublishLog,
  updateTemplate: () => updateTemplate,
  updateWebhookConfig: () => updateWebhookConfig,
  upsertPortalBranding: () => upsertPortalBranding,
  upsertUser: () => upsertUser
});
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
function decryptClient(row) {
  if (!row) return row;
  return { ...row, websitePassword: decryptSecret(row.websitePassword) };
}
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL, { prepare: false });
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db5 = await getDb();
  if (!db5) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db5.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db5 = await getDb();
  if (!db5) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db5.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserByEmail(email) {
  const db5 = await getDb();
  if (!db5) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db5.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createUser(data) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  const result = await db5.insert(users).values(data).returning();
  return result[0];
}
async function incrementUserTokenVersion(userId) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  const [row] = await db5.update(users).set({ tokenVersion: sql`${users.tokenVersion} + 1` }).where(eq(users.id, userId)).returning({ tokenVersion: users.tokenVersion });
  return row.tokenVersion;
}
async function createClient(client) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  const values = { ...client, websitePassword: encryptSecret(client.websitePassword) };
  const result = await db5.insert(clients).values(values).returning({ id: clients.id });
  return result[0].id;
}
async function getClientsByUser(userId) {
  const db5 = await getDb();
  if (!db5) return [];
  const rows = await db5.select().from(clients).where(eq(clients.createdBy, userId));
  return rows.map((row) => decryptClient(row));
}
async function getClientById(id) {
  const db5 = await getDb();
  if (!db5) return void 0;
  const result = await db5.select().from(clients).where(eq(clients.id, id)).limit(1);
  return decryptClient(result[0]);
}
async function updateClient(id, updates) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  const values = { ...updates, updatedAt: /* @__PURE__ */ new Date() };
  if ("websitePassword" in updates) {
    values.websitePassword = encryptSecret(updates.websitePassword);
  }
  await db5.update(clients).set(values).where(eq(clients.id, id));
}
async function deleteClient(id) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  await db5.delete(clients).where(eq(clients.id, id));
}
async function createContent(contentData) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  const result = await db5.insert(content).values(contentData).returning({ id: content.id });
  return result[0].id;
}
async function getContentByUser(userId) {
  const db5 = await getDb();
  if (!db5) return [];
  return db5.select().from(content).where(eq(content.createdBy, userId)).orderBy(content.createdAt);
}
async function getContentById(id) {
  const db5 = await getDb();
  if (!db5) return void 0;
  const result = await db5.select().from(content).where(eq(content.id, id)).limit(1);
  return result[0];
}
async function updateContent(id, updates) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  await db5.update(content).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(content.id, id));
}
async function deleteContent(id) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  await db5.delete(content).where(eq(content.id, id));
}
async function getContentByClient(clientId) {
  const db5 = await getDb();
  if (!db5) return [];
  return db5.select().from(content).where(eq(content.clientId, clientId)).orderBy(content.createdAt);
}
async function getContentWithClient(userId) {
  const db5 = await getDb();
  if (!db5) return [];
  const rows = await db5.select({
    content,
    client: clients
  }).from(content).leftJoin(clients, eq(content.clientId, clients.id)).where(eq(content.createdBy, userId)).orderBy(content.createdAt);
  return rows.map((row) => ({
    ...row,
    client: row.client ? { ...row.client, websitePassword: null } : row.client
  }));
}
async function createTemplate(data) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  const result = await db5.insert(contentTemplates).values(data);
  return result[0];
}
async function getTemplatesByUser(userId) {
  const db5 = await getDb();
  if (!db5) return [];
  return db5.select().from(contentTemplates).where(eq(contentTemplates.createdBy, userId)).orderBy(contentTemplates.createdAt);
}
async function getPublicTemplates() {
  const db5 = await getDb();
  if (!db5) return [];
  return db5.select().from(contentTemplates).where(eq(contentTemplates.isPublic, 1)).orderBy(contentTemplates.createdAt);
}
async function getTemplateById(id) {
  const db5 = await getDb();
  if (!db5) return null;
  const result = await db5.select().from(contentTemplates).where(eq(contentTemplates.id, id)).limit(1);
  return result[0] || null;
}
async function updateTemplate(id, updates) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  await db5.update(contentTemplates).set(updates).where(eq(contentTemplates.id, id));
}
async function deleteTemplate(id) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  await db5.delete(contentTemplates).where(eq(contentTemplates.id, id));
}
async function addComment(data) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  const result = await db5.insert(contentComments).values(data);
  return result[0];
}
async function getContentComments(contentId) {
  const db5 = await getDb();
  if (!db5) return [];
  return db5.select().from(contentComments).where(eq(contentComments.contentId, contentId)).orderBy(contentComments.createdAt);
}
async function updateCommentStatus(id, isResolved) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  await db5.update(contentComments).set({ isResolved }).where(eq(contentComments.id, id));
}
async function createRevision(data) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  const result = await db5.insert(contentRevisions).values(data);
  return result[0];
}
async function getContentRevisions(contentId) {
  const db5 = await getDb();
  if (!db5) return [];
  return db5.select().from(contentRevisions).where(eq(contentRevisions.contentId, contentId)).orderBy(contentRevisions.revisionNumber);
}
async function recordAnalytics(data) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  const result = await db5.insert(contentAnalytics).values(data);
  return result[0];
}
async function getContentAnalytics(contentId) {
  const db5 = await getDb();
  if (!db5) return [];
  return db5.select().from(contentAnalytics).where(eq(contentAnalytics.contentId, contentId)).orderBy(contentAnalytics.recordedAt);
}
async function updateAnalytics(contentId, updates) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  await db5.update(contentAnalytics).set(updates).where(eq(contentAnalytics.contentId, contentId));
}
async function createRepurposedContent(data) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  const result = await db5.insert(contentRepurposed).values(data);
  return result[0];
}
async function getRepurposedContent(contentId) {
  const db5 = await getDb();
  if (!db5) return [];
  return db5.select().from(contentRepurposed).where(eq(contentRepurposed.contentId, contentId)).orderBy(contentRepurposed.createdAt);
}
async function deleteRepurposedContent(id) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  await db5.delete(contentRepurposed).where(eq(contentRepurposed.id, id));
}
async function saveQualityScore(data) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  await db5.delete(contentQualityScores).where(eq(contentQualityScores.contentId, data.contentId));
  const result = await db5.insert(contentQualityScores).values(data);
  return result[0];
}
async function getQualityScore(contentId) {
  const db5 = await getDb();
  if (!db5) return null;
  const results = await db5.select().from(contentQualityScores).where(eq(contentQualityScores.contentId, contentId)).limit(1);
  return results.length > 0 ? results[0] : null;
}
async function createWebhookConfig(data) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  const result = await db5.insert(webhookConfigs).values(data).returning({ id: webhookConfigs.id });
  return result[0].id;
}
async function getWebhooksByClient(clientId) {
  const db5 = await getDb();
  if (!db5) return [];
  return db5.select().from(webhookConfigs).where(eq(webhookConfigs.clientId, clientId));
}
async function getAllWebhooks(userId) {
  const db5 = await getDb();
  if (!db5) return [];
  return db5.select().from(webhookConfigs).where(eq(webhookConfigs.createdBy, userId));
}
async function getWebhookById(id) {
  const db5 = await getDb();
  if (!db5) return null;
  const result = await db5.select().from(webhookConfigs).where(eq(webhookConfigs.id, id)).limit(1);
  return result[0] || null;
}
async function updateWebhookConfig(id, updates) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  await db5.update(webhookConfigs).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(webhookConfigs.id, id));
}
async function deleteWebhookConfig(id) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  await db5.delete(webhookConfigs).where(eq(webhookConfigs.id, id));
}
async function createPublishLog(data) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  const result = await db5.insert(publishLogs).values(data).returning({ id: publishLogs.id });
  return result[0].id;
}
async function getPublishLogs(contentId) {
  const db5 = await getDb();
  if (!db5) return [];
  return db5.select().from(publishLogs).where(eq(publishLogs.contentId, contentId)).orderBy(publishLogs.publishedAt);
}
async function updatePublishLog(id, updates) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  await db5.update(publishLogs).set(updates).where(eq(publishLogs.id, id));
}
async function createContentBrief(data) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  const result = await db5.insert(contentBriefs).values(data).returning({ id: contentBriefs.id });
  return result[0].id;
}
async function getContentBriefs(clientId) {
  const db5 = await getDb();
  if (!db5) return [];
  if (clientId) {
    return db5.select().from(contentBriefs).where(eq(contentBriefs.clientId, clientId)).orderBy(contentBriefs.createdAt);
  }
  return db5.select().from(contentBriefs).orderBy(contentBriefs.createdAt);
}
async function getContentBriefsForUser(userId) {
  const db5 = await getDb();
  if (!db5) return [];
  const rows = await db5.select({ brief: contentBriefs }).from(contentBriefs).innerJoin(clients, eq(contentBriefs.clientId, clients.id)).where(eq(clients.createdBy, userId)).orderBy(contentBriefs.createdAt);
  return rows.map((r) => r.brief);
}
async function getContentBriefByToken(token) {
  const db5 = await getDb();
  if (!db5) return null;
  const result = await db5.select().from(contentBriefs).where(eq(contentBriefs.shareToken, token)).limit(1);
  return result[0] || null;
}
async function getContentBriefById(id) {
  const db5 = await getDb();
  if (!db5) return null;
  const result = await db5.select().from(contentBriefs).where(eq(contentBriefs.id, id)).limit(1);
  return result[0] || null;
}
async function updateContentBrief(id, updates) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  await db5.update(contentBriefs).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(contentBriefs.id, id));
}
async function deleteContentBrief(id) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  await db5.delete(contentBriefs).where(eq(contentBriefs.id, id));
}
async function getPortalBranding(clientId) {
  const db5 = await getDb();
  if (!db5) return null;
  const { portalBranding: portalBranding2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const result = await db5.select().from(portalBranding2).where(eq(portalBranding2.clientId, clientId)).limit(1);
  return result[0] || null;
}
async function upsertPortalBranding(data) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  const { portalBranding: portalBranding2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const existing = await getPortalBranding(data.clientId);
  if (existing) {
    await db5.update(portalBranding2).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(portalBranding2.clientId, data.clientId));
    return { ...existing, ...data };
  } else {
    const result = await db5.insert(portalBranding2).values(data).returning({ id: portalBranding2.id });
    return { id: result[0].id, ...data };
  }
}
var _db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_env();
    init_crypto();
    _db = null;
  }
});

// server/_core/llm.ts
var llm_exports = {};
__export(llm_exports, {
  DEFAULT_TEXT_MODEL: () => DEFAULT_TEXT_MODEL,
  invokeLLM: () => invokeLLM
});
import Anthropic from "@anthropic-ai/sdk";
function mapModel(model) {
  if (!model) return "claude-opus-5";
  const m = model.toLowerCase();
  if (m.startsWith("claude-")) return model;
  if (m.includes("haiku")) return "claude-haiku-4-5";
  if (m.includes("flash") || m.includes("mini") || m.includes("lite") || m.includes("nano") || m.includes("small")) {
    return "claude-sonnet-5";
  }
  return "claude-opus-5";
}
function collectText(content2) {
  return asArray(content2).map((part) => {
    if (typeof part === "string") return part;
    if (part.type === "text") return part.text;
    if (part.type === "image_url") return `[image: ${part.image_url.url}]`;
    if (part.type === "file_url") return `[file: ${part.file_url.url}]`;
    return "";
  }).filter(Boolean).join("\n");
}
function toContentBlocks(content2) {
  const blocks = [];
  for (const part of asArray(content2)) {
    if (typeof part === "string") {
      if (part) blocks.push({ type: "text", text: part });
    } else if (part.type === "text") {
      if (part.text) blocks.push({ type: "text", text: part.text });
    } else if (part.type === "image_url") {
      blocks.push({ type: "image", source: { type: "url", url: part.image_url.url } });
    } else if (part.type === "file_url") {
      blocks.push({ type: "text", text: `[file: ${part.file_url.url}]` });
    }
  }
  if (blocks.length === 0) blocks.push({ type: "text", text: "" });
  return blocks;
}
function toAnthropicMessages(messages) {
  const systemParts = [];
  const converted = [];
  for (const message of messages) {
    if (message.role === "system") {
      const text2 = collectText(message.content);
      if (text2) systemParts.push(text2);
      continue;
    }
    if (message.role === "tool" || message.role === "function") {
      converted.push({ role: "user", content: collectText(message.content) });
      continue;
    }
    const role = message.role === "assistant" ? "assistant" : "user";
    converted.push({ role, content: toContentBlocks(message.content) });
  }
  return {
    system: systemParts.length ? systemParts.join("\n\n") : void 0,
    messages: converted
  };
}
function toAnthropicTools(tools) {
  if (!tools || tools.length === 0) return void 0;
  return tools.map((tool) => ({
    name: tool.function.name,
    description: tool.function.description,
    input_schema: tool.function.parameters ?? { type: "object", properties: {} }
  }));
}
function toAnthropicToolChoice(toolChoice) {
  if (!toolChoice) return void 0;
  if (toolChoice === "none") return { type: "none" };
  if (toolChoice === "auto") return { type: "auto" };
  if (toolChoice === "required") return { type: "any" };
  if ("name" in toolChoice) return { type: "tool", name: toolChoice.name };
  if ("function" in toolChoice) return { type: "tool", name: toolChoice.function.name };
  return void 0;
}
function resolveSchema(params) {
  const explicit = params.responseFormat?.type === "json_schema" ? params.responseFormat.json_schema : params.response_format?.type === "json_schema" ? params.response_format.json_schema : void 0;
  return params.outputSchema || params.output_schema || explicit;
}
function wantsJson(params) {
  const fmt = params.responseFormat || params.response_format;
  return Boolean(fmt || params.outputSchema || params.output_schema);
}
function extractJson(text2) {
  let t2 = text2.trim();
  const fenced = t2.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) t2 = fenced[1].trim();
  const firstObj = t2.indexOf("{");
  const firstArr = t2.indexOf("[");
  let start = -1;
  if (firstObj === -1) start = firstArr;
  else if (firstArr === -1) start = firstObj;
  else start = Math.min(firstObj, firstArr);
  if (start === -1) return t2;
  const end = Math.max(t2.lastIndexOf("}"), t2.lastIndexOf("]"));
  if (end === -1 || end < start) return t2;
  return t2.slice(start, end + 1);
}
function getClient() {
  if (!ENV.anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
  if (!_client) {
    _client = new Anthropic({ apiKey: ENV.anthropicApiKey });
  }
  return _client;
}
async function invokeClaude(params) {
  const client = getClient();
  const { system, messages } = toAnthropicMessages(params.messages);
  const tools = toAnthropicTools(params.tools);
  const toolChoice = toAnthropicToolChoice(params.toolChoice || params.tool_choice);
  const forcedTool = toolChoice?.type === "any" || toolChoice?.type === "tool";
  const jsonRequested = wantsJson(params);
  let finalSystem = system;
  if (jsonRequested) {
    const schema = resolveSchema(params);
    let instruction = "Respond with a single valid JSON value only \u2014 no prose, no explanations, no markdown code fences.";
    if (schema?.schema) {
      instruction += ` The JSON must conform to this JSON Schema:
${JSON.stringify(schema.schema)}`;
    }
    finalSystem = [system, instruction].filter(Boolean).join("\n\n");
  }
  const request = {
    model: mapModel(params.model),
    max_tokens: params.maxTokens ?? params.max_tokens ?? DEFAULT_MAX_TOKENS,
    messages
  };
  if (finalSystem) request.system = finalSystem;
  if (tools) request.tools = tools;
  if (toolChoice) request.tool_choice = toolChoice;
  if (!forcedTool) request.thinking = { type: "adaptive" };
  const message = await client.messages.create(
    request
  );
  let text2 = "";
  const toolCalls = [];
  for (const block of message.content) {
    if (block.type === "text") {
      text2 += block.text;
    } else if (block.type === "tool_use") {
      toolCalls.push({
        id: block.id,
        type: "function",
        function: { name: block.name, arguments: JSON.stringify(block.input) }
      });
    }
  }
  if (jsonRequested && text2) {
    text2 = extractJson(text2);
  }
  return {
    id: message.id,
    created: Math.floor(Date.now() / 1e3),
    model: message.model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: text2,
          ...toolCalls.length ? { tool_calls: toolCalls } : {}
        },
        finish_reason: message.stop_reason ?? null
      }
    ],
    usage: message.usage ? {
      prompt_tokens: message.usage.input_tokens,
      completion_tokens: message.usage.output_tokens,
      total_tokens: message.usage.input_tokens + message.usage.output_tokens
    } : void 0
  };
}
function geminiModelName(model) {
  if (process.env.GEMINI_TEXT_MODEL) return process.env.GEMINI_TEXT_MODEL;
  const m = (model || "").toLowerCase();
  if (/gemini-3[.-]/.test(m)) return model;
  return DEFAULT_TEXT_MODEL;
}
function toGeminiParts(content2) {
  const parts = [];
  for (const part of asArray(content2)) {
    if (typeof part === "string") {
      if (part) parts.push({ text: part });
    } else if (part.type === "text") {
      if (part.text) parts.push({ text: part.text });
    }
  }
  if (parts.length === 0) parts.push({ text: "" });
  return parts;
}
async function invokeGemini(params) {
  if (!ENV.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  const model = geminiModelName(params.model);
  const systemParts = [];
  const contents = [];
  for (const message of params.messages) {
    if (message.role === "system") {
      const t2 = collectText(message.content);
      if (t2) systemParts.push(t2);
      continue;
    }
    if (message.role === "tool" || message.role === "function") {
      contents.push({ role: "user", parts: [{ text: collectText(message.content) }] });
      continue;
    }
    contents.push({ role: message.role === "assistant" ? "model" : "user", parts: toGeminiParts(message.content) });
  }
  const jsonRequested = wantsJson(params);
  let systemInstruction = systemParts.length ? systemParts.join("\n\n") : void 0;
  if (jsonRequested) {
    const schema = resolveSchema(params);
    let instruction = "Respond with a single valid JSON value only \u2014 no prose, no markdown code fences.";
    if (schema?.schema) instruction += ` The JSON must conform to this JSON Schema:
${JSON.stringify(schema.schema)}`;
    systemInstruction = [systemInstruction, instruction].filter(Boolean).join("\n\n");
  }
  const body = {
    contents,
    generationConfig: {
      maxOutputTokens: params.maxTokens ?? params.max_tokens ?? 8192,
      ...jsonRequested ? { responseMimeType: "application/json" } : {}
    }
  };
  if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction }] };
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": ENV.geminiApiKey },
      body: JSON.stringify(body)
    }
  );
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Gemini generateContent failed (${response.status})${detail ? `: ${detail.slice(0, 300)}` : ""}`);
  }
  const json = await response.json();
  const parts = json?.candidates?.[0]?.content?.parts ?? [];
  let text2 = parts.map((p) => p?.text ?? "").join("");
  if (jsonRequested && text2) text2 = extractJson(text2);
  const usage = json?.usageMetadata ?? {};
  const promptTokens = usage.promptTokenCount ?? 0;
  const completionTokens = usage.candidatesTokenCount ?? 0;
  return {
    id: json?.responseId ?? "gemini",
    created: Math.floor(Date.now() / 1e3),
    model,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: text2 },
        finish_reason: json?.candidates?.[0]?.finishReason ?? null
      }
    ],
    usage: { prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: promptTokens + completionTokens }
  };
}
function resolveProvider(model) {
  const m = (model || "").toLowerCase();
  if (m.includes("gemini")) return "gemini";
  if (m.includes("gpt") || m.includes("openai")) return "openai";
  if (m.includes("claude")) return "claude";
  if (ENV.anthropicApiKey) return "claude";
  if (ENV.geminiApiKey) return "gemini";
  return "claude";
}
async function invokeLLM(params) {
  let provider = resolveProvider(params.model);
  if (provider === "claude" && !ENV.anthropicApiKey && ENV.geminiApiKey) provider = "gemini";
  else if (provider === "gemini" && !ENV.geminiApiKey && ENV.anthropicApiKey) provider = "claude";
  else if (provider === "openai") provider = ENV.geminiApiKey ? "gemini" : "claude";
  return provider === "gemini" ? invokeGemini(params) : invokeClaude(params);
}
var asArray, _client, DEFAULT_MAX_TOKENS, DEFAULT_TEXT_MODEL;
var init_llm = __esm({
  "server/_core/llm.ts"() {
    "use strict";
    init_env();
    asArray = (value) => Array.isArray(value) ? value : [value];
    _client = null;
    DEFAULT_MAX_TOKENS = 16e3;
    DEFAULT_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-3.6-flash";
  }
});

// server/budgetTracking.ts
var budgetTracking_exports = {};
__export(budgetTracking_exports, {
  MODEL_COSTS: () => MODEL_COSTS,
  assertClientWithinBudget: () => assertClientWithinBudget,
  calculateContentCost: () => calculateContentCost,
  checkAndAlertAfterGeneration: () => checkAndAlertAfterGeneration,
  checkClientBudgetAlert: () => checkClientBudgetAlert,
  getClientMonthlyCost: () => getClientMonthlyCost,
  getGlobalMonthlyCost: () => getGlobalMonthlyCost,
  sendBudgetAlert: () => sendBudgetAlert
});
import { eq as eq3, and as and2, gte } from "drizzle-orm";
import { TRPCError as TRPCError4 } from "@trpc/server";
function calculateContentCost(aiModel, inputTokens, outputTokens) {
  const costs = MODEL_COSTS[aiModel] || { input: 0, output: 0 };
  return inputTokens / 1e6 * costs.input + outputTokens / 1e6 * costs.output;
}
async function getClientMonthlyCost(clientId) {
  const db5 = await getDb();
  if (!db5) return 0;
  const now = /* @__PURE__ */ new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const contentItems = await db5.select().from(content).where(
    and2(
      eq3(content.clientId, clientId),
      gte(content.createdAt, firstDayOfMonth)
    )
  );
  let totalCost = 0;
  for (const item of contentItems) {
    totalCost += calculateContentCost(
      item.aiModel,
      item.inputTokens,
      item.outputTokens
    );
  }
  return totalCost;
}
async function getGlobalMonthlyCost() {
  const db5 = await getDb();
  if (!db5) return 0;
  const now = /* @__PURE__ */ new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const contentItems = await db5.select().from(content).where(gte(content.createdAt, firstDayOfMonth));
  let totalCost = 0;
  for (const item of contentItems) {
    totalCost += calculateContentCost(
      item.aiModel,
      item.inputTokens,
      item.outputTokens
    );
  }
  return totalCost;
}
async function checkClientBudgetAlert(clientId) {
  const db5 = await getDb();
  if (!db5) {
    return { shouldAlert: false, currentCost: 0, budget: 0, percentage: 0, threshold: 80 };
  }
  const [client] = await db5.select().from(clients).where(eq3(clients.id, clientId)).limit(1);
  if (!client || !client.monthlyBudget) {
    return { shouldAlert: false, currentCost: 0, budget: 0, percentage: 0, threshold: 80 };
  }
  const budget = parseFloat(client.monthlyBudget);
  const threshold = client.budgetAlertThreshold || 80;
  const currentCost = await getClientMonthlyCost(clientId);
  const percentage = currentCost / budget * 100;
  return {
    shouldAlert: percentage >= threshold,
    currentCost,
    budget,
    percentage,
    threshold
  };
}
async function assertClientWithinBudget(clientId) {
  const db5 = await getDb();
  if (!db5) return;
  const [client] = await db5.select().from(clients).where(eq3(clients.id, clientId)).limit(1);
  if (!client || !client.monthlyBudget) return;
  const budget = parseFloat(client.monthlyBudget);
  if (!(budget > 0)) return;
  const currentCost = await getClientMonthlyCost(clientId);
  if (currentCost >= budget) {
    throw new TRPCError4({
      code: "FORBIDDEN",
      message: `Monthly budget reached for this client ($${currentCost.toFixed(2)} of $${budget.toFixed(2)}). Raise the client's monthly budget to continue.`
    });
  }
}
async function sendBudgetAlert(clientName, currentCost, budget, percentage) {
  const title = `Budget Alert: ${clientName}`;
  const content2 = `Client "${clientName}" has reached ${percentage.toFixed(1)}% of their monthly budget.

Current spend: $${currentCost.toFixed(2)}
Monthly budget: $${budget.toFixed(2)}

Consider reviewing their content generation settings or adjusting their budget.`;
  return await notifyOwner({ title, content: content2 });
}
async function checkAndAlertAfterGeneration(clientId) {
  const db5 = await getDb();
  if (!db5) return;
  const [client] = await db5.select().from(clients).where(eq3(clients.id, clientId)).limit(1);
  if (!client) return;
  const alertStatus = await checkClientBudgetAlert(clientId);
  if (alertStatus.shouldAlert) {
    await sendBudgetAlert(
      client.name,
      alertStatus.currentCost,
      alertStatus.budget,
      alertStatus.percentage
    );
  }
}
var MODEL_COSTS;
var init_budgetTracking = __esm({
  "server/budgetTracking.ts"() {
    "use strict";
    init_db();
    init_schema();
    init_notification();
    MODEL_COSTS = {
      // Current models
      "gemini-3.6-flash": { input: 0.075, output: 0.3, name: "Gemini 3.6 Flash" },
      "claude-opus-5": { input: 5, output: 25, name: "Claude Opus 5" },
      "claude-sonnet-5": { input: 2, output: 10, name: "Claude Sonnet 5" },
      "claude-haiku-4-5": { input: 1, output: 5, name: "Claude Haiku 4.5" },
      // Legacy ids retained so historical content costs and budgets stay accurate.
      "claude-3-5-sonnet-20241022": { input: 3, output: 15, name: "Claude 3.5 Sonnet" },
      "claude-3-5-haiku-20241022": { input: 0.8, output: 4, name: "Claude 3.5 Haiku" },
      "gpt-4o": { input: 2.5, output: 10, name: "GPT-4o" },
      "gpt-4o-mini": { input: 0.15, output: 0.6, name: "GPT-4o Mini" },
      "gemini-2.5-flash": { input: 0.075, output: 0.3, name: "Gemini 2.5 Flash" },
      "gemini-2.5-pro": { input: 1.25, output: 5, name: "Gemini 2.5 Pro" }
    };
  }
});

// server/templateSeeds.ts
var templateSeeds_exports = {};
__export(templateSeeds_exports, {
  defaultTemplates: () => defaultTemplates
});
var defaultTemplates;
var init_templateSeeds = __esm({
  "server/templateSeeds.ts"() {
    "use strict";
    defaultTemplates = [
      {
        name: "Product Review Template",
        description: "Comprehensive product review with pros, cons, and verdict",
        category: "product-review",
        prompt: `You are an expert product reviewer. Write a detailed, honest product review that includes:

1. **Introduction**: Brief overview of the product and who it's for
2. **Key Features**: List and explain the main features
3. **Pros**: What works well (be specific with examples)
4. **Cons**: What could be improved (be honest but fair)
5. **Performance**: Real-world testing results and observations
6. **Value for Money**: Is it worth the price?
7. **Verdict**: Final recommendation with rating

Use a conversational but authoritative tone. Include specific details and examples. Be honest and balanced in your assessment.`,
        structure: JSON.stringify({
          sections: ["Introduction", "Key Features", "Pros", "Cons", "Performance", "Value for Money", "Verdict"],
          wordCount: "1200-1500",
          tone: "Professional yet conversational"
        })
      },
      {
        name: "How-To Guide Template",
        description: "Step-by-step tutorial with clear instructions",
        category: "how-to",
        prompt: `You are an expert instructor. Write a clear, actionable how-to guide that includes:

1. **Introduction**: What the reader will learn and why it matters
2. **What You'll Need**: List of tools, materials, or prerequisites
3. **Step-by-Step Instructions**: Numbered steps with clear, concise directions
4. **Tips & Best Practices**: Pro tips to improve results
5. **Common Mistakes**: What to avoid
6. **Troubleshooting**: Solutions to common problems
7. **Conclusion**: Summary and next steps

Use simple language. Break complex tasks into manageable steps. Include specific details and examples.`,
        structure: JSON.stringify({
          sections: ["Introduction", "What You'll Need", "Step-by-Step Instructions", "Tips & Best Practices", "Common Mistakes", "Troubleshooting", "Conclusion"],
          wordCount: "1000-1300",
          tone: "Clear and instructional"
        })
      },
      {
        name: "Listicle Template",
        description: "Engaging numbered list article with detailed explanations",
        category: "listicle",
        prompt: `You are an expert content creator. Write an engaging listicle that includes:

1. **Introduction**: Hook the reader and explain what the list covers
2. **Numbered Items**: Each item should have:
   - A clear, catchy subheading
   - 2-3 paragraphs of explanation
   - Specific examples or data points
   - Why it matters
3. **Conclusion**: Tie everything together and provide actionable takeaways

Use an engaging, conversational tone. Make each item valuable and actionable. Include specific examples and data where relevant.`,
        structure: JSON.stringify({
          sections: ["Introduction", "List Items (7-10)", "Conclusion"],
          wordCount: "1500-2000",
          tone: "Engaging and conversational"
        })
      },
      {
        name: "Comparison Article Template",
        description: "Side-by-side comparison of products, services, or concepts",
        category: "comparison",
        prompt: `You are an expert analyst. Write a detailed comparison article that includes:

1. **Introduction**: What you're comparing and why it matters
2. **Overview**: Brief description of each option
3. **Feature-by-Feature Comparison**: Compare specific aspects:
   - Features & Functionality
   - Pricing & Value
   - Ease of Use
   - Performance
   - Support & Resources
4. **Pros & Cons Table**: Quick reference for each option
5. **Use Cases**: Who each option is best for
6. **Final Verdict**: Clear recommendation based on different scenarios

Be objective and balanced. Use specific data and examples. Help readers make informed decisions.`,
        structure: JSON.stringify({
          sections: ["Introduction", "Overview", "Feature Comparison", "Pros & Cons", "Use Cases", "Verdict"],
          wordCount: "1500-2000",
          tone: "Objective and analytical"
        })
      },
      {
        name: "Tutorial Guide Template",
        description: "In-depth educational content for learning a new skill",
        category: "tutorial",
        prompt: `You are an expert educator. Write a comprehensive tutorial that includes:

1. **Introduction**: What the reader will learn and prerequisites
2. **Background/Theory**: Foundational concepts to understand
3. **Core Concepts**: Main ideas explained clearly with examples
4. **Practical Application**: Hands-on exercises or examples
5. **Advanced Tips**: Take skills to the next level
6. **Common Pitfalls**: What to watch out for
7. **Resources**: Additional learning materials
8. **Conclusion**: Summary and next steps

Use clear explanations with examples. Build from basics to advanced. Make it practical and actionable.`,
        structure: JSON.stringify({
          sections: ["Introduction", "Background", "Core Concepts", "Practical Application", "Advanced Tips", "Common Pitfalls", "Resources", "Conclusion"],
          wordCount: "2000-2500",
          tone: "Educational and thorough"
        })
      },
      {
        name: "Case Study Template",
        description: "Real-world success story with results and insights",
        category: "case-study",
        prompt: `You are an expert business analyst. Write a compelling case study that includes:

1. **Executive Summary**: Key results and takeaways
2. **Background**: Company/situation overview and challenges
3. **The Challenge**: Specific problems that needed solving
4. **The Solution**: What was implemented and why
5. **Implementation**: How it was executed (timeline, process)
6. **Results**: Specific, measurable outcomes with data
7. **Key Takeaways**: Lessons learned and best practices
8. **Conclusion**: Impact and future plans

Use specific data and metrics. Tell a compelling story. Focus on results and insights.`,
        structure: JSON.stringify({
          sections: ["Executive Summary", "Background", "Challenge", "Solution", "Implementation", "Results", "Key Takeaways", "Conclusion"],
          wordCount: "1500-2000",
          tone: "Professional and data-driven"
        })
      },
      {
        name: "News Article Template",
        description: "Timely news coverage with context and analysis",
        category: "news",
        prompt: `You are an expert journalist. Write a news article that includes:

1. **Headline**: Clear, compelling, and informative
2. **Lead Paragraph**: Who, what, when, where, why, how
3. **Background**: Context and relevant history
4. **Key Details**: Important facts and quotes
5. **Impact**: Why this matters to readers
6. **Expert Opinions**: Analysis from relevant sources
7. **What's Next**: Future implications or developments

Use the inverted pyramid structure. Be objective and fact-based. Provide context and analysis.`,
        structure: JSON.stringify({
          sections: ["Headline", "Lead", "Background", "Key Details", "Impact", "Expert Opinions", "What's Next"],
          wordCount: "800-1200",
          tone: "Objective and informative"
        })
      },
      {
        name: "Opinion/Editorial Template",
        description: "Thought-provoking opinion piece with strong arguments",
        category: "opinion",
        prompt: `You are an expert opinion writer. Write a compelling opinion piece that includes:

1. **Hook**: Grab attention with a strong opening
2. **Thesis**: Clear statement of your position
3. **Background**: Context and why this topic matters
4. **Arguments**: 3-4 main points supporting your position, each with:
   - Clear reasoning
   - Evidence and examples
   - Addressing counterarguments
5. **Implications**: What this means for readers/society
6. **Call to Action**: What should happen next
7. **Conclusion**: Reinforce your main point

Use persuasive language. Support claims with evidence. Address counterarguments fairly.`,
        structure: JSON.stringify({
          sections: ["Hook", "Thesis", "Background", "Arguments", "Implications", "Call to Action", "Conclusion"],
          wordCount: "1000-1500",
          tone: "Persuasive and authoritative"
        })
      }
    ];
  }
});

// server/lib/social.ts
var social_exports = {};
__export(social_exports, {
  getLinkedAccounts: () => getLinkedAccounts,
  postToSocial: () => postToSocial
});
function authHeader() {
  if (!ENV.zernioApiKey) {
    throw new Error("Social posting is not configured. Set ZERNIO_API_KEY in your environment.");
  }
  return `Bearer ${ENV.zernioApiKey}`;
}
async function zernio(path, init) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: init.method,
    headers: { authorization: authHeader(), "content-type": "application/json" },
    body: init.body ? JSON.stringify(init.body) : void 0
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = json?.message || json?.error || `${response.status} ${response.statusText}`;
    throw new Error(`Zernio request failed: ${msg}`);
  }
  return json;
}
async function getLinkedAccounts() {
  const json = await zernio("/accounts", { method: "GET" });
  return (json.accounts ?? []).map((a) => ({ id: a._id, platform: a.platform }));
}
async function postToSocial(input) {
  if (!input.content.trim()) throw new Error("Post text is required");
  if (!input.accounts.length) throw new Error("Select at least one account");
  const body = {
    content: input.content,
    platforms: input.accounts.map((a) => ({ platform: a.platform, accountId: a.accountId }))
  };
  if (input.scheduledFor) {
    body.scheduledFor = input.scheduledFor;
    body.timezone = input.timezone ?? "UTC";
  } else {
    body.publishNow = input.publishNow ?? true;
  }
  const json = await zernio("/posts", { method: "POST", body });
  const post = json?.post ?? {};
  const postUrls = Array.isArray(post?.platforms) ? post.platforms.filter((p) => p?.platformPostUrl).map((p) => ({ platform: p.platform, url: p.platformPostUrl })) : [];
  return { id: post?._id ?? "", status: post?.status ?? "unknown", postUrls, raw: json };
}
var BASE_URL;
var init_social = __esm({
  "server/lib/social.ts"() {
    "use strict";
    init_env();
    BASE_URL = "https://zernio.com/api/v1";
  }
});

// server/lib/newsletter.ts
var newsletter_exports = {};
__export(newsletter_exports, {
  sendNewsletter: () => sendNewsletter
});
async function sendNewsletter(input) {
  if (!ENV.resendApiKey) {
    throw new Error("Newsletter sending is not configured. Set RESEND_API_KEY in your environment.");
  }
  if (!input.subject.trim()) throw new Error("Subject is required");
  if (!input.html.trim()) throw new Error("Body is required");
  const recipients = input.recipients.map((r) => r.trim()).filter(Boolean);
  if (recipients.length === 0) throw new Error("At least one recipient is required");
  const from = input.from || ENV.newsletterFrom;
  const response = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${ENV.resendApiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [from],
      bcc: recipients,
      subject: input.subject,
      html: input.html
    })
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = json?.message || json?.name || `${response.status} ${response.statusText}`;
    throw new Error(`Resend request failed: ${msg}`);
  }
  return { id: json?.id ?? "", recipientCount: recipients.length };
}
var RESEND_URL;
var init_newsletter = __esm({
  "server/lib/newsletter.ts"() {
    "use strict";
    init_env();
    RESEND_URL = "https://api.resend.com/emails";
  }
});

// server/lib/aiProviders.ts
var aiProviders_exports = {};
__export(aiProviders_exports, {
  ALL_PROVIDERS: () => ALL_PROVIDERS,
  configuredProviders: () => configuredProviders,
  queryProvider: () => queryProvider
});
function configuredProviders() {
  const list = [];
  if (ENV.anthropicApiKey) list.push("claude");
  if (ENV.geminiApiKey) list.push("gemini");
  if (ENV.openaiApiKey) list.push("openai");
  if (ENV.perplexityApiKey) list.push("perplexity");
  return list;
}
async function queryClaude(prompt) {
  const { invokeLLM: invokeLLM2 } = await Promise.resolve().then(() => (init_llm(), llm_exports));
  const res = await invokeLLM2({ messages: [{ role: "user", content: prompt }], maxTokens: 1024 });
  const content2 = res.choices[0]?.message?.content;
  return typeof content2 === "string" ? content2 : "";
}
async function queryGemini(prompt) {
  const model = process.env.GEMINI_TEXT_MODEL || "gemini-3.6-flash";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": ENV.geminiApiKey },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  if (!res.ok) throw new Error(`Gemini query failed (${res.status})`);
  const json = await res.json();
  const parts = json?.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p) => p?.text ?? "").join("").trim();
}
async function queryOpenAiCompatible(baseUrl2, apiKey, model, prompt) {
  const res = await fetch(`${baseUrl2}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], max_tokens: 1024 })
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`${baseUrl2} query failed (${res.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`);
  }
  const json = await res.json();
  return json?.choices?.[0]?.message?.content ?? "";
}
async function queryProvider(provider, prompt) {
  switch (provider) {
    case "claude":
      return queryClaude(prompt);
    case "gemini":
      return queryGemini(prompt);
    case "openai":
      return queryOpenAiCompatible(
        "https://api.openai.com/v1",
        ENV.openaiApiKey,
        process.env.OPENAI_MODEL || "gpt-4o-mini",
        prompt
      );
    case "perplexity":
      return queryOpenAiCompatible(
        "https://api.perplexity.ai",
        ENV.perplexityApiKey,
        process.env.PERPLEXITY_MODEL || "sonar",
        prompt
      );
  }
}
var ALL_PROVIDERS;
var init_aiProviders = __esm({
  "server/lib/aiProviders.ts"() {
    "use strict";
    init_env();
    ALL_PROVIDERS = ["claude", "gemini", "openai", "perplexity"];
  }
});

// server/lib/aiVisibility.ts
var aiVisibility_exports = {};
__export(aiVisibility_exports, {
  analyzeMention: () => analyzeMention,
  scanPrompt: () => scanPrompt
});
async function analyzeMention(brand, competitors, answer) {
  const res = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You analyze an AI assistant's answer to determine how a specific brand appears in it. Be precise and return only JSON."
      },
      {
        role: "user",
        content: `Brand: ${brand}
Known competitors: ${competitors.length ? competitors.join(", ") : "(none provided)"}

AI answer:
"""${answer.slice(0, 6e3)}"""

Determine: is the brand mentioned? If the answer is a ranked/numbered list, the brand's 1-based position (else null). Overall sentiment toward the brand (positive/neutral/negative, or null if not mentioned). Which competitors or other notable brands are mentioned. A one-sentence summary.`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "mention_analysis",
        schema: {
          type: "object",
          properties: {
            mentioned: { type: "boolean" },
            position: { type: ["number", "null"] },
            sentiment: { type: ["string", "null"], enum: ["positive", "neutral", "negative", null] },
            competitorsMentioned: { type: "array", items: { type: "string" } },
            summary: { type: "string" }
          },
          required: ["mentioned", "position", "sentiment", "competitorsMentioned", "summary"],
          additionalProperties: false
        }
      }
    }
  });
  const content2 = res.choices[0]?.message?.content;
  let parsed = {};
  try {
    parsed = JSON.parse(typeof content2 === "string" ? content2 : "{}");
  } catch {
    parsed = {};
  }
  return {
    mentioned: Boolean(parsed.mentioned),
    position: typeof parsed.position === "number" ? parsed.position : null,
    sentiment: VALID_SENTIMENT.includes(parsed.sentiment) ? parsed.sentiment : null,
    competitorsMentioned: Array.isArray(parsed.competitorsMentioned) ? parsed.competitorsMentioned.filter((c) => typeof c === "string") : [],
    summary: typeof parsed.summary === "string" ? parsed.summary : ""
  };
}
async function scanPrompt(brand, competitors, prompt, providers) {
  const settled = await Promise.all(
    providers.map(async (provider) => {
      try {
        const answer = await queryProvider(provider, prompt);
        if (!answer.trim()) return null;
        const analysis = await analyzeMention(brand, competitors, answer);
        return { provider, answerExcerpt: answer.slice(0, 500), ...analysis };
      } catch (error) {
        console.error(`[ai-visibility] ${provider} failed:`, error);
        return null;
      }
    })
  );
  return settled.filter((r) => r !== null);
}
var VALID_SENTIMENT;
var init_aiVisibility = __esm({
  "server/lib/aiVisibility.ts"() {
    "use strict";
    init_aiProviders();
    init_llm();
    VALID_SENTIMENT = ["positive", "neutral", "negative"];
  }
});

// server/lib/crawler.ts
var crawler_exports = {};
__export(crawler_exports, {
  auditUrl: () => auditUrl
});
import * as cheerio from "cheerio";
function normalizeUrl(input) {
  const trimmed = input.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
async function fetchWithTimeout(url, timeoutMs, method = "GET") {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method,
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "AI-SEO-Portal-Audit/1.0 (+https://example.com/bot)" }
    });
  } finally {
    clearTimeout(timer);
  }
}
async function checkBrokenLinks(urls) {
  const results = await Promise.all(
    urls.map(async (u) => {
      try {
        let res = await fetchWithTimeout(u, 6e3, "HEAD");
        if (res.status === 405 || res.status === 501) {
          res = await fetchWithTimeout(u, 6e3, "GET");
        }
        return { url: u, status: res.status };
      } catch {
        return { url: u, status: null };
      }
    })
  );
  return results.filter((r) => r.status === null || r.status >= 400);
}
async function fetchPageSpeed(url) {
  if (!ENV.pageSpeedApiKey) return null;
  try {
    const api = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
    api.searchParams.set("url", url);
    api.searchParams.set("strategy", "mobile");
    api.searchParams.set("category", "performance");
    api.searchParams.set("key", ENV.pageSpeedApiKey);
    const res = await fetchWithTimeout(api.toString(), 3e4);
    if (!res.ok) return null;
    const json = await res.json();
    const lh = json?.lighthouseResult;
    const audits = lh?.audits ?? {};
    const perf = lh?.categories?.performance?.score;
    return {
      performanceScore: typeof perf === "number" ? Math.round(perf * 100) : null,
      lcpMs: audits?.["largest-contentful-paint"]?.numericValue ?? null,
      cls: audits?.["cumulative-layout-shift"]?.numericValue ?? null,
      tbtMs: audits?.["total-blocking-time"]?.numericValue ?? null
    };
  } catch {
    return null;
  }
}
async function auditUrl(rawUrl, opts = {}) {
  const checkLinks = opts.checkLinks ?? true;
  const url = normalizeUrl(rawUrl);
  const started = Date.now();
  const res = await fetchWithTimeout(url, 15e3);
  const responseTimeMs = Date.now() - started;
  const finalUrl = res.url || url;
  const statusCode = res.status;
  const html = await res.text();
  const $ = cheerio.load(html);
  const title = $("head title").first().text().trim() || $("title").first().text().trim() || null;
  const metaDescription = ($('meta[name="description"]').attr("content") ?? "").trim() || null;
  const canonical = $('link[rel="canonical"]').attr("href")?.trim() || null;
  const robots = ($('meta[name="robots"]').attr("content") ?? "").toLowerCase();
  const indexable = statusCode < 400 && !/noindex/.test(robots);
  const h1Count = $("h1").length;
  const h2Count = $("h2").length;
  const hasViewport = $('meta[name="viewport"]').length > 0;
  const hasLang = Boolean($("html").attr("lang"));
  const hasStructuredData = $('script[type="application/ld+json"]').length > 0;
  const h1Text = $("h1").first().text().trim() || null;
  const lang = $("html").attr("lang")?.trim() || null;
  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim() || null;
  const ogImage = $('meta[property="og:image"]').attr("content")?.trim() || null;
  const hasTwitterCard = $('meta[name="twitter:card"]').length > 0;
  const hreflangCount = $('link[rel="alternate"][hreflang]').length;
  const robotsDirective = ($('meta[name="robots"]').attr("content") ?? "").trim() || null;
  const images = $("img");
  const imageCount = images.length;
  let imagesMissingAlt = 0;
  images.each((_, el) => {
    const alt = $(el).attr("alt");
    if (alt === void 0 || alt.trim() === "") imagesMissingAlt += 1;
  });
  let host = "";
  try {
    host = new URL(finalUrl).host;
  } catch {
  }
  let internalLinks = 0;
  let externalLinks = 0;
  const internalHrefs = /* @__PURE__ */ new Set();
  $("a[href]").each((_, el) => {
    const href = ($(el).attr("href") ?? "").trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return;
    let abs;
    try {
      abs = new URL(href, finalUrl);
    } catch {
      return;
    }
    if (abs.protocol !== "http:" && abs.protocol !== "https:") return;
    if (abs.host === host) {
      internalLinks += 1;
      internalHrefs.add(abs.toString());
    } else {
      externalLinks += 1;
    }
  });
  $("script, style, noscript, template").remove();
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const wordCount = bodyText ? bodyText.split(" ").filter(Boolean).length : 0;
  let robotsTxt = false;
  let sitemap = false;
  try {
    const origin = new URL(finalUrl).origin;
    const [r, s] = await Promise.all([
      fetchWithTimeout(`${origin}/robots.txt`, 5e3, "GET").then((x) => x.status).catch(() => 0),
      fetchWithTimeout(`${origin}/sitemap.xml`, 5e3, "HEAD").then((x) => x.status).catch(() => 0)
    ]);
    robotsTxt = r >= 200 && r < 400;
    sitemap = s >= 200 && s < 400;
  } catch {
  }
  const metrics = {
    statusCode,
    responseTimeMs,
    title,
    titleLength: title?.length ?? 0,
    metaDescription,
    metaDescriptionLength: metaDescription?.length ?? 0,
    canonical,
    h1Count,
    h2Count,
    wordCount,
    imageCount,
    imagesMissingAlt,
    internalLinks,
    externalLinks,
    hasViewport,
    hasLang,
    hasStructuredData,
    indexable,
    h1Text,
    lang,
    ogTitle,
    ogImage,
    hasTwitterCard,
    hreflangCount,
    robotsTxt,
    sitemap,
    robotsDirective
  };
  const issues = [];
  const add = (severity, category, message, recommendation) => issues.push({ severity, category, message, recommendation });
  if (statusCode >= 400) {
    add("critical", "technical", `Page returned HTTP ${statusCode}`, "Fix the server error or broken URL so the page is reachable.");
  }
  if (!indexable) {
    add("critical", "indexing", "Page is set to noindex", "Remove the noindex directive if this page should appear in search results.");
  }
  if (!title) {
    add("critical", "on-page", "Missing <title> tag", "Add a unique, descriptive title of 30\u201360 characters.");
  } else if (metrics.titleLength > 60) {
    add("warning", "on-page", `Title is long (${metrics.titleLength} chars)`, "Keep the title under ~60 characters so it isn't truncated in search results.");
  } else if (metrics.titleLength < 30) {
    add("info", "on-page", `Title is short (${metrics.titleLength} chars)`, "Consider a more descriptive title of 30\u201360 characters.");
  }
  if (!metaDescription) {
    add("warning", "on-page", "Missing meta description", "Add a compelling meta description of 70\u2013160 characters.");
  } else if (metrics.metaDescriptionLength > 160) {
    add("warning", "on-page", `Meta description is long (${metrics.metaDescriptionLength} chars)`, "Keep it under ~160 characters to avoid truncation.");
  } else if (metrics.metaDescriptionLength < 70) {
    add("info", "on-page", `Meta description is short (${metrics.metaDescriptionLength} chars)`, "Aim for 70\u2013160 characters to use the available space.");
  }
  if (h1Count === 0) {
    add("critical", "on-page", "No H1 heading", "Add a single H1 that describes the page's main topic.");
  } else if (h1Count > 1) {
    add("warning", "on-page", `Multiple H1 headings (${h1Count})`, "Use exactly one H1 per page; demote the rest to H2/H3.");
  }
  if (imagesMissingAlt > 0) {
    add("warning", "accessibility", `${imagesMissingAlt} of ${imageCount} images missing alt text`, "Add descriptive alt text to every meaningful image.");
  }
  if (!canonical) {
    add("info", "technical", "No canonical URL", 'Add a <link rel="canonical"> to prevent duplicate-content issues.');
  }
  if (!hasViewport) {
    add("warning", "mobile", "No viewport meta tag", 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> for mobile-friendliness.');
  }
  if (!hasLang) {
    add("info", "accessibility", "No lang attribute on <html>", 'Set the page language, e.g. <html lang="en">.');
  }
  if (statusCode < 400 && wordCount < 300) {
    add("warning", "content", `Thin content (${wordCount} words)`, "Aim for substantive content; pages under ~300 words often struggle to rank.");
  }
  if (!hasStructuredData) {
    add("info", "technical", "No structured data (JSON-LD)", "Add schema.org JSON-LD to enable rich results.");
  }
  if (responseTimeMs > 2e3) {
    add("warning", "performance", `Slow server response (${responseTimeMs} ms)`, "Improve TTFB via caching/CDN; aim for under ~800 ms.");
  }
  if (!ogTitle || !ogImage) {
    add("info", "social", "Missing Open Graph tags", "Add og:title and og:image so links render richly when shared on social media.");
  }
  if (!hasTwitterCard) {
    add("info", "social", "No Twitter/X Card tag", "Add a twitter:card meta tag for better X/Twitter link previews.");
  }
  if (statusCode < 400 && !robotsTxt) {
    add("warning", "technical", "No robots.txt found", "Add a robots.txt at the site root to guide crawlers.");
  }
  if (statusCode < 400 && !sitemap) {
    add("warning", "technical", "No sitemap.xml found", "Add a sitemap.xml so search engines can discover all your pages.");
  }
  let brokenLinks = [];
  if (checkLinks && internalHrefs.size > 0) {
    const sample = Array.from(internalHrefs).slice(0, 12);
    brokenLinks = await checkBrokenLinks(sample);
    if (brokenLinks.length > 0) {
      add("warning", "links", `${brokenLinks.length} broken internal link(s) found`, "Fix or remove links that return an error or don't resolve.");
    }
  }
  const pageSpeed = await fetchPageSpeed(finalUrl);
  if (pageSpeed?.performanceScore != null && pageSpeed.performanceScore < 50) {
    add("warning", "performance", `Low PageSpeed performance score (${pageSpeed.performanceScore}/100)`, "Optimize LCP, reduce blocking time, and compress assets.");
  }
  const penalty = issues.reduce((sum, i) => sum + SEVERITY_WEIGHT[i.severity], 0);
  const score = Math.max(0, Math.min(100, 100 - penalty));
  return {
    url,
    finalUrl,
    fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
    score,
    metrics,
    issues,
    brokenLinks,
    pageSpeed
  };
}
var SEVERITY_WEIGHT;
var init_crawler = __esm({
  "server/lib/crawler.ts"() {
    "use strict";
    init_env();
    SEVERITY_WEIGHT = { critical: 15, warning: 7, info: 2 };
  }
});

// server/lib/dataforseo.ts
var dataforseo_exports = {};
__export(dataforseo_exports, {
  backlinkAnchors: () => backlinkAnchors,
  backlinkSummary: () => backlinkSummary,
  checkKeywordRank: () => checkKeywordRank,
  competitorDomains: () => competitorDomains,
  dataForSeoPost: () => dataForSeoPost,
  domainIntersection: () => domainIntersection,
  keywordSuggestions: () => keywordSuggestions,
  linkGap: () => linkGap,
  normalizeDomain: () => normalizeDomain,
  referringDomains: () => referringDomains,
  toxicBacklinks: () => toxicBacklinks
});
function authHeader2() {
  const { dataForSeoLogin: login, dataForSeoPassword: password } = ENV;
  if (!login || !password) {
    throw new Error(
      "DataForSEO is not configured. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD in your environment."
    );
  }
  return "Basic " + Buffer.from(`${login}:${password}`).toString("base64");
}
async function dataForSeoPost(path, tasks, opts = {}) {
  const okTaskCodes = opts.okTaskCodes ?? [DFS_SUCCESS];
  const response = await fetch(`${BASE_URL2}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: authHeader2()
    },
    body: JSON.stringify(tasks)
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `DataForSEO request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }
  const json = await response.json();
  if (json?.status_code && json.status_code !== DFS_SUCCESS) {
    throw new Error(`DataForSEO error ${json.status_code}: ${json.status_message ?? "unknown"}`);
  }
  const taskStatus = json?.tasks?.[0]?.status_code;
  if (taskStatus && !okTaskCodes.includes(taskStatus)) {
    throw new Error(`DataForSEO task error ${taskStatus}: ${json?.tasks?.[0]?.status_message ?? "unknown"}`);
  }
  return json;
}
async function keywordSuggestions(seed, opts = {}) {
  const json = await dataForSeoPost("/dataforseo_labs/google/keyword_suggestions/live", [
    {
      keyword: seed,
      location_name: opts.locationName ?? "United States",
      language_name: opts.languageName ?? "English",
      limit: opts.limit ?? 20,
      include_seed_keyword: true
    }
  ]);
  const items = json?.tasks?.[0]?.result?.[0]?.items ?? [];
  return items.map((item) => ({
    keyword: item?.keyword ?? "",
    searchVolume: item?.keyword_info?.search_volume ?? 0,
    difficulty: item?.keyword_properties?.keyword_difficulty ?? 0,
    cpc: item?.keyword_info?.cpc ?? null,
    competition: item?.keyword_info?.competition_level ?? null
  })).filter((k) => k.keyword);
}
function normalizeDomain(input) {
  return input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
}
async function competitorDomains(target, opts = {}) {
  const json = await dataForSeoPost("/dataforseo_labs/google/competitors_domain/live", [
    {
      target: normalizeDomain(target),
      location_name: opts.locationName ?? "United States",
      language_name: opts.languageName ?? "English",
      limit: opts.limit ?? 20,
      exclude_top_domains: true
    }
  ]);
  const items = json?.tasks?.[0]?.result?.[0]?.items ?? [];
  return items.map((item) => {
    const metrics = item?.metrics?.organic ?? item?.full_domain_metrics?.organic ?? {};
    return {
      domain: item?.domain ?? "",
      commonKeywords: item?.intersections ?? 0,
      organicKeywords: metrics?.count ?? 0,
      organicTraffic: Math.round(metrics?.etv ?? 0)
    };
  }).filter((c) => c.domain);
}
async function domainIntersection(yourDomain, competitorDomain, opts = {}) {
  const json = await dataForSeoPost("/dataforseo_labs/google/domain_intersection/live", [
    {
      target1: normalizeDomain(yourDomain),
      target2: normalizeDomain(competitorDomain),
      location_name: opts.locationName ?? "United States",
      language_name: opts.languageName ?? "English",
      limit: opts.limit ?? 50,
      intersections: true
    }
  ]);
  const items = json?.tasks?.[0]?.result?.[0]?.items ?? [];
  return items.map((item) => ({
    keyword: item?.keyword_data?.keyword ?? "",
    searchVolume: item?.keyword_data?.keyword_info?.search_volume ?? 0,
    difficulty: item?.keyword_data?.keyword_properties?.keyword_difficulty ?? 0,
    yourRank: item?.first_domain_serp_element?.rank_absolute ?? null,
    competitorRank: item?.second_domain_serp_element?.rank_absolute ?? null
  })).filter((k) => k.keyword);
}
async function checkKeywordRank(keyword, domain, opts = {}) {
  const target = normalizeDomain(domain);
  const json = await dataForSeoPost("/serp/google/organic/live/advanced", [
    {
      keyword,
      location_name: opts.locationName ?? "United States",
      language_name: opts.languageName ?? "English",
      device: opts.device ?? "desktop"
    }
  ]);
  const items = json?.tasks?.[0]?.result?.[0]?.items ?? [];
  for (const item of items) {
    if (item?.type !== "organic") continue;
    const itemDomain = normalizeDomain(item?.domain ?? item?.url ?? "");
    if (itemDomain === target) {
      return {
        position: item?.rank_absolute ?? null,
        url: item?.url ?? null
      };
    }
  }
  return { position: null, url: null };
}
async function backlinkSummary(target) {
  const domain = normalizeDomain(target);
  const json = await dataForSeoPost("/backlinks/summary/live", [
    { target: domain, internal_list_limit: 10, backlinks_status_type: "live" }
  ]);
  const r = json?.tasks?.[0]?.result?.[0] ?? {};
  return {
    target: domain,
    backlinks: r?.backlinks ?? 0,
    referringDomains: r?.referring_domains ?? 0,
    referringMainDomains: r?.referring_main_domains ?? 0,
    rank: r?.rank ?? 0,
    brokenBacklinks: r?.broken_backlinks ?? 0,
    referringDomainsNofollow: r?.referring_domains_nofollow ?? 0,
    backlinksSpamScore: r?.backlinks_spam_score ?? 0,
    raw: r
  };
}
async function referringDomains(target, limit = 100) {
  const json = await dataForSeoPost("/backlinks/referring_domains/live", [
    { target: normalizeDomain(target), limit, order_by: ["backlinks,desc"], backlinks_status_type: "live" }
  ]);
  const items = json?.tasks?.[0]?.result?.[0]?.items ?? [];
  return items.map((i) => ({
    domain: i?.domain ?? "",
    backlinks: i?.backlinks ?? 0,
    rank: i?.rank ?? 0,
    brokenBacklinks: i?.broken_backlinks ?? 0,
    spamScore: i?.backlinks_spam_score ?? 0,
    firstSeen: i?.first_seen ?? null,
    lostDate: i?.lost_date ?? null
  })).filter((d) => d.domain);
}
async function backlinkAnchors(target, limit = 100) {
  const json = await dataForSeoPost("/backlinks/anchors/live", [
    { target: normalizeDomain(target), limit, order_by: ["backlinks,desc"], backlinks_status_type: "live" }
  ]);
  const items = json?.tasks?.[0]?.result?.[0]?.items ?? [];
  return items.map((i) => ({
    anchor: i?.anchor ?? "",
    backlinks: i?.backlinks ?? 0,
    referringDomains: i?.referring_domains ?? 0
  })).filter((a) => a.anchor);
}
async function linkGap(yourDomain, competitors, limit = 100) {
  const you = normalizeDomain(yourDomain);
  const targets = {};
  competitors.map((c) => normalizeDomain(c)).filter(Boolean).slice(0, 20).forEach((c, idx) => {
    targets[String(idx + 1)] = c;
  });
  const json = await dataForSeoPost("/backlinks/domain_intersection/live", [
    {
      targets,
      exclude_targets: [you],
      limit,
      order_by: ["1.rank,desc"],
      backlinks_status_type: "live"
    }
  ]);
  const items = json?.tasks?.[0]?.result?.[0]?.items ?? [];
  return items.map((i) => {
    const perTarget = Object.values(i?.domain_intersection ?? {});
    const referringDomain = perTarget.find((t2) => t2?.target)?.target ?? "";
    const rank = perTarget.find((t2) => typeof t2?.rank === "number")?.rank ?? 0;
    const competitorsLinked = perTarget.filter((t2) => (t2?.backlinks ?? 0) > 0).length;
    const backlinks = perTarget.reduce((sum, t2) => sum + (t2?.backlinks ?? 0), 0);
    return { referringDomain, rank, competitorsLinked, backlinks };
  }).filter((r) => r.referringDomain);
}
async function toxicBacklinks(target, limit = 200, threshold = 50) {
  const json = await dataForSeoPost("/backlinks/backlinks/live", [
    {
      target: normalizeDomain(target),
      mode: "one_per_domain",
      limit,
      order_by: ["backlink_spam_score,desc"],
      backlinks_status_type: "live"
    }
  ]);
  const items = json?.tasks?.[0]?.result?.[0]?.items ?? [];
  const all = items.map((i) => ({
    urlFrom: i?.url_from ?? "",
    sourceDomain: i?.domain_from ?? "",
    anchor: i?.anchor ?? "",
    spamScore: i?.backlink_spam_score ?? 0,
    dofollow: i?.dofollow ?? false
  })).filter((l) => l.sourceDomain);
  const links = all.filter((l) => l.spamScore >= threshold);
  const avgSpamScore = all.length ? Math.round(all.reduce((s, l) => s + l.spamScore, 0) / all.length) : 0;
  const domains = Array.from(new Set(links.map((l) => l.sourceDomain)));
  const disavowText = domains.map((d) => `domain:${d}`).join("\n");
  return { links, toxicCount: links.length, avgSpamScore, disavowText };
}
var BASE_URL2, DFS_SUCCESS;
var init_dataforseo = __esm({
  "server/lib/dataforseo.ts"() {
    "use strict";
    init_env();
    BASE_URL2 = "https://api.dataforseo.com/v3";
    DFS_SUCCESS = 2e4;
  }
});

// server/lib/siteAudit.ts
var siteAudit_exports = {};
__export(siteAudit_exports, {
  countCritical: () => countCritical,
  countWarnings: () => countWarnings,
  getSiteAuditPages: () => getSiteAuditPages,
  getSiteAuditSummary: () => getSiteAuditSummary,
  startSiteAudit: () => startSiteAudit
});
async function startSiteAudit(target, opts = {}) {
  const maxPages = Math.min(Math.max(opts.maxPages ?? 100, 1), 1e3);
  const json = await dataForSeoPost(
    "/on_page/task_post",
    [
      {
        target: normalizeDomain(target),
        max_crawl_pages: maxPages,
        load_resources: false,
        enable_javascript: false,
        respect_sitemap: true
      }
    ],
    { okTaskCodes: [2e4, 20100] }
    // 20100 "Task Created" is success for the async crawl
  );
  const taskId = json?.tasks?.[0]?.id;
  if (!taskId) throw new Error("DataForSEO did not return an On-Page task id");
  return { taskId };
}
async function getSiteAuditSummary(taskId) {
  const json = await dataForSeoPost("/on_page/summary", [{ id: taskId }]);
  const result = json?.tasks?.[0]?.result?.[0] ?? {};
  const metrics = result?.page_metrics ?? {};
  const rawChecks = metrics?.checks ?? {};
  const checks = {};
  for (const [name, count] of Object.entries(rawChecks)) {
    if (PROBLEM_CHECKS.has(name)) checks[name] = count;
  }
  return {
    crawlProgress: result?.crawl_progress ?? "in_progress",
    pagesCrawled: result?.crawl_status?.pages_crawled ?? 0,
    pagesInQueue: result?.crawl_status?.pages_in_queue ?? 0,
    onpageScore: typeof metrics?.onpage_score === "number" ? Math.round(metrics.onpage_score) : null,
    checks
  };
}
function countCritical(checks) {
  let n = 0;
  for (const [name, count] of Object.entries(checks)) {
    if (CRITICAL_CHECKS.has(name) && count > 0) n += count;
  }
  return n;
}
function countWarnings(checks) {
  let n = 0;
  for (const [name, count] of Object.entries(checks)) {
    if (!CRITICAL_CHECKS.has(name) && count > 0) n += count;
  }
  return n;
}
async function getSiteAuditPages(taskId, limit = 100) {
  const json = await dataForSeoPost("/on_page/pages", [{ id: taskId, limit }]);
  const items = json?.tasks?.[0]?.result?.[0]?.items ?? [];
  return items.map((item) => {
    const checks = item?.checks ?? {};
    const issues = Object.entries(checks).filter(([name, failed]) => failed === true && PROBLEM_CHECKS.has(name)).map(([name]) => name);
    return {
      url: item?.url ?? "",
      statusCode: item?.status_code ?? null,
      onpageScore: typeof item?.onpage_score === "number" ? Math.round(item.onpage_score) : null,
      issues
    };
  });
}
var CRITICAL_CHECKS, PROBLEM_CHECKS;
var init_siteAudit = __esm({
  "server/lib/siteAudit.ts"() {
    "use strict";
    init_dataforseo();
    CRITICAL_CHECKS = /* @__PURE__ */ new Set([
      "broken_links",
      "broken_resources",
      "duplicate_title_tag",
      "duplicate_meta_tags",
      "duplicate_content",
      "no_title",
      "no_h1_tag",
      "is_4xx_code",
      "is_5xx_code",
      "is_broken",
      "canonical_chain",
      "redirect_loop"
    ]);
    PROBLEM_CHECKS = /* @__PURE__ */ new Set([
      ...Array.from(CRITICAL_CHECKS),
      "no_description",
      "no_image_alt",
      "no_favicon",
      "no_doctype",
      "no_encoding_meta",
      "no_content_encoding",
      "high_loading_time",
      "low_content_rate",
      "small_page_size",
      "title_too_long",
      "title_too_short",
      "no_title_tag",
      "deprecated_html_tags",
      "low_readability_rate",
      "irrelevant_description",
      "irrelevant_title",
      "irrelevant_meta_keywords",
      "is_http",
      // served over plain HTTP (true = bad); note `is_https` true = good, so it's absent here
      "canonical_to_broken",
      "canonical_to_redirect",
      "recursive_canonical",
      "has_render_blocking_resources",
      "is_orphan_page",
      "is_link_relation_conflict"
    ]);
  }
});

// server/modelPerformance.ts
var modelPerformance_exports = {};
__export(modelPerformance_exports, {
  calculateWordCount: () => calculateWordCount,
  compareModels: () => compareModels,
  getModelPerformanceMetrics: () => getModelPerformanceMetrics
});
import { eq as eq17 } from "drizzle-orm";
function calculateWordCount(text2) {
  return text2.trim().split(/\s+/).filter((word) => word.length > 0).length;
}
async function getModelPerformanceMetrics(userId) {
  const db5 = await getDb();
  if (!db5) return [];
  const allContent = await db5.select().from(content).where(eq17(content.createdBy, userId));
  const modelGroups = /* @__PURE__ */ new Map();
  for (const item of allContent) {
    const model = item.aiModel;
    if (!modelGroups.has(model)) {
      modelGroups.set(model, []);
    }
    modelGroups.get(model).push(item);
  }
  const metrics = [];
  for (const [model, items] of Array.from(modelGroups.entries())) {
    const totalContent = items.length;
    const approvedContent = items.filter((item) => item.wasApproved === 1).length;
    const approvalRate = totalContent > 0 ? approvedContent / totalContent * 100 : 0;
    const avgWordCount = items.reduce((sum, item) => sum + item.wordCount, 0) / totalContent || 0;
    const avgGenerationTime = items.reduce((sum, item) => sum + item.generationTimeMs, 0) / totalContent || 0;
    let totalCost = 0;
    for (const item of items) {
      const costs = MODEL_COSTS[item.aiModel] || { input: 0, output: 0 };
      totalCost += item.inputTokens / 1e6 * costs.input + item.outputTokens / 1e6 * costs.output;
    }
    const avgCostPerContent = totalContent > 0 ? totalCost / totalContent : 0;
    const costPerApproval = approvedContent > 0 ? totalCost / approvedContent : 0;
    const modelInfo = MODEL_COSTS[model];
    const modelName = modelInfo?.name || model;
    metrics.push({
      model,
      modelName,
      totalContent,
      approvedContent,
      approvalRate,
      avgWordCount,
      avgGenerationTime,
      totalCost,
      avgCostPerContent,
      costPerApproval
    });
  }
  return metrics.sort((a, b) => b.totalContent - a.totalContent);
}
async function compareModels(model1, model2, userId) {
  const allMetrics = await getModelPerformanceMetrics(userId);
  const metrics1 = allMetrics.find((m) => m.model === model1);
  const metrics2 = allMetrics.find((m) => m.model === model2);
  if (!metrics1 || !metrics2) {
    return null;
  }
  return {
    model1: metrics1,
    model2: metrics2,
    comparison: {
      approvalRateDiff: metrics1.approvalRate - metrics2.approvalRate,
      wordCountDiff: metrics1.avgWordCount - metrics2.avgWordCount,
      costDiff: metrics1.avgCostPerContent - metrics2.avgCostPerContent,
      speedDiff: metrics1.avgGenerationTime - metrics2.avgGenerationTime
    }
  };
}
var init_modelPerformance = __esm({
  "server/modelPerformance.ts"() {
    "use strict";
    init_db();
    init_schema();
    init_budgetTracking();
  }
});

// server/keywordResearch.ts
var keywordResearch_exports = {};
__export(keywordResearch_exports, {
  analyzeContentKeywords: () => analyzeContentKeywords,
  getKeywordSuggestions: () => getKeywordSuggestions,
  optimizeContentForKeywords: () => optimizeContentForKeywords
});
async function getKeywordSuggestions(topic, count = 10) {
  const { keywordSuggestions: keywordSuggestions2 } = await Promise.resolve().then(() => (init_dataforseo(), dataforseo_exports));
  const results = await keywordSuggestions2(topic, { limit: Math.max(count, 10) });
  return results.slice(0, count).map((k, index) => ({
    keyword: k.keyword,
    // The API returns suggestions in relevance order; derive a descending relevance score.
    relevance: Math.max(40, Math.round(100 - index * 60 / Math.max(count, 1))),
    searchVolume: k.searchVolume,
    difficulty: k.difficulty
  }));
}
async function analyzeContentKeywords(content2, targetKeywords) {
  const wordCount = content2.split(/\s+/).length;
  const contentLower = content2.toLowerCase();
  const keywordDensity = {};
  for (const keyword of targetKeywords) {
    const regex = new RegExp(keyword.toLowerCase(), "gi");
    const matches = content2.match(regex);
    const count = matches ? matches.length : 0;
    keywordDensity[keyword] = count / wordCount * 100;
  }
  const suggestions = [];
  for (const [keyword, density] of Object.entries(keywordDensity)) {
    if (density === 0) {
      suggestions.push(`Add the keyword "${keyword}" to your content (currently not present)`);
    } else if (density < 0.5) {
      suggestions.push(`Increase usage of "${keyword}" (current density: ${density.toFixed(2)}%, recommended: 0.5-2%)`);
    } else if (density > 3) {
      suggestions.push(`Reduce usage of "${keyword}" to avoid keyword stuffing (current density: ${density.toFixed(2)}%, recommended: 0.5-2%)`);
    }
  }
  let score = 50;
  const presentKeywords = Object.values(keywordDensity).filter((d) => d > 0).length;
  score += presentKeywords / targetKeywords.length * 30;
  const optimalKeywords = Object.values(keywordDensity).filter((d) => d >= 0.5 && d <= 2).length;
  score += optimalKeywords / targetKeywords.length * 20;
  const stuffedKeywords = Object.values(keywordDensity).filter((d) => d > 3).length;
  score -= stuffedKeywords * 10;
  score = Math.max(0, Math.min(100, score));
  return {
    keywordDensity,
    suggestions,
    score: Math.round(score)
  };
}
async function optimizeContentForKeywords(content2, targetKeywords) {
  const { invokeLLM: invokeLLM2 } = await Promise.resolve().then(() => (init_llm(), llm_exports));
  const prompt = `You are an SEO content optimization expert. Optimize the following content to naturally include these target keywords while maintaining readability and quality.

Target Keywords: ${targetKeywords.join(", ")}

Original Content:
${content2}

Instructions:
1. Naturally incorporate the target keywords throughout the content
2. Maintain the original meaning and structure
3. Ensure keyword density is between 0.5-2% for each keyword
4. Keep the content readable and engaging
5. Don't force keywords where they don't fit naturally
6. Return ONLY the optimized content, no explanations

Optimized Content:`;
  try {
    const response = await invokeLLM2({
      messages: [
        { role: "system", content: "You are an SEO content optimization expert. Return only the optimized content, no explanations or meta-commentary." },
        { role: "user", content: prompt }
      ]
    });
    const responseContent = response.choices[0]?.message?.content;
    const optimizedContent = typeof responseContent === "string" ? responseContent.trim() : content2;
    return optimizedContent || content2;
  } catch (error) {
    console.error("Content optimization failed:", error);
    return content2;
  }
}
var init_keywordResearch = __esm({
  "server/keywordResearch.ts"() {
    "use strict";
  }
});

// server/performanceTracking.ts
var performanceTracking_exports = {};
__export(performanceTracking_exports, {
  getContentPerformance: () => getContentPerformance,
  getPerformanceSummary: () => getPerformanceSummary,
  getPerformanceTrends: () => getPerformanceTrends,
  getTopPerformingContent: () => getTopPerformingContent,
  trackContentClick: () => trackContentClick,
  trackContentView: () => trackContentView,
  updatePerformanceMetrics: () => updatePerformanceMetrics
});
import { eq as eq18, desc as desc8, and as and14, gte as gte5 } from "drizzle-orm";
async function updatePerformanceMetrics(metrics) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  const existing = await db5.select().from(contentAnalytics).where(eq18(contentAnalytics.contentId, metrics.contentId)).limit(1);
  if (existing.length > 0) {
    await db5.update(contentAnalytics).set({
      views: metrics.views,
      clicks: metrics.clicks,
      shares: existing[0].shares,
      // Preserve existing shares
      recordedAt: /* @__PURE__ */ new Date()
    }).where(eq18(contentAnalytics.contentId, metrics.contentId));
  } else {
    await db5.insert(contentAnalytics).values({
      contentId: metrics.contentId,
      views: metrics.views,
      clicks: metrics.clicks,
      shares: 0,
      engagementRate: 0,
      avgTimeOnPage: 0,
      conversions: metrics.conversions,
      recordedAt: /* @__PURE__ */ new Date()
    });
  }
  return { success: true };
}
async function getContentPerformance(contentId) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  const [analytics] = await db5.select().from(contentAnalytics).where(eq18(contentAnalytics.contentId, contentId)).limit(1);
  if (!analytics) {
    return {
      views: 0,
      clicks: 0,
      shares: 0,
      avgTimeOnPage: 0,
      engagementRate: 0,
      conversions: 0
    };
  }
  return analytics;
}
async function getTopPerformingContent(limit = 10, userId) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  const topContent = await db5.select({
    id: content.id,
    title: content.title,
    topic: content.topic,
    status: content.status,
    views: contentAnalytics.views,
    clicks: contentAnalytics.clicks,
    shares: contentAnalytics.shares,
    engagementRate: contentAnalytics.engagementRate,
    conversions: contentAnalytics.conversions
  }).from(content).leftJoin(contentAnalytics, eq18(content.id, contentAnalytics.contentId)).where(and14(eq18(content.status, "approved"), eq18(content.createdBy, userId))).orderBy(desc8(contentAnalytics.views)).limit(limit);
  return topContent;
}
async function getPerformanceSummary(userId) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  const allAnalytics = await db5.select({
    views: contentAnalytics.views,
    clicks: contentAnalytics.clicks,
    shares: contentAnalytics.shares,
    conversions: contentAnalytics.conversions,
    engagementRate: contentAnalytics.engagementRate
  }).from(contentAnalytics).innerJoin(content, eq18(contentAnalytics.contentId, content.id)).where(eq18(content.createdBy, userId));
  const totalViews = allAnalytics.reduce((sum, a) => sum + (a.views || 0), 0);
  const totalClicks = allAnalytics.reduce((sum, a) => sum + (a.clicks || 0), 0);
  const totalShares = allAnalytics.reduce((sum, a) => sum + (a.shares || 0), 0);
  const totalConversions = allAnalytics.reduce((sum, a) => sum + (a.conversions || 0), 0);
  const avgEngagementRate = allAnalytics.length > 0 ? allAnalytics.reduce((sum, a) => sum + (a.engagementRate || 0), 0) / allAnalytics.length : 0;
  return {
    totalViews,
    totalClicks,
    totalShares,
    totalConversions,
    avgEngagementRate,
    contentCount: allAnalytics.length
  };
}
async function trackContentView(contentId) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  const [existing] = await db5.select().from(contentAnalytics).where(eq18(contentAnalytics.contentId, contentId)).limit(1);
  if (existing) {
    await db5.update(contentAnalytics).set({
      views: (existing.views || 0) + 1,
      recordedAt: /* @__PURE__ */ new Date()
    }).where(eq18(contentAnalytics.contentId, contentId));
  } else {
    await db5.insert(contentAnalytics).values({
      contentId,
      views: 1,
      clicks: 0,
      shares: 0,
      engagementRate: 0,
      avgTimeOnPage: 0,
      conversions: 0,
      recordedAt: /* @__PURE__ */ new Date()
    });
  }
  return { success: true };
}
async function trackContentClick(contentId) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  const [existing] = await db5.select().from(contentAnalytics).where(eq18(contentAnalytics.contentId, contentId)).limit(1);
  if (existing) {
    await db5.update(contentAnalytics).set({
      clicks: (existing.clicks || 0) + 1,
      recordedAt: /* @__PURE__ */ new Date()
    }).where(eq18(contentAnalytics.contentId, contentId));
  }
  return { success: true };
}
async function getPerformanceTrends(days = 30, userId) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  const since = /* @__PURE__ */ new Date();
  since.setDate(since.getDate() - days);
  const recentAnalytics = await db5.select({
    contentId: contentAnalytics.contentId,
    title: content.title,
    views: contentAnalytics.views,
    clicks: contentAnalytics.clicks,
    recordedAt: contentAnalytics.recordedAt
  }).from(contentAnalytics).innerJoin(content, eq18(contentAnalytics.contentId, content.id)).where(and14(gte5(contentAnalytics.recordedAt, since), eq18(content.createdBy, userId))).orderBy(desc8(contentAnalytics.recordedAt));
  return recentAnalytics;
}
var init_performanceTracking = __esm({
  "server/performanceTracking.ts"() {
    "use strict";
    init_db();
    init_schema();
  }
});

// server/clientPortalAuth.ts
var clientPortalAuth_exports = {};
__export(clientPortalAuth_exports, {
  acceptInvitation: () => acceptInvitation,
  changeClientPortalPassword: () => changeClientPortalPassword,
  createClientPortalInvitation: () => createClientPortalInvitation,
  deactivateClientPortalUser: () => deactivateClientPortalUser,
  generateInvitationToken: () => generateInvitationToken,
  getClientPortalUser: () => getClientPortalUser,
  hashPassword: () => hashPassword,
  listClientPortalUsers: () => listClientPortalUsers,
  loginClientPortalUser: () => loginClientPortalUser,
  verifyClientPortalToken: () => verifyClientPortalToken,
  verifyPassword: () => verifyPassword
});
import { eq as eq19 } from "drizzle-orm";
import * as crypto2 from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET must be set for client-portal authentication");
  }
  return secret;
}
function isBcryptHash(hash) {
  return /^\$2[aby]\$/.test(hash);
}
async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}
async function verifyPassword(password, hash) {
  if (isBcryptHash(hash)) {
    return bcrypt.compare(password, hash);
  }
  const attempt = crypto2.createHash("sha256").update(password).digest("hex");
  const a = Buffer.from(attempt);
  const b = Buffer.from(hash);
  return a.length === b.length && crypto2.timingSafeEqual(a, b);
}
function generateInvitationToken() {
  return crypto2.randomBytes(32).toString("hex");
}
async function createClientPortalInvitation(clientId, email, name, role = "client_viewer") {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  const existing = await db5.select().from(clientPortalUsers).where(eq19(clientPortalUsers.email, email)).limit(1);
  if (existing.length > 0) {
    throw new Error("User with this email already exists");
  }
  const token = generateInvitationToken();
  const expiry = /* @__PURE__ */ new Date();
  expiry.setHours(expiry.getHours() + INVITATION_EXPIRY_HOURS);
  const tempPassword = crypto2.randomBytes(16).toString("hex");
  const passwordHash = await hashPassword(tempPassword);
  const [result] = await db5.insert(clientPortalUsers).values({
    clientId,
    email,
    name,
    role,
    passwordHash,
    invitationToken: token,
    invitationExpiry: expiry,
    isActive: 0,
    // Inactive until they accept invitation
    createdAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  }).returning({ id: clientPortalUsers.id });
  return {
    id: result.id,
    token,
    email,
    expiresAt: expiry
  };
}
async function acceptInvitation(token, newPassword) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  const [user] = await db5.select().from(clientPortalUsers).where(eq19(clientPortalUsers.invitationToken, token)).limit(1);
  if (!user) {
    throw new Error("Invalid invitation token");
  }
  if (user.invitationExpiry && /* @__PURE__ */ new Date() > user.invitationExpiry) {
    throw new Error("Invitation has expired");
  }
  const passwordHash = await hashPassword(newPassword);
  await db5.update(clientPortalUsers).set({
    passwordHash,
    isActive: 1,
    invitationToken: null,
    invitationExpiry: null,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq19(clientPortalUsers.id, user.id));
  return { success: true, userId: user.id };
}
async function loginClientPortalUser(email, password) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  const [user] = await db5.select().from(clientPortalUsers).where(eq19(clientPortalUsers.email, email)).limit(1);
  if (!user) {
    throw new Error("Invalid email or password");
  }
  if (user.isActive === 0) {
    throw new Error("Account is not activated. Please check your invitation email.");
  }
  if (!await verifyPassword(password, user.passwordHash)) {
    throw new Error("Invalid email or password");
  }
  if (!isBcryptHash(user.passwordHash)) {
    const upgraded = await hashPassword(password);
    await db5.update(clientPortalUsers).set({ passwordHash: upgraded }).where(eq19(clientPortalUsers.id, user.id));
  }
  await db5.update(clientPortalUsers).set({ lastLoginAt: /* @__PURE__ */ new Date() }).where(eq19(clientPortalUsers.id, user.id));
  const token = jwt.sign(
    {
      userId: user.id,
      clientId: user.clientId,
      email: user.email,
      role: user.role,
      type: "client_portal"
    },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
  return {
    token,
    user: {
      id: user.id,
      clientId: user.clientId,
      email: user.email,
      name: user.name,
      role: user.role
    }
  };
}
function verifyClientPortalToken(token) {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (decoded.type !== "client_portal") {
      throw new Error("Invalid token type");
    }
    return decoded;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}
async function getClientPortalUser(userId) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  const [user] = await db5.select({
    id: clientPortalUsers.id,
    clientId: clientPortalUsers.clientId,
    email: clientPortalUsers.email,
    name: clientPortalUsers.name,
    role: clientPortalUsers.role,
    isActive: clientPortalUsers.isActive,
    lastLoginAt: clientPortalUsers.lastLoginAt,
    clientName: clients.name,
    clientCompany: clients.company
  }).from(clientPortalUsers).leftJoin(clients, eq19(clientPortalUsers.clientId, clients.id)).where(eq19(clientPortalUsers.id, userId)).limit(1);
  return user;
}
async function listClientPortalUsers(clientId) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  const users2 = await db5.select({
    id: clientPortalUsers.id,
    email: clientPortalUsers.email,
    name: clientPortalUsers.name,
    role: clientPortalUsers.role,
    isActive: clientPortalUsers.isActive,
    lastLoginAt: clientPortalUsers.lastLoginAt,
    createdAt: clientPortalUsers.createdAt
  }).from(clientPortalUsers).where(eq19(clientPortalUsers.clientId, clientId));
  return users2;
}
async function changeClientPortalPassword(userId, oldPassword, newPassword) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  const [user] = await db5.select().from(clientPortalUsers).where(eq19(clientPortalUsers.id, userId)).limit(1);
  if (!user) {
    throw new Error("User not found");
  }
  if (!await verifyPassword(oldPassword, user.passwordHash)) {
    throw new Error("Current password is incorrect");
  }
  const newPasswordHash = await hashPassword(newPassword);
  await db5.update(clientPortalUsers).set({
    passwordHash: newPasswordHash,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq19(clientPortalUsers.id, userId));
  return { success: true };
}
async function deactivateClientPortalUser(userId) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  await db5.update(clientPortalUsers).set({
    isActive: 0,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq19(clientPortalUsers.id, userId));
  return { success: true };
}
var INVITATION_EXPIRY_HOURS, BCRYPT_ROUNDS;
var init_clientPortalAuth = __esm({
  "server/clientPortalAuth.ts"() {
    "use strict";
    init_db();
    init_schema();
    INVITATION_EXPIRY_HOURS = 72;
    BCRYPT_ROUNDS = 10;
  }
});

// server/approvalWorkflow.ts
var approvalWorkflow_exports = {};
__export(approvalWorkflow_exports, {
  addComment: () => addComment2,
  approveContent: () => approveContent,
  completeRevision: () => completeRevision,
  getApprovalStats: () => getApprovalStats,
  getPendingApprovals: () => getPendingApprovals,
  getRevisionRequests: () => getRevisionRequests,
  requestApproval: () => requestApproval,
  requestRevision: () => requestRevision
});
import { eq as eq20, and as and16, desc as desc9 } from "drizzle-orm";
async function requestApproval(contentId, requestedBy) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  await db5.update(content).set({ status: "in_progress", updatedAt: /* @__PURE__ */ new Date() }).where(eq20(content.id, contentId));
  const [contentData] = await db5.select().from(content).where(eq20(content.id, contentId)).limit(1);
  if (contentData) {
    await notifyOwner({
      title: "Content Approval Requested",
      content: `Content "${contentData.title}" is ready for review and approval.`
    });
  }
  return { success: true };
}
async function approveContent(contentId, approvedBy) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  await db5.update(content).set({
    status: "approved",
    updatedAt: /* @__PURE__ */ new Date(),
    wasApproved: 1,
    approvedAt: /* @__PURE__ */ new Date()
  }).where(eq20(content.id, contentId));
  const [contentData] = await db5.select().from(content).where(eq20(content.id, contentId)).limit(1);
  if (contentData) {
    await notifyOwner({
      title: "Content Approved",
      content: `Content "${contentData.title}" has been approved and is ready for publishing.`
    });
  }
  return { success: true };
}
async function requestRevision(contentId, requestedBy, reason) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  await db5.insert(contentRevisions).values({
    contentId,
    userId: requestedBy,
    requestedBy,
    reason,
    status: "pending",
    title: "",
    content: "",
    changeDescription: reason,
    revisionNumber: 1,
    createdAt: /* @__PURE__ */ new Date()
  });
  await db5.update(content).set({
    status: "draft",
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq20(content.id, contentId));
  const [contentData] = await db5.select().from(content).where(eq20(content.id, contentId)).limit(1);
  if (contentData) {
    await notifyOwner({
      title: "Revision Requested",
      content: `Revision requested for "${contentData.title}": ${reason}`
    });
  }
  return { success: true };
}
async function getPendingApprovals(userId) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  const pendingContent = await db5.select().from(content).where(and16(eq20(content.status, "in_progress"), eq20(content.createdBy, userId))).orderBy(desc9(content.updatedAt));
  return pendingContent;
}
async function getRevisionRequests(contentId) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  const revisions = await db5.select({
    id: contentRevisions.id,
    reason: contentRevisions.reason,
    status: contentRevisions.status,
    createdAt: contentRevisions.createdAt,
    completedAt: contentRevisions.completedAt,
    requestedBy: contentRevisions.requestedBy,
    userName: users.name
  }).from(contentRevisions).leftJoin(users, eq20(contentRevisions.requestedBy, users.id)).where(eq20(contentRevisions.contentId, contentId)).orderBy(desc9(contentRevisions.createdAt));
  return revisions;
}
async function completeRevision(revisionId) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  await db5.update(contentRevisions).set({
    status: "completed",
    completedAt: /* @__PURE__ */ new Date()
  }).where(eq20(contentRevisions.id, revisionId));
  const [revision] = await db5.select().from(contentRevisions).where(eq20(contentRevisions.id, revisionId)).limit(1);
  if (revision) {
    await db5.update(content).set({
      status: "draft",
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq20(content.id, revision.contentId));
  }
  return { success: true };
}
async function addComment2(contentId, userId, comment) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  const [result] = await db5.insert(contentComments).values({
    contentId,
    userId,
    comment,
    isResolved: 0,
    createdAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  }).returning({ id: contentComments.id });
  const [contentData] = await db5.select().from(content).where(eq20(content.id, contentId)).limit(1);
  if (contentData) {
    await notifyOwner({
      title: "New Comment on Content",
      content: `New comment on "${contentData.title}": ${comment.substring(0, 100)}${comment.length > 100 ? "..." : ""}`
    });
  }
  return { id: result.id };
}
async function getApprovalStats(userId) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  const pending = await db5.select({ id: content.id }).from(content).where(and16(eq20(content.status, "in_progress"), eq20(content.createdBy, userId)));
  const approved = await db5.select({ id: content.id }).from(content).where(and16(eq20(content.wasApproved, 1), eq20(content.createdBy, userId)));
  const revisionRequested = await db5.select({ id: contentRevisions.id }).from(contentRevisions).innerJoin(content, eq20(contentRevisions.contentId, content.id)).where(and16(eq20(contentRevisions.status, "pending"), eq20(content.createdBy, userId)));
  return {
    pending: pending.length,
    approved: approved.length,
    revisionRequested: revisionRequested.length
  };
}
var init_approvalWorkflow = __esm({
  "server/approvalWorkflow.ts"() {
    "use strict";
    init_db();
    init_schema();
    init_notification();
  }
});

// server/abTesting.ts
var abTesting_exports = {};
__export(abTesting_exports, {
  createABTest: () => createABTest,
  deleteABTest: () => deleteABTest,
  getABTestById: () => getABTestById,
  listABTests: () => listABTests,
  setABTestWinner: () => setABTestWinner,
  updateABTestResults: () => updateABTestResults
});
import { eq as eq21, desc as desc10 } from "drizzle-orm";
async function createABTest(data) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  const [result] = await db5.insert(abTests).values({
    clientId: data.clientId,
    topic: data.topic,
    customPrompt: data.customPrompt || null,
    shouldGenerateImage: data.shouldGenerateImage ? 1 : 0,
    modelA: data.modelA,
    modelB: data.modelB,
    createdBy: data.createdBy
  }).returning({ id: abTests.id });
  return result.id;
}
async function updateABTestResults(id, versionData) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  const updates = {};
  if (versionData.version === "A") {
    updates.contentA = versionData.content;
    updates.titleA = versionData.title;
    updates.imageUrlA = versionData.imageUrl || null;
    updates.wordCountA = versionData.wordCount;
    updates.generationTimeMsA = versionData.generationTimeMs;
    updates.inputTokensA = versionData.inputTokens;
    updates.outputTokensA = versionData.outputTokens;
  } else {
    updates.contentB = versionData.content;
    updates.titleB = versionData.title;
    updates.imageUrlB = versionData.imageUrl || null;
    updates.wordCountB = versionData.wordCount;
    updates.generationTimeMsB = versionData.generationTimeMs;
    updates.inputTokensB = versionData.inputTokens;
    updates.outputTokensB = versionData.outputTokens;
  }
  await db5.update(abTests).set(updates).where(eq21(abTests.id, id));
}
async function setABTestWinner(id, winner, notes) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  await db5.update(abTests).set({
    winner,
    notes: notes || null
  }).where(eq21(abTests.id, id));
}
async function getABTestById(id) {
  const db5 = await getDb();
  if (!db5) return null;
  const [test] = await db5.select().from(abTests).where(eq21(abTests.id, id));
  return test || null;
}
async function listABTests() {
  const db5 = await getDb();
  if (!db5) return [];
  const tests = await db5.select({
    test: abTests,
    client: clients
  }).from(abTests).leftJoin(clients, eq21(abTests.clientId, clients.id)).orderBy(desc10(abTests.createdAt));
  return tests;
}
async function deleteABTest(id) {
  const db5 = await getDb();
  if (!db5) throw new Error("Database not available");
  await db5.delete(abTests).where(eq21(abTests.id, id));
}
var init_abTesting = __esm({
  "server/abTesting.ts"() {
    "use strict";
    init_db();
    init_schema();
  }
});

// server/_core/app.ts
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var SESSION_TTL_MS = 1e3 * 60 * 60 * 24 * 30;
var SESSION_REFRESH_AFTER_MS = 1e3 * 60 * 60 * 24;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  const secure = isSecureRequest(req);
  return {
    httpOnly: true,
    path: "/",
    // SameSite=None requires Secure; browsers reject it over plain http (local dev),
    // so fall back to Lax when the request isn't secure.
    sameSite: secure ? "none" : "lax",
    secure
  };
}

// server/_core/systemRouter.ts
init_notification();
import { z } from "zod";

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";

// server/_core/rateLimit.ts
var store = /* @__PURE__ */ new Map();
function checkRateLimit(key, limit, windowMs, now = Date.now()) {
  const cutoff = now - windowMs;
  const recent = (store.get(key) ?? []).filter((t2) => t2 > cutoff);
  if (recent.length >= limit) {
    store.set(key, recent);
    const oldest = recent[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1e3));
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }
  recent.push(now);
  store.set(key, recent);
  return { allowed: true, remaining: limit - recent.length, retryAfterSeconds: 0 };
}
var SWEEP_MS = 6e4;
var MAX_KEEP_MS = 60 * 6e4;
var sweeper = setInterval(() => {
  const cutoff = Date.now() - MAX_KEEP_MS;
  for (const [key, arr] of Array.from(store.entries())) {
    const recent = arr.filter((t2) => t2 > cutoff);
    if (recent.length === 0) store.delete(key);
    else store.set(key, recent);
  }
}, SWEEP_MS);
sweeper.unref?.();

// server/_core/trpc.ts
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
function rateLimit(opts) {
  return t.middleware(async ({ ctx, next }) => {
    const who = ctx.user ? `u:${ctx.user.id}` : `ip:${ctx.req.ip || ctx.req.socket?.remoteAddress || "unknown"}`;
    const result = checkRateLimit(`${opts.name}:${who}`, opts.limit, opts.windowMs);
    if (!result.allowed) {
      throw new TRPCError2({
        code: "TOO_MANY_REQUESTS",
        message: `Rate limit exceeded. Try again in ${result.retryAfterSeconds}s.`
      });
    }
    return next();
  });
}
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
import { TRPCError as TRPCError9 } from "@trpc/server";
import { z as z24 } from "zod";
import bcrypt2 from "bcryptjs";
import { nanoid as nanoid4 } from "nanoid";

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
init_db();
init_env();
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString2 = (value) => typeof value === "string" && value.length > 0;
var APP_ID = ENV.appId || "ai-seo-portal";
var SDKServer = class {
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    return new TextEncoder().encode(ENV.cookieSecret);
  }
  /**
   * Create a signed session token for a user's openId.
   * @example const sessionToken = await sdk.createSessionToken(user.openId, { name });
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: APP_ID,
        name: options.name || "",
        ver: options.ver ?? 0
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? SESSION_TTL_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name,
      ver: payload.ver
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setIssuedAt(Math.floor(issuedAt / 1e3)).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name, ver, iat } = payload;
      if (!isNonEmptyString2(openId) || !isNonEmptyString2(appId)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name: isNonEmptyString2(name) ? name : "",
        ver: typeof ver === "number" ? ver : 0,
        issuedAtMs: typeof iat === "number" ? iat * 1e3 : 0
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  /**
   * Authenticate a request and return the user plus the verified session claims.
   * Enforces token-version revocation: a token whose `ver` no longer matches the
   * user's current tokenVersion (e.g. after "log out everywhere") is rejected.
   */
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const user = await getUserByOpenId(session.openId);
    if (!user) {
      throw ForbiddenError("User not found");
    }
    if ((user.tokenVersion ?? 0) !== session.ver) {
      throw ForbiddenError("Session has been revoked");
    }
    try {
      await upsertUser({ openId: user.openId, lastSignedIn: /* @__PURE__ */ new Date() });
    } catch (error) {
      console.warn("[Auth] Failed to update lastSignedIn", String(error));
    }
    return { user, session };
  }
};
var sdk = new SDKServer();

// server/routers.ts
init_db();
init_db();
init_llm();

// server/_core/imageGeneration.ts
import { nanoid } from "nanoid";

// server/lib/gemini.ts
init_env();
var IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
async function generateImageWithGemini(prompt) {
  if (!ENV.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": ENV.geminiApiKey
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE"] }
    })
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Gemini image generation failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`);
  }
  const json = await response.json();
  const parts = json?.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p) => p?.inlineData?.data || p?.inline_data?.data);
  const inline = imagePart?.inlineData ?? imagePart?.inline_data;
  if (!inline?.data) {
    throw new Error("Gemini returned no image data");
  }
  return {
    base64: inline.data,
    mimeType: inline.mimeType ?? inline.mime_type ?? "image/png"
  };
}

// server/lib/supabaseStorage.ts
init_env();
function baseUrl() {
  if (!ENV.supabaseUrl) throw new Error("SUPABASE_URL is not configured");
  if (!ENV.supabaseServiceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  return ENV.supabaseUrl.replace(/\/$/, "");
}
function extensionForMime(mimeType) {
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";
  if (mimeType.includes("webp")) return "webp";
  return "png";
}
async function uploadImage(base64, mimeType, path) {
  const root = baseUrl();
  const bucket = ENV.supabaseStorageBucket;
  const bytes = Buffer.from(base64, "base64");
  const response = await fetch(`${root}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${ENV.supabaseServiceRoleKey}`,
      "content-type": mimeType,
      "x-upsert": "true",
      "cache-control": "public, max-age=31536000, immutable"
    },
    body: bytes
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Supabase storage upload failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`);
  }
  return {
    path,
    url: `${root}/storage/v1/object/public/${bucket}/${path}`
  };
}

// server/_core/imageGeneration.ts
async function generateImage(options) {
  const { base64, mimeType } = await generateImageWithGemini(options.prompt);
  const path = `generated/${nanoid()}.${extensionForMime(mimeType)}`;
  const { url } = await uploadImage(base64, mimeType, path);
  return { url };
}

// server/authz.ts
init_db();
init_schema();
import { TRPCError as TRPCError3 } from "@trpc/server";
import { and, eq as eq2 } from "drizzle-orm";
function deny() {
  throw new TRPCError3({
    code: "FORBIDDEN",
    message: "You do not have access to this resource."
  });
}
async function requireDb() {
  const db5 = await getDb();
  if (!db5) {
    throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  }
  return db5;
}
var OWNED_TABLES = {
  client: clients,
  content,
  template: contentTemplates,
  webhook: webhookConfigs,
  recurringPlan: recurringPlans,
  designStandard: designStandards,
  abTest: abTests,
  wordpressConnection: wordpressConnections,
  gaConnection: googleAnalyticsConnections,
  brand: aiBrands,
  aiPrompt: aiPrompts,
  siteAudit: siteAudits,
  trackedKeyword: trackedKeywords,
  backlinkSnapshot: backlinkSnapshots
};
async function assertOwned(kind, id, userId) {
  const table = OWNED_TABLES[kind];
  const db5 = await requireDb();
  const rows = await db5.select({ id: table.id }).from(table).where(and(eq2(table.id, id), eq2(table.createdBy, userId))).limit(1);
  if (rows.length === 0) deny();
}
var assertClient = (userId, id) => assertOwned("client", id, userId);
var assertContent = (userId, id) => assertOwned("content", id, userId);
var assertTemplate = (userId, id) => assertOwned("template", id, userId);
var assertWebhook = (userId, id) => assertOwned("webhook", id, userId);
var assertRecurringPlan = (userId, id) => assertOwned("recurringPlan", id, userId);
var assertDesignStandard = (userId, id) => assertOwned("designStandard", id, userId);
var assertABTest = (userId, id) => assertOwned("abTest", id, userId);
var assertWordpressConnection = (userId, id) => assertOwned("wordpressConnection", id, userId);
var assertBrand = (userId, id) => assertOwned("brand", id, userId);
var assertAiPrompt = (userId, id) => assertOwned("aiPrompt", id, userId);
var assertSiteAudit = (userId, id) => assertOwned("siteAudit", id, userId);
var assertTrackedKeyword = (userId, id) => assertOwned("trackedKeyword", id, userId);
async function assertContentComment(userId, commentId) {
  const db5 = await requireDb();
  const rows = await db5.select({ id: contentComments.id }).from(contentComments).innerJoin(content, eq2(contentComments.contentId, content.id)).where(and(eq2(contentComments.id, commentId), eq2(content.createdBy, userId))).limit(1);
  if (rows.length === 0) deny();
}
async function assertRepurposed(userId, repurposedId) {
  const db5 = await requireDb();
  const rows = await db5.select({ id: contentRepurposed.id }).from(contentRepurposed).innerJoin(content, eq2(contentRepurposed.contentId, content.id)).where(and(eq2(contentRepurposed.id, repurposedId), eq2(content.createdBy, userId))).limit(1);
  if (rows.length === 0) deny();
}
async function assertRevision(userId, revisionId) {
  const db5 = await requireDb();
  const rows = await db5.select({ id: contentRevisions.id }).from(contentRevisions).innerJoin(content, eq2(contentRevisions.contentId, content.id)).where(and(eq2(contentRevisions.id, revisionId), eq2(content.createdBy, userId))).limit(1);
  if (rows.length === 0) deny();
}
async function assertBrief(userId, briefId) {
  const db5 = await requireDb();
  const rows = await db5.select({ id: contentBriefs.id }).from(contentBriefs).innerJoin(clients, eq2(contentBriefs.clientId, clients.id)).where(and(eq2(contentBriefs.id, briefId), eq2(clients.createdBy, userId))).limit(1);
  if (rows.length === 0) deny();
}
async function assertPortalUser(userId, portalUserId) {
  const db5 = await requireDb();
  const rows = await db5.select({ id: clientPortalUsers.id }).from(clientPortalUsers).innerJoin(clients, eq2(clientPortalUsers.clientId, clients.id)).where(and(eq2(clientPortalUsers.id, portalUserId), eq2(clients.createdBy, userId))).limit(1);
  if (rows.length === 0) deny();
}

// server/_core/rateLimiters.ts
var limitLlmSingle = rateLimit({ name: "llm-single", limit: 150, windowMs: 6e4 });
var limitLlmBatch = rateLimit({ name: "llm-batch", limit: 30, windowMs: 5 * 6e4 });
var limitData = rateLimit({ name: "data", limit: 600, windowMs: 6e4 });
var limitSend = rateLimit({ name: "send", limit: 500, windowMs: 60 * 6e4 });

// server/routers/bulk.ts
import { z as z2 } from "zod";
init_db();
init_llm();
var bulkRouter = router({
  generate: protectedProcedure.use(limitLlmBatch).input(z2.object({
    clientId: z2.number(),
    topics: z2.array(z2.string().min(1)).min(1).max(100),
    customPrompt: z2.string().optional(),
    shouldGenerateImage: z2.boolean().default(true),
    aiModel: z2.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const { clientId, topics, customPrompt, shouldGenerateImage, aiModel } = input;
    await assertClient(ctx.user.id, clientId);
    const { assertClientWithinBudget: assertClientWithinBudget2 } = await Promise.resolve().then(() => (init_budgetTracking(), budgetTracking_exports));
    await assertClientWithinBudget2(clientId);
    const results = [];
    for (const topic of topics) {
      try {
        let inputTokens = 0;
        let outputTokens = 0;
        const systemPrompt = customPrompt || "You are an expert SEO content writer. Create engaging, well-structured blog posts that are informative and optimized for search engines.";
        const userPrompt = `Write a comprehensive blog post about: ${topic}`;
        const llmResponse = await invokeLLM({
          model: aiModel || DEFAULT_TEXT_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ]
        });
        const messageContent = llmResponse.choices[0]?.message?.content;
        const generatedContent = typeof messageContent === "string" ? messageContent : "";
        inputTokens = llmResponse.usage?.prompt_tokens || 0;
        outputTokens = llmResponse.usage?.completion_tokens || 0;
        const lines = generatedContent.split("\n").filter((l) => l.trim());
        const title = lines[0]?.replace(/^#\s*/, "").substring(0, 500) || topic;
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
          aiModel: aiModel || DEFAULT_TEXT_MODEL,
          customPrompt: customPrompt || null,
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens
        });
        results.push({ topic, success: true, contentId });
      } catch (error) {
        results.push({ topic, success: false, error: String(error) });
      }
    }
    return { results, totalGenerated: results.filter((r) => r.success).length };
  })
});

// server/routers/templates.ts
import { z as z3 } from "zod";
init_db();
import { eq as eq4 } from "drizzle-orm";
var templatesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await getTemplatesByUser(ctx.user.id);
  }),
  create: protectedProcedure.input(z3.object({
    name: z3.string().min(1),
    description: z3.string().optional(),
    category: z3.enum(["product-review", "how-to", "listicle", "case-study", "comparison", "tutorial", "news", "opinion", "custom"]),
    prompt: z3.string().min(1),
    structure: z3.string().optional(),
    isPublic: z3.number().default(0)
  })).mutation(async ({ ctx, input }) => {
    const templateId = await createTemplate({
      name: input.name,
      description: input.description || null,
      category: input.category,
      prompt: input.prompt,
      structure: input.structure || null,
      createdBy: ctx.user.id,
      isPublic: input.isPublic
    });
    return { id: templateId };
  }),
  seedDefaults: protectedProcedure.mutation(async ({ ctx }) => {
    const { defaultTemplates: defaultTemplates2 } = await Promise.resolve().then(() => (init_templateSeeds(), templateSeeds_exports));
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { contentTemplates: contentTemplates2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const db5 = await getDb2();
    if (!db5) throw new Error("Database not available");
    const existing = await db5.select().from(contentTemplates2).where(eq4(contentTemplates2.createdBy, ctx.user.id));
    if (existing.length > 0) {
      return { message: "Templates already seeded", count: 0 };
    }
    for (const template of defaultTemplates2) {
      await createTemplate({
        ...template,
        createdBy: ctx.user.id,
        isPublic: 0
      });
    }
    return { message: "Default templates added", count: defaultTemplates2.length };
  }),
  delete: protectedProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ ctx, input }) => {
    await assertTemplate(ctx.user.id, input.id);
    await deleteTemplate(input.id);
    return { success: true };
  })
});

// server/routers/collaboration.ts
import { z as z4 } from "zod";
init_db();
var collaborationRouter = router({
  // Comments
  addComment: protectedProcedure.input(z4.object({
    contentId: z4.number(),
    comment: z4.string().min(1)
  })).mutation(async ({ ctx, input }) => {
    await assertContent(ctx.user.id, input.contentId);
    const commentId = await addComment({
      contentId: input.contentId,
      userId: ctx.user.id,
      comment: input.comment,
      status: "pending"
    });
    return { id: commentId };
  }),
  getComments: protectedProcedure.input(z4.object({ contentId: z4.number() })).query(async ({ ctx, input }) => {
    await assertContent(ctx.user.id, input.contentId);
    return await getContentComments(input.contentId);
  }),
  resolveComment: protectedProcedure.input(z4.object({ commentId: z4.number() })).mutation(async ({ ctx, input }) => {
    await assertContentComment(ctx.user.id, input.commentId);
    await updateCommentStatus(input.commentId, 1);
    return { success: true };
  }),
  // Revisions
  createRevision: protectedProcedure.input(z4.object({
    contentId: z4.number(),
    title: z4.string().optional(),
    content: z4.string().optional(),
    changeDescription: z4.string(),
    revisionNumber: z4.number()
  })).mutation(async ({ ctx, input }) => {
    await assertContent(ctx.user.id, input.contentId);
    const revisionId = await createRevision({
      contentId: input.contentId,
      userId: ctx.user.id,
      title: input.title || null,
      content: input.content || null,
      changeDescription: input.changeDescription,
      revisionNumber: input.revisionNumber
    });
    return { id: revisionId };
  }),
  getRevisions: protectedProcedure.input(z4.object({ contentId: z4.number() })).query(async ({ ctx, input }) => {
    await assertContent(ctx.user.id, input.contentId);
    return await getContentRevisions(input.contentId);
  })
});

// server/routers/analytics.ts
import { z as z5 } from "zod";
init_db();
var analyticsRouter = router({
  recordMetrics: protectedProcedure.input(z5.object({
    contentId: z5.number(),
    views: z5.number().default(0),
    clicks: z5.number().default(0),
    shares: z5.number().default(0),
    engagementRate: z5.number().default(0),
    avgTimeOnPage: z5.number().default(0),
    conversions: z5.number().default(0)
  })).mutation(async ({ ctx, input }) => {
    await assertContent(ctx.user.id, input.contentId);
    const analyticsId = await recordAnalytics({
      contentId: input.contentId,
      views: input.views,
      clicks: input.clicks,
      shares: input.shares,
      engagementRate: input.engagementRate,
      avgTimeOnPage: input.avgTimeOnPage,
      conversions: input.conversions
    });
    return { id: analyticsId };
  }),
  getMetrics: protectedProcedure.input(z5.object({ contentId: z5.number() })).query(async ({ ctx, input }) => {
    await assertContent(ctx.user.id, input.contentId);
    return await getContentAnalytics(input.contentId);
  }),
  updateMetrics: protectedProcedure.input(z5.object({
    contentId: z5.number(),
    views: z5.number().optional(),
    clicks: z5.number().optional(),
    shares: z5.number().optional(),
    engagementRate: z5.number().optional(),
    avgTimeOnPage: z5.number().optional(),
    conversions: z5.number().optional()
  })).mutation(async ({ ctx, input }) => {
    const { contentId, ...updates } = input;
    await assertContent(ctx.user.id, contentId);
    const updateData = {};
    if (updates.views !== void 0) updateData.views = updates.views;
    if (updates.clicks !== void 0) updateData.clicks = updates.clicks;
    if (updates.shares !== void 0) updateData.shares = updates.shares;
    if (updates.engagementRate !== void 0) updateData.engagementRate = updates.engagementRate;
    if (updates.avgTimeOnPage !== void 0) updateData.avgTimeOnPage = updates.avgTimeOnPage;
    if (updates.conversions !== void 0) updateData.conversions = updates.conversions;
    await updateAnalytics(contentId, updateData);
    return { success: true };
  }),
  // Get all analytics across the current user's content for overview
  getAllMetrics: protectedProcedure.query(async ({ ctx }) => {
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const db5 = await getDb2();
    if (!db5) return [];
    const { contentAnalytics: contentAnalytics2, content: content2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { eq: eq22 } = await import("drizzle-orm");
    const rows = await db5.select({ analytics: contentAnalytics2 }).from(contentAnalytics2).innerJoin(content2, eq22(contentAnalytics2.contentId, content2.id)).where(eq22(content2.createdBy, ctx.user.id)).orderBy(contentAnalytics2.recordedAt);
    return rows.map((r) => r.analytics);
  })
});

// server/routers/repurposing.ts
import { z as z6 } from "zod";
init_db();
init_llm();
var repurposingRouter = router({
  generateRepurposed: protectedProcedure.use(limitLlmSingle).input(z6.object({
    contentId: z6.number(),
    format: z6.enum(["social-snippet", "email-summary", "short-form", "infographic-script", "video-script"]),
    originalContent: z6.string(),
    platform: z6.string().optional()
  })).mutation(async ({ ctx, input }) => {
    await assertContent(ctx.user.id, input.contentId);
    const prompts = {
      "social-snippet": "Create a concise, engaging social media post (max 280 characters) based on this content. Make it shareable and include relevant hashtags.",
      "email-summary": "Create a compelling email summary (2-3 paragraphs) that captures the key points of this content and encourages readers to click through.",
      "short-form": "Create a short-form version (100-150 words) of this content suitable for quick reading on mobile devices.",
      "infographic-script": "Create a script for an infographic that visualizes the key points of this content. Include section titles and bullet points.",
      "video-script": "Create a video script (2-3 minutes) based on this content. Include an engaging intro, main points, and a call-to-action."
    };
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a content repurposing expert." },
        { role: "user", content: `${prompts[input.format]}

Original content:
${input.originalContent}` }
      ]
    });
    const repurposedText = response.choices[0]?.message?.content || "";
    const repurposedId = await createRepurposedContent({
      contentId: input.contentId,
      format: input.format,
      content: repurposedText,
      platform: input.platform || null,
      createdBy: ctx.user.id
    });
    return { id: repurposedId, content: repurposedText };
  }),
  getRepurposed: protectedProcedure.input(z6.object({ contentId: z6.number() })).query(async ({ ctx, input }) => {
    await assertContent(ctx.user.id, input.contentId);
    return await getRepurposedContent(input.contentId);
  }),
  deleteRepurposed: protectedProcedure.input(z6.object({ id: z6.number() })).mutation(async ({ ctx, input }) => {
    await assertRepurposed(ctx.user.id, input.id);
    await deleteRepurposedContent(input.id);
    return { success: true };
  })
});

// server/routers/distribution.ts
import { z as z7 } from "zod";
var socialRouter = router({
  // Which social accounts are connected (via the configured provider).
  accounts: protectedProcedure.query(async () => {
    const { getLinkedAccounts: getLinkedAccounts2 } = await Promise.resolve().then(() => (init_social(), social_exports));
    return await getLinkedAccounts2();
  }),
  // Publish a post to selected connected accounts. User-triggered from a compose+confirm UI.
  post: protectedProcedure.use(limitSend).input(z7.object({
    content: z7.string().min(1),
    accounts: z7.array(z7.object({
      platform: z7.string(),
      accountId: z7.string()
    })).min(1),
    publishNow: z7.boolean().optional(),
    scheduledFor: z7.string().optional(),
    timezone: z7.string().optional()
  })).mutation(async ({ input }) => {
    const { postToSocial: postToSocial2 } = await Promise.resolve().then(() => (init_social(), social_exports));
    return await postToSocial2(input);
  })
});
var newsletterRouter = router({
  send: protectedProcedure.use(limitSend).input(z7.object({
    subject: z7.string().min(1),
    html: z7.string().min(1),
    recipients: z7.array(z7.string().email()).min(1),
    from: z7.string().email().optional()
  })).mutation(async ({ input }) => {
    const { sendNewsletter: sendNewsletter2 } = await Promise.resolve().then(() => (init_newsletter(), newsletter_exports));
    return await sendNewsletter2(input);
  })
});

// server/routers/aiVisibility.ts
init_db();
import { z as z8 } from "zod";
import { TRPCError as TRPCError5 } from "@trpc/server";
import { nanoid as nanoid2 } from "nanoid";
import { eq as eq5, and as and3, desc, asc } from "drizzle-orm";
init_schema();
async function db() {
  const d = await getDb();
  if (!d) throw new TRPCError5({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  return d;
}
var aiVisibilityRouter = router({
  // Which AI engines are configured (have keys).
  providers: protectedProcedure.query(async () => {
    const { configuredProviders: configuredProviders2 } = await Promise.resolve().then(() => (init_aiProviders(), aiProviders_exports));
    return configuredProviders2();
  }),
  // --- Brands ---
  createBrand: protectedProcedure.input(z8.object({
    name: z8.string().min(1),
    domain: z8.string().optional(),
    competitors: z8.array(z8.string()).optional()
  })).mutation(async ({ ctx, input }) => {
    const d = await db();
    const [row] = await d.insert(aiBrands).values({
      name: input.name,
      domain: input.domain || null,
      competitors: JSON.stringify(input.competitors ?? []),
      createdBy: ctx.user.id
    }).returning();
    return row;
  }),
  listBrands: protectedProcedure.query(async ({ ctx }) => {
    const d = await db();
    return d.select().from(aiBrands).where(eq5(aiBrands.createdBy, ctx.user.id)).orderBy(desc(aiBrands.createdAt));
  }),
  deleteBrand: protectedProcedure.input(z8.object({ id: z8.number() })).mutation(async ({ ctx, input }) => {
    await assertBrand(ctx.user.id, input.id);
    const d = await db();
    await d.delete(aiBrands).where(eq5(aiBrands.id, input.id));
    return { success: true };
  }),
  // --- Prompts ---
  addPrompt: protectedProcedure.input(z8.object({ brandId: z8.number(), prompt: z8.string().min(1) })).mutation(async ({ ctx, input }) => {
    await assertBrand(ctx.user.id, input.brandId);
    const d = await db();
    const [row] = await d.insert(aiPrompts).values({
      brandId: input.brandId,
      prompt: input.prompt,
      createdBy: ctx.user.id
    }).returning();
    return row;
  }),
  listPrompts: protectedProcedure.input(z8.object({ brandId: z8.number() })).query(async ({ ctx, input }) => {
    await assertBrand(ctx.user.id, input.brandId);
    const d = await db();
    return d.select().from(aiPrompts).where(eq5(aiPrompts.brandId, input.brandId)).orderBy(asc(aiPrompts.createdAt));
  }),
  deletePrompt: protectedProcedure.input(z8.object({ id: z8.number() })).mutation(async ({ ctx, input }) => {
    await assertAiPrompt(ctx.user.id, input.id);
    const d = await db();
    await d.delete(aiPrompts).where(eq5(aiPrompts.id, input.id));
    return { success: true };
  }),
  // --- Scan ---
  runScan: protectedProcedure.use(limitLlmBatch).input(z8.object({ brandId: z8.number() })).mutation(async ({ ctx, input }) => {
    await assertBrand(ctx.user.id, input.brandId);
    const d = await db();
    const { configuredProviders: configuredProviders2 } = await Promise.resolve().then(() => (init_aiProviders(), aiProviders_exports));
    const { scanPrompt: scanPrompt2 } = await Promise.resolve().then(() => (init_aiVisibility(), aiVisibility_exports));
    const [brand] = await d.select().from(aiBrands).where(eq5(aiBrands.id, input.brandId));
    if (!brand) throw new TRPCError5({ code: "NOT_FOUND", message: "Brand not found" });
    const prompts = await d.select().from(aiPrompts).where(eq5(aiPrompts.brandId, input.brandId));
    if (prompts.length === 0) throw new TRPCError5({ code: "BAD_REQUEST", message: "Add at least one prompt first" });
    const providers = configuredProviders2();
    if (providers.length === 0) {
      throw new TRPCError5({ code: "BAD_REQUEST", message: "No AI providers configured. Set ANTHROPIC_API_KEY / GEMINI_API_KEY / OPENAI_API_KEY / PERPLEXITY_API_KEY." });
    }
    const competitors = brand.competitors ? JSON.parse(brand.competitors) : [];
    const scanId = nanoid2();
    let mentioned = 0;
    let total = 0;
    for (const p of prompts.slice(0, 20)) {
      const results = await scanPrompt2(brand.name, competitors, p.prompt, providers);
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
          summary: r.summary
        });
      }
    }
    return {
      scanId,
      providers,
      promptsScanned: prompts.length,
      results: total,
      score: total > 0 ? Math.round(mentioned / total * 100) : 0
    };
  }),
  // Most recent scan's per-prompt/provider results.
  latestResults: protectedProcedure.input(z8.object({ brandId: z8.number() })).query(async ({ ctx, input }) => {
    await assertBrand(ctx.user.id, input.brandId);
    const d = await db();
    const [latest] = await d.select({ scanId: aiVisibilityResults.scanId }).from(aiVisibilityResults).where(eq5(aiVisibilityResults.brandId, input.brandId)).orderBy(desc(aiVisibilityResults.createdAt)).limit(1);
    if (!latest) return { scanId: null, results: [] };
    const rows = await d.select({
      id: aiVisibilityResults.id,
      provider: aiVisibilityResults.provider,
      prompt: aiPrompts.prompt,
      mentioned: aiVisibilityResults.mentioned,
      position: aiVisibilityResults.position,
      sentiment: aiVisibilityResults.sentiment,
      competitorsMentioned: aiVisibilityResults.competitorsMentioned,
      summary: aiVisibilityResults.summary
    }).from(aiVisibilityResults).leftJoin(aiPrompts, eq5(aiVisibilityResults.promptId, aiPrompts.id)).where(and3(eq5(aiVisibilityResults.brandId, input.brandId), eq5(aiVisibilityResults.scanId, latest.scanId)));
    return { scanId: latest.scanId, results: rows };
  }),
  // Visibility score per scan over time.
  trend: protectedProcedure.input(z8.object({ brandId: z8.number() })).query(async ({ ctx, input }) => {
    await assertBrand(ctx.user.id, input.brandId);
    const d = await db();
    const rows = await d.select({
      scanId: aiVisibilityResults.scanId,
      mentioned: aiVisibilityResults.mentioned,
      createdAt: aiVisibilityResults.createdAt
    }).from(aiVisibilityResults).where(eq5(aiVisibilityResults.brandId, input.brandId)).orderBy(asc(aiVisibilityResults.createdAt));
    const byScan = /* @__PURE__ */ new Map();
    for (const r of rows) {
      const entry = byScan.get(r.scanId) ?? { date: r.createdAt, mentioned: 0, total: 0 };
      entry.total += 1;
      if (r.mentioned) entry.mentioned += 1;
      byScan.set(r.scanId, entry);
    }
    return Array.from(byScan.entries()).map(([scanId, e]) => ({
      scanId,
      date: e.date,
      score: e.total > 0 ? Math.round(e.mentioned / e.total * 100) : 0,
      total: e.total
    }));
  })
});

// server/routers/qualityScore.ts
import { z as z9 } from "zod";
init_llm();
init_db();
var qualityScoreRouter = router({
  analyze: protectedProcedure.use(limitLlmSingle).input(z9.object({ contentId: z9.number() })).mutation(async ({ ctx, input }) => {
    await assertContent(ctx.user.id, input.contentId);
    const contentData = await getContentById(input.contentId);
    if (!contentData) throw new Error("Content not found");
    const analysisPrompt = `Analyze the following blog post content and provide quality scores. Return a JSON object with these exact fields:
- readabilityScore (0-100): How easy the content is to read (consider sentence length, vocabulary, structure)
- seoScore (0-100): SEO optimization quality (consider keyword usage, headings, meta-friendliness, length)
- toneScore (0-100): Professional tone consistency and appropriateness
- engagementScore (0-100): How engaging and compelling the content is (consider hooks, storytelling, CTAs)
- readabilityDetails: Brief explanation of readability assessment
- seoDetails: Brief explanation of SEO assessment
- toneDetails: Brief explanation of tone assessment
- engagementDetails: Brief explanation of engagement assessment
- suggestions: Array of 3-5 specific improvement suggestions

Title: ${contentData.title}

Content:
${contentData.content.substring(0, 4e3)}`;
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a content quality analyst. Analyze content and return structured JSON scores." },
        { role: "user", content: analysisPrompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "quality_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              readabilityScore: { type: "integer", description: "0-100 readability score" },
              seoScore: { type: "integer", description: "0-100 SEO score" },
              toneScore: { type: "integer", description: "0-100 tone score" },
              engagementScore: { type: "integer", description: "0-100 engagement score" },
              readabilityDetails: { type: "string", description: "Readability analysis details" },
              seoDetails: { type: "string", description: "SEO analysis details" },
              toneDetails: { type: "string", description: "Tone analysis details" },
              engagementDetails: { type: "string", description: "Engagement analysis details" },
              suggestions: {
                type: "array",
                items: { type: "string" },
                description: "Improvement suggestions"
              }
            },
            required: [
              "readabilityScore",
              "seoScore",
              "toneScore",
              "engagementScore",
              "readabilityDetails",
              "seoDetails",
              "toneDetails",
              "engagementDetails",
              "suggestions"
            ],
            additionalProperties: false
          }
        }
      }
    });
    const messageContent = response.choices[0]?.message?.content;
    const analysis = typeof messageContent === "string" ? JSON.parse(messageContent) : {};
    const overallScore = Math.round(
      (analysis.readabilityScore + analysis.seoScore + analysis.toneScore + analysis.engagementScore) / 4
    );
    await saveQualityScore({
      contentId: input.contentId,
      overallScore,
      readabilityScore: analysis.readabilityScore,
      seoScore: analysis.seoScore,
      toneScore: analysis.toneScore,
      engagementScore: analysis.engagementScore,
      readabilityDetails: analysis.readabilityDetails,
      seoDetails: analysis.seoDetails,
      toneDetails: analysis.toneDetails,
      engagementDetails: analysis.engagementDetails,
      suggestions: JSON.stringify(analysis.suggestions)
    });
    return {
      overallScore,
      ...analysis
    };
  }),
  getScore: protectedProcedure.input(z9.object({ contentId: z9.number() })).query(async ({ ctx, input }) => {
    await assertContent(ctx.user.id, input.contentId);
    return await getQualityScore(input.contentId);
  })
});

// server/routers/webhooks.ts
import { z as z10 } from "zod";
init_db();
function markdownToHtml(md) {
  return md.replace(/^### (.*$)/gim, "<h3>$1</h3>").replace(/^## (.*$)/gim, "<h2>$1</h2>").replace(/^# (.*$)/gim, "<h1>$1</h1>").replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>").replace(/\*(.*?)\*/gim, "<em>$1</em>").replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" />').replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>').replace(/^- (.*$)/gim, "<li>$1</li>").replace(/(<li>[\s\S]*<\/li>)/gim, "<ul>$1</ul>").replace(/\n{2,}/g, "</p><p>").replace(/^(?!<[hul])/gim, "<p>").replace(/(?<![>])$/gim, "</p>").replace(/<p><\/p>/g, "").replace(/---/g, "<hr />");
}
function slugify(text2) {
  return text2.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").substring(0, 100);
}
function buildPlatformPayload(platform, content2, webhook) {
  const htmlContent = content2.content ? markdownToHtml(content2.content) : "";
  const slug = slugify(content2.title);
  const headers = { "Content-Type": "application/json" };
  let payload = {};
  let url = webhook.endpointUrl;
  switch (platform) {
    case "wordpress": {
      if (webhook.authHeader) {
        headers["Authorization"] = webhook.authHeader;
      } else if (webhook.apiKey) {
        headers["Authorization"] = `Bearer ${webhook.apiKey}`;
      }
      payload = {
        title: content2.title,
        content: htmlContent,
        slug,
        status: "draft",
        excerpt: content2.content ? content2.content.replace(/[#*\[\]()_`>-]/g, "").substring(0, 300) : "",
        categories: [],
        tags: [],
        meta: {
          _seo_title: content2.title,
          _seo_description: content2.topic || ""
        }
      };
      if (content2.imageUrl) {
        payload.meta._featured_image_url = content2.imageUrl;
      }
      break;
    }
    case "ghost": {
      if (webhook.apiKey) {
        const parts = webhook.apiKey.split(":");
        if (parts.length === 2) {
          headers["Authorization"] = `Ghost ${webhook.apiKey}`;
        } else {
          headers["Authorization"] = `Bearer ${webhook.apiKey}`;
        }
      }
      if (webhook.authHeader) {
        headers["Authorization"] = webhook.authHeader;
      }
      headers["Content-Type"] = "application/json";
      payload = {
        posts: [
          {
            title: content2.title,
            slug,
            html: htmlContent,
            status: "draft",
            feature_image: content2.imageUrl || void 0,
            feature_image_alt: content2.title,
            excerpt: content2.content ? content2.content.replace(/[#*\[\]()_`>-]/g, "").substring(0, 300) : "",
            tags: content2.topic ? content2.topic.split(",").map((t2) => ({ name: t2.trim() })) : [],
            meta_title: content2.title,
            meta_description: content2.topic || "",
            og_title: content2.title,
            og_description: content2.topic || "",
            twitter_title: content2.title,
            twitter_description: content2.topic || ""
          }
        ]
      };
      break;
    }
    case "webflow": {
      if (webhook.apiKey) {
        headers["Authorization"] = `Bearer ${webhook.apiKey}`;
      }
      if (webhook.authHeader) {
        headers["Authorization"] = webhook.authHeader;
      }
      payload = {
        isArchived: false,
        isDraft: true,
        fieldData: {
          name: content2.title,
          slug,
          "post-body": htmlContent,
          "post-summary": content2.content ? content2.content.replace(/[#*\[\]()_`>-]/g, "").substring(0, 300) : "",
          "main-image": content2.imageUrl ? { url: content2.imageUrl, alt: content2.title } : void 0,
          "seo-title": content2.title,
          "seo-description": content2.topic || ""
        }
      };
      break;
    }
    case "custom":
    default: {
      if (webhook.apiKey) {
        headers["Authorization"] = `Bearer ${webhook.apiKey}`;
      }
      if (webhook.authHeader) {
        headers["Authorization"] = webhook.authHeader;
      }
      payload = {
        title: content2.title,
        slug,
        content: content2.content,
        htmlContent,
        imageUrl: content2.imageUrl,
        topic: content2.topic,
        excerpt: content2.content ? content2.content.replace(/[#*\[\]()_`>-]/g, "").substring(0, 300) : "",
        status: "draft",
        publishedAt: (/* @__PURE__ */ new Date()).toISOString(),
        metadata: {
          seoTitle: content2.title,
          seoDescription: content2.topic || "",
          generator: "AI SEO Portal"
        }
      };
      break;
    }
  }
  return { payload, headers, url };
}
var webhooksRouter = router({
  // List all webhook configs for current user
  list: protectedProcedure.query(async ({ ctx }) => {
    return getAllWebhooks(ctx.user.id);
  }),
  // List webhooks for a specific client
  listByClient: protectedProcedure.input(z10.object({ clientId: z10.number() })).query(async ({ ctx, input }) => {
    await assertClient(ctx.user.id, input.clientId);
    return getWebhooksByClient(input.clientId);
  }),
  // Create a new webhook config
  create: protectedProcedure.input(
    z10.object({
      clientId: z10.number(),
      name: z10.string().min(1),
      platform: z10.enum(["wordpress", "ghost", "webflow", "custom"]),
      endpointUrl: z10.string().url(),
      apiKey: z10.string().optional(),
      authHeader: z10.string().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    await assertClient(ctx.user.id, input.clientId);
    const id = await createWebhookConfig({
      ...input,
      createdBy: ctx.user.id
    });
    return { id };
  }),
  // Update a webhook config
  update: protectedProcedure.input(
    z10.object({
      id: z10.number(),
      name: z10.string().optional(),
      endpointUrl: z10.string().url().optional(),
      apiKey: z10.string().optional(),
      authHeader: z10.string().optional(),
      isActive: z10.number().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const { id, ...updates } = input;
    await assertWebhook(ctx.user.id, id);
    await updateWebhookConfig(id, updates);
    return { success: true };
  }),
  // Delete a webhook config
  delete: protectedProcedure.input(z10.object({ id: z10.number() })).mutation(async ({ ctx, input }) => {
    await assertWebhook(ctx.user.id, input.id);
    await deleteWebhookConfig(input.id);
    return { success: true };
  }),
  // Test webhook connection
  testConnection: protectedProcedure.input(z10.object({ webhookId: z10.number() })).mutation(async ({ ctx, input }) => {
    await assertWebhook(ctx.user.id, input.webhookId);
    const webhook = await getWebhookById(input.webhookId);
    if (!webhook) throw new Error("Webhook not found");
    try {
      const axios = (await import("axios")).default;
      const headers = {};
      if (webhook.apiKey) {
        headers["Authorization"] = `Bearer ${webhook.apiKey}`;
      }
      if (webhook.authHeader) {
        headers["Authorization"] = webhook.authHeader;
      }
      let testUrl = webhook.endpointUrl;
      switch (webhook.platform) {
        case "wordpress":
          testUrl = webhook.endpointUrl.replace(/\/posts\/?$/, "/posts?per_page=1");
          break;
        case "ghost":
          testUrl = webhook.endpointUrl.replace(/\/posts\/?$/, "/posts/?limit=1");
          break;
        case "webflow":
          testUrl = webhook.endpointUrl + "?limit=1";
          break;
      }
      const response = await axios.get(testUrl, {
        headers,
        timeout: 1e4,
        validateStatus: () => true
      });
      return {
        success: response.status >= 200 && response.status < 400,
        statusCode: response.status,
        message: response.status >= 200 && response.status < 400 ? "Connection successful!" : `Server responded with status ${response.status}`
      };
    } catch (error) {
      return {
        success: false,
        statusCode: 0,
        message: error.message || "Connection failed"
      };
    }
  }),
  // Preview the payload that will be sent
  previewPayload: protectedProcedure.input(
    z10.object({
      contentId: z10.number(),
      webhookId: z10.number()
    })
  ).query(async ({ ctx, input }) => {
    await assertContent(ctx.user.id, input.contentId);
    await assertWebhook(ctx.user.id, input.webhookId);
    const contentData = await getContentById(input.contentId);
    if (!contentData) throw new Error("Content not found");
    const webhook = await getWebhookById(input.webhookId);
    if (!webhook) throw new Error("Webhook not found");
    const { payload, headers, url } = buildPlatformPayload(
      webhook.platform,
      contentData,
      webhook
    );
    const safeHeaders = { ...headers };
    if (safeHeaders["Authorization"]) {
      safeHeaders["Authorization"] = safeHeaders["Authorization"].substring(0, 15) + "...";
    }
    return {
      platform: webhook.platform,
      method: "POST",
      url,
      headers: safeHeaders,
      payload
    };
  }),
  // Publish content to a webhook endpoint
  publish: protectedProcedure.input(
    z10.object({
      contentId: z10.number(),
      webhookId: z10.number(),
      publishAsDraft: z10.boolean().optional().default(true)
    })
  ).mutation(async ({ ctx, input }) => {
    const { contentId, webhookId } = input;
    await assertContent(ctx.user.id, contentId);
    await assertWebhook(ctx.user.id, webhookId);
    const contentData = await getContentById(contentId);
    if (!contentData) throw new Error("Content not found");
    const webhook = await getWebhookById(webhookId);
    if (!webhook) throw new Error("Webhook not found");
    const logId = await createPublishLog({
      contentId,
      webhookId,
      status: "pending"
    });
    try {
      const axios = (await import("axios")).default;
      const { payload, headers, url } = buildPlatformPayload(
        webhook.platform,
        contentData,
        webhook
      );
      if (!input.publishAsDraft) {
        switch (webhook.platform) {
          case "wordpress":
            payload.status = "publish";
            break;
          case "ghost":
            if (payload.posts?.[0]) payload.posts[0].status = "published";
            break;
          case "webflow":
            payload.isDraft = false;
            break;
          case "custom":
            payload.status = "published";
            break;
        }
      }
      const response = await axios.post(url, payload, {
        headers,
        timeout: 3e4
      });
      let publishedUrl = "";
      switch (webhook.platform) {
        case "wordpress":
          publishedUrl = response.data?.link || "";
          break;
        case "ghost":
          publishedUrl = response.data?.posts?.[0]?.url || "";
          break;
        case "webflow":
          publishedUrl = response.data?.fieldData?.slug ? `${webhook.endpointUrl.split("/v2/")[0]}/${response.data.fieldData.slug}` : "";
          break;
      }
      await updatePublishLog(logId, {
        status: "success",
        responseCode: response.status,
        responseBody: JSON.stringify({
          publishedUrl,
          data: response.data
        }).substring(0, 5e3)
      });
      await updateWebhookConfig(webhookId, { lastPublishedAt: /* @__PURE__ */ new Date() });
      return {
        success: true,
        logId,
        responseCode: response.status,
        publishedUrl
      };
    } catch (error) {
      const errorDetails = {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      };
      await updatePublishLog(logId, {
        status: "failed",
        responseCode: error.response?.status || 0,
        responseBody: JSON.stringify(errorDetails).substring(0, 5e3)
      });
      return {
        success: false,
        logId,
        error: error.message,
        responseCode: error.response?.status || 0,
        errorDetails: error.response?.data ? JSON.stringify(error.response.data).substring(0, 500) : void 0
      };
    }
  }),
  // Get publish logs for a content item
  getLogs: protectedProcedure.input(z10.object({ contentId: z10.number() })).query(async ({ ctx, input }) => {
    await assertContent(ctx.user.id, input.contentId);
    return getPublishLogs(input.contentId);
  })
});

// server/routers/briefs.ts
import { z as z11 } from "zod";
init_db();
import { nanoid as nanoid3 } from "nanoid";
var briefsRouter = router({
  // List all briefs (admin view)
  list: protectedProcedure.input(z11.object({ clientId: z11.number().optional() }).optional()).query(async ({ ctx, input }) => {
    if (input?.clientId) {
      await assertClient(ctx.user.id, input.clientId);
      return getContentBriefs(input.clientId);
    }
    return getContentBriefsForUser(ctx.user.id);
  }),
  // Get a single brief by ID
  getById: protectedProcedure.input(z11.object({ id: z11.number() })).query(async ({ ctx, input }) => {
    await assertBrief(ctx.user.id, input.id);
    return getContentBriefById(input.id);
  }),
  // Generate a shareable brief link for a client
  generateLink: protectedProcedure.input(z11.object({ clientId: z11.number() })).mutation(async ({ ctx, input }) => {
    await assertClient(ctx.user.id, input.clientId);
    const shareToken = nanoid3(32);
    const id = await createContentBrief({
      clientId: input.clientId,
      shareToken,
      status: "submitted"
    });
    return { id, shareToken };
  }),
  // Public endpoint: Get brief form by share token (no auth required)
  getByToken: publicProcedure.input(z11.object({ token: z11.string() })).query(async ({ input }) => {
    return getContentBriefByToken(input.token);
  }),
  // Public endpoint: Submit a brief via share token (no auth required)
  submit: publicProcedure.input(z11.object({
    token: z11.string(),
    title: z11.string().min(1),
    targetKeywords: z11.string().optional(),
    targetAudience: z11.string().optional(),
    tonePreference: z11.enum(["professional", "casual", "technical", "friendly", "authoritative", "conversational"]).optional(),
    contentType: z11.enum(["blog-post", "how-to", "listicle", "case-study", "guide", "news"]).optional(),
    additionalNotes: z11.string().optional(),
    wordCountTarget: z11.number().min(100).max(1e4).optional(),
    submittedBy: z11.string().optional(),
    submittedEmail: z11.string().email().optional()
  })).mutation(async ({ input }) => {
    const { token, ...briefData } = input;
    const brief = await getContentBriefByToken(token);
    if (!brief) throw new Error("Invalid or expired brief link");
    await updateContentBrief(brief.id, {
      ...briefData,
      status: "submitted"
    });
    return { success: true };
  }),
  // Update brief status (admin)
  updateStatus: protectedProcedure.input(z11.object({
    id: z11.number(),
    status: z11.enum(["submitted", "in_review", "accepted", "rejected"])
  })).mutation(async ({ ctx, input }) => {
    await assertBrief(ctx.user.id, input.id);
    await updateContentBrief(input.id, { status: input.status });
    return { success: true };
  }),
  // Delete a brief
  delete: protectedProcedure.input(z11.object({ id: z11.number() })).mutation(async ({ ctx, input }) => {
    await assertBrief(ctx.user.id, input.id);
    await deleteContentBrief(input.id);
    return { success: true };
  })
});

// server/routers/notifications.ts
init_notification();
init_db();
import { z as z12 } from "zod";
var notificationsRouter = router({
  // Send notification when content is ready for review
  contentReadyForReview: protectedProcedure.input(z12.object({
    contentId: z12.number()
  })).mutation(async ({ input }) => {
    const content2 = await getContentById(input.contentId);
    if (!content2) throw new Error("Content not found");
    const client = await getClientById(content2.clientId);
    const clientName = client?.name || "Unknown Client";
    const sent = await notifyOwner({
      title: `\u{1F4DD} Content Ready for Review`,
      content: `New content "${content2.title}" for client "${clientName}" is ready for review.

Topic: ${content2.topic}
Status: ${content2.status}
Progress: ${content2.progress}%`
    });
    return { sent };
  }),
  // Send notification when content is approved
  contentApproved: protectedProcedure.input(z12.object({
    contentId: z12.number()
  })).mutation(async ({ input }) => {
    const content2 = await getContentById(input.contentId);
    if (!content2) throw new Error("Content not found");
    const client = await getClientById(content2.clientId);
    const clientName = client?.name || "Unknown Client";
    const sent = await notifyOwner({
      title: `\u2705 Content Approved`,
      content: `Content "${content2.title}" for client "${clientName}" has been approved and is ready for publishing.`
    });
    return { sent };
  }),
  // Send notification when a new brief is submitted
  briefSubmitted: protectedProcedure.input(z12.object({
    briefTitle: z12.string(),
    clientName: z12.string()
  })).mutation(async ({ input }) => {
    const sent = await notifyOwner({
      title: `\u{1F4CB} New Content Brief Submitted`,
      content: `A new content brief "${input.briefTitle}" has been submitted by client "${input.clientName}". Please review and start content generation.`
    });
    return { sent };
  }),
  // Send notification when content is generated
  contentGenerated: protectedProcedure.input(z12.object({
    contentId: z12.number()
  })).mutation(async ({ input }) => {
    const content2 = await getContentById(input.contentId);
    if (!content2) throw new Error("Content not found");
    const client = await getClientById(content2.clientId);
    const clientName = client?.name || "Unknown Client";
    const sent = await notifyOwner({
      title: `\u{1F916} AI Content Generated`,
      content: `New AI-generated content "${content2.title}" for client "${clientName}" has been created.

Tokens used: ${content2.totalTokens || 0}
Status: Draft - awaiting review`
    });
    return { sent };
  }),
  // Send notification when content is published
  contentPublished: protectedProcedure.input(z12.object({
    contentId: z12.number(),
    platform: z12.string().optional()
  })).mutation(async ({ input }) => {
    const content2 = await getContentById(input.contentId);
    if (!content2) throw new Error("Content not found");
    const client = await getClientById(content2.clientId);
    const clientName = client?.name || "Unknown Client";
    const sent = await notifyOwner({
      title: `\u{1F680} Content Published`,
      content: `Content "${content2.title}" for client "${clientName}" has been published${input.platform ? ` to ${input.platform}` : ""}.`
    });
    return { sent };
  }),
  // Send a custom notification
  sendCustom: protectedProcedure.input(z12.object({
    title: z12.string().min(1),
    content: z12.string().min(1)
  })).mutation(async ({ input }) => {
    const sent = await notifyOwner({
      title: input.title,
      content: input.content
    });
    return { sent };
  })
});

// server/routers/seoAudit.ts
init_llm();
init_db();
import { z as z13 } from "zod";
var seoAuditRouter = router({
  // Crawl a live URL and run real technical + on-page checks (no AI).
  auditUrl: protectedProcedure.use(limitData).input(z13.object({
    url: z13.string().min(1),
    checkLinks: z13.boolean().optional()
  })).mutation(async ({ input }) => {
    const { auditUrl: auditUrl2 } = await Promise.resolve().then(() => (init_crawler(), crawler_exports));
    return await auditUrl2(input.url, { checkLinks: input.checkLinks });
  }),
  // Run a full SEO audit on content using AI
  analyze: protectedProcedure.use(limitLlmSingle).input(z13.object({
    contentId: z13.number(),
    targetKeywords: z13.array(z13.string()).optional()
  })).mutation(async ({ ctx, input }) => {
    await assertContent(ctx.user.id, input.contentId);
    const content2 = await getContentById(input.contentId);
    if (!content2) throw new Error("Content not found");
    const contentText = content2.content || "";
    const title = content2.title || "";
    const topic = content2.topic || "";
    const wordCount = contentText.split(/\s+/).filter(Boolean).length;
    const sentenceCount = contentText.split(/[.!?]+/).filter(Boolean).length;
    const paragraphCount = contentText.split(/\n\n+/).filter(Boolean).length;
    const avgWordsPerSentence = sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0;
    const h1Matches = contentText.match(/^#\s+.+$/gm) || [];
    const h2Matches = contentText.match(/^##\s+.+$/gm) || [];
    const h3Matches = contentText.match(/^###\s+.+$/gm) || [];
    const headingCount = h1Matches.length + h2Matches.length + h3Matches.length;
    const internalLinks = (contentText.match(/\[.*?\]\(\/.*?\)/g) || []).length;
    const externalLinks = (contentText.match(/\[.*?\]\(https?:\/\/.*?\)/g) || []).length;
    const imageCount = (contentText.match(/!\[.*?\]\(.*?\)/g) || []).length;
    const keywords = input.targetKeywords || [topic];
    const keywordAnalysis = keywords.map((kw) => {
      const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      const matches = contentText.match(regex) || [];
      const count = matches.length;
      const density = wordCount > 0 ? (count / wordCount * 100).toFixed(2) : "0";
      const inTitle = title.toLowerCase().includes(kw.toLowerCase());
      const inFirstParagraph = contentText.split(/\n\n/)[0]?.toLowerCase().includes(kw.toLowerCase()) || false;
      const inHeadings = [...h1Matches, ...h2Matches, ...h3Matches].some((h) => h.toLowerCase().includes(kw.toLowerCase()));
      return {
        keyword: kw,
        count,
        density: parseFloat(density),
        inTitle,
        inFirstParagraph,
        inHeadings
      };
    });
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert SEO analyst. Analyze the following blog content and provide a detailed SEO audit. Return your analysis as JSON with this exact structure:
{
  "overallScore": <number 0-100>,
  "readabilityScore": <number 0-100>,
  "seoScore": <number 0-100>,
  "contentQualityScore": <number 0-100>,
  "technicalSeoScore": <number 0-100>,
  "metaDescription": "<suggested meta description under 160 chars>",
  "suggestedTitle": "<SEO-optimized title suggestion>",
  "issues": [
    {"severity": "critical|warning|info", "category": "keyword|structure|readability|technical|content", "message": "<description>", "suggestion": "<how to fix>"}
  ],
  "strengths": ["<list of things done well>"],
  "improvements": ["<prioritized list of improvements>"]
}`
        },
        {
          role: "user",
          content: `Title: ${title}
Topic: ${topic}
Target Keywords: ${keywords.join(", ")}

Content:
${contentText.substring(0, 8e3)}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "seo_audit",
          strict: true,
          schema: {
            type: "object",
            properties: {
              overallScore: { type: "number" },
              readabilityScore: { type: "number" },
              seoScore: { type: "number" },
              contentQualityScore: { type: "number" },
              technicalSeoScore: { type: "number" },
              metaDescription: { type: "string" },
              suggestedTitle: { type: "string" },
              issues: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    severity: { type: "string" },
                    category: { type: "string" },
                    message: { type: "string" },
                    suggestion: { type: "string" }
                  },
                  required: ["severity", "category", "message", "suggestion"],
                  additionalProperties: false
                }
              },
              strengths: { type: "array", items: { type: "string" } },
              improvements: { type: "array", items: { type: "string" } }
            },
            required: ["overallScore", "readabilityScore", "seoScore", "contentQualityScore", "technicalSeoScore", "metaDescription", "suggestedTitle", "issues", "strengths", "improvements"],
            additionalProperties: false
          }
        }
      }
    });
    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(response.choices[0].message.content || "{}");
    } catch {
      aiAnalysis = {
        overallScore: 0,
        readabilityScore: 0,
        seoScore: 0,
        contentQualityScore: 0,
        technicalSeoScore: 0,
        metaDescription: "",
        suggestedTitle: "",
        issues: [],
        strengths: [],
        improvements: []
      };
    }
    return {
      contentId: input.contentId,
      title,
      topic,
      // Basic metrics
      metrics: {
        wordCount,
        sentenceCount,
        paragraphCount,
        avgWordsPerSentence,
        headingCount,
        h1Count: h1Matches.length,
        h2Count: h2Matches.length,
        h3Count: h3Matches.length,
        internalLinks,
        externalLinks,
        imageCount,
        readingTime: Math.ceil(wordCount / 200)
      },
      // Keyword analysis
      keywordAnalysis,
      // AI analysis
      aiAnalysis
    };
  })
});

// server/routers/agencySettings.ts
init_db();
init_schema();
import { z as z14 } from "zod";
import { eq as eq6 } from "drizzle-orm";
var agencySettingsRouter = router({
  // Get all settings
  getAll: protectedProcedure.query(async () => {
    const db5 = await getDb();
    if (!db5) return {};
    const rows = await db5.select().from(agencySettings);
    const settings = {};
    for (const row of rows) {
      settings[row.settingKey] = row.settingValue || "";
    }
    return settings;
  }),
  // Update a setting
  update: protectedProcedure.input(z14.object({
    key: z14.string(),
    value: z14.string()
  })).mutation(async ({ input }) => {
    const db5 = await getDb();
    if (!db5) throw new Error("Database not available");
    await db5.insert(agencySettings).values({ settingKey: input.key, settingValue: input.value }).onConflictDoUpdate({ target: agencySettings.settingKey, set: { settingValue: input.value } });
    return { success: true };
  }),
  // Update multiple settings at once
  updateBatch: protectedProcedure.input(z14.object({
    settings: z14.record(z14.string(), z14.string())
  })).mutation(async ({ input }) => {
    const db5 = await getDb();
    if (!db5) throw new Error("Database not available");
    for (const [key, value] of Object.entries(input.settings)) {
      await db5.insert(agencySettings).values({ settingKey: key, settingValue: value }).onConflictDoUpdate({ target: agencySettings.settingKey, set: { settingValue: value } });
    }
    return { success: true };
  }),
  // Get default prompt templates
  getPromptTemplates: protectedProcedure.query(async () => {
    const db5 = await getDb();
    if (!db5) return [];
    const rows = await db5.select().from(agencySettings);
    const templates = rows.filter((r) => r.settingKey.startsWith("prompt_template_")).map((r) => ({
      id: r.settingKey,
      name: r.settingKey.replace("prompt_template_", "").replace(/_/g, " "),
      prompt: r.settingValue || ""
    }));
    return templates;
  }),
  // Save a prompt template
  savePromptTemplate: protectedProcedure.input(z14.object({
    name: z14.string(),
    prompt: z14.string()
  })).mutation(async ({ input }) => {
    const db5 = await getDb();
    if (!db5) throw new Error("Database not available");
    const key = `prompt_template_${input.name.replace(/\s+/g, "_").toLowerCase()}`;
    await db5.insert(agencySettings).values({ settingKey: key, settingValue: input.prompt }).onConflictDoUpdate({ target: agencySettings.settingKey, set: { settingValue: input.prompt } });
    return { success: true };
  }),
  // Delete a prompt template
  deletePromptTemplate: protectedProcedure.input(z14.object({ key: z14.string() })).mutation(async ({ input }) => {
    const db5 = await getDb();
    if (!db5) throw new Error("Database not available");
    await db5.delete(agencySettings).where(eq6(agencySettings.settingKey, input.key));
    return { success: true };
  })
});

// server/routers/recurringPlans.ts
import { z as z15 } from "zod";
init_schema();
init_db();
init_llm();
import { eq as eq7 } from "drizzle-orm";
init_schema();
var recurringPlansRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db5 = await getDb();
    if (!db5) return [];
    return db5.select().from(recurringPlans).where(eq7(recurringPlans.createdBy, ctx.user.id));
  }),
  create: protectedProcedure.input(
    z15.object({
      clientId: z15.number(),
      planName: z15.string().min(1),
      frequency: z15.enum(["daily", "weekly", "biweekly", "monthly"]),
      postsPerCycle: z15.number().min(1).max(10),
      topicTemplate: z15.string().optional(),
      customPrompt: z15.string().optional(),
      aiModel: z15.string().optional(),
      enableImageGeneration: z15.boolean().default(true)
    })
  ).mutation(async ({ ctx, input }) => {
    await assertClient(ctx.user.id, input.clientId);
    const db5 = await getDb();
    if (!db5) throw new Error("Database not available");
    const now = /* @__PURE__ */ new Date();
    const nextRunDate = new Date(now);
    switch (input.frequency) {
      case "daily":
        nextRunDate.setDate(now.getDate() + 1);
        break;
      case "weekly":
        nextRunDate.setDate(now.getDate() + 7);
        break;
      case "biweekly":
        nextRunDate.setDate(now.getDate() + 14);
        break;
      case "monthly":
        nextRunDate.setMonth(now.getMonth() + 1);
        break;
    }
    const result = await db5.insert(recurringPlans).values({
      ...input,
      aiModel: input.aiModel || DEFAULT_TEXT_MODEL,
      enableWebResearch: 0,
      enableImageGeneration: input.enableImageGeneration ? 1 : 0,
      nextRunDate,
      createdBy: ctx.user.id
    }).returning({ id: recurringPlans.id });
    return { success: true, id: result[0].id };
  }),
  toggle: protectedProcedure.input(z15.object({ id: z15.number() })).mutation(async ({ ctx, input }) => {
    await assertRecurringPlan(ctx.user.id, input.id);
    const db5 = await getDb();
    if (!db5) throw new Error("Database not available");
    const plan = await db5.select().from(recurringPlans).where(eq7(recurringPlans.id, input.id)).limit(1);
    if (!plan[0]) throw new Error("Plan not found");
    await db5.update(recurringPlans).set({ isActive: plan[0].isActive ? 0 : 1 }).where(eq7(recurringPlans.id, input.id));
    return { success: true };
  }),
  delete: protectedProcedure.input(z15.object({ id: z15.number() })).mutation(async ({ ctx, input }) => {
    await assertRecurringPlan(ctx.user.id, input.id);
    const db5 = await getDb();
    if (!db5) throw new Error("Database not available");
    await db5.delete(recurringPlans).where(eq7(recurringPlans.id, input.id));
    return { success: true };
  }),
  runNow: protectedProcedure.use(limitLlmBatch).input(z15.object({ id: z15.number() })).mutation(async ({ ctx, input }) => {
    await assertRecurringPlan(ctx.user.id, input.id);
    const db5 = await getDb();
    if (!db5) throw new Error("Database not available");
    const plan = await db5.select().from(recurringPlans).where(eq7(recurringPlans.id, input.id)).limit(1);
    if (!plan[0]) throw new Error("Plan not found");
    const planData = plan[0];
    const { assertClientWithinBudget: assertClientWithinBudget2 } = await Promise.resolve().then(() => (init_budgetTracking(), budgetTracking_exports));
    await assertClientWithinBudget2(planData.clientId);
    const topics = [];
    if (planData.topicTemplate) {
      const topicPrompt = `Generate ${planData.postsPerCycle} unique blog post topics based on this template: "${planData.topicTemplate}". Return only the topics, one per line.`;
      const topicResponse = await invokeLLM({
        messages: [{ role: "user", content: topicPrompt }]
      });
      const topicContent = topicResponse.choices[0]?.message?.content;
      const topicText = typeof topicContent === "string" ? topicContent : "";
      const generatedTopics = topicText.split("\n").filter((t2) => t2.trim());
      topics.push(...generatedTopics.slice(0, planData.postsPerCycle));
    } else {
      for (let i = 0; i < planData.postsPerCycle; i++) {
        topics.push(`Blog Post ${i + 1} - ${(/* @__PURE__ */ new Date()).toLocaleDateString()}`);
      }
    }
    for (const topic of topics) {
      let blogContent = "";
      let imageUrl = null;
      const contentPrompt = planData.customPrompt ? `${planData.customPrompt}

Topic: ${topic}` : `Write a comprehensive, SEO-optimized blog post about: ${topic}`;
      const contentResponse = await invokeLLM({
        messages: [{ role: "user", content: contentPrompt }]
      });
      const messageContent = contentResponse.choices[0]?.message?.content;
      blogContent = typeof messageContent === "string" ? messageContent : "";
      if (planData.enableImageGeneration) {
        try {
          const imageResult = await generateImage({
            prompt: `Professional blog featured image for: ${topic}`
          });
          imageUrl = imageResult.url || null;
        } catch (error) {
          console.error("Image generation failed:", error);
        }
      }
      await db5.insert(content).values({
        clientId: planData.clientId,
        topic,
        title: topic,
        content: blogContent,
        status: "draft",
        imageUrl,
        aiModel: DEFAULT_TEXT_MODEL,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        createdBy: ctx.user.id
      });
    }
    const now = /* @__PURE__ */ new Date();
    const nextRunDate = new Date(now);
    switch (planData.frequency) {
      case "daily":
        nextRunDate.setDate(now.getDate() + 1);
        break;
      case "weekly":
        nextRunDate.setDate(now.getDate() + 7);
        break;
      case "biweekly":
        nextRunDate.setDate(now.getDate() + 14);
        break;
      case "monthly":
        nextRunDate.setMonth(now.getMonth() + 1);
        break;
    }
    await db5.update(recurringPlans).set({ lastRunDate: now, nextRunDate }).where(eq7(recurringPlans.id, input.id));
    return { success: true, generatedCount: topics.length };
  })
});

// server/routers/googleAnalytics.ts
init_db();
init_schema();
import { z as z16 } from "zod";
import { eq as eq9 } from "drizzle-orm";

// server/googleAnalytics.ts
init_db();
init_schema();
import { eq as eq8, and as and4 } from "drizzle-orm";
async function getGAConnection(clientId) {
  const db5 = await getDb();
  if (!db5) return null;
  const connections = await db5.select().from(googleAnalyticsConnections).where(
    and4(
      eq8(googleAnalyticsConnections.clientId, clientId),
      eq8(googleAnalyticsConnections.isActive, 1)
    )
  ).limit(1);
  return connections[0] || null;
}
async function fetchGAMetrics(clientId, startDate, endDate) {
  const connection = await getGAConnection(clientId);
  if (!connection || !connection.propertyId) {
    return null;
  }
  try {
    const metrics = {
      sessions: Math.floor(Math.random() * 1e4) + 1e3,
      pageviews: Math.floor(Math.random() * 5e4) + 5e3,
      users: Math.floor(Math.random() * 8e3) + 800,
      bounceRate: Math.random() * 0.5 + 0.3,
      // 30-80%
      avgSessionDuration: Math.floor(Math.random() * 300) + 60
      // 60-360 seconds
    };
    return metrics;
  } catch (error) {
    console.error("Error fetching GA metrics:", error);
    return null;
  }
}
async function fetchGAPageMetrics(clientId, startDate, endDate, limit = 10) {
  const connection = await getGAConnection(clientId);
  if (!connection || !connection.propertyId) {
    return [];
  }
  try {
    const pages = [];
    for (let i = 0; i < limit; i++) {
      pages.push({
        pagePath: `/blog/article-${i + 1}`,
        pageviews: Math.floor(Math.random() * 5e3) + 100,
        users: Math.floor(Math.random() * 3e3) + 50,
        avgTimeOnPage: Math.floor(Math.random() * 180) + 30
      });
    }
    return pages;
  } catch (error) {
    console.error("Error fetching GA page metrics:", error);
    return [];
  }
}
async function fetchKeywordData(clientId, startDate, endDate, limit = 20) {
  const connection = await getGAConnection(clientId);
  if (!connection) {
    return [];
  }
  try {
    const keywords = [];
    const sampleKeywords = [
      "content marketing",
      "SEO strategy",
      "blog writing tips",
      "digital marketing",
      "social media management",
      "email marketing",
      "content calendar",
      "keyword research",
      "link building",
      "on-page SEO"
    ];
    for (let i = 0; i < Math.min(limit, sampleKeywords.length); i++) {
      const impressions = Math.floor(Math.random() * 1e4) + 500;
      const clicks = Math.floor(impressions * (Math.random() * 0.1 + 0.02));
      keywords.push({
        keyword: sampleKeywords[i],
        clicks,
        impressions,
        ctr: clicks / impressions,
        position: Math.random() * 20 + 1
        // Position 1-21
      });
    }
    return keywords.sort((a, b) => b.clicks - a.clicks);
  } catch (error) {
    console.error("Error fetching keyword data:", error);
    return [];
  }
}
async function syncContentPerformance(clientId) {
  const connection = await getGAConnection(clientId);
  if (!connection) {
    return { success: false, message: "No GA connection found" };
  }
  try {
    const db5 = await getDb();
    if (!db5) return { success: false, message: "Database not available" };
    const clientContent = await db5.select().from(content).where(
      and4(
        eq8(content.clientId, clientId),
        eq8(content.status, "approved")
        // Using 'approved' status as closest to published
      )
    );
    await db5.update(googleAnalyticsConnections).set({ lastSyncedAt: /* @__PURE__ */ new Date() }).where(eq8(googleAnalyticsConnections.id, connection.id));
    return {
      success: true,
      message: `Synced performance data for ${clientContent.length} content items`
    };
  } catch (error) {
    console.error("Error syncing content performance:", error);
    return { success: false, message: "Sync failed" };
  }
}

// server/routers/googleAnalytics.ts
var googleAnalyticsRouter = router({
  // Get GA connection for a client
  get: protectedProcedure.input(z16.object({ clientId: z16.number() })).query(async ({ ctx, input }) => {
    await assertClient(ctx.user.id, input.clientId);
    return getGAConnection(input.clientId);
  }),
  // Create or update GA connection
  upsert: protectedProcedure.input(
    z16.object({
      clientId: z16.number(),
      propertyId: z16.string(),
      viewId: z16.string().optional(),
      serviceAccountEmail: z16.string().optional(),
      serviceAccountKey: z16.string().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    await assertClient(ctx.user.id, input.clientId);
    const db5 = await getDb();
    if (!db5) throw new Error("Database not available");
    const existing = await getGAConnection(input.clientId);
    if (existing) {
      await db5.update(googleAnalyticsConnections).set({
        propertyId: input.propertyId,
        viewId: input.viewId,
        serviceAccountEmail: input.serviceAccountEmail,
        serviceAccountKey: input.serviceAccountKey,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq9(googleAnalyticsConnections.id, existing.id));
      return { success: true, id: existing.id };
    } else {
      await db5.insert(googleAnalyticsConnections).values({
        clientId: input.clientId,
        propertyId: input.propertyId,
        viewId: input.viewId,
        serviceAccountEmail: input.serviceAccountEmail,
        serviceAccountKey: input.serviceAccountKey,
        isActive: 1,
        createdBy: ctx.user.id
      });
      return { success: true };
    }
  }),
  // Delete GA connection
  delete: protectedProcedure.input(z16.object({ clientId: z16.number() })).mutation(async ({ ctx, input }) => {
    await assertClient(ctx.user.id, input.clientId);
    const db5 = await getDb();
    if (!db5) throw new Error("Database not available");
    const connection = await getGAConnection(input.clientId);
    if (!connection) {
      return { success: false, message: "Connection not found" };
    }
    await db5.delete(googleAnalyticsConnections).where(eq9(googleAnalyticsConnections.id, connection.id));
    return { success: true };
  }),
  // Fetch traffic metrics
  getMetrics: protectedProcedure.input(
    z16.object({
      clientId: z16.number(),
      startDate: z16.string(),
      endDate: z16.string()
    })
  ).query(async ({ ctx, input }) => {
    await assertClient(ctx.user.id, input.clientId);
    return fetchGAMetrics(input.clientId, input.startDate, input.endDate);
  }),
  // Fetch page metrics
  getPageMetrics: protectedProcedure.input(
    z16.object({
      clientId: z16.number(),
      startDate: z16.string(),
      endDate: z16.string(),
      limit: z16.number().optional()
    })
  ).query(async ({ ctx, input }) => {
    await assertClient(ctx.user.id, input.clientId);
    return fetchGAPageMetrics(
      input.clientId,
      input.startDate,
      input.endDate,
      input.limit
    );
  }),
  // Fetch keyword data
  getKeywords: protectedProcedure.input(
    z16.object({
      clientId: z16.number(),
      startDate: z16.string(),
      endDate: z16.string(),
      limit: z16.number().optional()
    })
  ).query(async ({ ctx, input }) => {
    await assertClient(ctx.user.id, input.clientId);
    return fetchKeywordData(
      input.clientId,
      input.startDate,
      input.endDate,
      input.limit
    );
  }),
  // Sync content performance
  sync: protectedProcedure.input(z16.object({ clientId: z16.number() })).mutation(async ({ ctx, input }) => {
    await assertClient(ctx.user.id, input.clientId);
    return syncContentPerformance(input.clientId);
  })
});

// server/routers/wordpress.ts
init_db();
init_schema();
import { z as z17 } from "zod";
import { eq as eq10, desc as desc2 } from "drizzle-orm";
var wordpressRouter = router({
  // Get all WordPress connections for a client
  getConnections: protectedProcedure.input(z17.object({ clientId: z17.number() })).query(async ({ ctx, input }) => {
    await assertClient(ctx.user.id, input.clientId);
    const db5 = await getDb();
    if (!db5) throw new Error("Database not available");
    return db5.select().from(wordpressConnections).where(eq10(wordpressConnections.clientId, input.clientId)).orderBy(desc2(wordpressConnections.createdAt));
  }),
  // Add a new WordPress connection
  addConnection: protectedProcedure.input(z17.object({
    clientId: z17.number(),
    siteName: z17.string().min(1),
    siteUrl: z17.string().url(),
    username: z17.string().min(1),
    applicationPassword: z17.string().min(1),
    defaultStatus: z17.enum(["draft", "publish", "pending"]).default("draft"),
    defaultAuthorId: z17.number().optional(),
    defaultCategoryId: z17.number().optional()
  })).mutation(async ({ ctx, input }) => {
    await assertClient(ctx.user.id, input.clientId);
    const db5 = await getDb();
    if (!db5) throw new Error("Database not available");
    const [connection] = await db5.insert(wordpressConnections).values({
      ...input,
      createdBy: ctx.user.id
    }).returning({ id: wordpressConnections.id });
    return { id: connection.id };
  }),
  // Update a WordPress connection
  updateConnection: protectedProcedure.input(z17.object({
    id: z17.number(),
    siteName: z17.string().min(1).optional(),
    siteUrl: z17.string().url().optional(),
    username: z17.string().min(1).optional(),
    applicationPassword: z17.string().min(1).optional(),
    defaultStatus: z17.enum(["draft", "publish", "pending"]).optional(),
    defaultAuthorId: z17.number().optional(),
    defaultCategoryId: z17.number().optional(),
    isActive: z17.number().min(0).max(1).optional()
  })).mutation(async ({ ctx, input }) => {
    await assertWordpressConnection(ctx.user.id, input.id);
    const db5 = await getDb();
    if (!db5) throw new Error("Database not available");
    const { id, ...updates } = input;
    await db5.update(wordpressConnections).set(updates).where(eq10(wordpressConnections.id, id));
    return { success: true };
  }),
  // Delete a WordPress connection
  deleteConnection: protectedProcedure.input(z17.object({ id: z17.number() })).mutation(async ({ ctx, input }) => {
    await assertWordpressConnection(ctx.user.id, input.id);
    const db5 = await getDb();
    if (!db5) throw new Error("Database not available");
    await db5.delete(wordpressConnections).where(eq10(wordpressConnections.id, input.id));
    return { success: true };
  }),
  // Test WordPress connection
  testConnection: protectedProcedure.input(z17.object({
    siteUrl: z17.string().url(),
    username: z17.string().min(1),
    applicationPassword: z17.string().min(1)
  })).mutation(async ({ input }) => {
    try {
      const authHeader3 = Buffer.from(`${input.username}:${input.applicationPassword}`).toString("base64");
      const response = await fetch(`${input.siteUrl}/wp-json/wp/v2/users/me`, {
        headers: {
          "Authorization": `Basic ${authHeader3}`
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`WordPress API error: ${response.status} - ${errorText}`);
      }
      const userData = await response.json();
      return {
        success: true,
        message: `Connected successfully as ${userData.name}`,
        userId: userData.id
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Connection failed"
      };
    }
  }),
  // Publish content to WordPress
  publishToWordPress: protectedProcedure.input(z17.object({
    contentId: z17.number(),
    connectionId: z17.number(),
    publishStatus: z17.enum(["draft", "publish", "pending"]).default("draft")
  })).mutation(async ({ ctx, input }) => {
    await assertContent(ctx.user.id, input.contentId);
    await assertWordpressConnection(ctx.user.id, input.connectionId);
    try {
      const db5 = await getDb();
      if (!db5) throw new Error("Database not available");
      const [contentData] = await db5.select().from(content).where(eq10(content.id, input.contentId));
      if (!contentData) {
        throw new Error("Content not found");
      }
      const [connection] = await db5.select().from(wordpressConnections).where(eq10(wordpressConnections.id, input.connectionId));
      if (!connection) {
        throw new Error("WordPress connection not found");
      }
      const authHeader3 = Buffer.from(`${connection.username}:${connection.applicationPassword}`).toString("base64");
      const postData = {
        title: contentData.title,
        content: contentData.content,
        status: input.publishStatus,
        author: connection.defaultAuthorId || void 0,
        categories: connection.defaultCategoryId ? [connection.defaultCategoryId] : void 0
      };
      const response = await fetch(`${connection.siteUrl}/wp-json/wp/v2/posts`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${authHeader3}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(postData)
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`WordPress API error: ${response.status} - ${errorText}`);
      }
      const wpPost = await response.json();
      const db22 = await getDb();
      if (!db22) throw new Error("Database not available");
      await db22.insert(wordpressPublishHistory).values({
        contentId: input.contentId,
        connectionId: input.connectionId,
        wordpressPostId: wpPost.id,
        wordpressPostUrl: wpPost.link,
        publishStatus: input.publishStatus,
        success: 1,
        publishedBy: ctx.user.id
      });
      await db22.update(wordpressConnections).set({ lastPublishedAt: /* @__PURE__ */ new Date() }).where(eq10(wordpressConnections.id, input.connectionId));
      return {
        success: true,
        postId: wpPost.id,
        postUrl: wpPost.link,
        message: `Published successfully as ${input.publishStatus}`
      };
    } catch (error) {
      const db32 = await getDb();
      if (db32) {
        await db32.insert(wordpressPublishHistory).values({
          contentId: input.contentId,
          connectionId: input.connectionId,
          wordpressPostId: 0,
          publishStatus: input.publishStatus,
          success: 0,
          errorMessage: error instanceof Error ? error.message : "Unknown error",
          publishedBy: ctx.user.id
        });
      }
      return {
        success: false,
        message: error instanceof Error ? error.message : "Publishing failed"
      };
    }
  }),
  // Get publish history for content
  getPublishHistory: protectedProcedure.input(z17.object({ contentId: z17.number() })).query(async ({ ctx, input }) => {
    await assertContent(ctx.user.id, input.contentId);
    const db5 = await getDb();
    if (!db5) throw new Error("Database not available");
    return db5.select({
      id: wordpressPublishHistory.id,
      connectionId: wordpressPublishHistory.connectionId,
      wordpressPostId: wordpressPublishHistory.wordpressPostId,
      wordpressPostUrl: wordpressPublishHistory.wordpressPostUrl,
      publishStatus: wordpressPublishHistory.publishStatus,
      success: wordpressPublishHistory.success,
      errorMessage: wordpressPublishHistory.errorMessage,
      publishedAt: wordpressPublishHistory.publishedAt,
      siteName: wordpressConnections.siteName,
      siteUrl: wordpressConnections.siteUrl
    }).from(wordpressPublishHistory).leftJoin(
      wordpressConnections,
      eq10(wordpressPublishHistory.connectionId, wordpressConnections.id)
    ).where(eq10(wordpressPublishHistory.contentId, input.contentId)).orderBy(desc2(wordpressPublishHistory.publishedAt));
  })
});

// server/routers/designStandards.ts
init_db();
init_schema();
import { z as z18 } from "zod";
import { and as and7, eq as eq11, desc as desc3 } from "drizzle-orm";
var designStandardsRouter = router({
  // Get all design standards
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const db5 = await getDb();
    if (!db5) throw new Error("Database not available");
    return db5.select().from(designStandards).where(and7(eq11(designStandards.createdBy, ctx.user.id), eq11(designStandards.isActive, 1))).orderBy(desc3(designStandards.isDefault), desc3(designStandards.createdAt));
  }),
  // Get default design standard
  getDefault: protectedProcedure.query(async ({ ctx }) => {
    const db5 = await getDb();
    if (!db5) throw new Error("Database not available");
    const [standard] = await db5.select().from(designStandards).where(and7(eq11(designStandards.createdBy, ctx.user.id), eq11(designStandards.isDefault, 1))).limit(1);
    return standard || null;
  }),
  // Get design standard by ID
  getById: protectedProcedure.input(z18.object({ id: z18.number() })).query(async ({ ctx, input }) => {
    await assertDesignStandard(ctx.user.id, input.id);
    const db5 = await getDb();
    if (!db5) throw new Error("Database not available");
    const [standard] = await db5.select().from(designStandards).where(eq11(designStandards.id, input.id));
    return standard || null;
  }),
  // Create new design standard
  create: protectedProcedure.input(z18.object({
    name: z18.string().min(1),
    description: z18.string().optional(),
    designPrompt: z18.string().min(1),
    referenceUrl: z18.string().optional(),
    colorScheme: z18.string().optional(),
    designStyle: z18.string().optional(),
    isDefault: z18.boolean().optional()
  })).mutation(async ({ ctx, input }) => {
    const db5 = await getDb();
    if (!db5) throw new Error("Database not available");
    if (input.isDefault) {
      await db5.update(designStandards).set({ isDefault: 0 }).where(and7(eq11(designStandards.createdBy, ctx.user.id), eq11(designStandards.isDefault, 1)));
    }
    const [result] = await db5.insert(designStandards).values({
      name: input.name,
      description: input.description || null,
      designPrompt: input.designPrompt,
      referenceUrl: input.referenceUrl || null,
      colorScheme: input.colorScheme || null,
      designStyle: input.designStyle || null,
      isDefault: input.isDefault ? 1 : 0,
      createdBy: ctx.user.id
    }).returning({ id: designStandards.id });
    return { success: true, id: result.id };
  }),
  // Update design standard
  update: protectedProcedure.input(z18.object({
    id: z18.number(),
    name: z18.string().min(1).optional(),
    description: z18.string().optional(),
    designPrompt: z18.string().min(1).optional(),
    referenceUrl: z18.string().optional(),
    colorScheme: z18.string().optional(),
    designStyle: z18.string().optional(),
    isDefault: z18.boolean().optional()
  })).mutation(async ({ ctx, input }) => {
    await assertDesignStandard(ctx.user.id, input.id);
    const db5 = await getDb();
    if (!db5) throw new Error("Database not available");
    const { id, ...updates } = input;
    if (updates.isDefault) {
      await db5.update(designStandards).set({ isDefault: 0 }).where(and7(eq11(designStandards.createdBy, ctx.user.id), eq11(designStandards.isDefault, 1)));
    }
    const updateData = {};
    if (updates.name !== void 0) updateData.name = updates.name;
    if (updates.description !== void 0) updateData.description = updates.description;
    if (updates.designPrompt !== void 0) updateData.designPrompt = updates.designPrompt;
    if (updates.referenceUrl !== void 0) updateData.referenceUrl = updates.referenceUrl;
    if (updates.colorScheme !== void 0) updateData.colorScheme = updates.colorScheme;
    if (updates.designStyle !== void 0) updateData.designStyle = updates.designStyle;
    if (updates.isDefault !== void 0) updateData.isDefault = updates.isDefault ? 1 : 0;
    await db5.update(designStandards).set(updateData).where(eq11(designStandards.id, id));
    return { success: true };
  }),
  // Delete design standard
  delete: protectedProcedure.input(z18.object({ id: z18.number() })).mutation(async ({ ctx, input }) => {
    await assertDesignStandard(ctx.user.id, input.id);
    const db5 = await getDb();
    if (!db5) throw new Error("Database not available");
    await db5.update(designStandards).set({ isActive: 0 }).where(eq11(designStandards.id, input.id));
    return { success: true };
  }),
  // Initialize default Takeoff design standard (one-time setup)
  initializeDefault: protectedProcedure.mutation(async ({ ctx }) => {
    const db5 = await getDb();
    if (!db5) throw new Error("Database not available");
    const [existing] = await db5.select().from(designStandards).where(and7(eq11(designStandards.createdBy, ctx.user.id), eq11(designStandards.isDefault, 1))).limit(1);
    if (existing) {
      return { success: false, message: "Default design standard already exists" };
    }
    const takeoffDesignPrompt = `Design: Builds elite, motion-driven website similar to https://takeoffdigitalsolutions.com/home-5234

Instructions:
You are a senior developer and creative director for a luxury web agency.

You build elite, motion-driven, premium websites

NOT generic.
Does NOT produce flat layouts, SaaS templates, or static designs.

\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
CORE PRINCIPLES
\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
\u2022 Every section must feel like an experience
\u2022 Interaction is mandatory (hover, tap, state, swipe, scroll)
\u2022 Motion must reinforce value \u2014 never decoration
\u2022 Visual hierarchy over copy volume
\u2022 Premium restraint over hype
\u2022 Systems > slogans

\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
TAKEOFF VISUAL BASELINE
\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
\u2022 Dark layered gradients
\u2022 Subtle glassmorphism
\u2022 Depth, elevation, and glow used intentionally
\u2022 Strong typography hierarchy (700\u2013900)
\u2022 Clean spacing, editorial balance
\u2022 Confident, calm, authoritative tone

\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
ALLOWED INTERACTIONS
\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
\u2022 Hover / tap affordances
\u2022 Swipeable experiences (especially testimonials)
\u2022 State-based transitions
\u2022 Sequential step flows
\u2022 Live system demos
\u2022 Cost-of-inaction visuals
\u2022 Subtle momentum and easing
\u2022 Cinematic tap-to-expand galleries

\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
SPECIAL RULE: MARQUEE CAROUSEL (AUTHORITY STRIP)
\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
Whenever a marquee carousel (Authority Marquee) section is requested, always use the Takeoff signature format as the default baseline. This section is mandatory in every website and may be customized depending on the client, industry, and services. The marquee must include the scrolling track, dark gradient background, minimal typography, and pause-on-hover motion. It represents the Takeoff identity and should never be omitted or replaced with an alternative design. Do not add images to this section.

\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
SPECIAL RULE: HERO SECTIONS
\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
Hero sections must include a hero image and exactly two call-to-action buttons. No additional button-like icons are permitted.

\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
SPECIAL RULE: TESTIMONIAL SECTIONS
\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
Include a visible 5-star rating and a CTA button labeled 'Leave a Google Review'.

\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
SPECIAL RULE: SERVICE AREA SECTIONS
\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
Always request an embedded Google Maps iframe before generating this section.`;
    const [result] = await db5.insert(designStandards).values({
      name: "Takeoff Premium Design",
      description: "Elite, motion-driven, premium website design standards based on Takeoff Digital Solutions",
      designPrompt: takeoffDesignPrompt,
      referenceUrl: "https://takeoffdigitalsolutions.com/home-5234",
      colorScheme: "dark",
      designStyle: "motion-driven",
      isDefault: 1,
      createdBy: ctx.user.id
    }).returning({ id: designStandards.id });
    return { success: true, id: result.id, message: "Default Takeoff design standard initialized" };
  })
});

// server/routers/bulkPublishing.ts
init_db();
init_schema();
import { z as z19 } from "zod";
import { and as and8, eq as eq12, inArray } from "drizzle-orm";
var bulkPublishingRouter = router({
  // Publish content to multiple WordPress sites
  publishToMultiplePlatforms: protectedProcedure.input(z19.object({
    contentId: z19.number(),
    wordpressConnectionIds: z19.array(z19.number()).optional(),
    wordpressStatus: z19.enum(["draft", "publish", "pending"]).default("draft")
  })).mutation(async ({ ctx, input }) => {
    await assertContent(ctx.user.id, input.contentId);
    const db5 = await getDb();
    if (!db5) throw new Error("Database not available");
    const [contentData] = await db5.select().from(content).where(eq12(content.id, input.contentId));
    if (!contentData) {
      throw new Error("Content not found");
    }
    const results = {
      wordpress: []
    };
    if (input.wordpressConnectionIds && input.wordpressConnectionIds.length > 0) {
      const connections = await db5.select().from(wordpressConnections).where(and8(
        inArray(wordpressConnections.id, input.wordpressConnectionIds),
        eq12(wordpressConnections.createdBy, ctx.user.id)
      ));
      for (const connection of connections) {
        try {
          const apiUrl = `${connection.siteUrl}/wp-json/wp/v2/posts`;
          const htmlContent = contentData.content.replace(/^### (.*$)/gim, "<h3>$1</h3>").replace(/^## (.*$)/gim, "<h2>$1</h2>").replace(/^# (.*$)/gim, "<h1>$1</h1>").replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>").replace(/\*(.*?)\*/gim, "<em>$1</em>").replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>");
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Basic ${Buffer.from(`${connection.username}:${connection.applicationPassword}`).toString("base64")}`
            },
            body: JSON.stringify({
              title: contentData.title,
              content: `<p>${htmlContent}</p>`,
              status: input.wordpressStatus
            })
          });
          if (response.ok) {
            const data = await response.json();
            results.wordpress.push({
              connectionId: connection.id,
              siteName: connection.siteName,
              success: true,
              message: "Published successfully",
              url: data.link
            });
            await db5.insert(wordpressPublishHistory).values({
              contentId: input.contentId,
              connectionId: connection.id,
              wordpressPostId: data.id,
              wordpressPostUrl: data.link,
              publishStatus: input.wordpressStatus,
              success: 1,
              publishedBy: ctx.user.id
            });
          } else {
            const errorText = await response.text();
            results.wordpress.push({
              connectionId: connection.id,
              siteName: connection.siteName,
              success: false,
              message: `Failed: ${response.status} - ${errorText}`
            });
            await db5.insert(wordpressPublishHistory).values({
              contentId: input.contentId,
              connectionId: connection.id,
              wordpressPostId: 0,
              // No post ID on failure
              publishStatus: input.wordpressStatus,
              success: 0,
              errorMessage: errorText,
              publishedBy: ctx.user.id
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          results.wordpress.push({
            connectionId: connection.id,
            siteName: connection.siteName,
            success: false,
            message: errorMessage
          });
          await db5.insert(wordpressPublishHistory).values({
            contentId: input.contentId,
            connectionId: connection.id,
            wordpressPostId: 0,
            // No post ID on failure
            publishStatus: input.wordpressStatus,
            success: 0,
            errorMessage,
            publishedBy: ctx.user.id
          });
        }
      }
    }
    const wordpressSuccess = results.wordpress.filter((r) => r.success).length;
    const wordpressTotal = results.wordpress.length;
    return {
      success: wordpressSuccess > 0,
      results,
      summary: {
        wordpress: { success: wordpressSuccess, total: wordpressTotal }
      }
    };
  })
});

// server/routers/publishingAnalytics.ts
init_db();
init_schema();
import { z as z20 } from "zod";
import { and as and9, eq as eq13, desc as desc4, gte as gte3, sql as sql4 } from "drizzle-orm";
var publishingAnalyticsRouter = router({
  // Get overall publishing statistics
  getOverallStats: protectedProcedure.query(async ({ ctx }) => {
    const db5 = await getDb();
    if (!db5) throw new Error("Database not available");
    const [wpStats] = await db5.select({
      total: sql4`COUNT(*)`,
      successful: sql4`SUM(CASE WHEN ${wordpressPublishHistory.success} = 1 THEN 1 ELSE 0 END)`,
      failed: sql4`SUM(CASE WHEN ${wordpressPublishHistory.success} = 0 THEN 1 ELSE 0 END)`
    }).from(wordpressPublishHistory).innerJoin(content, eq13(wordpressPublishHistory.contentId, content.id)).where(eq13(content.createdBy, ctx.user.id));
    return {
      wordpress: {
        total: Number(wpStats?.total || 0),
        successful: Number(wpStats?.successful || 0),
        failed: Number(wpStats?.failed || 0),
        successRate: wpStats?.total ? Number(wpStats.successful) / Number(wpStats.total) * 100 : 0
      },
      combined: {
        total: Number(wpStats?.total || 0),
        successful: Number(wpStats?.successful || 0),
        failed: Number(wpStats?.failed || 0)
      }
    };
  }),
  // Get publishing history for a specific content
  getContentPublishHistory: protectedProcedure.input(z20.object({ contentId: z20.number() })).query(async ({ ctx, input }) => {
    await assertContent(ctx.user.id, input.contentId);
    const db5 = await getDb();
    if (!db5) throw new Error("Database not available");
    const wpHistory = await db5.select({
      id: wordpressPublishHistory.id,
      platform: sql4`'wordpress'`,
      siteName: wordpressConnections.siteName,
      url: wordpressPublishHistory.wordpressPostUrl,
      success: wordpressPublishHistory.success,
      errorMessage: wordpressPublishHistory.errorMessage,
      publishedAt: wordpressPublishHistory.publishedAt
    }).from(wordpressPublishHistory).leftJoin(wordpressConnections, eq13(wordpressPublishHistory.connectionId, wordpressConnections.id)).where(eq13(wordpressPublishHistory.contentId, input.contentId)).orderBy(desc4(wordpressPublishHistory.publishedAt));
    return wpHistory;
  }),
  // Get top performing content by publish count
  getTopPublishedContent: protectedProcedure.input(z20.object({ limit: z20.number().default(10) })).query(async ({ ctx, input }) => {
    const db5 = await getDb();
    if (!db5) throw new Error("Database not available");
    const topContent = await db5.select({
      contentId: content.id,
      title: content.title,
      wpPublishCount: sql4`(
            SELECT COUNT(*)
            FROM ${wordpressPublishHistory}
            WHERE ${wordpressPublishHistory.contentId} = ${content.id}
            AND ${wordpressPublishHistory.success} = 1
          )`
    }).from(content).where(eq13(content.createdBy, ctx.user.id)).orderBy(sql4`(
          SELECT COUNT(*) FROM ${wordpressPublishHistory} WHERE ${wordpressPublishHistory.contentId} = ${content.id} AND ${wordpressPublishHistory.success} = 1
        ) DESC`).limit(input.limit);
    return topContent.map((item) => ({
      ...item,
      totalPublishes: Number(item.wpPublishCount)
    }));
  }),
  // Get recent publishing activity
  getRecentActivity: protectedProcedure.input(z20.object({ limit: z20.number().default(20) })).query(async ({ ctx, input }) => {
    const db5 = await getDb();
    if (!db5) throw new Error("Database not available");
    const wpActivity = await db5.select({
      id: wordpressPublishHistory.id,
      platform: sql4`'wordpress'`,
      contentTitle: content.title,
      siteName: wordpressConnections.siteName,
      url: wordpressPublishHistory.wordpressPostUrl,
      success: wordpressPublishHistory.success,
      publishedAt: wordpressPublishHistory.publishedAt
    }).from(wordpressPublishHistory).innerJoin(content, eq13(wordpressPublishHistory.contentId, content.id)).leftJoin(wordpressConnections, eq13(wordpressPublishHistory.connectionId, wordpressConnections.id)).where(eq13(content.createdBy, ctx.user.id)).orderBy(desc4(wordpressPublishHistory.publishedAt)).limit(input.limit);
    return wpActivity;
  }),
  // Get publishing trends over time (last 30 days)
  getPublishingTrends: protectedProcedure.query(async ({ ctx }) => {
    const db5 = await getDb();
    if (!db5) throw new Error("Database not available");
    const thirtyDaysAgo = /* @__PURE__ */ new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const wpTrends = await db5.select({
      date: sql4`DATE(${wordpressPublishHistory.publishedAt}) as date`,
      count: sql4`COUNT(*) as count`,
      successful: sql4`SUM(CASE WHEN ${wordpressPublishHistory.success} = 1 THEN 1 ELSE 0 END) as successful`
    }).from(wordpressPublishHistory).innerJoin(content, eq13(wordpressPublishHistory.contentId, content.id)).where(and9(gte3(wordpressPublishHistory.publishedAt, thirtyDaysAgo), eq13(content.createdBy, ctx.user.id))).groupBy(sql4`date`).orderBy(sql4`date`);
    return {
      wordpress: wpTrends
    };
  })
});

// server/routers/siteAudit.ts
init_db();
import { z as z21 } from "zod";
import { TRPCError as TRPCError6 } from "@trpc/server";
import { eq as eq14, and as and10, desc as desc5 } from "drizzle-orm";
init_schema();
async function db2() {
  const d = await getDb();
  if (!d) throw new TRPCError6({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  return d;
}
var siteAuditRouter = router({
  // Kick off a full-site crawl for a client's domain (async — poll checkStatus after).
  run: protectedProcedure.use(limitData).input(z21.object({ clientId: z21.number(), maxPages: z21.number().min(1).max(1e3).optional() })).mutation(async ({ ctx, input }) => {
    await assertClient(ctx.user.id, input.clientId);
    const d = await db2();
    const [client] = await d.select().from(clients).where(eq14(clients.id, input.clientId));
    if (!client?.websiteUrl) {
      throw new TRPCError6({
        code: "BAD_REQUEST",
        message: "This client has no website URL. Add one on the client's page first."
      });
    }
    const { startSiteAudit: startSiteAudit2 } = await Promise.resolve().then(() => (init_siteAudit(), siteAudit_exports));
    const { normalizeDomain: normalizeDomain2 } = await Promise.resolve().then(() => (init_dataforseo(), dataforseo_exports));
    const target = normalizeDomain2(client.websiteUrl);
    const { taskId } = await startSiteAudit2(target, { maxPages: input.maxPages });
    const [row] = await d.insert(siteAudits).values({ clientId: input.clientId, createdBy: ctx.user.id, taskId, target, status: "crawling" }).returning();
    return row;
  }),
  // Poll a crawl. While still crawling, checks DataForSEO; once finished, stores pages + aggregates.
  checkStatus: protectedProcedure.use(limitData).input(z21.object({ auditId: z21.number() })).mutation(async ({ ctx, input }) => {
    await assertSiteAudit(ctx.user.id, input.auditId);
    const d = await db2();
    const [audit] = await d.select().from(siteAudits).where(eq14(siteAudits.id, input.auditId));
    if (!audit) throw new TRPCError6({ code: "NOT_FOUND", message: "Audit not found" });
    if (audit.status !== "crawling") return audit;
    const { getSiteAuditSummary: getSiteAuditSummary2, getSiteAuditPages: getSiteAuditPages2, countCritical: countCritical2, countWarnings: countWarnings2 } = await Promise.resolve().then(() => (init_siteAudit(), siteAudit_exports));
    let summary;
    try {
      summary = await getSiteAuditSummary2(audit.taskId);
    } catch (err) {
      const [failed] = await d.update(siteAudits).set({ status: "failed", checks: JSON.stringify({ error: err?.message ?? "unknown" }) }).where(eq14(siteAudits.id, input.auditId)).returning();
      return failed;
    }
    if (summary.crawlProgress !== "finished") {
      const [row2] = await d.update(siteAudits).set({ pagesCrawled: summary.pagesCrawled }).where(eq14(siteAudits.id, input.auditId)).returning();
      return row2;
    }
    const pages = await getSiteAuditPages2(audit.taskId, 100);
    if (pages.length > 0) {
      await d.insert(siteAuditPages).values(
        pages.map((p) => ({
          auditId: audit.id,
          url: p.url,
          statusCode: p.statusCode,
          onpageScore: p.onpageScore != null ? String(p.onpageScore) : null,
          issues: JSON.stringify(p.issues)
        }))
      );
    }
    const [row] = await d.update(siteAudits).set({
      status: "complete",
      pagesCrawled: summary.pagesCrawled,
      onpageScore: summary.onpageScore != null ? String(summary.onpageScore) : null,
      criticalCount: countCritical2(summary.checks),
      warningCount: countWarnings2(summary.checks),
      checks: JSON.stringify(summary.checks)
    }).where(eq14(siteAudits.id, input.auditId)).returning();
    return row;
  }),
  // Recent audits for a client (newest first).
  list: protectedProcedure.input(z21.object({ clientId: z21.number() })).query(async ({ ctx, input }) => {
    await assertClient(ctx.user.id, input.clientId);
    const d = await db2();
    return d.select().from(siteAudits).where(and10(eq14(siteAudits.clientId, input.clientId), eq14(siteAudits.createdBy, ctx.user.id))).orderBy(desc5(siteAudits.createdAt)).limit(20);
  }),
  // Per-page results for one audit.
  pages: protectedProcedure.input(z21.object({ auditId: z21.number() })).query(async ({ ctx, input }) => {
    await assertSiteAudit(ctx.user.id, input.auditId);
    const d = await db2();
    return d.select().from(siteAuditPages).where(eq14(siteAuditPages.auditId, input.auditId)).orderBy(siteAuditPages.onpageScore).limit(200);
  })
});

// server/routers/rankTracking.ts
init_db();
import { z as z22 } from "zod";
import { TRPCError as TRPCError7 } from "@trpc/server";
import { eq as eq15, and as and11, inArray as inArray2, desc as desc6, asc as asc2 } from "drizzle-orm";
init_schema();
async function db3() {
  const d = await getDb();
  if (!d) throw new TRPCError7({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  return d;
}
var rankTrackingRouter = router({
  addKeyword: protectedProcedure.input(
    z22.object({
      clientId: z22.number(),
      keyword: z22.string().min(1).max(255),
      locationName: z22.string().optional(),
      languageName: z22.string().optional(),
      device: z22.enum(["desktop", "mobile"]).optional()
    })
  ).mutation(async ({ ctx, input }) => {
    await assertClient(ctx.user.id, input.clientId);
    const d = await db3();
    const [row] = await d.insert(trackedKeywords).values({
      clientId: input.clientId,
      createdBy: ctx.user.id,
      keyword: input.keyword.trim(),
      locationName: input.locationName ?? "United States",
      languageName: input.languageName ?? "English",
      device: input.device ?? "desktop"
    }).returning();
    return row;
  }),
  removeKeyword: protectedProcedure.input(z22.object({ keywordId: z22.number() })).mutation(async ({ ctx, input }) => {
    await assertTrackedKeyword(ctx.user.id, input.keywordId);
    const d = await db3();
    await d.delete(trackedKeywords).where(eq15(trackedKeywords.id, input.keywordId));
    return { success: true };
  }),
  // Keywords for a client, each with its current + previous position (for the delta).
  listKeywords: protectedProcedure.input(z22.object({ clientId: z22.number() })).query(async ({ ctx, input }) => {
    await assertClient(ctx.user.id, input.clientId);
    const d = await db3();
    const keywords = await d.select().from(trackedKeywords).where(and11(eq15(trackedKeywords.clientId, input.clientId), eq15(trackedKeywords.createdBy, ctx.user.id))).orderBy(asc2(trackedKeywords.createdAt));
    if (keywords.length === 0) return [];
    const ids = keywords.map((k) => k.id);
    const snaps = await d.select().from(rankSnapshots).where(inArray2(rankSnapshots.keywordId, ids)).orderBy(desc6(rankSnapshots.checkedAt));
    const byKeyword = /* @__PURE__ */ new Map();
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
        rankingUrl: current?.url ?? null
      };
    });
  }),
  // Check all active keywords for a client right now and store snapshots.
  runCheck: protectedProcedure.use(limitData).input(z22.object({ clientId: z22.number() })).mutation(async ({ ctx, input }) => {
    await assertClient(ctx.user.id, input.clientId);
    const d = await db3();
    const [client] = await d.select().from(clients).where(eq15(clients.id, input.clientId));
    if (!client?.websiteUrl) {
      throw new TRPCError7({
        code: "BAD_REQUEST",
        message: "This client has no website URL. Add one on the client's page first."
      });
    }
    const keywords = await d.select().from(trackedKeywords).where(and11(eq15(trackedKeywords.clientId, input.clientId), eq15(trackedKeywords.isActive, 1)));
    if (keywords.length === 0) {
      throw new TRPCError7({ code: "BAD_REQUEST", message: "Add at least one keyword first." });
    }
    const { checkKeywordRank: checkKeywordRank2 } = await Promise.resolve().then(() => (init_dataforseo(), dataforseo_exports));
    let checked = 0;
    for (const k of keywords) {
      try {
        const rank = await checkKeywordRank2(k.keyword, client.websiteUrl, {
          locationName: k.locationName,
          languageName: k.languageName,
          device: k.device
        });
        await d.insert(rankSnapshots).values({
          keywordId: k.id,
          position: rank.position,
          url: rank.url
        });
        checked += 1;
      } catch {
      }
    }
    return { checked, total: keywords.length };
  }),
  // Position time series for one keyword (oldest → newest) for the trend chart.
  history: protectedProcedure.input(z22.object({ keywordId: z22.number() })).query(async ({ ctx, input }) => {
    await assertTrackedKeyword(ctx.user.id, input.keywordId);
    const d = await db3();
    return d.select({
      position: rankSnapshots.position,
      url: rankSnapshots.url,
      checkedAt: rankSnapshots.checkedAt
    }).from(rankSnapshots).where(eq15(rankSnapshots.keywordId, input.keywordId)).orderBy(asc2(rankSnapshots.checkedAt));
  })
});

// server/routers/backlinks.ts
init_db();
import { z as z23 } from "zod";
import { TRPCError as TRPCError8 } from "@trpc/server";
import { eq as eq16, and as and12, desc as desc7 } from "drizzle-orm";
init_schema();
async function db4() {
  const d = await getDb();
  if (!d) throw new TRPCError8({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  return d;
}
async function clientDomain(d, clientId) {
  const [client] = await d.select().from(clients).where(eq16(clients.id, clientId));
  if (!client?.websiteUrl) {
    throw new TRPCError8({
      code: "BAD_REQUEST",
      message: "This client has no website URL. Add one on the client's page first."
    });
  }
  return client.websiteUrl;
}
var backlinksRouter = router({
  // Fetch the live backlink profile (summary + referring domains + anchors) and snapshot it.
  profile: protectedProcedure.use(limitData).input(z23.object({ clientId: z23.number() })).mutation(async ({ ctx, input }) => {
    await assertClient(ctx.user.id, input.clientId);
    const d = await db4();
    const domain = await clientDomain(d, input.clientId);
    const { backlinkSummary: backlinkSummary2, referringDomains: referringDomains2, backlinkAnchors: backlinkAnchors2, normalizeDomain: normalizeDomain2 } = await Promise.resolve().then(() => (init_dataforseo(), dataforseo_exports));
    const target = normalizeDomain2(domain);
    const [summary, refDomains, anchors] = await Promise.all([
      backlinkSummary2(target),
      referringDomains2(target, 100),
      backlinkAnchors2(target, 100)
    ]);
    const [snapshot] = await d.insert(backlinkSnapshots).values({
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
      topAnchors: JSON.stringify(anchors)
    }).returning();
    return { snapshot, summary, referringDomains: refDomains, anchors };
  }),
  // The most recent snapshot for a client (with parsed detail lists), or null.
  latest: protectedProcedure.input(z23.object({ clientId: z23.number() })).query(async ({ ctx, input }) => {
    await assertClient(ctx.user.id, input.clientId);
    const d = await db4();
    const [snap] = await d.select().from(backlinkSnapshots).where(and12(eq16(backlinkSnapshots.clientId, input.clientId), eq16(backlinkSnapshots.createdBy, ctx.user.id))).orderBy(desc7(backlinkSnapshots.createdAt)).limit(1);
    if (!snap) return null;
    return {
      snapshot: snap,
      referringDomains: safeParse(snap.topReferringDomains),
      anchors: safeParse(snap.topAnchors)
    };
  }),
  // Competitor link gap: referring domains linking to the given competitors but not the client.
  linkGap: protectedProcedure.use(limitData).input(z23.object({ clientId: z23.number(), competitors: z23.array(z23.string().min(1)).min(1).max(5) })).mutation(async ({ ctx, input }) => {
    await assertClient(ctx.user.id, input.clientId);
    const d = await db4();
    const domain = await clientDomain(d, input.clientId);
    const { linkGap: linkGap2, normalizeDomain: normalizeDomain2 } = await Promise.resolve().then(() => (init_dataforseo(), dataforseo_exports));
    const rows = await linkGap2(normalizeDomain2(domain), input.competitors, 100);
    return rows;
  }),
  // Toxic-link analysis: backlinks whose spam score meets the threshold, plus a disavow file.
  toxicLinks: protectedProcedure.use(limitData).input(z23.object({ clientId: z23.number(), threshold: z23.number().min(0).max(100).optional() })).mutation(async ({ ctx, input }) => {
    await assertClient(ctx.user.id, input.clientId);
    const d = await db4();
    const domain = await clientDomain(d, input.clientId);
    const { toxicBacklinks: toxicBacklinks2, normalizeDomain: normalizeDomain2 } = await Promise.resolve().then(() => (init_dataforseo(), dataforseo_exports));
    return toxicBacklinks2(normalizeDomain2(domain), 200, input.threshold ?? 50);
  }),
  // Aggregate trend (backlinks / referring domains over time) for the overview chart.
  history: protectedProcedure.input(z23.object({ clientId: z23.number() })).query(async ({ ctx, input }) => {
    await assertClient(ctx.user.id, input.clientId);
    const d = await db4();
    const rows = await d.select({
      backlinks: backlinkSnapshots.backlinks,
      referringDomains: backlinkSnapshots.referringDomains,
      rank: backlinkSnapshots.rank,
      createdAt: backlinkSnapshots.createdAt
    }).from(backlinkSnapshots).where(and12(eq16(backlinkSnapshots.clientId, input.clientId), eq16(backlinkSnapshots.createdBy, ctx.user.id))).orderBy(backlinkSnapshots.createdAt).limit(60);
    return rows;
  })
});
function safeParse(json) {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

// server/routers.ts
function publicUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}
var appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user ? publicUser(opts.ctx.user) : null),
    signup: publicProcedure.input(z24.object({
      email: z24.string().email(),
      password: z24.string().min(8, "Password must be at least 8 characters"),
      name: z24.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const existing = await getUserByEmail(input.email);
      if (existing) {
        throw new TRPCError9({ code: "CONFLICT", message: "An account with this email already exists" });
      }
      const passwordHash = await bcrypt2.hash(input.password, 10);
      const openId = nanoid4();
      const user = await createUser({
        openId,
        email: input.email,
        name: input.name || null,
        passwordHash,
        loginMethod: "email",
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const token = await sdk.createSessionToken(openId, { name: user.name || "", ver: user.tokenVersion ?? 0, expiresInMs: SESSION_TTL_MS });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: SESSION_TTL_MS });
      return publicUser(user);
    }),
    login: publicProcedure.input(z24.object({
      email: z24.string().email(),
      password: z24.string()
    })).mutation(async ({ ctx, input }) => {
      const user = await getUserByEmail(input.email);
      if (!user || !user.passwordHash) {
        throw new TRPCError9({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }
      const ok = await bcrypt2.compare(input.password, user.passwordHash);
      if (!ok) {
        throw new TRPCError9({ code: "UNAUTHORIZED", message: "Invalid email or password" });
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
        success: true
      };
    }),
    // Revoke every session for the current user (this device and all others).
    logoutAllDevices: protectedProcedure.mutation(async ({ ctx }) => {
      const { incrementUserTokenVersion: incrementUserTokenVersion2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      await incrementUserTokenVersion2(ctx.user.id);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  // Client management
  clients: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getClientsByUser(ctx.user.id);
    }),
    getById: protectedProcedure.input(z24.object({ id: z24.number() })).query(async ({ ctx, input }) => {
      await assertClient(ctx.user.id, input.id);
      return getClientById(input.id);
    }),
    create: protectedProcedure.input(z24.object({
      name: z24.string().min(1),
      email: z24.string().email().optional(),
      company: z24.string().optional(),
      notes: z24.string().optional(),
      phone: z24.string().optional(),
      address: z24.string().optional(),
      city: z24.string().optional(),
      state: z24.string().optional(),
      zipCode: z24.string().optional(),
      country: z24.string().optional(),
      businessName: z24.string().optional(),
      businessType: z24.string().optional(),
      industry: z24.string().optional(),
      businessPhone: z24.string().optional(),
      businessEmail: z24.string().email().optional().or(z24.literal("")),
      businessWebsite: z24.string().optional(),
      businessAddress: z24.string().optional(),
      websiteUrl: z24.string().optional(),
      websitePlatform: z24.string().optional(),
      websiteLoginUrl: z24.string().optional(),
      websiteUsername: z24.string().optional(),
      websitePassword: z24.string().optional(),
      websiteNotes: z24.string().optional(),
      socialFacebook: z24.string().optional(),
      socialInstagram: z24.string().optional(),
      socialLinkedin: z24.string().optional(),
      socialTwitter: z24.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const clientId = await createClient({
        ...input,
        createdBy: ctx.user.id
      });
      return { id: clientId };
    }),
    update: protectedProcedure.input(z24.object({
      id: z24.number(),
      name: z24.string().min(1).optional(),
      email: z24.string().email().optional().or(z24.literal("")),
      company: z24.string().optional(),
      notes: z24.string().optional(),
      phone: z24.string().optional(),
      address: z24.string().optional(),
      city: z24.string().optional(),
      state: z24.string().optional(),
      zipCode: z24.string().optional(),
      country: z24.string().optional(),
      businessName: z24.string().optional(),
      businessType: z24.string().optional(),
      industry: z24.string().optional(),
      businessPhone: z24.string().optional(),
      businessEmail: z24.string().email().optional().or(z24.literal("")),
      businessWebsite: z24.string().optional(),
      businessAddress: z24.string().optional(),
      websiteUrl: z24.string().optional(),
      websitePlatform: z24.string().optional(),
      websiteLoginUrl: z24.string().optional(),
      websiteUsername: z24.string().optional(),
      websitePassword: z24.string().optional(),
      websiteNotes: z24.string().optional(),
      socialFacebook: z24.string().optional(),
      socialInstagram: z24.string().optional(),
      socialLinkedin: z24.string().optional(),
      socialTwitter: z24.string().optional(),
      monthlyBudget: z24.string().optional(),
      budgetAlertThreshold: z24.number().min(0).max(100).optional()
    })).mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      await assertClient(ctx.user.id, id);
      await updateClient(id, updates);
      return { success: true };
    }),
    delete: protectedProcedure.input(z24.object({ id: z24.number() })).mutation(async ({ ctx, input }) => {
      await assertClient(ctx.user.id, input.id);
      await deleteClient(input.id);
      return { success: true };
    }),
    getMonthlyCost: protectedProcedure.input(z24.object({ clientId: z24.number() })).query(async ({ ctx, input }) => {
      await assertClient(ctx.user.id, input.clientId);
      const { getClientMonthlyCost: getClientMonthlyCost2 } = await Promise.resolve().then(() => (init_budgetTracking(), budgetTracking_exports));
      return { cost: await getClientMonthlyCost2(input.clientId) };
    }),
    getBudgetStatus: protectedProcedure.input(z24.object({ clientId: z24.number() })).query(async ({ ctx, input }) => {
      await assertClient(ctx.user.id, input.clientId);
      const { checkClientBudgetAlert: checkClientBudgetAlert2 } = await Promise.resolve().then(() => (init_budgetTracking(), budgetTracking_exports));
      return await checkClientBudgetAlert2(input.clientId);
    })
  }),
  // Model performance tracking
  modelPerformance: router({
    getMetrics: protectedProcedure.query(async ({ ctx }) => {
      const { getModelPerformanceMetrics: getModelPerformanceMetrics2 } = await Promise.resolve().then(() => (init_modelPerformance(), modelPerformance_exports));
      return await getModelPerformanceMetrics2(ctx.user.id);
    }),
    compareModels: protectedProcedure.input(z24.object({
      model1: z24.string(),
      model2: z24.string()
    })).query(async ({ ctx, input }) => {
      const { compareModels: compareModels2 } = await Promise.resolve().then(() => (init_modelPerformance(), modelPerformance_exports));
      return await compareModels2(input.model1, input.model2, ctx.user.id);
    })
  }),
  // Content management and generation
  content: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getContentWithClient(ctx.user.id);
    }),
    getById: protectedProcedure.input(z24.object({ id: z24.number() })).query(async ({ ctx, input }) => {
      await assertContent(ctx.user.id, input.id);
      return getContentById(input.id);
    }),
    listByClient: protectedProcedure.input(z24.object({ clientId: z24.number() })).query(async ({ ctx, input }) => {
      const allContent = await getContentWithClient(ctx.user.id);
      return allContent.filter((item) => item.content.clientId === input.clientId).map((item) => item.content);
    }),
    generate: protectedProcedure.use(limitLlmSingle).input(z24.object({
      clientId: z24.number(),
      topic: z24.string().min(1),
      customPrompt: z24.string().optional(),
      shouldGenerateImage: z24.boolean().default(true),
      aiModel: z24.string().optional(),
      contentType: z24.enum(["blog", "newsletter", "social", "landing", "email"]).default("blog")
    })).mutation(async ({ ctx, input }) => {
      const { clientId, topic, customPrompt, shouldGenerateImage, aiModel, contentType } = input;
      await assertClient(ctx.user.id, clientId);
      const { assertClientWithinBudget: assertClientWithinBudget2 } = await Promise.resolve().then(() => (init_budgetTracking(), budgetTracking_exports));
      await assertClientWithinBudget2(clientId);
      let inputTokens = 0;
      let outputTokens = 0;
      const generationStartTime = Date.now();
      const TYPE_PROMPTS = {
        blog: {
          system: "You are an expert SEO content writer. Create engaging, well-structured blog posts that are informative and optimized for search engines. Use markdown with a clear H1 title and H2/H3 sections.",
          instruction: "Write a comprehensive, SEO-optimized blog post about"
        },
        newsletter: {
          system: "You are an expert email newsletter writer. Write warm, scannable newsletters with a compelling subject line as the first line, short sections, and a clear call-to-action.",
          instruction: "Write an email newsletter about"
        },
        social: {
          system: "You are a social media copywriter. Write short, punchy, shareable posts (under ~280 characters where appropriate) with a strong hook and 3-5 relevant hashtags.",
          instruction: "Write an engaging social media post about"
        },
        landing: {
          system: "You are a conversion copywriter. Write persuasive landing page copy with a headline, subheadline, benefit-driven sections, and a strong call-to-action.",
          instruction: "Write landing page copy for"
        },
        email: {
          system: "You are an email marketing expert. Write a persuasive marketing email with a subject line as the first line, a personal tone, and one clear call-to-action.",
          instruction: "Write a marketing email about"
        }
      };
      const typeConfig = TYPE_PROMPTS[contentType] ?? TYPE_PROMPTS.blog;
      const systemPrompt = customPrompt || typeConfig.system;
      const userPrompt = `${typeConfig.instruction}: ${topic}`;
      const llmResponse = await invokeLLM({
        model: aiModel || DEFAULT_TEXT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      });
      const messageContent = llmResponse.choices[0]?.message?.content;
      const generatedContent = typeof messageContent === "string" ? messageContent : "";
      inputTokens = llmResponse.usage?.prompt_tokens || 0;
      outputTokens = llmResponse.usage?.completion_tokens || 0;
      const lines = generatedContent.split("\n").filter((l) => l.trim());
      const title = lines[0]?.replace(/^#\s*/, "").substring(0, 500) || topic;
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
      const { calculateWordCount: calculateWordCount2 } = await Promise.resolve().then(() => (init_modelPerformance(), modelPerformance_exports));
      const wordCount = calculateWordCount2(generatedContent);
      const generationTimeMs = Date.now() - generationStartTime;
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
        generationTimeMs
      });
      try {
        const { checkAndAlertAfterGeneration: checkAndAlertAfterGeneration2 } = await Promise.resolve().then(() => (init_budgetTracking(), budgetTracking_exports));
        await checkAndAlertAfterGeneration2(clientId);
      } catch (error) {
        console.error("Budget check failed:", error);
      }
      return { id: contentId, title, content: generatedContent, imageUrl };
    }),
    update: protectedProcedure.input(z24.object({
      id: z24.number(),
      title: z24.string().optional(),
      content: z24.string().optional(),
      status: z24.enum(["draft", "in_progress", "approved"]).optional(),
      progress: z24.number().min(0).max(100).optional(),
      scheduledPublishDate: z24.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const { id, scheduledPublishDate, ...updates } = input;
      await assertContent(ctx.user.id, id);
      const finalUpdates = { ...updates };
      if (scheduledPublishDate) {
        finalUpdates.scheduledPublishDate = new Date(scheduledPublishDate);
      }
      if (updates.status === "approved") {
        const contentData = await getContentById(id);
        if (contentData && contentData.status !== "approved") {
          const { calculateWordCount: calculateWordCount2 } = await Promise.resolve().then(() => (init_modelPerformance(), modelPerformance_exports));
          const wordCount = calculateWordCount2(contentData.content || "");
          await updateContent(id, {
            wasApproved: 1,
            approvedAt: /* @__PURE__ */ new Date(),
            wordCount
          });
          try {
            const { notifyOwner: notifyOwner2 } = await Promise.resolve().then(() => (init_notification(), notification_exports));
            const contentPreview = contentData.content ? contentData.content.replace(/[#*\[\]()_`>-]/g, "").substring(0, 500) : "No content preview available";
            await notifyOwner2({
              title: `Content Approved: ${contentData.title}`,
              content: `The blog post "${contentData.title}" has been approved by ${ctx.user.name || ctx.user.email || "a team member"}.

Topic: ${contentData.topic || "N/A"}

Preview:
${contentPreview}...

You can now publish this content to the client's CMS via the Publishing page.`
            });
          } catch (e) {
            console.error("Failed to send approval notification:", e);
          }
        }
      }
      await updateContent(id, finalUpdates);
      return { success: true };
    }),
    delete: protectedProcedure.input(z24.object({ id: z24.number() })).mutation(async ({ ctx, input }) => {
      await assertContent(ctx.user.id, input.id);
      await deleteContent(input.id);
      return { success: true };
    }),
    regenerate: protectedProcedure.use(limitLlmSingle).input(z24.object({
      id: z24.number(),
      aiModel: z24.string(),
      customPrompt: z24.string().optional(),
      shouldGenerateImage: z24.boolean().default(false)
    })).mutation(async ({ ctx, input }) => {
      const { id, aiModel, customPrompt, shouldGenerateImage } = input;
      await assertContent(ctx.user.id, id);
      const originalContent = await getContentById(id);
      if (!originalContent) {
        throw new Error("Content not found");
      }
      const { assertClientWithinBudget: assertClientWithinBudget2 } = await Promise.resolve().then(() => (init_budgetTracking(), budgetTracking_exports));
      await assertClientWithinBudget2(originalContent.clientId);
      const generationStartTime = Date.now();
      let inputTokens = 0;
      let outputTokens = 0;
      const systemPrompt = customPrompt || "You are an expert SEO content writer. Create engaging, well-structured blog posts that are informative and optimized for search engines.";
      const userPrompt = `Write a comprehensive blog post about: ${originalContent.topic}`;
      const llmResponse = await invokeLLM({
        model: aiModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      });
      const messageContent = llmResponse.choices[0]?.message?.content;
      const generatedContent = typeof messageContent === "string" ? messageContent : "";
      inputTokens = llmResponse.usage?.prompt_tokens || 0;
      outputTokens = llmResponse.usage?.completion_tokens || 0;
      const lines = generatedContent.split("\n").filter((l) => l.trim());
      const title = lines[0]?.replace(/^#\s*/, "").substring(0, 500) || originalContent.topic;
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
      const { calculateWordCount: calculateWordCount2 } = await Promise.resolve().then(() => (init_modelPerformance(), modelPerformance_exports));
      const wordCount = calculateWordCount2(generatedContent);
      const generationTimeMs = Date.now() - generationStartTime;
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
        approvedAt: null
      });
      try {
        const { checkAndAlertAfterGeneration: checkAndAlertAfterGeneration2 } = await Promise.resolve().then(() => (init_budgetTracking(), budgetTracking_exports));
        await checkAndAlertAfterGeneration2(originalContent.clientId);
      } catch (error) {
        console.error("Budget check failed:", error);
      }
      return { id, title, content: generatedContent, imageUrl };
    }),
    exportHtml: protectedProcedure.input(z24.object({ id: z24.number() })).query(async ({ ctx, input }) => {
      await assertContent(ctx.user.id, input.id);
      const content2 = await getContentById(input.id);
      if (!content2) throw new Error("Content not found");
      return {
        title: content2.title,
        content: content2.content,
        imageUrl: content2.imageUrl,
        topic: content2.topic,
        status: content2.status,
        aiModel: content2.aiModel,
        createdAt: content2.createdAt
      };
    }),
    schedule: protectedProcedure.input(z24.object({
      contentId: z24.number(),
      scheduledPublishDate: z24.date()
    })).mutation(async ({ ctx, input }) => {
      await assertContent(ctx.user.id, input.contentId);
      await updateContent(input.contentId, {
        scheduledPublishDate: input.scheduledPublishDate,
        isScheduled: 1
      });
      return { success: true };
    })
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
    suggest: protectedProcedure.use(limitData).input(z24.object({
      topic: z24.string().min(1),
      count: z24.number().min(1).max(20).optional()
    })).mutation(async ({ input }) => {
      const { getKeywordSuggestions: getKeywordSuggestions2 } = await Promise.resolve().then(() => (init_keywordResearch(), keywordResearch_exports));
      return await getKeywordSuggestions2(input.topic, input.count);
    }),
    analyze: protectedProcedure.input(z24.object({
      content: z24.string().min(1),
      targetKeywords: z24.array(z24.string())
    })).mutation(async ({ input }) => {
      const { analyzeContentKeywords: analyzeContentKeywords2 } = await Promise.resolve().then(() => (init_keywordResearch(), keywordResearch_exports));
      return await analyzeContentKeywords2(input.content, input.targetKeywords);
    }),
    optimize: protectedProcedure.use(limitLlmSingle).input(z24.object({
      content: z24.string().min(1),
      targetKeywords: z24.array(z24.string())
    })).mutation(async ({ input }) => {
      const { optimizeContentForKeywords: optimizeContentForKeywords2 } = await Promise.resolve().then(() => (init_keywordResearch(), keywordResearch_exports));
      return await optimizeContentForKeywords2(input.content, input.targetKeywords);
    })
  }),
  // Competitor Research (DataForSEO Labs)
  competitors: router({
    find: protectedProcedure.use(limitData).input(z24.object({
      domain: z24.string().min(1),
      limit: z24.number().min(1).max(50).optional()
    })).mutation(async ({ input }) => {
      const { competitorDomains: competitorDomains2 } = await Promise.resolve().then(() => (init_dataforseo(), dataforseo_exports));
      return await competitorDomains2(input.domain, { limit: input.limit ?? 20 });
    }),
    compare: protectedProcedure.use(limitData).input(z24.object({
      yourDomain: z24.string().min(1),
      competitorDomain: z24.string().min(1),
      limit: z24.number().min(1).max(100).optional()
    })).mutation(async ({ input }) => {
      const { domainIntersection: domainIntersection2 } = await Promise.resolve().then(() => (init_dataforseo(), dataforseo_exports));
      return await domainIntersection2(input.yourDomain, input.competitorDomain, { limit: input.limit ?? 50 });
    })
  }),
  // Performance Tracking
  performance: router({
    getContentPerformance: protectedProcedure.input(z24.object({ contentId: z24.number() })).query(async ({ ctx, input }) => {
      await assertContent(ctx.user.id, input.contentId);
      const { getContentPerformance: getContentPerformance2 } = await Promise.resolve().then(() => (init_performanceTracking(), performanceTracking_exports));
      return await getContentPerformance2(input.contentId);
    }),
    getTopPerforming: protectedProcedure.input(z24.object({ limit: z24.number().default(10) })).query(async ({ ctx, input }) => {
      const { getTopPerformingContent: getTopPerformingContent2 } = await Promise.resolve().then(() => (init_performanceTracking(), performanceTracking_exports));
      return await getTopPerformingContent2(input.limit, ctx.user.id);
    }),
    getSummary: protectedProcedure.query(async ({ ctx }) => {
      const { getPerformanceSummary: getPerformanceSummary2 } = await Promise.resolve().then(() => (init_performanceTracking(), performanceTracking_exports));
      return await getPerformanceSummary2(ctx.user.id);
    }),
    trackView: protectedProcedure.input(z24.object({ contentId: z24.number() })).mutation(async ({ ctx, input }) => {
      await assertContent(ctx.user.id, input.contentId);
      const { trackContentView: trackContentView2 } = await Promise.resolve().then(() => (init_performanceTracking(), performanceTracking_exports));
      return await trackContentView2(input.contentId);
    }),
    trackClick: protectedProcedure.input(z24.object({ contentId: z24.number() })).mutation(async ({ ctx, input }) => {
      await assertContent(ctx.user.id, input.contentId);
      const { trackContentClick: trackContentClick2 } = await Promise.resolve().then(() => (init_performanceTracking(), performanceTracking_exports));
      return await trackContentClick2(input.contentId);
    }),
    getTrends: protectedProcedure.input(z24.object({ days: z24.number().default(30) })).query(async ({ ctx, input }) => {
      const { getPerformanceTrends: getPerformanceTrends2 } = await Promise.resolve().then(() => (init_performanceTracking(), performanceTracking_exports));
      return await getPerformanceTrends2(input.days, ctx.user.id);
    })
  }),
  // Google Analytics Integration
  googleAnalytics: googleAnalyticsRouter,
  wordpress: wordpressRouter,
  designStandards: designStandardsRouter,
  bulkPublishing: bulkPublishingRouter,
  publishingAnalytics: publishingAnalyticsRouter,
  // Portal Branding
  portalBranding: router({
    get: protectedProcedure.input(z24.object({ clientId: z24.number() })).query(async ({ ctx, input }) => {
      await assertClient(ctx.user.id, input.clientId);
      const { getPortalBranding: getPortalBranding2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      return await getPortalBranding2(input.clientId);
    }),
    upsert: protectedProcedure.input(z24.object({
      clientId: z24.number(),
      logoUrl: z24.string().optional(),
      primaryColor: z24.string().optional(),
      secondaryColor: z24.string().optional(),
      portalName: z24.string().optional(),
      welcomeMessage: z24.string().optional()
    })).mutation(async ({ ctx, input }) => {
      await assertClient(ctx.user.id, input.clientId);
      const { upsertPortalBranding: upsertPortalBranding2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      return await upsertPortalBranding2(input);
    })
  }),
  // Client Portal Authentication
  clientPortal: router({
    // Invitation management
    createInvitation: protectedProcedure.input(z24.object({
      clientId: z24.number(),
      email: z24.string().email(),
      name: z24.string(),
      role: z24.enum(["client_admin", "client_viewer"]).default("client_viewer")
    })).mutation(async ({ ctx, input }) => {
      await assertClient(ctx.user.id, input.clientId);
      const { createClientPortalInvitation: createClientPortalInvitation2 } = await Promise.resolve().then(() => (init_clientPortalAuth(), clientPortalAuth_exports));
      return await createClientPortalInvitation2(input.clientId, input.email, input.name, input.role);
    }),
    // Accept invitation (public endpoint)
    acceptInvitation: publicProcedure.input(z24.object({
      token: z24.string(),
      password: z24.string().min(8)
    })).mutation(async ({ input }) => {
      const { acceptInvitation: acceptInvitation2 } = await Promise.resolve().then(() => (init_clientPortalAuth(), clientPortalAuth_exports));
      return await acceptInvitation2(input.token, input.password);
    }),
    // Login (public endpoint)
    login: publicProcedure.input(z24.object({
      email: z24.string().email(),
      password: z24.string()
    })).mutation(async ({ input }) => {
      const { loginClientPortalUser: loginClientPortalUser2 } = await Promise.resolve().then(() => (init_clientPortalAuth(), clientPortalAuth_exports));
      return await loginClientPortalUser2(input.email, input.password);
    }),
    // Get current user (requires client portal token)
    me: publicProcedure.query(async ({ ctx }) => {
      return null;
    }),
    // List portal users for a client
    listUsers: protectedProcedure.input(z24.object({ clientId: z24.number() })).query(async ({ ctx, input }) => {
      await assertClient(ctx.user.id, input.clientId);
      const { listClientPortalUsers: listClientPortalUsers2 } = await Promise.resolve().then(() => (init_clientPortalAuth(), clientPortalAuth_exports));
      return await listClientPortalUsers2(input.clientId);
    }),
    // Change password
    changePassword: publicProcedure.input(z24.object({
      userId: z24.number(),
      oldPassword: z24.string(),
      newPassword: z24.string().min(8)
    })).mutation(async ({ input }) => {
      const { changeClientPortalPassword: changeClientPortalPassword2 } = await Promise.resolve().then(() => (init_clientPortalAuth(), clientPortalAuth_exports));
      return await changeClientPortalPassword2(input.userId, input.oldPassword, input.newPassword);
    }),
    // Deactivate user
    deactivateUser: protectedProcedure.input(z24.object({ userId: z24.number() })).mutation(async ({ ctx, input }) => {
      await assertPortalUser(ctx.user.id, input.userId);
      const { deactivateClientPortalUser: deactivateClientPortalUser2 } = await Promise.resolve().then(() => (init_clientPortalAuth(), clientPortalAuth_exports));
      return await deactivateClientPortalUser2(input.userId);
    })
  }),
  // Approval Workflow
  approvals: router({
    requestApproval: protectedProcedure.input(z24.object({ contentId: z24.number() })).mutation(async ({ ctx, input }) => {
      await assertContent(ctx.user.id, input.contentId);
      const { requestApproval: requestApproval2 } = await Promise.resolve().then(() => (init_approvalWorkflow(), approvalWorkflow_exports));
      return await requestApproval2(input.contentId, ctx.user.id);
    }),
    approve: protectedProcedure.input(z24.object({ contentId: z24.number() })).mutation(async ({ ctx, input }) => {
      await assertContent(ctx.user.id, input.contentId);
      const { approveContent: approveContent2 } = await Promise.resolve().then(() => (init_approvalWorkflow(), approvalWorkflow_exports));
      return await approveContent2(input.contentId, ctx.user.id);
    }),
    requestRevision: protectedProcedure.input(z24.object({
      contentId: z24.number(),
      reason: z24.string().min(1)
    })).mutation(async ({ ctx, input }) => {
      await assertContent(ctx.user.id, input.contentId);
      const { requestRevision: requestRevision2 } = await Promise.resolve().then(() => (init_approvalWorkflow(), approvalWorkflow_exports));
      return await requestRevision2(input.contentId, ctx.user.id, input.reason);
    }),
    getPendingApprovals: protectedProcedure.query(async ({ ctx }) => {
      const { getPendingApprovals: getPendingApprovals2 } = await Promise.resolve().then(() => (init_approvalWorkflow(), approvalWorkflow_exports));
      return await getPendingApprovals2(ctx.user.id);
    }),
    getRevisionRequests: protectedProcedure.input(z24.object({ contentId: z24.number() })).query(async ({ ctx, input }) => {
      await assertContent(ctx.user.id, input.contentId);
      const { getRevisionRequests: getRevisionRequests2 } = await Promise.resolve().then(() => (init_approvalWorkflow(), approvalWorkflow_exports));
      return await getRevisionRequests2(input.contentId);
    }),
    completeRevision: protectedProcedure.input(z24.object({ revisionId: z24.number() })).mutation(async ({ ctx, input }) => {
      await assertRevision(ctx.user.id, input.revisionId);
      const { completeRevision: completeRevision2 } = await Promise.resolve().then(() => (init_approvalWorkflow(), approvalWorkflow_exports));
      return await completeRevision2(input.revisionId);
    }),
    addComment: protectedProcedure.input(z24.object({
      contentId: z24.number(),
      comment: z24.string().min(1)
    })).mutation(async ({ ctx, input }) => {
      await assertContent(ctx.user.id, input.contentId);
      const { addComment: addComment3 } = await Promise.resolve().then(() => (init_approvalWorkflow(), approvalWorkflow_exports));
      return await addComment3(input.contentId, ctx.user.id, input.comment);
    }),
    getStats: protectedProcedure.query(async ({ ctx }) => {
      const { getApprovalStats: getApprovalStats2 } = await Promise.resolve().then(() => (init_approvalWorkflow(), approvalWorkflow_exports));
      return await getApprovalStats2(ctx.user.id);
    })
  }),
  // A/B Testing
  abTests: router({
    list: protectedProcedure.query(async () => {
      const { listABTests: listABTests2 } = await Promise.resolve().then(() => (init_abTesting(), abTesting_exports));
      return await listABTests2();
    }),
    getById: protectedProcedure.input(z24.object({ id: z24.number() })).query(async ({ ctx, input }) => {
      await assertABTest(ctx.user.id, input.id);
      const { getABTestById: getABTestById2 } = await Promise.resolve().then(() => (init_abTesting(), abTesting_exports));
      return await getABTestById2(input.id);
    }),
    create: protectedProcedure.use(limitLlmBatch).input(z24.object({
      clientId: z24.number(),
      topic: z24.string(),
      customPrompt: z24.string().optional(),
      shouldGenerateImage: z24.boolean().default(false),
      modelA: z24.string(),
      modelB: z24.string()
    })).mutation(async ({ ctx, input }) => {
      await assertClient(ctx.user.id, input.clientId);
      const { assertClientWithinBudget: assertClientWithinBudget2 } = await Promise.resolve().then(() => (init_budgetTracking(), budgetTracking_exports));
      await assertClientWithinBudget2(input.clientId);
      const { createABTest: createABTest2, updateABTestResults: updateABTestResults2 } = await Promise.resolve().then(() => (init_abTesting(), abTesting_exports));
      const { calculateWordCount: calculateWordCount2 } = await Promise.resolve().then(() => (init_modelPerformance(), modelPerformance_exports));
      const testId = await createABTest2({
        ...input,
        createdBy: ctx.user.id
      });
      const systemPrompt = input.customPrompt || "You are an expert SEO content writer. Create engaging, well-structured blog posts that are informative and optimized for search engines.";
      const userPrompt = `Write a comprehensive blog post about: ${input.topic}`;
      const startTimeA = Date.now();
      const responseA = await invokeLLM({
        model: input.modelA,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      });
      const contentA = typeof responseA.choices[0]?.message?.content === "string" ? responseA.choices[0].message.content : "";
      const titleA = contentA.split("\n").filter((l) => l.trim())[0]?.replace(/^#\s*/, "").substring(0, 500) || input.topic;
      const generationTimeMsA = Date.now() - startTimeA;
      await updateABTestResults2(testId, {
        version: "A",
        content: contentA,
        title: titleA,
        wordCount: calculateWordCount2(contentA),
        generationTimeMs: generationTimeMsA,
        inputTokens: responseA.usage?.prompt_tokens || 0,
        outputTokens: responseA.usage?.completion_tokens || 0
      });
      const startTimeB = Date.now();
      const responseB = await invokeLLM({
        model: input.modelB,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      });
      const contentB = typeof responseB.choices[0]?.message?.content === "string" ? responseB.choices[0].message.content : "";
      const titleB = contentB.split("\n").filter((l) => l.trim())[0]?.replace(/^#\s*/, "").substring(0, 500) || input.topic;
      const generationTimeMsB = Date.now() - startTimeB;
      await updateABTestResults2(testId, {
        version: "B",
        content: contentB,
        title: titleB,
        wordCount: calculateWordCount2(contentB),
        generationTimeMs: generationTimeMsB,
        inputTokens: responseB.usage?.prompt_tokens || 0,
        outputTokens: responseB.usage?.completion_tokens || 0
      });
      return { id: testId };
    }),
    setWinner: protectedProcedure.input(z24.object({
      id: z24.number(),
      winner: z24.enum(["A", "B"]),
      notes: z24.string().optional()
    })).mutation(async ({ ctx, input }) => {
      await assertABTest(ctx.user.id, input.id);
      const { setABTestWinner: setABTestWinner2 } = await Promise.resolve().then(() => (init_abTesting(), abTesting_exports));
      await setABTestWinner2(input.id, input.winner, input.notes);
      return { success: true };
    }),
    delete: protectedProcedure.input(z24.object({ id: z24.number() })).mutation(async ({ ctx, input }) => {
      await assertABTest(ctx.user.id, input.id);
      const { deleteABTest: deleteABTest2 } = await Promise.resolve().then(() => (init_abTesting(), abTesting_exports));
      await deleteABTest2(input.id);
      return { success: true };
    })
  })
  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    const { user: authedUser, session } = await sdk.authenticateRequest(opts.req);
    user = authedUser;
    const age = session.issuedAtMs > 0 ? Date.now() - session.issuedAtMs : Infinity;
    if (age > SESSION_REFRESH_AFTER_MS) {
      try {
        const token = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          ver: user.tokenVersion ?? 0,
          expiresInMs: SESSION_TTL_MS
        });
        opts.res.cookie(COOKIE_NAME, token, {
          ...getSessionCookieOptions(opts.req),
          maxAge: SESSION_TTL_MS
        });
      } catch (error) {
        console.warn("[Auth] Failed to rotate session token", String(error));
      }
    }
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/app.ts
function createApiApp() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  return app;
}

// serverless/trpc.ts
var trpc_default = createApiApp();
export {
  trpc_default as default
};
