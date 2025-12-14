"use client";

import { useState } from "react";
import { CosmicBackground } from "@/components/shared/CosmicBackground";
import { SmartNavigation } from "@/components/shared/SmartNavigation";
import { Footer } from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SectionDivider } from "@/components/shared/SectionDivider";
import { motion } from "framer-motion";
import Image from "next/image";
import { 
  Bot, 
  Workflow, 
  BarChart3, 
  ArrowRight, 
  Sparkles,
  CheckCircle2,
  Clock,
  Rocket,
  ChevronUp,
  MessageSquare,
  Lightbulb,
  Zap,
  Users,
  FileSearch,
  Mail,
  Calendar,
  Shield,
  Database,
  Globe
} from "lucide-react";
import { useRouter } from "next/navigation";

// Feature data
const currentFeatures = [
  {
    icon: Bot,
    name: "Neptune AI Assistant",
    status: "live" as const,
    description: "24/7 autonomous AI that handles email triage, data entry, meeting scheduling, and more.",
    highlights: ["Natural language control", "Multi-provider AI", "Context-aware responses", "Task automation"],
    screenshot: "/screenshots/dashboard-demo.png"
  },
  {
    icon: Workflow,
    name: "Workflow Studio",
    status: "beta" as const,
    description: "Visual drag-and-drop builder for complex automation workflows with conditional logic.",
    highlights: ["No-code builder", "50+ templates", "Webhook support", "Custom integrations"],
    screenshot: "/screenshots/creator-demo.png"
  },
  {
    icon: BarChart3,
    name: "AI-Native CRM",
    status: "beta" as const,
    description: "Auto-transcribe calls, track deals, and manage your sales pipeline with AI-powered insights.",
    highlights: ["Lead scoring", "Auto-transcribe", "Deal pipeline", "Smart insights"],
    screenshot: "/screenshots/crm-demo.png"
  },
  {
    icon: FileSearch,
    name: "Knowledge Base",
    status: "live" as const,
    description: "AI-powered document search with semantic understanding and auto-tagging.",
    highlights: ["Semantic search", "Document Q&A", "Auto-tagging", "Version control"],
    screenshot: null
  },
  {
    icon: Mail,
    name: "Email Integration",
    status: "coming-soon" as const,
    description: "Deep Gmail and Outlook integration with smart filtering and auto-responses.",
    highlights: ["Smart filters", "Auto-responses", "Priority inbox", "Schedule send"],
    screenshot: null
  },
  {
    icon: Calendar,
    name: "Calendar Intelligence",
    status: "coming-soon" as const,
    description: "AI-powered scheduling that finds optimal meeting times and manages conflicts.",
    highlights: ["Smart scheduling", "Conflict resolution", "Time zone handling", "Buffer times"],
    screenshot: null
  }
];

const roadmapItems = [
  {
    quarter: "Q1 2026",
    items: [
      { name: "Advanced Workflow Triggers", description: "Webhook, schedule, and event-based automation triggers" },
      { name: "Team Collaboration", description: "Shared workspaces, permissions, and role-based access" },
      { name: "Mobile App (iOS/Android)", description: "Native mobile apps for on-the-go access" },
      { name: "Zapier Integration", description: "Connect with 5,000+ apps via Zapier" }
    ]
  },
  {
    quarter: "Q2 2026",
    items: [
      { name: "Custom AI Agents", description: "Build and train your own specialized AI agents" },
      { name: "API & Webhooks", description: "Full REST API and webhook support for developers" },
      { name: "Advanced Analytics", description: "Deep insights into workflows, agents, and business metrics" },
      { name: "White-label Options", description: "Custom branding for agency and enterprise clients" }
    ]
  },
  {
    quarter: "Q3 2026",
    items: [
      { name: "Enterprise SSO", description: "SAML, OAuth, and Active Directory integration" },
      { name: "Compliance Suite", description: "SOC 2, GDPR, and HIPAA compliance tools" },
      { name: "AI Agent Marketplace", description: "Share and sell custom agents with the community" },
      { name: "Advanced CRM Features", description: "Sales forecasting, pipeline analytics, and revenue intelligence" }
    ]
  }
];

