/**
 * Agent Orchestration System - Type Definitions
 *
 * Comprehensive TypeScript interfaces for the multi-agent orchestration system.
 * These types define the contracts for:
 * - Agent teams and department automation
 * - Inter-agent communication (message bus)
 * - Multi-agent workflows
 * - Three-tier memory system
 * - Orchestration events and results
 */

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export type AgentDepartment =
  | 'sales'
  | 'marketing'
  | 'support'
  | 'operations'
  | 'finance'
  | 'product'
  | 'general';

export type AgentTeamRole = 'coordinator' | 'specialist' | 'support';

export type AgentMessageType = 'task' | 'result' | 'context' | 'handoff' | 'status' | 'query';

export type MemoryTier = 'short_term' | 'medium_term' | 'long_term';

export type MemoryCategory =
  | 'context'
  | 'pattern'
  | 'preference'
  | 'knowledge'
  | 'relationship';

export type TeamAutonomyLevel = 'supervised' | 'semi_autonomous' | 'autonomous';

export type WorkflowStatus = 'active' | 'paused' | 'archived' | 'draft';

export type WorkflowTriggerType = 'manual' | 'event' | 'schedule' | 'agent_request';

export type ExecutionStatus = 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';

export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

export type MessageStatus = 'pending' | 'delivered' | 'read' | 'processed';

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

// ============================================================================
// AGENT TEAM TYPES
// ============================================================================

export interface TeamConfig {
  autonomyLevel: TeamAutonomyLevel;
  approvalRequired: string[];
  workingHours?: {
    start: string;
    end: string;
    timezone: string;
  };
  maxConcurrentTasks: number;
  escalationRules?: Array<{
    condition: string;
    action: 'notify' | 'escalate' | 'pause';
    target?: string;
  }>;
  capabilities?: string[];
}

export interface AgentTeam {
  id: string;
  workspaceId: string;
  name: string;
  department: AgentDepartment;
  description?: string;
  coordinatorAgentId?: string;
  config: TeamConfig;
  status: 'active' | 'paused' | 'archived';
  totalExecutions: number;
  successfulExecutions: number;
  lastActiveAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMemberConfig {
  specializations?: string[];
  fallbackFor?: string[];
  maxConcurrentTasks?: number;
}

export interface AgentTeamMember {
  id: string;
  teamId: string;
  agentId: string;
  role: AgentTeamRole;
  priority: number;
  config?: TeamMemberConfig;
  createdAt: Date;
}

export interface CreateTeamInput {
  workspaceId: string;
  name: string;
  department: AgentDepartment;
  description?: string;
  coordinatorAgentId?: string;
  config?: Partial<TeamConfig>;
  createdBy: string;
}

export interface UpdateTeamInput {
  name?: string;
  description?: string;
  coordinatorAgentId?: string;
  config?: Partial<TeamConfig>;
  status?: 'active' | 'paused' | 'archived';
}

export interface AddTeamMemberInput {
  teamId: string;
  agentId: string;
  role: AgentTeamRole;
  priority?: number;
  config?: TeamMemberConfig;
}

// ============================================================================
// AGENT MESSAGE TYPES (Message Bus)
// ============================================================================

export interface MessageContent {
  subject: string;
  body: string;
  data?: Record<string, unknown>;
  priority: MessagePriority;
  taskId?: string;
  workflowExecutionId?: string;
}

export interface AgentMessage {
  id: string;
  workspaceId: string;
  fromAgentId?: string;
  toAgentId?: string;
  teamId?: string;
  messageType: AgentMessageType;
  content: MessageContent;
  parentMessageId?: string;
  threadId?: string;
  status: MessageStatus;
  createdAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  processedAt?: Date;
}

export interface SendMessageInput {
  workspaceId: string;
  fromAgentId?: string;
  toAgentId?: string;
  teamId?: string;
  messageType: AgentMessageType;
  content: MessageContent;
  parentMessageId?: string;
}

export interface MessageFilters {
  messageType?: AgentMessageType;
  status?: MessageStatus;
  priority?: MessagePriority;
  teamId?: string;
  fromAgentId?: string;
  since?: Date;
  limit?: number;
}

// ============================================================================
// WORKFLOW TYPES
// ============================================================================

export interface WorkflowStepCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'exists';
  value: unknown;
}

export interface WorkflowStep {
  id: string;
  name: string;
  agentId: string;
  action: string;
  inputs: Record<string, unknown>;
  conditions?: WorkflowStepCondition[];
  onSuccess?: string;
  onFailure?: string;
  timeout?: number;
  retryConfig?: {
    maxAttempts: number;
    backoffMs: number;
  };
}

export interface WorkflowTriggerConfig {
  eventType?: string;
  cron?: string;
  webhookSecret?: string;
  conditions?: WorkflowStepCondition[];
}

