/**
 * Accessibility Utilities
 *
 * Helpers for:
 * - Keyboard navigation
 * - ARIA attributes
 * - Focus management
 * - Screen reader support
 * - Color contrast
 */

import { useEffect, useRef, useCallback } from 'react';

// ============================================================================
// Keyboard Navigation
// ============================================================================

/**
 * Hook for handling keyboard navigation in lists
 * Supports arrow keys, home, end, enter, and escape
 */
export function useKeyboardNavigation<T extends HTMLElement>({
  itemCount,
  onSelect,
  onEscape,
  orientation = 'vertical',
  loop = true,
}: {
  itemCount: number;
  onSelect?: (index: number) => void;
  onEscape?: () => void;
  orientation?: 'vertical' | 'horizontal';
  loop?: boolean;
}) {
  const currentIndex = useRef(0);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<T>) => {
      const isVertical = orientation === 'vertical';
      const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';
      const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft';

      switch (e.key) {
        case nextKey:
          e.preventDefault();
          if (currentIndex.current < itemCount - 1) {
            currentIndex.current++;
          } else if (loop) {
            currentIndex.current = 0;
          }
          break;

        case prevKey:
          e.preventDefault();
          if (currentIndex.current > 0) {
            currentIndex.current--;
          } else if (loop) {
            currentIndex.current = itemCount - 1;
          }
          break;

        case 'Home':
          e.preventDefault();
          currentIndex.current = 0;
          break;

        case 'End':
          e.preventDefault();
          currentIndex.current = itemCount - 1;
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          onSelect?.(currentIndex.current);
          break;

        case 'Escape':
          e.preventDefault();
          onEscape?.();
          break;

        default:
          return;
      }
    },
    [itemCount, onSelect, onEscape, orientation, loop]
  );

  // Ref access in return is intentional - avoids re-renders during keyboard nav
  // eslint-disable-next-line react-hooks/refs
  return { currentIndex: currentIndex.current, handleKeyDown };
}

/**
 * Hook for trapping focus within a container (for modals/dialogs)
 */
export function useFocusTrap<T extends HTMLElement>(isActive: boolean = true) {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Focus first element on mount
    firstElement?.focus();

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return containerRef;
}

/**
 * Hook for restoring focus when a component unmounts
 */
export function useRestoreFocus() {
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousActiveElement.current = document.activeElement as HTMLElement;

    return () => {
      previousActiveElement.current?.focus();
    };
  }, []);
}

// ============================================================================
// ARIA Utilities
// ============================================================================

/**
 * Generate unique IDs for ARIA labels
 */
let idCounter = 0;
export function useUniqueId(prefix: string = 'id'): string {
  const id = useRef<string | undefined>(undefined);

  if (!id.current) {
    idCounter++;
    id.current = `${prefix}-${idCounter}`;
  }

  return id.current;
}

/**
 * Get ARIA attributes for a button
 */
export function getButtonAriaProps(props: {
  label: string;
  expanded?: boolean;
  pressed?: boolean;
  disabled?: boolean;
  describedBy?: string;
}) {
  return {
    'aria-label': props.label,
    'aria-expanded': props.expanded,
    'aria-pressed': props.pressed,
    'aria-disabled': props.disabled,
    'aria-describedby': props.describedBy,
  };
}

/**
 * Get ARIA attributes for a dialog
 */
export function getDialogAriaProps(props: {
  labelId: string;
  descriptionId?: string;
  modal?: boolean;
}) {
  return {
    role: 'dialog',
    'aria-modal': props.modal ?? true,
    'aria-labelledby': props.labelId,
    'aria-describedby': props.descriptionId,
  };
}

/**
 * Get ARIA attributes for a combobox
 */
export function getComboboxAriaProps(props: {
  expanded: boolean;
  listId: string;
  activeDescendant?: string;
}) {
  return {
    role: 'combobox',
    'aria-expanded': props.expanded,
    'aria-controls': props.listId,
    'aria-activedescendant': props.activeDescendant,
    'aria-autocomplete': 'list' as const,
  };
}

// ============================================================================
// Focus Management
// ============================================================================

/**
 * Set focus to an element with optional delay
 */
export function setFocus(element: HTMLElement | null, delay: number = 0) {
  if (!element) return;

  if (delay > 0) {
    setTimeout(() => element.focus(), delay);
  } else {
    element.focus();
  }
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => !el.hasAttribute('disabled'));
}

/**
 * Hook to announce messages to screen readers
 */
export function useAnnouncer() {
  const announcerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create live region if it doesn't exist
    if (!announcerRef.current) {
      const announcer = document.createElement('div');
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.style.position = 'absolute';
      announcer.style.left = '-10000px';
      announcer.style.width = '1px';
      announcer.style.height = '1px';
      announcer.style.overflow = 'hidden';
      document.body.appendChild(announcer);
      announcerRef.current = announcer;
    }

    return () => {
      if (announcerRef.current) {
        document.body.removeChild(announcerRef.current);
        announcerRef.current = null;
      }
    };
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announcerRef.current) {
      announcerRef.current.setAttribute('aria-live', priority);
      announcerRef.current.textContent = message;
    }
  }, []);

  return announce;
}

// ============================================================================
// Color Contrast
// ============================================================================

/**
 * Calculate relative luminance of a color (WCAG 2.0)
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors (WCAG 2.0)
 */
export function getContrastRatio(color1: string, color2: string): number {
  // Simple RGB parsing (hex format)
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 1;

  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Check if contrast ratio meets WCAG standards
 */
export function meetsContrastStandard(
  color1: string,
  color2: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(color1, color2);
  const minimumRatio = level === 'AAA' ? (isLargeText ? 4.5 : 7) : isLargeText ? 3 : 4.5;

  return ratio >= minimumRatio;
}

// ============================================================================
// Skip Links
// ============================================================================

/**
 * Component props for skip link
 */
export interface SkipLinkProps {
  href: string;
  label: string;
}

/**
 * Generate skip link data for navigation
 */
export function getSkipLinks(): SkipLinkProps[] {
  return [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#navigation', label: 'Skip to navigation' },
    { href: '#footer', label: 'Skip to footer' },
  ];
}

// ============================================================================
// Reduced Motion
// ============================================================================

/**
 * Hook to detect if user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  const query = '(prefers-reduced-motion: reduce)';
  const mediaQuery = typeof window !== 'undefined' ? window.matchMedia(query) : null;

  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(
    mediaQuery?.matches ?? false
  );

  useEffect(() => {
    if (!mediaQuery) return;

    const handleChange = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mediaQuery]);

  return prefersReducedMotion;
}

// Need React import for useState
import React from 'react';
