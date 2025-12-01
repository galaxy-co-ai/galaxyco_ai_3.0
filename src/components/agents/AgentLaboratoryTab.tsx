"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FlaskConical,
  Beaker,
  TestTube2,
  Sparkles,
  Cpu,
  Wrench,
  Zap,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";

export default function AgentLaboratoryTab() {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <Card className="relative max-w-2xl w-full overflow-hidden border-0 shadow-2xl">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900" />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Floating elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-10 left-10 text-purple-400/30"
            animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Beaker className="h-16 w-16" />
          </motion.div>
          <motion.div
            className="absolute top-20 right-16 text-indigo-400/30"
            animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            <TestTube2 className="h-12 w-12" />
          </motion.div>
          <motion.div
            className="absolute bottom-20 left-20 text-cyan-400/30"
            animate={{ y: [0, -8, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            <Cpu className="h-14 w-14" />
          </motion.div>
          <motion.div
            className="absolute bottom-16 right-24 text-violet-400/30"
            animate={{ y: [0, 8, 0], rotate: [0, -8, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          >
            <Wrench className="h-10 w-10" />
          </motion.div>
        </div>

        {/* Glowing orb effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl" />

        {/* Content */}
        <div className="relative z-10 p-12 text-center">
          {/* Icon */}
          <motion.div
            className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-400/30 backdrop-blur-sm mb-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <FlaskConical className="h-12 w-12 text-purple-300" />
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Badge className="px-4 py-1.5 mb-6 bg-purple-500/20 text-purple-200 border-purple-400/30 text-sm font-medium">
              <Sparkles className="h-3.5 w-3.5 mr-2" />
              Coming Soon
            </Badge>
          </motion.div>

          {/* Title */}
          <motion.h2
            className="text-4xl font-bold text-white mb-4"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Agent Laboratory
          </motion.h2>

          {/* Description */}
          <motion.p
            className="text-lg text-gray-300 mb-8 max-w-md mx-auto leading-relaxed"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Build, test, and configure your AI agents with our visual laboratory. 
            Create custom workflows, set triggers, and fine-tune behaviors.
          </motion.p>

          {/* Feature pills */}
          <motion.div
            className="flex flex-wrap justify-center gap-3 mb-10"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {[
              { icon: Zap, label: "Visual Builder" },
              { icon: TestTube2, label: "Live Testing" },
              { icon: Wrench, label: "Fine Tuning" },
            ].map((feature, i) => (
              <div
                key={feature.label}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-300 text-sm"
              >
                <feature.icon className="h-4 w-4 text-purple-400" />
                {feature.label}
              </div>
            ))}
          </motion.div>

          {/* CTA placeholder */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <button
              disabled
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium opacity-50 cursor-not-allowed"
            >
              Get Notified
              <ArrowRight className="h-4 w-4" />
            </button>
            <p className="text-xs text-gray-500 mt-3">
              We&apos;ll notify you when the Laboratory is ready
            </p>
          </motion.div>
        </div>
      </Card>
    </div>
  );
}
