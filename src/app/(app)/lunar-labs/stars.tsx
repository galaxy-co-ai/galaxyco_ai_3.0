"use client";

import { useMemo } from "react";

export function LunarLabsStars() {
  // Generate stars once on mount with stable positions
  // Using Math.random in useMemo is intentional for star placement variance
  // eslint-disable-next-line react-hooks/purity -- Math.random in useMemo[] is stable
  const stars = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 3}s`,
      animationDuration: `${2 + Math.random() * 2}s`,
    }));
  }, []);

  return (
    <div className="absolute inset-0 opacity-40">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
          style={{
            left: star.left,
            top: star.top,
            animationDelay: star.animationDelay,
            animationDuration: star.animationDuration,
          }}
        />
      ))}
    </div>
  );
}
