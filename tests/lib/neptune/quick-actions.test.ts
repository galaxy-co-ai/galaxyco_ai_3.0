/**
 * Tests for Neptune Quick Actions Engine
 * 
 * Tests intelligent action generation based on context, module-specific
 * action recommendations, personalization, and icon mapping.
 */

import { describe, it, expect } from 'vitest';
import {
  generateQuickActions,
  personalizeActions,
  getActionIcon,
  type QuickActionContext,
} from '@/lib/neptune/quick-actions';
import type { PageContextData, AppModule } from '@/lib/neptune/page-context';

// ============================================================================
// TEST HELPERS
// ============================================================================

function createMockPageContext(overrides: Partial<PageContextData> = {}): PageContextData {
  return {
    pageName: 'test-page',
    pageType: 'dashboard',
    module: 'dashboard',
    path: '/',
    selectedItems: [],
    recentActions: [],
    enteredAt: new Date(),
    lastInteractionAt: new Date(),
    ...overrides,
  };
}

function createMockContext(overrides: Partial<QuickActionContext> = {}): QuickActionContext {
  return {
    pageContext: createMockPageContext(),
    ...overrides,
  };
}

// ============================================================================
// DASHBOARD MODULE TESTS
// ============================================================================

describe('generateQuickActions - dashboard module', () => {
  it('should return new workspace onboarding actions for new workspaces', () => {
    const context = createMockContext({
      workspaceState: {
        totalLeads: 0,
        totalContacts: 0,
        totalAgents: 0,
        totalCampaigns: 0,
        totalDocuments: 0,
        hasOverdueItems: false,
        hasHotLeads: false,
        isNewWorkspace: true,
      },
    });

    const actions = generateQuickActions(context);

    // Returns 3 business onboarding actions, limited by slice(0, 4)
    expect(actions.length).toBeGreaterThan(0);
    expect(actions.length).toBeLessThanOrEqual(4);
    expect(actions[0].id).toBe('biz-solar');
    expect(actions[0].label).toBe('I run a solar company');
    expect(actions[0].priority).toBe(100);
    expect(actions[1].id).toBe('biz-roofing');
    expect(actions[2].id).toBe('biz-home-services');
  });

  it('should return priority-focused actions for existing workspaces', () => {
    const context = createMockContext({
      workspaceState: {
        totalLeads: 10,
        totalContacts: 20,
        totalAgents: 5,
        totalCampaigns: 3,
        totalDocuments: 50,
        hasOverdueItems: false,
        hasHotLeads: false,
        isNewWorkspace: false,
      },
    });

    const actions = generateQuickActions(context);

    expect(actions.length).toBeGreaterThan(0);
    expect(actions[0].id).toBe('dashboard-status');
    expect(actions[0].label).toBe('What should I focus on?');
  });

  it('should prioritize hot leads action when hot leads exist', () => {
    const context = createMockContext({
      workspaceState: {
        totalLeads: 10,
        totalContacts: 20,
        totalAgents: 5,
        totalCampaigns: 3,
        totalDocuments: 50,
        hasOverdueItems: false,
        hasHotLeads: true,
        isNewWorkspace: false,
      },
    });

    const actions = generateQuickActions(context);

    const hotLeadsAction = actions.find(a => a.id === 'hot-leads');
    expect(hotLeadsAction).toBeDefined();
    expect(hotLeadsAction!.priority).toBe(85);
    expect(hotLeadsAction!.reason).toBe('Hot leads in pipeline');
  });

  it('should show overdue items action when overdue items exist', () => {
    const context = createMockContext({
      workspaceState: {
        totalLeads: 10,
        totalContacts: 20,
        totalAgents: 5,
        totalCampaigns: 3,
        totalDocuments: 50,
        hasOverdueItems: true,
        hasHotLeads: false,
        isNewWorkspace: false,
      },
    });

    const actions = generateQuickActions(context);

    const overdueAction = actions.find(a => a.id === 'overdue-items');
    expect(overdueAction).toBeDefined();
    expect(overdueAction!.label).toBe('Check overdue items');
    expect(overdueAction!.priority).toBe(88);
  });

  it('should sort actions by priority and limit to 4', () => {
    const context = createMockContext({
      workspaceState: {
        totalLeads: 10,
        totalContacts: 20,
        totalAgents: 5,
        totalCampaigns: 3,
        totalDocuments: 50,
        hasOverdueItems: true,
        hasHotLeads: true,
        isNewWorkspace: false,
      },
    });

    const actions = generateQuickActions(context);

    expect(actions).toHaveLength(4);
    expect(actions[0].priority).toBeGreaterThanOrEqual(actions[1].priority);
    expect(actions[1].priority).toBeGreaterThanOrEqual(actions[2].priority);
    expect(actions[2].priority).toBeGreaterThanOrEqual(actions[3].priority);
  });
});

