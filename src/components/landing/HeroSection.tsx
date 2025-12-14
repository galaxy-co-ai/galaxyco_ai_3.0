"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import {
  ArrowRight,
  Sparkles,
  Bot,
  Workflow,
  Users,
  BarChart3,
  FileSearch,
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
    gradient: "from-accent-cyan to-primary",
    bgGlow: "bg-accent-cyan/10",
  },
  {
    icon: Workflow,
    label: "Workflow Studio",
    description: "Visual drag-and-drop builder",
    gradient: "from-accent-cyan to-warm",
    bgGlow: "bg-accent-cyan/10",
  },
  {
    icon: Users,
    label: "Smart CRM",
    description: "AI-powered insights & scoring",
    gradient: "from-warm to-primary",
    bgGlow: "bg-warm/10",
  },
  {
    icon: BarChart3,
    label: "Marketing Hub",
    description: "Campaign analytics & ROI",
    gradient: "from-warm to-accent-cyan",
    bgGlow: "bg-warm/10",
  },
  {
    icon: FileSearch,
    label: "Knowledge Base",
    description: "AI-powered document search",
    gradient: "from-accent-cyan to-primary",
    bgGlow: "bg-accent-cyan/10",
  },
];

const stats = [
  { value: "10+", label: "hours saved weekly" },
  { value: "24/7", label: "AI support" },
  { value: "98%", label: "success rate" },
  { value: "3x", label: "productivity" },
];

// Animated background particles
const particles = [
  { size: 4, x: "10%", y: "20%", duration: 8, delay: 0 },
  { size: 6, x: "85%", y: "15%", duration: 10, delay: 1 },
  { size: 3, x: "20%", y: "70%", duration: 7, delay: 2 },
  { size: 5, x: "90%", y: "60%", duration: 9, delay: 0.5 },
  { size: 4, x: "5%", y: "45%", duration: 11, delay: 1.5 },
  { size: 7, x: "75%", y: "80%", duration: 8, delay: 3 },
  { size: 3, x: "45%", y: "10%", duration: 12, delay: 2.5 },
  { size: 5, x: "60%", y: "85%", duration: 9, delay: 0 },
  { size: 4, x: "30%", y: "35%", duration: 10, delay: 4 },
  { size: 6, x: "95%", y: "40%", duration: 7, delay: 1 },
  { size: 3, x: "15%", y: "90%", duration: 11, delay: 3.5 },
  { size: 5, x: "70%", y: "25%", duration: 8, delay: 2 },
];

export function HeroSection({ onEnterApp }: HeroSectionProps) {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);

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
      <div className="absolute inset-0 bg-void-black">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-deep-space/60 rounded-full blur-[120px] animate-pulse" />
        <div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent-cyan/10 rounded-full blur-[100px] animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-creamsicle/5 rounded-full blur-[150px]" />
        
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
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-void-black/80" />
      </div>

      {/* Animated Background Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
        {particles.map((particle, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/20"
            style={{
              width: particle.size,
              height: particle.size,
              left: particle.x,
              top: particle.y,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0.1, 0.4, 0.1],
              scale: [1, 1.2, 1],
              y: [0, -30, 0],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="w-full max-w-7xl mx-auto">
          {/* Beta Launch Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-8"
          >
              <Badge
              className="px-5 py-2.5 bg-primary/30 border border-accent-cyan/30 text-white backdrop-blur-md shadow-soft-lg hover:border-accent-cyan/45 transition-all duration-300 text-base font-semibold"
              role="status"
            >
              <Sparkles className="h-4 w-4 mr-2 text-accent-cyan animate-pulse" aria-hidden="true" />
              <span>Beta Launch — Free Until January 1, 2026</span>
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
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan to-warm">
                while you sleep
              </span>
            </h1>
          </motion.div>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg sm:text-xl lg:text-2xl text-gray-400 text-center max-w-3xl mx-auto mb-8 leading-relaxed"
          >
            Deploy autonomous AI agents that manage your CRM, automate workflows, 
            and deliver insights—freeing you to focus on what matters.
          </motion.p>

          {/* Beta Launch Value Props */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="flex flex-wrap justify-center items-center gap-4 mb-10 px-4"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-white/80">All Pro Features Unlocked</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="h-2 w-2 rounded-full bg-accent-cyan animate-pulse" />
              <span className="text-sm text-white/80">Your Data, Forever</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="h-2 w-2 rounded-full bg-warm animate-pulse" />
              <span className="text-sm text-white/80">Shape the Roadmap</span>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center mb-12 lg:mb-16"
          >
            <Button
              onClick={onEnterApp}
              variant="cta"
              className="h-12 rounded-xl px-6 text-base font-semibold group focus-visible:ring-offset-void-black"
              aria-label="Join GalaxyCo AI Beta for free"
            >
              Join Free Beta
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Button>
            <button
              onClick={() => window.location.href = '/features#roadmap'}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-base font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:ring-offset-2 focus:ring-offset-void-black bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/30 backdrop-blur-sm group"
              aria-label="View product roadmap"
            >
              View Roadmap
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </button>
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
                        transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:ring-offset-2 focus:ring-offset-void-black
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
                      focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:ring-offset-2 focus:ring-offset-void-black
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
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />

      {/* Demo Video Modal */}
      <Dialog open={showDemoModal} onOpenChange={setShowDemoModal}>
        <DialogContent className="sm:max-w-3xl bg-void-black/90 border border-white/10 text-white backdrop-blur-xl shadow-soft-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Play className="h-5 w-5 text-accent-cyan" />
              Platform Demo
            </DialogTitle>
            <DialogDescription className="text-white/70">
              See how GalaxyCo.ai can transform your business operations
            </DialogDescription>
          </DialogHeader>
          <div className="relative aspect-video bg-white/5 border border-white/10 rounded-lg overflow-hidden flex items-center justify-center">
            {/* Placeholder for demo video - replace with actual video embed */}
            <div className="text-center p-8">
              <div className="w-20 h-20 rounded-full bg-accent-cyan/15 border border-accent-cyan/20 flex items-center justify-center mx-auto mb-4">
                <Play className="h-10 w-10 text-accent-cyan" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Demo Video Coming Soon</h3>
              <p className="text-white/70 text-sm max-w-md">
                We&apos;re putting the finishing touches on our demo video.
                In the meantime, click &quot;Try It Now&quot; to explore the platform yourself!
              </p>
              <Button
                onClick={() => {
                  setShowDemoModal(false);
                  onEnterApp();
                }}
                variant="cta"
                className="mt-6"
              >
                Try It Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
