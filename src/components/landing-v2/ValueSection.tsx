"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { valueExamples, landingTokens } from "./config";

export function ValueSection() {
  return (
    <section
      className="py-24 px-4"
      style={{ backgroundColor: landingTokens.sections.background }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2
            className="text-3xl sm:text-4xl font-semibold mb-4"
            style={{ color: landingTokens.sections.text }}
          >
            What happens when you let Neptune help
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{ color: landingTokens.sections.textSecondary }}
          >
            Real outcomes. Not feature lists.
          </p>
        </motion.div>

        {/* Value cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {valueExamples.map((example, index) => (
            <motion.div
              key={index}
              className="p-6 rounded-2xl"
              style={{
                backgroundColor: landingTokens.sections.surface,
                border: `1px solid ${landingTokens.sections.accent}20`,
              }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {/* Before */}
              <p
                className="text-sm mb-3"
                style={{ color: landingTokens.sections.textSecondary }}
              >
                {example.before}
              </p>

              {/* Arrow */}
              <div className="flex items-center gap-2 mb-3">
                <ArrowRight
                  className="w-4 h-4"
                  style={{ color: landingTokens.sections.accent }}
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: landingTokens.sections.accent }}
                >
                  {example.action}
                </span>
              </div>

              {/* After */}
              <p
                className="font-semibold"
                style={{ color: landingTokens.sections.text }}
              >
                {example.after}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
