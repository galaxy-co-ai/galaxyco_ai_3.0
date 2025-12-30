/**
 * Tasks Tool Definitions
 */
import type { ToolDefinitions } from '../types';

export const tasksToolDefinitions: ToolDefinitions = [
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Create a new task or to-do item. Use this when the user wants to add something to their task list.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Title of the task (required)',
          },
          description: {
            type: 'string',
            description: 'Detailed description of the task',
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'urgent'],
            description: 'Priority level of the task',
          },
          dueDate: {
            type: 'string',
            description: 'Due date in ISO 8601 format',
          },
        },
        required: ['title'],
      },
    },
  },
];
