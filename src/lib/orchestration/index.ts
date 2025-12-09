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
} from './types';

export type {
  TeamTemplate,
  AgentTemplate,
  WorkflowTemplate,
  TeamTemplateId,
} from './team-templates';

export type {
  TeamTask,
  HandoffContext,
  AgentExecutionResult,
  TeamMemberInfo,
  TeamExecutionState,
} from './team-executor';

