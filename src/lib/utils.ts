import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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