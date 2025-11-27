import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { agents } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';

export async function GET() {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    const agentsList = await db.query.agents.findMany({
      where: and(
        eq(agents.workspaceId, workspaceId),
        eq(agents.status, 'active')
      ),
      orderBy: [desc(agents.createdAt)],
      limit: 50,
    });

    return NextResponse.json(
      agentsList.map((agent: typeof agentsList[0]) => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        type: agent.type,
        status: agent.status,
        executionCount: agent.executionCount,
        lastExecutedAt: agent.lastExecutedAt,
      }))
    );
  } catch (error) {
    return createErrorResponse(error, 'Get agents error');
  }
}









