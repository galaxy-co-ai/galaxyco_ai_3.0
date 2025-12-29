import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { users, workspaces, workspaceMembers, workspacePhoneNumbers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { autoProvisionForWorkspace } from '@/lib/phone-numbers';
import { createDefaultTeamChannels } from '@/lib/team-channels';

/**
 * Clerk Webhook Handler
 * 
 * Syncs Clerk users and organizations to the local database.
 * Uses upsert pattern (ON CONFLICT) to prevent race condition duplicates.
 * 
 * Events handled:
 * - user.created / user.updated - Sync user data
 * - user.deleted - Deactivate user memberships
 * - organization.created / updated / deleted - Sync org workspaces
 */
export async function POST(request: NextRequest) {
  try {
    // Get the Svix headers for verification
    const headerPayload = await headers();
    const svixId = headerPayload.get('svix-id');
    const svixTimestamp = headerPayload.get('svix-timestamp');
    const svixSignature = headerPayload.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json(
        { error: 'Missing svix headers' },
        { status: 400 }
      );
    }

    // Get the webhook secret
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error('CLERK_WEBHOOK_SECRET is not set');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Get the raw body
    const payload = await request.text();

    // Create a new Svix instance with the webhook secret
    const wh = new Webhook(webhookSecret);

    let evt: unknown;

    try {
      // Verify the webhook payload
      evt = wh.verify(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
    } catch (err) {
      logger.error('Webhook verification failed', err instanceof Error ? err : new Error(String(err)));
      return NextResponse.json(
        { error: 'Webhook verification failed' },
        { status: 400 }
      );
    }

    // Type assertion for verified webhook event
    const event = evt as { type: string; data: Record<string, unknown> };
    const eventType = event.type;
    const data = event.data;

    if (eventType === 'user.created' || eventType === 'user.updated') {
      // Sync user to database using upsert pattern
      const clerkUserId = data.id as string;
      const emailAddresses = (data.email_addresses || []) as Array<{ id: string; email_address: string }>;
      const email = emailAddresses.find((e) => e.id === data.primary_email_address_id)?.email_address 
        || emailAddresses[0]?.email_address;
      const firstName = (data.first_name as string) || null;
      const lastName = (data.last_name as string) || null;
      const avatarUrl = (data.image_url as string) || null;
      const createdAt = data.created_at ? new Date((data.created_at as number) * 1000) : new Date();

      if (!email) {
        logger.error('No email found for user', new Error('Missing email'), { clerkUserId });
        return NextResponse.json(
          { error: 'No email found' },
          { status: 400 }
        );
      }

      // Use upsert pattern to prevent race condition duplicates
      // ON CONFLICT on clerkUserId will update instead of failing
      const [upsertedUser] = await db
        .insert(users)
        .values({
          clerkUserId,
          email,
          firstName,
          lastName,
          avatarUrl,
          createdAt,
        })
        .onConflictDoUpdate({
          target: users.clerkUserId,
          set: {
            email,
            firstName,
            lastName,
            avatarUrl,
            updatedAt: new Date(),
          },
        })
        .returning();

      // For new users (user.created), set up their workspace
      if (eventType === 'user.created') {
        // Check if user already has a workspace membership
        const existingMembership = await db.query.workspaceMembers.findFirst({
          where: and(
            eq(workspaceMembers.userId, upsertedUser.id),
            eq(workspaceMembers.isActive, true)
          ),
        });

        if (!existingMembership) {
          // Create default workspace for new user
          const workspaceName = firstName && lastName
            ? `${firstName} ${lastName}'s Workspace`
            : email.split('@')[0] + "'s Workspace";

          const baseSlug = workspaceName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

          // Generate unique slug by appending timestamp if needed
          let workspaceSlug = baseSlug;
          const existingWorkspace = await db.query.workspaces.findFirst({
            where: eq(workspaces.slug, workspaceSlug),
          });

          if (existingWorkspace) {
            // Slug exists, append timestamp to make unique
            workspaceSlug = `${baseSlug}-${Date.now()}`;
          }

          const [newWorkspace] = await db
            .insert(workspaces)
            .values({
              name: workspaceName,
              slug: workspaceSlug,
            })
            .returning();

          // Add user as owner of workspace
          await db.insert(workspaceMembers).values({
            userId: upsertedUser.id,
            workspaceId: newWorkspace.id,
            role: 'owner',
            isActive: true,
          });

          // Create default team channels
          await createDefaultTeamChannels(newWorkspace.id, upsertedUser.id);

          // Auto-provision phone number for Pro/Enterprise tiers
          // Starter plan uses platform's shared number
          if (newWorkspace.subscriptionTier === 'professional' || newWorkspace.subscriptionTier === 'enterprise') {
            try {
              const provisionedNumber = await autoProvisionForWorkspace({
                workspaceId: newWorkspace.id,
                workspaceName: newWorkspace.name,
              });

              // Store phone number in database
              await db.insert(workspacePhoneNumbers).values({
                workspaceId: newWorkspace.id,
                phoneNumber: provisionedNumber.phoneNumber,
                phoneNumberSid: provisionedNumber.sid,
                friendlyName: provisionedNumber.friendlyName,
                capabilities: provisionedNumber.capabilities,
                voiceUrl: provisionedNumber.voiceUrl,
                smsUrl: provisionedNumber.smsUrl,
                statusCallbackUrl: provisionedNumber.statusCallback,
                numberType: 'primary',
                monthlyCost: 100, // $1.00 in cents
              });

              logger.info('Phone number provisioned for workspace', {
                workspaceId: newWorkspace.id,
                phoneNumber: provisionedNumber.phoneNumber,
                tier: newWorkspace.subscriptionTier,
              });
            } catch (error) {
              // Don't fail workspace creation if phone provisioning fails
              // User can provision manually later
              logger.error('Failed to provision phone number', error instanceof Error ? error : new Error(String(error)), {
                workspaceId: newWorkspace.id,
              });
            }
          }

          logger.info('User workspace created', { 
            userId: upsertedUser.id, 
            workspaceId: newWorkspace.id,
            clerkUserId 
          });
        }
      }

      logger.info('User synced from Clerk', { 
        userId: upsertedUser.id, 
        clerkUserId, 
        eventType 
      });
    } else if (eventType === 'user.deleted') {
      // Handle user deletion - soft delete by deactivating memberships
      const clerkUserId = data.id as string;
      const user = await db.query.users.findFirst({
        where: eq(users.clerkUserId, clerkUserId),
      });

      if (user) {
        // Deactivate workspace memberships instead of hard deleting
        await db
          .update(workspaceMembers)
          .set({ isActive: false })
          .where(eq(workspaceMembers.userId, user.id));

        logger.info('User deactivated from Clerk deletion', { 
          userId: user.id, 
          clerkUserId 
        });
      }
    } else if (eventType === 'organization.created') {
      // Handle organization creation - create a corresponding workspace
      const clerkOrgId = data.id as string;
      const orgName = data.name as string;
      const orgSlug = (data.slug as string) || orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const createdBy = data.created_by as string | undefined;

      // Check if workspace with this clerk org ID already exists
      const existingWorkspace = await db.query.workspaces.findFirst({
        where: eq(workspaces.clerkOrganizationId, clerkOrgId),
      });

      if (!existingWorkspace) {
        // Create workspace for the organization
        const [newWorkspace] = await db
          .insert(workspaces)
          .values({
            name: orgName,
            slug: orgSlug,
            clerkOrganizationId: clerkOrgId,
          })
          .returning();

        // If we know who created it, add them as owner
        if (createdBy) {
          const creator = await db.query.users.findFirst({
            where: eq(users.clerkUserId, createdBy),
          });

          if (creator) {
            await db.insert(workspaceMembers).values({
              userId: creator.id,
              workspaceId: newWorkspace.id,
              role: 'owner',
              isActive: true,
            });
          }
        }

        // Auto-provision phone number for Pro/Enterprise org workspaces
        if (newWorkspace.subscriptionTier === 'professional' || newWorkspace.subscriptionTier === 'enterprise') {
          try {
            const provisionedNumber = await autoProvisionForWorkspace({
              workspaceId: newWorkspace.id,
              workspaceName: newWorkspace.name,
            });

            await db.insert(workspacePhoneNumbers).values({
              workspaceId: newWorkspace.id,
              phoneNumber: provisionedNumber.phoneNumber,
              phoneNumberSid: provisionedNumber.sid,
              friendlyName: provisionedNumber.friendlyName,
              capabilities: provisionedNumber.capabilities,
              voiceUrl: provisionedNumber.voiceUrl,
              smsUrl: provisionedNumber.smsUrl,
              statusCallbackUrl: provisionedNumber.statusCallback,
              numberType: 'primary',
              monthlyCost: 100,
            });

            logger.info('Phone number provisioned for organization workspace', {
              workspaceId: newWorkspace.id,
              phoneNumber: provisionedNumber.phoneNumber,
            });
          } catch (error) {
            logger.error('Failed to provision phone number for org', error instanceof Error ? error : new Error(String(error)), {
              workspaceId: newWorkspace.id,
            });
          }
        }

        logger.info('Organization workspace created', { clerkOrgId, workspaceId: newWorkspace.id });
      }
    } else if (eventType === 'organization.updated') {
      // Handle organization updates - sync name/slug changes
      const clerkOrgId = data.id as string;
      const orgName = data.name as string | undefined;
      const orgSlug = data.slug as string | undefined;

      const workspace = await db.query.workspaces.findFirst({
        where: eq(workspaces.clerkOrganizationId, clerkOrgId),
      });

      if (workspace) {
        await db
          .update(workspaces)
          .set({
            name: orgName || workspace.name,
            slug: orgSlug || workspace.slug,
            updatedAt: new Date(),
          })
          .where(eq(workspaces.id, workspace.id));

        logger.info('Organization workspace updated', { clerkOrgId, workspaceId: workspace.id });
      }
    } else if (eventType === 'organization.deleted') {
      // Handle organization deletion - deactivate the workspace
      const clerkOrgId = data.id as string;

      const workspace = await db.query.workspaces.findFirst({
        where: eq(workspaces.clerkOrganizationId, clerkOrgId),
      });

      if (workspace) {
        // Deactivate all memberships for this workspace
        await db
          .update(workspaceMembers)
          .set({ isActive: false })
          .where(eq(workspaceMembers.workspaceId, workspace.id));

        // Optionally mark workspace as inactive (if you have such a field)
        // For now, just log the deletion
        logger.info('Organization workspace deactivated', { clerkOrgId, workspaceId: workspace.id });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Webhook error', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

