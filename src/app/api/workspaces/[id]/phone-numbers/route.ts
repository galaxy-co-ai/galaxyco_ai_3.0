import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { workspacePhoneNumbers, workspaces, workspaceMembers } from '@/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';
import { createErrorResponse } from '@/lib/api-error-handler';
import { PhoneNumberProvisionSchema } from '@/lib/validation/schemas';
// Note: autoProvisionForWorkspace is lazily imported in POST to avoid loading SignalWire SDK on GET

/**
 * GET /api/workspaces/[id]/phone-numbers
 * List all phone numbers for a workspace
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return createErrorResponse(new Error('Unauthorized'), 'Get phone numbers error');
    }

    // Rate limiting (keep manual for custom headers)
    const rateLimitResult = await rateLimit(`settings:${userId}`, 100, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
        }}
      );
    }

    // Await params (Next.js 15+ requirement)
    const resolvedParams = await params;
    let workspaceId = resolvedParams.id;

    // If ID is a Clerk org ID, look up the workspace
    // Clerk has already verified the user is a member of this org
    const isClerkOrg = workspaceId.startsWith('org_');
    logger.debug('Phone numbers GET request', { workspaceId, isClerkOrg });

    if (isClerkOrg) {
      const workspace = await db.query.workspaces.findFirst({
        where: eq(workspaces.clerkOrganizationId, workspaceId),
      });
      logger.debug('Workspace lookup result', { found: !!workspace });
      if (!workspace) {
        logger.warn('No workspace found for Clerk org', { clerkOrgId: workspaceId });
        return createErrorResponse(new Error('Workspace not found'), 'Get phone numbers error');
      }
      logger.debug('Mapped Clerk org to workspace UUID', { clerkOrgId: workspaceId, workspaceUuid: workspace.id });
      workspaceId = workspace.id;
    } else {
      // For non-Clerk workspaces, verify database membership
      const membership = await db.query.workspaceMembers.findFirst({
        where: and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, userId)
        ),
      });

      if (!membership) {
        return createErrorResponse(new Error('Forbidden: access denied'), 'Get phone numbers error');
      }
    }

    // Get all phone numbers for this workspace
    logger.debug('Fetching phone numbers for workspace', { workspaceId });
    const phoneNumbers = await db.query.workspacePhoneNumbers.findMany({
      where: eq(workspacePhoneNumbers.workspaceId, workspaceId),
      orderBy: [
        // Primary numbers first
        desc(workspacePhoneNumbers.numberType),
        asc(workspacePhoneNumbers.provisionedAt),
      ],
    });
    logger.debug('Phone numbers retrieved', { workspaceId, count: phoneNumbers.length });

    return NextResponse.json({ phoneNumbers });
  } catch (error) {
    return createErrorResponse(error, 'Get phone numbers error');
  }
}

/**
 * POST /api/workspaces/[id]/phone-numbers
 * Provision a new phone number for a workspace
 * 
 * Body: {
 *   areaCode?: string,
 *   numberType?: 'primary' | 'sales' | 'support' | 'custom',
 *   friendlyName?: string
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return createErrorResponse(new Error('Unauthorized'), 'Provision phone number error');
    }

    // Rate limiting (keep manual for custom headers)
    const rateLimitResult = await rateLimit(`settings:${userId}`, 100, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
        }}
      );
    }

    // Await params (Next.js 15+ requirement)
    const resolvedParams = await params;
    let workspaceId = resolvedParams.id;

    // If ID is a Clerk org ID, look up the workspace
    // Clerk has already verified the user is a member of this org
    const isClerkOrg = workspaceId.startsWith('org_');
    let workspace;

    if (isClerkOrg) {
      const ws = await db.query.workspaces.findFirst({
        where: eq(workspaces.clerkOrganizationId, workspaceId),
      });
      if (!ws) {
        return createErrorResponse(new Error('Workspace not found'), 'Provision phone number error');
      }
      workspace = ws;
      workspaceId = ws.id;
    } else {
      // For non-Clerk workspaces, verify database membership
      const membership = await db.query.workspaceMembers.findFirst({
        where: and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, userId)
        ),
        with: {
          workspace: true,
        },
      });

      if (!membership) {
        return createErrorResponse(new Error('Forbidden: access denied'), 'Provision phone number error');
      }

      workspace = membership.workspace;
    }

    // Check subscription tier
    if (workspace.subscriptionTier === 'starter') {
      return createErrorResponse(new Error('Forbidden: Phone numbers are only available on Pro and Enterprise plans'), 'Provision phone number error');
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = PhoneNumberProvisionSchema.safeParse(body);
    if (!validation.success) {
      return createErrorResponse(new Error(validation.error.errors[0]?.message || 'Validation failed'), 'Provision phone number error');
    }
    const { areaCode, numberType, friendlyName } = validation.data;

    // For Enterprise, check if adding additional number
    const existingNumbers = await db.query.workspacePhoneNumbers.findMany({
      where: and(
        eq(workspacePhoneNumbers.workspaceId, workspaceId),
        eq(workspacePhoneNumbers.status, 'active')
      ),
    });

    // Pro tier: only 1 number allowed
    if (workspace.subscriptionTier === 'professional' && existingNumbers.length >= 1) {
      return createErrorResponse(new Error('Forbidden: Pro plan allows only 1 phone number. Upgrade to Enterprise for multiple numbers.'), 'Provision phone number error');
    }

    // Enterprise tier: unlimited numbers (within reason)
    if (workspace.subscriptionTier === 'enterprise' && existingNumbers.length >= 10) {
      return createErrorResponse(new Error('Forbidden: Maximum of 10 phone numbers per workspace'), 'Provision phone number error');
    }

    // Provision the phone number (lazy import to avoid loading SignalWire on GET requests)
    const { autoProvisionForWorkspace } = await import('@/lib/phone-numbers');
    const result = await autoProvisionForWorkspace({
      workspaceId,
      workspaceName: workspace.name,
      preferredAreaCode: areaCode,
    });

    if (!result) {
      return createErrorResponse(new Error('Failed to provision phone number. No numbers available in this area code.'), 'Provision phone number error');
    }

    // Store phone number in database
    const [phoneNumber] = await db
      .insert(workspacePhoneNumbers)
      .values({
        workspaceId,
        phoneNumber: result.phoneNumber,
        phoneNumberSid: result.sid,
        friendlyName: friendlyName || result.friendlyName,
        capabilities: result.capabilities,
        voiceUrl: result.voiceUrl || null,
        smsUrl: result.smsUrl || null,
        statusCallbackUrl: result.statusCallback || null,
        numberType: numberType as 'primary' | 'sales' | 'support' | 'custom',
        monthlyCost: 100, // $1.00 in cents
      })
      .returning();

    return NextResponse.json({ phoneNumber }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error, 'Provision phone number error');
  }
}
