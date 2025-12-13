"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  showCloseButton?: boolean;
  fullHeight?: boolean;
}

/**
 * Mobile-optimized dialog that slides up from the bottom on mobile
 * and behaves like a standard dialog on desktop
 */
export function MobileDialog({
  open,
  onOpenChange,
  children,
  title,
  description,
  showCloseButton = true,
  fullHeight = false,
}: MobileDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />

        {/* Content */}
        <DialogPrimitive.Content
          className={cn(
            "fixed z-50 bg-background",
            "border shadow-lg",
            // Mobile: Bottom sheet
            "bottom-0 left-0 right-0",
            "rounded-t-2xl",
            fullHeight ? "top-0 rounded-t-none" : "max-h-[90vh]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
            // Desktop: Centered modal
            "lg:top-[50%] lg:left-[50%] lg:bottom-auto lg:right-auto",
            "lg:translate-x-[-50%] lg:translate-y-[-50%]",
            "lg:rounded-2xl lg:max-w-lg lg:w-full",
            "lg:data-[state=closed]:slide-out-to-bottom-0 lg:data-[state=open]:slide-in-from-bottom-0",
            "lg:data-[state=closed]:zoom-out-95 lg:data-[state=open]:zoom-in-95"
          )}
        >
          {/* Header with close button */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex-1">
              {title && (
                <DialogPrimitive.Title className="text-lg font-semibold">
                  {title}
                </DialogPrimitive.Title>
              )}
              {description && (
                <DialogPrimitive.Description className="text-sm text-muted-foreground mt-1">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            {showCloseButton && (
              <DialogPrimitive.Close
                className={cn(
                  "flex items-center justify-center",
                  "min-w-[44px] min-h-[44px] ml-4", // Touch target
                  "rounded-lg",
                  "text-muted-foreground hover:text-foreground",
                  "hover:bg-accent",
                  "transition-colors"
                )}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </DialogPrimitive.Close>
            )}
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto p-4" style={{ maxHeight: fullHeight ? 'calc(100vh - 73px)' : '80vh' }}>
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
