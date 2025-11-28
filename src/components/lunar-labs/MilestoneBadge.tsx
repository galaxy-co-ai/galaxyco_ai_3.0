"use client";

import { Badge } from '../ui/badge';
import { Trophy, Sparkles, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface MilestoneBadgeProps {
  milestone: {
    percentage: number;
    title: string;
    description: string;
    achievementId?: string;
  };
  isCompleted: boolean;
  isNext: boolean;
  onReached?: () => void;
}

export function MilestoneBadge({ milestone, isCompleted, isNext, onReached }: MilestoneBadgeProps) {
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (isCompleted && !showCelebration && onReached) {
      setShowCelebration(true);
      onReached();
      // Hide celebration after animation
      const timer = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isCompleted, showCelebration, onReached]);

  if (showCelebration) {
    return (
      <div className="relative">
        {/* Celebration Animation */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping" />
            <div className="absolute inset-0 bg-pink-500/20 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
            <div className="relative bg-gradient-to-br from-purple-500 to-pink-500 rounded-full p-2">
              <Trophy className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Confetti Effect */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-purple-400 rounded-full"
              style={{
                left: '50%',
                top: '50%',
                animation: `confetti ${2 + Math.random()}s ease-out forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
                transform: `rotate(${i * 30}deg)`,
              }}
            />
          ))}
        </div>

        <style jsx>{`
          @keyframes confetti {
            0% {
              transform: translate(0, 0) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translate(
                ${Math.cos(Math.random() * 360) * 100}px,
                ${Math.sin(Math.random() * 360) * 100}px
              ) rotate(720deg);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`relative transition-all ${
      isCompleted ? 'scale-110' : isNext ? 'scale-105' : 'scale-100'
    }`}>
      {isCompleted ? (
        <Badge
          variant="outline"
          className="bg-green-500/20 border-green-500/50 text-green-400 shadow-lg shadow-green-500/30 flex items-center gap-1.5 px-3 py-1.5"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-xs font-semibold">{milestone.title}</span>
        </Badge>
      ) : isNext ? (
        <Badge
          variant="outline"
          className="bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-lg shadow-purple-500/30 flex items-center gap-1.5 px-3 py-1.5 animate-pulse"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-semibold">{milestone.title}</span>
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className="bg-gray-800/50 border-gray-700 text-gray-500 flex items-center gap-1.5 px-3 py-1.5"
        >
          <Trophy className="w-4 h-4" />
          <span className="text-xs">{milestone.title}</span>
        </Badge>
      )}
    </div>
  );
}

















