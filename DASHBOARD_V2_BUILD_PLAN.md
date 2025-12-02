# Dashboard v2 - Comprehensive Build Plan

> **Status:** Ready to Build 🚀
>
> **Estimated Time:** 3-4 days (24-32 hours)
>
> **Approach:** Incremental, testable, following existing patterns

---

## 📋 Pre-Build Checklist

- [x] Specification reviewed and approved
- [x] Design system referenced (`DESIGN-SYSTEM.md`)
- [x] Existing patterns analyzed (Finance HQ, Library, Creator)
- [x] Database schema reviewed
- [x] User rules acknowledged (accessibility, mobile-first, Zod validation)
- [ ] **Ready to begin building** ← You are here

---

## 🏗️ Build Phases

### Phase 1: Foundation & Types (2-3 hours)

**Goal:** Set up the infrastructure without breaking anything

#### Step 1.1: Create TypeScript Types
**File:** `src/types/dashboard-v2.ts`

**Tasks:**
- [ ] Create Zod schemas for validation
- [ ] Export TypeScript types
- [ ] Add JSDoc comments for developer experience

**Code to create:**
```typescript
// Complete types file as specified in DASHBOARD_V2_REDESIGN_SPEC.md
// Include all schemas: DashboardStatsSchema, NextStepActionSchema, WinSchema, etc.
```

**Validation:**
```bash
npm run typecheck
```

---

#### Step 1.2: Create API Route
**File:** `src/app/api/dashboard/v2/route.ts`

**Tasks:**
- [ ] Implement GET endpoint
- [ ] Add database queries (parallel Promise.all)
- [ ] Implement helper functions: `determineNextStep`, `generateWinsFromActivity`, `generatePathways`
- [ ] Add Zod validation for response
- [ ] Add error handling with try-catch
- [ ] Add logger statements (no console.log!)

**Dependencies:**
```typescript
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { agents, tasks, contacts, integrations, agentExecutions } from '@/db/schema';
import { DashboardV2DataSchema } from '@/types/dashboard-v2';
import { logger } from '@/lib/logger';
```

**Validation:**
```bash
# Test API manually
curl http://localhost:3000/api/dashboard/v2
# Should return JSON with stats, nextStep, pathways, wins
```

---

#### Step 1.3: Create Server Page Component
**File:** `src/app/(app)/dashboard-v2/page.tsx`

**Tasks:**
- [ ] Create async server component
- [ ] Fetch data using `getCurrentWorkspace()`
- [ ] Create helper function `getDashboardData()`
- [ ] Pass data to client component
- [ ] Wrap with ErrorBoundary
- [ ] Add metadata export

**Code:**
```typescript
import { Metadata } from 'next';
import { getCurrentWorkspace } from "@/lib/auth";
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import DashboardV2Client from '@/components/dashboard-v2/DashboardV2Client';
import { getDashboardData } from '@/lib/dashboard-v2';

export const metadata: Metadata = {
  title: 'Dashboard | GalaxyCo.ai',
  description: 'Your personalized AI command center',
};

export default async function DashboardV2Page() {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const data = await getDashboardData(workspaceId);
    
    return (
      <ErrorBoundary>
        <DashboardV2Client initialData={data} />
      </ErrorBoundary>
    );
  } catch (error) {
    return (
      <ErrorBoundary>
        <DashboardV2Client initialData={getEmptyData()} />
      </ErrorBoundary>
    );
  }
}
```

**Validation:**
```bash
# Visit page
# http://localhost:3000/dashboard-v2
# Should load without errors (even if blank)
```

---

### Phase 2: Core Components (8-10 hours)

#### Step 2.1: Create DashboardV2Client Wrapper
**File:** `src/components/dashboard-v2/DashboardV2Client.tsx`

**Tasks:**
- [ ] Create "use client" component
- [ ] Set up SWR for real-time updates
- [ ] Import all section components
- [ ] Add framer-motion animations
- [ ] Add main layout structure

