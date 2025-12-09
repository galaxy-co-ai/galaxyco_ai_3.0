/**
 * GalaxyCo.ai Database Schema
 *
 * MULTI-TENANT SECURITY RULE (4kR94Z3XhqK4C54vwDDwnq):
 * =====================================================
 * ALL queries MUST include tenant_id filter in WHERE clauses
 * NEVER expose data across tenant boundaries
 * Use row-level security policies where applicable
 * Validate tenant_id matches authenticated user's tenant
 * Log any cross-tenant data access attempts as security incidents
 *
 * This schema implements strict multi-tenancy with:
 * - tenant_id on every table
 * - Workspace-based tenant isolation
 * - Role-based access control (RBAC)
 * - Audit timestamps on all records
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  integer,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = pgEnum('user_role', ['owner', 'admin', 'member', 'viewer']);
export const agentTypeEnum = pgEnum('agent_type', [
  'scope',
  'call',
  'email',
  'note',
  'task',
  'roadmap',
  'content',
  'custom',
  'browser',
  'cross-app',
  'knowledge',
  'sales',
  'trending',
  'research',
  'meeting',
  'code',
  'data',
  'security',
]);
export const knowledgeItemTypeEnum = pgEnum('knowledge_item_type', [
  'document',
  'url',
  'image',
  'text',
]);
export const knowledgeItemStatusEnum = pgEnum('knowledge_item_status', [
  'processing',
  'ready',
  'failed',
]);
export const agentStatusEnum = pgEnum('agent_status', ['draft', 'active', 'paused', 'archived']);
export const executionStatusEnum = pgEnum('execution_status', [
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
]);
export const subscriptionTierEnum = pgEnum('subscription_tier', [
  'free',
  'starter',
  'professional',
  'enterprise',
]);

// Galaxy Studio enums
export const gridStatusEnum = pgEnum('grid_status', ['draft', 'published', 'archived']);

export const gridNodeTypeEnum = pgEnum('grid_node_type', [
  'trigger',
  'action',
  'condition',
  'loop',
  'ai',
  'webhook',
  'delay',
  'transform',
  'filter',
  'aggregate',
  'branch',
  'merge',
  'api',
  'database',
  'email',
  'notification',
  'integration',
  'custom',
]);

export const gridNodeStatusEnum = pgEnum('grid_node_status', [
  'idle',
  'pending',
  'running',
  'success',
  'error',
  'skipped',
]);

export const gridEdgeTypeEnum = pgEnum('grid_edge_type', [
  'default',
  'conditional',
  'loop',
  'error',
]);

export const gridExecutionStatusEnum = pgEnum('grid_execution_status', [
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
]);

// CRM & Business enums
export const customerStatusEnum = pgEnum('customer_status', [
  'lead',
  'active',
  'inactive',
  'churned',
]);
export const projectStatusEnum = pgEnum('project_status', [
  'planning',
  'in_progress',
  'on_hold',
  'completed',
  'cancelled',
]);
export const taskStatusEnum = pgEnum('task_status', ['todo', 'in_progress', 'done', 'cancelled']);
export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high', 'urgent']);
export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft',
  'sent',
  'paid',
  'overdue',
  'cancelled',
]);
export const campaignStatusEnum = pgEnum('campaign_status', [
  'draft',
  'scheduled',
  'active',
  'paused',
  'completed',
]);

// Marketing channel enums
export const marketingChannelTypeEnum = pgEnum('marketing_channel_type', [
  'email',
  'social',
  'ads',
  'content',
  'seo',
  'affiliate',
]);
export const marketingChannelStatusEnum = pgEnum('marketing_channel_status', [
  'active',
  'paused',
  'archived',
]);

export const prospectStageEnum = pgEnum('prospect_stage', [
  'new',
  'contacted',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost',
]);

// Communication enums
export const inboxChannelEnum = pgEnum('inbox_channel', [
  'email',
  'chat',
  'notification',
  'comment',
  'mention',
]);
export const inboxStatusEnum = pgEnum('inbox_status', ['unread', 'read', 'archived']);
export const conversationChannelEnum = pgEnum('conversation_channel', [
  'email',
  'sms',
  'call',
  'whatsapp',
  'social',
  'live_chat',
]);
export const conversationStatusEnum = pgEnum('conversation_status', [
  'active',
  'archived',
  'closed',
  'spam',
]);
export const notificationTypeEnum = pgEnum('notification_type', [
  'info',
  'success',
  'warning',
  'error',
  'mention',
  'assignment',
  'reminder',
  'system',
]);

// Job status enum for exports/imports
export const jobStatusEnum = pgEnum('job_status', ['pending', 'processing', 'completed', 'failed']);

// Integration provider and status enums
export const integrationProviderEnum = pgEnum('integration_provider', [
  'google',
  'microsoft',
  'slack',
  'salesforce',
  'hubspot',
  'quickbooks',
  'stripe',
  'shopify',
  'twitter',
]);

export const integrationStatusEnum = pgEnum('integration_status', [
  'active',
  'inactive',
  'error',
  'expired',
]);

// Launchpad (Blog) enums
export const blogPostStatusEnum = pgEnum('blog_post_status', [
  'draft',
  'published',
  'scheduled',
  'archived',
]);

export const blogPostContentTypeEnum = pgEnum('blog_post_content_type', [
  'article',
  'tool-spotlight',
]);

// Article Studio enums
export const topicIdeaStatusEnum = pgEnum('topic_idea_status', [
  'saved',
  'in_progress',
  'published',
  'archived',
]);

export const topicIdeaGeneratedByEnum = pgEnum('topic_idea_generated_by', [
  'ai',
  'user',
]);

export const articleSourceVerificationEnum = pgEnum('article_source_verification', [
  'verified',
  'unverified',
  'failed',
]);

export const articleLayoutTemplateEnum = pgEnum('article_layout_template', [
  'standard',
  'how-to',
  'listicle',
  'case-study',
  'tool-review',
  'news',
  'opinion',
]);

export const blogReactionTypeEnum = pgEnum('blog_reaction_type', [
  'helpful',
  'insightful',
  'inspiring',
]);

// Platform Feedback enums
export const feedbackTypeEnum = pgEnum('feedback_type', [
  'bug',
  'suggestion',
  'general',
  'feature_request',
]);

export const feedbackStatusEnum = pgEnum('feedback_status', [
  'new',
  'in_review',
  'planned',
  'in_progress',
  'done',
  'closed',
  'wont_fix',
]);

export const feedbackSentimentEnum = pgEnum('feedback_sentiment', [
  'very_negative',
  'negative',
  'neutral',
  'positive',
  'very_positive',
]);

// Document sharing enums
export const sharePermissionEnum = pgEnum('share_permission', [
  'view',
  'comment',
]);

// Campaign recipient tracking enums
export const campaignRecipientStatusEnum = pgEnum('campaign_recipient_status', [
  'pending',
  'sent',
  'delivered',
  'opened',
  'clicked',
  'bounced',
  'unsubscribed',
  'complained',
]);

// CRM interaction tracking enums
export const interactionTypeEnum = pgEnum('interaction_type', [
  'call',
  'email',
  'meeting',
  'note',
  'task',
  'sms',
  'whatsapp',
  'linkedin',
  'other',
]);

export const interactionDirectionEnum = pgEnum('interaction_direction', [
  'inbound',
  'outbound',
]);

export const interactionOutcomeEnum = pgEnum('interaction_outcome', [
  'successful',
  'no_answer',
  'voicemail',
  'busy',
  'cancelled',
  'rescheduled',
  'follow_up_needed',
]);

// Expense tracking enums
export const expenseCategoryEnum = pgEnum('expense_category', [
  'travel',
  'meals',
  'supplies',
  'software',
  'hardware',
  'marketing',
  'payroll',
  'utilities',
  'rent',
  'insurance',
  'professional_services',
  'other',
]);

export const expenseStatusEnum = pgEnum('expense_status', [
  'pending',
  'approved',
  'rejected',
  'reimbursed',
]);

// Automation rule enums
export const automationTriggerTypeEnum = pgEnum('automation_trigger_type', [
  'lead_created',
  'lead_stage_changed',
  'deal_created',
  'deal_stage_changed',
  'contact_created',
  'task_completed',
  'email_opened',
  'form_submitted',
  'scheduled',
  'webhook',
]);

export const automationActionTypeEnum = pgEnum('automation_action_type', [
  'send_email',
  'create_task',
  'update_field',
  'add_tag',
  'remove_tag',
  'assign_owner',
  'create_deal',
  'send_notification',
  'webhook',
  'wait',
]);

export const automationStatusEnum = pgEnum('automation_status', [
  'active',
  'paused',
  'draft',
  'archived',
]);

// Deal stage enum (separate from prospect stages for clearer pipeline)
export const dealStageEnum = pgEnum('deal_stage', [
  'qualification',
  'discovery',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost',
]);

export const dealPriorityEnum = pgEnum('deal_priority', [
  'low',
  'medium',
  'high',
  'critical',
]);

// ============================================================================
// AGENT ORCHESTRATION ENUMS
// ============================================================================

export const agentDepartmentEnum = pgEnum('agent_department', [
  'sales',
  'marketing',
  'support',
  'operations',
  'finance',
  'product',
  'general',
]);

export const agentTeamRoleEnum = pgEnum('agent_team_role', [
  'coordinator',
  'specialist',
  'support',
]);

export const agentMessageTypeEnum = pgEnum('agent_message_type', [
  'task',
  'result',
  'context',
  'handoff',
  'status',
  'query',
]);

export const memoryTierEnum = pgEnum('memory_tier', [
  'short_term',
  'medium_term',
  'long_term',
]);

export const orchestrationWorkflowStatusEnum = pgEnum('orchestration_workflow_status', [
  'active',
  'paused',
  'archived',
  'draft',
]);

export const orchestrationWorkflowTriggerTypeEnum = pgEnum('orchestration_workflow_trigger_type', [
  'manual',
  'event',
  'schedule',
  'agent_request',
]);

export const orchestrationExecutionStatusEnum = pgEnum('orchestration_execution_status', [
  'running',
  'completed',
  'failed',
  'paused',
  'cancelled',
]);

export const teamAutonomyLevelEnum = pgEnum('team_autonomy_level', [
  'supervised',
  'semi_autonomous',
  'autonomous',
]);

// ============================================================================
// WORKSPACES (Tenant Boundary)
// ============================================================================

export const workspaces = pgTable(
  'workspaces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),

    // Clerk organization ID for auth integration
    clerkOrganizationId: text('clerk_organization_id').unique(),

    // Subscription & billing
    subscriptionTier: subscriptionTierEnum('subscription_tier').notNull().default('free'),
    subscriptionStatus: text('subscription_status').notNull().default('active'),
    stripeCustomerId: text('stripe_customer_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),

    // Settings & configuration
    settings: jsonb('settings')
      .$type<{
        branding?: { logo?: string; primaryColor?: string };
        features?: { ai_provider?: string; max_agents?: number };
        notifications?: { email?: boolean; slack?: boolean };
      }>()
      .default({}),

    // Encrypted API keys for AI providers
    encryptedApiKeys: jsonb('encrypted_api_keys')
      .$type<{
        openai?: string; // AES-256-GCM encrypted
        anthropic?: string; // AES-256-GCM encrypted
        google?: string; // AES-256-GCM encrypted
      }>()
      .default({}),

    // Metadata
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex('workspace_slug_idx').on(table.slug),
    clerkOrgIdx: index('workspace_clerk_org_idx').on(table.clerkOrganizationId),
  }),
);

// ============================================================================
// USERS
// ============================================================================

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Clerk user ID for auth integration
    clerkUserId: text('clerk_user_id').notNull().unique(),

    // Profile
    email: text('email').notNull(),
    firstName: text('first_name'),
    lastName: text('last_name'),
    avatarUrl: text('avatar_url'),

    // Preferences
    preferences: jsonb('preferences')
      .$type<{
        theme?: 'light' | 'dark' | 'auto';
        notifications?: { email?: boolean; push?: boolean };
        language?: string;
      }>()
      .default({}),

    // Metadata
    lastLoginAt: timestamp('last_login_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    clerkUserIdx: uniqueIndex('user_clerk_user_idx').on(table.clerkUserId),
    emailIdx: index('user_email_idx').on(table.email),
  }),
);

// ============================================================================
// WORKSPACE MEMBERS (User <-> Workspace with RBAC)
// ============================================================================

export const workspaceMembers = pgTable(
  'workspace_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // RBAC
    role: userRoleEnum('role').notNull().default('member'),

    // Permissions (fine-grained control)
    permissions: jsonb('permissions')
      .$type<{
        agents?: {
          create?: boolean;
          edit?: boolean;
          delete?: boolean;
          execute?: boolean;
        };
        packs?: { install?: boolean; uninstall?: boolean };
        billing?: { view?: boolean; manage?: boolean };
        members?: { invite?: boolean; remove?: boolean; changeRole?: boolean };
      }>()
      .default({}),

    // Metadata
    invitedBy: uuid('invited_by').references(() => users.id),
    joinedAt: timestamp('joined_at').notNull().defaultNow(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    workspaceUserIdx: uniqueIndex('workspace_member_unique_idx').on(
      table.workspaceId,
      table.userId,
    ),
    tenantIdx: index('workspace_member_tenant_idx').on(table.workspaceId),
  }),
);

// ============================================================================
// AGENTS
// ============================================================================

export const agents = pgTable(
  'agents',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key - REQUIRED FOR ALL QUERIES
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Basic info
    name: text('name').notNull(),
    description: text('description'),
    type: agentTypeEnum('type').notNull(),
    status: agentStatusEnum('status').notNull().default('draft'),

    // Configuration
    config: jsonb('config')
      .$type<{
        aiProvider?: 'openai' | 'anthropic' | 'google' | 'custom';
        model?: string;
        temperature?: number;
        maxTokens?: number;
        systemPrompt?: string;
        tools?: string[];
        triggers?: { type: string; config: any }[];
        knowledgeBase?: {
          enabled: boolean;
          scope?: 'all' | 'collections';
          collectionIds?: string[];
          maxResults?: number;
        };
        // Agent chat self-adjustment features
        tone?: 'professional' | 'friendly' | 'concise';
        capabilities?: string[];
        preferences?: Record<string, { value: string; updatedAt: string; reason?: string | null }>;
        notes?: Array<{ note: string; category: string; createdAt: string }>;
      }>()
      .notNull()
      .default({}),

    // Source (marketplace pack or custom)
    sourcePackId: uuid('source_pack_id'),
    isCustom: boolean('is_custom').notNull().default(true),

    // Ownership & permissions
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    isPublic: boolean('is_public').notNull().default(false),

    // Metadata
    version: text('version').notNull().default('1.0.0'),
    executionCount: integer('execution_count').notNull().default(0),
    lastExecutedAt: timestamp('last_executed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('agent_tenant_idx').on(table.workspaceId),
    statusIdx: index('agent_status_idx').on(table.status),
    typeIdx: index('agent_type_idx').on(table.type),
    createdByIdx: index('agent_created_by_idx').on(table.createdBy),
  }),
);

// ============================================================================
// AGENT TEMPLATES (Individual Marketplace Templates)
// ============================================================================

export const agentTemplates = pgTable(
  'agent_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Template info
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description').notNull(),
    shortDescription: text('short_description').notNull(), // For cards
    category: text('category').notNull(),
    type: agentTypeEnum('type').notNull(),

    // Visual
    iconUrl: text('icon_url'),
    coverImageUrl: text('cover_image_url'),
    badgeText: text('badge_text'), // 'Trending', 'New', 'Popular', etc

    // Configuration template
    config: jsonb('config')
      .$type<{
        aiProvider?: 'openai' | 'anthropic' | 'custom';
        model?: string;
        temperature?: number;
        maxTokens?: number;
        systemPrompt?: string;
        tools?: string[];
        inputs?: { name: string; type: string; required?: boolean }[];
        outputs?: { name: string; type: string }[];
        triggers?: { type: string; config: any }[];
        defaults?: Record<string, any>;
      }>()
      .notNull()
      .default({}),

    // KPIs and metrics
    kpis: jsonb('kpis')
      .$type<{
        successRate?: number; // 0-100
        avgTimeSaved?: string; // "2 hours/claim"
        accuracy?: number; // 0-100
        avgDuration?: string; // "45 seconds"
      }>()
      .default({}),

    // Marketplace metadata
    authorId: uuid('author_id').references(() => users.id),
    authorName: text('author_name').default('GalaxyCo Team'),
    tags: text('tags').array().default([]),

    // Stats
    installCount: integer('install_count').notNull().default(0),
    rating: integer('rating').default(0), // 0-500 (5.00 stars * 100)
    reviewCount: integer('review_count').notNull().default(0),

    // Trending metrics (for ranking)
    installs24h: integer('installs_24h').notNull().default(0),
    installs7d: integer('installs_7d').notNull().default(0),
    installs30d: integer('installs_30d').notNull().default(0),
    trendingScore: integer('trending_score').notNull().default(0),

    // Publishing
    isPublished: boolean('is_published').notNull().default(true),
    isFeatured: boolean('is_featured').notNull().default(false),
    publishedAt: timestamp('published_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex('agent_template_slug_idx').on(table.slug),
    categoryIdx: index('agent_template_category_idx').on(table.category),
    publishedIdx: index('agent_template_published_idx').on(table.isPublished),
    featuredIdx: index('agent_template_featured_idx').on(table.isFeatured),
    trendingIdx: index('agent_template_trending_idx').on(table.trendingScore),
  }),
);

// ============================================================================
// AGENT PACKS (Marketplace Templates)
// ============================================================================

export const agentPacks = pgTable(
  'agent_packs',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Pack info
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    category: text('category').notNull(),

    // Content
    agentTemplates: jsonb('agent_templates')
      .$type<
        Array<{
          name: string;
          type: string;
          config: any;
        }>
      >()
      .notNull()
      .default([]),

    // Marketplace metadata
    authorId: uuid('author_id').references(() => users.id),
    authorName: text('author_name'),
    iconUrl: text('icon_url'),
    coverImageUrl: text('cover_image_url'),
    tags: text('tags').array().default([]),

    // Pricing
    pricingType: text('pricing_type').notNull().default('free'), // 'free' | 'one-time' | 'subscription'
    price: integer('price').default(0), // in cents

    // Stats
    installCount: integer('install_count').notNull().default(0),
    rating: integer('rating').default(0), // 0-500 (5.00 stars * 100)
    reviewCount: integer('review_count').notNull().default(0),

    // Publishing
    isPublished: boolean('is_published').notNull().default(false),
    publishedAt: timestamp('published_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex('agent_pack_slug_idx').on(table.slug),
    categoryIdx: index('agent_pack_category_idx').on(table.category),
    publishedIdx: index('agent_pack_published_idx').on(table.isPublished),
  }),
);

// ============================================================================
// WORKSPACE API KEYS (Encrypted Storage)
// ============================================================================

export const workspaceApiKeys = pgTable(
  'workspace_api_keys',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Provider info
    provider: text('provider').notNull(), // 'openai', 'anthropic', etc
    name: text('name').notNull(), // User-friendly name

    // Encrypted key (AES-256-GCM)
    encryptedKey: text('encrypted_key').notNull(),
    iv: text('iv').notNull(), // Initialization vector
    authTag: text('auth_tag').notNull(), // Authentication tag

    // Metadata
    isActive: boolean('is_active').notNull().default(true),
    lastUsedAt: timestamp('last_used_at'),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantProviderIdx: uniqueIndex('api_key_tenant_provider_idx').on(
      table.workspaceId,
      table.provider,
    ),
  }),
);

// ============================================================================
// AGENT LOGS (Performance & Monitoring)
// ============================================================================

export const agentLogs = pgTable(
  'agent_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key - REQUIRED FOR ALL QUERIES
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Agent execution context
    agentId: text('agent_id').notNull(), // Can reference templates too
    tenantId: text('tenant_id').notNull(), // Redundant with workspaceId but required for logging compatibility
    userId: text('user_id').notNull(),

    // Execution data (summarized for performance)
    inputSummary: text('input_summary').notNull(),
    outputSummary: text('output_summary').notNull(),
    duration: integer('duration').notNull(), // milliseconds
    success: boolean('success').notNull(),

    // AI Provider context
    provider: text('provider'), // 'openai', 'anthropic', 'google'
    model: text('model'), // 'gpt-4', 'claude-3-sonnet', etc

    // Error information
    error: text('error'), // Error message if failed
    metadata: text('metadata'), // Additional context as JSON string

    // Timestamp
    timestamp: timestamp('timestamp').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    // Performance indexes
    tenantTimestampIdx: index('agent_log_tenant_timestamp_idx').on(
      table.workspaceId,
      table.timestamp,
    ),
    agentTimestampIdx: index('agent_log_agent_timestamp_idx').on(table.agentId, table.timestamp),
    successIdx: index('agent_log_success_idx').on(table.success),
    providerIdx: index('agent_log_provider_idx').on(table.provider),
  }),
);

// ============================================================================
// AGENT EXECUTIONS (Audit Trail)
// ============================================================================

export const agentExecutions = pgTable(
  'agent_executions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key - REQUIRED FOR ALL QUERIES
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Execution context
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    triggeredBy: uuid('triggered_by')
      .notNull()
      .references(() => users.id),

    // Execution data
    status: executionStatusEnum('status').notNull().default('pending'),
    input: jsonb('input').$type<Record<string, any>>(),
    output: jsonb('output').$type<Record<string, any>>(),
    error: jsonb('error').$type<{
      message: string;
      code?: string;
      stack?: string;
    }>(),

    // Performance metrics
    durationMs: integer('duration_ms'),
    tokensUsed: integer('tokens_used'),
    cost: integer('cost'), // in cents

    // Timestamps
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('execution_tenant_idx').on(table.workspaceId),
    agentIdx: index('execution_agent_idx').on(table.agentId),
    statusIdx: index('execution_status_idx').on(table.status),
    triggeredByIdx: index('execution_triggered_by_idx').on(table.triggeredBy),
    createdAtIdx: index('execution_created_at_idx').on(table.createdAt),
  }),
);

// ============================================================================
// AGENT SCHEDULES (Trigger Configuration)
// ============================================================================

export const agentSchedules = pgTable(
  'agent_schedules',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),

    // Schedule configuration
    triggerType: text('trigger_type').notNull(), // 'manual' | 'scheduled' | 'webhook'
    cron: text('cron'), // Cron expression for scheduled type
    timezone: text('timezone').default('America/Chicago'),
    webhookUrl: text('webhook_url'), // For webhook type
    webhookSecret: text('webhook_secret'), // Secret for webhook authentication

    // State
    enabled: boolean('enabled').notNull().default(true),
    nextRunAt: timestamp('next_run_at'),
    lastRunAt: timestamp('last_run_at'),
    lastRunStatus: text('last_run_status'), // 'success' | 'failed'

    // Metadata
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('schedule_tenant_idx').on(table.workspaceId),
    agentIdx: uniqueIndex('schedule_agent_idx').on(table.agentId),
    nextRunIdx: index('schedule_next_run_idx').on(table.nextRunAt),
  }),
);

// ============================================================================
// AGENT ORCHESTRATION SYSTEM
// Multi-agent teams, inter-agent communication, and workflow coordination
// ============================================================================

/**
 * Agent Teams - Department-level agent groups
 * Enables grouping agents by department for coordinated automation
 */
