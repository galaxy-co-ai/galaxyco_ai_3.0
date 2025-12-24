"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CollaborationHub } from '@/components/neptune-hq/tabs/CollaborationHub';
import { AnalyticsInsights } from '@/components/neptune-hq/tabs/AnalyticsInsights';
import { TrainingResources } from '@/components/neptune-hq/tabs/TrainingResources';
import { AgentPerformance } from '@/components/neptune-hq/tabs/AgentPerformance';
import { EmptyState } from '@/components/neptune-hq/shared/EmptyState';
import { useAuth } from '@clerk/nextjs';
import { 
  Users, 
  BarChart3, 
  BookOpen, 
  Bot, 
  Settings, 
  Users2,
} from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function NeptuneHQPage() {
  const { orgId } = useAuth();
  const [activeTab, setActiveTab] = useState('collaboration');

  // Fetch live user count for header badge
  const { data: liveData } = useSWR<{ activeUsers: number }>(
    orgId ? `/api/neptune-hq/active-conversations?workspaceId=${orgId}` : null,
    fetcher,
    { refreshInterval: 5000 }
  );

  return (
    <div className="flex flex-col h-full w-full">
      {/* Page Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Neptune HQ</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Complete transparency into your AI assistant
              </p>
            </div>
            {liveData && liveData.activeUsers > 0 && (
              <Badge variant="outline" className="gap-1.5 text-xs h-7">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                {liveData.activeUsers} {liveData.activeUsers === 1 ? 'person' : 'people'} active
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-7xl mx-auto px-6 py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Tab Navigation */}
            <TabsList className="w-full justify-start mb-4 bg-muted/50 h-9">
              <TabsTrigger value="collaboration" className="gap-1.5 text-xs h-7 px-3">
                <Users className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Collaboration</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1.5 text-xs h-7 px-3">
                <BarChart3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="training" className="gap-1.5 text-xs h-7 px-3">
                <BookOpen className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Training</span>
              </TabsTrigger>
              <TabsTrigger value="agents" className="gap-1.5 text-xs h-7 px-3">
                <Bot className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Agents</span>
              </TabsTrigger>
              <TabsTrigger value="team" className="gap-1.5 text-xs h-7 px-3">
                <Users2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Team</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-1.5 text-xs h-7 px-3">
                <Settings className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab Content */}
            <TabsContent value="collaboration" className="mt-0">
              <CollaborationHub />
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <AnalyticsInsights />
            </TabsContent>

            <TabsContent value="training" className="mt-0">
              <TrainingResources />
            </TabsContent>

            <TabsContent value="agents" className="mt-0">
              <AgentPerformance />
            </TabsContent>

            <TabsContent value="team" className="mt-0">
              <EmptyState
                icon={Users2}
                title="Team Management Coming Soon"
                description="Manage team members, roles, and permissions. See activity and collaboration metrics for your workspace."
              />
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <EmptyState
                icon={Settings}
                title="Settings Coming Soon"
                description="Configure Neptune's behavior, notification preferences, and workspace-wide settings."
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
