var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema.ts
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
function authHeader() {
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
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: authHeader()
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
    const referringDomain = perTarget.find((t) => t?.target)?.target ?? "";
    const rank = perTarget.find((t) => typeof t?.rank === "number")?.rank ?? 0;
    const competitorsLinked = perTarget.filter((t) => (t?.backlinks ?? 0) > 0).length;
    const backlinks = perTarget.reduce((sum, t) => sum + (t?.backlinks ?? 0), 0);
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
var BASE_URL, DFS_SUCCESS;
var init_dataforseo = __esm({
  "server/lib/dataforseo.ts"() {
    "use strict";
    init_env();
    BASE_URL = "https://api.dataforseo.com/v3";
    DFS_SUCCESS = 2e4;
  }
});

// server/_core/scheduler.ts
import cron from "node-cron";
import { eq as eq2 } from "drizzle-orm";

// server/db.ts
init_schema();
init_env();
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// server/_core/crypto.ts
init_env();

// server/db.ts
var _db = null;
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

// server/_core/scheduler.ts
init_env();
init_schema();
var MAX_KEYWORDS_PER_RUN = 500;
var CONCURRENCY = 5;
async function runWeeklyRankCheck() {
  const dbh = await getDb();
  if (!dbh) return { checked: 0 };
  const d = dbh;
  const { checkKeywordRank: checkKeywordRank2 } = await Promise.resolve().then(() => (init_dataforseo(), dataforseo_exports));
  const rows = await d.select({
    keywordId: trackedKeywords.id,
    keyword: trackedKeywords.keyword,
    locationName: trackedKeywords.locationName,
    languageName: trackedKeywords.languageName,
    device: trackedKeywords.device,
    websiteUrl: clients.websiteUrl
  }).from(trackedKeywords).innerJoin(clients, eq2(trackedKeywords.clientId, clients.id)).where(eq2(trackedKeywords.isActive, 1)).limit(MAX_KEYWORDS_PER_RUN);
  const jobs = rows.filter((r) => r.websiteUrl);
  let checked = 0;
  let cursor = 0;
  async function worker() {
    while (cursor < jobs.length) {
      const job = jobs[cursor++];
      try {
        const rank = await checkKeywordRank2(job.keyword, job.websiteUrl, {
          locationName: job.locationName,
          languageName: job.languageName,
          device: job.device
        });
        await d.insert(rankSnapshots).values({
          keywordId: job.keywordId,
          position: rank.position,
          url: rank.url
        });
        checked += 1;
      } catch {
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, worker));
  return { checked };
}

// serverless/cron-rank-check.ts
async function handler(req, res) {
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
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message ?? "unknown" });
  }
}
export {
  handler as default
};
