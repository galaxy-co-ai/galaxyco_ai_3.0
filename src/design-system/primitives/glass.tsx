/**
 * GalaxyCo Design System - Glass Morphism Primitives
 * 
 * Polished glass-effect components with backdrop blur and soft shadows
 * Inspired by the user's preference for glass morphism aesthetics
 * 
 * Usage:
 * import { GlassCard, GlassDialog, GlassPopover } from '@/design-system/primitives/glass'
 */

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

// ============================================================================
// GLASS CARD
// ============================================================================

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Glass intensity
   * - subtle: Light blur, high opacity (90%)
   * - medium: Medium blur, medium opacity (70%)
   * - heavy: Strong blur, low opacity (50%)
   */
  intensity?: 'subtle' | 'medium' | 'heavy';
  
  /**
   * Whether to show border
   */
  bordered?: boolean;
  
  /**
   * Hover effect
   */
  hoverable?: boolean;
}

export function GlassCard({
  className,
  intensity = 'medium',
  bordered = true,
  hoverable = false,
  children,
  ...props
}: GlassCardProps) {
  const glassStyles = {
    subtle: 'bg-white/90 dark:bg-nebula-deep/90 backdrop-blur-sm',
    medium: 'bg-white/70 dark:bg-nebula-deep/70 backdrop-blur-md',
    heavy: 'bg-white/50 dark:bg-nebula-deep/50 backdrop-blur-lg',
  };

  return (
    <div
      className={cn(
        // Base glass effect
        glassStyles[intensity],
        'backdrop-saturate-[180%]',
        
        // Border
        bordered && 'border border-gray-200 dark:border-white/15',
        
        // Rounded corners
        'rounded-2xl',
        
        // Shadow
        'shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
        
        // Padding
        'p-6',
        
        // Hover effect
        hoverable && 'transition-all duration-200 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] hover:-translate-y-0.5',
        
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ============================================================================
// GLASS DIALOG
// ============================================================================

export interface GlassDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function GlassDialog({ open, onOpenChange, children }: GlassDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </DialogPrimitive.Root>
  );
}

export const GlassDialogTrigger = DialogPrimitive.Trigger;

export interface GlassDialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /**
   * Glass intensity for content
   */
  intensity?: 'subtle' | 'medium' | 'heavy';
  
  /**
   * Whether to show close button
   */
  showClose?: boolean;
}

export const GlassDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  GlassDialogContentProps
>(({ className, intensity = 'medium', showClose = true, children, ...props }, ref) => {
  const glassStyles = {
    subtle: 'bg-white/90 dark:bg-nebula-deep/90 backdrop-blur-sm',
    medium: 'bg-white/70 dark:bg-nebula-deep/70 backdrop-blur-md',
    heavy: 'bg-white/50 dark:bg-nebula-deep/50 backdrop-blur-lg',
  };

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay 
        className={cn(
          'fixed inset-0 z-50',
          'bg-black/50 dark:bg-black/70',
          'backdrop-blur-sm',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
        )}
      />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed left-[50%] top-[50%] z-50',
          'translate-x-[-50%] translate-y-[-50%]',
          'w-full max-w-lg',
          
          // Glass effect
          glassStyles[intensity],
          'backdrop-saturate-[180%]',
          'border border-gray-200 dark:border-white/15',
          'rounded-2xl',
          'shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)]',
          
          // Padding
          'p-6',
          
          // Animations
          'duration-200',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
          'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
          
          className
        )}
        {...props}
      >
        {children}
        {showClose && (
          <DialogPrimitive.Close
            className={cn(
              'absolute right-4 top-4',
              'rounded-lg p-2',
              'opacity-70 hover:opacity-100',
              'transition-opacity',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'disabled:pointer-events-none'
            )}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});
GlassDialogContent.displayName = 'GlassDialogContent';

export function GlassDialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
      {...props}
    />
  );
}

export function GlassDialogTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  );
}

export function GlassDialogDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export function GlassDialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6', className)}
      {...props}
    />
  );
}

// ============================================================================
// GLASS POPOVER
// ============================================================================

export const GlassPopover = PopoverPrimitive.Root;
export const GlassPopoverTrigger = PopoverPrimitive.Trigger;

export interface GlassPopoverContentProps extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> {
  /**
   * Glass intensity
   */
  intensity?: 'subtle' | 'medium' | 'heavy';
}

