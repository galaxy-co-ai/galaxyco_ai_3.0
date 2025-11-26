// Trigger.dev v3 SDK uses a different pattern - configuration is in trigger.config.ts
// This file provides backward-compatible exports for legacy code

import { logger } from '@/lib/logger';

// Check for required environment variable
const TRIGGER_SECRET_KEY = process.env.TRIGGER_SECRET_KEY;

if (!TRIGGER_SECRET_KEY) {
  logger.warn('TRIGGER_SECRET_KEY not configured - background jobs disabled');
}

/**
 * Check if Trigger.dev is configured
 */
export function isTriggerConfigured(): boolean {
  return !!TRIGGER_SECRET_KEY;
}

/**
 * Placeholder client for backward compatibility
 * In Trigger.dev v3, jobs are defined using the new API
 */
export const client = {
  id: 'galaxyco-ai',
  isConfigured: isTriggerConfigured(),
};