// ============================================================================
// CREATOR MODULE TESTS
// ============================================================================

describe('generateQuickActions - creator module', () => {
  it('should return create-focused actions for create tab', () => {
    const context = createMockContext({
      pageContext: createMockPageContext({
        module: 'creator',
        activeTab: 'create',
      }),
    });

    const actions = generateQuickActions(context);

    expect(actions.length).toBeGreaterThan(0);
    expect(actions.some(a => a.id === 'content-ideas')).toBe(true);
    expect(actions.some(a => a.id === 'help-write')).toBe(true);
  });

  it('should return organization actions for collections tab', () => {
    const context = createMockContext({
      pageContext: createMockPageContext({
        module: 'creator',
        activeTab: 'collections',
      }),
    });

    const actions = generateQuickActions(context);

    expect(actions.some(a => a.id === 'organize-content')).toBe(true);
    expect(actions.some(a => a.id === 'suggest-collections')).toBe(true);
  });

  it('should return template actions for templates tab', () => {
    const context = createMockContext({
      pageContext: createMockPageContext({
        module: 'creator',
        activeTab: 'templates',
      }),
    });

    const actions = generateQuickActions(context);

    expect(actions.some(a => a.id === 'recommend-templates')).toBe(true);
    expect(actions.some(a => a.id === 'custom-template')).toBe(true);
  });

  it('should add wizard-specific action when in wizard mode', () => {
    const context = createMockContext({
      pageContext: createMockPageContext({
        module: 'creator',
        activeTab: 'create',
        wizardState: {
          currentStep: 2,
          totalSteps: 4,
          stepName: 'Design',
          completedSteps: ['Content'],
        },
      }),
    });

    const actions = generateQuickActions(context);

    expect(actions[0].id).toBe('wizard-help');
    expect(actions[0].label).toBe('Help with Design');
    expect(actions[0].priority).toBe(100);
    expect(actions[0].reason).toBe('Active wizard');
  });

  it('should limit creator actions to 4', () => {
    const context = createMockContext({
      pageContext: createMockPageContext({
        module: 'creator',
        activeTab: 'create',
      }),
    });

    const actions = generateQuickActions(context);

    expect(actions.length).toBeLessThanOrEqual(4);
  });
});

// ============================================================================
// CRM MODULE TESTS
// ============================================================================

describe('generateQuickActions - crm module', () => {
  it('should return focused actions for specific lead', () => {
    const context = createMockContext({
      pageContext: createMockPageContext({
        module: 'crm',
        focusedItem: {
          id: 'lead-123',
          type: 'lead',
          name: 'John Doe',
        },
      }),
    });

    const actions = generateQuickActions(context);

    expect(actions[0].id).toBe('lead-next-action');
    expect(actions[0].label).toBe('Next action for John Doe');
    expect(actions[0].priority).toBe(100);
    expect(actions.some(a => a.id === 'draft-followup')).toBe(true);
  });

  it('should return bulk actions for multiple selections', () => {
    const context = createMockContext({
      pageContext: createMockPageContext({
        module: 'crm',
        selectedItems: [
          { id: 'lead-1', type: 'lead', name: 'John' },
          { id: 'lead-2', type: 'lead', name: 'Jane' },
          { id: 'lead-3', type: 'lead', name: 'Bob' },
        ],
      }),
    });

    const actions = generateQuickActions(context);

    expect(actions[0].id).toBe('bulk-action');
    expect(actions[0].label).toBe('Actions for 3 selected');
    expect(actions[0].priority).toBe(100);
  });

  it('should return general CRM actions when no selection', () => {
    const context = createMockContext({
      pageContext: createMockPageContext({
        module: 'crm',
      }),
    });

    const actions = generateQuickActions(context);

    expect(actions.some(a => a.id === 'add-lead')).toBe(true);
    expect(actions.some(a => a.id === 'pipeline-status')).toBe(true);
    expect(actions.some(a => a.id === 'find-lead')).toBe(true);
  });

  it('should include hot leads action when hot leads exist', () => {
    const context = createMockContext({
      pageContext: createMockPageContext({
        module: 'crm',
      }),
      workspaceState: {
        totalLeads: 20,
        totalContacts: 30,
        totalAgents: 5,
        totalCampaigns: 3,
        totalDocuments: 50,
        hasOverdueItems: false,
        hasHotLeads: true,
        isNewWorkspace: false,
      },
    });

    const actions = generateQuickActions(context);

    const hotLeadsAction = actions.find(a => a.id === 'hot-leads');
    expect(hotLeadsAction).toBeDefined();
    expect(hotLeadsAction!.label).toBe('Hot leads');
  });
});

