"use client";

import { useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { PullUpBar } from "./PullUpBar";
import { landingTokens } from "./config";

interface HeroSectionProps {
  onComplete?: () => void;
}

export function HeroSection({ onComplete }: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);

  const handlePullUpComplete = useCallback(() => {
    // Gentle auto-scroll to next section after completion
    setTimeout(() => {
      onComplete?.();
    }, 1500);
  }, [onComplete]);

  return (
    <section
      ref={sectionRef}
      className="min-h-screen flex flex-col justify-center items-center px-4 py-20"
      style={{ backgroundColor: landingTokens.hero.background }}
    >
      {/* Subtle trust signal at top */}
      <motion.p
        className="text-sm mb-16 text-center"
        style={{ color: landingTokens.hero.textSecondary }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        No signup required. Just curiosity.
      </motion.p>

      {/* Pull-up bar interaction */}
      <PullUpBar onComplete={handlePullUpComplete} />
    </section>
  );
}
