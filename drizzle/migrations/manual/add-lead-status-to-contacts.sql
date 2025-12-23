-- Migration: Add lead_status to contacts table
-- Date: 2025-12-17
-- Purpose: Enable hot leads tracking for CRM dashboard

-- Create lead_status enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE lead_status AS ENUM ('cold', 'warm', 'hot', 'closed_won', 'closed_lost');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add lead_status column to contacts table
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS lead_status lead_status;

-- Add index for performance (filtering by hot leads)
CREATE INDEX IF NOT EXISTS contact_lead_status_idx ON contacts(lead_status);

-- Add composite index for tenant + lead_status queries
CREATE INDEX IF NOT EXISTS contact_tenant_lead_status_idx ON contacts(workspace_id, lead_status);

COMMENT ON COLUMN contacts.lead_status IS 'Lead temperature tracking: cold, warm, hot, closed_won, closed_lost';
