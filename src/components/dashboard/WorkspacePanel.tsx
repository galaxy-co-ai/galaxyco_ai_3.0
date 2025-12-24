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
    <Card className="h-full flex flex-col overflow-hidden border-2 border-nebula-violet/20 bg-white/50 backdrop-blur-sm shadow-soft">
      {/* Tab Navigation - Pill toggle style matching Neptune */}
      <div className="border-b bg-background px-4 py-3 shrink-0">
        <div className="flex items-center rounded-lg border bg-muted/50 p-0.5 w-fit">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;

            return (
              <Button
                key={tab.value}
                variant={isActive ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'h-7 px-2 md:px-3 rounded-md transition-colors',
                  isActive ? 'shadow-sm' : 'hover:bg-transparent'
                )}
                aria-label={tab.label}
              >
                <Icon className="h-3.5 w-3.5 md:mr-1.5" />
                <span className="hidden md:inline">{tab.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden min-h-0 p-4">
        {activeTab === 'roadmap' && (
          <div className="h-full overflow-auto">
            <RoadmapCard
              items={roadmapItems}
              completionPercentage={completionPercentage}
            />
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="h-full overflow-auto">
            <InsightsWidget />
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="h-full overflow-hidden -m-4">
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
