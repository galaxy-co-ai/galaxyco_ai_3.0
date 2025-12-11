CREATE TYPE "public"."action_risk_level" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."agent_department" AS ENUM('sales', 'marketing', 'support', 'operations', 'finance', 'product', 'general');--> statement-breakpoint
CREATE TYPE "public"."agent_message_type" AS ENUM('task', 'result', 'context', 'handoff', 'status', 'query');--> statement-breakpoint
CREATE TYPE "public"."agent_status" AS ENUM('draft', 'active', 'paused', 'archived');--> statement-breakpoint
CREATE TYPE "public"."agent_team_role" AS ENUM('coordinator', 'specialist', 'support');--> statement-breakpoint
CREATE TYPE "public"."agent_type" AS ENUM('scope', 'call', 'email', 'note', 'task', 'roadmap', 'content', 'custom', 'browser', 'cross-app', 'knowledge', 'sales', 'trending', 'research', 'meeting', 'code', 'data', 'security');--> statement-breakpoint
CREATE TYPE "public"."alert_badge_status" AS ENUM('unread', 'read', 'dismissed', 'actioned');--> statement-breakpoint
CREATE TYPE "public"."alert_badge_type" AS ENUM('trend', 'opportunity', 'warning', 'milestone', 'suggestion');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected', 'expired', 'auto_approved');--> statement-breakpoint
CREATE TYPE "public"."article_layout_template" AS ENUM('standard', 'how-to', 'listicle', 'case-study', 'tool-review', 'news', 'opinion');--> statement-breakpoint
CREATE TYPE "public"."article_source_verification" AS ENUM('verified', 'unverified', 'failed');--> statement-breakpoint
CREATE TYPE "public"."automation_action_type" AS ENUM('send_email', 'create_task', 'update_field', 'add_tag', 'remove_tag', 'assign_owner', 'create_deal', 'send_notification', 'webhook', 'wait');--> statement-breakpoint
CREATE TYPE "public"."automation_status" AS ENUM('active', 'paused', 'draft', 'archived');--> statement-breakpoint
CREATE TYPE "public"."automation_trigger_type" AS ENUM('lead_created', 'lead_stage_changed', 'deal_created', 'deal_stage_changed', 'contact_created', 'task_completed', 'email_opened', 'form_submitted', 'scheduled', 'webhook');--> statement-breakpoint
CREATE TYPE "public"."blog_post_content_type" AS ENUM('article', 'tool-spotlight');--> statement-breakpoint
CREATE TYPE "public"."blog_post_status" AS ENUM('draft', 'published', 'scheduled', 'archived');--> statement-breakpoint
CREATE TYPE "public"."blog_reaction_type" AS ENUM('helpful', 'insightful', 'inspiring');--> statement-breakpoint
CREATE TYPE "public"."campaign_recipient_status" AS ENUM('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed', 'complained');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'scheduled', 'active', 'paused', 'completed');--> statement-breakpoint
CREATE TYPE "public"."content_source_status" AS ENUM('active', 'suggested', 'rejected', 'archived');--> statement-breakpoint
CREATE TYPE "public"."content_source_type" AS ENUM('news', 'research', 'competitor', 'inspiration', 'industry', 'other');--> statement-breakpoint
CREATE TYPE "public"."conversation_channel" AS ENUM('email', 'sms', 'call', 'whatsapp', 'social', 'live_chat');--> statement-breakpoint
CREATE TYPE "public"."conversation_status" AS ENUM('active', 'archived', 'closed', 'spam');--> statement-breakpoint
CREATE TYPE "public"."customer_status" AS ENUM('lead', 'active', 'inactive', 'churned');--> statement-breakpoint
CREATE TYPE "public"."deal_priority" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."deal_stage" AS ENUM('qualification', 'discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost');--> statement-breakpoint
CREATE TYPE "public"."execution_status" AS ENUM('pending', 'running', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."expense_category" AS ENUM('travel', 'meals', 'supplies', 'software', 'hardware', 'marketing', 'payroll', 'utilities', 'rent', 'insurance', 'professional_services', 'other');--> statement-breakpoint
CREATE TYPE "public"."expense_status" AS ENUM('pending', 'approved', 'rejected', 'reimbursed');--> statement-breakpoint
CREATE TYPE "public"."feedback_sentiment" AS ENUM('very_negative', 'negative', 'neutral', 'positive', 'very_positive');--> statement-breakpoint
CREATE TYPE "public"."feedback_status" AS ENUM('new', 'in_review', 'planned', 'in_progress', 'done', 'closed', 'wont_fix');--> statement-breakpoint
CREATE TYPE "public"."feedback_type" AS ENUM('bug', 'suggestion', 'general', 'feature_request');--> statement-breakpoint
CREATE TYPE "public"."grid_edge_type" AS ENUM('default', 'conditional', 'loop', 'error');--> statement-breakpoint
CREATE TYPE "public"."grid_execution_status" AS ENUM('pending', 'running', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."grid_node_status" AS ENUM('idle', 'pending', 'running', 'success', 'error', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."grid_node_type" AS ENUM('trigger', 'action', 'condition', 'loop', 'ai', 'webhook', 'delay', 'transform', 'filter', 'aggregate', 'branch', 'merge', 'api', 'database', 'email', 'notification', 'integration', 'custom');--> statement-breakpoint
CREATE TYPE "public"."grid_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."hit_list_difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."inbox_channel" AS ENUM('email', 'chat', 'notification', 'comment', 'mention');--> statement-breakpoint
CREATE TYPE "public"."inbox_status" AS ENUM('unread', 'read', 'archived');--> statement-breakpoint
CREATE TYPE "public"."integration_provider" AS ENUM('google', 'microsoft', 'slack', 'salesforce', 'hubspot', 'quickbooks', 'stripe', 'shopify', 'twitter');--> statement-breakpoint
CREATE TYPE "public"."integration_status" AS ENUM('active', 'inactive', 'error', 'expired');--> statement-breakpoint
CREATE TYPE "public"."interaction_direction" AS ENUM('inbound', 'outbound');--> statement-breakpoint
CREATE TYPE "public"."interaction_outcome" AS ENUM('successful', 'no_answer', 'voicemail', 'busy', 'cancelled', 'rescheduled', 'follow_up_needed');--> statement-breakpoint
CREATE TYPE "public"."interaction_type" AS ENUM('call', 'email', 'meeting', 'note', 'task', 'sms', 'whatsapp', 'linkedin', 'other');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."knowledge_item_status" AS ENUM('processing', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."knowledge_item_type" AS ENUM('document', 'url', 'image', 'text');--> statement-breakpoint
CREATE TYPE "public"."marketing_channel_status" AS ENUM('active', 'paused', 'archived');--> statement-breakpoint
CREATE TYPE "public"."marketing_channel_type" AS ENUM('email', 'social', 'ads', 'content', 'seo', 'affiliate');--> statement-breakpoint
CREATE TYPE "public"."memory_tier" AS ENUM('short_term', 'medium_term', 'long_term');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('info', 'success', 'warning', 'error', 'mention', 'assignment', 'reminder', 'system');--> statement-breakpoint
CREATE TYPE "public"."orchestration_execution_status" AS ENUM('running', 'completed', 'failed', 'paused', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."orchestration_workflow_status" AS ENUM('active', 'paused', 'archived', 'draft');--> statement-breakpoint
CREATE TYPE "public"."orchestration_workflow_trigger_type" AS ENUM('manual', 'event', 'schedule', 'agent_request');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('planning', 'in_progress', 'on_hold', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."prospect_stage" AS ENUM('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost');--> statement-breakpoint
CREATE TYPE "public"."share_permission" AS ENUM('view', 'comment');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'starter', 'professional', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('todo', 'in_progress', 'done', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."team_autonomy_level" AS ENUM('supervised', 'semi_autonomous', 'autonomous');--> statement-breakpoint
CREATE TYPE "public"."team_channel_type" AS ENUM('general', 'direct', 'group', 'announcement');--> statement-breakpoint
CREATE TYPE "public"."topic_idea_generated_by" AS ENUM('ai', 'user');--> statement-breakpoint
CREATE TYPE "public"."topic_idea_status" AS ENUM('saved', 'in_progress', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'admin', 'member', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."use_case_category" AS ENUM('b2b_saas', 'b2c_app', 'agency', 'enterprise', 'solopreneur', 'ecommerce', 'creator', 'consultant', 'internal_team', 'other');--> statement-breakpoint
CREATE TYPE "public"."use_case_status" AS ENUM('draft', 'complete', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "agent_action_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"team_id" uuid,
	"agent_id" uuid,
	"workflow_execution_id" uuid,
	"action_type" text NOT NULL,
	"action_data" jsonb,
	"description" text,
	"executed_at" timestamp DEFAULT now() NOT NULL,
	"was_automatic" boolean NOT NULL,
	"approval_id" uuid,
	"risk_level" "action_risk_level",
	"success" boolean NOT NULL,
	"error" text,
	"result" jsonb,
	"duration_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"triggered_by" uuid NOT NULL,
	"status" "execution_status" DEFAULT 'pending' NOT NULL,
	"input" jsonb,
	"output" jsonb,
	"error" jsonb,
	"duration_ms" integer,
	"tokens_used" integer,
	"cost" integer,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"agent_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"input_summary" text NOT NULL,
	"output_summary" text NOT NULL,
	"duration" integer NOT NULL,
	"success" boolean NOT NULL,
	"provider" text,
	"model" text,
	"error" text,
	"metadata" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"from_agent_id" uuid,
	"to_agent_id" uuid,
	"team_id" uuid,
	"message_type" "agent_message_type" NOT NULL,
	"content" jsonb NOT NULL,
	"parent_message_id" uuid,
	"thread_id" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"delivered_at" timestamp,
	"read_at" timestamp,
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "agent_packs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"agent_templates" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"author_id" uuid,
	"author_name" text,
	"icon_url" text,
	"cover_image_url" text,
	"tags" text[] DEFAULT '{}',
	"pricing_type" text DEFAULT 'free' NOT NULL,
	"price" integer DEFAULT 0,
	"install_count" integer DEFAULT 0 NOT NULL,
	"rating" integer DEFAULT 0,
	"review_count" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agent_packs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "agent_pending_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"team_id" uuid,
	"agent_id" uuid,
	"workflow_execution_id" uuid,
	"action_type" text NOT NULL,
	"action_data" jsonb NOT NULL,
	"description" text NOT NULL,
	"risk_level" "action_risk_level" NOT NULL,
	"risk_reasons" jsonb DEFAULT '[]'::jsonb,
	"status" "approval_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"review_notes" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"trigger_type" text NOT NULL,
	"cron" text,
	"timezone" text DEFAULT 'America/Chicago',
	"webhook_url" text,
	"webhook_secret" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"next_run_at" timestamp,
	"last_run_at" timestamp,
	"last_run_status" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_shared_memory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"team_id" uuid,
	"agent_id" uuid,
	"memory_tier" "memory_tier" NOT NULL,
	"category" text NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"importance" integer DEFAULT 50 NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"role" "agent_team_role" NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"department" "agent_department" NOT NULL,
	"description" text,
	"coordinator_agent_id" uuid,
	"config" jsonb DEFAULT '{"autonomyLevel":"supervised","approvalRequired":[],"maxConcurrentTasks":5}'::jsonb NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"total_executions" integer DEFAULT 0 NOT NULL,
	"successful_executions" integer DEFAULT 0 NOT NULL,
	"last_active_at" timestamp,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"short_description" text NOT NULL,
	"category" text NOT NULL,
	"type" "agent_type" NOT NULL,
	"icon_url" text,
	"cover_image_url" text,
	"badge_text" text,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"kpis" jsonb DEFAULT '{}'::jsonb,
	"author_id" uuid,
	"author_name" text DEFAULT 'GalaxyCo Team',
	"tags" text[] DEFAULT '{}',
	"install_count" integer DEFAULT 0 NOT NULL,
	"rating" integer DEFAULT 0,
	"review_count" integer DEFAULT 0 NOT NULL,
	"installs_24h" integer DEFAULT 0 NOT NULL,
	"installs_7d" integer DEFAULT 0 NOT NULL,
	"installs_30d" integer DEFAULT 0 NOT NULL,
	"trending_score" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agent_templates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "agent_workflow_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"workflow_id" uuid NOT NULL,
	"status" "orchestration_execution_status" DEFAULT 'running' NOT NULL,
	"current_step_id" text,
	"current_step_index" integer DEFAULT 0 NOT NULL,
	"step_results" jsonb DEFAULT '{}'::jsonb,
	"context" jsonb DEFAULT '{}'::jsonb,
	"triggered_by" uuid,
	"trigger_type" text,
	"trigger_data" jsonb,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"paused_at" timestamp,
	"duration_ms" integer,
	"total_steps" integer DEFAULT 0 NOT NULL,
	"completed_steps" integer DEFAULT 0 NOT NULL,
	"error" jsonb
);
--> statement-breakpoint
CREATE TABLE "agent_workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"team_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"category" text,
	"trigger_type" "orchestration_workflow_trigger_type" NOT NULL,
	"trigger_config" jsonb DEFAULT '{}'::jsonb,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "orchestration_workflow_status" DEFAULT 'draft' NOT NULL,
	"total_executions" integer DEFAULT 0 NOT NULL,
	"successful_executions" integer DEFAULT 0 NOT NULL,
	"avg_duration_ms" integer,
	"last_executed_at" timestamp,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" "agent_type" NOT NULL,
	"status" "agent_status" DEFAULT 'draft' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source_pack_id" uuid,
	"is_custom" boolean DEFAULT true NOT NULL,
	"created_by" uuid NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"version" text DEFAULT '1.0.0' NOT NULL,
	"execution_count" integer DEFAULT 0 NOT NULL,
	"last_executed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"context" jsonb DEFAULT '{}'::jsonb,
	"tags" text[] DEFAULT '{}',
	"is_pinned" boolean DEFAULT false NOT NULL,
	"message_count" integer DEFAULT 0 NOT NULL,
	"last_message_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_message_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"feedback_type" text NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"attachments" jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"communication_style" text DEFAULT 'balanced',
	"topics_of_interest" text[] DEFAULT '{}',
	"frequent_questions" text[] DEFAULT '{}',
	"corrections" jsonb DEFAULT '[]'::jsonb,
	"default_model" text DEFAULT 'gpt-4',
	"enable_rag" boolean DEFAULT true NOT NULL,
	"enable_proactive_insights" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alert_badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"type" "alert_badge_type" NOT NULL,
	"status" "alert_badge_status" DEFAULT 'unread' NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"related_entity_type" text,
	"related_entity_id" uuid,
	"action_label" text,
	"action_url" text,
	"priority" integer DEFAULT 0,
	"read_at" timestamp,
	"dismissed_at" timestamp,
	"actioned_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"session_id" text,
	"event_type" text NOT NULL,
	"event_name" text,
	"page_url" text NOT NULL,
	"referrer" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"user_agent" text,
	"device_type" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "article_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"post_id" uuid NOT NULL,
	"total_views" integer DEFAULT 0,
	"unique_visitors" integer DEFAULT 0,
	"avg_time_on_page_seconds" integer DEFAULT 0,
	"avg_scroll_depth" integer DEFAULT 0,
	"bounce_rate" integer DEFAULT 0,
	"traffic_sources" jsonb DEFAULT '{}'::jsonb,
	"social_shares" integer DEFAULT 0,
	"comments_count" integer DEFAULT 0,
	"reactions_count" integer DEFAULT 0,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"ai_insights" jsonb DEFAULT '[]'::jsonb,
	"aggregated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "article_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"title" text NOT NULL,
	"url" text,
	"publication" text,
	"published_date" timestamp,
	"quote_used" text,
	"claim_supported" text,
	"verified" boolean DEFAULT false NOT NULL,
	"verification_status" "article_source_verification" DEFAULT 'unverified',
	"verification_method" text,
	"verification_notes" text,
	"verified_at" timestamp,
	"inline_position" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid,
	"user_email" text,
	"ip_address" text,
	"user_agent" text,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text,
	"changes" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automation_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"automation_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"status" "execution_status" DEFAULT 'pending' NOT NULL,
	"action_results" jsonb DEFAULT '[]'::jsonb,
	"error" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automation_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "automation_status" DEFAULT 'draft' NOT NULL,
	"trigger_type" "automation_trigger_type" NOT NULL,
	"trigger_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"actions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"max_executions_per_day" integer DEFAULT 100,
	"cooldown_minutes" integer DEFAULT 0,
	"execution_count" integer DEFAULT 0 NOT NULL,
	"last_executed_at" timestamp,
	"success_count" integer DEFAULT 0 NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"post_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"icon" text,
	"color" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "blog_collection_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection_id" uuid NOT NULL,
	"post_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"author_id" uuid,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"cover_image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_collections_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "blog_post_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"category_id" uuid,
	"content_type" "blog_post_content_type" DEFAULT 'article' NOT NULL,
	"author_id" uuid,
	"status" "blog_post_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"scheduled_at" timestamp,
	"featured" boolean DEFAULT false NOT NULL,
	"featured_image" text,
	"reading_time_minutes" integer,
	"meta_title" text,
	"meta_description" text,
	"og_image" text,
	"view_count" integer DEFAULT 0 NOT NULL,
	"outline" jsonb,
	"layout_template" "article_layout_template",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "blog_reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"post_id" uuid NOT NULL,
	"type" "blog_reaction_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_reading_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"post_id" uuid NOT NULL,
	"progress_percent" integer DEFAULT 0 NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"last_read_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "blog_user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"preferred_categories" jsonb DEFAULT '[]'::jsonb,
	"preferred_tags" jsonb DEFAULT '[]'::jsonb,
	"email_newsletter" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "blog_voice_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"tone_descriptors" jsonb DEFAULT '[]'::jsonb,
	"example_phrases" jsonb DEFAULT '[]'::jsonb,
	"avoid_phrases" jsonb DEFAULT '[]'::jsonb,
	"avg_sentence_length" integer,
	"structure_preferences" jsonb,
	"analyzed_post_count" integer DEFAULT 0,
	"last_analyzed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_voice_profiles_workspace_id_unique" UNIQUE("workspace_id")
);
--> statement-breakpoint
CREATE TABLE "brainstorm_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text,
	"messages" jsonb DEFAULT '[]'::jsonb,
	"resulting_topic_id" uuid,
	"resulting_post_id" uuid,
	"key_insights" jsonb DEFAULT '[]'::jsonb,
	"suggested_angle" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"location" text,
	"meeting_url" text,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"timezone" text DEFAULT 'America/Chicago',
	"is_all_day" boolean DEFAULT false,
	"is_recurring" boolean DEFAULT false,
	"recurrence_rule" text,
	"created_by" uuid NOT NULL,
	"attendees" jsonb DEFAULT '[]'::jsonb,
	"customer_id" uuid,
	"project_id" uuid,
	"tags" text[] DEFAULT '{}',
	"reminders" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_recipients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"contact_id" uuid,
	"prospect_id" uuid,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"status" "campaign_recipient_status" DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"opened_at" timestamp,
	"clicked_at" timestamp,
	"bounced_at" timestamp,
	"unsubscribed_at" timestamp,
	"complained_at" timestamp,
	"open_count" integer DEFAULT 0,
	"click_count" integer DEFAULT 0,
	"clicked_links" jsonb DEFAULT '[]'::jsonb,
	"external_message_id" text,
	"error_code" text,
	"error_message" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"type" text NOT NULL,
	"segment_id" uuid,
	"target_audience" jsonb DEFAULT '{}'::jsonb,
	"start_date" timestamp,
	"end_date" timestamp,
	"scheduled_for" timestamp,
	"content" jsonb DEFAULT '{}'::jsonb,
	"sent_count" integer DEFAULT 0,
	"open_count" integer DEFAULT 0,
	"click_count" integer DEFAULT 0,
	"conversion_count" integer DEFAULT 0,
	"budget" integer,
	"spent" integer DEFAULT 0,
	"created_by" uuid NOT NULL,
	"tags" text[] DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"content" text NOT NULL,
	"type" text DEFAULT 'text',
	"sender_id" uuid NOT NULL,
	"recipient_id" uuid,
	"group_id" text,
	"reply_to_id" text,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"reactions" jsonb DEFAULT '{}'::jsonb,
	"is_edited" boolean DEFAULT false,
	"edited_at" timestamp,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"first_name" text,
	"last_name" text,
	"email" text NOT NULL,
	"phone" text,
	"title" text,
	"company" text,
	"linkedin_url" text,
	"twitter_url" text,
	"customer_id" uuid,
	"assigned_to" uuid,
	"tags" text[] DEFAULT '{}',
	"notes" text,
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"last_contacted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_ai_learning" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"learning_type" text NOT NULL,
	"pattern" jsonb NOT NULL,
	"impact_score" integer,
	"valid_from" timestamp DEFAULT now() NOT NULL,
	"valid_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"description" text,
	"type" "content_source_type" DEFAULT 'other' NOT NULL,
	"status" "content_source_status" DEFAULT 'active' NOT NULL,
	"ai_review_score" integer,
	"ai_review_notes" text,
	"ai_reviewed_at" timestamp,
	"last_checked_at" timestamp,
	"articles_found_count" integer DEFAULT 0,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"added_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"body" text NOT NULL,
	"subject" text,
	"html_body" text,
	"direction" text NOT NULL,
	"is_from_customer" boolean DEFAULT true,
	"sender_id" uuid,
	"sender_email" text,
	"sender_name" text,
	"sender_phone" text,
	"recipient_email" text,
	"recipient_phone" text,
	"external_id" text,
	"external_metadata" jsonb DEFAULT '{}'::jsonb,
	"reply_to_id" uuid,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"is_read" boolean DEFAULT false,
	"is_delivered" boolean DEFAULT false,
	"is_failed" boolean DEFAULT false,
	"failure_reason" text,
	"call_duration" integer,
	"call_recording_url" text,
	"call_transcription" text,
	"read_at" timestamp,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"contact_id" uuid,
	"prospect_id" uuid,
	"customer_id" uuid,
	"user_id" uuid,
	"email" text,
	"phone" text,
	"name" text,
	"role" text DEFAULT 'participant',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"channel" "conversation_channel" NOT NULL,
	"status" "conversation_status" DEFAULT 'active' NOT NULL,
	"subject" text,
	"snippet" text,
	"external_id" text,
	"external_metadata" jsonb DEFAULT '{}'::jsonb,
	"is_unread" boolean DEFAULT true,
	"is_starred" boolean DEFAULT false,
	"is_pinned" boolean DEFAULT false,
	"unread_count" integer DEFAULT 0,
	"message_count" integer DEFAULT 0,
	"assigned_to" uuid,
	"labels" text[] DEFAULT '{}',
	"tags" text[] DEFAULT '{}',
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creator_collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text,
	"is_auto" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creator_item_collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"collection_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creator_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"content" jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"starred" boolean DEFAULT false NOT NULL,
	"gamma_url" text,
	"gamma_edit_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creator_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"category" text,
	"content" jsonb NOT NULL,
	"thumbnail" text,
	"is_premium" boolean DEFAULT false NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_interactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"type" "interaction_type" NOT NULL,
	"direction" "interaction_direction" DEFAULT 'outbound' NOT NULL,
	"subject" text,
	"contact_id" uuid,
	"prospect_id" uuid,
	"customer_id" uuid,
	"deal_id" uuid,
	"notes" text,
	"summary" text,
	"duration" integer,
	"outcome" "interaction_outcome",
	"recording_url" text,
	"transcript_url" text,
	"email_subject" text,
	"email_body" text,
	"email_thread_id" text,
	"meeting_location" text,
	"meeting_link" text,
	"attendees" jsonb DEFAULT '[]'::jsonb,
	"scheduled_at" timestamp,
	"occurred_at" timestamp,
	"completed_at" timestamp,
	"follow_up_required" boolean DEFAULT false,
	"follow_up_date" timestamp,
	"follow_up_notes" text,
	"sentiment" text,
	"ai_insights" jsonb DEFAULT '{}'::jsonb,
	"created_by" uuid NOT NULL,
	"assigned_to" uuid,
	"tags" text[] DEFAULT '{}',
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"company" text,
	"website" text,
	"address" jsonb DEFAULT '{}'::jsonb,
	"status" "customer_status" DEFAULT 'lead' NOT NULL,
	"industry" text,
	"size" text,
	"revenue" integer,
	"assigned_to" uuid,
	"tags" text[] DEFAULT '{}',
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"notes" text,
	"last_contacted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"resource_type" text NOT NULL,
	"format" text DEFAULT 'csv' NOT NULL,
	"status" "job_status" DEFAULT 'pending' NOT NULL,
	"filters" jsonb DEFAULT '{}'::jsonb,
	"columns" text[],
	"file_url" text,
	"file_size" integer,
	"record_count" integer,
	"error" text,
	"requested_by" uuid NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"resource_type" text NOT NULL,
	"status" "job_status" DEFAULT 'pending' NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer,
	"file_url" text,
	"column_mapping" jsonb DEFAULT '{}'::jsonb,
	"total_rows" integer,
	"successful_rows" integer DEFAULT 0,
	"failed_rows" integer DEFAULT 0,
	"errors" jsonb DEFAULT '[]'::jsonb,
	"error" text,
	"requested_by" uuid NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"stage" "deal_stage" DEFAULT 'qualification' NOT NULL,
	"priority" "deal_priority" DEFAULT 'medium' NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"probability" integer DEFAULT 50,
	"customer_id" uuid,
	"contact_id" uuid,
	"prospect_id" uuid,
	"owner_id" uuid NOT NULL,
	"team_members" jsonb DEFAULT '[]'::jsonb,
	"expected_close_date" timestamp,
	"actual_close_date" timestamp,
	"closed_reason" text,
	"competitor_id" text,
	"competitor_name" text,
	"line_items" jsonb DEFAULT '[]'::jsonb,
	"ai_risk_score" integer,
	"ai_risk_factors" jsonb DEFAULT '[]'::jsonb,
	"ai_next_best_action" text,
	"ai_win_probability" integer,
	"last_activity_at" timestamp,
	"next_follow_up_at" timestamp,
	"days_since_last_activity" integer DEFAULT 0,
	"source" text,
	"tags" text[] DEFAULT '{}',
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"subject" text NOT NULL,
	"snippet" text,
	"message_count" integer DEFAULT 0,
	"participants" jsonb DEFAULT '[]'::jsonb,
	"is_starred" boolean DEFAULT false,
	"is_read" boolean DEFAULT false,
	"folder" text DEFAULT 'inbox',
	"labels" text[] DEFAULT '{}',
	"last_message_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "execution_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"execution_id" uuid NOT NULL,
	"node_id" uuid NOT NULL,
	"step_index" integer NOT NULL,
	"status" "grid_node_status" DEFAULT 'pending' NOT NULL,
	"input_data" jsonb DEFAULT '{}'::jsonb,
	"output_data" jsonb DEFAULT '{}'::jsonb,
	"started_at" timestamp,
	"completed_at" timestamp,
	"duration_ms" integer,
	"error_message" text,
	"error_stack" text,
	"logs" text[] DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"description" text NOT NULL,
	"category" "expense_category" NOT NULL,
	"status" "expense_status" DEFAULT 'pending' NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"tax_amount" integer DEFAULT 0,
	"vendor" text,
	"vendor_id" uuid,
	"project_id" uuid,
	"customer_id" uuid,
	"expense_date" timestamp NOT NULL,
	"due_date" timestamp,
	"paid_date" timestamp,
	"payment_method" text,
	"reference_number" text,
	"receipt_url" text,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"external_id" text,
	"external_source" text,
	"submitted_by" uuid NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"rejection_reason" text,
	"is_reimbursable" boolean DEFAULT false,
	"reimbursed_at" timestamp,
	"reimbursement_amount" integer,
	"tags" text[] DEFAULT '{}',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "galaxy_grids" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"thumbnail_url" text,
	"viewport" jsonb DEFAULT '{"x":0,"y":0,"zoom":1}'::jsonb,
	"status" "grid_status" DEFAULT 'draft' NOT NULL,
	"is_template" boolean DEFAULT false,
	"template_category" text,
	"tags" text[] DEFAULT '{}',
	"created_by" uuid NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"parent_grid_id" uuid,
	"published_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grid_edges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grid_id" uuid NOT NULL,
	"source_node_id" uuid NOT NULL,
	"target_node_id" uuid NOT NULL,
	"source_handle" text DEFAULT 'output',
	"target_handle" text DEFAULT 'input',
	"edge_type" "grid_edge_type" DEFAULT 'default' NOT NULL,
	"condition" jsonb DEFAULT '{}'::jsonb,
	"label" text,
	"animated" boolean DEFAULT false,
	"style" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grid_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"grid_id" uuid NOT NULL,
	"status" "grid_execution_status" DEFAULT 'pending' NOT NULL,
	"trigger_type" text NOT NULL,
	"trigger_data" jsonb DEFAULT '{}'::jsonb,
	"input" jsonb DEFAULT '{}'::jsonb,
	"output" jsonb DEFAULT '{}'::jsonb,
	"started_at" timestamp,
	"completed_at" timestamp,
	"duration_ms" integer,
	"error_message" text,
	"error_stack" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grid_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grid_id" uuid NOT NULL,
	"node_type" "grid_node_type" NOT NULL,
	"label" text NOT NULL,
	"position" jsonb DEFAULT '{"x":0,"y":0}'::jsonb NOT NULL,
	"width" integer,
	"height" integer,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"agent_id" uuid,
	"status" "grid_node_status" DEFAULT 'idle',
	"style" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grid_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"tags" text[] DEFAULT '{}',
	"thumbnail_url" text,
	"preview_data" jsonb NOT NULL,
	"complexity" text,
	"estimated_time" integer,
	"uses" integer DEFAULT 0 NOT NULL,
	"rating" integer,
	"featured" boolean DEFAULT false,
	"author_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grid_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grid_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"changes_summary" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inbox_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"channel" "inbox_channel" NOT NULL,
	"subject" text,
	"body" text NOT NULL,
	"status" "inbox_status" DEFAULT 'unread' NOT NULL,
	"sender_id" uuid,
	"sender_email" text,
	"sender_name" text,
	"recipient_ids" jsonb DEFAULT '[]'::jsonb,
	"thread_id" text,
	"reply_to_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"read_at" timestamp,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"provider" "integration_provider" NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"status" "integration_status" DEFAULT 'active' NOT NULL,
	"provider_account_id" text NOT NULL,
	"email" text,
	"display_name" text,
	"profile_image" text,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"last_error" text,
	"last_error_at" timestamp,
	"last_sync_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"invoice_number" text NOT NULL,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"customer_id" uuid NOT NULL,
	"project_id" uuid,
	"subtotal" integer NOT NULL,
	"tax" integer DEFAULT 0,
	"total" integer NOT NULL,
	"amount_paid" integer DEFAULT 0,
	"currency" text DEFAULT 'USD' NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"issue_date" timestamp NOT NULL,
	"due_date" timestamp NOT NULL,
	"paid_at" timestamp,
	"notes" text,
	"terms" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text,
	"icon" text,
	"created_by" uuid NOT NULL,
	"item_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_item_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"title" text NOT NULL,
	"type" "knowledge_item_type" NOT NULL,
	"status" "knowledge_item_status" DEFAULT 'processing' NOT NULL,
	"source_url" text,
	"file_name" text,
	"file_size" integer,
	"mime_type" text,
	"content" text,
	"summary" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"embeddings" jsonb,
	"embeddings_model" text,
	"collection_id" uuid,
	"tags" text[] DEFAULT '{}',
	"is_favorite" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"processing_error" text,
	"processed_at" timestamp,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "marketing_channel_type" NOT NULL,
	"status" "marketing_channel_status" DEFAULT 'active' NOT NULL,
	"description" text,
	"config" jsonb DEFAULT '{}'::jsonb,
	"budget" integer,
	"spent" integer DEFAULT 0,
	"impressions" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"revenue" integer DEFAULT 0,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "neptune_action_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"action_type" text NOT NULL,
	"tool_name" text NOT NULL,
	"was_automatic" boolean DEFAULT false NOT NULL,
	"user_approved" boolean,
	"execution_time" integer,
	"result_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"user_id" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"subscribed_at" timestamp DEFAULT now() NOT NULL,
	"unsubscribed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"action_url" text,
	"action_label" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"is_read" boolean DEFAULT false,
	"is_dismissed" boolean DEFAULT false,
	"read_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"integration_id" uuid NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"id_token" text,
	"token_type" text DEFAULT 'Bearer' NOT NULL,
	"expires_at" timestamp,
	"scope" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"user_email" text,
	"page_url" text NOT NULL,
	"feature_area" text,
	"type" "feedback_type" NOT NULL,
	"sentiment" "feedback_sentiment",
	"title" text,
	"content" text,
	"screenshot_url" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"status" "feedback_status" DEFAULT 'new' NOT NULL,
	"priority" "task_priority",
	"assigned_to" uuid,
	"internal_notes" text,
	"resolution" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proactive_insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid,
	"type" text NOT NULL,
	"priority" integer DEFAULT 5 NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"suggested_actions" jsonb DEFAULT '[]'::jsonb,
	"auto_executable" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp,
	"dismissed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "project_status" DEFAULT 'planning' NOT NULL,
	"customer_id" uuid,
	"manager_id" uuid,
	"start_date" timestamp,
	"end_date" timestamp,
	"budget" integer,
	"actual_cost" integer,
	"progress" integer DEFAULT 0,
	"completed_tasks" integer DEFAULT 0,
	"total_tasks" integer DEFAULT 0,
	"tags" text[] DEFAULT '{}',
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prospects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"company" text,
	"title" text,
	"linkedin_url" text,
	"stage" "prospect_stage" DEFAULT 'new' NOT NULL,
	"score" integer DEFAULT 0,
	"estimated_value" integer,
	"assigned_to" uuid,
	"source" text,
	"last_contacted_at" timestamp,
	"next_follow_up_at" timestamp,
	"interaction_count" integer DEFAULT 0,
	"tags" text[] DEFAULT '{}',
	"notes" text,
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"converted_to_customer" boolean DEFAULT false,
	"customer_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"criteria" jsonb DEFAULT '{"rules":[]}'::jsonb NOT NULL,
	"member_count" integer DEFAULT 0,
	"last_calculated_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shared_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"creator_item_id" uuid NOT NULL,
	"token" text NOT NULL,
	"permission" "share_permission" DEFAULT 'view' NOT NULL,
	"password" text,
	"expires_at" timestamp,
	"access_count" integer DEFAULT 0 NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shared_documents_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "social_media_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"integration_id" uuid,
	"user_id" uuid NOT NULL,
	"platform" text NOT NULL,
	"content" text NOT NULL,
	"media_urls" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"posted_at" timestamp,
	"scheduled_for" timestamp,
	"external_post_id" text,
	"engagement" jsonb DEFAULT '{}'::jsonb,
	"error_message" text,
	"retry_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_by" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "task_status" DEFAULT 'todo' NOT NULL,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"assigned_to" uuid,
	"created_by" uuid NOT NULL,
	"project_id" uuid,
	"customer_id" uuid,
	"due_date" timestamp,
	"start_date" timestamp,
	"completed_at" timestamp,
	"tags" text[] DEFAULT '{}',
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_channel_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'member',
	"last_read_at" timestamp,
	"last_read_message_id" uuid,
	"is_muted" boolean DEFAULT false,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" "team_channel_type" DEFAULT 'general' NOT NULL,
	"dm_participant_ids" text,
	"is_private" boolean DEFAULT false,
	"is_archived" boolean DEFAULT false,
	"message_count" integer DEFAULT 0,
	"last_message_at" timestamp,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"content" text NOT NULL,
	"reply_to_id" uuid,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"reactions" jsonb DEFAULT '{}'::jsonb,
	"is_edited" boolean DEFAULT false,
	"is_deleted" boolean DEFAULT false,
	"edited_at" timestamp,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topic_ideas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"why_it_works" text,
	"generated_by" "topic_idea_generated_by" DEFAULT 'user' NOT NULL,
	"status" "topic_idea_status" DEFAULT 'saved' NOT NULL,
	"resulting_post_id" uuid,
	"source_conversation" jsonb,
	"category" text,
	"suggested_layout" "article_layout_template",
	"ai_prompt" text,
	"priority" "task_priority" DEFAULT 'medium',
	"target_publish_date" timestamp,
	"assigned_to" uuid,
	"hit_list_position" integer,
	"hit_list_added_at" timestamp,
	"estimated_time_minutes" integer,
	"difficulty_level" "hit_list_difficulty" DEFAULT 'medium',
	"priority_score" integer,
	"priority_score_breakdown" jsonb,
	"wizard_progress" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "use_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" "use_case_category" DEFAULT 'other' NOT NULL,
	"status" "use_case_status" DEFAULT 'draft' NOT NULL,
	"personas" jsonb DEFAULT '[]'::jsonb,
	"platform_tools" jsonb DEFAULT '[]'::jsonb,
	"journey_stages" jsonb DEFAULT '[]'::jsonb,
	"messaging" jsonb,
	"onboarding_questions" jsonb DEFAULT '[]'::jsonb,
	"roadmap" jsonb DEFAULT '[]'::jsonb,
	"created_by" uuid,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_autonomy_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"action_type" text NOT NULL,
	"tool_name" text NOT NULL,
	"confidence_score" integer DEFAULT 0 NOT NULL,
	"approval_count" integer DEFAULT 0 NOT NULL,
	"rejection_count" integer DEFAULT 0 NOT NULL,
	"auto_execute_enabled" boolean DEFAULT false NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"avatar_url" text,
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webhook_id" uuid NOT NULL,
	"event" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" integer,
	"response_body" text,
	"response_time" integer,
	"attempt" integer DEFAULT 1,
	"max_attempts" integer DEFAULT 3,
	"next_retry_at" timestamp,
	"error" text,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"events" text[] NOT NULL,
	"secret" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"last_triggered_at" timestamp,
	"success_count" integer DEFAULT 0,
	"failure_count" integer DEFAULT 0,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"name" text NOT NULL,
	"encrypted_key" text NOT NULL,
	"iv" text NOT NULL,
	"auth_tag" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_intelligence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"industry" text,
	"business_model" text,
	"goals" jsonb DEFAULT '[]'::jsonb,
	"metrics" jsonb DEFAULT '[]'::jsonb,
	"priorities" text[] DEFAULT '{}',
	"learned_patterns" jsonb DEFAULT '{}'::jsonb,
	"company_name" text,
	"company_description" text,
	"products" jsonb DEFAULT '[]'::jsonb,
	"services" jsonb DEFAULT '[]'::jsonb,
	"team_members" jsonb DEFAULT '[]'::jsonb,
	"target_audience" text,
	"value_propositions" text[] DEFAULT '{}',
	"brand_voice" text,
	"contact_info" jsonb DEFAULT '{}'::jsonb,
	"social_links" jsonb DEFAULT '{}'::jsonb,
	"website_url" text,
	"website_analyzed_at" timestamp,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_intelligence_workspace_id_unique" UNIQUE("workspace_id")
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "user_role" DEFAULT 'member' NOT NULL,
	"permissions" jsonb DEFAULT '{}'::jsonb,
	"invited_by" uuid,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_phone_numbers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"phone_number" text NOT NULL,
	"phone_number_sid" text NOT NULL,
	"friendly_name" text,
	"capabilities" jsonb NOT NULL,
	"voice_url" text,
	"sms_url" text,
	"status_callback_url" text,
	"status" text DEFAULT 'active' NOT NULL,
	"number_type" text DEFAULT 'primary' NOT NULL,
	"monthly_cost_cents" integer DEFAULT 100 NOT NULL,
	"provisioned_at" timestamp DEFAULT now() NOT NULL,
	"released_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_phone_numbers_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"clerk_organization_id" text,
	"subscription_tier" "subscription_tier" DEFAULT 'free' NOT NULL,
	"subscription_status" text DEFAULT 'active' NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"encrypted_api_keys" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workspaces_slug_unique" UNIQUE("slug"),
	CONSTRAINT "workspaces_clerk_organization_id_unique" UNIQUE("clerk_organization_id")
);
--> statement-breakpoint
CREATE TABLE "workflow_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"status" varchar(50) DEFAULT 'running' NOT NULL,
	"trigger" jsonb,
	"input" jsonb,
	"output" jsonb,
	"error" text,
	"node_executions" jsonb,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"duration" integer
);
--> statement-breakpoint
CREATE TABLE "workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"trigger" jsonb,
	"nodes" jsonb NOT NULL,
	"edges" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_template" boolean DEFAULT false NOT NULL,
	"execution_count" integer DEFAULT 0 NOT NULL,
	"last_executed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_action_audit_log" ADD CONSTRAINT "agent_action_audit_log_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_action_audit_log" ADD CONSTRAINT "agent_action_audit_log_team_id_agent_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."agent_teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_action_audit_log" ADD CONSTRAINT "agent_action_audit_log_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_action_audit_log" ADD CONSTRAINT "agent_action_audit_log_workflow_execution_id_agent_workflow_executions_id_fk" FOREIGN KEY ("workflow_execution_id") REFERENCES "public"."agent_workflow_executions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_action_audit_log" ADD CONSTRAINT "agent_action_audit_log_approval_id_agent_pending_actions_id_fk" FOREIGN KEY ("approval_id") REFERENCES "public"."agent_pending_actions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_executions" ADD CONSTRAINT "agent_executions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_executions" ADD CONSTRAINT "agent_executions_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_executions" ADD CONSTRAINT "agent_executions_triggered_by_users_id_fk" FOREIGN KEY ("triggered_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_logs" ADD CONSTRAINT "agent_logs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_messages" ADD CONSTRAINT "agent_messages_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_messages" ADD CONSTRAINT "agent_messages_from_agent_id_agents_id_fk" FOREIGN KEY ("from_agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_messages" ADD CONSTRAINT "agent_messages_to_agent_id_agents_id_fk" FOREIGN KEY ("to_agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_messages" ADD CONSTRAINT "agent_messages_team_id_agent_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."agent_teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_packs" ADD CONSTRAINT "agent_packs_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_pending_actions" ADD CONSTRAINT "agent_pending_actions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_pending_actions" ADD CONSTRAINT "agent_pending_actions_team_id_agent_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."agent_teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_pending_actions" ADD CONSTRAINT "agent_pending_actions_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_pending_actions" ADD CONSTRAINT "agent_pending_actions_workflow_execution_id_agent_workflow_executions_id_fk" FOREIGN KEY ("workflow_execution_id") REFERENCES "public"."agent_workflow_executions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_pending_actions" ADD CONSTRAINT "agent_pending_actions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_schedules" ADD CONSTRAINT "agent_schedules_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_schedules" ADD CONSTRAINT "agent_schedules_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_shared_memory" ADD CONSTRAINT "agent_shared_memory_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_shared_memory" ADD CONSTRAINT "agent_shared_memory_team_id_agent_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."agent_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_shared_memory" ADD CONSTRAINT "agent_shared_memory_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_team_members" ADD CONSTRAINT "agent_team_members_team_id_agent_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."agent_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_team_members" ADD CONSTRAINT "agent_team_members_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_teams" ADD CONSTRAINT "agent_teams_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_teams" ADD CONSTRAINT "agent_teams_coordinator_agent_id_agents_id_fk" FOREIGN KEY ("coordinator_agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_teams" ADD CONSTRAINT "agent_teams_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_templates" ADD CONSTRAINT "agent_templates_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_workflow_executions" ADD CONSTRAINT "agent_workflow_executions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_workflow_executions" ADD CONSTRAINT "agent_workflow_executions_workflow_id_agent_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."agent_workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_workflow_executions" ADD CONSTRAINT "agent_workflow_executions_triggered_by_users_id_fk" FOREIGN KEY ("triggered_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_workflows" ADD CONSTRAINT "agent_workflows_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_workflows" ADD CONSTRAINT "agent_workflows_team_id_agent_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."agent_teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_workflows" ADD CONSTRAINT "agent_workflows_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_message_feedback" ADD CONSTRAINT "ai_message_feedback_message_id_ai_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."ai_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_message_feedback" ADD CONSTRAINT "ai_message_feedback_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_message_feedback" ADD CONSTRAINT "ai_message_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_ai_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_user_preferences" ADD CONSTRAINT "ai_user_preferences_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_user_preferences" ADD CONSTRAINT "ai_user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_badges" ADD CONSTRAINT "alert_badges_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_analytics" ADD CONSTRAINT "article_analytics_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_analytics" ADD CONSTRAINT "article_analytics_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_sources" ADD CONSTRAINT "article_sources_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_executions" ADD CONSTRAINT "automation_executions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_executions" ADD CONSTRAINT "automation_executions_automation_id_automation_rules_id_fk" FOREIGN KEY ("automation_id") REFERENCES "public"."automation_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_bookmarks" ADD CONSTRAINT "blog_bookmarks_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_collection_posts" ADD CONSTRAINT "blog_collection_posts_collection_id_blog_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."blog_collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_collection_posts" ADD CONSTRAINT "blog_collection_posts_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_collections" ADD CONSTRAINT "blog_collections_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_tags" ADD CONSTRAINT "blog_post_tags_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_tags" ADD CONSTRAINT "blog_post_tags_tag_id_blog_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."blog_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_category_id_blog_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."blog_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_reactions" ADD CONSTRAINT "blog_reactions_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_reading_progress" ADD CONSTRAINT "blog_reading_progress_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_voice_profiles" ADD CONSTRAINT "blog_voice_profiles_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brainstorm_sessions" ADD CONSTRAINT "brainstorm_sessions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brainstorm_sessions" ADD CONSTRAINT "brainstorm_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brainstorm_sessions" ADD CONSTRAINT "brainstorm_sessions_resulting_topic_id_topic_ideas_id_fk" FOREIGN KEY ("resulting_topic_id") REFERENCES "public"."topic_ideas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brainstorm_sessions" ADD CONSTRAINT "brainstorm_sessions_resulting_post_id_blog_posts_id_fk" FOREIGN KEY ("resulting_post_id") REFERENCES "public"."blog_posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_recipients" ADD CONSTRAINT "campaign_recipients_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_recipients" ADD CONSTRAINT "campaign_recipients_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_recipients" ADD CONSTRAINT "campaign_recipients_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_recipients" ADD CONSTRAINT "campaign_recipients_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_segment_id_segments_id_fk" FOREIGN KEY ("segment_id") REFERENCES "public"."segments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_ai_learning" ADD CONSTRAINT "content_ai_learning_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_sources" ADD CONSTRAINT "content_sources_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_sources" ADD CONSTRAINT "content_sources_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_collections" ADD CONSTRAINT "creator_collections_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_item_collections" ADD CONSTRAINT "creator_item_collections_item_id_creator_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."creator_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_item_collections" ADD CONSTRAINT "creator_item_collections_collection_id_creator_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."creator_collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_items" ADD CONSTRAINT "creator_items_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_items" ADD CONSTRAINT "creator_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_interactions" ADD CONSTRAINT "crm_interactions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_interactions" ADD CONSTRAINT "crm_interactions_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_interactions" ADD CONSTRAINT "crm_interactions_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_interactions" ADD CONSTRAINT "crm_interactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_interactions" ADD CONSTRAINT "crm_interactions_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_interactions" ADD CONSTRAINT "crm_interactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_interactions" ADD CONSTRAINT "crm_interactions_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exports" ADD CONSTRAINT "exports_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exports" ADD CONSTRAINT "exports_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imports" ADD CONSTRAINT "imports_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imports" ADD CONSTRAINT "imports_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_threads" ADD CONSTRAINT "email_threads_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_steps" ADD CONSTRAINT "execution_steps_execution_id_grid_executions_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."grid_executions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_steps" ADD CONSTRAINT "execution_steps_node_id_grid_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."grid_nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_vendor_id_customers_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "galaxy_grids" ADD CONSTRAINT "galaxy_grids_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "galaxy_grids" ADD CONSTRAINT "galaxy_grids_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grid_edges" ADD CONSTRAINT "grid_edges_grid_id_galaxy_grids_id_fk" FOREIGN KEY ("grid_id") REFERENCES "public"."galaxy_grids"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grid_edges" ADD CONSTRAINT "grid_edges_source_node_id_grid_nodes_id_fk" FOREIGN KEY ("source_node_id") REFERENCES "public"."grid_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grid_edges" ADD CONSTRAINT "grid_edges_target_node_id_grid_nodes_id_fk" FOREIGN KEY ("target_node_id") REFERENCES "public"."grid_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grid_executions" ADD CONSTRAINT "grid_executions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grid_executions" ADD CONSTRAINT "grid_executions_grid_id_galaxy_grids_id_fk" FOREIGN KEY ("grid_id") REFERENCES "public"."galaxy_grids"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grid_nodes" ADD CONSTRAINT "grid_nodes_grid_id_galaxy_grids_id_fk" FOREIGN KEY ("grid_id") REFERENCES "public"."galaxy_grids"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grid_nodes" ADD CONSTRAINT "grid_nodes_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grid_versions" ADD CONSTRAINT "grid_versions_grid_id_galaxy_grids_id_fk" FOREIGN KEY ("grid_id") REFERENCES "public"."galaxy_grids"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grid_versions" ADD CONSTRAINT "grid_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox_messages" ADD CONSTRAINT "inbox_messages_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox_messages" ADD CONSTRAINT "inbox_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_collections" ADD CONSTRAINT "knowledge_collections_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_collections" ADD CONSTRAINT "knowledge_collections_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_item_tags" ADD CONSTRAINT "knowledge_item_tags_item_id_knowledge_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."knowledge_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_item_tags" ADD CONSTRAINT "knowledge_item_tags_tag_id_knowledge_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."knowledge_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_collection_id_knowledge_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."knowledge_collections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_tags" ADD CONSTRAINT "knowledge_tags_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_channels" ADD CONSTRAINT "marketing_channels_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_channels" ADD CONSTRAINT "marketing_channels_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neptune_action_history" ADD CONSTRAINT "neptune_action_history_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neptune_action_history" ADD CONSTRAINT "neptune_action_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_tokens" ADD CONSTRAINT "oauth_tokens_integration_id_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_feedback" ADD CONSTRAINT "platform_feedback_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proactive_insights" ADD CONSTRAINT "proactive_insights_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proactive_insights" ADD CONSTRAINT "proactive_insights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "segments" ADD CONSTRAINT "segments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "segments" ADD CONSTRAINT "segments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_documents" ADD CONSTRAINT "shared_documents_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_documents" ADD CONSTRAINT "shared_documents_creator_item_id_creator_items_id_fk" FOREIGN KEY ("creator_item_id") REFERENCES "public"."creator_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_documents" ADD CONSTRAINT "shared_documents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_posts" ADD CONSTRAINT "social_media_posts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_posts" ADD CONSTRAINT "social_media_posts_integration_id_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_posts" ADD CONSTRAINT "social_media_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_channel_members" ADD CONSTRAINT "team_channel_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_channel_members" ADD CONSTRAINT "team_channel_members_channel_id_team_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."team_channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_channel_members" ADD CONSTRAINT "team_channel_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_channels" ADD CONSTRAINT "team_channels_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_channels" ADD CONSTRAINT "team_channels_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_messages" ADD CONSTRAINT "team_messages_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_messages" ADD CONSTRAINT "team_messages_channel_id_team_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."team_channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_messages" ADD CONSTRAINT "team_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_ideas" ADD CONSTRAINT "topic_ideas_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_ideas" ADD CONSTRAINT "topic_ideas_resulting_post_id_blog_posts_id_fk" FOREIGN KEY ("resulting_post_id") REFERENCES "public"."blog_posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_ideas" ADD CONSTRAINT "topic_ideas_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "use_cases" ADD CONSTRAINT "use_cases_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "use_cases" ADD CONSTRAINT "use_cases_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_autonomy_preferences" ADD CONSTRAINT "user_autonomy_preferences_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_autonomy_preferences" ADD CONSTRAINT "user_autonomy_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_webhook_id_webhooks_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."webhooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_api_keys" ADD CONSTRAINT "workspace_api_keys_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_api_keys" ADD CONSTRAINT "workspace_api_keys_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_intelligence" ADD CONSTRAINT "workspace_intelligence_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_phone_numbers" ADD CONSTRAINT "workspace_phone_numbers_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_action_audit_tenant_idx" ON "agent_action_audit_log" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "agent_action_audit_team_idx" ON "agent_action_audit_log" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "agent_action_audit_agent_idx" ON "agent_action_audit_log" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "agent_action_audit_executed_at_idx" ON "agent_action_audit_log" USING btree ("executed_at");--> statement-breakpoint
CREATE INDEX "agent_action_audit_was_automatic_idx" ON "agent_action_audit_log" USING btree ("was_automatic");--> statement-breakpoint
CREATE INDEX "agent_action_audit_success_idx" ON "agent_action_audit_log" USING btree ("success");--> statement-breakpoint
CREATE INDEX "agent_action_audit_action_type_idx" ON "agent_action_audit_log" USING btree ("action_type");--> statement-breakpoint
CREATE INDEX "execution_tenant_idx" ON "agent_executions" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "execution_agent_idx" ON "agent_executions" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "execution_status_idx" ON "agent_executions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "execution_triggered_by_idx" ON "agent_executions" USING btree ("triggered_by");--> statement-breakpoint
CREATE INDEX "execution_created_at_idx" ON "agent_executions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "agent_log_tenant_timestamp_idx" ON "agent_logs" USING btree ("workspace_id","timestamp");--> statement-breakpoint
CREATE INDEX "agent_log_agent_timestamp_idx" ON "agent_logs" USING btree ("agent_id","timestamp");--> statement-breakpoint
CREATE INDEX "agent_log_success_idx" ON "agent_logs" USING btree ("success");--> statement-breakpoint
CREATE INDEX "agent_log_provider_idx" ON "agent_logs" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "agent_message_tenant_idx" ON "agent_messages" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "agent_message_from_agent_idx" ON "agent_messages" USING btree ("from_agent_id");--> statement-breakpoint
CREATE INDEX "agent_message_to_agent_idx" ON "agent_messages" USING btree ("to_agent_id");--> statement-breakpoint
CREATE INDEX "agent_message_team_idx" ON "agent_messages" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "agent_message_status_idx" ON "agent_messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "agent_message_thread_idx" ON "agent_messages" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "agent_message_created_at_idx" ON "agent_messages" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_pack_slug_idx" ON "agent_packs" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "agent_pack_category_idx" ON "agent_packs" USING btree ("category");--> statement-breakpoint
CREATE INDEX "agent_pack_published_idx" ON "agent_packs" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "agent_pending_action_tenant_idx" ON "agent_pending_actions" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "agent_pending_action_team_idx" ON "agent_pending_actions" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "agent_pending_action_agent_idx" ON "agent_pending_actions" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "agent_pending_action_status_idx" ON "agent_pending_actions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "agent_pending_action_risk_level_idx" ON "agent_pending_actions" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX "agent_pending_action_expires_at_idx" ON "agent_pending_actions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "agent_pending_action_created_at_idx" ON "agent_pending_actions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "schedule_tenant_idx" ON "agent_schedules" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "schedule_agent_idx" ON "agent_schedules" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "schedule_next_run_idx" ON "agent_schedules" USING btree ("next_run_at");--> statement-breakpoint
CREATE INDEX "agent_shared_memory_tenant_idx" ON "agent_shared_memory" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "agent_shared_memory_team_idx" ON "agent_shared_memory" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "agent_shared_memory_agent_idx" ON "agent_shared_memory" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "agent_shared_memory_tier_idx" ON "agent_shared_memory" USING btree ("memory_tier");--> statement-breakpoint
CREATE INDEX "agent_shared_memory_category_idx" ON "agent_shared_memory" USING btree ("category");--> statement-breakpoint
CREATE INDEX "agent_shared_memory_key_idx" ON "agent_shared_memory" USING btree ("key");--> statement-breakpoint
CREATE INDEX "agent_shared_memory_expires_at_idx" ON "agent_shared_memory" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "agent_shared_memory_importance_idx" ON "agent_shared_memory" USING btree ("importance");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_team_member_team_agent_idx" ON "agent_team_members" USING btree ("team_id","agent_id");--> statement-breakpoint
CREATE INDEX "agent_team_member_role_idx" ON "agent_team_members" USING btree ("role");--> statement-breakpoint
CREATE INDEX "agent_team_tenant_idx" ON "agent_teams" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "agent_team_department_idx" ON "agent_teams" USING btree ("department");--> statement-breakpoint
CREATE INDEX "agent_team_status_idx" ON "agent_teams" USING btree ("status");--> statement-breakpoint
CREATE INDEX "agent_team_coordinator_idx" ON "agent_teams" USING btree ("coordinator_agent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_template_slug_idx" ON "agent_templates" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "agent_template_category_idx" ON "agent_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "agent_template_published_idx" ON "agent_templates" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "agent_template_featured_idx" ON "agent_templates" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "agent_template_trending_idx" ON "agent_templates" USING btree ("trending_score");--> statement-breakpoint
CREATE INDEX "agent_workflow_execution_tenant_idx" ON "agent_workflow_executions" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "agent_workflow_execution_workflow_idx" ON "agent_workflow_executions" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "agent_workflow_execution_status_idx" ON "agent_workflow_executions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "agent_workflow_execution_started_at_idx" ON "agent_workflow_executions" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "agent_workflow_execution_triggered_by_idx" ON "agent_workflow_executions" USING btree ("triggered_by");--> statement-breakpoint
CREATE INDEX "agent_workflow_tenant_idx" ON "agent_workflows" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "agent_workflow_team_idx" ON "agent_workflows" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "agent_workflow_status_idx" ON "agent_workflows" USING btree ("status");--> statement-breakpoint
CREATE INDEX "agent_workflow_trigger_idx" ON "agent_workflows" USING btree ("trigger_type");--> statement-breakpoint
CREATE INDEX "agent_workflow_category_idx" ON "agent_workflows" USING btree ("category");--> statement-breakpoint
CREATE INDEX "agent_tenant_idx" ON "agents" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "agent_status_idx" ON "agents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "agent_type_idx" ON "agents" USING btree ("type");--> statement-breakpoint
CREATE INDEX "agent_created_by_idx" ON "agents" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "ai_conversation_tenant_user_idx" ON "ai_conversations" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "ai_conversation_user_idx" ON "ai_conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_conversation_last_message_idx" ON "ai_conversations" USING btree ("last_message_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_message_feedback_message_user_idx" ON "ai_message_feedback" USING btree ("message_id","user_id");--> statement-breakpoint
CREATE INDEX "ai_message_feedback_message_idx" ON "ai_message_feedback" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "ai_message_feedback_workspace_idx" ON "ai_message_feedback" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "ai_message_feedback_user_idx" ON "ai_message_feedback" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_message_feedback_type_idx" ON "ai_message_feedback" USING btree ("feedback_type");--> statement-breakpoint
CREATE INDEX "ai_message_feedback_created_at_idx" ON "ai_message_feedback" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ai_message_conversation_idx" ON "ai_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "ai_message_created_at_idx" ON "ai_messages" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_user_preferences_tenant_user_idx" ON "ai_user_preferences" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "alert_badges_workspace_idx" ON "alert_badges" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "alert_badges_status_idx" ON "alert_badges" USING btree ("status");--> statement-breakpoint
CREATE INDEX "alert_badges_type_idx" ON "alert_badges" USING btree ("type");--> statement-breakpoint
CREATE INDEX "alert_badges_created_at_idx" ON "alert_badges" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "analytics_events_user_idx" ON "analytics_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "analytics_events_type_idx" ON "analytics_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "analytics_events_page_idx" ON "analytics_events" USING btree ("page_url");--> statement-breakpoint
CREATE INDEX "analytics_events_created_at_idx" ON "analytics_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "analytics_events_session_idx" ON "analytics_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "article_analytics_workspace_idx" ON "article_analytics" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "article_analytics_post_idx" ON "article_analytics" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "article_analytics_period_idx" ON "article_analytics" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "article_sources_post_idx" ON "article_sources" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "article_sources_verified_idx" ON "article_sources" USING btree ("verified");--> statement-breakpoint
CREATE INDEX "audit_log_tenant_idx" ON "audit_logs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "audit_log_user_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_log_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_log_resource_idx" ON "audit_logs" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "automation_execution_tenant_idx" ON "automation_executions" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "automation_execution_automation_idx" ON "automation_executions" USING btree ("automation_id");--> statement-breakpoint
CREATE INDEX "automation_execution_entity_idx" ON "automation_executions" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "automation_execution_status_idx" ON "automation_executions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "automation_execution_started_at_idx" ON "automation_executions" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "automation_rule_tenant_idx" ON "automation_rules" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "automation_rule_status_idx" ON "automation_rules" USING btree ("status");--> statement-breakpoint
CREATE INDEX "automation_rule_trigger_type_idx" ON "automation_rules" USING btree ("trigger_type");--> statement-breakpoint
CREATE INDEX "automation_rule_enabled_idx" ON "automation_rules" USING btree ("is_enabled");--> statement-breakpoint
CREATE INDEX "blog_bookmarks_user_idx" ON "blog_bookmarks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "blog_bookmarks_post_idx" ON "blog_bookmarks" USING btree ("post_id");--> statement-breakpoint
CREATE UNIQUE INDEX "blog_bookmarks_unique_idx" ON "blog_bookmarks" USING btree ("user_id","post_id");--> statement-breakpoint
CREATE INDEX "blog_categories_slug_idx" ON "blog_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "blog_categories_sort_order_idx" ON "blog_categories" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "blog_collection_posts_collection_idx" ON "blog_collection_posts" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "blog_collection_posts_post_idx" ON "blog_collection_posts" USING btree ("post_id");--> statement-breakpoint
CREATE UNIQUE INDEX "blog_collection_posts_unique_idx" ON "blog_collection_posts" USING btree ("collection_id","post_id");--> statement-breakpoint
CREATE INDEX "blog_collections_slug_idx" ON "blog_collections" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "blog_collections_featured_idx" ON "blog_collections" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "blog_post_tags_post_idx" ON "blog_post_tags" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "blog_post_tags_tag_idx" ON "blog_post_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "blog_post_tags_unique_idx" ON "blog_post_tags" USING btree ("post_id","tag_id");--> statement-breakpoint
CREATE INDEX "blog_posts_slug_idx" ON "blog_posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "blog_posts_category_idx" ON "blog_posts" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "blog_posts_status_idx" ON "blog_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "blog_posts_published_at_idx" ON "blog_posts" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "blog_posts_featured_idx" ON "blog_posts" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "blog_posts_author_idx" ON "blog_posts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "blog_posts_layout_template_idx" ON "blog_posts" USING btree ("layout_template");--> statement-breakpoint
CREATE INDEX "blog_reactions_user_idx" ON "blog_reactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "blog_reactions_post_idx" ON "blog_reactions" USING btree ("post_id");--> statement-breakpoint
CREATE UNIQUE INDEX "blog_reactions_unique_idx" ON "blog_reactions" USING btree ("user_id","post_id");--> statement-breakpoint
CREATE INDEX "blog_reading_progress_user_idx" ON "blog_reading_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "blog_reading_progress_post_idx" ON "blog_reading_progress" USING btree ("post_id");--> statement-breakpoint
CREATE UNIQUE INDEX "blog_reading_progress_unique_idx" ON "blog_reading_progress" USING btree ("user_id","post_id");--> statement-breakpoint
CREATE INDEX "blog_tags_slug_idx" ON "blog_tags" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "blog_user_preferences_user_idx" ON "blog_user_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "blog_voice_profiles_workspace_idx" ON "blog_voice_profiles" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "brainstorm_sessions_workspace_idx" ON "brainstorm_sessions" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "brainstorm_sessions_user_idx" ON "brainstorm_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "calendar_event_tenant_idx" ON "calendar_events" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "calendar_event_start_time_idx" ON "calendar_events" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "calendar_event_created_by_idx" ON "calendar_events" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "campaign_recipient_tenant_idx" ON "campaign_recipients" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "campaign_recipient_campaign_idx" ON "campaign_recipients" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaign_recipient_contact_idx" ON "campaign_recipients" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "campaign_recipient_prospect_idx" ON "campaign_recipients" USING btree ("prospect_id");--> statement-breakpoint
CREATE INDEX "campaign_recipient_email_idx" ON "campaign_recipients" USING btree ("email");--> statement-breakpoint
CREATE INDEX "campaign_recipient_status_idx" ON "campaign_recipients" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_recipient_unique_idx" ON "campaign_recipients" USING btree ("campaign_id","email");--> statement-breakpoint
CREATE INDEX "campaign_tenant_idx" ON "campaigns" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "campaign_status_idx" ON "campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "campaign_type_idx" ON "campaigns" USING btree ("type");--> statement-breakpoint
CREATE INDEX "chat_message_tenant_idx" ON "chat_messages" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "chat_message_sender_idx" ON "chat_messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "chat_message_recipient_idx" ON "chat_messages" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "chat_message_group_idx" ON "chat_messages" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "chat_message_created_at_idx" ON "chat_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "contact_tenant_idx" ON "contacts" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "contact_email_idx" ON "contacts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "contact_customer_idx" ON "contacts" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "contact_assigned_to_idx" ON "contacts" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "content_ai_learning_workspace_idx" ON "content_ai_learning" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "content_ai_learning_type_idx" ON "content_ai_learning" USING btree ("learning_type");--> statement-breakpoint
CREATE INDEX "content_sources_workspace_idx" ON "content_sources" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "content_sources_type_idx" ON "content_sources" USING btree ("type");--> statement-breakpoint
CREATE INDEX "content_sources_status_idx" ON "content_sources" USING btree ("status");--> statement-breakpoint
CREATE INDEX "conversation_message_tenant_idx" ON "conversation_messages" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "conversation_message_conversation_idx" ON "conversation_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "conversation_message_sender_idx" ON "conversation_messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "conversation_message_created_at_idx" ON "conversation_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "conversation_message_external_id_idx" ON "conversation_messages" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "conversation_participant_tenant_idx" ON "conversation_participants" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "conversation_participant_conversation_idx" ON "conversation_participants" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "conversation_participant_contact_idx" ON "conversation_participants" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "conversation_participant_prospect_idx" ON "conversation_participants" USING btree ("prospect_id");--> statement-breakpoint
CREATE INDEX "conversation_participant_customer_idx" ON "conversation_participants" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "conversation_participant_email_idx" ON "conversation_participants" USING btree ("email");--> statement-breakpoint
CREATE INDEX "conversation_participant_phone_idx" ON "conversation_participants" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "conversation_tenant_idx" ON "conversations" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "conversation_channel_idx" ON "conversations" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "conversation_status_idx" ON "conversations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "conversation_assigned_to_idx" ON "conversations" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "conversation_last_message_idx" ON "conversations" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "conversation_external_id_idx" ON "conversations" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "creator_collections_workspace_idx" ON "creator_collections" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "creator_collections_name_idx" ON "creator_collections" USING btree ("name");--> statement-breakpoint
CREATE INDEX "creator_item_collections_item_idx" ON "creator_item_collections" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "creator_item_collections_collection_idx" ON "creator_item_collections" USING btree ("collection_id");--> statement-breakpoint
CREATE UNIQUE INDEX "creator_item_collections_unique_idx" ON "creator_item_collections" USING btree ("item_id","collection_id");--> statement-breakpoint
CREATE INDEX "creator_items_workspace_idx" ON "creator_items" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "creator_items_user_idx" ON "creator_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "creator_items_type_idx" ON "creator_items" USING btree ("type");--> statement-breakpoint
CREATE INDEX "creator_items_starred_idx" ON "creator_items" USING btree ("starred");--> statement-breakpoint
CREATE INDEX "creator_items_created_at_idx" ON "creator_items" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "creator_templates_type_idx" ON "creator_templates" USING btree ("type");--> statement-breakpoint
CREATE INDEX "creator_templates_category_idx" ON "creator_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "creator_templates_premium_idx" ON "creator_templates" USING btree ("is_premium");--> statement-breakpoint
CREATE INDEX "crm_interaction_tenant_idx" ON "crm_interactions" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "crm_interaction_type_idx" ON "crm_interactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "crm_interaction_contact_idx" ON "crm_interactions" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "crm_interaction_prospect_idx" ON "crm_interactions" USING btree ("prospect_id");--> statement-breakpoint
CREATE INDEX "crm_interaction_customer_idx" ON "crm_interactions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "crm_interaction_created_by_idx" ON "crm_interactions" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "crm_interaction_occurred_at_idx" ON "crm_interactions" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "crm_interaction_follow_up_idx" ON "crm_interactions" USING btree ("follow_up_date");--> statement-breakpoint
CREATE INDEX "customer_tenant_idx" ON "customers" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "customer_status_idx" ON "customers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "customer_assigned_to_idx" ON "customers" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "customer_email_idx" ON "customers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "export_tenant_idx" ON "exports" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "export_status_idx" ON "exports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "export_requested_by_idx" ON "exports" USING btree ("requested_by");--> statement-breakpoint
CREATE INDEX "import_tenant_idx" ON "imports" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "import_status_idx" ON "imports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "import_requested_by_idx" ON "imports" USING btree ("requested_by");--> statement-breakpoint
CREATE INDEX "deal_tenant_idx" ON "deals" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "deal_stage_idx" ON "deals" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "deal_owner_idx" ON "deals" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "deal_customer_idx" ON "deals" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "deal_contact_idx" ON "deals" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "deal_prospect_idx" ON "deals" USING btree ("prospect_id");--> statement-breakpoint
CREATE INDEX "deal_expected_close_idx" ON "deals" USING btree ("expected_close_date");--> statement-breakpoint
CREATE INDEX "deal_value_idx" ON "deals" USING btree ("value");--> statement-breakpoint
CREATE INDEX "deal_probability_idx" ON "deals" USING btree ("probability");--> statement-breakpoint
CREATE INDEX "deal_last_activity_idx" ON "deals" USING btree ("last_activity_at");--> statement-breakpoint
CREATE INDEX "email_thread_tenant_idx" ON "email_threads" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "email_thread_folder_idx" ON "email_threads" USING btree ("folder");--> statement-breakpoint
CREATE INDEX "email_thread_last_message_idx" ON "email_threads" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "execution_step_execution_step_idx" ON "execution_steps" USING btree ("execution_id","step_index");--> statement-breakpoint
CREATE INDEX "execution_step_node_idx" ON "execution_steps" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX "execution_step_status_idx" ON "execution_steps" USING btree ("status");--> statement-breakpoint
CREATE INDEX "expense_tenant_idx" ON "expenses" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "expense_category_idx" ON "expenses" USING btree ("category");--> statement-breakpoint
CREATE INDEX "expense_status_idx" ON "expenses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "expense_vendor_idx" ON "expenses" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "expense_project_idx" ON "expenses" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "expense_date_idx" ON "expenses" USING btree ("expense_date");--> statement-breakpoint
CREATE INDEX "expense_submitted_by_idx" ON "expenses" USING btree ("submitted_by");--> statement-breakpoint
CREATE INDEX "expense_external_idx" ON "expenses" USING btree ("external_source","external_id");--> statement-breakpoint
CREATE INDEX "galaxy_grid_tenant_idx" ON "galaxy_grids" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "galaxy_grid_status_idx" ON "galaxy_grids" USING btree ("status");--> statement-breakpoint
CREATE INDEX "galaxy_grid_created_by_idx" ON "galaxy_grids" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "galaxy_grid_template_idx" ON "galaxy_grids" USING btree ("is_template","template_category");--> statement-breakpoint
CREATE INDEX "galaxy_grid_published_idx" ON "galaxy_grids" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "grid_edge_grid_idx" ON "grid_edges" USING btree ("grid_id");--> statement-breakpoint
CREATE INDEX "grid_edge_source_idx" ON "grid_edges" USING btree ("source_node_id");--> statement-breakpoint
CREATE INDEX "grid_edge_target_idx" ON "grid_edges" USING btree ("target_node_id");--> statement-breakpoint
CREATE INDEX "grid_edge_type_idx" ON "grid_edges" USING btree ("edge_type");--> statement-breakpoint
CREATE INDEX "grid_execution_tenant_idx" ON "grid_executions" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "grid_execution_grid_idx" ON "grid_executions" USING btree ("grid_id");--> statement-breakpoint
CREATE INDEX "grid_execution_status_idx" ON "grid_executions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "grid_execution_started_at_idx" ON "grid_executions" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "grid_execution_created_at_idx" ON "grid_executions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "grid_node_grid_idx" ON "grid_nodes" USING btree ("grid_id");--> statement-breakpoint
CREATE INDEX "grid_node_type_idx" ON "grid_nodes" USING btree ("node_type");--> statement-breakpoint
CREATE INDEX "grid_node_agent_idx" ON "grid_nodes" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "grid_node_status_idx" ON "grid_nodes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "grid_template_category_idx" ON "grid_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "grid_template_featured_idx" ON "grid_templates" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "grid_template_uses_idx" ON "grid_templates" USING btree ("uses");--> statement-breakpoint
CREATE UNIQUE INDEX "grid_version_grid_version_idx" ON "grid_versions" USING btree ("grid_id","version");--> statement-breakpoint
CREATE INDEX "grid_version_created_by_idx" ON "grid_versions" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "grid_version_created_at_idx" ON "grid_versions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "inbox_message_tenant_idx" ON "inbox_messages" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "inbox_message_status_idx" ON "inbox_messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "inbox_message_thread_idx" ON "inbox_messages" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "integrations_workspace_idx" ON "integrations" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "integrations_user_idx" ON "integrations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "integrations_provider_idx" ON "integrations" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "integrations_status_idx" ON "integrations" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "integrations_provider_account_unique" ON "integrations" USING btree ("workspace_id","provider","provider_account_id");--> statement-breakpoint
CREATE INDEX "invoice_tenant_idx" ON "invoices" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "invoice_status_idx" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invoice_customer_idx" ON "invoices" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_number_idx" ON "invoices" USING btree ("workspace_id","invoice_number");--> statement-breakpoint
CREATE INDEX "knowledge_collection_tenant_idx" ON "knowledge_collections" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_item_tag_idx" ON "knowledge_item_tags" USING btree ("item_id","tag_id");--> statement-breakpoint
CREATE INDEX "knowledge_item_tenant_idx" ON "knowledge_items" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "knowledge_item_status_idx" ON "knowledge_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "knowledge_item_collection_idx" ON "knowledge_items" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "knowledge_item_type_idx" ON "knowledge_items" USING btree ("type");--> statement-breakpoint
CREATE INDEX "knowledge_item_created_by_idx" ON "knowledge_items" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "knowledge_item_favorite_idx" ON "knowledge_items" USING btree ("is_favorite");--> statement-breakpoint
CREATE INDEX "knowledge_item_created_at_idx" ON "knowledge_items" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_tag_tenant_name_idx" ON "knowledge_tags" USING btree ("workspace_id","name");--> statement-breakpoint
CREATE INDEX "marketing_channel_tenant_idx" ON "marketing_channels" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "marketing_channel_type_idx" ON "marketing_channels" USING btree ("type");--> statement-breakpoint
CREATE INDEX "marketing_channel_status_idx" ON "marketing_channels" USING btree ("status");--> statement-breakpoint
CREATE INDEX "neptune_action_history_workspace_idx" ON "neptune_action_history" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "neptune_action_history_user_idx" ON "neptune_action_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "neptune_action_history_tool_idx" ON "neptune_action_history" USING btree ("tool_name");--> statement-breakpoint
CREATE INDEX "neptune_action_history_created_at_idx" ON "neptune_action_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "newsletter_subscribers_email_idx" ON "newsletter_subscribers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "newsletter_subscribers_user_idx" ON "newsletter_subscribers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "newsletter_subscribers_active_idx" ON "newsletter_subscribers" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "notification_tenant_user_idx" ON "notifications" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "notification_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_type_idx" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notification_is_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "oauth_tokens_integration_idx" ON "oauth_tokens" USING btree ("integration_id");--> statement-breakpoint
CREATE INDEX "oauth_tokens_expires_at_idx" ON "oauth_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "platform_feedback_user_idx" ON "platform_feedback" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "platform_feedback_type_idx" ON "platform_feedback" USING btree ("type");--> statement-breakpoint
CREATE INDEX "platform_feedback_status_idx" ON "platform_feedback" USING btree ("status");--> statement-breakpoint
CREATE INDEX "platform_feedback_sentiment_idx" ON "platform_feedback" USING btree ("sentiment");--> statement-breakpoint
CREATE INDEX "platform_feedback_created_at_idx" ON "platform_feedback" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "platform_feedback_feature_area_idx" ON "platform_feedback" USING btree ("feature_area");--> statement-breakpoint
CREATE INDEX "proactive_insights_workspace_idx" ON "proactive_insights" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "proactive_insights_user_idx" ON "proactive_insights" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "proactive_insights_type_idx" ON "proactive_insights" USING btree ("type");--> statement-breakpoint
CREATE INDEX "proactive_insights_priority_idx" ON "proactive_insights" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "proactive_insights_created_at_idx" ON "proactive_insights" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "project_tenant_idx" ON "projects" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "project_status_idx" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "project_customer_idx" ON "projects" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "project_manager_idx" ON "projects" USING btree ("manager_id");--> statement-breakpoint
CREATE INDEX "prospect_tenant_idx" ON "prospects" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "prospect_stage_idx" ON "prospects" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "prospect_assigned_to_idx" ON "prospects" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "prospect_email_idx" ON "prospects" USING btree ("email");--> statement-breakpoint
CREATE INDEX "segment_tenant_idx" ON "segments" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "segment_active_idx" ON "segments" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "shared_document_token_idx" ON "shared_documents" USING btree ("token");--> statement-breakpoint
CREATE INDEX "shared_document_creator_item_idx" ON "shared_documents" USING btree ("creator_item_id");--> statement-breakpoint
CREATE INDEX "shared_document_tenant_idx" ON "shared_documents" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "shared_document_expiry_idx" ON "shared_documents" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "social_media_posts_workspace_idx" ON "social_media_posts" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "social_media_posts_integration_idx" ON "social_media_posts" USING btree ("integration_id");--> statement-breakpoint
CREATE INDEX "social_media_posts_platform_idx" ON "social_media_posts" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "social_media_posts_status_idx" ON "social_media_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "social_media_posts_scheduled_for_idx" ON "social_media_posts" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "task_tenant_idx" ON "tasks" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "task_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "task_priority_idx" ON "tasks" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "task_assigned_to_idx" ON "tasks" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "task_project_idx" ON "tasks" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "task_due_date_idx" ON "tasks" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "team_channel_member_tenant_idx" ON "team_channel_members" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "team_channel_member_channel_idx" ON "team_channel_members" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "team_channel_member_user_idx" ON "team_channel_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "team_channel_member_unique_idx" ON "team_channel_members" USING btree ("channel_id","user_id");--> statement-breakpoint
CREATE INDEX "team_channel_tenant_idx" ON "team_channels" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "team_channel_type_idx" ON "team_channels" USING btree ("type");--> statement-breakpoint
CREATE INDEX "team_channel_dm_idx" ON "team_channels" USING btree ("dm_participant_ids");--> statement-breakpoint
CREATE INDEX "team_message_tenant_idx" ON "team_messages" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "team_message_channel_idx" ON "team_messages" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "team_message_sender_idx" ON "team_messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "team_message_created_at_idx" ON "team_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "topic_ideas_workspace_idx" ON "topic_ideas" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "topic_ideas_status_idx" ON "topic_ideas" USING btree ("status");--> statement-breakpoint
CREATE INDEX "topic_ideas_generated_by_idx" ON "topic_ideas" USING btree ("generated_by");--> statement-breakpoint
CREATE INDEX "topic_ideas_category_idx" ON "topic_ideas" USING btree ("category");--> statement-breakpoint
CREATE INDEX "topic_ideas_priority_idx" ON "topic_ideas" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "topic_ideas_hit_list_position_idx" ON "topic_ideas" USING btree ("hit_list_position");--> statement-breakpoint
CREATE INDEX "topic_ideas_priority_score_idx" ON "topic_ideas" USING btree ("priority_score");--> statement-breakpoint
CREATE INDEX "use_cases_workspace_idx" ON "use_cases" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "use_cases_category_idx" ON "use_cases" USING btree ("category");--> statement-breakpoint
CREATE INDEX "use_cases_status_idx" ON "use_cases" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "user_autonomy_preferences_tenant_user_action_idx" ON "user_autonomy_preferences" USING btree ("workspace_id","user_id","tool_name");--> statement-breakpoint
CREATE INDEX "user_autonomy_preferences_workspace_idx" ON "user_autonomy_preferences" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "user_autonomy_preferences_user_idx" ON "user_autonomy_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_clerk_user_idx" ON "users" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "webhook_delivery_webhook_idx" ON "webhook_deliveries" USING btree ("webhook_id");--> statement-breakpoint
CREATE INDEX "webhook_delivery_event_idx" ON "webhook_deliveries" USING btree ("event");--> statement-breakpoint
CREATE INDEX "webhook_delivery_created_at_idx" ON "webhook_deliveries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "webhook_tenant_idx" ON "webhooks" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "webhook_active_idx" ON "webhooks" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "api_key_tenant_provider_idx" ON "workspace_api_keys" USING btree ("workspace_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_intelligence_workspace_idx" ON "workspace_intelligence" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_member_unique_idx" ON "workspace_members" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "workspace_member_tenant_idx" ON "workspace_members" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_phone_workspace_idx" ON "workspace_phone_numbers" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_phone_number_idx" ON "workspace_phone_numbers" USING btree ("phone_number");--> statement-breakpoint
CREATE INDEX "workspace_phone_status_idx" ON "workspace_phone_numbers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "workspace_phone_type_idx" ON "workspace_phone_numbers" USING btree ("number_type");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_slug_idx" ON "workspaces" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "workspace_clerk_org_idx" ON "workspaces" USING btree ("clerk_organization_id");