export interface AgentWorkflow {
  id: string;
  workspaceId: string;
  teamId?: string;
  name: string;
  description?: string;
  category?: string;
  triggerType: WorkflowTriggerType;
  triggerConfig: WorkflowTriggerConfig;
  steps: WorkflowStep[];
  status: WorkflowStatus;
  totalExecutions: number;
  successfulExecutions: number;
  avgDurationMs?: number;
  lastExecutedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWorkflowInput {
  workspaceId: string;
  teamId?: string;
  name: string;
  description?: string;
  category?: string;
  triggerType: WorkflowTriggerType;
  triggerConfig?: WorkflowTriggerConfig;
  steps: WorkflowStep[];
  createdBy: string;
}

export interface UpdateWorkflowInput {
  name?: string;
  description?: string;
  category?: string;
  triggerType?: WorkflowTriggerType;
  triggerConfig?: WorkflowTriggerConfig;
  steps?: WorkflowStep[];
  status?: WorkflowStatus;
}

// ============================================================================
// WORKFLOW EXECUTION TYPES
// ============================================================================

export interface StepResult {
  status: StepStatus;
  output: unknown;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
}

export interface WorkflowExecutionError {
  message: string;
  step?: string;
  details?: unknown;
  stack?: string;
}

export interface WorkflowExecution {
  id: string;
  workspaceId: string;
  workflowId: string;
  status: ExecutionStatus;
  currentStepId?: string;
  currentStepIndex: number;
  stepResults: Record<string, StepResult>;
  context: Record<string, unknown>;
  triggeredBy?: string;
  triggerType?: string;
  triggerData?: Record<string, unknown>;
  startedAt: Date;
  completedAt?: Date;
  pausedAt?: Date;
  durationMs?: number;
  totalSteps: number;
  completedSteps: number;
  error?: WorkflowExecutionError;
}

export interface ExecuteWorkflowInput {
  workflowId: string;
  workspaceId: string;
  triggeredBy?: string;
  triggerType?: string;
  triggerData?: Record<string, unknown>;
  initialContext?: Record<string, unknown>;
}

// ============================================================================
// MEMORY TYPES
// ============================================================================

export interface MemoryMetadata {
  source?: string;
  confidence?: number;
  lastAccessed?: string;
  accessCount?: number;
  relatedMemoryIds?: string[];
  tags?: string[];
}

export interface SharedMemory {
  id: string;
  workspaceId: string;
  teamId?: string;
  agentId?: string;
  memoryTier: MemoryTier;
  category: MemoryCategory;
  key: string;
  value: unknown;
  metadata: MemoryMetadata;
  importance: number;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreMemoryInput {
  workspaceId: string;
  teamId?: string;
  agentId?: string;
  memoryTier: MemoryTier;
  category: MemoryCategory;
  key: string;
  value: unknown;
  metadata?: MemoryMetadata;
  importance?: number;
  expiresAt?: Date;
}

export interface MemoryQuery {
  workspaceId: string;
  teamId?: string;
  agentId?: string;
  memoryTier?: MemoryTier;
  category?: MemoryCategory;
  keyPattern?: string;
  tags?: string[];
  minImportance?: number;
  limit?: number;
}

// ============================================================================
// ORCHESTRATOR TYPES
// ============================================================================

export interface TaskAssignment {
  agentId: string;
  agentName: string;
  teamId?: string;
  teamName?: string;
  confidence: number;
  reason: string;
}

export interface OrchestratorTask {
  workspaceId: string;
  taskType: string;
  description: string;
  priority: MessagePriority;
  data?: Record<string, unknown>;
  preferredAgentId?: string;
  preferredTeamId?: string;
  requiredCapabilities?: string[];
  deadline?: Date;
}

export interface DelegationResult {
  success: boolean;
  messageId?: string;
  fromAgentId: string;
  toAgentId: string;
  taskId?: string;
  error?: string;
}

export interface TeamExecutionResult {
  success: boolean;
  teamId: string;
  objective: string;
  executionId?: string;
  results?: unknown;
  error?: string;
  durationMs?: number;
  agentsInvolved: string[];
}

export interface WorkflowResult {
  success: boolean;
  workflowId: string;
  executionId: string;
  status: ExecutionStatus;
  output?: unknown;
  error?: WorkflowExecutionError;
  durationMs?: number;
  stepsCompleted: number;
  totalSteps: number;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export type OrchestrationEventType =
  | 'team.created'
  | 'team.updated'
  | 'team.deleted'
  | 'team.execution_started'
  | 'team.execution_completed'
  | 'team.execution_failed'
  | 'workflow.created'
  | 'workflow.updated'
  | 'workflow.deleted'
  | 'workflow.execution_started'
  | 'workflow.execution_completed'
  | 'workflow.execution_failed'
  | 'workflow.step_completed'
  | 'message.sent'
  | 'message.delivered'
  | 'message.processed'
  | 'memory.stored'
  | 'memory.accessed'
  | 'memory.promoted'
  | 'agent.delegated_task'
  | 'agent.completed_task';

export interface OrchestrationEvent {
  type: OrchestrationEventType;
  workspaceId: string;
  timestamp: Date;
  data: Record<string, unknown>;
  metadata?: {
    teamId?: string;
    workflowId?: string;
    executionId?: string;
    agentId?: string;
    userId?: string;
  };
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

