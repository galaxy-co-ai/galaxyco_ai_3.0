'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Compass, Target, FolderKanban, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import CompassTab from './CompassTab';
import VisionTab from './VisionTab';
import BoardsTab from './BoardsTab';

interface WorkspacePanelProps {
  workspaceId: string;
  userId: string;
}

type TabValue = 'compass' | 'vision' | 'boards';

interface Tab {
  value: TabValue;
  label: string;
  icon: LucideIcon;
}

const TABS: Tab[] = [
  { value: 'compass', label: 'Compass', icon: Compass },
  { value: 'vision', label: 'Vision', icon: Target },
  { value: 'boards', label: 'Boards', icon: FolderKanban },
];

export default function WorkspacePanel({
  workspaceId,
  userId,
}: WorkspacePanelProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('compass');

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
        {activeTab === 'compass' && (
          <div className="h-full overflow-auto">
            <CompassTab workspaceId={workspaceId} />
          </div>
        )}

        {activeTab === 'vision' && (
          <div className="h-full overflow-auto">
            <VisionTab workspaceId={workspaceId} />
          </div>
        )}

        {activeTab === 'boards' && (
          <div className="h-full overflow-auto">
            <BoardsTab workspaceId={workspaceId} />
          </div>
        )}
      </div>
    </Card>
  );
}
