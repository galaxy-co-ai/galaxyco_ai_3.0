import { logger } from './logger';

// Trigger.dev SDK v3 uses a different API - configure in trigger.config.ts
// This file provides helper functions for checking configuration

if (!process.env.TRIGGER_SECRET_KEY) {
  logger.warn('TRIGGER_SECRET_KEY not configured - background jobs disabled');
}

/**
 * Check if Trigger.dev is configured
 */
export function isTriggerConfigured(): boolean {
  return !!process.env.TRIGGER_SECRET_KEY;
}

/**
 * Get Trigger.dev API key
 */
export function getTriggerApiKey(): string | undefined {
  return process.env.TRIGGER_SECRET_KEY;
}

/**
 * Get Trigger.dev API URL
 */
export function getTriggerApiUrl(): string {
  return process.env.TRIGGER_API_URL || 'https://api.trigger.dev';
}