export default function FeaturesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("current");

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
              Explore what's live now, what's coming next, and help shape our future.
            </p>
          </motion.div>
        </section>

        {/* Tabbed Content */}
        <section className="py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <Tabs defaultValue="current" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-center mb-12">
                <TabsList className="inline-flex h-12 bg-muted/50 backdrop-blur-sm border border-border/50">
                  <TabsTrigger value="current" className="gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Current Features</span>
                  </TabsTrigger>
                  <TabsTrigger value="roadmap" className="gap-2">
                    <Rocket className="h-4 w-4" />
                    <span>Roadmap</span>
                  </TabsTrigger>
                  <TabsTrigger value="vision" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span>Vision</span>
                  </TabsTrigger>
                  <TabsTrigger value="request" className="gap-2">
                    <Lightbulb className="h-4 w-4" />
                    <span>Request Features</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Current Features Tab */}
              <TabsContent value="current" className="space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                  {currentFeatures.map((feature, index) => {
                    const Icon = feature.icon;
                    const statusConfig = {
                      live: { bg: "bg-green-500/10", text: "text-green-700", label: "Live" },
                      beta: { bg: "bg-blue-500/10", text: "text-blue-700", label: "Beta" },
                      "coming-soon": { bg: "bg-gray-400/10", text: "text-gray-600", label: "Coming Soon" }
                    }[feature.status];

                    return (
                      <motion.div
                        key={feature.name}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <Card className="h-full hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <div className="flex items-start justify-between mb-2">
                              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Icon className="h-6 w-6 text-primary" />
                              </div>
                              <Badge className={`${statusConfig.bg} ${statusConfig.text} border-0`}>
                                {statusConfig.label}
                              </Badge>
                            </div>
                            <CardTitle className="text-xl">{feature.name}</CardTitle>
                            <CardDescription className="text-base">{feature.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                              {feature.highlights.map((highlight) => (
                                <Badge key={highlight} variant="secondary" className="text-xs">
                                  {highlight}
                                </Badge>
                              ))}
                            </div>
                            {feature.screenshot && (
                              feature.status === "live" || feature.status === "beta"
                            ) && (
                              <div className="relative rounded-lg overflow-hidden border border-border">
                                <Image
                                  src={feature.screenshot}
                                  alt={feature.name}
                                  width={800}
                                  height={450}
                                  className="w-full h-auto"
                                />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
                <div className="text-center pt-8">
                  <Button size="lg" onClick={handleEnterApp} className="gap-2">
                    Try All Features Free <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Roadmap Tab */}
              <TabsContent value="roadmap" className="space-y-12">
                <div className="text-center mb-8">
                  <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20 mb-4">
                    Product Roadmap
                  </Badge>
                  <h2 className="text-3xl font-bold mb-4">What We're Building</h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Our commitment to transparency. Vote on features and help shape the future of GalaxyCo.
                  </p>
                </div>

                <div className="space-y-8">
                  {roadmapItems.map((quarter, qIndex) => (
                    <motion.div
                      key={quarter.quarter}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: qIndex * 0.1 }}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <Badge className="text-base px-4 py-2 bg-gradient-to-r from-primary to-purple-600 text-white border-0">
                          {quarter.quarter}
                        </Badge>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        {quarter.items.map((item, iIndex) => (
                          <Card key={item.name} className="bg-card/50 backdrop-blur-sm hover:shadow-md transition-shadow">
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <CardTitle className="text-lg">{item.name}</CardTitle>
                                <Clock className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <CardDescription>{item.description}</CardDescription>
                            </CardHeader>
                          </Card>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              {/* Vision Tab */}
              <TabsContent value="vision" className="space-y-12">
                <div className="text-center mb-12">
                  <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20 mb-4">
                    Long-Term Vision
                  </Badge>
                  <h2 className="text-3xl font-bold mb-4">The Future of Work</h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    We're building more than software—we're creating an AI-native operating system for modern businesses.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      icon: Globe,
                      title: "Integration Ecosystem",
                      description: "Connect with every tool in your stack. From Salesforce to Slack, make your entire workflow intelligent."
                    },
                    {
                      icon: Shield,
                      title: "Enterprise Security",
                      description: "Bank-level encryption, SOC 2 compliance, and granular permissions that scale with your organization."
                    },
                    {
                      icon: Database,
                      title: "AI Agent Marketplace",
                      description: "Build, share, and monetize custom AI agents. A thriving ecosystem of specialized automation."
                    },
                    {
                      icon: Users,
                      title: "Collaborative Intelligence",
                      description: "AI that learns from your entire team, creating collective knowledge and shared workflows."
                    },
                    {
                      icon: Zap,
                      title: "Real-Time Automation",
                      description: "Zero-latency decision making. AI that reacts instantly to every change in your business."
                    },
                    {
                      icon: Sparkles,
                      title: "Predictive Analytics",
                      description: "AI that doesn't just react—it predicts. Forecast trends, identify risks, and seize opportunities."
                    }
                  ].map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.title}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <Card className="h-full text-center p-6 hover:shadow-lg transition-shadow">
                          <CardContent className="p-0 space-y-4">
                            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mx-auto">
                              <Icon className="h-7 w-7 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold">{item.title}</h3>
                            <p className="text-muted-foreground">{item.description}</p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Request Features Tab */}
              <TabsContent value="request" className="space-y-8">
                <div className="text-center mb-12">
                  <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20 mb-4">
                    Your Voice Matters
                  </Badge>
                  <h2 className="text-3xl font-bold mb-4">Request Features</h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Help us build the platform you need. Submit requests, vote on ideas, and see what we're working on.
                  </p>
                </div>

                <div className="max-w-3xl mx-auto">
                  <Card className="p-8 bg-gradient-to-br from-primary/5 to-purple-500/5 border-2 border-primary/20">
                    <div className="text-center space-y-6">
                      <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                        <Lightbulb className="h-10 w-10 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold mb-2">Feature Request System Coming Soon</h3>
                        <p className="text-muted-foreground text-lg">
                          We're building a public feature request board where you can:
                        </p>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4 text-left">
                        {[
                          { icon: Lightbulb, text: "Submit feature ideas" },
                          { icon: ChevronUp, text: "Upvote your favorites" },
                          { icon: MessageSquare, text: "Comment and discuss" },
                          { icon: CheckCircle2, text: "Track implementation status" }
                        ].map((item) => {
                          const Icon = item.icon;
                          return (
                            <div key={item.text} className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Icon className="h-4 w-4 text-primary" />
                              </div>
                              <span className="text-sm font-medium">{item.text}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="pt-4">
                        <p className="text-sm text-muted-foreground mb-4">
                          In the meantime, email us your ideas:
                        </p>
                        <Button size="lg" onClick={() => window.location.href = 'mailto:feedback@galaxyco.ai?subject=Feature Request'} className="gap-2">
                          <Mail className="h-4 w-4" />
                          Email Feature Request
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        <SectionDivider variant="gradient" />
        
        <Footer />
      </main>
    </div>
  );
}



