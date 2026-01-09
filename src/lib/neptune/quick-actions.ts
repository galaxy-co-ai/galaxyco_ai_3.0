/**
 * Neptune Quick Actions Engine
 * 
 * Generates intelligent, contextual action suggestions based on:
 * - Current page and module
 * - User's workspace state
 * - Recent user actions
 * - Time of day and patterns
 */

import { 
  type PageContextData, 
  type AppModule, 
  type SuggestedAction 
} from './page-context';

// ============================================================================
// TYPES
// ============================================================================

export interface QuickActionContext {
  pageContext: PageContextData;
  workspaceState?: {
    totalLeads: number;
    totalContacts: number;
    totalAgents: number;
    totalCampaigns: number;
    totalDocuments: number;
    hasOverdueItems: boolean;
    hasHotLeads: boolean;
    isNewWorkspace: boolean;
  };
  userPatterns?: {
    frequentActions: string[];
    preferredTools: string[];
    timeOfDay: 'morning' | 'afternoon' | 'evening';
  };
}

// ============================================================================
// ICON MAPPING
// ============================================================================

const ICONS = {
  lightbulb: 'Lightbulb',
  pen: 'PenLine',
  palette: 'Palette',
  trending: 'TrendingUp',
  refresh: 'RefreshCw',
  wand: 'Wand2',
  user: 'User',
  users: 'Users',
  mail: 'Mail',
  calendar: 'Calendar',
  chart: 'BarChart3',
  search: 'Search',
  plus: 'Plus',
  zap: 'Zap',
  target: 'Target',
  file: 'FileText',
  robot: 'Bot',
  dollar: 'DollarSign',
  send: 'Send',
  clock: 'Clock',
  star: 'Star',
} as const;

// ============================================================================
// MODULE-SPECIFIC ACTIONS
// ============================================================================

