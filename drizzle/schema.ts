import { integer, serial, pgTable, text, timestamp, varchar, numeric } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
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
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Clients table - stores information about agency clients
 */
export const clients = pgTable("clients", {
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
  budgetAlertThreshold: integer("budgetAlertThreshold").default(80), // Percentage (0-100)

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
  socialTwitter: varchar("socialTwitter", { length: 500 }),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Client Portal Users table - separate authentication for client-facing portal
 */
export const clientPortalUsers = pgTable("clientPortalUsers", {
  id: serial("id").primaryKey(),
  clientId: integer("clientId").notNull().references(() => clients.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("passwordHash").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: text("role", { enum: ["client_admin", "client_viewer"] }).default("client_viewer").notNull(),
  isActive: integer("isActive").default(1).notNull(), // 0 = inactive, 1 = active
  invitationToken: varchar("invitationToken", { length: 255 }),
  invitationExpiry: timestamp("invitationExpiry"),
  lastLoginAt: timestamp("lastLoginAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type ClientPortalUser = typeof clientPortalUsers.$inferSelect;
export type InsertClientPortalUser = typeof clientPortalUsers.$inferInsert;

/**
 * Portal Branding table - customization settings for client portal
 */
export const portalBranding = pgTable("portalBranding", {
  id: serial("id").primaryKey(),
  clientId: integer("clientId").notNull().unique().references(() => clients.id, { onDelete: "cascade" }),
  logoUrl: text("logoUrl"),
  primaryColor: varchar("primaryColor", { length: 7 }).default("#3b82f6"), // Hex color
  secondaryColor: varchar("secondaryColor", { length: 7 }).default("#1e40af"),
  customDomain: varchar("customDomain", { length: 255 }),
  portalName: varchar("portalName", { length: 255 }),
  welcomeMessage: text("welcomeMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type PortalBranding = typeof portalBranding.$inferSelect;
export type InsertPortalBranding = typeof portalBranding.$inferInsert;

/**
 * Content table - stores AI-generated blog posts and their metadata
 */
export const content = pgTable("content", {
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
  progress: integer("progress").default(0).notNull(), // 0-100
  contentType: varchar("contentType", { length: 32 }).default("blog").notNull(), // blog | newsletter | social | landing | email
  
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
  isScheduled: integer("isScheduled").default(0).notNull(), // 0 = false, 1 = true
  
  // Performance tracking
  wordCount: integer("wordCount").default(0).notNull(),
  wasApproved: integer("wasApproved").default(0).notNull(), // 0 = not yet, 1 = yes
  approvedAt: timestamp("approvedAt"),
  generationTimeMs: integer("generationTimeMs").default(0).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type Content = typeof content.$inferSelect;
export type InsertContent = typeof content.$inferInsert;
/**
 * Content Templates table - stores reusable templates for different content types
 */
export const contentTemplates = pgTable("contentTemplates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: text("category", { enum: ["product-review", "how-to", "listicle", "case-study", "comparison", "tutorial", "news", "opinion", "custom"] }).notNull(),
  prompt: text("prompt").notNull(),
  structure: text("structure"),
  createdBy: integer("createdBy").notNull().references(() => users.id),
  isPublic: integer("isPublic").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type ContentTemplate = typeof contentTemplates.$inferSelect;
export type InsertContentTemplate = typeof contentTemplates.$inferInsert;


/**
 * Content Comments table - stores team feedback and comments on content
 */
export const contentComments = pgTable("contentComments", {
  id: serial("id").primaryKey(),
  contentId: integer("contentId").notNull().references(() => content.id, { onDelete: "cascade" }),
  userId: integer("userId").notNull().references(() => users.id),
  comment: text("comment").notNull(),
  isResolved: integer("isResolved").default(0).notNull(), // 0 = open, 1 = resolved
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type ContentComment = typeof contentComments.$inferSelect;
export type InsertContentComment = typeof contentComments.$inferInsert;

/**
 * Content Revisions table - tracks revision requests and their status
 */
export const contentRevisions = pgTable("contentRevisions", {
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContentRevision = typeof contentRevisions.$inferSelect;
export type InsertContentRevision = typeof contentRevisions.$inferInsert;

/**
 * Content Analytics table - stores performance metrics for published content
 */
export const contentAnalytics = pgTable("contentAnalytics", {
  id: serial("id").primaryKey(),
  contentId: integer("contentId").notNull().references(() => content.id, { onDelete: "cascade" }),
  views: integer("views").default(0).notNull(),
  clicks: integer("clicks").default(0).notNull(),
  shares: integer("shares").default(0).notNull(),
  engagementRate: integer("engagementRate").default(0).notNull(),
  avgTimeOnPage: integer("avgTimeOnPage").default(0).notNull(),
  conversions: integer("conversions").default(0).notNull(),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
});

export type ContentAnalytic = typeof contentAnalytics.$inferSelect;
export type InsertContentAnalytic = typeof contentAnalytics.$inferInsert;

/**
 * Content Repurposed table - stores repurposed versions of content
 */
export const contentRepurposed = pgTable("contentRepurposed", {
  id: serial("id").primaryKey(),
  contentId: integer("contentId").notNull().references(() => content.id, { onDelete: "cascade" }),
  format: text("format", { enum: ["social-snippet", "email-summary", "short-form", "infographic-script", "video-script"] }).notNull(),
  content: text("content").notNull(),
  platform: varchar("platform", { length: 100 }),
  createdBy: integer("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type ContentRepurposed = typeof contentRepurposed.$inferSelect;
export type InsertContentRepurposed = typeof contentRepurposed.$inferInsert;


/**
 * Content Quality Scores table - stores automated quality analysis results
 */
export const contentQualityScores = pgTable("contentQualityScores", {
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
  analyzedAt: timestamp("analyzedAt").defaultNow().notNull(),
});

export type ContentQualityScore = typeof contentQualityScores.$inferSelect;
export type InsertContentQualityScore = typeof contentQualityScores.$inferInsert;


/**
 * Webhook Configurations table - stores CMS publishing endpoints per client
 */
export const webhookConfigs = pgTable("webhookConfigs", {
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
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type WebhookConfig = typeof webhookConfigs.$inferSelect;
export type InsertWebhookConfig = typeof webhookConfigs.$inferInsert;

/**
 * Publish Logs table - tracks content publishing attempts
 */
export const publishLogs = pgTable("publishLogs", {
  id: serial("id").primaryKey(),
  contentId: integer("contentId").notNull().references(() => content.id, { onDelete: "cascade" }),
  webhookId: integer("webhookId").notNull().references(() => webhookConfigs.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["pending", "success", "failed"] }).default("pending").notNull(),
  responseCode: integer("responseCode"),
  responseBody: text("responseBody"),
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
});

export type PublishLog = typeof publishLogs.$inferSelect;
export type InsertPublishLog = typeof publishLogs.$inferInsert;

/**
 * Content Briefs table - stores client-submitted content briefs
 */
export const contentBriefs = pgTable("contentBriefs", {
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
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type ContentBrief = typeof contentBriefs.$inferSelect;
export type InsertContentBrief = typeof contentBriefs.$inferInsert;

/**
 * Agency settings table - stores branding and configuration
 */
export const agencySettings = pgTable("agency_settings", {
  id: serial("id").primaryKey(),
  settingKey: varchar("settingKey", { length: 128 }).notNull().unique(),
  settingValue: text("settingValue"),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type AgencySetting = typeof agencySettings.$inferSelect;

/**
 * Recurring content plans - automate content generation on a schedule
 */
export const recurringPlans = pgTable("recurringPlans", {
  id: serial("id").primaryKey(),
  clientId: integer("clientId").notNull().references(() => clients.id),
  planName: varchar("planName", { length: 255 }).notNull(),
  frequency: text("frequency", { enum: ["daily", "weekly", "biweekly", "monthly"] }).notNull(),
  postsPerCycle: integer("postsPerCycle").notNull().default(1),
  topicTemplate: text("topicTemplate"), // Template for generating topics
  customPrompt: text("customPrompt"),
  aiModel: varchar("aiModel", { length: 100 }).default("gemini-3.6-flash"),
  enableWebResearch: integer("enableWebResearch").notNull().default(1),
  enableImageGeneration: integer("enableImageGeneration").notNull().default(1),
  isActive: integer("isActive").notNull().default(1),
  lastRunDate: timestamp("lastRunDate"),
  nextRunDate: timestamp("nextRunDate"),
  createdBy: integer("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type RecurringPlan = typeof recurringPlans.$inferSelect;
export type InsertRecurringPlan = typeof recurringPlans.$inferInsert;

/**
 * A/B Testing table - stores A/B test experiments comparing different AI models
 */
export const abTests = pgTable("abTests", {
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
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type ABTest = typeof abTests.$inferSelect;
export type InsertABTest = typeof abTests.$inferInsert;

/**
 * Google Analytics Connections table - stores GA credentials per client
 */
export const googleAnalyticsConnections = pgTable("googleAnalyticsConnections", {
  id: serial("id").primaryKey(),
  clientId: integer("clientId").notNull().references(() => clients.id, { onDelete: "cascade" }),
  propertyId: varchar("propertyId", { length: 255 }).notNull(), // GA4 Property ID
  viewId: varchar("viewId", { length: 255 }), // Universal Analytics View ID (optional, for legacy)
  
  // OAuth credentials (encrypted in production)
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  tokenExpiry: timestamp("tokenExpiry"),
  
  // API Key alternative (for service account)
  serviceAccountEmail: varchar("serviceAccountEmail", { length: 320 }),
  serviceAccountKey: text("serviceAccountKey"), // JSON key file content (encrypted)
  
  isActive: integer("isActive").default(1).notNull(), // 1 = active, 0 = inactive
  lastSyncedAt: timestamp("lastSyncedAt"),
  
  createdBy: integer("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type GoogleAnalyticsConnection = typeof googleAnalyticsConnections.$inferSelect;
export type InsertGoogleAnalyticsConnection = typeof googleAnalyticsConnections.$inferInsert;

/**
 * WordPress Connections table - stores WordPress site credentials per client
 */
export const wordpressConnections = pgTable("wordpressConnections", {
  id: serial("id").primaryKey(),
  clientId: integer("clientId").notNull().references(() => clients.id, { onDelete: "cascade" }),
  siteName: varchar("siteName", { length: 255 }).notNull(), // Friendly name for the site
  siteUrl: varchar("siteUrl", { length: 500 }).notNull(), // WordPress site URL
  
  // WordPress REST API credentials
  username: varchar("username", { length: 255 }).notNull(), // WordPress username
  applicationPassword: text("applicationPassword").notNull(), // WordPress application password
  
  // Publishing settings
  defaultStatus: text("defaultStatus", { enum: ["draft", "publish", "pending"] }).default("draft").notNull(),
  defaultAuthorId: integer("defaultAuthorId"), // WordPress author ID
  defaultCategoryId: integer("defaultCategoryId"), // WordPress category ID
  
  isActive: integer("isActive").default(1).notNull(), // 1 = active, 0 = inactive
  lastPublishedAt: timestamp("lastPublishedAt"),
  
  createdBy: integer("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type WordPressConnection = typeof wordpressConnections.$inferSelect;
export type InsertWordPressConnection = typeof wordpressConnections.$inferInsert;

/**
 * WordPress Publish History table - tracks content published to WordPress
 */
export const wordpressPublishHistory = pgTable("wordpressPublishHistory", {
  id: serial("id").primaryKey(),
  contentId: integer("contentId").notNull().references(() => content.id, { onDelete: "cascade" }),
  connectionId: integer("connectionId").notNull().references(() => wordpressConnections.id, { onDelete: "cascade" }),
  
  wordpressPostId: integer("wordpressPostId").notNull(), // WordPress post ID
  wordpressPostUrl: text("wordpressPostUrl"), // Full URL to the published post
  publishStatus: text("publishStatus", { enum: ["draft", "publish", "pending"] }).notNull(),
  
  success: integer("success").default(1).notNull(), // 1 = success, 0 = failed
  errorMessage: text("errorMessage"),
  
  publishedBy: integer("publishedBy").notNull().references(() => users.id),
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
});

export type WordPressPublishHistory = typeof wordpressPublishHistory.$inferSelect;
export type InsertWordPressPublishHistory = typeof wordpressPublishHistory.$inferInsert;

/**
 * Design Standards table - stores agency design guidelines for Manus website creation
 */
export const designStandards = pgTable("designStandards", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "Takeoff Premium Design"
  description: text("description"),
  designPrompt: text("designPrompt").notNull(), // Full design prompt/guidelines
  
  // Design characteristics
  referenceUrl: text("referenceUrl"), // Reference website URL
  colorScheme: varchar("colorScheme", { length: 100 }), // e.g., "dark", "light", "gradient"
  designStyle: varchar("designStyle", { length: 100 }), // e.g., "motion-driven", "minimal", "luxury"
  
  isDefault: integer("isDefault").default(0).notNull(), // 1 = default standard, 0 = optional
  isActive: integer("isActive").default(1).notNull(),
  
  createdBy: integer("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type DesignStandard = typeof designStandards.$inferSelect;
export type InsertDesignStandard = typeof designStandards.$inferInsert;

/**
 * Publishing Schedules table - stores scheduled publishing tasks
 */
export const publishingSchedules = pgTable("publishingSchedules", {
  id: serial("id").primaryKey(),
  contentId: integer("contentId").notNull().references(() => content.id, { onDelete: "cascade" }),
  
  // Publishing targets
  publishToWordPress: integer("publishToWordPress").default(0).notNull(), // 1 = yes, 0 = no
  wordpressConnectionIds: text("wordpressConnectionIds"), // JSON array of connection IDs
  wordpressStatus: text("wordpressStatus", { enum: ["draft", "publish", "pending"] }).default("draft"),

  // Schedule details
  scheduledFor: timestamp("scheduledFor").notNull(), // When to publish
  status: text("status", { enum: ["pending", "processing", "completed", "failed"] }).default("pending").notNull(),
  
  // Execution tracking
  executedAt: timestamp("executedAt"),
  errorMessage: text("errorMessage"),
  
  createdBy: integer("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type PublishingSchedule = typeof publishingSchedules.$inferSelect;
export type InsertPublishingSchedule = typeof publishingSchedules.$inferInsert;

/**
 * AI Visibility (GEO) — brands tracked across AI answer engines.
 */
export const aiBrands = pgTable("aiBrands", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 255 }),
  competitors: text("competitors"), // JSON array of competitor names
  createdBy: integer("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type AiBrand = typeof aiBrands.$inferSelect;
export type InsertAiBrand = typeof aiBrands.$inferInsert;

/**
 * Tracked prompts — questions run against AI engines for a brand.
 */
export const aiPrompts = pgTable("aiPrompts", {
  id: serial("id").primaryKey(),
  brandId: integer("brandId").notNull().references(() => aiBrands.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  createdBy: integer("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiPrompt = typeof aiPrompts.$inferSelect;
export type InsertAiPrompt = typeof aiPrompts.$inferInsert;

/**
 * Visibility scan results — one row per (prompt x provider) per scan run.
 */
export const aiVisibilityResults = pgTable("aiVisibilityResults", {
  id: serial("id").primaryKey(),
  scanId: varchar("scanId", { length: 32 }).notNull(), // groups a run
  brandId: integer("brandId").notNull().references(() => aiBrands.id, { onDelete: "cascade" }),
  promptId: integer("promptId").notNull().references(() => aiPrompts.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 32 }).notNull(), // claude | gemini | openai | perplexity
  mentioned: integer("mentioned").default(0).notNull(), // 1 = brand appeared in the answer
  position: integer("position"), // rank among listed items, if any
  sentiment: text("sentiment", { enum: ["positive", "neutral", "negative"] }),
  competitorsMentioned: text("competitorsMentioned"), // JSON array
  answerExcerpt: text("answerExcerpt"),
  summary: text("summary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiVisibilityResult = typeof aiVisibilityResults.$inferSelect;
export type InsertAiVisibilityResult = typeof aiVisibilityResults.$inferInsert;

/**
 * Full-site audits — one row per crawl of a client's domain via the DataForSEO
 * On-Page API. The crawl is async: `run` posts a task and stores `status:"crawling"`
 * with the DataForSEO `taskId`; `checkStatus` polls the summary and, once finished,
 * fills the aggregates and populates `siteAuditPages`.
 */
export const siteAudits = pgTable("siteAudits", {
  id: serial("id").primaryKey(),
  clientId: integer("clientId").notNull().references(() => clients.id, { onDelete: "cascade" }),
  createdBy: integer("createdBy").notNull().references(() => users.id),
  taskId: varchar("taskId", { length: 64 }).notNull(), // DataForSEO On-Page task id
  target: varchar("target", { length: 255 }).notNull(), // crawled domain
  status: text("status", { enum: ["crawling", "complete", "failed"] }).default("crawling").notNull(),
  pagesCrawled: integer("pagesCrawled").default(0).notNull(),
  onpageScore: numeric("onpageScore", { precision: 5, scale: 2 }),
  criticalCount: integer("criticalCount").default(0).notNull(),
  warningCount: integer("warningCount").default(0).notNull(),
  checks: text("checks"), // JSON: site-wide check counts (broken links, duplicate titles, ...)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type SiteAudit = typeof siteAudits.$inferSelect;
export type InsertSiteAudit = typeof siteAudits.$inferInsert;

/**
 * Per-page results for a site audit — one row per crawled URL.
 */
export const siteAuditPages = pgTable("siteAuditPages", {
  id: serial("id").primaryKey(),
  auditId: integer("auditId").notNull().references(() => siteAudits.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  statusCode: integer("statusCode"),
  onpageScore: numeric("onpageScore", { precision: 5, scale: 2 }),
  issues: text("issues"), // JSON array of per-page issues
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SiteAuditPage = typeof siteAuditPages.$inferSelect;
export type InsertSiteAuditPage = typeof siteAuditPages.$inferInsert;

/**
 * Rank tracking — keywords tracked for a client's domain. Checked on demand
 * (`rankTracking.runCheck`) and weekly by the scheduler.
 */
export const trackedKeywords = pgTable("trackedKeywords", {
  id: serial("id").primaryKey(),
  clientId: integer("clientId").notNull().references(() => clients.id, { onDelete: "cascade" }),
  createdBy: integer("createdBy").notNull().references(() => users.id),
  keyword: varchar("keyword", { length: 255 }).notNull(),
  locationName: varchar("locationName", { length: 255 }).default("United States").notNull(),
  languageName: varchar("languageName", { length: 100 }).default("English").notNull(),
  device: text("device", { enum: ["desktop", "mobile"] }).default("desktop").notNull(),
  isActive: integer("isActive").default(1).notNull(), // 0/1
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TrackedKeyword = typeof trackedKeywords.$inferSelect;
export type InsertTrackedKeyword = typeof trackedKeywords.$inferInsert;

/**
 * Rank snapshots — append-only SERP-position time series for a tracked keyword.
 * `position` is null when the domain is not found in the top results.
 */
export const rankSnapshots = pgTable("rankSnapshots", {
  id: serial("id").primaryKey(),
  keywordId: integer("keywordId").notNull().references(() => trackedKeywords.id, { onDelete: "cascade" }),
  position: integer("position"), // null = not ranked in the pulled SERP
  url: text("url"), // the ranking URL, if found
  checkedAt: timestamp("checkedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RankSnapshot = typeof rankSnapshots.$inferSelect;
export type InsertRankSnapshot = typeof rankSnapshots.$inferInsert;

/**
 * Backlink profile snapshots — one row per `backlinks.profile` run for a client's domain
 * (DataForSEO Backlinks API). Aggregates live in columns; the full summary plus the top
 * referring domains and anchors are kept as JSON for the detail tabs and trend.
 */
export const backlinkSnapshots = pgTable("backlinkSnapshots", {
  id: serial("id").primaryKey(),
  clientId: integer("clientId").notNull().references(() => clients.id, { onDelete: "cascade" }),
  createdBy: integer("createdBy").notNull().references(() => users.id),
  target: varchar("target", { length: 255 }).notNull(),
  backlinks: integer("backlinks").default(0).notNull(),
  referringDomains: integer("referringDomains").default(0).notNull(),
  referringMainDomains: integer("referringMainDomains").default(0).notNull(),
  rank: integer("rank").default(0).notNull(), // DataForSEO domain rank 0-1000
  brokenBacklinks: integer("brokenBacklinks").default(0).notNull(),
  summary: text("summary"), // JSON: full summary metrics
  topReferringDomains: text("topReferringDomains"), // JSON array
  topAnchors: text("topAnchors"), // JSON array
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BacklinkSnapshot = typeof backlinkSnapshots.$inferSelect;
export type InsertBacklinkSnapshot = typeof backlinkSnapshots.$inferInsert;