export const agentTeams = pgTable(
  'agent_teams',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key - REQUIRED FOR ALL QUERIES
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Team info
    name: text('name').notNull(),
    department: agentDepartmentEnum('department').notNull(),
    description: text('description'),

    // Coordinator agent (optional - can be null if no coordinator assigned)
    coordinatorAgentId: uuid('coordinator_agent_id').references(() => agents.id, {
      onDelete: 'set null',
    }),

    // Team configuration
    config: jsonb('config')
      .$type<{
        autonomyLevel: 'supervised' | 'semi_autonomous' | 'autonomous';
        approvalRequired: string[]; // Action types requiring human approval
        workingHours?: { start: string; end: string; timezone: string };
        maxConcurrentTasks: number;
        escalationRules?: Array<{
          condition: string;
          action: 'notify' | 'escalate' | 'pause';
          target?: string;
        }>;
        capabilities?: string[];
      }>()
      .notNull()
      .default({
        autonomyLevel: 'supervised',
        approvalRequired: [],
        maxConcurrentTasks: 5,
      }),

    // Status
    status: text('status').notNull().default('active'), // 'active' | 'paused' | 'archived'

    // Metrics
    totalExecutions: integer('total_executions').notNull().default(0),
    successfulExecutions: integer('successful_executions').notNull().default(0),
    lastActiveAt: timestamp('last_active_at'),

    // Ownership
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('agent_team_tenant_idx').on(table.workspaceId),
    departmentIdx: index('agent_team_department_idx').on(table.department),
    statusIdx: index('agent_team_status_idx').on(table.status),
    coordinatorIdx: index('agent_team_coordinator_idx').on(table.coordinatorAgentId),
  }),
);

/**
 * Agent Team Members - Agent membership in teams
 * Links agents to teams with specific roles
 */
export const agentTeamMembers = pgTable(
  'agent_team_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // References
    teamId: uuid('team_id')
      .notNull()
      .references(() => agentTeams.id, { onDelete: 'cascade' }),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),

    // Role and priority
    role: agentTeamRoleEnum('role').notNull(),
    priority: integer('priority').notNull().default(0), // Execution order within team

    // Member configuration
    config: jsonb('config')
      .$type<{
        specializations?: string[]; // What this agent specializes in within the team
        fallbackFor?: string[]; // Agent IDs this agent can substitute for
        maxConcurrentTasks?: number;
      }>()
      .default({}),

    // Metadata
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    teamAgentIdx: uniqueIndex('agent_team_member_team_agent_idx').on(table.teamId, table.agentId),
    roleIdx: index('agent_team_member_role_idx').on(table.role),
  }),
);

/**
 * Agent Messages - Inter-agent communication
 * Message bus for agent-to-agent and agent-to-team communication
 */
export const agentMessages = pgTable(
  'agent_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key - REQUIRED FOR ALL QUERIES
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Routing
    fromAgentId: uuid('from_agent_id').references(() => agents.id, { onDelete: 'set null' }),
    toAgentId: uuid('to_agent_id').references(() => agents.id, { onDelete: 'set null' }),
    teamId: uuid('team_id').references(() => agentTeams.id, { onDelete: 'set null' }),

    // Message type and content
    messageType: agentMessageTypeEnum('message_type').notNull(),
    content: jsonb('content')
      .$type<{
        subject: string;
        body: string;
        data?: Record<string, unknown>;
        priority: 'low' | 'normal' | 'high' | 'urgent';
        taskId?: string;
        workflowExecutionId?: string;
      }>()
      .notNull(),

    // Threading
    parentMessageId: uuid('parent_message_id'),
    threadId: uuid('thread_id'), // Groups related messages

    // Status
    status: text('status').notNull().default('pending'), // 'pending' | 'delivered' | 'read' | 'processed'

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    deliveredAt: timestamp('delivered_at'),
    readAt: timestamp('read_at'),
    processedAt: timestamp('processed_at'),
  },
  (table) => ({
    tenantIdx: index('agent_message_tenant_idx').on(table.workspaceId),
    fromAgentIdx: index('agent_message_from_agent_idx').on(table.fromAgentId),
    toAgentIdx: index('agent_message_to_agent_idx').on(table.toAgentId),
    teamIdx: index('agent_message_team_idx').on(table.teamId),
    statusIdx: index('agent_message_status_idx').on(table.status),
    threadIdx: index('agent_message_thread_idx').on(table.threadId),
    createdAtIdx: index('agent_message_created_at_idx').on(table.createdAt),
  }),
);

/**
 * Agent Workflows - Multi-agent workflow definitions
 * Defines sequences of agent actions that can be triggered and executed
 */
export const agentWorkflows = pgTable(
  'agent_workflows',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key - REQUIRED FOR ALL QUERIES
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Optional team association
    teamId: uuid('team_id').references(() => agentTeams.id, { onDelete: 'set null' }),

    // Workflow info
    name: text('name').notNull(),
    description: text('description'),
    category: text('category'), // 'sales', 'marketing', 'support', 'operations', etc.

    // Trigger configuration
    triggerType: orchestrationWorkflowTriggerTypeEnum('trigger_type').notNull(),
    triggerConfig: jsonb('trigger_config')
      .$type<{
        eventType?: string; // For event triggers
        cron?: string; // For schedule triggers
        webhookSecret?: string; // For webhook triggers
        conditions?: Array<{ field: string; operator: string; value: unknown }>;
      }>()
      .default({}),

    // Workflow steps (the actual workflow definition)
    steps: jsonb('steps')
      .$type<
        Array<{
          id: string;
          name: string;
          agentId: string;
          action: string;
          inputs: Record<string, unknown>;
          conditions?: Array<{ field: string; operator: string; value: unknown }>;
          onSuccess?: string; // Next step ID
          onFailure?: string; // Fallback step ID
          timeout?: number; // Seconds
          retryConfig?: {
            maxAttempts: number;
            backoffMs: number;
          };
        }>
      >()
      .notNull()
      .default([]),

    // Status
    status: orchestrationWorkflowStatusEnum('status').notNull().default('draft'),

    // Metrics
    totalExecutions: integer('total_executions').notNull().default(0),
    successfulExecutions: integer('successful_executions').notNull().default(0),
    avgDurationMs: integer('avg_duration_ms'),
    lastExecutedAt: timestamp('last_executed_at'),

    // Ownership
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('agent_workflow_tenant_idx').on(table.workspaceId),
    teamIdx: index('agent_workflow_team_idx').on(table.teamId),
    statusIdx: index('agent_workflow_status_idx').on(table.status),
    triggerIdx: index('agent_workflow_trigger_idx').on(table.triggerType),
    categoryIdx: index('agent_workflow_category_idx').on(table.category),
  }),
);

/**
 * Agent Workflow Executions - Workflow execution tracking
 * Tracks the execution state and results of workflow runs
 */
export const agentWorkflowExecutions = pgTable(
  'agent_workflow_executions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key - REQUIRED FOR ALL QUERIES
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Workflow reference
    workflowId: uuid('workflow_id')
      .notNull()
      .references(() => agentWorkflows.id, { onDelete: 'cascade' }),

    // Execution state
    status: orchestrationExecutionStatusEnum('status').notNull().default('running'),
    currentStepId: text('current_step_id'),
    currentStepIndex: integer('current_step_index').notNull().default(0),

    // Step results (maps step ID to result)
    stepResults: jsonb('step_results')
      .$type<
        Record<
          string,
          {
            status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
            output: unknown;
            error?: string;
            startedAt?: string;
            completedAt?: string;
            durationMs?: number;
          }
        >
      >()
      .default({}),

    // Shared context (passed between steps)
    context: jsonb('context').$type<Record<string, unknown>>().default({}),

    // Trigger info
    triggeredBy: uuid('triggered_by').references(() => users.id, { onDelete: 'set null' }),
    triggerType: text('trigger_type'), // 'manual' | 'event' | 'schedule' | 'agent_request'
    triggerData: jsonb('trigger_data').$type<Record<string, unknown>>(),

    // Timestamps
    startedAt: timestamp('started_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
    pausedAt: timestamp('paused_at'),

    // Performance metrics
    durationMs: integer('duration_ms'),
    totalSteps: integer('total_steps').notNull().default(0),
    completedSteps: integer('completed_steps').notNull().default(0),

    // Error info
    error: jsonb('error').$type<{
      message: string;
      step?: string;
      details?: unknown;
      stack?: string;
    }>(),
  },
  (table) => ({
    tenantIdx: index('agent_workflow_execution_tenant_idx').on(table.workspaceId),
    workflowIdx: index('agent_workflow_execution_workflow_idx').on(table.workflowId),
    statusIdx: index('agent_workflow_execution_status_idx').on(table.status),
    startedAtIdx: index('agent_workflow_execution_started_at_idx').on(table.startedAt),
    triggeredByIdx: index('agent_workflow_execution_triggered_by_idx').on(table.triggeredBy),
  }),
);

/**
 * Agent Shared Memory - Three-tier memory system
 * Stores context, patterns, and knowledge that agents can share
 */
export const agentSharedMemory = pgTable(
  'agent_shared_memory',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key - REQUIRED FOR ALL QUERIES
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Scope (team-wide or agent-specific)
    teamId: uuid('team_id').references(() => agentTeams.id, { onDelete: 'cascade' }),
    agentId: uuid('agent_id').references(() => agents.id, { onDelete: 'cascade' }),

    // Memory classification
    memoryTier: memoryTierEnum('memory_tier').notNull(),
    category: text('category').notNull(), // 'context' | 'pattern' | 'preference' | 'knowledge' | 'relationship'

    // Key-value storage
    key: text('key').notNull(),
    value: jsonb('value').$type<unknown>().notNull(),

    // Metadata for relevance and management
    metadata: jsonb('metadata')
      .$type<{
        source?: string; // Where this memory came from
        confidence?: number; // 0-100, how reliable this memory is
        lastAccessed?: string; // ISO timestamp of last access
        accessCount?: number; // Number of times accessed
        relatedMemoryIds?: string[]; // Links to related memories
        tags?: string[];
      }>()
      .default({}),

    // Memory management
    importance: integer('importance').notNull().default(50), // 0-100, for prioritization
    expiresAt: timestamp('expires_at'), // For short-term memory auto-cleanup

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('agent_shared_memory_tenant_idx').on(table.workspaceId),
    teamIdx: index('agent_shared_memory_team_idx').on(table.teamId),
    agentIdx: index('agent_shared_memory_agent_idx').on(table.agentId),
    tierIdx: index('agent_shared_memory_tier_idx').on(table.memoryTier),
    categoryIdx: index('agent_shared_memory_category_idx').on(table.category),
    keyIdx: index('agent_shared_memory_key_idx').on(table.key),
    expiresAtIdx: index('agent_shared_memory_expires_at_idx').on(table.expiresAt),
    importanceIdx: index('agent_shared_memory_importance_idx').on(table.importance),
  }),
);

// ============================================================================
// AGENT AUTONOMY & APPROVAL SYSTEM
// ============================================================================

/**
 * Risk levels for agent actions
 */
export const actionRiskLevelEnum = pgEnum('action_risk_level', [
  'low',      // Read operations, status updates
  'medium',   // CRM updates, task creation
  'high',     // External emails, calendar changes
  'critical', // Financial transactions, data deletion
]);

/**
 * Approval status for pending actions
 */
export const approvalStatusEnum = pgEnum('approval_status', [
  'pending',
  'approved',
  'rejected',
  'expired',
  'auto_approved', // For actions that were auto-approved based on autonomy level
]);

/**
 * Agent Pending Actions - Queue for actions requiring approval
 * Implements approval workflow with risk classification
 */
export const agentPendingActions = pgTable(
  'agent_pending_actions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key - REQUIRED FOR ALL QUERIES
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Context
    teamId: uuid('team_id').references(() => agentTeams.id, { onDelete: 'set null' }),
    agentId: uuid('agent_id').references(() => agents.id, { onDelete: 'set null' }),
    workflowExecutionId: uuid('workflow_execution_id').references(() => agentWorkflowExecutions.id, { onDelete: 'set null' }),

    // Action details
    actionType: text('action_type').notNull(), // e.g., 'send_email', 'create_task', 'update_crm'
    actionData: jsonb('action_data').$type<Record<string, unknown>>().notNull(),
    description: text('description').notNull(), // Human-readable description

    // Risk classification
    riskLevel: actionRiskLevelEnum('risk_level').notNull(),
    riskReasons: jsonb('risk_reasons').$type<string[]>().default([]),

    // Approval status
    status: approvalStatusEnum('status').notNull().default('pending'),

    // Review info
    reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at'),
    reviewNotes: text('review_notes'),

    // Auto-expiration
    expiresAt: timestamp('expires_at'),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('agent_pending_action_tenant_idx').on(table.workspaceId),
    teamIdx: index('agent_pending_action_team_idx').on(table.teamId),
    agentIdx: index('agent_pending_action_agent_idx').on(table.agentId),
    statusIdx: index('agent_pending_action_status_idx').on(table.status),
    riskLevelIdx: index('agent_pending_action_risk_level_idx').on(table.riskLevel),
    expiresAtIdx: index('agent_pending_action_expires_at_idx').on(table.expiresAt),
    createdAtIdx: index('agent_pending_action_created_at_idx').on(table.createdAt),
  }),
);

/**
 * Agent Action Audit Log - Full audit trail for all autonomous actions
 * Records both approved and auto-executed actions
 */
export const agentActionAuditLog = pgTable(
  'agent_action_audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key - REQUIRED FOR ALL QUERIES
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Context
    teamId: uuid('team_id').references(() => agentTeams.id, { onDelete: 'set null' }),
    agentId: uuid('agent_id').references(() => agents.id, { onDelete: 'set null' }),
    workflowExecutionId: uuid('workflow_execution_id').references(() => agentWorkflowExecutions.id, { onDelete: 'set null' }),

    // Action details
    actionType: text('action_type').notNull(),
    actionData: jsonb('action_data').$type<Record<string, unknown>>(),
    description: text('description'),

    // Execution info
    executedAt: timestamp('executed_at').notNull().defaultNow(),
    wasAutomatic: boolean('was_automatic').notNull(), // true if auto-executed, false if required approval
    approvalId: uuid('approval_id').references(() => agentPendingActions.id, { onDelete: 'set null' }),

    // Risk info
    riskLevel: actionRiskLevelEnum('risk_level'),

    // Result
    success: boolean('success').notNull(),
    error: text('error'),
    result: jsonb('result').$type<Record<string, unknown>>(),
    durationMs: integer('duration_ms'),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('agent_action_audit_tenant_idx').on(table.workspaceId),
    teamIdx: index('agent_action_audit_team_idx').on(table.teamId),
    agentIdx: index('agent_action_audit_agent_idx').on(table.agentId),
    executedAtIdx: index('agent_action_audit_executed_at_idx').on(table.executedAt),
    wasAutomaticIdx: index('agent_action_audit_was_automatic_idx').on(table.wasAutomatic),
    successIdx: index('agent_action_audit_success_idx').on(table.success),
    actionTypeIdx: index('agent_action_audit_action_type_idx').on(table.actionType),
  }),
);

// ============================================================================
// KNOWLEDGE BASE (Wisebase-like Document Management)
// ============================================================================

export const knowledgeCollections = pgTable(
  'knowledge_collections',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Collection info
    name: text('name').notNull(),
    description: text('description'),
    color: text('color'), // For UI organization
    icon: text('icon'), // Emoji or icon name

    // Metadata
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    itemCount: integer('item_count').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('knowledge_collection_tenant_idx').on(table.workspaceId),
  }),
);

export const knowledgeTags = pgTable(
  'knowledge_tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Tag info
    name: text('name').notNull(),
    color: text('color'),

    // Metadata
    usageCount: integer('usage_count').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantNameIdx: uniqueIndex('knowledge_tag_tenant_name_idx').on(table.workspaceId, table.name),
  }),
);

