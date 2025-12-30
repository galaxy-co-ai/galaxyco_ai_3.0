/**
 * Agents Tool Definitions
 */
import type { ToolDefinitions } from '../types';

export const agentsToolDefinitions: ToolDefinitions = [
  {
    type: 'function',
    function: {
      name: 'list_agents',
      description: 'List available AI agents and automations. Use this to show what agents are configured.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['draft', 'active', 'paused', 'archived'],
            description: 'Filter by agent status',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_automation',
      description: 'Create a workflow automation from a natural language description. Use when user wants to automate a process.',
      parameters: {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            description: 'Natural language description of the automation (e.g., "When a lead reaches qualified stage, send a welcome email")',
          },
        },
        required: ['description'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'assign_to_team_member',
      description: 'Assign a task to a specific team member. Use when user wants to delegate work.',
      parameters: {
        type: 'object',
        properties: {
          task_title: {
            type: 'string',
            description: 'Title of the task to assign',
          },
          assignee_name: {
            type: 'string',
            description: 'Name or email of the team member to assign to',
          },
          description: {
            type: 'string',
            description: 'Optional task description',
          },
          due_date: {
            type: 'string',
            description: 'Optional due date (ISO format or relative like "tomorrow", "next week")',
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            description: 'Task priority (default: medium)',
          },
        },
        required: ['task_title', 'assignee_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_team_members',
      description: 'Get a list of team members in the workspace. Use to see who is available for assignment.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_agent',
      description: 'Create a new AI agent or automation. Use this when the user wants to create an agent to automate a task, process, or workflow.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the agent (required)',
          },
          description: {
            type: 'string',
            description: 'Description of what the agent does',
          },
          type: {
            type: 'string',
            enum: ['scope', 'call', 'email', 'note', 'task', 'roadmap', 'content', 'custom', 'browser', 'cross-app', 'knowledge', 'sales', 'trending', 'research', 'meeting', 'code', 'data', 'security'],
            description: 'Type of agent: scope (scoping/planning), call (phone call automation), email (email automation), note (note-taking), task (task automation), roadmap (roadmap generation), content (content creation), custom (general purpose), browser (web automation), cross-app (multi-app workflow), knowledge (knowledge base), sales (sales automation), trending (trend analysis), research (research agent), meeting (meeting automation), code (code generation), data (data processing), security (security checks)',
          },
          systemPrompt: {
            type: 'string',
            description: 'Specific instructions for how the agent should behave or what task it should perform',
          },
          capabilities: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of capabilities the agent should have (e.g., ["email", "crm", "web_search"])',
          },
          status: {
            type: 'string',
            enum: ['draft', 'active'],
            description: 'Initial status: draft (needs review) or active (ready to use). Default: active',
          },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_agent',
      description: 'Trigger/run an AI agent or automation workflow.',
      parameters: {
        type: 'object',
        properties: {
          agentId: {
            type: 'string',
            description: 'The ID of the agent to run',
          },
          agentName: {
            type: 'string',
            description: 'The name of the agent (alternative to ID)',
          },
          inputs: {
            type: 'object',
            description: 'Input parameters for the agent',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_agent_status',
      description: 'Check the status and recent executions of an agent.',
      parameters: {
        type: 'object',
        properties: {
          agentId: {
            type: 'string',
            description: 'The agent ID to check',
          },
        },
        required: ['agentId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_agent_quick',
      description: 'Create an AI agent using natural language description and smart templates. This is the FAST path - it automatically matches templates, infers capabilities, and applies smart defaults. Use this for one-shot agent creation.',
      parameters: {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            description: 'What the agent should do, in natural language. Example: "follow up with leads weekly" or "respond to customer emails"',
          },
          templateId: {
            type: 'string',
            description: 'Optional template ID to use as starting point (lead-followup, email-responder, data-enrichment, report-generator, meeting-scheduler, lead-scorer, social-monitor, invoice-reminder)',
          },
          name: {
            type: 'string',
            description: 'Optional custom name for the agent. If not provided, will be generated from description.',
          },
          customizations: {
            type: 'object',
            description: 'Optional customizations (trigger timing, capabilities, etc.)',
          },
        },
        required: ['description'],
      },
    },
  },
];
