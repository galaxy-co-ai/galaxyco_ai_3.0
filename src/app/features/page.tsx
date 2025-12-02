"use client";

import { CosmicBackground } from "@/components/shared/CosmicBackground";
import { SmartNavigation } from "@/components/shared/SmartNavigation";
import { Footer } from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionDivider } from "@/components/shared/SectionDivider";
import { DemoWrapper } from "@/components/shared/DemoWrapper";
import { motion } from "framer-motion";
import { Sparkles, Bot, Workflow, BarChart3, ArrowRight, Zap, Shield, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import DashboardDashboard from "@/components/dashboard/DashboardDashboard";
import CRMDashboard from "@/components/crm/CRMDashboard";
import CreatorDashboard from "@/components/creator/CreatorDashboard";

export default function FeaturesPage() {
  const router = useRouter();

  const handleEnterApp = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <SmartNavigation onEnterApp={handleEnterApp} />
      
      <div className="fixed inset-0 z-0 opacity-30 pointer-events-none">
        <CosmicBackground />
      </div>

      <main className="relative z-10 flex-1 pt-24">
        {/* Hero Section */}
        <section className="py-20 px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto space-y-6"
          >
            <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20 backdrop-blur-sm">
              Platform Overview
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-blue-600 leading-tight">
              A Complete AI Operating System for Your Business
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three powerful modules working in harmony to automate your workflows, manage your relationships, and scale your operations.
            </p>
          </motion.div>
        </section>

        {/* Feature Modules */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto space-y-32">
            
            {/* Module 1: AI Assistant */}
            <div className="space-y-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="max-w-3xl mx-auto text-center space-y-6"
              >
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto">
                  <Bot className="h-6 w-6 text-blue-500" />
                </div>
                <h2 className="text-3xl font-bold">Intelligent AI Assistant</h2>
                <p className="text-lg text-muted-foreground">
                  Your 24/7 co-pilot that understands your business context. Ask questions, generate content, and execute tasks through natural conversation.
                </p>
                <Button onClick={handleEnterApp} className="gap-2">
                  Try Assistant <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
              <motion.div
                 initial={{ opacity: 0, y: 40 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.6 }}
                 className="relative"
              >
                <div className="relative h-[500px] sm:h-[600px] lg:h-[700px] xl:h-[800px] rounded-xl overflow-hidden">
                  <div className="relative h-full w-full bg-white rounded-xl border border-white/20 shadow-2xl overflow-hidden">
                    <DemoWrapper scale={0.75} height={700} needsSidebar={false}>
                      <DashboardDashboard 
                        initialTab="snapshot"
                        initialData={{
                          stats: {
                            activeAgents: 12,
                            tasksCompleted: 1247,
                            hoursSaved: 342,
                          },
                          agents: [
                            {
                              id: "1",
                              name: "Email Triage Agent",
                              initials: "ET",
                              color: "bg-blue-500",
                              message: "Processed 12 high-priority emails",
                              time: "2 min ago",
                              active: true,
                              status: "Active now",
                              role: "email",
                              conversation: [],
                            },
                          ],
                          events: [],
                        }}
                      />
                    </DemoWrapper>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Module 2: Studio */}
            <div className="space-y-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="max-w-3xl mx-auto text-center space-y-6"
              >
                <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto">
                  <Workflow className="h-6 w-6 text-purple-500" />
                </div>
                <h2 className="text-3xl font-bold">Workflow Studio</h2>
                <p className="text-lg text-muted-foreground">
                  Visually build complex automations without writing code. Connect your favorite tools and let AI agents handle the heavy lifting.
                </p>
                <Button onClick={handleEnterApp} variant="outline" className="gap-2">
                  Explore Studio <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
              <motion.div
                 initial={{ opacity: 0, y: 40 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.6 }}
                 className="relative"
              >
                <div className="relative h-[500px] sm:h-[600px] lg:h-[700px] xl:h-[800px] rounded-xl overflow-hidden">
                  <div className="relative h-full w-full bg-white rounded-xl border border-white/20 shadow-2xl overflow-hidden">
                    <DemoWrapper scale={0.75} height={800} needsSidebar={false}>
                      <CreatorDashboard />
                    </DemoWrapper>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Module 3: CRM */}
            <div className="space-y-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="max-w-3xl mx-auto text-center space-y-6"
              >
                <div className="h-12 w-12 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto">
                  <BarChart3 className="h-6 w-6 text-orange-500" />
                </div>
                <h2 className="text-3xl font-bold">AI-Native CRM</h2>
                <p className="text-lg text-muted-foreground">
                  The first CRM that updates itself. From auto-transcribing calls to predicting deal success, your data is always live and actionable.
                </p>
                <Button onClick={handleEnterApp} variant="outline" className="gap-2">
                  View CRM <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
              <motion.div
                 initial={{ opacity: 0, y: 40 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.6 }}
                 className="relative"
              >
                <div className="relative h-[500px] sm:h-[600px] lg:h-[700px] xl:h-[800px] rounded-xl overflow-hidden">
                  <div className="relative h-full w-full bg-white rounded-xl border border-white/20 shadow-2xl overflow-hidden">
                    <DemoWrapper scale={0.75} height={700} needsSidebar={false}>
                      <CRMDashboard 
                        initialTab="insights"
                        initialLeads={[
                          {
                            id: "1",
                            name: "Sarah Johnson",
                            email: "sarah@techcorp.com",
                            company: "TechCorp",
                            title: "VP of Sales",
                            phone: "+1 (555) 123-4567",
                            stage: "qualified",
                            score: 85,
                            estimatedValue: 50000,
                            lastContactedAt: new Date(),
                            nextFollowUpAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                            interactionCount: 3,
                            source: "Website",
                            tags: ["hot", "enterprise"],
                            notes: "Interested in enterprise plan",
                          },
                        ]}
                        initialOrganizations={[]}
                        initialContacts={[]}
                        initialDeals={[]}
                        stats={{
                          totalLeads: 1,
                          hotLeads: 1,
                          totalOrgs: 0,
                          totalValue: 50000,
                        }}
                      />
                    </DemoWrapper>
                  </div>
                </div>
              </motion.div>
            </div>

          </div>
        </section>

        <SectionDivider variant="gradient" />
        
        <Footer />
      </main>
    </div>
  );
}



