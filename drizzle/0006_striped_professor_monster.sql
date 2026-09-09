CREATE TABLE IF NOT EXISTS "portalFeedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"contentId" integer NOT NULL,
	"clientId" integer NOT NULL,
	"authorName" varchar(255),
	"authorEmail" varchar(320),
	"note" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "portalFeedback" ADD CONSTRAINT "portalFeedback_contentId_content_id_fk" FOREIGN KEY ("contentId") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "portalFeedback" ADD CONSTRAINT "portalFeedback_clientId_clients_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
