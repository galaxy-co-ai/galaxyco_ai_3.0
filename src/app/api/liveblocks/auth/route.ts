import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { Liveblocks } from '@liveblocks/node';
import { logger } from '@/lib/logger';

// Initialize Liveblocks server
const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

/**
 * Liveblocks Authentication Endpoint
 * 
 * Authenticates users for Liveblocks real-time collaboration.
 * Returns a session token with user metadata.
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated with Clerk
    const { userId } = await auth();
    
    if (!userId) {
      logger.warn('[Liveblocks] Unauthorized auth attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get full user details
    const user = await currentUser();
    
    if (!user) {
      logger.error('[Liveblocks] User authenticated but details not found', { userId });
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Extract room from request body
    const body = await request.json();
    const { room } = body;

    if (!room || typeof room !== 'string') {
      logger.warn('[Liveblocks] Invalid room ID', { room });
      return NextResponse.json(
        { error: 'Invalid room ID' },
        { status: 400 }
      );
    }

    // Validate room format (should be neptune:workspace:{workspaceId}:conversation:{conversationId})
    const roomParts = room.split(':');
    if (roomParts.length !== 5 || roomParts[0] !== 'neptune' || roomParts[1] !== 'workspace') {
      logger.warn('[Liveblocks] Invalid room format', { room });
      return NextResponse.json(
        { error: 'Invalid room format' },
        { status: 400 }
      );
    }

    const workspaceId = roomParts[2];

    // TODO: Add workspace authorization check here
    // For now, we allow access if user is authenticated
    // In production, verify user has access to this workspace

    // Prepare session with user info
    const session = liveblocks.prepareSession(userId, {
      userInfo: {
        name: user.fullName || user.firstName || user.emailAddresses[0]?.emailAddress || 'User',
        email: user.emailAddresses[0]?.emailAddress || '',
        avatar: user.imageUrl || '',
        // Generate a color for this user (consistent based on userId)
        color: generateUserColor(userId),
      },
    });

    // Grant access to the specific room
    session.allow(room, session.FULL_ACCESS);

    // Authorize and return token
    const { status, body: responseBody } = await session.authorize();

    logger.info('[Liveblocks] Session authorized', {
      userId,
      room,
      workspaceId,
    });

    return new NextResponse(responseBody, { status });
  } catch (error) {
    logger.error('[Liveblocks] Auth error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Generate a consistent color for a user based on their ID
 */
function generateUserColor(userId: string): string {
  const colors = [
    '#E57373', // Red
    '#F06292', // Pink
    '#BA68C8', // Purple
    '#9575CD', // Deep Purple
    '#7986CB', // Indigo
    '#64B5F6', // Blue
    '#4FC3F7', // Light Blue
    '#4DD0E1', // Cyan
    '#4DB6AC', // Teal
    '#81C784', // Green
    '#AED581', // Light Green
    '#DCE775', // Lime
    '#FFD54F', // Amber
    '#FFB74D', // Orange
    '#FF8A65', // Deep Orange
  ];

  // Use a simple hash of userId to pick a color consistently
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
