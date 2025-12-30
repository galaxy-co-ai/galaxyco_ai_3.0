import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { contacts, crmInteractions, deals, conversationParticipants } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { createErrorResponse } from '@/lib/api-error-handler';
import { invalidateCRMCache } from '@/actions/crm';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';

const mergeContactsSchema = z.object({
  // The contact that will remain (target/survivor)
  targetContactId: z.string().uuid('Invalid target contact ID'),
  // Contacts to merge into the target (will be deleted after merge)
  sourceContactIds: z.array(z.string().uuid()).min(1, 'At least one source contact is required'),
  // Optional: specify which field values to use when there's a conflict
  fieldOverrides: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    company: z.string().optional(),
    title: z.string().optional(),
    linkedinUrl: z.string().url().optional().nullable(),
    twitterUrl: z.string().url().optional().nullable(),
    notes: z.string().optional(),
  }).optional(),
  // How to handle tags: 'merge' combines all, 'target' keeps target's, 'source' uses first source's
  tagStrategy: z.enum(['merge', 'target']).default('merge'),
  // How to handle custom fields: 'target_priority' or 'source_priority'  
  customFieldStrategy: z.enum(['target_priority', 'source_priority']).default('target_priority'),
});

/**
 * POST /api/crm/contacts/merge
 * Merge multiple contacts into a single target contact
 * 
 * This endpoint:
 * 1. Validates all contacts exist and belong to the workspace
 * 2. Merges data from source contacts into target
 * 3. Reassigns all related records (interactions, deals, conversations) to target
 * 4. Deletes source contacts
 * 5. Returns the updated target contact
 */
export async function POST(request: Request) {
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

    const body = await request.json();

    // Validate input
    const validationResult = mergeContactsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { targetContactId, sourceContactIds, fieldOverrides, tagStrategy, customFieldStrategy } = validationResult.data;

    // Ensure target is not in sources
    if (sourceContactIds.includes(targetContactId)) {
      return NextResponse.json(
        { error: 'Target contact cannot be in the source contacts list' },
        { status: 400 }
      );
    }

    // Get all contacts involved (target + sources)
    const allContactIds = [targetContactId, ...sourceContactIds];
    const allContacts = await db.query.contacts.findMany({
      where: and(
        eq(contacts.workspaceId, workspaceId),
        inArray(contacts.id, allContactIds)
      ),
    });

    // Verify all contacts exist
    if (allContacts.length !== allContactIds.length) {
      const foundIds = allContacts.map(c => c.id);
      const missingIds = allContactIds.filter(id => !foundIds.includes(id));
      return NextResponse.json(
        { error: 'Some contacts not found', missingIds },
        { status: 404 }
      );
    }

    // Find target and sources
    const targetContact = allContacts.find(c => c.id === targetContactId)!;
    const sourceContacts = allContacts.filter(c => sourceContactIds.includes(c.id));

    // Build merged data
    const mergedTags = tagStrategy === 'merge'
      ? [...new Set([
          ...(targetContact.tags || []),
          ...sourceContacts.flatMap(c => c.tags || [])
        ])]
      : targetContact.tags || [];

    const mergedCustomFields = sourceContacts.reduce((acc, source) => {
      const sourceFields = source.customFields as Record<string, unknown> || {};
      if (customFieldStrategy === 'source_priority') {
        // Source values override target
        return { ...acc, ...sourceFields };
      } else {
        // Target values have priority, only add missing fields from source
        return { ...sourceFields, ...acc };
      }
    }, (targetContact.customFields as Record<string, unknown>) || {});

    // Merge notes (append source notes)
    const mergedNotes = [
      targetContact.notes,
      ...sourceContacts
        .filter(c => c.notes)
        .map(c => `[Merged from ${c.firstName} ${c.lastName} (${c.email})]: ${c.notes}`)
    ].filter(Boolean).join('\n\n');

    // Build update data
    const updateData: Record<string, unknown> = {
      tags: mergedTags,
      customFields: mergedCustomFields,
      notes: mergedNotes || null,
      updatedAt: new Date(),
    };

    // Apply field overrides if provided
    if (fieldOverrides) {
      if (fieldOverrides.firstName !== undefined) updateData.firstName = fieldOverrides.firstName;
      if (fieldOverrides.lastName !== undefined) updateData.lastName = fieldOverrides.lastName;
      if (fieldOverrides.email !== undefined) updateData.email = fieldOverrides.email;
      if (fieldOverrides.phone !== undefined) updateData.phone = fieldOverrides.phone;
      if (fieldOverrides.company !== undefined) updateData.company = fieldOverrides.company;
      if (fieldOverrides.title !== undefined) updateData.title = fieldOverrides.title;
      if (fieldOverrides.linkedinUrl !== undefined) updateData.linkedinUrl = fieldOverrides.linkedinUrl;
      if (fieldOverrides.twitterUrl !== undefined) updateData.twitterUrl = fieldOverrides.twitterUrl;
      if (fieldOverrides.notes !== undefined) updateData.notes = fieldOverrides.notes;
    }

    // === Start transaction-like operations ===
    
    // 1. Update target contact with merged data
    const [updatedTarget] = await db
      .update(contacts)
      .set(updateData)
      .where(eq(contacts.id, targetContactId))
      .returning();

    // 2. Reassign interactions from source contacts to target
    await db
      .update(crmInteractions)
      .set({ contactId: targetContactId, updatedAt: new Date() })
      .where(and(
        eq(crmInteractions.workspaceId, workspaceId),
        inArray(crmInteractions.contactId, sourceContactIds)
      ));

    // 3. Reassign deals from source contacts to target
    await db
      .update(deals)
      .set({ contactId: targetContactId, updatedAt: new Date() })
      .where(and(
        eq(deals.workspaceId, workspaceId),
        inArray(deals.contactId, sourceContactIds)
      ));

    // 4. Reassign conversation participants
    await db
      .update(conversationParticipants)
      .set({ contactId: targetContactId })
      .where(and(
        eq(conversationParticipants.workspaceId, workspaceId),
        inArray(conversationParticipants.contactId, sourceContactIds)
      ));

    // 5. Delete source contacts
    await db
      .delete(contacts)
      .where(and(
        eq(contacts.workspaceId, workspaceId),
        inArray(contacts.id, sourceContactIds)
      ));

    // Invalidate cache in background
    invalidateCRMCache(userId).catch(err => {
      logger.error('Cache invalidation failed after contact merge (non-critical)', err);
    });

    // Log the merge operation
    logger.info('Contacts merged', {
      workspaceId,
      userId,
      targetContactId,
      sourceContactIds,
      mergedCount: sourceContactIds.length,
    });

    return NextResponse.json({
      success: true,
      mergedContact: updatedTarget,
      mergedCount: sourceContactIds.length,
      message: `Successfully merged ${sourceContactIds.length} contact(s) into ${updatedTarget.firstName || ''} ${updatedTarget.lastName || updatedTarget.email}`.trim(),
    });
  } catch (error) {
    return createErrorResponse(error, 'Merge contacts error');
  }
}

