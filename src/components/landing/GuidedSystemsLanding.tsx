"use client";

/**
 * GalaxyCo — Guided Systems Landing Page
 * 
 * This component strictly follows the Guided Systems Visual Language spec:
 * - Anchor 04 (Passive Context) for background
 * - Anchor 01 (System Authority) for hero — used sparingly
 * - Anchor 03 (Contained Focus) for cards/CTAs
 * 
 * Philosophy: Calm authority, one dominant focus, no decoration for decoration's sake
 */

import { motion } from "framer-motion";
import { ArrowRight, Rocket } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface GuidedSystemsLandingProps {
  onEnterApp: () => void;
}

// === GUIDED SYSTEMS TOKENS ===
const tokens = {
  colors: {
    voidBlack: "#0D0D12",
    surfaceDark: "#161922",
    surfaceElevated: "rgba(255,255,255,0.04)",
    electricCyan: "#00D4E8",
    creamsicle: "#FF9966",
    textPrimary: "rgba(245,245,247,0.95)",
    textSecondary: "rgba(245,245,247,0.6)",
  },
  motion: {
    timing: { fast: 0.15, medium: 0.25, slow: 0.35 },
    easing: "easeOut" as const,
  },
  spacing: {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
  },
};

// === MOTION VARIANTS (Guided Systems: slow, eased, predictable) ===
const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: tokens.motion.timing.slow, ease: tokens.motion.easing },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

