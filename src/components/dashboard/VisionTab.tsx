'use client';

/**
 * Vision Tab Component
 * 
 * Goal-setting conversation with Neptune plus personalized motivational content.
 * Two-part experience: Goals (left) | Motivation (right)
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Sparkles, 
  RefreshCw, 
  Save,
  TrendingUp,
  Heart,
  Lightbulb,
  Flame
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { VisionGoal, VisionResponse } from '@/types/vision';

interface VisionTabProps {
  workspaceId: string;
}

const MOTIVATION_REFRESH_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours

export default function VisionTab({ workspaceId }: VisionTabProps) {
  const [goals, setGoals] = useState<VisionGoal | null>(null);
  const [goalsText, setGoalsText] = useState('');
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);
  const [isSavingGoals, setIsSavingGoals] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const [motivation, setMotivation] = useState<VisionResponse | null>(null);
  const [isLoadingMotivation, setIsLoadingMotivation] = useState(false);

  const storageKey = `vision-goals-${workspaceId}`;

  // Load goals from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: VisionGoal = JSON.parse(stored);
        setGoals(parsed);
        setGoalsText(parsed.text);
        logger.debug('[VisionTab] Loaded goals from storage');
      }
    } catch (err) {
      logger.error('[VisionTab] Failed to load goals', err);
    } finally {
      setIsLoadingGoals(false);
    }
  }, [storageKey]);

  // Fetch motivational content
  const fetchMotivation = useCallback(async (force = false) => {
    // Check if we need to refresh
    if (!force && motivation && motivation.motivation.generatedAt) {
      const timeSinceGenerated = Date.now() - motivation.motivation.generatedAt;
      if (timeSinceGenerated < MOTIVATION_REFRESH_INTERVAL) {
        return; // Still fresh
      }
    }

    setIsLoadingMotivation(true);

    try {
      const response = await fetch('/api/vision/motivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          workspaceId,
          goals: goalsText || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch motivation');
      }

      const data: VisionResponse = await response.json();
      setMotivation(data);
      
      logger.debug('[VisionTab] Loaded motivational content', {
        category: data.motivation.category,
        hasGoalFeedback: !!data.goalFeedback,
      });
    } catch (err) {
      logger.error('[VisionTab] Failed to fetch motivation', err);
      toast.error('Failed to load motivational content');
    } finally {
      setIsLoadingMotivation(false);
    }
  }, [workspaceId, goalsText, motivation]);

  // Load motivation on mount and when goals are saved
  useEffect(() => {
    if (!isLoadingGoals) {
      fetchMotivation();
    }
  }, [isLoadingGoals, fetchMotivation]);

  // Handle goal text changes
  const handleGoalsChange = (text: string) => {
    setGoalsText(text);
    setHasUnsavedChanges(true);
  };

  // Save goals to localStorage
  const handleSaveGoals = async () => {
    setIsSavingGoals(true);

    try {
      const newGoals: VisionGoal = {
        text: goalsText,
        updatedAt: Date.now(),
      };

      localStorage.setItem(storageKey, JSON.stringify(newGoals));
      setGoals(newGoals);
      setHasUnsavedChanges(false);
      
      toast.success('Goals saved successfully');
      logger.info('[VisionTab] Saved goals', { length: goalsText.length });

      // Fetch new motivation with updated goals
      await fetchMotivation(true);
    } catch (err) {
      logger.error('[VisionTab] Failed to save goals', err);
      toast.error('Failed to save goals');
    } finally {
      setIsSavingGoals(false);
    }
  };

  const handleRefreshMotivation = () => {
    fetchMotivation(true);
    toast.success('Refreshing your motivation...');
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'progress':
        return TrendingUp;
      case 'strategy':
        return Lightbulb;
      case 'resilience':
        return Heart;
      case 'growth':
        return Flame;
      default:
        return Sparkles;
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      {/* Left: Goals Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="mb-4 shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-nebula-violet" />
            <h3 className="font-semibold text-lg">Your Vision</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Define what success means to you. Neptune will help you strategize.
          </p>
        </div>

        {isLoadingGoals ? (
          <Skeleton className="flex-1 min-h-[200px]" />
        ) : (
          <>
            <Textarea
              value={goalsText}
              onChange={(e) => handleGoalsChange(e.target.value)}
              placeholder="What do you want to accomplish? What does success look like?&#10;&#10;Example: Grow my SaaS to 100 paid customers in 6 months. Launch my coaching business and get 5 clients. Build a sustainable content strategy that brings in leads consistently."
              className="flex-1 min-h-[200px] resize-none"
              aria-label="Your goals and vision"
            />
            
            <div className="mt-4 flex items-center justify-between shrink-0">
              <div className="text-xs text-muted-foreground">
                {goals && (
                  <span>
                    Last updated: {new Date(goals.updatedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <Button
                onClick={handleSaveGoals}
                disabled={!hasUnsavedChanges || isSavingGoals}
                size="sm"
                aria-label="Save your goals"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSavingGoals ? 'Saving...' : 'Save Goals'}
              </Button>
            </div>

            {/* Goal Feedback */}
            {motivation?.goalFeedback && goalsText.length > 20 && (
              <Card className="mt-4 p-4 bg-blue-50/50 border-blue-200 shrink-0">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-blue-100">
                    <Lightbulb className="h-4 w-4 text-blue-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-sm">Goal Clarity Score</h4>
                      <Badge variant="secondary">
                        {motivation.goalFeedback.clarityScore}/10
                      </Badge>
                    </div>
                    
                    {motivation.goalFeedback.strengths.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-green-700 mb-1">Strengths:</p>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          {motivation.goalFeedback.strengths.map((strength, i) => (
                            <li key={i}>• {strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {motivation.goalFeedback.suggestions.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-orange-700 mb-1">To Improve:</p>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          {motivation.goalFeedback.suggestions.map((suggestion, i) => (
                            <li key={i}>• {suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Right: Motivation Section */}
      <div className="lg:w-[40%] flex flex-col min-h-0">
        <div className="mb-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold text-lg">Motivation</h3>
          </div>
          <Button
            onClick={handleRefreshMotivation}
            variant="ghost"
            size="sm"
            disabled={isLoadingMotivation}
            aria-label="Refresh motivational content"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingMotivation ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {isLoadingMotivation ? (
          <Card className="p-6">
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </Card>
        ) : motivation ? (
          <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-amber-100 shrink-0">
                {(() => {
                  const Icon = getCategoryIcon(motivation.motivation.category);
                  return <Icon className="h-6 w-6 text-amber-600" aria-hidden="true" />;
                })()}
              </div>
              <div className="flex-1 min-w-0">
                <blockquote className="text-lg font-semibold text-gray-900 mb-4 leading-relaxed">
                  "{motivation.motivation.quote}"
                </blockquote>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {motivation.motivation.context}
                </p>
                <div className="mt-4 pt-4 border-t border-amber-200">
                  <p className="text-xs text-muted-foreground">
                    Personalized for you • {new Date(motivation.motivation.generatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-6 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Save your goals to get personalized motivation
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
