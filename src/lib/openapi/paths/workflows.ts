import { z } from 'zod';
import { registerRoute, successResponse, paginatedResponse } from '../registry';
import { UserRefSchema } from '../schemas/common';

/**
 * Workflow & Orchestration API Endpoints
 * 
 * Visual workflow builder (Galaxy Grids), multi-agent teams,
 * approvals, and execution management
 */

// Node type enum
const NodeTypeSchema = z.enum([
  'trigger',
  'ai-text',
  'ai-vision',
  'conditional',
  'data-transform',
  'http-request',
  'delay',
  'send-email',
  'create-contact',
  'update-deal',
  'search-knowledge',
  'agent-task'
]);

// Workflow node schema
const WorkflowNodeSchema = z.object({
  id: z.string(),
  type: NodeTypeSchema,
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.record(z.any()).describe('Node-specific configuration'),
}).openapi('WorkflowNode');

// Workflow edge schema
const WorkflowEdgeSchema = z.object({
  id: z.string(),
  source: z.string().describe('Source node ID'),
  target: z.string().describe('Target node ID'),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
}).openapi('WorkflowEdge');

// Workflow schema
const WorkflowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'archived']),
  nodes: z.array(WorkflowNodeSchema),
  edges: z.array(WorkflowEdgeSchema),
  trigger: z.object({
    type: z.enum(['manual', 'webhook', 'schedule', 'event']),
    config: z.record(z.any()).optional(),
  }).optional(),
  version: z.number().int().default(1),
  executionCount: z.number().int().default(0),
  lastExecutedAt: z.string().datetime().optional(),
  createdBy: UserRefSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('Workflow');

// Execution result schema
const ExecutionResultSchema = z.object({
  executionId: z.string().uuid(),
  workflowId: z.string().uuid(),
  status: z.enum(['running', 'completed', 'failed', 'cancelled']),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  duration: z.number().int().describe('Duration in milliseconds'),
  input: z.record(z.any()).optional(),
  output: z.record(z.any()).optional(),
  error: z.string().optional(),
  nodeExecutions: z.array(z.object({
    nodeId: z.string(),
    nodeType: NodeTypeSchema,
    status: z.enum(['pending', 'running', 'completed', 'failed', 'skipped']),
    input: z.record(z.any()).optional(),
    output: z.record(z.any()).optional(),
    error: z.string().optional(),
    duration: z.number().int(),
  })),
}).openapi('WorkflowExecutionResult');

// Agent team schema
const AgentTeamSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  agents: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    role: z.string(),
    capabilities: z.array(z.string()),
  })),
  coordinationMode: z.enum(['sequential', 'parallel', 'hierarchical']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('AgentTeam');

// Approval request schema
const ApprovalRequestSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['workflow_execution', 'agent_action', 'data_change', 'expense', 'deal']),
  title: z.string(),
  description: z.string(),
  requestedBy: UserRefSchema,
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  metadata: z.record(z.any()).optional(),
  approvedBy: UserRefSchema.optional(),
  approvedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
}).openapi('ApprovalRequest');

/**
 * POST /api/workflows
 * Create workflow
 */
registerRoute({
  method: 'post',
  path: '/api/workflows',
  tags: ['Workflows'],
  summary: 'Create workflow',
  description: 'Create a new visual workflow (Galaxy Grid)',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().min(1).max(200),
            description: z.string().optional(),
            nodes: z.array(WorkflowNodeSchema),
            edges: z.array(WorkflowEdgeSchema),
            trigger: z.object({
              type: z.enum(['manual', 'webhook', 'schedule', 'event']),
              config: z.record(z.any()).optional(),
            }).optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Workflow created',
      content: {
        'application/json': {
          schema: successResponse(WorkflowSchema),
        },
      },
    },
  },
});

/**
 * GET /api/workflows
 * List workflows
 */
