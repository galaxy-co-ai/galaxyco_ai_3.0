/**
 * Toggle Agent Availability
 * 
 * Make agents available or unavailable to users
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { agentId, available } = await req.json();
    
    if (!agentId || typeof available !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing agentId or available status' },
        { status: 400 }
      );
    }
    
    logger.info('Toggling agent availability', {
      agentId,
      available,
    });
    
    // TODO: Update database
    // await db.update(agentTemplates)
    //   .set({ availableToUsers: available })
    //   .where(eq(agentTemplates.id, agentId));
    
    return NextResponse.json({
      success: true,
      agentId,
      available,
    });
  } catch (error) {
    logger.error('Toggle availability error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
