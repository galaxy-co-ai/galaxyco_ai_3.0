import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/crm/contacts/route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  getCurrentWorkspace: vi.fn(() => Promise.resolve({
    workspaceId: 'test-workspace-id',
    userId: 'test-user-id',
  })),
}));

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      contacts: {
        findMany: vi.fn(() => Promise.resolve([
          {
            id: 'contact-1',
            workspaceId: 'test-workspace-id',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            company: 'Test Corp',
            title: 'CEO',
            phone: '555-0100',
            tags: ['vip'],
            lastContactedAt: new Date('2025-01-01'),
            createdAt: new Date('2024-12-01'),
          },
          {
            id: 'contact-2',
            workspaceId: 'test-workspace-id',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            company: 'Another Corp',
            title: 'CTO',
            phone: '555-0200',
            tags: [],
            lastContactedAt: null,
            createdAt: new Date('2024-12-15'),
          },
        ])),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{
          id: 'contact-3',
          workspaceId: 'test-workspace-id',
          firstName: 'Alice',
          lastName: 'Johnson',
          email: 'alice@example.com',
          company: 'New Corp',
          title: 'VP Sales',
          phone: '555-0300',
          tags: [],
          createdAt: new Date(),
        }])),
      })),
    })),
  },
}));

vi.mock('@/actions/crm', () => ({
  invalidateCRMCache: vi.fn(() => Promise.resolve()),
}));

describe('GET /api/crm/contacts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return list of contacts', async () => {
    const request = new NextRequest('http://localhost:3000/api/crm/contacts');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(2);
    expect(data[0]).toHaveProperty('firstName');
    expect(data[0]).toHaveProperty('email');
    expect(data[0].name).toBe('John Doe');
  });

  it('should transform contact data correctly', async () => {
    const request = new NextRequest('http://localhost:3000/api/crm/contacts');
    const response = await GET(request);
    const data = await response.json();

    const contact = data[0];
    expect(contact).toHaveProperty('id');
    expect(contact).toHaveProperty('name');
    expect(contact).toHaveProperty('firstName');
    expect(contact).toHaveProperty('lastName');
    expect(contact).toHaveProperty('company');
    expect(contact).toHaveProperty('email');
    expect(contact).toHaveProperty('tags');
  });
});

describe('POST /api/crm/contacts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new contact with valid data', async () => {
    const request = new NextRequest('http://localhost:3000/api/crm/contacts', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice@example.com',
        company: 'New Corp',
        title: 'VP Sales',
        phone: '555-0300',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('id');
    expect(data.firstName).toBe('Alice');
    expect(data.email).toBe('alice@example.com');
  });

  it('should validate required fields - missing firstName', async () => {
    const request = new NextRequest('http://localhost:3000/api/crm/contacts', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
  });

  it('should validate email format', async () => {
    const request = new NextRequest('http://localhost:3000/api/crm/contacts', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'Test',
        email: 'invalid-email-format',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
  });

  it('should create contact with minimal required fields', async () => {
    const { db } = await import('@/lib/db');
    vi.mocked(db.insert).mockReturnValueOnce({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{
          id: 'contact-bob',
          workspaceId: 'test-workspace-id',
          firstName: 'Bob',
          lastName: null,
          email: 'bob@example.com',
          company: null,
          title: null,
          phone: null,
          tags: [],
          createdAt: new Date(),
        }])),
      })),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/crm/contacts', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'Bob',
        email: 'bob@example.com',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.firstName).toBe('Bob');
  });

  it('should handle tags array', async () => {
    const { db } = await import('@/lib/db');
    vi.mocked(db.insert).mockReturnValueOnce({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{
          id: 'contact-charlie',
          workspaceId: 'test-workspace-id',
          firstName: 'Charlie',
          lastName: null,
          email: 'charlie@example.com',
          company: null,
          title: null,
          phone: null,
          tags: ['important', 'enterprise'],
          createdAt: new Date(),
        }])),
      })),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/crm/contacts', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'Charlie',
        email: 'charlie@example.com',
        tags: ['important', 'enterprise'],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.tags).toEqual(['important', 'enterprise']);
  });
});

