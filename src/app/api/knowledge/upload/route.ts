import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { knowledgeItems, knowledgeCollections } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { uploadFile } from '@/lib/storage';
import { getOpenAI } from '@/lib/ai-providers';
import { indexKnowledgeDocument, isVectorConfigured } from '@/lib/vector';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';

// Helper to extract text from PDF files
async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import for pdf-parse
    // Using require-style for compatibility with pdf-parse's module system
    const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string }>;
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (error) {
    logger.error('PDF extraction failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw new Error('Failed to extract text from PDF');
  }
}

// Helper to extract text from DOCX files
async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import for mammoth
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (error) {
    logger.error('DOCX extraction failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw new Error('Failed to extract text from DOCX');
  }
}

// Main text extraction function
async function extractText(file: File): Promise<string> {
  const fileType = file.type;

  // Handle text-based files directly
  if (
    fileType === 'text/plain' ||
    fileType === 'text/markdown' ||
    fileType === 'application/json'
  ) {
    return await file.text();
  }

  // For PDF files - use pdf-parse
  if (fileType === 'application/pdf') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const text = await extractPdfText(buffer);
      
      if (!text || text.trim().length === 0) {
        logger.warn('PDF extraction returned empty text', { fileName: file.name });
        return '[PDF contained no extractable text - may be scanned/image-based]';
      }
      
      logger.info('PDF text extracted successfully', { 
        fileName: file.name, 
        textLength: text.length 
      });
      return text;
    } catch (error) {
      logger.error('PDF extraction error', { fileName: file.name, error });
      return '[PDF text extraction failed - file may be corrupted or protected]';
    }
  }

  // For DOCX files - use mammoth
  if (
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const text = await extractDocxText(buffer);
      
      if (!text || text.trim().length === 0) {
        logger.warn('DOCX extraction returned empty text', { fileName: file.name });
        return '[DOCX contained no extractable text]';
      }
      
      logger.info('DOCX text extracted successfully', { 
        fileName: file.name, 
        textLength: text.length 
      });
      return text;
    } catch (error) {
      logger.error('DOCX extraction error', { fileName: file.name, error });
      return '[DOCX text extraction failed - file may be corrupted]';
    }
  }

  // Fallback for other file types
  try {
    return await file.text();
  } catch {
    return '[Unable to extract text from this file type]';
  }
}

export async function POST(request: Request) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();

    // Rate limit uploads
    const rateLimitResult = await rateLimit(
      `upload:${user.id}`,
      10, // 10 uploads
      3600 // per hour
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Upload rate limit exceeded' },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const collectionId = formData.get('collectionId') as string | null;
    const title = formData.get('title') as string | null;

    // Validate input
    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate file type (basic check)
    const allowedTypes = [
      'text/plain',
      'text/markdown',
      'application/json',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not supported' },
        { status: 400 }
      );
    }

    // Validate collectionId if provided
    if (collectionId) {
      const collection = await db.query.knowledgeCollections.findFirst({
        where: and(
          eq(knowledgeCollections.id, collectionId),
          eq(knowledgeCollections.workspaceId, workspaceId)
        ),
      });

      if (!collection) {
        return NextResponse.json(
          { error: 'Collection not found' },
          { status: 404 }
        );
      }
    }

    // Upload to Vercel Blob
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const pathname = `${workspaceId}/knowledge/${timestamp}-${safeName}`;
    
    const { url: fileUrl } = await uploadFile(file, pathname);

    // Extract text content
    const content = await extractText(file);
    
    // Generate summary using OpenAI
    const openai = getOpenAI();
    let summary = '';
    
    try {
      const summaryResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a document summarizer. Provide a concise 2-3 sentence summary of the document.',
          },
          {
            role: 'user',
            content: `Summarize this document:\n\n${content.substring(0, 3000)}`,
          },
        ],
        max_tokens: 150,
        temperature: 0.3,
      });

      summary = summaryResponse.choices[0]?.message?.content || 'AI-generated summary';
    } catch (error) {
      logger.error('Summary generation failed', error);
      summary = 'Summary generation failed';
    }

    // Create knowledge item
    const [item] = await db
      .insert(knowledgeItems)
      .values({
        workspaceId,
        createdBy: user.id,
        collectionId: collectionId || null,
        title: title || file.name,
        type: file.type.startsWith('image/') ? 'image' as const : 'document' as const,
        content,
        summary,
        sourceUrl: fileUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        metadata: {
          extractedAt: new Date().toISOString(),
        },
      })
      .returning();

    // Index document in vector database for semantic search
    try {
      if (isVectorConfigured()) {
        const { chunksIndexed } = await indexKnowledgeDocument(
          item.id,
          workspaceId,
          item.title,
          content,
          {
            type: item.type,
            mimeType: file.type,
            fileName: file.name,
          }
        );
        logger.info('Document indexed in vector DB', { 
          itemId: item.id, 
          chunksIndexed 
        });
      }
    } catch (error) {
      logger.error('Vector embedding failed', error);
      // Don't fail the upload if embedding fails
    }

    // Update collection item count if applicable
    if (collectionId) {
      const collection = await db.query.knowledgeCollections.findFirst({
        where: and(
          eq(knowledgeCollections.id, collectionId),
          eq(knowledgeCollections.workspaceId, workspaceId)
        ),
      });

      if (collection) {
        await db
          .update(knowledgeCollections)
          .set({
            itemCount: collection.itemCount + 1,
          })
          .where(eq(knowledgeCollections.id, collectionId));
      }
    }

    return NextResponse.json({
      id: item.id,
      title: item.title,
      type: item.type,
      url: item.sourceUrl,
      summary: item.summary,
      fileSize: item.fileSize,
      createdAt: item.createdAt,
    });
  } catch (error) {
    return createErrorResponse(error, 'Knowledge upload error');
  }
}






