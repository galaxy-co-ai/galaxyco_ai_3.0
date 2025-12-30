import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { uploadFile, isStorageConfigured } from '@/lib/storage';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';
import { createErrorResponse } from '@/lib/api-error-handler';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  documents: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/json',
  ],
  archives: ['application/zip', 'application/x-rar-compressed', 'application/gzip'],
};

export async function POST(request: NextRequest) {
  try {
    if (!isStorageConfigured()) {
      return createErrorResponse(new Error('File storage is not configured'), 'Upload storage check');
    }

    const { workspaceId, userId: clerkUserId } = await getCurrentWorkspace();
    const user = await getCurrentUser();

    // Rate limiting
    const rateLimitResult = await rateLimit(`upload:${clerkUserId}`, 100, 3600);
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

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return createErrorResponse(new Error('No file provided - required'), 'Upload file validation');
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return createErrorResponse(
        new Error(`File too large - invalid. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`),
        'Upload file size validation'
      );
    }

    // Validate file type
    const allAllowedTypes = [...ALLOWED_TYPES.images, ...ALLOWED_TYPES.documents, ...ALLOWED_TYPES.archives];
    if (!allAllowedTypes.includes(file.type)) {
      return createErrorResponse(new Error('File type not supported - invalid'), 'Upload file type validation');
    }

    // Generate unique pathname
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const pathname = `neptune/${workspaceId}/${timestamp}-${sanitizedName}`;

    // Upload to Vercel Blob
    const blob = await uploadFile(file, pathname, {
      contentType: file.type,
      access: 'public',
    });

    logger.info('File uploaded for Neptune', {
      workspaceId,
      userId: user.id,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });

    // Determine attachment type
    let attachmentType: 'image' | 'document' | 'file' = 'file';
    if (ALLOWED_TYPES.images.includes(file.type)) {
      attachmentType = 'image';
    } else if (ALLOWED_TYPES.documents.includes(file.type)) {
      attachmentType = 'document';
    }

    return NextResponse.json({
      attachment: {
        type: attachmentType,
        url: blob.url,
        name: file.name,
        size: file.size,
        mimeType: file.type,
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Neptune file upload error');
  }
}