const MODULE_ACTIONS: Record<AppModule, (ctx: QuickActionContext) => SuggestedAction[]> = {
  dashboard: (ctx) => {
    const actions: SuggestedAction[] = [];
    const isNew = ctx.workspaceState?.isNewWorkspace ?? true;

    if (isNew) {
      // Business-type prompts that answer "What do you do and who do you serve?"
      actions.push({
        id: 'biz-solar',
        label: 'I run a solar company',
        prompt: 'I run a solar installation company. We help homeowners and businesses switch to solar energy.',
        icon: ICONS.zap,
        priority: 100,
        reason: 'Quick business context for onboarding',
      });
      actions.push({
        id: 'biz-roofing',
        label: "I'm a roofing contractor",
        prompt: "I'm a roofing contractor. We do residential and commercial roof repairs and installations.",
        icon: ICONS.user,
        priority: 95,
        reason: 'Quick business context for onboarding',
      });
      actions.push({
        id: 'biz-home-services',
        label: 'Home services business',
        prompt: 'I manage a home services business - things like HVAC, plumbing, and electrical work.',
        icon: ICONS.users,
        priority: 90,
        reason: 'Quick business context for onboarding',
      });
    } else {
      actions.push({
        id: 'dashboard-status',
        label: 'What should I focus on?',
        prompt: 'What should I focus on today based on my current priorities?',
        icon: ICONS.target,
        priority: 90,
        reason: 'Daily prioritization',
      });

      if (ctx.workspaceState?.hasHotLeads) {
        actions.push({
          id: 'hot-leads',
          label: 'Review hot leads',
          prompt: 'Show me my hot leads that need attention',
          icon: ICONS.star,
          priority: 85,
          reason: 'Hot leads in pipeline',
        });
      }

      if (ctx.workspaceState?.hasOverdueItems) {
        actions.push({
          id: 'overdue-items',
          label: 'Check overdue items',
          prompt: 'What items are overdue that I need to address?',
          icon: ICONS.clock,
          priority: 88,
          reason: 'Overdue tasks exist',
        });
      }

      actions.push({
        id: 'quick-navigate',
        label: 'Take me to...',
        prompt: 'Navigate me to ',
        icon: ICONS.zap,
        priority: 60,
      });
    }

    return actions.sort((a, b) => b.priority - a.priority).slice(0, 4);
  },

  creator: (ctx) => {
    const actions: SuggestedAction[] = [];
    const activeTab = ctx.pageContext.activeTab || 'create';

    if (activeTab === 'create') {
      actions.push({
        id: 'content-ideas',
        label: 'Suggest content ideas',
        prompt: 'Suggest some content ideas for my business',
        icon: ICONS.lightbulb,
        priority: 90,
      });
      actions.push({
        id: 'help-write',
        label: 'Help me write',
        prompt: 'Help me write compelling copy',
        icon: ICONS.pen,
        priority: 85,
      });
      actions.push({
        id: 'design-tips',
        label: 'Design tips',
        prompt: 'What design tips do you have for marketing materials?',
        icon: ICONS.palette,
        priority: 80,
      });
      actions.push({
        id: 'whats-trending',
        label: "What's trending",
        prompt: 'What content types are trending right now?',
        icon: ICONS.trending,
        priority: 75,
      });
    } else if (activeTab === 'collections') {
      actions.push({
        id: 'organize-content',
        label: 'Organize my content',
        prompt: 'Help me organize my existing content better',
        icon: ICONS.refresh,
        priority: 90,
      });
      actions.push({
        id: 'suggest-collections',
        label: 'Suggest collections',
        prompt: 'What collections should I create to organize my work?',
        icon: ICONS.wand,
        priority: 85,
      });
    } else if (activeTab === 'templates') {
      actions.push({
        id: 'recommend-templates',
        label: 'Recommend templates',
        prompt: 'What templates would be most useful for my business?',
        icon: ICONS.lightbulb,
        priority: 90,
      });
      actions.push({
        id: 'custom-template',
        label: 'Custom template',
        prompt: 'Help me design a custom template for my needs',
        icon: ICONS.pen,
        priority: 85,
      });
    }

    // Add wizard-specific actions if in wizard
    if (ctx.pageContext.wizardState) {
      const step = ctx.pageContext.wizardState.stepName;
      actions.unshift({
        id: 'wizard-help',
        label: `Help with ${step}`,
        prompt: `Help me complete the ${step} step`,
        icon: ICONS.wand,
        priority: 100,
        reason: 'Active wizard',
      });
    }

    return actions.slice(0, 4);
  },

  crm: (ctx) => {
    const actions: SuggestedAction[] = [];
    const hasSelection = ctx.pageContext.selectedItems.length > 0;
    const focusedItem = ctx.pageContext.focusedItem;

    if (focusedItem) {
      actions.push({
        id: 'lead-next-action',
        label: `Next action for ${focusedItem.name}`,
        prompt: `What should I do next with ${focusedItem.name}?`,
        icon: ICONS.target,
        priority: 100,
        reason: 'Viewing specific lead',
      });
      actions.push({
        id: 'draft-followup',
        label: 'Draft follow-up',
        prompt: `Draft a follow-up message for ${focusedItem.name}`,
        icon: ICONS.mail,
        priority: 95,
      });
    } else if (hasSelection) {
      const count = ctx.pageContext.selectedItems.length;
      actions.push({
        id: 'bulk-action',
        label: `Actions for ${count} selected`,
        prompt: `What can I do with these ${count} selected items?`,
        icon: ICONS.users,
        priority: 100,
      });
    } else {
      actions.push({
        id: 'add-lead',
        label: 'Add a lead',
        prompt: 'Help me add a new lead',
        icon: ICONS.plus,
        priority: 90,
      });
      actions.push({
        id: 'pipeline-status',
        label: 'Pipeline status',
        prompt: 'Give me a summary of my pipeline',
        icon: ICONS.chart,
        priority: 85,
      });
      actions.push({
        id: 'find-lead',
        label: 'Find a lead',
        prompt: 'Help me find a specific lead',
        icon: ICONS.search,
        priority: 80,
      });
      
      if (ctx.workspaceState?.hasHotLeads) {
        actions.push({
          id: 'hot-leads',
          label: 'Hot leads',
          prompt: 'Show me leads that are ready to close',
          icon: ICONS.star,
          priority: 88,
        });
      }
    }

    return actions.slice(0, 4);
  },

  marketing: (ctx) => {
    const actions: SuggestedAction[] = [];

    actions.push({
      id: 'create-campaign',
      label: 'Create campaign',
      prompt: 'Help me create a new marketing campaign',
      icon: ICONS.plus,
      priority: 90,
    });
    actions.push({
      id: 'campaign-performance',
      label: 'Campaign performance',
      prompt: 'How are my campaigns performing?',
      icon: ICONS.chart,
      priority: 85,
    });
    actions.push({
      id: 'improve-emails',
      label: 'Improve email opens',
      prompt: 'How can I improve my email open rates?',
      icon: ICONS.mail,
      priority: 80,
    });
    actions.push({
      id: 'content-calendar',
      label: 'Content calendar',
      prompt: 'Help me plan my content calendar for the week',
      icon: ICONS.calendar,
      priority: 75,
    });

    return actions.slice(0, 4);
  },

  finance: (ctx) => {
    const actions: SuggestedAction[] = [];

    actions.push({
      id: 'financial-summary',
      label: 'Financial summary',
      prompt: 'Give me a summary of my financial status',
      icon: ICONS.dollar,
      priority: 90,
    });
    actions.push({
      id: 'overdue-invoices',
      label: 'Overdue invoices',
      prompt: 'Show me overdue invoices that need attention',
      icon: ICONS.clock,
      priority: 88,
    });
    actions.push({
      id: 'cash-flow',
      label: 'Cash flow forecast',
      prompt: 'What does my cash flow look like for the next month?',
      icon: ICONS.chart,
      priority: 85,
    });
    actions.push({
      id: 'send-reminder',
      label: 'Send payment reminder',
      prompt: 'Help me send payment reminders to overdue customers',
      icon: ICONS.send,
      priority: 80,
    });

    return actions.slice(0, 4);
  },

  agents: (ctx) => {
    const actions: SuggestedAction[] = [];
    const focusedAgent = ctx.pageContext.focusedItem;

    if (focusedAgent) {
      actions.push({
        id: 'run-agent',
        label: `Run ${focusedAgent.name}`,
        prompt: `Run the ${focusedAgent.name} agent`,
        icon: ICONS.zap,
        priority: 100,
      });
      actions.push({
        id: 'agent-history',
        label: 'View history',
        prompt: `Show me the execution history for ${focusedAgent.name}`,
        icon: ICONS.clock,
        priority: 95,
      });
    } else {
      actions.push({
        id: 'create-agent',
        label: 'Create an agent',
        prompt: 'Help me create a new AI agent to automate a task',
        icon: ICONS.robot,
        priority: 90,
      });
      actions.push({
        id: 'suggest-automation',
        label: 'Suggest automations',
        prompt: 'What tasks should I automate with agents?',
        icon: ICONS.lightbulb,
        priority: 85,
      });
      actions.push({
        id: 'list-agents',
        label: 'My agents',
        prompt: 'Show me all my agents and their status',
        icon: ICONS.users,
        priority: 80,
      });
    }

    return actions.slice(0, 4);
  },

  library: (ctx) => {
    const actions: SuggestedAction[] = [];
    const searchQuery = ctx.pageContext.filterState?.query;

    if (searchQuery) {
      actions.push({
        id: 'search-more',
        label: 'Refine search',
        prompt: `Help me find more specific results for "${searchQuery}"`,
        icon: ICONS.search,
        priority: 100,
      });
    }

    actions.push({
      id: 'find-document',
      label: 'Find a document',
      prompt: 'Help me find a specific document',
      icon: ICONS.search,
      priority: 90,
    });
    actions.push({
      id: 'upload-help',
      label: 'Upload & organize',
      prompt: 'Help me upload and organize documents',
      icon: ICONS.file,
      priority: 85,
    });
    actions.push({
      id: 'ask-docs',
      label: 'Ask my docs',
      prompt: 'Answer a question using my documents',
      icon: ICONS.lightbulb,
      priority: 80,
    });

    return actions.slice(0, 4);
  },

  conversations: (ctx) => [
    {
      id: 'recent-conversations',
      label: 'Recent conversations',
      prompt: 'Show me recent customer conversations',
      icon: ICONS.mail,
      priority: 90,
    },
    {
      id: 'draft-reply',
      label: 'Draft a reply',
      prompt: 'Help me draft a reply to a customer',
      icon: ICONS.pen,
      priority: 85,
    },
  ],

  calendar: (ctx) => [
    {
      id: 'schedule-meeting',
      label: 'Schedule meeting',
      prompt: 'Help me schedule a meeting',
      icon: ICONS.calendar,
      priority: 90,
    },
    {
      id: 'today-events',
      label: "Today's schedule",
      prompt: "What's on my calendar today?",
      icon: ICONS.clock,
      priority: 85,
    },
    {
      id: 'check-availability',
      label: 'Check availability',
      prompt: 'When am I free this week?',
      icon: ICONS.search,
      priority: 80,
    },
  ],

  orchestration: (ctx) => [
    {
      id: 'create-team',
      label: 'Create agent team',
      prompt: 'Help me create a team of agents for a department',
      icon: ICONS.users,
      priority: 90,
    },
    {
      id: 'run-workflow',
      label: 'Run workflow',
      prompt: 'Help me set up and run a multi-agent workflow',
      icon: ICONS.zap,
      priority: 85,
    },
    {
      id: 'team-status',
      label: 'Team status',
      prompt: 'Show me the status of my agent teams',
      icon: ICONS.chart,
      priority: 80,
    },
  ],

  'neptune-hq': (ctx) => [
    {
      id: 'neptune-analytics',
      label: 'My analytics',
      prompt: 'Show me Neptune analytics and performance',
      icon: ICONS.chart,
      priority: 90,
    },
    {
      id: 'conversation-history',
      label: 'Recent conversations',
      prompt: 'Show me recent Neptune conversations',
      icon: ICONS.mail,
      priority: 85,
    },
    {
      id: 'improve-neptune',
      label: 'How can I improve?',
      prompt: 'How can Neptune be more helpful to me?',
      icon: ICONS.lightbulb,
      priority: 80,
    },
  ],

  settings: (ctx) => [
    {
      id: 'connect-integration',
      label: 'Connect an app',
      prompt: 'Help me connect an integration',
      icon: ICONS.plus,
      priority: 90,
    },
    {
      id: 'configure-settings',
      label: 'Configure settings',
      prompt: 'Help me configure my workspace settings',
      icon: ICONS.wand,
      priority: 85,
    },
  ],

  'lunar-labs': (ctx) => [
    {
      id: 'try-experiment',
      label: 'Try an experiment',
      prompt: 'What experiments can I try?',
      icon: ICONS.wand,
      priority: 90,
    },
    {
      id: 'give-feedback',
      label: 'Give feedback',
      prompt: 'I have feedback about a feature',
      icon: ICONS.lightbulb,
      priority: 85,
    },
  ],

  launchpad: (ctx) => [
    {
      id: 'quick-navigate',
      label: 'Quick navigate',
      prompt: 'Take me to ',
      icon: ICONS.zap,
      priority: 90,
    },
    {
      id: 'quick-search',
      label: 'Search',
      prompt: 'Search for ',
      icon: ICONS.search,
      priority: 85,
    },
  ],
};

