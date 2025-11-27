import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { authenticateChannel, isPusherConfigured } from '@/lib/pusher-server';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    // Check if Pusher is configured
    if (!isPusherConfigured()) {
      return NextResponse.json(
        { error: 'Pusher not configured' },
        { status: 503 }
      );
    }

    // Get authenticated user and workspace
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();

    // Parse the request body
    const formData = await request.formData();
    const socketId = formData.get('socket_id') as string;
    const channelName = formData.get('channel_name') as string;

    if (!socketId || !channelName) {
      return NextResponse.json(
        { error: 'Missing socket_id or channel_name' },
        { status: 400 }
      );
    }

    // Validate channel access
    // Private workspace channels: user must belong to the workspace
    if (channelName.startsWith('private-workspace-')) {
      const channelWorkspaceId = channelName.replace('private-workspace-', '');
      if (channelWorkspaceId !== workspaceId) {
        logger.warn('[Pusher Auth] Unauthorized workspace channel access', {
          userId: user.id,
          requestedWorkspace: channelWorkspaceId,
          actualWorkspace: workspaceId,
        });
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
    }

    // Private user channels: user must be the channel owner
    if (channelName.startsWith('private-user-')) {
      const channelUserId = channelName.replace('private-user-', '');
      if (channelUserId !== user.id) {
        logger.warn('[Pusher Auth] Unauthorized user channel access', {
          userId: user.id,
          requestedUserId: channelUserId,
        });
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
    }

    // Presence channels: validate workspace membership
    if (channelName.startsWith('presence-workspace-')) {
      const channelWorkspaceId = channelName.replace('presence-workspace-', '');
      if (channelWorkspaceId !== workspaceId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
    }

    // Authenticate the channel
    const userInfo = {
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      email: user.email,
      avatarUrl: user.avatarUrl,
    };

    const auth = authenticateChannel(socketId, channelName, user.id, userInfo);

    logger.debug('[Pusher Auth] Channel authenticated', {
      userId: user.id,
      channel: channelName,
    });

    return NextResponse.json(auth);
  } catch (error) {
    logger.error('[Pusher Auth] Authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Return 403 for auth errors to prevent channel subscription
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 403 }
    );
  }
}

