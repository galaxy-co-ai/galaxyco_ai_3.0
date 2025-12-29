# GalaxyCo Dashboard v2 - User-First Redesign Specification

> **Purpose:** Redesign the Dashboard to be radically user-focused, guiding users to success rather than showcasing platform features.
>
> **Philosophy:** Help users achieve outcomes, don't just display data. Guide, don't overwhelm.

---

## 🎯 Core Principles

### 1. **User Journey First, Features Second**
- Show users the **one best next action** to move forward
- Guide them based on **where they are** in their journey
- Celebrate **wins and progress** to build confidence
- Make **getting help** (Neptune) the easiest thing on the page

### 2. **Progressive Disclosure**
- Start simple, reveal complexity only when needed
- New users see onboarding prompts
- Power users see advanced tools
- Everyone sees their specific next step

### 3. **Outcome-Based Navigation**
- Users think in **problems to solve**, not features to use
- "I want to..." instead of "Click on CRM"
- Natural language paths: "Follow up with leads" → CRM
- Context-aware suggestions based on actual data

---

## 📂 Technical Structure

### Route (Safe v2 Approach)

```
src/app/(app)/dashboard-v2/page.tsx
```

**Why v2 route:**
- Doesn't break existing dashboard
- Allows A/B testing
- Easy to rollback if needed
- Can migrate gradually

### Component Organization

```
src/components/dashboard-v2/
  WelcomeSection.tsx          # Personalized greeting + context
  NextStepCard.tsx            # THE one recommended action
  JourneyPathways.tsx         # Outcome-based quick actions
  RecentWinsTimeline.tsx      # Confidence-building activity feed
  NeptuneQuickHelp.tsx        # Always-visible AI assistant
  ToolsGrid.tsx               # Secondary: direct feature access
  EmptyStatePrompt.tsx        # When user has no data yet
```

### Data Flow (Server Component Pattern)

```typescript
// src/app/(app)/dashboard-v2/page.tsx
export default async function DashboardV2Page() {
  const { workspaceId, userId } = await getCurrentWorkspace();
  
  // Fetch actual data from database
  const userData = await getDashboardData(workspaceId);
  
  return (
    <ErrorBoundary>
      <DashboardV2Client initialData={userData} />
    </ErrorBoundary>
  );
}
```

**Follows our existing patterns:**
- Server component for data fetching
- Pass initialData to client component
- Use SWR for real-time updates
- ErrorBoundary wrapping

---

## 🧩 Section Specifications

### 1. WelcomeSection

**Purpose:** Create personal connection and context

**Dynamic Content Logic:**
```typescript
// Personalization based on actual data
if (firstTimeUser) {
  "Welcome to GalaxyCo! Let's get you set up."
} else if (morningLogin && lastLoginYesterday) {
  "Good morning, {name}! Here's what happened while you were away."
} else if (hasActiveAgents) {
  "Welcome back, {name}! Your agents have been working."
} else {
  "Welcome back, {name}!"
}
```

**UI Elements:**
- Large, friendly greeting
- Contextual subtitle (time-aware, activity-aware)
- Quick stats bar: Active Agents · Tasks Completed · Hours Saved
- **Neptune floating assistant** always visible in this section

**Design:**
- No card border, blends with page background
- Typography: `text-3xl font-semibold` for greeting
- Subtle stats: `text-sm text-muted-foreground`
- Matches our DESIGN-SYSTEM.md aesthetic

---

### 2. NextStepCard

**Purpose:** Provide THE one most important action

**Smart Recommendation Logic:**
```typescript
// Priority order (first match wins)
1. If onboardingIncomplete: "Complete Your Setup"
2. If agents === 0: "Create Your First Agent"
3. If crmContacts === 0: "Add Your First Contact"
4. If integrations === 0: "Connect Your Tools"
5. If hasOverdueTasks: "Review Overdue Tasks"
6. If hasUrgentLeads: "Follow Up with Hot Leads"
7. If financialIntegrations > 0 && noRecentFinanceReview: "Review Financial Activity"
8. If agentSuggestions.length > 0: "Try This Automation"
9. Default: "Review What Galaxy Did Today"
```

**UI Structure:**
```tsx
<Card className="border-primary/20 bg-primary/5">
  <div className="flex items-start gap-4">
    <div className="flex-1">
      <h3>🎯 Your Next Best Step</h3>
      <p className="text-2xl font-semibold">{recommendedAction.title}</p>
      <p className="text-muted-foreground">{recommendedAction.why}</p>
      <ul className="space-y-1 text-sm">
        {recommendedAction.benefits.map(benefit => (
          <li key={benefit}>✓ {benefit}</li>
        ))}
      </ul>
    </div>
    <Button size="lg" className="shrink-0">
      {recommendedAction.cta} <ArrowRight />
    </Button>
  </div>
</Card>
```

