/**
 * Analytics Tool Definitions
 */
import type { ToolDefinitions } from '../types';

export const analyticsToolDefinitions: ToolDefinitions = [
  {
    type: 'function',
    function: {
      name: 'get_pipeline_summary',
      description: 'Get a summary of the sales pipeline including total leads, conversion rates, and deal values by stage.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_hot_leads',
      description: 'Get the highest priority leads that are most likely to close. Uses lead score and stage.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Maximum number of leads to return (default: 5)',
          },
        },
      },
    },
  },
];
