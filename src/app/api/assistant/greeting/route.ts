import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { gatherAIContext } from '@/lib/ai/context';
import { generateGreeting } from '@/lib/ai/system-prompt';

// ============================================================================
// GET - Get Personalized Greeting
// ============================================================================

/**
 * GET /api/assistant/greeting
 * 
 * Returns a personalized greeting message for the AI assistant
 * based on the user's current context (time of day, tasks, events, etc.)
 */
export async function GET() {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();

    // Gather context for personalized greeting
    const aiContext = await gatherAIContext(workspaceId, userId);
    
    // Generate greeting
    const greeting = generateGreeting(aiContext);

    // Build context summary for the frontend
    const contextSummary = aiContext ? {
      todayEvents: aiContext.calendar.todayEventCount,
      pendingTasks: aiContext.tasks.pendingTasks,
      overdueTasks: aiContext.tasks.overdueTasks,
      hotLeads: aiContext.crm.hotLeads.length,
      totalLeads: aiContext.crm.totalLeads,
      pipelineValue: aiContext.crm.totalPipelineValue,
    } : null;

    return NextResponse.json({
      greeting,
      context: contextSummary,
      userName: aiContext?.user.fullName || 'there',
      currentTime: aiContext?.currentTime,
      currentDate: aiContext?.currentDate,
    });
  } catch (error) {
    logger.error('Failed to generate greeting', error);
    
    // Return default greeting on error
    return NextResponse.json({
      greeting: "Hi! I'm Galaxy, your AI assistant. How can I help you today?",
      context: null,
      userName: 'there',
    });
  }
}

