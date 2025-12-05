import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/campaigns/route';
import { PUT, DELETE } from '@/app/api/campaigns/[id]/route';
import { POST as SEND } from '@/app/api/campaigns/[id]/send/route';
import { NextRequest } from 'next/server';

// Mock auth
vi.mock('@/lib/auth', () => ({
  getCurrentWorkspace: vi.fn(() => Promise.resolve({
    workspaceId: 'test-workspace-id',
    userId: 'test-user-id',
  })),
  getCurrentUser: vi.fn(() => Promise.resolve({
    id: 'test-user-id',
    email: 'test@example.com',
  })),
}));

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    query: {
      campaigns: {
        findMany: vi.fn(() => Promise.resolve([
          {
            id: 'campaign-1',
            workspaceId: 'test-workspace-id',
            name: 'Test Campaign',
            type: 'email',
            status: 'draft',
            content: { subject: 'Test Subject', body: 'Test Body' },
            tags: ['all_leads'],
            sentCount: 0,
            openCount: 0,
            clickCount: 0,
            scheduledFor: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'test-user-id',
          },
        ])),
        findFirst: vi.fn(() => Promise.resolve({
          id: 'campaign-1',
          workspaceId: 'test-workspace-id',
          name: 'Test Campaign',
          type: 'email',
          status: 'draft',
          content: { subject: 'Test Subject', body: 'Test Body' },
          tags: ['all_leads'],
          sentCount: 0,
          openCount: 0,
          clickCount: 0,
          scheduledFor: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'test-user-id',
        })),
      },
      prospects: {
        findMany: vi.fn(() => Promise.resolve([
          { id: 'prospect-1', email: 'prospect1@example.com', status: 'new' },
          { id: 'prospect-2', email: 'prospect2@example.com', status: 'qualified' },
        ])),
      },
      contacts: {
        findMany: vi.fn(() => Promise.resolve([
          { id: 'contact-1', email: 'contact1@example.com' },
        ])),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{
          id: 'campaign-new',
          workspaceId: 'test-workspace-id',
          name: 'New Campaign',
          type: 'email',
          status: 'draft',
          content: { subject: 'New Subject', body: 'New Body' },
          tags: ['all_leads'],
          sentCount: 0,
          openCount: 0,
          clickCount: 0,
          scheduledFor: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'test-user-id',
        }])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([{
            id: 'campaign-1',
            name: 'Updated Campaign',
            status: 'draft',
          }])),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve({ rowCount: 1 })),
    })),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock email service (for send tests)
vi.mock('@/lib/email', () => ({
  sendCampaignEmail: vi.fn(() => Promise.resolve({ success: true })),
}));

describe('GET /api/campaigns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return campaigns list', async () => {
    const request = new NextRequest('http://localhost:3000/api/campaigns');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('campaigns');
    expect(Array.isArray(data.campaigns)).toBe(true);
    expect(data.campaigns).toHaveLength(1);
  });

  it('should return campaigns with calculated metrics', async () => {
    const request = new NextRequest('http://localhost:3000/api/campaigns');
    const response = await GET(request);
    const data = await response.json();

    const campaign = data.campaigns[0];
    expect(campaign).toHaveProperty('id');
    expect(campaign).toHaveProperty('name');
    expect(campaign).toHaveProperty('type');
    expect(campaign).toHaveProperty('status');
    expect(campaign).toHaveProperty('openRate');
    expect(campaign).toHaveProperty('clickRate');
  });

  it('should handle empty campaigns list', async () => {
    const { db } = await import('@/lib/db');
    vi.mocked(db.query.campaigns.findMany).mockResolvedValueOnce([]);

    const request = new NextRequest('http://localhost:3000/api/campaigns');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.campaigns).toHaveLength(0);
  });
});

