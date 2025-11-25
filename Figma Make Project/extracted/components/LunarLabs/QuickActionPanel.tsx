import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Zap, Plus, Download, Bookmark, Check } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { topics, type QuickAction } from '../../data/lunarLabsContent';

interface QuickActionPanelProps {
  topicId: string | null;
  onActionComplete?: (actionId: string) => void;
}

export function QuickActionPanel({ topicId, onActionComplete }: QuickActionPanelProps) {
  const topic = topics.find(t => t.id === topicId);
  
  const handleAction = (action: QuickAction) => {
    // Simulate action execution
    toast.loading(`${action.label}...`, { id: action.id });
    
    setTimeout(() => {
      toast.success('Action completed!', {
        id: action.id,
        description: action.description
      });
      
      if (onActionComplete) {
        onActionComplete(action.id);
      }
    }, 1000);
  };

  const categoryIcons = {
    enable: Zap,
    add: Plus,
    import: Download,
    bookmark: Bookmark
  };

  const categoryColors = {
    enable: 'purple',
    add: 'blue',
    import: 'green',
    bookmark: 'orange'
  };

  if (!topic || topic.quickActions.length === 0) {
    return null;
  }

  return (
    <Card className="p-2.5 border-purple-500/20">
      <div className="flex items-center gap-2 mb-1.5">
        <Zap className="w-4 h-4 text-purple-400" />
        <h3 className="text-xs">Quick Actions</h3>
        <Badge variant="outline" className="ml-auto text-[10px] h-4">Instant</Badge>
      </div>

      <div className="space-y-1.5">
        {topic.quickActions.map((action) => {
          const Icon = categoryIcons[action.category];
          const color = categoryColors[action.category];
          
          return (
            <div
              key={action.id}
              className={`p-2 border rounded bg-${color}-500/5 border-${color}-500/20 hover:border-${color}-500/40 transition-colors`}
            >
              <div className="flex items-start gap-2 mb-1.5">
                <div className={`w-6 h-6 rounded bg-${color}-500/20 flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-3 h-3 text-${color}-400`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs mb-0.5 line-clamp-1">{action.label}</h4>
                  <p className="text-[11px] text-gray-400 line-clamp-2">{action.description}</p>
                </div>
              </div>
              
              <Button
                size="sm"
                variant="outline"
                className="w-full h-7 text-xs"
                onClick={() => handleAction(action)}
              >
                {action.instant ? (
                  <>
                    <Zap className="w-2.5 h-2.5 mr-1" />
                    Apply Now
                  </>
                ) : (
                  <>
                    <Check className="w-2.5 h-2.5 mr-1" />
                    Enable
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
