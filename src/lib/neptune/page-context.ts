/**
 * Neptune Page Context System
 * 
 * This module provides the foundation for Neptune's contextual awareness.
 * It enables Neptune to understand where the user is, what they're doing,
 * and what they might need help with next.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * The module/area of the application
 */
export type AppModule = 
  | 'dashboard'
  | 'creator'
  | 'crm'
  | 'marketing'
  | 'finance'
  | 'agents'
  | 'library'
  | 'conversations'
  | 'calendar'
  | 'orchestration'
  | 'neptune-hq'
  | 'settings'
  | 'lunar-labs'
  | 'launchpad';

/**
 * The type of page within a module
 */
export type PageType = 
  | 'dashboard'  // Overview/landing page
  | 'create'     // Creating new content
  | 'view'       // Viewing details
  | 'edit'       // Editing existing
  | 'list'       // List/table view
  | 'hq'         // Headquarters/control center
  | 'wizard'     // Multi-step process
  | 'settings';  // Configuration

/**
 * An item the user has selected or is focused on
 */
export interface SelectedItem {
  id: string;
  type: 'lead' | 'contact' | 'campaign' | 'template' | 'document' | 'agent' | 'invoice' | 'task' | 'event' | 'content' | 'collection';
  name: string;
  metadata?: Record<string, unknown>;
}

/**
 * A recent action the user took
 */
export interface UserAction {
  action: string;
  target?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * A suggested action Neptune can recommend
 */
export interface SuggestedAction {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
  priority: number;
  reason?: string;
}

/**
 * Wizard/multi-step process state
 */
export interface WizardState {
  currentStep: number;
  totalSteps: number;
  stepName: string;
  completedSteps: string[];
  data?: Record<string, unknown>;
}

/**
 * Filter/search state on list pages
 */
export interface FilterState {
  query?: string;
  filters: Record<string, string | string[] | boolean | number>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * The complete page context that Neptune uses to understand the user's journey
 */
export interface PageContextData {
  // Core identification
  pageName: string;
  pageType: PageType;
  module: AppModule;
  
  // Navigation context
  path: string;
  activeTab?: string;
  viewMode?: 'grid' | 'list' | 'kanban' | 'calendar' | 'chart';
  
  // Selection state
  selectedItems: SelectedItem[];
  focusedItem?: SelectedItem;
  
  // Process state
  wizardState?: WizardState;
  filterState?: FilterState;
  
  // User actions
  recentActions: UserAction[];
  
  // Page-specific data
  customData?: Record<string, unknown>;
  
