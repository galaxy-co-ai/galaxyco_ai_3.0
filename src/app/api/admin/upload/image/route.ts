import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { uploadFile, isStorageConfigured } from '@/lib/storage';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';

// Allowed image types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * POST /api/admin/upload/image
 * Upload an image file to Vercel Blob storage
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return createErrorResponse(new Error('Unauthorized'), 'Image upload auth');
    }

    // Check if storage is configured
    if (!isStorageConfigured()) {
      logger.warn('Image upload attempted but Blob storage not configured');
      return createErrorResponse(
        new Error('Service unavailable: file storage not configured'),
        'Image upload storage'
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return createErrorResponse(new Error('Invalid request: no file provided'), 'Image upload file');
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      logger.warn('Invalid file type uploaded', {
        type: file.type,
        allowed: ALLOWED_TYPES,
      });
      return createErrorResponse(
        new Error(`Invalid file type: allowed types are ${ALLOWED_TYPES.map(t => t.replace('image/', '')).join(', ')}`),
        'Image upload type'
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      logger.warn('File too large', {
        size: file.size,
        maxSize: MAX_FILE_SIZE,
      });
      return createErrorResponse(
        new Error(`Invalid file size: maximum is ${MAX_FILE_SIZE / 1024 / 1024}MB`),
        'Image upload size'
      );
    }

    logger.info('Uploading image', {
      filename: file.name,
      type: file.type,
      size: file.size,
    });

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const extension = file.name.split('.').pop()?.toLowerCase() || getExtensionFromType(file.type);
    const sanitizedName = file.name
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace special chars
      .substring(0, 50); // Limit length
    
    const filename = `article-images/${timestamp}-${sanitizedName}.${extension}`;

    // Upload to Vercel Blob
    const result = await uploadFile(file, filename, {
      contentType: file.type,
      access: 'public',
    });

    logger.info('Image uploaded successfully', {
      url: result.url,
      pathname: result.pathname,
      size: result.size,
    });

    return NextResponse.json({
      url: result.url,
      pathname: result.pathname,
      size: result.size,
      filename: file.name,
      contentType: file.type,
    });
  } catch (error) {
    return createErrorResponse(error, 'Image upload error');
  }
}

/**
 * Get file extension from MIME type
 */
function getExtensionFromType(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  };
  return map[mimeType] || 'png';
}

/**
 * Configuration for the route
 * Note: bodyParser config is handled by Next.js App Router automatically
 */

