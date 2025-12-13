CREATE TYPE "public"."marketplace_listing_status" AS ENUM('draft', 'pending_review', 'published', 'rejected', 'archived');--> statement-breakpoint
CREATE TYPE "public"."marketplace_listing_type" AS ENUM('agent', 'workflow');--> statement-breakpoint
CREATE TABLE "agent_workflow_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"workflow_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"trigger_type" text NOT NULL,
	"trigger_config" jsonb DEFAULT '{}'::jsonb,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"change_description" text,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_paths" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"goal" text,
	"role" text,
	"skill_level" text DEFAULT 'beginner',
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"completed_steps" text[] DEFAULT '{}',
	"current_step_id" text,
	"progress_percent" integer DEFAULT 0 NOT NULL,
	"is_ai_generated" boolean DEFAULT false NOT NULL,
	"ai_context" jsonb DEFAULT '{}'::jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legal_entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"legal_name" text,
	"tax_id" text,
	"registration_number" text,
	"entity_type" text DEFAULT 'subsidiary' NOT NULL,
	"parent_entity_id" uuid,
	"country" text DEFAULT 'US' NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"timezone" text DEFAULT 'America/New_York' NOT NULL,
	"address" jsonb DEFAULT '{}'::jsonb,
	"email" text,
	"phone" text,
	"fiscal_year_start" integer DEFAULT 1 NOT NULL,
	"default_payment_terms" integer DEFAULT 30,
	"bank_accounts" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"logo" text,
	"color" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplace_installs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"installed_by" uuid NOT NULL,
	"created_agent_id" uuid,
	"created_workflow_id" uuid,
	"installed_version" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"uninstalled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplace_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "marketplace_listing_type" NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"short_description" text,
	"icon" text,
	"cover_image" text,
	"category" text NOT NULL,
	"tags" text[] DEFAULT '{}',
	"source_agent_id" uuid,
	"source_workflow_id" uuid,
	"template_data" jsonb NOT NULL,
	"published_by" uuid NOT NULL,
	"publisher_workspace_id" uuid NOT NULL,
	"publisher_name" text NOT NULL,
	"status" "marketplace_listing_status" DEFAULT 'draft' NOT NULL,
	"rejection_reason" text,
	"is_free" boolean DEFAULT true NOT NULL,
	"price" integer DEFAULT 0,
	"install_count" integer DEFAULT 0 NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"average_rating" integer DEFAULT 0,
	"review_count" integer DEFAULT 0 NOT NULL,
	"version" text DEFAULT '1.0.0' NOT NULL,
	"changelog" text,
	"required_integrations" text[] DEFAULT '{}',
	"min_plan_tier" "subscription_tier" DEFAULT 'free',
	"is_featured" boolean DEFAULT false NOT NULL,
	"featured_order" integer,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplace_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"reviewer_workspace_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"title" text,
	"content" text,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"is_verified_install" boolean DEFAULT false NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_workflow_versions" ADD CONSTRAINT "agent_workflow_versions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_workflow_versions" ADD CONSTRAINT "agent_workflow_versions_workflow_id_agent_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."agent_workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_workflow_versions" ADD CONSTRAINT "agent_workflow_versions_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_entities" ADD CONSTRAINT "legal_entities_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_installs" ADD CONSTRAINT "marketplace_installs_listing_id_marketplace_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."marketplace_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_installs" ADD CONSTRAINT "marketplace_installs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_installs" ADD CONSTRAINT "marketplace_installs_installed_by_users_id_fk" FOREIGN KEY ("installed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_installs" ADD CONSTRAINT "marketplace_installs_created_agent_id_agents_id_fk" FOREIGN KEY ("created_agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_installs" ADD CONSTRAINT "marketplace_installs_created_workflow_id_agent_workflows_id_fk" FOREIGN KEY ("created_workflow_id") REFERENCES "public"."agent_workflows"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_source_agent_id_agents_id_fk" FOREIGN KEY ("source_agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_source_workflow_id_agent_workflows_id_fk" FOREIGN KEY ("source_workflow_id") REFERENCES "public"."agent_workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_published_by_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_publisher_workspace_id_workspaces_id_fk" FOREIGN KEY ("publisher_workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_reviews" ADD CONSTRAINT "marketplace_reviews_listing_id_marketplace_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."marketplace_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_reviews" ADD CONSTRAINT "marketplace_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_reviews" ADD CONSTRAINT "marketplace_reviews_reviewer_workspace_id_workspaces_id_fk" FOREIGN KEY ("reviewer_workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_workflow_version_tenant_idx" ON "agent_workflow_versions" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "agent_workflow_version_workflow_idx" ON "agent_workflow_versions" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "agent_workflow_version_version_idx" ON "agent_workflow_versions" USING btree ("workflow_id","version");--> statement-breakpoint
CREATE INDEX "agent_workflow_version_changed_at_idx" ON "agent_workflow_versions" USING btree ("changed_at");--> statement-breakpoint
CREATE INDEX "learning_path_tenant_idx" ON "learning_paths" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "learning_path_user_idx" ON "learning_paths" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "learning_path_status_idx" ON "learning_paths" USING btree ("status");--> statement-breakpoint
CREATE INDEX "legal_entity_tenant_idx" ON "legal_entities" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "legal_entity_parent_idx" ON "legal_entities" USING btree ("parent_entity_id");--> statement-breakpoint
CREATE INDEX "legal_entity_active_idx" ON "legal_entities" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "legal_entity_default_idx" ON "legal_entities" USING btree ("workspace_id","is_default");--> statement-breakpoint
CREATE INDEX "marketplace_install_listing_idx" ON "marketplace_installs" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "marketplace_install_workspace_idx" ON "marketplace_installs" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "marketplace_install_unique_idx" ON "marketplace_installs" USING btree ("listing_id","workspace_id");--> statement-breakpoint
CREATE INDEX "marketplace_listing_type_idx" ON "marketplace_listings" USING btree ("type");--> statement-breakpoint
CREATE INDEX "marketplace_listing_category_idx" ON "marketplace_listings" USING btree ("category");--> statement-breakpoint
CREATE INDEX "marketplace_listing_status_idx" ON "marketplace_listings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "marketplace_listing_publisher_idx" ON "marketplace_listings" USING btree ("published_by");--> statement-breakpoint
CREATE INDEX "marketplace_listing_featured_idx" ON "marketplace_listings" USING btree ("is_featured","featured_order");--> statement-breakpoint
CREATE INDEX "marketplace_listing_install_count_idx" ON "marketplace_listings" USING btree ("install_count");--> statement-breakpoint
CREATE INDEX "marketplace_listing_rating_idx" ON "marketplace_listings" USING btree ("average_rating");--> statement-breakpoint
CREATE INDEX "marketplace_review_listing_idx" ON "marketplace_reviews" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "marketplace_review_reviewer_idx" ON "marketplace_reviews" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "marketplace_review_rating_idx" ON "marketplace_reviews" USING btree ("rating");--> statement-breakpoint
CREATE UNIQUE INDEX "marketplace_review_unique_idx" ON "marketplace_reviews" USING btree ("listing_id","reviewer_id");