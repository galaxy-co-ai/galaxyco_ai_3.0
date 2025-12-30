/**
 * Orchestration Tool Definitions
 */
import type { ToolDefinitions } from '../types';

export const orchestrationToolDefinitions: ToolDefinitions = [
  // Team Management
  {
    type: 'function',
    function: {
      name: 'create_agent_team',
      description: 'Create a new agent team for a department. Use this when the user wants to set up a team of AI agents to work together on a specific department like sales, marketing, support, or operations. Can optionally use a pre-built template.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the team (e.g., "Sales Team", "My Support Squad")',
          },
          department: {
            type: 'string',
            enum: ['sales', 'marketing', 'support', 'operations', 'finance', 'product', 'general'],
            description: 'The department this team belongs to',
          },
          description: {
            type: 'string',
            description: 'Description of what the team does',
          },
          templateId: {
            type: 'string',
            enum: ['sales-team', 'marketing-team', 'support-team', 'operations-team'],
            description: 'Optional: Use a pre-built template to set up the team with recommended agents and workflows',
          },
          autonomyLevel: {
            type: 'string',
            enum: ['supervised', 'semi_autonomous', 'autonomous'],
            description: 'How independently the team can operate. Default is supervised.',
          },
          memberAgentIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional: Array of existing agent IDs to add as team members',
          },
        },
        required: ['name', 'department'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_agent_teams',
      description: 'List all agent teams in the workspace. Use this when the user asks about their teams, wants to see what teams exist, or needs to find a specific team.',
      parameters: {
        type: 'object',
        properties: {
          department: {
            type: 'string',
            enum: ['sales', 'marketing', 'support', 'operations', 'finance', 'product', 'general'],
            description: 'Optional: Filter teams by department',
          },
          status: {
            type: 'string',
            enum: ['active', 'paused', 'archived'],
            description: 'Optional: Filter by team status',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of teams to return (default: 20)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_agent_team',
      description: 'Run an agent team with a specific objective. Use this when the user wants a team to execute a task or achieve a goal, like "Have the sales team follow up with stalled deals" or "Run the marketing team to create social content".',
      parameters: {
        type: 'object',
        properties: {
          teamId: {
            type: 'string',
            description: 'The ID of the team to run',
          },
          teamName: {
            type: 'string',
            description: 'Alternative: The name of the team to run (if teamId not provided)',
          },
          objective: {
            type: 'string',
            description: 'The high-level objective for the team to achieve',
          },
          priority: {
            type: 'string',
            enum: ['low', 'normal', 'high', 'urgent'],
            description: 'Priority level for this execution',
          },
          context: {
            type: 'object',
            description: 'Optional: Additional context data for the team',
          },
        },
        required: ['objective'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_team_status',
      description: 'Get the current status and details of an agent team. Use this when the user asks about a team\'s status, members, recent activity, or performance.',
      parameters: {
        type: 'object',
        properties: {
          teamId: {
            type: 'string',
            description: 'The ID of the team',
          },
          teamName: {
            type: 'string',
            description: 'Alternative: The name of the team (if teamId not provided)',
          },
          includeMembers: {
            type: 'boolean',
            description: 'Whether to include team member details (default: true)',
          },
          includeRecentActivity: {
            type: 'boolean',
            description: 'Whether to include recent execution history (default: true)',
          },
        },
      },
    },
  },

  // Workflow Management
  {
    type: 'function',
    function: {
      name: 'create_workflow',
      description: 'Create a multi-agent workflow that chains multiple agents together. Use this when the user wants to set up an automated process like "workflow for handling support tickets" or "pipeline for lead processing".',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the workflow',
          },
          description: {
            type: 'string',
            description: 'Description of what the workflow does',
          },
          teamId: {
            type: 'string',
            description: 'Optional: Associate with a specific team',
          },
          triggerType: {
            type: 'string',
            enum: ['manual', 'event', 'schedule', 'agent_request'],
            description: 'How the workflow is triggered',
          },
          templateType: {
            type: 'string',
            enum: ['lead_to_customer', 'content_campaign', 'support_ticket'],
            description: 'Optional: Use a pre-built workflow template',
          },
          steps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                agentId: { type: 'string' },
                action: { type: 'string' },
                inputs: { type: 'object' },
              },
            },
            description: 'Array of workflow steps (only if not using a template)',
          },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'execute_workflow',
      description: 'Execute a workflow. Use this when the user wants to run a specific workflow or start an automated process.',
      parameters: {
        type: 'object',
        properties: {
          workflowId: {
            type: 'string',
            description: 'The ID of the workflow to execute',
          },
          workflowName: {
            type: 'string',
            description: 'Alternative: The name of the workflow (if workflowId not provided)',
          },
          context: {
            type: 'object',
            description: 'Optional: Initial context data for the workflow',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_workflow_status',
      description: 'Get the status of a workflow or its recent executions. Use this when the user asks about workflow status, progress, or execution history.',
      parameters: {
        type: 'object',
        properties: {
          workflowId: {
            type: 'string',
            description: 'The ID of the workflow',
          },
          workflowName: {
            type: 'string',
            description: 'Alternative: The name of the workflow',
          },
          executionId: {
            type: 'string',
            description: 'Optional: Get status of a specific execution',
          },
          includeExecutions: {
            type: 'boolean',
            description: 'Whether to include recent execution history (default: true)',
          },
        },
      },
    },
  },

  // Orchestration
  {
    type: 'function',
    function: {
      name: 'delegate_to_agent',
      description: 'Delegate a task to a specific AI agent. Use this when the user wants to assign a task to a particular agent or when you need to route work to a specialist.',
      parameters: {
        type: 'object',
        properties: {
          agentId: {
            type: 'string',
            description: 'The ID of the agent to delegate to',
          },
          agentName: {
            type: 'string',
            description: 'Alternative: The name of the agent',
          },
          taskDescription: {
            type: 'string',
            description: 'Description of the task to delegate',
          },
          priority: {
            type: 'string',
            enum: ['low', 'normal', 'high', 'urgent'],
            description: 'Priority level for this task',
          },
          context: {
            type: 'object',
            description: 'Optional: Additional context data for the task',
          },
        },
        required: ['taskDescription'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'coordinate_agents',
      description: 'Coordinate multiple agents to work together on a complex task. Use this when a task requires input from several agents working in sequence or parallel.',
      parameters: {
        type: 'object',
        properties: {
          objective: {
            type: 'string',
            description: 'The overall objective for the agents to achieve',
          },
          agentIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of agent IDs to coordinate',
          },
          teamId: {
            type: 'string',
            description: 'Alternative: Use all agents from a specific team',
          },
          executionMode: {
            type: 'string',
            enum: ['sequential', 'parallel'],
            description: 'Whether to run agents one after another or simultaneously',
          },
          context: {
            type: 'object',
            description: 'Optional: Shared context data for all agents',
          },
        },
        required: ['objective'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_agent_availability',
      description: 'Check which agents are available and their current status. Use this to find available agents before delegating tasks or to check workload.',
      parameters: {
        type: 'object',
        properties: {
          department: {
            type: 'string',
            enum: ['sales', 'marketing', 'support', 'operations', 'finance', 'product', 'general'],
            description: 'Optional: Filter by department',
          },
          teamId: {
            type: 'string',
            description: 'Optional: Filter by team',
          },
          capabilities: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional: Filter by required capabilities',
          },
        },
      },
    },
  },

  // Memory
  {
    type: 'function',
    function: {
      name: 'store_shared_context',
      description: 'Store context that can be shared between agents. Use this to save important information that multiple agents might need to access.',
      parameters: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            description: 'A unique key to identify this context',
          },
          value: {
            type: 'object',
            description: 'The context data to store',
          },
          category: {
            type: 'string',
            enum: ['context', 'pattern', 'preference', 'knowledge', 'relationship'],
            description: 'Category of memory',
          },
          teamId: {
            type: 'string',
            description: 'Optional: Associate with a specific team',
          },
          agentId: {
            type: 'string',
            description: 'Optional: Associate with a specific agent',
          },
          importance: {
            type: 'number',
            description: 'Importance score 0-100 (affects retention)',
          },
        },
        required: ['key', 'value'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'retrieve_agent_memory',
      description: 'Retrieve relevant memories or context for an agent or team. Use this to access stored information, patterns, or knowledge.',
      parameters: {
        type: 'object',
        properties: {
          agentId: {
            type: 'string',
            description: 'Retrieve memories for a specific agent',
          },
          teamId: {
            type: 'string',
            description: 'Retrieve memories for a specific team',
          },
          category: {
            type: 'string',
            enum: ['context', 'pattern', 'preference', 'knowledge', 'relationship'],
            description: 'Optional: Filter by category',
          },
          keyPattern: {
            type: 'string',
            description: 'Optional: Filter by key pattern',
          },
          minImportance: {
            type: 'number',
            description: 'Optional: Minimum importance score',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of memories to retrieve (default: 20)',
          },
        },
      },
    },
  },
];