registerRoute({
  method: 'get',
  path: '/api/workflows',
  tags: ['Workflows'],
  summary: 'List workflows',
  description: 'Get all workflows with filtering',
  request: {
    query: z.object({
      page: z.coerce.number().int().min(1).default(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
      status: z.enum(['draft', 'active', 'paused', 'archived']).optional(),
      search: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of workflows',
      content: {
        'application/json': {
          schema: paginatedResponse(WorkflowSchema),
        },
      },
    },
  },
});

/**
 * GET /api/workflows/[id]
 * Get workflow
 */
registerRoute({
  method: 'get',
  path: '/api/workflows/{id}',
  tags: ['Workflows'],
  summary: 'Get workflow',
  description: 'Retrieve a specific workflow with full details',
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Workflow details',
      content: {
        'application/json': {
          schema: successResponse(WorkflowSchema),
        },
      },
    },
  },
});

/**
 * PUT /api/workflows/[id]
 * Update workflow
 */
registerRoute({
  method: 'put',
  path: '/api/workflows/{id}',
  tags: ['Workflows'],
  summary: 'Update workflow',
  description: 'Update an existing workflow',
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().min(1).max(200).optional(),
            description: z.string().optional(),
            status: z.enum(['draft', 'active', 'paused', 'archived']).optional(),
            nodes: z.array(WorkflowNodeSchema).optional(),
            edges: z.array(WorkflowEdgeSchema).optional(),
            trigger: z.object({
              type: z.enum(['manual', 'webhook', 'schedule', 'event']),
              config: z.record(z.any()).optional(),
            }).optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Workflow updated',
      content: {
        'application/json': {
          schema: successResponse(WorkflowSchema),
        },
      },
    },
  },
});

/**
 * DELETE /api/workflows/[id]
 * Delete workflow
 */
registerRoute({
  method: 'delete',
  path: '/api/workflows/{id}',
  tags: ['Workflows'],
  summary: 'Delete workflow',
  description: 'Permanently delete a workflow',
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Workflow deleted',
      content: {
        'application/json': {
          schema: successResponse(z.object({
            deleted: z.boolean(),
          })),
        },
      },
    },
  },
});

/**
 * POST /api/workflows/[id]/execute
 * Execute workflow
 */
registerRoute({
  method: 'post',
  path: '/api/workflows/{id}/execute',
  tags: ['Workflows'],
  summary: 'Execute workflow',
  description: 'Manually trigger a workflow execution',
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            input: z.record(z.any()).optional().describe('Input data for the workflow'),
            waitForCompletion: z.boolean().default(false).optional().describe('Wait for execution to complete'),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Workflow execution result',
      content: {
        'application/json': {
          schema: successResponse(ExecutionResultSchema),
        },
      },
    },
  },
});

/**
 * GET /api/orchestration/teams
 * List agent teams
 */
registerRoute({
  method: 'get',
  path: '/api/orchestration/teams',
  tags: ['Orchestration'],
  summary: 'List agent teams',
  description: 'Get all multi-agent teams',
  request: {
    query: z.object({
      page: z.coerce.number().int().min(1).default(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of agent teams',
      content: {
        'application/json': {
          schema: paginatedResponse(AgentTeamSchema),
        },
      },
    },
  },
});

/**
 * GET /api/orchestration/approvals
 * List approval requests
 */
registerRoute({
  method: 'get',
  path: '/api/orchestration/approvals',
  tags: ['Orchestration'],
  summary: 'List approval requests',
  description: 'Get pending and recent approval requests',
  request: {
    query: z.object({
      status: z.enum(['pending', 'approved', 'rejected', 'cancelled']).optional(),
      type: z.enum(['workflow_execution', 'agent_action', 'data_change', 'expense', 'deal']).optional(),
      page: z.coerce.number().int().min(1).default(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of approval requests',
      content: {
        'application/json': {
          schema: paginatedResponse(ApprovalRequestSchema),
        },
      },
    },
  },
});

/**
 * POST /api/orchestration/approvals/[id]
 * Approve or reject
 */
registerRoute({
  method: 'post',
  path: '/api/orchestration/approvals/{id}',
  tags: ['Orchestration'],
  summary: 'Approve or reject request',
  description: 'Approve or reject an approval request',
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            action: z.enum(['approve', 'reject']),
            comments: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Approval processed',
      content: {
        'application/json': {
          schema: successResponse(ApprovalRequestSchema),
        },
      },
    },
  },
});

