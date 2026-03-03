'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface SlidePanelProps {
  open: boolean;
  title: string;
  href: string;
  onClose: () => void;
}

export function SlidePanel({ open, title, href, onClose }: SlidePanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="glass-surface fixed right-0 top-0 z-50 h-full w-full max-w-lg shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="font-[family-name:var(--font-dm-sans)] text-lg font-semibold text-foreground">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                style={{ transitionDuration: 'var(--duration-fast)' }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <iframe
              src={href}
              className="h-[calc(100%-65px)] w-full border-0"
              title={title}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