**Code:**
```typescript
"use client";

import { useState } from 'react';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import { DashboardV2Data } from '@/types/dashboard-v2';
import { WelcomeSection } from './WelcomeSection';
import { NextStepCard } from './NextStepCard';
import { JourneyPathways } from './JourneyPathways';
import { RecentWinsTimeline } from './RecentWinsTimeline';
import { ToolsGrid } from './ToolsGrid';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface DashboardV2ClientProps {
  initialData: DashboardV2Data;
}

export default function DashboardV2Client({ initialData }: DashboardV2ClientProps) {
  const { data, error, isLoading } = useSWR<DashboardV2Data>(
    '/api/dashboard/v2',
    fetcher,
    {
      fallbackData: initialData,
      refreshInterval: 30000, // 30 seconds
      revalidateOnFocus: true,
    }
  );

  if (!data) return null;

  return (
    <main 
      className="min-h-screen p-6 lg:p-8 max-w-[1400px] mx-auto"
      role="main"
      aria-label="Dashboard"
    >
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
        className="space-y-8"
      >
        <motion.div variants={fadeInUp}>
          <WelcomeSection
            userName={data.user.name}
            isFirstTime={data.user.isFirstTime}
            lastLogin={data.user.lastLogin}
            stats={data.stats}
            hasActiveAgents={data.stats.activeAgents > 0}
          />
        </motion.div>

        <motion.div variants={fadeInUp}>
          <NextStepCard
            action={data.nextStep}
            onClick={() => {/* track analytics */}}
          />
        </motion.div>

        <motion.div variants={fadeInUp}>
          <JourneyPathways pathways={data.pathways} />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div variants={fadeInUp}>
            <RecentWinsTimeline
              wins={data.wins}
              isEmpty={data.wins.length === 0}
            />
          </motion.div>

          <motion.div variants={fadeInUp}>
            <ToolsGrid />
          </motion.div>
        </div>
      </motion.div>
    </main>
  );
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.3, ease: "easeOut" } 
  }
};
```

**Validation:**
- [ ] Page renders without errors
- [ ] SWR fetches data
- [ ] Animations play on load

---

#### Step 2.2: Build WelcomeSection
**File:** `src/components/dashboard-v2/WelcomeSection.tsx`

**Tasks:**
- [ ] Personalized greeting with time awareness
- [ ] Stats display (agents, tasks, hours)
- [ ] Neptune suggestion chips
- [ ] Accessibility: semantic HTML, ARIA labels
- [ ] Mobile-responsive layout

