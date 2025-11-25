"use client";

import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Check, Lock, Circle } from 'lucide-react';
import { type LearningPath, topics } from '../../data/lunarLabsContent';

interface PathProgressProps {
  path: LearningPath | null;
  completedTopics: string[];
  currentStep: string | null;
  onSelectStep?: (topicId: string) => void;
}

export function PathProgress({ path, completedTopics, currentStep, onSelectStep }: PathProgressProps) {
  if (!path) {
    return (
      <Card className="p-3 border-purple-500/20">
        <p className="text-sm text-gray-400 text-center">No learning path selected</p>
      </Card>
    );
  }

  const requiredSteps = path.steps.filter(s => s.required !== false);
  const completedCount = requiredSteps.filter(step => completedTopics.includes(step.topicId)).length;
  const percentage = requiredSteps.length > 0 
    ? Math.round((completedCount / requiredSteps.length) * 100)
    : 0;

  const isStepCompleted = (topicId: string) => completedTopics.includes(topicId);
  const isStepUnlocked = (step: typeof path.steps[0]) => {
    if (!step.prerequisites || step.prerequisites.length === 0) return true;
    return step.prerequisites.every(prereq => completedTopics.includes(prereq));
  };

  return (
    <Card className="p-3 sm:p-4 border-purple-500/20" role="region" aria-label="Learning path progress">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{path.icon}</span>
          <div>
            <h3 className="text-sm font-semibold">{path.title}</h3>
            <p className="text-xs text-gray-400">{path.description}</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-purple-500/10 text-xs">
          {percentage}%
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1 text-xs text-gray-400">
          <span>Step {completedCount + 1} of {requiredSteps.length}</span>
          <span>{completedCount}/{requiredSteps.length} completed</span>
        </div>
      </div>

      {/* Path Steps */}
      <div className="space-y-2">
        <div className="text-xs text-gray-400 mb-2 font-medium">Learning Path</div>
        <div className="space-y-1.5">
          {path.steps.map((step, index) => {
            const topic = topics.find(t => t.id === step.topicId);
            if (!topic) return null;

            const completed = isStepCompleted(step.topicId);
            const unlocked = isStepUnlocked(step);
            const isCurrent = step.topicId === currentStep;
            const isRequired = step.required !== false;

            return (
              <button
                key={step.topicId}
                onClick={() => unlocked && onSelectStep && onSelectStep(step.topicId)}
                disabled={!unlocked}
                className={`w-full text-left p-2 rounded transition-all ${
                  completed
                    ? 'bg-green-500/10 border border-green-500/30'
                    : isCurrent
                    ? 'bg-purple-500/20 border border-purple-500/40'
                    : unlocked
                    ? 'bg-gray-800/50 border border-gray-700 hover:border-purple-500/40 hover:bg-purple-500/10'
                    : 'bg-gray-900/50 border border-gray-800 opacity-60 cursor-not-allowed'
                }`}
                aria-label={`${completed ? 'Completed' : unlocked ? 'Available' : 'Locked'}: ${topic.title}`}
              >
                <div className="flex items-start gap-2">
                  {/* Step Status Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {completed ? (
                      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-green-400" />
                      </div>
                    ) : unlocked ? (
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        isCurrent ? 'bg-purple-500/20' : 'bg-gray-700'
                      }`}>
                        <Circle className={`w-3 h-3 ${
                          isCurrent ? 'text-purple-400 fill-purple-400' : 'text-gray-500'
                        }`} />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center">
                        <Lock className="w-3 h-3 text-gray-600" />
                      </div>
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-medium truncate">{topic.title}</span>
                      {!isRequired && (
                        <Badge variant="outline" className="text-[10px] h-3 px-1">Optional</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                      <span>{topic.estimatedTime}</span>
                      <span>•</span>
                      <span className="capitalize">{topic.difficulty}</span>
                    </div>
                  </div>

                  {/* Step Number */}
                  <div className="flex-shrink-0 text-xs text-gray-500">
                    {index + 1}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Next Milestone */}
      {path.milestones.length > 0 && (() => {
        const nextMilestone = path.milestones.find(m => percentage < m.percentage);
        if (nextMilestone) {
          const progressToMilestone = nextMilestone.percentage - percentage;
          return (
            <div className="mt-4 p-2 bg-purple-500/10 border border-purple-500/20 rounded">
              <div className="text-xs font-medium text-purple-300 mb-1">
                Next Milestone: {nextMilestone.title}
              </div>
              <div className="text-[10px] text-gray-400">
                {progressToMilestone}% to go • {nextMilestone.description}
              </div>
            </div>
          );
        }
        return null;
      })()}
    </Card>
  );
}

