import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contacts } from '@/db/schema';
import { getCurrentWorkspace } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Contact validation schema for import
const importContactSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  title: z.string().optional(),
  company: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  twitterUrl: z.string().url().optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

type ImportContact = z.infer<typeof importContactSchema>;

/**
 * POST /api/crm/contacts/import
 * 
 * Import contacts from CSV data
 * Expects: { contacts: ImportContact[] } or raw CSV text in body
 */
export async function POST(request: NextRequest) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    
    const contentType = request.headers.get('content-type') || '';
    
    let contactsToImport: ImportContact[] = [];
    
    if (contentType.includes('application/json')) {
      // JSON body with parsed contacts
      const body = await request.json();
      contactsToImport = body.contacts || [];
    } else if (contentType.includes('text/csv') || contentType.includes('multipart/form-data')) {
      // Raw CSV text or form data with file
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }
      
      const csvText = await file.text();
      contactsToImport = parseCSV(csvText);
    } else {
      // Try to parse as raw text CSV
      const csvText = await request.text();
      contactsToImport = parseCSV(csvText);
    }
    
    if (contactsToImport.length === 0) {
      return NextResponse.json(
        { error: 'No valid contacts found in import data' },
        { status: 400 }
      );
    }
    
    // Validate and filter contacts
    const validContacts: ImportContact[] = [];
    const errors: { row: number; error: string }[] = [];
    
    for (let i = 0; i < contactsToImport.length; i++) {
      const result = importContactSchema.safeParse(contactsToImport[i]);
      if (result.success) {
        validContacts.push(result.data);
      } else {
        errors.push({
          row: i + 1,
          error: result.error.errors.map((e) => e.message).join(', '),
        });
      }
    }
    
    if (validContacts.length === 0) {
      return NextResponse.json(
        { 
          error: 'No valid contacts to import',
          details: errors.slice(0, 10), // Return first 10 errors
        },
        { status: 400 }
      );
    }
    
    // Bulk insert contacts
    const insertedContacts = await db
      .insert(contacts)
      .values(
        validContacts.map((contact) => ({
          workspaceId,
          firstName: contact.firstName || null,
          lastName: contact.lastName || null,
          email: contact.email,
          phone: contact.phone || null,
          title: contact.title || null,
          company: contact.company || null,
          linkedinUrl: contact.linkedinUrl || null,
          twitterUrl: contact.twitterUrl || null,
          tags: contact.tags || [],
          notes: contact.notes || null,
        }))
      )
      .returning({ id: contacts.id });
    
    logger.info('Imported contacts from CSV', {
      workspaceId,
      imported: insertedContacts.length,
      errors: errors.length,
    });
    
    return NextResponse.json({
      success: true,
      imported: insertedContacts.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      message: `Successfully imported ${insertedContacts.length} contacts${errors.length > 0 ? ` (${errors.length} skipped due to errors)` : ''}`,
    });
  } catch (error) {
    logger.error('Failed to import contacts', { error });
    return NextResponse.json(
      { error: 'Failed to import contacts' },
      { status: 500 }
    );
  }
}

/**
 * Parse CSV text into contact objects
 */
function parseCSV(csvText: string): ImportContact[] {
  const lines = csvText.trim().split('\n');
  
  if (lines.length < 2) {
    return [];
  }
  
  // Parse header row
  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
  
  // Map common header variations to our schema
  const headerMap: Record<string, keyof ImportContact> = {
    'first name': 'firstName',
    'firstname': 'firstName',
    'first_name': 'firstName',
    'last name': 'lastName',
    'lastname': 'lastName',
    'last_name': 'lastName',
    'email': 'email',
    'email address': 'email',
    'phone': 'phone',
    'phone number': 'phone',
    'telephone': 'phone',
    'mobile': 'phone',
    'title': 'title',
    'job title': 'title',
    'position': 'title',
    'company': 'company',
    'organization': 'company',
    'company name': 'company',
    'linkedin': 'linkedinUrl',
    'linkedin url': 'linkedinUrl',
    'linkedin_url': 'linkedinUrl',
    'twitter': 'twitterUrl',
    'twitter url': 'twitterUrl',
    'twitter_url': 'twitterUrl',
    'tags': 'tags',
    'notes': 'notes',
    'comments': 'notes',
  };
  
  // Find column indices
  const columnIndices: Record<keyof ImportContact, number> = {} as Record<keyof ImportContact, number>;
  headers.forEach((header, index) => {
    const mappedField = headerMap[header];
    if (mappedField) {
      columnIndices[mappedField] = index;
    }
  });
  
  // Email is required - check if we found it
  if (columnIndices.email === undefined) {
    // Try to find an email column by looking for @ in values
    return [];
  }
  
  // Parse data rows
  const contacts: ImportContact[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (values.length === 0 || values.every((v) => !v.trim())) {
      continue; // Skip empty rows
    }
    
    const contact: Partial<ImportContact> = {};
    
    // Map values to contact fields
    Object.entries(columnIndices).forEach(([field, index]) => {
      const value = values[index]?.trim() || '';
      
      if (field === 'tags') {
        // Parse tags (semicolon or comma separated)
        contact.tags = value
          ? value.split(/[;,]/).map((t) => t.trim()).filter(Boolean)
          : [];
      } else if (value) {
        (contact as Record<string, string>)[field] = value;
      }
    });
    
    // Only include if we have an email
    if (contact.email) {
      contacts.push(contact as ImportContact);
    }
  }
  
  return contacts;
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // End of quoted value
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  
  // Don't forget the last value
  values.push(current);
  
  return values;
}

