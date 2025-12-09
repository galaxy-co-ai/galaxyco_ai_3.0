"use client";

/**
 * Roadmap Card Component
 * 
 * Displays dynamic roadmap items that Neptune builds based on conversation.
 * Items check off as Neptune helps the user complete them.
 * Now interactive - clicking items triggers Neptune prompts.
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Compass, CheckCircle2, ChevronDown, ChevronUp, Sparkles, MessageSquare } from 'lucide-react';

export interface DashboardRoadmapItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  value?: string; // captured value from Neptune
}

interface RoadmapCardProps {
  items: DashboardRoadmapItem[];
  completionPercentage: number;
  onItemClick?: (item: DashboardRoadmapItem) => void;
}

// Helper to dispatch Neptune prompt event
const sendNeptunePrompt = (prompt: string) => {
  const event = new CustomEvent('neptune-prompt', {
    detail: { prompt },
  });
  window.dispatchEvent(event);
};

export default function RoadmapCard({
  items,
  completionPercentage,
  onItemClick,
}: RoadmapCardProps) {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const completedCount = items.filter(item => item.completed).length;
  const totalCount = items.length;

  const handleBadgeClick = (item: DashboardRoadmapItem, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Toggle expanded state
    if (expandedItemId === item.id) {
      setExpandedItemId(null);
    } else {
      setExpandedItemId(item.id);
    }
  };

  const handleHelpClick = (item: DashboardRoadmapItem, e: React.MouseEvent) => {
    e.stopPropagation();
    // Send prompt to Neptune
    sendNeptunePrompt(`Help me with: ${item.title}. ${item.description || ''}`);
    // Call optional callback
    onItemClick?.(item);
    // Close expanded state
    setExpandedItemId(null);
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      {/* Branded Header */}
      <div className="border-b bg-background px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Compass 
              className="w-6 h-6"
              style={{
                stroke: 'url(#icon-gradient-dashboard-roadmap)',
                strokeWidth: 2,
                filter: 'drop-shadow(0 2px 4px rgba(139, 92, 246, 0.15))'
              }}
            />
            <svg width="0" height="0" className="absolute">
              <defs>
                <linearGradient id="icon-gradient-dashboard-roadmap" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            {/* Responsive title - compact on mobile, spaced on desktop */}
            <h2 
              className="branded-page-title-compact md:branded-page-title text-base md:text-xl uppercase"
              style={{ 
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
              }}
            >
              <span className="md:hidden">ROADMAP</span>
              <span className="hidden md:inline">R O A D M A P</span>
            </h2>
          </div>
          {totalCount > 0 && (
            <Badge variant="outline" className="text-xs">
              {completedCount}/{totalCount}
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col">
        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground mb-2">
                Tell Neptune what you&apos;d like to accomplish
              </p>
              <p className="text-xs text-muted-foreground/70">
                Neptune will build a personalized roadmap for you
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Progress Bar */}
            <div className="mb-4">
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

            {/* All Complete Message */}
            {completedCount === totalCount && totalCount > 0 && (
              <div className="text-center py-4 mb-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-700">
                  All done! 🎉
                </p>
                <p className="text-xs text-green-600/70 mt-1">
                  Ask Neptune what to tackle next
                </p>
              </div>
            )}
            
            {/* Roadmap Items as Badges */}
            <div className="space-y-2 flex-1">
              {items.map((item) => {
                const isExpanded = expandedItemId === item.id;
                
                return (
                  <div key={item.id} className="w-full">
                    <Badge
                      onClick={(e) => !item.completed && handleBadgeClick(item, e)}
                      className={`px-3 py-1.5 border transition-colors w-full justify-between ${
                        item.completed 
                          ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 cursor-default' 
                          : 'cursor-pointer bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                      }`}
                      aria-label={item.completed ? `${item.title} (completed)` : `Click to view details for ${item.title}`}
                      aria-expanded={isExpanded}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {item.completed ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-600" />
                        ) : (
                          <div className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-purple-600" />
                        )}
                        <span className="font-semibold truncate" title={item.title}>
                          {item.title}
                        </span>
                        {item.value && item.completed && (
                          <span className="text-xs text-green-600/70 ml-1 truncate" title={item.value}>
                            : {item.value}
                          </span>
                        )}
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
                      <div className="mt-2 p-3 rounded-lg border bg-background shadow-sm space-y-3">
                        {item.description && (
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs h-8 gap-1.5"
                          onClick={(e) => handleHelpClick(item, e)}
                        >
                          <MessageSquare className="h-3 w-3" />
                          Ask Neptune for help
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
