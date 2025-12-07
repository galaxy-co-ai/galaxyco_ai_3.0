/**
 * AI Reasoning Module
 * 
 * Provides chain-of-thought prompting and multi-step reasoning
 * for complex questions that require deeper analysis.
 */

import { getOpenAI } from '@/lib/ai-providers';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface ReasoningStep {
  step: number;
  thought: string;
  action?: string;
  observation?: string;
}

export interface ReasoningResult {
  steps: ReasoningStep[];
  finalAnswer: string;
  confidence: 'high' | 'medium' | 'low';
  sources?: string[];
}

// ============================================================================
// CHAIN OF THOUGHT PROMPTING
// ============================================================================

/**
 * Detect if a question is complex enough to benefit from chain-of-thought reasoning
 */
export function isComplexQuestion(question: string): boolean {
  const lowerQuestion = question.toLowerCase();
  
  // Indicators of complex questions
  const complexIndicators = [
    'why', 'how should', 'what strategy', 'compare', 'analyze',
    'evaluate', 'recommend', 'best approach', 'trade-off',
    'pros and cons', 'optimize', 'improve', 'decision',
    'multiple', 'several', 'various options', 'alternatives',
    'step by step', 'comprehensive', 'detailed analysis',
    'forecast', 'predict', 'project', 'estimate',
    'risk', 'opportunity', 'impact', 'implications',
  ];
  
  // Simple questions don't need CoT
  const simpleIndicators = [
    'what is', 'who is', 'when is', 'where is',
    'show me', 'list', 'get', 'find', 'search',
    'create', 'add', 'delete', 'update',
  ];
  
  // Check for simple patterns first
  for (const simple of simpleIndicators) {
    if (lowerQuestion.startsWith(simple)) {
      return false;
    }
  }
  
  // Check for complex indicators
  for (const complex of complexIndicators) {
    if (lowerQuestion.includes(complex)) {
      return true;
    }
  }
  
  // Questions longer than 100 chars with multiple clauses
  if (question.length > 100 && (question.includes(' and ') || question.includes(' or '))) {
    return true;
  }
  
  return false;
}

/**
 * Generate chain-of-thought prompt enhancement
 */
export function getChainOfThoughtPrompt(question: string, context?: string): string {
  return `I need to think through this step by step to give you the best answer.

Question: ${question}
${context ? `\nContext: ${context}` : ''}

Let me break this down:

**Step 1: Understanding the Question**
First, I'll clarify exactly what you're asking and what information I need.

**Step 2: Gathering Relevant Information**
I'll identify what data or context is relevant to answering this.

**Step 3: Analysis**
I'll analyze the information and consider different perspectives or approaches.

**Step 4: Conclusion**
Based on my analysis, here's my answer:`;
}

/**
 * Perform multi-step reasoning for complex questions
 */
export async function performReasoning(
  question: string,
  context: {
    businessContext?: string;
    dataContext?: string;
    userGoal?: string;
  } = {}
): Promise<ReasoningResult> {
  try {
    const openai = getOpenAI();
    
    const systemPrompt = `You are an expert business analyst and strategist. 
When answering complex questions, you think step by step.

For each question:
1. Identify the core problem or decision to be made
2. List relevant factors and data points
3. Analyze trade-offs and implications
4. Provide a clear recommendation with reasoning

Be concise but thorough. Use numbered steps when helpful.
Always indicate your confidence level (high/medium/low) based on available information.`;

    const userMessage = `Question: ${question}

${context.businessContext ? `Business Context:\n${context.businessContext}\n` : ''}
${context.dataContext ? `Data Context:\n${context.dataContext}\n` : ''}
${context.userGoal ? `User's Goal: ${context.userGoal}\n` : ''}

Please analyze this step by step and provide a well-reasoned answer.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3, // Lower for more consistent reasoning
      max_tokens: 2000,
    });

    const answer = response.choices[0]?.message?.content || '';
    
    // Parse the response to extract reasoning steps
    const steps = parseReasoningSteps(answer);
    const confidence = extractConfidence(answer);
    
    return {
      steps,
      finalAnswer: answer,
      confidence,
    };
  } catch (error) {
    logger.error('[Reasoning] Failed to perform reasoning', error);
    return {
      steps: [],
      finalAnswer: 'I encountered an issue analyzing this question. Please try rephrasing or breaking it down into smaller parts.',
      confidence: 'low',
    };
  }
}

