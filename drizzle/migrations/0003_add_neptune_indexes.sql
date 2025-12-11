-- Neptune AI Performance Optimization Indexes
-- Phase 1.2: Query Optimization
-- 
-- Purpose: Speed up context gathering queries for Neptune AI assistant
-- Expected Impact: 40% faster context gathering
--
-- IMPORTANT: These indexes use CONCURRENTLY to avoid locking during creation
-- Run on staging first and monitor query performance

-- Index for AI messages - speeds up conversation history fetches
-- Query pattern: SELECT * FROM ai_messages WHERE workspace_id = ? AND user_id = ? ORDER BY created_at DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_messages_workspace_user_created 
ON ai_messages (workspace_id, user_id, created_at DESC);

-- Index for AI conversations - speeds up recent conversation lookups
-- Query pattern: SELECT * FROM ai_conversations WHERE workspace_id = ? AND user_id = ? ORDER BY last_message_at DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_conversations_workspace_user_updated
ON ai_conversations (workspace_id, user_id, last_message_at DESC);

-- Index for knowledge items - speeds up RAG document lookups
-- Query pattern: SELECT * FROM knowledge_items WHERE workspace_id = ? AND status = 'ready'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_items_workspace_status
ON knowledge_items (workspace_id, status) WHERE status = 'ready';

-- Index for prospects (CRM) - speeds up pipeline queries
-- Query pattern: SELECT * FROM prospects WHERE workspace_id = ? ORDER BY created_at DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prospects_workspace_created
ON prospects (workspace_id, created_at DESC);

-- Index for tasks - speeds up pending task queries
-- Query pattern: SELECT * FROM tasks WHERE workspace_id = ? AND status = 'todo' ORDER BY priority, due_date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_workspace_status_priority
ON tasks (workspace_id, status, priority DESC, due_date);

-- Index for calendar events - speeds up upcoming event queries
-- Query pattern: SELECT * FROM calendar_events WHERE workspace_id = ? AND start_time >= NOW()
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calendar_events_workspace_start
ON calendar_events (workspace_id, start_time);

-- Index for campaigns - speeds up active campaign lookups
-- Query pattern: SELECT * FROM campaigns WHERE workspace_id = ? AND status = 'active'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_workspace_status
ON campaigns (workspace_id, status);

-- Index for proactive insights - speeds up insight fetches
-- Query pattern: SELECT * FROM proactive_insights WHERE workspace_id = ? AND dismissed_at IS NULL
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proactive_insights_workspace_active
ON proactive_insights (workspace_id, created_at DESC) WHERE dismissed_at IS NULL;
