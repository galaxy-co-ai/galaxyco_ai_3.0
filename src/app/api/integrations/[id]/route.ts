import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { integrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id: integrationId } = await params;

    // Verify ownership
    const integration = await db.query.integrations.findFirst({
      where: and(
        eq(integrations.id, integrationId),
        eq(integrations.workspaceId, workspaceId)
      ),
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Delete integration (this will revoke tokens)
    await db
      .delete(integrations)
      .where(and(
        eq(integrations.id, integrationId),
        eq(integrations.workspaceId, workspaceId)
      ));

    // TODO: Revoke OAuth tokens with provider

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete integration error:', error);
    return NextResponse.json(
      { error: 'Failed to delete integration' },
      { status: 500 }
    );
  }
}


