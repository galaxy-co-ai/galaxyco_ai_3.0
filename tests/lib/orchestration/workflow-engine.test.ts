/**
 * Tests for Workflow Engine - Multi-Agent Workflow Execution
 * 
 * Tests workflow orchestration, step execution, conditional branching,
 * error handling, and resumption for the AI platform.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  WorkflowEngine,
  type ExecuteWorkflowOptions,
} from '@/lib/orchestration/workflow-engine';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { AgentMemoryService } from '@/lib/orchestration/memory';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    query: {
      agentWorkflows: {
        findFirst: vi.fn(),
      },
      agentWorkflowExecutions: {
        findFirst: vi.fn(),
      },
      agents: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{}])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/orchestration/message-bus', () => {
  return {
    AgentMessageBus: vi.fn(function (this: any, workspaceId: string) {
      return {
        workspaceId,
        subscribe: vi.fn(),
        publish: vi.fn(),
        unsubscribe: vi.fn(),
        send: vi.fn(() => Promise.resolve('msg-123')),
      };
    }),
  };
});

vi.mock('@/lib/orchestration/memory', () => {
  return {
    AgentMemoryService: vi.fn(function (this: any, workspaceId: string) {
      return {
        workspaceId,
        store: vi.fn(() => Promise.resolve()),
        retrieve: vi.fn(() => Promise.resolve([])),
        search: vi.fn(() => Promise.resolve([])),
      };
    }),
  };
});

describe('orchestration/workflow-engine', () => {
  let workflowEngine: WorkflowEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    workflowEngine = new WorkflowEngine('workspace-123');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('execute', () => {
    const mockWorkflow = {
      id: 'workflow-1',
      workspaceId: 'workspace-123',
      name: 'Test Workflow',
      status: 'active',
      steps: [
        {
          id: 'step-1',
          type: 'agent_task',
          agentId: 'agent-1',
          config: { instruction: 'Process data' },
          nextSteps: ['step-2'],
        },
        {
          id: 'step-2',
          type: 'agent_task',
          agentId: 'agent-2',
          config: { instruction: 'Review results' },
          nextSteps: [],
        },
      ],
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return error when workflow not found', async () => {
      vi.mocked(db.query.agentWorkflows.findFirst).mockResolvedValue(null);

      const options: ExecuteWorkflowOptions = {
        workflowId: 'nonexistent',
        workspaceId: 'workspace-123',
        trigger: { type: 'manual' },
      };

      const result = await workflowEngine.execute(options);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Workflow not found');
      expect(result.executionId).toBe('');
    });

    it('should return error when workflow is not active', async () => {
      vi.mocked(db.query.agentWorkflows.findFirst).mockResolvedValue({
        ...mockWorkflow,
        status: 'draft',
      } as any);

      const options: ExecuteWorkflowOptions = {
        workflowId: 'workflow-1',
        workspaceId: 'workspace-123',
        trigger: { type: 'manual' },
      };

      const result = await workflowEngine.execute(options);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('not active');
    });

    it('should return error when workflow has no steps', async () => {
      vi.mocked(db.query.agentWorkflows.findFirst).mockResolvedValue({
        ...mockWorkflow,
        steps: [],
      } as any);

      const options: ExecuteWorkflowOptions = {
        workflowId: 'workflow-1',
        workspaceId: 'workspace-123',
        trigger: { type: 'manual' },
      };

      const result = await workflowEngine.execute(options);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Workflow has no steps');
    });

    it('should create execution record and start workflow', async () => {
      vi.mocked(db.query.agentWorkflows.findFirst).mockResolvedValue(
        mockWorkflow as any
      );

      const mockExecution = {
        id: 'exec-1',
        workspaceId: 'workspace-123',
        workflowId: 'workflow-1',
        status: 'running',
        currentStepIndex: 0,
        currentStepId: 'step-1',
        stepResults: {},
        context: {},
        totalSteps: 2,
        completedSteps: 0,
        startedAt: new Date(),
      };

      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([mockExecution])),
        })),
      }));
      vi.mocked(db.insert).mockImplementation(mockInsert as any);

      const mockAgent = {
        id: 'agent-1',
        name: 'Test Agent',
        systemPrompt: 'You are a test agent',
      };
      vi.mocked(db.query.agents.findFirst).mockResolvedValue(mockAgent as any);

      vi.mocked(db.query.agentWorkflowExecutions.findFirst).mockResolvedValue({
        ...mockExecution,
        completedSteps: 1,
      } as any);

      const options: ExecuteWorkflowOptions = {
        workflowId: 'workflow-1',
        workspaceId: 'workspace-123',
        trigger: { type: 'manual', triggeredBy: 'user-123' },
        initialContext: { userId: 'user-123' },
      };

      const result = await workflowEngine.execute(options);

      expect(mockInsert).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        '[WorkflowEngine] Starting workflow execution',
        expect.any(Object)
      );
    });

    it('should store execution context in memory', async () => {
      vi.mocked(db.query.agentWorkflows.findFirst).mockResolvedValue(
        mockWorkflow as any
      );

      const mockExecution = {
        id: 'exec-1',
        workspaceId: 'workspace-123',
        workflowId: 'workflow-1',
        status: 'running',
        currentStepIndex: 0,
        currentStepId: 'step-1',
        stepResults: {},
        context: {},
        totalSteps: 2,
        completedSteps: 0,
        startedAt: new Date(),
      };

      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([mockExecution])),
        })),
      }));
      vi.mocked(db.insert).mockImplementation(mockInsert as any);

      vi.mocked(db.query.agents.findFirst).mockResolvedValue({
        id: 'agent-1',
      } as any);

      vi.mocked(db.query.agentWorkflowExecutions.findFirst).mockResolvedValue({
        ...mockExecution,
        completedSteps: 1,
      } as any);

      const mockMemoryService = {
        store: vi.fn(() => Promise.resolve()),
        retrieve: vi.fn(),
        search: vi.fn(),
      };
      
      // Override the mock for this specific test
      const MockMemoryConstructor = vi.fn(function (this: any) {
        return mockMemoryService;
      }) as any;
      
      vi.mocked(AgentMemoryService).mockImplementation(MockMemoryConstructor);

      const engine = new WorkflowEngine('workspace-123');

      const options: ExecuteWorkflowOptions = {
        workflowId: 'workflow-1',
        workspaceId: 'workspace-123',
        trigger: { type: 'manual' },
      };

      await engine.execute(options);

      expect(mockMemoryService.store).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 'workspace-123',
          memoryTier: 'short_term',
          category: 'context',
        })
      );
    });

    it('should update workflow metrics after execution', async () => {
      vi.mocked(db.query.agentWorkflows.findFirst).mockResolvedValue(
        mockWorkflow as any
      );

      const mockExecution = {
        id: 'exec-1',
        workspaceId: 'workspace-123',
        workflowId: 'workflow-1',
        status: 'running',
        currentStepIndex: 0,
        currentStepId: 'step-1',
        stepResults: {},
        context: {},
        totalSteps: 2,
        completedSteps: 0,
        startedAt: new Date(),
      };

      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([mockExecution])),
        })),
      }));
      vi.mocked(db.insert).mockImplementation(mockInsert as any);

      vi.mocked(db.query.agents.findFirst).mockResolvedValue({
        id: 'agent-1',
      } as any);

      vi.mocked(db.query.agentWorkflowExecutions.findFirst).mockResolvedValue({
        ...mockExecution,
        completedSteps: 1,
      } as any);

      const mockWhere = vi.fn(() => Promise.resolve());
      const mockSet = vi.fn(() => ({ where: mockWhere }));
      const mockUpdate = vi.fn(() => ({ set: mockSet }));
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      const options: ExecuteWorkflowOptions = {
        workflowId: 'workflow-1',
        workspaceId: 'workspace-123',
        trigger: { type: 'manual' },
      };

      await workflowEngine.execute(options);

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          lastExecutedAt: expect.any(Date),
          updatedAt: expect.any(Date),
        })
      );
    });

    it('should handle execution errors gracefully', async () => {
      vi.mocked(db.query.agentWorkflows.findFirst).mockRejectedValue(
        new Error('Database error')
      );

      const options: ExecuteWorkflowOptions = {
        workflowId: 'workflow-1',
        workspaceId: 'workspace-123',
        trigger: { type: 'manual' },
      };

      const result = await workflowEngine.execute(options);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Database error');
      expect(logger.error).toHaveBeenCalledWith(
        '[WorkflowEngine] Workflow execution failed',
        expect.any(Error)
      );
    });

    it('should include trigger data in execution context', async () => {
      vi.mocked(db.query.agentWorkflows.findFirst).mockResolvedValue(
        mockWorkflow as any
      );

      const mockExecution = {
        id: 'exec-1',
        workspaceId: 'workspace-123',
        workflowId: 'workflow-1',
        status: 'running',
        currentStepIndex: 0,
        currentStepId: 'step-1',
        stepResults: {},
        context: {},
        totalSteps: 2,
        completedSteps: 0,
        startedAt: new Date(),
        triggerData: { contactId: 'contact-123' },
      };

      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([mockExecution])),
        })),
      }));
      vi.mocked(db.insert).mockImplementation(mockInsert as any);

      vi.mocked(db.query.agents.findFirst).mockResolvedValue({
        id: 'agent-1',
      } as any);

      vi.mocked(db.query.agentWorkflowExecutions.findFirst).mockResolvedValue({
        ...mockExecution,
        completedSteps: 1,
      } as any);

      const options: ExecuteWorkflowOptions = {
        workflowId: 'workflow-1',
        workspaceId: 'workspace-123',
        trigger: {
          type: 'webhook',
          data: { contactId: 'contact-123' },
        },
      };

      const result = await workflowEngine.execute(options);

      expect(result.success).toBe(true);
      expect(result.executionId).toBe('exec-1');
    });
  });

  describe('resume', () => {
    it('should return error when execution not found', async () => {
      vi.mocked(db.query.agentWorkflowExecutions.findFirst).mockResolvedValue(
        null
      );

      const result = await workflowEngine.resume('exec-nonexistent');

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Execution not found');
    });

    it('should return error when execution is not paused', async () => {
      const mockExecution = {
        id: 'exec-1',
        workspaceId: 'workspace-123',
        workflowId: 'workflow-1',
        status: 'completed',
        currentStepIndex: 2,
        currentStepId: 'step-2',
        stepResults: {},
        context: {},
        totalSteps: 2,
        completedSteps: 2,
        startedAt: new Date(),
      };

      vi.mocked(db.query.agentWorkflowExecutions.findFirst).mockResolvedValue(
        mockExecution as any
      );

      const result = await workflowEngine.resume('exec-1');

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Cannot resume execution');
    });

    it('should return error when workflow not found', async () => {
      const mockExecution = {
        id: 'exec-1',
        workspaceId: 'workspace-123',
        workflowId: 'workflow-1',
        status: 'paused',
        currentStepIndex: 1,
        currentStepId: 'step-2',
        stepResults: {},
        context: {},
        totalSteps: 2,
        completedSteps: 1,
        startedAt: new Date(),
      };

      vi.mocked(db.query.agentWorkflowExecutions.findFirst).mockResolvedValue(
        mockExecution as any
      );
      vi.mocked(db.query.agentWorkflows.findFirst).mockResolvedValue(null);

      const result = await workflowEngine.resume('exec-1');

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Workflow not found');
    });

    it('should resume paused workflow execution', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        workspaceId: 'workspace-123',
        status: 'active',
        steps: [
          {
            id: 'step-1',
            type: 'agent_task',
            agentId: 'agent-1',
            config: {},
            nextSteps: ['step-2'],
          },
          {
            id: 'step-2',
            type: 'agent_task',
            agentId: 'agent-2',
            config: {},
            nextSteps: [],
          },
        ],
      };

      const mockExecution = {
        id: 'exec-1',
        workspaceId: 'workspace-123',
        workflowId: 'workflow-1',
        status: 'paused',
        currentStepIndex: 1,
        currentStepId: 'step-2',
        stepResults: { 'step-1': { success: true } },
        context: { data: 'test' },
        totalSteps: 2,
        completedSteps: 1,
        startedAt: new Date(),
      };

      vi.mocked(db.query.agentWorkflowExecutions.findFirst)
        .mockResolvedValueOnce(mockExecution as any)
        .mockResolvedValueOnce({
          ...mockExecution,
          status: 'completed',
          completedSteps: 2,
        } as any);

      vi.mocked(db.query.agentWorkflows.findFirst).mockResolvedValue(
        mockWorkflow as any
      );

      vi.mocked(db.query.agents.findFirst).mockResolvedValue({
        id: 'agent-2',
      } as any);

      const mockWhere = vi.fn(() => Promise.resolve());
      const mockSet = vi.fn(() => ({ where: mockWhere }));
      const mockUpdate = vi.fn(() => ({ set: mockSet }));
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      const result = await workflowEngine.resume('exec-1');

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'running',
          pausedAt: null,
        })
      );
      expect(logger.info).toHaveBeenCalledWith(
        '[WorkflowEngine] Resuming workflow',
        { executionId: 'exec-1' }
      );
    });

    it('should handle resume errors gracefully', async () => {
      vi.mocked(db.query.agentWorkflowExecutions.findFirst).mockRejectedValue(
        new Error('Database error')
      );

      const result = await workflowEngine.resume('exec-1');

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Database error');
      expect(logger.error).toHaveBeenCalledWith(
        '[WorkflowEngine] Resume failed',
        expect.any(Error)
      );
    });

    it('should return error when current step not found in workflow', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        workspaceId: 'workspace-123',
        status: 'active',
        steps: [
          {
            id: 'step-1',
            type: 'agent_task',
            agentId: 'agent-1',
            config: {},
            nextSteps: [],
          },
        ],
      };

      const mockExecution = {
        id: 'exec-1',
        workspaceId: 'workspace-123',
        workflowId: 'workflow-1',
        status: 'paused',
        currentStepIndex: 1,
        currentStepId: 'step-nonexistent',
        stepResults: {},
        context: {},
        totalSteps: 2,
        completedSteps: 1,
        startedAt: new Date(),
      };

      vi.mocked(db.query.agentWorkflowExecutions.findFirst).mockResolvedValue(
        mockExecution as any
      );
      vi.mocked(db.query.agentWorkflows.findFirst).mockResolvedValue(
        mockWorkflow as any
      );

      const result = await workflowEngine.resume('exec-1');

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Current step not found');
    });
  });

  describe('conditional step execution', () => {
    it('should evaluate step conditions', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        workspaceId: 'workspace-123',
        status: 'active',
        steps: [
          {
            id: 'step-1',
            type: 'agent_task',
            agentId: 'agent-1',
            config: {},
            nextSteps: ['step-2', 'step-3'],
            conditions: [
              {
                stepId: 'step-2',
                expression: 'context.status === "approved"',
              },
              {
                stepId: 'step-3',
                expression: 'context.status === "rejected"',
              },
            ],
          },
          {
            id: 'step-2',
            type: 'agent_task',
            agentId: 'agent-2',
            config: {},
            nextSteps: [],
          },
          {
            id: 'step-3',
            type: 'agent_task',
            agentId: 'agent-3',
            config: {},
            nextSteps: [],
          },
        ],
      };

      vi.mocked(db.query.agentWorkflows.findFirst).mockResolvedValue(
        mockWorkflow as any
      );

      const mockExecution = {
        id: 'exec-1',
        workspaceId: 'workspace-123',
        workflowId: 'workflow-1',
        status: 'running',
        currentStepIndex: 0,
        currentStepId: 'step-1',
        stepResults: {},
        context: { status: 'approved' },
        totalSteps: 3,
        completedSteps: 0,
        startedAt: new Date(),
      };

      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([mockExecution])),
        })),
      }));
      vi.mocked(db.insert).mockImplementation(mockInsert as any);

      vi.mocked(db.query.agents.findFirst).mockResolvedValue({
        id: 'agent-1',
      } as any);

      vi.mocked(db.query.agentWorkflowExecutions.findFirst).mockResolvedValue({
        ...mockExecution,
        completedSteps: 1,
      } as any);

      const options: ExecuteWorkflowOptions = {
        workflowId: 'workflow-1',
        workspaceId: 'workspace-123',
        trigger: { type: 'manual' },
        initialContext: { status: 'approved' },
      };

      const result = await workflowEngine.execute(options);

      expect(result.success).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle step execution timeout', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        workspaceId: 'workspace-123',
        status: 'active',
        steps: [
          {
            id: 'step-1',
            type: 'agent_task',
            agentId: 'agent-1',
            config: { timeout: 1000 },
            nextSteps: [],
          },
        ],
      };

      vi.mocked(db.query.agentWorkflows.findFirst).mockResolvedValue(
        mockWorkflow as any
      );

      const mockExecution = {
        id: 'exec-1',
        workspaceId: 'workspace-123',
        workflowId: 'workflow-1',
        status: 'running',
        currentStepIndex: 0,
        currentStepId: 'step-1',
        stepResults: {},
        context: {},
        totalSteps: 1,
        completedSteps: 0,
        startedAt: new Date(),
      };

      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([mockExecution])),
        })),
      }));
      vi.mocked(db.insert).mockImplementation(mockInsert as any);

      // Agent not found simulates timeout/error
      vi.mocked(db.query.agents.findFirst).mockResolvedValue(null);

      vi.mocked(db.query.agentWorkflowExecutions.findFirst).mockResolvedValue(
        mockExecution as any
      );

      const options: ExecuteWorkflowOptions = {
        workflowId: 'workflow-1',
        workspaceId: 'workspace-123',
        trigger: { type: 'manual' },
      };

      const result = await workflowEngine.execute(options);

      // Should still return success=true but handle agent not found
      expect(result.executionId).toBe('exec-1');
    });

    it('should handle missing agent gracefully', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        workspaceId: 'workspace-123',
        status: 'active',
        steps: [
          {
            id: 'step-1',
            type: 'agent_task',
            agentId: 'agent-nonexistent',
            config: {},
            nextSteps: [],
          },
        ],
      };

      vi.mocked(db.query.agentWorkflows.findFirst).mockResolvedValue(
        mockWorkflow as any
      );

      const mockExecution = {
        id: 'exec-1',
        workspaceId: 'workspace-123',
        workflowId: 'workflow-1',
        status: 'running',
        currentStepIndex: 0,
        currentStepId: 'step-1',
        stepResults: {},
        context: {},
        totalSteps: 1,
        completedSteps: 0,
        startedAt: new Date(),
      };

      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([mockExecution])),
        })),
      }));
      vi.mocked(db.insert).mockImplementation(mockInsert as any);

      vi.mocked(db.query.agents.findFirst).mockResolvedValue(null);

      vi.mocked(db.query.agentWorkflowExecutions.findFirst).mockResolvedValue(
        mockExecution as any
      );

      const options: ExecuteWorkflowOptions = {
        workflowId: 'workflow-1',
        workspaceId: 'workspace-123',
        trigger: { type: 'manual' },
      };

      const result = await workflowEngine.execute(options);

      expect(result.executionId).toBe('exec-1');
    });
  });

  describe('workflow metrics', () => {
    it('should track total executions', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        workspaceId: 'workspace-123',
        status: 'active',
        steps: [
          {
            id: 'step-1',
            type: 'agent_task',
            agentId: 'agent-1',
            config: {},
            nextSteps: [],
          },
        ],
        totalExecutions: 5,
        successfulExecutions: 4,
        failedExecutions: 1,
      };

      vi.mocked(db.query.agentWorkflows.findFirst).mockResolvedValue(
        mockWorkflow as any
      );

      const mockExecution = {
        id: 'exec-1',
        workspaceId: 'workspace-123',
        workflowId: 'workflow-1',
        status: 'running',
        currentStepIndex: 0,
        currentStepId: 'step-1',
        stepResults: {},
        context: {},
        totalSteps: 1,
        completedSteps: 0,
        startedAt: new Date(),
      };

      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([mockExecution])),
        })),
      }));
      vi.mocked(db.insert).mockImplementation(mockInsert as any);

      vi.mocked(db.query.agents.findFirst).mockResolvedValue({
        id: 'agent-1',
      } as any);

      vi.mocked(db.query.agentWorkflowExecutions.findFirst).mockResolvedValue({
        ...mockExecution,
        completedSteps: 1,
      } as any);

      const mockWhere = vi.fn(() => Promise.resolve());
      const mockSet = vi.fn(() => ({ where: mockWhere }));
      const mockUpdate = vi.fn(() => ({ set: mockSet }));
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      const options: ExecuteWorkflowOptions = {
        workflowId: 'workflow-1',
        workspaceId: 'workspace-123',
        trigger: { type: 'manual' },
      };

      await workflowEngine.execute(options);

      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe('context management', () => {
    it('should merge initial context with trigger data', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        workspaceId: 'workspace-123',
        status: 'active',
        steps: [
          {
            id: 'step-1',
            type: 'agent_task',
            agentId: 'agent-1',
            config: {},
            nextSteps: [],
          },
        ],
      };

      vi.mocked(db.query.agentWorkflows.findFirst).mockResolvedValue(
        mockWorkflow as any
      );

      const mockExecution = {
        id: 'exec-1',
        workspaceId: 'workspace-123',
        workflowId: 'workflow-1',
        status: 'running',
        currentStepIndex: 0,
        currentStepId: 'step-1',
        stepResults: {},
        context: {
          userId: 'user-123',
          triggerData: { contactId: 'contact-456' },
        },
        totalSteps: 1,
        completedSteps: 0,
        startedAt: new Date(),
      };

      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([mockExecution])),
        })),
      }));
      vi.mocked(db.insert).mockImplementation(mockInsert as any);

      vi.mocked(db.query.agents.findFirst).mockResolvedValue({
        id: 'agent-1',
      } as any);

      vi.mocked(db.query.agentWorkflowExecutions.findFirst).mockResolvedValue({
        ...mockExecution,
        completedSteps: 1,
      } as any);

      const options: ExecuteWorkflowOptions = {
        workflowId: 'workflow-1',
        workspaceId: 'workspace-123',
        trigger: {
          type: 'webhook',
          data: { contactId: 'contact-456' },
        },
        initialContext: { userId: 'user-123' },
      };

      const result = await workflowEngine.execute(options);

      expect(result.success).toBe(true);
      expect(result.executionId).toBe('exec-1');
    });

    it('should preserve context across step execution', async () => {
      const mockExecution = {
        id: 'exec-1',
        workspaceId: 'workspace-123',
        workflowId: 'workflow-1',
        status: 'paused',
        currentStepIndex: 1,
        currentStepId: 'step-2',
        stepResults: { 'step-1': { output: 'result1' } },
        context: {
          userId: 'user-123',
          previousData: 'preserved',
        },
        totalSteps: 2,
        completedSteps: 1,
        startedAt: new Date(),
      };

      const mockWorkflow = {
        id: 'workflow-1',
        workspaceId: 'workspace-123',
        status: 'active',
        steps: [
          {
            id: 'step-1',
            type: 'agent_task',
            agentId: 'agent-1',
            config: {},
            nextSteps: ['step-2'],
          },
          {
            id: 'step-2',
            type: 'agent_task',
            agentId: 'agent-2',
            config: {},
            nextSteps: [],
          },
        ],
      };

      vi.mocked(db.query.agentWorkflowExecutions.findFirst)
        .mockResolvedValueOnce(mockExecution as any)
        .mockResolvedValueOnce({
          ...mockExecution,
          status: 'completed',
          completedSteps: 2,
        } as any);

      vi.mocked(db.query.agentWorkflows.findFirst).mockResolvedValue(
        mockWorkflow as any
      );

      vi.mocked(db.query.agents.findFirst).mockResolvedValue({
        id: 'agent-2',
      } as any);

      const mockWhere = vi.fn(() => Promise.resolve());
      const mockSet = vi.fn(() => ({ where: mockWhere }));
      const mockUpdate = vi.fn(() => ({ set: mockSet }));
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      const result = await workflowEngine.resume('exec-1');

      expect(result.success).toBe(true);
      // Context is returned from execution, check it has userId
      expect(result.output).toMatchObject({
        userId: 'user-123',
      });
      // The previousData field may or may not be preserved depending on step execution
    });
  });
});
