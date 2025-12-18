'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, 
  AlertTriangle, 
  Target, 
  TrendingUp,
  X,
  Filter,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProactiveInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'suggestion' | 'achievement';
  category: 'sales' | 'marketing' | 'operations' | 'finance' | 'content';
  title: string;
  description: string;
  priority: number;
  suggestedActions: Array<{
    action: string;
    toolName?: string;
    args?: Record<string, unknown>;
  }>;
  autoExecutable: boolean;
  createdAt: string;
}

interface InsightsDashboardProps {
  maxInsights?: number;
  showFilters?: boolean;
  compact?: boolean;
}

const INSIGHT_TYPE_CONFIG = {
  opportunity: {
    icon: Target,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800',
    badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  },
  suggestion: {
    icon: Lightbulb,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  achievement: {
    icon: Sparkles,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  },
};

const CATEGORY_LABELS = {
  sales: 'Sales',
  marketing: 'Marketing',
  operations: 'Operations',
  finance: 'Finance',
  content: 'Content',
};

export function InsightsDashboard({ 
  maxInsights = 10, 
  showFilters = true,
  compact = false,
}: InsightsDashboardProps) {
  const [insights, setInsights] = useState<ProactiveInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dismissing, setDismissing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchInsights();
  }, [selectedCategory]);

  async function fetchInsights() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }
      params.append('limit', maxInsights.toString());

      const response = await fetch(`/api/insights?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setInsights(data.insights || []);
      }
    } catch (error) {
      console.error('Failed to fetch insights', error);
    } finally {
      setLoading(false);
    }
  }

  async function dismissInsight(insightId: string) {
    try {
      setDismissing(prev => ({ ...prev, [insightId]: true }));
      
      const response = await fetch(`/api/insights/${insightId}/dismiss`, {
        method: 'POST',
      });

      if (response.ok) {
        // Remove from UI
        setInsights(prev => prev.filter(i => i.id !== insightId));
      }
    } catch (error) {
      console.error('Failed to dismiss insight', error);
    } finally {
      setDismissing(prev => ({ ...prev, [insightId]: false }));
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-muted rounded w-full"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <Card className="p-8 text-center">
        <TrendingUp className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-1">No Insights Yet</h3>
        <p className="text-sm text-muted-foreground">
          {selectedCategory
            ? `No ${CATEGORY_LABELS[selectedCategory as keyof typeof CATEGORY_LABELS]} insights at the moment.`
            : 'Keep working and we\'ll surface intelligent insights for you soon!'}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="h-8"
          >
            <Filter className="h-3 w-3 mr-1.5" />
            All
          </Button>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <Button
              key={key}
              variant={selectedCategory === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(key)}
              className="h-8"
            >
              {label}
            </Button>
          ))}
        </div>
      )}

      {/* Insights List */}
      <div className="space-y-3">
        {insights.map((insight) => {
          const config = INSIGHT_TYPE_CONFIG[insight.type];
          const Icon = config.icon;

          return (
            <Card
              key={insight.id}
              className={cn(
                'relative overflow-hidden transition-all hover:shadow-md',
                config.borderColor,
                'border-l-4'
              )}
            >
              <div className={cn('absolute inset-0 opacity-5', config.bgColor)} />
              
              <div className="relative p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn('p-2 rounded-lg', config.bgColor)}>
                      <Icon className={cn('h-5 w-5', config.color)} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <h4 className="font-medium text-sm leading-tight">
                          {insight.title}
                        </h4>
                        <Badge variant="secondary" className={cn('text-xs', config.badge)}>
                          {insight.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {CATEGORY_LABELS[insight.category]}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {insight.description}
                      </p>

                      {/* Suggested Actions */}
                      {insight.suggestedActions && insight.suggestedActions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <p className="text-xs text-muted-foreground mb-2">Suggested actions:</p>
                          <div className="space-y-1.5">
                            {insight.suggestedActions.map((action, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs">
                                <span className="text-muted-foreground">→</span>
                                <span>{action.action}</span>
                                {action.toolName && (
                                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                                    {action.toolName}
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!compact && (
                        <div className="mt-3 text-xs text-muted-foreground">
                          {new Date(insight.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dismiss Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 shrink-0"
                    onClick={() => dismissInsight(insight.id)}
                    disabled={dismissing[insight.id]}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
