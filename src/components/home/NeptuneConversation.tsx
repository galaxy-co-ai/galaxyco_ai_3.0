'use client';

import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ConversationMessage } from './ConversationMessage';
import { ConversationInput } from './ConversationInput';
import { MicroFeedback } from './MicroFeedback';
import { SessionDivider } from './SessionDivider';
import { createSignalCollector } from '@/lib/home/behavioral-signals';
import { useTimeOfDay } from '@/lib/hooks/use-time-of-day';
import type {
  ConversationMessage as MessageType,
  ConversationSession,
  StreamEvent,
  ActionOption,
} from '@/types/neptune-conversation';

async function processStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: StreamEvent) => void,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const event = JSON.parse(line.slice(6)) as StreamEvent;
        onEvent(event);
      } catch {
        /* skip malformed */
      }
    }
  }
}

interface NeptuneConversationProps {
  userId?: string;
  workspaceId?: string;
}

export function NeptuneConversation({ userId = '', workspaceId = '' }: NeptuneConversationProps) {
  const { ambientClass } = useTimeOfDay();
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [session, setSession] = useState<ConversationSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [oldestCursor, setOldestCursor] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const signalCollector = useRef(createSignalCollector('', '', ''));

  // Update signal collector when session is established
  useEffect(() => {
    if (session && userId && workspaceId) {
      signalCollector.current = createSignalCollector(userId, workspaceId, session.id);
    }
  }, [session, userId, workspaceId]);

  // Periodic flush every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      signalCollector.current.flush();
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Flush on unmount
  useEffect(() => {
    return () => {
      signalCollector.current.flush();
    };
  }, []);

  const handleStreamEvent = useCallback((event: StreamEvent) => {
    if (event.type === 'session') {
      setSession(event.session);
    } else if (event.type === 'text-delta') {
      setStreamingText((prev) => prev + event.content);
    } else if (event.type === 'message-complete') {
      setStreamingText('');
      setMessages((prev) => [...prev, event.message]);
    } else if (event.type === 'error') {
      setError(event.message);
    }
  }, []);

  // Init on mount — POST with empty body to start conversation
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/home/conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status}`);
        }

        if (!cancelled) {
          await processStream(res.body, (event) => {
            if (!cancelled) handleStreamEvent(event);
          });
        }
      } catch {
        if (!cancelled) {
          setError(
            "I'm having trouble pulling everything together. You can ask me anything in the meantime, or head to any module directly.",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [handleStreamEvent]);

  // Auto-scroll only for new messages (not history prepend)
  const prevMessageCountRef = useRef(0);
  useEffect(() => {
    const prevCount = prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;
    // Only scroll down if messages were appended (count grew and last msg is new)
    if (messages.length > prevCount && prevCount > 0 && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    // Also scroll on first message load (init)
    if (prevCount === 0 && messages.length > 0 && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(
    async (text: string) => {
      const optimisticUserMsg: MessageType = {
        id: crypto.randomUUID(),
        sessionId: session?.id ?? '',
        timestamp: new Date().toISOString(),
        role: 'user',
        blocks: [{ type: 'text', content: text }],
      };

      setMessages((prev) => [...prev, optimisticUserMsg]);
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/home/conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: session?.id, message: text }),
        });

        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status}`);
        }

        await processStream(res.body, handleStreamEvent);
      } catch {
        setError("I couldn't send that message. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [session, handleStreamEvent],
  );

  const handleAction = useCallback(
    (action: ActionOption) => {
      handleSend(action.label);
    },
    [handleSend],
  );

  const handleFeedback = useCallback((messageId: string, signal: 'more' | 'less') => {
    signalCollector.current.record({
      type: 'micro_feedback',
      messageId,
      metadata: { signal },
    });
  }, []);

  // --- History loading ---

  const loadHistory = useCallback(async () => {
    if (historyLoading || !hasMoreHistory || !session) return;
    setHistoryLoading(true);

    try {
      const params = new URLSearchParams();
      if (oldestCursor) params.set('cursor', oldestCursor);

      const res = await fetch(`/api/home/conversation/history?${params}`);
      if (!res.ok) throw new Error('Failed to load history');

      const data = await res.json();
      if (data.messages.length === 0) {
        setHasMoreHistory(false);
        return;
      }

      setOldestCursor(data.cursor ?? null);
      setHasMoreHistory(data.hasMore ?? false);

      // Prepend older messages, preserving scroll position
      const container = scrollRef.current;
      const prevScrollHeight = container?.scrollHeight ?? 0;

      setMessages((prev) => [...data.messages, ...prev]);

      // Restore scroll position after prepend
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevScrollHeight;
        }
      });
    } catch (error) {
      console.error('History load failed:', error);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyLoading, hasMoreHistory, oldestCursor, session]);

  // IntersectionObserver for scroll-to-top history loading
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMoreHistory && !historyLoading) {
          loadHistory();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreHistory, historyLoading, loadHistory, session]);

  return (
    <div data-neptune-conversation className={`neptune-ambient ${ambientClass} flex h-full flex-col`.trim()}>
      {/* Scroll container */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 pb-32 pt-8">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Sentinel for infinite scroll history loading */}
          <div ref={topSentinelRef} className="h-1" />
          {historyLoading && (
            <div className="flex justify-center py-4">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-accent-foreground/70" />
            </div>
          )}
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => {
              const prevMsg = messages[i - 1];
              const showDivider = prevMsg && prevMsg.sessionId !== msg.sessionId;
              return (
                <Fragment key={msg.id}>
                  {showDivider && <SessionDivider date={msg.timestamp} />}
                  <div className="group/message">
                    <ConversationMessage message={msg} onAction={handleAction} />
                    {msg.role === 'neptune' && (
                      <MicroFeedback messageId={msg.id} onFeedback={handleFeedback} />
                    )}
                  </div>
                </Fragment>
              );
            })}
          </AnimatePresence>
          {streamingText && (
            <div className="space-y-2">
              <p className="font-[family-name:var(--font-dm-sans)] text-sm leading-relaxed text-foreground">
                {streamingText}
                <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-accent-foreground/50" />
              </p>
            </div>
          )}
          {error && <p className="text-sm italic text-muted-foreground">{error}</p>}
        </div>
      </div>
      <ConversationInput onSubmit={handleSend} isLoading={isLoading} />
    </div>
  );
}
