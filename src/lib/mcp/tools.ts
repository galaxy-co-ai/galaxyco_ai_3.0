/**
 * Neptune MCP Tools
 * 
 * Tool definitions and handlers for the MCP server.
 * These enable ChatGPT to interact with GalaxyCo workspaces.
 */

import { db } from '@/lib/db';
import { prospects, tasks, knowledgeItems } from '@/db/schema';
import { eq, and, desc, like, or, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import type { MCPToolDefinition, MCPToolResult, MCPAuthContext } from './types';

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

export const mcpTools: MCPToolDefinition[] = [
  // ============================================================================
  // REQUIRED TOOLS FOR CHATGPT CONNECTOR MODE
  // ============================================================================
  
  {
    name: 'search',
    description: 'Search across your entire GalaxyCo workspace - leads, tasks, notes, and knowledge base. Returns a list of relevant results with IDs that can be fetched for details.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query to find relevant items across all your data',
        },
      },
      required: ['query'],
    },
    annotations: {
      readOnlyHint: true, // Safe read operation - no confirmation needed
    },
  },
  {
    name: 'fetch',
    description: 'Fetch the complete details of a specific item by ID. Use this after search to get full information about leads, tasks, or documents.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The unique ID of the item to fetch (returned from search results)',
        },
      },
      required: ['id'],
    },
    annotations: {
      readOnlyHint: true, // Safe read operation - no confirmation needed
    },
  },

  // ============================================================================
  // BUSINESS TOOLS
  // ============================================================================
  
  // Quick Capture - The killer feature for ChatGPT users
  {
    name: 'quick_capture',
    description: 'Capture a quick note, idea, lead, or task from your conversation. Neptune will intelligently categorize it and add it to your GalaxyCo workspace. Perfect for capturing things on-the-go without switching apps.',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'What to capture - can be a name, idea, task, note, or anything business-related',
        },
        type: {
          type: 'string',
          enum: ['auto', 'lead', 'task', 'note', 'idea'],
          description: 'Type of capture. Use "auto" to let Neptune decide based on content.',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Priority level (for tasks)',
        },
        context: {
          type: 'string',
          description: 'Additional context about this capture',
        },
      },
      required: ['content'],
    },
  },

  // Leads/CRM
  {
    name: 'create_lead',
    description: 'Create a new lead/prospect in your CRM. Use when someone mentions a potential customer, contact, or business opportunity.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Full name of the lead',
        },
        email: {
          type: 'string',
          description: 'Email address',
        },
        phone: {
          type: 'string',
          description: 'Phone number',
        },
        company: {
          type: 'string',
          description: 'Company or organization',
        },
        title: {
          type: 'string',
          description: 'Job title',
        },
        estimatedValue: {
          type: 'number',
          description: 'Estimated deal value in dollars',
        },
        source: {
          type: 'string',
          description: 'Where this lead came from (e.g., referral, linkedin, website)',
        },
        notes: {
          type: 'string',
          description: 'Additional notes about the lead',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'search_leads',
    description: 'Search for leads in your CRM. Find existing leads by name, email, company, or stage.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query to match against lead name, email, or company',
        },
        stage: {
          type: 'string',
          enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
          description: 'Filter by pipeline stage',
        },
        limit: {
          type: 'number',
          description: 'Maximum results to return (default: 10)',
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'update_lead',
    description: 'Update an existing lead - change their stage, add notes, or update contact info.',
    inputSchema: {
      type: 'object',
      properties: {
        leadId: {
          type: 'string',
          description: 'ID of the lead to update',
        },
        stage: {
          type: 'string',
          enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
          description: 'New pipeline stage',
        },
        notes: {
          type: 'string',
          description: 'Notes to add',
        },
        estimatedValue: {
          type: 'number',
          description: 'Updated deal value',
        },
      },
      required: ['leadId'],
    },
  },

  // Tasks
  {
    name: 'create_task',
    description: 'Create a new task in your workspace. Good for follow-ups, reminders, and action items.',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Task title',
        },
        description: {
          type: 'string',
          description: 'Task description or details',
        },
        dueDate: {
          type: 'string',
          description: 'Due date (ISO format or natural language like "tomorrow", "next week")',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'urgent'],
          description: 'Task priority',
        },
        relatedTo: {
          type: 'string',
          description: 'Related lead or contact name',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'list_tasks',
    description: 'List your tasks. Filter by status, priority, or due date.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'in_progress', 'completed', 'all'],
          description: 'Task status filter',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'urgent'],
          description: 'Filter by priority',
        },
        limit: {
          type: 'number',
          description: 'Maximum results (default: 10)',
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },

  // Workspace Summary
  {
    name: 'get_workspace_summary',
    description: 'Get an overview of your GalaxyCo workspace - pipeline status, pending tasks, recent activity, and key metrics.',
    inputSchema: {
      type: 'object',
      properties: {
        include: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['pipeline', 'tasks', 'activity', 'metrics'],
          },
          description: 'What to include in the summary (default: all)',
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },

  // Knowledge Base
  {
    name: 'search_knowledge',
    description: 'Search your knowledge base for documents, notes, and saved information.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
        collection: {
          type: 'string',
          description: 'Filter by collection name',
        },
        limit: {
          type: 'number',
          description: 'Maximum results (default: 5)',
        },
      },
      required: ['query'],
    },
    annotations: {
      readOnlyHint: true,
    },
  },

  // Draft Email
  {
    name: 'draft_email',
    description: 'Draft an email for a lead or contact. Neptune will create a professional email based on the context and purpose.',
    inputSchema: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          description: 'Recipient name or email',
        },
        purpose: {
          type: 'string',
          enum: ['follow_up', 'introduction', 'proposal', 'thank_you', 'check_in', 'custom'],
          description: 'Purpose of the email',
        },
        context: {
          type: 'string',
          description: 'Additional context for the email',
        },
        tone: {
          type: 'string',
          enum: ['professional', 'friendly', 'formal', 'casual'],
          description: 'Desired tone (default: professional)',
        },
      },
      required: ['to', 'purpose'],
    },
    annotations: {
      readOnlyHint: true, // Drafts don't send, just generate text
    },
  },
];