/**
 * Parse reasoning steps from response
 */
function parseReasoningSteps(response: string): ReasoningStep[] {
  const steps: ReasoningStep[] = [];
  
  // Look for numbered steps or bullet points
  const stepPatterns = [
    /(?:Step\s*)?(\d+)[.:]\s*(.+?)(?=(?:Step\s*)?\d+[.:]|$)/gi,
    /[-•]\s*(.+?)(?=[-•]|$)/g,
  ];
  
  let matches: RegExpExecArray | null;
  let stepNum = 1;
  
  for (const pattern of stepPatterns) {
    const regex = new RegExp(pattern);
    while ((matches = regex.exec(response)) !== null) {
      const thought = matches[2] || matches[1];
      if (thought && thought.trim().length > 10) {
        steps.push({
          step: stepNum++,
          thought: thought.trim(),
        });
      }
    }
    if (steps.length > 0) break;
  }
  
  // If no structured steps found, treat whole response as one step
  if (steps.length === 0) {
    steps.push({
      step: 1,
      thought: response.slice(0, 500) + (response.length > 500 ? '...' : ''),
    });
  }
  
  return steps.slice(0, 5); // Limit to 5 steps
}

/**
 * Extract confidence level from response
 */
function extractConfidence(response: string): 'high' | 'medium' | 'low' {
  const lowerResponse = response.toLowerCase();
  
  const highConfidenceIndicators = [
    'confident', 'certainly', 'clearly', 'definitely',
    'strong evidence', 'highly recommend', 'best option',
  ];
  
  const lowConfidenceIndicators = [
    'uncertain', 'unclear', 'limited data', 'more information needed',
    'difficult to say', 'hard to determine', 'not enough context',
  ];
  
  for (const indicator of lowConfidenceIndicators) {
    if (lowerResponse.includes(indicator)) {
      return 'low';
    }
  }
  
  for (const indicator of highConfidenceIndicators) {
    if (lowerResponse.includes(indicator)) {
      return 'high';
    }
  }
  
  return 'medium';
}

// ============================================================================
// STRUCTURED OUTPUT HELPERS
// ============================================================================

/**
 * JSON schemas for common structured outputs
 */
export const structuredSchemas = {
  leadQualification: {
    type: 'object',
    properties: {
      score: { type: 'number', minimum: 0, maximum: 100 },
      tier: { type: 'string', enum: ['hot', 'warm', 'cold'] },
      reasons: { type: 'array', items: { type: 'string' } },
      nextSteps: { type: 'array', items: { type: 'string' } },
      timeframe: { type: 'string' },
    },
    required: ['score', 'tier', 'reasons', 'nextSteps'],
  },
  
  campaignAnalysis: {
    type: 'object',
    properties: {
      performance: { type: 'string', enum: ['excellent', 'good', 'average', 'poor'] },
      metrics: {
        type: 'object',
        properties: {
          openRate: { type: 'number' },
          clickRate: { type: 'number' },
          conversionRate: { type: 'number' },
        },
      },
      insights: { type: 'array', items: { type: 'string' } },
      recommendations: { type: 'array', items: { type: 'string' } },
    },
    required: ['performance', 'insights', 'recommendations'],
  },
  
  taskPrioritization: {
    type: 'object',
    properties: {
      prioritizedTasks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            priority: { type: 'number' },
            reason: { type: 'string' },
          },
        },
      },
      suggestions: { type: 'array', items: { type: 'string' } },
    },
    required: ['prioritizedTasks'],
  },
};

/**
 * Get structured response from AI with JSON schema
 */
export async function getStructuredResponse<T>(
  prompt: string,
  schema: Record<string, unknown>,
  systemContext?: string
): Promise<T | null> {
  try {
    const openai = getOpenAI();
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemContext || 'You are a helpful business assistant. Respond with structured JSON.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'structured_response',
          strict: true,
          schema: schema,
        },
      },
      temperature: 0.3,
      max_tokens: 1500,
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) return null;
    
    return JSON.parse(content) as T;
  } catch (error) {
    logger.error('[Reasoning] Failed to get structured response', error);
    return null;
  }
}
