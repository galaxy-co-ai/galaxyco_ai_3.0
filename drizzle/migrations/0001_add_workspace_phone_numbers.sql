-- Migration: Add workspace_phone_numbers table for SignalWire integration
-- Date: 2025-12-11
-- Description: Each workspace gets dedicated phone number(s) for SMS/WhatsApp/Voice

CREATE TABLE IF NOT EXISTS "workspace_phone_numbers" (
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

-- Add foreign key constraint
ALTER TABLE "workspace_phone_numbers" ADD CONSTRAINT "workspace_phone_numbers_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;

-- Create indexes
CREATE INDEX IF NOT EXISTS "workspace_phone_workspace_idx" ON "workspace_phone_numbers" USING btree ("workspace_id");
CREATE UNIQUE INDEX IF NOT EXISTS "workspace_phone_number_idx" ON "workspace_phone_numbers" USING btree ("phone_number");
CREATE INDEX IF NOT EXISTS "workspace_phone_status_idx" ON "workspace_phone_numbers" USING btree ("status");
CREATE INDEX IF NOT EXISTS "workspace_phone_type_idx" ON "workspace_phone_numbers" USING btree ("number_type");
