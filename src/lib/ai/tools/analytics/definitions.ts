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
  {
    type: 'function',
    function: {
      name: 'get_conversion_metrics',
      description: 'Get pipeline conversion rates and metrics between stages.',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['week', 'month', 'quarter', 'year'],
            description: 'Time period for metrics',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'forecast_revenue',
      description: 'Get revenue forecast based on pipeline and historical data.',
      parameters: {
        type: 'object',
        properties: {
          months: {
            type: 'number',
            description: 'Number of months to forecast (default: 3)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_team_performance',
      description: 'Get team performance metrics (leads handled, deals closed, etc.).',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['week', 'month', 'quarter'],
            description: 'Time period for metrics',
          },
        },
      },
    },
  },
];
