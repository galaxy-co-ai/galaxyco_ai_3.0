"use client";
import { useEffect } from "react";
import { Badge } from "../components/ui/badge";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { HeroSection } from "../components/landing/HeroSection";
import { FooterCTA } from "../components/landing/FooterCTA";
import { Footer } from "../components/landing/Footer";
import { SmartNavigation } from "../components/shared/SmartNavigation";
import { EnhancedThreePillars } from "../components/landing/EnhancedThreePillars";
import { EnhancedBenefits } from "../components/landing/EnhancedBenefits";
import { SectionDivider } from "../components/shared/SectionDivider";
import Image from "next/image";
import { FloatingSalesChat } from "../components/landing/FloatingSalesChat";

interface LandingProps {
  onEnterApp?: () => void;
}

export function Landing({ onEnterApp }: LandingProps = {}) {
  // Scroll to top on mount to ensure page starts at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Smart Navigation */}
      <SmartNavigation onEnterApp={onEnterApp} />

      {/* Epic Hero Section */}
      {onEnterApp && <HeroSection onEnterApp={onEnterApp} />}

      {/* Enhanced Three Pillars Section */}
      <EnhancedThreePillars />

      {/* Section Divider */}
      <SectionDivider variant="dots" />

      {/* Platform Showcase Section */}
      <section id="features" className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 shadow-lg">
                <Sparkles className="h-3.5 w-3.5 mr-2" />
                Platform Features
              </Badge>
              <h2 className="mb-4 text-3xl lg:text-4xl">See Your Platform in Action</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
                Real screenshots from our platform. Experience how AI agents, workflows, and intelligent automation work together seamlessly.
              </p>
            </motion.div>
          </div>

          <div className="space-y-32">
            {/* Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className="space-y-8"
            >
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    AI Assistant
                  </Badge>
                </div>
                <h3 className="text-3xl mb-4">Real-Time AI Dashboard</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Monitor all AI agent activity with live updates, quick actions, and instant insights into your automation workflows. Your command center for productivity.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-0">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Live Updates
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-0">24/7 Monitoring</Badge>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-0">AI-Powered</Badge>
                </div>
              </div>
              
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl opacity-20 blur-xl group-hover:opacity-30 transition-opacity" />
                <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                  <Image
                    src="/screenshots/dashboard-demo.png"
                    alt="GalaxyCo AI Dashboard - Real-time agent monitoring and task automation"
                    width={1920}
                    height={1080}
                    className="w-full h-auto"
                    priority
                  />
                </div>
              </div>
            </motion.div>

            {/* Studio Preview */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className="space-y-8"
            >
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-1 w-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    Workflow Builder
                  </Badge>
                </div>
                <h3 className="text-3xl mb-4">Visual Workflow Studio</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Build complex automation workflows with our intuitive drag-and-drop interface. Connect your tools, define logic, and watch AI agents execute your processes flawlessly.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-0">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Drag & Drop
                  </Badge>
                  <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-0">No Code</Badge>
                  <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-0">Visual Builder</Badge>
                </div>
              </div>
              
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-20 blur-xl group-hover:opacity-30 transition-opacity" />
                <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                  <Image
                    src="/screenshots/creator-demo.png"
                    alt="GalaxyCo AI Creator Studio - Visual workflow builder for content creation"
                    width={1920}
                    height={1080}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </motion.div>

            {/* CRM Preview */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className="space-y-8"
            >
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-1 w-12 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full" />
                  <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                    CRM
                  </Badge>
                </div>
                <h3 className="text-3xl mb-4">AI-Native CRM</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Auto-transcribe calls and meetings, track deals with AI-powered insights, and manage your entire sales pipeline. Every conversation becomes actionable data.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="secondary" className="bg-pink-50 text-pink-700 border-0">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Auto-Transcribe
                  </Badge>
                  <Badge variant="secondary" className="bg-pink-50 text-pink-700 border-0">Smart Insights</Badge>
                  <Badge variant="secondary" className="bg-pink-50 text-pink-700 border-0">Deal Tracking</Badge>
                </div>
              </div>
              
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-orange-500 rounded-2xl opacity-20 blur-xl group-hover:opacity-30 transition-opacity" />
                <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                  <Image
                    src="/screenshots/crm-demo.png"
                    alt="GalaxyCo AI CRM - AI-native customer relationship management with Neptune assistant"
                    width={1920}
                    height={1080}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </motion.div>

            {/* Marketing Preview */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className="space-y-8"
            >
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-1 w-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full" />
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    Marketing
                  </Badge>
                </div>
                <h3 className="text-3xl mb-4">Intelligent Marketing Hub</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Launch campaigns, track performance across all channels, and optimize with AI-driven recommendations. Real-time analytics and conversion tracking at your fingertips.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-0">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Campaign Management
                  </Badge>
                  <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-0">Analytics</Badge>
                  <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-0">AI Optimization</Badge>
                </div>
              </div>
              
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl opacity-20 blur-xl group-hover:opacity-30 transition-opacity" />
                <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                  <Image
                    src="/screenshots/marketing-demo.png"
                    alt="GalaxyCo AI Marketing Hub - Campaign management and AI-driven analytics"
                    width={1920}
                    height={1080}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <SectionDivider variant="gradient" />

      {/* Enhanced Benefits Section */}
      <EnhancedBenefits />

      {/* Section Divider */}
      <SectionDivider variant="sparkle" />

      {/* Final CTA */}
      {onEnterApp && <FooterCTA onEnterApp={onEnterApp} />}

      {/* Footer */}
      <Footer />

      {/* Floating Sales Chat */}
      <FloatingSalesChat />
    </div>
  );
}


