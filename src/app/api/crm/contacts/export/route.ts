import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contacts } from '@/db/schema';
import { getCurrentWorkspace } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';

/**
 * GET /api/crm/contacts/export
 * 
 * Export all contacts as CSV
 */
export async function GET(request: NextRequest) {
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

    // Fetch all contacts
    const allContacts = await db.query.contacts.findMany({
      where: eq(contacts.workspaceId, workspaceId),
      orderBy: [desc(contacts.createdAt)],
    });
    
    if (allContacts.length === 0) {
      return NextResponse.json(
        { error: 'No contacts to export' },
        { status: 404 }
      );
    }
    
    // Define CSV headers
    const headers = [
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Title',
      'Company',
      'LinkedIn URL',
      'Twitter URL',
      'Tags',
      'Notes',
      'Created At',
    ];
    
    // Convert contacts to CSV rows
    const rows = allContacts.map((contact) => {
      return [
        escapeCSV(contact.firstName || ''),
        escapeCSV(contact.lastName || ''),
        escapeCSV(contact.email),
        escapeCSV(contact.phone || ''),
        escapeCSV(contact.title || ''),
        escapeCSV(contact.company || ''),
        escapeCSV(contact.linkedinUrl || ''),
        escapeCSV(contact.twitterUrl || ''),
        escapeCSV((contact.tags || []).join('; ')),
        escapeCSV(contact.notes || ''),
        escapeCSV(contact.createdAt.toISOString()),
      ].join(',');
    });
    
    // Build CSV content
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // Generate filename with date
    const date = new Date().toISOString().split('T')[0];
    const filename = `contacts-export-${date}.csv`;
    
    logger.info('Exported contacts to CSV', {
      workspaceId,
      contactCount: allContacts.length,
    });
    
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logger.error('Failed to export contacts', { error });
    return NextResponse.json(
      { error: 'Failed to export contacts' },
      { status: 500 }
    );
  }
}

/**
 * Escape a value for CSV (handles commas, quotes, newlines)
 */
function escapeCSV(value: string): string {
  if (!value) return '';
  
  // If the value contains commas, quotes, or newlines, wrap in quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    // Escape quotes by doubling them
    return `"${value.replace(/"/g, '""')}"`;
  }
  
  return value;
}

