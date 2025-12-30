import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { legalEntities } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { createErrorResponse } from '@/lib/api-error-handler';

const createEntitySchema = z.object({
  name: z.string().min(1).max(100),
  legalName: z.string().optional(),
  taxId: z.string().optional(),
  registrationNumber: z.string().optional(),
  entityType: z.enum(['parent', 'subsidiary', 'branch', 'division']).optional().default('subsidiary'),
  parentEntityId: z.string().uuid().optional(),
  country: z.string().optional().default('US'),
  currency: z.string().optional().default('USD'),
  timezone: z.string().optional().default('America/New_York'),
  address: z.object({
    street1: z.string().optional(),
    street2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  fiscalYearStart: z.number().min(1).max(12).optional().default(1),
  defaultPaymentTerms: z.number().optional().default(30),
  logo: z.string().optional(),
  color: z.string().optional(),
  isDefault: z.boolean().optional().default(false),
});

// GET /api/finance/entities - List legal entities
export async function GET() {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    const entities = await db.query.legalEntities.findMany({
      where: and(
        eq(legalEntities.workspaceId, workspaceId),
        eq(legalEntities.isActive, true)
      ),
      orderBy: [desc(legalEntities.isDefault), desc(legalEntities.createdAt)],
    });

    return NextResponse.json({ entities });
  } catch (error) {
    return createErrorResponse(error, 'Error fetching legal entities');
  }
}

// POST /api/finance/entities - Create legal entity
export async function POST(request: NextRequest) {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    const body = await request.json();
    const parsed = createEntitySchema.safeParse(body);
    if (!parsed.success) {
      return createErrorResponse(new Error('Invalid request: entity validation failed'), 'Create entity validation');
    }

    const data = parsed.data;

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await db
        .update(legalEntities)
        .set({ isDefault: false })
        .where(and(
          eq(legalEntities.workspaceId, workspaceId),
          eq(legalEntities.isDefault, true)
        ));
    }

    // Create entity
    const [entity] = await db
      .insert(legalEntities)
      .values({
        workspaceId,
        ...data,
        address: data.address || {},
        bankAccounts: [],
        isActive: true,
      })
      .returning();

    return NextResponse.json({ entity }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error, 'Error creating legal entity');
  }
}
