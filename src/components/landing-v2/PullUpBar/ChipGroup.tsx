"use client";

import { motion } from "framer-motion";
import { landingTokens } from "../config";

interface ChipGroupProps {
  chips: string[];
  onSelect: (chip: string, index: number) => void;
  disabled?: boolean;
}

export function ChipGroup({ chips, onSelect, disabled }: ChipGroupProps) {
  return (
    <motion.div
      className="flex flex-col sm:flex-row gap-3 justify-center items-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      {chips.map((chip, index) => (
        <motion.button
          key={chip}
          onClick={() => !disabled && onSelect(chip, index)}
          className="px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 w-full sm:w-auto"
          style={{
            backgroundColor: landingTokens.hero.chipBg,
            color: landingTokens.hero.text,
          }}
          whileHover={
            !disabled
              ? {
                  backgroundColor: landingTokens.hero.chipHover,
                  scale: 1.02,
                }
              : {}
          }
          whileTap={!disabled ? { scale: 0.98 } : {}}
          disabled={disabled}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + index * 0.1, duration: 0.3 }}
        >
          {chip}
        </motion.button>
      ))}
    </motion.div>
  );
}
