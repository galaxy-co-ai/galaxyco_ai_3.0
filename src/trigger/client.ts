import { TriggerClient } from '@trigger.dev/sdk';

if (!process.env.TRIGGER_SECRET_KEY) {
  throw new Error('TRIGGER_SECRET_KEY environment variable is required');
}

export const client = new TriggerClient({
  id: 'galaxyco-ai',
  apiKey: process.env.TRIGGER_SECRET_KEY,
  apiUrl: process.env.TRIGGER_API_URL,
});

// Export job types for easy reference
export type { Job } from '@trigger.dev/sdk';






