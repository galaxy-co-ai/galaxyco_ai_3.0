import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { workspaces, workspaceMembers, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';

/**
 * System admin email whitelist
 * These emails have access to Mission Control (/admin)
 * 
 * To add a new admin:
 * 1. Add their email here
 * 2. Or set publicMetadata.isSystemAdmin = true in Clerk Dashboard
 */
const SYSTEM_ADMIN_EMAILS: string[] = [
  'dev@galaxyco.ai',
  'dalton@galaxyco.ai',
];

/**
 * Checks if the current user is a system administrator
 * 
 * @returns boolean indicating if user has system admin access
 * 
 * @remarks
 * Admin access is granted if:
 * 1. User's email is in SYSTEM_ADMIN_EMAILS whitelist, OR
 * 2. User has `isSystemAdmin: true` in Clerk publicMetadata
 * 
 * @example
 * ```typescript
 * const isAdmin = await isSystemAdmin();
 * if (!isAdmin) {
 *   redirect('/dashboard');
 * }
 * ```
 */
export async function isSystemAdmin(): Promise<boolean> {
  try {
    const user = await currentUser();
    
    if (!user) {
      return false;
    }
    
    // Check Clerk metadata first (most secure)
    const metadata = user.publicMetadata as { isSystemAdmin?: boolean } | undefined;
    if (metadata?.isSystemAdmin === true) {
      return true;
    }
    
    // Check email whitelist as fallback (case-insensitive)
    const primaryEmail = user.emailAddresses.find(
      e => e.id === user.primaryEmailAddressId
    )?.emailAddress?.toLowerCase();
    
    if (primaryEmail && SYSTEM_ADMIN_EMAILS.some(email => email.toLowerCase() === primaryEmail)) {
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error('Error checking system admin status', { error });
    return false;
  }
}

/**
 * Gets system admin status with user info
 * Useful for components that need both admin check and user data
 */
export async function getAdminContext() {
  const user = await currentUser();
  
  if (!user) {
    return { isAdmin: false, user: null };
  }
  
  const isAdmin = await isSystemAdmin();
  
  return {
    isAdmin,
    user: {
      id: user.id,
      email: user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
    },
  };
}

/**
 * Gets the current authenticated user's workspace
 * 
 * @returns Object containing workspaceId, workspace, userId, user, and membership
 * @throws Error if user is not authenticated (unless ALLOW_DEV_BYPASS is enabled)
 * 
 * @remarks
 * - Supports Clerk Organizations - if user is in an org, uses that as workspace
 * - Falls back to personal workspace if not in an organization
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
  const { userId, orgId, orgSlug } = await auth();
  
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

  // Check if user is in a Clerk Organization
  if (orgId) {
    // User is in an organization - find or create workspace for this org
    const orgWorkspaceSlug = `org-${orgId}`;
    
    let orgWorkspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.slug, orgWorkspaceSlug),
    });

    if (!orgWorkspace) {
      // Create workspace for this organization
      // Get org name from Clerk
      const clerkClient = await import('@clerk/nextjs/server').then(m => m.clerkClient());
      const org = await clerkClient.organizations.getOrganization({ organizationId: orgId });
      
      [orgWorkspace] = await db
        .insert(workspaces)
        .values({
          name: org.name,
          slug: orgWorkspaceSlug,
        })
        .returning();
    }

    // Check if user is member of this org workspace
    let orgMembership = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.userId, user.id),
        eq(workspaceMembers.workspaceId, orgWorkspace.id),
        eq(workspaceMembers.isActive, true)
      ),
    });

    if (!orgMembership) {
      // Add user to org workspace
      // Get their role from Clerk org membership
      const clerkClient = await import('@clerk/nextjs/server').then(m => m.clerkClient());
      const memberships = await clerkClient.organizations.getOrganizationMembershipList({
        organizationId: orgId,
      });
      const clerkMembership = memberships.data.find(m => m.publicUserData?.userId === userId);
      const role = clerkMembership?.role === 'org:admin' ? 'admin' : 'member';

      [orgMembership] = await db
        .insert(workspaceMembers)
        .values({
          userId: user.id,
          workspaceId: orgWorkspace.id,
          role,
          isActive: true,
        })
        .returning();
    }

    return {
      workspaceId: orgWorkspace.id,
      workspace: orgWorkspace,
      userId,
      user,
      membership: orgMembership,
      orgId, // Include org info
    };
  }

  // User is NOT in an organization - use personal workspace
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

  let user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  });

  if (!user) {
    // User doesn't exist in database - auto-create from Clerk data
    logger.info('User not found in database, auto-creating from Clerk', { userId });
    
    const clerkUser = await currentUser();
    if (!clerkUser) {
      throw new Error('User not found in Clerk');
    }

    const email = clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId
    )?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
      throw new Error('No email found for user');
    }

    // Create new user
    const [newUser] = await db
      .insert(users)
      .values({
        clerkUserId: userId,
        email,
        firstName: clerkUser.firstName || null,
        lastName: clerkUser.lastName || null,
        avatarUrl: clerkUser.imageUrl || null,
        createdAt: new Date(),
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
      userId: newUser.id,
      workspaceId: workspace.id,
      role: 'owner',
      isActive: true,
    });

    logger.info('User auto-created successfully', { 
      userId: newUser.id, 
      email, 
      workspaceId: workspace.id 
    });

    user = newUser;
  }

  return user;
}



