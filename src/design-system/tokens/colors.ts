/**
 * GalaxyCo Design System - Color Tokens
 * 
 * Naming convention (Spectrum-style):
 * [context]-[commonUnit]-[clarification]
 * 
 * Examples:
 * - nebula-teal-900 (context: nebula-teal, clarification: 900 value)
 * - accent-background-color-default (context: accent, commonUnit: background-color, clarification: default)
 */

// ============================================================================
// FOUNDATION COLORS - Global tokens (raw values)
// ============================================================================

export const foundationColors = {
  // Nebula foundation
  'nebula-void': '#0A0A0F',
  'nebula-deep': '#13111C',
  'nebula-dark': '#1A1625',
  'nebula-frost': '#F0F0F5',
  
  // Nebula accent palette (muted & sophisticated)
  'nebula-teal-900': '#5B8A8A',
  'nebula-teal-800': '#6A9999',
  'nebula-teal-700': '#79A8A8',
  'nebula-teal-600': '#88B7B7',
  'nebula-teal-500': '#97C6C6',
  'nebula-teal-400': '#A6D5D5',
  'nebula-teal-300': '#B5E4E4',
  'nebula-teal-200': '#C4F3F3',
  'nebula-teal-100': '#D3FFFF',
  
  'nebula-violet-900': '#7C6B9E',
  'nebula-violet-800': '#8B7AAD',
  'nebula-violet-700': '#9A89BC',
  'nebula-violet-600': '#A998CB',
  'nebula-violet-500': '#B8A7DA',
  'nebula-violet-400': '#C7B6E9',
  'nebula-violet-300': '#D6C5F8',
  'nebula-violet-200': '#E5D4FF',
  'nebula-violet-100': '#F4E3FF',
  
  'nebula-rose-900': '#9E7B8A',
  'nebula-rose-800': '#AD8A99',
  'nebula-rose-700': '#BC99A8',
  'nebula-rose-600': '#CBA8B7',
  'nebula-rose-500': '#DAB7C6',
  'nebula-rose-400': '#E9C6D5',
  'nebula-rose-300': '#F8D5E4',
  'nebula-rose-200': '#FFE4F3',
  'nebula-rose-100': '#FFF3FF',
  
  'nebula-blue-900': '#5A6B8A',
  'nebula-blue-800': '#697A99',
  'nebula-blue-700': '#7889A8',
  'nebula-blue-600': '#8798B7',
  'nebula-blue-500': '#96A7C6',
  'nebula-blue-400': '#A5B6D5',
  'nebula-blue-300': '#B4C5E4',
  'nebula-blue-200': '#C3D4F3',
  'nebula-blue-100': '#D2E3FF',
  
  // Grayscale
  'gray-900': '#1A1A1F',
  'gray-800': '#2A2A2F',
  'gray-700': '#3A3A3F',
  'gray-600': '#4A4A4F',
  'gray-500': '#717182',
  'gray-400': '#9191A2',
  'gray-300': '#B1B1C2',
  'gray-200': '#D1D1E2',
  'gray-100': '#F1F1F2',
  
  // Semantic colors
  'semantic-success': '#34C759',
  'semantic-warning': '#FF9500',
  'semantic-error': '#FF3B30',
  'semantic-info': '#5B8A8A',
} as const;

// ============================================================================
// ALIAS TOKENS - Semantic color mappings
// ============================================================================

