'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ConversationMessage } from './ConversationMessage';
import { ConversationInput } from './ConversationInput';
import { MicroFeedback } from './MicroFeedback';
import { createSignalCollector } from '@/lib/home/behavioral-signals';
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

export function NeptuneConversation() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [session, setSession] = useState<ConversationSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const signalCollector = useRef(createSignalCollector('', '', ''));

  // Update signal collector when session is established
  useEffect(() => {
    if (session) {
      signalCollector.current = createSignalCollector('current-user', 'current-workspace', session.id);
    }
  }, [session]);

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

  // Auto-scroll when messages change
  useEffect(() => {
    if (scrollRef.current) {
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

  return (
    <div data-neptune-conversation className="neptune-ambient flex h-full flex-col">
      {/* Scroll container */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 pb-32 pt-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <div key={msg.id} className="group/message">
                <ConversationMessage message={msg} onAction={handleAction} />
                {msg.role === 'neptune' && <MicroFeedback messageId={msg.id} onFeedback={handleFeedback} />}
              </div>
            ))}
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
