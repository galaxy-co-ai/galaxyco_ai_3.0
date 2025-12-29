import { db } from '@/lib/db';
import { teamChannels, teamChannelMembers, workspaceMembers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

/**
 * Create default team channels for a new workspace
 * 
 * @param workspaceId - The ID of the workspace
 * @param creatorId - The ID of the user creating the workspace
 */
export async function createDefaultTeamChannels(workspaceId: string, creatorId: string): Promise<void> {
  try {
    const defaultChannels = [
      {
        name: 'general',
        description: 'General discussion and announcements',
        type: 'general' as const,
        isPrivate: false,
      },
      {
        name: 'random',
        description: 'Off-topic conversations and fun',
        type: 'general' as const,
        isPrivate: false,
      },
      {
        name: 'announcements',
        description: 'Important team announcements',
        type: 'announcement' as const,
        isPrivate: false,
      },
    ];

    // Get all workspace members to add them to public channels
    const members = await db.query.workspaceMembers.findMany({
      where: eq(workspaceMembers.workspaceId, workspaceId),
    });

    for (const channelDef of defaultChannels) {
      // Check if channel already exists
      const existing = await db.query.teamChannels.findFirst({
        where: eq(teamChannels.name, channelDef.name),
      });

      if (existing) {
        continue; // Skip if already exists
      }

      // Create the channel
      const [newChannel] = await db
        .insert(teamChannels)
        .values({
          workspaceId,
          name: channelDef.name,
          description: channelDef.description,
          type: channelDef.type,
          isPrivate: channelDef.isPrivate,
          createdBy: creatorId,
        })
        .returning();

      // Add all workspace members to the channel
      if (members.length > 0) {
        await db.insert(teamChannelMembers).values(
          members.map((member) => ({
            workspaceId,
            channelId: newChannel.id,
            userId: member.userId,
            role: member.userId === creatorId ? ('admin' as const) : ('member' as const),
          }))
        );
      }

      logger.info('Default team channel created', {
        workspaceId,
        channelId: newChannel.id,
        channelName: newChannel.name,
      });
    }

    logger.info('Default team channels setup completed', { workspaceId });
  } catch (error) {
    logger.error('Failed to create default team channels', { workspaceId, error });
    // Don't throw - workspace creation should succeed even if channels fail
  }
}
