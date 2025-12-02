import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/knowledge/upload/route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  getCurrentWorkspace: vi.fn(() => Promise.resolve({
    workspaceId: 'test-workspace-id',
  })),
  getCurrentUser: vi.fn(() => Promise.resolve({
    id: 'test-user-id',
    email: 'test@example.com',
  })),
}));

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      knowledgeCollections: {
        findFirst: vi.fn(() => Promise.resolve(null)),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{
          id: 'item-1',
          workspaceId: 'test-workspace-id',
          createdBy: 'test-user-id',
          title: 'test.txt',
          type: 'document',
          content: 'Test file content',
          summary: 'AI-generated summary',
          sourceUrl: 'https://blob.vercel-storage.com/test.txt',
          fileName: 'test.txt',
          fileSize: 100,
          mimeType: 'text/plain',
          createdAt: new Date(),
        }])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(() => Promise.resolve({
    success: true,
    remaining: 9,
    limit: 10,
    reset: Date.now() + 3600000,
  })),
}));

vi.mock('@/lib/storage', () => ({
  uploadFile: vi.fn(() => Promise.resolve({
    url: 'https://blob.vercel-storage.com/test.txt',
    pathname: 'test-workspace-id/knowledge/test.txt',
  })),
}));

vi.mock('@/lib/ai-providers', () => ({
  getOpenAI: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn(() => Promise.resolve({
          choices: [{
            message: {
              content: 'This is a summary of the document.',
            },
          }],
        })),
      },
    },
    embeddings: {
      create: vi.fn(() => Promise.resolve({
        data: [{
          embedding: new Array(1536).fill(0.1),
        }],
      })),
    },
  })),
}));

vi.mock('@/lib/vector', () => ({
  upsertVectors: vi.fn(() => Promise.resolve()),
}));

describe('POST /api/knowledge/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should upload a text file successfully', async () => {
    const formData = new FormData();
    const file = new File(['Test content'], 'test.txt', { type: 'text/plain' });
    formData.append('file', file);
    formData.append('title', 'Test Document');

    const request = new NextRequest('http://localhost:3000/api/knowledge/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('title');
    expect(data).toHaveProperty('url');
    expect(data).toHaveProperty('summary');
  });

  it('should reject request without file', async () => {
    const formData = new FormData();
    formData.append('title', 'Test Document');

    const request = new NextRequest('http://localhost:3000/api/knowledge/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('File is required');
  });

  it('should enforce rate limiting', async () => {
    const { rateLimit } = await import('@/lib/rate-limit');
    vi.mocked(rateLimit).mockResolvedValueOnce({
      success: false,
      remaining: 0,
      limit: 10,
      reset: Date.now() + 3600000,
    });

    const formData = new FormData();
    const file = new File(['Test'], 'test.txt', { type: 'text/plain' });
    formData.append('file', file);

    const request = new NextRequest('http://localhost:3000/api/knowledge/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toContain('rate limit');
  });

  it('should reject unsupported file types', async () => {
    const formData = new FormData();
    const file = new File(['content'], 'test.exe', { type: 'application/exe' });
    formData.append('file', file);

    const request = new NextRequest('http://localhost:3000/api/knowledge/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('File type not supported');
  });
});
