export const knowledgeItems = pgTable(
  'knowledge_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key - REQUIRED FOR ALL QUERIES
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Item info
    title: text('title').notNull(),
    type: knowledgeItemTypeEnum('type').notNull(),
    status: knowledgeItemStatusEnum('status').notNull().default('processing'),

    // Source
    sourceUrl: text('source_url'), // For URLs and uploaded files
    fileName: text('file_name'), // Original filename for uploads
    fileSize: integer('file_size'), // In bytes
    mimeType: text('mime_type'),

    // Processed content
    content: text('content'), // Extracted/parsed text content
    summary: text('summary'), // AI-generated summary
    metadata: jsonb('metadata')
      .$type<{
        author?: string;
        publishDate?: string;
        wordCount?: number;
        language?: string;
        extractedAt?: string;
        ocrConfidence?: number; // For images
        dimensions?: { width: number; height: number }; // For images
        tags?: string[]; // User-defined or AI-generated tags
        uploadedVia?: string; // 'neptune', 'library', 'api'
      }>()
      .default({}),

    // Embeddings for RAG
    embeddings: jsonb('embeddings').$type<number[]>(), // Vector embeddings
    embeddingsModel: text('embeddings_model'), // 'text-embedding-3-small', etc

    // Organization
    collectionId: uuid('collection_id').references(() => knowledgeCollections.id, {
      onDelete: 'set null',
    }),
    tags: text('tags').array().default([]),

    // User actions
    isFavorite: boolean('is_favorite').notNull().default(false),
    isArchived: boolean('is_archived').notNull().default(false),

    // Processing info
    processingError: text('processing_error'),
    processedAt: timestamp('processed_at'),

    // Metadata
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('knowledge_item_tenant_idx').on(table.workspaceId),
    statusIdx: index('knowledge_item_status_idx').on(table.status),
    collectionIdx: index('knowledge_item_collection_idx').on(table.collectionId),
    typeIdx: index('knowledge_item_type_idx').on(table.type),
    createdByIdx: index('knowledge_item_created_by_idx').on(table.createdBy),
    favoriteIdx: index('knowledge_item_favorite_idx').on(table.isFavorite),
    createdAtIdx: index('knowledge_item_created_at_idx').on(table.createdAt),
  }),
);

// Knowledge item tags (many-to-many)
export const knowledgeItemTags = pgTable(
  'knowledge_item_tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    itemId: uuid('item_id')
      .notNull()
      .references(() => knowledgeItems.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => knowledgeTags.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    itemTagIdx: uniqueIndex('knowledge_item_tag_idx').on(table.itemId, table.tagId),
  }),
);

// ============================================================================
// RELATIONS
// ============================================================================

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  members: many(workspaceMembers),
  agents: many(agents),
  executions: many(agentExecutions),
  schedules: many(agentSchedules),
  agentLogs: many(agentLogs),
  knowledgeCollections: many(knowledgeCollections),
  knowledgeItems: many(knowledgeItems),
  knowledgeTags: many(knowledgeTags),
  aiConversations: many(aiConversations),
  aiUserPreferences: many(aiUserPreferences),
}));

export const usersRelations = relations(users, ({ many }) => ({
  workspaceMembers: many(workspaceMembers),
  workspaceMemberships: many(workspaceMembers),
  createdAgents: many(agents),
  triggeredExecutions: many(agentExecutions),
  createdKnowledgeCollections: many(knowledgeCollections),
  createdKnowledgeItems: many(knowledgeItems),
  aiConversations: many(aiConversations),
  aiPreferences: many(aiUserPreferences),
}));

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [workspaceMembers.userId],
    references: [users.id],
  }),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [agents.workspaceId],
    references: [workspaces.id],
  }),
  creator: one(users, {
    fields: [agents.createdBy],
    references: [users.id],
  }),
  executions: many(agentExecutions),
  schedule: one(agentSchedules),
  // Orchestration relations
  teamMemberships: many(agentTeamMembers),
  coordinatedTeams: many(agentTeams),
  sentMessages: many(agentMessages, { relationName: 'sentMessages' }),
  receivedMessages: many(agentMessages, { relationName: 'receivedMessages' }),
  sharedMemory: many(agentSharedMemory),
}));

export const agentExecutionsRelations = relations(agentExecutions, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [agentExecutions.workspaceId],
    references: [workspaces.id],
  }),
  agent: one(agents, {
    fields: [agentExecutions.agentId],
    references: [agents.id],
  }),
  triggeredByUser: one(users, {
    fields: [agentExecutions.triggeredBy],
    references: [users.id],
  }),
}));

export const agentSchedulesRelations = relations(agentSchedules, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [agentSchedules.workspaceId],
    references: [workspaces.id],
  }),
  agent: one(agents, {
    fields: [agentSchedules.agentId],
    references: [agents.id],
  }),
}));

export const agentLogsRelations = relations(agentLogs, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [agentLogs.workspaceId],
    references: [workspaces.id],
  }),
}));

// ============================================================================
// AGENT ORCHESTRATION RELATIONS
// ============================================================================

export const agentTeamsRelations = relations(agentTeams, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [agentTeams.workspaceId],
    references: [workspaces.id],
  }),
  coordinator: one(agents, {
    fields: [agentTeams.coordinatorAgentId],
    references: [agents.id],
  }),
  creator: one(users, {
    fields: [agentTeams.createdBy],
    references: [users.id],
  }),
  members: many(agentTeamMembers),
  messages: many(agentMessages),
  workflows: many(agentWorkflows),
  sharedMemory: many(agentSharedMemory),
}));

export const agentTeamMembersRelations = relations(agentTeamMembers, ({ one }) => ({
  team: one(agentTeams, {
    fields: [agentTeamMembers.teamId],
    references: [agentTeams.id],
  }),
  agent: one(agents, {
    fields: [agentTeamMembers.agentId],
    references: [agents.id],
  }),
}));

export const agentMessagesRelations = relations(agentMessages, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [agentMessages.workspaceId],
    references: [workspaces.id],
  }),
  fromAgent: one(agents, {
    fields: [agentMessages.fromAgentId],
    references: [agents.id],
    relationName: 'sentMessages',
  }),
  toAgent: one(agents, {
    fields: [agentMessages.toAgentId],
    references: [agents.id],
    relationName: 'receivedMessages',
  }),
  team: one(agentTeams, {
    fields: [agentMessages.teamId],
    references: [agentTeams.id],
  }),
  parentMessage: one(agentMessages, {
    fields: [agentMessages.parentMessageId],
    references: [agentMessages.id],
    relationName: 'messageThread',
  }),
}));

export const agentWorkflowsRelations = relations(agentWorkflows, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [agentWorkflows.workspaceId],
    references: [workspaces.id],
  }),
  team: one(agentTeams, {
    fields: [agentWorkflows.teamId],
    references: [agentTeams.id],
  }),
  creator: one(users, {
    fields: [agentWorkflows.createdBy],
    references: [users.id],
  }),
  executions: many(agentWorkflowExecutions),
}));

export const agentWorkflowExecutionsRelations = relations(agentWorkflowExecutions, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [agentWorkflowExecutions.workspaceId],
    references: [workspaces.id],
  }),
  workflow: one(agentWorkflows, {
    fields: [agentWorkflowExecutions.workflowId],
    references: [agentWorkflows.id],
  }),
  triggeredByUser: one(users, {
    fields: [agentWorkflowExecutions.triggeredBy],
    references: [users.id],
  }),
}));

export const agentSharedMemoryRelations = relations(agentSharedMemory, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [agentSharedMemory.workspaceId],
    references: [workspaces.id],
  }),
  team: one(agentTeams, {
    fields: [agentSharedMemory.teamId],
    references: [agentTeams.id],
  }),
  agent: one(agents, {
    fields: [agentSharedMemory.agentId],
    references: [agents.id],
  }),
}));

export const agentPendingActionsRelations = relations(agentPendingActions, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [agentPendingActions.workspaceId],
    references: [workspaces.id],
  }),
  team: one(agentTeams, {
    fields: [agentPendingActions.teamId],
    references: [agentTeams.id],
  }),
  agent: one(agents, {
    fields: [agentPendingActions.agentId],
    references: [agents.id],
  }),
  workflowExecution: one(agentWorkflowExecutions, {
    fields: [agentPendingActions.workflowExecutionId],
    references: [agentWorkflowExecutions.id],
  }),
  reviewer: one(users, {
    fields: [agentPendingActions.reviewedBy],
    references: [users.id],
  }),
}));

export const agentActionAuditLogRelations = relations(agentActionAuditLog, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [agentActionAuditLog.workspaceId],
    references: [workspaces.id],
  }),
  team: one(agentTeams, {
    fields: [agentActionAuditLog.teamId],
    references: [agentTeams.id],
  }),
  agent: one(agents, {
    fields: [agentActionAuditLog.agentId],
    references: [agents.id],
  }),
  workflowExecution: one(agentWorkflowExecutions, {
    fields: [agentActionAuditLog.workflowExecutionId],
    references: [agentWorkflowExecutions.id],
  }),
  approval: one(agentPendingActions, {
    fields: [agentActionAuditLog.approvalId],
    references: [agentPendingActions.id],
  }),
}));

export const knowledgeCollectionsRelations = relations(knowledgeCollections, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [knowledgeCollections.workspaceId],
    references: [workspaces.id],
  }),
  creator: one(users, {
    fields: [knowledgeCollections.createdBy],
    references: [users.id],
  }),
  items: many(knowledgeItems),
}));

export const knowledgeTagsRelations = relations(knowledgeTags, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [knowledgeTags.workspaceId],
    references: [workspaces.id],
  }),
  itemTags: many(knowledgeItemTags),
}));

export const knowledgeItemsRelations = relations(knowledgeItems, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [knowledgeItems.workspaceId],
    references: [workspaces.id],
  }),
  creator: one(users, {
    fields: [knowledgeItems.createdBy],
    references: [users.id],
  }),
  collection: one(knowledgeCollections, {
    fields: [knowledgeItems.collectionId],
    references: [knowledgeCollections.id],
  }),
  itemTags: many(knowledgeItemTags),
}));

export const knowledgeItemTagsRelations = relations(knowledgeItemTags, ({ one }) => ({
  item: one(knowledgeItems, {
    fields: [knowledgeItemTags.itemId],
    references: [knowledgeItems.id],
  }),
  tag: one(knowledgeTags, {
    fields: [knowledgeItemTags.tagId],
    references: [knowledgeTags.id],
  }),
}));

// ============================================================================
// AI ASSISTANT - CONVERSATIONS
// ============================================================================

export const aiConversations = pgTable(
  'ai_conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Conversation info
    title: text('title').notNull(), // Auto-generated from first message

    // Context - what was the user doing when they started this conversation?
    context: jsonb('context')
      .$type<{
        page?: string; // '/agents', '/prospects/123', etc
        selectedItems?: {
          agentId?: string;
          prospectId?: string;
          workflowId?: string;
        };
        documentIds?: string[]; // Related documents
        timestamp?: string;
      }>()
      .default({}),

    // Organization
    tags: text('tags').array().default([]),
    isPinned: boolean('is_pinned').notNull().default(false),

    // Metadata
    messageCount: integer('message_count').notNull().default(0),
    lastMessageAt: timestamp('last_message_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantUserIdx: index('ai_conversation_tenant_user_idx').on(table.workspaceId, table.userId),
    userIdx: index('ai_conversation_user_idx').on(table.userId),
    lastMessageIdx: index('ai_conversation_last_message_idx').on(table.lastMessageAt),
  }),
);

export const aiMessages = pgTable(
  'ai_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Conversation reference
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => aiConversations.id, { onDelete: 'cascade' }),

    // Message content
    role: text('role').notNull(), // 'user' | 'assistant' | 'system'
    content: text('content').notNull(),

    // File attachments
    attachments: jsonb('attachments').$type<Array<{
      type: 'image' | 'document' | 'file';
      url: string;
      name: string;
      size: number;
      mimeType: string;
    }>>(),

    // Metadata - for RAG, function calls, etc
    metadata: jsonb('metadata')
      .$type<{
        sources?: Array<{
          type: 'document' | 'knowledge_item' | 'agent' | 'prospect';
          id: string;
          title: string;
          relevanceScore?: number;
        }>;
        model?: string; // 'gpt-4', 'claude-3-5-sonnet', etc
        tokensUsed?: number;
        durationMs?: number;
        functionCalls?: Array<{
          name: string;
          args: any;
          result: any;
        }>;
      }>()
      .default({}),

    // Metadata
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    conversationIdx: index('ai_message_conversation_idx').on(table.conversationId),
    createdAtIdx: index('ai_message_created_at_idx').on(table.createdAt),
  }),
);

// ============================================================================
// AI ASSISTANT - USER PREFERENCES
// ============================================================================

export const aiUserPreferences = pgTable(
  'ai_user_preferences',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Learned preferences
    communicationStyle: text('communication_style').default('balanced'), // 'concise' | 'detailed' | 'balanced'
    topicsOfInterest: text('topics_of_interest').array().default([]),
    frequentQuestions: text('frequent_questions').array().default([]),

    // Corrections - learn from user feedback
    corrections: jsonb('corrections')
      .$type<
        Array<{
          wrong: string;
          correct: string;
          timestamp: string;
        }>
      >()
      .default([]),

    // Settings
    defaultModel: text('default_model').default('gpt-4'), // 'gpt-4', 'claude-3-5-sonnet', etc
    enableRag: boolean('enable_rag').notNull().default(true),
    enableProactiveInsights: boolean('enable_proactive_insights').notNull().default(true),

    // Metadata
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantUserIdx: uniqueIndex('ai_user_preferences_tenant_user_idx').on(
      table.workspaceId,
      table.userId,
    ),
  }),
);

// ============================================================================
// RELATIONS FOR AI CONVERSATIONS
// ============================================================================

export const aiConversationsRelations = relations(aiConversations, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [aiConversations.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [aiConversations.userId],
    references: [users.id],
  }),
  messages: many(aiMessages),
}));

export const aiMessagesRelations = relations(aiMessages, ({ one, many }) => ({
  conversation: one(aiConversations, {
    fields: [aiMessages.conversationId],
    references: [aiConversations.id],
  }),
  feedback: many(aiMessageFeedback),
}));

export const aiUserPreferencesRelations = relations(aiUserPreferences, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [aiUserPreferences.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [aiUserPreferences.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// AI ASSISTANT - MESSAGE FEEDBACK
// ============================================================================

export const aiMessageFeedback = pgTable(
  'ai_message_feedback',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // References
    messageId: uuid('message_id')
      .notNull()
      .references(() => aiMessages.id, { onDelete: 'cascade' }),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Feedback data
    feedbackType: text('feedback_type').notNull(), // 'positive' | 'negative'
    comment: text('comment'),

    // Metadata
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    messageUserIdx: uniqueIndex('ai_message_feedback_message_user_idx').on(
      table.messageId,
      table.userId,
    ),
    messageIdx: index('ai_message_feedback_message_idx').on(table.messageId),
    workspaceIdx: index('ai_message_feedback_workspace_idx').on(table.workspaceId),
    userIdx: index('ai_message_feedback_user_idx').on(table.userId),
    typeIdx: index('ai_message_feedback_type_idx').on(table.feedbackType),
    createdAtIdx: index('ai_message_feedback_created_at_idx').on(table.createdAt),
  }),
);

// ============================================================================
// NEPTUNE AUTONOMY LEARNING SYSTEM (Phase 3)
// ============================================================================

export const neptuneActionHistory = pgTable(
  'neptune_action_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Action details
    actionType: text('action_type').notNull(), // e.g., 'create_lead', 'send_email'
    toolName: text('tool_name').notNull(),
    wasAutomatic: boolean('was_automatic').notNull().default(false),
    userApproved: boolean('user_approved'), // null if not asked, true/false if asked
    executionTime: integer('execution_time'), // milliseconds
    resultStatus: text('result_status').notNull().default('pending'), // 'success' | 'failed' | 'pending'

    // Metadata
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    workspaceIdx: index('neptune_action_history_workspace_idx').on(table.workspaceId),
    userIdx: index('neptune_action_history_user_idx').on(table.userId),
    toolIdx: index('neptune_action_history_tool_idx').on(table.toolName),
    createdAtIdx: index('neptune_action_history_created_at_idx').on(table.createdAt),
  }),
);

export const proactiveInsights = pgTable(
  'proactive_insights',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' }), // Optional - can be workspace-wide

    // Insight details
    type: text('type').notNull(), // 'opportunity' | 'risk' | 'suggestion' | 'alert'
    priority: integer('priority').notNull().default(5), // 1-10
    category: text('category').notNull(), // 'sales' | 'marketing' | 'operations' | 'finance'
    title: text('title').notNull(),
    description: text('description').notNull(),
    suggestedActions: jsonb('suggested_actions')
      .$type<Array<{ action: string; toolName?: string; args?: Record<string, unknown> }>>()
      .default([]),
    autoExecutable: boolean('auto_executable').notNull().default(false),

    // Metadata
    expiresAt: timestamp('expires_at'),
    dismissedAt: timestamp('dismissed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    workspaceIdx: index('proactive_insights_workspace_idx').on(table.workspaceId),
    userIdx: index('proactive_insights_user_idx').on(table.userId),
    typeIdx: index('proactive_insights_type_idx').on(table.type),
    priorityIdx: index('proactive_insights_priority_idx').on(table.priority),
    createdAtIdx: index('proactive_insights_created_at_idx').on(table.createdAt),
  }),
);

export const userAutonomyPreferences = pgTable(
  'user_autonomy_preferences',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Autonomy settings
    actionType: text('action_type').notNull(), // e.g., 'create_lead', 'send_email'
    toolName: text('tool_name').notNull(),
    confidenceScore: integer('confidence_score').notNull().default(0), // 0-100
    approvalCount: integer('approval_count').notNull().default(0),
    rejectionCount: integer('rejection_count').notNull().default(0),
    autoExecuteEnabled: boolean('auto_execute_enabled').notNull().default(false),

    // Metadata
    lastUpdated: timestamp('last_updated').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantUserActionIdx: uniqueIndex('user_autonomy_preferences_tenant_user_action_idx').on(
      table.workspaceId,
      table.userId,
      table.toolName,
    ),
    workspaceIdx: index('user_autonomy_preferences_workspace_idx').on(table.workspaceId),
    userIdx: index('user_autonomy_preferences_user_idx').on(table.userId),
  }),
);

export const workspaceIntelligence = pgTable(
  'workspace_intelligence',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' })
      .unique(), // One intelligence record per workspace

    // Business context
    industry: text('industry'),
    businessModel: text('business_model'), // 'b2b', 'b2c', 'saas', etc.
    goals: jsonb('goals')
      .$type<Array<{ goal: string; priority: number }>>()
      .default([]),
    metrics: jsonb('metrics')
      .$type<Array<{ metric: string; target: number; current: number }>>()
      .default([]),
    priorities: text('priorities').array().default([]),

    // Learned patterns
    learnedPatterns: jsonb('learned_patterns')
      .$type<Record<string, unknown>>()
      .default({}),

    // Website-extracted business intelligence
    companyName: text('company_name'),
    companyDescription: text('company_description'),
    products: jsonb('products')
      .$type<Array<{ name: string; description: string }>>()
      .default([]),
    services: jsonb('services')
      .$type<Array<{ name: string; description: string }>>()
      .default([]),
    teamMembers: jsonb('team_members')
      .$type<Array<{ name: string; role: string }>>()
      .default([]),
    targetAudience: text('target_audience'),
    valuePropositions: text('value_propositions').array().default([]),
    brandVoice: text('brand_voice'), // 'professional', 'friendly', 'technical', etc.
    contactInfo: jsonb('contact_info')
      .$type<{ email?: string; phone?: string; address?: string }>()
      .default({}),
    socialLinks: jsonb('social_links')
      .$type<Record<string, string>>()
      .default({}),
    websiteUrl: text('website_url'),
    websiteAnalyzedAt: timestamp('website_analyzed_at'),

    // Metadata
    lastUpdated: timestamp('last_updated').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    workspaceIdx: uniqueIndex('workspace_intelligence_workspace_idx').on(table.workspaceId),
  }),
);

