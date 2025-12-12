CREATE TYPE "public"."todo_hq_epic_status" AS ENUM('not_started', 'in_progress', 'completed', 'on_hold');--> statement-breakpoint
CREATE TABLE "todo_hq_epics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "todo_hq_epic_status" DEFAULT 'not_started' NOT NULL,
	"target_completion_percent" integer DEFAULT 100 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"tags" text[] DEFAULT '{}',
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "todo_hq_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"epic_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "task_status" DEFAULT 'todo' NOT NULL,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"assigned_to" uuid,
	"due_date" timestamp,
	"completed_at" timestamp,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"tags" text[] DEFAULT '{}',
	"notes" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "todo_hq_epics" ADD CONSTRAINT "todo_hq_epics_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo_hq_epics" ADD CONSTRAINT "todo_hq_epics_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo_hq_tasks" ADD CONSTRAINT "todo_hq_tasks_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo_hq_tasks" ADD CONSTRAINT "todo_hq_tasks_epic_id_todo_hq_epics_id_fk" FOREIGN KEY ("epic_id") REFERENCES "public"."todo_hq_epics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo_hq_tasks" ADD CONSTRAINT "todo_hq_tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo_hq_tasks" ADD CONSTRAINT "todo_hq_tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "todo_hq_epic_tenant_idx" ON "todo_hq_epics" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "todo_hq_epic_status_idx" ON "todo_hq_epics" USING btree ("status");--> statement-breakpoint
CREATE INDEX "todo_hq_epic_sort_order_idx" ON "todo_hq_epics" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "todo_hq_task_tenant_idx" ON "todo_hq_tasks" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "todo_hq_task_epic_idx" ON "todo_hq_tasks" USING btree ("epic_id");--> statement-breakpoint
CREATE INDEX "todo_hq_task_status_idx" ON "todo_hq_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "todo_hq_task_priority_idx" ON "todo_hq_tasks" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "todo_hq_task_assigned_to_idx" ON "todo_hq_tasks" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "todo_hq_task_sort_order_idx" ON "todo_hq_tasks" USING btree ("sort_order");