**Code:**
```typescript
"use client";

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import { DashboardStats } from '@/types/dashboard-v2';

interface WelcomeSectionProps {
  userName: string;
  isFirstTime: boolean;
  lastLogin?: Date;
  stats: DashboardStats;
  hasActiveAgents: boolean;
}

export function WelcomeSection({
  userName,
  isFirstTime,
  lastLogin,
  stats,
  hasActiveAgents,
}: WelcomeSectionProps) {
  const greeting = getGreeting(isFirstTime, hasActiveAgents, lastLogin);
  const suggestions = getNeptuneSuggestions(stats);

  return (
    <section 
      className="space-y-4"
      aria-labelledby="welcome-heading"
    >
      {/* Greeting */}
      <div>
        <h1 
          id="welcome-heading"
          className="text-3xl md:text-4xl font-semibold text-foreground"
        >
          {greeting}, {userName}! {getGreetingEmoji(hasActiveAgents)}
        </h1>
        <p className="text-muted-foreground mt-1">
          {getSubtitle(isFirstTime, stats)}
        </p>
      </div>

      {/* Stats Bar */}
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        <Badge variant="secondary" className="flex items-center gap-1.5">
          <span className="font-semibold">{stats.activeAgents}</span>
          Active Agents
        </Badge>
        <Badge variant="secondary" className="flex items-center gap-1.5">
          <span className="font-semibold">{stats.completedTasks}</span>
          Tasks Completed
        </Badge>
        <Badge variant="secondary" className="flex items-center gap-1.5">
          <span className="font-semibold">~{stats.hoursSaved}</span>
          Hours Saved
        </Badge>
      </div>

      {/* Neptune Suggestions */}
      {suggestions.length > 0 && (
        <div 
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Neptune AI suggestions"
        >
          <Sparkles className="size-4 text-primary" />
          <span className="text-sm text-muted-foreground">Ask Neptune:</span>
          {suggestions.slice(0, 3).map(suggestion => (
            <Button
              key={suggestion.text}
              variant="outline"
              size="sm"
              onClick={() => openNeptune(suggestion.text)}
              aria-label={`Ask Neptune: ${suggestion.text}`}
            >
              {suggestion.text}
            </Button>
          ))}
        </div>
      )}
    </section>
  );
}

// Helper functions
function getGreeting(isFirstTime: boolean, hasActiveAgents: boolean, lastLogin?: Date): string {
  if (isFirstTime) return "Welcome to GalaxyCo";
  
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getGreetingEmoji(hasActiveAgents: boolean): string {
  return hasActiveAgents ? "⚡" : "👋";
}

function getSubtitle(isFirstTime: boolean, stats: DashboardStats): string {
  if (isFirstTime) {
    return "Let's get you set up and ready to automate your work.";
  }
  
  if (stats.activeAgents > 0) {
    return "Your agents have been working while you were away.";
  }
  
  return "Here's what's happening in your workspace.";
}

function getNeptuneSuggestions(stats: DashboardStats) {
  const suggestions = [];
  
  if (stats.totalAgents === 0) {
    suggestions.push({ text: "Help me create my first agent" });
  }
  if (stats.crmContacts === 0) {
    suggestions.push({ text: "How do I add contacts?" });
  }
  suggestions.push({ text: "What can Galaxy do for me?" });
  
  if (stats.completedTasks > 0) {
    suggestions.push({ text: "Analyze my recent activity" });
  }
  
  return suggestions;
}

function openNeptune(query: string) {
  // Integrate with FloatingAIAssistant
  window.dispatchEvent(new CustomEvent('openNeptune', { detail: { query } }));
}
```

**Validation:**
- [ ] Greeting changes based on time of day
- [ ] Stats display correctly
- [ ] Neptune chips work
- [ ] Responsive on mobile

---

#### Step 2.3: Build NextStepCard
**File:** `src/components/dashboard-v2/NextStepCard.tsx`

**Tasks:**
- [ ] Prominent card with primary action
- [ ] Display benefits as bullet list
- [ ] Large CTA button
- [ ] Navigation on click
- [ ] Analytics tracking

**Code:**
```typescript
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Target } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { NextStepAction } from '@/types/dashboard-v2';
import { trackEvent } from '@/lib/analytics';

interface NextStepCardProps {
  action: NextStepAction;
  onClick?: () => void;
}

export function NextStepCard({ action, onClick }: NextStepCardProps) {
  const router = useRouter();

  const handleClick = () => {
    trackEvent('next_step_clicked', {
      actionId: action.id,
      actionTitle: action.title,
    });
    
    onClick?.();
    router.push(action.href);
  };

  return (
    <Card
      className="border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
      role="article"
      aria-labelledby="next-step-title"
      aria-describedby="next-step-description"
    >
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Icon */}
          <div className="hidden md:flex size-12 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <Target className="size-6 text-primary" />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <h3 className="text-sm font-medium text-muted-foreground">
                Your Next Best Step
              </h3>
            </div>

            <h2 
              id="next-step-title"
              className="text-2xl md:text-3xl font-semibold text-foreground"
            >
              {action.title}
            </h2>

            <p 
              id="next-step-description"
              className="text-muted-foreground"
            >
              {action.why}
            </p>

            <ul 
              className="space-y-2 text-sm"
              role="list"
              aria-label="Benefits"
            >
              {action.benefits.map((benefit, index) => (
                <li 
                  key={index}
                  className="flex items-start gap-2"
                  role="listitem"
                >
                  <span className="text-primary mt-0.5">✓</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Button */}
          <Button
            size="lg"
            onClick={handleClick}
            className="shrink-0 w-full md:w-auto"
            aria-label={`${action.cta} - ${action.title}`}
          >
            {action.cta}
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Validation:**
- [ ] Card displays correctly
- [ ] Button navigates to correct route
- [ ] Analytics fires on click
- [ ] Mobile layout stacks properly

---

#### Step 2.4: Build JourneyPathways
**File:** `src/components/dashboard-v2/JourneyPathways.tsx`

**Tasks:**
- [ ] Grid layout (1/2/3 columns responsive)
- [ ] Outcome-based cards with icons
- [ ] Dynamic badge display
- [ ] Hover effects
- [ ] Keyboard navigation

**Code:**
```typescript
"use client";

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Sparkles, Users, Lightbulb, DollarSign, GraduationCap, Workflow } from 'lucide-react';
import { cn } from '@/lib/utils';
import { JourneyPathway } from '@/types/dashboard-v2';
import { trackEvent } from '@/lib/analytics';

