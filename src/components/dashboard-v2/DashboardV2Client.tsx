"use client";

/**
 * Dashboard v2 Client Component
 * 
 * User-centered dashboard matching the design patterns of CRM and Finance HQ.
 * Compact header, floating tab bar, guided content.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Users, 
  Bot, 
  Plug,
  Home,
  Compass,
  Trophy,
  Grid3X3,
  ArrowRight,
  CheckCircle2,
  Zap,
  DollarSign,
  Lightbulb,
  Workflow,
  GraduationCap,
  FolderOpen,
  Megaphone,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardV2Data } from '@/types/dashboard-v2';

interface DashboardV2ClientProps {
  initialData: DashboardV2Data;
}

type TabType = 'home' | 'pathways' | 'wins' | 'tools';

export default function DashboardV2Client({ initialData }: DashboardV2ClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const { user, nextStep, wins, stats } = initialData;
  
  const isFirstTime = user.isFirstTime ?? false;
  const greeting = getTimeBasedGreeting();

  // Tab configuration
  const tabs = [
    { id: 'home' as TabType, label: 'Home', icon: Home, activeColor: 'bg-blue-100 text-blue-700' },
    { id: 'pathways' as TabType, label: 'Pathways', icon: Compass, activeColor: 'bg-purple-100 text-purple-700' },
    { id: 'wins' as TabType, label: 'Wins', icon: Trophy, badge: wins.length > 0 ? wins.length.toString() : undefined, activeColor: 'bg-amber-100 text-amber-700' },
    { id: 'tools' as TabType, label: 'Quick Access', icon: Grid3X3, activeColor: 'bg-emerald-100 text-emerald-700' },
  ];

  return (
    <div className="h-full bg-gray-50/50 overflow-y-auto">
      {/* Header Section - Matching CRM/Finance */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 space-y-4">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting}, {user.name}!
          </h1>
          <p className="text-muted-foreground text-sm">
            {isFirstTime 
              ? "Welcome to GalaxyCo. Let's get you your first win."
              : "Let's help you get your next win quickly."
            }
          </p>

          {/* Stats Bar - Compact Inline Centered */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Badge className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors text-xs">
              <Bot className="h-3 w-3 mr-1 text-purple-600" />
              <span className="font-semibold">{stats.activeAgents}</span>
              <span className="ml-1 text-purple-600/70 font-normal">Agents</span>
            </Badge>
            <Badge className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors text-xs">
              <Users className="h-3 w-3 mr-1 text-blue-600" />
              <span className="font-semibold">{stats.crmContacts}</span>
              <span className="ml-1 text-blue-600/70 font-normal">Contacts</span>
            </Badge>
            <Badge className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors text-xs">
              <Plug className="h-3 w-3 mr-1 text-emerald-600" />
              <span className="font-semibold">{stats.financeConnections}</span>
              <span className="ml-1 text-emerald-600/70 font-normal">Connected</span>
            </Badge>
            <Badge className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors text-xs">
              <Sparkles className="h-3 w-3 mr-1 text-amber-600" />
              <span className="font-semibold">{stats.hoursSaved}h</span>
              <span className="ml-1 text-amber-600/70 font-normal">Saved</span>
            </Badge>
          </div>
        </div>

        {/* Floating Tab Bar */}
        <div className="flex justify-center overflow-x-auto pb-2 -mb-2">
          <div className="bg-background/80 backdrop-blur-lg rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-1 inline-flex gap-1 flex-nowrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? `${tab.activeColor} shadow-sm`
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                aria-label={`Switch to ${tab.label} tab`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <Badge 
                    className={`${activeTab === tab.id ? 'bg-white/90 text-gray-700' : 'bg-amber-500 text-white'} text-xs px-1.5 py-0 h-4 min-w-[18px]`}
                  >
                    {tab.badge}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="max-w-5xl mx-auto px-4 sm:px-6 pb-6"
        >
          {activeTab === 'home' && (
            <HomeTab nextStep={nextStep} isFirstTime={isFirstTime} router={router} />
          )}
          {activeTab === 'pathways' && <PathwaysTab />}
          {activeTab === 'wins' && <WinsTab wins={wins} router={router} />}
          {activeTab === 'tools' && <ToolsTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// HOME TAB - Next Best Step + Quick Outcome Options
// ============================================================================

function HomeTab({ 
  nextStep, 
  isFirstTime, 
  router 
}: { 
  nextStep: DashboardV2Data['nextStep'];
  isFirstTime: boolean;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <div className="space-y-4">
      {/* Next Best Step Card - Compact but prominent */}
      <Card className="p-5 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">Your Next Step</p>
              <h2 className="text-lg font-semibold text-foreground">{nextStep.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{nextStep.why}</p>
            </div>
            
            {/* Benefits - Inline */}
            <div className="flex flex-wrap gap-2">
              {nextStep.benefits.slice(0, 3).map((benefit, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                  {benefit}
                </span>
              ))}
            </div>

            <Button 
              onClick={() => router.push(nextStep.href)}
              className="h-9"
            >
              {nextStep.cta}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Outcome Cards - 2x2 grid */}
      <div className="grid grid-cols-2 gap-3">
        <QuickOutcomeCard
          title="Automate"
          description="Let AI handle repetitive tasks"
          href="/agents"
          icon={Bot}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
        <QuickOutcomeCard
          title="Relationships"
          description="Track leads & conversations"
          href="/crm"
          icon={Users}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <QuickOutcomeCard
          title="Finances"
          description="See all your money in one place"
          href="/finance"
          icon={DollarSign}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <QuickOutcomeCard
          title="Create"
          description="Generate content with AI"
          href="/creator"
          icon={Lightbulb}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
      </div>
    </div>
  );
}

function QuickOutcomeCard({ 
  title, 
  description, 
  href, 
  icon: Icon, 
  iconBg, 
  iconColor 
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Link href={href}>
      <Card className="p-4 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group h-full">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${iconBg} shrink-0`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

// ============================================================================
// PATHWAYS TAB - Full outcome modules
// ============================================================================

function PathwaysTab() {
  const pathways = [
    { id: 'automate', title: 'Automate My Work', description: 'Build AI agents that handle repetitive tasks so you can focus on what matters most.', href: '/agents', icon: Bot, iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
    { id: 'relationships', title: 'Manage Relationships', description: 'Keep track of everyone you know, every conversation, and never miss a follow-up.', href: '/crm', icon: Users, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { id: 'finances', title: 'Understand Finances', description: 'See all your money in one place—revenue, expenses, and cash flow at a glance.', href: '/finance', icon: DollarSign, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
    { id: 'workflows', title: 'Build Workflows', description: 'Create custom automations visually. No coding required.', href: '/studio', icon: Workflow, iconBg: 'bg-rose-100', iconColor: 'text-rose-600' },
    { id: 'content', title: 'Create Content', description: 'Generate articles, emails, and marketing materials with AI assistance.', href: '/creator', icon: Lightbulb, iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
    { id: 'learn', title: 'Learn & Grow', description: 'Master AI and business automation at your own pace with guided lessons.', href: '/lunar-labs', icon: GraduationCap, iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  ];

  return (
    <Card className="p-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">What would you like to accomplish?</h2>
        <p className="text-xs text-muted-foreground">Choose a path based on what you want to achieve.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {pathways.map((pathway) => (
          <Link key={pathway.id} href={pathway.href}>
            <div className="p-3 rounded-lg border hover:border-primary/30 hover:bg-muted/50 transition-all cursor-pointer group">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${pathway.iconBg} shrink-0`}>
                  <pathway.icon className={`h-4 w-4 ${pathway.iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{pathway.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{pathway.description}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}

// ============================================================================
// WINS TAB - Recent accomplishments
// ============================================================================

function WinsTab({ 
  wins, 
  router 
}: { 
  wins: DashboardV2Data['wins'];
  router: ReturnType<typeof useRouter>;
}) {
  if (wins.length === 0) {
    return (
      <Card className="p-6 text-center bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200/50">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 mx-auto mb-3">
          <Sparkles className="h-6 w-6 text-amber-600" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Start Creating Wins!</h2>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
          Your wins will appear here as you begin using GalaxyCo.
        </p>
        <Button onClick={() => router.push('/agents?action=create')} size="sm">
          <Zap className="mr-2 h-4 w-4" />
          Create Your First Agent
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-amber-500" />
        <h2 className="text-sm font-semibold text-foreground">Your Recent Wins</h2>
      </div>
      <div className="space-y-2">
        {wins.slice(0, 5).map((win) => (
          <div key={win.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
            <span className="text-lg">{win.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{win.title}</p>
              <p className="text-xs text-muted-foreground">{win.detail}</p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{win.timeAgo}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ============================================================================
// TOOLS TAB - Quick Access Grid
// ============================================================================

function ToolsTab() {
  const tools = [
    { name: 'Agents', href: '/agents', icon: Bot, description: 'AI automation' },
    { name: 'CRM', href: '/crm', icon: Users, description: 'Contacts & leads' },
    { name: 'Marketing', href: '/marketing', icon: Megaphone, description: 'Campaigns' },
    { name: 'Finance HQ', href: '/finance', icon: DollarSign, description: 'Financial data' },
    { name: 'Creator', href: '/creator', icon: Lightbulb, description: 'Content studio' },
    { name: 'Library', href: '/library', icon: FolderOpen, description: 'Documents' },
    { name: 'Studio', href: '/studio', icon: Workflow, description: 'Workflows' },
    { name: 'Lunar Labs', href: '/lunar-labs', icon: GraduationCap, description: 'Learning' },
  ];

  return (
    <Card className="p-4">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-foreground">Quick Access</h2>
        <p className="text-xs text-muted-foreground">Jump directly to any area of GalaxyCo.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {tools.map((tool) => (
          <Link key={tool.name} href={tool.href}>
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-muted transition-colors text-center">
              <div className="p-2 rounded-lg bg-muted">
                <tool.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-xs font-medium text-foreground">{tool.name}</span>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
