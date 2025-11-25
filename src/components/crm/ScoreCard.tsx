'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, Loader2 } from 'lucide-react';

interface ScoreCardProps {
  contactId: string;
  contactData: any;
}

export function ScoreCard({ contactId, contactData }: ScoreCardProps) {
  const [score, setScore] = useState<number | null>(null);
  const [tier, setTier] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchScore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId]);
  
  const fetchScore = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/crm/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, data: contactData }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setScore(data.score);
        setTier(data.tier || calculateTier(data.score));
      }
    } catch (err) {
      // Silently fail - optional feature
      setScore(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  const calculateTier = (scoreValue: number): string => {
    if (scoreValue >= 80) return 'A - High Priority';
    if (scoreValue >= 60) return 'B - Medium Priority';
    if (scoreValue >= 40) return 'C - Low Priority';
    return 'D - Nurture';
  };
  
  const getScoreColor = (scoreValue: number) => {
    if (scoreValue >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (scoreValue >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (scoreValue >= 40) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };
  
  const getTierColor = (tierValue: string) => {
    if (tierValue.startsWith('A')) return 'bg-green-100 text-green-800 border-green-200';
    if (tierValue.startsWith('B')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (tierValue.startsWith('C')) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-blue-500" />
            Lead Score
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  if (score === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-blue-500" />
            Lead Score
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32 text-sm text-muted-foreground">
          Score unavailable
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-blue-500" />
          Lead Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Circle */}
        <div className="flex items-center justify-center">
          <div className={`relative w-32 h-32 rounded-full border-4 flex items-center justify-center ${getScoreColor(score)}`}>
            <div className="text-center">
              <div className="text-4xl font-bold">{score}</div>
              <div className="text-xs text-muted-foreground">out of 100</div>
            </div>
          </div>
        </div>
        
        {/* Tier Badge */}
        <div className="flex justify-center">
          <Badge 
            className={getTierColor(tier)}
            variant="outline"
          >
            {tier}
          </Badge>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{score}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                score >= 80 ? 'bg-green-500' :
                score >= 60 ? 'bg-yellow-500' :
                score >= 40 ? 'bg-orange-500' :
                'bg-gray-400'
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
        
        {/* Score Factors */}
        <div className="space-y-2 pt-4 border-t">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            Key Factors
          </h4>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Engagement level
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Response time
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Deal potential
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}





