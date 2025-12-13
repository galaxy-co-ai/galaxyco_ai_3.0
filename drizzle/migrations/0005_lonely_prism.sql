CREATE TYPE "public"."custom_field_entity_type" AS ENUM('contact', 'deal', 'customer', 'prospect');--> statement-breakpoint
CREATE TYPE "public"."custom_field_type" AS ENUM('text', 'number', 'date', 'datetime', 'select', 'multiselect', 'checkbox', 'url', 'email', 'phone', 'currency', 'textarea');--> statement-breakpoint
CREATE TYPE "public"."knowledge_share_permission" AS ENUM('view', 'edit', 'admin');--> statement-breakpoint
CREATE TYPE "public"."lead_scoring_rule_operator" AS ENUM('equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'between', 'is_set', 'is_not_set');--> statement-breakpoint
CREATE TYPE "public"."lead_scoring_rule_type" AS ENUM('property', 'behavior', 'engagement', 'demographic', 'firmographic');--> statement-breakpoint
CREATE TYPE "public"."todo_hq_sprint_status" AS ENUM('planned', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "custom_field_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"label" text NOT NULL,
	"entity_type" "custom_field_entity_type" NOT NULL,
	"field_type" "custom_field_type" NOT NULL,
	"description" text,
	"placeholder" text,
	"help_text" text,
	"options" jsonb DEFAULT '[]'::jsonb,
	"required" boolean DEFAULT false NOT NULL,
	"default_value" text,
	"validation" jsonb DEFAULT '{}'::jsonb,
	"display_order" integer DEFAULT 0 NOT NULL,
	"show_in_list" boolean DEFAULT true NOT NULL,
	"show_in_card" boolean DEFAULT true NOT NULL,
	"section" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deal_pipelines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"stage_count" integer DEFAULT 0 NOT NULL,
	"deal_count" integer DEFAULT 0 NOT NULL,
	"total_value" integer DEFAULT 0 NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_item_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"shared_with_user_id" uuid,
	"shared_with_workspace_id" uuid,
	"permission" "knowledge_share_permission" DEFAULT 'view' NOT NULL,
	"shared_by" uuid NOT NULL,
	"expires_at" timestamp,
	"message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_item_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"summary" text,
	"change_description" text,
	"changed_by" uuid NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_routing_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"criteria" jsonb NOT NULL,
	"assign_to_user_id" uuid,
	"round_robin_user_ids" jsonb DEFAULT '[]'::jsonb,
	"round_robin_index" integer DEFAULT 0,
	"priority" integer DEFAULT 0 NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"match_count" integer DEFAULT 0 NOT NULL,
	"last_matched_at" timestamp,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_scoring_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" "lead_scoring_rule_type" DEFAULT 'property' NOT NULL,
	"field" text NOT NULL,
	"operator" "lead_scoring_rule_operator" NOT NULL,
	"value" text,
	"value_secondary" text,
	"score_change" integer NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_scoring_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"min_score" integer NOT NULL,
	"max_score" integer NOT NULL,
	"color" text DEFAULT 'gray' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipeline_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pipeline_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#6366f1' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"probability" integer DEFAULT 50 NOT NULL,
	"stage_type" text DEFAULT 'open' NOT NULL,
	"deal_count" integer DEFAULT 0 NOT NULL,
	"total_value" integer DEFAULT 0 NOT NULL,
	"rotten_after_days" integer,
	"auto_move_after_days" integer,
	"auto_move_to_stage_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "todo_hq_sprints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "todo_hq_sprint_status" DEFAULT 'planned' NOT NULL,
	"goal" text,
	"start_date" timestamp,
	"end_date" timestamp,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"color" text DEFAULT 'blue',
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calendar_events" ALTER COLUMN "created_by" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD COLUMN "contact_id" uuid;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD COLUMN "external_id" text;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD COLUMN "external_metadata" jsonb;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD COLUMN "source" text;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "pipeline_id" uuid;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "stage_id" uuid;--> statement-breakpoint
ALTER TABLE "todo_hq_tasks" ADD COLUMN "sprint_id" uuid;--> statement-breakpoint
ALTER TABLE "custom_field_definitions" ADD CONSTRAINT "custom_field_definitions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_field_definitions" ADD CONSTRAINT "custom_field_definitions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_pipelines" ADD CONSTRAINT "deal_pipelines_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_pipelines" ADD CONSTRAINT "deal_pipelines_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_item_shares" ADD CONSTRAINT "knowledge_item_shares_item_id_knowledge_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."knowledge_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_item_shares" ADD CONSTRAINT "knowledge_item_shares_shared_with_user_id_users_id_fk" FOREIGN KEY ("shared_with_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_item_shares" ADD CONSTRAINT "knowledge_item_shares_shared_with_workspace_id_workspaces_id_fk" FOREIGN KEY ("shared_with_workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_item_shares" ADD CONSTRAINT "knowledge_item_shares_shared_by_users_id_fk" FOREIGN KEY ("shared_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_item_versions" ADD CONSTRAINT "knowledge_item_versions_item_id_knowledge_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."knowledge_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_item_versions" ADD CONSTRAINT "knowledge_item_versions_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_routing_rules" ADD CONSTRAINT "lead_routing_rules_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_routing_rules" ADD CONSTRAINT "lead_routing_rules_assign_to_user_id_users_id_fk" FOREIGN KEY ("assign_to_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_routing_rules" ADD CONSTRAINT "lead_routing_rules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_scoring_rules" ADD CONSTRAINT "lead_scoring_rules_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_scoring_rules" ADD CONSTRAINT "lead_scoring_rules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_scoring_tiers" ADD CONSTRAINT "lead_scoring_tiers_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_pipeline_id_deal_pipelines_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "public"."deal_pipelines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo_hq_sprints" ADD CONSTRAINT "todo_hq_sprints_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo_hq_sprints" ADD CONSTRAINT "todo_hq_sprints_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "custom_field_def_tenant_idx" ON "custom_field_definitions" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "custom_field_def_entity_type_idx" ON "custom_field_definitions" USING btree ("entity_type");--> statement-breakpoint
CREATE UNIQUE INDEX "custom_field_def_unique_name_idx" ON "custom_field_definitions" USING btree ("workspace_id","entity_type","name");--> statement-breakpoint
CREATE INDEX "custom_field_def_display_order_idx" ON "custom_field_definitions" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "custom_field_def_active_idx" ON "custom_field_definitions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "deal_pipeline_tenant_idx" ON "deal_pipelines" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "deal_pipeline_default_idx" ON "deal_pipelines" USING btree ("workspace_id","is_default");--> statement-breakpoint
CREATE INDEX "deal_pipeline_display_order_idx" ON "deal_pipelines" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "deal_pipeline_active_idx" ON "deal_pipelines" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "knowledge_item_share_item_idx" ON "knowledge_item_shares" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "knowledge_item_share_user_idx" ON "knowledge_item_shares" USING btree ("shared_with_user_id");--> statement-breakpoint
CREATE INDEX "knowledge_item_share_workspace_idx" ON "knowledge_item_shares" USING btree ("shared_with_workspace_id");--> statement-breakpoint
CREATE INDEX "knowledge_item_version_item_idx" ON "knowledge_item_versions" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "knowledge_item_version_idx" ON "knowledge_item_versions" USING btree ("item_id","version");--> statement-breakpoint
CREATE INDEX "lead_routing_rule_tenant_idx" ON "lead_routing_rules" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "lead_routing_rule_enabled_idx" ON "lead_routing_rules" USING btree ("is_enabled");--> statement-breakpoint
CREATE INDEX "lead_routing_rule_priority_idx" ON "lead_routing_rules" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "lead_scoring_rule_tenant_idx" ON "lead_scoring_rules" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "lead_scoring_rule_type_idx" ON "lead_scoring_rules" USING btree ("type");--> statement-breakpoint
CREATE INDEX "lead_scoring_rule_enabled_idx" ON "lead_scoring_rules" USING btree ("is_enabled");--> statement-breakpoint
CREATE INDEX "lead_scoring_rule_priority_idx" ON "lead_scoring_rules" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "lead_scoring_tier_tenant_idx" ON "lead_scoring_tiers" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "lead_scoring_tier_score_idx" ON "lead_scoring_tiers" USING btree ("min_score","max_score");--> statement-breakpoint
CREATE INDEX "pipeline_stage_pipeline_idx" ON "pipeline_stages" USING btree ("pipeline_id");--> statement-breakpoint
CREATE INDEX "pipeline_stage_display_order_idx" ON "pipeline_stages" USING btree ("pipeline_id","display_order");--> statement-breakpoint
CREATE INDEX "pipeline_stage_type_idx" ON "pipeline_stages" USING btree ("stage_type");--> statement-breakpoint
CREATE INDEX "pipeline_stage_active_idx" ON "pipeline_stages" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "todo_hq_sprint_tenant_idx" ON "todo_hq_sprints" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "todo_hq_sprint_status_idx" ON "todo_hq_sprints" USING btree ("status");--> statement-breakpoint
CREATE INDEX "todo_hq_sprint_sort_order_idx" ON "todo_hq_sprints" USING btree ("sort_order");--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_pipeline_id_deal_pipelines_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "public"."deal_pipelines"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_stage_id_pipeline_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."pipeline_stages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo_hq_tasks" ADD CONSTRAINT "todo_hq_tasks_sprint_id_todo_hq_sprints_id_fk" FOREIGN KEY ("sprint_id") REFERENCES "public"."todo_hq_sprints"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "calendar_event_external_id_idx" ON "calendar_events" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "calendar_event_contact_id_idx" ON "calendar_events" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "deal_pipeline_idx" ON "deals" USING btree ("pipeline_id");--> statement-breakpoint
CREATE INDEX "deal_stage_id_idx" ON "deals" USING btree ("stage_id");--> statement-breakpoint
CREATE INDEX "todo_hq_task_sprint_idx" ON "todo_hq_tasks" USING btree ("sprint_id");