export const GlassPopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  GlassPopoverContentProps
>(({ className, intensity = 'medium', align = 'center', sideOffset = 4, ...props }, ref) => {
  const glassStyles = {
    subtle: 'bg-white/90 dark:bg-nebula-deep/90 backdrop-blur-sm',
    medium: 'bg-white/70 dark:bg-nebula-deep/70 backdrop-blur-md',
    heavy: 'bg-white/50 dark:bg-nebula-deep/50 backdrop-blur-lg',
  };

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 w-72',
          
          // Glass effect
          glassStyles[intensity],
          'backdrop-saturate-[180%]',
          'border border-gray-200 dark:border-white/15',
          'rounded-xl',
          'shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
          
          // Padding
          'p-4',
          
          // Animations
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2',
          'data-[side=left]:slide-in-from-right-2',
          'data-[side=right]:slide-in-from-left-2',
          'data-[side=top]:slide-in-from-bottom-2',
          
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
GlassPopoverContent.displayName = 'GlassPopoverContent';

// ============================================================================
// GLASS NAVIGATION
// ============================================================================

export interface GlassNavigationProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Glass intensity
   */
  intensity?: 'subtle' | 'medium' | 'heavy';
  
  /**
   * Fixed positioning
   */
  fixed?: boolean;
  
  /**
   * Position when fixed
   */
  position?: 'top' | 'bottom';
}

export function GlassNavigation({
  className,
  intensity = 'medium',
  fixed = false,
  position = 'top',
  children,
  ...props
}: GlassNavigationProps) {
  const glassStyles = {
    subtle: 'bg-white/90 dark:bg-nebula-deep/90 backdrop-blur-sm',
    medium: 'bg-white/70 dark:bg-nebula-deep/70 backdrop-blur-md',
    heavy: 'bg-white/50 dark:bg-nebula-deep/50 backdrop-blur-lg',
  };

  const positionStyles = {
    top: 'top-0 border-b',
    bottom: 'bottom-0 border-t',
  };

  return (
    <nav
      className={cn(
        // Glass effect
        glassStyles[intensity],
        'backdrop-saturate-[180%]',
        'border-gray-200 dark:border-white/15',
        
        // Fixed positioning
        fixed && 'fixed left-0 right-0 z-40',
        fixed && positionStyles[position],
        
        // Shadow
        'shadow-[0_4px_16px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.3)]',
        
        // Safe area for mobile
        fixed && position === 'bottom' && 'pb-safe',
        
        className
      )}
      {...props}
    >
      {children}
    </nav>
  );
}

// ============================================================================
// GLASS ACCENT CARD (with teal tint)
// ============================================================================

export interface GlassAccentCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether to show border
   */
  bordered?: boolean;
  
  /**
   * Hover effect
   */
  hoverable?: boolean;
}

export function GlassAccentCard({
  className,
  bordered = true,
  hoverable = false,
  children,
  ...props
}: GlassAccentCardProps) {
  return (
    <div
      className={cn(
        // Glass effect with accent tint
        'bg-nebula-teal-100/50 dark:bg-nebula-teal-900/25',
        'backdrop-blur-md backdrop-saturate-[180%]',
        
        // Border
        bordered && 'border border-nebula-teal-300 dark:border-nebula-teal-700/40',
        
        // Rounded corners
        'rounded-2xl',
        
        // Shadow with accent color
        'shadow-[0_8px_32px_rgba(91,138,138,0.15)] dark:shadow-[0_8px_32px_rgba(91,138,138,0.25)]',
        
        // Padding
        'p-6',
        
        // Hover effect
        hoverable && 'transition-all duration-200 hover:shadow-[0_12px_40px_rgba(91,138,138,0.25)] dark:hover:shadow-[0_12px_40px_rgba(91,138,138,0.35)] hover:-translate-y-0.5',
        
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export const Glass = {
  Card: GlassCard,
  AccentCard: GlassAccentCard,
  Dialog: GlassDialog,
  DialogTrigger: GlassDialogTrigger,
  DialogContent: GlassDialogContent,
  DialogHeader: GlassDialogHeader,
  DialogTitle: GlassDialogTitle,
  DialogDescription: GlassDialogDescription,
  DialogFooter: GlassDialogFooter,
  Popover: GlassPopover,
  PopoverTrigger: GlassPopoverTrigger,
  PopoverContent: GlassPopoverContent,
  Navigation: GlassNavigation,
};

export default Glass;
