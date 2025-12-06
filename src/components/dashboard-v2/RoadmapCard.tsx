"use client";

/**
 * Roadmap Card Component
 * 
 * Displays roadmap items as badges. Users complete items by discussing with Neptune,
 * who executes the necessary actions.
 */

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Bot, Users, FolderOpen, Plug, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { logger } from '@/lib/logger';

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
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

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
          logger.error('Roadmap API error', { status: response.status, statusText: response.statusText });
          // Set empty data on error so component still renders
          setRoadmapData({ items: [], completionPercentage: 0 });
        }
      } catch (error) {
        logger.error('Error fetching roadmap data', error);
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

  const handleBadgeClick = (item: RoadmapItem, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Toggle expanded state
    if (expandedItemId === item.id) {
      setExpandedItemId(null);
    } else {
      setExpandedItemId(item.id);
    }
  };

  const handleCompleteWithNeptune = (item: RoadmapItem) => {
    if (item.completed) return;

    // Trigger Neptune conversation for roadmap items
    // Neptune will help the user complete the task
    const prompt = item.action?.prompt || `Help me ${item.title.toLowerCase()}`;
    const event = new CustomEvent('neptune-prompt', { 
      detail: { prompt } 
    });
    window.dispatchEvent(event);
    
    // Close dropdown after triggering Neptune
    setExpandedItemId(null);
  };

  const getBadgeColor = (item: RoadmapItem) => {
    if (item.completed) {
      return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
    }
    
    switch (item.priority) {
      case 'high':
        return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100';
      case 'medium':
        return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
    }
  };

  const getIconColor = (item: RoadmapItem) => {
    if (item.completed) {
      return 'text-green-600';
    }
    
    switch (item.priority) {
      case 'high':
        return 'text-purple-600';
      case 'medium':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
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

      {/* Roadmap Items as Badges */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No roadmap items</p>
          </div>
        ) : incompleteItems.length === 0 ? (
          <div className="text-center py-4 mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-3">
              All roadmap items complete! 🎉
            </p>
          </div>
        ) : null}
        
        <div className="space-y-2">
          {items.map((item) => {
            const IconComponent = iconMap[item.icon] || Sparkles;
            const isExpanded = expandedItemId === item.id;
            
            return (
              <div key={item.id} className="w-full">
                <Badge
                  onClick={(e) => handleBadgeClick(item, e)}
                  className={`px-3 py-1.5 border transition-colors w-full justify-between ${
                    item.completed 
                      ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 cursor-default' 
                      : `cursor-pointer ${getBadgeColor(item)}`
                  }`}
                  aria-label={item.completed ? `${item.title} (completed)` : `Click to view details for ${item.title}`}
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {item.completed ? (
                      <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${getIconColor(item)}`} />
                    ) : (
                      <IconComponent className={`h-3.5 w-3.5 shrink-0 ${getIconColor(item)}`} />
                    )}
                    <span className="font-semibold truncate" title={item.title}>
                      {item.title}
                    </span>
                  </div>
                  {!item.completed && (
                    <div className="shrink-0 ml-1.5">
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </div>
                  )}
                </Badge>
                
                {/* Expanded Dropdown */}
                {isExpanded && !item.completed && (
                  <div className="mt-2 p-3 rounded-lg border bg-background shadow-sm">
                    <p className="text-sm text-muted-foreground mb-3">
                      {item.description}
                    </p>
                    <button
                      onClick={() => handleCompleteWithNeptune(item)}
                      className="w-full px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 transition-colors"
                      aria-label={`Complete ${item.title} with Neptune`}
                    >
                      Complete with Neptune
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
