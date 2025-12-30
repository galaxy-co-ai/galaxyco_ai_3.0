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
  {
    type: 'function',
    function: {
      name: 'prioritize_tasks',
      description: 'Re-order task list by urgency and impact. Analyzes due dates, dependencies, and importance to create optimal task order.',
      parameters: {
        type: 'object',
        properties: {
          taskIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'IDs of tasks to prioritize (optional, will prioritize all if not provided)',
          },
          priorityMethod: {
            type: 'string',
            enum: ['urgency', 'impact', 'balanced'],
            description: 'Method for prioritization',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'batch_similar_tasks',
      description: 'Group similar tasks together for efficient batch execution. Identifies tasks that can be done together.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Category to batch (e.g., "emails", "calls", "data_entry")',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'organize_documents',
      description: 'Automatically tag and categorize knowledge base items based on content analysis. Improves document discoverability.',
      parameters: {
        type: 'object',
        properties: {
          collectionId: {
            type: 'string',
            description: 'ID of collection to organize (optional, will organize all if not provided)',
          },
          autoTag: {
            type: 'boolean',
            description: 'Whether to automatically generate tags from content',
          },
        },
        required: [],
      },
    },
  },
];
