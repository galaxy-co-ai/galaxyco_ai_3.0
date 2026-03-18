import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------- mocks (hoisted so vi.mock factories can reference them) ----------

const mocks = vi.hoisted(() => {
  const mockUpdateWhere = vi.fn();
  const mockSet = vi.fn(() => ({ where: mockUpdateWhere }));
  const mockUpdate = vi.fn(() => ({ set: mockSet }));

  const mockReturning = vi.fn();
  const mockValues = vi.fn(() => ({ returning: mockReturning }));
  const mockInsert = vi.fn(() => ({ values: mockValues }));

  const mockLimit = vi.fn();
  const mockOrderBy = vi.fn(() => ({ limit: mockLimit }));
  const mockWhere = vi.fn(() => ({ orderBy: mockOrderBy, limit: mockLimit }));
  const mockFrom = vi.fn(() => ({ where: mockWhere }));
  const mockSelect = vi.fn(() => ({ from: mockFrom }));

  return {
    mockUpdateWhere,
    mockSet,
    mockUpdate,
    mockReturning,
    mockValues,
    mockInsert,
    mockLimit,
    mockOrderBy,
    mockWhere,
    mockFrom,
    mockSelect,
  };
});

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/db', () => ({
  db: {
    insert: mocks.mockInsert,
    select: mocks.mockSelect,
    update: mocks.mockUpdate,
  },
}));

// ---------- import after mocks are set up ----------

import {
  SESSION_IDLE_TIMEOUT_MS,
  isSessionExpired,
  createSession,
  getOrCreateSession,
} from '@/lib/home/session-manager';

// ---------- helpers ----------

const WORKSPACE_ID = 'workspace-uuid-1';
const USER_ID = 'user-uuid-1';

function makeRow(lastActiveAt: Date) {
  return {
    id: 'conv-uuid-1',
    workspaceId: WORKSPACE_ID,
    userId: USER_ID,
    topic: 'home',
    title: 'Home Session',
    summary: null,
    messageCount: 0,
    toolExecutionCount: 0,
    lastActiveAt,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };
}

// ---------- tests ----------

describe('SESSION_IDLE_TIMEOUT_MS', () => {
  it('equals 30 minutes in milliseconds', () => {
    expect(SESSION_IDLE_TIMEOUT_MS).toBe(30 * 60 * 1000);
  });
});

describe('isSessionExpired', () => {
  it('returns false for a session active less than 30 minutes ago', () => {
    const recent = new Date(Date.now() - 10 * 60 * 1000); // 10 min ago
    expect(isSessionExpired(recent)).toBe(false);
  });

  it('returns true for a session active more than 30 minutes ago', () => {
    const old = new Date(Date.now() - 31 * 60 * 1000); // 31 min ago
    expect(isSessionExpired(old)).toBe(true);
  });

  it('returns true at exactly 30 minutes (boundary — expired)', () => {
    const boundary = new Date(Date.now() - SESSION_IDLE_TIMEOUT_MS);
    expect(isSessionExpired(boundary)).toBe(true);
  });

  it('returns false for a session just under 30 minutes old', () => {
    const almostExpired = new Date(Date.now() - SESSION_IDLE_TIMEOUT_MS + 1000); // 1s short
    expect(isSessionExpired(almostExpired)).toBe(false);
  });
});

describe('createSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a ConversationSession with the expected shape', async () => {
    const now = new Date();
    const fakeRow = { id: 'new-conv-id', createdAt: now, lastActiveAt: now };
    mocks.mockReturning.mockResolvedValueOnce([fakeRow]);

    const session = await createSession(WORKSPACE_ID, USER_ID);

    expect(session).toMatchObject({
      id: 'new-conv-id',
      conversationId: 'new-conv-id',
      startedAt: now.toISOString(),
      lastActiveAt: now.toISOString(),
    });
  });

  it('calls db.insert with topic=home and title=Home Session', async () => {
    const now = new Date();
    mocks.mockReturning.mockResolvedValueOnce([{ id: 'x', createdAt: now, lastActiveAt: now }]);

    await createSession(WORKSPACE_ID, USER_ID);

    expect(mocks.mockInsert).toHaveBeenCalled();
    expect(mocks.mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: WORKSPACE_ID,
        userId: USER_ID,
        topic: 'home',
        title: 'Home Session',
      }),
    );
  });
});

