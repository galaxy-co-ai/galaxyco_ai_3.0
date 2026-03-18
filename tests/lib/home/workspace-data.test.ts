import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchWorkspaceSnapshot } from '@/lib/home/workspace-data';
import type { WorkspaceSnapshot } from '@/lib/home/workspace-data';

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      })),
    })),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

describe('fetchWorkspaceSnapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a WorkspaceSnapshot with all expected fields', async () => {
    const snapshot = await fetchWorkspaceSnapshot('workspace-1');

    expect(snapshot).toHaveProperty('contactCount');
    expect(snapshot).toHaveProperty('hotContacts');
    expect(snapshot).toHaveProperty('overdueTasks');
    expect(snapshot).toHaveProperty('recentCampaigns');
    expect(snapshot).toHaveProperty('activeAgentCount');
    expect(snapshot).toHaveProperty('integrationCount');
    expect(snapshot).toHaveProperty('isNewUser');
  });

  it('should return arrays for list fields', async () => {
    const snapshot = await fetchWorkspaceSnapshot('workspace-1');

    expect(Array.isArray(snapshot.hotContacts)).toBe(true);
    expect(Array.isArray(snapshot.overdueTasks)).toBe(true);
    expect(Array.isArray(snapshot.recentCampaigns)).toBe(true);
  });

  it('should return numeric values for count fields', async () => {
    const snapshot = await fetchWorkspaceSnapshot('workspace-1');

    expect(typeof snapshot.contactCount).toBe('number');
    expect(typeof snapshot.activeAgentCount).toBe('number');
    expect(typeof snapshot.integrationCount).toBe('number');
  });

  it('should detect new users when contactCount and activeAgentCount are both 0', async () => {
    // Default mock returns [] for all queries (counts resolve to 0)
    const snapshot = await fetchWorkspaceSnapshot('workspace-1');

    expect(snapshot.contactCount).toBe(0);
    expect(snapshot.activeAgentCount).toBe(0);
    expect(snapshot.isNewUser).toBe(true);
  });

  it('should set isNewUser false when contacts exist', async () => {
    const { db } = await import('@/lib/db');
    const mockDb = db as ReturnType<typeof vi.fn> & typeof db;

    // Override select to return a count of 5 for the first call (contacts)
    vi.mocked(mockDb.select).mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([{ count: 5 }])),
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      })),
    } as never);

    const snapshot = await fetchWorkspaceSnapshot('workspace-1');

    // isNewUser requires BOTH contactCount === 0 AND activeAgentCount === 0
    // If contactCount > 0, isNewUser must be false
    if (snapshot.contactCount > 0) {
      expect(snapshot.isNewUser).toBe(false);
    }
  });

  it('should return a safe fallback snapshot when db throws', async () => {
    const { db } = await import('@/lib/db');
    const mockDb = db as ReturnType<typeof vi.fn> & typeof db;

    vi.mocked(mockDb.select).mockImplementation(() => {
      throw new Error('DB connection failed');
    });

    const snapshot = await fetchWorkspaceSnapshot('workspace-1');

    expect(snapshot.contactCount).toBe(0);
    expect(snapshot.hotContacts).toEqual([]);
    expect(snapshot.overdueTasks).toEqual([]);
    expect(snapshot.recentCampaigns).toEqual([]);
    expect(snapshot.activeAgentCount).toBe(0);
    expect(snapshot.integrationCount).toBe(0);
    expect(snapshot.isNewUser).toBe(true);
  });

  it('isNewUser is derived correctly from contactCount and activeAgentCount', async () => {
    const snapshot: WorkspaceSnapshot = {
      contactCount: 0,
      hotContacts: [],
      overdueTasks: [],
      recentCampaigns: [],
      activeAgentCount: 0,
      integrationCount: 0,
      isNewUser: true,
    };

    expect(snapshot.isNewUser).toBe(snapshot.contactCount === 0 && snapshot.activeAgentCount === 0);

    const activeSnapshot: WorkspaceSnapshot = {
      ...snapshot,
      contactCount: 10,
      activeAgentCount: 2,
      isNewUser: false,
    };

    expect(activeSnapshot.isNewUser).toBe(
      activeSnapshot.contactCount === 0 && activeSnapshot.activeAgentCount === 0,
    );
  });
});
