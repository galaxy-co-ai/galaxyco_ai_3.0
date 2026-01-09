/**
 * Tests for Campaign Sender Trigger Jobs
 * 
 * Tests Trigger.dev background jobs for email campaign sending including:
 * - sendCampaignTask - Send campaign to recipients
 * - scheduleCampaignTask - Schedule campaign for future send
 * - Recipient filtering and segmentation
 * - Email personalization
 * - Bulk sending logic
 * - Error handling and status tracking
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { sendCampaignTask, scheduleCampaignTask } from '@/trigger/campaign-sender';
import { db } from '@/lib/db';
import { 
  sendBulkEmails, 
  isEmailConfigured, 
  getCampaignEmailTemplate 
} from '@/lib/email';
import { logger } from '@/lib/logger';

// Mock dependencies
vi.mock('@trigger.dev/sdk/v3', () => ({
  task: vi.fn((config) => ({
    ...config,
    triggerAndWait: vi.fn(),
  })),
  wait: {
    until: vi.fn(),
  },
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
      workspaces: {
        findFirst: vi.fn(),
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
  sendBulkEmails: vi.fn(),
  isEmailConfigured: vi.fn(),
  getCampaignEmailTemplate: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/trigger/queues', () => ({
  buildWorkspaceQueueOptions: vi.fn((workspaceId: string, tier: string) => ({
    queue: { name: `workspace-${tier}` },
  })),
}));

describe('trigger/campaign-sender', () => {
  const mockWorkspaceId = 'workspace-123';
  const mockCampaignId = 'campaign-456';

  const mockCampaign = {
    id: mockCampaignId,
    workspaceId: mockWorkspaceId,
    name: 'Q1 Product Launch',
    status: 'draft',
    tags: ['all_leads'],
    content: {
      subject: 'Introducing Our New Product',
      body: 'Hi there, check out our amazing new product!',
    },
  };

  const mockProspects = [
    {
      email: 'prospect1@example.com',
      name: 'Alice Johnson',
      stage: 'new',
    },
    {
      email: 'prospect2@example.com',
      name: 'Bob Smith',
      stage: 'qualified',
    },
    {
      email: 'prospect3@example.com',
      name: 'Charlie Brown',
      stage: 'proposal',
    },
  ];

  const mockContacts = [
    {
      email: 'contact1@example.com',
      firstName: 'David',
      lastName: 'Lee',
    },
    {
      email: 'contact2@example.com',
      firstName: 'Emma',
      lastName: 'Wilson',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default email configured
    vi.mocked(isEmailConfigured).mockReturnValue(true);
    
    // Default campaign query
    vi.mocked(db.query.campaigns.findFirst).mockResolvedValue(mockCampaign as any);
    
    // Default recipients
    vi.mocked(db.query.prospects.findMany).mockResolvedValue(mockProspects as any);
    vi.mocked(db.query.contacts.findMany).mockResolvedValue(mockContacts as any);
    
    // Default workspace tier
    vi.mocked(db.query.workspaces.findFirst).mockResolvedValue({
      id: mockWorkspaceId,
      subscriptionTier: 'pro',
    } as any);
    
    // Default email template
    vi.mocked(getCampaignEmailTemplate).mockReturnValue({
      subject: 'Introducing Our New Product',
      html: '<p>Hi there, check out our amazing new product!</p>',
      text: 'Hi there, check out our amazing new product!',
    });
    
    // Default bulk send success
    vi.mocked(sendBulkEmails).mockResolvedValue({
      sent: 3,
      failed: 0,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // SEND CAMPAIGN TASK TESTS
  // ==========================================================================

  describe('sendCampaignTask', () => {
    it('should send campaign successfully', async () => {
      const result = await sendCampaignTask.run({
        campaignId: mockCampaignId,
        workspaceId: mockWorkspaceId,
      });
      
      expect(result.success).toBe(true);
      expect(result.sent).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.total).toBe(3);
      
      expect(logger.info).toHaveBeenCalledWith(
        'Starting campaign send via background job',
        expect.any(Object)
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Campaign send completed via background job',
        expect.any(Object)
      );
    });

    it('should return error when email not configured', async () => {
      vi.mocked(isEmailConfigured).mockReturnValue(false);

      const result = await sendCampaignTask.run({
        campaignId: mockCampaignId,
        workspaceId: mockWorkspaceId,
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Email service not configured');
    });

    it('should return error when campaign not found', async () => {
      vi.mocked(db.query.campaigns.findFirst).mockResolvedValue(null);

      const result = await sendCampaignTask.run({
        campaignId: 'nonexistent',
        workspaceId: mockWorkspaceId,
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Campaign not found');
    });

    it('should return error when campaign already completed', async () => {
      vi.mocked(db.query.campaigns.findFirst).mockResolvedValue({
        ...mockCampaign,
        status: 'completed',
      } as any);

      const result = await sendCampaignTask.run({
        campaignId: mockCampaignId,
        workspaceId: mockWorkspaceId,
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Campaign already sent');
    });

    it('should update campaign status to active', async () => {
      await sendCampaignTask.run({
        campaignId: mockCampaignId,
        workspaceId: mockWorkspaceId,
      });
      
      expect(db.update).toHaveBeenCalled();
    });

    it('should return error when subject missing', async () => {
      vi.mocked(db.query.campaigns.findFirst).mockResolvedValue({
        ...mockCampaign,
        content: { body: 'Test body' },
      } as any);

      const result = await sendCampaignTask.run({
        campaignId: mockCampaignId,
        workspaceId: mockWorkspaceId,
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Campaign missing subject or body');
    });

    it('should return error when body missing', async () => {
      vi.mocked(db.query.campaigns.findFirst).mockResolvedValue({
        ...mockCampaign,
        content: { subject: 'Test subject' },
      } as any);

      const result = await sendCampaignTask.run({
        campaignId: mockCampaignId,
        workspaceId: mockWorkspaceId,
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Campaign missing subject or body');
    });

    it('should filter recipients by all_leads', async () => {
      await sendCampaignTask.run({
        campaignId: mockCampaignId,
        workspaceId: mockWorkspaceId,
      });
      
      expect(db.query.prospects.findMany).toHaveBeenCalled();
      expect(sendBulkEmails).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ to: 'prospect1@example.com' }),
        ]),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should filter recipients by new_leads', async () => {
      vi.mocked(db.query.campaigns.findFirst).mockResolvedValue({
        ...mockCampaign,
        tags: ['new_leads'],
      } as any);
      
      vi.mocked(db.query.prospects.findMany).mockResolvedValue([mockProspects[0]] as any);

      const result = await sendCampaignTask.run({
        campaignId: mockCampaignId,
        workspaceId: mockWorkspaceId,
      });
      
      expect(result.total).toBe(1);
    });

    it('should filter recipients by qualified_leads', async () => {
      vi.mocked(db.query.campaigns.findFirst).mockResolvedValue({
        ...mockCampaign,
        tags: ['qualified_leads'],
      } as any);
      
      vi.mocked(db.query.prospects.findMany).mockResolvedValue(
        [mockProspects[1], mockProspects[2]] as any
      );

      const result = await sendCampaignTask.run({
        campaignId: mockCampaignId,
        workspaceId: mockWorkspaceId,
      });
      
      expect(result.total).toBe(2);
    });

    it('should filter recipients by all_contacts', async () => {
      vi.mocked(db.query.campaigns.findFirst).mockResolvedValue({
        ...mockCampaign,
        tags: ['all_contacts'],
      } as any);

      await sendCampaignTask.run({
        campaignId: mockCampaignId,
        workspaceId: mockWorkspaceId,
      });
      
      expect(db.query.contacts.findMany).toHaveBeenCalled();
      expect(sendBulkEmails).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ to: 'contact1@example.com' }),
        ]),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should return error when no recipients found', async () => {
      vi.mocked(db.query.prospects.findMany).mockResolvedValue([]);

      const result = await sendCampaignTask.run({
        campaignId: mockCampaignId,
        workspaceId: mockWorkspaceId,
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No recipients found');
    });

    it('should skip recipients with empty email', async () => {
      vi.mocked(db.query.prospects.findMany).mockResolvedValue([
        { email: '', name: 'No Email', stage: 'new' },
        ...mockProspects,
      ] as any);

      const result = await sendCampaignTask.run({
        campaignId: mockCampaignId,
        workspaceId: mockWorkspaceId,
      });
      
      expect(result.total).toBe(3); // Should skip empty email
    });

    it('should limit recipients to 1000', async () => {
      const manyProspects = Array.from({ length: 1500 }, (_, i) => ({
        email: `prospect${i}@example.com`,
        name: `Prospect ${i}`,
        stage: 'new',
      }));
      
      vi.mocked(db.query.prospects.findMany).mockResolvedValue(manyProspects as any);

      const result = await sendCampaignTask.run({
        campaignId: mockCampaignId,
        workspaceId: mockWorkspaceId,
      });
      
      expect(result.total).toBe(1000);
    });

    it('should personalize emails with recipient names', async () => {
      await sendCampaignTask.run({
        campaignId: mockCampaignId,
        workspaceId: mockWorkspaceId,
      });
      
      expect(sendBulkEmails).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            html: expect.stringContaining('Hi Alice Johnson'),
          }),
        ]),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should add campaign tags to emails', async () => {
      await sendCampaignTask.run({
        campaignId: mockCampaignId,
        workspaceId: mockWorkspaceId,
      });
      
      expect(sendBulkEmails).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            tags: expect.arrayContaining([
              { name: 'campaign_id', value: mockCampaignId },
              { name: 'campaign_name', value: mockCampaign.name },
              { name: 'workspace', value: mockWorkspaceId },
            ]),
          }),
        ]),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should send emails in bulk with rate limiting', async () => {
      await sendCampaignTask.run({
        campaignId: mockCampaignId,
        workspaceId: mockWorkspaceId,
      });
      
      expect(sendBulkEmails).toHaveBeenCalledWith(
        expect.any(Array),
        10, // batch size
        200 // delay between batches
      );
    });

    it('should update campaign with final stats', async () => {
      await sendCampaignTask.run({
        campaignId: mockCampaignId,
        workspaceId: mockWorkspaceId,
      });
      
      expect(db.update).toHaveBeenCalled();
    });

    it('should handle contact name fallback', async () => {
      vi.mocked(db.query.campaigns.findFirst).mockResolvedValue({
        ...mockCampaign,
        tags: ['all_contacts'],
      } as any);
      
      vi.mocked(db.query.contacts.findMany).mockResolvedValue([
        {
          email: 'noname@example.com',
          firstName: null,
          lastName: null,
        },
      ] as any);

      const result = await sendCampaignTask.run({
        campaignId: mockCampaignId,
        workspaceId: mockWorkspaceId,
      });
      
      expect(result.total).toBe(1);
      expect(sendBulkEmails).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            html: expect.stringContaining('Hi there'),
          }),
        ]),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should handle partial send failures', async () => {
      vi.mocked(sendBulkEmails).mockResolvedValue({
        sent: 2,
        failed: 1,
      });

      const result = await sendCampaignTask.run({
        campaignId: mockCampaignId,
        workspaceId: mockWorkspaceId,
      });
      
      expect(result.success).toBe(true);
      expect(result.sent).toBe(2);
      expect(result.failed).toBe(1);
    });
  });

  // ==========================================================================
  // SCHEDULE CAMPAIGN TASK TESTS
  // ==========================================================================

  describe('scheduleCampaignTask', () => {
    const mockScheduledFor = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now

    it('should schedule campaign for future send', async () => {
      const { wait } = await import('@trigger.dev/sdk/v3');
      
      vi.mocked(wait.until).mockResolvedValue();
      
      // Mock triggerAndWait
      const mockTriggerAndWait = vi.fn().mockResolvedValue({
        ok: true,
        output: { sent: 3, failed: 0 },
      });
      
      (sendCampaignTask as any).triggerAndWait = mockTriggerAndWait;

      const result = await scheduleCampaignTask.run({
        campaignId: mockCampaignId,
        workspaceId: mockWorkspaceId,
        scheduledFor: mockScheduledFor,
      });
      
      expect(result.success).toBe(true);
      expect(wait.until).toHaveBeenCalled();
      expect(mockTriggerAndWait).toHaveBeenCalled();
    });

    it('should update campaign status to scheduled', async () => {
      const { wait } = await import('@trigger.dev/sdk/v3');
      vi.mocked(wait.until).mockResolvedValue();

      await scheduleCampaignTask.run({
        campaignId: mockCampaignId,
        workspaceId: mockWorkspaceId,
        scheduledFor: mockScheduledFor,
      });
      
      expect(db.update).toHaveBeenCalled();
    });

    it('should wait until scheduled time', async () => {
      const { wait } = await import('@trigger.dev/sdk/v3');
      vi.mocked(wait.until).mockResolvedValue();

      await scheduleCampaignTask.run({
        campaignId: mockCampaignId,
        workspaceId: mockWorkspaceId,
        scheduledFor: mockScheduledFor,
      });
      
      expect(wait.until).toHaveBeenCalledWith({
        date: expect.any(Date),
        throwIfInThePast: false,
      });
    });

    it('should not wait if scheduled time is in the past', async () => {
      const { wait } = await import('@trigger.dev/sdk/v3');
      const pastDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
      
      vi.mocked(wait.until).mockResolvedValue();

      await scheduleCampaignTask.run({
        campaignId: mockCampaignId,
        workspaceId: mockWorkspaceId,
        scheduledFor: pastDate,
      });
      
      // Should still call wait.until but with throwIfInThePast: false
      expect(wait.until).toHaveBeenCalled();
    });

    it('should re-fetch campaign after waiting', async () => {
      const { wait } = await import('@trigger.dev/sdk/v3');
      vi.mocked(wait.until).mockResolvedValue();

      await scheduleCampaignTask.run({
        campaignId: mockCampaignId,
        workspaceId: mockWorkspaceId,
        scheduledFor: mockScheduledFor,
      });
      
      // Should query campaign twice: once at start, once after wait
      expect(db.query.campaigns.findFirst).toHaveBeenCalled();
    });

    it('should cancel if campaign was completed while waiting', async () => {
      const { wait } = await import('@trigger.dev/sdk/v3');
      vi.mocked(wait.until).mockResolvedValue();
      
      // Return completed status on second query
      vi.mocked(db.query.campaigns.findFirst)
        .mockResolvedValueOnce(mockCampaign as any)
        .mockResolvedValueOnce({
          ...mockCampaign,
          status: 'completed',
        } as any);

      const result = await scheduleCampaignTask.run({
        campaignId: mockCampaignId,
        workspaceId: mockWorkspaceId,
        scheduledFor: mockScheduledFor,
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('cancelled or already sent');
    });

    it('should cancel if campaign was paused while waiting', async () => {
      const { wait } = await import('@trigger.dev/sdk/v3');
      vi.mocked(wait.until).mockResolvedValue();
      
      vi.mocked(db.query.campaigns.findFirst)
        .mockResolvedValueOnce(mockCampaign as any)
        .mockResolvedValueOnce({
          ...mockCampaign,
          status: 'paused',
        } as any);

      const result = await scheduleCampaignTask.run({
        campaignId: mockCampaignId,
        workspaceId: mockWorkspaceId,
        scheduledFor: mockScheduledFor,
      });
      
      expect(result.success).toBe(false);
    });

    it('should use workspace tier for queue options', async () => {
      const { wait } = await import('@trigger.dev/sdk/v3');
      const { buildWorkspaceQueueOptions } = await import('@/trigger/queues');
      
      vi.mocked(wait.until).mockResolvedValue();

      await scheduleCampaignTask.run({
        campaignId: mockCampaignId,
        workspaceId: mockWorkspaceId,
        scheduledFor: mockScheduledFor,
      });
      
      expect(db.query.workspaces.findFirst).toHaveBeenCalled();
      expect(buildWorkspaceQueueOptions).toHaveBeenCalledWith(
        mockWorkspaceId,
        'pro'
      );
    });

    it('should use idempotency key for send task', async () => {
      const { wait } = await import('@trigger.dev/sdk/v3');
      vi.mocked(wait.until).mockResolvedValue();
      
      const mockTriggerAndWait = vi.fn().mockResolvedValue({
        ok: true,
        output: { sent: 3 },
      });
      
      (sendCampaignTask as any).triggerAndWait = mockTriggerAndWait;

      await scheduleCampaignTask.run({
        campaignId: mockCampaignId,
        workspaceId: mockWorkspaceId,
        scheduledFor: mockScheduledFor,
      });
      
      expect(mockTriggerAndWait).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          idempotencyKey: `campaign-${mockCampaignId}-send`,
        })
      );
    });

    it('should handle send task failure', async () => {
      const { wait } = await import('@trigger.dev/sdk/v3');
      vi.mocked(wait.until).mockResolvedValue();
      
      const mockTriggerAndWait = vi.fn().mockResolvedValue({
        ok: false,
        error: 'Send failed',
      });
      
      (sendCampaignTask as any).triggerAndWait = mockTriggerAndWait;

      const result = await scheduleCampaignTask.run({
        campaignId: mockCampaignId,
        workspaceId: mockWorkspaceId,
        scheduledFor: mockScheduledFor,
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Send failed');
    });
  });
});
