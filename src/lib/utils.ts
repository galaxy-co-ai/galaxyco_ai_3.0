import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Wraps a promise with a timeout
 * Rejects with a timeout error if the promise doesn't resolve within the specified time
 *
 * @param promise - The promise to wrap
 * @param ms - Timeout in milliseconds
 * @param operation - Name of the operation for error messages
 * @returns The resolved value of the promise
 * @throws Error if the operation times out
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  operation: string
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`${operation} timed out after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

// Timeout constants for external API calls (in milliseconds)
export const API_TIMEOUTS = {
  /** AI providers (OpenAI, Anthropic, Google) - 60 seconds */
  AI_PROVIDER: 60000,
  /** Twilio/SignalWire - 10 seconds */
  TELEPHONY: 10000,
  /** General external APIs - 30 seconds */
  GENERAL: 30000,
} as const;

/**
 * Formats phone number to xxx-xxx-xxxx format
 * Accepts any format and converts to standard US phone format
 * Example: "1234567890" -> "123-456-7890"
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '');

  // Limit to 10 digits (US phone number)
  const limitedNumbers = numbers.slice(0, 10);

  // Format based on length
  if (limitedNumbers.length === 0) {
    return '';
  } else if (limitedNumbers.length <= 3) {
    return limitedNumbers;
  } else if (limitedNumbers.length <= 6) {
    return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3)}`;
  } else {
    return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3, 6)}-${limitedNumbers.slice(6)}`;
  }
}