export const aiMessageFeedbackRelations = relations(aiMessageFeedback, ({ one }) => ({
  message: one(aiMessages, {
    fields: [aiMessageFeedback.messageId],
    references: [aiMessages.id],
  }),
  workspace: one(workspaces, {
    fields: [aiMessageFeedback.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [aiMessageFeedback.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// CRM - CUSTOMERS
// ============================================================================

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Basic info
    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone'),
    company: text('company'),
    website: text('website'),

    // Address
    address: jsonb('address')
      .$type<{
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
      }>()
      .default({}),

    // Business details
    status: customerStatusEnum('status').notNull().default('lead'),
    industry: text('industry'),
    size: text('size'), // 'small', 'medium', 'large', 'enterprise'
    revenue: integer('revenue'), // Annual revenue in cents

    // Relationships
    assignedTo: uuid('assigned_to').references(() => users.id),

    // Metadata
    tags: text('tags').array().default([]),
    customFields: jsonb('custom_fields').$type<Record<string, any>>().default({}),
    notes: text('notes'),

    // Timestamps
    lastContactedAt: timestamp('last_contacted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('customer_tenant_idx').on(table.workspaceId),
    statusIdx: index('customer_status_idx').on(table.status),
    assignedToIdx: index('customer_assigned_to_idx').on(table.assignedTo),
    emailIdx: index('customer_email_idx').on(table.email),
  }),
);

// ============================================================================
// CRM - PROJECTS
// ============================================================================

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Basic info
    name: text('name').notNull(),
    description: text('description'),
    status: projectStatusEnum('status').notNull().default('planning'),

    // Relationships
    customerId: uuid('customer_id').references(() => customers.id, {
      onDelete: 'set null',
    }),
    managerId: uuid('manager_id').references(() => users.id),

    // Project details
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'),
    budget: integer('budget'), // In cents
    actualCost: integer('actual_cost'), // In cents

    // Progress
    progress: integer('progress').default(0), // 0-100
    completedTasks: integer('completed_tasks').default(0),
    totalTasks: integer('total_tasks').default(0),

    // Metadata
    tags: text('tags').array().default([]),
    customFields: jsonb('custom_fields').$type<Record<string, any>>().default({}),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('project_tenant_idx').on(table.workspaceId),
    statusIdx: index('project_status_idx').on(table.status),
    customerIdx: index('project_customer_idx').on(table.customerId),
    managerIdx: index('project_manager_idx').on(table.managerId),
  }),
);

// ============================================================================
// CRM - PROSPECTS
// ============================================================================

export const prospects = pgTable(
  'prospects',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Basic info
    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone'),
    company: text('company'),
    title: text('title'),
    linkedinUrl: text('linkedin_url'),

    // Pipeline
    stage: prospectStageEnum('stage').notNull().default('new'),
    score: integer('score').default(0), // Lead scoring 0-100
    estimatedValue: integer('estimated_value'), // In cents

    // Relationships
    assignedTo: uuid('assigned_to').references(() => users.id),
    source: text('source'), // 'website', 'referral', 'campaign', etc

    // Engagement
    lastContactedAt: timestamp('last_contacted_at'),
    nextFollowUpAt: timestamp('next_follow_up_at'),
    interactionCount: integer('interaction_count').default(0),

    // Metadata
    tags: text('tags').array().default([]),
    notes: text('notes'),
    customFields: jsonb('custom_fields').$type<Record<string, any>>().default({}),

    // Conversion
    convertedToCustomer: boolean('converted_to_customer').default(false),
    customerId: uuid('customer_id').references(() => customers.id, {
      onDelete: 'set null',
    }),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('prospect_tenant_idx').on(table.workspaceId),
    stageIdx: index('prospect_stage_idx').on(table.stage),
    assignedToIdx: index('prospect_assigned_to_idx').on(table.assignedTo),
    emailIdx: index('prospect_email_idx').on(table.email),
  }),
);

// ============================================================================
// CRM - CONTACTS
// ============================================================================

export const contacts = pgTable(
  'contacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Basic info
    firstName: text('first_name'),
    lastName: text('last_name'),
    email: text('email').notNull(),
    phone: text('phone'),
    title: text('title'),
    company: text('company'),

    // Social
    linkedinUrl: text('linkedin_url'),
    twitterUrl: text('twitter_url'),

    // Relationships
    customerId: uuid('customer_id').references(() => customers.id, {
      onDelete: 'set null',
    }),
    assignedTo: uuid('assigned_to').references(() => users.id),

    // Metadata
    tags: text('tags').array().default([]),
    notes: text('notes'),
    customFields: jsonb('custom_fields').$type<Record<string, any>>().default({}),

    // Engagement
    lastContactedAt: timestamp('last_contacted_at'),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('contact_tenant_idx').on(table.workspaceId),
    emailIdx: index('contact_email_idx').on(table.email),
    customerIdx: index('contact_customer_idx').on(table.customerId),
    assignedToIdx: index('contact_assigned_to_idx').on(table.assignedTo),
  }),
);

// ============================================================================
// CRM - INTERACTIONS (Call/Email/Meeting Logs)
// ============================================================================

export const crmInteractions = pgTable(
  'crm_interactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Interaction type and direction
    type: interactionTypeEnum('type').notNull(),
    direction: interactionDirectionEnum('direction').notNull().default('outbound'),
    
    // Subject/title for quick reference
    subject: text('subject'),
    
    // Related entities (at least one should be set)
    contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
    prospectId: uuid('prospect_id').references(() => prospects.id, { onDelete: 'set null' }),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
    dealId: uuid('deal_id').references(() => deals.id, { onDelete: 'set null' }),

    // Interaction details
    notes: text('notes'),
    summary: text('summary'), // AI-generated or manual summary
    
    // For calls
    duration: integer('duration'), // In seconds
    outcome: interactionOutcomeEnum('outcome'),
    recordingUrl: text('recording_url'),
    transcriptUrl: text('transcript_url'),
    
    // For emails
    emailSubject: text('email_subject'),
    emailBody: text('email_body'),
    emailThreadId: text('email_thread_id'),
    
    // For meetings
    meetingLocation: text('meeting_location'),
    meetingLink: text('meeting_link'),
    attendees: jsonb('attendees')
      .$type<Array<{ email: string; name?: string; status?: 'accepted' | 'declined' | 'tentative' }>>()
      .default([]),
    
    // Scheduling
    scheduledAt: timestamp('scheduled_at'),
    occurredAt: timestamp('occurred_at'),
    completedAt: timestamp('completed_at'),

    // Follow-up
    followUpRequired: boolean('follow_up_required').default(false),
    followUpDate: timestamp('follow_up_date'),
    followUpNotes: text('follow_up_notes'),

    // AI insights
    sentiment: text('sentiment'), // 'positive', 'neutral', 'negative'
    aiInsights: jsonb('ai_insights')
      .$type<{
        keyTopics?: string[];
        actionItems?: string[];
        nextSteps?: string[];
        riskIndicators?: string[];
      }>()
      .default({}),

    // Ownership
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    assignedTo: uuid('assigned_to').references(() => users.id),

    // Metadata
    tags: text('tags').array().default([]),
    attachments: jsonb('attachments')
      .$type<Array<{ name: string; url: string; size: number; type: string }>>()
      .default([]),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('crm_interaction_tenant_idx').on(table.workspaceId),
    typeIdx: index('crm_interaction_type_idx').on(table.type),
    contactIdx: index('crm_interaction_contact_idx').on(table.contactId),
    prospectIdx: index('crm_interaction_prospect_idx').on(table.prospectId),
    customerIdx: index('crm_interaction_customer_idx').on(table.customerId),
    createdByIdx: index('crm_interaction_created_by_idx').on(table.createdBy),
    occurredAtIdx: index('crm_interaction_occurred_at_idx').on(table.occurredAt),
    followUpIdx: index('crm_interaction_follow_up_idx').on(table.followUpDate),
  }),
);

// ============================================================================
// CRM - TASKS
// ============================================================================

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Basic info
    title: text('title').notNull(),
    description: text('description'),
    status: taskStatusEnum('status').notNull().default('todo'),
    priority: taskPriorityEnum('priority').notNull().default('medium'),

    // Relationships
    assignedTo: uuid('assigned_to').references(() => users.id),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    projectId: uuid('project_id').references(() => projects.id, {
      onDelete: 'set null',
    }),
    customerId: uuid('customer_id').references(() => customers.id, {
      onDelete: 'set null',
    }),

    // Scheduling
    dueDate: timestamp('due_date'),
    startDate: timestamp('start_date'),
    completedAt: timestamp('completed_at'),

    // Metadata
    tags: text('tags').array().default([]),
    attachments: jsonb('attachments')
      .$type<Array<{ name: string; url: string; size: number }>>()
      .default([]),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('task_tenant_idx').on(table.workspaceId),
    statusIdx: index('task_status_idx').on(table.status),
    priorityIdx: index('task_priority_idx').on(table.priority),
    assignedToIdx: index('task_assigned_to_idx').on(table.assignedTo),
    projectIdx: index('task_project_idx').on(table.projectId),
    dueDateIdx: index('task_due_date_idx').on(table.dueDate),
  }),
);

// ============================================================================
// CRM - CALENDAR EVENTS
// ============================================================================

export const calendarEvents = pgTable(
  'calendar_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Event info
    title: text('title').notNull(),
    description: text('description'),
    location: text('location'),
    meetingUrl: text('meeting_url'),

    // Timing
    startTime: timestamp('start_time').notNull(),
    endTime: timestamp('end_time').notNull(),
    timezone: text('timezone').default('America/Chicago'),
    isAllDay: boolean('is_all_day').default(false),

    // Recurrence
    isRecurring: boolean('is_recurring').default(false),
    recurrenceRule: text('recurrence_rule'), // RRULE format

    // Relationships
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    attendees: jsonb('attendees')
      .$type<Array<{ userId?: string; email: string; name: string; status: string }>>()
      .default([]),

    // Links
    customerId: uuid('customer_id').references(() => customers.id, {
      onDelete: 'set null',
    }),
    projectId: uuid('project_id').references(() => projects.id, {
      onDelete: 'set null',
    }),

    // Metadata
    tags: text('tags').array().default([]),
    reminders: jsonb('reminders').$type<Array<{ minutes: number; sent: boolean }>>().default([]),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('calendar_event_tenant_idx').on(table.workspaceId),
    startTimeIdx: index('calendar_event_start_time_idx').on(table.startTime),
    createdByIdx: index('calendar_event_created_by_idx').on(table.createdBy),
  }),
);

// ============================================================================
// BUSINESS - INVOICES
// ============================================================================

export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Basic info
    invoiceNumber: text('invoice_number').notNull(),
    status: invoiceStatusEnum('status').notNull().default('draft'),

    // Relationships
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    projectId: uuid('project_id').references(() => projects.id, {
      onDelete: 'set null',
    }),

    // Financial details
    subtotal: integer('subtotal').notNull(), // In cents
    tax: integer('tax').default(0), // In cents
    total: integer('total').notNull(), // In cents
    amountPaid: integer('amount_paid').default(0), // In cents
    currency: text('currency').notNull().default('USD'),

    // Line items
    items: jsonb('items')
      .$type<
        Array<{
          description: string;
          quantity: number;
          unitPrice: number;
          total: number;
        }>
      >()
      .notNull()
      .default([]),

    // Dates
    issueDate: timestamp('issue_date').notNull(),
    dueDate: timestamp('due_date').notNull(),
    paidAt: timestamp('paid_at'),

    // Metadata
    notes: text('notes'),
    terms: text('terms'),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('invoice_tenant_idx').on(table.workspaceId),
    statusIdx: index('invoice_status_idx').on(table.status),
    customerIdx: index('invoice_customer_idx').on(table.customerId),
    invoiceNumberIdx: uniqueIndex('invoice_number_idx').on(table.workspaceId, table.invoiceNumber),
  }),
);

// ============================================================================
// BUSINESS - EXPENSES (Local Expense Tracking)
// ============================================================================

export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Basic info
    description: text('description').notNull(),
    category: expenseCategoryEnum('category').notNull(),
    status: expenseStatusEnum('status').notNull().default('pending'),

    // Financial details
    amount: integer('amount').notNull(), // In cents
    currency: text('currency').notNull().default('USD'),
    taxAmount: integer('tax_amount').default(0), // In cents
    
    // Vendor/payee info
    vendor: text('vendor'),
    vendorId: uuid('vendor_id').references(() => customers.id, { onDelete: 'set null' }),

    // Project/customer association
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),

    // Dates
    expenseDate: timestamp('expense_date').notNull(),
    dueDate: timestamp('due_date'),
    paidDate: timestamp('paid_date'),

    // Payment details
    paymentMethod: text('payment_method'), // 'credit_card', 'bank_transfer', 'cash', 'check'
    referenceNumber: text('reference_number'), // Check number, transaction ID, etc.

    // Receipts and attachments
    receiptUrl: text('receipt_url'),
    attachments: jsonb('attachments')
      .$type<Array<{ name: string; url: string; size: number; type: string }>>()
      .default([]),

    // External sync
    externalId: text('external_id'), // QuickBooks, Stripe, etc.
    externalSource: text('external_source'), // 'quickbooks', 'stripe', 'manual'

    // Approval workflow
    submittedBy: uuid('submitted_by')
      .notNull()
      .references(() => users.id),
    approvedBy: uuid('approved_by').references(() => users.id),
    approvedAt: timestamp('approved_at'),
    rejectionReason: text('rejection_reason'),

    // Reimbursement
    isReimbursable: boolean('is_reimbursable').default(false),
    reimbursedAt: timestamp('reimbursed_at'),
    reimbursementAmount: integer('reimbursement_amount'), // In cents

    // Metadata
    tags: text('tags').array().default([]),
    notes: text('notes'),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('expense_tenant_idx').on(table.workspaceId),
    categoryIdx: index('expense_category_idx').on(table.category),
    statusIdx: index('expense_status_idx').on(table.status),
    vendorIdx: index('expense_vendor_idx').on(table.vendorId),
    projectIdx: index('expense_project_idx').on(table.projectId),
    expenseDateIdx: index('expense_date_idx').on(table.expenseDate),
    submittedByIdx: index('expense_submitted_by_idx').on(table.submittedBy),
    externalIdx: index('expense_external_idx').on(table.externalSource, table.externalId),
  }),
);

// ============================================================================
// BUSINESS - MARKETING CHANNELS
// ============================================================================

export const marketingChannels = pgTable(
  'marketing_channels',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key - REQUIRED FOR ALL QUERIES
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Channel info
    name: text('name').notNull(),
    type: marketingChannelTypeEnum('type').notNull(),
    status: marketingChannelStatusEnum('status').notNull().default('active'),
    description: text('description'),

    // Configuration (platform-specific settings)
    config: jsonb('config')
      .$type<{
        platformId?: string;
        credentials?: Record<string, string>;
        settings?: Record<string, unknown>;
      }>()
      .default({}),

    // Budget and spending
    budget: integer('budget'), // Monthly budget in cents
    spent: integer('spent').default(0), // Current month spent in cents

    // Performance metrics
    impressions: integer('impressions').default(0),
    clicks: integer('clicks').default(0),
    conversions: integer('conversions').default(0),
    revenue: integer('revenue').default(0), // In cents

    // Relationships
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('marketing_channel_tenant_idx').on(table.workspaceId),
    typeIdx: index('marketing_channel_type_idx').on(table.type),
    statusIdx: index('marketing_channel_status_idx').on(table.status),
  }),
);

// ============================================================================
// BUSINESS - CAMPAIGNS
// ============================================================================

export const campaigns = pgTable(
  'campaigns',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Campaign info
    name: text('name').notNull(),
    description: text('description'),
    status: campaignStatusEnum('status').notNull().default('draft'),
    type: text('type').notNull(), // 'email', 'social', 'ads', 'content'

    // Targeting
    segmentId: uuid('segment_id').references(() => segments.id, {
      onDelete: 'set null',
    }),
    targetAudience: jsonb('target_audience')
      .$type<{
        count?: number;
        criteria?: Record<string, any>;
      }>()
      .default({}),

    // Schedule
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'),
    scheduledFor: timestamp('scheduled_for'),

    // Content
    content: jsonb('content')
      .$type<{
        subject?: string;
        body?: string;
        images?: string[];
        links?: Array<{ url: string; label: string }>;
      }>()
      .default({}),

    // Performance
    sentCount: integer('sent_count').default(0),
    openCount: integer('open_count').default(0),
    clickCount: integer('click_count').default(0),
    conversionCount: integer('conversion_count').default(0),

    // Budget
    budget: integer('budget'), // In cents
    spent: integer('spent').default(0), // In cents

    // Relationships
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),

    // Metadata
    tags: text('tags').array().default([]),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('campaign_tenant_idx').on(table.workspaceId),
    statusIdx: index('campaign_status_idx').on(table.status),
    typeIdx: index('campaign_type_idx').on(table.type),
  }),
);

// ============================================================================
// BUSINESS - CAMPAIGN RECIPIENTS (Individual Send Tracking)
// ============================================================================

export const campaignRecipients = pgTable(
  'campaign_recipients',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Campaign reference
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => campaigns.id, { onDelete: 'cascade' }),

    // Recipient info (can be contact or prospect)
    contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
    prospectId: uuid('prospect_id').references(() => prospects.id, { onDelete: 'set null' }),
    email: text('email').notNull(),
    firstName: text('first_name'),
    lastName: text('last_name'),

    // Delivery status
    status: campaignRecipientStatusEnum('status').notNull().default('pending'),

    // Tracking timestamps
    sentAt: timestamp('sent_at'),
    deliveredAt: timestamp('delivered_at'),
    openedAt: timestamp('opened_at'),
    clickedAt: timestamp('clicked_at'),
    bouncedAt: timestamp('bounced_at'),
    unsubscribedAt: timestamp('unsubscribed_at'),
    complainedAt: timestamp('complained_at'),

    // Engagement metrics
    openCount: integer('open_count').default(0),
    clickCount: integer('click_count').default(0),
    
    // Tracking data
    clickedLinks: jsonb('clicked_links')
      .$type<Array<{ url: string; clickedAt: string }>>()
      .default([]),

    // Email provider tracking IDs
    externalMessageId: text('external_message_id'), // e.g., Resend message ID
    
    // Error info (for bounces/failures)
    errorCode: text('error_code'),
    errorMessage: text('error_message'),

    // Metadata
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('campaign_recipient_tenant_idx').on(table.workspaceId),
    campaignIdx: index('campaign_recipient_campaign_idx').on(table.campaignId),
    contactIdx: index('campaign_recipient_contact_idx').on(table.contactId),
    prospectIdx: index('campaign_recipient_prospect_idx').on(table.prospectId),
    emailIdx: index('campaign_recipient_email_idx').on(table.email),
    statusIdx: index('campaign_recipient_status_idx').on(table.status),
    // Unique constraint: one recipient per email per campaign
    uniqueRecipient: uniqueIndex('campaign_recipient_unique_idx').on(table.campaignId, table.email),
  }),
);

// ============================================================================
// BUSINESS - SEGMENTS
// ============================================================================

export const segments = pgTable(
  'segments',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Segment info
    name: text('name').notNull(),
    description: text('description'),

    // Criteria (filter rules)
    criteria: jsonb('criteria')
      .$type<{
        rules: Array<{
          field: string;
          operator: string;
          value: any;
        }>;
        logic?: 'and' | 'or';
      }>()
      .notNull()
      .default({ rules: [] }),

    // Stats
    memberCount: integer('member_count').default(0),
    lastCalculatedAt: timestamp('last_calculated_at'),

    // Metadata
    isActive: boolean('is_active').default(true),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('segment_tenant_idx').on(table.workspaceId),
    activeIdx: index('segment_active_idx').on(table.isActive),
  }),
);

// ============================================================================
// CRM - AUTOMATION RULES
// ============================================================================

