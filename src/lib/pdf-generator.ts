/**
 * PDF Generator Utility
 * 
 * Generates professional PDFs for invoices, reports, proposals, and contracts
 * using @react-pdf/renderer with server-side rendering.
 */

import { uploadFile, isStorageConfigured } from '@/lib/storage';
import { logger } from '@/lib/logger';

export interface PDFGenerationParams {
  type: 'invoice' | 'report' | 'proposal' | 'contract';
  title: string;
  content: PDFContent;
  workspaceId: string;
}

export interface PDFContent {
  // Common fields
  date?: string;
  companyName?: string;
  companyAddress?: string;
  recipientName?: string;
  recipientCompany?: string;
  recipientAddress?: string;
  
  // Invoice specific
  invoiceNumber?: string;
  dueDate?: string;
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal?: number;
  tax?: number;
  total?: number;
  paymentTerms?: string;
  
  // Report specific
  sections?: Array<{
    heading: string;
    content: string;
  }>;
  summary?: string;
  keyFindings?: string[];
  
  // Proposal specific
  projectDescription?: string;
  scope?: string[];
  timeline?: string;
  deliverables?: string[];
  pricing?: {
    items: Array<{ item: string; price: number }>;
    total: number;
  };
  terms?: string;
  
  // Contract specific
  parties?: Array<{ name: string; role: string }>;
  effectiveDate?: string;
  duration?: string;
  clauses?: Array<{ title: string; content: string }>;
  signatures?: Array<{ name: string; title: string }>;
}

export interface PDFGenerationResult {
  url: string;
  filename: string;
  type: string;
  title: string;
}

/**
 * Generate a PDF document and upload to storage
 */
export async function generatePDF(params: PDFGenerationParams): Promise<PDFGenerationResult> {
  const { type, title, content, workspaceId } = params;
  
  logger.info('Generating PDF document', { type, title, workspaceId });
  
  // Dynamically import react-pdf (server-side only)
  const { renderToBuffer } = await import('@react-pdf/renderer');
  const React = await import('react');
  
  // Create the PDF document based on type
  const DocumentComponent = await getPDFComponent(type);
  const document = React.createElement(DocumentComponent, { title, content, type });
  
  // Render to buffer
  const buffer = await renderToBuffer(document);
  
  // Generate filename
  const timestamp = Date.now();
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
  const filename = `documents/${type}/${sanitizedTitle}_${timestamp}.pdf`;
  
  if (!isStorageConfigured()) {
    logger.warn('Storage not configured, returning local file reference');
    // In development without storage, return a placeholder
    return {
      url: `data:application/pdf;base64,${buffer.toString('base64')}`,
      filename,
      type,
      title,
    };
  }
  
  // Upload to blob storage
  // Convert Buffer to Uint8Array for File constructor compatibility
  const uint8Array = new Uint8Array(buffer);
  const file = new File([uint8Array], `${sanitizedTitle}.pdf`, { type: 'application/pdf' });
  const result = await uploadFile(file, filename, {
    contentType: 'application/pdf',
    access: 'public',
  });
  
  logger.info('PDF uploaded successfully', { url: result.url, type, title });
  
  return {
    url: result.url,
    filename,
    type,
    title,
  };
}

/**
 * Get the appropriate PDF component based on type
 */
