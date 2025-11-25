"use client";

import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Target, Trophy, Sparkles } from 'lucide-react';
import { type LearningPath } from '../../data/lunarLabsContent';

interface HeroProgressProps {
  path: LearningPath | null;
  completedTopics: string[];
  currentStep: string | null;
}

export function HeroProgress({ path, completedTopics, currentStep }: HeroProgressProps) {
  if (!path) return null;

  const requiredSteps = path.steps.filter(s => s.required !== false);
  const completedSteps = requiredSteps.filter(step => completedTopics.includes(step.topicId));
  const percentage = requiredSteps.length > 0 
    ? Math.round((completedSteps.length / requiredSteps.length) * 100)
    : 0;

  // Find current step index
  const currentStepIndex = requiredSteps.findIndex(step => step.topicId === currentStep);
  const currentStepNumber = currentStepIndex >= 0 ? currentStepIndex + 1 : completedSteps.length + 1;

  // Find next milestone
  const nextMilestone = path.milestones.find(m => percentage < m.percentage);
  const progressToNextMilestone = nextMilestone 
    ? nextMilestone.percentage - percentage 
    : 0;

  return (
    <Card className="mt-4 p-4 border-purple-500/20 bg-black/30 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
            <Target className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-semibold text-white">
                {path.title}
              </h3>
              <Badge variant="outline" className="bg-purple-500/10 border-purple-400/30 text-xs">
                {percentage}%
              </Badge>
            </div>
            <p className="text-xs text-gray-400">
              Step {currentStepNumber} of {requiredSteps.length} • {completedSteps.length} completed
            </p>
          </div>
        </div>

        {/* Next Milestone */}
        {nextMilestone && (
          <div className="text-right">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-0.5">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Next: {nextMilestone.title}</span>
            </div>
            <div className="text-xs text-purple-300 font-medium">
              {progressToNextMilestone}% to go
            </div>
          </div>
        )}

        {/* All Complete */}
        {!nextMilestone && (
          <div className="flex items-center gap-2 text-xs text-green-400">
            <Trophy className="w-4 h-4" />
            <span className="font-medium">Path Complete!</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 transition-all duration-700 ease-out relative overflow-hidden"
            style={{ width: `${percentage}%` }}
          >
            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Milestone Markers */}
        <div className="relative h-1">
          <div className="absolute inset-0 flex items-center justify-between px-1">
            {path.milestones.map((milestone, index) => {
              const isReached = percentage >= milestone.percentage;
              const isNext = !isReached && milestone.percentage === nextMilestone?.percentage;

              return (
                <div
                  key={milestone.percentage}
                  className="relative"
                  style={{ left: `${milestone.percentage}%`, transform: 'translateX(-50%)' }}
                >
                  <div
                    className={`w-2 h-2 rounded-full transition-all ${
                      isReached
                        ? 'bg-green-500 shadow-lg shadow-green-500/50 scale-125'
                        : isNext
                        ? 'bg-purple-500 shadow-lg shadow-purple-500/50 scale-110 animate-pulse'
                        : 'bg-gray-700'
                    }`}
                  />
                  {isNext && (
                    <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                      <Badge variant="outline" className="text-[10px] bg-purple-500/20 border-purple-400/30 text-purple-300">
                        {milestone.percentage}%
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </Card>
  );
}