export const automationRules = pgTable(
  'automation_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Basic info
    name: text('name').notNull(),
    description: text('description'),
    status: automationStatusEnum('status').notNull().default('draft'),

    // Trigger configuration
    triggerType: automationTriggerTypeEnum('trigger_type').notNull(),
    triggerConfig: jsonb('trigger_config')
      .$type<{
        // For stage changes
        fromStage?: string;
        toStage?: string;
        // For scheduled triggers
        schedule?: string; // Cron expression
        // For webhook triggers
        webhookUrl?: string;
        // Common filters
        filters?: Array<{
          field: string;
          operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
          value: string | number | boolean;
        }>;
      }>()
      .notNull()
      .default({}),

    // Actions to perform (executed in order)
    actions: jsonb('actions')
      .$type<Array<{
        type: string; // One of automationActionTypeEnum values
        config: {
          // For send_email
          templateId?: string;
          emailSubject?: string;
          emailBody?: string;
          // For create_task
          taskTitle?: string;
          taskDescription?: string;
          assignTo?: string;
          dueIn?: number; // Days
          // For update_field
          field?: string;
          value?: string | number | boolean;
          // For add/remove_tag
          tag?: string;
          // For assign_owner
          ownerId?: string;
          // For wait
          duration?: number; // Minutes
          // For webhook
          webhookUrl?: string;
          webhookMethod?: 'GET' | 'POST' | 'PUT';
          webhookHeaders?: Record<string, string>;
          webhookPayload?: Record<string, unknown>;
        };
      }>>()
      .notNull()
      .default([]),

    // Execution settings
    isEnabled: boolean('is_enabled').notNull().default(true),
    maxExecutionsPerDay: integer('max_executions_per_day').default(100),
    cooldownMinutes: integer('cooldown_minutes').default(0), // Minutes between executions for same entity
    
    // Stats
    executionCount: integer('execution_count').notNull().default(0),
    lastExecutedAt: timestamp('last_executed_at'),
    successCount: integer('success_count').notNull().default(0),
    failureCount: integer('failure_count').notNull().default(0),

    // Ownership
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('automation_rule_tenant_idx').on(table.workspaceId),
    statusIdx: index('automation_rule_status_idx').on(table.status),
    triggerTypeIdx: index('automation_rule_trigger_type_idx').on(table.triggerType),
    enabledIdx: index('automation_rule_enabled_idx').on(table.isEnabled),
  }),
);

// ============================================================================
// CRM - AUTOMATION EXECUTIONS (Audit Trail)
// ============================================================================

export const automationExecutions = pgTable(
  'automation_executions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Automation reference
    automationId: uuid('automation_id')
      .notNull()
      .references(() => automationRules.id, { onDelete: 'cascade' }),

    // Entity that triggered the automation
    entityType: text('entity_type').notNull(), // 'contact', 'prospect', 'deal', 'task'
    entityId: uuid('entity_id').notNull(),

    // Execution result
    status: executionStatusEnum('status').notNull().default('pending'),
    
    // Action results
    actionResults: jsonb('action_results')
      .$type<Array<{
        actionIndex: number;
        status: 'success' | 'failed' | 'skipped';
        result?: Record<string, unknown>;
        error?: string;
        executedAt: string;
      }>>()
      .default([]),

    // Error info
    error: text('error'),

    // Timestamps
    startedAt: timestamp('started_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('automation_execution_tenant_idx').on(table.workspaceId),
    automationIdx: index('automation_execution_automation_idx').on(table.automationId),
    entityIdx: index('automation_execution_entity_idx').on(table.entityType, table.entityId),
    statusIdx: index('automation_execution_status_idx').on(table.status),
    startedAtIdx: index('automation_execution_started_at_idx').on(table.startedAt),
  }),
);

// ============================================================================
// CRM - DEALS (Sales Pipeline)
// ============================================================================

export const deals = pgTable(
  'deals',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Basic info
    title: text('title').notNull(),
    description: text('description'),

    // Pipeline stage
    stage: dealStageEnum('stage').notNull().default('qualification'),
    priority: dealPriorityEnum('priority').notNull().default('medium'),

    // Financial
    value: integer('value').notNull().default(0), // In cents
    currency: text('currency').notNull().default('USD'),
    probability: integer('probability').default(50), // 0-100 percentage

    // Related entities
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
    contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
    prospectId: uuid('prospect_id').references(() => prospects.id, { onDelete: 'set null' }),

    // Ownership
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id),
    
    // Team members (for collaborative deals)
    teamMembers: jsonb('team_members')
      .$type<Array<{ userId: string; role: string }>>()
      .default([]),

    // Dates
    expectedCloseDate: timestamp('expected_close_date'),
    actualCloseDate: timestamp('actual_close_date'),

    // Win/Loss info
    closedReason: text('closed_reason'), // 'budget', 'competition', 'timing', 'champion_left', etc.
    competitorId: text('competitor_id'),
    competitorName: text('competitor_name'),

    // Products/services (line items)
    lineItems: jsonb('line_items')
      .$type<Array<{
        name: string;
        description?: string;
        quantity: number;
        unitPrice: number; // In cents
        discount?: number; // Percentage
        total: number; // In cents
      }>>()
      .default([]),

    // AI insights
    aiRiskScore: integer('ai_risk_score'), // 0-100
    aiRiskFactors: jsonb('ai_risk_factors')
      .$type<Array<{ factor: string; severity: 'low' | 'medium' | 'high' }>>()
      .default([]),
    aiNextBestAction: text('ai_next_best_action'),
    aiWinProbability: integer('ai_win_probability'), // 0-100

    // Activity tracking
    lastActivityAt: timestamp('last_activity_at'),
    nextFollowUpAt: timestamp('next_follow_up_at'),
    daysSinceLastActivity: integer('days_since_last_activity').default(0),

    // Metadata
    source: text('source'), // 'website', 'referral', 'campaign', 'inbound', 'outbound'
    tags: text('tags').array().default([]),
    customFields: jsonb('custom_fields').$type<Record<string, unknown>>().default({}),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('deal_tenant_idx').on(table.workspaceId),
    stageIdx: index('deal_stage_idx').on(table.stage),
    ownerIdx: index('deal_owner_idx').on(table.ownerId),
    customerIdx: index('deal_customer_idx').on(table.customerId),
    contactIdx: index('deal_contact_idx').on(table.contactId),
    prospectIdx: index('deal_prospect_idx').on(table.prospectId),
    expectedCloseIdx: index('deal_expected_close_idx').on(table.expectedCloseDate),
    valueIdx: index('deal_value_idx').on(table.value),
    probabilityIdx: index('deal_probability_idx').on(table.probability),
    lastActivityIdx: index('deal_last_activity_idx').on(table.lastActivityAt),
  }),
);

// ============================================================================
// BUSINESS - EXPORTS
// ============================================================================

export const dataExports = pgTable(
  'exports',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Export info
    name: text('name').notNull(),
    resourceType: text('resource_type').notNull(), // 'customers', 'contacts', etc
    format: text('format').notNull().default('csv'), // 'csv', 'json', 'xlsx'
    status: jobStatusEnum('status').notNull().default('pending'),

    // Configuration
    filters: jsonb('filters').$type<Record<string, any>>().default({}),
    columns: text('columns').array(), // Specific columns to export

    // Results
    fileUrl: text('file_url'),
    fileSize: integer('file_size'), // In bytes
    recordCount: integer('record_count'),

    // Error handling
    error: text('error'),

    // Relationships
    requestedBy: uuid('requested_by')
      .notNull()
      .references(() => users.id),

    // Timestamps
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    expiresAt: timestamp('expires_at'), // Auto-delete after expiry
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('export_tenant_idx').on(table.workspaceId),
    statusIdx: index('export_status_idx').on(table.status),
    requestedByIdx: index('export_requested_by_idx').on(table.requestedBy),
  }),
);

// ============================================================================
// BUSINESS - IMPORTS
// ============================================================================

export const dataImports = pgTable(
  'imports',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Import info
    name: text('name').notNull(),
    resourceType: text('resource_type').notNull(), // 'customers', 'contacts', etc
    status: jobStatusEnum('status').notNull().default('pending'),

    // File info
    fileName: text('file_name').notNull(),
    fileSize: integer('file_size'), // In bytes
    fileUrl: text('file_url'),

    // Mapping
    columnMapping: jsonb('column_mapping').$type<Record<string, string>>().default({}),

    // Results
    totalRows: integer('total_rows'),
    successfulRows: integer('successful_rows').default(0),
    failedRows: integer('failed_rows').default(0),
    errors: jsonb('errors').$type<Array<{ row: number; error: string }>>().default([]),

    // Error handling
    error: text('error'),

    // Relationships
    requestedBy: uuid('requested_by')
      .notNull()
      .references(() => users.id),

    // Timestamps
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('import_tenant_idx').on(table.workspaceId),
    statusIdx: index('import_status_idx').on(table.status),
    requestedByIdx: index('import_requested_by_idx').on(table.requestedBy),
  }),
);

// ============================================================================
// COMMUNICATION - INBOX MESSAGES
// ============================================================================

export const inboxMessages = pgTable(
  'inbox_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Message info
    channel: inboxChannelEnum('channel').notNull(),
    subject: text('subject'),
    body: text('body').notNull(),
    status: inboxStatusEnum('status').notNull().default('unread'),

    // Sender/Receiver
    senderId: uuid('sender_id').references(() => users.id),
    senderEmail: text('sender_email'),
    senderName: text('sender_name'),
    recipientIds: jsonb('recipient_ids').$type<string[]>().default([]),

    // Thread
    threadId: text('thread_id'), // For grouping related messages
    replyToId: text('reply_to_id'), // Self-reference to parent message

    // Metadata
    metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
    attachments: jsonb('attachments')
      .$type<Array<{ name: string; url: string; size: number }>>()
      .default([]),

    // Timestamps
    readAt: timestamp('read_at'),
    archivedAt: timestamp('archived_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('inbox_message_tenant_idx').on(table.workspaceId),
    statusIdx: index('inbox_message_status_idx').on(table.status),
    threadIdx: index('inbox_message_thread_idx').on(table.threadId),
  }),
);

// ============================================================================
// COMMUNICATION - EMAIL THREADS
// ============================================================================

export const emailThreads = pgTable(
  'email_threads',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Thread info
    subject: text('subject').notNull(),
    snippet: text('snippet'), // First few lines
    messageCount: integer('message_count').default(0),

    // Participants
    participants: jsonb('participants')
      .$type<Array<{ email: string; name?: string }>>()
      .default([]),

    // Status
    isStarred: boolean('is_starred').default(false),
    isRead: boolean('is_read').default(false),
    folder: text('folder').default('inbox'), // 'inbox', 'sent', 'drafts', 'trash'

    // Labels
    labels: text('labels').array().default([]),

    // Timestamps
    lastMessageAt: timestamp('last_message_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('email_thread_tenant_idx').on(table.workspaceId),
    folderIdx: index('email_thread_folder_idx').on(table.folder),
    lastMessageIdx: index('email_thread_last_message_idx').on(table.lastMessageAt),
  }),
);

// ============================================================================
// COMMUNICATION - CHAT MESSAGES
// ============================================================================

export const chatMessages = pgTable(
  'chat_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Message info
    content: text('content').notNull(),
    type: text('type').default('text'), // 'text', 'image', 'file', 'system'

    // Sender/Receiver
    senderId: uuid('sender_id')
      .notNull()
      .references(() => users.id),
    recipientId: uuid('recipient_id').references(() => users.id),
    groupId: text('group_id'), // For group chats

    // Thread
    replyToId: text('reply_to_id'), // Self-reference to parent message

    // Metadata
    attachments: jsonb('attachments')
      .$type<Array<{ type: string; url: string; filename?: string }>>()
      .default([]),
    reactions: jsonb('reactions')
      .$type<Record<string, string[]>>() // emoji -> userIds[]
      .default({}),

    // Edit history
    isEdited: boolean('is_edited').default(false),
    editedAt: timestamp('edited_at'),

    // Status
    isDeleted: boolean('is_deleted').default(false),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('chat_message_tenant_idx').on(table.workspaceId),
    senderIdx: index('chat_message_sender_idx').on(table.senderId),
    recipientIdx: index('chat_message_recipient_idx').on(table.recipientId),
    groupIdx: index('chat_message_group_idx').on(table.groupId),
    createdAtIdx: index('chat_message_created_at_idx').on(table.createdAt),
  }),
);

// ============================================================================
// COMMUNICATION - NOTIFICATIONS
// ============================================================================

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Notification info
    type: notificationTypeEnum('type').notNull(),
    title: text('title').notNull(),
    message: text('message').notNull(),

    // Action
    actionUrl: text('action_url'),
    actionLabel: text('action_label'),

    // Metadata
    metadata: jsonb('metadata').$type<Record<string, any>>().default({}),

    // Status
    isRead: boolean('is_read').default(false),
    isDismissed: boolean('is_dismissed').default(false),

    // Timestamps
    readAt: timestamp('read_at'),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantUserIdx: index('notification_tenant_user_idx').on(table.workspaceId, table.userId),
    userIdx: index('notification_user_idx').on(table.userId),
    typeIdx: index('notification_type_idx').on(table.type),
    isReadIdx: index('notification_is_read_idx').on(table.isRead),
  }),
);

// ============================================================================
// COMMUNICATION - CONVERSATIONS (Unified Hub)
// ============================================================================

export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Conversation info
    channel: conversationChannelEnum('channel').notNull(),
    status: conversationStatusEnum('status').notNull().default('active'),
    subject: text('subject'), // For email threads
    snippet: text('snippet'), // Preview text

    // External IDs (for syncing with external services)
    externalId: text('external_id'), // Gmail thread ID, Twilio conversation SID, etc.
    externalMetadata: jsonb('external_metadata').$type<Record<string, any>>().default({}),

    // Status tracking
    isUnread: boolean('is_unread').default(true),
    isStarred: boolean('is_starred').default(false),
    isPinned: boolean('is_pinned').default(false),
    unreadCount: integer('unread_count').default(0),
    messageCount: integer('message_count').default(0),

    // Assignment
    assignedTo: uuid('assigned_to').references(() => users.id),

    // Labels/Tags
    labels: text('labels').array().default([]),
    tags: text('tags').array().default([]),

    // Timestamps
    lastMessageAt: timestamp('last_message_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('conversation_tenant_idx').on(table.workspaceId),
    channelIdx: index('conversation_channel_idx').on(table.channel),
    statusIdx: index('conversation_status_idx').on(table.status),
    assignedToIdx: index('conversation_assigned_to_idx').on(table.assignedTo),
    lastMessageIdx: index('conversation_last_message_idx').on(table.lastMessageAt),
    externalIdIdx: index('conversation_external_id_idx').on(table.externalId),
  }),
);

export const conversationMessages = pgTable(
  'conversation_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Conversation reference
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),

    // Message content
    body: text('body').notNull(),
    subject: text('subject'), // For emails
    htmlBody: text('html_body'), // Rich HTML content

    // Direction
    direction: text('direction').notNull(), // 'inbound' or 'outbound'
    isFromCustomer: boolean('is_from_customer').default(true),

    // Sender/Recipient info
    senderId: uuid('sender_id').references(() => users.id), // Internal user
    senderEmail: text('sender_email'),
    senderName: text('sender_name'),
    senderPhone: text('sender_phone'),
    recipientEmail: text('recipient_email'),
    recipientPhone: text('recipient_phone'),

    // External IDs
    externalId: text('external_id'), // Gmail message ID, Twilio message SID, etc.
    externalMetadata: jsonb('external_metadata').$type<Record<string, any>>().default({}),

    // Threading (self-reference handled via relations to avoid circular type inference)
    replyToId: uuid('reply_to_id'),

    // Attachments
    attachments: jsonb('attachments')
      .$type<Array<{ name: string; url: string; size: number; type: string }>>()
      .default([]),

    // Status
    isRead: boolean('is_read').default(false),
    isDelivered: boolean('is_delivered').default(false),
    isFailed: boolean('is_failed').default(false),
    failureReason: text('failure_reason'),

    // Call-specific (for call logs)
    callDuration: integer('call_duration'), // in seconds
    callRecordingUrl: text('call_recording_url'),
    callTranscription: text('call_transcription'),

    // Timestamps
    readAt: timestamp('read_at'),
    deliveredAt: timestamp('delivered_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('conversation_message_tenant_idx').on(table.workspaceId),
    conversationIdx: index('conversation_message_conversation_idx').on(table.conversationId),
    senderIdx: index('conversation_message_sender_idx').on(table.senderId),
    createdAtIdx: index('conversation_message_created_at_idx').on(table.createdAt),
    externalIdIdx: index('conversation_message_external_id_idx').on(table.externalId),
  }),
);

export const conversationParticipants = pgTable(
  'conversation_participants',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Conversation reference
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),

    // Link to CRM entities (optional - can be null for unknown contacts)
    contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
    prospectId: uuid('prospect_id').references(() => prospects.id, { onDelete: 'set null' }),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }), // Internal team member

    // Contact info (for when not linked to CRM)
    email: text('email'),
    phone: text('phone'),
    name: text('name'),

    // Role
    role: text('role').default('participant'), // 'participant', 'cc', 'bcc' (for emails)

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('conversation_participant_tenant_idx').on(table.workspaceId),
    conversationIdx: index('conversation_participant_conversation_idx').on(table.conversationId),
    contactIdx: index('conversation_participant_contact_idx').on(table.contactId),
    prospectIdx: index('conversation_participant_prospect_idx').on(table.prospectId),
    customerIdx: index('conversation_participant_customer_idx').on(table.customerId),
    emailIdx: index('conversation_participant_email_idx').on(table.email),
    phoneIdx: index('conversation_participant_phone_idx').on(table.phone),
  }),
);

// ============================================================================
// TEAM MESSAGING - Internal Communication
// ============================================================================

export const teamChannelTypeEnum = pgEnum('team_channel_type', ['general', 'direct', 'group', 'announcement']);

export const teamChannels = pgTable(
  'team_channels',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Channel info
    name: text('name').notNull(),
    description: text('description'),
    type: teamChannelTypeEnum('type').notNull().default('general'),

    // For direct messages - stores sorted user IDs to ensure uniqueness
    dmParticipantIds: text('dm_participant_ids'), // comma-separated user IDs for DMs

    // Settings
    isPrivate: boolean('is_private').default(false),
    isArchived: boolean('is_archived').default(false),

    // Stats
    messageCount: integer('message_count').default(0),
    lastMessageAt: timestamp('last_message_at'),

    // Relationships
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('team_channel_tenant_idx').on(table.workspaceId),
    typeIdx: index('team_channel_type_idx').on(table.type),
    dmIdx: index('team_channel_dm_idx').on(table.dmParticipantIds),
  }),
);

export const teamMessages = pgTable(
  'team_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Channel reference
    channelId: uuid('channel_id')
      .notNull()
      .references(() => teamChannels.id, { onDelete: 'cascade' }),

    // Sender
    senderId: uuid('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Message content
    content: text('content').notNull(),
    
    // Reply threading
    replyToId: uuid('reply_to_id'),
    
    // Attachments
    attachments: jsonb('attachments').$type<Array<{
      type: 'file' | 'image' | 'link';
      url: string;
      name?: string;
      size?: number;
      mimeType?: string;
    }>>().default([]),

    // Reactions (emoji reactions from team members)
    reactions: jsonb('reactions').$type<Record<string, string[]>>().default({}), // { "👍": ["user-id-1", "user-id-2"] }

    // Status
    isEdited: boolean('is_edited').default(false),
    isDeleted: boolean('is_deleted').default(false),
    editedAt: timestamp('edited_at'),
    deletedAt: timestamp('deleted_at'),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('team_message_tenant_idx').on(table.workspaceId),
    channelIdx: index('team_message_channel_idx').on(table.channelId),
    senderIdx: index('team_message_sender_idx').on(table.senderId),
    createdAtIdx: index('team_message_created_at_idx').on(table.createdAt),
  }),
);

