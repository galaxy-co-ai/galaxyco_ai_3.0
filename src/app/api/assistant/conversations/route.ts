import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { aiConversations, aiMessages } from '@/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';

export async function GET() {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();

    // Get all conversations for this user with their messages
    const conversations = await db.query.aiConversations.findMany({
      where: and(
        eq(aiConversations.workspaceId, workspaceId),
        eq(aiConversations.userId, user.id)
      ),
      orderBy: [desc(aiConversations.lastMessageAt)],
      with: {
        messages: {
          orderBy: [asc(aiMessages.createdAt)],
          limit: 3, // Just get first few messages for preview
        },
      },
    });

    return NextResponse.json(
      conversations.map((conv) => ({
        id: conv.id,
        title: conv.title,
        preview: conv.messages[0]?.content.substring(0, 100) || '',
        capability: detectCapability(conv.title || ''), // Detect capability from title
        createdAt: conv.createdAt,
        updatedAt: conv.lastMessageAt,
        messageCount: conv.messageCount,
        isPinned: conv.isPinned,
        messages: conv.messages.map((msg: typeof conv.messages[0]) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.createdAt,
        })),
      }))
    );
  } catch (error) {
    return createErrorResponse(error, 'List conversations error');
  }
}

// Simple capability detection based on title/content keywords
function detectCapability(title: string): string {
  const lowercaseTitle = title.toLowerCase();
  
  if (lowercaseTitle.includes('workflow') || lowercaseTitle.includes('automat') || lowercaseTitle.includes('trigger')) {
    return 'workflow';
  }
  if (lowercaseTitle.includes('analyz') || lowercaseTitle.includes('insight') || lowercaseTitle.includes('metric') || lowercaseTitle.includes('report')) {
    return 'insights';
  }
  if (lowercaseTitle.includes('email') || lowercaseTitle.includes('draft') || lowercaseTitle.includes('write') || lowercaseTitle.includes('content')) {
    return 'content';
  }
  if (lowercaseTitle.includes('schedule') || lowercaseTitle.includes('meeting') || lowercaseTitle.includes('calendar')) {
    return 'scheduling';
  }
  if (lowercaseTitle.includes('lead') || lowercaseTitle.includes('prospect') || lowercaseTitle.includes('sales')) {
    return 'leads';
  }
  if (lowercaseTitle.includes('research') || lowercaseTitle.includes('company') || lowercaseTitle.includes('find')) {
    return 'research';
  }
  
  return 'workflow'; // Default
}

