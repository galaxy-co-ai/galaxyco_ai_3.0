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
];
