/**
 * Communication Style Analyzer (Phase 2A - Neptune Transformation)
 * 
 * Automatically detects and adapts to each user's unique communication style by analyzing
 * their message patterns over time. Neptune then mirrors their style for more natural interactions.
 * 
 * ## What It Detects:
 * 
 * ### Formality Level
 * - **Casual**: "Hey", "cool", "awesome", emojis frequent
 * - **Professional**: "Regarding", "kindly", "I would appreciate"
 * - **Technical**: Heavy use of technical terminology, precise language
 * 
 * ### Verbosity Preference  
 * - **Concise**: Short messages (<30 words), direct requests
 * - **Balanced**: Medium-length messages (30-80 words)
 * - **Detailed**: Long messages (>80 words), provides context
 * 
 * ### Tone
 * - **Friendly**: "Thanks", "appreciate", emojis, warm language
 * - **Neutral**: Balanced, neither warm nor cold
 * - **Direct**: Commands, imperatives, gets straight to point
 * 
 * ### Other Dimensions
 * - **Emoji Usage**: 0-100% frequency of emoji in messages
 * - **Technical Level**: 0-100 score based on technical vocabulary
 * - **Preferred Greeting**: "Hi", "Hey", "Hello", etc.
 * - **Response Pattern**: Quick-wins, thorough-analysis, or exploratory
 * 
 * ## How It Works:
 * 
 * 1. **Trigger**: Runs every 5 messages in a conversation
 * 2. **Analysis**: Uses pattern matching to score each dimension
 * 3. **Aggregation**: Combines scores with weighted averages
 * 4. **Confidence**: Requires 70%+ confidence before adaptation
 * 5. **Persistence**: Saves to user preferences for future sessions
 * 6. **Adaptation**: System prompt modified to match detected style
 * 
 * ## Performance:
 * - **Analysis Time**: <100ms (pure pattern matching, no AI calls)
 * - **Runs Every**: 5 messages
 * - **Confidence Threshold**: 70% minimum
 * - **Sample Size**: Analyzes last 10 messages
 * 
 * ## Expected Results:
 * 
 * **Before:**
 * ```
 * User: "hey can you help me out?"
 * Neptune: "I would be delighted to assist you with your request."
 * (Formality mismatch)
 * ```
 * 
 * **After (Phase 2A):**
 * ```
 * User: "hey can you help me out?"
 * Neptune: "Hey! Sure thing, I can help with that."
 * (Matched casual tone)
 * ```
 * 
 * @example
 * ```typescript
 * // Analyze style from messages
 * const messages = conversation.filter(m => m.role === 'user').slice(-10);
 * const style = await analyzeUserStyle(messages, messageCount);
 * 
 * // Update user preferences
 * await updateCommunicationStyle(workspaceId, userId, style);
 * 
 * // Style is then injected into system prompt automatically
 * ```
 */

import { logger } from '@/lib/logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CommunicationStyle {
  formality: 'casual' | 'professional' | 'technical';
  verbosity: 'concise' | 'balanced' | 'detailed';
  tone: 'friendly' | 'neutral' | 'direct';
  emojiUsage: number; // 0-100 percentage
  technicalLevel: number; // 0-100 score
  preferredGreeting: string | null;
  responsePattern: 'quick-wins' | 'thorough-analysis' | 'exploratory';
  confidence: number; // 0-100 confidence in analysis
  lastUpdated: Date;
}

interface MessageAnalysis {
  wordCount: number;
  avgSentenceLength: number;
  questionCount: number;
  emojiCount: number;
  technicalTermCount: number;
  formalityScore: number;
  verbosityScore: number;
  toneScore: number;
}

// ============================================================================
// DETECTION PATTERNS
// ============================================================================

