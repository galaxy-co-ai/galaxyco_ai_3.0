/**
 * Tests for Campaign Send API Route
 * 
 * Tests campaign sending flow, recipient selection, email delivery,
 * rate limiting, and error handling for the campaign send endpoint.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/campaigns/[id]/send/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  getCurrentWorkspace: vi.fn(() =>
    Promise.resolve({
      workspaceId: 'workspace-123',
      userId: 'user-456',
    })
  ),
}));

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      campaigns: {
        findFirst: vi.fn(),
      },
      prospects: {
        findMany: vi.fn(),
      },
      contacts: {
        findMany: vi.fn(),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
  },
}));

vi.mock('@/lib/email', () => ({
  sendBulkEmails: vi.fn(() =>
    Promise.resolve({
      sent: 10,
      failed: 0,
    })
  ),
  isEmailConfigured: vi.fn(() => true),
  getCampaignEmailTemplate: vi.fn((subject, headline, body) => ({
    subject,
    html: `<html><body><h1>${headline}</h1><p>${body}</p></body></html>`,
    text: `${headline}\n\n${body}`,
  })),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(() =>
    Promise.resolve({
      success: true,
      remaining: 4,
    })
  ),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/api-error-handler', () => ({
  createErrorResponse: vi.fn((error, message) => ({
    json: vi.fn(() => Promise.resolve({ error: message })),
    status: 500,
  })),
}));

import { db } from '@/lib/db';
import { sendBulkEmails, isEmailConfigured } from '@/lib/email';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { getCurrentWorkspace } from '@/lib/auth';

describe('api/campaigns/[id]/send/route', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset default mocks
    vi.mocked(getCurrentWorkspace).mockResolvedValue({
      workspaceId: 'workspace-123',
      userId: 'user-456',
    } as any);

    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      remaining: 4,
    } as any);

    vi.mocked(isEmailConfigured).mockReturnValue(true);

    vi.mocked(sendBulkEmails).mockResolvedValue({
      sent: 10,
      failed: 0,
    });
  });

  describe('POST /api/campaigns/[id]/send', () => {
    it('should return 429 when rate limit exceeded', async () => {
      vi.mocked(rateLimit).mockResolvedValue({
        success: false,
        remaining: 0,
      } as any);

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/send', {
        method: 'POST',
      });
      const params = Promise.resolve({ id: 'campaign-1' });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain('rate limit exceeded');
      expect(rateLimit).toHaveBeenCalledWith('campaign-send:workspace-123', 5, 3600);
    });

    it('should return 503 when email service not configured', async () => {
      vi.mocked(isEmailConfigured).mockReturnValue(false);

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/send', {
        method: 'POST',
      });
      const params = Promise.resolve({ id: 'campaign-1' });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toContain('Email service not configured');
    });

    it('should return 404 when campaign not found', async () => {
      vi.mocked(db.query.campaigns.findFirst).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/send', {
        method: 'POST',
      });
      const params = Promise.resolve({ id: 'campaign-1' });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Campaign not found');
    });

    it('should return 400 when campaign already completed', async () => {
      vi.mocked(db.query.campaigns.findFirst).mockResolvedValue({
        id: 'campaign-1',
        workspaceId: 'workspace-123',
        name: 'Test Campaign',
        status: 'completed',
        content: { subject: 'Test', body: 'Test body' },
        tags: ['all_leads'],
      } as any);

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/send', {
        method: 'POST',
      });
      const params = Promise.resolve({ id: 'campaign-1' });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Campaign has already been sent');
    });

    it('should return 400 when campaign is currently being sent', async () => {
      vi.mocked(db.query.campaigns.findFirst).mockResolvedValue({
        id: 'campaign-1',
        status: 'active',
        content: { subject: 'Test', body: 'Test body' },
        tags: ['all_leads'],
      } as any);

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/send', {
        method: 'POST',
      });
      const params = Promise.resolve({ id: 'campaign-1' });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Campaign is currently being sent');
    });

    it('should return 400 when campaign missing subject', async () => {
      vi.mocked(db.query.campaigns.findFirst).mockResolvedValue({
        id: 'campaign-1',
        status: 'draft',
        content: { body: 'Test body' }, // Missing subject
        tags: ['all_leads'],
      } as any);

      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve()),
        })),
      }));
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/send', {
        method: 'POST',
      });
      const params = Promise.resolve({ id: 'campaign-1' });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('missing subject or body');
      // Should revert status to draft
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should return 400 when campaign missing body', async () => {
      vi.mocked(db.query.campaigns.findFirst).mockResolvedValue({
        id: 'campaign-1',
        status: 'draft',
        content: { subject: 'Test Subject' }, // Missing body
        tags: ['all_leads'],
      } as any);

      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve()),
        })),
      }));
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/send', {
        method: 'POST',
      });
      const params = Promise.resolve({ id: 'campaign-1' });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('missing subject or body');
    });

    it('should return 400 when no recipients found', async () => {
      vi.mocked(db.query.campaigns.findFirst).mockResolvedValue({
        id: 'campaign-1',
        status: 'draft',
        content: { subject: 'Test', body: 'Test body' },
        tags: ['all_leads'],
      } as any);

      vi.mocked(db.query.prospects.findMany).mockResolvedValue([]);

      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve()),
        })),
      }));
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/send', {
        method: 'POST',
      });
      const params = Promise.resolve({ id: 'campaign-1' });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('No recipients found');
    });

    it('should send campaign to all leads successfully', async () => {
      vi.mocked(db.query.campaigns.findFirst).mockResolvedValue({
        id: 'campaign-1',
        workspaceId: 'workspace-123',
        name: 'Test Campaign',
        status: 'draft',
        content: { subject: 'Newsletter', body: 'Hi there, welcome!' },
        tags: ['all_leads'],
      } as any);

      vi.mocked(db.query.prospects.findMany).mockResolvedValue([
        { email: 'lead1@example.com', name: 'Lead One' },
        { email: 'lead2@example.com', name: 'Lead Two' },
        { email: 'lead3@example.com', name: 'Lead Three' },
      ] as any);

      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve()),
        })),
      }));
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      vi.mocked(sendBulkEmails).mockResolvedValue({
        sent: 3,
        failed: 0,
      });

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/send', {
        method: 'POST',
      });
      const params = Promise.resolve({ id: 'campaign-1' });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('3 recipients');
      expect(data.stats).toEqual({
        sent: 3,
        failed: 0,
        total: 3,
      });

      // Should update campaign status to active first
      expect(mockUpdate).toHaveBeenCalledTimes(2);

      // Should send emails
      expect(sendBulkEmails).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            to: 'lead1@example.com',
            subject: 'Newsletter',
          }),
        ]),
        10,
        200
      );

      // Should log success
      expect(logger.info).toHaveBeenCalledWith(
        'Campaign send completed',
        expect.objectContaining({
          campaignId: 'campaign-1',
          sent: 3,
          failed: 0,
        })
      );
    });

    it('should send campaign to new leads only', async () => {
      vi.mocked(db.query.campaigns.findFirst).mockResolvedValue({
        id: 'campaign-1',
        status: 'draft',
        content: { subject: 'Welcome', body: 'Hi there!' },
        tags: ['new_leads'],
      } as any);

      vi.mocked(db.query.prospects.findMany).mockResolvedValue([
        { email: 'new1@example.com', name: 'New Lead 1', stage: 'new' },
        { email: 'new2@example.com', name: 'New Lead 2', stage: 'new' },
      ] as any);

      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve()),
        })),
      }));
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      vi.mocked(sendBulkEmails).mockResolvedValue({
        sent: 2,
        failed: 0,
      });

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/send', {
        method: 'POST',
      });
      const params = Promise.resolve({ id: 'campaign-1' });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stats.sent).toBe(2);
    });

    it('should send campaign to qualified leads only', async () => {
      vi.mocked(db.query.campaigns.findFirst).mockResolvedValue({
        id: 'campaign-1',
        status: 'draft',
        content: { subject: 'Premium Offer', body: 'Special for qualified leads' },
        tags: ['qualified_leads'],
      } as any);

      vi.mocked(db.query.prospects.findMany).mockResolvedValue([
        { email: 'qualified1@example.com', name: 'Qualified 1', stage: 'qualified' },
        { email: 'qualified2@example.com', name: 'Qualified 2', stage: 'proposal' },
      ] as any);

      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve()),
        })),
      }));
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      vi.mocked(sendBulkEmails).mockResolvedValue({
        sent: 2,
        failed: 0,
      });

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/send', {
        method: 'POST',
      });
      const params = Promise.resolve({ id: 'campaign-1' });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stats.sent).toBe(2);
    });

    it('should send campaign to all contacts', async () => {
      vi.mocked(db.query.campaigns.findFirst).mockResolvedValue({
        id: 'campaign-1',
        status: 'draft',
        content: { subject: 'Newsletter', body: 'Hi there!' },
        tags: ['all_contacts'],
      } as any);

      vi.mocked(db.query.contacts.findMany).mockResolvedValue([
        { email: 'contact1@example.com', firstName: 'John', lastName: 'Doe' },
        { email: 'contact2@example.com', firstName: 'Jane', lastName: 'Smith' },
        { email: 'contact3@example.com', firstName: 'Bob', lastName: null },
      ] as any);

      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve()),
        })),
      }));
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      vi.mocked(sendBulkEmails).mockResolvedValue({
        sent: 3,
        failed: 0,
      });

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/send', {
        method: 'POST',
      });
      const params = Promise.resolve({ id: 'campaign-1' });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stats.sent).toBe(3);

      // Should format contact names correctly
      const emailsCall = vi.mocked(sendBulkEmails).mock.calls[0][0];
      expect(emailsCall[0].html).toContain('Hi John Doe');
      expect(emailsCall[1].html).toContain('Hi Jane Smith');
      expect(emailsCall[2].html).toContain('Hi Bob');
    });

    it('should handle contacts with missing names', async () => {
      vi.mocked(db.query.campaigns.findFirst).mockResolvedValue({
        id: 'campaign-1',
        status: 'draft',
        content: { subject: 'Newsletter', body: 'Hi there!' },
        tags: ['all_contacts'],
      } as any);

      vi.mocked(db.query.contacts.findMany).mockResolvedValue([
        { email: 'contact@example.com', firstName: null, lastName: null },
      ] as any);

      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve()),
        })),
      }));
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      vi.mocked(sendBulkEmails).mockResolvedValue({
        sent: 1,
        failed: 0,
      });

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/send', {
        method: 'POST',
      });
      const params = Promise.resolve({ id: 'campaign-1' });

      const response = await POST(request, { params });

      const emailsCall = vi.mocked(sendBulkEmails).mock.calls[0][0];
      expect(emailsCall[0].html).toContain('Hi there'); // Fallback name
    });

    it('should limit recipients to 1000 for safety', async () => {
      vi.mocked(db.query.campaigns.findFirst).mockResolvedValue({
        id: 'campaign-1',
        status: 'draft',
        content: { subject: 'Newsletter', body: 'Hi there!' },
        tags: ['all_leads'],
      } as any);

      // Create 1500 prospects
      const manyProspects = Array.from({ length: 1500 }, (_, i) => ({
        email: `lead${i}@example.com`,
        name: `Lead ${i}`,
      }));
      vi.mocked(db.query.prospects.findMany).mockResolvedValue(manyProspects as any);

      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve()),
        })),
      }));
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      vi.mocked(sendBulkEmails).mockResolvedValue({
        sent: 1000,
        failed: 0,
      });

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/send', {
        method: 'POST',
      });
      const params = Promise.resolve({ id: 'campaign-1' });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);

      // Should only send to 1000 recipients
      const emailsCall = vi.mocked(sendBulkEmails).mock.calls[0][0];
      expect(emailsCall).toHaveLength(1000);
    });

    it('should include campaign tags in email metadata', async () => {
      vi.mocked(db.query.campaigns.findFirst).mockResolvedValue({
        id: 'campaign-1',
        workspaceId: 'workspace-123',
        name: 'Q4 Newsletter',
        status: 'draft',
        content: { subject: 'Newsletter', body: 'Hi there!' },
        tags: ['all_leads'],
      } as any);

      vi.mocked(db.query.prospects.findMany).mockResolvedValue([
        { email: 'lead@example.com', name: 'Lead' },
      ] as any);

      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve()),
        })),
      }));
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/send', {
        method: 'POST',
      });
      const params = Promise.resolve({ id: 'campaign-1' });

      await POST(request, { params });

      const emailsCall = vi.mocked(sendBulkEmails).mock.calls[0][0];
      expect(emailsCall[0].tags).toEqual([
        { name: 'campaign_id', value: 'campaign-1' },
        { name: 'campaign_name', value: 'Q4 Newsletter' },
        { name: 'workspace', value: 'workspace-123' },
      ]);
    });

    it('should personalize emails with recipient names', async () => {
      vi.mocked(db.query.campaigns.findFirst).mockResolvedValue({
        id: 'campaign-1',
        status: 'draft',
        content: { subject: 'Hello', body: 'Hi there, welcome to our platform!' },
        tags: ['all_leads'],
      } as any);

      vi.mocked(db.query.prospects.findMany).mockResolvedValue([
        { email: 'alice@example.com', name: 'Alice' },
        { email: 'bob@example.com', name: 'Bob' },
      ] as any);

      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve()),
        })),
      }));
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/send', {
        method: 'POST',
      });
      const params = Promise.resolve({ id: 'campaign-1' });

      await POST(request, { params });

      const emailsCall = vi.mocked(sendBulkEmails).mock.calls[0][0];
      expect(emailsCall[0].html).toContain('Hi Alice');
      expect(emailsCall[1].html).toContain('Hi Bob');
    });

    it('should handle partial send failures', async () => {
      vi.mocked(db.query.campaigns.findFirst).mockResolvedValue({
        id: 'campaign-1',
        status: 'draft',
        content: { subject: 'Newsletter', body: 'Hi there!' },
        tags: ['all_leads'],
      } as any);

      vi.mocked(db.query.prospects.findMany).mockResolvedValue([
        { email: 'lead1@example.com', name: 'Lead 1' },
        { email: 'lead2@example.com', name: 'Lead 2' },
        { email: 'lead3@example.com', name: 'Lead 3' },
      ] as any);

      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve()),
        })),
      }));
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      vi.mocked(sendBulkEmails).mockResolvedValue({
        sent: 2,
        failed: 1,
      });

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/send', {
        method: 'POST',
      });
      const params = Promise.resolve({ id: 'campaign-1' });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stats).toEqual({
        sent: 2,
        failed: 1,
        total: 3,
      });
    });

    it('should skip recipients without email addresses', async () => {
      vi.mocked(db.query.campaigns.findFirst).mockResolvedValue({
        id: 'campaign-1',
        status: 'draft',
        content: { subject: 'Newsletter', body: 'Hi there!' },
        tags: ['all_leads'],
      } as any);

      vi.mocked(db.query.prospects.findMany).mockResolvedValue([
        { email: 'valid@example.com', name: 'Valid Lead' },
        { email: '', name: 'No Email Lead' }, // Empty email
        { email: null, name: 'Null Email Lead' }, // Null email
      ] as any);

      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve()),
        })),
      }));
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      vi.mocked(sendBulkEmails).mockResolvedValue({
        sent: 1,
        failed: 0,
      });

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/send', {
        method: 'POST',
      });
      const params = Promise.resolve({ id: 'campaign-1' });

      const response = await POST(request, { params });

      const emailsCall = vi.mocked(sendBulkEmails).mock.calls[0][0];
      expect(emailsCall).toHaveLength(1);
      expect(emailsCall[0].to).toBe('valid@example.com');
    });

    it('should update campaign status to completed after send', async () => {
      vi.mocked(db.query.campaigns.findFirst).mockResolvedValue({
        id: 'campaign-1',
        status: 'draft',
        content: { subject: 'Newsletter', body: 'Hi there!' },
        tags: ['all_leads'],
      } as any);

      vi.mocked(db.query.prospects.findMany).mockResolvedValue([
        { email: 'lead@example.com', name: 'Lead' },
      ] as any);

      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve()),
        })),
      }));
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      vi.mocked(sendBulkEmails).mockResolvedValue({
        sent: 1,
        failed: 0,
      });

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/send', {
        method: 'POST',
      });
      const params = Promise.resolve({ id: 'campaign-1' });

      await POST(request, { params });

      // Should update to active first, then completed
      expect(mockUpdate).toHaveBeenCalledTimes(2);

      const firstUpdate = mockUpdate.mock.results[0].value.set.mock.calls[0][0];
      expect(firstUpdate.status).toBe('active');

      const secondUpdate = mockUpdate.mock.results[1].value.set.mock.calls[0][0];
      expect(secondUpdate.status).toBe('completed');
      expect(secondUpdate.sentCount).toBe(1);
    });

    it('should handle unexpected errors gracefully', async () => {
      vi.mocked(db.query.campaigns.findFirst).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/send', {
        method: 'POST',
      });
      const params = Promise.resolve({ id: 'campaign-1' });

      const response = await POST(request, { params });

      expect(logger.error).toHaveBeenCalledWith(
        'Campaign send error',
        expect.any(Error)
      );
    });
  });
});
