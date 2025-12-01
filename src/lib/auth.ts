import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { workspaces, workspaceMembers, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';

/**
 * Gets the current authenticated user's workspace
 * 
 * @returns Object containing workspaceId, workspace, userId, user, and membership
 * @throws Error if user is not authenticated (unless ALLOW_DEV_BYPASS is enabled)
 * 
 * @remarks
 * - Creates workspace automatically if user doesn't have one
 * - Creates user record if it doesn't exist (for webhook race conditions)
 * - Uses ALLOW_DEV_BYPASS env var for development (not NODE_ENV)
 * 
 * @example
 * ```typescript
 * const { workspaceId, workspace } = await getCurrentWorkspace();
 * ```
 */
export async function getCurrentWorkspace() {
  const { userId } = await auth();
  
  // TEMPORARY: Development bypass for testing
  // Use explicit environment variable instead of NODE_ENV to prevent accidental production deployment
  if (!userId && process.env.ALLOW_DEV_BYPASS === 'true') {
    logger.warn('⚠️ DEV BYPASS ACTIVE - Remove before production!');
    
    // Get or create test workspace
    let testWorkspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.name, 'Test Workspace'),
    });
    
    if (!testWorkspace) {
      [testWorkspace] = await db.insert(workspaces).values({
        name: 'Test Workspace',
        slug: 'test-workspace',
      }).returning();
    }
    
    return {
      workspaceId: testWorkspace.id,
      workspace: testWorkspace,
      userId: 'test-user',
      user: null,
      membership: null,
    };
  }
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Get user from database, or create if missing
  let user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  });

  if (!user) {
    // User doesn't exist in database - create them
    // This happens if webhook hasn't fired yet or user signed up before webhook was set up
    const clerkClient = await import('@clerk/nextjs/server').then(m => m.clerkClient());
    const clerkUser = await clerkClient.users.getUser(userId);

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      throw new Error('User email not found');
    }

    // Create user
    [user] = await db
      .insert(users)
      .values({
        clerkUserId: userId,
        email,
        firstName: clerkUser.firstName || null,
        lastName: clerkUser.lastName || null,
        avatarUrl: clerkUser.imageUrl || null,
      })
      .returning();

    // Create default workspace for new user
    const workspaceName = clerkUser.firstName && clerkUser.lastName
      ? `${clerkUser.firstName} ${clerkUser.lastName}'s Workspace`
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
      userId: user.id,
      workspaceId: workspace.id,
      role: 'owner',
      isActive: true,
    });
  }

  // Get user's workspace membership
  let membership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.userId, user.id),
      eq(workspaceMembers.isActive, true)
    ),
    with: {
      workspace: true,
    },
  });

  if (!membership) {
    // No workspace membership - create default workspace
    const workspaceName = user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}'s Workspace`
      : user.email.split('@')[0] + "'s Workspace";

    const workspaceSlug = workspaceName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

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

    // Add user as owner
    const [newMembership] = await db
      .insert(workspaceMembers)
      .values({
        userId: user.id,
        workspaceId: workspace.id,
        role: 'owner',
        isActive: true,
      })
      .returning();

    // Reload with workspace relation
    membership = await db.query.workspaceMembers.findFirst({
      where: eq(workspaceMembers.id, newMembership.id),
      with: {
        workspace: true,
      },
    });
  }

  if (!membership || !membership.workspace) {
    throw new Error('Failed to create or retrieve workspace membership');
  }

  // Normalize workspace which may be object or array due to Drizzle type inference
  const workspace = Array.isArray(membership.workspace) 
    ? membership.workspace[0] 
    : membership.workspace;

  return {
    workspaceId: membership.workspaceId,
    workspace,
    userId,
    user,
    membership,
  };
}

/**
 * Gets the current authenticated user from the database
 * 
 * @returns User object from database
 * @throws Error if user is not authenticated or not found
 * 
 * @remarks
 * - Uses ALLOW_DEV_BYPASS env var for development testing
 * - Returns test user when bypass is enabled
 * 
 * @example
 * ```typescript
 * const user = await getCurrentUser();
 * console.log(user.email);
 * ```
 */
export async function getCurrentUser() {
  const { userId } = await auth();
  
  // TEMPORARY: Development bypass for testing
  // Use explicit environment variable instead of NODE_ENV to prevent accidental production deployment
  if (!userId && process.env.ALLOW_DEV_BYPASS === 'true') {
    logger.warn('⚠️ DEV BYPASS ACTIVE - Remove before production!');
    
    // Return a test user object
    return {
      id: 'test-user',
      clerkUserId: 'test-user',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}



