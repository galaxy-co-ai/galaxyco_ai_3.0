"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { landingTokens } from "./config";

export function FinalCTA() {
  return (
    <section
      className="py-24 px-4"
      style={{ backgroundColor: landingTokens.sections.background }}
    >
      <motion.div
        className="max-w-2xl mx-auto text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2
          className="text-3xl sm:text-4xl font-semibold mb-6"
          style={{ color: landingTokens.sections.text }}
        >
          Ready to try it for real?
        </h2>

        <p
          className="text-lg mb-8"
          style={{ color: landingTokens.sections.textSecondary }}
        >
          See what Neptune can do with your actual work.
        </p>

        <Link
          href="/sign-up"
          className="inline-block px-8 py-4 rounded-full text-lg font-semibold transition-all duration-200 hover:scale-[1.02]"
          style={{
            backgroundColor: landingTokens.sections.accent,
            color: landingTokens.sections.background,
          }}
        >
          Get Started — Free
        </Link>

        <p
          className="mt-4 text-sm"
          style={{ color: landingTokens.sections.textSecondary }}
        >
          No credit card required. Cancel anytime.
        </p>
      </motion.div>
    </section>
  );
}
