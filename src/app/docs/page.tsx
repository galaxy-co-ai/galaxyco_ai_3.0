"use client";

import { useState } from "react";
import { CosmicBackground } from "@/components/shared/CosmicBackground";
import { SmartNavigation } from "@/components/shared/SmartNavigation";
import { Footer } from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  User, 
  Code2, 
  Shield, 
  Bot,
  Search,
  BookOpen,
  Rocket,
  Zap,
  Key,
  Database,
  Webhook,
  Users,
  Settings,
  BarChart3,
  FileText,
  HelpCircle,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock
} from "lucide-react";

type UserType = "end-users" | "developers" | "admins" | "ai-agents";

interface DocSection {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  lastUpdated: string;
  status?: "stable" | "beta" | "new";
}

const docSections: Record<UserType, DocSection[]> = {
  "end-users": [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: Rocket,
      description: "5-minute quickstart guide to using GalaxyCo.ai",
      lastUpdated: "2025-12-14",
      status: "stable"
    },
    {
      id: "core-concepts",
      title: "Core Concepts",
      icon: BookOpen,
      description: "Understanding workflows, agents, and automation",
      lastUpdated: "2025-12-14",
      status: "stable"
    },
    {
      id: "neptune-ai",
      title: "Neptune AI Assistant",
      icon: Bot,
      description: "How to interact with and train your AI assistant",
      lastUpdated: "2025-12-14",
      status: "stable"
    },
    {
      id: "workflows",
      title: "Building Workflows",
      icon: Zap,
      description: "Create and manage automated workflows",
      lastUpdated: "2025-12-10",
      status: "beta"
    },
    {
      id: "crm-basics",
      title: "CRM Essentials",
      icon: Users,
      description: "Managing contacts, deals, and pipelines",
      lastUpdated: "2025-12-12",
      status: "stable"
    },
    {
      id: "best-practices",
      title: "Best Practices",
      icon: CheckCircle2,
      description: "Tips and patterns for power users",
      lastUpdated: "2025-12-08",
      status: "stable"
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting",
      icon: HelpCircle,
      description: "Common issues and solutions",
      lastUpdated: "2025-12-14",
      status: "stable"
    }
  ],
  "developers": [
    {
      id: "api-overview",
      title: "API Overview",
      icon: Code2,
      description: "REST API architecture and capabilities",
      lastUpdated: "2025-12-14",
      status: "new"
    },
    {
      id: "authentication",
      title: "Authentication",
      icon: Key,
      description: "API keys, OAuth, and security",
      lastUpdated: "2025-12-14",
      status: "stable"
    },
    {
      id: "api-reference",
      title: "API Reference",
      icon: Database,
      description: "Complete endpoint documentation",
      lastUpdated: "2025-12-14",
      status: "stable"
    },
    {
      id: "webhooks",
      title: "Webhooks & Events",
      icon: Webhook,
      description: "Real-time event notifications",
      lastUpdated: "2025-12-10",
      status: "beta"
    },
    {
      id: "rate-limits",
      title: "Rate Limits",
      icon: BarChart3,
      description: "API quotas and best practices",
      lastUpdated: "2025-12-14",
      status: "stable"
    },
    {
      id: "sdks",
      title: "SDKs & Libraries",
      icon: Code2,
      description: "Official client libraries",
      lastUpdated: "2025-12-05",
      status: "beta"
    },
    {
      id: "errors",
      title: "Error Handling",
      icon: AlertCircle,
      description: "Error codes and debugging",
      lastUpdated: "2025-12-14",
      status: "stable"
    },
    {
      id: "changelog",
      title: "Changelog",
      icon: Clock,
      description: "API version history",
      lastUpdated: "2025-12-14",
      status: "stable"
    }
  ],
  "admins": [
    {
      id: "team-management",
      title: "Team Management",
      icon: Users,
      description: "Add, remove, and manage team members",
      lastUpdated: "2025-12-14",
      status: "stable"
    },
    {
      id: "permissions",
      title: "Permissions & Roles",
      icon: Shield,
      description: "Role-based access control",
      lastUpdated: "2025-12-12",
      status: "stable"
    },
    {
      id: "security",
      title: "Security Configuration",
      icon: Key,
      description: "SSO, 2FA, and security policies",
      lastUpdated: "2025-12-10",
      status: "beta"
    },
    {
      id: "billing",
      title: "Billing & Usage",
      icon: BarChart3,
      description: "Monitor usage and manage subscriptions",
      lastUpdated: "2025-12-14",
      status: "stable"
    },
    {
      id: "audit-logs",
      title: "Audit Logs",
      icon: FileText,
      description: "Track all system activities",
      lastUpdated: "2025-12-08",
      status: "beta"
    },
    {
      id: "advanced-settings",
      title: "Advanced Settings",
      icon: Settings,
      description: "System configuration and customization",
      lastUpdated: "2025-12-14",
      status: "stable"
    },
    {
      id: "compliance",
      title: "Compliance",
      icon: Shield,
      description: "GDPR, SOC 2, and data protection",
      lastUpdated: "2025-12-01",
      status: "stable"
    }
  ],
  "ai-agents": [
    {
      id: "platform-overview",
      title: "Platform Overview",
      icon: Database,
      description: "Complete capabilities and constraints",
      lastUpdated: "2025-12-14",
      status: "stable"
    },
    {
      id: "data-models",
      title: "Data Models",
      icon: Database,
      description: "Entity schemas and relationships",
      lastUpdated: "2025-12-14",
      status: "stable"
    },
    {
      id: "use-case-taxonomy",
      title: "Use Case Taxonomy",
      icon: BookOpen,
      description: "Categorized use cases and patterns",
      lastUpdated: "2025-12-14",
      status: "stable"
    },
    {
      id: "api-specs",
      title: "API Specifications",
      icon: Code2,
      description: "OpenAPI/Swagger documentation",
      lastUpdated: "2025-12-14",
      status: "stable"
    },
    {
      id: "integration-patterns",
      title: "Integration Patterns",
      icon: Webhook,
      description: "Common integration architectures",
      lastUpdated: "2025-12-12",
      status: "stable"
    },
    {
      id: "performance",
      title: "Performance Benchmarks",
      icon: Zap,
      description: "Response times and throughput",
      lastUpdated: "2025-12-10",
      status: "stable"
    },
    {
      id: "limitations",
      title: "Limitations",
      icon: AlertCircle,
      description: "Known constraints and boundaries",
      lastUpdated: "2025-12-14",
      status: "stable"
    }
  ]
};

