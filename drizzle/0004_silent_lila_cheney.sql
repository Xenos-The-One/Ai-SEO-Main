CREATE TABLE "rankSnapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"keywordId" integer NOT NULL,
	"position" integer,
	"url" text,
	"checkedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "siteAuditPages" (
	"id" serial PRIMARY KEY NOT NULL,
	"auditId" integer NOT NULL,
	"url" text NOT NULL,
	"statusCode" integer,
	"onpageScore" numeric(5, 2),
	"issues" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "siteAudits" (
	"id" serial PRIMARY KEY NOT NULL,
	"clientId" integer NOT NULL,
	"createdBy" integer NOT NULL,
	"taskId" varchar(64) NOT NULL,
	"target" varchar(255) NOT NULL,
	"status" text DEFAULT 'crawling' NOT NULL,
	"pagesCrawled" integer DEFAULT 0 NOT NULL,
	"onpageScore" numeric(5, 2),
	"criticalCount" integer DEFAULT 0 NOT NULL,
	"warningCount" integer DEFAULT 0 NOT NULL,
	"checks" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trackedKeywords" (
	"id" serial PRIMARY KEY NOT NULL,
	"clientId" integer NOT NULL,
	"createdBy" integer NOT NULL,
	"keyword" varchar(255) NOT NULL,
	"locationName" varchar(255) DEFAULT 'United States' NOT NULL,
	"languageName" varchar(100) DEFAULT 'English' NOT NULL,
	"device" text DEFAULT 'desktop' NOT NULL,
	"isActive" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rankSnapshots" ADD CONSTRAINT "rankSnapshots_keywordId_trackedKeywords_id_fk" FOREIGN KEY ("keywordId") REFERENCES "public"."trackedKeywords"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "siteAuditPages" ADD CONSTRAINT "siteAuditPages_auditId_siteAudits_id_fk" FOREIGN KEY ("auditId") REFERENCES "public"."siteAudits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "siteAudits" ADD CONSTRAINT "siteAudits_clientId_clients_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "siteAudits" ADD CONSTRAINT "siteAudits_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trackedKeywords" ADD CONSTRAINT "trackedKeywords_clientId_clients_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trackedKeywords" ADD CONSTRAINT "trackedKeywords_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;