/**
 * Finance Tool Definitions
 */
import type { ToolDefinitions } from '../types';

export const financeToolDefinitions: ToolDefinitions = [
  {
    type: 'function',
    function: {
      name: 'get_finance_summary',
      description: 'Get a summary of the user\'s financial data including revenue, expenses, profit, and cash flow from connected integrations (QuickBooks, Stripe, Shopify).',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['today', 'this_week', 'this_month', 'last_month', 'this_quarter', 'this_year'],
            description: 'The time period to summarize',
          },
        },
        required: ['period'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_overdue_invoices',
      description: 'Get a list of overdue invoices that need attention. Useful for following up on unpaid invoices.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Maximum number of invoices to return (default: 10)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_invoice_reminder',
      description: 'Send a payment reminder email for an overdue invoice to the customer.',
      parameters: {
        type: 'object',
        properties: {
          invoiceId: {
            type: 'string',
            description: 'The ID of the invoice to send a reminder for',
          },
          customMessage: {
            type: 'string',
            description: 'Optional custom message to include in the reminder email',
          },
        },
        required: ['invoiceId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_cash_flow_forecast',
      description: 'Generate a cash flow forecast for the next 30, 60, or 90 days based on historical data and pending invoices.',
      parameters: {
        type: 'object',
        properties: {
          days: {
            type: 'number',
            enum: [30, 60, 90],
            description: 'Number of days to forecast',
          },
        },
        required: ['days'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compare_financial_periods',
      description: 'Compare financial metrics between two time periods to show growth or changes.',
      parameters: {
        type: 'object',
        properties: {
          metric: {
            type: 'string',
            enum: ['revenue', 'expenses', 'profit', 'orders', 'invoices'],
            description: 'The metric to compare',
          },
          period1: {
            type: 'string',
            enum: ['this_week', 'this_month', 'this_quarter', 'this_year'],
            description: 'First period to compare',
          },
          period2: {
            type: 'string',
            enum: ['last_week', 'last_month', 'last_quarter', 'last_year'],
            description: 'Second period to compare',
          },
        },
        required: ['metric', 'period1', 'period2'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_finance_integrations',
      description: 'Get the status of connected finance integrations (QuickBooks, Stripe, Shopify).',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'auto_categorize_expenses',
      description: 'Automatically tag expenses by category based on merchant, description, and amount patterns.',
      parameters: {
        type: 'object',
        properties: {
          expenseIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'IDs of expenses to categorize (optional, will categorize all uncategorized if not provided)',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'flag_anomalies',
      description: 'Identify unusual transactions, expenses, or financial patterns that may need attention.',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['week', 'month', 'quarter'],
            description: 'Time period to analyze',
          },
          threshold: {
            type: 'number',
            description: 'Anomaly detection threshold (optional, uses default if not provided)',
          },
        },
        required: ['period'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'project_cash_flow',
      description: 'Generate 30/60/90 day cash flow forecasts based on current financial data, invoices, and expenses.',
      parameters: {
        type: 'object',
        properties: {
          includeScenarios: {
            type: 'boolean',
            description: 'Whether to include best/worst case scenarios',
          },
          assumptions: {
            type: 'object',
            description: 'Custom assumptions for projection (optional)',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_payment_reminders',
      description: 'Auto-draft and optionally send payment reminder emails for overdue invoices. Creates draft emails ready for review.',
      parameters: {
        type: 'object',
        properties: {
          invoiceIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'IDs of invoices to send reminders for (optional, will use all overdue if not provided)',
          },
          autoSend: {
            type: 'boolean',
            description: 'Whether to automatically send (false = create drafts only)',
          },
        },
        required: [],
      },
    },
  },
];
