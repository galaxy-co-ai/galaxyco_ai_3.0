/**
 * Agent Orchestration System
 *
 * Multi-agent orchestration infrastructure for GalaxyCo.ai
 * Enables department-level automation, agent-to-agent communication,
 * and autonomous business operations.
 *
 * Inspired by:
 * - The General Intelligence Company's "Cofounder" approach
 * - Cognition AI's autonomous task execution
 * - Sierra AI's department-specific agent teams
 */

// Types
export * from './types';

// Core Services
export { AgentOrchestrator } from './orchestrator';
export { AgentMessageBus } from './message-bus';
export { AgentMemoryService } from './memory';
export { TeamExecutor } from './team-executor';
export { WorkflowEngine } from './workflow-engine';

// Autonomy Service (Phase 6)
export { AutonomyService, createAutonomyService } from './autonomy';

// Notification Integration (Phase 6)
export {
  notifyPendingApproval,
  notifyActionApproved,
  notifyActionRejected,
  notifyActionExpired,
  notifyAutonomyLevelChanged,
  sendDailyAutonomyDigest,
  alertHighPendingCount,
  alertCriticalAction,
  alertActionFailed,
} from './notification-integration';

// Team Templates
export {
  teamTemplates,
  teamTemplatesById,
  getTeamTemplate,
  getTeamTemplatesByDepartment,
  suggestTeamTemplate,
  salesTeamTemplate,
  marketingTeamTemplate,
  supportTeamTemplate,
  operationsTeamTemplate,
} from './team-templates';

// Workflow Templates
export {
  workflowTemplates,
  workflowTemplatesById,
  getWorkflowTemplate,
  getWorkflowTemplatesByDepartment,
  getWorkflowTemplatesByCategory,
  convertTemplateToSteps,
  suggestWorkflowTemplate,
  validateAgentAvailability,
  leadToCustomerPipeline,
  contentCampaignWorkflow,
  supportTicketResolution,
} from './workflow-templates';

// Re-export commonly used types for convenience
export type {
  AgentTeam,
  AgentTeamMember,
  AgentMessage,
  AgentWorkflow,
  WorkflowExecution,
  SharedMemory,
  TeamConfig,
  WorkflowStep,
  OrchestratorTask,
  TaskAssignment,
  DelegationResult,
  TeamExecutionResult,
  WorkflowResult,
  // Phase 6 Autonomy Types
  ActionRiskLevel,
  ApprovalStatus,
  RiskClassification,
  PendingAction,
  QueueActionInput,
  ProcessApprovalInput,
  ActionAuditEntry,
  RecordAuditInput,
  PendingActionsFilters,
  AuditLogFilters,
  DepartmentMetrics,
  TeamAutonomyStats,
  ActionRiskRules,
} from './types';

export type {
  TeamTemplate,
  AgentTemplate,
  WorkflowTemplate as TeamWorkflowTemplate,
  TeamTemplateId,
} from './team-templates';

export type {
  WorkflowTemplate,
  WorkflowStepTemplate,
  WorkflowTemplateId,
} from './workflow-templates';

export type {
  TeamTask,
  HandoffContext,
  AgentExecutionResult,
  TeamMemberInfo,
  TeamExecutionState,
} from './team-executor';

export type {
  WorkflowTrigger,
  ExecuteWorkflowOptions,
  StepExecutionOptions,
  WorkflowEngineResult,
} from './workflow-engine';

