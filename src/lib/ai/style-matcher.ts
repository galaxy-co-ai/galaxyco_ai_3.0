/**
 * Style Matching Engine
 * Phase 2A - Neptune Transformation
 * 
 * Generates style-specific system prompt additions based on detected
 * communication style. Adapts Neptune's response style to match the user.
 */

import type { CommunicationStyle } from './communication-analyzer';
import { logger } from '@/lib/logger';

// ============================================================================
// PROMPT GENERATION
// ============================================================================

/**
 * Generate style-specific instructions for system prompt
 * @param style The detected communication style
 * @returns Prompt instructions that adapt Neptune's communication
 */
export function generateStylePrompt(style: CommunicationStyle): string {
  const sections: string[] = [];
  
  // Only apply if confidence is reasonable
  if (style.confidence < 30) {
    return ''; // Not enough data to adapt style yet
  }
  
  sections.push('## ADAPTIVE COMMUNICATION STYLE\n');
  sections.push('Match the user\'s communication style based on their detected preferences:\n');
  
  // Formality level
  switch (style.formality) {
    case 'casual':
      sections.push('**Formality:** Casual and conversational');
      sections.push('- Use contractions (it\'s, you\'re, let\'s)');
      sections.push('- Skip formal language and pleasantries');
      sections.push('- Use conversational phrases like "hey", "got it", "cool"');
      sections.push('- Be friendly and approachable');
      break;
      
    case 'professional':
      sections.push('**Formality:** Professional and polished');
      sections.push('- Use complete sentences and proper grammar');
      sections.push('- Avoid slang and overly casual language');
      sections.push('- Maintain a respectful, courteous tone');
      sections.push('- Use "please" and "thank you" appropriately');
      break;
      
    case 'technical':
      sections.push('**Formality:** Technical and precise');
      sections.push('- Use industry terminology and technical terms');
      sections.push('- Be specific about implementation details');
      sections.push('- Reference standards, patterns, and best practices');
      sections.push('- Assume technical knowledge');
      break;
  }
  
  sections.push('');
  
  // Verbosity preference
  switch (style.verbosity) {
    case 'concise':
      sections.push('**Verbosity:** Short and to the point');
      sections.push('- Keep responses to 1-2 sentences when possible');
      sections.push('- Use bullet points instead of paragraphs');
      sections.push('- Skip explanations unless asked');
      sections.push('- Get straight to the answer or action');
      break;
      
    case 'balanced':
      sections.push('**Verbosity:** Balanced detail level');
      sections.push('- Provide 2-3 sentences with key context');
      sections.push('- Use a mix of bullets and short paragraphs');
      sections.push('- Include brief explanations when helpful');
      sections.push('- Strike a balance between brevity and completeness');
      break;
      
    case 'detailed':
      sections.push('**Verbosity:** Thorough and comprehensive');
      sections.push('- Provide detailed explanations and context');
      sections.push('- Include examples and step-by-step guidance');
      sections.push('- Explain the "why" behind recommendations');
      sections.push('- Be comprehensive and leave no ambiguity');
      break;
  }
  
  sections.push('');
  
  // Tone preference
  switch (style.tone) {
    case 'friendly':
      sections.push('**Tone:** Warm and encouraging');
      sections.push('- Use positive, uplifting language');
      sections.push('- Celebrate wins and progress');
      sections.push('- Show enthusiasm with language (not just emojis)');
      sections.push('- Be supportive and reassuring');
      break;
      
    case 'neutral':
      sections.push('**Tone:** Neutral and factual');
      sections.push('- Stick to facts and objective information');
      sections.push('- Avoid overly enthusiastic or emotional language');
      sections.push('- Be helpful without being effusive');
      sections.push('- Keep a professional, measured tone');
      break;
      
    case 'direct':
      sections.push('**Tone:** Direct and action-oriented');
      sections.push('- Cut to the chase, no fluff');
      sections.push('- Lead with the action or answer');
      sections.push('- Use imperative statements when appropriate');
      sections.push('- Skip softening language ("maybe", "might")');
      break;
  }
  
  sections.push('');
  
  // Emoji usage
  if (style.emojiUsage > 30) {
    sections.push('**Emojis:** Use occasionally to match user\'s style');
    sections.push('- Add 1-2 relevant emojis per response');
    sections.push('- Use for emphasis or to convey tone');
    sections.push('- Choose emojis that fit the context');
  } else if (style.emojiUsage > 10) {
    sections.push('**Emojis:** Use sparingly when it adds value');
    sections.push('- Limit to 0-1 emoji per response');
    sections.push('- Only use for specific emphasis');
  } else {
    sections.push('**Emojis:** Avoid using emojis');
    sections.push('- User prefers text-only communication');
    sections.push('- Skip emojis entirely');
  }
  
  sections.push('');
  
  // Technical level
  if (style.technicalLevel > 60) {
    sections.push('**Technical Level:** High - assume technical expertise');
    sections.push('- Use technical jargon and industry terms freely');
    sections.push('- Reference implementation details');
    sections.push('- Skip basic explanations');
  } else if (style.technicalLevel > 30) {
    sections.push('**Technical Level:** Moderate - balance accessibility and precision');
    sections.push('- Use technical terms but explain when needed');
    sections.push('- Provide context for complex concepts');
  } else {
    sections.push('**Technical Level:** Low - keep it accessible');
    sections.push('- Avoid jargon, use plain language');
    sections.push('- Explain technical concepts in simple terms');
    sections.push('- Use analogies and examples');
  }
  
  sections.push('');
  
  // Response pattern
  switch (style.responsePattern) {
    case 'quick-wins':
      sections.push('**Response Pattern:** Action-oriented quick wins');
      sections.push('- Lead with what you\'ll do or have done');
      sections.push('- Focus on immediate, actionable next steps');
      sections.push('- Skip lengthy context unless requested');
      break;
      
    case 'thorough-analysis':
      sections.push('**Response Pattern:** In-depth analysis and reasoning');
      sections.push('- Provide analysis and consider trade-offs');
      sections.push('- Explain reasoning behind recommendations');
      sections.push('- Include multiple perspectives when relevant');
      break;
      
    case 'exploratory':
      sections.push('**Response Pattern:** Exploratory and informative');
      sections.push('- Provide educational context and background');
      sections.push('- Explain concepts and how things work');
      sections.push('- Encourage learning and understanding');
      break;
  }
  
  // Preferred greeting (if detected)
  if (style.preferredGreeting) {
    sections.push('');
    sections.push(`**Greeting:** Use "${style.preferredGreeting}" when greeting this user`);
  }
  
  sections.push('');
  sections.push(`*Style confidence: ${style.confidence}% | Last updated: ${style.lastUpdated.toLocaleDateString()}*`);
  
  return sections.join('\n');
}

