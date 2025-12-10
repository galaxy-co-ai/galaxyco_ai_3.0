import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Sparkles, ArrowRight, TrendingUp } from 'lucide-react';

interface Suggestion {
  id: string;
  title: string;
  reason: string;
  topicId: string;
  priority: 'high' | 'medium' | 'low';
}

interface SmartSuggestionsProps {
  suggestions: Suggestion[];
  onSelectSuggestion?: (topicId: string) => void;
}

export function SmartSuggestions({ suggestions, onSelectSuggestion }: SmartSuggestionsProps) {
  const priorityColors = {
    high: 'purple',
    medium: 'blue',
    low: 'gray'
  };

  return (
    <Card className="p-2.5 border-purple-500/20">
      <div className="flex items-center gap-2 mb-1.5">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <h3 className="text-xs">For You</h3>
      </div>

      <div className="space-y-1.5">
        {suggestions.map((suggestion) => {
          const color = priorityColors[suggestion.priority];
          
          return (
            <div
              key={suggestion.id}
              className={`p-2 border rounded bg-${color}-500/5 border-${color}-500/20 hover:border-${color}-500/40 transition-colors cursor-pointer`}
              onClick={() => onSelectSuggestion && onSelectSuggestion(suggestion.topicId)}
            >
              <div className="flex items-start justify-between gap-1.5 mb-1">
                <h4 className="text-xs flex-1 line-clamp-1">{suggestion.title}</h4>
                {suggestion.priority === 'high' && (
                  <Badge variant="outline" className="text-[10px] bg-purple-500/10 flex-shrink-0 h-4 px-1">
                    🔥
                  </Badge>
                )}
              </div>
              
              <p className="text-[11px] text-gray-400 line-clamp-2 mb-1.5">{suggestion.reason}</p>
              
              <div className="flex items-center text-[10px] text-purple-400">
                <span>Explore</span>
                <ArrowRight className="w-2.5 h-2.5 ml-1" />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
