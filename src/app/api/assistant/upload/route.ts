import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { uploadFile, isStorageConfigured } from '@/lib/storage';
import { logger } from '@/lib/logger';

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
      return NextResponse.json(
        { error: 'File storage is not configured' },
        { status: 503 }
      );
    }

    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Validate file type
    const allAllowedTypes = [...ALLOWED_TYPES.images, ...ALLOWED_TYPES.documents, ...ALLOWED_TYPES.archives];
    if (!allAllowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File type not supported' }, { status: 400 });
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
    logger.error('Neptune file upload error', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
