"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChipGroup } from "./ChipGroup";
import { NeptuneResponse } from "./NeptuneResponse";
import { questionFlow, landingTokens } from "../config";
import type { QuestionNode } from "../config";

type FlowState =
  | { phase: "question"; node: QuestionNode }
  | { phase: "responding"; nodes: string[]; followUp?: QuestionNode }
  | { phase: "complete" };

interface PullUpBarProps {
  onComplete?: () => void;
}

export function PullUpBar({ onComplete }: PullUpBarProps) {
  const [state, setState] = useState<FlowState>({
    phase: "question",
    node: questionFlow,
  });

  const handleChipSelect = useCallback((chip: string, index: number) => {
    if (state.phase !== "question") return;

    const selectedChip = state.node.chips[index];
    setState({
      phase: "responding",
      nodes: selectedChip.responseNodes,
      followUp: selectedChip.followUp,
    });
  }, [state]);

  const handleResponseComplete = useCallback(() => {
    if (state.phase !== "responding") return;

    if (state.followUp) {
      // Go to follow-up question
      setState({
        phase: "question",
        node: state.followUp,
      });
    } else {
      // No more questions — complete
      setState({ phase: "complete" });
      onComplete?.();
    }
  }, [state, onComplete]);

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <AnimatePresence mode="wait">
        {/* Question Phase */}
        {state.phase === "question" && (
          <motion.div
            key={state.node.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            {/* Question */}
            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-8 sm:mb-12 leading-tight"
              style={{ color: landingTokens.hero.text }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {state.node.question}
            </motion.h1>

            {/* Chips */}
            <ChipGroup
              chips={state.node.chips.map((c) => c.label)}
              onSelect={handleChipSelect}
            />
          </motion.div>
        )}

        {/* Responding Phase */}
        {state.phase === "responding" && (
          <motion.div
            key="responding"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <NeptuneResponse
              nodes={state.nodes}
              onComplete={handleResponseComplete}
            />
          </motion.div>
        )}

        {/* Complete Phase */}
        {state.phase === "complete" && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2
              className="text-2xl sm:text-3xl font-semibold mb-6"
              style={{ color: landingTokens.hero.text }}
            >
              Want Neptune to actually do this for you?
            </h2>
            <motion.a
              href="/sign-up"
              className="inline-block px-8 py-4 rounded-full text-lg font-semibold transition-all duration-200"
              style={{
                backgroundColor: landingTokens.hero.chipSelected,
                color: landingTokens.hero.chipSelectedText,
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Try it free — no card required
            </motion.a>
            <p
              className="mt-4 text-sm"
              style={{ color: landingTokens.hero.textSecondary }}
            >
              Set up in 2 minutes. Cancel anytime.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