// ============================================================================
// TOOL HANDLERS
// ============================================================================

type ToolHandler = (
  args: Record<string, unknown>,
  context: MCPAuthContext
) => Promise<MCPToolResult>;

const toolHandlers: Record<string, ToolHandler> = {
  // ============================================================================
  // UNIVERSAL SEARCH & FETCH (Required for ChatGPT)
  // ============================================================================
  
  search: async (args, context) => {
    try {
      const query = (args.query as string).toLowerCase();
      const results: Array<{ id: string; type: string; title: string; snippet: string }> = [];

      // Search leads
      const leadResults = await db.query.prospects.findMany({
        where: eq(prospects.workspaceId, context.workspaceId),
        orderBy: [desc(prospects.createdAt)],
        limit: 10,
      });
      
      for (const lead of leadResults) {
        if (
          lead.name?.toLowerCase().includes(query) ||
          lead.email?.toLowerCase().includes(query) ||
          lead.company?.toLowerCase().includes(query) ||
          lead.notes?.toLowerCase().includes(query)
        ) {
          results.push({
            id: `lead:${lead.id}`,
            type: 'lead',
            title: `${lead.name}${lead.company ? ` (${lead.company})` : ''}`,
            snippet: `${lead.stage} • ${lead.email || 'No email'}${lead.estimatedValue ? ` • $${lead.estimatedValue}` : ''}`,
          });
        }
      }

      // Search tasks
      const taskResults = await db.query.tasks.findMany({
        where: eq(tasks.workspaceId, context.workspaceId),
        orderBy: [desc(tasks.createdAt)],
        limit: 10,
      });
      
      for (const task of taskResults) {
        if (
          task.title?.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query)
        ) {
          results.push({
            id: `task:${task.id}`,
            type: 'task',
            title: task.title,
            snippet: `${task.status} • ${task.priority} priority${task.dueDate ? ` • Due ${new Date(task.dueDate).toLocaleDateString()}` : ''}`,
          });
        }
      }

      // Search knowledge base
      const knowledgeResults = await db.query.knowledgeItems.findMany({
        where: eq(knowledgeItems.workspaceId, context.workspaceId),
        orderBy: [desc(knowledgeItems.createdAt)],
        limit: 10,
      });
      
      for (const item of knowledgeResults) {
        if (
          item.title?.toLowerCase().includes(query) ||
          item.content?.toLowerCase().includes(query)
        ) {
          results.push({
            id: `knowledge:${item.id}`,
            type: 'knowledge',
            title: item.title,
            snippet: item.content?.substring(0, 150) + (item.content && item.content.length > 150 ? '...' : ''),
          });
        }
      }

      if (results.length === 0) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ results: [] }),
          }],
        };
      }

      // Format results according to MCP spec
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            results: results.slice(0, 25).map(r => ({
              id: r.id,
              title: r.title,
              snippet: r.snippet,
              type: r.type,
            })),
          }),
        }],
      };
    } catch (error) {
      logger.error('[MCP] Search failed', { error, args });
      return {
        content: [{ type: 'text', text: JSON.stringify({ results: [] }) }],
        isError: true,
      };
    }
  },

  fetch: async (args, context) => {
    try {
      const fullId = args.id as string;
      const [type, id] = fullId.split(':');

      if (!type || !id) {
        return {
          content: [{ type: 'text', text: 'Invalid ID format. Expected format: "type:id"' }],
          isError: true,
        };
      }

      if (type === 'lead') {
        const lead = await db.query.prospects.findFirst({
          where: and(eq(prospects.id, id), eq(prospects.workspaceId, context.workspaceId)),
        });

        if (!lead) {
          return {
            content: [{ type: 'text', text: 'Lead not found' }],
            isError: true,
          };
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              id: fullId,
              type: 'lead',
              data: {
                name: lead.name,
                email: lead.email,
                phone: lead.phone,
                company: lead.company,
                title: lead.title,
                stage: lead.stage,
                estimatedValue: lead.estimatedValue,
                source: lead.source,
                notes: lead.notes,
                createdAt: lead.createdAt?.toISOString(),
                updatedAt: lead.updatedAt?.toISOString(),
              },
            }, null, 2),
          }],
        };
      } else if (type === 'task') {
        const task = await db.query.tasks.findFirst({
          where: and(eq(tasks.id, id), eq(tasks.workspaceId, context.workspaceId)),
        });

        if (!task) {
          return {
            content: [{ type: 'text', text: 'Task not found' }],
            isError: true,
          };
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              id: fullId,
              type: 'task',
              data: {
                title: task.title,
                description: task.description,
                status: task.status,
                priority: task.priority,
                dueDate: task.dueDate?.toISOString(),
                createdAt: task.createdAt?.toISOString(),
                updatedAt: task.updatedAt?.toISOString(),
              },
            }, null, 2),
          }],
        };
      } else if (type === 'knowledge') {
        const item = await db.query.knowledgeItems.findFirst({
          where: and(eq(knowledgeItems.id, id), eq(knowledgeItems.workspaceId, context.workspaceId)),
        });

        if (!item) {
          return {
            content: [{ type: 'text', text: 'Knowledge item not found' }],
            isError: true,
          };
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              id: fullId,
              type: 'knowledge',
              data: {
                title: item.title,
                content: item.content,
                type: item.type,
                tags: item.tags,
                createdAt: item.createdAt?.toISOString(),
                updatedAt: item.updatedAt?.toISOString(),
              },
            }, null, 2),
          }],
        };
      } else {
        return {
          content: [{ type: 'text', text: `Unknown item type: ${type}` }],
          isError: true,
        };
      }
    } catch (error) {
      logger.error('[MCP] Fetch failed', { error, args });
      return {
        content: [{ type: 'text', text: `Failed to fetch item: ${error instanceof Error ? error.message : 'Unknown error'}` }],
        isError: true,
      };
    }
  },

  // ============================================================================
  // BUSINESS TOOLS
  // ============================================================================
  
  // Quick Capture
  quick_capture: async (args, context) => {
    const content = args.content as string;
    const type = (args.type as string) || 'auto';
    const priority = (args.priority as string) || 'medium';
    const additionalContext = args.context as string | undefined;

    // Auto-detect type based on content
    let detectedType = type;
    if (type === 'auto') {
      const lowerContent = content.toLowerCase();
      if (lowerContent.includes('@') || lowerContent.includes('lead') || lowerContent.includes('contact')) {
        detectedType = 'lead';
      } else if (lowerContent.includes('task') || lowerContent.includes('todo') || lowerContent.includes('follow up') || lowerContent.includes('reminder')) {
        detectedType = 'task';
      } else if (lowerContent.includes('idea') || lowerContent.includes('thought')) {
        detectedType = 'idea';
      } else {
        detectedType = 'note';
      }
    }

    try {
      if (detectedType === 'lead') {
        // Extract name from content (simple heuristic)
        const [newLead] = await db
          .insert(prospects)
          .values({
            workspaceId: context.workspaceId,
            name: content.split(/[,@]/)[0].trim(),
            notes: additionalContext || content,
            source: 'chatgpt-neptune',
            stage: 'new',
          })
          .returning();

        return {
          content: [{
            type: 'text',
            text: `✅ Lead captured!\n\n**Name:** ${newLead.name}\n**Stage:** New\n**Source:** ChatGPT Neptune\n\nView in GalaxyCo: https://app.galaxyco.ai/crm?tab=leads`,
          }],
        };
      } else if (detectedType === 'task') {
        const [newTask] = await db
          .insert(tasks)
          .values({
            workspaceId: context.workspaceId,
            title: content,
            description: additionalContext,
            status: 'todo',
            priority: (priority === 'high' ? 'high' : priority === 'low' ? 'low' : 'medium') as 'low' | 'medium' | 'high' | 'urgent',
            createdBy: context.userId,
          })
          .returning();

        return {
          content: [{
            type: 'text',
            text: `✅ Task created!\n\n**Task:** ${newTask.title}\n**Priority:** ${priority}\n**Status:** Pending\n\nView in GalaxyCo: https://app.galaxyco.ai/dashboard`,
          }],
        };
      } else {
        // For notes/ideas, save to knowledge base
        const [newItem] = await db
          .insert(knowledgeItems)
          .values({
            workspaceId: context.workspaceId,
            title: `${detectedType === 'idea' ? '💡' : '📝'} ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
            content: content,
            type: 'text',
            status: 'ready',
            tags: [detectedType, 'chatgpt-capture'],
            metadata: { uploadedVia: 'neptune', tags: [detectedType, 'chatgpt-capture'] },
            createdBy: context.userId,
          })
          .returning();

        return {
          content: [{
            type: 'text',
            text: `✅ ${detectedType === 'idea' ? 'Idea' : 'Note'} saved!\n\n**Title:** ${newItem.title}\n**Type:** ${detectedType}\n\nView in GalaxyCo: https://app.galaxyco.ai/library`,
          }],
        };
      }
    } catch (error) {
      logger.error('[MCP] Quick capture failed', { error, args, context });
      return {
        content: [{ type: 'text', text: `❌ Failed to capture: ${error instanceof Error ? error.message : 'Unknown error'}` }],
        isError: true,
      };
    }
  },

  // Create Lead
  create_lead: async (args, context) => {
    try {
      const [newLead] = await db
        .insert(prospects)
        .values({
          workspaceId: context.workspaceId,
          name: args.name as string,
          email: args.email as string | undefined,
          phone: args.phone as string | undefined,
          company: args.company as string | undefined,
          title: args.title as string | undefined,
          estimatedValue: args.estimatedValue ? Number(args.estimatedValue) : undefined,
          source: (args.source as string) || 'chatgpt-neptune',
          notes: args.notes as string | undefined,
          stage: 'new',
        })
        .returning();

      return {
        content: [{
          type: 'text',
          text: `✅ Lead created!\n\n**Name:** ${newLead.name}${newLead.company ? `\n**Company:** ${newLead.company}` : ''}${newLead.email ? `\n**Email:** ${newLead.email}` : ''}${newLead.estimatedValue ? `\n**Value:** $${newLead.estimatedValue}` : ''}\n**Stage:** New\n\n[View in GalaxyCo CRM](https://app.galaxyco.ai/crm?tab=leads)`,
        }],
      };
    } catch (error) {
      logger.error('[MCP] Create lead failed', { error, args });
      return {
        content: [{ type: 'text', text: `❌ Failed to create lead: ${error instanceof Error ? error.message : 'Unknown error'}` }],
        isError: true,
      };
    }
  },

  // Search Leads
  search_leads: async (args, context) => {
    try {
      const query = args.query as string | undefined;
      const stage = args.stage as string | undefined;
      const limit = Math.min((args.limit as number) || 10, 25);

      let whereConditions = eq(prospects.workspaceId, context.workspaceId);

      if (stage) {
        whereConditions = and(whereConditions, eq(prospects.stage, stage as 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'))!;
      }

      const results = await db.query.prospects.findMany({
        where: whereConditions,
        orderBy: [desc(prospects.createdAt)],
        limit,
      });

      // Filter by query if provided (client-side for flexibility)
      let filteredResults = results;
      if (query) {
        const lowerQuery = query.toLowerCase();
        filteredResults = results.filter(
          (lead) =>
            lead.name?.toLowerCase().includes(lowerQuery) ||
            lead.email?.toLowerCase().includes(lowerQuery) ||
            lead.company?.toLowerCase().includes(lowerQuery)
        );
      }

      if (filteredResults.length === 0) {
        return {
          content: [{ type: 'text', text: `No leads found${query ? ` matching "${query}"` : ''}${stage ? ` in stage "${stage}"` : ''}.` }],
        };
      }

      const leadList = filteredResults
        .map((lead, i) => `${i + 1}. **${lead.name}**${lead.company ? ` (${lead.company})` : ''} - ${lead.stage}${lead.estimatedValue ? ` | $${lead.estimatedValue}` : ''}`)
        .join('\n');

      return {
        content: [{
          type: 'text',
          text: `Found ${filteredResults.length} lead${filteredResults.length === 1 ? '' : 's'}:\n\n${leadList}`,
        }],
      };
    } catch (error) {
      logger.error('[MCP] Search leads failed', { error, args });
      return {
        content: [{ type: 'text', text: `❌ Search failed: ${error instanceof Error ? error.message : 'Unknown error'}` }],
        isError: true,
      };
    }
  },

  // Update Lead
  update_lead: async (args, context) => {
    try {
      const leadId = args.leadId as string;
      const updates: Record<string, unknown> = {};

      if (args.stage) updates.stage = args.stage;
      if (args.notes) updates.notes = args.notes;
      if (args.estimatedValue) updates.estimatedValue = String(args.estimatedValue);

      const [updatedLead] = await db
        .update(prospects)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(eq(prospects.id, leadId), eq(prospects.workspaceId, context.workspaceId)))
        .returning();

      if (!updatedLead) {
        return {
          content: [{ type: 'text', text: '❌ Lead not found or you don\'t have permission to update it.' }],
          isError: true,
        };
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Lead updated!\n\n**${updatedLead.name}**${args.stage ? `\n**Stage:** ${args.stage}` : ''}${args.notes ? `\n**Notes added**` : ''}`,
        }],
      };
    } catch (error) {
      logger.error('[MCP] Update lead failed', { error, args });
      return {
        content: [{ type: 'text', text: `❌ Update failed: ${error instanceof Error ? error.message : 'Unknown error'}` }],
        isError: true,
      };
    }
  },

  // Create Task
  create_task: async (args, context) => {
    try {
      const title = args.title as string;
      const description = args.description as string | undefined;
      const priority = (args.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium';

      // Parse due date if provided
      let dueDate: Date | undefined;
      if (args.dueDate) {
        const dueDateStr = args.dueDate as string;
        const lower = dueDateStr.toLowerCase();
        const now = new Date();

        if (lower === 'tomorrow') {
          dueDate = new Date(now.setDate(now.getDate() + 1));
        } else if (lower === 'next week') {
          dueDate = new Date(now.setDate(now.getDate() + 7));
        } else if (lower === 'today') {
          dueDate = new Date();
        } else {
          dueDate = new Date(dueDateStr);
        }
      }

      const [newTask] = await db
        .insert(tasks)
        .values({
          workspaceId: context.workspaceId,
          title,
          description,
          status: 'todo',
          priority: priority,
          dueDate,
          createdBy: context.userId,
        })
        .returning();

      return {
        content: [{
          type: 'text',
          text: `✅ Task created!\n\n**Task:** ${newTask.title}${description ? `\n**Description:** ${description}` : ''}\n**Priority:** ${priority}${dueDate ? `\n**Due:** ${dueDate.toLocaleDateString()}` : ''}\n\n[View in GalaxyCo](https://app.galaxyco.ai/dashboard)`,
        }],
      };
    } catch (error) {
      logger.error('[MCP] Create task failed', { error, args });
      return {
        content: [{ type: 'text', text: `❌ Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}` }],
        isError: true,
      };
    }
  },

  // List Tasks
  list_tasks: async (args, context) => {
    try {
      const status = args.status as string | undefined;
      const priority = args.priority as string | undefined;
      const limit = Math.min((args.limit as number) || 10, 25);

      let whereConditions = eq(tasks.workspaceId, context.workspaceId);

      if (status && status !== 'all') {
        // Map user-friendly status to DB enum
        const statusMap: Record<string, 'todo' | 'in_progress' | 'done' | 'cancelled'> = {
          pending: 'todo',
          in_progress: 'in_progress',
          completed: 'done',
          todo: 'todo',
          done: 'done',
        };
        const dbStatus = statusMap[status] || 'todo';
        whereConditions = and(whereConditions, eq(tasks.status, dbStatus))!;
      }

      if (priority) {
        whereConditions = and(whereConditions, eq(tasks.priority, priority as 'low' | 'medium' | 'high'))!;
      }

      const results = await db.query.tasks.findMany({
        where: whereConditions,
        orderBy: [desc(tasks.createdAt)],
        limit,
      });

      if (results.length === 0) {
        return {
          content: [{ type: 'text', text: `No tasks found${status && status !== 'all' ? ` with status "${status}"` : ''}.` }],
        };
      }

      const priorityEmoji: Record<string, string> = { high: '🔴', medium: '🟡', low: '🟢' };
      const taskList = results
        .map((task, i) => `${i + 1}. ${priorityEmoji[task.priority || 'medium'] || '⚪'} **${task.title}** - ${task.status}${task.dueDate ? ` (Due: ${new Date(task.dueDate).toLocaleDateString()})` : ''}`)
        .join('\n');

      return {
        content: [{
          type: 'text',
          text: `Found ${results.length} task${results.length === 1 ? '' : 's'}:\n\n${taskList}`,
        }],
      };
    } catch (error) {
      logger.error('[MCP] List tasks failed', { error, args });
      return {
        content: [{ type: 'text', text: `❌ Failed to list tasks: ${error instanceof Error ? error.message : 'Unknown error'}` }],
        isError: true,
      };
    }
  },

  // Workspace Summary
  get_workspace_summary: async (args, context) => {
    try {
      const include = (args.include as string[]) || ['pipeline', 'tasks', 'metrics'];

      const summaryParts: string[] = ['# 🌌 GalaxyCo Workspace Summary\n'];

      // Pipeline stats
      if (include.includes('pipeline') || include.includes('metrics')) {
        const pipelineStats = await db
          .select({
            stage: prospects.stage,
            count: sql<number>`count(*)::int`,
            totalValue: sql<number>`coalesce(sum(${prospects.estimatedValue}::numeric), 0)::numeric`,
          })
          .from(prospects)
          .where(eq(prospects.workspaceId, context.workspaceId))
          .groupBy(prospects.stage);

        const totalLeads = pipelineStats.reduce((sum, s) => sum + Number(s.count), 0);
        const totalValue = pipelineStats.reduce((sum, s) => sum + Number(s.totalValue), 0);

        summaryParts.push(`## 📊 Pipeline\n- **Total Leads:** ${totalLeads}\n- **Pipeline Value:** $${totalValue.toLocaleString()}`);

        const stageBreakdown = pipelineStats
          .map((s) => `  - ${s.stage}: ${s.count}`)
          .join('\n');
        if (stageBreakdown) {
          summaryParts.push(`\n**By Stage:**\n${stageBreakdown}`);
        }
      }

      // Task stats
      if (include.includes('tasks')) {
        const taskStats = await db
          .select({
            status: tasks.status,
            count: sql<number>`count(*)::int`,
          })
          .from(tasks)
          .where(eq(tasks.workspaceId, context.workspaceId))
          .groupBy(tasks.status);

        const todo = taskStats.find((t) => t.status === 'todo')?.count || 0;
        const inProgress = taskStats.find((t) => t.status === 'in_progress')?.count || 0;
        const done = taskStats.find((t) => t.status === 'done')?.count || 0;

        summaryParts.push(`\n## ✅ Tasks\n- **To Do:** ${todo}\n- **In Progress:** ${inProgress}\n- **Done:** ${done}`);
      }

      summaryParts.push(`\n---\n[Open GalaxyCo Dashboard](https://app.galaxyco.ai/dashboard)`);

      return {
        content: [{ type: 'text', text: summaryParts.join('\n') }],
      };
    } catch (error) {
      logger.error('[MCP] Workspace summary failed', { error, args });
      return {
        content: [{ type: 'text', text: `❌ Failed to get summary: ${error instanceof Error ? error.message : 'Unknown error'}` }],
        isError: true,
      };
    }
  },

  // Search Knowledge Base
  search_knowledge: async (args, context) => {
    try {
      const query = args.query as string;
      const limit = Math.min((args.limit as number) || 5, 10);

      // Simple text search
      const results = await db.query.knowledgeItems.findMany({
        where: and(
          eq(knowledgeItems.workspaceId, context.workspaceId),
          or(
            like(knowledgeItems.title, `%${query}%`),
            like(knowledgeItems.content, `%${query}%`)
          )
        ),
        orderBy: [desc(knowledgeItems.createdAt)],
        limit,
      });

      if (results.length === 0) {
        return {
          content: [{ type: 'text', text: `No results found for "${query}" in your knowledge base.` }],
        };
      }

      const resultList = results
        .map((item, i) => `${i + 1}. **${item.title}**\n   ${item.content?.substring(0, 150)}${(item.content?.length || 0) > 150 ? '...' : ''}`)
        .join('\n\n');

      return {
        content: [{
          type: 'text',
          text: `Found ${results.length} result${results.length === 1 ? '' : 's'} for "${query}":\n\n${resultList}`,
        }],
      };
    } catch (error) {
      logger.error('[MCP] Search knowledge failed', { error, args });
      return {
        content: [{ type: 'text', text: `❌ Search failed: ${error instanceof Error ? error.message : 'Unknown error'}` }],
        isError: true,
      };
    }
  },

  // Draft Email
  draft_email: async (args, context) => {
    const to = args.to as string;
    const purpose = args.purpose as string;
    const emailContext = args.context as string | undefined;
    const tone = (args.tone as string) || 'professional';

    // Generate a draft based on purpose
    const templates: Record<string, string> = {
      follow_up: `Hi ${to},\n\nI wanted to follow up on our recent conversation. I hope you've had a chance to consider what we discussed.\n\nWould you be available for a quick call this week to continue our discussion?\n\nLooking forward to hearing from you.`,
      introduction: `Hi ${to},\n\nI hope this email finds you well. I'm reaching out because I believe there might be a great opportunity for us to work together.\n\n${emailContext || '[Add your introduction here]'}\n\nWould you be open to a brief call to explore this further?`,
      proposal: `Hi ${to},\n\nThank you for taking the time to discuss your needs with me. As promised, I'm following up with a proposal.\n\n${emailContext || '[Add proposal details here]'}\n\nI'd be happy to walk you through this in more detail. When would be a good time for a call?`,
      thank_you: `Hi ${to},\n\nI wanted to take a moment to thank you for ${emailContext || 'your time and consideration'}.\n\nI truly appreciate it and look forward to staying in touch.`,
      check_in: `Hi ${to},\n\nI hope you're doing well! I wanted to check in and see how things are going on your end.\n\n${emailContext || 'Is there anything I can help with?'}\n\nLooking forward to hearing from you.`,
      custom: emailContext || `Hi ${to},\n\n[Your message here]\n\nBest regards`,
    };

    const draft = templates[purpose] || templates.custom;

    return {
      content: [{
        type: 'text',
        text: `📧 **Email Draft** (${tone} tone)\n\n**To:** ${to}\n**Purpose:** ${purpose}\n\n---\n\n${draft}\n\n---\n\n*Edit this draft in GalaxyCo or copy it to your email client.*`,
      }],
    };
  },
};

// ============================================================================
// TOOL EXECUTOR
// ============================================================================

export async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  context: MCPAuthContext
): Promise<MCPToolResult> {
  const handler = toolHandlers[toolName];

  if (!handler) {
    return {
      content: [{ type: 'text', text: `Unknown tool: ${toolName}` }],
      isError: true,
    };
  }

  logger.info('[MCP] Executing tool', { tool: toolName, userId: context.userId });

  try {
    return await handler(args, context);
  } catch (error) {
    logger.error('[MCP] Tool execution failed', { tool: toolName, error });
    return {
      content: [{
        type: 'text',
        text: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
      isError: true,
    };
  }
}
