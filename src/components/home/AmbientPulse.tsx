'use client';

import { motion } from 'framer-motion';

interface AmbientPulseProps {
  isActive?: boolean;
}

export function AmbientPulse({ isActive = true }: AmbientPulseProps) {
  if (!isActive) return null;

  return (
    <motion.div
      data-ambient-pulse
      className="absolute -left-1 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full pointer-events-none"
      style={{
        background: 'var(--accent-cyan)',
        boxShadow: '0 0 8px var(--accent-cyan-soft)',
      }}
      animate={{
        opacity: [0.4, 0.8, 0.4],
        scale: [0.9, 1.1, 0.9],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}
