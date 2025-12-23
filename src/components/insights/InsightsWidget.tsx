'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface ProactiveInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'suggestion' | 'achievement';
  category: 'sales' | 'marketing' | 'operations' | 'finance' | 'content';
  title: string;
  description: string;
  priority: number;
}

export function InsightsWidget() {
  const [insights, setInsights] = useState<ProactiveInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  async function fetchInsights() {
    try {
      const response = await fetch('/api/insights?limit=3');
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

  const typeConfig = {
    opportunity: { emoji: '🎯', color: 'text-green-600' },
    warning: { emoji: '⚠️', color: 'text-orange-600' },
    suggestion: { emoji: '💡', color: 'text-blue-600' },
    achievement: { emoji: '✨', color: 'text-purple-600' },
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Proactive Insights</h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Proactive Insights</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          No insights yet. Keep working and we'll surface intelligent suggestions soon!
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Proactive Insights</h3>
        </div>
        <Link href="/insights">
          <Button variant="ghost" size="sm" className="h-8 text-xs">
            View All
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {insights.map((insight) => {
          const config = typeConfig[insight.type];
          return (
            <Link
              key={insight.id}
              href="/insights"
              className="block p-3 rounded-lg border border-border/50 hover:border-border hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-start gap-2.5">
                <span className="text-lg leading-none shrink-0">{config.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm leading-tight line-clamp-1">
                      {insight.title}
                    </h4>
                    {insight.priority >= 9 && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                        High
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
