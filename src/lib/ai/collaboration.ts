/**
 * Team Collaboration Module
 * 
 * Enables Neptune to handle @mentions, task delegation,
 * and team coordination via chat.
 */

import { db } from '@/lib/db';
import { users, tasks, workspaces, workspaceMembers } from '@/db/schema';
import { eq, and, ilike } from 'drizzle-orm';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface MentionMatch {
  original: string;
  memberId: string;
  memberName: string;
}

export interface DelegationResult {
  success: boolean;
  taskId?: string;
  assignee?: TeamMember;
  message: string;
}

// ============================================================================
// TEAM MEMBER LOOKUP
// ============================================================================

/**
 * Get all team members for a workspace
 */
export async function getTeamMembers(workspaceId: string): Promise<TeamMember[]> {
  try {
    // Get workspace members
    const members = await db.query.workspaceMembers.findMany({
      where: eq(workspaceMembers.workspaceId, workspaceId),
    });

    if (members.length === 0) return [];

    // Get user details for each member
    const userIds = members.map(m => m.userId);
    const userRecords = await db.query.users.findMany({
      where: (users, { inArray }) => inArray(users.id, userIds),
    });

    // Map users to team members
    const result: TeamMember[] = [];
    for (const member of members) {
      const user = userRecords.find(u => u.id === member.userId);
      if (user) {
        result.push({
          id: user.id,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0],
          email: user.email,
          role: member.role,
          avatar: user.avatarUrl || undefined,
        });
      }
    }

    return result;
  } catch (error) {
    logger.error('[Collaboration] Failed to get team members', error);
    return [];
  }
}

/**
 * Find a team member by name or email (fuzzy match)
 */
export async function findTeamMember(
  workspaceId: string,
  query: string
): Promise<TeamMember | null> {
  try {
    const members = await getTeamMembers(workspaceId);
    const lowerQuery = query.toLowerCase().trim();

    // Exact match first
    let match = members.find(
      m => m.name.toLowerCase() === lowerQuery || m.email.toLowerCase() === lowerQuery
    );

    // Partial match
    if (!match) {
      match = members.find(
        m => m.name.toLowerCase().includes(lowerQuery) || 
             m.email.toLowerCase().includes(lowerQuery)
      );
    }

    // First name match
    if (!match) {
      match = members.find(
        m => m.name.toLowerCase().split(' ')[0] === lowerQuery
      );
    }

    return match || null;
  } catch (error) {
    logger.error('[Collaboration] Failed to find team member', error);
    return null;
  }
}

// ============================================================================
// MENTION PARSING
// ============================================================================

/**
 * Parse @mentions from a message
 * Supports: @name, @"Full Name", @email@domain.com
 */
export function parseMentions(message: string): string[] {
  const mentions: string[] = [];
  
  // @"Full Name" pattern
  const quotedPattern = /@"([^"]+)"/g;
  let quotedMatch: RegExpExecArray | null;
  while ((quotedMatch = quotedPattern.exec(message)) !== null) {
    mentions.push(quotedMatch[1]);
  }
  
  // @name pattern (word characters only)
  const simplePattern = /@(\w+)/g;
  let simpleMatch: RegExpExecArray | null;
  while ((simpleMatch = simplePattern.exec(message)) !== null) {
    // Skip if this was part of a quoted mention
    if (!mentions.some(m => m.toLowerCase().includes(simpleMatch![1].toLowerCase()))) {
      mentions.push(simpleMatch[1]);
    }
  }

  return [...new Set(mentions)]; // Dedupe
}

/**
 * Resolve mentions to actual team members
 */
export async function resolveMentions(
  workspaceId: string,
  message: string
): Promise<MentionMatch[]> {
  const mentionStrings = parseMentions(message);
  const matches: MentionMatch[] = [];

  for (const mention of mentionStrings) {
    const member = await findTeamMember(workspaceId, mention);
    if (member) {
      matches.push({
        original: mention,
        memberId: member.id,
        memberName: member.name,
      });
    }
  }

  return matches;
}

// ============================================================================
// TASK DELEGATION
// ============================================================================

/**
 * Assign a task to a team member
 */
