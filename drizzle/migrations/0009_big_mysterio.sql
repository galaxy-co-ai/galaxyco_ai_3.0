CREATE TYPE "public"."knowledge_base_content_type" AS ENUM('guide', 'video', 'document', 'faq');--> statement-breakpoint
CREATE TABLE "neptune_knowledge_base" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"content_type" "knowledge_base_content_type" DEFAULT 'document' NOT NULL,
	"content" text,
	"external_url" text,
	"views" integer DEFAULT 0 NOT NULL,
	"created_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "neptune_quick_tips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "neptune_tutorials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"total_steps" integer DEFAULT 1 NOT NULL,
	"estimated_minutes" integer DEFAULT 10 NOT NULL,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "neptune_user_knowledge_base" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"knowledge_base_id" uuid NOT NULL,
	"starred" boolean DEFAULT false NOT NULL,
	"last_viewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "neptune_user_tutorial_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"tutorial_id" uuid NOT NULL,
	"completed_steps" integer DEFAULT 0 NOT NULL,
	"last_completed_step" integer,
	"is_completed" boolean DEFAULT false NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "neptune_knowledge_base" ADD CONSTRAINT "neptune_knowledge_base_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neptune_knowledge_base" ADD CONSTRAINT "neptune_knowledge_base_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neptune_quick_tips" ADD CONSTRAINT "neptune_quick_tips_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neptune_tutorials" ADD CONSTRAINT "neptune_tutorials_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neptune_user_knowledge_base" ADD CONSTRAINT "neptune_user_knowledge_base_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neptune_user_knowledge_base" ADD CONSTRAINT "neptune_user_knowledge_base_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neptune_user_knowledge_base" ADD CONSTRAINT "neptune_user_knowledge_base_knowledge_base_id_neptune_knowledge_base_id_fk" FOREIGN KEY ("knowledge_base_id") REFERENCES "public"."neptune_knowledge_base"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neptune_user_tutorial_progress" ADD CONSTRAINT "neptune_user_tutorial_progress_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neptune_user_tutorial_progress" ADD CONSTRAINT "neptune_user_tutorial_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neptune_user_tutorial_progress" ADD CONSTRAINT "neptune_user_tutorial_progress_tutorial_id_neptune_tutorials_id_fk" FOREIGN KEY ("tutorial_id") REFERENCES "public"."neptune_tutorials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "neptune_kb_tenant_idx" ON "neptune_knowledge_base" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "neptune_kb_category_idx" ON "neptune_knowledge_base" USING btree ("category");--> statement-breakpoint
CREATE INDEX "neptune_kb_content_type_idx" ON "neptune_knowledge_base" USING btree ("content_type");--> statement-breakpoint
CREATE INDEX "neptune_tips_tenant_idx" ON "neptune_quick_tips" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "neptune_tips_category_idx" ON "neptune_quick_tips" USING btree ("category");--> statement-breakpoint
CREATE INDEX "neptune_tips_active_idx" ON "neptune_quick_tips" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "neptune_tutorials_tenant_idx" ON "neptune_tutorials" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "neptune_tutorials_sort_idx" ON "neptune_tutorials" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "neptune_user_kb_tenant_idx" ON "neptune_user_knowledge_base" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "neptune_user_kb_user_idx" ON "neptune_user_knowledge_base" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "neptune_user_kb_unique" ON "neptune_user_knowledge_base" USING btree ("user_id","knowledge_base_id");--> statement-breakpoint
CREATE INDEX "neptune_user_tutorial_tenant_idx" ON "neptune_user_tutorial_progress" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "neptune_user_tutorial_user_idx" ON "neptune_user_tutorial_progress" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "neptune_user_tutorial_unique" ON "neptune_user_tutorial_progress" USING btree ("user_id","tutorial_id");