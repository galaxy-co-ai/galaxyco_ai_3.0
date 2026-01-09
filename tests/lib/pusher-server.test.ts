/**
 * Tests for Pusher Server Module
 * 
 * Tests real-time event broadcasting, channel management, authentication,
 * and error handling for the Pusher WebSocket infrastructure.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  isPusherConfigured,
  getWorkspaceChannel,
  getUserChannel,
  getPresenceChannel,
  triggerWorkspaceEvent,
  triggerUserEvent,
  triggerBatchEvents,
  broadcastActivity,
  sendNotification,
  broadcastLeadUpdate,
  broadcastDealUpdate,
  broadcastAgentStatus,
  broadcastCampaignStatus,
  authenticateChannel,
} from '@/lib/pusher-server';
import { logger } from '@/lib/logger';

// Mock Pusher
const mockTrigger = vi.fn();
const mockTriggerBatch = vi.fn();
const mockAuthorizeChannel = vi.fn();

const mockPusherInstance = {
  trigger: mockTrigger,
  triggerBatch: mockTriggerBatch,
  authorizeChannel: mockAuthorizeChannel,
};

vi.mock('pusher', () => {
  return {
    default: class MockPusher {
      constructor() {
        return mockPusherInstance;
      }
    },
  };
});

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('pusher-server', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    // Set valid Pusher config by default
    process.env.PUSHER_APP_ID = 'test-app-id';
    process.env.PUSHER_KEY = 'test-key';
    process.env.PUSHER_SECRET = 'test-secret';
    process.env.PUSHER_CLUSTER = 'us2';
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('isPusherConfigured', () => {
    it('should return true when all Pusher env vars are set', () => {
      const result = isPusherConfigured();

      expect(result).toBe(true);
    });

    it('should return false when PUSHER_APP_ID is missing', () => {
      delete process.env.PUSHER_APP_ID;

      const result = isPusherConfigured();

      expect(result).toBe(false);
    });

    it('should return false when PUSHER_KEY is missing', () => {
      delete process.env.PUSHER_KEY;

      const result = isPusherConfigured();

      expect(result).toBe(false);
    });

    it('should return false when PUSHER_SECRET is missing', () => {
      delete process.env.PUSHER_SECRET;

      const result = isPusherConfigured();

      expect(result).toBe(false);
    });

    it('should return false when all Pusher env vars are missing', () => {
      delete process.env.PUSHER_APP_ID;
      delete process.env.PUSHER_KEY;
      delete process.env.PUSHER_SECRET;

      const result = isPusherConfigured();

      expect(result).toBe(false);
    });
  });

  describe('getWorkspaceChannel', () => {
    it('should return formatted workspace channel name', () => {
      const result = getWorkspaceChannel('workspace-123');

      expect(result).toBe('private-workspace-workspace-123');
    });

    it('should handle different workspace IDs', () => {
      expect(getWorkspaceChannel('ws-456')).toBe('private-workspace-ws-456');
      expect(getWorkspaceChannel('abc')).toBe('private-workspace-abc');
    });
  });

  describe('getUserChannel', () => {
    it('should return formatted user channel name', () => {
      const result = getUserChannel('user-123');

      expect(result).toBe('private-user-user-123');
    });

    it('should handle different user IDs', () => {
      expect(getUserChannel('usr-789')).toBe('private-user-usr-789');
      expect(getUserChannel('xyz')).toBe('private-user-xyz');
    });
  });

  describe('getPresenceChannel', () => {
    it('should return formatted presence channel name', () => {
      const result = getPresenceChannel('workspace-123');

      expect(result).toBe('presence-workspace-workspace-123');
    });

    it('should handle different workspace IDs', () => {
      expect(getPresenceChannel('ws-456')).toBe('presence-workspace-ws-456');
      expect(getPresenceChannel('abc')).toBe('presence-workspace-abc');
    });
  });

  describe('triggerWorkspaceEvent', () => {
    it('should return false when Pusher is not configured', async () => {
      delete process.env.PUSHER_APP_ID;

      const result = await triggerWorkspaceEvent(
        'workspace-123',
        'activity:new',
        { title: 'Test' }
      );

      expect(result).toBe(false);
      expect(mockTrigger).not.toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith(
        '[Pusher] Not configured - skipping event',
        { eventType: 'activity:new' }
      );
    });

    it('should trigger workspace event successfully', async () => {
      mockTrigger.mockResolvedValue(undefined);

      const result = await triggerWorkspaceEvent(
        'workspace-123',
        'activity:new',
        { title: 'New Activity', description: 'Test description' }
      );

      expect(result).toBe(true);
      expect(mockTrigger).toHaveBeenCalledWith(
        'private-workspace-workspace-123',
        'activity:new',
        expect.objectContaining({
          type: 'activity:new',
          data: { title: 'New Activity', description: 'Test description' },
          workspaceId: 'workspace-123',
          timestamp: expect.any(String),
        })
      );
      expect(logger.debug).toHaveBeenCalledWith(
        '[Pusher] Event triggered',
        { channel: 'private-workspace-workspace-123', eventType: 'activity:new' }
      );
    });

    it('should handle trigger errors gracefully', async () => {
      mockTrigger.mockRejectedValue(new Error('Pusher API error'));

      const result = await triggerWorkspaceEvent(
        'workspace-123',
        'activity:new',
        { title: 'Test' }
      );

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        '[Pusher] Failed to trigger event',
        {
          error: 'Pusher API error',
          eventType: 'activity:new',
        }
      );
    });

    it('should include timestamp in ISO format', async () => {
      mockTrigger.mockResolvedValue(undefined);
      const beforeTime = new Date().toISOString();

      await triggerWorkspaceEvent('workspace-123', 'lead:created', {
        id: 'lead-1',
        name: 'Test Lead',
      });

      const callArgs = mockTrigger.mock.calls[0];
      const event = callArgs[2];
      const afterTime = new Date().toISOString();

      expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(event.timestamp >= beforeTime).toBe(true);
      expect(event.timestamp <= afterTime).toBe(true);
    });

    it('should handle different event types', async () => {
      mockTrigger.mockResolvedValue(undefined);

      await triggerWorkspaceEvent('ws-1', 'lead:scored', { score: 85 });
      await triggerWorkspaceEvent('ws-2', 'deal:won', { value: 50000 });
      await triggerWorkspaceEvent('ws-3', 'campaign:sent', { sentCount: 100 });

      expect(mockTrigger).toHaveBeenCalledTimes(3);
      expect(mockTrigger.mock.calls[0][1]).toBe('lead:scored');
      expect(mockTrigger.mock.calls[1][1]).toBe('deal:won');
      expect(mockTrigger.mock.calls[2][1]).toBe('campaign:sent');
    });
  });

  describe('triggerUserEvent', () => {
    it('should return false when Pusher is not configured', async () => {
      delete process.env.PUSHER_KEY;

      const result = await triggerUserEvent('user-123', 'notification:new', {
        title: 'Test',
      });

      expect(result).toBe(false);
      expect(mockTrigger).not.toHaveBeenCalled();
    });

    it('should trigger user event successfully', async () => {
      mockTrigger.mockResolvedValue(undefined);

      const result = await triggerUserEvent('user-123', 'notification:new', {
        id: 'notif-1',
        title: 'New Notification',
        message: 'You have a new message',
      });

      expect(result).toBe(true);
      expect(mockTrigger).toHaveBeenCalledWith(
        'private-user-user-123',
        'notification:new',
        expect.objectContaining({
          type: 'notification:new',
          data: {
            id: 'notif-1',
            title: 'New Notification',
            message: 'You have a new message',
          },
          userId: 'user-123',
          timestamp: expect.any(String),
        })
      );
      expect(logger.debug).toHaveBeenCalledWith(
        '[Pusher] User event triggered',
        { channel: 'private-user-user-123', eventType: 'notification:new' }
      );
    });

    it('should handle user event errors gracefully', async () => {
      mockTrigger.mockRejectedValue(new Error('Network error'));

      const result = await triggerUserEvent('user-123', 'notification:new', {
        title: 'Test',
      });

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        '[Pusher] Failed to trigger user event',
        {
          error: 'Network error',
          eventType: 'notification:new',
        }
      );
    });
  });

  describe('triggerBatchEvents', () => {
    it('should return false when Pusher is not configured', async () => {
      delete process.env.PUSHER_SECRET;

      const result = await triggerBatchEvents([
        {
          channel: 'private-workspace-ws-1',
          eventType: 'activity:new',
          data: { title: 'Test' },
        },
      ]);

      expect(result).toBe(false);
      expect(mockTriggerBatch).not.toHaveBeenCalled();
    });

    it('should return false when events array is empty', async () => {
      const result = await triggerBatchEvents([]);

      expect(result).toBe(false);
      expect(mockTriggerBatch).not.toHaveBeenCalled();
    });

    it('should trigger batch events successfully', async () => {
      mockTriggerBatch.mockResolvedValue(undefined);

      const events = [
        {
          channel: 'private-workspace-ws-1',
          eventType: 'lead:created' as const,
          data: { id: 'lead-1', name: 'Lead 1' },
        },
        {
          channel: 'private-workspace-ws-1',
          eventType: 'deal:updated' as const,
          data: { id: 'deal-1', stage: 'negotiation' },
        },
        {
          channel: 'private-user-user-123',
          eventType: 'notification:new' as const,
          data: { title: 'Update' },
        },
      ];

      const result = await triggerBatchEvents(events);

      expect(result).toBe(true);
      expect(mockTriggerBatch).toHaveBeenCalledWith([
        {
          channel: 'private-workspace-ws-1',
          name: 'lead:created',
          data: expect.objectContaining({
            type: 'lead:created',
            data: { id: 'lead-1', name: 'Lead 1' },
            timestamp: expect.any(String),
          }),
        },
        {
          channel: 'private-workspace-ws-1',
          name: 'deal:updated',
          data: expect.objectContaining({
            type: 'deal:updated',
            data: { id: 'deal-1', stage: 'negotiation' },
            timestamp: expect.any(String),
          }),
        },
        {
          channel: 'private-user-user-123',
          name: 'notification:new',
          data: expect.objectContaining({
            type: 'notification:new',
            data: { title: 'Update' },
            timestamp: expect.any(String),
          }),
        },
      ]);
      expect(logger.debug).toHaveBeenCalledWith(
        '[Pusher] Batch events triggered',
        { count: 3 }
      );
    });

    it('should handle batch event errors gracefully', async () => {
      mockTriggerBatch.mockRejectedValue(new Error('Rate limit exceeded'));

      const result = await triggerBatchEvents([
        {
          channel: 'private-workspace-ws-1',
          eventType: 'activity:new',
          data: { title: 'Test' },
        },
      ]);

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        '[Pusher] Failed to trigger batch events',
        {
          error: 'Rate limit exceeded',
        }
      );
    });

    it('should format all events with timestamps', async () => {
      mockTriggerBatch.mockResolvedValue(undefined);

      const events = [
        {
          channel: 'private-workspace-ws-1',
          eventType: 'activity:new' as const,
          data: { title: 'Event 1' },
        },
        {
          channel: 'private-workspace-ws-1',
          eventType: 'activity:new' as const,
          data: { title: 'Event 2' },
        },
      ];

      await triggerBatchEvents(events);

      const callArgs = mockTriggerBatch.mock.calls[0][0];
      expect(callArgs).toHaveLength(2);
      expect(callArgs[0].data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(callArgs[1].data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('broadcastActivity', () => {
    it('should broadcast activity with all fields', async () => {
      mockTrigger.mockResolvedValue(undefined);

      const activity = {
        id: 'activity-1',
        type: 'lead_created',
        title: 'New Lead Created',
        description: 'John Doe from Acme Corp',
        entityType: 'lead',
        entityId: 'lead-123',
        userId: 'user-456',
        userName: 'Jane Smith',
        metadata: { source: 'web_form' },
      };

      const result = await broadcastActivity('workspace-123', activity);

      expect(result).toBe(true);
      expect(mockTrigger).toHaveBeenCalledWith(
        'private-workspace-workspace-123',
        'activity:new',
        expect.objectContaining({
          type: 'activity:new',
          data: activity,
          workspaceId: 'workspace-123',
        })
      );
    });

    it('should broadcast activity with minimal fields', async () => {
      mockTrigger.mockResolvedValue(undefined);

      const activity = {
        id: 'activity-2',
        type: 'deal_updated',
        title: 'Deal Updated',
      };

      const result = await broadcastActivity('workspace-456', activity);

      expect(result).toBe(true);
      expect(mockTrigger).toHaveBeenCalledWith(
        'private-workspace-workspace-456',
        'activity:new',
        expect.objectContaining({
          data: activity,
        })
      );
    });
  });

  describe('sendNotification', () => {
    it('should send notification with all fields', async () => {
      mockTrigger.mockResolvedValue(undefined);

      const notification = {
        id: 'notif-1',
        title: 'Deal Won',
        message: 'Congratulations! You closed the Acme Corp deal',
        type: 'success' as const,
        actionUrl: '/deals/123',
        actionLabel: 'View Deal',
      };

      const result = await sendNotification('user-123', notification);

      expect(result).toBe(true);
      expect(mockTrigger).toHaveBeenCalledWith(
        'private-user-user-123',
        'notification:new',
        expect.objectContaining({
          type: 'notification:new',
          data: notification,
          userId: 'user-123',
        })
      );
    });

    it('should send notification with minimal fields', async () => {
      mockTrigger.mockResolvedValue(undefined);

      const notification = {
        id: 'notif-2',
        title: 'System Update',
        message: 'Your profile was updated',
        type: 'info' as const,
      };

      const result = await sendNotification('user-456', notification);

      expect(result).toBe(true);
      expect(mockTrigger).toHaveBeenCalledWith(
        'private-user-user-456',
        'notification:new',
        expect.objectContaining({
          data: notification,
        })
      );
    });

    it('should handle different notification types', async () => {
      mockTrigger.mockResolvedValue(undefined);

      const types: Array<'info' | 'success' | 'warning' | 'error'> = [
        'info',
        'success',
        'warning',
        'error',
      ];

      for (const type of types) {
        await sendNotification('user-123', {
          id: `notif-${type}`,
          title: 'Test',
          message: 'Test message',
          type,
        });
      }

      expect(mockTrigger).toHaveBeenCalledTimes(4);
    });
  });

  describe('broadcastLeadUpdate', () => {
    it('should broadcast lead creation', async () => {
      mockTrigger.mockResolvedValue(undefined);

      const lead = {
        id: 'lead-1',
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Acme Corp',
        stage: 'new',
        score: 75,
      };

      const result = await broadcastLeadUpdate('workspace-123', 'created', lead);

      expect(result).toBe(true);
      expect(mockTrigger).toHaveBeenCalledWith(
        'private-workspace-workspace-123',
        'lead:created',
        expect.objectContaining({
          type: 'lead:created',
          data: lead,
        })
      );
    });

    it('should broadcast lead update', async () => {
      mockTrigger.mockResolvedValue(undefined);

      const lead = {
        id: 'lead-2',
        name: 'Jane Smith',
        stage: 'qualified',
      };

      const result = await broadcastLeadUpdate('workspace-456', 'updated', lead);

      expect(result).toBe(true);
      expect(mockTrigger).toHaveBeenCalledWith(
        'private-workspace-workspace-456',
        'lead:updated',
        expect.objectContaining({
          type: 'lead:updated',
          data: lead,
        })
      );
    });

    it('should broadcast lead scored', async () => {
      mockTrigger.mockResolvedValue(undefined);

      const lead = {
        id: 'lead-3',
        name: 'Bob Johnson',
        score: 90,
      };

      const result = await broadcastLeadUpdate('workspace-789', 'scored', lead);

      expect(result).toBe(true);
      expect(mockTrigger).toHaveBeenCalledWith(
        'private-workspace-workspace-789',
        'lead:scored',
        expect.objectContaining({
          type: 'lead:scored',
          data: lead,
        })
      );
    });
  });

  describe('broadcastDealUpdate', () => {
    it('should broadcast deal creation', async () => {
      mockTrigger.mockResolvedValue(undefined);

      const deal = {
        id: 'deal-1',
        name: 'Acme Corp Enterprise License',
        value: 50000,
        stage: 'proposal',
        company: 'Acme Corp',
      };

      const result = await broadcastDealUpdate('workspace-123', 'created', deal);

      expect(result).toBe(true);
      expect(mockTrigger).toHaveBeenCalledWith(
        'private-workspace-workspace-123',
        'deal:created',
        expect.objectContaining({
          type: 'deal:created',
          data: deal,
        })
      );
    });

    it('should broadcast deal won', async () => {
      mockTrigger.mockResolvedValue(undefined);

      const deal = {
        id: 'deal-2',
        name: 'BigCo Partnership',
        value: 100000,
        stage: 'closed_won',
      };

      const result = await broadcastDealUpdate('workspace-456', 'won', deal);

      expect(result).toBe(true);
      expect(mockTrigger).toHaveBeenCalledWith(
        'private-workspace-workspace-456',
        'deal:won',
        expect.objectContaining({
          type: 'deal:won',
          data: deal,
        })
      );
    });

    it('should broadcast deal lost', async () => {
      mockTrigger.mockResolvedValue(undefined);

      const deal = {
        id: 'deal-3',
        name: 'Failed Deal',
        stage: 'closed_lost',
      };

      const result = await broadcastDealUpdate('workspace-789', 'lost', deal);

      expect(result).toBe(true);
      expect(mockTrigger).toHaveBeenCalledWith(
        'private-workspace-workspace-789',
        'deal:lost',
        expect.objectContaining({
          type: 'deal:lost',
          data: deal,
        })
      );
    });
  });

  describe('broadcastAgentStatus', () => {
    it('should broadcast agent started', async () => {
      mockTrigger.mockResolvedValue(undefined);

      const agent = {
        id: 'agent-1',
        name: 'Lead Scorer',
        executionId: 'exec-123',
      };

      const result = await broadcastAgentStatus('workspace-123', 'started', agent);

      expect(result).toBe(true);
      expect(mockTrigger).toHaveBeenCalledWith(
        'private-workspace-workspace-123',
        'agent:started',
        expect.objectContaining({
          type: 'agent:started',
          data: agent,
        })
      );
    });

    it('should broadcast agent completed with results', async () => {
      mockTrigger.mockResolvedValue(undefined);

      const agent = {
        id: 'agent-2',
        name: 'Data Enrichment',
        executionId: 'exec-456',
        results: {
          enrichedCount: 50,
          skippedCount: 5,
        },
      };

      const result = await broadcastAgentStatus('workspace-456', 'completed', agent);

      expect(result).toBe(true);
      expect(mockTrigger).toHaveBeenCalledWith(
        'private-workspace-workspace-456',
        'agent:completed',
        expect.objectContaining({
          type: 'agent:completed',
          data: agent,
        })
      );
    });

    it('should broadcast agent failed with error', async () => {
      mockTrigger.mockResolvedValue(undefined);

      const agent = {
        id: 'agent-3',
        name: 'Email Campaign',
        executionId: 'exec-789',
        error: 'API rate limit exceeded',
      };

      const result = await broadcastAgentStatus('workspace-789', 'failed', agent);

      expect(result).toBe(true);
      expect(mockTrigger).toHaveBeenCalledWith(
        'private-workspace-workspace-789',
        'agent:failed',
        expect.objectContaining({
          type: 'agent:failed',
          data: agent,
        })
      );
    });
  });

  describe('broadcastCampaignStatus', () => {
    it('should broadcast campaign sent', async () => {
      mockTrigger.mockResolvedValue(undefined);

      const campaign = {
        id: 'campaign-1',
        name: 'Q4 Newsletter',
        sentCount: 1000,
        failedCount: 5,
      };

      const result = await broadcastCampaignStatus('workspace-123', 'sent', campaign);

      expect(result).toBe(true);
      expect(mockTrigger).toHaveBeenCalledWith(
        'private-workspace-workspace-123',
        'campaign:sent',
        expect.objectContaining({
          type: 'campaign:sent',
          data: campaign,
        })
      );
    });

    it('should broadcast campaign completed', async () => {
      mockTrigger.mockResolvedValue(undefined);

      const campaign = {
        id: 'campaign-2',
        name: 'Product Launch',
        sentCount: 5000,
        failedCount: 10,
      };

      const result = await broadcastCampaignStatus(
        'workspace-456',
        'completed',
        campaign
      );

      expect(result).toBe(true);
      expect(mockTrigger).toHaveBeenCalledWith(
        'private-workspace-workspace-456',
        'campaign:completed',
        expect.objectContaining({
          type: 'campaign:completed',
          data: campaign,
        })
      );
    });

    it('should broadcast campaign with minimal data', async () => {
      mockTrigger.mockResolvedValue(undefined);

      const campaign = {
        id: 'campaign-3',
        name: 'Welcome Series',
      };

      const result = await broadcastCampaignStatus('workspace-789', 'sent', campaign);

      expect(result).toBe(true);
      expect(mockTrigger).toHaveBeenCalledWith(
        'private-workspace-workspace-789',
        'campaign:sent',
        expect.objectContaining({
          data: campaign,
        })
      );
    });
  });

  describe('authenticateChannel', () => {
    it('should authenticate private channel without user data', () => {
      mockAuthorizeChannel.mockReturnValue({ auth: 'auth-signature-123' });

      const result = authenticateChannel('socket-123', 'private-workspace-ws-1');

      expect(result).toEqual({ auth: 'auth-signature-123' });
      expect(mockAuthorizeChannel).toHaveBeenCalledWith(
        'socket-123',
        'private-workspace-ws-1'
      );
    });

    it('should authenticate presence channel with user data', () => {
      mockAuthorizeChannel.mockReturnValue({
        auth: 'auth-signature-456',
        channel_data: 'user-data-encoded',
      });

      const result = authenticateChannel(
        'socket-456',
        'presence-workspace-ws-1',
        'user-123',
        { name: 'John Doe', avatar: 'https://example.com/avatar.jpg' }
      );

      expect(result).toEqual({
        auth: 'auth-signature-456',
        channel_data: 'user-data-encoded',
      });
      expect(mockAuthorizeChannel).toHaveBeenCalledWith(
        'socket-456',
        'presence-workspace-ws-1',
        {
          user_id: 'user-123',
          user_info: { name: 'John Doe', avatar: 'https://example.com/avatar.jpg' },
        }
      );
    });

    it('should authenticate presence channel without user info', () => {
      mockAuthorizeChannel.mockReturnValue({
        auth: 'auth-signature-789',
        channel_data: 'user-data-encoded',
      });

      const result = authenticateChannel(
        'socket-789',
        'presence-workspace-ws-1',
        'user-456'
      );

      expect(result).toEqual({
        auth: 'auth-signature-789',
        channel_data: 'user-data-encoded',
      });
      expect(mockAuthorizeChannel).toHaveBeenCalledWith(
        'socket-789',
        'presence-workspace-ws-1',
        {
          user_id: 'user-456',
          user_info: {},
        }
      );
    });

    it('should not include user data for non-presence channels', () => {
      mockAuthorizeChannel.mockReturnValue({ auth: 'auth-signature-abc' });

      authenticateChannel(
        'socket-abc',
        'private-user-user-123',
        'user-123',
        { name: 'John Doe' }
      );

      expect(mockAuthorizeChannel).toHaveBeenCalledWith(
        'socket-abc',
        'private-user-user-123'
      );
    });
  });
});