export async function delegateTask(
  workspaceId: string,
  taskDetails: {
    title: string;
    description?: string;
    assigneeName: string;
    dueDate?: Date;
    priority?: 'low' | 'medium' | 'high';
    createdBy?: string;
  }
): Promise<DelegationResult> {
  try {
    // Find the assignee
    const assignee = await findTeamMember(workspaceId, taskDetails.assigneeName);
    
    if (!assignee) {
      return {
        success: false,
        message: `I couldn't find a team member named "${taskDetails.assigneeName}". Please check the name and try again.`,
      };
    }

    // Get workspace owner as default creator if not specified
    const creatorId = taskDetails.createdBy || assignee.id;

    // Create the task
    const [task] = await db.insert(tasks).values({
      workspaceId,
      title: taskDetails.title,
      description: taskDetails.description || '',
      status: 'todo',
      priority: taskDetails.priority || 'medium',
      dueDate: taskDetails.dueDate || null,
      assignedTo: assignee.id,
      createdBy: creatorId,
    }).returning({ id: tasks.id });

    logger.info('[Collaboration] Task delegated', {
      taskId: task.id,
      assignedTo: assignee.id,
      assigneeName: assignee.name,
    });

    return {
      success: true,
      taskId: task.id,
      assignee,
      message: `I've assigned the task "${taskDetails.title}" to ${assignee.name}. They'll be notified.`,
    };
  } catch (error) {
    logger.error('[Collaboration] Failed to delegate task', error);
    return {
      success: false,
      message: 'I couldn\'t create the task. Please try again.',
    };
  }
}

/**
 * Reassign an existing task to a different team member
 */
export async function reassignTask(
  workspaceId: string,
  taskId: string,
  newAssigneeName: string
): Promise<DelegationResult> {
  try {
    // Find the new assignee
    const assignee = await findTeamMember(workspaceId, newAssigneeName);
    
    if (!assignee) {
      return {
        success: false,
        message: `I couldn't find a team member named "${newAssigneeName}".`,
      };
    }

    // Update the task
    await db.update(tasks)
      .set({ 
        assignedTo: assignee.id,
        updatedAt: new Date(),
      })
      .where(and(
        eq(tasks.id, taskId),
        eq(tasks.workspaceId, workspaceId)
      ));

    logger.info('[Collaboration] Task reassigned', {
      taskId,
      newAssignedTo: assignee.id,
    });

    return {
      success: true,
      taskId,
      assignee,
      message: `Task reassigned to ${assignee.name}. They'll be notified.`,
    };
  } catch (error) {
    logger.error('[Collaboration] Failed to reassign task', error);
    return {
      success: false,
      message: 'I couldn\'t reassign the task. Please try again.',
    };
  }
}

// ============================================================================
// TEAM COMMUNICATION
// ============================================================================

/**
 * Get message with resolved mentions for display
 */
export async function formatMessageWithMentions(
  workspaceId: string,
  message: string
): Promise<string> {
  const mentions = await resolveMentions(workspaceId, message);
  
  let formattedMessage = message;
  for (const mention of mentions) {
    // Replace @mention with styled version
    formattedMessage = formattedMessage.replace(
      new RegExp(`@"?${mention.original}"?`, 'gi'),
      `**@${mention.memberName}**`
    );
  }
  
  return formattedMessage;
}

/**
 * Check if a message contains any valid team mentions
 */
export async function hasTeamMentions(
  workspaceId: string,
  message: string
): Promise<boolean> {
  const mentions = await resolveMentions(workspaceId, message);
  return mentions.length > 0;
}

/**
 * Extract task assignment from natural language
 * e.g., "assign @John to review the proposal"
 */
export function extractAssignmentIntent(message: string): {
  hasAssignment: boolean;
  assignee?: string;
  task?: string;
} {
  const assignPatterns = [
    /assign\s+@"?([^"@]+)"?\s+(?:to\s+)?(.+)/i,
    /(?:give|delegate)\s+(.+)\s+to\s+@"?([^"@]+)"?/i,
    /@"?([^"@]+)"?\s+(?:please|can you|could you)?\s*(.+)/i,
  ];

  for (const pattern of assignPatterns) {
    const match = message.match(pattern);
    if (match) {
      // Pattern 1: assign @person to task
      if (pattern === assignPatterns[0]) {
        return { hasAssignment: true, assignee: match[1], task: match[2] };
      }
      // Pattern 2: give task to @person
      if (pattern === assignPatterns[1]) {
        return { hasAssignment: true, assignee: match[2], task: match[1] };
      }
      // Pattern 3: @person do something
      if (pattern === assignPatterns[2] && match[2].trim().length > 5) {
        return { hasAssignment: true, assignee: match[1], task: match[2] };
      }
    }
  }

  return { hasAssignment: false };
}
