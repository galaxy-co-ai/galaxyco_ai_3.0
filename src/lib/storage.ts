import { put, del, list, head } from '@vercel/blob';

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  throw new Error('BLOB_READ_WRITE_TOKEN required for file uploads');
}

/**
 * Upload a file to Vercel Blob Storage
 */
export async function uploadFile(
  file: File,
  pathname: string,
  options?: {
    addRandomSuffix?: boolean;
    cacheControlMaxAge?: number;
  }
): Promise<{ url: string; pathname: string; downloadUrl: string }> {
  const blob = await put(pathname, file, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: options?.addRandomSuffix ?? true,
    cacheControlMaxAge: options?.cacheControlMaxAge ?? 3600,
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
    downloadUrl: blob.downloadUrl,
  };
}

/**
 * Upload from buffer (for server-side processing)
 */
export async function uploadBuffer(
  buffer: Buffer,
  pathname: string,
  contentType: string
): Promise<{ url: string; pathname: string }> {
  const blob = await put(pathname, buffer, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
    contentType,
    addRandomSuffix: true,
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
  };
}

/**
 * Delete a file from Vercel Blob Storage
 */
export async function deleteFile(url: string): Promise<void> {
  await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
}

/**
 * Delete multiple files
 */
export async function deleteFiles(urls: string[]): Promise<void> {
  await del(urls, { token: process.env.BLOB_READ_WRITE_TOKEN });
}

/**
 * List files in Blob Storage
 */
export async function listFiles(options?: {
  prefix?: string;
  limit?: number;
  cursor?: string;
}) {
  return list({
    prefix: options?.prefix,
    limit: options?.limit ?? 1000,
    cursor: options?.cursor,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
}

/**
 * Get file metadata
 */
export async function getFileMetadata(url: string) {
  return head(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
}

/**
 * Generate a structured path for uploaded files
 */
export function generateFilePath(
  workspaceId: string,
  category: 'documents' | 'images' | 'avatars' | 'exports',
  filename: string
): string {
  const timestamp = Date.now();
  return `${workspaceId}/${category}/${timestamp}-${filename}`;
}