  // Timestamps
  enteredAt: Date;
  lastInteractionAt: Date;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_PAGE_CONTEXT: PageContextData = {
  pageName: 'dashboard',
  pageType: 'dashboard',
  module: 'dashboard',
  path: '/',
  selectedItems: [],
  recentActions: [],
  enteredAt: new Date(),
  lastInteractionAt: new Date(),
};

// ============================================================================
// MODULE METADATA
// ============================================================================

/**
 * Metadata about each module for context enrichment
 */
export const MODULE_METADATA: Record<AppModule, {
  displayName: string;
  description: string;
  capabilities: string[];
  commonIntents: string[];
}> = {
  dashboard: {
    displayName: 'Dashboard',
    description: 'Main overview of workspace activity, metrics, and roadmap',
    capabilities: ['view metrics', 'check roadmap', 'see recent activity', 'get started suggestions'],
    commonIntents: ['check status', 'what should I do', 'overview', 'get started'],
  },
  creator: {
    displayName: 'Creator Studio',
    description: 'Create documents, images, presentations, social posts, and marketing content',
    capabilities: ['create documents', 'generate images', 'build presentations', 'write blog posts', 'design social content', 'use templates'],
    commonIntents: ['create content', 'write copy', 'design something', 'what should I create', 'trending content', 'content ideas'],
  },
  crm: {
    displayName: 'CRM',
    description: 'Manage leads, contacts, organizations, and sales pipeline',
    capabilities: ['add leads', 'manage contacts', 'track pipeline', 'update stages', 'view deal values'],
    commonIntents: ['add lead', 'find contact', 'pipeline status', 'hot leads', 'follow up'],
  },
  marketing: {
    displayName: 'Marketing',
    description: 'Create and manage marketing campaigns across channels',
    capabilities: ['create campaigns', 'email marketing', 'track performance', 'A/B testing', 'audience targeting'],
    commonIntents: ['create campaign', 'email performance', 'best performing', 'improve open rates'],
  },
  finance: {
    displayName: 'Finance HQ',
    description: 'Financial overview, invoices, transactions, and cash flow',
    capabilities: ['view revenue', 'manage invoices', 'track expenses', 'cash flow forecast', 'send reminders'],
    commonIntents: ['revenue status', 'overdue invoices', 'cash flow', 'financial health'],
  },
  agents: {
    displayName: 'AI Agents',
    description: 'Create and manage AI automation agents',
    capabilities: ['create agents', 'run agents', 'view executions', 'configure triggers'],
    commonIntents: ['create agent', 'automate task', 'agent status', 'execution history'],
  },
  library: {
    displayName: 'Knowledge Library',
    description: 'Document storage, organization, and AI-powered search',
    capabilities: ['upload documents', 'search knowledge', 'organize collections', 'find information'],
    commonIntents: ['find document', 'upload file', 'search for', 'organize content'],
  },
  conversations: {
    displayName: 'Conversations',
    description: 'Customer conversations and communication history',
    capabilities: ['view conversations', 'send messages', 'track threads', 'assign conversations'],
    commonIntents: ['recent messages', 'unread conversations', 'reply to', 'conversation history'],
  },
  calendar: {
    displayName: 'Calendar',
    description: 'Schedule management and meeting coordination',
    capabilities: ['schedule meetings', 'view calendar', 'check availability', 'send invites'],
    commonIntents: ['schedule meeting', 'what\'s today', 'free time', 'upcoming events'],
  },
  orchestration: {
    displayName: 'Agent Orchestration',
    description: 'Coordinate teams of agents and multi-agent workflows',
    capabilities: ['create teams', 'run workflows', 'coordinate agents', 'monitor executions'],
    commonIntents: ['create team', 'run team', 'workflow status', 'coordinate agents'],
  },
  'neptune-hq': {
    displayName: 'Neptune HQ',
    description: 'Neptune AI performance, analytics, and configuration',
    capabilities: ['view analytics', 'track usage', 'configure Neptune', 'quality metrics'],
    commonIntents: ['Neptune stats', 'conversation analytics', 'AI performance'],
  },
  settings: {
    displayName: 'Settings',
    description: 'Workspace and user settings configuration',
    capabilities: ['manage settings', 'configure integrations', 'user preferences', 'workspace config'],
    commonIntents: ['change setting', 'connect integration', 'update preferences'],
  },
  'lunar-labs': {
    displayName: 'Lunar Labs',
    description: 'Experimental features and beta functionality',
    capabilities: ['try experiments', 'beta features', 'provide feedback'],
    commonIntents: ['try feature', 'what\'s new', 'experiment'],
  },
  launchpad: {
    displayName: 'Launchpad',
    description: 'Quick access to common actions and navigation',
    capabilities: ['quick actions', 'navigate', 'search'],
    commonIntents: ['go to', 'quick action', 'find'],
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract module from pathname
 */
export function getModuleFromPath(pathname: string): AppModule {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0]?.toLowerCase() || 'dashboard';
  
  const moduleMap: Record<string, AppModule> = {
    'dashboard': 'dashboard',
    '': 'dashboard',
    'creator': 'creator',
    'crm': 'crm',
    'leads': 'crm',
    'contacts': 'crm',
    'organizations': 'crm',
    'pipeline': 'crm',
    'marketing': 'marketing',
    'campaigns': 'marketing',
    'finance': 'finance',
    'finance-hq': 'finance',
    'agents': 'agents',
    'my-agents': 'agents',
    'library': 'library',
    'knowledge': 'library',
    'conversations': 'conversations',
    'calendar': 'calendar',
    'orchestration': 'orchestration',
    'neptune-hq': 'neptune-hq',
    'settings': 'settings',
    'lunar-labs': 'lunar-labs',
    'launchpad': 'launchpad',
  };
  
  return moduleMap[firstSegment] || 'dashboard';
}

/**
 * Determine page type from pathname and context
 */
export function getPageTypeFromPath(pathname: string): PageType {
  const segments = pathname.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1]?.toLowerCase();
  
  if (pathname === '/' || pathname === '/dashboard') return 'dashboard';
  if (lastSegment === 'new' || lastSegment === 'create') return 'create';
  if (lastSegment === 'edit') return 'edit';
  if (lastSegment === 'settings') return 'settings';
  if (pathname.includes('-hq')) return 'hq';
  
  // Check for UUID pattern (viewing specific item)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (lastSegment && uuidPattern.test(lastSegment)) return 'view';
  
  // Default to list for module root pages
  return 'list';
}

/**
 * Get human-readable page name from pathname
 */
export function getPageNameFromPath(pathname: string): string {
  const module = getModuleFromPath(pathname);
  const pageType = getPageTypeFromPath(pathname);
  const metadata = MODULE_METADATA[module];
  
  const segments = pathname.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  
  // Check for specific sub-pages
  if (lastSegment === 'new' || lastSegment === 'create') {
    return `Create ${metadata.displayName}`;
  }
  
  if (lastSegment === 'edit') {
    return `Edit ${metadata.displayName}`;
  }
  
  if (pageType === 'view') {
    return `${metadata.displayName} Details`;
  }
  
  return metadata.displayName;
}

/**
 * Create initial page context from pathname
 */
export function createPageContextFromPath(pathname: string): PageContextData {
  const now = new Date();
  
  return {
    pageName: getPageNameFromPath(pathname),
    pageType: getPageTypeFromPath(pathname),
    module: getModuleFromPath(pathname),
    path: pathname,
    selectedItems: [],
    recentActions: [],
    enteredAt: now,
    lastInteractionAt: now,
  };
}

/**
 * Merge partial context updates
 */
export function mergePageContext(
  current: PageContextData,
  updates: Partial<PageContextData>
): PageContextData {
  return {
    ...current,
    ...updates,
    lastInteractionAt: new Date(),
    // Merge arrays instead of replacing
    selectedItems: updates.selectedItems ?? current.selectedItems,
    recentActions: updates.recentActions 
      ? [...updates.recentActions, ...current.recentActions].slice(0, 10)
      : current.recentActions,
  };
}

/**
 * Add an action to the recent actions list
 */
export function addRecentAction(
  context: PageContextData,
  action: string,
  target?: string,
  metadata?: Record<string, unknown>
): PageContextData {
  const newAction: UserAction = {
    action,
    target,
    timestamp: new Date(),
    metadata,
  };
  
  return {
    ...context,
    recentActions: [newAction, ...context.recentActions].slice(0, 10),
    lastInteractionAt: new Date(),
  };
}

/**
 * Update selected items
 */
export function updateSelectedItems(
  context: PageContextData,
  items: SelectedItem[]
): PageContextData {
  return {
    ...context,
    selectedItems: items,
    lastInteractionAt: new Date(),
  };
}

/**
 * Set focused item
 */
export function setFocusedItem(
  context: PageContextData,
  item: SelectedItem | undefined
): PageContextData {
  return {
    ...context,
    focusedItem: item,
    lastInteractionAt: new Date(),
  };
}

/**
 * Build a concise context summary for the AI
 */
export function buildContextSummary(context: PageContextData): string {
  const metadata = MODULE_METADATA[context.module];
  const parts: string[] = [];
  
  // Core location
  parts.push(`User is on: ${context.pageName} (${metadata.displayName})`);
  parts.push(`Page type: ${context.pageType}`);
  
  if (context.activeTab) {
    parts.push(`Active tab: ${context.activeTab}`);
  }
  
  if (context.viewMode) {
    parts.push(`View mode: ${context.viewMode}`);
  }
  
  // Selection state
  if (context.selectedItems.length > 0) {
    const itemTypes = [...new Set(context.selectedItems.map(i => i.type))];
    parts.push(`Selected: ${context.selectedItems.length} ${itemTypes.join('/')}(s)`);
    
    // Include names for small selections
    if (context.selectedItems.length <= 3) {
      const names = context.selectedItems.map(i => i.name).join(', ');
      parts.push(`Selected items: ${names}`);
    }
  }
  
  if (context.focusedItem) {
    parts.push(`Focused on: ${context.focusedItem.name} (${context.focusedItem.type})`);
  }
  
  // Wizard state
  if (context.wizardState) {
    parts.push(`Wizard: Step ${context.wizardState.currentStep}/${context.wizardState.totalSteps} - ${context.wizardState.stepName}`);
  }
  
  // Filter state
  if (context.filterState?.query) {
    parts.push(`Searching for: "${context.filterState.query}"`);
  }
  
  // Recent actions
  if (context.recentActions.length > 0) {
    const lastAction = context.recentActions[0];
    parts.push(`Last action: ${lastAction.action}${lastAction.target ? ` on ${lastAction.target}` : ''}`);
  }
  
  // Module capabilities
  parts.push(`Available on this page: ${metadata.capabilities.join(', ')}`);
  
  return parts.join('\n');
}

/**
 * Serialize context for API transmission (lightweight)
 */
export function serializePageContext(context: PageContextData): Record<string, unknown> {
  return {
    pageName: context.pageName,
    pageType: context.pageType,
    module: context.module,
    path: context.path,
    activeTab: context.activeTab,
    viewMode: context.viewMode,
    selectedCount: context.selectedItems.length,
    selectedItems: context.selectedItems.slice(0, 5).map(item => ({
      id: item.id,
      type: item.type,
      name: item.name,
    })),
    focusedItem: context.focusedItem ? {
      id: context.focusedItem.id,
      type: context.focusedItem.type,
      name: context.focusedItem.name,
    } : undefined,
    wizardState: context.wizardState ? {
      step: context.wizardState.currentStep,
      total: context.wizardState.totalSteps,
      name: context.wizardState.stepName,
    } : undefined,
    searchQuery: context.filterState?.query,
    recentAction: context.recentActions[0]?.action,
    customData: context.customData,
  };
}
