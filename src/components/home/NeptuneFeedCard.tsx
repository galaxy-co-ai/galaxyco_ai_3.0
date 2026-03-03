'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { SmartChipBar } from './SmartChipBar';
import type { FeedCard, FeedCardExpansion, SmartChip } from '@/types/home-feed';

interface NeptuneFeedCardProps {
  card: FeedCard;
  onChipClick: (chip: SmartChip, cardId: string) => void;
  expansion?: FeedCardExpansion;
  loading?: boolean;
}

export function NeptuneFeedCard({
  card,
  onChipClick,
  expansion,
  loading,
}: NeptuneFeedCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
      className="glass-card rounded-xl p-5"
    >
      {/* Card header — icon + headline + context */}
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 text-xl leading-none"
          role="img"
          aria-hidden="true"
        >
          {card.icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-[family-name:var(--font-dm-sans)] text-[15px] font-semibold text-foreground">
            {card.headline}
          </h3>
          <p className="mt-1.5 font-[family-name:var(--font-dm-sans)] text-sm leading-relaxed text-muted-foreground">
            {card.context}
          </p>
        </div>
      </div>

      {/* Smart chips — hidden when expanded */}
      {!expansion && (
        <SmartChipBar
          chips={card.chips}
          onChipClick={(chip) => onChipClick(chip, card.id)}
          loading={loading}
        />
      )}

      {/* Inline expansion — Neptune's response */}
      <AnimatePresence>
        {expansion && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
            className="mt-4 overflow-hidden rounded-lg border border-nebula-teal/15 bg-nebula-teal/5 p-4"
          >
            <p className="font-[family-name:var(--font-dm-sans)] text-sm text-foreground/90">
              {expansion.message}
            </p>
            {expansion.chips && (
              <SmartChipBar
                chips={expansion.chips}
                onChipClick={(chip) => onChipClick(chip, card.id)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
