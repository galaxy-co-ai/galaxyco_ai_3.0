import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { customFieldDefinitions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { createErrorResponse } from '@/lib/api-error-handler';
import { rateLimit } from '@/lib/rate-limit';

const updateCustomFieldSchema = z.object({
  label: z.string().min(1, 'Display label is required').max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  placeholder: z.string().max(100).optional().nullable(),
  helpText: z.string().max(200).optional().nullable(),
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
    color: z.string().optional(),
  })).optional(),
  required: z.boolean().optional(),
  defaultValue: z.string().optional().nullable(),
  validation: z.object({
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    patternMessage: z.string().optional(),
  }).optional(),
  displayOrder: z.number().optional(),
  showInList: z.boolean().optional(),
  showInCard: z.boolean().optional(),
  section: z.string().max(50).optional().nullable(),
  isActive: z.boolean().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/crm/custom-fields/[id]
 * Get a single custom field definition
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();

    const rateLimitResult = await rateLimit(`crm:${userId}`, 100, 3600);
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

    const { id } = await context.params;

    const field = await db.query.customFieldDefinitions.findFirst({
      where: and(
        eq(customFieldDefinitions.id, id),
        eq(customFieldDefinitions.workspaceId, workspaceId)
      ),
    });

    if (!field) {
      return NextResponse.json(
        { error: 'Custom field not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(field);
  } catch (error) {
    return createErrorResponse(error, 'Get custom field error');
  }
}

/**
 * PUT /api/crm/custom-fields/[id]
 * Update a custom field definition
 * Note: name, entityType, and fieldType cannot be changed after creation
 */
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();

    const rateLimitResult = await rateLimit(`crm:${userId}`, 100, 3600);
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

    const { id } = await context.params;
    const body = await request.json();

    // Validate input
    const validationResult = updateCustomFieldSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check field exists and belongs to workspace
    const existing = await db.query.customFieldDefinitions.findFirst({
      where: and(
        eq(customFieldDefinitions.id, id),
        eq(customFieldDefinitions.workspaceId, workspaceId)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Custom field not found' },
        { status: 404 }
      );
    }

    // System fields cannot be modified (except isActive)
    if (existing.isSystem && Object.keys(data).some(k => k !== 'isActive')) {
      return NextResponse.json(
        { error: 'System fields cannot be modified' },
        { status: 403 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.label !== undefined) updateData.label = data.label;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.placeholder !== undefined) updateData.placeholder = data.placeholder;
    if (data.helpText !== undefined) updateData.helpText = data.helpText;
    if (data.options !== undefined) updateData.options = data.options;
    if (data.required !== undefined) updateData.required = data.required;
    if (data.defaultValue !== undefined) updateData.defaultValue = data.defaultValue;
    if (data.validation !== undefined) updateData.validation = data.validation;
    if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder;
    if (data.showInList !== undefined) updateData.showInList = data.showInList;
    if (data.showInCard !== undefined) updateData.showInCard = data.showInCard;
    if (data.section !== undefined) updateData.section = data.section;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    // Update field
    const [updated] = await db
      .update(customFieldDefinitions)
      .set(updateData)
      .where(and(
        eq(customFieldDefinitions.id, id),
        eq(customFieldDefinitions.workspaceId, workspaceId)
      ))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    return createErrorResponse(error, 'Update custom field error');
  }
}

/**
 * DELETE /api/crm/custom-fields/[id]
 * Delete a custom field definition
 * Note: System fields cannot be deleted
 */
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();

    const rateLimitResult = await rateLimit(`crm:${userId}`, 100, 3600);
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

    const { id } = await context.params;

    // Check field exists and belongs to workspace
    const existing = await db.query.customFieldDefinitions.findFirst({
      where: and(
        eq(customFieldDefinitions.id, id),
        eq(customFieldDefinitions.workspaceId, workspaceId)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Custom field not found' },
        { status: 404 }
      );
    }

    // System fields cannot be deleted
    if (existing.isSystem) {
      return NextResponse.json(
        { error: 'System fields cannot be deleted' },
        { status: 403 }
      );
    }

    // Delete field
    await db
      .delete(customFieldDefinitions)
      .where(and(
        eq(customFieldDefinitions.id, id),
        eq(customFieldDefinitions.workspaceId, workspaceId)
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, 'Delete custom field error');
  }
}