// ============================================================================
// MARKETING MODULE TESTS
// ============================================================================

describe('generateQuickActions - marketing module', () => {
  it('should return campaign-focused actions', () => {
    const context = createMockContext({
      pageContext: createMockPageContext({
        module: 'marketing',
      }),
    });

    const actions = generateQuickActions(context);

    expect(actions.some(a => a.id === 'create-campaign')).toBe(true);
    expect(actions.some(a => a.id === 'campaign-performance')).toBe(true);
    expect(actions.some(a => a.id === 'improve-emails')).toBe(true);
    expect(actions).toHaveLength(4);
  });
});

// ============================================================================
// FINANCE MODULE TESTS
// ============================================================================

describe('generateQuickActions - finance module', () => {
  it('should return finance-focused actions', () => {
    const context = createMockContext({
      pageContext: createMockPageContext({
        module: 'finance',
      }),
    });

    const actions = generateQuickActions(context);

    expect(actions.some(a => a.id === 'financial-summary')).toBe(true);
    expect(actions.some(a => a.id === 'overdue-invoices')).toBe(true);
    expect(actions.some(a => a.id === 'cash-flow')).toBe(true);
    expect(actions).toHaveLength(4);
  });
});

// ============================================================================
// AGENTS MODULE TESTS
// ============================================================================

describe('generateQuickActions - agents module', () => {
  it('should return agent-specific actions when focused on an agent', () => {
    const context = createMockContext({
      pageContext: createMockPageContext({
        module: 'agents',
        focusedItem: {
          id: 'agent-123',
          type: 'agent',
          name: 'Sales Agent',
        },
      }),
    });

    const actions = generateQuickActions(context);

    expect(actions[0].id).toBe('run-agent');
    expect(actions[0].label).toBe('Run Sales Agent');
    expect(actions.some(a => a.id === 'agent-history')).toBe(true);
  });

  it('should return general agent actions when no agent focused', () => {
    const context = createMockContext({
      pageContext: createMockPageContext({
        module: 'agents',
      }),
    });

    const actions = generateQuickActions(context);

    expect(actions.some(a => a.id === 'create-agent')).toBe(true);
    expect(actions.some(a => a.id === 'suggest-automation')).toBe(true);
    expect(actions.some(a => a.id === 'list-agents')).toBe(true);
  });
});

// ============================================================================
// LIBRARY MODULE TESTS
// ============================================================================

describe('generateQuickActions - library module', () => {
  it('should return search refinement when search query exists', () => {
    const context = createMockContext({
      pageContext: createMockPageContext({
        module: 'library',
        filterState: {
          query: 'solar panels',
          filters: {},
        },
      }),
    });

    const actions = generateQuickActions(context);

    expect(actions[0].id).toBe('search-more');
    expect(actions[0].label).toBe('Refine search');
    expect(actions[0].prompt).toContain('solar panels');
  });

  it('should return general library actions when no search', () => {
    const context = createMockContext({
      pageContext: createMockPageContext({
        module: 'library',
      }),
    });

    const actions = generateQuickActions(context);

    expect(actions.some(a => a.id === 'find-document')).toBe(true);
    expect(actions.some(a => a.id === 'upload-help')).toBe(true);
    expect(actions.some(a => a.id === 'ask-docs')).toBe(true);
  });
});

// ============================================================================
// OTHER MODULE TESTS
// ============================================================================

