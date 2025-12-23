/**
 * Intent Classification System
 * 
 * Detects user intent to enable proactive suggestions and smart routing.
 * Uses pattern matching (fast) + GPT-4o-mini (complex cases).
 * 
 * Phase 1B - Neptune Transformation
 */

import { getOpenAI } from '@/lib/ai-providers';
import { logger } from '@/lib/logger';
import type { AIContextData } from './context';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type IntentType = 
  | 'automation'        // User wants to automate a repetitive task
  | 'agent_creation'    // User wants to create an AI agent
  | 'information'       // User wants to know something (query/search)
  | 'action'            // User wants to execute a specific action
  | 'guidance'          // User wants help/advice on how to do something
  | 'creation';         // User wants to create content/documents

export interface IntentClassification {
  intent: IntentType;
  confidence: number; // 0-1
  suggestedTools: string[];
  contextNeeded: string[];
  proactiveResponse?: string;
  detectionMethod: 'pattern' | 'ai';
  processingTimeMs: number;
}

// ============================================================================
// PATTERN DEFINITIONS
// ============================================================================

/**
 * Pattern-based intent detection (fast path)
 * Checks for common phrases and keywords
 */
const INTENT_PATTERNS = {
  automation: [
    /automat/i,
    /repetitive/i,
    /every time/i,
    /always have to/i,
    /manual(ly)?.*process/i,
    /copy.*paste/i,
    /same.*every/i,
    /tedious/i,
    /help.*(?:with|for).*follow.?up/i, // "help with lead follow-up"
  ],
  
  agent_creation: [
    /create.*agent/i,
    /build.*agent/i,
    /make.*agent/i,
    /need.*agent/i,
    /new agent/i,
    /set up.*agent/i,
  ],
  
  information: [
    /what('s| is)/i,
    /how many/i,
    /show me/i,
    /list.*my/i,
    /tell me.*about/i,
    /what are/i,
    /status.*of/i,
    /summary/i,
  ],
  
  action: [
    /create (a |an )?(?:lead|contact|task|event)/i,
    /add (a |an )?(?:lead|contact|task)/i,
    /send.*email/i,
    /schedule.*meeting/i,
    /update.*(?:lead|contact|task)/i,
    /delete/i,
    /move.*to/i,
  ],
  
  guidance: [
    /how (do|can|should) i/i,
    /help me/i,
    /best way/i,
    /recommend/i,
    /suggest/i,
    /advice/i,
    /guide me/i,
    /walk me through/i,
    /what.*best way/i, // "what's the best way"
  ],
  
  creation: [
    /write.*(?:email|proposal|report|document)/i,
    /draft.*(?:email|proposal|message)/i,
    /generate.*(?:content|copy|text)/i,
    /create.*(?:document|presentation|deck)/i,
    /compose/i,
  ],
};

/**
 * Context-aware triggers that suggest proactive automation
 */
const AUTOMATION_TRIGGERS = {
  leadFollowup: [
    /follow.?up/i,
    /reach out/i,
    /contact.*lead/i,
    /nurture/i,
  ],
  
  dataEntry: [
    /copy.*data/i,
    /enter.*information/i,
    /fill.*form/i,
    /input.*manually/i,
  ],
  
  reporting: [
    /weekly report/i,
    /monthly update/i,
    /send.*summary/i,
    /compile.*data/i,
  ],
};

// ============================================================================
// PATTERN MATCHING FUNCTIONS
// ============================================================================

/**
 * Check if message matches any patterns for an intent type
 */
function matchesIntent(message: string, patterns: RegExp[]): boolean {
  return patterns.some(pattern => pattern.test(message));
}

/**
 * Calculate confidence based on pattern matches
 */
function calculatePatternConfidence(message: string, patterns: RegExp[]): number {
  const matches = patterns.filter(pattern => pattern.test(message)).length;
  if (matches === 0) return 0;
  if (matches === 1) return 0.7;
  if (matches >= 2) return 0.9;
  return 0.5;
}

/**
 * Fast pattern-based classification
 * Returns null if no clear pattern match (falls back to AI)
 */
function classifyByPatterns(message: string): IntentClassification | null {
  
  // Check each intent type
  for (const [intentType, patterns] of Object.entries(INTENT_PATTERNS)) {
    const confidence = calculatePatternConfidence(message, patterns);
    
    if (confidence >= 0.7) {
      return {
        intent: intentType as IntentType,
        confidence,
        suggestedTools: getSuggestedTools(intentType as IntentType, message),
        contextNeeded: getContextNeeded(intentType as IntentType),
        proactiveResponse: getProactiveResponse(intentType as IntentType, message),
        detectionMethod: 'pattern',
        processingTimeMs: 0, // Patterns are instant
      };
    }
  }
  
  return null;
}

/**
 * Suggest relevant tools based on intent
 */
function getSuggestedTools(intent: IntentType, _message: string): string[] {
  const toolMap: Record<IntentType, string[]> = {
    automation: ['create_agent', 'create_workflow', 'delegate_to_agent'],
    agent_creation: ['create_agent', 'list_agents', 'get_agent_templates'],
    information: ['search_leads', 'get_pipeline_summary', 'search_knowledge', 'search_web'],
    action: ['create_lead', 'create_contact', 'create_task', 'send_email', 'schedule_meeting'],
    guidance: ['search_knowledge', 'navigate_to_page'],
    creation: ['generate_email_content', 'create_professional_document', 'generate_image'],
  };
  
  return toolMap[intent] || [];
}

/**
 * Determine what context is needed for this intent
 */
function getContextNeeded(intent: IntentType): string[] {
  const contextMap: Record<IntentType, string[]> = {
    automation: ['existing_agents', 'workflow_templates', 'repetitive_tasks'],
    agent_creation: ['agent_templates', 'workspace_capabilities', 'integration_status'],
    information: ['crm_data', 'calendar_events', 'task_list', 'knowledge_base'],
    action: ['user_permissions', 'workspace_data', 'integration_status'],
    guidance: ['feature_capabilities', 'user_preferences', 'workspace_setup'],
    creation: ['brand_voice', 'content_templates', 'target_audience'],
  };
  
  return contextMap[intent] || [];
}

/**
 * Generate proactive response suggestions based on intent
 */
function getProactiveResponse(intent: IntentType, message: string): string | undefined {
  switch (intent) {
    case 'automation': {
      // Check for specific automation triggers
      for (const [trigger, patterns] of Object.entries(AUTOMATION_TRIGGERS)) {
        if (matchesIntent(message, patterns)) {
          if (trigger === 'leadFollowup') {
            return 'I can help you automate lead follow-ups. Would you like me to create an agent that handles this automatically?';
          }
          if (trigger === 'dataEntry') {
            return 'Manual data entry is perfect for automation. I can build a workflow that does this for you.';
          }
          if (trigger === 'reporting') {
            return 'I can set up automated reporting that runs on schedule and sends summaries to you.';
          }
        }
      }
      return 'This sounds like a perfect use case for automation. Want me to help set that up?';
    }
    
    case 'agent_creation':
      return 'I can walk you through creating an agent. What would you like the agent to do?';
    
    default:
      return undefined;
  }
}

// ============================================================================
// AI-BASED CLASSIFICATION
// ============================================================================

/**
 * Use GPT-4o-mini for complex intent detection
 * Falls back when pattern matching is inconclusive
 */
async function classifyByAI(
  message: string,
  workspaceContext: AIContextData
): Promise<IntentClassification> {
  const startTime = Date.now();
  
  try {
    const openai = getOpenAI();
    
    // Build context summary for AI
    const contextSummary = {
      hasLeads: workspaceContext.crm.totalLeads > 0,
      hasAgents: workspaceContext.agents.activeAgents > 0,
      hasWebsiteAnalysis: workspaceContext.website?.hasAnalysis,
      emptyWorkspace: workspaceContext.crm.totalLeads === 0 && 
                      workspaceContext.agents.activeAgents === 0,
    };
    
    const systemPrompt = `You are an intent classification system. Analyze the user's message and classify their intent.

Context about the workspace:
- Leads: ${workspaceContext.crm.totalLeads}
- Active Agents: ${workspaceContext.agents.activeAgents}
- Has Website Analysis: ${contextSummary.hasWebsiteAnalysis ? 'Yes' : 'No'}
- Empty Workspace: ${contextSummary.emptyWorkspace ? 'Yes' : 'No'}

Intent Types:
- automation: User wants to automate a repetitive task
- agent_creation: User wants to create an AI agent
- information: User wants to query/search for information
- action: User wants to execute a specific action (create, update, delete)
- guidance: User wants help or advice on how to do something
- creation: User wants to create content (email, document, etc.)

Respond with JSON only:
{
  "intent": "automation|agent_creation|information|action|guidance|creation",
  "confidence": 0.0-1.0,
  "suggestedTools": ["tool1", "tool2"],
  "reasoning": "Brief explanation of why this intent was chosen",
  "proactiveResponse": "Optional suggestion to offer the user"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Lower temperature for consistent classification
      max_tokens: 300,
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }
    
    const result = JSON.parse(content);
    const processingTimeMs = Date.now() - startTime;
    
    logger.info('[Intent Classifier] AI classification complete', {
      intent: result.intent,
      confidence: result.confidence,
      processingTimeMs,
      reasoning: result.reasoning,
    });
    
    return {
      intent: result.intent as IntentType,
      confidence: result.confidence,
      suggestedTools: result.suggestedTools || [],
      contextNeeded: getContextNeeded(result.intent as IntentType),
      proactiveResponse: result.proactiveResponse,
      detectionMethod: 'ai',
      processingTimeMs,
    };
  } catch (error) {
    logger.error('[Intent Classifier] AI classification failed', error);
    
    // Fallback to generic information intent
    return {
      intent: 'information',
      confidence: 0.5,
      suggestedTools: [],
      contextNeeded: [],
      detectionMethod: 'ai',
      processingTimeMs: Date.now() - startTime,
    };
  }
}

// ============================================================================
// MAIN CLASSIFICATION FUNCTION
// ============================================================================

/**
 * Classify user intent using patterns (fast) or AI (complex)
 * 
 * @param message - User's message
 * @param workspaceContext - Current workspace context for contextual classification
 * @returns Intent classification with suggestions
 */
export async function classifyIntent(
  message: string,
  workspaceContext: AIContextData
): Promise<IntentClassification> {
  const startTime = Date.now();
  
  try {
    // Try pattern matching first (fast path)
    const patternMatch = classifyByPatterns(message);
    
    if (patternMatch && patternMatch.confidence >= 0.7) {
      patternMatch.processingTimeMs = Date.now() - startTime;
      
      logger.info('[Intent Classifier] Pattern match found', {
        intent: patternMatch.intent,
        confidence: patternMatch.confidence,
        processingTimeMs: patternMatch.processingTimeMs,
      });
      
      return patternMatch;
    }
    
    // Fall back to AI for complex or ambiguous cases
    logger.debug('[Intent Classifier] No pattern match, using AI classification');
    return await classifyByAI(message, workspaceContext);
    
  } catch (error) {
    logger.error('[Intent Classifier] Classification failed', error);
    
    // Safe fallback
    return {
      intent: 'information',
      confidence: 0.5,
      suggestedTools: [],
      contextNeeded: [],
      detectionMethod: 'pattern',
      processingTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Check if a message indicates automation opportunity
 * Used for proactive detection in conversations
 */
export function detectsAutomationOpportunity(message: string): boolean {
  const automationPatterns = [
    ...INTENT_PATTERNS.automation,
    ...Object.values(AUTOMATION_TRIGGERS).flat(),
  ];
  
  return matchesIntent(message, automationPatterns);
}

/**
 * Get automation suggestion based on message content
 */
export function getAutomationSuggestion(message: string): string | null {
  for (const [trigger, patterns] of Object.entries(AUTOMATION_TRIGGERS)) {
    if (matchesIntent(message, patterns)) {
      const suggestions: Record<string, string> = {
        leadFollowup: 'I can create an agent that automatically follows up with leads based on their stage and activity.',
        dataEntry: 'Let me build you a workflow that automates this data entry process.',
        reporting: 'I can set up automated reports that run on your schedule and email you the results.',
      };
      
      return suggestions[trigger] || null;
    }
  }
  
  return null;
}

