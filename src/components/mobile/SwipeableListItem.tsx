"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwipeAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: "primary" | "destructive" | "success" | "warning";
  onClick: () => void;
}

interface SwipeableListItemProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
  disabled?: boolean;
}

const colorClasses = {
  primary: "bg-primary text-primary-foreground",
  destructive: "bg-destructive text-destructive-foreground",
  success: "bg-green-600 text-white",
  warning: "bg-amber-600 text-white",
};

export function SwipeableListItem({
  children,
  leftActions = [],
  rightActions = [],
  onSwipeLeft,
  onSwipeRight,
  className,
  disabled = false,
}: SwipeableListItemProps) {
  const [swipeDistance, setSwipeDistance] = React.useState(0);
  const [isSwiping, setIsSwiping] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [startY, setStartY] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const maxSwipeDistance = 120; // Max distance before triggering action

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    setStartX(e.touches[0].clientX);
    setStartY(e.touches[0].clientY);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || !isSwiping) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - startX;
    const deltaY = Math.abs(currentY - startY);

    // Only swipe if horizontal movement is dominant
    if (Math.abs(deltaX) > deltaY) {
      e.preventDefault(); // Prevent scroll
      
      // Limit swipe distance
      const limitedDistance = Math.max(
        -maxSwipeDistance,
        Math.min(maxSwipeDistance, deltaX)
      );
      setSwipeDistance(limitedDistance);
    }
  };

  const handleTouchEnd = () => {
    if (disabled || !isSwiping) return;
    setIsSwiping(false);

    // Threshold for triggering action (50% of max)
    const threshold = maxSwipeDistance * 0.5;

    if (swipeDistance > threshold) {
      // Swiped right
      if (onSwipeRight) {
        onSwipeRight();
      }
      if (leftActions.length > 0) {
        leftActions[0].onClick();
      }
    } else if (swipeDistance < -threshold) {
      // Swiped left
      if (onSwipeLeft) {
        onSwipeLeft();
      }
      if (rightActions.length > 0) {
        rightActions[0].onClick();
      }
    }

    // Reset
    setSwipeDistance(0);
  };

  return (
    <div className={cn("relative overflow-hidden", className)} ref={containerRef}>
      {/* Left Actions (shown when swiping right) */}
      {leftActions.length > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 flex items-center gap-2 px-4"
          style={{
            width: Math.max(0, swipeDistance),
            opacity: Math.min(1, Math.abs(swipeDistance) / maxSwipeDistance),
          }}
        >
          {leftActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                className={cn(
                  "flex items-center justify-center",
                  "min-w-[44px] min-h-[44px] rounded-lg",
                  colorClasses[action.color]
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                  setSwipeDistance(0);
                }}
                aria-label={action.label}
              >
                <Icon className="h-5 w-5" />
              </button>
            );
          })}
        </div>
      )}

      {/* Right Actions (shown when swiping left) */}
      {rightActions.length > 0 && (
        <div
          className="absolute right-0 top-0 bottom-0 flex items-center gap-2 px-4"
          style={{
            width: Math.max(0, -swipeDistance),
            opacity: Math.min(1, Math.abs(swipeDistance) / maxSwipeDistance),
          }}
        >
          {rightActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                className={cn(
                  "flex items-center justify-center",
                  "min-w-[44px] min-h-[44px] rounded-lg",
                  colorClasses[action.color]
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                  setSwipeDistance(0);
                }}
                aria-label={action.label}
              >
                <Icon className="h-5 w-5" />
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content */}
      <div
        className="relative bg-background transition-transform"
        style={{
          transform: `translateX(${swipeDistance}px)`,
          transition: isSwiping ? "none" : "transform 0.3s ease-out",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