export default function DocsPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<UserType>("end-users");
  const [searchQuery, setSearchQuery] = useState("");

  const handleEnterApp = () => {
    router.push("/dashboard");
  };

  const currentSections = docSections[userType];
  const filteredSections = searchQuery
    ? currentSections.filter(
        (section) =>
          section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          section.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : currentSections;

  const statusConfig = {
    stable: { bg: "bg-green-500/10", text: "text-green-700", label: "Stable" },
    beta: { bg: "bg-accent-cyan-soft", text: "text-accent-cyan-ink", label: "Beta" },
    new: { bg: "bg-warm-soft", text: "text-warm-ink", label: "New" },
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
              Documentation
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold">
              Everything You Need to Know
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive guides, API references, and best practices to master GalaxyCo.ai
            </p>
          </motion.div>
        </section>

        {/* User Type Tabs */}
        <section className="py-6 px-6">
          <div className="max-w-7xl mx-auto">
            <Tabs defaultValue="end-users" value={userType} onValueChange={(v) => setUserType(v as UserType)}>
              <div className="flex justify-center mb-12">
                <TabsList className="inline-flex h-12 bg-muted/50 backdrop-blur-sm border border-border/50">
                  <TabsTrigger value="end-users" className="gap-2">
                    <User className="h-4 w-4" />
                    <span>End Users</span>
                  </TabsTrigger>
                  <TabsTrigger value="developers" className="gap-2">
                    <Code2 className="h-4 w-4" />
                    <span>Developers</span>
                  </TabsTrigger>
                  <TabsTrigger value="admins" className="gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Admins</span>
                  </TabsTrigger>
                  <TabsTrigger value="ai-agents" className="gap-2">
                    <Bot className="h-4 w-4" />
                    <span>AI Agents</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Search Bar */}
              <div className="max-w-2xl mx-auto mb-8">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search documentation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 bg-card/50 backdrop-blur-sm border-border/50"
                  />
                </div>
              </div>

              {/* Documentation Sections */}
              <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
                {filteredSections.map((section, index) => {
                  const Icon = section.icon;
                  const status = section.status ? statusConfig[section.status] : null;

                  return (
                    <motion.div
                      key={section.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                    >
                      <Card className="h-full hover:shadow-lg transition-all cursor-pointer group">
                        <CardHeader>
                          <div className="flex items-start justify-between mb-2">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                              <Icon className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex items-center gap-2">
                              {status && (
                                <Badge className={`${status.bg} ${status.text} border-0 text-xs`}>
                                  {status.label}
                                </Badge>
                              )}
                              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                          <CardTitle className="text-xl group-hover:text-primary transition-colors">{section.title}</CardTitle>
                          <CardDescription className="text-base">{section.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Updated {new Date(section.lastUpdated).toLocaleDateString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {filteredSections.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No documentation found for "{searchQuery}"</p>
                </div>
              )}

              {/* Coming Soon Notice */}
              <div className="max-w-3xl mx-auto mt-16">
                <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-2 border-primary/20">
                  <CardContent className="p-8 text-center space-y-4">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                      <FileText className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Full Documentation Coming Soon</h3>
                      <p className="text-muted-foreground text-lg">
                        We're actively writing comprehensive guides for each section. During beta, join our{" "}
                        <a href="/contact" className="text-primary hover:underline inline-flex items-center gap-1">
                          office hours <ExternalLink className="h-3 w-3" />
                        </a>{" "}
                        for personalized onboarding.
                      </p>
                    </div>
                    <div className="pt-4">
                      <Button size="lg" variant="cta" onClick={handleEnterApp} className="gap-2">
                        Start Building <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </Tabs>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}

