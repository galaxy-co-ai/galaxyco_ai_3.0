"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { NodeAnimation } from "./NodeAnimation";
import { landingTokens } from "../config";

interface NeptuneResponseProps {
  nodes: string[];
  onComplete?: () => void;
}

export function NeptuneResponse({ nodes, onComplete }: NeptuneResponseProps) {
  return (
    <motion.div
      className="w-full rounded-2xl p-6 sm:p-8"
      style={{
        backgroundColor: landingTokens.sections.background,
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Neptune indicator */}
      <motion.div
        className="flex items-center gap-2 mb-6 justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${landingTokens.sections.accent}20` }}
        >
          <Sparkles
            className="w-4 h-4"
            style={{ color: landingTokens.sections.accent }}
          />
        </div>
        <span
          className="text-sm font-medium"
          style={{ color: landingTokens.sections.textSecondary }}
        >
          Neptune
        </span>
      </motion.div>

      {/* Node animation */}
      <NodeAnimation nodes={nodes} onComplete={onComplete} />
    </motion.div>
  );
}
