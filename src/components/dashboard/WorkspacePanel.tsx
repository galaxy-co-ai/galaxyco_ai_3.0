'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Compass, Sparkles, Activity, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import RoadmapCard, { DashboardRoadmapItem } from './RoadmapCard';
import { InsightsWidget } from '@/components/insights/InsightsWidget';
import ActivityFeed from './ActivityFeed';

interface WorkspacePanelProps {
  workspaceId: string;
  userId: string;
  roadmapItems: DashboardRoadmapItem[];
  completionPercentage: number;
}

type TabValue = 'roadmap' | 'insights' | 'activity';

interface Tab {
  value: TabValue;
  label: string;
  icon: LucideIcon;
}

const TABS: Tab[] = [
  { value: 'roadmap', label: 'Roadmap', icon: Compass },
  { value: 'insights', label: 'Insights', icon: Sparkles },
  { value: 'activity', label: 'Activity', icon: Activity },
];

export default function WorkspacePanel({
  workspaceId,
  userId,
  roadmapItems,
  completionPercentage,
}: WorkspacePanelProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('roadmap');

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      {/* Tab Navigation */}
      <div className="border-b bg-background shrink-0">
        <div className="flex items-center px-3 py-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;

            return (
              <Button
                key={tab.value}
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'relative h-9 px-3 rounded-md transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive && 'bg-accent text-accent-foreground font-medium'
                )}
                aria-label={tab.label}
              >
                {/* Icon - always visible */}
                <Icon className={cn(
                  'h-4 w-4',
                  'lg:mr-2' // Add margin on laptop+ when label shows
                )} />
                
                {/* Label - hidden below laptop, visible on laptop+ */}
                <span className="hidden lg:inline">{tab.label}</span>

                {/* Active indicator */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden min-h-0">
        {activeTab === 'roadmap' && (
          <div className="h-full overflow-auto">
            <div className="p-4">
              <RoadmapCard
                items={roadmapItems}
                completionPercentage={completionPercentage}
              />
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="h-full overflow-auto">
            <div className="p-4">
              <InsightsWidget />
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="h-full overflow-hidden">
            {workspaceId && workspaceId.trim() !== '' ? (
              <ActivityFeed workspaceId={workspaceId} userId={userId} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Unable to load activity</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
