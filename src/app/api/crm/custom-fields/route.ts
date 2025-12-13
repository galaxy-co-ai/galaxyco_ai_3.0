import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { customFieldDefinitions } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { z } from 'zod';
import { createErrorResponse } from '@/lib/api-error-handler';

const customFieldSchema = z.object({
  name: z.string().min(1, 'Field name is required').max(50),
  label: z.string().min(1, 'Display label is required').max(100),
  entityType: z.enum(['contact', 'deal', 'customer', 'prospect']),
  fieldType: z.enum([
    'text', 'number', 'date', 'datetime', 'select', 'multiselect',
    'checkbox', 'url', 'email', 'phone', 'currency', 'textarea'
  ]),
  description: z.string().max(500).optional(),
  placeholder: z.string().max(100).optional(),
  helpText: z.string().max(200).optional(),
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
    color: z.string().optional(),
  })).optional(),
  required: z.boolean().optional().default(false),
  defaultValue: z.string().optional(),
  validation: z.object({
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    patternMessage: z.string().optional(),
  }).optional(),
  displayOrder: z.number().optional().default(0),
  showInList: z.boolean().optional().default(true),
  showInCard: z.boolean().optional().default(true),
  section: z.string().max(50).optional(),
});

/**
 * GET /api/crm/custom-fields
 * List all custom field definitions for the workspace
 * Query params: entityType (optional filter)
 */
export async function GET(request: Request) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType') as 'contact' | 'deal' | 'customer' | 'prospect' | null;

    // Build query conditions
    const conditions = [eq(customFieldDefinitions.workspaceId, workspaceId)];
    
    if (entityType) {
      conditions.push(eq(customFieldDefinitions.entityType, entityType));
    }

    // Get all custom fields for the workspace
    const fields = await db.query.customFieldDefinitions.findMany({
      where: and(...conditions),
      orderBy: [asc(customFieldDefinitions.displayOrder), asc(customFieldDefinitions.createdAt)],
    });

    return NextResponse.json(fields);
  } catch (error) {
    return createErrorResponse(error, 'Get custom fields error');
  }
}

/**
 * POST /api/crm/custom-fields
 * Create a new custom field definition
 */
export async function POST(request: Request) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    const body = await request.json();

    // Validate input
    const validationResult = customFieldSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Sanitize field name to be a valid identifier (lowercase, underscores)
    const sanitizedName = data.name
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    // Check for duplicate field name within entity type
    const existing = await db.query.customFieldDefinitions.findFirst({
      where: and(
        eq(customFieldDefinitions.workspaceId, workspaceId),
        eq(customFieldDefinitions.entityType, data.entityType),
        eq(customFieldDefinitions.name, sanitizedName)
      ),
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A field with this name already exists for this entity type' },
        { status: 409 }
      );
    }

    // Get the max display order for this entity type
    const maxOrderField = await db.query.customFieldDefinitions.findFirst({
      where: and(
        eq(customFieldDefinitions.workspaceId, workspaceId),
        eq(customFieldDefinitions.entityType, data.entityType)
      ),
      orderBy: [asc(customFieldDefinitions.displayOrder)],
    });
    
    const nextOrder = data.displayOrder ?? ((maxOrderField?.displayOrder ?? -1) + 1);

    // Create field
    const [field] = await db
      .insert(customFieldDefinitions)
      .values({
        workspaceId,
        name: sanitizedName,
        label: data.label,
        entityType: data.entityType,
        fieldType: data.fieldType,
        description: data.description,
        placeholder: data.placeholder,
        helpText: data.helpText,
        options: data.options || [],
        required: data.required,
        defaultValue: data.defaultValue,
        validation: data.validation || {},
        displayOrder: nextOrder,
        showInList: data.showInList,
        showInCard: data.showInCard,
        section: data.section,
        isActive: true,
        isSystem: false,
        createdBy: userId,
      })
      .returning();

    return NextResponse.json(field, { status: 201 });
  } catch (error) {
    return createErrorResponse(error, 'Create custom field error');
  }
}
