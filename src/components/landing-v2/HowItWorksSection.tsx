"use client";

import { motion } from "framer-motion";
import { howItWorks, landingTokens } from "./config";

export function HowItWorksSection() {
  return (
    <section
      className="py-24 px-4"
      style={{ backgroundColor: landingTokens.sections.surface }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2
            className="text-3xl sm:text-4xl font-semibold"
            style={{ color: landingTokens.sections.text }}
          >
            Simple as talking
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="space-y-8">
          {howItWorks.map((item, index) => (
            <motion.div
              key={item.step}
              className="flex items-start gap-6"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              {/* Step number */}
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold text-lg"
                style={{
                  backgroundColor: `${landingTokens.sections.accent}20`,
                  color: landingTokens.sections.accent,
                }}
              >
                {item.step}
              </div>

              {/* Content */}
              <div>
                <h3
                  className="text-xl font-semibold mb-1"
                  style={{ color: landingTokens.sections.text }}
                >
                  {item.title}
                </h3>
                <p style={{ color: landingTokens.sections.textSecondary }}>
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