describe('POST /api/campaigns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create campaign with valid data', async () => {
    const request = new NextRequest('http://localhost:3000/api/campaigns', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New Campaign',
        type: 'email',
        subject: 'Welcome Email',
        body: 'Welcome to our platform!',
        targetAudience: 'all_leads',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('id');
    expect(data.name).toBe('New Campaign');
    expect(data.type).toBe('email');
    expect(data.status).toBe('draft');
  });

  it('should validate required field: name', async () => {
    const request = new NextRequest('http://localhost:3000/api/campaigns', {
      method: 'POST',
      body: JSON.stringify({
        type: 'email',
        subject: 'Test',
        body: 'Test',
        targetAudience: 'all_leads',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should validate required field: subject', async () => {
    const request = new NextRequest('http://localhost:3000/api/campaigns', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Campaign',
        type: 'email',
        body: 'Test Body',
        targetAudience: 'all_leads',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should validate required field: body', async () => {
    const request = new NextRequest('http://localhost:3000/api/campaigns', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Campaign',
        type: 'email',
        subject: 'Test Subject',
        targetAudience: 'all_leads',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should validate campaign type enum', async () => {
    const request = new NextRequest('http://localhost:3000/api/campaigns', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Campaign',
        type: 'invalid-type',
        subject: 'Test Subject',
        body: 'Test Body',
        targetAudience: 'all_leads',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should validate targetAudience enum', async () => {
    const request = new NextRequest('http://localhost:3000/api/campaigns', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Campaign',
        type: 'email',
        subject: 'Test Subject',
        body: 'Test Body',
        targetAudience: 'invalid-audience',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should accept optional scheduledFor field', async () => {
    const scheduledDate = new Date('2025-12-31T10:00:00Z').toISOString();
    
    const request = new NextRequest('http://localhost:3000/api/campaigns', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Scheduled Campaign',
        type: 'newsletter',
        subject: 'Year End Newsletter',
        body: 'Happy New Year!',
        targetAudience: 'all_contacts',
        scheduledFor: scheduledDate,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('id');
  });

  it('should handle all campaign types', async () => {
    const types = ['email', 'drip', 'newsletter', 'promotion'];
    
    for (const type of types) {
      const request = new NextRequest('http://localhost:3000/api/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          name: `${type} Campaign`,
          type,
          subject: `${type} Subject`,
          body: `${type} Body`,
          targetAudience: 'all_leads',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    }
  });

  it('should handle all target audiences', async () => {
    const audiences = ['all_leads', 'new_leads', 'qualified_leads', 'all_contacts', 'custom'];
    
    for (const audience of audiences) {
      const request = new NextRequest('http://localhost:3000/api/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          name: `Campaign for ${audience}`,
          type: 'email',
          subject: 'Test Subject',
          body: 'Test Body',
          targetAudience: audience,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    }
  });
});

describe('PUT /api/campaigns/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update campaign successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/campaigns/campaign-1', {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated Campaign',
        status: 'active',
      }),
    });

    const response = await PUT(request, { params: { id: 'campaign-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('id');
  });

  it('should handle campaign not found', async () => {
    const { db } = await import('@/lib/db');
    vi.mocked(db.query.campaigns.findFirst).mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/campaigns/nonexistent', {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated Campaign',
      }),
    });

    const response = await PUT(request, { params: { id: 'nonexistent' } });
    expect(response.status).toBe(404);
  });
});

describe('DELETE /api/campaigns/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete campaign successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/campaigns/campaign-1', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { id: 'campaign-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('success');
  });

  it('should handle campaign not found on delete', async () => {
    const { db } = await import('@/lib/db');
    vi.mocked(db.query.campaigns.findFirst).mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/campaigns/nonexistent', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { id: 'nonexistent' } });
    expect(response.status).toBe(404);
  });
});

describe('POST /api/campaigns/[id]/send', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should queue campaign for sending', async () => {
    const request = new NextRequest('http://localhost:3000/api/campaigns/campaign-1/send', {
      method: 'POST',
    });

    const response = await SEND(request, { params: { id: 'campaign-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('recipientCount');
    expect(data.recipientCount).toBeGreaterThanOrEqual(0);
  });

  it('should calculate recipient count based on target audience', async () => {
    const request = new NextRequest('http://localhost:3000/api/campaigns/campaign-1/send', {
      method: 'POST',
    });

    const response = await SEND(request, { params: { id: 'campaign-1' } });
    const data = await response.json();

    expect(data).toHaveProperty('recipientCount');
    expect(typeof data.recipientCount).toBe('number');
  });

  it('should handle campaign not found on send', async () => {
    const { db } = await import('@/lib/db');
    vi.mocked(db.query.campaigns.findFirst).mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/campaigns/nonexistent/send', {
      method: 'POST',
    });

    const response = await SEND(request, { params: { id: 'nonexistent' } });
    expect(response.status).toBe(404);
  });
});
