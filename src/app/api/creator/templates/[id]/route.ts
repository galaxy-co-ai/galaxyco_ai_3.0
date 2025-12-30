/**
 * Creator Template API (Single Template)
 * 
 * GET /api/creator/templates/[id] - Get single template
 * POST /api/creator/templates/[id]/use - Use template (increment count, return structure)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { creatorTemplates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const template = await db.query.creatorTemplates.findFirst({
      where: eq(creatorTemplates.id, id),
    });

    if (!template) {
      return createErrorResponse(new Error('Template not found'), 'Creator Template GET');
    }

    return NextResponse.json({
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        type: template.type,
        category: template.category,
        content: template.content,
        thumbnail: template.thumbnail,
        isPremium: template.isPremium,
        usageCount: template.usageCount,
        createdAt: template.createdAt,
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Creator Template GET error');
  }
}