export const teamChannelMembers = pgTable(
  'team_channel_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Channel reference
    channelId: uuid('channel_id')
      .notNull()
      .references(() => teamChannels.id, { onDelete: 'cascade' }),

    // User reference
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Role in channel
    role: text('role').default('member'), // 'admin', 'member'

    // Read status
    lastReadAt: timestamp('last_read_at'),
    lastReadMessageId: uuid('last_read_message_id'),

    // Notifications
    isMuted: boolean('is_muted').default(false),

    // Timestamps
    joinedAt: timestamp('joined_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('team_channel_member_tenant_idx').on(table.workspaceId),
    channelIdx: index('team_channel_member_channel_idx').on(table.channelId),
    userIdx: index('team_channel_member_user_idx').on(table.userId),
    uniqueMembership: index('team_channel_member_unique_idx').on(table.channelId, table.userId),
  }),
);

// Relations for team messaging
export const teamChannelsRelations = relations(teamChannels, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [teamChannels.workspaceId],
    references: [workspaces.id],
  }),
  createdByUser: one(users, {
    fields: [teamChannels.createdBy],
    references: [users.id],
  }),
  messages: many(teamMessages),
  members: many(teamChannelMembers),
}));

export const teamMessagesRelations = relations(teamMessages, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [teamMessages.workspaceId],
    references: [workspaces.id],
  }),
  channel: one(teamChannels, {
    fields: [teamMessages.channelId],
    references: [teamChannels.id],
  }),
  sender: one(users, {
    fields: [teamMessages.senderId],
    references: [users.id],
  }),
  replyTo: one(teamMessages, {
    fields: [teamMessages.replyToId],
    references: [teamMessages.id],
  }),
}));

export const teamChannelMembersRelations = relations(teamChannelMembers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [teamChannelMembers.workspaceId],
    references: [workspaces.id],
  }),
  channel: one(teamChannels, {
    fields: [teamChannelMembers.channelId],
    references: [teamChannels.id],
  }),
  user: one(users, {
    fields: [teamChannelMembers.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// LAUNCHPAD - BLOG SYSTEM
// ============================================================================

// Blog Categories (newspaper-style sections)
export const blogCategories = pgTable(
  'blog_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    icon: text('icon'), // Lucide icon name
    color: text('color'), // Hex color for category badge
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('blog_categories_slug_idx').on(table.slug),
    index('blog_categories_sort_order_idx').on(table.sortOrder),
  ]
);

// Blog Tags (fine-grained topics)
export const blogTags = pgTable(
  'blog_tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('blog_tags_slug_idx').on(table.slug),
  ]
);

// Blog Posts
export const blogPosts = pgTable(
  'blog_posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Content
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    excerpt: text('excerpt'), // Short summary for cards
    content: text('content').notNull(), // HTML from Tiptap
    
    // Categorization
    categoryId: uuid('category_id').references(() => blogCategories.id),
    contentType: blogPostContentTypeEnum('content_type').notNull().default('article'),
    
    // Authorship
    authorId: uuid('author_id').references(() => users.id),
    
    // Status & Scheduling
    status: blogPostStatusEnum('status').notNull().default('draft'),
    publishedAt: timestamp('published_at'),
    scheduledAt: timestamp('scheduled_at'),
    
    // Display
    featured: boolean('featured').notNull().default(false),
    featuredImage: text('featured_image'), // URL to image
    readingTimeMinutes: integer('reading_time_minutes'),
    
    // SEO
    metaTitle: text('meta_title'),
    metaDescription: text('meta_description'),
    ogImage: text('og_image'),
    
    // Analytics
    viewCount: integer('view_count').notNull().default(0),
    
    // Article Studio - Outline and Layout
    outline: jsonb('outline').$type<{
      sections: Array<{
        id: string;
        title: string;
        type: 'intro' | 'body' | 'conclusion' | 'cta';
        bullets?: string[];
        wordCount?: number;
      }>;
    }>(),
    layoutTemplate: articleLayoutTemplateEnum('layout_template'),
    
    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('blog_posts_slug_idx').on(table.slug),
    index('blog_posts_category_idx').on(table.categoryId),
    index('blog_posts_status_idx').on(table.status),
    index('blog_posts_published_at_idx').on(table.publishedAt),
    index('blog_posts_featured_idx').on(table.featured),
    index('blog_posts_author_idx').on(table.authorId),
    index('blog_posts_layout_template_idx').on(table.layoutTemplate),
  ]
);

// Blog Post Tags (many-to-many)
export const blogPostTags = pgTable(
  'blog_post_tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: uuid('post_id').notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id').notNull().references(() => blogTags.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('blog_post_tags_post_idx').on(table.postId),
    index('blog_post_tags_tag_idx').on(table.tagId),
    uniqueIndex('blog_post_tags_unique_idx').on(table.postId, table.tagId),
  ]
);

// Blog Collections (curated reading lists)
export const blogCollections = pgTable(
  'blog_collections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    authorId: uuid('author_id').references(() => users.id),
    isFeatured: boolean('is_featured').notNull().default(false),
    isPublished: boolean('is_published').notNull().default(false),
    coverImage: text('cover_image'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('blog_collections_slug_idx').on(table.slug),
    index('blog_collections_featured_idx').on(table.isFeatured),
  ]
);

// Blog Collection Posts (many-to-many with ordering)
export const blogCollectionPosts = pgTable(
  'blog_collection_posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    collectionId: uuid('collection_id').notNull().references(() => blogCollections.id, { onDelete: 'cascade' }),
    postId: uuid('post_id').notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('blog_collection_posts_collection_idx').on(table.collectionId),
    index('blog_collection_posts_post_idx').on(table.postId),
    uniqueIndex('blog_collection_posts_unique_idx').on(table.collectionId, table.postId),
  ]
);

// ============================================================================
// LAUNCHPAD - USER ENGAGEMENT
// ============================================================================

// Reading Progress (track where user left off)
export const blogReadingProgress = pgTable(
  'blog_reading_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(), // Clerk user ID
    postId: uuid('post_id').notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
    progressPercent: integer('progress_percent').notNull().default(0),
    completed: boolean('completed').notNull().default(false),
    lastReadAt: timestamp('last_read_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('blog_reading_progress_user_idx').on(table.userId),
    index('blog_reading_progress_post_idx').on(table.postId),
    uniqueIndex('blog_reading_progress_unique_idx').on(table.userId, table.postId),
  ]
);

// Bookmarks (save for later)
export const blogBookmarks = pgTable(
  'blog_bookmarks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(), // Clerk user ID
    postId: uuid('post_id').notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('blog_bookmarks_user_idx').on(table.userId),
    index('blog_bookmarks_post_idx').on(table.postId),
    uniqueIndex('blog_bookmarks_unique_idx').on(table.userId, table.postId),
  ]
);

// Reactions (was this helpful?)
export const blogReactions = pgTable(
  'blog_reactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(), // Clerk user ID
    postId: uuid('post_id').notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
    type: blogReactionTypeEnum('type').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('blog_reactions_user_idx').on(table.userId),
    index('blog_reactions_post_idx').on(table.postId),
    uniqueIndex('blog_reactions_unique_idx').on(table.userId, table.postId),
  ]
);

// User Preferences (for personalization)
export const blogUserPreferences = pgTable(
  'blog_user_preferences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().unique(), // Clerk user ID
    preferredCategories: jsonb('preferred_categories').$type<string[]>().default([]),
    preferredTags: jsonb('preferred_tags').$type<string[]>().default([]),
    emailNewsletter: boolean('email_newsletter').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('blog_user_preferences_user_idx').on(table.userId),
  ]
);

// ============================================================================
// ARTICLE STUDIO - AI-ASSISTED ARTICLE CREATION
// ============================================================================

// Topic Ideas Bank - Store generated and saved topic ideas
export const topicIdeas = pgTable(
  'topic_ideas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Multi-tenant key - REQUIRED FOR ALL QUERIES
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    
    title: text('title').notNull(),
    description: text('description'),
    whyItWorks: text('why_it_works'), // AI explanation of why this topic is good
    
    generatedBy: topicIdeaGeneratedByEnum('generated_by').notNull().default('user'),
    status: topicIdeaStatusEnum('status').notNull().default('saved'),
    
    // Optional link to resulting post
    resultingPostId: uuid('resulting_post_id').references(() => blogPosts.id),
    
    // Source context (e.g., from brainstorm session)
    sourceConversation: jsonb('source_conversation').$type<{
      sessionId?: string;
      keyPoints?: string[];
    }>(),
    
    // Categorization
    category: text('category'), // e.g., "Tutorial", "News", "Opinion"
    suggestedLayout: articleLayoutTemplateEnum('suggested_layout'),
    
    // AI metadata
    aiPrompt: text('ai_prompt'), // Original prompt used to generate
    
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('topic_ideas_workspace_idx').on(table.workspaceId),
    index('topic_ideas_status_idx').on(table.status),
    index('topic_ideas_generated_by_idx').on(table.generatedBy),
    index('topic_ideas_category_idx').on(table.category),
  ]
);

// Blog Voice Profile - Workspace-specific writing style
export const blogVoiceProfiles = pgTable(
  'blog_voice_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // One profile per workspace
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' })
      .unique(),
    
    // Voice characteristics
    toneDescriptors: jsonb('tone_descriptors').$type<string[]>().default([]),
    examplePhrases: jsonb('example_phrases').$type<string[]>().default([]),
    avoidPhrases: jsonb('avoid_phrases').$type<string[]>().default([]),
    
    // Style metrics
    avgSentenceLength: integer('avg_sentence_length'),
    
    // Structure preferences
    structurePreferences: jsonb('structure_preferences').$type<{
      preferredIntroStyle?: string;
      preferredConclusionStyle?: string;
      usesSubheadings?: boolean;
      usesBulletPoints?: boolean;
      includesCallToAction?: boolean;
    }>(),
    
    // Analysis metadata
    analyzedPostCount: integer('analyzed_post_count').default(0),
    lastAnalyzedAt: timestamp('last_analyzed_at'),
    
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('blog_voice_profiles_workspace_idx').on(table.workspaceId),
  ]
);

// Article Sources - Track sources and citations for posts
export const articleSources = pgTable(
  'article_sources',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Link to post
    postId: uuid('post_id')
      .notNull()
      .references(() => blogPosts.id, { onDelete: 'cascade' }),
    
    // Source details
    title: text('title').notNull(),
    url: text('url'),
    publication: text('publication'), // e.g., "TechCrunch", "Harvard Business Review"
    publishedDate: timestamp('published_date'),
    
    // What was used from this source
    quoteUsed: text('quote_used'),
    claimSupported: text('claim_supported'), // The claim this source supports
    
    // Verification
    verified: boolean('verified').notNull().default(false),
    verificationStatus: articleSourceVerificationEnum('verification_status').default('unverified'),
    verificationMethod: text('verification_method'), // e.g., "web_search", "manual"
    verificationNotes: text('verification_notes'),
    verifiedAt: timestamp('verified_at'),
    
    // Position in article (for inline citations)
    inlinePosition: integer('inline_position'), // Character position in content
    
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('article_sources_post_idx').on(table.postId),
    index('article_sources_verified_idx').on(table.verified),
  ]
);

// Brainstorm Sessions - Store brainstorm conversations
export const brainstormSessions = pgTable(
  'brainstorm_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Multi-tenant key - REQUIRED FOR ALL QUERIES
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    
    // Session title (auto-generated or user-set)
    title: text('title'),
    
    // Conversation history
    messages: jsonb('messages').$type<Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: string;
    }>>().default([]),
    
    // Results
    resultingTopicId: uuid('resulting_topic_id').references(() => topicIdeas.id),
    resultingPostId: uuid('resulting_post_id').references(() => blogPosts.id),
    
    // Key insights extracted from conversation
    keyInsights: jsonb('key_insights').$type<string[]>().default([]),
    suggestedAngle: text('suggested_angle'),
    
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('brainstorm_sessions_workspace_idx').on(table.workspaceId),
    index('brainstorm_sessions_user_idx').on(table.userId),
  ]
);

// ============================================================================
// CREATOR - CONTENT CREATION
// ============================================================================

// Creator items (documents, newsletters, social posts, etc.)
export const creatorItems = pgTable(
  'creator_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Multi-tenant key - REQUIRED FOR ALL QUERIES
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    
    title: text('title').notNull(),
    type: text('type').notNull(), // newsletter, blog, social, proposal, document, presentation, brand-kit, image
    
    // Document content structure
    content: jsonb('content')
      .$type<{
        sections: Array<{
          id: string;
          type: 'title' | 'heading' | 'paragraph' | 'list' | 'cta';
          content: string;
          editable: boolean;
        }>;
      }>()
      .notNull(),
    
    // Metadata from guided session
    metadata: jsonb('metadata')
      .$type<Record<string, string>>()
      .default({}),
    
    starred: boolean('starred').notNull().default(false),
    
    // Gamma.app integration
    gammaUrl: text('gamma_url'), // if polished with Gamma
    gammaEditUrl: text('gamma_edit_url'),
    
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('creator_items_workspace_idx').on(table.workspaceId),
    index('creator_items_user_idx').on(table.userId),
    index('creator_items_type_idx').on(table.type),
    index('creator_items_starred_idx').on(table.starred),
    index('creator_items_created_at_idx').on(table.createdAt),
  ]
);

// User-defined collections
export const creatorCollections = pgTable(
  'creator_collections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Multi-tenant key - REQUIRED FOR ALL QUERIES
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    
    name: text('name').notNull(),
    description: text('description'),
    color: text('color'), // CSS color value
    
    isAuto: boolean('is_auto').notNull().default(false), // auto-organized by type
    
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('creator_collections_workspace_idx').on(table.workspaceId),
    index('creator_collections_name_idx').on(table.name),
  ]
);

// Many-to-many: items in collections
export const creatorItemCollections = pgTable(
  'creator_item_collections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    itemId: uuid('item_id')
      .notNull()
      .references(() => creatorItems.id, { onDelete: 'cascade' }),
    collectionId: uuid('collection_id')
      .notNull()
      .references(() => creatorCollections.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('creator_item_collections_item_idx').on(table.itemId),
    index('creator_item_collections_collection_idx').on(table.collectionId),
    uniqueIndex('creator_item_collections_unique_idx').on(table.itemId, table.collectionId),
  ]
);

// Templates library
export const creatorTemplates = pgTable(
  'creator_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    name: text('name').notNull(),
    description: text('description'),
    type: text('type').notNull(), // newsletter, blog, social, proposal, etc.
    category: text('category'), // email, social, brand, etc.
    
    // Template structure
    content: jsonb('content')
      .$type<{
        sections: Array<{
          id: string;
          type: 'title' | 'heading' | 'paragraph' | 'list' | 'cta';
          content: string;
          editable: boolean;
        }>;
        variables?: Record<string, string>; // Placeholder variables
      }>()
      .notNull(),
    
    thumbnail: text('thumbnail'), // URL to preview image
    
    isPremium: boolean('is_premium').notNull().default(false),
    usageCount: integer('usage_count').notNull().default(0),
    
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('creator_templates_type_idx').on(table.type),
    index('creator_templates_category_idx').on(table.category),
    index('creator_templates_premium_idx').on(table.isPremium),
  ]
);

// ============================================================================
// CAMPAIGN RECIPIENTS - RELATIONS
// ============================================================================

export const campaignRecipientsRelations = relations(campaignRecipients, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [campaignRecipients.workspaceId],
    references: [workspaces.id],
  }),
  campaign: one(campaigns, {
    fields: [campaignRecipients.campaignId],
    references: [campaigns.id],
  }),
  contact: one(contacts, {
    fields: [campaignRecipients.contactId],
    references: [contacts.id],
  }),
  prospect: one(prospects, {
    fields: [campaignRecipients.prospectId],
    references: [prospects.id],
  }),
}));

export const marketingChannelsRelations = relations(marketingChannels, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [marketingChannels.workspaceId],
    references: [workspaces.id],
  }),
  createdByUser: one(users, {
    fields: [marketingChannels.createdBy],
    references: [users.id],
  }),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [campaigns.workspaceId],
    references: [workspaces.id],
  }),
  createdByUser: one(users, {
    fields: [campaigns.createdBy],
    references: [users.id],
  }),
  segment: one(segments, {
    fields: [campaigns.segmentId],
    references: [segments.id],
  }),
  recipients: many(campaignRecipients),
}));

// ============================================================================
// CRM INTERACTIONS - RELATIONS
// ============================================================================

export const crmInteractionsRelations = relations(crmInteractions, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [crmInteractions.workspaceId],
    references: [workspaces.id],
  }),
  contact: one(contacts, {
    fields: [crmInteractions.contactId],
    references: [contacts.id],
  }),
  prospect: one(prospects, {
    fields: [crmInteractions.prospectId],
    references: [prospects.id],
  }),
  customer: one(customers, {
    fields: [crmInteractions.customerId],
    references: [customers.id],
  }),
  deal: one(deals, {
    fields: [crmInteractions.dealId],
    references: [deals.id],
  }),
  createdByUser: one(users, {
    fields: [crmInteractions.createdBy],
    references: [users.id],
  }),
  assignedToUser: one(users, {
    fields: [crmInteractions.assignedTo],
    references: [users.id],
  }),
}));

// ============================================================================
// INVOICES - RELATIONS
// ============================================================================

export const invoicesRelations = relations(invoices, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [invoices.workspaceId],
    references: [workspaces.id],
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  project: one(projects, {
    fields: [invoices.projectId],
    references: [projects.id],
  }),
}));

// ============================================================================
// EXPENSES - RELATIONS
// ============================================================================

export const expensesRelations = relations(expenses, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [expenses.workspaceId],
    references: [workspaces.id],
  }),
  vendor: one(customers, {
    fields: [expenses.vendorId],
    references: [customers.id],
  }),
  project: one(projects, {
    fields: [expenses.projectId],
    references: [projects.id],
  }),
  customer: one(customers, {
    fields: [expenses.customerId],
    references: [customers.id],
  }),
  submittedByUser: one(users, {
    fields: [expenses.submittedBy],
    references: [users.id],
  }),
  approvedByUser: one(users, {
    fields: [expenses.approvedBy],
    references: [users.id],
  }),
}));

// ============================================================================
// AUTOMATION RULES - RELATIONS
// ============================================================================

export const automationRulesRelations = relations(automationRules, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [automationRules.workspaceId],
    references: [workspaces.id],
  }),
  createdByUser: one(users, {
    fields: [automationRules.createdBy],
    references: [users.id],
  }),
  executions: many(automationExecutions),
}));

export const automationExecutionsRelations = relations(automationExecutions, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [automationExecutions.workspaceId],
    references: [workspaces.id],
  }),
  automation: one(automationRules, {
    fields: [automationExecutions.automationId],
    references: [automationRules.id],
  }),
}));

// ============================================================================
// DEALS - RELATIONS
// ============================================================================

export const dealsRelations = relations(deals, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [deals.workspaceId],
    references: [workspaces.id],
  }),
  customer: one(customers, {
    fields: [deals.customerId],
    references: [customers.id],
  }),
  contact: one(contacts, {
    fields: [deals.contactId],
    references: [contacts.id],
  }),
  prospect: one(prospects, {
    fields: [deals.prospectId],
    references: [prospects.id],
  }),
  owner: one(users, {
    fields: [deals.ownerId],
    references: [users.id],
  }),
  interactions: many(crmInteractions),
}));

// ============================================================================
// LAUNCHPAD - RELATIONS
// ============================================================================

export const blogCategoriesRelations = relations(blogCategories, ({ many }) => ({
  posts: many(blogPosts),
}));

export const blogTagsRelations = relations(blogTags, ({ many }) => ({
  postTags: many(blogPostTags),
}));

