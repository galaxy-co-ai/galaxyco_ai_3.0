/**
 * Neptune AI Assistant Module
 * 
 * Neptune is the strategic business partner AI for GalaxyCo.ai.
 * This module provides all the intelligence systems that power Neptune.
 */

// Agentic Actions (Phase 5) - Primary export
export {
  generateLeadEmail,
  generateBatchFollowUps,
  generateSummaryReport,
  createFollowUpTask,
  updateProspectStage,
  batchCreateFollowUps,
  proposeAction,
  buildContextualProposals,
  buildAgenticActionsPrompt,
  type ActionType,
  type RiskLevel,
  type ActionStatus,
  type ProposedAction,
  type ActionResult,
  type DraftContent,
} from './agentic-actions';

// Page Context (existing)
export {
  DEFAULT_PAGE_CONTEXT,
  MODULE_METADATA,
  type PageContextData,
  type AppModule,
  type PageType,
  type SelectedItem,
  type SuggestedAction,
} from './page-context';

// Quick Actions (existing)
export {
  type QuickActionContext,
} from './quick-actions';

// Additional modules - import directly as needed:
// - ./business-intelligence - Business metrics and KPIs
// - ./shared-context - Cross-session memory and user context
// - ./proactive-insights - AI-generated insights engine
// - ./unified-context - Aggregates all context for AI prompts
