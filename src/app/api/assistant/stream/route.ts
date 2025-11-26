import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { aiConversations, aiMessages, aiUserPreferences } from '@/db/schema';
import { eq, and, desc, asc, sql, ne } from 'drizzle-orm';
import { getOpenAI } from '@/lib/ai-providers';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Note: Removed 'edge' runtime to allow database access
// Edge runtime has limitations with some database operations

const streamMessageSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  conversationId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    let workspaceId: string;
    let user: any;
    
    try {
      const workspaceResult = await getCurrentWorkspace();
      workspaceId = workspaceResult.workspaceId;
    } catch (authError) {
      logger.error('Authentication error getting workspace', authError);
      const errorMsg = authError instanceof Error ? authError.message : 'Authentication failed';
      const encoder = new TextEncoder();
      const errorStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: `Authentication error: ${errorMsg}` })}\n\n`)
          );
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });
      return new Response(errorStream, {
        status: 401,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }
    
    try {
      user = await getCurrentUser();
      if (!user || !user.id) {
        throw new Error('User not found or invalid');
      }
    } catch (authError) {
      logger.error('Authentication error getting user', authError);
      const errorMsg = authError instanceof Error ? authError.message : 'User authentication failed';
      const encoder = new TextEncoder();
      const errorStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: `Authentication error: ${errorMsg}` })}\n\n`)
          );
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });
      return new Response(errorStream, {
        status: 401,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Rate limit
    const rateLimitResult = await rateLimit(`ai:chat:${user.id}`, 20, 60);
    if (!rateLimitResult.success) {
      const encoder = new TextEncoder();
      const errorStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment and try again.' })}\n\n`)
          );
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });
      return new Response(errorStream, {
        status: 429,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    const body = await request.json();

    // Validate input
    const validationResult = streamMessageSchema.safeParse(body);
    if (!validationResult.success) {
      const encoder = new TextEncoder();
      const errorStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              error: 'Validation failed', 
              details: validationResult.error.errors 
            })}\n\n`)
          );
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });
      return new Response(errorStream, {
        status: 400,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    const { message, conversationId } = validationResult.data;

    // Get or create conversation
    let conversation;
    try {
      if (conversationId) {
        const existing = await db.query.aiConversations.findFirst({
          where: and(
            eq(aiConversations.id, conversationId),
            eq(aiConversations.workspaceId, workspaceId),
            eq(aiConversations.userId, user.id)
          ),
        });
        conversation = existing;
      }

      if (!conversation) {
        const [newConv] = await db
          .insert(aiConversations)
          .values({
            workspaceId,
            userId: user.id,
            title: message.substring(0, 50),
            lastMessageAt: new Date(),
            messageCount: 0,
          })
          .returning();
        conversation = newConv;
      }
    } catch (dbError) {
      logger.error('Database error creating conversation', dbError);
      const errorMsg = dbError instanceof Error ? dbError.message : 'Failed to create conversation';
      const encoder = new TextEncoder();
      const errorStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: `Database error: ${errorMsg}` })}\n\n`)
          );
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });
      return new Response(errorStream, {
        status: 500,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Save user message
    try {
      await db.insert(aiMessages).values({
        conversationId: conversation.id,
        role: 'user',
        content: message,
      });
    } catch (dbError) {
      logger.error('Database error saving user message', dbError);
      const errorMsg = dbError instanceof Error ? dbError.message : 'Failed to save message';
      const encoder = new TextEncoder();
      const errorStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: `Database error: ${errorMsg}` })}\n\n`)
          );
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });
      return new Response(errorStream, {
        status: 500,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Get or create user preferences for personalization (non-blocking - if it fails, continue)
    let preferences;
    try {
      preferences = await db.query.aiUserPreferences.findFirst({
        where: and(
          eq(aiUserPreferences.workspaceId, workspaceId),
          eq(aiUserPreferences.userId, user.id)
        ),
      });

      if (!preferences) {
        // Create default preferences
        const [newPrefs] = await db.insert(aiUserPreferences).values({
          workspaceId,
          userId: user.id,
          communicationStyle: 'balanced',
          topicsOfInterest: [],
          frequentQuestions: [],
        }).returning();
        preferences = newPrefs;
      }
    } catch (prefError) {
      logger.error('Failed to load user preferences, using defaults', prefError);
      preferences = {
        communicationStyle: 'balanced',
        topicsOfInterest: [],
        frequentQuestions: [],
      } as any;
    }

    // Get conversation history - increased context window
    let history: any[] = [];
    try {
      history = await db.query.aiMessages.findMany({
        where: eq(aiMessages.conversationId, conversation.id),
        orderBy: [asc(aiMessages.createdAt)],
        limit: 25,
      });
    } catch (dbError) {
      logger.error('Failed to load conversation history, using empty history', dbError);
      history = [];
    }

    // Get recent conversations for context (last 5 conversations) - only if we have a conversation ID
    let recentConversations: any[] = [];
    if (conversationId) {
      recentConversations = await db.query.aiConversations.findMany({
        where: and(
          eq(aiConversations.workspaceId, workspaceId),
          eq(aiConversations.userId, user.id),
          ne(aiConversations.id, conversationId)
        ),
        orderBy: [desc(aiConversations.lastMessageAt)],
        limit: 5,
      });
    }

    // Build context about user's interests and patterns
    const userContext = preferences.topicsOfInterest.length > 0
      ? `User frequently asks about: ${preferences.topicsOfInterest.join(', ')}`
      : '';

    const communicationStyle = preferences.communicationStyle || 'balanced';
    
    // Build enhanced system prompt with learned preferences
    const systemPrompt = `You are Galaxy AI, the user's intelligent partner and wingman. You work WITH them, not just answer questions.

