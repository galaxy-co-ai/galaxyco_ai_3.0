'use client';

/**
 * Compass Tab Component
 * 
 * Neptune-powered dynamic guidance showing contextual micro-lists:
 * Quick Wins, Next Steps, Priorities, and Bonus Suggestions
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Zap, 
  ArrowRight, 
  AlertCircle, 
  Lightbulb, 
  RefreshCw,
  MessageSquare,
  LucideIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { CompassResponse, CompassInsight, CompassItem } from '@/types/compass';

interface CompassTabProps {
  workspaceId: string;
}

// Icon mapping for dynamic icon names from API
const iconMap: Record<string, LucideIcon> = {
  Zap,
  ArrowRight,
  AlertCircle,
  Lightbulb,
  MessageSquare,
};

export default function CompassTab({ workspaceId }: CompassTabProps) {
  const [insights, setInsights] = useState<CompassInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchInsights = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await fetch('/api/compass/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch compass insights');
      }

      const data: CompassResponse = await response.json();
      setInsights(data.insights);
      
      logger.debug('[CompassTab] Loaded insights', {
        categories: data.insights.length,
        totalItems: data.insights.reduce((sum, cat) => sum + cat.items.length, 0),
      });
    } catch (err) {
      logger.error('[CompassTab] Failed to fetch insights', err);
      setError('Unable to load compass. Try refreshing or chat with Neptune.');
      toast.error('Failed to load compass insights');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [workspaceId]);

  const handleRefresh = () => {
    fetchInsights(true);
    toast.success('Refreshing your compass...');
  };

  const handleItemClick = (item: CompassItem) => {
    // Dispatch event to Neptune to prompt about this item
    const event = new CustomEvent('neptune-prompt', {
      detail: { message: `Help me with: ${item.title}` },
    });
    window.dispatchEvent(event);
    
    logger.info('[CompassTab] Item clicked', { itemId: item.id, title: item.title });
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col gap-6 p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-24" />
        </div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-2">
              {[1, 2, 3].map(j => (
                <Skeleton key={j} className="h-20 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || insights.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="p-4 rounded-full bg-nebula-violet/10">
          <MessageSquare className="h-8 w-8 text-nebula-violet" />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Your Compass Awaits</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Chat with Neptune about your goals and workspace activity. I'll analyze everything
            and build you a personalized compass to keep you on the optimal path.
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Loading Compass
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h3 className="font-semibold text-lg">Your Compass</h3>
          <p className="text-sm text-muted-foreground">
            Personalized guidance to keep you on track
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={isRefreshing}
          aria-label="Refresh compass insights"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Insights Grid */}
      <div className="flex-1 overflow-y-auto space-y-6">
        {insights.map((insight) => (
          <InsightSection
            key={insight.category}
            insight={insight}
            onItemClick={handleItemClick}
          />
        ))}
      </div>
    </div>
  );
}

interface InsightSectionProps {
  insight: CompassInsight;
  onItemClick: (item: CompassItem) => void;
}

function InsightSection({ insight, onItemClick }: InsightSectionProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'quick-wins':
        return 'border-green-200 bg-green-50/50';
      case 'next-steps':
        return 'border-blue-200 bg-blue-50/50';
      case 'priorities':
        return 'border-orange-200 bg-orange-50/50';
      case 'bonus':
        return 'border-purple-200 bg-purple-50/50';
      default:
        return 'border-gray-200 bg-gray-50/50';
    }
  };

  const getCategoryTextColor = (category: string) => {
    switch (category) {
      case 'quick-wins':
        return 'text-green-700';
      case 'next-steps':
        return 'text-blue-700';
      case 'priorities':
        return 'text-orange-700';
      case 'bonus':
        return 'text-purple-700';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <div className="space-y-3">
      <h4 className={`font-semibold text-sm ${getCategoryTextColor(insight.category)}`}>
        {insight.title}
      </h4>
      <div className="space-y-2">
        {insight.items.map((item) => (
          <InsightItem
            key={item.id}
            item={item}
            colorClass={getCategoryColor(insight.category)}
            textColorClass={getCategoryTextColor(insight.category)}
            onItemClick={onItemClick}
          />
        ))}
      </div>
    </div>
  );
}

interface InsightItemProps {
  item: CompassItem;
  colorClass: string;
  textColorClass: string;
  onItemClick: (item: CompassItem) => void;
}

function InsightItem({ item, colorClass, textColorClass, onItemClick }: InsightItemProps) {
  const IconComponent = iconMap[item.icon] || Lightbulb;

  return (
    <button
      onClick={() => onItemClick(item)}
      className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99] ${colorClass}`}
      aria-label={`Get help with: ${item.title}`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-md bg-white shrink-0 ${textColorClass}`}>
          <IconComponent className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h5 className="font-semibold text-sm">{item.title}</h5>
            {item.estimatedTime && (
              <span className="text-xs text-muted-foreground shrink-0">
                {item.estimatedTime}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {item.description}
          </p>
        </div>
      </div>
    </button>
  );
}
