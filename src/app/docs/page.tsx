"use client";

import { useState, useEffect } from "react";
import { SmartNavigation } from "@/components/shared/SmartNavigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
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
  Clock,
  Menu,
  X,
  Sparkles
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

const userTypeConfig: Record<UserType, { label: string; icon: React.ElementType; description: string }> = {
  "end-users": { 
    label: "End Users", 
    icon: User, 
    description: "Guides for everyday platform usage" 
  },
  "developers": { 
    label: "Developers", 
    icon: Code2, 
    description: "API docs, SDKs, and integrations" 
  },
  "admins": { 
    label: "Admins", 
    icon: Shield, 
    description: "Team management and security" 
  },
  "ai-agents": { 
    label: "AI Agents", 
    icon: Bot, 
    description: "Machine-readable specifications" 
  },
};

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

const quickLinks = [
  { label: "API Reference", href: "#api-reference", icon: Code2 },
  { label: "Changelog", href: "#changelog", icon: Clock },
  { label: "Contact Support", href: "/contact", icon: HelpCircle },
];

const statusConfig = {
  stable: { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/20" },
  beta: { bg: "bg-nebula-violet/10", text: "text-nebula-violet", border: "border-nebula-violet/20" },
  new: { bg: "bg-nebula-teal/10", text: "text-nebula-teal", border: "border-nebula-teal/20" },
};

export default function DocsPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<UserType>("end-users");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

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

  // Close sidebar on route change or resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const currentConfig = userTypeConfig[userType];
  const CurrentIcon = currentConfig.icon;

  return (
    <div className="min-h-screen bg-background">
      <SmartNavigation onEnterApp={handleEnterApp} />
      
      {/* Minimal Hero Section */}
      <section className="relative pt-[73px] overflow-hidden">
        {/* Dark nebula background */}
        <div className="absolute inset-0 bg-gradient-to-b from-nebula-void via-nebula-deep to-nebula-dark" />
        
        {/* Subtle nebula accents */}
        <div className="absolute top-1/2 left-1/4 w-[500px] h-[300px] bg-nebula-violet/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[250px] bg-nebula-teal/8 rounded-full blur-[80px]" />
        
        {/* Hero content */}
        <div className="relative z-10 px-6 py-16 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-nebula-frost tracking-tight mb-4">
              Documentation
            </h1>
            <p className="text-lg sm:text-xl text-nebula-frost/60 max-w-2xl mx-auto">
              Everything you need to build, integrate, and scale with GalaxyCo.ai
            </p>
          </motion.div>
        </div>
        
        {/* Bottom fade to content */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Subtle nebula background for content area */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" style={{ top: "300px" }}>
        <div className="absolute top-0 right-1/4 w-[800px] h-[600px] bg-nebula-violet/[0.02] rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[500px] bg-nebula-teal/[0.02] rounded-full blur-[120px]" />
      </div>

      <div className="flex min-h-[calc(100vh-300px)]">
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed bottom-6 left-6 z-40 lg:hidden h-12 w-12 rounded-full bg-nebula-dark text-nebula-frost shadow-lg flex items-center justify-center border border-nebula-frost/10"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-nebula-void/60 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-0 left-0 z-50 lg:z-10 h-screen w-72 lg:w-64 xl:w-72
            bg-background/95 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none
            border-r border-border/50 lg:border-0
            transform transition-transform duration-300 ease-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            pt-0
          `}
        >
          <div className="h-full overflow-y-auto py-6 px-4 lg:px-6">
            {/* Mobile close button */}
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Navigation</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center"
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* User Type Pills */}
            <div className="space-y-1 mb-8">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3 block">
                Documentation
              </span>
              {(Object.keys(userTypeConfig) as UserType[]).map((type) => {
                const config = userTypeConfig[type];
                const Icon = config.icon;
                const isActive = userType === type;
                
                return (
                  <button
                    key={type}
                    onClick={() => {
                      setUserType(type);
                      setActiveSection(null);
                      setSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                      transition-all duration-200
                      ${isActive 
                        ? "bg-nebula-dark text-nebula-frost shadow-sm" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }
                    `}
                  >
                    <div className={`
                      h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0
                      ${isActive 
                        ? "bg-gradient-to-br from-nebula-teal to-nebula-violet" 
                        : "bg-muted"
                      }
                    `}>
                      <Icon className={`h-4 w-4 ${isActive ? "text-nebula-frost" : "text-muted-foreground"}`} />
                    </div>
                    <span>{config.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="h-px bg-border/50 mx-3 mb-6" />

            {/* Section Links */}
            <div className="space-y-1 mb-8">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3 block">
                {currentConfig.label} Docs
              </span>
              {currentSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id);
                      setSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                      transition-all duration-150
                      ${isActive 
                        ? "bg-nebula-teal/10 text-nebula-teal font-medium" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                      }
                    `}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{section.title}</span>
                    {section.status === "new" && (
                      <span className="ml-auto text-[10px] font-semibold text-nebula-teal bg-nebula-teal/10 px-1.5 py-0.5 rounded">
                        NEW
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="h-px bg-border/50 mx-3 mb-6" />

            {/* Quick Links */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3 block">
                Quick Links
              </span>
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all duration-150"
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span>{link.label}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="relative flex-1 min-w-0 lg:pl-0">
          {/* Subtle nebula background for content area */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-20 right-1/4 w-[600px] h-[400px] bg-nebula-violet/[0.03] rounded-full blur-[120px]" />
            <div className="absolute bottom-1/3 left-1/4 w-[500px] h-[350px] bg-nebula-teal/[0.02] rounded-full blur-[100px]" />
          </div>
          
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-10"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-base bg-card/80 backdrop-blur-sm border-border/50 rounded-2xl shadow-soft focus-visible:ring-nebula-teal/30"
                  aria-label="Search documentation"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                  <kbd className="px-2 py-1 rounded bg-muted border border-border/50 font-mono">⌘</kbd>
                  <kbd className="px-2 py-1 rounded bg-muted border border-border/50 font-mono">K</kbd>
                </div>
              </div>
            </motion.div>

            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-nebula-teal to-nebula-violet flex items-center justify-center">
                  <CurrentIcon className="h-5 w-5 text-nebula-frost" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{currentConfig.label}</h1>
                  <p className="text-sm text-muted-foreground">{currentConfig.description}</p>
                </div>
              </div>
            </motion.div>

            {/* Doc Cards */}
            <div className="space-y-3">
              {filteredSections.map((section, index) => {
                const Icon = section.icon;
                const status = section.status ? statusConfig[section.status] : null;

                return (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 * index }}
                  >
                    <button
                      onClick={() => setActiveSection(section.id)}
                      className="w-full group"
                    >
                      <div className="relative flex items-center gap-4 p-4 sm:p-5 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 hover:border-nebula-teal/30 hover:bg-card/80 transition-all duration-200 shadow-soft hover:shadow-soft-hover text-left">
                        {/* Nebula glow on hover */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-nebula-teal/5 to-nebula-violet/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {/* Icon */}
                        <div className="relative h-12 w-12 rounded-xl bg-muted/50 group-hover:bg-gradient-to-br group-hover:from-nebula-teal/20 group-hover:to-nebula-violet/20 flex items-center justify-center flex-shrink-0 transition-all duration-200">
                          <Icon className="h-6 w-6 text-muted-foreground group-hover:text-nebula-teal transition-colors" />
                        </div>

                        {/* Content */}
                        <div className="relative flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground group-hover:text-nebula-teal transition-colors">
                              {section.title}
                            </h3>
                            {status && (
                              <Badge className={`${status.bg} ${status.text} ${status.border} border text-[10px] px-1.5 py-0`}>
                                {section.status === "stable" ? "Stable" : section.status === "beta" ? "Beta" : "New"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {section.description}
                          </p>
                        </div>

                        {/* Arrow */}
                        <ChevronRight className="relative h-5 w-5 text-muted-foreground/50 group-hover:text-nebula-teal group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {/* No results */}
            {filteredSections.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  No documentation matches "{searchQuery}"
                </p>
              </motion.div>
            )}

            {/* Coming Soon CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-12"
            >
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-nebula-dark to-nebula-void p-8 text-nebula-frost">
                {/* Nebula accents */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-nebula-violet/20 rounded-full blur-[80px]" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-nebula-teal/20 rounded-full blur-[60px]" />
                
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="h-14 w-14 rounded-2xl bg-nebula-frost/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-7 w-7 text-nebula-teal" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">Full Documentation Coming Soon</h3>
                    <p className="text-nebula-frost/70 text-sm">
                      We're actively writing comprehensive guides. During beta, join our office hours for personalized onboarding.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      className="border-nebula-frost/20 text-nebula-frost hover:bg-nebula-frost/10 hover:border-nebula-frost/30"
                      asChild
                    >
                      <a href="/contact" className="gap-2">
                        Office Hours
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      onClick={handleEnterApp}
                      className="bg-nebula-frost text-nebula-void hover:bg-nebula-frost/90"
                    >
                      Start Building
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Footer spacing */}
            <div className="h-16" />
          </div>
        </main>
      </div>
    </div>
  );
}