/**
 * Neptune Unified Context Builder
 * 
 * Integrates all Neptune systems into a cohesive context for the AI:
 * - Phase 1: Voice & Persona (system-prompt.ts)
 * - Phase 2: Business Intelligence (business-intelligence.ts)
 * - Phase 3: Shared Memory (shared-context.ts)
 * - Phase 4: Proactive Insights (proactive-insights.ts)
 * - Phase 5: Agentic Actions (agentic-actions.ts)
 * 
 * This is the main entry point for generating Neptune's context.
 */

import { 
  generateBusinessIntelligence, 
  getBusinessSummary,
  type BusinessIntelligence 
} from './business-intelligence';
import { 
  buildSharedContext, 
  buildSharedContextPrompt,
  type ReferenceableContext 
} from './shared-context';
import { 
  generateProactiveInsights, 
  buildProactiveInsightsPrompt,
  hasUrgentInsights,
  type InsightEngineOutput 
} from './proactive-insights';
import { 
  buildContextualProposals, 
  buildAgenticActionsPrompt,
  type ProposedAction 
} from './agentic-actions';
import { 
  type PageContextData,
  DEFAULT_PAGE_CONTEXT
} from './page-context';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Complete Neptune context for AI prompt generation
 */
export interface NeptuneContext {
  // Page awareness
  pageContext: PageContextData | null;
  
  // Business intelligence
  businessIntelligence: BusinessIntelligence | null;
  businessSummary: string;
  
  // Shared memory
  sharedContext: ReferenceableContext | null;
  sharedContextPrompt: string;
  
  // Proactive insights
  insights: InsightEngineOutput | null;
  insightsPrompt: string;
  hasUrgent: boolean;
  
  // Agentic actions
  proposedActions: ProposedAction[];
  actionsPrompt: string;
  
  // Computed metadata
  contextGeneratedAt: Date;
  generationTimeMs: number;
}

/**
 * Options for context generation
 */
export interface NeptuneContextOptions {
  workspaceId: string;
  userId: string;
  conversationId?: string;
  currentPage?: string;
  currentTopic?: string;
  includeBusinessIntelligence?: boolean;
  includeSharedMemory?: boolean;
  includeProactiveInsights?: boolean;
  includeAgenticActions?: boolean;
}

// ============================================================================
// CONTEXT GENERATION
// ============================================================================

/**
 * Generate complete Neptune context
 * 
 * This is the main entry point for building Neptune's contextual awareness.
 * It aggregates all systems and produces prompts ready for the AI.
 */
export async function generateNeptuneContext(
  options: NeptuneContextOptions
): Promise<NeptuneContext> {
  const startTime = Date.now();
  
  const {
    workspaceId,
    userId,
    conversationId: _conversationId,
    currentPage,
    currentTopic,
    includeBusinessIntelligence = true,
    includeSharedMemory = true,
    includeProactiveInsights = true,
    includeAgenticActions = true,
  } = options;
  
  logger.info('[NeptuneContext] Generating unified context', { 
    workspaceId, 
    userId,
    options: {
      includeBusinessIntelligence,
      includeSharedMemory,
      includeProactiveInsights,
      includeAgenticActions,
    }
  });
  
  // Initialize result
  const context: NeptuneContext = {
    pageContext: null,
    businessIntelligence: null,
    businessSummary: '',
    sharedContext: null,
    sharedContextPrompt: '',
    insights: null,
    insightsPrompt: '',
    hasUrgent: false,
    proposedActions: [],
    actionsPrompt: '',
    contextGeneratedAt: new Date(),
    generationTimeMs: 0,
  };
  
  // Gather context in parallel where possible
  const promises: Promise<void>[] = [];
  
  // Page context - use default if path provided
  if (currentPage) {
    context.pageContext = {
      ...DEFAULT_PAGE_CONTEXT,
      path: currentPage,
    };
  }
  
  // Business intelligence
  if (includeBusinessIntelligence) {
    promises.push(
      generateBusinessIntelligence(workspaceId)
        .then(async (bi) => {
          context.businessIntelligence = bi;
          context.businessSummary = await getBusinessSummary(workspaceId);
        })
        .catch(error => {
          logger.error('[NeptuneContext] Business intelligence failed', { error });
        })
    );
  }
  
  // Shared memory
  if (includeSharedMemory) {
    promises.push(
      buildSharedContext(workspaceId, userId)
        .then(async (sc) => {
          context.sharedContext = sc;
          context.sharedContextPrompt = await buildSharedContextPrompt(workspaceId, userId);
        })
        .catch(error => {
          logger.error('[NeptuneContext] Shared context failed', { error });
        })
    );
  }
  
  // Proactive insights
  if (includeProactiveInsights) {
    promises.push(
      generateProactiveInsights(workspaceId)
        .then(async (insights) => {
          context.insights = insights;
          context.insightsPrompt = await buildProactiveInsightsPrompt(workspaceId);
          context.hasUrgent = await hasUrgentInsights(workspaceId);
        })
        .catch(error => {
          logger.error('[NeptuneContext] Proactive insights failed', { error });
        })
    );
  }
  
  // Agentic actions
  if (includeAgenticActions) {
    promises.push(
      buildContextualProposals(workspaceId, userId, currentTopic)
        .then(actions => {
          context.proposedActions = actions;
          context.actionsPrompt = buildAgenticActionsPrompt(actions);
        })
        .catch(error => {
          logger.error('[NeptuneContext] Agentic actions failed', { error });
        })
    );
  }
  
  // Wait for all parallel operations
  await Promise.all(promises);
  
  context.generationTimeMs = Date.now() - startTime;
  
  logger.info('[NeptuneContext] Context generation complete', { 
    timeMs: context.generationTimeMs,
    hasBusinessIntelligence: !!context.businessIntelligence,
    hasSharedContext: !!context.sharedContext,
    hasInsights: !!context.insights,
    actionCount: context.proposedActions.length,
    hasUrgent: context.hasUrgent,
  });
  
  return context;
}

// ============================================================================
// PROMPT BUILDING
// ============================================================================

/**
 * Build the complete system prompt enhancement from Neptune context
 */
export function buildNeptuneSystemPromptSections(context: NeptuneContext): string {
  const sections: string[] = [];
  
  // Business intelligence summary
  if (context.businessSummary) {
    sections.push('## CURRENT BUSINESS STATE');
    sections.push(context.businessSummary);
    sections.push('');
  }
  
  // Shared memory / relationship context
  if (context.sharedContextPrompt) {
    sections.push(context.sharedContextPrompt);
    sections.push('');
  }
  
  // Proactive insights
  if (context.insightsPrompt) {
    sections.push(context.insightsPrompt);
    sections.push('');
  }
  
  // Agentic actions
  if (context.actionsPrompt) {
    sections.push(context.actionsPrompt);
    sections.push('');
  }
  
  // Page-specific context
  if (context.pageContext) {
    sections.push('## CURRENT PAGE CONTEXT');
    sections.push(`User is viewing: ${context.pageContext.module} - ${context.pageContext.pageType}`);
    sections.push('');
  }
  
  return sections.join('\n');
}


