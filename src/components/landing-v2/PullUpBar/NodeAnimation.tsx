"use client";

import { motion } from "framer-motion";
import { landingTokens } from "../config";

interface NodeAnimationProps {
  nodes: string[];
  onComplete?: () => void;
}

export function NodeAnimation({ nodes, onComplete }: NodeAnimationProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-2 py-8">
      {nodes.map((node, index) => (
        <motion.div
          key={node}
          className="flex items-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: index * 0.4,
            duration: 0.5,
            ease: "easeOut",
          }}
          onAnimationComplete={() => {
            if (index === nodes.length - 1 && onComplete) {
              setTimeout(onComplete, 800);
            }
          }}
        >
          {/* Node */}
          <motion.div
            className="px-4 py-3 rounded-xl text-sm font-medium text-center min-w-[140px]"
            style={{
              backgroundColor: landingTokens.sections.surface,
              color: landingTokens.sections.text,
              border: `1px solid ${landingTokens.sections.accent}33`,
            }}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.4 + 0.2, duration: 0.3 }}
          >
            {node}
          </motion.div>

          {/* Arrow (except after last node) */}
          {index < nodes.length - 1 && (
            <motion.div
              className="hidden sm:block text-xl"
              style={{ color: landingTokens.sections.accent }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.4 + 0.3, duration: 0.3 }}
            >
              →
            </motion.div>
          )}

          {/* Arrow for mobile (vertical) */}
          {index < nodes.length - 1 && (
            <motion.div
              className="sm:hidden text-xl"
              style={{ color: landingTokens.sections.accent }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.4 + 0.3, duration: 0.3 }}
            >
              ↓
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
