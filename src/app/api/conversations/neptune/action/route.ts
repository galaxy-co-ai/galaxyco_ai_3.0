import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { conversations, conversationMessages, tasks, calendarEvents } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { openai } from '@/lib/openai';

const actionSchema = z.object({
  action: z.enum([
    'suggest-reply',
    'summarize',
    'sentiment',
    'schedule-followup',
    'create-task',
    'draft-email',
  ]),
  conversationId: z.string().uuid(),
  conversationData: z.any().optional(),
});

interface ConversationMessage {
  id: string;
  body: string;
  direction: 'inbound' | 'outbound';
  senderName: string | null;
  createdAt: Date;
}

interface ConversationRecord {
  id: string;
  channel: string;
  subject: string | null;
  createdAt: Date;
  lastMessageAt: Date;
}

export async function POST(request: Request) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = actionSchema.parse(body);

    // Verify conversation belongs to workspace
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, validated.conversationId),
        eq(conversations.workspaceId, workspaceId)
      ),
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Fetch recent messages for context
    const recentMessages = await db.query.conversationMessages.findMany({
      where: and(
        eq(conversationMessages.conversationId, validated.conversationId),
        eq(conversationMessages.workspaceId, workspaceId)
      ),
      orderBy: [desc(conversationMessages.createdAt)],
      limit: 20,
    });

    let result = '';

    // Handle different actions
    switch (validated.action) {
      case 'suggest-reply':
        result = await handleSuggestReply(recentMessages, conversation);
        break;
      case 'summarize':
        result = await handleSummarize(recentMessages, conversation);
        break;
      case 'sentiment':
        result = await handleSentiment(recentMessages, conversation);
        break;
      case 'schedule-followup':
        result = await handleScheduleFollowup(conversation, workspaceId, user.id);
        break;
      case 'create-task':
        result = await handleCreateTask(conversation, workspaceId, user.id);
        break;
      case 'draft-email':
        result = await handleDraftEmail(recentMessages, conversation);
        break;
      default:
        result = 'Action not implemented';
    }

    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('Neptune action error', error);
    return createErrorResponse(error, 'Neptune action error');
  }
}

/**
 * Format messages for AI context
 */
function formatMessagesForAI(messages: ConversationMessage[]): string {
  // Reverse to get chronological order
  const chronological = [...messages].reverse();
  
  return chronological
    .map((m) => {
      const sender = m.direction === 'inbound' ? 'Customer' : 'Agent';
      const name = m.senderName || sender;
      const time = new Date(m.createdAt).toLocaleString();
      return `[${time}] ${name} (${m.direction}): ${m.body}`;
    })
    .join('\n\n');
}

/**
 * Suggest a contextual reply using AI
 */
async function handleSuggestReply(
  messages: ConversationMessage[],
  conversation: ConversationRecord
): Promise<string> {
  const lastInboundMessage = messages.find((m) => m.direction === 'inbound');
  
  if (!lastInboundMessage) {
    return "No customer messages found to reply to. Start the conversation by sending a message.";
  }

  const conversationHistory = formatMessagesForAI(messages);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are Neptune, an AI assistant helping draft professional responses for a ${conversation.channel} conversation. 
Generate a helpful, professional, and friendly reply to the customer's latest message.
Keep the response concise but thorough. Match the tone of the conversation.
Do not include greetings like "Dear Customer" - just the body of the response.
Channel context: ${conversation.channel === 'email' ? 'This is an email, so slightly more formal is appropriate.' : 'This is a chat/message, so keep it conversational.'}`,
        },
        {
          role: 'user',
          content: `Conversation subject: ${conversation.subject || 'General inquiry'}

Conversation history:
${conversationHistory}

Generate a suggested reply to the customer's latest message.`,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const suggestion = response.choices[0]?.message?.content || 'Unable to generate suggestion.';
    
    return `**Suggested Reply:**\n\n${suggestion}\n\n---\n_You can copy, edit, or regenerate this suggestion._`;
  } catch (error) {
    logger.error('OpenAI suggest reply error', error);
    return `**Suggested Reply:**\n\n"Thank you for reaching out. I'll look into this and get back to you shortly with more information."\n\n---\n_AI suggestion unavailable - using fallback response._`;
  }
}

/**
 * Summarize the conversation using AI
 */
