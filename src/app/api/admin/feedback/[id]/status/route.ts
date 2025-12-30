import { NextRequest, NextResponse } from 'next/server';
import { isSystemAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { platformFeedback } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { createErrorResponse } from '@/lib/api-error-handler';

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
      return createErrorResponse(new Error('Forbidden: Admin access required'), 'Update feedback status');
    }

    const { id } = await params;
    const body = await request.json();
    
    // Validate the status
    const validated = statusSchema.safeParse(body);
    if (!validated.success) {
      return createErrorResponse(new Error('Invalid status value'), 'Update feedback status');
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
      return createErrorResponse(new Error('Feedback not found'), 'Update feedback status');
    }

    return NextResponse.json({ 
      success: true, 
      feedback: {
        id: updated.id,
        status: updated.status,
      }
    });
  } catch (error) {
    return createErrorResponse(error, 'Update feedback status');
  }
}

