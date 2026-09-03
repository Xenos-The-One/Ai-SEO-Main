CREATE TABLE "aiBrands" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"domain" varchar(255),
	"competitors" text,
	"createdBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "aiPrompts" (
	"id" serial PRIMARY KEY NOT NULL,
	"brandId" integer NOT NULL,
	"prompt" text NOT NULL,
	"createdBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "aiVisibilityResults" (
	"id" serial PRIMARY KEY NOT NULL,
	"scanId" varchar(32) NOT NULL,
	"brandId" integer NOT NULL,
	"promptId" integer NOT NULL,
	"provider" varchar(32) NOT NULL,
	"mentioned" integer DEFAULT 0 NOT NULL,
	"position" integer,
	"sentiment" text,
	"competitorsMentioned" text,
	"answerExcerpt" text,
	"summary" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "aiBrands" ADD CONSTRAINT "aiBrands_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aiPrompts" ADD CONSTRAINT "aiPrompts_brandId_aiBrands_id_fk" FOREIGN KEY ("brandId") REFERENCES "public"."aiBrands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aiPrompts" ADD CONSTRAINT "aiPrompts_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aiVisibilityResults" ADD CONSTRAINT "aiVisibilityResults_brandId_aiBrands_id_fk" FOREIGN KEY ("brandId") REFERENCES "public"."aiBrands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aiVisibilityResults" ADD CONSTRAINT "aiVisibilityResults_promptId_aiPrompts_id_fk" FOREIGN KEY ("promptId") REFERENCES "public"."aiPrompts"("id") ON DELETE cascade ON UPDATE no action;