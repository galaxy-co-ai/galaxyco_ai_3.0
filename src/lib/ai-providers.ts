import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

export type AIProvider = 'openai' | 'anthropic' | 'google';

/**
 * Get OpenAI client instance
 */
export function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Get Anthropic (Claude) client instance
 */
export function getAnthropic() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

/**
 * Get Google Generative AI (Gemini) client instance
 */
export function getGoogleAI() {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY not configured');
  }
  return new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}

/**
 * Get any AI provider by name
 */
export function getAIProvider(provider: AIProvider) {
  switch (provider) {
    case 'openai':
      return getOpenAI();
    case 'anthropic':
      return getAnthropic();
    case 'google':
      return getGoogleAI();
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

/**
 * Check which AI providers are configured
 */
export function getAvailableProviders(): AIProvider[] {
  const providers: AIProvider[] = [];

  if (process.env.OPENAI_API_KEY) providers.push('openai');
  if (process.env.ANTHROPIC_API_KEY) providers.push('anthropic');
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) providers.push('google');

  return providers;
}

/**
 * Generate text completion with any provider
 */
export async function generateCompletion(
  provider: AIProvider,
  prompt: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  const temperature = options?.temperature ?? 0.7;
  const maxTokens = options?.maxTokens ?? 1000;

  switch (provider) {
    case 'openai': {
      const openai = getOpenAI();
      const response = await openai.chat.completions.create({
        model: options?.model || 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
      });
      return response.choices[0]?.message?.content || '';
    }

    case 'anthropic': {
      const anthropic = getAnthropic();
      const response = await anthropic.messages.create({
        model: options?.model || 'claude-3-5-sonnet-20241022',
        max_tokens: maxTokens,
        temperature,
        messages: [{ role: 'user', content: prompt }],
      });
      return response.content[0]?.type === 'text' ? response.content[0].text : '';
    }

    case 'google': {
      const googleAI = getGoogleAI();
      const model = googleAI.getGenerativeModel({
        model: options?.model || 'gemini-pro',
      });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    }

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}


