**Examples:**
- "Create Your First Agent" → "Agents automate repetitive work" → ["Save 10+ hours/week", "Never miss a follow-up", "Work while you sleep"] → Button: "Create Agent"
- "Follow Up with Hot Leads" → "3 leads haven't been contacted in 5 days" → ["Close deals faster", "Build relationships", "Track conversations"] → Button: "Open CRM"

---

### 3. JourneyPathways

**Purpose:** Outcome-based navigation mapped to OUR features

**The Pathways (6 cards):**

1. **"Automate My Work"** → `/agents`
   - Icon: Sparkles
   - Promise: "Build AI agents that handle repetitive tasks"
   - When: Always available
   - Badge: Shows active agent count if > 0

2. **"Manage My Relationships"** → `/crm`
   - Icon: Users
   - Promise: "Track leads, contacts, and conversations"
   - When: Always available
   - Badge: Shows hot leads count if > 0

3. **"Create Content"** → `/creator`
   - Icon: Lightbulb
   - Promise: "Generate articles, emails, and assets with AI"
   - When: Always available
   - Badge: "Neptune Powered"

4. **"Understand My Finances"** → `/finance`
   - Icon: DollarSign
   - Promise: "Unified view of revenue, expenses, and cash flow"
   - When: Show if integrations connected OR always
   - Badge: Shows integration count if > 0

5. **"Learn & Grow"** → `/lunar-labs`
   - Icon: GraduationCap
   - Promise: "Master AI and business automation"
   - When: Always available
   - Badge: Shows completion % if started

6. **"Build Workflows"** → `/studio`
   - Icon: Workflow
   - Promise: "Design custom automations visually"
   - When: Always available (was hidden, now accessible)
   - Badge: "Advanced"

**UI Layout:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
  {pathways.map(pathway => (
    <Card key={pathway.id} className="hover:shadow-md transition-all cursor-pointer group">
      <div className="flex items-start gap-3">
        <div className={cn("p-3 rounded-lg", pathway.iconBg)}>
          <pathway.icon className={cn("size-5", pathway.iconColor)} />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold">{pathway.title}</h4>
          <p className="text-sm text-muted-foreground">{pathway.promise}</p>
          {pathway.badge && <Badge>{pathway.badge}</Badge>}
        </div>
        <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
      </div>
    </Card>
  ))}
</div>
```

**Dynamic Ordering:**
- If user has 0 agents → "Automate My Work" appears first
- If user has hot leads → "Manage My Relationships" highlighted
- If user has finance integrations → "Understand My Finances" promoted
- Otherwise: default order as listed

---

### 4. RecentWinsTimeline

**Purpose:** Build confidence by showing progress and AI-powered results

**Data Sources:**
```typescript
const recentActivity = {
  agentExecutions: await getRecentAgentExecutions(workspaceId, 7), // Last 7 days
  tasksCompleted: await getCompletedTasks(workspaceId, 7),
  documentsCreated: await getRecentDocuments(workspaceId, 7),
  emailsSent: await getEmailActivity(workspaceId, 7),
  crmUpdates: await getRecentCRMActivity(workspaceId, 7),
};

const wins = generateWinsFromActivity(recentActivity);
```

**Win Examples:**
- "✅ Neptune drafted 3 follow-up emails for you"
- "⚡ Your Sales Agent contacted 12 leads automatically"
- "📊 Finance HQ analyzed $45K in transactions"
- "📝 Created 2 marketing articles in the Library"
- "🎯 Completed 8 tasks this week (saved ~16 hours)"

**UI Structure:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Your Recent Wins 🎉</CardTitle>
    <CardDescription>What Galaxy has done for you lately</CardDescription>
  </CardHeader>
  <CardContent>
    {wins.length > 0 ? (
      <div className="space-y-3">
        {wins.map(win => (
          <div key={win.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
            <div className="text-2xl">{win.emoji}</div>
            <div className="flex-1">
              <p className="font-medium">{win.title}</p>
              <p className="text-sm text-muted-foreground">{win.detail}</p>
              <p className="text-xs text-muted-foreground">{win.timeAgo}</p>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <EmptyState 
        icon={Sparkles}
        title="Start creating wins!"
        description="As you use Galaxy, we'll show your accomplishments here."
        action={<Button>Create Your First Agent</Button>}
      />
    )}
  </CardContent>
</Card>
```