async function handleSummarize(
  messages: ConversationMessage[],
  conversation: ConversationRecord
): Promise<string> {
  if (messages.length === 0) {
    return "No messages to summarize yet.";
  }

  const conversationHistory = formatMessagesForAI(messages);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are Neptune, an AI assistant. Summarize the conversation concisely.
Include:
- Main topic/issue discussed
- Key points raised by the customer
- Actions taken or promised
- Current status/next steps needed
Format with bullet points for easy reading.`,
        },
        {
          role: 'user',
          content: `Summarize this ${conversation.channel} conversation:

Subject: ${conversation.subject || 'General conversation'}
Started: ${new Date(conversation.createdAt).toLocaleDateString()}
Messages: ${messages.length}

Conversation:
${conversationHistory}`,
        },
      ],
      max_tokens: 600,
      temperature: 0.3,
    });

    const summary = response.choices[0]?.message?.content || 'Unable to generate summary.';
    
    return `**Conversation Summary**\n\n${summary}`;
  } catch (error) {
    logger.error('OpenAI summarize error', error);
    return `**Conversation Summary**\n\n- ${messages.length} messages exchanged\n- Started: ${new Date(conversation.createdAt).toLocaleDateString()}\n- Last activity: ${new Date(conversation.lastMessageAt).toLocaleDateString()}\n- Channel: ${conversation.channel}\n\n_Detailed AI summary unavailable._`;
  }
}

/**
 * Analyze sentiment of the conversation using AI
 */
async function handleSentiment(
  messages: ConversationMessage[],
  conversation: ConversationRecord
): Promise<string> {
  if (messages.length === 0) {
    return "No messages to analyze yet.";
  }

  const conversationHistory = formatMessagesForAI(messages);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are Neptune, an AI assistant analyzing conversation sentiment.
Analyze the customer's sentiment throughout the conversation.
Provide:
- Overall sentiment (Positive/Neutral/Negative/Mixed)
- Sentiment score (1-10, where 10 is most positive)
- Key emotional indicators
- Any concerns or frustrations detected
- Recommendations for improving customer satisfaction
Be specific and actionable.`,
        },
        {
          role: 'user',
          content: `Analyze the sentiment in this ${conversation.channel} conversation:

${conversationHistory}`,
        },
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const analysis = response.choices[0]?.message?.content || 'Unable to analyze sentiment.';
    
    return `**Sentiment Analysis**\n\n${analysis}`;
  } catch (error) {
    logger.error('OpenAI sentiment error', error);
    return `**Sentiment Analysis**\n\n- Overall: Unable to determine\n- Messages analyzed: ${messages.length}\n\n_AI sentiment analysis unavailable._`;
  }
}

/**
 * Schedule a follow-up in the calendar
 */
async function handleScheduleFollowup(
  conversation: ConversationRecord,
  workspaceId: string,
  userId: string
): Promise<string> {
  try {
    // Schedule for tomorrow at 2 PM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    
    const endTime = new Date(tomorrow);
    endTime.setMinutes(endTime.getMinutes() + 30);

    const [event] = await db
      .insert(calendarEvents)
      .values({
        workspaceId,
        title: `Follow up: ${conversation.subject || 'Conversation'}`,
        description: `Follow up on ${conversation.channel} conversation (ID: ${conversation.id})`,
        startTime: tomorrow,
        endTime,
        isAllDay: false,
        createdBy: userId,
      })
      .returning();

    return `**Follow-up Scheduled** ✅\n\n📅 **Date:** ${tomorrow.toLocaleDateString()}\n⏰ **Time:** ${tomorrow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n📝 **Title:** Follow up: ${conversation.subject || 'Conversation'}\n\n_Event added to your calendar._`;
  } catch (error) {
    logger.error('Schedule followup error', error);
    return `**Follow-up Scheduling**\n\nUnable to create calendar event. Please schedule manually:\n- Suggested time: Tomorrow at 2:00 PM\n- Subject: Follow up on ${conversation.channel} conversation`;
  }
}

/**
 * Create a CRM task for follow-up
 */
async function handleCreateTask(
  conversation: ConversationRecord,
  workspaceId: string,
  userId: string
): Promise<string> {
  try {
    // Due tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(17, 0, 0, 0);

    const [task] = await db
      .insert(tasks)
      .values({
        workspaceId,
        title: `Follow up on ${conversation.channel} conversation`,
        description: `Review and respond to conversation: ${conversation.subject || 'No subject'}\n\nConversation ID: ${conversation.id}`,
        status: 'pending',
        priority: 'medium',
        dueDate: tomorrow,
        assignedTo: userId,
        createdBy: userId,
      })
      .returning();

    return `**Task Created** ✅\n\n📋 **Title:** Follow up on ${conversation.channel} conversation\n📅 **Due:** ${tomorrow.toLocaleDateString()}\n🎯 **Priority:** Medium\n📌 **Status:** Pending\n\n_Task added to your CRM._`;
  } catch (error) {
    logger.error('Create task error', error);
    return `**Task Creation**\n\nUnable to create task automatically. Please create manually:\n- Title: Follow up on ${conversation.channel} conversation\n- Due: Tomorrow\n- Priority: Medium`;
  }
}

/**
 * Draft an email summary/follow-up using AI
 */
async function handleDraftEmail(
  messages: ConversationMessage[],
  conversation: ConversationRecord
): Promise<string> {
  if (messages.length === 0) {
    return "No conversation content to draft from.";
  }

  const conversationHistory = formatMessagesForAI(messages);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are Neptune, an AI assistant drafting a professional follow-up email.
Based on the conversation, create a well-structured email that:
- Has a clear subject line
- Summarizes the discussion
- Outlines any agreed actions or next steps
- Maintains a professional but friendly tone
- Is ready to send with minimal editing

Format:
**Subject:** [subject line]

**Email Body:**
[email content]`,
        },
        {
          role: 'user',
          content: `Draft a follow-up email based on this ${conversation.channel} conversation:

Original subject: ${conversation.subject || 'General inquiry'}

Conversation:
${conversationHistory}`,
        },
      ],
      max_tokens: 800,
      temperature: 0.5,
    });

    const draft = response.choices[0]?.message?.content || 'Unable to generate draft.';
    
    return `**Email Draft**\n\n${draft}\n\n---\n_Review and edit before sending._`;
  } catch (error) {
    logger.error('OpenAI draft email error', error);
    return `**Email Draft**\n\n**Subject:** Re: ${conversation.subject || 'Follow-up'}\n\n**Email Body:**\nThank you for our recent conversation. I wanted to follow up and confirm the points we discussed.\n\n[Add specific details here]\n\nPlease let me know if you have any questions.\n\nBest regards\n\n---\n_AI draft unavailable - using template._`;
  }
}
