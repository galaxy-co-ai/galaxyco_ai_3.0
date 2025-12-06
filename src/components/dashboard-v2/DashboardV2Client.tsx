"use client";

/**
 * Dashboard v2 Client Component
 * 
 * Neptune-first dashboard experience - AI assistant is the primary interface.
 * Users see Neptune immediately on login, ready to help build their workspace.
 */

import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Users, 
  Bot, 
  Plug,
} from 'lucide-react';
import { DashboardV2Data } from '@/types/dashboard-v2';
import NeptuneAssistPanel from '@/components/conversations/NeptuneAssistPanel';
import NeptuneDashboardWelcome from './NeptuneDashboardWelcome';
import RoadmapCard from './RoadmapCard';

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
  const { stats } = initialData;

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-3">
            <Sparkles 
              className="w-7 h-7"
              style={{
                stroke: 'url(#icon-gradient-neptune)',
                strokeWidth: 2,
                filter: 'drop-shadow(0 2px 4px rgba(139, 92, 246, 0.15))'
              }}
            />
            <svg width="0" height="0" className="absolute">
              <defs>
                <linearGradient id="icon-gradient-neptune" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <h1 
              className="branded-page-title text-2xl uppercase"
              style={{ 
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
              }}
            >
              N E P T U N E
            </h1>
          </div>

          {/* Stats Bar */}
          <div className="hidden lg:flex flex-wrap items-center gap-3">
            <Badge className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors">
              <Bot className="h-3.5 w-3.5 mr-1.5 text-purple-600" />
              <span className="font-semibold">{stats.activeAgents}</span>
              <span className="ml-1 text-purple-600/70 font-normal">Agents</span>
            </Badge>
            <Badge className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors">
              <Users className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
              <span className="font-semibold">{stats.crmContacts}</span>
              <span className="ml-1 text-blue-600/70 font-normal">Contacts</span>
            </Badge>
            <Badge className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
              <Plug className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
              <span className="font-semibold">{stats.financeConnections}</span>
              <span className="ml-1 text-emerald-600/70 font-normal">Connected</span>
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

        {/* Content Split: 2/3 Neptune, 1/3 Roadmap */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 px-4 sm:px-6 pb-6">
          {/* Neptune Chat Interface - 2/3 width */}
          <div className="min-w-0 min-h-0 flex flex-col">
            <NeptuneAssistPanel
              conversationId={null}
              conversation={null}
              variant="fullscreen"
              feature="dashboard"
            />
          </div>

          {/* Roadmap Card - 1/3 width */}
          <div className="min-w-0 min-h-0 overflow-hidden flex flex-col">
            {workspaceId ? (
              <RoadmapCard workspaceId={workspaceId} />
            ) : (
              <div className="h-full p-6 bg-muted/50 rounded-lg flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading roadmap...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