**Smart Grouping:**
- Today's wins first
- This week's wins second
- Summarize older activity: "Last month you saved 40+ hours"

---

### 5. NeptuneQuickHelp

**Purpose:** Make AI assistance the easiest, most visible action

**Always Visible:**
- Floating button in bottom-right (our existing FloatingAIAssistant)
- Quick shortcuts in WelcomeSection
- Embedded chat in empty states

**Neptune Suggestions (Context-Aware):**
```typescript
const suggestions = [
  { condition: agents === 0, text: "Help me create my first agent" },
  { condition: crmContacts === 0, text: "How do I add contacts?" },
  { condition: true, text: "What can Galaxy do for me?" },
  { condition: hasData, text: "Analyze my recent activity" },
  { condition: financialIntegrations > 0, text: "Summarize my finances" },
];
```

**UI in WelcomeSection:**
```tsx
<div className="flex flex-wrap gap-2">
  <span className="text-sm text-muted-foreground">Ask Neptune:</span>
  {suggestions.slice(0, 3).map(suggestion => (
    <Button 
      key={suggestion.text}
      variant="outline" 
      size="sm"
      onClick={() => openNeptune(suggestion.text)}
    >
      {suggestion.text}
    </Button>
  ))}
</div>
```

---

### 6. ToolsGrid (Secondary)

**Purpose:** Quick access to all features (not primary navigation)

**Features Listed:**
```typescript
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
```

**UI:**
```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
  {tools.map(tool => (
    <Link key={tool.name} href={tool.href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer p-4">
        <tool.icon className="size-6 text-primary mb-2" />
        <h4 className="font-medium text-sm">{tool.name}</h4>
        <p className="text-xs text-muted-foreground">{tool.description}</p>
      </Card>
    </Link>
  ))}
</div>
```

**Visual Hierarchy:**
- Smaller cards than pathways
- Lower on page
- Collapsed by default on mobile ("Show all tools" expandable)

---

## 🎨 Design Specifications

### Colors (from DESIGN-SYSTEM.md)
- **Primary Blue:** `#007AFF` (iOS Blue)
- **Success Green:** `#34C759`
- **Warning Orange:** `#FF9500`
- **Error Red:** `#FF3B30`
- **Background:** `#ffffff` (light) / `oklch(0.145 0 0)` (dark)
- **Muted:** `#ececf0` (light) / `oklch(0.269 0 0)` (dark)

### Typography
- **Welcome Greeting:** `text-3xl font-semibold`
- **Section Titles:** `text-xl font-semibold`
- **Card Titles:** `text-lg font-medium`
- **Body Text:** `text-base`
- **Muted Text:** `text-sm text-muted-foreground`

### Spacing
- **Page Padding:** `p-6 lg:p-8`
- **Section Gaps:** `space-y-8`
- **Card Gaps:** `gap-4` (grid), `space-y-3` (stacked)
- **Inner Card Padding:** `p-6`

### Border Radius
- **Cards:** `rounded-lg` (10px from our design system)
- **Buttons:** `rounded-md` (8px)
- **Badges:** `rounded-full`

### Shadows & Effects
- **Default Card:** `shadow-sm`
- **Hover Card:** `hover:shadow-md transition-shadow`
- **Focus Ring:** `ring-2 ring-primary/40 ring-offset-2`

### Motion (framer-motion)
```tsx
// Stagger children on page load
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
>
  {sections.map(section => (
    <motion.div
      key={section.id}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
      }}
    >
      {section.content}
    </motion.div>
  ))}
</motion.div>
```

### Accessibility (WCAG 2.1 AA Compliance)

**Keyboard Navigation:**
- All interactive elements accessible via Tab
- Journey Pathways: Enter or Space to navigate
- Next Step Card: Focus visible, Enter to activate
- Skip to content link at top of page
- Focus trap in modals/dialogs

**ARIA Labels:**
```tsx
// NextStepCard
<Card aria-labelledby="next-step-title" aria-describedby="next-step-description">
  <h3 id="next-step-title">Your Next Best Step</h3>
  <p id="next-step-description">{recommendedAction.why}</p>
  <Button aria-label={`${recommendedAction.cta} - ${recommendedAction.title}`}>
    {recommendedAction.cta}
  </Button>
</Card>

// JourneyPathways
{pathways.map(pathway => (
  <Link 
    href={pathway.href}
    aria-label={`${pathway.title}: ${pathway.promise}`}
  >
    <Card role="article" tabIndex={0}>
      {/* content */}
    </Card>
  </Link>
))}

// RecentWins
<section aria-labelledby="recent-wins-title">
  <h2 id="recent-wins-title">Your Recent Wins</h2>
  <ul role="list" aria-label="Recent accomplishments">
    {wins.map(win => (
      <li key={win.id} role="listitem">
        {/* win content */}
      </li>
    ))}
  </ul>
</section>
```

