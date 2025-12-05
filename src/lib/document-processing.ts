/**
 * Document Text Extraction Library
 * 
 * Extracts text from PDFs, Word documents, and other file formats
 */

import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import { logger } from '@/lib/logger';

export interface ProcessedDocument {
  text: string;
  fileName: string;
  pageCount?: number;
  wordCount: number;
}

/**
 * Extract text from PDF file
 */
export async function extractTextFromPDF(fileUrl: string, fileName: string): Promise<ProcessedDocument> {
  try {
    logger.debug('Extracting text from PDF', { fileUrl, fileName });

    // Fetch PDF file
    const response = await fetch(fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF using pdf-parse v2 API
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();

    const text = result.text;
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    logger.info('PDF text extracted', {
      fileName,
      pages: result.pages?.length || 0,
      wordCount,
      textLength: text.length,
    });

    return {
      text,
      fileName,
      pageCount: result.pages?.length || 0,
      wordCount,
    };
  } catch (error) {
    logger.error('PDF text extraction failed', { fileName, error });
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from Word document (.docx)
 */
export async function extractTextFromDocx(fileUrl: string, fileName: string): Promise<ProcessedDocument> {
  try {
    logger.debug('Extracting text from DOCX', { fileUrl, fileName });

    // Fetch DOCX file
    const response = await fetch(fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text with mammoth
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    logger.info('DOCX text extracted', {
      fileName,
      wordCount,
      textLength: text.length,
    });

    return {
      text,
      fileName,
      wordCount,
    };
  } catch (error) {
    logger.error('DOCX text extraction failed', { fileName, error });
    throw new Error(`Failed to extract text from Word document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from plain text file
 */
export async function extractTextFromPlainFile(fileUrl: string, fileName: string): Promise<ProcessedDocument> {
  try {
    logger.debug('Extracting text from plain file', { fileUrl, fileName });

    const response = await fetch(fileUrl);
    const text = await response.text();
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    logger.info('Plain text extracted', {
      fileName,
      wordCount,
      textLength: text.length,
    });

    return {
      text,
      fileName,
      wordCount,
    };
  } catch (error) {
    logger.error('Plain text extraction failed', { fileName, error });
    throw new Error(`Failed to extract text from file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Process document based on MIME type
 */
export async function processDocument(attachment: {
  url: string;
  name: string;
  mimeType: string;
}): Promise<ProcessedDocument> {
  const { url, name, mimeType } = attachment;

  try {
    // PDF
    if (mimeType === 'application/pdf') {
      return await extractTextFromPDF(url, name);
    }

    // Word Document
    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      return await extractTextFromDocx(url, name);
    }

    // Plain text files
    if (
      mimeType === 'text/plain' ||
      mimeType === 'text/csv' ||
      mimeType === 'text/markdown' ||
      mimeType === 'application/json'
    ) {
      return await extractTextFromPlainFile(url, name);
    }

    // Unsupported type
    logger.warn('Unsupported document type for text extraction', { mimeType, name });
    return {
      text: '',
      fileName: name,
      wordCount: 0,
    };
  } catch (error) {
    logger.error('Document processing failed', { name, mimeType, error });
    throw error;
  }
}

/**
 * Process multiple documents
 */
export async function processDocuments(attachments: Array<{
  url: string;
  name: string;
  mimeType: string;
  type: string;
}>): Promise<string> {
  const documentAttachments = attachments.filter(att => att.type === 'document');
  
  if (documentAttachments.length === 0) {
    return '';
  }

  logger.info('Processing multiple documents', { count: documentAttachments.length });

  const results = await Promise.all(
    documentAttachments.map(async (att) => {
      try {
        const processed = await processDocument(att);
        return `[Document: ${processed.fileName}]\n${processed.text}\n`;
      } catch (error) {
        logger.error('Failed to process document', { fileName: att.name, error });
        return `[Document: ${att.name}]\n[Error: Could not extract text from this file]\n`;
      }
    })
  );

  return results.join('\n---\n\n');
}
