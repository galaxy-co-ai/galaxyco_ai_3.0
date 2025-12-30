/**
 * GalaxyCo Design System - Spacing Tokens
 * 
 * Naming convention (Spectrum-style):
 * - spacing-[value] for global spacing
 * - [component]-[commonUnit]-[clarification] for component-specific
 */

// ============================================================================
// GLOBAL SPACING SCALE
// ============================================================================

export const globalSpacing = {
  'spacing-0': '0',
  'spacing-25': '0.125rem',  // 2px
  'spacing-50': '0.25rem',   // 4px
  'spacing-75': '0.375rem',  // 6px
  'spacing-100': '0.5rem',   // 8px
  'spacing-150': '0.75rem',  // 12px
  'spacing-200': '1rem',     // 16px
  'spacing-300': '1.5rem',   // 24px
  'spacing-400': '2rem',     // 32px
  'spacing-500': '2.5rem',   // 40px
  'spacing-600': '3rem',     // 48px
  'spacing-700': '4rem',     // 64px
  'spacing-800': '5rem',     // 80px
  'spacing-900': '6rem',     // 96px
  'spacing-1000': '8rem',    // 128px
} as const;

// ============================================================================
// COMPONENT HEIGHT TOKENS
// ============================================================================

export const componentHeight = {
  // Small components
  'component-height-75': '2rem',    // 32px - Small
  'component-height-100': '2.25rem', // 36px - Default/Medium
  'component-height-200': '2.5rem',  // 40px - Large
  'component-height-300': '3rem',    // 48px - Extra Large
  
  // Compact heights (for dense UIs)
  'component-height-compact-75': '1.75rem',  // 28px
  'component-height-compact-100': '2rem',    // 32px
} as const;

// ============================================================================
// COMPONENT EDGE SPACING (padding/insets)
// ============================================================================

export const componentEdge = {
  // Button edge-to-text spacing
  'button-edge-to-text-75': '0.75rem',   // 12px
  'button-edge-to-text-100': '1rem',     // 16px
  'button-edge-to-text-200': '1.5rem',   // 24px
  'button-edge-to-text-300': '2rem',     // 32px
  
  // Input edge-to-text spacing
  'input-edge-to-text-75': '0.5rem',     // 8px
  'input-edge-to-text-100': '0.75rem',   // 12px
  'input-edge-to-text-200': '1rem',      // 16px
  
  // Card padding
  'card-padding-100': '1rem',            // 16px
  'card-padding-200': '1.5rem',          // 24px
  'card-padding-300': '2rem',            // 32px
  
  // Dialog/Modal padding
  'dialog-padding-100': '1.5rem',        // 24px
  'dialog-padding-200': '2rem',          // 32px
} as const;

// ============================================================================
// GAP/STACK SPACING
// ============================================================================

export const stackSpacing = {
  // Component internal gaps
  'stack-gap-50': '0.25rem',    // 4px - Tight
  'stack-gap-100': '0.5rem',    // 8px - Compact
  'stack-gap-200': '1rem',      // 16px - Default
  'stack-gap-300': '1.5rem',    // 24px - Comfortable
  'stack-gap-400': '2rem',      // 32px - Spacious
  
  // Section gaps
  'section-gap-100': '2rem',    // 32px
  'section-gap-200': '3rem',    // 48px
  'section-gap-300': '4rem',    // 64px
} as const;

// ============================================================================
// LAYOUT SPACING
// ============================================================================

export const layoutSpacing = {
  // Page margins
  'page-margin-mobile': '1rem',         // 16px
  'page-margin-tablet': '2rem',         // 32px
  'page-margin-desktop': '3rem',        // 48px
  
  // Container max-widths
  'container-max-width-sm': '640px',
  'container-max-width-md': '768px',
  'container-max-width-lg': '1024px',
  'container-max-width-xl': '1280px',
  'container-max-width-2xl': '1536px',
  
  // Grid gaps
  'grid-gap-100': '1rem',               // 16px
  'grid-gap-200': '1.5rem',             // 24px
  'grid-gap-300': '2rem',               // 32px
} as const;

// ============================================================================
// EXPORTS
// ============================================================================

export const spacing = {
  global: globalSpacing,
  componentHeight,
  componentEdge,
  stack: stackSpacing,
  layout: layoutSpacing,
} as const;

export default spacing;
