CREATE TYPE "public"."lead_status" AS ENUM('cold', 'warm', 'hot', 'closed_won', 'closed_lost');--> statement-breakpoint
ALTER TYPE "public"."integration_provider" ADD VALUE 'linkedin';--> statement-breakpoint
ALTER TYPE "public"."integration_provider" ADD VALUE 'facebook';--> statement-breakpoint
CREATE TABLE "neptune_activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"conversation_id" uuid,
	"action" text NOT NULL,
	"description" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "neptune_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text,
	"summary" text,
	"topic" text,
	"message_count" integer DEFAULT 0 NOT NULL,
	"tool_execution_count" integer DEFAULT 0 NOT NULL,
	"last_active_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "neptune_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"message_id" uuid,
	"rating" integer,
	"comment" text,
	"tags" text[] DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "neptune_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"tools_used" text[] DEFAULT '{}',
	"token_count" integer,
	"response_time" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "lead_status" "lead_status";--> statement-breakpoint
ALTER TABLE "neptune_activity_log" ADD CONSTRAINT "neptune_activity_log_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neptune_activity_log" ADD CONSTRAINT "neptune_activity_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neptune_activity_log" ADD CONSTRAINT "neptune_activity_log_conversation_id_neptune_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."neptune_conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neptune_conversations" ADD CONSTRAINT "neptune_conversations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neptune_conversations" ADD CONSTRAINT "neptune_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neptune_feedback" ADD CONSTRAINT "neptune_feedback_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neptune_feedback" ADD CONSTRAINT "neptune_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neptune_feedback" ADD CONSTRAINT "neptune_feedback_conversation_id_neptune_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."neptune_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neptune_feedback" ADD CONSTRAINT "neptune_feedback_message_id_neptune_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."neptune_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neptune_messages" ADD CONSTRAINT "neptune_messages_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neptune_messages" ADD CONSTRAINT "neptune_messages_conversation_id_neptune_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."neptune_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neptune_messages" ADD CONSTRAINT "neptune_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "neptune_activity_tenant_idx" ON "neptune_activity_log" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "neptune_activity_user_idx" ON "neptune_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "neptune_activity_conversation_idx" ON "neptune_activity_log" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "neptune_activity_created_at_idx" ON "neptune_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "neptune_conversation_tenant_idx" ON "neptune_conversations" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "neptune_conversation_user_idx" ON "neptune_conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "neptune_conversation_last_active_idx" ON "neptune_conversations" USING btree ("last_active_at");--> statement-breakpoint
CREATE INDEX "neptune_feedback_tenant_idx" ON "neptune_feedback" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "neptune_feedback_user_idx" ON "neptune_feedback" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "neptune_feedback_conversation_idx" ON "neptune_feedback" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "neptune_feedback_message_idx" ON "neptune_feedback" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "neptune_message_tenant_idx" ON "neptune_messages" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "neptune_message_conversation_idx" ON "neptune_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "neptune_message_user_idx" ON "neptune_messages" USING btree ("user_id");