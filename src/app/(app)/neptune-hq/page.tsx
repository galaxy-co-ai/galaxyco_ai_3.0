"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CollaborationHub } from '@/components/neptune-hq/tabs/CollaborationHub';
import { AnalyticsInsights } from '@/components/neptune-hq/tabs/AnalyticsInsights';
import { EmptyState } from '@/components/neptune-hq/shared/EmptyState';
import { useAuth } from '@clerk/nextjs';
import { 
  Users, 
  BarChart3, 
  Brain, 
  Sparkles, 
  Zap, 
  ShieldCheck,
  Clock,
  Lightbulb
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
        <div className="container max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold">Neptune HQ</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Complete transparency into your AI assistant
              </p>
            </div>
            {liveData && liveData.activeUsers > 0 && (
              <Badge variant="outline" className="gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                {liveData.activeUsers} {liveData.activeUsers === 1 ? 'person' : 'people'} active
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-7xl mx-auto px-6 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Tab Navigation */}
            <TabsList className="w-full justify-start mb-6 bg-muted/50">
              <TabsTrigger value="collaboration" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Collaboration</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="memory" className="gap-2">
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">Memory</span>
              </TabsTrigger>
              <TabsTrigger value="personality" className="gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Personality</span>
              </TabsTrigger>
              <TabsTrigger value="neural-connectors" className="gap-2">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Neural Connectors</span>
              </TabsTrigger>
              <TabsTrigger value="quality" className="gap-2">
                <ShieldCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Quality</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab Content */}
            <TabsContent value="collaboration" className="mt-0">
              <CollaborationHub />
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <AnalyticsInsights />
            </TabsContent>

            <TabsContent value="memory" className="mt-0">
              <EmptyState
                icon={Brain}
                title="Memory System Coming Soon"
                description="Track what Neptune remembers across conversations. View memory items, retention rates, and knowledge gaps."
              />
            </TabsContent>

            <TabsContent value="personality" className="mt-0">
              <EmptyState
                icon={Sparkles}
                title="Personality Settings Coming Soon"
                description="Fine-tune Neptune's tone, behavior preferences, and interaction style to match your team's needs."
              />
            </TabsContent>

            <TabsContent value="neural-connectors" className="mt-0">
              <EmptyState
                icon={Zap}
                title="Neural Connectors Coming Soon"
                description="Monitor Neptune's integrations and data sources. See which tools are being used and their performance metrics."
              />
            </TabsContent>

            <TabsContent value="quality" className="mt-0">
              <EmptyState
                icon={ShieldCheck}
                title="Quality Control Coming Soon"
                description="Review response accuracy, error rates, and user feedback. Track improvements and identify areas needing attention."
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
