/**
 * GalaxyCo Design System - Motion Tokens
 * 
 * Animation durations, timing functions, and keyframes
 */

// ============================================================================
// DURATION
// ============================================================================

export const duration = {
  'duration-instant': '0ms',
  'duration-fast': '100ms',
  'duration-normal': '200ms',
  'duration-slow': '300ms',
  'duration-slower': '400ms',
  'duration-slowest': '500ms',
} as const;

// ============================================================================
// EASING (timing functions)
// ============================================================================

export const easing = {
  // Standard easings
  'easing-linear': 'linear',
  'easing-ease': 'ease',
  'easing-ease-in': 'ease-in',
  'easing-ease-out': 'ease-out',
  'easing-ease-in-out': 'ease-in-out',
  
  // Custom Bezier curves
  'easing-smooth': 'cubic-bezier(0.4, 0.0, 0.2, 1)',          // Material smooth
  'easing-enter': 'cubic-bezier(0.0, 0.0, 0.2, 1)',           // Deceleration
  'easing-exit': 'cubic-bezier(0.4, 0.0, 1, 1)',              // Acceleration
  'easing-bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',  // Bounce effect
  'easing-spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Spring effect
} as const;

// ============================================================================
// TRANSITION PRESETS
// ============================================================================

export const transition = {
  'transition-fast': `${duration['duration-fast']} ${easing['easing-smooth']}`,
  'transition-normal': `${duration['duration-normal']} ${easing['easing-smooth']}`,
  'transition-slow': `${duration['duration-slow']} ${easing['easing-smooth']}`,
  
  'transition-fade': `opacity ${duration['duration-normal']} ${easing['easing-ease-in-out']}`,
  'transition-slide': `transform ${duration['duration-normal']} ${easing['easing-smooth']}`,
  'transition-scale': `transform ${duration['duration-normal']} ${easing['easing-spring']}`,
  
  // Combined transitions
  'transition-all-fast': `all ${duration['duration-fast']} ${easing['easing-smooth']}`,
  'transition-all-normal': `all ${duration['duration-normal']} ${easing['easing-smooth']}`,
  'transition-all-slow': `all ${duration['duration-slow']} ${easing['easing-smooth']}`,
} as const;

// ============================================================================
// KEYFRAMES
// ============================================================================

export const keyframes = {
  'keyframes-fade-in': {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' },
  },
  
  'keyframes-fade-out': {
    '0%': { opacity: '1' },
    '100%': { opacity: '0' },
  },
  
  'keyframes-slide-up': {
    '0%': { transform: 'translateY(10px)', opacity: '0' },
    '100%': { transform: 'translateY(0)', opacity: '1' },
  },
  
  'keyframes-slide-down': {
    '0%': { transform: 'translateY(-10px)', opacity: '0' },
    '100%': { transform: 'translateY(0)', opacity: '1' },
  },
  
  'keyframes-slide-left': {
    '0%': { transform: 'translateX(10px)', opacity: '0' },
    '100%': { transform: 'translateX(0)', opacity: '1' },
  },
  
  'keyframes-slide-right': {
    '0%': { transform: 'translateX(-10px)', opacity: '0' },
    '100%': { transform: 'translateX(0)', opacity: '1' },
  },
  
  'keyframes-scale-in': {
    '0%': { transform: 'scale(0.95)', opacity: '0' },
    '100%': { transform: 'scale(1)', opacity: '1' },
  },
  
  'keyframes-scale-out': {
    '0%': { transform: 'scale(1)', opacity: '1' },
    '100%': { transform: 'scale(0.95)', opacity: '0' },
  },
  
  'keyframes-spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  },
  
  'keyframes-pulse': {
    '0%, 100%': { opacity: '1' },
    '50%': { opacity: '0.5' },
  },
  
  'keyframes-bounce': {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-10px)' },
  },
  
  'keyframes-float': {
    '0%, 100%': { transform: 'translateY(0px)' },
    '50%': { transform: 'translateY(-20px)' },
  },
  
  'keyframes-shimmer': {
    '0%': { backgroundPosition: '-1000px 0' },
    '100%': { backgroundPosition: '1000px 0' },
  },
} as const;

// ============================================================================
// ANIMATION PRESETS
// ============================================================================

export const animation = {
  'animation-fade-in': `keyframes-fade-in ${duration['duration-normal']} ${easing['easing-smooth']}`,
  'animation-fade-out': `keyframes-fade-out ${duration['duration-normal']} ${easing['easing-smooth']}`,
  'animation-slide-up': `keyframes-slide-up ${duration['duration-normal']} ${easing['easing-smooth']}`,
  'animation-slide-down': `keyframes-slide-down ${duration['duration-normal']} ${easing['easing-smooth']}`,
  'animation-scale-in': `keyframes-scale-in ${duration['duration-normal']} ${easing['easing-spring']}`,
  'animation-spin': `keyframes-spin ${duration['duration-slowest']} linear infinite`,
  'animation-pulse': `keyframes-pulse 2s ${easing['easing-ease-in-out']} infinite`,
  'animation-bounce': `keyframes-bounce 1s ${easing['easing-ease-in-out']} infinite`,
  'animation-float': `keyframes-float 6s ${easing['easing-ease-in-out']} infinite`,
  'animation-shimmer': `keyframes-shimmer 2s linear infinite`,
} as const;

// ============================================================================
// EXPORTS
// ============================================================================

export const motion = {
  duration,
  easing,
  transition,
  keyframes,
  animation,
} as const;

export default motion;