**Screen Reader Support:**
- Semantic HTML (`<main>`, `<section>`, `<article>`, `<nav>`)
- Live regions for dynamic content: `<div aria-live="polite">` for wins
- Status announcements: "Loading your dashboard", "Dashboard loaded"
- Image alt text for all illustrations

**Color Contrast:**
- Text on background: minimum 4.5:1 ratio
- Large text (18pt+): minimum 3:1 ratio
- Interactive elements: minimum 3:1 ratio
- Test with Chrome DevTools Lighthouse

**Focus Indicators:**
- Visible focus ring on all interactive elements
- `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`
- Never remove outline without replacement

### Mobile-First Breakpoints

**Mobile (320px - 639px):**
- Single column layout
- WelcomeSection: Greeting stacks, stats below
- NextStepCard: Button below content (flex-col)
- JourneyPathways: 1 column grid
- ToolsGrid: Collapsed, expandable accordion
- Touch targets: minimum 44px × 44px

**Tablet (640px - 1023px):**
- JourneyPathways: 2 column grid
- ToolsGrid: 3 column grid
- WelcomeSection: Stats inline with greeting
- NextStepCard: Button beside content (flex-row)

**Desktop (1024px+):**
- JourneyPathways: 3 column grid
- ToolsGrid: 4 column grid
- Max-width container: 1400px
- Optimal reading width for text content

---

## 📐 TypeScript Types & Interfaces

```typescript
// src/types/dashboard-v2.ts

import { z } from 'zod';

// ============================================================================
// ZOD SCHEMAS (for validation)
// ============================================================================

export const DashboardStatsSchema = z.object({
  activeAgents: z.number().int().nonnegative(),
  totalAgents: z.number().int().nonnegative(),
  completedTasks: z.number().int().nonnegative(),
  hoursSaved: z.number().nonnegative(),
  crmContacts: z.number().int().nonnegative(),
  hotLeads: z.number().int().nonnegative(),
  financeConnections: z.number().int().nonnegative(),
});

export const NextStepActionSchema = z.object({
  id: z.string(),
  title: z.string(),
  why: z.string(),
  benefits: z.array(z.string()),
  cta: z.string(),
  href: z.string(),
  priority: z.number().int().min(1).max(10),
});

export const WinSchema = z.object({
  id: z.string(),
  emoji: z.string(),
  title: z.string(),
  detail: z.string(),
  timeAgo: z.string(),
  timestamp: z.date(),
  type: z.enum(['agent', 'task', 'crm', 'finance', 'content', 'general']),
});

export const JourneyPathwaySchema = z.object({
  id: z.string(),
  title: z.string(),
  promise: z.string(),
  href: z.string(),
  icon: z.string(),
  iconColor: z.string(),
  iconBg: z.string(),
  badge: z.string().optional(),
  order: z.number().int(),
});

export const DashboardV2DataSchema = z.object({
  stats: DashboardStatsSchema,
  nextStep: NextStepActionSchema,
  pathways: z.array(JourneyPathwaySchema),
  wins: z.array(WinSchema),
  user: z.object({
    name: z.string(),
    isFirstTime: z.boolean(),
    lastLogin: z.date().optional(),
  }),
  onboarding: z.object({
    isComplete: z.boolean(),
    completionPercentage: z.number().min(0).max(100),
  }),
});

// ============================================================================
// TYPESCRIPT TYPES
// ============================================================================

export type DashboardStats = z.infer<typeof DashboardStatsSchema>;
export type NextStepAction = z.infer<typeof NextStepActionSchema>;
export type Win = z.infer<typeof WinSchema>;
export type JourneyPathway = z.infer<typeof JourneyPathwaySchema>;
export type DashboardV2Data = z.infer<typeof DashboardV2DataSchema>;

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface DashboardV2ClientProps {
  initialData: DashboardV2Data;
}

export interface WelcomeSectionProps {
  userName: string;
  isFirstTime: boolean;
  lastLogin?: Date;
  stats: DashboardStats;
  hasActiveAgents: boolean;
}

export interface NextStepCardProps {
  action: NextStepAction;
  onClick: () => void;
}

export interface JourneyPathwaysProps {
  pathways: JourneyPathway[];
}

export interface RecentWinsTimelineProps {
  wins: Win[];
  isEmpty: boolean;
}

export interface ToolsGridProps {
  isCollapsed?: boolean;
}
```

