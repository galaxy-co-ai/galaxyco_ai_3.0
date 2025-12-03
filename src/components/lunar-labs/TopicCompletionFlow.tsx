"use client";

import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CheckCircle2, Trophy, ArrowRight, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { type Topic } from '../../data/lunarLabsContent';

interface TopicCompletionFlowProps {
  topic: Topic;
  onComplete: () => void;
  onNext?: () => void;
  hasNext?: boolean;
  nextTopicTitle?: string;
}

export function TopicCompletionFlow({ 
  topic, 
  onComplete, 
  onNext, 
  hasNext,
  nextTopicTitle 
}: TopicCompletionFlowProps) {
  const [showCelebration, setShowCelebration] = useState(false);

  const handleComplete = () => {
    setShowCelebration(true);
    onComplete();
    
    // Auto-advance to next step after celebration
    if (hasNext && onNext) {
      setTimeout(() => {
        onNext();
      }, 2000);
    }
  };

  useEffect(() => {
    if (showCelebration) {
      const timer = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showCelebration]);

  if (showCelebration) {
    return (
      <Card className="p-6 border-green-500/50 bg-gradient-to-br from-green-950/50 to-emerald-950/30">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent">
            Topic Complete! 🎉
          </h3>
          <p className="text-sm text-gray-300 mb-4">
            Great job completing <strong>{topic.title}</strong>!
          </p>
          {hasNext && (
            <div className="mt-4 pt-4 border-t border-green-500/20">
              <p className="text-xs text-gray-400 mb-2">Moving to next step...</p>
              <div className="flex items-center justify-center gap-2 text-sm text-green-400">
                <Sparkles className="w-4 h-4" />
                <span>{nextTopicTitle}</span>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 border-purple-500/20 bg-gradient-to-br from-purple-950/20 to-pink-950/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
            <Trophy className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="text-sm font-semibold mb-0.5">Ready to mark complete?</div>
            <div className="text-xs text-gray-400">You've finished this topic!</div>
          </div>
        </div>
        <Button
          onClick={handleComplete}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
          size="sm"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Mark Complete
        </Button>
      </div>
    </Card>
  );
}




























