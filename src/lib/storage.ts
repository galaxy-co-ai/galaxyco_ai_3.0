import { put, del, head } from '@vercel/blob';
import { logger } from './logger';

/**
 * File storage utilities using Vercel Blob
 * Handles file uploads, deletions, and metadata retrieval
 */

export interface UploadResult {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
}

/**
 * Upload a file to Vercel Blob storage
 *
 * @param file - The file to upload (File object or Buffer)
 * @param pathname - The path where the file should be stored (e.g., 'workspace-id/knowledge/filename.pdf')
 * @param options - Optional upload options
 * @returns Upload result with URL and metadata
 *
 * @example
 * ```typescript
 * const { url } = await uploadFile(file, 'workspace-123/knowledge/doc.pdf');
 * ```
 */
export async function uploadFile(
  file: File | Buffer,
  pathname: string,
  options?: {
    contentType?: string;
    access?: 'public' | 'private';
    addRandomSuffix?: boolean;
  }
): Promise<UploadResult> {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      throw new Error('BLOB_READ_WRITE_TOKEN environment variable is not configured');
    }

    // Convert File to Buffer if needed
    let fileBuffer: Buffer;
    let contentType = options?.contentType;

    if (file instanceof File) {
      contentType = contentType || file.type;
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    } else {
      fileBuffer = file;
    }

    // Upload to Vercel Blob
    const blob = await put(pathname, fileBuffer, {
      access: (options?.access || 'public') as 'public',
      contentType: contentType || 'application/octet-stream',
      addRandomSuffix: options?.addRandomSuffix ?? false,
      token,
    });

    logger.info('File uploaded successfully', {
      pathname: blob.pathname,
      url: blob.url,
    });

    return {
      url: blob.url,
      pathname: blob.pathname,
      size: fileBuffer.length,
      uploadedAt: new Date(),
    };
  } catch (error) {
    logger.error('File upload failed', error, { pathname });
    throw new Error(
      `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Delete a file from Vercel Blob storage
 *
 * @param url - The URL of the file to delete
 * @returns True if deletion was successful
 *
 * @example
 * ```typescript
 * await deleteFile('https://blob.vercel-storage.com/...');
 * ```
 */
export async function deleteFile(url: string): Promise<boolean> {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      throw new Error('BLOB_READ_WRITE_TOKEN environment variable is not configured');
    }

    await del(url, { token });

    logger.info('File deleted successfully', { url });
    return true;
  } catch (error) {
    logger.error('File deletion failed', error, { url });
    // Don't throw - deletion failures shouldn't break the flow
    return false;
  }
}

/**
 * Check if a file exists in Vercel Blob storage
 *
 * @param url - The URL of the file to check
 * @returns File metadata if exists, null otherwise
 *
 * @example
 * ```typescript
 * const metadata = await fileExists('https://blob.vercel-storage.com/...');
 * if (metadata) {
 *   console.log('File size:', metadata.size);
 * }
 * ```
 */
export async function fileExists(url: string): Promise<{
  size: number;
  uploadedAt: Date;
  pathname: string;
} | null> {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      throw new Error('BLOB_READ_WRITE_TOKEN environment variable is not configured');
    }

    const blob = await head(url, { token });

    return {
      size: blob.size,
      uploadedAt: new Date(blob.uploadedAt),
      pathname: blob.pathname,
    };
  } catch (error) {
    // File doesn't exist or error occurred
    logger.debug('File existence check failed', { url, error });
    return null;
  }
}

/**
 * Check if storage is configured
 *
 * @returns True if BLOB_READ_WRITE_TOKEN is set
 */
export function isStorageConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}
