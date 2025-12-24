CREATE TABLE "neptune_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"notifications" jsonb DEFAULT '{"emailDigest":true,"slackAlerts":false,"inAppNotifications":true,"dailySummary":true}'::jsonb NOT NULL,
	"behavior" jsonb DEFAULT '{"autoSuggest":true,"proactiveInsights":true,"learningEnabled":true,"responseLength":"balanced"}'::jsonb NOT NULL,
	"privacy" jsonb DEFAULT '{"shareAnalytics":true,"dataRetentionDays":90,"anonymizeData":false}'::jsonb NOT NULL,
	"integrations" jsonb DEFAULT '{"connectedApps":0,"apiEnabled":true,"webhooksEnabled":false}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "neptune_settings_workspace_id_unique" UNIQUE("workspace_id")
);
--> statement-breakpoint
ALTER TABLE "neptune_settings" ADD CONSTRAINT "neptune_settings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "neptune_settings_tenant_idx" ON "neptune_settings" USING btree ("workspace_id");