/**
 * Post-process GPT response to better match target style
 * Note: This is optional secondary processing. Primary adaptation happens via prompt.
 * @param response The GPT-generated response
 * @param targetStyle The target communication style
 * @returns Adjusted response
 */
export function adaptResponseTone(
  response: string,
  targetStyle: CommunicationStyle
): string {
  try {
    let adapted = response;
    
    // For concise users, aggressively trim verbose responses
    if (targetStyle.verbosity === 'concise') {
      // Remove excessive line breaks (more than 2 in a row)
      adapted = adapted.replace(/\n{3,}/g, '\n\n');
      
      // Shorten common verbose phrases
      adapted = adapted.replace(/I would be happy to help you with/gi, 'I can help with');
      adapted = adapted.replace(/Let me assist you with/gi, 'I\'ll help with');
      adapted = adapted.replace(/I understand that you would like/gi, 'I\'ll');
    }
    
    // For direct users, remove hedging language
    if (targetStyle.tone === 'direct') {
      adapted = adapted.replace(/\bmight\b/gi, 'will');
      adapted = adapted.replace(/\bcould\b/gi, 'can');
      adapted = adapted.replace(/\bperhaps\b/gi, '');
      adapted = adapted.replace(/\bmaybe\b/gi, '');
      adapted = adapted.replace(/I think /gi, '');
    }
    
    // For casual users, make contractions
    if (targetStyle.formality === 'casual') {
      adapted = adapted.replace(/\bI am\b/g, 'I\'m');
      adapted = adapted.replace(/\byou are\b/g, 'you\'re');
      adapted = adapted.replace(/\bwe are\b/g, 'we\'re');
      adapted = adapted.replace(/\bit is\b/g, 'it\'s');
      adapted = adapted.replace(/\bthat is\b/g, 'that\'s');
      adapted = adapted.replace(/\bwill not\b/g, 'won\'t');
      adapted = adapted.replace(/\bcannot\b/g, 'can\'t');
      adapted = adapted.replace(/\bdo not\b/g, 'don\'t');
    }
    
    // Remove emojis if user doesn't use them
    if (targetStyle.emojiUsage < 5) {
      adapted = adapted.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    }
    
    return adapted.trim();
    
  } catch (error) {
    logger.error('Failed to adapt response tone', { error });
    return response; // Return original on error
  }
}

/**
 * Get a quick style summary for logging/debugging
 */
export function getStyleSummary(style: CommunicationStyle): string {
  return `${style.formality}/${style.verbosity}/${style.tone} | Emojis: ${style.emojiUsage}% | Tech: ${style.technicalLevel}% | Pattern: ${style.responsePattern} | Confidence: ${style.confidence}%`;
}

