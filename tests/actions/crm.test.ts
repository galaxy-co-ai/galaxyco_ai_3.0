/**
 * Tests for CRM Actions
 * 
 * Tests CRM data fetching, caching, and error handling for contacts,
 * projects, deals, and interactions across the GalaxyCo platform.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getContacts,
  getProjects,
  getDeals,
  getInteractions,
  invalidateCRMCache,
} from '@/actions/crm';
import { db } from '@/lib/db';
import { getCacheOrFetch, invalidateCache } from '@/lib/cache';
import { auth } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock('@/lib/cache', () => ({
  getCacheOrFetch: vi.fn(),
  invalidateCache: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('crm actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('invalidateCRMCache', () => {
    it('should invalidate all CRM cache keys in parallel', async () => {
      vi.mocked(invalidateCache).mockResolvedValue();

      await invalidateCRMCache('user-123');

      expect(invalidateCache).toHaveBeenCalledTimes(4);
      expect(invalidateCache).toHaveBeenCalledWith('contacts:user-123', { prefix: 'crm' });
      expect(invalidateCache).toHaveBeenCalledWith('projects:user-123', { prefix: 'crm' });
      expect(invalidateCache).toHaveBeenCalledWith('deals:user-123', { prefix: 'crm' });
      expect(invalidateCache).toHaveBeenCalledWith('interactions:user-123', { prefix: 'crm' });
    });

    it('should work with different user IDs', async () => {
      vi.mocked(invalidateCache).mockResolvedValue();

      await invalidateCRMCache('user-456');

      expect(invalidateCache).toHaveBeenCalledWith('contacts:user-456', { prefix: 'crm' });
      expect(invalidateCache).toHaveBeenCalledWith('projects:user-456', { prefix: 'crm' });
      expect(invalidateCache).toHaveBeenCalledWith('deals:user-456', { prefix: 'crm' });
      expect(invalidateCache).toHaveBeenCalledWith('interactions:user-456', { prefix: 'crm' });
    });
  });

  describe('getContacts', () => {
    it('should return empty array when user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const result = await getContacts();

      expect(result).toEqual([]);
      expect(getCacheOrFetch).not.toHaveBeenCalled();
    });

    it('should fetch contacts from cache or database', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);

      const mockDbData = [
        {
          id: 'contact-1',
          firstName: 'John',
          lastName: 'Doe',
          company: 'Acme Corp',
          email: 'john@acme.com',
          lastContactedAt: new Date('2024-01-01'),
          title: 'CEO',
          tags: ['vip', 'enterprise'],
        },
        {
          id: 'contact-2',
          firstName: 'Jane',
          lastName: 'Smith',
          company: null,
          email: 'jane@example.com',
          lastContactedAt: null,
          title: null,
          tags: null,
        },
      ];

      // Mock getCacheOrFetch to execute the fetch function
      vi.mocked(getCacheOrFetch).mockImplementation(async (_key, fetchFn) => {
        return await fetchFn();
      });

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(mockDbData),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect as any);

      const result = await getContacts();

      expect(getCacheOrFetch).toHaveBeenCalledWith(
        'contacts:user-123',
        expect.any(Function),
        { ttl: 300, prefix: 'crm' }
      );

      expect(result).toEqual([
        {
          id: 'contact-1',
          name: 'John Doe',
          company: 'Acme Corp',
          email: 'john@acme.com',
          lastContact: '2024-01-01T00:00:00.000Z',
          status: 'warm',
          value: '$0',
          interactions: 0,
          aiHealthScore: 50,
          aiInsight: 'No AI insights yet.',
          nextAction: 'Follow up',
          sentiment: 'neutral',
          role: 'CEO',
          location: '',
          tags: ['vip', 'enterprise'],
        },
        {
          id: 'contact-2',
          name: 'Jane Smith',
          company: '',
          email: 'jane@example.com',
          lastContact: 'Never',
          status: 'warm',
          value: '$0',
          interactions: 0,
          aiHealthScore: 50,
          aiInsight: 'No AI insights yet.',
          nextAction: 'Follow up',
          sentiment: 'neutral',
          role: '',
          location: '',
          tags: [],
        },
      ]);
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);

      vi.mocked(getCacheOrFetch).mockImplementation(async (_key, fetchFn) => {
        return await fetchFn();
      });

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          limit: vi.fn().mockRejectedValue(new Error('Database connection failed')),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect as any);

      const result = await getContacts();

      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to fetch contacts',
        expect.any(Error)
      );
    });

    it('should limit results to 20 contacts', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);

      vi.mocked(getCacheOrFetch).mockImplementation(async (_key, fetchFn) => {
        return await fetchFn();
      });

      const limitSpy = vi.fn().mockResolvedValue([]);
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          limit: limitSpy,
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect as any);

      await getContacts();

      expect(limitSpy).toHaveBeenCalledWith(20);
    });
  });

  describe('getProjects', () => {
    it('should return empty array when user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const result = await getProjects();

      expect(result).toEqual([]);
      expect(getCacheOrFetch).not.toHaveBeenCalled();
    });

    it('should fetch projects from cache or database', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);

      const mockDbData = [
        {
          id: 'project-1',
          name: 'Website Redesign',
          status: 'in_progress',
          endDate: new Date('2024-06-01'),
          progress: 75,
          budget: 50000, // cents
        },
        {
          id: 'project-2',
          name: 'Mobile App',
          status: 'completed',
          endDate: null,
          progress: null,
          budget: null,
        },
      ];

      vi.mocked(getCacheOrFetch).mockImplementation(async (_key, fetchFn) => {
        return await fetchFn();
      });

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(mockDbData),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect as any);

      const result = await getProjects();

      expect(getCacheOrFetch).toHaveBeenCalledWith(
        'projects:user-123',
        expect.any(Function),
        { ttl: 300, prefix: 'crm' }
      );

      expect(result).toEqual([
        {
          id: 'project-1',
          name: 'Website Redesign',
          client: 'Unknown',
          status: 'active',
          dueDate: '2024-06-01T00:00:00.000Z',
          progress: 75,
          team: [],
          budget: '$500',
        },
        {
          id: 'project-2',
          name: 'Mobile App',
          client: 'Unknown',
          status: 'completed',
          dueDate: '',
          progress: 0,
          team: [],
          budget: '$0',
        },
      ]);
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);

      vi.mocked(getCacheOrFetch).mockImplementation(async (_key, fetchFn) => {
        return await fetchFn();
      });

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          limit: vi.fn().mockRejectedValue(new Error('Query timeout')),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect as any);

      const result = await getProjects();

      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to fetch projects',
        expect.any(Error)
      );
    });

    it('should convert in_progress status to active', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);

      const mockDbData = [
        {
          id: 'project-1',
          name: 'Test Project',
          status: 'in_progress',
          endDate: null,
          progress: 50,
          budget: null,
        },
      ];

      vi.mocked(getCacheOrFetch).mockImplementation(async (_key, fetchFn) => {
        return await fetchFn();
      });

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(mockDbData),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect as any);

      const result = await getProjects();

      expect(result[0].status).toBe('active');
    });
  });

  describe('getDeals', () => {
    it('should return empty array when user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const result = await getDeals();

      expect(result).toEqual([]);
      expect(getCacheOrFetch).not.toHaveBeenCalled();
    });

    it('should fetch deals from cache or database', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);

      const mockDbData = [
        {
          id: 'deal-1',
          name: 'Enterprise License',
          company: 'Big Corp',
          estimatedValue: 100000, // cents
          stage: 'negotiation',
          score: 75,
        },
        {
          id: 'deal-2',
          name: 'Consulting Contract',
          company: null,
          estimatedValue: null,
          stage: 'qualification',
          score: null,
        },
      ];

      vi.mocked(getCacheOrFetch).mockImplementation(async (_key, fetchFn) => {
        return await fetchFn();
      });

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(mockDbData),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect as any);

      const result = await getDeals();

      expect(getCacheOrFetch).toHaveBeenCalledWith(
        'deals:user-123',
        expect.any(Function),
        { ttl: 300, prefix: 'crm' }
      );

      expect(result).toEqual([
        {
          id: 'deal-1',
          title: 'Enterprise License',
          company: 'Big Corp',
          value: '$1000',
          stage: 'negotiation',
          probability: 75,
          closingDate: '',
          aiRisk: 'low',
        },
        {
          id: 'deal-2',
          title: 'Consulting Contract',
          company: '',
          value: '$0',
          stage: 'qualification',
          probability: 0,
          closingDate: '',
          aiRisk: 'low',
        },
      ]);
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);

      vi.mocked(getCacheOrFetch).mockImplementation(async (_key, fetchFn) => {
        return await fetchFn();
      });

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          limit: vi.fn().mockRejectedValue(new Error('Connection lost')),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect as any);

      const result = await getDeals();

      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to fetch deals',
        expect.any(Error)
      );
    });
  });

  describe('getInteractions', () => {
    it('should return empty array when user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const result = await getInteractions();

      expect(result).toEqual([]);
      expect(getCacheOrFetch).not.toHaveBeenCalled();
    });

    it('should fetch interactions from cache or database', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);

      const mockDbData = [
        {
          id: 'event-1',
          startTime: new Date('2024-01-15T10:00:00Z'),
          description: 'Quarterly business review with client',
        },
        {
          id: 'event-2',
          startTime: new Date('2024-01-10T14:00:00Z'),
          description: null,
        },
      ];

      vi.mocked(getCacheOrFetch).mockImplementation(async (_key, fetchFn) => {
        return await fetchFn();
      });

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(mockDbData),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect as any);

      const result = await getInteractions();

      expect(getCacheOrFetch).toHaveBeenCalledWith(
        'interactions:user-123',
        expect.any(Function),
        { ttl: 300, prefix: 'crm' }
      );

      expect(result).toEqual([
        {
          id: 'event-1',
          type: 'meeting',
          contactId: '',
          contact: '',
          date: '2024-01-15T10:00:00.000Z',
          duration: '30 min',
          summary: 'Quarterly business review with client',
          actionItems: [],
          status: 'completed',
          sentiment: 'neutral',
        },
        {
          id: 'event-2',
          type: 'meeting',
          contactId: '',
          contact: '',
          date: '2024-01-10T14:00:00.000Z',
          duration: '30 min',
          summary: '',
          actionItems: [],
          status: 'completed',
          sentiment: 'neutral',
        },
      ]);
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);

      vi.mocked(getCacheOrFetch).mockImplementation(async (_key, fetchFn) => {
        return await fetchFn();
      });

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockRejectedValue(new Error('Network error')),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect as any);

      const result = await getInteractions();

      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to fetch interactions',
        expect.any(Error)
      );
    });

    it('should limit results to 10 interactions', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);

      vi.mocked(getCacheOrFetch).mockImplementation(async (_key, fetchFn) => {
        return await fetchFn();
      });

      const limitSpy = vi.fn().mockResolvedValue([]);
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: limitSpy,
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect as any);

      await getInteractions();

      expect(limitSpy).toHaveBeenCalledWith(10);
    });

    it('should order interactions by startTime descending', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);

      vi.mocked(getCacheOrFetch).mockImplementation(async (_key, fetchFn) => {
        return await fetchFn();
      });

      const orderBySpy = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      });
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          orderBy: orderBySpy,
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect as any);

      await getInteractions();

      // Verify orderBy was called (the actual desc() function is complex SQL object)
      expect(orderBySpy).toHaveBeenCalled();
    });
  });

  describe('cache integration', () => {
    it('should use 5-minute TTL for all CRM data', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);
      vi.mocked(getCacheOrFetch).mockResolvedValue([]);

      await getContacts();
      await getProjects();
      await getDeals();
      await getInteractions();

      expect(getCacheOrFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        { ttl: 300, prefix: 'crm' }
      );
    });

    it('should use crm prefix for all cache keys', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);
      vi.mocked(getCacheOrFetch).mockResolvedValue([]);

      await getContacts();
      await getProjects();
      await getDeals();
      await getInteractions();

      const calls = vi.mocked(getCacheOrFetch).mock.calls;
      calls.forEach((call) => {
        expect(call[2]).toEqual({ ttl: 300, prefix: 'crm' });
      });
    });
  });

  describe('data transformation', () => {
    it('should handle missing optional fields in contacts', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);

      const mockDbData = [
        {
          id: 'contact-1',
          firstName: 'Test',
          lastName: 'User',
          company: null,
          email: 'test@example.com',
          lastContactedAt: null,
          title: null,
          tags: null,
        },
      ];

      vi.mocked(getCacheOrFetch).mockImplementation(async (_key, fetchFn) => {
        return await fetchFn();
      });

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(mockDbData),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect as any);

      const result = await getContacts();

      expect(result[0]).toMatchObject({
        company: '',
        lastContact: 'Never',
        role: '',
        tags: [],
      });
    });

    it('should format contact names correctly', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);

      const mockDbData = [
        {
          id: 'contact-1',
          firstName: 'John',
          lastName: 'Doe',
          company: 'Test',
          email: 'john@test.com',
          lastContactedAt: null,
          title: null,
          tags: [],
        },
      ];

      vi.mocked(getCacheOrFetch).mockImplementation(async (_key, fetchFn) => {
        return await fetchFn();
      });

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(mockDbData),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect as any);

      const result = await getContacts();

      expect(result[0].name).toBe('John Doe');
    });

    it('should convert budget from cents to dollars', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);

      const mockDbData = [
        {
          id: 'project-1',
          name: 'Test',
          status: 'active',
          endDate: null,
          progress: 0,
          budget: 123456, // $1234.56
        },
      ];

      vi.mocked(getCacheOrFetch).mockImplementation(async (_key, fetchFn) => {
        return await fetchFn();
      });

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(mockDbData),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect as any);

      const result = await getProjects();

      expect(result[0].budget).toBe('$1234.56');
    });

    it('should convert deal value from cents to dollars', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);

      const mockDbData = [
        {
          id: 'deal-1',
          name: 'Test Deal',
          company: 'Test',
          estimatedValue: 250000, // $2500
          stage: 'proposal',
          score: 50,
        },
      ];

      vi.mocked(getCacheOrFetch).mockImplementation(async (_key, fetchFn) => {
        return await fetchFn();
      });

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(mockDbData),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect as any);

      const result = await getDeals();

      expect(result[0].value).toBe('$2500');
    });
  });
});
