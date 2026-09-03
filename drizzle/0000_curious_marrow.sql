CREATE TABLE "abTests" (
	"id" serial PRIMARY KEY NOT NULL,
	"clientId" integer NOT NULL,
	"topic" text NOT NULL,
	"customPrompt" text,
	"enableWebResearch" integer DEFAULT 0 NOT NULL,
	"shouldGenerateImage" integer DEFAULT 0 NOT NULL,
	"modelA" varchar(100) NOT NULL,
	"contentA" text,
	"titleA" text,
	"imageUrlA" text,
	"wordCountA" integer DEFAULT 0,
	"generationTimeMsA" integer DEFAULT 0,
	"inputTokensA" integer DEFAULT 0,
	"outputTokensA" integer DEFAULT 0,
	"modelB" varchar(100) NOT NULL,
	"contentB" text,
	"titleB" text,
	"imageUrlB" text,
	"wordCountB" integer DEFAULT 0,
	"generationTimeMsB" integer DEFAULT 0,
	"inputTokensB" integer DEFAULT 0,
	"outputTokensB" integer DEFAULT 0,
	"winner" text DEFAULT 'none',
	"notes" text,
	"createdBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agency_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"settingKey" varchar(128) NOT NULL,
	"settingValue" text,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agency_settings_settingKey_unique" UNIQUE("settingKey")
);
--> statement-breakpoint
CREATE TABLE "clientPortalUsers" (
	"id" serial PRIMARY KEY NOT NULL,
	"clientId" integer NOT NULL,
	"email" varchar(320) NOT NULL,
	"passwordHash" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" text DEFAULT 'client_viewer' NOT NULL,
	"isActive" integer DEFAULT 1 NOT NULL,
	"invitationToken" varchar(255),
	"invitationExpiry" timestamp,
	"lastLoginAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clientPortalUsers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(320),
	"company" varchar(255),
	"notes" text,
	"createdBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"monthlyBudget" numeric(10, 2) DEFAULT '0.00',
	"budgetAlertThreshold" integer DEFAULT 80,
	"phone" varchar(50),
	"address" text,
	"city" varchar(100),
	"state" varchar(100),
	"zipCode" varchar(20),
	"country" varchar(100),
	"businessName" varchar(255),
	"businessType" varchar(100),
	"industry" varchar(100),
	"businessPhone" varchar(50),
	"businessEmail" varchar(320),
	"businessWebsite" varchar(500),
	"businessAddress" text,
	"websiteUrl" varchar(500),
	"websitePlatform" varchar(100),
	"websiteLoginUrl" varchar(500),
	"websiteUsername" varchar(255),
	"websitePassword" text,
	"websiteNotes" text,
	"socialFacebook" varchar(500),
	"socialInstagram" varchar(500),
	"socialLinkedin" varchar(500),
	"socialTwitter" varchar(500)
);
--> statement-breakpoint
CREATE TABLE "content" (
	"id" serial PRIMARY KEY NOT NULL,
	"clientId" integer NOT NULL,
	"createdBy" integer NOT NULL,
	"title" varchar(500) NOT NULL,
	"topic" text NOT NULL,
	"content" text NOT NULL,
	"imageUrl" text,
	"imagePrompt" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"aiModel" varchar(100) DEFAULT 'gpt-4o' NOT NULL,
	"customPrompt" text,
	"inputTokens" integer DEFAULT 0 NOT NULL,
	"outputTokens" integer DEFAULT 0 NOT NULL,
	"totalTokens" integer DEFAULT 0 NOT NULL,
	"urlsFetched" integer DEFAULT 0 NOT NULL,
	"urlsFailed" integer DEFAULT 0 NOT NULL,
	"webSearches" integer DEFAULT 0 NOT NULL,
	"scheduledPublishDate" timestamp,
	"isScheduled" integer DEFAULT 0 NOT NULL,
	"wordCount" integer DEFAULT 0 NOT NULL,
	"wasApproved" integer DEFAULT 0 NOT NULL,
	"approvedAt" timestamp,
	"generationTimeMs" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contentAnalytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"contentId" integer NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"shares" integer DEFAULT 0 NOT NULL,
	"engagementRate" integer DEFAULT 0 NOT NULL,
	"avgTimeOnPage" integer DEFAULT 0 NOT NULL,
	"conversions" integer DEFAULT 0 NOT NULL,
	"recordedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contentBriefs" (
	"id" serial PRIMARY KEY NOT NULL,
	"clientId" integer NOT NULL,
	"shareToken" varchar(64) NOT NULL,
	"title" varchar(500),
	"targetKeywords" text,
	"targetAudience" text,
	"tonePreference" text DEFAULT 'professional',
	"contentType" text DEFAULT 'blog-post',
	"additionalNotes" text,
	"wordCountTarget" integer DEFAULT 1500,
	"briefStatus" text DEFAULT 'submitted' NOT NULL,
	"submittedBy" varchar(255),
	"submittedEmail" varchar(320),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "contentBriefs_shareToken_unique" UNIQUE("shareToken")
);
--> statement-breakpoint
CREATE TABLE "contentComments" (
	"id" serial PRIMARY KEY NOT NULL,
	"contentId" integer NOT NULL,
	"userId" integer NOT NULL,
	"comment" text NOT NULL,
	"isResolved" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contentQualityScores" (
	"id" serial PRIMARY KEY NOT NULL,
	"contentId" integer NOT NULL,
	"overallScore" integer DEFAULT 0 NOT NULL,
	"readabilityScore" integer DEFAULT 0 NOT NULL,
	"seoScore" integer DEFAULT 0 NOT NULL,
	"toneScore" integer DEFAULT 0 NOT NULL,
	"engagementScore" integer DEFAULT 0 NOT NULL,
	"readabilityDetails" text,
	"seoDetails" text,
	"toneDetails" text,
	"engagementDetails" text,
	"suggestions" text,
	"analyzedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contentRepurposed" (
	"id" serial PRIMARY KEY NOT NULL,
	"contentId" integer NOT NULL,
	"format" text NOT NULL,
	"content" text NOT NULL,
	"platform" varchar(100),
	"createdBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contentRevisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"contentId" integer NOT NULL,
	"userId" integer NOT NULL,
	"title" varchar(500),
	"content" text,
	"changeDescription" text,
	"revisionNumber" integer NOT NULL,
	"requestedBy" integer,
	"reason" text,
	"status" text,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contentTemplates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"prompt" text NOT NULL,
	"structure" text,
	"createdBy" integer NOT NULL,
	"isPublic" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "designStandards" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"designPrompt" text NOT NULL,
	"referenceUrl" text,
	"colorScheme" varchar(100),
	"designStyle" varchar(100),
	"isDefault" integer DEFAULT 0 NOT NULL,
	"isActive" integer DEFAULT 1 NOT NULL,
	"createdBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "googleAnalyticsConnections" (
	"id" serial PRIMARY KEY NOT NULL,
	"clientId" integer NOT NULL,
	"propertyId" varchar(255) NOT NULL,
	"viewId" varchar(255),
	"accessToken" text,
	"refreshToken" text,
	"tokenExpiry" timestamp,
	"serviceAccountEmail" varchar(320),
	"serviceAccountKey" text,
	"isActive" integer DEFAULT 1 NOT NULL,
	"lastSyncedAt" timestamp,
	"createdBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portalBranding" (
	"id" serial PRIMARY KEY NOT NULL,
	"clientId" integer NOT NULL,
	"logoUrl" text,
	"primaryColor" varchar(7) DEFAULT '#3b82f6',
	"secondaryColor" varchar(7) DEFAULT '#1e40af',
	"customDomain" varchar(255),
	"portalName" varchar(255),
	"welcomeMessage" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "portalBranding_clientId_unique" UNIQUE("clientId")
);
--> statement-breakpoint
CREATE TABLE "publishLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"contentId" integer NOT NULL,
	"webhookId" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"responseCode" integer,
	"responseBody" text,
	"publishedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publishingSchedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"contentId" integer NOT NULL,
	"publishToWordPress" integer DEFAULT 0 NOT NULL,
	"wordpressConnectionIds" text,
	"wordpressStatus" text DEFAULT 'draft',
	"scheduledFor" timestamp NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"executedAt" timestamp,
	"errorMessage" text,
	"createdBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurringPlans" (
	"id" serial PRIMARY KEY NOT NULL,
	"clientId" integer NOT NULL,
	"planName" varchar(255) NOT NULL,
	"frequency" text NOT NULL,
	"postsPerCycle" integer DEFAULT 1 NOT NULL,
	"topicTemplate" text,
	"customPrompt" text,
	"aiModel" varchar(100) DEFAULT 'gemini-2.5-flash',
	"enableWebResearch" integer DEFAULT 1 NOT NULL,
	"enableImageGeneration" integer DEFAULT 1 NOT NULL,
	"isActive" integer DEFAULT 1 NOT NULL,
	"lastRunDate" timestamp,
	"nextRunDate" timestamp,
	"createdBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" text DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "webhookConfigs" (
	"id" serial PRIMARY KEY NOT NULL,
	"clientId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"platform" text NOT NULL,
	"endpointUrl" text NOT NULL,
	"apiKey" text,
	"authHeader" text,
	"isActive" integer DEFAULT 1 NOT NULL,
	"lastPublishedAt" timestamp,
	"createdBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wordpressConnections" (
	"id" serial PRIMARY KEY NOT NULL,
	"clientId" integer NOT NULL,
	"siteName" varchar(255) NOT NULL,
	"siteUrl" varchar(500) NOT NULL,
	"username" varchar(255) NOT NULL,
	"applicationPassword" text NOT NULL,
	"defaultStatus" text DEFAULT 'draft' NOT NULL,
	"defaultAuthorId" integer,
	"defaultCategoryId" integer,
	"isActive" integer DEFAULT 1 NOT NULL,
	"lastPublishedAt" timestamp,
	"createdBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wordpressPublishHistory" (
	"id" serial PRIMARY KEY NOT NULL,
	"contentId" integer NOT NULL,
	"connectionId" integer NOT NULL,
	"wordpressPostId" integer NOT NULL,
	"wordpressPostUrl" text,
	"publishStatus" text NOT NULL,
	"success" integer DEFAULT 1 NOT NULL,
	"errorMessage" text,
	"publishedBy" integer NOT NULL,
	"publishedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "abTests" ADD CONSTRAINT "abTests_clientId_clients_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "abTests" ADD CONSTRAINT "abTests_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clientPortalUsers" ADD CONSTRAINT "clientPortalUsers_clientId_clients_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_clientId_clients_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contentAnalytics" ADD CONSTRAINT "contentAnalytics_contentId_content_id_fk" FOREIGN KEY ("contentId") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contentBriefs" ADD CONSTRAINT "contentBriefs_clientId_clients_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contentComments" ADD CONSTRAINT "contentComments_contentId_content_id_fk" FOREIGN KEY ("contentId") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contentComments" ADD CONSTRAINT "contentComments_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contentQualityScores" ADD CONSTRAINT "contentQualityScores_contentId_content_id_fk" FOREIGN KEY ("contentId") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contentRepurposed" ADD CONSTRAINT "contentRepurposed_contentId_content_id_fk" FOREIGN KEY ("contentId") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contentRepurposed" ADD CONSTRAINT "contentRepurposed_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contentRevisions" ADD CONSTRAINT "contentRevisions_contentId_content_id_fk" FOREIGN KEY ("contentId") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contentRevisions" ADD CONSTRAINT "contentRevisions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contentRevisions" ADD CONSTRAINT "contentRevisions_requestedBy_users_id_fk" FOREIGN KEY ("requestedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contentTemplates" ADD CONSTRAINT "contentTemplates_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "designStandards" ADD CONSTRAINT "designStandards_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "googleAnalyticsConnections" ADD CONSTRAINT "googleAnalyticsConnections_clientId_clients_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "googleAnalyticsConnections" ADD CONSTRAINT "googleAnalyticsConnections_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portalBranding" ADD CONSTRAINT "portalBranding_clientId_clients_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publishLogs" ADD CONSTRAINT "publishLogs_contentId_content_id_fk" FOREIGN KEY ("contentId") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publishLogs" ADD CONSTRAINT "publishLogs_webhookId_webhookConfigs_id_fk" FOREIGN KEY ("webhookId") REFERENCES "public"."webhookConfigs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publishingSchedules" ADD CONSTRAINT "publishingSchedules_contentId_content_id_fk" FOREIGN KEY ("contentId") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publishingSchedules" ADD CONSTRAINT "publishingSchedules_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurringPlans" ADD CONSTRAINT "recurringPlans_clientId_clients_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurringPlans" ADD CONSTRAINT "recurringPlans_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhookConfigs" ADD CONSTRAINT "webhookConfigs_clientId_clients_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhookConfigs" ADD CONSTRAINT "webhookConfigs_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wordpressConnections" ADD CONSTRAINT "wordpressConnections_clientId_clients_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wordpressConnections" ADD CONSTRAINT "wordpressConnections_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wordpressPublishHistory" ADD CONSTRAINT "wordpressPublishHistory_contentId_content_id_fk" FOREIGN KEY ("contentId") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wordpressPublishHistory" ADD CONSTRAINT "wordpressPublishHistory_connectionId_wordpressConnections_id_fk" FOREIGN KEY ("connectionId") REFERENCES "public"."wordpressConnections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wordpressPublishHistory" ADD CONSTRAINT "wordpressPublishHistory_publishedBy_users_id_fk" FOREIGN KEY ("publishedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;