// ============================================================================
// MAIN ENGINE
// ============================================================================

/**
 * Generate contextual quick actions based on current state
 */
export function generateQuickActions(context: QuickActionContext): SuggestedAction[] {
  const { pageContext } = context;
  const pageModule = pageContext.module;

  // Get module-specific actions
  const moduleActionGenerator = MODULE_ACTIONS[pageModule];
  if (!moduleActionGenerator) {
    return getDefaultActions();
  }

  return moduleActionGenerator(context);
}

/**
 * Get default actions when module is unknown
 */
function getDefaultActions(): SuggestedAction[] {
  return [
    {
      id: 'help',
      label: 'Help me with...',
      prompt: 'Help me with ',
      icon: ICONS.lightbulb,
      priority: 90,
    },
    {
      id: 'navigate',
      label: 'Take me to...',
      prompt: 'Navigate to ',
      icon: ICONS.zap,
      priority: 85,
    },
  ];
}

/**
 * Merge user patterns into actions (for personalization)
 */
export function personalizeActions(
  actions: SuggestedAction[],
  userPatterns?: QuickActionContext['userPatterns']
): SuggestedAction[] {
  if (!userPatterns?.frequentActions?.length) {
    return actions;
  }

  // Boost priority for frequent actions
  return actions.map(action => {
    const isFrequent = userPatterns.frequentActions.some(
      freq => action.prompt.toLowerCase().includes(freq.toLowerCase())
    );
    return isFrequent
      ? { ...action, priority: action.priority + 10 }
      : action;
  }).sort((a, b) => b.priority - a.priority);
}

/**
 * Get icon component name for an action
 */
export function getActionIcon(action: SuggestedAction): string {
  return action.icon || 'Lightbulb';
}
