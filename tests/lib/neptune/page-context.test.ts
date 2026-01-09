/**
 * Tests for Neptune Page Context System
 * 
 * Tests page context creation, path parsing, module detection,
 * context merging, action tracking, and context summarization.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_PAGE_CONTEXT,
  MODULE_METADATA,
  getModuleFromPath,
  getPageTypeFromPath,
  getPageNameFromPath,
  createPageContextFromPath,
  mergePageContext,
  addRecentAction,
  updateSelectedItems,
  setFocusedItem,
  buildContextSummary,
  serializePageContext,
  type PageContextData,
  type SelectedItem,
  type AppModule,
} from '@/lib/neptune/page-context';

// ============================================================================
// DEFAULT VALUES TESTS
// ============================================================================

describe('DEFAULT_PAGE_CONTEXT', () => {
  it('should have correct dashboard defaults', () => {
    expect(DEFAULT_PAGE_CONTEXT.pageName).toBe('dashboard');
    expect(DEFAULT_PAGE_CONTEXT.pageType).toBe('dashboard');
    expect(DEFAULT_PAGE_CONTEXT.module).toBe('dashboard');
    expect(DEFAULT_PAGE_CONTEXT.path).toBe('/');
    expect(DEFAULT_PAGE_CONTEXT.selectedItems).toEqual([]);
    expect(DEFAULT_PAGE_CONTEXT.recentActions).toEqual([]);
  });

  it('should have timestamp fields', () => {
    expect(DEFAULT_PAGE_CONTEXT.enteredAt).toBeInstanceOf(Date);
    expect(DEFAULT_PAGE_CONTEXT.lastInteractionAt).toBeInstanceOf(Date);
  });
});

// ============================================================================
// MODULE METADATA TESTS
// ============================================================================

describe('MODULE_METADATA', () => {
  it('should include all required modules', () => {
    const requiredModules: AppModule[] = [
      'dashboard',
      'creator',
      'crm',
      'marketing',
      'finance',
      'agents',
      'library',
      'conversations',
      'calendar',
      'orchestration',
      'neptune-hq',
      'settings',
      'lunar-labs',
      'launchpad',
    ];

    requiredModules.forEach(module => {
      expect(MODULE_METADATA[module]).toBeDefined();
      expect(MODULE_METADATA[module].displayName).toBeTruthy();
      expect(MODULE_METADATA[module].description).toBeTruthy();
      expect(Array.isArray(MODULE_METADATA[module].capabilities)).toBe(true);
      expect(Array.isArray(MODULE_METADATA[module].commonIntents)).toBe(true);
    });
  });

  it('should have non-empty capabilities for all modules', () => {
    Object.values(MODULE_METADATA).forEach(metadata => {
      expect(metadata.capabilities.length).toBeGreaterThan(0);
    });
  });

  it('should have non-empty common intents for all modules', () => {
    Object.values(MODULE_METADATA).forEach(metadata => {
      expect(metadata.commonIntents.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// PATH PARSING TESTS
// ============================================================================

describe('getModuleFromPath', () => {
  it('should return dashboard for root path', () => {
    expect(getModuleFromPath('/')).toBe('dashboard');
  });

  it('should return dashboard for /dashboard path', () => {
    expect(getModuleFromPath('/dashboard')).toBe('dashboard');
  });

  it('should return correct module for direct module paths', () => {
    expect(getModuleFromPath('/creator')).toBe('creator');
    expect(getModuleFromPath('/crm')).toBe('crm');
    expect(getModuleFromPath('/marketing')).toBe('marketing');
    expect(getModuleFromPath('/finance')).toBe('finance');
    expect(getModuleFromPath('/agents')).toBe('agents');
    expect(getModuleFromPath('/library')).toBe('library');
  });

  it('should handle path aliases', () => {
    expect(getModuleFromPath('/leads')).toBe('crm');
    expect(getModuleFromPath('/contacts')).toBe('crm');
    expect(getModuleFromPath('/organizations')).toBe('crm');
    expect(getModuleFromPath('/pipeline')).toBe('crm');
    expect(getModuleFromPath('/campaigns')).toBe('marketing');
    expect(getModuleFromPath('/knowledge')).toBe('library');
    expect(getModuleFromPath('/my-agents')).toBe('agents');
  });

  it('should be case insensitive', () => {
    expect(getModuleFromPath('/CREATOR')).toBe('creator');
    expect(getModuleFromPath('/CRM')).toBe('crm');
  });

  it('should return dashboard for unknown paths', () => {
    expect(getModuleFromPath('/unknown')).toBe('dashboard');
    expect(getModuleFromPath('/fake-module')).toBe('dashboard');
  });

  it('should handle nested paths correctly', () => {
    expect(getModuleFromPath('/crm/leads/123')).toBe('crm');
    expect(getModuleFromPath('/marketing/campaigns/new')).toBe('marketing');
  });
});

describe('getPageTypeFromPath', () => {
  it('should return dashboard for root and /dashboard', () => {
    expect(getPageTypeFromPath('/')).toBe('dashboard');
    expect(getPageTypeFromPath('/dashboard')).toBe('dashboard');
  });

  it('should detect create pages', () => {
    expect(getPageTypeFromPath('/crm/leads/new')).toBe('create');
    expect(getPageTypeFromPath('/marketing/create')).toBe('create');
  });

  it('should detect edit pages', () => {
    expect(getPageTypeFromPath('/crm/leads/123/edit')).toBe('edit');
  });

  it('should detect settings pages', () => {
    expect(getPageTypeFromPath('/settings')).toBe('settings');
    expect(getPageTypeFromPath('/workspace/settings')).toBe('settings');
  });

  it('should detect HQ pages', () => {
    expect(getPageTypeFromPath('/finance-hq')).toBe('hq');
    expect(getPageTypeFromPath('/neptune-hq')).toBe('hq');
  });

  it('should detect view pages by UUID', () => {
    const uuidPath = '/crm/leads/123e4567-e89b-12d3-a456-426614174000';
    expect(getPageTypeFromPath(uuidPath)).toBe('view');
  });

  it('should default to list for module root pages', () => {
    expect(getPageTypeFromPath('/crm')).toBe('list');
    expect(getPageTypeFromPath('/marketing')).toBe('list');
    expect(getPageTypeFromPath('/agents')).toBe('list');
  });
});

describe('getPageNameFromPath', () => {
  it('should return module display name for root paths', () => {
    expect(getPageNameFromPath('/crm')).toBe('CRM');
    expect(getPageNameFromPath('/marketing')).toBe('Marketing');
    expect(getPageNameFromPath('/dashboard')).toBe('Dashboard');
  });

  it('should prepend "Create" for create pages', () => {
    expect(getPageNameFromPath('/crm/new')).toBe('Create CRM');
    expect(getPageNameFromPath('/marketing/create')).toBe('Create Marketing');
  });

  it('should prepend "Edit" for edit pages', () => {
    expect(getPageNameFromPath('/crm/123/edit')).toBe('Edit CRM');
  });

  it('should append "Details" for view pages', () => {
    expect(getPageNameFromPath('/crm/123e4567-e89b-12d3-a456-426614174000')).toBe('CRM Details');
  });
});

// ============================================================================
// CONTEXT CREATION TESTS
// ============================================================================

describe('createPageContextFromPath', () => {
  it('should create valid context from dashboard path', () => {
    const context = createPageContextFromPath('/dashboard');

    expect(context.pageName).toBe('Dashboard');
    expect(context.pageType).toBe('dashboard');
    expect(context.module).toBe('dashboard');
    expect(context.path).toBe('/dashboard');
    expect(context.selectedItems).toEqual([]);
    expect(context.recentActions).toEqual([]);
    expect(context.enteredAt).toBeInstanceOf(Date);
    expect(context.lastInteractionAt).toBeInstanceOf(Date);
  });

  it('should create valid context from CRM path', () => {
    const context = createPageContextFromPath('/crm/leads');

    expect(context.module).toBe('crm');
    expect(context.pageType).toBe('list');
    expect(context.path).toBe('/crm/leads');
  });

  it('should handle create paths', () => {
    const context = createPageContextFromPath('/marketing/campaigns/new');

    expect(context.module).toBe('marketing');
    expect(context.pageType).toBe('create');
    expect(context.pageName).toBe('Create Marketing');
  });

  it('should set timestamps', () => {
    const before = new Date();
    const context = createPageContextFromPath('/crm');
    const after = new Date();

    expect(context.enteredAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(context.enteredAt.getTime()).toBeLessThanOrEqual(after.getTime());
    expect(context.lastInteractionAt).toEqual(context.enteredAt);
  });
});

// ============================================================================
// CONTEXT MERGING TESTS
// ============================================================================

describe('mergePageContext', () => {
  let baseContext: PageContextData;

  beforeEach(() => {
    baseContext = createPageContextFromPath('/dashboard');
  });

  it('should merge basic properties', () => {
    const merged = mergePageContext(baseContext, {
      activeTab: 'analytics',
      viewMode: 'grid',
    });

    expect(merged.activeTab).toBe('analytics');
    expect(merged.viewMode).toBe('grid');
    expect(merged.module).toBe(baseContext.module);
  });

  it('should update lastInteractionAt', () => {
    const original = baseContext.lastInteractionAt;
    
    // Wait a bit to ensure timestamp changes
    const merged = mergePageContext(baseContext, { activeTab: 'test' });

    expect(merged.lastInteractionAt.getTime()).toBeGreaterThanOrEqual(original.getTime());
  });

  it('should replace selectedItems when provided', () => {
    const items: SelectedItem[] = [
      { id: '1', type: 'lead', name: 'Test Lead' },
    ];

    const merged = mergePageContext(baseContext, { selectedItems: items });

    expect(merged.selectedItems).toEqual(items);
  });

  it('should prepend new recent actions', () => {
    const existingAction = {
      action: 'existing',
      timestamp: new Date(),
    };
    const contextWithActions = {
      ...baseContext,
      recentActions: [existingAction],
    };

    const newActions = [
      { action: 'new1', timestamp: new Date() },
      { action: 'new2', timestamp: new Date() },
    ];

    const merged = mergePageContext(contextWithActions, {
      recentActions: newActions,
    });

    expect(merged.recentActions[0].action).toBe('new1');
    expect(merged.recentActions[1].action).toBe('new2');
    expect(merged.recentActions[2].action).toBe('existing');
  });

  it('should limit recent actions to 10', () => {
    const manyActions = Array.from({ length: 15 }, (_, i) => ({
      action: `action-${i}`,
      timestamp: new Date(),
    }));

    const merged = mergePageContext(baseContext, {
      recentActions: manyActions,
    });

    expect(merged.recentActions.length).toBe(10);
  });

  it('should preserve enteredAt timestamp', () => {
    const original = baseContext.enteredAt;
    const merged = mergePageContext(baseContext, { activeTab: 'test' });

    expect(merged.enteredAt).toEqual(original);
  });
});

// ============================================================================
// ACTION TRACKING TESTS
// ============================================================================

describe('addRecentAction', () => {
  let context: PageContextData;

  beforeEach(() => {
    context = createPageContextFromPath('/dashboard');
  });

  it('should add action to recent actions', () => {
    const updated = addRecentAction(context, 'view-lead', 'Lead-123');

    expect(updated.recentActions).toHaveLength(1);
    expect(updated.recentActions[0].action).toBe('view-lead');
    expect(updated.recentActions[0].target).toBe('Lead-123');
    expect(updated.recentActions[0].timestamp).toBeInstanceOf(Date);
  });

  it('should add action to beginning of list', () => {
    let updated = addRecentAction(context, 'action1');
    updated = addRecentAction(updated, 'action2');
    updated = addRecentAction(updated, 'action3');

    expect(updated.recentActions[0].action).toBe('action3');
    expect(updated.recentActions[1].action).toBe('action2');
    expect(updated.recentActions[2].action).toBe('action1');
  });

  it('should limit to 10 actions', () => {
    let updated = context;
    for (let i = 0; i < 15; i++) {
      updated = addRecentAction(updated, `action-${i}`);
    }

    expect(updated.recentActions).toHaveLength(10);
    expect(updated.recentActions[0].action).toBe('action-14'); // Most recent
    expect(updated.recentActions[9].action).toBe('action-5'); // 10th most recent
  });

  it('should accept optional metadata', () => {
    const metadata = { source: 'test', value: 42 };
    const updated = addRecentAction(context, 'test-action', 'target', metadata);

    expect(updated.recentActions[0].metadata).toEqual(metadata);
  });

  it('should update lastInteractionAt', () => {
    const original = context.lastInteractionAt;
    const updated = addRecentAction(context, 'test-action');

    expect(updated.lastInteractionAt.getTime()).toBeGreaterThanOrEqual(original.getTime());
  });
});

// ============================================================================
// SELECTION TESTS
// ============================================================================

describe('updateSelectedItems', () => {
  let context: PageContextData;

  beforeEach(() => {
    context = createPageContextFromPath('/crm');
  });

  it('should update selected items', () => {
    const items: SelectedItem[] = [
      { id: '1', type: 'lead', name: 'Lead 1' },
      { id: '2', type: 'lead', name: 'Lead 2' },
    ];

    const updated = updateSelectedItems(context, items);

    expect(updated.selectedItems).toEqual(items);
    expect(updated.selectedItems).toHaveLength(2);
  });

  it('should replace existing selection', () => {
    const initial: SelectedItem[] = [
      { id: '1', type: 'lead', name: 'Old Lead' },
    ];
    const contextWithSelection = { ...context, selectedItems: initial };

    const newItems: SelectedItem[] = [
      { id: '2', type: 'contact', name: 'New Contact' },
    ];

    const updated = updateSelectedItems(contextWithSelection, newItems);

    expect(updated.selectedItems).toEqual(newItems);
    expect(updated.selectedItems).not.toContainEqual(initial[0]);
  });

  it('should update lastInteractionAt', () => {
    const original = context.lastInteractionAt;
    const updated = updateSelectedItems(context, []);

    expect(updated.lastInteractionAt.getTime()).toBeGreaterThanOrEqual(original.getTime());
  });
});

describe('setFocusedItem', () => {
  let context: PageContextData;

  beforeEach(() => {
    context = createPageContextFromPath('/crm');
  });

  it('should set focused item', () => {
    const item: SelectedItem = {
      id: '123',
      type: 'lead',
      name: 'Important Lead',
    };

    const updated = setFocusedItem(context, item);

    expect(updated.focusedItem).toEqual(item);
  });

  it('should clear focused item with undefined', () => {
    const item: SelectedItem = {
      id: '123',
      type: 'lead',
      name: 'Lead',
    };
    const contextWithFocus = { ...context, focusedItem: item };

    const updated = setFocusedItem(contextWithFocus, undefined);

    expect(updated.focusedItem).toBeUndefined();
  });

  it('should update lastInteractionAt', () => {
    const original = context.lastInteractionAt;
    const updated = setFocusedItem(context, undefined);

    expect(updated.lastInteractionAt.getTime()).toBeGreaterThanOrEqual(original.getTime());
  });
});

// ============================================================================
// CONTEXT SUMMARY TESTS
// ============================================================================

describe('buildContextSummary', () => {
  it('should include basic page info', () => {
    const context = createPageContextFromPath('/dashboard');
    const summary = buildContextSummary(context);

    expect(summary).toContain('Dashboard');
    expect(summary).toContain('dashboard');
    expect(summary).toContain('Page type: dashboard');
  });

  it('should include active tab', () => {
    const context = {
      ...createPageContextFromPath('/creator'),
      activeTab: 'templates',
    };
    const summary = buildContextSummary(context);

    expect(summary).toContain('Active tab: templates');
  });

  it('should include view mode', () => {
    const context = {
      ...createPageContextFromPath('/crm'),
      viewMode: 'kanban' as const,
    };
    const summary = buildContextSummary(context);

    expect(summary).toContain('View mode: kanban');
  });

  it('should include selected items count and types', () => {
    const items: SelectedItem[] = [
      { id: '1', type: 'lead', name: 'Lead 1' },
      { id: '2', type: 'lead', name: 'Lead 2' },
    ];
    const context = {
      ...createPageContextFromPath('/crm'),
      selectedItems: items,
    };
    const summary = buildContextSummary(context);

    expect(summary).toContain('Selected: 2 lead(s)');
    expect(summary).toContain('Selected items: Lead 1, Lead 2');
  });

  it('should include focused item', () => {
    const item: SelectedItem = {
      id: '123',
      type: 'lead',
      name: 'Hot Lead',
    };
    const context = {
      ...createPageContextFromPath('/crm'),
      focusedItem: item,
    };
    const summary = buildContextSummary(context);

    expect(summary).toContain('Focused on: Hot Lead (lead)');
  });

  it('should include wizard state', () => {
    const context = {
      ...createPageContextFromPath('/creator'),
      wizardState: {
        currentStep: 2,
        totalSteps: 4,
        stepName: 'Design',
        completedSteps: ['Content'],
      },
    };
    const summary = buildContextSummary(context);

    expect(summary).toContain('Wizard: Step 2/4 - Design');
  });

  it('should include search query', () => {
    const context = {
      ...createPageContextFromPath('/library'),
      filterState: {
        query: 'solar panels',
        filters: {},
      },
    };
    const summary = buildContextSummary(context);

    expect(summary).toContain('Searching for: "solar panels"');
  });

  it('should include last action', () => {
    const context = addRecentAction(
      createPageContextFromPath('/crm'),
      'viewed',
      'Lead-123'
    );
    const summary = buildContextSummary(context);

    expect(summary).toContain('Last action: viewed on Lead-123');
  });

  it('should include module capabilities', () => {
    const context = createPageContextFromPath('/crm');
    const summary = buildContextSummary(context);

    expect(summary).toContain('Available on this page:');
    expect(summary).toContain('add leads');
    expect(summary).toContain('manage contacts');
  });
});

// ============================================================================
// SERIALIZATION TESTS
// ============================================================================

describe('serializePageContext', () => {
  it('should serialize basic context', () => {
    const context = createPageContextFromPath('/dashboard');
    const serialized = serializePageContext(context);

    expect(serialized.pageName).toBe('Dashboard');
    expect(serialized.pageType).toBe('dashboard');
    expect(serialized.module).toBe('dashboard');
    expect(serialized.path).toBe('/dashboard');
  });

  it('should include optional fields when present', () => {
    const context = {
      ...createPageContextFromPath('/crm'),
      activeTab: 'leads',
      viewMode: 'grid' as const,
    };
    const serialized = serializePageContext(context);

    expect(serialized.activeTab).toBe('leads');
    expect(serialized.viewMode).toBe('grid');
  });

  it('should limit selected items to 5', () => {
    const items: SelectedItem[] = Array.from({ length: 10 }, (_, i) => ({
      id: `${i}`,
      type: 'lead' as const,
      name: `Lead ${i}`,
    }));
    const context = {
      ...createPageContextFromPath('/crm'),
      selectedItems: items,
    };
    const serialized = serializePageContext(context);

    expect(serialized.selectedCount).toBe(10);
    expect((serialized.selectedItems as any[]).length).toBe(5);
  });

  it('should serialize focused item', () => {
    const item: SelectedItem = {
      id: '123',
      type: 'lead',
      name: 'Test Lead',
      metadata: { extra: 'data' },
    };
    const context = {
      ...createPageContextFromPath('/crm'),
      focusedItem: item,
    };
    const serialized = serializePageContext(context);

    expect(serialized.focusedItem).toEqual({
      id: '123',
      type: 'lead',
      name: 'Test Lead',
    });
    // Metadata should not be included
    expect((serialized.focusedItem as any)?.metadata).toBeUndefined();
  });

  it('should serialize wizard state', () => {
    const context = {
      ...createPageContextFromPath('/creator'),
      wizardState: {
        currentStep: 2,
        totalSteps: 4,
        stepName: 'Design',
        completedSteps: ['Content'],
        data: { key: 'value' },
      },
    };
    const serialized = serializePageContext(context);

    expect(serialized.wizardState).toEqual({
      step: 2,
      total: 4,
      name: 'Design',
    });
    // Full data should not be included
    expect((serialized.wizardState as any)?.data).toBeUndefined();
  });

  it('should include search query', () => {
    const context = {
      ...createPageContextFromPath('/library'),
      filterState: {
        query: 'test search',
        filters: {},
      },
    };
    const serialized = serializePageContext(context);

    expect(serialized.searchQuery).toBe('test search');
  });

  it('should include most recent action only', () => {
    let context = createPageContextFromPath('/crm');
    context = addRecentAction(context, 'action1');
    context = addRecentAction(context, 'action2');
    context = addRecentAction(context, 'action3');

    const serialized = serializePageContext(context);

    expect(serialized.recentAction).toBe('action3'); // Most recent
  });

  it('should include custom data', () => {
    const context = {
      ...createPageContextFromPath('/dashboard'),
      customData: { key1: 'value1', key2: 42 },
    };
    const serialized = serializePageContext(context);

    expect(serialized.customData).toEqual({ key1: 'value1', key2: 42 });
  });
});
