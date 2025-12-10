import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

interface SectionDividerProps {
  variant?: "dots" | "gradient" | "sparkle";
}

export function SectionDivider({ variant = "dots" }: SectionDividerProps) {
  if (variant === "dots") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "gradient") {
    return (
      <div className="py-12">
        <motion.div
          className="h-px w-full bg-gradient-to-r from-transparent via-gradient-to-r via-blue-300/50 to-transparent"
          initial={{ scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        />
      </div>
    );
  }

  // sparkle variant
  return (
    <div className="flex items-center justify-center py-12">
      <motion.div
        className="flex items-center gap-4"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="h-px w-16 bg-gradient-to-r from-transparent to-blue-400/50" />
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Sparkles className="h-4 w-4 text-blue-400" />
        </motion.div>
        <div className="h-px w-16 bg-gradient-to-l from-transparent to-purple-400/50" />
      </motion.div>
    </div>
  );
}
