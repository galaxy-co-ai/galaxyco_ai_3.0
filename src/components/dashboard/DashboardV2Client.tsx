"use client";

/**
 * Dashboard v2 Client Component
 * 
 * Neptune-first dashboard experience - AI assistant is the primary interface.
 * Users see Neptune immediately on login, ready to help build their workspace.
 * Roadmap is built dynamically by Neptune based on user's goals.
 */

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PageTitle } from '@/components/ui/page-title';
import { 
  Globe, 
  Users, 
  Bot, 
  Plug,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { DashboardV2Data, DashboardStats } from '@/types/dashboard';
import NeptuneAssistPanel from '@/components/conversations/NeptuneAssistPanel';
import NeptuneDashboardWelcome from './NeptuneDashboardWelcome';
import { DashboardRoadmapItem } from './RoadmapCard';
import WorkspacePanel from './WorkspacePanel';
import { useNeptune } from '@/contexts/neptune-context';
import { useRealtime } from '@/hooks/use-realtime';
import type { PusherEvent } from '@/lib/pusher-client';

interface DashboardV2ClientProps {
  initialData: DashboardV2Data;
  userId: string;
  workspaceId: string;
  userName: string;
}

export default function DashboardV2Client({ 
  initialData, 
  userId, 
  workspaceId, 
  userName 
}: DashboardV2ClientProps) {
  const { messages } = useNeptune();
  
  // Real-time stats state - initialized from server data
  const [stats, setStats] = useState<DashboardStats>(initialData.stats);
  
  // Dynamic roadmap state
  const [roadmapItems, setRoadmapItems] = useState<DashboardRoadmapItem[]>([]);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Real-time event handlers for optimistic stats updates
  const handleAgentUpdate = useCallback((event: PusherEvent) => {
    const eventType = event.type as string;
    setStats((prev) => {
      if (eventType === 'agent:started' || eventType === 'agent:completed') {
        return { ...prev, activeAgents: prev.activeAgents }; // Activity tracked elsewhere
      }
      if (eventType === 'agent:created') {
        return { ...prev, totalAgents: prev.totalAgents + 1, activeAgents: prev.activeAgents + 1 };
      }
      if (eventType === 'agent:deleted') {
        return { ...prev, totalAgents: Math.max(0, prev.totalAgents - 1) };
      }
      return prev;
    });
  }, []);

  const handleLeadUpdate = useCallback((event: PusherEvent) => {
    const eventType = event.type as string;
    setStats((prev) => {
      if (eventType === 'lead:created' || eventType === 'contact:created') {
        return { ...prev, crmContacts: prev.crmContacts + 1 };
      }
      if (eventType === 'lead:deleted' || eventType === 'contact:deleted') {
        return { ...prev, crmContacts: Math.max(0, prev.crmContacts - 1) };
      }
      return prev;
    });
  }, []);

  // Subscribe to real-time workspace events
  useRealtime({
    workspaceId,
    userId,
    onAgentUpdate: handleAgentUpdate,
    onLeadUpdate: handleLeadUpdate,
    enabled: !!workspaceId,
  });

  // Calculate completion percentage when items change
  useEffect(() => {
    if (roadmapItems.length === 0) {
      setCompletionPercentage(0);
      return;
    }

    const completed = roadmapItems.filter(item => item.completed).length;
    const percentage = Math.round((completed / roadmapItems.length) * 100);
    setCompletionPercentage(percentage);
  }, [roadmapItems]);

  // Watch Neptune messages for tool results and dispatch events
  useEffect(() => {
    // Get the last assistant message
    const lastMessage = messages.filter(m => m.role === 'assistant').pop();
    if (!lastMessage || !lastMessage.metadata?.functionCalls) return;

    // Check for tool results in function calls
    for (const funcCall of lastMessage.metadata.functionCalls) {
      const result = funcCall.result?.data as Record<string, unknown> | undefined;
      if (!result) continue;

      // Handle update_dashboard_roadmap tool
      if (funcCall.name === 'update_dashboard_roadmap' && result.dispatchEvent === 'dashboard-roadmap-update') {
        const event = new CustomEvent('dashboard-roadmap-update', {
          detail: {
            action: result.action,
            items: result.items,
          },
        });
        window.dispatchEvent(event);
      }
    }
  }, [messages]);

  // Listen for roadmap updates from Neptune (via custom events)
  useEffect(() => {
    const handleRoadmapUpdate = (event: CustomEvent) => {
      const { action, items } = event.detail;
      
      if (action === 'add') {
        // Add new items to roadmap
        setRoadmapItems(prev => {
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = items
            .filter((item: DashboardRoadmapItem) => !existingIds.has(item.id))
            .map((item: DashboardRoadmapItem) => ({ ...item, completed: false }));
          return [...prev, ...newItems];
        });
      } else if (action === 'complete') {
        // Mark items as completed
        setRoadmapItems(prev => 
          prev.map(item => {
            const updated = items.find((i: DashboardRoadmapItem) => i.id === item.id);
            if (updated) {
              return { ...item, completed: true, value: updated.value };
            }
            return item;
          })
        );
      } else if (action === 'replace') {
        // Replace entire roadmap (when Neptune builds it initially)
        const newItems = items.map((item: DashboardRoadmapItem) => ({
          ...item,
          completed: item.completed || false,
        }));
        setRoadmapItems(newItems);
      }
    };

    window.addEventListener('dashboard-roadmap-update', handleRoadmapUpdate as unknown as EventListener);
    return () => {
      window.removeEventListener('dashboard-roadmap-update', handleRoadmapUpdate as unknown as EventListener);
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      {/* Header - Branded gradient */}
      <div className="border-b bg-gradient-to-r from-nebula-frost via-white to-nebula-frost/80 px-6 py-4">
        <div className="flex items-center justify-between pt-4">
          <PageTitle title="Dashboard" icon={Globe} />

          {/* Stats Bar with Trends */}
          <div className="hidden lg:flex flex-wrap items-center gap-3">
            <Badge variant="soft" className="bg-nebula-violet/10 text-nebula-violet border-nebula-violet/20" size="pill">
              <Bot aria-hidden="true" />
              <span className="font-semibold">{stats.activeAgents}</span>
              <span className="opacity-70 font-normal">Agents</span>
              {stats.trends?.agents && stats.trends.agents.change > 0 && (
                <span className={`ml-1 text-xs flex items-center gap-0.5 ${
                  stats.trends.agents.isIncrease ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats.trends.agents.isIncrease ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {stats.trends.agents.change}%
                </span>
              )}
            </Badge>
            <Badge variant="soft" className="bg-nebula-teal/10 text-nebula-teal border-nebula-teal/20" size="pill">
              <Users aria-hidden="true" />
              <span className="font-semibold">{stats.crmContacts}</span>
              <span className="opacity-70 font-normal">Contacts</span>
              {stats.trends?.contacts && stats.trends.contacts.change > 0 && (
                <span className={`ml-1 text-xs flex items-center gap-0.5 ${
                  stats.trends.contacts.isIncrease ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats.trends.contacts.isIncrease ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {stats.trends.contacts.change}%
                </span>
              )}
            </Badge>
            <Badge variant="soft" className="bg-nebula-blue/10 text-nebula-blue border-nebula-blue/20" size="pill">
              <Plug aria-hidden="true" />
              <span className="font-semibold">{stats.financeConnections}</span>
              <span className="opacity-70 font-normal">Connected</span>
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content Area - 2/3 Neptune, 1/3 Roadmap */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {/* Welcome Message - Above content */}
        {userId && workspaceId && (
          <div className="px-6 pt-6 pb-4 shrink-0">
            <NeptuneDashboardWelcome
              userId={userId}
              workspaceId={workspaceId}
              userName={userName}
            />
          </div>
        )}

        {/* Content Grid: Neptune (main), Workspace Panel (right) */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 px-6 pt-4 pb-6">
          {/* Neptune Chat Interface - Main column with branded border */}
          <div className="min-w-0 min-h-0 flex flex-col rounded-lg border-2 border-nebula-violet/20 bg-white/50 backdrop-blur-sm shadow-soft overflow-hidden">
            <NeptuneAssistPanel
              conversationId={null}
              conversation={null}
              variant="fullscreen"
              feature="dashboard"
            />
          </div>

          {/* Right Column: Tabbed Workspace Panel (Roadmap / Insights / Activity) */}
          <div className="min-w-0 min-h-0">
            {workspaceId && workspaceId.trim() !== '' ? (
              <WorkspacePanel
                workspaceId={workspaceId}
                userId={userId}
                roadmapItems={roadmapItems}
                completionPercentage={completionPercentage}
              />
            ) : (
              <Card className="h-full flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Unable to load workspace</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
