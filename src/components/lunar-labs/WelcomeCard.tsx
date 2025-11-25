"use client";

import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowRight, Clock, Target, Sparkles, BookOpen, Play } from 'lucide-react';
import { type LearningPath, topics } from '../../data/lunarLabsContent';

interface WelcomeCardProps {
  role: string;
  path: LearningPath | null;
  completedTopics: string[];
  isFirstTimeUser?: boolean;
  onStartPath?: () => void;
  onSelectTopic?: (topicId: string) => void;
  suggestions?: Array<{
    id: string;
    title: string;
    reason: string;
    topicId: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export function WelcomeCard({ 
  role, 
  path, 
  completedTopics,
  isFirstTimeUser = false,
  onStartPath,
  onSelectTopic,
  suggestions = []
}: WelcomeCardProps) {
  const pathProgress = path ? {
    completed: path.steps.filter(s => s.required !== false && completedTopics.includes(s.topicId)).length,
    total: path.steps.filter(s => s.required !== false).length,
    percentage: (() => {
      const requiredSteps = path.steps.filter(s => s.required !== false);
      const completedSteps = requiredSteps.filter(step => completedTopics.includes(step.topicId));
      return requiredSteps.length > 0 
        ? Math.round((completedSteps.length / requiredSteps.length) * 100)
        : 0;
    })()
  } : null;

  const firstStep = path?.steps.find(step => {
    if (!step.prerequisites || step.prerequisites.length === 0) return true;
    return step.prerequisites.every(prereq => completedTopics.includes(prereq));
  });

  const firstStepTopic = firstStep ? topics.find(t => t.id === firstStep.topicId) : null;

  return (
    <div className="space-y-4">
      {/* Hero Welcome Section */}
      <Card className="p-6 border-purple-500/20 bg-gradient-to-br from-purple-950/50 to-pink-950/30">
        <div className="flex items-start gap-4">
          <div className="text-4xl flex-shrink-0">
            {path?.icon || '🌙'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                {isFirstTimeUser ? 'Welcome to Lunar Labs! 👋' : 'Welcome back to Lunar Labs'}
              </h2>
              <Badge variant="outline" className="bg-purple-500/10 border-purple-400/30 text-xs">
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </Badge>
            </div>
            <p className="text-sm text-gray-300 mb-4">
              {isFirstTimeUser 
                ? 'Your AI-powered learning center. Start your journey by following a structured learning path, or explore topics at your own pace.'
                : 'Continue your learning journey. Follow your path to master GalaxyCo.ai, or explore new topics.'
              }
            </p>

            {/* Path Preview */}
            {path && (
              <div className="space-y-3">
                <div className="p-3 bg-black/20 rounded-lg border border-purple-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium">{path.title}</span>
                    </div>
                    <Badge variant="outline" className="text-xs bg-purple-500/10">
                      {pathProgress?.percentage || 0}%
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                    {path.description}
                  </p>
                  
                  {/* Progress Bar */}
                  {pathProgress && (
                    <div className="mb-3">
                      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                          style={{ width: `${pathProgress.percentage}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1 text-xs text-gray-400">
                        <span>Step {pathProgress.completed + 1} of {pathProgress.total}</span>
                        <span>{pathProgress.completed}/{pathProgress.total} completed</span>
                      </div>
                    </div>
                  )}

                  {/* Path Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{path.estimatedTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Target className="w-3 h-3" />
                      <span>{path.steps.length} steps</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {path.difficulty}
                      </Badge>
                    </div>
                  </div>

                  {/* Start/Continue Button */}
                  <Button
                    onClick={onStartPath}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    size="sm"
                  >
                    {pathProgress && pathProgress.completed > 0 ? (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Continue Learning Path
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Start Learning Path
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Suggested Topics */}
      {suggestions.length > 0 && (
        <Card className="p-4 border-purple-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold">Recommended for You</h3>
          </div>
          <div className="space-y-2">
            {suggestions.slice(0, 3).map((suggestion) => {
              const topic = topics.find(t => t.id === suggestion.topicId);
              if (!topic) return null;

              return (
                <button
                  key={suggestion.id}
                  onClick={() => onSelectTopic && onSelectTopic(suggestion.topicId)}
                  className="w-full text-left p-3 rounded-lg border border-gray-700 hover:border-purple-500/40 hover:bg-purple-500/10 transition-all group"
                  aria-label={`Explore ${suggestion.title}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-xl flex-shrink-0">{topic.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium truncate">{suggestion.title}</h4>
                        {suggestion.priority === 'high' && (
                          <Badge variant="outline" className="text-[10px] bg-purple-500/10 flex-shrink-0">
                            🔥
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mb-2 line-clamp-2">{suggestion.reason}</p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{topic.estimatedTime}</span>
                        <span>•</span>
                        <span className="capitalize">{topic.difficulty}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="p-4 border-purple-500/20">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold">Quick Start</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-auto py-2 text-xs justify-start"
            onClick={() => onSelectTopic && onSelectTopic('getting-started')}
          >
            <Play className="w-3 h-3 mr-2" />
            Getting Started
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-auto py-2 text-xs justify-start"
            onClick={() => {
              // Scroll to search or focus search input
              document.querySelector('input[placeholder*="Search"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              (document.querySelector('input[placeholder*="Search"]') as HTMLInputElement)?.focus();
            }}
          >
            <Sparkles className="w-3 h-3 mr-2" />
            Search Topics
          </Button>
        </div>
      </Card>
    </div>
  );
}