async function getPDFComponent(type: string) {
  const { Document, Page, Text, View, StyleSheet } = await import('@react-pdf/renderer');
  const React = await import('react');
  
  // Create shared styles
  const styles = StyleSheet.create({
    page: {
      padding: 40,
      fontFamily: 'Helvetica',
      fontSize: 11,
      lineHeight: 1.5,
    },
    header: {
      marginBottom: 30,
      borderBottomWidth: 2,
      borderBottomColor: '#6366f1',
      paddingBottom: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: 5,
    },
    subtitle: {
      fontSize: 12,
      color: '#6b7280',
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#374151',
      marginBottom: 10,
      paddingBottom: 5,
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#f3f4f6',
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#f9fafb',
      paddingVertical: 10,
      paddingHorizontal: 5,
      borderBottomWidth: 2,
      borderBottomColor: '#e5e7eb',
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 10,
      paddingHorizontal: 5,
      borderBottomWidth: 1,
      borderBottomColor: '#f3f4f6',
    },
    col1: { width: '40%' },
    col2: { width: '15%', textAlign: 'center' },
    col3: { width: '20%', textAlign: 'right' },
    col4: { width: '25%', textAlign: 'right' },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 2,
      borderTopColor: '#6366f1',
    },
    totalLabel: {
      fontWeight: 'bold',
      marginRight: 20,
    },
    totalValue: {
      fontWeight: 'bold',
      color: '#6366f1',
    },
    paragraph: {
      marginBottom: 10,
      textAlign: 'justify',
    },
    listItem: {
      marginBottom: 5,
      paddingLeft: 15,
    },
    footer: {
      position: 'absolute',
      bottom: 30,
      left: 40,
      right: 40,
      textAlign: 'center',
      fontSize: 9,
      color: '#9ca3af',
    },
  });
  
  // Generic document component
  return function PDFDocument({ title, content, type }: { title: string; content: PDFContent; type: string }) {
    return React.createElement(
      Document,
      { title },
      React.createElement(
        Page,
        { size: 'A4', style: styles.page },
        // Header
        React.createElement(
          View,
          { style: styles.header },
          React.createElement(Text, { style: styles.title }, title),
          React.createElement(Text, { style: styles.subtitle }, 
            `${type.charAt(0).toUpperCase() + type.slice(1)} • ${content.date || new Date().toLocaleDateString()}`
          )
        ),
        // Company Info
        content.companyName && React.createElement(
          View,
          { style: styles.section },
          React.createElement(Text, { style: { fontWeight: 'bold' } }, content.companyName),
          content.companyAddress && React.createElement(Text, null, content.companyAddress)
        ),
        // Recipient Info
        content.recipientName && React.createElement(
          View,
          { style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, 'To'),
          React.createElement(Text, { style: { fontWeight: 'bold' } }, content.recipientName),
          content.recipientCompany && React.createElement(Text, null, content.recipientCompany),
          content.recipientAddress && React.createElement(Text, null, content.recipientAddress)
        ),
        // Invoice Items
        type === 'invoice' && content.items && React.createElement(
          View,
          { style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, 'Items'),
          React.createElement(
            View,
            { style: styles.tableHeader },
            React.createElement(Text, { style: styles.col1 }, 'Description'),
            React.createElement(Text, { style: styles.col2 }, 'Qty'),
            React.createElement(Text, { style: styles.col3 }, 'Unit Price'),
            React.createElement(Text, { style: styles.col4 }, 'Total')
          ),
          ...content.items.map((item, idx) =>
            React.createElement(
              View,
              { key: idx, style: styles.tableRow },
              React.createElement(Text, { style: styles.col1 }, item.description),
              React.createElement(Text, { style: styles.col2 }, item.quantity.toString()),
              React.createElement(Text, { style: styles.col3 }, `$${item.unitPrice.toFixed(2)}`),
              React.createElement(Text, { style: styles.col4 }, `$${item.total.toFixed(2)}`)
            )
          ),
          content.total && React.createElement(
            View,
            { style: styles.totalRow },
            React.createElement(Text, { style: styles.totalLabel }, 'Total:'),
            React.createElement(Text, { style: styles.totalValue }, `$${content.total.toFixed(2)}`)
          )
        ),
        // Report Sections
        type === 'report' && content.sections && content.sections.map((section, idx) =>
          React.createElement(
            View,
            { key: idx, style: styles.section },
            React.createElement(Text, { style: styles.sectionTitle }, section.heading),
            React.createElement(Text, { style: styles.paragraph }, section.content)
          )
        ),
        // Key Findings
        content.keyFindings && React.createElement(
          View,
          { style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, 'Key Findings'),
          ...content.keyFindings.map((finding, idx) =>
            React.createElement(Text, { key: idx, style: styles.listItem }, `• ${finding}`)
          )
        ),
        // Proposal Scope
        type === 'proposal' && content.scope && React.createElement(
          View,
          { style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, 'Scope of Work'),
          ...content.scope.map((item, idx) =>
            React.createElement(Text, { key: idx, style: styles.listItem }, `• ${item}`)
          )
        ),
        // Deliverables
        content.deliverables && React.createElement(
          View,
          { style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, 'Deliverables'),
          ...content.deliverables.map((item, idx) =>
            React.createElement(Text, { key: idx, style: styles.listItem }, `• ${item}`)
          )
        ),
        // Contract Clauses
        type === 'contract' && content.clauses && content.clauses.map((clause, idx) =>
          React.createElement(
            View,
            { key: idx, style: styles.section },
            React.createElement(Text, { style: styles.sectionTitle }, `${idx + 1}. ${clause.title}`),
            React.createElement(Text, { style: styles.paragraph }, clause.content)
          )
        ),
        // Footer
        React.createElement(
          Text,
          { style: styles.footer },
          `Generated by Neptune AI • ${new Date().toLocaleDateString()}`
        )
      )
    );
  };
}

/**
 * Check if PDF generation is configured
 */
export function isPDFConfigured(): boolean {
  return true; // @react-pdf/renderer works without external dependencies
}

