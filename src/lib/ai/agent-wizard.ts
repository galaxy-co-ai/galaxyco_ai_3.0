/**
 * Agent Creation Wizard
 * 
 * Conversational flow for creating agents in 1-2 messages.
 * Uses templates and smart defaults to minimize questions.
 */

import { 
  matchTemplate, 
  customizeTemplate, 
  inferCapabilities,
  getTemplateById,
  type AgentTemplate 
} from './agent-templates';
import type { AIContextData } from './context';
import { db } from '@/lib/db';
import { agents } from '@/db/schema';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AgentCreationFlow {
  step: 'intent' | 'template_match' | 'customization' | 'creation';
  template?: AgentTemplate;
  userInput: string;
  clarificationNeeded?: string;
  readyToCreate: boolean;
}

export interface AgentCreationResult {
  agentId: string;
  name: string;
  description: string;
  type: string;
  capabilities: string[];
  template?: string;
}

export interface AgentIntentAnalysis {
  objective: string;
  suggestedTemplate: string | null;
  inferredCapabilities: string[];
  needsClarification: boolean;
  clarificationQuestion?: string;
  confidence: 'high' | 'medium' | 'low';
}

// ============================================================================
// INTENT ANALYSIS
// ============================================================================

/**
 * Analyze user's intent for agent creation
 */
export async function analyzeAgentIntent(
  message: string,
  context: AIContextData
): Promise<AgentIntentAnalysis> {
  const messageLower = message.toLowerCase();
  
  // Try to match to a template
  const template = matchTemplate(message, context);
  
  // Infer capabilities from the message
  const capabilities = inferCapabilities(message);
  
  // Extract objective (what the agent should do)
  let objective = message;
  
  // Clean up common phrases
  objective = objective
    .replace(/^(create|make|build|set up|setup)\s+(an?\s+)?agent\s+(that|to|for|which)?\s*/i, '')
    .replace(/^(i want|i need|can you)\s+/i, '')
    .trim();
  
  // Determine if we need clarification
  let needsClarification = false;
  let clarificationQuestion: string | undefined;
  let confidence: 'high' | 'medium' | 'low' = 'high';
  
  // Check if message is too vague
  if (objective.length < 10 || capabilities.length === 0) {
    needsClarification = true;
    confidence = 'low';
    
    if (!template) {
      clarificationQuestion = 'What should this agent do? For example: "follow up with leads" or "respond to emails"';
    } else {
      // We have a template but vague description
      clarificationQuestion = `I can create a ${template.name} for you. Should it ${template.exampleUseCases[0].toLowerCase()}?`;
    }
  }
  
  // Check if we have a good template match
  if (!template && capabilities.length < 2) {
    confidence = 'medium';
    needsClarification = true;
    clarificationQuestion = 'I want to make sure I understand. Should this agent work with emails, CRM data, calendar, or something else?';
  }
  
  // If we have everything, no clarification needed
  if (template && capabilities.length > 0 && objective.length > 10) {
    needsClarification = false;
    confidence = 'high';
  }
  
  logger.info('Agent intent analyzed', {
    objective: objective.substring(0, 50),
    templateMatched: template?.id,
    capabilities,
    confidence,
    needsClarification
  });
  
  return {
    objective,
    suggestedTemplate: template?.id || null,
    inferredCapabilities: capabilities,
    needsClarification,
    clarificationQuestion,
    confidence
  };
}

// ============================================================================
// AGENT CREATION
// ============================================================================

/**
 * Create an agent from a template with customizations
 */
export async function createAgentFromTemplate(
  template: AgentTemplate,
  customizations: Record<string, unknown>,
  workspaceContext: {
    workspaceId: string;
    userId: string;
  }
): Promise<AgentCreationResult> {
  try {
    // Customize the template
    const customized = customizeTemplate(template, customizations);
    
    // Extract name and description
    const name = customizations.name as string || customized.name;
    const description = customizations.description as string || customized.description;
    
    // Merge capabilities
    const capabilities = [
      ...new Set([
        ...customized.capabilities,
        ...(customizations.capabilities as string[] || [])
      ])
    ];
    
    // Build agent config
    const config = {
      systemPrompt: customized.systemPromptTemplate,
      capabilities,
      triggers: customized.triggers,
      requiredIntegrations: customized.requiredIntegrations,
      aiProvider: 'openai' as const,
      model: 'gpt-4o',
      temperature: 0.7
    };
    
    // Create agent in database
    const [newAgent] = await db
      .insert(agents)
      .values({
        workspaceId: workspaceContext.workspaceId,
        createdBy: workspaceContext.userId,
        name,
        description,
        type: customized.type,
        status: 'active',
        config,
        isCustom: true
      })
      .returning();
    
    logger.info('Agent created from template', {
      agentId: newAgent.id,
      templateId: template.id,
      name,
      workspaceId: workspaceContext.workspaceId
    });
    
    return {
      agentId: newAgent.id,
      name: newAgent.name,
      description: newAgent.description || '',
      type: newAgent.type,
      capabilities,
      template: template.id
    };
  } catch (error) {
    logger.error('Failed to create agent from template', error);
    throw new Error('Failed to create agent. Please try again.');
  }
}

/**
 * Create an agent from natural language description (no template match)
 */
