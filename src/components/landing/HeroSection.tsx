"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  ArrowRight,
  Sparkles,
  Bot,
  Workflow,
  Users,
  BarChart3,
  FileSearch,
  Zap,
  CheckCircle2,
  TrendingUp,
  MessageSquare,
  Play,
} from "lucide-react";

interface HeroSectionProps {
  onEnterApp: () => void;
}

const features = [
  {
    icon: Bot,
    label: "AI Agents",
    description: "24/7 autonomous task execution",
    gradient: "from-violet-500 to-purple-600",
    bgGlow: "bg-violet-500/20",
  },
  {
    icon: Workflow,
    label: "Workflow Studio",
    description: "Visual drag-and-drop builder",
    gradient: "from-blue-500 to-cyan-500",
    bgGlow: "bg-blue-500/20",
  },
  {
    icon: Users,
    label: "Smart CRM",
    description: "AI-powered insights & scoring",
    gradient: "from-pink-500 to-rose-500",
    bgGlow: "bg-pink-500/20",
  },
  {
    icon: BarChart3,
    label: "Marketing Hub",
    description: "Campaign analytics & ROI",
    gradient: "from-orange-500 to-amber-500",
    bgGlow: "bg-orange-500/20",
  },
  {
    icon: FileSearch,
    label: "Knowledge Base",
    description: "AI-powered document search",
    gradient: "from-emerald-500 to-teal-500",
    bgGlow: "bg-emerald-500/20",
  },
];

const stats = [
  { value: "10+", label: "hours saved weekly" },
  { value: "24/7", label: "AI support" },
  { value: "98%", label: "success rate" },
  { value: "3x", label: "productivity" },
];

const floatingElements = [
  { top: "15%", left: "8%", delay: 0, icon: MessageSquare, label: "AI Chat" },
  { top: "25%", right: "10%", delay: 0.3, icon: Zap, label: "Automation" },
  { top: "60%", left: "5%", delay: 0.6, icon: CheckCircle2, label: "Task Done" },
  { top: "70%", right: "8%", delay: 0.9, icon: TrendingUp, label: "+127%" },
];

