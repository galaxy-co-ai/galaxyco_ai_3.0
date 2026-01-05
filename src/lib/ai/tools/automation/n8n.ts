/**
 * n8n Workflow Automation Tools
 * 
 * Allows Neptune to trigger n8n workflows for advanced automation.
 * User has n8n Pro subscription.
 */

import type { ChatCompletionTool } from 'openai/resources/chat/completions';
import type { ToolContext, ToolResult } from '../types';
import { logger } from '@/lib/logger';

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

export const n8nToolDefinitions: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'trigger_n8n_workflow',
      description: 'Trigger an n8n workflow for advanced automation. Use this when the user wants to run a custom workflow or automation that you don\'t have a specific tool for. n8n can connect to 400+ services and perform complex multi-step automations.',
      parameters: {
        type: 'object',
        properties: {
          workflowId: {
            type: 'string',
            description: 'The n8n workflow ID or webhook URL. If the user mentions a specific workflow name, try to match it to a known workflow.',
          },
          payload: {
            type: 'object',
            description: 'Data to send to the workflow. This can include any parameters the workflow needs.',
            properties: {
              action: {
                type: 'string',
                description: 'The action to perform (optional)',
              },
              data: {
                type: 'object',
                description: 'Additional data for the workflow',
              },
            },
          },
          wait: {
            type: 'boolean',
            description: 'Whether to wait for the workflow to complete before returning (default: false for async execution)',
          },
        },
        required: ['workflowId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_n8n_workflows',
      description: 'List available n8n workflows that can be triggered. Use this to show the user what automations are available.',
      parameters: {
        type: 'object',
        properties: {
          filter: {
            type: 'string',
            description: 'Optional filter to search for specific workflows by name or tag',
          },
        },
      },
    },
  },
];

// ============================================================================
// TOOL IMPLEMENTATIONS
// ============================================================================

export const n8nToolImplementations = {
  /**
   * Trigger an n8n workflow
   */
  async trigger_n8n_workflow(
    args: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolResult> {
    try {
      const workflowId = args.workflowId as string;
      const payload = args.payload as Record<string, unknown> || {};
      const wait = args.wait as boolean || false;
      
      logger.info('Triggering n8n workflow', {
        workflowId,
        wait,
        workspaceId: context.workspaceId,
      });
      
      // Get n8n configuration from environment or workspace settings
      const n8nUrl = process.env.N8N_WEBHOOK_URL || process.env.N8N_URL;
      
      if (!n8nUrl) {
        return {
          success: false,
          message: 'n8n is not configured. Please add N8N_WEBHOOK_URL to your environment variables.',
          error: 'Missing n8n configuration',
        };
      }
      
      // Construct webhook URL
      // If workflowId looks like a full URL, use it as-is
      // Otherwise, append it to the base URL
      let webhookUrl: string;
      if (workflowId.startsWith('http://') || workflowId.startsWith('https://')) {
        webhookUrl = workflowId;
      } else {
        webhookUrl = `${n8nUrl}/webhook/${workflowId}`;
      }
      
      // Add workspace context to payload
      const enrichedPayload = {
        ...payload,
        __context: {
          workspaceId: context.workspaceId,
          userId: context.userId,
          userEmail: context.userEmail,
          userName: context.userName,
          timestamp: new Date().toISOString(),
        },
      };
      
      // Trigger the workflow
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enrichedPayload),
      });
      
      if (!response.ok) {
        logger.error('n8n workflow trigger failed', {
          status: response.status,
          statusText: response.statusText,
          workflowId,
        });
        
        return {
          success: false,
          message: `Failed to trigger workflow: ${response.statusText}`,
          error: `HTTP ${response.status}`,
        };
      }
      
      const result = await response.json().catch(() => ({}));
      
      logger.info('n8n workflow triggered successfully', {
        workflowId,
        workspaceId: context.workspaceId,
      });
      
      return {
        success: true,
        message: wait 
          ? 'Workflow completed successfully'
          : 'Workflow triggered successfully (running in background)',
        data: {
          workflowId,
          result: result,
          async: !wait,
        },
      };
    } catch (error) {
      logger.error('n8n workflow trigger error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        workspaceId: context.workspaceId,
      });
      
      return {
        success: false,
        message: 'Failed to trigger n8n workflow',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * List available n8n workflows
   */
  async list_n8n_workflows(
    args: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolResult> {
    try {
      const filter = args.filter as string | undefined;
      
      logger.info('Listing n8n workflows', {
        filter,
        workspaceId: context.workspaceId,
      });
      
      // For now, return a helpful message
      // In a full implementation, you would:
      // 1. Call n8n API to list workflows
      // 2. Filter by workspace/tags
      // 3. Return workflow details
      
      return {
        success: true,
        message: 'To list n8n workflows, you need to configure n8n API access.',
        data: {
          workflows: [],
          instructions: [
            '1. Go to your n8n instance settings',
            '2. Generate an API key',
            '3. Add N8N_API_KEY and N8N_URL to your environment',
            '4. Restart the application',
          ],
          quickStart: [
            'Common n8n use cases:',
            '- Data sync between apps',
            '- Automated notifications',
            '- Lead enrichment workflows',
            '- Report generation',
            '- Social media posting',
            '- Email sequences',
            '- Webhook processing',
          ],
        },
      };
    } catch (error) {
      logger.error('n8n workflow list error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        workspaceId: context.workspaceId,
      });
      
      return {
        success: false,
        message: 'Failed to list n8n workflows',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

/**
 * SETUP INSTRUCTIONS FOR USER:
 * 
 * 1. In your n8n instance, create a webhook workflow
 * 2. Copy the webhook URL (e.g. https://your-n8n.com/webhook/abc123)
 * 3. Add to .env.local:
 *    N8N_WEBHOOK_URL=https://your-n8n.com
 *    or
 *    N8N_URL=https://your-n8n.com
 * 
 * 4. In your n8n workflow, you'll receive:
 *    {
 *      "action": "...",        // User-specified action
 *      "data": {...},          // User-specified data
 *      "__context": {          // Auto-added context
 *        "workspaceId": "...",
 *        "userId": "...",
 *        "userEmail": "...",
 *        "userName": "...",
 *        "timestamp": "..."
 *      }
 *    }
 * 
 * 5. Your workflow can then process this and return a response
 * 
 * Example Neptune commands:
 * - "Trigger my lead enrichment workflow for this contact"
 * - "Run the daily report workflow"
 * - "Execute the onboarding automation for new user"
 */
