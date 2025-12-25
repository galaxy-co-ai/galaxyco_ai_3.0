/**
 * usePageContext Hook
 * 
 * A convenience hook for pages to report their context to Neptune.
 * Provides automatic context setup, cleanup, and common actions.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useNeptune } from '@/contexts/neptune-context';
import type { 
  PageContextData, 
  SelectedItem, 
  WizardState, 
  FilterState 
} from '@/lib/neptune/page-context';
import { 
  type AppModule, 
  type PageType,
} from '@/lib/neptune/page-context';

// ============================================================================
// TYPES
// ============================================================================

export interface UsePageContextOptions {
  /** The module this page belongs to */
  module: AppModule;
  
  /** The type of page */
  pageType: PageType;
  
  /** Human-readable page name */
  pageName: string;
  
  /** Current pathname (optional - auto-detected if not provided) */
  path?: string;
  
  /** Active tab on the page */
  activeTab?: string;
  
  /** View mode (grid, list, etc.) */
  viewMode?: 'grid' | 'list' | 'kanban' | 'calendar' | 'chart';
  
  /** Custom data specific to this page */
  customData?: Record<string, unknown>;
  
  /** Debounce time for updates (ms) */
  debounceMs?: number;
}

export interface UsePageContextReturn {
  /** Current page context */
  pageContext: PageContextData;
  
  /** Update the active tab */
  setActiveTab: (tab: string) => void;
  
  /** Update view mode */
  setViewMode: (mode: 'grid' | 'list' | 'kanban' | 'calendar' | 'chart') => void;
  
  /** Set selected items */
  setSelectedItems: (items: SelectedItem[]) => void;
  
  /** Set focused item */
  setFocusedItem: (item: SelectedItem | undefined) => void;
  
  /** Add a single selection */
  addSelection: (item: SelectedItem) => void;
  
  /** Remove a single selection */
  removeSelection: (itemId: string) => void;
  
  /** Clear all selections */
  clearSelections: () => void;
  
  /** Set wizard state */
  setWizardState: (state: WizardState | undefined) => void;
  
  /** Update wizard step */
  setWizardStep: (step: number, stepName: string) => void;
  
  /** Set filter/search state */
  setFilterState: (state: FilterState | undefined) => void;
  
  /** Update search query */
  setSearchQuery: (query: string) => void;
  
  /** Track a user action */
  trackAction: (action: string, target?: string, metadata?: Record<string, unknown>) => void;
  
  /** Set custom page data */
  setCustomData: (data: Record<string, unknown>) => void;
  
