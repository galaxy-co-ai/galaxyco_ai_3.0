/**
 * Behavioral Signal Collection
 *
 * Records user engagement patterns and stores them in localStorage for future
 * use by the Neptune learning engine. Signals are buffered in memory and flushed
 * to localStorage in batches. The API endpoint (/api/home/signals) is deferred
 * to v2 — storage is local-only for now.
 */

export type SignalType =
  | 'topic_engaged' //     User responded to this topic
  | 'topic_ignored' //     User scrolled past without engaging
  | 'visual_expanded' //   User hovered/clicked an inline visual
  | 'visual_ignored' //    Visual in viewport but not interacted with
  | 'response_time' //     Time between Neptune's message and user reply
  | 'scroll_depth' //      How far user scrolled in conversation
  | 'micro_feedback' //    Explicit "more like this" / "less like this"
  | 'session_duration' //  Total session time
  | 'unprompted_nav'; //   User navigated to module without Neptune suggesting

export interface BehavioralSignal {
  type: SignalType;
  messageId?: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

export interface StoredSignal extends BehavioralSignal {
  userId: string;
  workspaceId: string;
  sessionId: string;
  timestamp: string;
}

const STORAGE_KEY = 'neptune_signals';
const MAX_STORED_SIGNALS = 500;

export interface SignalCollector {
  /** Adds a signal to the internal buffer, stamping userId/workspaceId/sessionId/timestamp. */
  record(signal: BehavioralSignal): void;
  /** Returns the number of buffered signals not yet flushed to localStorage. */
  pending(): number;
  /**
   * Stores all buffered signals in localStorage under 'neptune_signals'.
   * - Caps the total stored at 500 entries (most recent).
   * - Clears the buffer on success.
   * - On error, re-adds signals to the buffer so they are not lost.
   */
  flush(): Promise<void>;
}

/**
 * Creates a signal collector scoped to a specific user, workspace, and session.
 *
 * @example
 * const collector = createSignalCollector(userId, workspaceId, sessionId);
 * collector.record({ type: 'topic_engaged', messageId: 'msg-123' });
 * await collector.flush();
 */
export function createSignalCollector(
  userId: string,
  workspaceId: string,
  sessionId: string,
): SignalCollector {
  const buffer: StoredSignal[] = [];

  return {
    record(signal: BehavioralSignal): void {
      const stored: StoredSignal = {
        ...signal,
        userId,
        workspaceId,
        sessionId,
        timestamp: signal.timestamp ?? new Date().toISOString(),
      };
      buffer.push(stored);
    },

    pending(): number {
      return buffer.length;
    },

    async flush(): Promise<void> {
      if (buffer.length === 0) return;

      const signals = [...buffer];
      buffer.length = 0;

      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
        stored.push(...signals);
        const trimmed = stored.slice(-MAX_STORED_SIGNALS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      } catch {
        // Re-add signals to the buffer so they aren't lost on localStorage failure.
        buffer.push(...signals);
      }
    },
  };
}
