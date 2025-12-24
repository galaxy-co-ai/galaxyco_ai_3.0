import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { neptuneMessages } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/neptune-hq/tool-usage
 * Returns tool usage stats aggregated from Neptune messages
 */
export async function GET() {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    // Fetch messages with tools used
    const messagesWithTools = await db.query.neptuneMessages.findMany({
      where: eq(neptuneMessages.workspaceId, workspaceId),
      columns: {
        toolsUsed: true,
      },
    });

    // Aggregate tool usage counts
    const toolCounts = new Map<string, number>();
    
    for (const msg of messagesWithTools) {
      if (msg.toolsUsed && Array.isArray(msg.toolsUsed)) {
        for (const tool of msg.toolsUsed) {
          if (tool) {
            toolCounts.set(tool, (toolCounts.get(tool) || 0) + 1);
          }
        }
      }
    }

    // Convert to sorted array
    const tools = Array.from(toolCounts.entries())
      .map(([name, executions]) => ({ name, executions }))
      .sort((a, b) => b.executions - a.executions)
      .slice(0, 10);

    // If no tools found, return default list
    if (tools.length === 0) {
      return NextResponse.json({
        tools: [
          { name: 'No tools used yet', executions: 0 },
        ],
      });
    }

    return NextResponse.json({ tools });
  } catch (error) {
    return createErrorResponse(error, 'Tool usage error');
  }
}
