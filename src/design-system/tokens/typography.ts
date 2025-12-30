/**
 * GalaxyCo Design System - Typography Tokens
 * 
 * Font families, sizes, weights, line heights, and letter spacing
 */

// ============================================================================
// FONT FAMILIES
// ============================================================================

export const fontFamily = {
  'font-family-heading': "'Space Grotesk', var(--font-space-grotesk), sans-serif",
  'font-family-body': "'Inter', var(--font-inter), sans-serif",
  'font-family-mono': "'Geist Mono', var(--font-geist-mono), monospace",
} as const;

// ============================================================================
// FONT SIZES
// ============================================================================

export const fontSize = {
  'font-size-50': '0.625rem',    // 10px
  'font-size-75': '0.75rem',     // 12px
  'font-size-100': '0.875rem',   // 14px - Default
  'font-size-200': '1rem',       // 16px
  'font-size-300': '1.125rem',   // 18px
  'font-size-400': '1.25rem',    // 20px
  'font-size-500': '1.5rem',     // 24px
  'font-size-600': '1.875rem',   // 30px
  'font-size-700': '2.25rem',    // 36px
  'font-size-800': '3rem',       // 48px
  'font-size-900': '3.75rem',    // 60px
  'font-size-1000': '4.5rem',    // 72px
} as const;

// ============================================================================
// FONT WEIGHTS
// ============================================================================

export const fontWeight = {
  'font-weight-light': '300',
  'font-weight-normal': '400',
  'font-weight-medium': '500',
  'font-weight-semibold': '600',
  'font-weight-bold': '700',
  'font-weight-extrabold': '800',
} as const;

// ============================================================================
// LINE HEIGHTS
// ============================================================================

export const lineHeight = {
  'line-height-tight': '1.25',
  'line-height-snug': '1.375',
  'line-height-normal': '1.5',
  'line-height-relaxed': '1.625',
  'line-height-loose': '1.75',
} as const;

// ============================================================================
// LETTER SPACING
// ============================================================================

export const letterSpacing = {
  'letter-spacing-tighter': '-0.05em',
  'letter-spacing-tight': '-0.025em',
  'letter-spacing-normal': '0',
  'letter-spacing-wide': '0.025em',
  'letter-spacing-wider': '0.05em',
  'letter-spacing-widest': '0.1em',
  'letter-spacing-brand': '0.25em',  // For branded titles
} as const;

// ============================================================================
// TYPE SCALE (combined font size + line height)
// ============================================================================

export const typeScale = {
  // Body text
  'body-xs': {
    fontSize: fontSize['font-size-75'],
    lineHeight: lineHeight['line-height-normal'],
    fontWeight: fontWeight['font-weight-normal'],
  },
  'body-sm': {
    fontSize: fontSize['font-size-100'],
    lineHeight: lineHeight['line-height-normal'],
    fontWeight: fontWeight['font-weight-normal'],
  },
  'body-md': {
    fontSize: fontSize['font-size-200'],
    lineHeight: lineHeight['line-height-relaxed'],
    fontWeight: fontWeight['font-weight-normal'],
  },
  'body-lg': {
    fontSize: fontSize['font-size-300'],
    lineHeight: lineHeight['line-height-relaxed'],
    fontWeight: fontWeight['font-weight-normal'],
  },
  
  // Headings
  'heading-xs': {
    fontSize: fontSize['font-size-300'],
    lineHeight: lineHeight['line-height-tight'],
    fontWeight: fontWeight['font-weight-semibold'],
    fontFamily: fontFamily['font-family-heading'],
  },
  'heading-sm': {
    fontSize: fontSize['font-size-400'],
    lineHeight: lineHeight['line-height-tight'],
    fontWeight: fontWeight['font-weight-semibold'],
    fontFamily: fontFamily['font-family-heading'],
  },
  'heading-md': {
    fontSize: fontSize['font-size-500'],
    lineHeight: lineHeight['line-height-tight'],
    fontWeight: fontWeight['font-weight-bold'],
    fontFamily: fontFamily['font-family-heading'],
  },
  'heading-lg': {
    fontSize: fontSize['font-size-600'],
    lineHeight: lineHeight['line-height-tight'],
    fontWeight: fontWeight['font-weight-bold'],
    fontFamily: fontFamily['font-family-heading'],
  },
  'heading-xl': {
    fontSize: fontSize['font-size-700'],
    lineHeight: lineHeight['line-height-tight'],
    fontWeight: fontWeight['font-weight-bold'],
    fontFamily: fontFamily['font-family-heading'],
  },
  'heading-2xl': {
    fontSize: fontSize['font-size-800'],
    lineHeight: lineHeight['line-height-tight'],
    fontWeight: fontWeight['font-weight-bold'],
    fontFamily: fontFamily['font-family-heading'],
  },
  
  // Display text
  'display-sm': {
    fontSize: fontSize['font-size-700'],
    lineHeight: lineHeight['line-height-tight'],
    fontWeight: fontWeight['font-weight-extrabold'],
    fontFamily: fontFamily['font-family-heading'],
  },
  'display-md': {
    fontSize: fontSize['font-size-800'],
    lineHeight: lineHeight['line-height-tight'],
    fontWeight: fontWeight['font-weight-extrabold'],
    fontFamily: fontFamily['font-family-heading'],
  },
  'display-lg': {
    fontSize: fontSize['font-size-900'],
    lineHeight: lineHeight['line-height-tight'],
    fontWeight: fontWeight['font-weight-extrabold'],
    fontFamily: fontFamily['font-family-heading'],
  },
  
  // Labels/UI text
  'label-sm': {
    fontSize: fontSize['font-size-75'],
    lineHeight: lineHeight['line-height-normal'],
    fontWeight: fontWeight['font-weight-medium'],
  },
  'label-md': {
    fontSize: fontSize['font-size-100'],
    lineHeight: lineHeight['line-height-normal'],
    fontWeight: fontWeight['font-weight-medium'],
  },
  'label-lg': {
    fontSize: fontSize['font-size-200'],
    lineHeight: lineHeight['line-height-normal'],
    fontWeight: fontWeight['font-weight-medium'],
  },
  
  // Code/monospace
  'code-sm': {
    fontSize: fontSize['font-size-75'],
    lineHeight: lineHeight['line-height-normal'],
    fontFamily: fontFamily['font-family-mono'],
  },
  'code-md': {
    fontSize: fontSize['font-size-100'],
    lineHeight: lineHeight['line-height-normal'],
    fontFamily: fontFamily['font-family-mono'],
  },
} as const;

// ============================================================================
// EXPORTS
// ============================================================================

export const typography = {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  typeScale,
} as const;

export default typography;