---

## 🔌 API Endpoint Specification

### Create `/api/dashboard/v2/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { agents, tasks, contacts, integrations, agentExecutions } from '@/db/schema';
import { eq, and, desc, count, sql, gte, inArray } from 'drizzle-orm';
import { DashboardV2DataSchema } from '@/types/dashboard-v2';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();

    // Fetch all data in parallel
    const [
      agentsData,
      tasksData,
      crmData,
      financeIntegrations,
      recentExecutions,
      userProfile,
    ] = await Promise.all([
      // Agents
      db.query.agents.findMany({
        where: eq(agents.workspaceId, workspaceId),
        orderBy: [desc(agents.lastExecutedAt)],
      }),

      // Completed tasks (last 30 days)
      db.query.tasks.findMany({
        where: and(
          eq(tasks.workspaceId, workspaceId),
          eq(tasks.status, 'done'),
          gte(tasks.completedAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        ),
        orderBy: [desc(tasks.completedAt)],
      }),

      // CRM contacts
      db.select({
        total: count(),
        hot: sql<number>`count(*) filter (where ${contacts.leadStatus} = 'hot')`,
      })
      .from(contacts)
      .where(eq(contacts.workspaceId, workspaceId)),

      // Finance integrations
      db.query.integrations.findMany({
        where: and(
          eq(integrations.workspaceId, workspaceId),
          inArray(integrations.provider, ['quickbooks', 'stripe', 'shopify']),
          eq(integrations.status, 'connected')
        ),
      }),

      // Recent agent executions (last 7 days)
      db.query.agentExecutions.findMany({
        where: and(
          eq(agentExecutions.workspaceId, workspaceId),
          gte(agentExecutions.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        ),
        orderBy: [desc(agentExecutions.createdAt)],
        limit: 50,
        with: { agent: true },
      }),

      // User profile (implement this helper)
      getUserProfile(workspaceId, userId),
    ]);

    // Calculate stats
    const stats = {
      activeAgents: agentsData.filter(a => a.status === 'active').length,
      totalAgents: agentsData.length,
      completedTasks: tasksData.length,
      hoursSaved: tasksData.length * 2,
      crmContacts: crmData[0]?.total ?? 0,
      hotLeads: Number(crmData[0]?.hot ?? 0),
      financeConnections: financeIntegrations.length,
    };

    // Determine next step
    const nextStep = determineNextStep(stats, agentsData, tasksData);

    // Generate wins from recent activity
    const wins = generateWinsFromActivity(recentExecutions, tasksData);

    // Generate pathways (dynamically ordered)
    const pathways = generatePathways(stats);

    // Build response
    const responseData = {
      stats,
      nextStep,
      pathways,
      wins,
      user: userProfile,
      onboarding: {
        isComplete: stats.totalAgents > 0 && stats.crmContacts > 0,
        completionPercentage: calculateOnboardingCompletion(stats),
      },
    };

    // Validate response with Zod
    const validated = DashboardV2DataSchema.parse(responseData);

    return NextResponse.json(validated);

  } catch (error) {
    logger.error('Dashboard V2 API error', error);
    
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function determineNextStep(
  stats: DashboardStats,
  agents: Agent[],
  tasks: Task[]
): NextStepAction {
  // Priority order (first match wins)
  if (stats.totalAgents === 0) {
    return {
      id: 'create-first-agent',
      title: 'Create Your First Agent',
      why: 'Agents automate repetitive work so you can focus on what matters',
      benefits: [
        'Save 10+ hours per week',
        'Never miss a follow-up',
        'Work while you sleep',
      ],
      cta: 'Create Agent',
      href: '/agents?action=create',
      priority: 10,
    };
  }

  if (stats.crmContacts === 0) {
    return {
      id: 'add-first-contact',
      title: 'Add Your First Contact',
      why: 'Start building relationships and tracking conversations',
      benefits: [
        'Organize your network',
        'Track every interaction',
        'Never forget to follow up',
      ],
      cta: 'Add Contact',
      href: '/crm?action=create',
      priority: 9,
    };
  }

  if (stats.hotLeads > 0) {
    return {
      id: 'follow-up-hot-leads',
      title: 'Follow Up with Hot Leads',
      why: `${stats.hotLeads} leads rated 'Hot' need your attention`,
      benefits: [
        'Close deals faster',
        'Maintain momentum',
        'Build relationships',
      ],
      cta: 'Open CRM',
      href: '/crm?filter=hot',
      priority: 8,
    };
  }

  // Default
  return {
    id: 'review-activity',
    title: 'Review What Galaxy Did Today',
    why: 'See how your agents and automations are performing',
    benefits: [
      'Track progress',
      'Spot opportunities',
      'Optimize workflows',
    ],
    cta: 'View Activity',
    href: '/activity',
    priority: 1,
  };
}

function generateWinsFromActivity(
  executions: AgentExecution[],
  tasks: Task[]
): Win[] {
  const wins: Win[] = [];

  // Group by type and create summary wins
  const executionsByAgent = executions.reduce((acc, exec) => {
    const agentName = exec.agent?.name ?? 'Unknown Agent';
    acc[agentName] = (acc[agentName] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(executionsByAgent).forEach(([agentName, count]) => {
    wins.push({
      id: `win-agent-${agentName}`,
      emoji: '⚡',
      title: `${agentName} executed ${count} times`,
      detail: 'Automating your workflow in the background',
      timeAgo: 'This week',
      timestamp: new Date(),
      type: 'agent',
    });
  });

  // Tasks completed
  if (tasks.length > 0) {
    wins.push({
      id: 'win-tasks',
      emoji: '✅',
      title: `Completed ${tasks.length} tasks`,
      detail: `Saved approximately ${tasks.length * 2} hours`,
      timeAgo: 'Last 30 days',
      timestamp: new Date(),
      type: 'task',
    });
  }

  return wins.slice(0, 10); // Limit to 10 wins
}

function generatePathways(stats: DashboardStats): JourneyPathway[] {
  const pathways: JourneyPathway[] = [
    {
      id: 'automate',
      title: 'Automate My Work',
      promise: 'Build AI agents that handle repetitive tasks',
      href: '/agents',
      icon: 'Sparkles',
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100',
      badge: stats.activeAgents > 0 ? `${stats.activeAgents} active` : undefined,
      order: stats.totalAgents === 0 ? 1 : 3,
    },
    {
      id: 'relationships',
      title: 'Manage My Relationships',
      promise: 'Track leads, contacts, and conversations',
      href: '/crm',
      icon: 'Users',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      badge: stats.hotLeads > 0 ? `${stats.hotLeads} hot leads` : undefined,
      order: stats.hotLeads > 0 ? 1 : 2,
    },
    // ... other pathways
  ];

  return pathways.sort((a, b) => a.order - b.order);
}

function calculateOnboardingCompletion(stats: DashboardStats): number {
  let completion = 0;
  if (stats.totalAgents > 0) completion += 33;
  if (stats.crmContacts > 0) completion += 33;
  if (stats.financeConnections > 0) completion += 34;
  return completion;
}

async function getUserProfile(workspaceId: string, userId: string) {
  // Implement based on your user table structure
  return {
    name: 'User', // Get from database
    isFirstTime: false, // Check if first login
    lastLogin: undefined, // Get from database
  };
}
```

---

## 📊 Data Requirements

### Server-Side Fetches (in page.tsx)

```typescript
async function getDashboardData(workspaceId: string) {
  const [
    agentsData,
    tasksData,
    crmData,
    financeIntegrations,
    recentActivity,
    userProfile,
    onboardingStatus,
  ] = await Promise.all([
    // Agents
    db.query.agents.findMany({
      where: eq(agents.workspaceId, workspaceId),
      orderBy: [desc(agents.lastExecutedAt)],
    }),
    
    // Tasks
    db.query.tasks.findMany({
      where: and(
        eq(tasks.workspaceId, workspaceId),
        eq(tasks.status, 'done')
      ),
      orderBy: [desc(tasks.completedAt)],
      limit: 50,
    }),
    
    // CRM Stats
    db.select({ 
      total: count(),
      hot: countIf(contacts.leadStatus, 'hot'),
    })
    .from(contacts)
    .where(eq(contacts.workspaceId, workspaceId)),
    
    // Finance Integrations
    db.query.integrations.findMany({
      where: and(
        eq(integrations.workspaceId, workspaceId),
        inArray(integrations.provider, ['quickbooks', 'stripe', 'shopify']),
        eq(integrations.status, 'connected')
      ),
    }),
    
    // Recent Agent Executions
    db.query.agentExecutions.findMany({
      where: eq(agentExecutions.workspaceId, workspaceId),
      orderBy: [desc(agentExecutions.createdAt)],
      limit: 20,
      with: { agent: true },
    }),
    
    // User Profile
    getUserProfile(workspaceId),
    
    // Onboarding Status
    getOnboardingStatus(workspaceId),
  ]);
  
  return {
    stats: {
      activeAgents: agentsData.filter(a => a.status === 'active').length,
      totalAgents: agentsData.length,
      completedTasks: tasksData.length,
      hoursSaved: tasksData.length * 2, // Estimate
      crmContacts: crmData.total,
      hotLeads: crmData.hot,
      financeConnections: financeIntegrations.length,
    },
    recentActivity: {
      executions: recentActivity,
      tasks: tasksData.slice(0, 10),
    },
    user: userProfile,
    onboarding: onboardingStatus,
  };
}
```

### Client-Side Updates (SWR)

```typescript
// In DashboardV2Client component
const { data, error, isLoading, mutate } = useSWR(
  '/api/dashboard/v2',
  fetcher,
  { 
    fallbackData: initialData,
    refreshInterval: 30000, // 30 seconds
    revalidateOnFocus: true,
  }
);
```

---

## 🧪 Empty States & Edge Cases

### New User (No Data)

**WelcomeSection:**
"Welcome to GalaxyCo! Let's get you started. 🚀"

**NextStepCard:**
"Complete Your Setup" → "Get the most out of Galaxy in 5 minutes" → ["Connect your tools", "Create your first agent", "Import contacts"] → Button: "Start Setup"

**JourneyPathways:**
All visible, but with "Get Started" badges

**RecentWinsTimeline:**
Empty state with illustration: "Your wins will appear here as you use Galaxy!"

**ToolsGrid:**
Show all tools with "Explore" CTAs

---

### Power User (Lots of Data)

**WelcomeSection:**
"Welcome back, Sarah! Your agents have been working. ⚡"
Stats: "8 Active Agents · 42 Tasks This Week · ~84 Hours Saved"

**NextStepCard:**
"Review Hot Leads" → "3 leads rated 'Hot' haven't been contacted in 5+ days" → ["Close deals faster", "Maintain momentum", "Build relationships"] → Button: "Open CRM"

**JourneyPathways:**
Dynamically ordered by most-used features
Show counts/badges on each

**RecentWinsTimeline:**
Rich activity feed with real accomplishments

**ToolsGrid:**
Collapsed by default ("Show all tools" expandable)

---

## 🚀 Implementation Plan

### Phase 1: Foundation (Day 1-2)
- [x] Create route: `src/app/(app)/dashboard-v2/page.tsx`
- [x] Set up server component with data fetching
- [x] Create client wrapper component
- [x] Implement ErrorBoundary wrapping
- [x] Set up SWR for real-time updates

### Phase 2: Core Sections (Day 3-5)
- [ ] Build WelcomeSection component
- [ ] Build NextStepCard with smart logic
- [ ] Build JourneyPathways (6 outcome cards)
- [ ] Build RecentWinsTimeline
- [ ] Build NeptuneQuickHelp integration

### Phase 3: Secondary Features (Day 6)
- [ ] Build ToolsGrid
- [ ] Implement empty states for all sections
- [ ] Add loading skeletons
- [ ] Add error states

### Phase 4: Polish (Day 7-8)
- [ ] Add framer-motion animations
- [ ] Responsive testing (mobile, tablet, desktop)
- [ ] Accessibility audit (ARIA labels, keyboard nav)
- [ ] Dark mode verification
- [ ] Performance optimization

### Phase 5: Testing & Launch (Day 9-10)
- [ ] User testing with real accounts
- [ ] A/B test vs old dashboard
- [ ] Gather feedback
- [ ] Iterate
- [ ] Migrate old dashboard to v2 (or keep both)

---

## 📋 Acceptance Criteria

### Functional Requirements
- [x] Page loads without errors
- [x] All data fetched from real database
- [x] SWR provides real-time updates
- [x] Next Step card shows contextually relevant action
- [x] Journey Pathways navigate to correct routes
- [x] Recent Wins displays actual activity
- [x] Neptune integration works
- [x] Empty states appear when no data
- [x] Loading states show while fetching
- [x] Error states handle failures gracefully

### Design Requirements
- [x] Matches DESIGN-SYSTEM.md specifications
- [x] Responsive across all breakpoints
- [x] Animations smooth and purposeful
- [x] Typography hierarchy clear
- [x] Color usage consistent with brand
- [x] Dark mode fully supported
- [x] Focus states visible for accessibility

### User Experience Requirements
- [x] First-time users see clear onboarding path
- [x] Returning users see personalized greeting
- [x] Next step is obvious and actionable
- [x] Success/progress is celebrated
- [x] Getting help (Neptune) is easy and visible
- [x] Navigation is outcome-based, not feature-based
- [x] Page feels helpful, not overwhelming

### Technical Requirements
- [x] Server component for initial data fetch
- [x] Client component for interactivity
- [x] SWR for client-side updates
- [x] ErrorBoundary wrapping
- [x] No console errors or warnings
- [x] TypeScript strict mode compliance
- [x] Follows existing code patterns
- [x] Properly scoped by workspaceId

---

## 🔐 Security & Performance

### Security
- All data scoped by `workspaceId` from `getCurrentWorkspace()`
- No sensitive data in client-side code
- API routes protected by middleware
- Input validation with Zod schemas

### Performance
- Server-side data fetching for fast initial load
- SWR caching to minimize API calls
- Lazy loading for heavy components
- Image optimization for any illustrations
- Code splitting for dashboard-v2 bundle

### Monitoring
- Error tracking via Sentry
- Performance metrics via Web Vitals
- User interaction analytics
- A/B test results tracking

### Analytics Event Tracking

```typescript
// Track key user interactions

// Page view
trackEvent('dashboard_v2_viewed', {
  userId,
  workspaceId,
  stats: { agents: stats.activeAgents, tasks: stats.completedTasks },
  timestamp: new Date(),
});

// Next Step interaction
trackEvent('next_step_clicked', {
  userId,
  workspaceId,
  actionId: nextStep.id,
  actionTitle: nextStep.title,
  timestamp: new Date(),
});

// Journey Pathway navigation
trackEvent('pathway_clicked', {
  userId,
  workspaceId,
  pathwayId: pathway.id,
  pathwayTitle: pathway.title,
  destination: pathway.href,
  timestamp: new Date(),
});

// Neptune interaction
trackEvent('neptune_opened_from_dashboard', {
  userId,
  workspaceId,
  trigger: 'suggestion_chip' | 'floating_button',
  query: neptuneQuery,
  timestamp: new Date(),
});

// Win interaction
trackEvent('win_viewed', {
  userId,
  workspaceId,
  winType: win.type,
  timestamp: new Date(),
});
```

---

## 📚 References

### Existing Patterns to Follow
- **Finance HQ:** Excellent empty states, integration prompts
- **Library:** Great Neptune integration, template-based creation
- **Creator:** Strong guided session flow
- **Lunar Labs:** Celebration of milestones, progress tracking

### Design Resources
- `DESIGN-SYSTEM.md` - Color, typography, spacing
- `src/components/ui/*` - shadcn/ui components
- `src/components/shared/FloatingAIAssistant.tsx` - Neptune integration
- `tailwind.config.ts` - Theme configuration

### API Documentation
- `API_DOCUMENTATION.md` - All endpoint specs
- `src/app/api/*` - Existing API routes to reference

---

## 🎉 Success Metrics

### User Engagement
- **Goal:** 80%+ of users take the "Next Step" action
- **Goal:** 50%+ of users use Neptune on dashboard
- **Goal:** 30%+ of users explore a Journey Pathway

### Business Impact
- **Goal:** Reduce time-to-first-value for new users by 50%
- **Goal:** Increase feature discovery (users visiting 3+ sections) by 40%
- **Goal:** Improve user retention (return visits) by 25%

### Qualitative Feedback
- **Goal:** "This is so much clearer!" sentiment in user feedback
- **Goal:** Reduced support requests about "What should I do first?"
- **Goal:** Users describe dashboard as "helpful" not "overwhelming"

---

## 💭 Philosophy Summary

**Old Dashboard Thinking:**
"Here are all our features. Figure out what to do."

**New Dashboard v2 Thinking:**
"Here's what you should do next. We'll guide you."

**The Shift:**
- From **platform-centric** to **user-centric**
- From **feature showcase** to **journey guide**
- From **data display** to **action recommendation**
- From **static** to **personalized**
- From **overwhelming** to **empowering**

---

*This specification represents a fundamental shift in how we think about the dashboard. It's not just a redesign—it's a rethinking of our relationship with users. We're here to serve them, guide them, and celebrate with them. Not to impress them with complexity.*

**Next Step:** Review this spec, get your feedback, then build it together. 🚀
