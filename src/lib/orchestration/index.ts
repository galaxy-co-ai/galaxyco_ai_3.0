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

