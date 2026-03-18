import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSignalCollector } from '@/lib/home/behavioral-signals';

// ---------- constants ----------

const USER_ID = 'user-uuid-1';
const WORKSPACE_ID = 'workspace-uuid-1';
const SESSION_ID = 'session-uuid-1';
const STORAGE_KEY = 'neptune_signals';

// ---------- localStorage mock helpers ----------

function makeLocalStorageMock() {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      for (const key of Object.keys(store)) delete store[key];
    }),
    get _store() {
      return store;
    },
  };
}

// ---------- tests ----------

describe('behavioral-signals', () => {
  let localStorageMock: ReturnType<typeof makeLocalStorageMock>;

  beforeEach(() => {
    localStorageMock = makeLocalStorageMock();
    vi.stubGlobal('localStorage', localStorageMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('creates a signal collector', () => {
    const collector = createSignalCollector(USER_ID, WORKSPACE_ID, SESSION_ID);
    expect(collector).toBeDefined();
    expect(typeof collector.record).toBe('function');
    expect(typeof collector.pending).toBe('function');
    expect(typeof collector.flush).toBe('function');
  });

  it('records engagement signals (pending count increases)', () => {
    const collector = createSignalCollector(USER_ID, WORKSPACE_ID, SESSION_ID);

    expect(collector.pending()).toBe(0);

    collector.record({ type: 'topic_engaged', messageId: 'msg-1' });
    expect(collector.pending()).toBe(1);

    collector.record({ type: 'visual_expanded', metadata: { visualId: 'v-42' } });
    expect(collector.pending()).toBe(2);
  });

  it('stores signals in localStorage on flush', async () => {
    const collector = createSignalCollector(USER_ID, WORKSPACE_ID, SESSION_ID);

    collector.record({ type: 'topic_engaged', messageId: 'msg-1' });
    collector.record({ type: 'scroll_depth', metadata: { depth: 0.75 } });

    await collector.flush();

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.any(String),
    );

    const written = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(written).toHaveLength(2);
    expect(written[0]).toMatchObject({
      type: 'topic_engaged',
      messageId: 'msg-1',
      userId: USER_ID,
      workspaceId: WORKSPACE_ID,
      sessionId: SESSION_ID,
    });
    expect(typeof written[0].timestamp).toBe('string');
  });

  it('caps localStorage at 500 signals', async () => {
    // Pre-populate localStorage with 495 signals
    const existing = Array.from({ length: 495 }, (_, i) => ({
      type: 'session_duration',
      userId: USER_ID,
      workspaceId: WORKSPACE_ID,
      sessionId: SESSION_ID,
      timestamp: new Date(i).toISOString(),
    }));
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(existing));

    const collector = createSignalCollector(USER_ID, WORKSPACE_ID, SESSION_ID);

    // Add 10 new signals — total would be 505, should be trimmed to 500
    for (let i = 0; i < 10; i++) {
      collector.record({ type: 'topic_ignored', messageId: `msg-${i}` });
    }

    await collector.flush();

    const written = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(written).toHaveLength(500);
    // Trimming keeps the most recent (last 500), so the 10 new signals should be at the end
    expect(written[written.length - 1]).toMatchObject({ type: 'topic_ignored', messageId: 'msg-9' });
  });

  it('clears pending after flush', async () => {
    const collector = createSignalCollector(USER_ID, WORKSPACE_ID, SESSION_ID);

    collector.record({ type: 'micro_feedback', metadata: { sentiment: 'more' } });
    collector.record({ type: 'unprompted_nav', metadata: { module: 'crm' } });

    expect(collector.pending()).toBe(2);

    await collector.flush();

    expect(collector.pending()).toBe(0);
  });

  it('re-adds to buffer on localStorage error', async () => {
    localStorageMock.setItem.mockImplementationOnce(() => {
      throw new Error('QuotaExceededError');
    });

    const collector = createSignalCollector(USER_ID, WORKSPACE_ID, SESSION_ID);

    collector.record({ type: 'response_time', metadata: { ms: 1200 } });

    expect(collector.pending()).toBe(1);

    await collector.flush();

    // Signal must be re-added to the buffer since localStorage failed
    expect(collector.pending()).toBe(1);
  });
});