export const blogPostsRelations = relations(blogPosts, ({ one, many }) => ({
  category: one(blogCategories, {
    fields: [blogPosts.categoryId],
    references: [blogCategories.id],
  }),
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
  }),
  postTags: many(blogPostTags),
  readingProgress: many(blogReadingProgress),
  bookmarks: many(blogBookmarks),
  reactions: many(blogReactions),
  collectionPosts: many(blogCollectionPosts),
  // Article Studio relations
  sources: many(articleSources),
  topicIdeas: many(topicIdeas),
  brainstormSessions: many(brainstormSessions),
}));

export const blogPostTagsRelations = relations(blogPostTags, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogPostTags.postId],
    references: [blogPosts.id],
  }),
  tag: one(blogTags, {
    fields: [blogPostTags.tagId],
    references: [blogTags.id],
  }),
}));

export const blogCollectionsRelations = relations(blogCollections, ({ one, many }) => ({
  author: one(users, {
    fields: [blogCollections.authorId],
    references: [users.id],
  }),
  collectionPosts: many(blogCollectionPosts),
}));

// ============================================================================
// CREATOR - SHARED DOCUMENTS
// ============================================================================

export const sharedDocuments = pgTable(
  'shared_documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key - REQUIRED FOR ALL QUERIES
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Document reference
    creatorItemId: uuid('creator_item_id')
      .notNull()
      .references(() => creatorItems.id, { onDelete: 'cascade' }),

    // Share token (unique, used in public URL)
    token: text('token').notNull().unique(),

    // Permissions
    permission: sharePermissionEnum('permission').notNull().default('view'),

    // Security options
    password: text('password'), // Hashed password if protected
    expiresAt: timestamp('expires_at'), // Optional expiry

    // Tracking
    accessCount: integer('access_count').notNull().default(0),

    // Relationships
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tokenIdx: uniqueIndex('shared_document_token_idx').on(table.token),
    creatorItemIdx: index('shared_document_creator_item_idx').on(table.creatorItemId),
    tenantIdx: index('shared_document_tenant_idx').on(table.workspaceId),
    expiryIdx: index('shared_document_expiry_idx').on(table.expiresAt),
  }),
);

// ============================================================================
// CREATOR - RELATIONS
// ============================================================================

export const sharedDocumentsRelations = relations(sharedDocuments, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [sharedDocuments.workspaceId],
    references: [workspaces.id],
  }),
  creatorItem: one(creatorItems, {
    fields: [sharedDocuments.creatorItemId],
    references: [creatorItems.id],
  }),
  createdByUser: one(users, {
    fields: [sharedDocuments.createdBy],
    references: [users.id],
  }),
}));

export const creatorItemsRelations = relations(creatorItems, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [creatorItems.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [creatorItems.userId],
    references: [users.id],
  }),
  itemCollections: many(creatorItemCollections),
}));

export const creatorCollectionsRelations = relations(creatorCollections, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [creatorCollections.workspaceId],
    references: [workspaces.id],
  }),
  itemCollections: many(creatorItemCollections),
}));

export const creatorItemCollectionsRelations = relations(creatorItemCollections, ({ one }) => ({
  item: one(creatorItems, {
    fields: [creatorItemCollections.itemId],
    references: [creatorItems.id],
  }),
  collection: one(creatorCollections, {
    fields: [creatorItemCollections.collectionId],
    references: [creatorCollections.id],
  }),
}));

export const blogCollectionPostsRelations = relations(blogCollectionPosts, ({ one }) => ({
  collection: one(blogCollections, {
    fields: [blogCollectionPosts.collectionId],
    references: [blogCollections.id],
  }),
  post: one(blogPosts, {
    fields: [blogCollectionPosts.postId],
    references: [blogPosts.id],
  }),
}));

export const blogReadingProgressRelations = relations(blogReadingProgress, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogReadingProgress.postId],
    references: [blogPosts.id],
  }),
}));

export const blogBookmarksRelations = relations(blogBookmarks, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogBookmarks.postId],
    references: [blogPosts.id],
  }),
}));

export const blogReactionsRelations = relations(blogReactions, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogReactions.postId],
    references: [blogPosts.id],
  }),
}));

// ============================================================================
// ARTICLE STUDIO - RELATIONS
// ============================================================================

export const topicIdeasRelations = relations(topicIdeas, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [topicIdeas.workspaceId],
    references: [workspaces.id],
  }),
  resultingPost: one(blogPosts, {
    fields: [topicIdeas.resultingPostId],
    references: [blogPosts.id],
  }),
}));

export const blogVoiceProfilesRelations = relations(blogVoiceProfiles, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [blogVoiceProfiles.workspaceId],
    references: [workspaces.id],
  }),
}));

export const articleSourcesRelations = relations(articleSources, ({ one }) => ({
  post: one(blogPosts, {
    fields: [articleSources.postId],
    references: [blogPosts.id],
  }),
}));

export const brainstormSessionsRelations = relations(brainstormSessions, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [brainstormSessions.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [brainstormSessions.userId],
    references: [users.id],
  }),
  resultingTopic: one(topicIdeas, {
    fields: [brainstormSessions.resultingTopicId],
    references: [topicIdeas.id],
  }),
  resultingPost: one(blogPosts, {
    fields: [brainstormSessions.resultingPostId],
    references: [blogPosts.id],
  }),
}));

// ============================================================================
// MISSION CONTROL - PLATFORM FEEDBACK
// ============================================================================

export const platformFeedback = pgTable(
  'platform_feedback',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // User info
    userId: text('user_id').notNull(), // Clerk user ID
    userEmail: text('user_email'),
    
    // Context
    pageUrl: text('page_url').notNull(),
    featureArea: text('feature_area'), // Auto-detected from URL
    
    // Feedback content
    type: feedbackTypeEnum('type').notNull(),
    sentiment: feedbackSentimentEnum('sentiment'),
    title: text('title'),
    content: text('content'),
    
    // Attachments
    screenshotUrl: text('screenshot_url'),
    
    // Metadata
    metadata: jsonb('metadata').$type<{
      browser?: string;
      os?: string;
      screenSize?: string;
      sessionId?: string;
      additionalContext?: Record<string, unknown>;
    }>().default({}),
    
    // Workflow
    status: feedbackStatusEnum('status').notNull().default('new'),
    priority: taskPriorityEnum('priority'),
    assignedTo: uuid('assigned_to').references(() => users.id),
    
    // Admin notes
    internalNotes: text('internal_notes'),
    resolution: text('resolution'),
    resolvedAt: timestamp('resolved_at'),
    
    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('platform_feedback_user_idx').on(table.userId),
    index('platform_feedback_type_idx').on(table.type),
    index('platform_feedback_status_idx').on(table.status),
    index('platform_feedback_sentiment_idx').on(table.sentiment),
    index('platform_feedback_created_at_idx').on(table.createdAt),
    index('platform_feedback_feature_area_idx').on(table.featureArea),
  ]
);

export const platformFeedbackRelations = relations(platformFeedback, ({ one }) => ({
  assignee: one(users, {
    fields: [platformFeedback.assignedTo],
    references: [users.id],
  }),
}));

// ============================================================================
// MISSION CONTROL - ANALYTICS EVENTS
// ============================================================================

export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // User info (optional for anonymous)
    userId: text('user_id'),
    sessionId: text('session_id'),
    
    // Event details
    eventType: text('event_type').notNull(), // page_view, click, scroll, etc.
    eventName: text('event_name'), // Specific event name
    
    // Context
    pageUrl: text('page_url').notNull(),
    referrer: text('referrer'),
    
    // Metadata
    metadata: jsonb('metadata').$type<{
      duration?: number;
      scrollDepth?: number;
      elementId?: string;
      searchQuery?: string;
      postId?: string;
      categoryId?: string;
      [key: string]: unknown;
    }>().default({}),
    
    // Device info
    userAgent: text('user_agent'),
    deviceType: text('device_type'), // mobile, tablet, desktop
    
    // Timestamp
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('analytics_events_user_idx').on(table.userId),
    index('analytics_events_type_idx').on(table.eventType),
    index('analytics_events_page_idx').on(table.pageUrl),
    index('analytics_events_created_at_idx').on(table.createdAt),
    index('analytics_events_session_idx').on(table.sessionId),
  ]
);

// ============================================================================
// MISSION CONTROL - NEWSLETTER SUBSCRIBERS
// ============================================================================

export const newsletterSubscribers = pgTable(
  'newsletter_subscribers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    userId: text('user_id'), // Clerk user ID if logged in
    isVerified: boolean('is_verified').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    subscribedAt: timestamp('subscribed_at').notNull().defaultNow(),
    unsubscribedAt: timestamp('unsubscribed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('newsletter_subscribers_email_idx').on(table.email),
    index('newsletter_subscribers_user_idx').on(table.userId),
    index('newsletter_subscribers_active_idx').on(table.isActive),
  ]
);

// ============================================================================
// DEVELOPER - WEBHOOKS
// ============================================================================

export const webhooks = pgTable(
  'webhooks',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Webhook info
    name: text('name').notNull(),
    url: text('url').notNull(),
    events: text('events').array().notNull(), // Array of event types
    secret: text('secret').notNull(), // HMAC secret (encrypted in DB)

    // Status
    isActive: boolean('is_active').default(true),

    // Stats
    lastTriggeredAt: timestamp('last_triggered_at'),
    successCount: integer('success_count').default(0),
    failureCount: integer('failure_count').default(0),

    // Metadata
    metadata: jsonb('metadata').$type<Record<string, any>>().default({}),

    // Relationships
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('webhook_tenant_idx').on(table.workspaceId),
    activeIdx: index('webhook_active_idx').on(table.isActive),
  }),
);

// ============================================================================
// DEVELOPER - WEBHOOK DELIVERIES
// ============================================================================

export const webhookDeliveries = pgTable(
  'webhook_deliveries',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Relationships
    webhookId: uuid('webhook_id')
      .notNull()
      .references(() => webhooks.id, { onDelete: 'cascade' }),

    // Delivery info
    event: text('event').notNull(),
    payload: jsonb('payload').$type<Record<string, any>>().notNull(),

    // Response
    status: integer('status'), // HTTP status code
    responseBody: text('response_body'),
    responseTime: integer('response_time'), // Milliseconds

    // Retry
    attempt: integer('attempt').default(1),
    maxAttempts: integer('max_attempts').default(3),
    nextRetryAt: timestamp('next_retry_at'),

    // Error
    error: text('error'),

    // Timestamps
    deliveredAt: timestamp('delivered_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    webhookIdx: index('webhook_delivery_webhook_idx').on(table.webhookId),
    eventIdx: index('webhook_delivery_event_idx').on(table.event),
    createdAtIdx: index('webhook_delivery_created_at_idx').on(table.createdAt),
  }),
);

// ============================================================================
// DEVELOPER - AUDIT LOGS
// ============================================================================

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Actor
    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    userEmail: text('user_email'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),

    // Action
    action: text('action').notNull(), // 'create', 'update', 'delete', etc
    resourceType: text('resource_type').notNull(), // 'customer', 'agent', etc
    resourceId: text('resource_id'),

    // Details
    changes: jsonb('changes')
      .$type<{
        before?: Record<string, any>;
        after?: Record<string, any>;
      }>()
      .default({}),
    metadata: jsonb('metadata').$type<Record<string, any>>().default({}),

    // Timestamp
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('audit_log_tenant_idx').on(table.workspaceId),
    userIdx: index('audit_log_user_idx').on(table.userId),
    actionIdx: index('audit_log_action_idx').on(table.action),
    resourceIdx: index('audit_log_resource_idx').on(table.resourceType, table.resourceId),
    createdAtIdx: index('audit_log_created_at_idx').on(table.createdAt),
  }),
);

// ============================================================================
// SYSTEM SETTINGS (Admin Configuration)
// ============================================================================

export const systemSettings = pgTable('system_settings', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Settings (stored as JSONB for flexibility)
  settings: jsonb('settings')
    .$type<{
      maintenanceMode?: boolean;
      allowSignups?: boolean;
      maxWorkspacesPerUser?: number;
      featureFlags?: {
        aiAgents?: boolean;
        knowledgeBase?: boolean;
        customPacks?: boolean;
      };
      rateLimit?: {
        requestsPerMinute?: number;
        burstSize?: number;
      };
    }>()
    .notNull()
    .default({}),

  // Audit
  updatedBy: text('updated_by'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============================================================================
// INTEGRATIONS (OAuth & Third-Party Connections)
// ============================================================================

export const integrations = pgTable(
  'integrations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),

    // Integration details
    provider: integrationProviderEnum('provider').notNull(),
    type: text('type').notNull(), // "email", "calendar", "storage", etc.
    name: text('name').notNull(),
    status: integrationStatusEnum('status').notNull().default('active'),

    // OAuth metadata
    providerAccountId: text('provider_account_id').notNull(),
    email: text('email'),
    displayName: text('display_name'),
    profileImage: text('profile_image'),

    // Scopes and permissions
    scopes: jsonb('scopes').$type<string[]>().notNull().default([]),

    // Configuration
    config: jsonb('config').$type<Record<string, any>>().default({}),

    // Error tracking
    lastError: text('last_error'),
    lastErrorAt: timestamp('last_error_at'),

    // Timestamps
    lastSyncAt: timestamp('last_sync_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    workspaceIdx: index('integrations_workspace_idx').on(table.workspaceId),
    userIdx: index('integrations_user_idx').on(table.userId),
    providerIdx: index('integrations_provider_idx').on(table.provider),
    statusIdx: index('integrations_status_idx').on(table.status),
    uniqueProviderAccount: uniqueIndex('integrations_provider_account_unique').on(
      table.workspaceId,
      table.provider,
      table.providerAccountId,
    ),
  }),
);

export const oauthTokens = pgTable(
  'oauth_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    integrationId: uuid('integration_id')
      .notNull()
      .references(() => integrations.id, { onDelete: 'cascade' }),

    // Encrypted tokens (AES-256-GCM encrypted)
    accessToken: text('access_token').notNull(),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),

    // Token metadata
    tokenType: text('token_type').notNull().default('Bearer'),
    expiresAt: timestamp('expires_at'),
    scope: text('scope'),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    integrationIdx: index('oauth_tokens_integration_idx').on(table.integrationId),
    expiresAtIdx: index('oauth_tokens_expires_at_idx').on(table.expiresAt),
  }),
);

// ============================================================================
// SOCIAL MEDIA POSTS
// ============================================================================

export const socialMediaPosts = pgTable(
  'social_media_posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    integrationId: uuid('integration_id')
      .references(() => integrations.id, { onDelete: 'set null' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Post details
    platform: text('platform').notNull(), // 'twitter', 'linkedin', 'facebook', 'instagram'
    content: text('content').notNull(),
    mediaUrls: jsonb('media_urls')
      .$type<string[]>()
      .default([]),

    // Status and scheduling
    status: text('status').notNull().default('draft'), // 'draft', 'scheduled', 'posted', 'failed'
    postedAt: timestamp('posted_at'),
    scheduledFor: timestamp('scheduled_for'),
    externalPostId: text('external_post_id'), // Platform's post ID (e.g., Twitter tweet ID)

    // Engagement metrics
    engagement: jsonb('engagement')
      .$type<{
        likes?: number;
        comments?: number;
        shares?: number;
        retweets?: number;
        impressions?: number;
        clicks?: number;
      }>()
      .default({}),

    // Error tracking
    errorMessage: text('error_message'),
    retryCount: integer('retry_count').default(0),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    workspaceIdx: index('social_media_posts_workspace_idx').on(table.workspaceId),
    integrationIdx: index('social_media_posts_integration_idx').on(table.integrationId),
    platformIdx: index('social_media_posts_platform_idx').on(table.platform),
    statusIdx: index('social_media_posts_status_idx').on(table.status),
    scheduledForIdx: index('social_media_posts_scheduled_for_idx').on(table.scheduledFor),
  }),
);

// ============================================================================
// GALAXY STUDIO - VISUAL WORKFLOW BUILDER
// ============================================================================

// Galaxy Grids: Visual workflow definitions
export const galaxyGrids = pgTable(
  'galaxy_grids',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key - REQUIRED FOR ALL QUERIES
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Basic info
    name: text('name').notNull(),
    description: text('description'),
    thumbnailUrl: text('thumbnail_url'),

    // Layout (stores React Flow viewport state)
    viewport: jsonb('viewport')
      .$type<{ x: number; y: number; zoom: number }>()
      .default({ x: 0, y: 0, zoom: 1 }),

    // Status
    status: gridStatusEnum('status').notNull().default('draft'),

    // Template metadata (if this grid is used as a template)
    isTemplate: boolean('is_template').default(false),
    templateCategory: text('template_category'),
    tags: text('tags').array().default([]),

    // Ownership
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    isPublic: boolean('is_public').notNull().default(false),

    // Version control
    version: integer('version').notNull().default(1),
    parentGridId: uuid('parent_grid_id'),

    // Publish metadata
    publishedAt: timestamp('published_at'),

    // Additional metadata
    metadata: jsonb('metadata')
      .$type<{
        lastSimulatedAt?: string;
        executionCount?: number;
        avgDuration?: number;
      }>()
      .default({}),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('galaxy_grid_tenant_idx').on(table.workspaceId),
    statusIdx: index('galaxy_grid_status_idx').on(table.status),
    createdByIdx: index('galaxy_grid_created_by_idx').on(table.createdBy),
    templateIdx: index('galaxy_grid_template_idx').on(table.isTemplate, table.templateCategory),
    publishedIdx: index('galaxy_grid_published_idx').on(table.publishedAt),
  }),
);

// Grid Nodes: Individual nodes in visual workflows
export const gridNodes = pgTable(
  'grid_nodes',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Parent grid reference
    gridId: uuid('grid_id')
      .notNull()
      .references(() => galaxyGrids.id, { onDelete: 'cascade' }),

    // Node info
    nodeType: gridNodeTypeEnum('node_type').notNull(),
    label: text('label').notNull(),

    // Position on canvas (React Flow format)
    position: jsonb('position').$type<{ x: number; y: number }>().notNull().default({ x: 0, y: 0 }),

    // Dimensions (optional, for custom sizing)
    width: integer('width'),
    height: integer('height'),

    // Node configuration (type-specific settings)
    config: jsonb('config')
      .$type<{
        // AI Node
        aiProvider?: 'openai' | 'anthropic' | 'google';
        model?: string;
        systemPrompt?: string;
        temperature?: number;
        maxTokens?: number;
        // Webhook Node
        webhookUrl?: string;
        webhookMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
        webhookHeaders?: Record<string, string>;
        // Condition Node
        conditionType?: 'equals' | 'contains' | 'greater' | 'less';
        conditionField?: string;
        conditionValue?: any;
        // Transform Node
        transformScript?: string;
        transformMapping?: Record<string, string>;
        // Loop Node
        loopSource?: string;
        loopVariable?: string;
        maxIterations?: number;
        // Delay Node
        delayMs?: number;
        // Any other config
        [key: string]: any;
      }>()
      .notNull()
      .default({}),

    // Link to existing agent (optional)
    agentId: uuid('agent_id').references(() => agents.id),

    // Runtime status (for simulation/execution)
    status: gridNodeStatusEnum('status').default('idle'),

    // Style overrides
    style: jsonb('style')
      .$type<{
        backgroundColor?: string;
        borderColor?: string;
        borderWidth?: number;
      }>()
      .default({}),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    gridIdx: index('grid_node_grid_idx').on(table.gridId),
    typeIdx: index('grid_node_type_idx').on(table.nodeType),
    agentIdx: index('grid_node_agent_idx').on(table.agentId),
    statusIdx: index('grid_node_status_idx').on(table.status),
  }),
);

