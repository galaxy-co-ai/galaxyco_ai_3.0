import { describe, it, expect } from 'vitest';
import { cn, formatPhoneNumber } from '@/lib/utils';

describe('cn utility', () => {
  it('should merge class names', () => {
    const result = cn('px-4', 'py-2');
    expect(result).toContain('px-4');
    expect(result).toContain('py-2');
  });

  it('should handle conditional classes', () => {
    const result = cn('base-class', true && 'conditional-class', false && 'hidden-class');
    expect(result).toContain('base-class');
    expect(result).toContain('conditional-class');
    expect(result).not.toContain('hidden-class');
  });

  it('should merge Tailwind conflicts correctly', () => {
    const result = cn('px-4', 'px-8');
    // Should keep the last px value
    expect(result).toContain('px-8');
  });

  it('should handle undefined and null', () => {
    const result = cn('base', undefined, null, 'final');
    expect(result).toContain('base');
    expect(result).toContain('final');
  });
});

describe('formatPhoneNumber', () => {
  it('should format US phone number', () => {
    const result = formatPhoneNumber('5551234567');
    expect(result).toBe('555-123-4567');
  });

  it('should handle already formatted numbers', () => {
    const result = formatPhoneNumber('555-123-4567');
    expect(result).toBe('555-123-4567');
  });

  it('should handle numbers with country code', () => {
    const result = formatPhoneNumber('+15551234567');
    // Takes first 10 digits: 1555123456 -> 155-512-3456
    expect(result).toBe('155-512-3456');
  });

  it('should handle partial numbers', () => {
    const result = formatPhoneNumber('555');
    expect(result).toBe('555');
  });

  it('should handle empty string', () => {
    const result = formatPhoneNumber('');
    expect(result).toBe('');
  });

  it('should remove non-numeric characters', () => {
    const result = formatPhoneNumber('(555) 123-4567');
    expect(result).toBe('555-123-4567');
  });
});