export async function createAgentFromDescription(
  description: string,
  workspaceContext: {
    workspaceId: string;
    userId: string;
  }
): Promise<AgentCreationResult> {
  try {
    // Infer capabilities
    const capabilities = inferCapabilities(description);
    
    // Generate a name from description (first 50 chars, cleaned)
    let name = description
      .substring(0, 50)
      .replace(/^(create|make|build|set up|setup)\s+(an?\s+)?agent\s+(that|to|for|which)?\s*/i, '')
      .trim();
    
    // Capitalize first letter
    name = name.charAt(0).toUpperCase() + name.slice(1);
    
    // Default to 'custom' type
    const type = 'custom' as const;
    
    // Build a basic system prompt
    const systemPrompt = `You are an AI agent designed to: ${description}

Your capabilities: ${capabilities.join(', ')}

Always be helpful, efficient, and accurate in your tasks.`;
    
    // Create agent config
    const config = {
      systemPrompt,
      capabilities,
      triggers: [{ type: 'manual' as const, config: {} }],
      aiProvider: 'openai' as const,
      model: 'gpt-4o',
      temperature: 0.7
    };
    
    // Create agent in database
    const [newAgent] = await db
      .insert(agents)
      .values({
        workspaceId: workspaceContext.workspaceId,
        createdBy: workspaceContext.userId,
        name,
        description,
        type,
        status: 'active',
        config,
        isCustom: true
      })
      .returning();
    
    logger.info('Agent created from description', {
      agentId: newAgent.id,
      name,
      capabilities,
      workspaceId: workspaceContext.workspaceId
    });
    
    return {
      agentId: newAgent.id,
      name: newAgent.name,
      description: newAgent.description || '',
      type: newAgent.type,
      capabilities
    };
  } catch (error) {
    logger.error('Failed to create agent from description', error);
    throw new Error('Failed to create agent. Please try again.');
  }
}

/**
 * Quick create: One-shot agent creation with minimal input
 */
export async function quickCreateAgent(
  description: string,
  context: AIContextData,
  workspaceContext: {
    workspaceId: string;
    userId: string;
  },
  options?: {
    templateId?: string;
    customizations?: Record<string, unknown>;
  }
): Promise<{
  success: boolean;
  agent?: AgentCreationResult;
  needsClarification?: boolean;
  clarificationQuestion?: string;
  error?: string;
}> {
  try {
    // If template ID is provided, use it
    let template: AgentTemplate | null = null;
    
    if (options?.templateId) {
      template = getTemplateById(options.templateId);
      if (!template) {
        return {
          success: false,
          error: `Template ${options.templateId} not found`
        };
      }
    } else {
      // Try to match template from description
      template = matchTemplate(description, context);
    }
    
    // Analyze intent
    const intent = await analyzeAgentIntent(description, context);
    
    // Only ask for clarification if description is completely unclear (very short or vague)
    // Don't block creation if we have reasonable intent
    if (intent.needsClarification && intent.confidence === 'low' && description.length < 15) {
      return {
        success: false,
        needsClarification: true,
        clarificationQuestion: intent.clarificationQuestion
      };
    }
    
    // Create the agent
    let agent: AgentCreationResult;
    
    if (template) {
      // Use template-based creation
      agent = await createAgentFromTemplate(
        template,
        {
          name: options?.customizations?.name,
          description,
          capabilities: intent.inferredCapabilities,
          ...options?.customizations
        },
        workspaceContext
      );
    } else {
      // Create from description
      agent = await createAgentFromDescription(
        description,
        workspaceContext
      );
    }
    
    return {
      success: true,
      agent
    };
  } catch (error) {
    logger.error('Quick create agent failed', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get agent creation suggestions based on context
 */
export function getAgentSuggestions(context: AIContextData): Array<{
  templateId: string;
  reason: string;
  priority: number;
}> {
  const suggestions: Array<{ templateId: string; reason: string; priority: number }> = [];
  
  // Suggest lead follow-up if they have leads
  if (context.crm.totalLeads > 5) {
    suggestions.push({
      templateId: 'lead-followup',
      reason: `You have ${context.crm.totalLeads} leads. Automate follow-ups to stay on top of them.`,
      priority: 90
    });
  }
  
  // Suggest data enrichment if they have contacts without company data
  if (context.crm.totalContacts > 10) {
    suggestions.push({
      templateId: 'data-enrichment',
      reason: 'Enrich your contacts with company data and social profiles.',
      priority: 70
    });
  }
  
  // Suggest report generator if they have pipeline data
  if (context.crm.totalPipelineValue > 0) {
    suggestions.push({
      templateId: 'report-generator',
      reason: 'Get weekly pipeline reports delivered automatically.',
      priority: 60
    });
  }
  
  // Suggest meeting scheduler if they have upcoming events
  if (context.calendar.upcomingEvents.length > 0) {
    suggestions.push({
      templateId: 'meeting-scheduler',
      reason: 'Automate meeting scheduling with leads and customers.',
      priority: 50
    });
  }
  
  // Suggest email responder if they have active campaigns
  if (context.marketing && context.marketing.totalCampaigns > 0) {
    suggestions.push({
      templateId: 'email-responder',
      reason: 'Handle incoming campaign responses automatically.',
      priority: 65
    });
  }
  
  // Sort by priority
  suggestions.sort((a, b) => b.priority - a.priority);
  
  return suggestions;
}

/**
 * Validate agent configuration before creation
 */
export function validateAgentConfig(
  name: string,
  description: string,
  capabilities: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Name validation
  if (!name || name.trim().length === 0) {
    errors.push('Agent name is required');
  }
  if (name.length > 100) {
    errors.push('Agent name must be less than 100 characters');
  }
  
  // Description validation
  if (description && description.length > 500) {
    errors.push('Agent description must be less than 500 characters');
  }
  
  // Capabilities validation
  if (capabilities.length === 0) {
    errors.push('Agent must have at least one capability');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

