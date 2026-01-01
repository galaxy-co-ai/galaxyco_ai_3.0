"use client";

/**
 * Dashboard v2 Client Component
 *
 * Perplexity-inspired minimal dashboard - Neptune-first, chat-focused experience.
 * Clean, professional interface with maximum focus on AI conversation.
 */

import { useState, useCallback } from 'react';
import NeptuneAssistPanel from '@/components/conversations/NeptuneAssistPanel';
import { useRealtime } from '@/hooks/use-realtime';
import type { PusherEvent } from '@/lib/pusher-client';
import { DashboardV2Data, DashboardStats } from '@/types/dashboard';

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

  // Check if user is new (no data yet)
  const hasData = stats.activeAgents > 0 || stats.crmContacts > 0 || stats.financeConnections > 0;

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-950">
      {/* Full-height Neptune Chat Interface */}
      <div className="flex-1 overflow-hidden">
        <NeptuneAssistPanel
          conversationId={null}
          conversation={null}
          variant="fullscreen"
          feature="dashboard"
          minimal={!hasData}
        />
      </div>
    </div>
  );
}