  /** Merge custom page data */
  mergeCustomData: (data: Record<string, unknown>) => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Hook for pages to report and manage their context to Neptune
 * 
 * @example
 * ```tsx
 * function CreatorPage() {
 *   const { setActiveTab, trackAction, setWizardStep } = usePageContext({
 *     module: 'creator',
 *     pageType: 'create',
 *     pageName: 'Creator Studio',
 *   });
 * 
 *   // When user changes tabs
 *   const handleTabChange = (tab: string) => {
 *     setActiveTab(tab);
 *     trackAction('changed_tab', tab);
 *   };
 * 
 *   // ...
 * }
 * ```
 */
export function usePageContext(options: UsePageContextOptions): UsePageContextReturn {
  const {
    module,
    pageType,
    pageName,
    path,
    activeTab,
    viewMode,
    customData,
    debounceMs = 100,
  } = options;

  const {
    pageContext,
    setPageContext,
    updatePageContext,
    setSelectedItems: setNeptuneSelectedItems,
    setFocusedItem: setNeptuneFocusedItem,
    setWizardState: setNeptuneWizardState,
    setFilterState: setNeptuneFilterState,
    trackAction: neptuneTrackAction,
    setCustomData: setNeptuneCustomData,
  } = useNeptune();

  // Refs for debouncing
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Partial<PageContextData>>({});

  // Debounced update function
  const debouncedUpdate = useCallback((updates: Partial<PageContextData>) => {
    // Merge pending updates
    pendingUpdatesRef.current = {
      ...pendingUpdatesRef.current,
      ...updates,
    };

    // Clear existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Set new timeout
    updateTimeoutRef.current = setTimeout(() => {
      if (Object.keys(pendingUpdatesRef.current).length > 0) {
        updatePageContext(pendingUpdatesRef.current);
        pendingUpdatesRef.current = {};
      }
    }, debounceMs);
  }, [updatePageContext, debounceMs]);

  // Initialize page context on mount
  useEffect(() => {
    const initialContext: Partial<PageContextData> = {
      module,
      pageType,
      pageName,
      path: path || (typeof window !== 'undefined' ? window.location.pathname : '/'),
      activeTab,
      viewMode,
      customData,
      enteredAt: new Date(),
      lastInteractionAt: new Date(),
    };

    setPageContext(initialContext);

    // Cleanup on unmount
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [module, pageType, pageName]); // Only re-run if core identity changes

  // Update activeTab when it changes
  useEffect(() => {
    if (activeTab !== undefined) {
      debouncedUpdate({ activeTab });
    }
  }, [activeTab, debouncedUpdate]);

  // Update viewMode when it changes
  useEffect(() => {
    if (viewMode !== undefined) {
      debouncedUpdate({ viewMode });
    }
  }, [viewMode, debouncedUpdate]);

  // ============================================================================
  // RETURN METHODS
  // ============================================================================

  const setActiveTab = useCallback((tab: string) => {
    debouncedUpdate({ activeTab: tab });
  }, [debouncedUpdate]);

  const setViewMode = useCallback((mode: 'grid' | 'list' | 'kanban' | 'calendar' | 'chart') => {
    debouncedUpdate({ viewMode: mode });
  }, [debouncedUpdate]);

  const setSelectedItems = useCallback((items: SelectedItem[]) => {
    setNeptuneSelectedItems(items);
  }, [setNeptuneSelectedItems]);

  const setFocusedItem = useCallback((item: SelectedItem | undefined) => {
    setNeptuneFocusedItem(item);
  }, [setNeptuneFocusedItem]);

  const addSelection = useCallback((item: SelectedItem) => {
    const currentItems = pageContext.selectedItems;
    if (!currentItems.find(i => i.id === item.id)) {
      setNeptuneSelectedItems([...currentItems, item]);
    }
  }, [pageContext.selectedItems, setNeptuneSelectedItems]);

  const removeSelection = useCallback((itemId: string) => {
    const currentItems = pageContext.selectedItems;
    setNeptuneSelectedItems(currentItems.filter(i => i.id !== itemId));
  }, [pageContext.selectedItems, setNeptuneSelectedItems]);

  const clearSelections = useCallback(() => {
    setNeptuneSelectedItems([]);
    setNeptuneFocusedItem(undefined);
  }, [setNeptuneSelectedItems, setNeptuneFocusedItem]);

  const setWizardState = useCallback((state: WizardState | undefined) => {
    setNeptuneWizardState(state);
  }, [setNeptuneWizardState]);

  const setWizardStep = useCallback((step: number, stepName: string) => {
    const currentWizard = pageContext.wizardState;
    if (currentWizard) {
      setNeptuneWizardState({
        ...currentWizard,
        currentStep: step,
        stepName,
        completedSteps: step > 1 
          ? [...new Set([...currentWizard.completedSteps, currentWizard.stepName])]
          : currentWizard.completedSteps,
      });
    }
  }, [pageContext.wizardState, setNeptuneWizardState]);

  const setFilterState = useCallback((state: FilterState | undefined) => {
    setNeptuneFilterState(state);
  }, [setNeptuneFilterState]);

  const setSearchQuery = useCallback((query: string) => {
    const currentFilter = pageContext.filterState;
    setNeptuneFilterState({
      filters: currentFilter?.filters || {},
      ...currentFilter,
      query,
    });
  }, [pageContext.filterState, setNeptuneFilterState]);

  const trackAction = useCallback((action: string, target?: string, metadata?: Record<string, unknown>) => {
    neptuneTrackAction(action, target, metadata);
  }, [neptuneTrackAction]);

  const setCustomData = useCallback((data: Record<string, unknown>) => {
    setNeptuneCustomData(data);
  }, [setNeptuneCustomData]);

  const mergeCustomData = useCallback((data: Record<string, unknown>) => {
    setNeptuneCustomData({
      ...pageContext.customData,
      ...data,
    });
  }, [pageContext.customData, setNeptuneCustomData]);

  return {
    pageContext,
    setActiveTab,
    setViewMode,
    setSelectedItems,
    setFocusedItem,
    addSelection,
    removeSelection,
    clearSelections,
    setWizardState,
    setWizardStep,
    setFilterState,
    setSearchQuery,
    trackAction,
    setCustomData,
    mergeCustomData,
  };
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Simple hook to just set page identity without full context management
 */
export function useSimplePageContext(
  module: AppModule,
  pageType: PageType,
  pageName: string
): void {
  const { setPageContext } = useNeptune();

  useEffect(() => {
    setPageContext({
      module,
      pageType,
      pageName,
      path: typeof window !== 'undefined' ? window.location.pathname : '/',
      enteredAt: new Date(),
      lastInteractionAt: new Date(),
    });
  }, [module, pageType, pageName, setPageContext]);
}

/**
 * Hook to track selections and report to Neptune
 */
export function useNeptuneSelection<T extends { id: string; name: string }>(
  itemType: SelectedItem['type']
) {
  const { pageContext, setSelectedItems, setFocusedItem } = useNeptune();

  const select = useCallback((items: T[]) => {
    setSelectedItems(items.map(item => ({
      id: item.id,
      type: itemType,
      name: item.name,
    })));
  }, [itemType, setSelectedItems]);

  const focus = useCallback((item: T | undefined) => {
    setFocusedItem(item ? {
      id: item.id,
      type: itemType,
      name: item.name,
    } : undefined);
  }, [itemType, setFocusedItem]);

  const clear = useCallback(() => {
    setSelectedItems([]);
    setFocusedItem(undefined);
  }, [setSelectedItems, setFocusedItem]);

  return {
    selectedItems: pageContext.selectedItems,
    focusedItem: pageContext.focusedItem,
    select,
    focus,
    clear,
  };
}

/**
 * Hook to track wizard progress and report to Neptune
 */
export function useNeptuneWizard(totalSteps: number, stepNames: string[]) {
  const { pageContext, setWizardState } = useNeptune();

  const initWizard = useCallback(() => {
    setWizardState({
      currentStep: 1,
      totalSteps,
      stepName: stepNames[0] || 'Step 1',
      completedSteps: [],
    });
  }, [totalSteps, stepNames, setWizardState]);

  const goToStep = useCallback((step: number) => {
    const currentWizard = pageContext.wizardState;
    if (!currentWizard) return;

    setWizardState({
      ...currentWizard,
      currentStep: step,
      stepName: stepNames[step - 1] || `Step ${step}`,
      completedSteps: step > currentWizard.currentStep
        ? [...new Set([...currentWizard.completedSteps, currentWizard.stepName])]
        : currentWizard.completedSteps,
    });
  }, [pageContext.wizardState, stepNames, setWizardState]);

  const nextStep = useCallback(() => {
    const currentWizard = pageContext.wizardState;
    if (!currentWizard || currentWizard.currentStep >= totalSteps) return;
    goToStep(currentWizard.currentStep + 1);
  }, [pageContext.wizardState, totalSteps, goToStep]);

  const prevStep = useCallback(() => {
    const currentWizard = pageContext.wizardState;
    if (!currentWizard || currentWizard.currentStep <= 1) return;
    goToStep(currentWizard.currentStep - 1);
  }, [pageContext.wizardState, goToStep]);

  const completeWizard = useCallback(() => {
    setWizardState(undefined);
  }, [setWizardState]);

  return {
    wizardState: pageContext.wizardState,
    currentStep: pageContext.wizardState?.currentStep ?? 0,
    isFirstStep: (pageContext.wizardState?.currentStep ?? 1) === 1,
    isLastStep: (pageContext.wizardState?.currentStep ?? 0) === totalSteps,
    initWizard,
    goToStep,
    nextStep,
    prevStep,
    completeWizard,
  };
}

export default usePageContext;