export function GuidedSystemsLanding({ onEnterApp }: GuidedSystemsLandingProps) {
  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: tokens.colors.voidBlack }}
    >
      {/* === NAVIGATION (Anchor 04: Passive Context) === */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div 
          className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between"
          style={{ 
            backgroundColor: `${tokens.colors.voidBlack}ee`,
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div 
              className="p-2 rounded-lg transition-colors duration-200"
              style={{ backgroundColor: tokens.colors.surfaceElevated }}
            >
              <Rocket 
                className="h-5 w-5 transition-colors duration-200"
                style={{ color: tokens.colors.electricCyan }}
              />
            </div>
            <span 
              className="font-semibold text-lg"
              style={{ color: tokens.colors.textPrimary }}
            >
              GalaxyCo
            </span>
          </Link>

          {/* Single CTA (Guided Systems: one primary action) */}
          <button
            onClick={onEnterApp}
            className="px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 hover:scale-[1.02]"
            style={{ 
              backgroundColor: tokens.colors.electricCyan,
              color: tokens.colors.voidBlack,
            }}
          >
            Enter Platform
          </button>
        </div>
      </nav>

      {/* === HERO SECTION (Anchor 01: System Authority) === */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        {/* Background: Subtle depth, no chaos */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Single, soft radial gradient — not multiple competing clouds */}
          <div 
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full blur-[200px]"
            style={{ backgroundColor: `${tokens.colors.electricCyan}08` }}
          />
        </div>

        <motion.div 
          className="relative z-10 max-w-3xl text-center"
          initial="initial"
          animate="animate"
          variants={stagger}
        >
          {/* Status Badge (restrained, not flashy) */}
          <motion.div variants={fadeIn} className="mb-8">
            <span 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
              style={{ 
                backgroundColor: tokens.colors.surfaceElevated,
                color: tokens.colors.textSecondary,
                border: `1px solid ${tokens.colors.electricCyan}20`,
              }}
            >
              <span 
                className="h-2 w-2 rounded-full animate-pulse"
                style={{ backgroundColor: tokens.colors.electricCyan }}
              />
              Beta — Free until January 2026
            </span>
          </motion.div>

          {/* Headline: Clear, confident, no wordplay */}
          <motion.h1 
            variants={fadeIn}
            className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-6"
            style={{ color: tokens.colors.textPrimary }}
          >
            AI that works
            <br />
            <span style={{ color: tokens.colors.electricCyan }}>
              while you sleep
            </span>
          </motion.h1>

          {/* Subheadline: Direct, outcome-focused */}
          <motion.p 
            variants={fadeIn}
            className="text-xl md:text-2xl leading-relaxed mb-10 max-w-2xl mx-auto"
            style={{ color: tokens.colors.textSecondary }}
          >
            Deploy autonomous AI agents that manage your workflows, 
            CRM, and operations — so you can focus on what matters.
          </motion.p>

          {/* Primary CTA (Guided Systems: ONE dominant action) */}
          <motion.div variants={fadeIn}>
            <button
              onClick={onEnterApp}
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 hover:scale-[1.02]"
              style={{ 
                backgroundColor: tokens.colors.electricCyan,
                color: tokens.colors.voidBlack,
                boxShadow: `0 0 40px ${tokens.colors.electricCyan}30`,
              }}
            >
              Get Started Free
              <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </motion.div>

          {/* Trust signal (minimal, not a stat-dump) */}
          <motion.p 
            variants={fadeIn}
            className="mt-8 text-sm"
            style={{ color: tokens.colors.textSecondary }}
          >
            No credit card required · Your data stays yours
          </motion.p>
        </motion.div>
      </section>

      {/* === SYSTEM VISUALIZATION (Anchor 02: System Flow) === */}
      <section 
        className="py-32 px-6"
        style={{ backgroundColor: tokens.colors.surfaceDark }}
      >
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: tokens.motion.easing }}
            className="text-center mb-16"
          >
            <h2 
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: tokens.colors.textPrimary }}
            >
              One system. Complete control.
            </h2>
            <p 
              className="text-lg max-w-2xl mx-auto"
              style={{ color: tokens.colors.textSecondary }}
            >
              Neptune orchestrates your AI agents, workflows, and data — 
              presenting clarity instead of complexity.
            </p>
          </motion.div>

          {/* Platform Screenshot (real product, not abstract art) */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: tokens.motion.easing }}
            className="relative rounded-2xl overflow-hidden"
            style={{ 
              border: `1px solid ${tokens.colors.electricCyan}15`,
              boxShadow: `0 0 80px ${tokens.colors.electricCyan}08`,
            }}
          >
            <Image
              src="/screenshots/dashboard-demo.png"
              alt="GalaxyCo Dashboard — AI agent monitoring and workflow automation"
              width={1920}
              height={1080}
              className="w-full h-auto"
              priority
            />
          </motion.div>
        </div>
      </section>

      {/* === VALUE PROPS (Anchor 03: Contained Focus) === */}
      <section className="py-32 px-6" style={{ backgroundColor: tokens.colors.voidBlack }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: tokens.motion.easing }}
            className="text-center mb-16"
          >
            <h2 
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: tokens.colors.textPrimary }}
            >
              What Neptune handles for you
            </h2>
          </motion.div>

          {/* Three cards max (Guided Systems: limit density) */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "AI Agents",
                description: "24/7 autonomous task execution. Email, data entry, scheduling — handled while you sleep.",
              },
              {
                title: "Workflows",
                description: "Visual builder for complex automations. No code required. Connect everything.",
              },
              {
                title: "Intelligence",
                description: "CRM insights, call transcripts, deal scoring — all in one unified system.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: i * 0.1, ease: tokens.motion.easing }}
                className="p-8 rounded-xl"
                style={{ 
                  backgroundColor: tokens.colors.surfaceElevated,
                  border: `1px solid rgba(255,255,255,0.06)`,
                }}
              >
                <h3 
                  className="text-xl font-semibold mb-3"
                  style={{ color: tokens.colors.textPrimary }}
                >
                  {item.title}
                </h3>
                <p style={{ color: tokens.colors.textSecondary }}>
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* === FINAL CTA (Guided Systems: clear exit path) === */}
      <section 
        className="py-32 px-6"
        style={{ backgroundColor: tokens.colors.surfaceDark }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, ease: tokens.motion.easing }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: tokens.colors.textPrimary }}
          >
            Ready to let AI work for you?
          </h2>
          <p 
            className="text-lg mb-10"
            style={{ color: tokens.colors.textSecondary }}
          >
            Join the beta. Free until January 2026.
          </p>
          <button
            onClick={onEnterApp}
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 hover:scale-[1.02]"
            style={{ 
              backgroundColor: tokens.colors.electricCyan,
              color: tokens.colors.voidBlack,
            }}
          >
            Get Started Free
            <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </motion.div>
      </section>

      {/* === FOOTER (Minimal, Anchor 04) === */}
      <footer 
        className="py-12 px-6"
        style={{ 
          backgroundColor: tokens.colors.voidBlack,
          borderTop: `1px solid rgba(255,255,255,0.06)`,
        }}
      >
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5" style={{ color: tokens.colors.electricCyan }} />
            <span style={{ color: tokens.colors.textSecondary }}>
              © 2025 GalaxyCo.ai
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm" style={{ color: tokens.colors.textSecondary }}>
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/terms" className="hover:underline">Terms</Link>
            <Link href="/docs" className="hover:underline">Documentation</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
