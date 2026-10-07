ALTER TABLE "clientPortalUsers" ADD COLUMN IF NOT EXISTS "tokenVersion" integer DEFAULT 0 NOT NULL;
