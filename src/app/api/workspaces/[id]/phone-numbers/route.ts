import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { workspacePhoneNumbers, workspaces, workspaceMembers } from '@/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { autoProvisionForWorkspace } from '@/lib/phone-numbers';

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params (Next.js 15+ requirement)
    const resolvedParams = await params;
    let workspaceId = resolvedParams.id;

    // If ID is a Clerk org ID, look up the workspace
    // Clerk has already verified the user is a member of this org
    const isClerkOrg = workspaceId.startsWith('org_');
    console.log('[GET /phone-numbers] Workspace ID:', workspaceId, 'Is Clerk Org:', isClerkOrg);
    
    if (isClerkOrg) {
      const workspace = await db.query.workspaces.findFirst({
        where: eq(workspaces.clerkOrganizationId, workspaceId),
      });
      console.log('[GET /phone-numbers] Workspace lookup result:', workspace ? 'Found' : 'Not found');
      if (!workspace) {
        console.error('[GET /phone-numbers] No workspace found for Clerk org:', workspaceId);
        return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
      }
      console.log('[GET /phone-numbers] Mapped to workspace UUID:', workspace.id);
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
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Get all phone numbers for this workspace
    console.log('[GET /phone-numbers] Fetching numbers for workspace:', workspaceId);
    const phoneNumbers = await db.query.workspacePhoneNumbers.findMany({
      where: eq(workspacePhoneNumbers.workspaceId, workspaceId),
      orderBy: [
        // Primary numbers first  
        desc(workspacePhoneNumbers.numberType),
        asc(workspacePhoneNumbers.provisionedAt),
      ],
    });
    console.log('[GET /phone-numbers] Found', phoneNumbers.length, 'phone numbers');

    return NextResponse.json({ phoneNumbers });
  } catch (error) {
    console.error('[GET /phone-numbers] Error:', error);
    console.error('[GET /phone-numbers] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Failed to fetch phone numbers',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
        return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
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
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      
      workspace = membership.workspace;
    }

    // Check subscription tier
    if (workspace.subscriptionTier === 'starter') {
      return NextResponse.json(
        { error: 'Phone numbers are only available on Pro and Enterprise plans' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { areaCode = '405', numberType = 'primary', friendlyName } = body;

    // For Enterprise, check if adding additional number
    const existingNumbers = await db.query.workspacePhoneNumbers.findMany({
      where: and(
        eq(workspacePhoneNumbers.workspaceId, workspaceId),
        eq(workspacePhoneNumbers.status, 'active')
      ),
    });

    // Pro tier: only 1 number allowed
    if (workspace.subscriptionTier === 'professional' && existingNumbers.length >= 1) {
      return NextResponse.json(
        { error: 'Pro plan allows only 1 phone number. Upgrade to Enterprise for multiple numbers.' },
        { status: 403 }
      );
    }

    // Enterprise tier: unlimited numbers (within reason)
    if (workspace.subscriptionTier === 'enterprise' && existingNumbers.length >= 10) {
      return NextResponse.json(
        { error: 'Maximum of 10 phone numbers per workspace' },
        { status: 403 }
      );
    }

    // Provision the phone number
    const result = await autoProvisionForWorkspace({
      workspaceId,
      workspaceName: workspace.name,
      preferredAreaCode: areaCode,
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to provision phone number. No numbers available in this area code.' },
        { status: 500 }
      );
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
    console.error('Error provisioning phone number:', error);
    return NextResponse.json(
      { error: 'Failed to provision phone number' },
      { status: 500 }
    );
  }
}
