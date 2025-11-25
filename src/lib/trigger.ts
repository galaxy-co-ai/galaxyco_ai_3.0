import { TriggerClient } from '@trigger.dev/sdk';

if (!process.env.TRIGGER_SECRET_KEY) {
  console.warn('TRIGGER_SECRET_KEY not configured - background jobs disabled');
}

export const client = process.env.TRIGGER_SECRET_KEY
  ? new TriggerClient({
      id: 'galaxyco-ai',
      apiKey: process.env.TRIGGER_SECRET_KEY,
      apiUrl: process.env.TRIGGER_API_URL,
    })
  : null;

/**
 * Check if Trigger.dev is configured
 */
export function isTriggerConfigured(): boolean {
  return !!process.env.TRIGGER_SECRET_KEY;
}






