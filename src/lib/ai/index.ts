/**
 * AI Module - GalaxyCo.ai Intelligent Assistant
 * 
 * This module provides the core AI capabilities for the platform:
 * - Tool execution for taking actions on behalf of users
 * - Context gathering for deep awareness of user and business state
 * - System prompt generation for personable, contextual responses
 * - Memory and learning for improving over time
 * 
 * @module @/lib/ai
 */

// Tool system - execute actions
export {
  aiTools,
  executeTool,
  getToolsForCapability,
  toolsByCategory,
  type ToolContext,
  type ToolResult,
} from './tools';

// Context gathering - understand the user
export {
  gatherAIContext,
  getQuickContext,
  type AIContextData,
  type UserContext,
  type CRMContext,
  type CalendarContext,
  type TaskContext,
} from './context';

// System prompt generation - personable responses
export {
  generateSystemPrompt,
  generateGreeting,
} from './system-prompt';

// Memory and learning - improve over time
export {
  analyzeConversationForLearning,
  updateUserPreferencesFromInsights,
  recordCorrection,
  trackFrequentQuestion,
  recordMessageFeedback,
  summarizeConversation,
  processRecentConversationsForLearning,
  getRelevantHistory,
  type LearningInsight,
} from './memory';