// Grid Edges: Connections between nodes
export const gridEdges = pgTable(
  'grid_edges',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Parent grid reference
    gridId: uuid('grid_id')
      .notNull()
      .references(() => galaxyGrids.id, { onDelete: 'cascade' }),

    // Connection points
    sourceNodeId: uuid('source_node_id')
      .notNull()
      .references(() => gridNodes.id, { onDelete: 'cascade' }),
    targetNodeId: uuid('target_node_id')
      .notNull()
      .references(() => gridNodes.id, { onDelete: 'cascade' }),

    // Handle names (for multiple inputs/outputs)
    sourceHandle: text('source_handle').default('output'),
    targetHandle: text('target_handle').default('input'),

    // Edge type
    edgeType: gridEdgeTypeEnum('edge_type').notNull().default('default'),

    // Conditional edge configuration
    condition: jsonb('condition')
      .$type<{
        type?: 'equals' | 'contains' | 'greater' | 'less' | 'exists';
        field?: string;
        value?: any;
        operator?: 'and' | 'or';
      }>()
      .default({}),

    // Display
    label: text('label'),
    animated: boolean('animated').default(false),

    // Style overrides
    style: jsonb('style')
      .$type<{
        strokeColor?: string;
        strokeWidth?: number;
        strokeDasharray?: string;
      }>()
      .default({}),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    gridIdx: index('grid_edge_grid_idx').on(table.gridId),
    sourceIdx: index('grid_edge_source_idx').on(table.sourceNodeId),
    targetIdx: index('grid_edge_target_idx').on(table.targetNodeId),
    typeIdx: index('grid_edge_type_idx').on(table.edgeType),
  }),
);

// Grid Versions: Version control snapshots
export const gridVersions = pgTable(
  'grid_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Parent grid reference
    gridId: uuid('grid_id')
      .notNull()
      .references(() => galaxyGrids.id, { onDelete: 'cascade' }),

    // Version number
    version: integer('version').notNull(),

    // Complete snapshot of grid state at this version
    snapshot: jsonb('snapshot')
      .$type<{
        layout: any;
        viewport: { x: number; y: number; zoom: number };
        nodes: any[];
        edges: any[];
        metadata: any;
      }>()
      .notNull(),

    // Change description
    changesSummary: text('changes_summary'),

    // Author
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),

    // Timestamp
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    gridVersionIdx: uniqueIndex('grid_version_grid_version_idx').on(table.gridId, table.version),
    createdByIdx: index('grid_version_created_by_idx').on(table.createdBy),
    createdAtIdx: index('grid_version_created_at_idx').on(table.createdAt),
  }),
);

// Grid Executions: Runtime telemetry for LiveStream
export const gridExecutions = pgTable(
  'grid_executions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant key - REQUIRED FOR ALL QUERIES
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),

    // Parent grid reference
    gridId: uuid('grid_id')
      .notNull()
      .references(() => galaxyGrids.id, { onDelete: 'cascade' }),

    // Execution status
    status: gridExecutionStatusEnum('status').notNull().default('pending'),

    // Trigger info
    triggerType: text('trigger_type').notNull(), // 'manual', 'scheduled', 'webhook', 'event'
    triggerData: jsonb('trigger_data')
      .$type<{
        userId?: string;
        source?: string;
        payload?: any;
      }>()
      .default({}),

    // Input/Output
    input: jsonb('input').$type<Record<string, any>>().default({}),
    output: jsonb('output').$type<Record<string, any>>().default({}),

    // Performance metrics
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    durationMs: integer('duration_ms'),

    // Error handling
    errorMessage: text('error_message'),
    errorStack: text('error_stack'),

    // Additional metadata
    metadata: jsonb('metadata')
      .$type<{
        totalNodes?: number;
        successfulNodes?: number;
        failedNodes?: number;
        skippedNodes?: number;
      }>()
      .default({}),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('grid_execution_tenant_idx').on(table.workspaceId),
    gridIdx: index('grid_execution_grid_idx').on(table.gridId),
    statusIdx: index('grid_execution_status_idx').on(table.status),
    startedAtIdx: index('grid_execution_started_at_idx').on(table.startedAt),
    createdAtIdx: index('grid_execution_created_at_idx').on(table.createdAt),
  }),
);

// Execution Steps: Individual node executions within a grid run
export const executionSteps = pgTable(
  'execution_steps',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Parent execution reference
    executionId: uuid('execution_id')
      .notNull()
      .references(() => gridExecutions.id, { onDelete: 'cascade' }),

    // Node reference
    nodeId: uuid('node_id')
      .notNull()
      .references(() => gridNodes.id),

    // Execution order
    stepIndex: integer('step_index').notNull(),

    // Status
    status: gridNodeStatusEnum('status').notNull().default('pending'),

    // Input/Output for this step
    inputData: jsonb('input_data').$type<Record<string, any>>().default({}),
    outputData: jsonb('output_data').$type<Record<string, any>>().default({}),

    // Performance
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    durationMs: integer('duration_ms'),

    // Error handling
    errorMessage: text('error_message'),
    errorStack: text('error_stack'),

    // Logs (array of log messages)
    logs: text('logs').array().default([]),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    executionStepIdx: index('execution_step_execution_step_idx').on(
      table.executionId,
      table.stepIndex,
    ),
    nodeIdx: index('execution_step_node_idx').on(table.nodeId),
    statusIdx: index('execution_step_status_idx').on(table.status),
  }),
);

// Grid Templates: Marketplace templates for Discover page
export const gridTemplates = pgTable(
  'grid_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Template info
    name: text('name').notNull(),
    description: text('description'),

    // Category & organization
    category: text('category').notNull(),
    tags: text('tags').array().default([]),

    // Visual
    thumbnailUrl: text('thumbnail_url'),

    // Template snapshot (complete grid definition)
    previewData: jsonb('preview_data')
      .$type<{
        nodes: any[];
        edges: any[];
        viewport?: { x: number; y: number; zoom: number };
      }>()
      .notNull(),

    // Metadata
    complexity: text('complexity').$type<'beginner' | 'intermediate' | 'advanced'>(),
    estimatedTime: integer('estimated_time'), // in minutes

    // Marketplace stats
    uses: integer('uses').notNull().default(0),
    rating: integer('rating'), // 0-5 scale stored as decimal

    // Publishing
    featured: boolean('featured').default(false),

    // Author
    authorId: text('author_id').notNull(),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    categoryIdx: index('grid_template_category_idx').on(table.category),
    featuredIdx: index('grid_template_featured_idx').on(table.featured),
    usesIdx: index('grid_template_uses_idx').on(table.uses),
  }),
);

// ============================================================================
// GALAXY STUDIO - RELATIONS
// ============================================================================

export const galaxyGridsRelations = relations(galaxyGrids, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [galaxyGrids.workspaceId],
    references: [workspaces.id],
  }),
  creator: one(users, {
    fields: [galaxyGrids.createdBy],
    references: [users.id],
  }),
  nodes: many(gridNodes),
  edges: many(gridEdges),
  versions: many(gridVersions),
  executions: many(gridExecutions),
}));

export const gridNodesRelations = relations(gridNodes, ({ one, many }) => ({
  grid: one(galaxyGrids, {
    fields: [gridNodes.gridId],
    references: [galaxyGrids.id],
  }),
  agent: one(agents, {
    fields: [gridNodes.agentId],
    references: [agents.id],
  }),
  sourceEdges: many(gridEdges, { relationName: 'sourceNode' }),
  targetEdges: many(gridEdges, { relationName: 'targetNode' }),
  executionSteps: many(executionSteps),
}));

export const gridEdgesRelations = relations(gridEdges, ({ one }) => ({
  grid: one(galaxyGrids, {
    fields: [gridEdges.gridId],
    references: [galaxyGrids.id],
  }),
  sourceNode: one(gridNodes, {
    fields: [gridEdges.sourceNodeId],
    references: [gridNodes.id],
    relationName: 'sourceNode',
  }),
  targetNode: one(gridNodes, {
    fields: [gridEdges.targetNodeId],
    references: [gridNodes.id],
    relationName: 'targetNode',
  }),
}));

export const gridVersionsRelations = relations(gridVersions, ({ one }) => ({
  grid: one(galaxyGrids, {
    fields: [gridVersions.gridId],
    references: [galaxyGrids.id],
  }),
  creator: one(users, {
    fields: [gridVersions.createdBy],
    references: [users.id],
  }),
}));

export const gridExecutionsRelations = relations(gridExecutions, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [gridExecutions.workspaceId],
    references: [workspaces.id],
  }),
  grid: one(galaxyGrids, {
    fields: [gridExecutions.gridId],
    references: [galaxyGrids.id],
  }),
  steps: many(executionSteps),
}));

export const executionStepsRelations = relations(executionSteps, ({ one }) => ({
  execution: one(gridExecutions, {
    fields: [executionSteps.executionId],
    references: [gridExecutions.id],
  }),
  node: one(gridNodes, {
    fields: [executionSteps.nodeId],
    references: [gridNodes.id],
  }),
}));

export const gridTemplatesRelations = relations(gridTemplates, ({ one }) => ({
  author: one(users, {
    fields: [gridTemplates.authorId],
    references: [users.id],
  }),
}));

// ============================================================================
// RELATIONS - CONVERSATIONS
// ============================================================================

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [conversations.workspaceId],
    references: [workspaces.id],
  }),
  assignedUser: one(users, {
    fields: [conversations.assignedTo],
    references: [users.id],
  }),
  messages: many(conversationMessages),
  participants: many(conversationParticipants),
}));

export const conversationMessagesRelations = relations(conversationMessages, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [conversationMessages.workspaceId],
    references: [workspaces.id],
  }),
  conversation: one(conversations, {
    fields: [conversationMessages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [conversationMessages.senderId],
    references: [users.id],
  }),
  replyTo: one(conversationMessages, {
    fields: [conversationMessages.replyToId],
    references: [conversationMessages.id],
  }),
}));

export const conversationParticipantsRelations = relations(conversationParticipants, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [conversationParticipants.workspaceId],
    references: [workspaces.id],
  }),
  conversation: one(conversations, {
    fields: [conversationParticipants.conversationId],
    references: [conversations.id],
  }),
  contact: one(contacts, {
    fields: [conversationParticipants.contactId],
    references: [contacts.id],
  }),
  prospect: one(prospects, {
    fields: [conversationParticipants.prospectId],
    references: [prospects.id],
  }),
  customer: one(customers, {
    fields: [conversationParticipants.customerId],
    references: [customers.id],
  }),
  user: one(users, {
    fields: [conversationParticipants.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// TYPES
// ============================================================================

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type NewWorkspaceMember = typeof workspaceMembers.$inferInsert;

export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;

export type AgentTemplate = typeof agentTemplates.$inferSelect;
export type NewAgentTemplate = typeof agentTemplates.$inferInsert;

export type AgentPack = typeof agentPacks.$inferSelect;
export type NewAgentPack = typeof agentPacks.$inferInsert;

export type AgentExecution = typeof agentExecutions.$inferSelect;
export type NewAgentExecution = typeof agentExecutions.$inferInsert;

export type AgentSchedule = typeof agentSchedules.$inferSelect;
export type NewAgentSchedule = typeof agentSchedules.$inferInsert;

export type AgentLog = typeof agentLogs.$inferSelect;
export type NewAgentLog = typeof agentLogs.$inferInsert;

export type KnowledgeCollection = typeof knowledgeCollections.$inferSelect;
export type NewKnowledgeCollection = typeof knowledgeCollections.$inferInsert;

export type KnowledgeTag = typeof knowledgeTags.$inferSelect;
export type NewKnowledgeTag = typeof knowledgeTags.$inferInsert;

export type KnowledgeItem = typeof knowledgeItems.$inferSelect;
export type NewKnowledgeItem = typeof knowledgeItems.$inferInsert;

export type KnowledgeItemTag = typeof knowledgeItemTags.$inferSelect;
export type NewKnowledgeItemTag = typeof knowledgeItemTags.$inferInsert;

export type AiConversation = typeof aiConversations.$inferSelect;
export type NewAiConversation = typeof aiConversations.$inferInsert;

export type AiMessage = typeof aiMessages.$inferSelect;
export type NewAiMessage = typeof aiMessages.$inferInsert;

export type AiUserPreferences = typeof aiUserPreferences.$inferSelect;
export type NewAiUserPreferences = typeof aiUserPreferences.$inferInsert;

// CRM Types
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Prospect = typeof prospects.$inferSelect;
export type NewProspect = typeof prospects.$inferInsert;

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

// Conversation Types
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;

export type ConversationMessage = typeof conversationMessages.$inferSelect;
export type NewConversationMessage = typeof conversationMessages.$inferInsert;

export type ConversationParticipant = typeof conversationParticipants.$inferSelect;
export type NewConversationParticipant = typeof conversationParticipants.$inferInsert;

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type NewCalendarEvent = typeof calendarEvents.$inferInsert;

// Business Types
export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;

export type Segment = typeof segments.$inferSelect;
export type NewSegment = typeof segments.$inferInsert;

export type Export = typeof dataExports.$inferSelect;
export type NewExport = typeof dataExports.$inferInsert;

export type Import = typeof dataImports.$inferSelect;
export type NewImport = typeof dataImports.$inferInsert;

// Communication Types
export type InboxMessage = typeof inboxMessages.$inferSelect;
export type NewInboxMessage = typeof inboxMessages.$inferInsert;

export type EmailThread = typeof emailThreads.$inferSelect;
export type NewEmailThread = typeof emailThreads.$inferInsert;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

// Developer Types
export type Webhook = typeof webhooks.$inferSelect;
export type NewWebhook = typeof webhooks.$inferInsert;

export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type NewWebhookDelivery = typeof webhookDeliveries.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

// Admin Types
export type SystemSettings = typeof systemSettings.$inferSelect;
export type NewSystemSettings = typeof systemSettings.$inferInsert;

// Integration Types
export type Integration = typeof integrations.$inferSelect;
export type NewIntegration = typeof integrations.$inferInsert;

export type OAuthToken = typeof oauthTokens.$inferSelect;
export type NewOAuthToken = typeof oauthTokens.$inferInsert;

export type SocialMediaPost = typeof socialMediaPosts.$inferSelect;
export type NewSocialMediaPost = typeof socialMediaPosts.$inferInsert;

// Galaxy Studio Types
export type GalaxyGrid = typeof galaxyGrids.$inferSelect;
export type NewGalaxyGrid = typeof galaxyGrids.$inferInsert;

export type GridNode = typeof gridNodes.$inferSelect;
export type NewGridNode = typeof gridNodes.$inferInsert;

export type GridEdge = typeof gridEdges.$inferSelect;
export type NewGridEdge = typeof gridEdges.$inferInsert;

export type GridVersion = typeof gridVersions.$inferSelect;
export type NewGridVersion = typeof gridVersions.$inferInsert;

export type GridExecution = typeof gridExecutions.$inferSelect;
export type NewGridExecution = typeof gridExecutions.$inferInsert;

export type ExecutionStep = typeof executionSteps.$inferSelect;
export type NewExecutionStep = typeof executionSteps.$inferInsert;

export type GridTemplate = typeof gridTemplates.$inferSelect;
export type NewGridTemplate = typeof gridTemplates.$inferInsert;

// Galaxy Studio Enum Types
export type GridStatus = (typeof gridStatusEnum.enumValues)[number];
export type GridNodeType = (typeof gridNodeTypeEnum.enumValues)[number];
export type GridNodeStatus = (typeof gridNodeStatusEnum.enumValues)[number];
export type GridEdgeType = (typeof gridEdgeTypeEnum.enumValues)[number];
export type GridExecutionStatus = (typeof gridExecutionStatusEnum.enumValues)[number];

// Team Messaging Types
export type TeamChannel = typeof teamChannels.$inferSelect;
export type NewTeamChannel = typeof teamChannels.$inferInsert;

export type TeamMessage = typeof teamMessages.$inferSelect;
export type NewTeamMessage = typeof teamMessages.$inferInsert;

export type TeamChannelMember = typeof teamChannelMembers.$inferSelect;
export type NewTeamChannelMember = typeof teamChannelMembers.$inferInsert;

export type TeamChannelType = (typeof teamChannelTypeEnum.enumValues)[number];

// Launchpad (Blog) Types
export type BlogCategory = typeof blogCategories.$inferSelect;
export type NewBlogCategory = typeof blogCategories.$inferInsert;

export type BlogTag = typeof blogTags.$inferSelect;
export type NewBlogTag = typeof blogTags.$inferInsert;

export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;

export type BlogPostTag = typeof blogPostTags.$inferSelect;
export type NewBlogPostTag = typeof blogPostTags.$inferInsert;

export type BlogCollection = typeof blogCollections.$inferSelect;
export type NewBlogCollection = typeof blogCollections.$inferInsert;

export type BlogCollectionPost = typeof blogCollectionPosts.$inferSelect;
export type NewBlogCollectionPost = typeof blogCollectionPosts.$inferInsert;

export type BlogReadingProgress = typeof blogReadingProgress.$inferSelect;
export type NewBlogReadingProgress = typeof blogReadingProgress.$inferInsert;

export type BlogBookmark = typeof blogBookmarks.$inferSelect;
export type NewBlogBookmark = typeof blogBookmarks.$inferInsert;

export type BlogReaction = typeof blogReactions.$inferSelect;
export type NewBlogReaction = typeof blogReactions.$inferInsert;

export type BlogUserPreferences = typeof blogUserPreferences.$inferSelect;
export type NewBlogUserPreferences = typeof blogUserPreferences.$inferInsert;

// Creator Types
export type CreatorItem = typeof creatorItems.$inferSelect;
export type NewCreatorItem = typeof creatorItems.$inferInsert;

export type CreatorCollection = typeof creatorCollections.$inferSelect;
export type NewCreatorCollection = typeof creatorCollections.$inferInsert;

export type CreatorItemCollection = typeof creatorItemCollections.$inferSelect;
export type NewCreatorItemCollection = typeof creatorItemCollections.$inferInsert;

export type CreatorTemplate = typeof creatorTemplates.$inferSelect;
export type NewCreatorTemplate = typeof creatorTemplates.$inferInsert;

// Launchpad Enum Types
export type BlogPostStatus = (typeof blogPostStatusEnum.enumValues)[number];
export type BlogReactionType = (typeof blogReactionTypeEnum.enumValues)[number];

// Mission Control (Feedback & Analytics) Types
export type PlatformFeedback = typeof platformFeedback.$inferSelect;
export type NewPlatformFeedback = typeof platformFeedback.$inferInsert;

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert;

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type NewNewsletterSubscriber = typeof newsletterSubscribers.$inferInsert;

// Mission Control Enum Types
export type FeedbackType = (typeof feedbackTypeEnum.enumValues)[number];
export type FeedbackStatus = (typeof feedbackStatusEnum.enumValues)[number];
export type FeedbackSentiment = (typeof feedbackSentimentEnum.enumValues)[number];

// Article Studio Types
export type TopicIdea = typeof topicIdeas.$inferSelect;
export type NewTopicIdea = typeof topicIdeas.$inferInsert;

export type BlogVoiceProfile = typeof blogVoiceProfiles.$inferSelect;
export type NewBlogVoiceProfile = typeof blogVoiceProfiles.$inferInsert;

export type ArticleSource = typeof articleSources.$inferSelect;
export type NewArticleSource = typeof articleSources.$inferInsert;

export type BrainstormSession = typeof brainstormSessions.$inferSelect;
export type NewBrainstormSession = typeof brainstormSessions.$inferInsert;

// Article Studio Enum Types
export type TopicIdeaStatus = (typeof topicIdeaStatusEnum.enumValues)[number];
export type TopicIdeaGeneratedBy = (typeof topicIdeaGeneratedByEnum.enumValues)[number];
export type ArticleSourceVerification = (typeof articleSourceVerificationEnum.enumValues)[number];
export type ArticleLayoutTemplate = (typeof articleLayoutTemplateEnum.enumValues)[number];












