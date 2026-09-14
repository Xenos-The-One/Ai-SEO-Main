ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "servicePlan" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "seoOverview" text;--> statement-breakpoint
ALTER TABLE "trackedKeywords" ADD COLUMN IF NOT EXISTS "searchVolume" integer;--> statement-breakpoint
ALTER TABLE "trackedKeywords" ADD COLUMN IF NOT EXISTS "intent" varchar(40);