CORE PRINCIPLES:
1. **Understand first, then act** - Ask clarifying questions if needed, don't assume
2. **One step at a time** - Break things into clear, actionable steps. Guide them through it
3. **Conversational, not verbose** - Talk like a smart colleague, not a textbook
4. **Action over explanation** - Help them DO things. Don't list everything upfront
5. **Build together** - Work through problems step-by-step, not all at once

COMMUNICATION STYLE:
${communicationStyle === 'concise' ? 'Be brief and direct. One thought at a time.' : communicationStyle === 'detailed' ? 'Provide context when helpful, but still break it into steps.' : 'Match the complexity - simple questions get quick answers, complex tasks get step-by-step guidance.'}

HOW TO RESPOND:
- **Simple questions** → Quick, direct answer (2-3 sentences max)
- **Complex tasks** → "Let's do this step by step. First, [one clear action]"
- **Unclear requests** → Ask ONE clarifying question, don't list options
- **Setup/onboarding** → "I'll walk you through this. First step: [one thing]"
- **Multiple steps needed** → Guide them through one step, wait for confirmation, then next step

PERSONALITY:
- Conversational and friendly - like talking to a smart colleague
- Proactive but not pushy - suggest next steps, don't overwhelm
- Practical - focus on what they need NOW, not everything possible
- Collaborative - work WITH them, not just tell them

${userContext ? `\nUSER INTERESTS:\n${userContext}\n` : ''}

${recentConversations.length > 0 ? `\nRECENT CONTEXT:\nYou've discussed:\n${recentConversations.map(conv => `- ${conv.title || 'Previous conversation'}`).join('\n')}\n` : ''}

Current workspace: ${workspaceId}
User: ${user.email || user.firstName || user.id}

