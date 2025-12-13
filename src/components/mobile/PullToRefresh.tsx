"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  threshold?: number;
  className?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  threshold = 80,
  className,
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [pullDistance, setPullDistance] = React.useState(0);
  const [startY, setStartY] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    // Only start pull if scrolled to top
    const container = containerRef.current;
    if (container && container.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || isRefreshing || !isPulling) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startY;

    // Only allow pulling down when at top
    if (distance > 0) {
      e.preventDefault();
      
      // Apply resistance as you pull further
      const resistance = 0.5;
      const adjustedDistance = Math.min(threshold * 1.5, distance * resistance);
      setPullDistance(adjustedDistance);
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || isRefreshing || !isPulling) return;
    setIsPulling(false);

    // Trigger refresh if pulled past threshold
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error("Refresh failed:", error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Reset if not pulled enough
      setPullDistance(0);
    }
  };

  const progress = Math.min(1, pullDistance / threshold);
  const rotation = progress * 360;

  return (
    <div className={cn("relative", className)}>
      {/* Pull Indicator */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 z-10",
          "flex items-center justify-center",
          "transition-all duration-300 ease-out",
          "pointer-events-none"
        )}
        style={{
          height: pullDistance,
          opacity: progress,
        }}
      >
        <div
          className={cn(
            "flex items-center justify-center",
            "w-10 h-10 rounded-full",
            "bg-primary/10 backdrop-blur-sm",
            isRefreshing && "animate-spin"
          )}
        >
          <RefreshCw
            className={cn(
              "h-5 w-5 text-primary",
              "transition-transform duration-200"
            )}
            style={{
              transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
            }}
          />
        </div>
      </div>

      {/* Scrollable Content */}
      <div
        ref={containerRef}
        className="overflow-y-auto"
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? "none" : "transform 0.3s ease-out",
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