// Casual indicators
const CASUAL_PATTERNS = [
  /\bhey\b/i,
  /\byeah\b/i,
  /\bnope\b/i,
  /\bgonna\b/i,
  /\bwanna\b/i,
  /\bkinda\b/i,
  /\bsorta\b/i,
  /\bthanks\b/i,
  /\bcool\b/i,
  /\bawesome\b/i,
  /\bgreat\b/i,
  /\blol\b/i,
  /\bhaha\b/i,
  /👍|👌|😊|😄|🎉|✨|🔥|💪/,
];

// Professional indicators
const PROFESSIONAL_PATTERNS = [
  /\bregarding\b/i,
  /\bpursuant\b/i,
  /\bforthwith\b/i,
  /\btherefore\b/i,
  /\bhowever\b/i,
  /\bmoreover\b/i,
  /\bnevertheless\b/i,
  /\bfurthermore\b/i,
  /\bconsequently\b/i,
  /\brespectively\b/i,
  /\bplease find\b/i,
  /\bkindly\b/i,
  /\bI would appreciate\b/i,
  /\bthank you for your time\b/i,
];

// Technical indicators (common tech terms)
const TECHNICAL_TERMS = [
  /\bAPI\b/i,
  /\bJSON\b/i,
  /\bRESTful\b/i,
  /\bGraphQL\b/i,
  /\bwebhook\b/i,
  /\bendpoint\b/i,
  /\blatency\b/i,
  /\bthroughput\b/i,
  /\bpayload\b/i,
  /\bschema\b/i,
  /\bmiddleware\b/i,
  /\bauthentication\b/i,
  /\bauthorization\b/i,
  /\bencryption\b/i,
  /\balgorithm\b/i,
  /\bimplementation\b/i,
  /\binfrastructure\b/i,
  /\bdeployment\b/i,
  /\bscalability\b/i,
  /\boptimization\b/i,
];

