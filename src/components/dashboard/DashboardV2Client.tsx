"use client";

/**
 * Dashboard v2 Client Component
 *
 * Neptune-first dashboard experience - AI assistant is the primary interface.
 * Users see Neptune immediately on login, ready to help build their workspace.
 */

import { useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
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
  userName,
}: DashboardV2ClientProps) {
  // Real-time stats state - initialized from server data
  const [stats, setStats] = useState<DashboardStats>(initialData.stats);

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

  // Only show stats if user has data (not a new workspace with all zeros)
  const hasData = stats.activeAgents > 0 || stats.crmContacts > 0 || stats.financeConnections > 0;

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      {/* Header - Branded gradient */}
      <div className="border-b bg-gradient-to-r from-nebula-frost via-white to-nebula-frost/80 px-6 py-4">
        <div className="flex items-center justify-between pt-4">
          <PageTitle title="Dashboard" icon={Globe} />

          {/* Stats Bar - Only show when user has data */}
          {hasData && (
            <div className="hidden lg:flex flex-wrap items-center gap-3">
              {stats.activeAgents > 0 && (
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
              )}
              {stats.crmContacts > 0 && (
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
              )}
              {stats.financeConnections > 0 && (
                <Badge variant="soft" className="bg-nebula-blue/10 text-nebula-blue border-nebula-blue/20" size="pill">
                  <Plug aria-hidden="true" />
                  <span className="font-semibold">{stats.financeConnections}</span>
                  <span className="opacity-70 font-normal">Connected</span>
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area - Neptune Full Width */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {/* Neptune Chat Interface - Full width, minimal header for new users */}
        <div className="flex-1 min-h-0 p-6">
          <div className="h-full rounded-lg border-2 border-nebula-violet/20 bg-white/50 backdrop-blur-sm shadow-soft overflow-hidden">
            <NeptuneAssistPanel
              conversationId={null}
              conversation={null}
              variant="fullscreen"
              feature="dashboard"
              minimal={!hasData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