/**
 * GET /api/crm/contacts/merge
 * Preview merge - show what data would be merged without executing
 */
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    
    const targetId = searchParams.get('targetId');
    const sourceIds = searchParams.get('sourceIds')?.split(',').filter(Boolean);

    if (!targetId || !sourceIds?.length) {
      return NextResponse.json(
        { error: 'targetId and sourceIds query parameters are required' },
        { status: 400 }
      );
    }

    const allContactIds = [targetId, ...sourceIds];
    const allContacts = await db.query.contacts.findMany({
      where: and(
        eq(contacts.workspaceId, workspaceId),
        inArray(contacts.id, allContactIds)
      ),
    });

    if (allContacts.length !== allContactIds.length) {
      return NextResponse.json(
        { error: 'Some contacts not found' },
        { status: 404 }
      );
    }

    const target = allContacts.find(c => c.id === targetId);
    const sources = allContacts.filter(c => sourceIds.includes(c.id));

    // Calculate merged values for preview
    const mergedTags = [...new Set([
      ...(target?.tags || []),
      ...sources.flatMap(c => c.tags || [])
    ])];

    const mergedCustomFields = sources.reduce((acc, source) => {
      const sourceFields = source.customFields as Record<string, unknown> || {};
      return { ...sourceFields, ...acc };
    }, (target?.customFields as Record<string, unknown>) || {});

    return NextResponse.json({
      target,
      sources,
      preview: {
        combinedTags: mergedTags,
        combinedCustomFields: mergedCustomFields,
        fieldsWithConflicts: findFieldConflicts(target!, sources),
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Preview merge error');
  }
}

/**
 * Find fields that have different values between target and sources
 */
function findFieldConflicts(
  target: typeof contacts.$inferSelect,
  sources: (typeof contacts.$inferSelect)[]
): { field: string; targetValue: unknown; sourceValues: { contactId: string; value: unknown }[] }[] {
  const conflictFields = ['firstName', 'lastName', 'email', 'phone', 'company', 'title', 'linkedinUrl', 'twitterUrl'] as const;
  
  const conflicts: { field: string; targetValue: unknown; sourceValues: { contactId: string; value: unknown }[] }[] = [];

  for (const field of conflictFields) {
    const targetValue = target[field];
    const sourcesWithDifferentValues = sources
      .filter(s => s[field] && s[field] !== targetValue)
      .map(s => ({ contactId: s.id, value: s[field] }));

    if (sourcesWithDifferentValues.length > 0) {
      conflicts.push({
        field,
        targetValue,
        sourceValues: sourcesWithDifferentValues,
      });
    }
  }

  return conflicts;
}
