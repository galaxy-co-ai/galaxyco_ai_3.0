import { NextRequest, NextResponse } from 'next/server';
import { isSystemAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { platformFeedback } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const statusSchema = z.object({
  status: z.enum(['new', 'in_review', 'planned', 'in_progress', 'done', 'closed', 'wont_fix']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const isAdmin = await isSystemAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    
    // Validate the status
    const validated = statusSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid status', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    // Update the feedback status
    const [updated] = await db
      .update(platformFeedback)
      .set({ 
        status: validated.data.status,
        updatedAt: new Date(),
      })
      .where(eq(platformFeedback.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      feedback: {
        id: updated.id,
        status: updated.status,
      }
    });
  } catch (error) {
    console.error('Error updating feedback status:', error);
    return NextResponse.json(
      { error: 'Failed to update feedback status' },
      { status: 500 }
    );
  }
}

