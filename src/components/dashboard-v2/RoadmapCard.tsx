"use client";

/**
 * Roadmap Card Component
 * 
 * Displays a checklist of important setup tasks for optimal workspace configuration.
 * Tasks are dynamically generated based on workspace health and completion status.
 */

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Sparkles, Bot, Users, FolderOpen, Plug, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RoadmapCardProps {
  workspaceId: string;
}

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  action?: {
    type: 'navigate' | 'neptune';
    target: string;
    prompt?: string;
  };
  icon: string; // Icon name as string
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Bot,
  Users,
  FolderOpen,
  Plug,
  Sparkles,
};

interface RoadmapData {
  items: RoadmapItem[];
  completionPercentage: number;
}

export default function RoadmapCard({ workspaceId }: RoadmapCardProps) {
  const router = useRouter();
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRoadmapData() {
      if (!workspaceId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/dashboard/roadmap?workspaceId=${workspaceId}`);
        if (response.ok) {
          const data = await response.json();
          setRoadmapData(data);
        } else {
          console.error('Roadmap API error:', response.status, response.statusText);
          // Set empty data on error so component still renders
          setRoadmapData({ items: [], completionPercentage: 0 });
        }
      } catch (error) {
        console.error('Error fetching roadmap data', error);
        // Set empty data on error so component still renders
        setRoadmapData({ items: [], completionPercentage: 0 });
      } finally {
        setIsLoading(false);
      }
    }

    fetchRoadmapData();

    // Refresh roadmap when workspace actions complete (listen for custom event)
    const handleRoadmapRefresh = () => {
      fetchRoadmapData();
    };

    window.addEventListener('roadmap-refresh', handleRoadmapRefresh);
    return () => {
      window.removeEventListener('roadmap-refresh', handleRoadmapRefresh);
    };
  }, [workspaceId]);

  if (isLoading) {
    return (
      <Card className="h-full p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h3 className="font-semibold text-lg">Your Roadmap</h3>
        </div>
        <div className="space-y-3 flex-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </Card>
    );
  }

  // If no data, show empty state
  if (!roadmapData) {
    return (
      <Card className="h-full p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h3 className="font-semibold text-lg">Your Roadmap</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Unable to load roadmap</p>
        </div>
      </Card>
    );
  }

  const { items, completionPercentage } = roadmapData;
  const incompleteItems = items.filter(item => !item.completed);
  const completedCount = items.length - incompleteItems.length;

  const handleItemClick = (item: RoadmapItem) => {
    if (item.completed) return;

    if (item.action?.type === 'navigate') {
      router.push(item.action.target);
    } else if (item.action?.type === 'neptune' && item.action.prompt) {
      // Trigger Neptune with the prompt
      // This will be handled by passing the prompt to Neptune via a custom event or context
      const event = new CustomEvent('neptune-prompt', { 
        detail: { prompt: item.action.prompt } 
      });
      window.dispatchEvent(event);
    }
  };

  return (
    <Card className="h-full p-6 flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold text-lg">Your Roadmap</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            {completedCount}/{items.length}
          </Badge>
        </div>
        <div className="w-full bg-muted rounded-full h-2 mb-2">
          <div
            className="bg-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {completionPercentage}% complete
        </p>
      </div>

      {/* Roadmap Items */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {incompleteItems.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">
              All set! 🎉
            </p>
            <p className="text-xs text-muted-foreground">
              Your workspace is fully configured.
            </p>
          </div>
        ) : (
          incompleteItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`p-4 rounded-lg border transition-all cursor-pointer group ${
                item.completed
                  ? 'bg-muted/50 border-muted'
                  : item.priority === 'high'
                  ? 'border-purple-200 bg-purple-50/50 hover:bg-purple-50 hover:border-purple-300'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {item.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground group-hover:text-purple-500 transition-colors" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    {(() => {
                      const IconComponent = iconMap[item.icon] || Sparkles;
                      return <IconComponent className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />;
                    })()}
                    <h4 className={`text-sm font-medium ${
                      item.completed ? 'text-muted-foreground line-through' : 'text-foreground'
                    }`}>
                      {item.title}
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {item.description}
                  </p>
                  {item.action && !item.completed && (
                    <div className="flex items-center gap-1 text-xs text-purple-600 group-hover:text-purple-700">
                      <span>Get started</span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
