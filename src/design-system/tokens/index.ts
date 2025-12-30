/**
 * GalaxyCo Design System - Design Tokens
 * Single source of truth for all design decisions translated into data
 * 
 * Inspired by Adobe Spectrum 2's token system:
 * - Spectrum-style naming (context-commonUnit-clarification)
 * - Semantic layers (Global → Alias → Component-specific)
 * - Glass morphism support
 * - Comprehensive type safety
 * 
 * Usage:
 * import { colors, spacing, typography, effects, motion } from '@/design-system/tokens'
 */

// Import all token modules
import colors from './colors';
import spacing from './spacing';
import typography from './typography';
import effects from './effects';
import motion from './motion';

// ============================================================================
// Z-INDEX SCALE
// ============================================================================

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================================================
// RE-EXPORTS
// ============================================================================

export { colors, spacing, typography, effects, motion };

// ============================================================================
// COMBINED TOKENS EXPORT
// ============================================================================

export const tokens = {
  colors,
  spacing,
  typography,
  effects,
  motion,
  zIndex,
  breakpoints,
} as const;

export default tokens;
