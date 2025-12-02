import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { uploadFile, isStorageConfigured } from '@/lib/storage';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';

// Allowed file types for team chat
const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/json',
  ],
  archive: ['application/zip', 'application/x-rar-compressed', 'application/gzip'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function getFileCategory(mimeType: string): 'image' | 'file' | null {
  if (ALLOWED_TYPES.image.includes(mimeType)) return 'image';
  if (ALLOWED_TYPES.document.includes(mimeType)) return 'file';
  if (ALLOWED_TYPES.archive.includes(mimeType)) return 'file';
  return null;
}

// POST - Upload a file for team chat
export async function POST(request: Request) {
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
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    const category = getFileCategory(file.type);
    if (!category) {
      return NextResponse.json(
        { error: 'File type not allowed. Supported: images, PDFs, documents, spreadsheets.' },
        { status: 400 }
      );
    }

    // Generate unique pathname
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const pathname = `team-chat/${workspaceId}/${user.id}/${timestamp}-${sanitizedName}`;

    // Upload file
    const result = await uploadFile(file, pathname, {
      contentType: file.type,
      access: 'public',
    });

    logger.info('Team chat file uploaded', {
      workspaceId,
      userId: user.id,
      fileName: file.name,
      fileSize: file.size,
    });

    return NextResponse.json({
      attachment: {
        type: category,
        url: result.url,
        name: file.name,
        size: file.size,
        mimeType: file.type,
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Team chat upload error');
  }
}