export const aliasColors = {
  // Background colors
  'background-color-default': 'var(--background)',
  'background-color-elevated': 'var(--card)',
  'background-color-overlay': 'rgba(10, 10, 15, 0.8)',
  
  // Foreground colors  
  'foreground-color-default': 'var(--foreground)',
  'foreground-color-muted': 'var(--muted-foreground)',
  'foreground-color-inverse': 'var(--background)',
  
  // Accent colors (primary interactive color)
  'accent-background-color-default': 'var(--primary)',
  'accent-background-color-hover': 'var(--primary)/90',
  'accent-background-color-active': 'var(--primary)/80',
  'accent-foreground-color-default': 'var(--primary-foreground)',
  'accent-border-color-default': 'var(--accent-cyan-border)',
  'accent-visual-color': 'var(--accent-cyan)',
  
  // Secondary colors
  'secondary-background-color-default': 'var(--secondary)',
  'secondary-background-color-hover': 'var(--secondary)/80',
  'secondary-foreground-color-default': 'var(--secondary-foreground)',
  
  // Muted/subtle colors
  'muted-background-color-default': 'var(--muted)',
  'muted-background-color-hover': 'var(--muted)/80',
  'muted-foreground-color-default': 'var(--muted-foreground)',
  
  // Destructive colors
  'destructive-background-color-default': 'var(--destructive)',
  'destructive-background-color-hover': 'var(--destructive)/90',
  'destructive-foreground-color-default': 'var(--destructive-foreground)',
  'destructive-border-color-default': 'var(--destructive)',
  
  // Border colors
  'border-color-default': 'var(--border)',
  'border-color-hover': 'var(--border)/60',
  'border-color-focus': 'var(--ring)',
  
  // Status colors
  'status-success-color': 'var(--status-success)',
  'status-warning-color': 'var(--status-warning)',
  'status-error-color': 'var(--status-error)',
  'status-info-color': 'var(--status-info)',
} as const;

// ============================================================================
// GLASS MORPHISM TOKENS
// ============================================================================

export const glassColors = {
  // Glass backgrounds (backdrop-blur + opacity)
  'glass-background-light': 'rgba(255, 255, 255, 0.7)',
  'glass-background-medium': 'rgba(255, 255, 255, 0.5)',
  'glass-background-heavy': 'rgba(255, 255, 255, 0.3)',
  
  'glass-background-dark-light': 'rgba(19, 17, 28, 0.7)',
  'glass-background-dark-medium': 'rgba(19, 17, 28, 0.5)',
  'glass-background-dark-heavy': 'rgba(19, 17, 28, 0.3)',
  
  // Glass borders
  'glass-border-light': 'rgba(255, 255, 255, 0.2)',
  'glass-border-medium': 'rgba(255, 255, 255, 0.3)',
  'glass-border-dark': 'rgba(0, 0, 0, 0.1)',
  
  // Glass overlays
  'glass-overlay-light': 'rgba(240, 240, 245, 0.9)',
  'glass-overlay-medium': 'rgba(240, 240, 245, 0.95)',
  'glass-overlay-dark': 'rgba(10, 10, 15, 0.9)',
} as const;

// ============================================================================
// COMPONENT-SPECIFIC COLOR TOKENS
// ============================================================================

export const componentColors = {
  // Button
  'button-background-color-default': 'var(--primary)',
  'button-background-color-hover': 'var(--primary)/90',
  'button-foreground-color-default': 'var(--primary-foreground)',
  'button-border-color-default': 'var(--accent-cyan-border)',
  
  // Input
  'input-background-color-default': 'var(--input-background)',
  'input-border-color-default': 'var(--border)',
  'input-border-color-focus': 'var(--ring)',
  'input-foreground-color-default': 'var(--foreground)',
  
  // Card
  'card-background-color-default': 'var(--card)',
  'card-border-color-default': 'var(--border)',
  'card-foreground-color-default': 'var(--card-foreground)',
  
  // Badge
  'badge-background-color-neutral': 'var(--muted)',
  'badge-foreground-color-neutral': 'var(--muted-foreground)',
  
  // Dialog/Modal
  'dialog-background-color-default': 'var(--card)',
  'dialog-overlay-color': 'rgba(0, 0, 0, 0.5)',
  'dialog-border-color-default': 'var(--border)',
} as const;

// ============================================================================
// EXPORTS
// ============================================================================

export const colors = {
  foundation: foundationColors,
  alias: aliasColors,
  glass: glassColors,
  component: componentColors,
} as const;

export default colors;