export function HeroSection({ onEnterApp }: HeroSectionProps) {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-advance features
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isHovered]);

  const activeFeature = features[currentFeature];
  const ActiveIcon = activeFeature.icon;

  return (
    <section
      className="relative min-h-screen flex flex-col overflow-hidden"
      aria-label="Hero section introducing GalaxyCo AI platform"
    >
      {/* Background with animated gradient */}
      <div className="absolute inset-0 bg-[#0a0a1a]">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-600/30 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/20 rounded-full blur-[150px]" />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        
        {/* Radial fade */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a1a]/80" />
      </div>

      {/* Floating UI Elements - Desktop only */}
      <div className="hidden lg:block">
        {floatingElements.map((el, i) => {
          const Icon = el.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: el.delay + 0.8, duration: 0.6 }}
              className="absolute z-20"
              style={{ top: el.top, left: el.left, right: el.right }}
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, delay: el.delay }}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-xl"
              >
                <Icon className="h-4 w-4 text-white/80" aria-hidden="true" />
                <span className="text-sm text-white/90 font-medium">{el.label}</span>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="w-full max-w-7xl mx-auto">
          {/* Announcement Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-8"
          >
            <Badge 
              className="px-4 py-2 bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-400/30 text-violet-200 backdrop-blur-sm hover:bg-violet-500/30 transition-colors cursor-pointer"
              role="status"
            >
              <Sparkles className="h-3.5 w-3.5 mr-2 text-violet-300" aria-hidden="true" />
              <span className="font-medium">Introducing AI Workflow Studio 2.0</span>
              <ArrowRight className="h-3.5 w-3.5 ml-2 text-violet-300" aria-hidden="true" />
            </Badge>
          </motion.div>

          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-center mb-6 lg:mb-8"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] tracking-tight">
              AI that works
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400">
                while you sleep
              </span>
            </h1>
          </motion.div>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg sm:text-xl lg:text-2xl text-gray-400 text-center max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            Deploy autonomous AI agents that manage your CRM, automate workflows, 
            and deliver insights—freeing you to focus on what matters.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center mb-12 lg:mb-16"
          >
            <button
              onClick={onEnterApp}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-[#0a0a1a] bg-white/90 text-gray-900 backdrop-blur-sm shadow-lg shadow-white/20 hover:bg-white hover:shadow-white/30 hover:scale-105 group"
              aria-label="Get started with GalaxyCo AI for free"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </button>
            <button
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-[#0a0a1a] bg-white/10 text-white/90 border border-white/20 hover:bg-white/20 hover:border-white/30 backdrop-blur-sm group"
              aria-label="Watch a demo video of the platform"
            >
              <Play className="h-4 w-4 group-hover:scale-110 transition-transform" aria-hidden="true" />
              Watch Demo
            </button>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 mb-12"
            role="list"
            aria-label="Platform statistics"
          >
            {stats.map((stat, i) => (
              <div 
                key={i} 
                className="flex items-center gap-1.5"
                role="listitem"
              >
                <span className="text-sm font-semibold text-white/90">{stat.value}</span>
                <span className="text-xs text-gray-500">{stat.label}</span>
                {i < stats.length - 1 && (
                  <span className="ml-4 text-gray-700 hidden sm:inline">•</span>
                )}
              </div>
            ))}
          </motion.div>

          {/* Feature Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.5 }}
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Glow effect behind showcase */}
            <div className={`absolute -inset-8 bg-gradient-to-br ${activeFeature.gradient} rounded-3xl opacity-20 blur-3xl transition-all duration-700`} />
            
            {/* Main showcase container */}
            <div className="relative bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl lg:rounded-3xl border border-white/10 p-6 lg:p-10 backdrop-blur-sm">
              {/* Feature navigation */}
              <nav 
                className="flex flex-wrap justify-center gap-2 lg:gap-3 mb-8"
                role="tablist"
                aria-label="Platform features"
              >
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  const isActive = index === currentFeature;
                  return (
                    <button
                      key={index}
                      onClick={() => setCurrentFeature(index)}
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`feature-panel-${index}`}
                      className={`
                        flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                        transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-[#0a0a1a]
                        ${isActive 
                          ? `bg-gradient-to-r ${feature.gradient} text-white shadow-lg` 
                          : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10"
                        }
                      `}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      <span className="hidden sm:inline">{feature.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Feature content */}
              <div 
                className="relative h-[320px] sm:h-[400px] lg:h-[480px] rounded-xl lg:rounded-2xl overflow-hidden"
                role="tabpanel"
                id={`feature-panel-${currentFeature}`}
                aria-labelledby={`feature-tab-${currentFeature}`}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentFeature}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0"
                  >
                    {/* Feature visualization */}
                    <div className={`relative h-full w-full bg-gradient-to-br ${activeFeature.gradient} rounded-xl lg:rounded-2xl border border-white/20 shadow-2xl overflow-hidden`}>
                      {/* Inner glow */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10" />
                      
                      {/* Decorative grid */}
                      <div 
                        className="absolute inset-0 opacity-10"
                        style={{
                          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 1px)`,
                          backgroundSize: "24px 24px",
                        }}
                      />
                      
                      {/* Feature content */}
                      <div className="relative h-full flex flex-col items-center justify-center p-8 text-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                          className="mb-6 p-6 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30"
                        >
                          <ActiveIcon className="h-16 w-16 lg:h-20 lg:w-20 text-white" aria-hidden="true" />
                        </motion.div>
                        
                        <motion.h3
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="text-3xl lg:text-4xl font-bold text-white mb-3"
                        >
                          {activeFeature.label}
                        </motion.h3>
                        
                        <motion.p
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          className="text-lg lg:text-xl text-white/80 max-w-md"
                        >
                          {activeFeature.description}
                        </motion.p>

                        {/* Feature-specific highlights */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          className="mt-8 flex flex-wrap justify-center gap-3"
                        >
                          {getFeatureHighlights(currentFeature).map((highlight, i) => (
                            <span 
                              key={i}
                              className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-sm text-white/90 border border-white/20"
                            >
                              {highlight}
                            </span>
                          ))}
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Progress indicators */}
              <div 
                className="flex justify-center gap-2 mt-6"
                role="group"
                aria-label="Feature progress"
              >
                {features.map((feature, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentFeature(index)}
                    aria-label={`Go to ${feature.label}`}
                    aria-current={index === currentFeature ? "true" : undefined}
                    className={`
                      h-1.5 rounded-full transition-all duration-500
                      focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-[#0a0a1a]
                      ${index === currentFeature 
                        ? `w-12 bg-gradient-to-r ${feature.gradient}` 
                        : "w-6 bg-white/20 hover:bg-white/40"
                      }
                    `}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade for smooth transition */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </section>
  );
}

// Helper function for feature-specific highlights
function getFeatureHighlights(featureIndex: number): string[] {
  const highlights = [
    ["Email Triage", "Data Entry", "Report Generation", "Meeting Scheduling"],
    ["No-Code Builder", "50+ Templates", "Conditional Logic", "Webhook Support"],
    ["Lead Scoring", "Auto-Transcribe", "Deal Pipeline", "AI Insights"],
    ["Multi-Channel", "ROI Tracking", "A/B Testing", "Audience Segments"],
    ["Semantic Search", "Document Q&A", "Auto-Tagging", "Version Control"],
  ];
  return highlights[featureIndex] || [];
}
