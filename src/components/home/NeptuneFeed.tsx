'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { NeptuneFeedCard } from './NeptuneFeedCard';
import { SlidePanel } from './SlidePanel';
import type { FeedCard, FeedCardExpansion, SmartChip } from '@/types/home-feed';

interface NeptuneFeedProps {
  greeting: string;
  cards: FeedCard[];
  isNewUser: boolean;
}

export function NeptuneFeed({
  greeting,
  cards: initialCards,
  isNewUser,
}: NeptuneFeedProps) {
  const [cards, setCards] = useState<FeedCard[]>(initialCards);
  const [expansions, setExpansions] = useState<Record<string, FeedCardExpansion>>(
    {},
  );
  const [loadingCard, setLoadingCard] = useState<string | null>(null);
  const [slidePanel, setSlidePanel] = useState<{
    title: string;
    href: string;
  } | null>(null);
  const [neptuneInput, setNeptuneInput] = useState('');

  const handleChipClick = useCallback(
    async (chip: SmartChip, cardId: string) => {
      if (chip.action === 'dismiss') {
        setCards((prev) => prev.filter((c) => c.id !== cardId));
        return;
      }

      setLoadingCard(cardId);

      try {
        const response = await fetch('/api/home/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cardId,
            chipId: chip.id,
            action: chip.action,
            args: chip.args,
          }),
        });

        if (!response.ok) throw new Error('Action failed');

        const data = await response.json();

        if (data.success && data.expansion) {
          setExpansions((prev) => ({ ...prev, [cardId]: data.expansion }));

          if (data.expansion.slidePanel) {
            setSlidePanel(data.expansion.slidePanel);
          }
        }
      } catch {
        // Card stays visible for retry — no toast needed
      } finally {
        setLoadingCard(null);
      }
    },
    [],
  );

  const handleNeptuneSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!neptuneInput.trim()) return;
      window.location.href = `/assistant?message=${encodeURIComponent(neptuneInput)}`;
    },
    [neptuneInput],
  );

  return (
    <div className="flex h-full flex-col">
      {/* Greeting — Swiss: generous top spacing, serif display font */}
      <div className="px-6 pb-4 pt-8">
        <h1 className="font-[family-name:var(--font-instrument-serif)] text-[clamp(24px,4vw,36px)] font-normal tracking-tight text-foreground">
          {greeting}
        </h1>
        {isNewUser && (
          <p className="mt-1 font-[family-name:var(--font-dm-sans)] text-sm text-muted-foreground">
            I&apos;m Neptune — your business partner. Let&apos;s get started.
          </p>
        )}
      </div>

      {/* Feed — centered, generous vertical rhythm */}
      <div className="flex-1 overflow-y-auto px-6 pb-32">
        <div className="mx-auto max-w-2xl space-y-4">
          <AnimatePresence mode="popLayout">
            {cards.map((card) => (
              <NeptuneFeedCard
                key={card.id}
                card={card}
                onChipClick={handleChipClick}
                expansion={expansions[card.id]}
                loading={loadingCard === card.id}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Input bar — glass surface, fixed bottom */}
      <div className="glass-surface fixed bottom-0 left-0 right-0 z-30 px-6 py-4">
        <form onSubmit={handleNeptuneSubmit} className="mx-auto max-w-2xl">
          <input
            type="text"
            value={neptuneInput}
            onChange={(e) => setNeptuneInput(e.target.value)}
            placeholder="Talk to Neptune..."
            className="glass-input w-full rounded-xl px-5 py-3 font-[family-name:var(--font-dm-sans)] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </form>
      </div>

      {/* Slide panel — for deep-dive views */}
      <SlidePanel
        open={!!slidePanel}
        title={slidePanel?.title ?? ''}
        href={slidePanel?.href ?? ''}
        onClose={() => setSlidePanel(null)}
      />
    </div>
  );
}