describe('generateQuickActions - other modules', () => {
  it('should return conversations actions', () => {
    const context = createMockContext({
      pageContext: createMockPageContext({
        module: 'conversations',
      }),
    });

    const actions = generateQuickActions(context);

    expect(actions.some(a => a.id === 'recent-conversations')).toBe(true);
    expect(actions.some(a => a.id === 'draft-reply')).toBe(true);
  });

  it('should return calendar actions', () => {
    const context = createMockContext({
      pageContext: createMockPageContext({
        module: 'calendar',
      }),
    });

    const actions = generateQuickActions(context);

    expect(actions.some(a => a.id === 'schedule-meeting')).toBe(true);
    expect(actions.some(a => a.id === 'today-events')).toBe(true);
  });

  it('should return orchestration actions', () => {
    const context = createMockContext({
      pageContext: createMockPageContext({
        module: 'orchestration',
      }),
    });

    const actions = generateQuickActions(context);

    expect(actions.some(a => a.id === 'create-team')).toBe(true);
    expect(actions.some(a => a.id === 'run-workflow')).toBe(true);
  });

  it('should return neptune-hq actions', () => {
    const context = createMockContext({
      pageContext: createMockPageContext({
        module: 'neptune-hq',
      }),
    });

    const actions = generateQuickActions(context);

    expect(actions.some(a => a.id === 'neptune-analytics')).toBe(true);
    expect(actions.some(a => a.id === 'conversation-history')).toBe(true);
  });

  it('should return settings actions', () => {
    const context = createMockContext({
      pageContext: createMockPageContext({
        module: 'settings',
      }),
    });

    const actions = generateQuickActions(context);

    expect(actions.some(a => a.id === 'connect-integration')).toBe(true);
  });

  it('should return lunar-labs actions', () => {
    const context = createMockContext({
      pageContext: createMockPageContext({
        module: 'lunar-labs',
      }),
    });

    const actions = generateQuickActions(context);

    expect(actions.some(a => a.id === 'try-experiment')).toBe(true);
  });

  it('should return launchpad actions', () => {
    const context = createMockContext({
      pageContext: createMockPageContext({
        module: 'launchpad',
      }),
    });

    const actions = generateQuickActions(context);

    expect(actions.some(a => a.id === 'quick-navigate')).toBe(true);
    expect(actions.some(a => a.id === 'quick-search')).toBe(true);
  });
});

// ============================================================================
// DEFAULT ACTIONS TESTS
// ============================================================================

describe('generateQuickActions - default actions', () => {
  it('should return default actions for unknown module', () => {
    const context = createMockContext({
      pageContext: createMockPageContext({
        module: 'unknown-module' as AppModule,
      }),
    });

    const actions = generateQuickActions(context);

    expect(actions).toHaveLength(2);
    expect(actions[0].id).toBe('help');
    expect(actions[0].label).toBe('Help me with...');
    expect(actions[1].id).toBe('navigate');
  });
});

// ============================================================================
// PERSONALIZATION TESTS
// ============================================================================

describe('personalizeActions', () => {
  it('should return unchanged actions when no user patterns', () => {
    const actions = [
      { id: '1', label: 'Action 1', prompt: 'Do action 1', priority: 90 },
      { id: '2', label: 'Action 2', prompt: 'Do action 2', priority: 80 },
    ];

    const personalized = personalizeActions(actions);

    expect(personalized).toEqual(actions);
  });

  it('should return unchanged actions when frequent actions list is empty', () => {
    const actions = [
      { id: '1', label: 'Action 1', prompt: 'Do action 1', priority: 90 },
      { id: '2', label: 'Action 2', prompt: 'Do action 2', priority: 80 },
    ];

    const personalized = personalizeActions(actions, {
      frequentActions: [],
      preferredTools: [],
      timeOfDay: 'morning',
    });

    expect(personalized).toEqual(actions);
  });

  it('should boost priority for frequent actions', () => {
    const actions = [
      { id: '1', label: 'Action 1', prompt: 'Create campaign', priority: 80 },
      { id: '2', label: 'Action 2', prompt: 'View dashboard', priority: 90 },
    ];

    const personalized = personalizeActions(actions, {
      frequentActions: ['campaign'],
      preferredTools: [],
      timeOfDay: 'afternoon',
    });

    // Campaign boosted from 80 to 90, now tied with dashboard
    expect(personalized[0].priority).toBe(90);
    expect(personalized[1].priority).toBe(90);
    expect(personalized.some(a => a.id === '1')).toBe(true);
    expect(personalized.some(a => a.id === '2')).toBe(true);
  });

  it('should re-sort actions after boosting priority', () => {
    const actions = [
      { id: '1', label: 'Action 1', prompt: 'View reports', priority: 70 },
      { id: '2', label: 'Action 2', prompt: 'Create campaign', priority: 80 },
      { id: '3', label: 'Action 3', prompt: 'Other task', priority: 90 },
    ];

    const personalized = personalizeActions(actions, {
      frequentActions: ['reports'],
      preferredTools: [],
      timeOfDay: 'evening',
    });

    // reports boosted from 70 to 80, tied with campaign
    expect(personalized[0].id).toBe('3'); // 90 priority
    // Order of 80s may vary, but both should be after 90
    expect(personalized[0].priority).toBeGreaterThan(personalized[1].priority);
  });

  it('should handle case-insensitive matching', () => {
    const actions = [
      { id: '1', label: 'Action 1', prompt: 'Create CAMPAIGN', priority: 80 },
    ];

    const personalized = personalizeActions(actions, {
      frequentActions: ['campaign'],
      preferredTools: [],
      timeOfDay: 'morning',
    });

    expect(personalized[0].priority).toBe(90); // Boosted
  });

  it('should boost multiple matching actions', () => {
    const actions = [
      { id: '1', label: 'Action 1', prompt: 'Create campaign', priority: 70 },
      { id: '2', label: 'Action 2', prompt: 'View campaign', priority: 75 },
      { id: '3', label: 'Action 3', prompt: 'Other task', priority: 80 },
    ];

    const personalized = personalizeActions(actions, {
      frequentActions: ['campaign'],
      preferredTools: [],
      timeOfDay: 'afternoon',
    });

    expect(personalized[0].priority).toBe(85); // View campaign boosted
    expect(personalized[1].priority).toBe(80); // Create campaign boosted
    expect(personalized[2].priority).toBe(80); // Other task unchanged
  });
});

