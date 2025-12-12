'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface InsightsPanelProps {
  contactId: string;
  contactData: any;
}

export function InsightsPanel({ contactId, contactData }: InsightsPanelProps) {
  const [insights, setInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const generateInsights = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/crm/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, data: contactData }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to generate insights');
      }
      
      const data = await res.json();
      setInsights(data.insights);
      toast.success('AI insights generated successfully!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate insights');
    } finally {
      setIsLoading(false);
    }
  };
  
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'concerned':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-purple-500" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!insights ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate AI-powered insights to understand this contact better.
            </p>
            <Button
              onClick={generateInsights}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Insights
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            {insights.summary && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  Summary
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {insights.summary}
                </p>
              </div>
            )}
            
            {/* Sentiment */}
            {insights.sentiment && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Sentiment Analysis</h4>
                <Badge 
                  className={getSentimentColor(insights.sentiment)}
                  variant="outline"
                >
                  {insights.sentiment.charAt(0).toUpperCase() + insights.sentiment.slice(1)}
                </Badge>
              </div>
            )}
            
            {/* Health Score */}
            {typeof insights.healthScore === 'number' && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Health Score
                </h4>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        insights.healthScore >= 80 ? 'bg-green-500' :
                        insights.healthScore >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${insights.healthScore}%` }}
                    />
                  </div>
                  <span className="text-lg font-bold">
                    {insights.healthScore}
                  </span>
                </div>
              </div>
            )}
            
            {/* Recommendations */}
            {insights.recommendations && insights.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Recommendations</h4>
                <ul className="space-y-2">
                  {insights.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-purple-500 mt-0.5">•</span>
                      <span className="text-muted-foreground flex-1">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Next Actions */}
            {insights.nextActions && insights.nextActions.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Suggested Next Actions</h4>
                <div className="space-y-2">
                  {insights.nextActions.map((action: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-purple-50 border border-purple-100">
                      <span className="text-sm text-purple-900">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Refresh Button */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={generateInsights}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-3 w-3" />
                    Refresh Insights
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}




























