describe('getOrCreateSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset chain mocks after clearAllMocks restores them
    mocks.mockUpdateWhere.mockReset();
    mocks.mockSet.mockReset();
    mocks.mockSet.mockReturnValue({ where: mocks.mockUpdateWhere });
    mocks.mockUpdate.mockReset();
    mocks.mockUpdate.mockReturnValue({ set: mocks.mockSet });

    mocks.mockLimit.mockReset();
    mocks.mockOrderBy.mockReset();
    mocks.mockOrderBy.mockReturnValue({ limit: mocks.mockLimit });
    mocks.mockWhere.mockReset();
    mocks.mockWhere.mockReturnValue({ orderBy: mocks.mockOrderBy, limit: mocks.mockLimit });
    mocks.mockFrom.mockReset();
    mocks.mockFrom.mockReturnValue({ where: mocks.mockWhere });
    mocks.mockSelect.mockReset();
    mocks.mockSelect.mockReturnValue({ from: mocks.mockFrom });

    mocks.mockReturning.mockReset();
    mocks.mockValues.mockReset();
    mocks.mockValues.mockReturnValue({ returning: mocks.mockReturning });
    mocks.mockInsert.mockReset();
    mocks.mockInsert.mockReturnValue({ values: mocks.mockValues });
  });

  it('resumes an existing non-expired session and returns isNew: false', async () => {
    const recentDate = new Date(Date.now() - 5 * 60 * 1000); // 5 min ago
    const row = makeRow(recentDate);

    mocks.mockLimit.mockResolvedValueOnce([row]); // select query
    mocks.mockUpdateWhere.mockResolvedValueOnce(undefined); // touchSession update

    const result = await getOrCreateSession(WORKSPACE_ID, USER_ID);

    expect(result.isNew).toBe(false);
    expect(result.session.id).toBe('conv-uuid-1');
    expect(result.session.conversationId).toBe('conv-uuid-1');
  });

  it('creates a new session when no existing session is found and returns isNew: true', async () => {
    mocks.mockLimit.mockResolvedValueOnce([]); // no existing session

    const now = new Date();
    mocks.mockReturning.mockResolvedValueOnce([
      { id: 'brand-new', createdAt: now, lastActiveAt: now },
    ]);

    const result = await getOrCreateSession(WORKSPACE_ID, USER_ID);

    expect(result.isNew).toBe(true);
    expect(result.session.id).toBe('brand-new');
  });

  it('creates a new session when the existing session is expired and returns isNew: true', async () => {
    const expiredDate = new Date(Date.now() - 45 * 60 * 1000); // 45 min ago
    const row = makeRow(expiredDate);

    mocks.mockLimit.mockResolvedValueOnce([row]); // found but expired

    const now = new Date();
    mocks.mockReturning.mockResolvedValueOnce([
      { id: 'fresh-session', createdAt: now, lastActiveAt: now },
    ]);

    const result = await getOrCreateSession(WORKSPACE_ID, USER_ID);

    expect(result.isNew).toBe(true);
    expect(result.session.id).toBe('fresh-session');
  });

  it('touches the session when resuming', async () => {
    const recentDate = new Date(Date.now() - 1 * 60 * 1000); // 1 min ago
    const row = makeRow(recentDate);

    mocks.mockLimit.mockResolvedValueOnce([row]);
    mocks.mockUpdateWhere.mockResolvedValueOnce(undefined);

    await getOrCreateSession(WORKSPACE_ID, USER_ID);

    expect(mocks.mockUpdate).toHaveBeenCalled();
  });

  it('does NOT touch the session when creating a new one', async () => {
    mocks.mockLimit.mockResolvedValueOnce([]); // no existing

    const now = new Date();
    mocks.mockReturning.mockResolvedValueOnce([{ id: 'new-one', createdAt: now, lastActiveAt: now }]);

    await getOrCreateSession(WORKSPACE_ID, USER_ID);

    // update is only called by touchSession — should not be called here
    expect(mocks.mockUpdate).not.toHaveBeenCalled();
  });
});
