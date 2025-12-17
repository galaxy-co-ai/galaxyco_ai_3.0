import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { creatorItems } from '@/db/schema';
import { logger } from '@/lib/logger';
import type { FinanceDocument } from '@/components/finance-hq/document-creator/types';

/**
 * POST /api/finance/documents
 * Saves a finance document (estimate, invoice, change order, etc.) to the content library
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { document, asDraft, workspaceId } = body;

    if (!document || !workspaceId) {
      return NextResponse.json(
        { error: 'Missing required fields: document, workspaceId' },
        { status: 400 }
      );
    }

    const financeDoc = document as Partial<FinanceDocument>;

    // Generate document title based on type
    const documentTitle = generateDocumentTitle(financeDoc);

    // Convert finance document to content library format
    const contentSections = convertFinanceDocToContent(financeDoc);

    // Save to creatorItems table
    const [savedItem] = await db.insert(creatorItems).values({
      workspaceId,
      userId,
      title: documentTitle,
      type: 'document', // Store as 'document' type in creator library
      content: {
        sections: contentSections,
      },
      metadata: {
        documentType: financeDoc.type || 'unknown',
        documentNumber: ('number' in financeDoc && financeDoc.number) ? financeDoc.number : '',
        status: asDraft ? 'draft' : (financeDoc.status || 'sent'),
        clientName: 'client' in financeDoc ? financeDoc.client?.name || '' : '',
        total: ('total' in financeDoc && financeDoc.total !== undefined) ? financeDoc.total.toString() : ('amount' in financeDoc && financeDoc.amount !== undefined) ? financeDoc.amount.toString() : '0',
        date: financeDoc.date || new Date().toISOString(),
      },
      starred: false,
    }).returning();

    logger.info('Finance document saved to library', {
      itemId: savedItem.id,
      documentType: financeDoc.type,
      workspaceId,
      userId,
    });

    return NextResponse.json({
      success: true,
      item: {
        id: savedItem.id,
        title: savedItem.title,
        type: savedItem.type,
      },
    });
  } catch (error) {
    logger.error('Failed to save finance document', error);
    return NextResponse.json(
      { error: 'Failed to save document' },
      { status: 500 }
    );
  }
}

/**
 * Generate a human-readable title for the document
 */
function generateDocumentTitle(doc: Partial<FinanceDocument>): string {
  const type = doc.type || 'payment';
  const typeLabel: Record<string, string> = {
    estimate: 'Estimate',
    change_order: 'Change Order',
    invoice: 'Invoice',
    receipt: 'Receipt',
    expense: 'Expense',
    payment: 'Payment',
  };
  const label = typeLabel[type] || 'Document';

  const number = ('number' in doc && doc.number) ? ` #${doc.number}` : '';
  
  // Get client/vendor name
  let name = '';
  if ('client' in doc && doc.client?.name) {
    name = ` - ${doc.client.name}`;
  } else if ('vendor' in doc && doc.vendor) {
    name = ` - ${doc.vendor}`;
  } else if ('clientName' in doc && doc.clientName) {
    name = ` - ${doc.clientName}`;
  }

  return `${label}${number}${name}`;
}

/**
 * Convert finance document structure to content library sections format
 */
function convertFinanceDocToContent(doc: Partial<FinanceDocument>) {
  const sections: Array<{
    id: string;
    type: 'title' | 'heading' | 'paragraph' | 'list' | 'cta';
    content: string;
    editable: boolean;
  }> = [];

  // Title section
  sections.push({
    id: 'title',
    type: 'title',
    content: generateDocumentTitle(doc),
    editable: false,
  });

  // Document metadata
  const metadata: string[] = [];
  if ('number' in doc && doc.number) metadata.push(`Document #: ${doc.number}`);
  if (doc.date) metadata.push(`Date: ${new Date(doc.date).toLocaleDateString()}`);
  if (doc.status) metadata.push(`Status: ${doc.status}`);

  if (metadata.length > 0) {
    sections.push({
      id: 'metadata',
      type: 'paragraph',
      content: metadata.join(' | '),
      editable: false,
    });
  }

  // Client/Vendor info
  if ('client' in doc && doc.client) {
    sections.push({
      id: 'client',
      type: 'heading',
      content: 'Client Information',
      editable: false,
    });
    const clientInfo: string[] = [doc.client.name];
    if (doc.client.email) clientInfo.push(doc.client.email);
    if (doc.client.phone) clientInfo.push(doc.client.phone);
    if (doc.client.address) clientInfo.push(doc.client.address);

    sections.push({
      id: 'client-details',
      type: 'paragraph',
      content: clientInfo.join('\n'),
      editable: false,
    });
  } else if ('vendor' in doc && doc.vendor) {
    sections.push({
      id: 'vendor',
      type: 'heading',
      content: 'Vendor',
      editable: false,
    });
    sections.push({
      id: 'vendor-details',
      type: 'paragraph',
      content: doc.vendor,
      editable: false,
    });
  }

  // Project info
  if ('project' in doc && doc.project) {
    sections.push({
      id: 'project',
      type: 'heading',
      content: 'Project',
      editable: false,
    });
    sections.push({
      id: 'project-details',
      type: 'paragraph',
      content: `${doc.project.name}${doc.project.number ? ` (#${doc.project.number})` : ''}`,
      editable: false,
    });
  }

  // Line items
  if ('lineItems' in doc && doc.lineItems && doc.lineItems.length > 0) {
    sections.push({
      id: 'line-items',
      type: 'heading',
      content: 'Line Items',
      editable: false,
    });

    const lineItemsList = doc.lineItems.map(item => 
      `${item.description} - Qty: ${item.quantity} × $${item.unitPrice.toFixed(2)} = $${item.amount.toFixed(2)}`
    );

    sections.push({
      id: 'line-items-list',
      type: 'list',
      content: lineItemsList.join('\n'),
      editable: false,
    });
  }

  // Financial totals
  const totalAmount = ('total' in doc && doc.total !== undefined) ? doc.total : ('amount' in doc && doc.amount !== undefined) ? doc.amount : undefined;
  
  if (totalAmount !== undefined) {
    sections.push({
      id: 'totals',
      type: 'heading',
      content: 'Totals',
      editable: false,
    });

    const totals: string[] = [];
    if ('subtotal' in doc && doc.subtotal !== undefined) {
      totals.push(`Subtotal: $${doc.subtotal.toFixed(2)}`);
    }
    if ('taxAmount' in doc && doc.taxAmount !== undefined && doc.taxAmount > 0) {
      totals.push(`Tax: $${doc.taxAmount.toFixed(2)}`);
    }
    totals.push(`**Total: $${totalAmount.toFixed(2)}**`);

    sections.push({
      id: 'totals-details',
      type: 'paragraph',
      content: totals.join('\n'),
      editable: false,
    });
  }

  // Notes
  if (doc.notes) {
    sections.push({
      id: 'notes',
      type: 'heading',
      content: 'Notes',
      editable: false,
    });
    sections.push({
      id: 'notes-content',
      type: 'paragraph',
      content: doc.notes,
      editable: true,
    });
  }

  // Terms (if applicable)
  if ('terms' in doc && doc.terms) {
    sections.push({
      id: 'terms',
      type: 'heading',
      content: 'Terms & Conditions',
      editable: false,
    });
    sections.push({
      id: 'terms-content',
      type: 'paragraph',
      content: doc.terms,
      editable: true,
    });
  }

  return sections;
}
