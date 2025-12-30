/**
 * Content Tool Definitions
 * 
 * Placeholder - Full extraction in progress
 */
import type { ToolDefinitions } from '../types';

export const contentToolDefinitions: ToolDefinitions = [
  {
    type: 'function',
    function: {
      name: 'draft_email',
      description: 'Generate a draft email for a specific purpose.',
      parameters: {
        type: 'object',
        properties: {
          purpose: { type: 'string' },
          recipientName: { type: 'string' },
        },
      },
    },
  },
];