interface JourneyPathwaysProps {
  pathways: JourneyPathway[];
}

const iconMap = {
  Sparkles,
  Users,
  Lightbulb,
  DollarSign,
  GraduationCap,
  Workflow,
};

export function JourneyPathways({ pathways }: JourneyPathwaysProps) {
  return (
    <section 
      className="space-y-4"
      aria-labelledby="pathways-heading"
    >
      <h2 
        id="pathways-heading"
        className="text-xl font-semibold"
      >
        What would you like to do?
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {pathways.map((pathway) => {
          const Icon = iconMap[pathway.icon as keyof typeof iconMap];
          
          return (
            <Link
              key={pathway.id}
              href={pathway.href}
              onClick={() => trackEvent('pathway_clicked', {
                pathwayId: pathway.id,
                pathwayTitle: pathway.title,
                destination: pathway.href,
              })}
              aria-label={`${pathway.title}: ${pathway.promise}`}
            >
              <Card 
                className="hover:shadow-md transition-all cursor-pointer group p-5 h-full"
                role="article"
                tabIndex={0}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={cn(
                    "p-3 rounded-lg shrink-0",
                    pathway.iconBg
                  )}>
                    <Icon className={cn("size-5", pathway.iconColor)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-base">
                        {pathway.title}
                      </h3>
                      <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0" />
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {pathway.promise}
                    </p>
                    
                    {pathway.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {pathway.badge}
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
```

**Validation:**
- [ ] Grid responsive (1/2/3 columns)
- [ ] Hover effects work
- [ ] Links navigate correctly
- [ ] Keyboard accessible (Tab, Enter)

---

#### Step 2.5: Build RecentWinsTimeline
**File:** `src/components/dashboard-v2/RecentWinsTimeline.tsx`

**Tasks:**
- [ ] List recent accomplishments
- [ ] Empty state when no wins
- [ ] Time grouping (Today, This Week)
- [ ] Emoji indicators
- [ ] Scroll container for many wins

**Code:**
```typescript
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { Win } from '@/types/dashboard-v2';
import { useRouter } from 'next/navigation';

interface RecentWinsTimelineProps {
  wins: Win[];
  isEmpty: boolean;
}

export function RecentWinsTimeline({ wins, isEmpty }: RecentWinsTimelineProps) {
  const router = useRouter();

  if (isEmpty) {
    return (
      <Card className="h-full">
        <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="size-16 rounded-full bg-muted flex items-center justify-center">
            <Sparkles className="size-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Start Creating Wins!</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              As you use Galaxy, we'll show your accomplishments here. Create your first agent to get started.
            </p>
          </div>
          <Button onClick={() => router.push('/agents?action=create')}>
            Create Your First Agent
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Your Recent Wins 🎉</CardTitle>
        <CardDescription>
          What Galaxy has done for you lately
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div 
          className="space-y-3 max-h-[400px] overflow-y-auto pr-2"
          role="list"
          aria-label="Recent accomplishments"
        >
          {wins.map((win) => (
            <div
              key={win.id}
              className="flex items-start gap-3 pb-3 border-b last:border-0"
              role="listitem"
            >
              <div className="text-2xl shrink-0" role="img" aria-label={win.type}>
                {win.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{win.title}</p>
                <p className="text-sm text-muted-foreground">{win.detail}</p>
                <p className="text-xs text-muted-foreground mt-1">{win.timeAgo}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Validation:**
- [ ] Empty state displays when no wins
- [ ] Wins list displays properly
- [ ] Scroll works with many items
- [ ] Times display correctly

---

#### Step 2.6: Build ToolsGrid
**File:** `src/components/dashboard-v2/ToolsGrid.tsx`

**Tasks:**
- [ ] Grid of all features (2/3/4 columns)
- [ ] Collapsible on mobile
- [ ] Icon + name + description
- [ ] Links to actual routes

**Code:**
```typescript
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Users, Megaphone, DollarSign, Lightbulb, BookOpen, Workflow, GraduationCap, ChevronDown, ChevronUp } from 'lucide-react';

const tools = [
  { name: "Agents", icon: Bot, href: "/agents", description: "AI automation" },
  { name: "CRM", icon: Users, href: "/crm", description: "Contacts & leads" },
  { name: "Marketing", icon: Megaphone, href: "/marketing", description: "Campaigns" },
  { name: "Finance HQ", icon: DollarSign, href: "/finance", description: "Financial data" },
  { name: "Creator", icon: Lightbulb, href: "/creator", description: "Content studio" },
  { name: "Library", icon: BookOpen, href: "/library", description: "Documents" },
  { name: "Studio", icon: Workflow, href: "/studio", description: "Workflows" },
  { name: "Lunar Labs", icon: GraduationCap, href: "/lunar-labs", description: "Learning" },
];

interface ToolsGridProps {
  isCollapsed?: boolean;
}

export function ToolsGrid({ isCollapsed: initialCollapsed = false }: ToolsGridProps) {
  const [isExpanded, setIsExpanded] = useState(!initialCollapsed);

  return (
    <section className="space-y-4" aria-labelledby="tools-heading">
      <div className="flex items-center justify-between">
        <h2 id="tools-heading" className="text-xl font-semibold">
          Quick Access
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="md:hidden"
          aria-expanded={isExpanded}
          aria-controls="tools-grid"
        >
          {isExpanded ? (
            <>
              Hide <ChevronUp className="ml-1 size-4" />
            </>
          ) : (
            <>
              Show All <ChevronDown className="ml-1 size-4" />
            </>
          )}
        </Button>
      </div>

      <div
        id="tools-grid"
        className={cn(
          "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3",
          !isExpanded && "hidden md:grid"
        )}
      >
        {tools.map((tool) => (
          <Link key={tool.name} href={tool.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer p-4 h-full">
              <tool.icon className="size-6 text-primary mb-2" />
              <h4 className="font-medium text-sm mb-1">{tool.name}</h4>
              <p className="text-xs text-muted-foreground">{tool.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

**Validation:**
- [ ] Grid responsive
- [ ] Collapse/expand works on mobile
- [ ] All links work
- [ ] Icons display correctly

---

### Phase 3: Helper Utilities (2-3 hours)

#### Step 3.1: Create Data Fetching Utilities
**File:** `src/lib/dashboard-v2.ts`

**Tasks:**
- [ ] Implement `getDashboardData()` function
- [ ] Move helper functions from API route
- [ ] Add proper error handling
- [ ] Add caching strategy

**Code:**
```typescript
import { db } from '@/lib/db';
import { agents, tasks, contacts, integrations, agentExecutions } from '@/db/schema';
import { eq, and, desc, count, sql, gte, inArray } from 'drizzle-orm';
import { DashboardV2Data, DashboardStats, NextStepAction, Win, JourneyPathway } from '@/types/dashboard-v2';
import { logger } from '@/lib/logger';

export async function getDashboardData(workspaceId: string): Promise<DashboardV2Data> {
  try {
    // Fetch all data in parallel (same as API route)
    const [
      agentsData,
      tasksData,
      crmData,
      financeIntegrations,
      recentExecutions,
    ] = await Promise.all([
      // ... database queries
    ]);

    const stats: DashboardStats = {
      activeAgents: agentsData.filter(a => a.status === 'active').length,
      totalAgents: agentsData.length,
      completedTasks: tasksData.length,
      hoursSaved: tasksData.length * 2,
      crmContacts: crmData[0]?.total ?? 0,
      hotLeads: Number(crmData[0]?.hot ?? 0),
      financeConnections: financeIntegrations.length,
    };

    return {
      stats,
      nextStep: determineNextStep(stats, agentsData, tasksData),
      pathways: generatePathways(stats),
      wins: generateWinsFromActivity(recentExecutions, tasksData),
      user: {
        name: 'User', // TODO: Get from auth
        isFirstTime: stats.totalAgents === 0 && stats.crmContacts === 0,
        lastLogin: undefined, // TODO: Get from database
      },
      onboarding: {
        isComplete: stats.totalAgents > 0 && stats.crmContacts > 0,
        completionPercentage: calculateOnboardingCompletion(stats),
      },
    };
  } catch (error) {
    logger.error('Failed to fetch dashboard data', error);
    throw error;
  }
}

export function getEmptyData(): DashboardV2Data {
  return {
    stats: {
      activeAgents: 0,
      totalAgents: 0,
      completedTasks: 0,
      hoursSaved: 0,
      crmContacts: 0,
      hotLeads: 0,
      financeConnections: 0,
    },
    nextStep: {
      id: 'get-started',
      title: 'Get Started with GalaxyCo',
      why: 'Set up your workspace and create your first automation',
      benefits: ['Save time', 'Automate work', 'Grow faster'],
      cta: 'Start Setup',
      href: '/onboarding',
      priority: 10,
    },
    pathways: [],
    wins: [],
    user: {
      name: 'User',
      isFirstTime: true,
    },
    onboarding: {
      isComplete: false,
      completionPercentage: 0,
    },
  };
}

// Copy helper functions from API route spec
function determineNextStep(/* ... */): NextStepAction { /* ... */ }
function generateWinsFromActivity(/* ... */): Win[] { /* ... */ }
function generatePathways(/* ... */): JourneyPathway[] { /* ... */ }
function calculateOnboardingCompletion(/* ... */): number { /* ... */ }
```

---

#### Step 3.2: Add Analytics Tracking
**File:** `src/lib/analytics.ts` (or update existing)

**Tasks:**
- [ ] Add trackEvent function if not exists
- [ ] Add dashboard-specific events
- [ ] Ensure GDPR compliance

**Code:**
```typescript
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  
  // Use your analytics provider (e.g., Posthog, Mixpanel, etc.)
  window.analytics?.track(eventName, {
    ...properties,
    timestamp: new Date().toISOString(),
  });
  
  // Also log in development
  if (process.env.NODE_ENV === 'development') {
    logger.info(`Analytics: ${eventName}`, properties);
  }
}
```

---

### Phase 4: Polish & Testing (4-6 hours)

#### Step 4.1: Add Loading States
**File:** `src/components/dashboard-v2/DashboardV2Loading.tsx`

**Tasks:**
- [ ] Create skeleton components
- [ ] Match layout of actual components
- [ ] Use Skeleton from shadcn/ui

**Code:**
```typescript
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export function DashboardV2Loading() {
  return (
    <div className="min-h-screen p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8">
      {/* Welcome Section Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-5 w-96" />
        <div className="flex gap-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-28" />
        </div>
      </div>

      {/* Next Step Card Skeleton */}
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>

      {/* Pathways Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

**Usage in page.tsx:**
```typescript
export default async function DashboardV2Page() {
  return (
    <Suspense fallback={<DashboardV2Loading />}>
      <DashboardContent />
    </Suspense>
  );
}
```

---

#### Step 4.2: Accessibility Audit

**Tasks:**
- [ ] Run Lighthouse accessibility audit
- [ ] Test keyboard navigation (Tab through all elements)
- [ ] Test with screen reader (NVDA or VoiceOver)
- [ ] Verify color contrast ratios
- [ ] Add skip-to-content link
- [ ] Verify all images have alt text
- [ ] Verify form labels exist
- [ ] Test focus indicators

**Checklist:**
```markdown
- [ ] All interactive elements keyboard accessible
- [ ] Focus visible on all elements
- [ ] Semantic HTML used throughout
- [ ] ARIA labels on complex components
- [ ] Screen reader announces dynamic content
- [ ] Color contrast meets WCAG AA
- [ ] No keyboard traps
- [ ] Skip-to-content link present
```

---

#### Step 4.3: Responsive Testing

**Breakpoints to test:**
- [ ] Mobile (375px - iPhone SE)
- [ ] Mobile (414px - iPhone 13 Pro)
- [ ] Tablet (768px - iPad)
- [ ] Tablet landscape (1024px)
- [ ] Desktop (1280px)
- [ ] Large desktop (1920px)

**What to verify:**
- [ ] Layout doesn't break
- [ ] Touch targets minimum 44px
- [ ] Text readable without zoom
- [ ] No horizontal scroll
- [ ] Images scale properly
- [ ] Navigation works on touch

---

#### Step 4.4: Dark Mode Testing

**Tasks:**
- [ ] Switch to dark mode
- [ ] Verify all colors readable
- [ ] Check card shadows visible
- [ ] Verify borders visible
- [ ] Check icons contrast
- [ ] Test hover states

---

#### Step 4.5: Performance Optimization

**Tasks:**
- [ ] Lazy load heavy components
- [ ] Add `loading="lazy"` to images
- [ ] Minimize bundle size (check with `npm run build`)
- [ ] Use `next/dynamic` for non-critical components
- [ ] Optimize images (use next/image)
- [ ] Add proper caching headers

**Code example:**
```typescript
import dynamic from 'next/dynamic';

// Lazy load ToolsGrid (not critical)
const ToolsGrid = dynamic(() => import('./ToolsGrid'), {
  loading: () => <Skeleton className="h-48 w-full" />,
  ssr: false, // Client-side only if needed
});
```

---

### Phase 5: Integration & Testing (3-4 hours)

#### Step 5.1: Neptune Integration

**Tasks:**
- [ ] Connect to existing FloatingAIAssistant
- [ ] Add dashboard context to Neptune
- [ ] Test suggestion chips
- [ ] Verify Neptune opens with pre-filled query

**Code:**
```typescript
// In WelcomeSection.tsx
import { useFloatingAIAssistant } from '@/hooks/useFloatingAIAssistant';

function openNeptune(query: string) {
  const { open, setQuery } = useFloatingAIAssistant();
  setQuery(query);
  open();
  
  trackEvent('neptune_opened_from_dashboard', {
    trigger: 'suggestion_chip',
    query,
  });
}
```

---

#### Step 5.2: Error Handling

**Tasks:**
- [ ] Add error boundaries
- [ ] Test error states (disconnect network)
- [ ] Add toast notifications for errors
- [ ] Add retry mechanisms
- [ ] Log errors to Sentry

**Code:**
```typescript
// In DashboardV2Client.tsx
const { data, error, mutate } = useSWR('/api/dashboard/v2', fetcher, {
  onError: (err) => {
    logger.error('Dashboard data fetch failed', err);
    toast.error('Failed to load dashboard. Retrying...');
  },
  onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
    if (retryCount >= 3) return;
    setTimeout(() => revalidate({ retryCount }), 5000);
  },
});

if (error) {
  return (
    <div className="p-8 text-center">
      <p className="text-muted-foreground mb-4">
        Something went wrong loading your dashboard.
      </p>
      <Button onClick={() => mutate()}>
        Retry
      </Button>
    </div>
  );
}
```

---

#### Step 5.3: End-to-End Testing

**Manual test checklist:**
- [ ] Visit `/dashboard-v2` as new user
  - [ ] See welcome message
  - [ ] See "Create Your First Agent" as next step
  - [ ] See empty state for wins
  - [ ] All pathways clickable
  - [ ] Tools grid displays

- [ ] Visit `/dashboard-v2` as existing user
  - [ ] See personalized greeting
  - [ ] See relevant next step based on data
  - [ ] See recent wins
  - [ ] Stats accurate

- [ ] Test interactions
  - [ ] Click next step → navigates correctly
  - [ ] Click pathway → navigates correctly
  - [ ] Click Neptune suggestion → opens assistant
  - [ ] Click tool → navigates correctly

- [ ] Test data refresh
  - [ ] Create agent in another tab
  - [ ] Wait 30s or refocus tab
  - [ ] Verify dashboard updates

---

### Phase 6: Documentation & Handoff (1-2 hours)

#### Step 6.1: Update Documentation

**Tasks:**
- [ ] Add component documentation (JSDoc)
- [ ] Update README with new route
- [ ] Document environment variables if needed
- [ ] Add troubleshooting guide

---

#### Step 6.2: Create Migration Plan

**File:** `DASHBOARD_V2_MIGRATION.md`

**Content:**
```markdown
# Dashboard v2 Migration Plan

## Testing Phase (1 week)
- [ ] Deploy dashboard-v2 to staging
- [ ] Get 5-10 users to test
- [ ] Gather feedback
- [ ] Fix bugs

## A/B Testing (1-2 weeks)
- [ ] 50% users see v2, 50% see v1
- [ ] Track metrics: engagement, time on page, feature discovery
- [ ] Compare conversion rates

## Full Migration
- [ ] If v2 performs better:
  - Option A: Redirect `/dashboard` → `/dashboard-v2`
  - Option B: Replace `/dashboard` content with v2
- [ ] Archive old dashboard code
- [ ] Update all links to `/dashboard`

## Rollback Plan
- [ ] If issues arise, revert to v1
- [ ] Dashboard v1 remains at `/dashboard` (unchanged)
```

---

## 📊 Definition of Done

### Component Checklist
- [ ] All 6 main components built and working
- [ ] Loading states implemented
- [ ] Empty states implemented
- [ ] Error states implemented
- [ ] Animations smooth and performant

### Data Checklist
- [ ] API endpoint returns validated data
- [ ] Server component fetches data correctly
- [ ] SWR updates in real-time
- [ ] Error handling robust

### Design Checklist
- [ ] Matches design system
- [ ] Responsive on all breakpoints
- [ ] Dark mode works correctly
- [ ] Animations play smoothly
- [ ] Colors and typography consistent

### Accessibility Checklist
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] ARIA labels present
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] Touch targets minimum 44px

### Performance Checklist
- [ ] Page loads < 2 seconds
- [ ] Lighthouse score > 90
- [ ] No console errors
- [ ] No unnecessary re-renders
- [ ] Bundle size optimized

### Testing Checklist
- [ ] Manual testing complete
- [ ] Responsive testing complete
- [ ] Accessibility audit passed
- [ ] Error scenarios tested
- [ ] Data edge cases tested

---

## 🚀 Ready to Build!

**Estimated total time:** 24-32 hours (3-4 days)

**Start with:** Phase 1, Step 1.1 (Create TypeScript types)

**Order of execution:**
1. Foundation (types, API, page structure)
2. Core components (one at a time, test each)
3. Utilities (data fetching, analytics)
4. Polish (loading, accessibility, responsive)
5. Integration (Neptune, error handling)
6. Documentation

**Key principles:**
- Build incrementally, test frequently
- Follow existing patterns
- Don't break existing dashboard
- Prioritize user experience
- Make it accessible
- Keep it performant

---

**Questions before we start?** If not, let's begin! 🎉
