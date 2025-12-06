"use client";

/**
 * Insight Toast Component
 * 
 * Shows subtle toast notifications for high-priority proactive insights.
 * Auto-dismisses after 10 seconds unless user interacts.
 */

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Insight {
  id: string;
  type: 'opportunity' | 'risk' | 'suggestion' | 'alert';
  priority: number;
  category: string;
  title: string;
  description: string;
  suggestedActions: Array<{ action: string; toolName?: string; args?: Record<string, unknown> }>;
}

interface InsightToastProps {
  insight: Insight;
  onDismiss?: () => void;
  onAction?: (action: Insight['suggestedActions'][0]) => void;
}

export function InsightToast({ insight, onDismiss, onAction }: InsightToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 10 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 10000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!isVisible) return null;

  const getTypeColor = () => {
    switch (insight.type) {
      case 'opportunity':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'risk':
        return 'bg-amber-50 border-amber-200 text-amber-900';
      case 'alert':
        return 'bg-red-50 border-red-200 text-red-900';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  const getTypeIcon = () => {
    switch (insight.type) {
      case 'opportunity':
        return '🎯';
      case 'risk':
        return '⚠️';
      case 'alert':
        return '🚨';
      default:
        return '💡';
    }
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border p-4 shadow-lg ${getTypeColor()}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">{getTypeIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-semibold text-sm">{insight.title}</h4>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 shrink-0"
              onClick={() => {
                setIsVisible(false);
                onDismiss?.();
              }}
              aria-label="Dismiss insight"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-xs mb-3 opacity-90">{insight.description}</p>
          {insight.suggestedActions.length > 0 && (
            <div className="flex gap-2">
              {insight.suggestedActions.slice(0, 2).map((action, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => {
                    onAction?.(action);
                    setIsVisible(false);
                  }}
                >
                  {action.action}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to fetch and display insights as toasts
 */
export function useInsightToasts(workspaceId: string, userId: string) {
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    if (!workspaceId || !userId) return;

    async function fetchInsights() {
      try {
        const response = await fetch(`/api/assistant/insights?limit=3`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.insights) {
            // Only show high-priority insights (priority >= 8)
            const highPriority = data.insights.filter((i: Insight) => i.priority >= 8);
            setInsights(highPriority);
          }
        }
      } catch (error) {
        console.error('Failed to fetch insights', error);
      }
    }

    fetchInsights();
    // Refresh every 5 minutes
    const interval = setInterval(fetchInsights, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [workspaceId, userId]);

  return insights;
}
