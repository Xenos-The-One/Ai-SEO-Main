ALTER TABLE "content" ADD COLUMN IF NOT EXISTS "clientReview" varchar(32);--> statement-breakpoint
ALTER TABLE "portalFeedback" ADD COLUMN IF NOT EXISTS "kind" varchar(32) DEFAULT 'note' NOT NULL;
