/**
 * CRM Contact Enrichment API
 *
 * TODO: [APOLLO PRO UPGRADE] - Endpoint ready, needs Apollo Pro plan to function
 * Once upgraded, test with: POST /api/crm/enrich { "contactId": "uuid" }
 */

import { NextResponse } from "next/server";
import { getCurrentWorkspace } from "@/lib/auth";
import { db } from "@/lib/db";
import { contacts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { invalidateCRMCache } from "@/actions/crm";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { createErrorResponse } from "@/lib/api-error-handler";
import { rateLimit } from "@/lib/rate-limit";
import {
  enrichPerson,
  enrichPeopleBulk,
  mapApolloToCrmContact,
  isApolloConfigured,
} from "@/lib/integrations/apollo";

// ============================================================================
// SCHEMAS
// ============================================================================

const enrichContactSchema = z.object({
  contactId: z.string().uuid(),
  options: z
    .object({
      revealPersonalEmails: z.boolean().optional(),
      revealPhoneNumber: z.boolean().optional(),
      updateContact: z.boolean().optional(), // Whether to update the contact with enriched data
    })
    .optional(),
});

const enrichBulkSchema = z.object({
  contactIds: z.array(z.string().uuid()).min(1).max(10),
  options: z
    .object({
      revealPersonalEmails: z.boolean().optional(),
      revealPhoneNumber: z.boolean().optional(),
      updateContacts: z.boolean().optional(),
    })
    .optional(),
});

// ============================================================================
// HANDLERS
// ============================================================================

/**
 * POST /api/crm/enrich
 *
 * Enrich a single contact or multiple contacts with Apollo data
 *
 * Body (single):
 * { contactId: "uuid", options?: { updateContact?: boolean } }
 *
 * Body (bulk):
 * { contactIds: ["uuid1", "uuid2"], options?: { updateContacts?: boolean } }
 */
export async function POST(request: Request) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();

    // Rate limit enrichment calls (more restrictive since they cost credits)
    const rateLimitResult = await rateLimit(`enrich:${workspaceId}`, 50, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Enrichment rate limit exceeded. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(rateLimitResult.limit),
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
            "X-RateLimit-Reset": String(rateLimitResult.reset),
          },
        }
      );
    }

    // Check if Apollo is configured
    if (!isApolloConfigured()) {
      return NextResponse.json(
        {
          error: "Apollo integration is not configured",
          code: "APOLLO_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }

    const body = await request.json();

    // Determine if this is a single or bulk request
    if ("contactIds" in body) {
      return handleBulkEnrichment(body, workspaceId, userId);
    } else {
      return handleSingleEnrichment(body, workspaceId, userId);
    }
  } catch (error) {
    return createErrorResponse(error, "Enrichment error");
  }
}

/**
 * Handle single contact enrichment
 */
async function handleSingleEnrichment(
  body: unknown,
  workspaceId: string,
  userId: string
) {
  const parsed = enrichContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { contactId, options } = parsed.data;
  const updateContact = options?.updateContact ?? true;

  // Fetch the contact
  const contact = await db.query.contacts.findFirst({
    where: and(eq(contacts.id, contactId), eq(contacts.workspaceId, workspaceId)),
  });

  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  if (!contact.email) {
    return NextResponse.json(
      { error: "Contact has no email address for enrichment" },
      { status: 400 }
    );
  }

  // Enrich via Apollo
  const enrichResult = await enrichPerson({
    email: contact.email,
    firstName: contact.firstName || undefined,
    lastName: contact.lastName || undefined,
    domain: contact.company
      ? extractDomain(contact.email) || undefined
      : undefined,
    revealPersonalEmails: options?.revealPersonalEmails ?? true,
    revealPhoneNumber: options?.revealPhoneNumber ?? true,
  });

  if (!enrichResult.success) {
    logger.warn("Enrichment returned no match", {
      contactId,
      email: contact.email,
      error: enrichResult.error,
    });

    return NextResponse.json({
      success: false,
      message: enrichResult.error || "No enrichment data found for this contact",
      contact: { id: contactId, email: contact.email },
      enriched: null,
    });
  }

  // Map to CRM format
  const mappedData = mapApolloToCrmContact(enrichResult);

  // Update contact if requested
  if (updateContact && mappedData) {
    const existingCustomFields =
      (contact.customFields as Record<string, unknown>) || {};

    await db
      .update(contacts)
      .set({
        firstName: mappedData.firstName || contact.firstName,
        lastName: mappedData.lastName || contact.lastName,
        title: mappedData.title || contact.title,
        phone: mappedData.phone || contact.phone,
        linkedinUrl: mappedData.linkedinUrl || contact.linkedinUrl,
        twitterUrl: mappedData.twitterUrl || contact.twitterUrl,
        company: mappedData.company || contact.company,
        customFields: {
          ...existingCustomFields,
          ...mappedData.enrichedData,
        },
        updatedAt: new Date(),
      })
      .where(eq(contacts.id, contactId));

    // Invalidate cache
    await invalidateCRMCache(workspaceId);

    logger.info("Contact enriched and updated", {
      contactId,
      workspaceId,
      userId,
    });
  }

  return NextResponse.json({
    success: true,
    message: "Contact enriched successfully",
    contact: {
      id: contactId,
      email: contact.email,
    },
    enriched: {
      person: enrichResult.person,
      organization: enrichResult.organization,
    },
    updated: updateContact,
  });
}

/**
 * Handle bulk contact enrichment
 */
async function handleBulkEnrichment(
  body: unknown,
  workspaceId: string,
  userId: string
) {
  const parsed = enrichBulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { contactIds, options } = parsed.data;
  const updateContacts = options?.updateContacts ?? true;

  // Fetch all contacts
  const contactsList = await db.query.contacts.findMany({
    where: and(eq(contacts.workspaceId, workspaceId)),
  });

  const contactsToEnrich = contactsList.filter(
    (c) => contactIds.includes(c.id) && c.email
  );

  if (contactsToEnrich.length === 0) {
    return NextResponse.json(
      { error: "No valid contacts found for enrichment" },
      { status: 400 }
    );
  }

  // Build enrichment requests
  const enrichRequests = contactsToEnrich.map((c) => ({
    email: c.email!,
    firstName: c.firstName || undefined,
    lastName: c.lastName || undefined,
    revealPersonalEmails: options?.revealPersonalEmails ?? true,
    revealPhoneNumber: options?.revealPhoneNumber ?? true,
  }));

  // Enrich via Apollo
  const bulkResult = await enrichPeopleBulk(enrichRequests);

  // Update contacts if requested
  const updatedContacts: string[] = [];

  if (updateContacts) {
    for (let i = 0; i < bulkResult.results.length; i++) {
      const result = bulkResult.results[i];
      const contact = contactsToEnrich[i];

      if (result.success) {
        const mappedData = mapApolloToCrmContact(result);
        if (mappedData) {
          const existingCustomFields =
            (contact.customFields as Record<string, unknown>) || {};

          await db
            .update(contacts)
            .set({
              firstName: mappedData.firstName || contact.firstName,
              lastName: mappedData.lastName || contact.lastName,
              title: mappedData.title || contact.title,
              phone: mappedData.phone || contact.phone,
              linkedinUrl: mappedData.linkedinUrl || contact.linkedinUrl,
              twitterUrl: mappedData.twitterUrl || contact.twitterUrl,
              company: mappedData.company || contact.company,
              customFields: {
                ...existingCustomFields,
                ...mappedData.enrichedData,
              },
              updatedAt: new Date(),
            })
            .where(eq(contacts.id, contact.id));

          updatedContacts.push(contact.id);
        }
      }
    }

    // Invalidate cache once
    await invalidateCRMCache(workspaceId);
  }

  logger.info("Bulk enrichment completed", {
    workspaceId,
    userId,
    requested: contactIds.length,
    successful: bulkResult.totalSuccessful,
    failed: bulkResult.totalFailed,
    creditsUsed: bulkResult.creditsUsed,
  });

  return NextResponse.json({
    success: true,
    message: `Enriched ${bulkResult.totalSuccessful} of ${contactsToEnrich.length} contacts`,
    results: {
      total: contactsToEnrich.length,
      successful: bulkResult.totalSuccessful,
      failed: bulkResult.totalFailed,
      creditsUsed: bulkResult.creditsUsed,
    },
    updatedContacts,
  });
}

// ============================================================================
// HELPERS
// ============================================================================

function extractDomain(email: string): string | null {
  const match = email.match(/@([^@]+)$/);
  return match ? match[1] : null;
}

/**
 * GET /api/crm/enrich
 *
 * Check enrichment service status
 */
export async function GET() {
  try {
    await getCurrentWorkspace();

    return NextResponse.json({
      configured: isApolloConfigured(),
      provider: "apollo",
      capabilities: {
        singleEnrichment: true,
        bulkEnrichment: true,
        maxBulkSize: 10,
      },
    });
  } catch (error) {
    return createErrorResponse(error, "Enrichment status error");
  }
}
