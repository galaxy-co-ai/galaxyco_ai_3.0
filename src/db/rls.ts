/**
 * Row-Level Security (RLS) Implementation
 * 
 * Provides database-level tenant isolation for multi-tenant security.
 * RLS policies ensure that even if application code forgets to filter by workspace_id,
 * the database will enforce tenant boundaries.
 * 
 * SECURITY RULE (4kR94Z3XhqK4C54vwDDwnq):
 * ALL queries MUST respect workspace_id boundaries. RLS provides defense-in-depth.
 */

import { db } from './db';
import { sql } from 'drizzle-orm';

/**
 * Set the current workspace context for this database session.
 * Must be called at the start of every request that accesses tenant data.
 * 
 * @param workspaceId - The UUID of the current workspace
 * 
 * Usage:
 * ```typescript
 * await setWorkspaceContext(user.workspaceId);
 * // Now all RLS-protected queries will automatically filter by this workspace
 * const agents = await db.select().from(agents); // Automatically filtered!
 * ```
 */
export async function setWorkspaceContext(workspaceId: string): Promise<void> {
  await db.execute(sql`
    SET LOCAL app.current_workspace_id = ${workspaceId};
  `);
}

/**
 * Clear the workspace context (useful in development/testing)
 */
export async function clearWorkspaceContext(): Promise<void> {
  await db.execute(sql`
    RESET app.current_workspace_id;
  `);
}

/**
 * Get the current workspace context
 */
export async function getWorkspaceContext(): Promise<string | null> {
  const result = await db.execute(sql`
    SELECT current_setting('app.current_workspace_id', true) as workspace_id;
  `);
  
  return result.rows[0]?.workspace_id || null;
}

/**
 * Middleware helper: Execute a function with workspace context
 * 
 * Usage:
 * ```typescript
 * import { withWorkspaceContext } from '@/db/rls';
 * 
 * const result = await withWorkspaceContext(workspaceId, async () => {
 *   return await db.query.agents.findMany();
 * });
 * ```
 */
export async function withWorkspaceContext<T>(
  workspaceId: string,
  fn: () => Promise<T>
): Promise<T> {
  await setWorkspaceContext(workspaceId);
  try {
    return await fn();
  } finally {
    await clearWorkspaceContext();
  }
}

// ============================================================================
// RLS Policy SQL Statements
// ============================================================================
// 
// Run these statements in your database to enable RLS.
// You can run them via Neon dashboard SQL editor or via migration.
// 
// IMPORTANT: Test thoroughly before deploying to production!
// ============================================================================

/**
 * SQL to enable RLS on all multi-tenant tables
 * 
 * Usage:
 *   1. Run via Neon dashboard SQL editor
 *   2. Or create a migration file
 *   3. Or run via db.execute() in a script
 */
export const RLS_ENABLE_POLICIES = sql`
-- Enable RLS on core tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_shared_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_pending_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_action_audit_log ENABLE ROW LEVEL SECURITY;

-- Knowledge base
ALTER TABLE knowledge_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_item_tags ENABLE ROW LEVEL SECURITY;

-- AI conversations
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_message_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE neptune_action_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE proactive_insights ENABLE ROW LEVEL SECURITY;

-- CRM
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Finance
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Marketing
ALTER TABLE marketing_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;

-- Content Cockpit
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_use_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE hit_list_articles ENABLE ROW LEVEL SECURITY;

-- Communications
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Platform
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;

-- Workflows
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
`;

/**
 * SQL to create RLS policies for tenant isolation
 * 
 * This creates a single policy per table that filters by workspace_id.
 * The policy uses the session variable set by setWorkspaceContext().
 */
export const RLS_CREATE_POLICIES = sql`
-- Create a reusable function to get current workspace
CREATE OR REPLACE FUNCTION get_current_workspace_id() 
RETURNS uuid 
LANGUAGE sql 
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_workspace_id', true), '')::uuid;
$$;

-- Example policies (repeat pattern for all tables)
-- Agents table
DROP POLICY IF EXISTS tenant_isolation_policy ON agents;
CREATE POLICY tenant_isolation_policy ON agents
  USING (workspace_id = get_current_workspace_id());

-- Agent logs table
DROP POLICY IF EXISTS tenant_isolation_policy ON agent_logs;
CREATE POLICY tenant_isolation_policy ON agent_logs
  USING (workspace_id = get_current_workspace_id());

-- Add similar policies for all other tables...
-- (See full SQL in migration file)
`;

/**
 * Disable RLS (for emergency access or system maintenance)
 * 
 * WARNING: Only use this in non-production environments or for system-level operations!
 */
export const RLS_DISABLE_POLICIES = sql`
ALTER TABLE agents DISABLE ROW LEVEL SECURITY;
-- ... (repeat for all tables)
`;

/**
 * Check if RLS is enabled on a table
 */
export async function isRLSEnabled(tableName: string): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT relrowsecurity 
    FROM pg_class 
    WHERE relname = ${tableName};
  `);
  
  return result.rows[0]?.relrowsecurity === true;
}

/**
 * Get all tables with RLS enabled
 */
export async function getRLSEnabledTables(): Promise<string[]> {
  const result = await db.execute(sql`
    SELECT relname as table_name
    FROM pg_class
    WHERE relrowsecurity = true
      AND relkind = 'r'
      AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
  `);
  
  return result.rows.map((row: any) => row.table_name);
}
