"use client";

/**
 * Campaign Roadmap Card Component
 * 
 * Displays dynamic campaign creation roadmap items. Neptune builds this
 * roadmap based on the conversation and checks off items as they're completed.
 */

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/ui/page-title';
import { Compass, CheckCircle2, ChevronDown, ChevronUp, Rocket } from 'lucide-react';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

export interface CampaignRoadmapItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  value?: string; // captured value from Neptune
}

interface CampaignRoadmapCardProps {
  items: CampaignRoadmapItem[];
  completionPercentage: number;
  isReady: boolean; // all items complete
  onLaunch: () => void;
}

export default function CampaignRoadmapCard({
  items,
  completionPercentage,
  isReady,
  onLaunch,
}: CampaignRoadmapCardProps) {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const completedCount = items.filter(item => item.completed).length;
  const totalCount = items.length;

  const handleBadgeClick = (item: CampaignRoadmapItem, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Toggle expanded state
    if (expandedItemId === item.id) {
      setExpandedItemId(null);
    } else {
      setExpandedItemId(item.id);
    }
  };

  const handleLaunch = () => {
    if (!isReady) {
      toast.error('Please complete all roadmap items before launching');
      return;
    }
    onLaunch();
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      {/* Branded Header */}
      <div className="border-b bg-background px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <PageTitle
            title="Roadmap"
            icon={Compass}
            as="h2"
            titleClassName="text-base md:text-xl"
            iconClassName="w-6 h-6 md:w-6 md:h-6"
          />
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
              <Compass className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">
                Neptune will build your roadmap once we know what type of campaign you want to create.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="w-full bg-muted rounded-full h-2 mb-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {completionPercentage}% complete
              </p>
            </div>

            {/* Roadmap Items as Badges */}
            {isReady && (
              <div className="text-center py-4 mb-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-emerald-700 mb-3">
                  Ready to launch!
                </p>
                <Button
                  onClick={handleLaunch}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  aria-label="Launch campaign"
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  Launch Campaign
                </Button>
              </div>
            )}
            
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
                          : 'cursor-pointer bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      }`}
                      aria-label={item.completed ? `${item.title} (completed)` : `Click to view details for ${item.title}`}
                      aria-expanded={isExpanded}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {item.completed ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-600" />
                        ) : (
                          <div className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-emerald-600" />
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
                    {isExpanded && !item.completed && item.description && (
                      <div className="mt-2 p-3 rounded-lg border bg-background shadow-sm">
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
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
