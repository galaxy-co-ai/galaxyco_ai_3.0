"use client";

import { useState } from "react";

// Generate stars once at module load for stable, random positions
// This pattern avoids React purity warnings while maintaining randomness
const generateStars = () =>
  Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 3}s`,
    animationDuration: `${2 + Math.random() * 2}s`,
  }));

export function LunarLabsStars() {
  // Initialize once with lazy state initializer
  const [stars] = useState(generateStars);

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
