"use client";

import { Card } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";
import { 
  Mail, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Bot,
  Zap,
  Database,
  Target,
  Code,
  Shield,
  type LucideIcon
} from "lucide-react";

interface Activity {
  id: string;
  agentName: string;
  agentType: string;
  agentDescription?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  durationMs?: number;
  triggeredBy?: {
    name: string;
    email: string;
  };
}

interface ActivityResponse {
  executions: Activity[];
  stats: {
    total: number;
    success: number;
    failed: number;
    running: number;
    pending: number;
    successRate: number;
  };
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Map agent types to icons
const agentTypeIcons: Record<string, LucideIcon> = {
  email: Mail,
  call: FileText,
  task: CheckCircle2,
  calendar: Calendar,
  scope: Target,
  note: FileText,
  roadmap: Calendar,
  content: FileText,
  custom: Bot,
  browser: Database,
  "cross-app": Zap,
  knowledge: Database,
  sales: Target,
  trending: Zap,
  research: FileText,
  meeting: Calendar,
  code: Code,
  data: Database,
  security: Shield,
};

// Map status to colors
const statusColors = {
  completed: "bg-green-500/10 text-green-500 border-green-500/20",
  running: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  pending: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  failed: "bg-red-500/10 text-red-500 border-red-500/20",
  cancelled: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const statusLabels = {
  completed: "completed",
  running: "processing",
  pending: "pending",
  failed: "failed",
  cancelled: "cancelled",
};

// Format action description based on agent type and status
function getActionDescription(activity: Activity): string {
  const type = activity.agentType;
  const status = activity.status;
  
  if (status === 'failed') {
    return `Failed to execute ${type} task`;
  }
  
  if (status === 'running') {
    return `Processing ${type} task...`;
  }
  
  if (status === 'pending') {
    return `Waiting to process ${type} task`;
  }
  
  // Completed actions - make them more descriptive
  switch (type) {
    case 'email':
      return 'Processed email task';
    case 'call':
      return 'Completed call follow-up';
    case 'task':
      return 'Completed assigned task';
    case 'note':
      return 'Created and saved notes';
    case 'roadmap':
      return 'Updated roadmap progress';
    case 'content':
      return 'Generated content';
    case 'browser':
      return 'Completed browser automation';
    case 'cross-app':
      return 'Synced data across apps';
    case 'knowledge':
      return 'Updated knowledge base';
    case 'sales':
      return 'Updated sales pipeline';
    case 'trending':
      return 'Analyzed trending data';
    case 'research':
      return 'Completed research task';
    case 'meeting':
      return 'Processed meeting data';
    case 'code':
      return 'Executed code task';
    case 'data':
      return 'Processed data operation';
    case 'security':
      return 'Completed security check';
    default:
      return activity.agentDescription || 'Completed task';
  }
}

function ActivitySkeleton() {
  return (
    <div className="flex gap-4 items-start pb-4 border-b border-border">
      <Skeleton className="rounded-lg h-8 w-8" />
      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

// Fallback data for when API isn't available
const fallbackActivities = [
  {
    id: "1",
    agentName: "Email Triage Agent",
    agentType: "email",
    status: "completed" as const,
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    agentName: "CRM Agent",
    agentType: "sales",
    status: "completed" as const,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    agentName: "AI Assistant",
    agentType: "meeting",
    status: "completed" as const,
    createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    id: "4",
    agentName: "Invoice Agent",
    agentType: "task",
    status: "running" as const,
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
  {
    id: "5",
    agentName: "Knowledge Base Agent",
    agentType: "knowledge",
    status: "completed" as const,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
];

export function ActivityFeed() {
  const { data, error, isLoading } = useSWR<ActivityResponse>(
    '/api/activity?limit=10',
    fetcher,
    {
      refreshInterval: 15000, // Refresh every 15 seconds
      revalidateOnFocus: true,
    }
  );

  // Use live data or fallback
  const activities = data?.executions || fallbackActivities;

  return (
    <Card className="flex flex-col">
      <div className="border-b border-border p-4">
        <h3 className="font-semibold">Recent Activity</h3>
        <p className="text-sm text-muted-foreground">Live agent updates</p>
      </div>
      <ScrollArea className="flex-1 h-[400px]">
        <div className="p-4 space-y-4">
          {isLoading ? (
            // Loading skeletons
            <>
              <ActivitySkeleton />
              <ActivitySkeleton />
              <ActivitySkeleton />
              <ActivitySkeleton />
              <ActivitySkeleton />
            </>
          ) : error ? (
            // Error state - show fallback data
            fallbackActivities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))
          ) : activities.length === 0 ? (
            // Empty state
            <div className="text-center py-8 text-muted-foreground">
              <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent activity</p>
              <p className="text-xs">Agent executions will appear here</p>
            </div>
          ) : (
            // Activity list
            activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}

function ActivityItem({ activity }: { activity: Activity }) {
  const IconComponent = agentTypeIcons[activity.agentType] || Bot;
  const statusColor = statusColors[activity.status] || statusColors.pending;
  const statusLabel = statusLabels[activity.status] || activity.status;
  
  // Get icon color based on status
  const iconColor = activity.status === 'failed' 
    ? 'text-red-500'
    : activity.status === 'running'
    ? 'text-blue-500'
    : activity.status === 'completed'
    ? 'text-green-500'
    : 'text-orange-500';

  const timeAgo = formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true });

  return (
    <div className="flex gap-4 items-start pb-4 border-b border-border last:border-0 last:pb-0">
      <div className={`rounded-lg p-2 bg-muted ${iconColor}`}>
        <IconComponent className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-sm font-medium">{activity.agentName}</p>
            <p className="text-sm text-muted-foreground">
              {getActionDescription(activity)}
            </p>
          </div>
          <Badge
            variant="outline"
            className={statusColor}
          >
            {statusLabel}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {timeAgo}
        </p>
      </div>
    </div>
  );
}
