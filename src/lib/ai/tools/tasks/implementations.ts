/**
 * Tasks Tool Implementations
 */
import type { ToolImplementations } from '../types';
import { db } from '@/lib/db';
import { tasks } from '@/db/schema';
import { and, eq, sql, desc } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export const tasksToolImplementations: ToolImplementations = {
  // Tasks: Create Task
  async create_task(args, context) {
    try {
      // Get user record
      const userRecord = await db.query.users.findFirst({
        where: eq(sql`clerk_user_id`, context.userId),
      });

      if (!userRecord) {
        return {
          success: false,
          message: 'User record not found',
        };
      }

      const [task] = await db
        .insert(tasks)
        .values({
          workspaceId: context.workspaceId,
          title: args.title as string,
          description: (args.description as string) || null,
          priority: (args.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
          status: 'todo',
          dueDate: args.dueDate ? new Date(args.dueDate as string) : null,
          createdBy: userRecord.id,
          assignedTo: userRecord.id, // Assign to the requester
        })
        .returning();

      logger.info('AI created task', { taskId: task.id, workspaceId: context.workspaceId });

      return {
        success: true,
        message: `Created task "${task.title}"`,
        data: {
          id: task.id,
          title: task.title,
          priority: task.priority,
          dueDate: task.dueDate,
        },
        suggestedNextStep: {
          action: 'assign_to_agent',
          reason: 'Repetitive tasks can be automated with agents',
          prompt: 'Is this something that happens regularly? I can automate it.',
          autoSuggest: false,
        },
      };
    } catch (error) {
      logger.error('AI create_task failed', error);
      return {
        success: false,
        message: 'Failed to create task',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Tasks: Prioritize Tasks
  async prioritize_tasks(args, context) {
    try {
      const taskIds = (args.taskIds as string[]) || [];
      const priorityMethod = (args.priorityMethod as string) || 'balanced';

      const whereConditions = [eq(tasks.workspaceId, context.workspaceId)];
      if (taskIds.length > 0) {
        whereConditions.push(sql`${tasks.id} = ANY(${taskIds})`);
      }

      const allTasks = await db.query.tasks.findMany({
        where: and(...whereConditions),
        orderBy: [desc(tasks.createdAt)],
      });

      // Simple prioritization logic
      const prioritized = allTasks.sort((a, b) => {
        if (priorityMethod === 'urgency') {
          const aUrgency = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const bUrgency = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          return aUrgency - bUrgency;
        } else if (priorityMethod === 'impact') {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) -
                 (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
        } else {
          // Balanced: urgency + impact
          const aScore = (a.dueDate ? 1 : 0) + (a.priority === 'high' ? 2 : a.priority === 'medium' ? 1 : 0);
          const bScore = (b.dueDate ? 1 : 0) + (b.priority === 'high' ? 2 : b.priority === 'medium' ? 1 : 0);
          return bScore - aScore;
        }
      });

      // Actually update task priorities/order in database
      // We'll use a priorityOrder field or update due dates to reflect urgency
      for (let i = 0; i < prioritized.length; i++) {
        const task = prioritized[i];
        // Update priority based on position (higher position = higher priority)
        let newPriority: 'low' | 'medium' | 'high' = 'medium';
        if (i < prioritized.length * 0.2) {
          newPriority = 'high';
        } else if (i > prioritized.length * 0.8) {
          newPriority = 'low';
        }

        // Only update if priority actually changed
        if (task.priority !== newPriority) {
          await db
            .update(tasks)
            .set({
              priority: newPriority,
              updatedAt: new Date(),
            })
            .where(eq(tasks.id, task.id));
        }
      }

      return {
        success: true,
        message: `Prioritized ${prioritized.length} tasks using ${priorityMethod} method. Task priorities updated in database.`,
        data: {
          prioritizedTaskIds: prioritized.map(t => t.id),
          method: priorityMethod,
          tasksUpdated: prioritized.length,
        },
      };
    } catch (error) {
      logger.error('AI prioritize_tasks failed', error);
      return {
        success: false,
        message: 'Failed to prioritize tasks',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Tasks: Batch Similar Tasks
  async batch_similar_tasks(args, context) {
    try {
      const category = (args.category as string) || undefined;

      // Get all tasks
      const allTasks = await db.query.tasks.findMany({
        where: eq(tasks.workspaceId, context.workspaceId),
        orderBy: [desc(tasks.createdAt)],
      });

      // Define task categories based on keywords
      const categoryKeywords: Record<string, string[]> = {
        emails: ['email', 'send', 'reply', 'follow up', 'reach out', 'message'],
        calls: ['call', 'phone', 'dial', 'speak with', 'talk to', 'schedule call'],
        data_entry: ['update', 'enter', 'input', 'add to', 'record', 'log'],
        research: ['research', 'find', 'look up', 'search', 'investigate'],
        writing: ['write', 'draft', 'create', 'compose', 'document'],
        meetings: ['meeting', 'meet', 'discuss', 'review', 'sync'],
      };

      // Group tasks by category
      const batches: Record<string, typeof allTasks> = {};

      for (const task of allTasks) {
        const titleLower = task.title.toLowerCase();
        const descLower = (task.description || '').toLowerCase();
        const combined = `${titleLower} ${descLower}`;

        for (const [cat, keywords] of Object.entries(categoryKeywords)) {
          if (category && cat !== category) continue;

          const matches = keywords.some(keyword => combined.includes(keyword));
          if (matches) {
            if (!batches[cat]) batches[cat] = [];
            batches[cat].push(task);
            break;
          }
        }
      }

      // Format for response
      const batchSummary = Object.entries(batches).map(([cat, taskList]) => ({
        category: cat,
        taskCount: taskList.length,
        tasks: taskList.slice(0, 5).map(t => ({ id: t.id, title: t.title })),
        recommendation: `You have ${taskList.length} ${cat} tasks. Consider batching these together for efficiency.`,
      }));

      return {
        success: true,
        message: `Found ${Object.keys(batches).length} task categories for batching. ${batchSummary.map(b => `${b.category}: ${b.taskCount}`).join(', ')}.`,
        data: {
          batches: batchSummary,
          totalBatches: Object.keys(batches).length,
          totalTasks: Object.values(batches).reduce((sum, t) => sum + t.length, 0),
        },
      };
    } catch (error) {
      logger.error('AI batch_similar_tasks failed', error);
      return {
        success: false,
        message: 'Failed to batch similar tasks',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Knowledge: Organize Documents
  async organize_documents(args, context) {
    try {
      const collectionId = args.collectionId as string | undefined;
      const autoTag = (args.autoTag as boolean) ?? true;

      // Import knowledge base schema
      const { knowledgeItems, knowledgeCollections } = await import('@/db/schema');

      // Get knowledge items
      const whereConditions = [eq(knowledgeItems.workspaceId, context.workspaceId)];
      if (collectionId) {
        whereConditions.push(eq(knowledgeItems.collectionId, collectionId));
      }

      const items = await db.query.knowledgeItems.findMany({
        where: and(...whereConditions),
        limit: 100, // Process up to 100 at a time
      });

      if (items.length === 0) {
        return {
          success: true,
          message: 'No documents found to organize.',
          data: {
            itemsProcessed: 0,
            tagsGenerated: 0,
          },
        };
      }

      // Define tag categories based on content keywords
      const tagKeywords: Record<string, string[]> = {
        'product': ['product', 'feature', 'functionality', 'capability'],
        'pricing': ['price', 'cost', 'pricing', 'subscription', 'plan'],
        'support': ['help', 'support', 'troubleshoot', 'issue', 'problem'],
        'onboarding': ['start', 'getting started', 'setup', 'install', 'begin'],
        'api': ['api', 'endpoint', 'integration', 'webhook', 'developer'],
        'security': ['security', 'privacy', 'compliance', 'encryption'],
        'faq': ['question', 'answer', 'faq', 'common', 'frequently'],
      };

      let tagsGenerated = 0;
      const organizedItems: Array<{ id: string; title: string; tags: string[] }> = [];

      for (const item of items) {
        if (!autoTag) continue;

        const contentLower = `${item.title} ${item.content || ''}`.toLowerCase();
        const newTags: string[] = [];

        for (const [tag, keywords] of Object.entries(tagKeywords)) {
          if (keywords.some(keyword => contentLower.includes(keyword))) {
            newTags.push(tag);
          }
        }

        if (newTags.length > 0) {
          // Update item with new tags
          const existingTags = (item.metadata as { tags?: string[] })?.tags || [];
          const mergedTags = [...new Set([...existingTags, ...newTags])];

          await db
            .update(knowledgeItems)
            .set({
              metadata: {
                ...(item.metadata as Record<string, unknown> || {}),
                tags: mergedTags,
              },
              updatedAt: new Date(),
            })
            .where(eq(knowledgeItems.id, item.id));

          tagsGenerated += newTags.length;
          organizedItems.push({
            id: item.id,
            title: item.title,
            tags: mergedTags,
          });
        }
      }

      return {
        success: true,
        message: `Organized ${items.length} documents. Generated ${tagsGenerated} new tags across ${organizedItems.length} items.`,
        data: {
          itemsProcessed: items.length,
          itemsTagged: organizedItems.length,
          tagsGenerated,
          examples: organizedItems.slice(0, 5),
        },
      };
    } catch (error) {
      logger.error('AI organize_documents failed', error);
      return {
        success: false,
        message: 'Failed to organize documents',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