Remember: You're their partner. Help them accomplish their goal, one step at a time. No long explanations unless they ask.`;

    // Create OpenAI stream with GPT-4o (faster, better quality)
    let stream;
    try {
      const openai = getOpenAI();
      stream = await openai.chat.completions.create({
        model: 'gpt-4o', // Upgraded from gpt-4-turbo-preview (2x faster, better quality)
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...history.slice(-20).map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
      ],
      stream: true,
      temperature: 0.6, // Slightly lower for more focused responses
      max_tokens: 500, // Reduced to encourage concise, focused responses
      });
    } catch (openaiError) {
      logger.error('OpenAI API error', openaiError);
      const errorMessage = openaiError instanceof Error ? openaiError.message : 'Failed to initialize AI service';
      
      // Check for API key issues
      if (errorMessage.includes('API key') || errorMessage.includes('OPENAI_API_KEY')) {
        const encoder = new TextEncoder();
        const errorStream = new ReadableStream({
          start(controller) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: 'AI service is not configured. Please configure OpenAI API key.' })}\n\n`)
            );
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          },
        });
        return new Response(errorStream, {
          status: 503,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        });
      }
      throw openaiError;
    }

    // Create response stream
    const encoder = new TextEncoder();
    let fullResponse = '';

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          logger.info('Starting stream processing', { conversationId: conversation.id });
          
          for await (const chunk of stream) {
            // Check for errors in the chunk
            // OpenAI stream chunks can have an error property
            const chunkWithError = chunk as { error?: { message?: string } };
            if (chunkWithError.error) {
              const errorMsg = chunkWithError.error.message || 'An error occurred while generating the response';
              logger.error('OpenAI stream error', chunkWithError.error);
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`)
              );
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
              return;
            }
            
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
              );
            }
          }
          
          logger.info('Stream processing complete', { responseLength: fullResponse.length });

          // Save complete response (non-blocking - continue even if save fails)
          try {
            await db.insert(aiMessages).values({
              conversationId: conversation!.id,
              role: 'assistant',
              content: fullResponse,
            });

            // Update conversation
            await db
              .update(aiConversations)
              .set({
                lastMessageAt: new Date(),
                messageCount: conversation!.messageCount + 2,
              })
              .where(eq(aiConversations.id, conversation!.id));
          } catch (saveError) {
            logger.error('Failed to save assistant message to database', saveError);
            // Continue - the response was already sent to the user
          }

          // Learn from conversation and update preferences (in background)
          // This happens asynchronously so it doesn't block the response
          updateUserPreferencesFromConversation({
            workspaceId,
            userId: user.id,
            userMessage: message,
            assistantResponse: fullResponse,
            history,
          }).catch(err => {
            logger.warn('Failed to learn from conversation', { error: err });
          });

          // Send conversation ID before closing
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ conversationId: conversation!.id, done: true })}\n\n`)
          );
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          logger.error('Stream processing error', error);
          const errorMessage = error instanceof Error ? error.message : 'An error occurred while processing the stream';
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
            );
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          } catch (e) {
            // If we can't send error, just close
          }
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    logger.error('Stream error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to stream response';
    
    // Check for specific error types
    if (error instanceof Error) {
      // Authentication errors
      if (error.message.includes('Unauthorized') || error.message.includes('not authenticated')) {
        return new Response(
          JSON.stringify({ error: 'Please sign in to use the AI assistant.' }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // API key errors
      if (error.message.includes('API key') || error.message.includes('OPENAI_API_KEY')) {
        return new Response(
          JSON.stringify({ error: 'AI service is not configured. Please configure OpenAI API key.' }),
          { 
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Database errors
      if (error.message.includes('database') || error.message.includes('query')) {
        return new Response(
          JSON.stringify({ error: 'Database error. Please try again.' }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }
    
    // Try to send error as stream if possible (for streaming errors)
    try {
      const encoder = new TextEncoder();
      const errorStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
          );
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });
      
      return new Response(errorStream, {
        status: 500,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    } catch (streamError) {
      // Fallback to JSON response if stream creation fails
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
}

// Helper functions for learning and personalization
async function updateUserPreferencesFromConversation({
  workspaceId,
  userId,
  userMessage,
  assistantResponse,
  history,
}: {
  workspaceId: string;
  userId: string;
  userMessage: string;
  assistantResponse: string;
  history: any[];
}) {
  try {
    // Get current preferences
    let preferences = await db.query.aiUserPreferences.findFirst({
      where: and(
        eq(aiUserPreferences.workspaceId, workspaceId),
        eq(aiUserPreferences.userId, userId)
      ),
    });

    if (!preferences) {
      // Create preferences if they don't exist
      const [newPrefs] = await db.insert(aiUserPreferences).values({
        workspaceId,
        userId,
        communicationStyle: 'balanced',
        topicsOfInterest: [],
        frequentQuestions: [],
      }).returning();
      preferences = newPrefs;
    }

    // Extract topics from conversation
    const topics = extractTopics(userMessage, assistantResponse);
    
    // Infer communication style preference
    const inferredStyle = inferCommunicationStyle([
      ...history,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: assistantResponse },
    ]);

    // Update preferences
    const updatedTopics = [...new Set([...(preferences.topicsOfInterest || []), ...topics])].slice(0, 10); // Keep top 10
    
    await db
      .update(aiUserPreferences)
      .set({
        topicsOfInterest: updatedTopics,
        communicationStyle: inferredStyle !== preferences.communicationStyle 
          ? inferredStyle 
          : preferences.communicationStyle,
        updatedAt: new Date(),
      })
      .where(eq(aiUserPreferences.id, preferences.id));

    logger.info('Updated user preferences', { userId, topics: updatedTopics, style: inferredStyle });
  } catch (error) {
    logger.error('Failed to update user preferences', { error });
  }
}

function extractTopics(userMessage: string, assistantResponse: string): string[] {
  const topics: string[] = [];
  const message = (userMessage + ' ' + assistantResponse).toLowerCase();
  
  // Simple keyword-based topic extraction
  const topicKeywords: Record<string, string> = {
    'workflow': 'workflows',
    'automation': 'automation',
    'crm': 'CRM',
    'agent': 'AI agents',
    'code': 'coding',
    'api': 'APIs',
    'data': 'data analysis',
    'marketing': 'marketing',
    'sales': 'sales',
    'email': 'email',
    'meeting': 'meetings',
    'transcript': 'transcription',
    'document': 'documentation',
    'integration': 'integrations',
  };

  for (const [keyword, topic] of Object.entries(topicKeywords)) {
    if (message.includes(keyword) && !topics.includes(topic)) {
      topics.push(topic);
    }
  }

  return topics.slice(0, 5); // Max 5 topics per conversation
}

function inferCommunicationStyle(messages: Array<{ role: string; content: string }>): 'concise' | 'detailed' | 'balanced' {
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
  const assistantMessages = messages.filter(m => m.role === 'assistant').map(m => m.content);
  
  // Analyze patterns
  const avgUserLength = userMessages.reduce((sum, m) => sum + m.length, 0) / (userMessages.length || 1);
  const avgAssistantLength = assistantMessages.reduce((sum, m) => sum + m.length, 0) / (assistantMessages.length || 1);
  
  // User asks for brevity
  if (userMessages.some(m => m.toLowerCase().includes('brief') || m.toLowerCase().includes('short'))) {
    return 'concise';
  }
  
  // User asks for details
  if (userMessages.some(m => m.toLowerCase().includes('detail') || m.toLowerCase().includes('explain') || m.toLowerCase().includes('how'))) {
    return 'detailed';
  }
  
  // Infer from message lengths
  if (avgAssistantLength < 200 && avgUserLength < 100) {
    return 'concise';
  }
  
  if (avgAssistantLength > 800 || avgUserLength > 300) {
    return 'detailed';
  }
  
  return 'balanced';
}