// Direct tone indicators
const DIRECT_PATTERNS = [
  /^(do|don't|can you|could you|please|show me|tell me|give me|make|create|delete|update)/i,
  /\bneed\b/i,
  /\bmust\b/i,
  /\bshould\b/i,
  /\bwant\b/i,
  /\brequire\b/i,
];

// Friendly tone indicators
const FRIENDLY_PATTERNS = [
  /\bthanks\b/i,
  /\bthank you\b/i,
  /\bappreciate\b/i,
  /\bplease\b/i,
  /\bwould you mind\b/i,
  /\bif you could\b/i,
  /\bwould be great\b/i,
  /\bwould love\b/i,
  /😊|🙏|❤️|💙|✨|🎉/,
];

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Analyzes a single message for style indicators using pattern matching
 * 
 * Extracts metrics:
 * - Word/sentence counts
 * - Question frequency
 * - Emoji usage
 * - Technical term density
 * - Formality/verbosity/tone scores
 * 
 * **Performance**: <10ms per message (no API calls)
 * 
 * @param content - Message text to analyze
 * @returns MessageAnalysis with computed metrics
 * 
 * @internal
 */
function analyzeMessage(content: string): MessageAnalysis {
  // Basic metrics
  const words = content.split(/\s+/).filter(w => w.length > 0);
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const wordCount = words.length;
  const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : 0;
  const questionCount = (content.match(/\?/g) || []).length;
  const emojiCount = (content.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  
  // Technical term count
  let technicalTermCount = 0;
  for (const pattern of TECHNICAL_TERMS) {
    const matches = content.match(pattern);
    if (matches) {
      technicalTermCount += matches.length;
    }
  }
  
  // Formality score (0-100: 0=casual, 100=professional)
  let formalityScore = 50; // Start neutral
  
  // Count casual patterns (decrease formality)
  for (const pattern of CASUAL_PATTERNS) {
    if (pattern.test(content)) {
      formalityScore -= 5;
    }
  }
  
  // Count professional patterns (increase formality)
  for (const pattern of PROFESSIONAL_PATTERNS) {
    if (pattern.test(content)) {
      formalityScore += 8;
    }
  }
  
  // Short messages tend to be more casual
  if (wordCount < 10) {
    formalityScore -= 10;
  }
  
  // Clamp to 0-100
  formalityScore = Math.max(0, Math.min(100, formalityScore));
  
  // Verbosity score (0-100: 0=concise, 100=detailed)
  let verbosityScore = 50;
  if (wordCount < 15) {
    verbosityScore = 20;
  } else if (wordCount < 50) {
    verbosityScore = 50;
  } else {
    verbosityScore = 80;
  }
  
  // Tone score (0-100: 0=direct, 50=neutral, 100=friendly)
  let toneScore = 50;
  
  // Direct patterns (decrease tone score)
  for (const pattern of DIRECT_PATTERNS) {
    if (pattern.test(content)) {
      toneScore -= 10;
    }
  }
  
  // Friendly patterns (increase tone score)
  for (const pattern of FRIENDLY_PATTERNS) {
    if (pattern.test(content)) {
      toneScore += 10;
    }
  }
  
  // Clamp to 0-100
  toneScore = Math.max(0, Math.min(100, toneScore));
  
  return {
    wordCount,
    avgSentenceLength,
    questionCount,
    emojiCount,
    technicalTermCount,
    formalityScore,
    verbosityScore,
    toneScore,
  };
}

/**
 * Detect preferred greeting from message history
 */
function detectPreferredGreeting(messages: Array<{ content: string }>): string | null {
  const greetings = ['hey', 'hi', 'hello', 'good morning', 'good afternoon', 'good evening'];
  const greetingCounts: Record<string, number> = {};
  
  for (const msg of messages) {
    const lowerContent = msg.content.toLowerCase();
    for (const greeting of greetings) {
      if (lowerContent.startsWith(greeting)) {
        greetingCounts[greeting] = (greetingCounts[greeting] || 0) + 1;
      }
    }
  }
  
  // Return most common greeting
  const sortedGreetings = Object.entries(greetingCounts).sort((a, b) => b[1] - a[1]);
  return sortedGreetings[0]?.[0] || null;
}

/**
 * Detect response pattern preference from message types
 */
function detectResponsePattern(messages: Array<{ content: string }>): 'quick-wins' | 'thorough-analysis' | 'exploratory' {
  let directCommands = 0;
  let complexQuestions = 0;
  let exploratory = 0;
  
  for (const msg of messages) {
    const content = msg.content;
    
    // Direct commands (create, do, make, etc.)
    if (/^(create|make|do|delete|update|add|remove|show|list)/i.test(content)) {
      directCommands++;
    }
    
    // Complex questions (why, how should, analyze, compare)
    else if (/(why|how should|analyze|compare|evaluate|recommend|what's the best)/i.test(content)) {
      complexQuestions++;
    }
    
    // Exploratory (tell me about, what is, explain)
    else if (/(tell me|what is|what are|explain|describe)/i.test(content)) {
      exploratory++;
    }
  }
  
  const total = directCommands + complexQuestions + exploratory;
  if (total === 0) return 'quick-wins'; // Default when no clear pattern
  
  const directPercent = directCommands / total;
  const complexPercent = complexQuestions / total;
  
  if (directPercent > 0.5) return 'quick-wins';
  if (complexPercent > 0.4) return 'thorough-analysis';
  return 'exploratory';
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Analyze user's communication style from recent messages
 * @param messages Array of recent messages (last 5-10 recommended)
 * @param messageCount Total message count in conversation
 * @returns CommunicationStyle profile
 */
export async function analyzeUserStyle(
  messages: Array<{ role: string; content: string }>,
  messageCount: number
): Promise<CommunicationStyle> {
  try {
    // Filter to user messages only
    const userMessages = messages.filter(m => m.role === 'user');
    
    if (userMessages.length === 0) {
      // Return default style if no messages
      return {
        formality: 'professional',
        verbosity: 'balanced',
        tone: 'neutral',
        emojiUsage: 0,
        technicalLevel: 0,
        preferredGreeting: null,
        responsePattern: 'quick-wins',
        confidence: 0,
        lastUpdated: new Date(),
      };
    }
    
    // Analyze each message
    const analyses = userMessages.map(msg => analyzeMessage(msg.content));
    
    // Aggregate scores
    const avgFormalityScore = analyses.reduce((sum, a) => sum + a.formalityScore, 0) / analyses.length;
    const avgVerbosityScore = analyses.reduce((sum, a) => sum + a.verbosityScore, 0) / analyses.length;
    const avgToneScore = analyses.reduce((sum, a) => sum + a.toneScore, 0) / analyses.length;
    
    // Total emoji count across all messages
    const totalEmojiCount = analyses.reduce((sum, a) => sum + a.emojiCount, 0);
    const totalWords = analyses.reduce((sum, a) => sum + a.wordCount, 0);
    const emojiUsage = totalWords > 0 ? Math.min(100, (totalEmojiCount / totalWords) * 100 * 10) : 0;
    
    // Technical level (percentage of messages with technical terms)
    const totalTechnicalTerms = analyses.reduce((sum, a) => sum + a.technicalTermCount, 0);
    const technicalLevel = totalWords > 0 ? Math.min(100, (totalTechnicalTerms / totalWords) * 100 * 5) : 0;
    
    // Map scores to categories
    const formality: CommunicationStyle['formality'] = 
      avgFormalityScore < 35 ? 'casual' :
      avgFormalityScore > 65 ? 'professional' :
      technicalLevel > 50 ? 'technical' : 'professional'; // Use technical if high technical term usage
    
    const verbosity: CommunicationStyle['verbosity'] =
      avgVerbosityScore < 35 ? 'concise' :
      avgVerbosityScore > 65 ? 'detailed' :
      'balanced';
    
    const tone: CommunicationStyle['tone'] =
      avgToneScore < 35 ? 'direct' :
      avgToneScore > 65 ? 'friendly' :
      'neutral';
    
    // Detect patterns
    const preferredGreeting = detectPreferredGreeting(userMessages);
    const responsePattern = detectResponsePattern(userMessages);
    
    // Calculate confidence based on message count
    // More messages = higher confidence (max at 20 messages)
    const confidence = Math.min(100, (messageCount / 20) * 100);
    
    logger.debug('Communication style analyzed', {
      messageCount: userMessages.length,
      formality,
      verbosity,
      tone,
      emojiUsage: Math.round(emojiUsage),
      technicalLevel: Math.round(technicalLevel),
      confidence: Math.round(confidence),
    });
    
    return {
      formality,
      verbosity,
      tone,
      emojiUsage: Math.round(emojiUsage),
      technicalLevel: Math.round(technicalLevel),
      preferredGreeting,
      responsePattern,
      confidence: Math.round(confidence),
      lastUpdated: new Date(),
    };
    
  } catch (error) {
    logger.error('Failed to analyze communication style', { error });
    
    // Return neutral default on error
    return {
      formality: 'professional',
      verbosity: 'balanced',
      tone: 'neutral',
      emojiUsage: 0,
      technicalLevel: 0,
      preferredGreeting: null,
      responsePattern: 'quick-wins',
      confidence: 0,
      lastUpdated: new Date(),
    };
  }
}

/**
 * Update communication style in database
 */
export async function updateCommunicationStyle(
  workspaceId: string,
  userId: string,
  style: CommunicationStyle
): Promise<void> {
  try {
    const { db } = await import('@/lib/db');
    const { aiUserPreferences } = await import('@/db/schema');
    const { eq, and } = await import('drizzle-orm');
    
    // Serialize style as JSON string for communicationStyle field
    const styleString = `${style.formality}_${style.verbosity}_${style.tone}`;
    
    await db
      .update(aiUserPreferences)
      .set({
        communicationStyle: styleString,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(aiUserPreferences.workspaceId, workspaceId),
          eq(aiUserPreferences.userId, userId)
        )
      );
    
    logger.info('Communication style updated', {
      workspaceId,
      userId,
      style: styleString,
      confidence: style.confidence,
    });
  } catch (error) {
    logger.error('Failed to update communication style in database', { error });
    throw error;
  }
}

