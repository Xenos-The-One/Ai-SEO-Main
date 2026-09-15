ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "slug" varchar(100);--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "clients" ADD CONSTRAINT "clients_slug_unique" UNIQUE("slug");
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
