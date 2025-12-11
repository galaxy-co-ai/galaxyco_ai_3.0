import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { workspacePhoneNumbers, workspaceMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { releasePhoneNumber } from '@/lib/signalwire';

/**
 * PATCH /api/workspaces/[id]/phone-numbers/[numberId]
 * Update phone number settings (friendly name, number type)
 * 
 * Body: {
 *   friendlyName?: string,
 *   numberType?: 'primary' | 'sales' | 'support' | 'custom'
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; numberId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = params.id;
    const numberId = params.numberId;

    // Verify user has access to this workspace
    const membership = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId)
      ),
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify phone number belongs to this workspace
    const phoneNumber = await db.query.workspacePhoneNumbers.findFirst({
      where: and(
        eq(workspacePhoneNumbers.id, numberId),
        eq(workspacePhoneNumbers.workspaceId, workspaceId)
      ),
    });

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { friendlyName, numberType } = body;

    // Update phone number
    await db
      .update(workspacePhoneNumbers)
      .set({
        ...(friendlyName !== undefined && { friendlyName }),
        ...(numberType && { numberType: numberType as 'primary' | 'sales' | 'support' | 'custom' }),
        updatedAt: new Date(),
      })
      .where(eq(workspacePhoneNumbers.id, numberId));

    // Fetch updated record
    const updated = await db.query.workspacePhoneNumbers.findFirst({
      where: eq(workspacePhoneNumbers.id, numberId),
    });

    return NextResponse.json({ phoneNumber: updated });
  } catch (error) {
    console.error('Error updating phone number:', error);
    return NextResponse.json(
      { error: 'Failed to update phone number' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workspaces/[id]/phone-numbers/[numberId]
 * Release a phone number from the workspace
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; numberId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = params.id;
    const numberId = params.numberId;

    // Verify user has access to this workspace
    const membership = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId)
      ),
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify phone number belongs to this workspace
    const phoneNumber = await db.query.workspacePhoneNumbers.findFirst({
      where: and(
        eq(workspacePhoneNumbers.id, numberId),
        eq(workspacePhoneNumbers.workspaceId, workspaceId)
      ),
    });

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number not found' }, { status: 404 });
    }

    // Prevent deleting the last/primary number if workspace has active conversations
    if (phoneNumber.numberType === 'primary') {
      const otherNumbers = await db.query.workspacePhoneNumbers.findMany({
        where: and(
          eq(workspacePhoneNumbers.workspaceId, workspaceId),
          eq(workspacePhoneNumbers.status, 'active')
        ),
      });

      if (otherNumbers.length === 1) {
        return NextResponse.json(
          { error: 'Cannot release the last phone number. You must keep at least one active number.' },
          { status: 400 }
        );
      }
    }

    // Release from SignalWire
    await releasePhoneNumber(phoneNumber.phoneNumberSid);

    // Mark as released in database (soft delete)
    await db
      .update(workspacePhoneNumbers)
      .set({
        status: 'released',
        releasedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(workspacePhoneNumbers.id, numberId));

    return NextResponse.json({ success: true, message: 'Phone number released successfully' });
  } catch (error) {
    console.error('Error releasing phone number:', error);
    return NextResponse.json(
      { error: 'Failed to release phone number' },
      { status: 500 }
    );
  }
}