// ============================================================================
// ICON MAPPING TESTS
// ============================================================================

describe('getActionIcon', () => {
  it('should return action icon when provided', () => {
    const action = {
      id: 'test',
      label: 'Test',
      prompt: 'Test prompt',
      icon: 'Zap',
      priority: 90,
    };

    const icon = getActionIcon(action);

    expect(icon).toBe('Zap');
  });

  it('should return default Lightbulb icon when no icon provided', () => {
    const action = {
      id: 'test',
      label: 'Test',
      prompt: 'Test prompt',
      priority: 90,
    };

    const icon = getActionIcon(action);

    expect(icon).toBe('Lightbulb');
  });

  it('should handle empty string icon', () => {
    const action = {
      id: 'test',
      label: 'Test',
      prompt: 'Test prompt',
      icon: '',
      priority: 90,
    };

    const icon = getActionIcon(action);

    expect(icon).toBe('Lightbulb');
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('generateQuickActions - integration tests', () => {
  it('should generate contextual actions across different modules', () => {
    const modules: AppModule[] = [
      'dashboard',
      'creator',
      'crm',
      'marketing',
      'finance',
      'agents',
      'library',
    ];

    modules.forEach(module => {
      const context = createMockContext({
        pageContext: createMockPageContext({ module }),
      });

      const actions = generateQuickActions(context);

      expect(actions.length).toBeGreaterThan(0);
      expect(actions.length).toBeLessThanOrEqual(4);
      actions.forEach(action => {
        expect(action).toHaveProperty('id');
        expect(action).toHaveProperty('label');
        expect(action).toHaveProperty('prompt');
        expect(action).toHaveProperty('priority');
        expect(typeof action.priority).toBe('number');
      });
    });
  });

  it('should handle complex workspace state scenarios', () => {
    const context = createMockContext({
      pageContext: createMockPageContext({
        module: 'dashboard',
      }),
      workspaceState: {
        totalLeads: 100,
        totalContacts: 200,
        totalAgents: 10,
        totalCampaigns: 5,
        totalDocuments: 500,
        hasOverdueItems: true,
        hasHotLeads: true,
        isNewWorkspace: false,
      },
    });

    const actions = generateQuickActions(context);

    expect(actions).toHaveLength(4);
    expect(actions.every(a => a.priority > 0)).toBe(true);
  });

  it('should maintain action structure integrity', () => {
    const context = createMockContext();

    const actions = generateQuickActions(context);

    actions.forEach(action => {
      expect(typeof action.id).toBe('string');
      expect(typeof action.label).toBe('string');
      expect(typeof action.prompt).toBe('string');
      expect(typeof action.priority).toBe('number');
      expect(action.id.length).toBeGreaterThan(0);
      expect(action.label.length).toBeGreaterThan(0);
      expect(action.prompt.length).toBeGreaterThan(0);
    });
  });
});
