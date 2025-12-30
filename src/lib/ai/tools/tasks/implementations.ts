/**
 * Tasks Tool Implementations
 */
import type { ToolImplementations } from '../types';
import { db } from '@/lib/db';
import { tasks } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
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
};
