import OpenAI from 'openai';
import { API_TIMEOUTS } from '@/lib/utils';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not defined');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: API_TIMEOUTS.AI_PROVIDER, // 60 second timeout for AI calls
});
