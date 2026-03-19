import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { withTimeout, API_TIMEOUTS } from '@/lib/utils';

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'courier' | 'mistral';

// Neptune model defaults
export const COURIER_DEFAULT_MODEL = 'CB_OS_Qwen3.5 35B A3B';
export const MISTRAL_DEFAULT_MODEL = 'mistral-large-latest';

// Neptune complexity tiers
export type NeptuneTier = 'conversational' | 'complex';

/**
 * Get OpenAI client instance
 */
export function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: API_TIMEOUTS.AI_PROVIDER, // 60 second timeout for AI calls
  });
}

/**
 * Get Anthropic (Claude) client instance
 */
export function getAnthropic() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    timeout: API_TIMEOUTS.AI_PROVIDER, // 60 second timeout for AI calls
  });
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
 * Get Courier OSS client instance (OpenAI-compatible, self-hosted inference)
 * Zero-cost LLM backend — runs on our own hardware via Courier OSS.
 */
export function getCourier() {
  const baseURL = process.env.COURIER_BASE_URL;
  const apiKey = process.env.COURIER_API_KEY;

  if (!baseURL || !apiKey) {
    throw new Error('COURIER_BASE_URL and COURIER_API_KEY must be configured');
  }

  return new OpenAI({
    baseURL: baseURL.replace(/\/$/, '') + '/v1',
    apiKey,
    timeout: API_TIMEOUTS.AI_PROVIDER,
  });
}

/**
 * Get Mistral client instance (OpenAI-compatible API).
 * Used for complex reasoning, multi-step analysis, and tool orchestration.
 */
export function getMistral() {
  if (!process.env.MISTRAL_API_KEY) {
    throw new Error('MISTRAL_API_KEY not configured');
  }
  return new OpenAI({
    baseURL: 'https://api.mistral.ai/v1',
    apiKey: process.env.MISTRAL_API_KEY,
    timeout: API_TIMEOUTS.AI_PROVIDER,
  });
}

/**
 * Get the best available LLM client for Neptune, routed by complexity tier.
 *
 * Conversational (80-90%): greetings, status, Q&A, briefings → Courier (free)
 * Complex (10-20%): multi-step reasoning, analysis, business decisions → Mistral Large (cheap)
 *
 * Fallback chain: Courier → Mistral → OpenAI
 */
export function getNeptuneLLM(tier: NeptuneTier = 'conversational'): { client: OpenAI; model: string; provider: string } {
  if (tier === 'complex') {
    // Complex reasoning → Mistral Large (strong, cheap)
    if (process.env.MISTRAL_API_KEY) {
      return { client: getMistral(), model: MISTRAL_DEFAULT_MODEL, provider: 'mistral' };
    }
    // Fallback: try Courier's best model
    if (process.env.COURIER_BASE_URL && process.env.COURIER_API_KEY) {
      return { client: getCourier(), model: 'EXAONE 4.0 32B (8bit)', provider: 'courier' };
    }
  }

  // Conversational → Courier (free, self-hosted)
  if (process.env.COURIER_BASE_URL && process.env.COURIER_API_KEY) {
    return { client: getCourier(), model: COURIER_DEFAULT_MODEL, provider: 'courier' };
  }

  // Fallback: Mistral (cheap)
  if (process.env.MISTRAL_API_KEY) {
    return { client: getMistral(), model: MISTRAL_DEFAULT_MODEL, provider: 'mistral' };
  }

  // Last resort: OpenAI (expensive)
  return { client: getOpenAI(), model: 'gpt-4o', provider: 'openai' };
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
    case 'courier':
      return getCourier();
    case 'mistral':
      return getMistral();
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

/**
 * Check which AI providers are configured
 */
export function getAvailableProviders(): AIProvider[] {
  const providers: AIProvider[] = [];

  if (process.env.COURIER_BASE_URL && process.env.COURIER_API_KEY) providers.push('courier');
  if (process.env.MISTRAL_API_KEY) providers.push('mistral');
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
      // Google AI SDK doesn't support native timeout, so we wrap with withTimeout
      const result = await withTimeout(
        model.generateContent(prompt),
        API_TIMEOUTS.AI_PROVIDER,
        'Google AI generateContent'
      );
      const response = result.response;
      return response.text();
    }

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
