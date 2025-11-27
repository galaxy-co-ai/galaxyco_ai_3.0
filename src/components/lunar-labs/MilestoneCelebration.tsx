"use client";

import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Trophy, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';

interface MilestoneCelebrationProps {
  milestone: {
    title: string;
    description: string;
  } | null;
  onClose?: () => void;
}

export function MilestoneCelebration({ milestone, onClose }: MilestoneCelebrationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (milestone) {
      setIsVisible(true);
      setShowConfetti(true);
      // Auto-hide confetti after animation
      const timer = setTimeout(() => setShowConfetti(false), 2000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [milestone]);

  if (!milestone || !isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Confetti Effect */}
      {showConfetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                left: '50%',
                top: '50%',
                backgroundColor: ['#a855f7', '#ec4899', '#fbbf24', '#10b981', '#3b82f6'][i % 5],
                animation: `confetti-${i % 3} ${1 + Math.random() * 1.5}s ease-out forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
                transform: `rotate(${i * 12}deg)`,
              }}
            />
          ))}
        </div>
      )}

      {/* Celebration Card */}
      <Card className="relative z-10 p-6 border-purple-500/50 bg-gradient-to-br from-purple-950/95 to-pink-950/95 backdrop-blur-xl max-w-md w-full mx-4 pointer-events-auto animate-scale-in">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50 animate-bounce">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <Badge variant="outline" className="bg-green-500/20 border-green-500/50 text-green-400 text-xs mb-1">
                Milestone Reached!
              </Badge>
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                {milestone.title}
              </h3>
            </div>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onClose}
              aria-label="Close celebration"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <p className="text-sm text-gray-300 mb-4">
          {milestone.description}
        </p>

        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-xs text-gray-400">Keep up the great work!</span>
        </div>

        <style jsx>{`
          @keyframes confetti-0 {
            0% {
              transform: translate(0, 0) rotate(0deg) scale(1);
              opacity: 1;
            }
            100% {
              transform: translate(100px, 500px) rotate(720deg) scale(0);
              opacity: 0;
            }
          }
          @keyframes confetti-1 {
            0% {
              transform: translate(0, 0) rotate(0deg) scale(1);
              opacity: 1;
            }
            100% {
              transform: translate(-100px, 500px) rotate(-720deg) scale(0);
              opacity: 0;
            }
          }
          @keyframes confetti-2 {
            0% {
              transform: translate(0, 0) rotate(0deg) scale(1);
              opacity: 1;
            }
            100% {
              transform: translate(150px, 600px) rotate(1080deg) scale(0);
              opacity: 0;
            }
          }
          @keyframes scale-in {
            0% {
              transform: scale(0.8);
              opacity: 0;
            }
            50% {
              transform: scale(1.05);
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
          .animate-scale-in {
            animation: scale-in 0.3s ease-out;
          }
        `}</style>
      </Card>
    </div>
  );
}













