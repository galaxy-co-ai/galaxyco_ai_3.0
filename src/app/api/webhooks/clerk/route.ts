import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { users, workspaces, workspaceMembers } from '@/db/schema';
import { eq } from 'drizzle-orm';

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
      console.error('CLERK_WEBHOOK_SECRET is not set');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Get the raw body
    const payload = await request.text();

    // Create a new Svix instance with the webhook secret
    const wh = new Webhook(webhookSecret);

    let evt: any;

    try {
      // Verify the webhook payload
      evt = wh.verify(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
    } catch (err) {
      console.error('Webhook verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook verification failed' },
        { status: 400 }
      );
    }

    // Handle the webhook event
    const eventType = evt.type;
    const data = evt.data;

    if (eventType === 'user.created' || eventType === 'user.updated') {
      // Sync user to database
      const clerkUserId = data.id;
      const emailAddresses = data.email_addresses || [];
      const email = emailAddresses.find((e: any) => e.id === data.primary_email_address_id)?.email_address 
        || emailAddresses[0]?.email_address;
      const firstName = data.first_name;
      const lastName = data.last_name;
      const avatarUrl = data.image_url;
      const createdAt = data.created_at ? new Date(data.created_at * 1000) : new Date();

      if (!email) {
        console.error('No email found for user:', clerkUserId);
        return NextResponse.json(
          { error: 'No email found' },
          { status: 400 }
        );
      }

      // Check if user exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.clerkUserId, clerkUserId),
      });

      if (existingUser) {
        // Update existing user
        await db
          .update(users)
          .set({
            email,
            firstName: firstName || existingUser.firstName,
            lastName: lastName || existingUser.lastName,
            avatarUrl: avatarUrl || existingUser.avatarUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUser.id));
      } else {
        // Create new user
        const [newUser] = await db
          .insert(users)
          .values({
            clerkUserId,
            email,
            firstName: firstName || null,
            lastName: lastName || null,
            avatarUrl: avatarUrl || null,
            createdAt,
          })
          .returning();

        // Create default workspace for new user
        const workspaceName = firstName && lastName
          ? `${firstName} ${lastName}'s Workspace`
          : email.split('@')[0] + "'s Workspace";

        const workspaceSlug = workspaceName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

        // Check if workspace with this slug exists
        let workspace = await db.query.workspaces.findFirst({
          where: eq(workspaces.slug, workspaceSlug),
        });

        if (!workspace) {
          [workspace] = await db
            .insert(workspaces)
            .values({
              name: workspaceName,
              slug: workspaceSlug,
            })
            .returning();
        }

        // Add user as owner of workspace
        await db.insert(workspaceMembers).values({
          userId: newUser.id,
          workspaceId: workspace.id,
          role: 'owner',
          isActive: true,
        });
      }
    } else if (eventType === 'user.deleted') {
      // Handle user deletion
      const clerkUserId = data.id;
      const user = await db.query.users.findFirst({
        where: eq(users.clerkUserId, clerkUserId),
      });

      if (user) {
        // Deactivate workspace memberships instead of deleting
        await db
          .update(workspaceMembers)
          .set({ isActive: false })
          .where(eq(workspaceMembers.userId, user.id));
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

