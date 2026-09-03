CREATE TABLE "backlinkSnapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"clientId" integer NOT NULL,
	"createdBy" integer NOT NULL,
	"target" varchar(255) NOT NULL,
	"backlinks" integer DEFAULT 0 NOT NULL,
	"referringDomains" integer DEFAULT 0 NOT NULL,
	"referringMainDomains" integer DEFAULT 0 NOT NULL,
	"rank" integer DEFAULT 0 NOT NULL,
	"brokenBacklinks" integer DEFAULT 0 NOT NULL,
	"summary" text,
	"topReferringDomains" text,
	"topAnchors" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "backlinkSnapshots" ADD CONSTRAINT "backlinkSnapshots_clientId_clients_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backlinkSnapshots" ADD CONSTRAINT "backlinkSnapshots_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;