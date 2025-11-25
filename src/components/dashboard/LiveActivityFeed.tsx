import { useState, useEffect } from "react";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Play,
  Pause,
  Zap,
  TrendingUp,
  Filter,
  X,
  Circle,
  ChevronRight
} from "lucide-react";

interface ActivityEvent {
  id: string;
  timestamp: Date;
  workflowName: string;
  nodeName: string;
  nodeId: number;
  status: 'running' | 'success' | 'error' | 'waiting';
  message: string;
  duration?: string;
  workflowId: number;
}

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // Simulate live activity updates
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const newActivity: ActivityEvent = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        workflowName: ['Email Automation', 'CRM Data Sync', 'Meeting Transcription'][Math.floor(Math.random() * 3)],
        nodeName: ['Monitor Inbox', 'Filter Invoices', 'Extract Data', 'Save to CRM', 'Read CRM Data', 'Join Meeting'][Math.floor(Math.random() * 6)],
        nodeId: Math.floor(Math.random() * 13) + 1,
        status: Math.random() > 0.1 ? 'success' : (Math.random() > 0.5 ? 'error' : 'running'),
        message: [
          'Email processed successfully',
          'Data extracted from invoice',
          'Record updated in CRM',
          'Meeting joined successfully',
          'Transcription in progress',
          'Filter matched 3 emails',
          'Failed to connect to API',
          'Retrying connection...',
        ][Math.floor(Math.random() * 8)],
        duration: `${(Math.random() * 2 + 0.5).toFixed(1)}s`,
        workflowId: Math.floor(Math.random() * 3) + 1,
      };

      setActivities(prev => [newActivity, ...prev].slice(0, 100)); // Keep last 100
    }, Math.random() * 3000 + 2000); // Random interval between 2-5 seconds

    return () => clearInterval(interval);
  }, [isPaused]);

  const filteredActivities = filterStatus
    ? activities.filter(a => a.status === filterStatus)
    : activities;

  const stats = {
    total: activities.length,
    success: activities.filter(a => a.status === 'success').length,
    error: activities.filter(a => a.status === 'error').length,
    running: activities.filter(a => a.status === 'running').length,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-3.5 w-3.5 text-red-600" />;
      case 'running':
        return <div className="h-3.5 w-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      case 'waiting':
        return <Clock className="h-3.5 w-3.5 text-amber-600" />;
      default:
        return <Circle className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'running':
        return 'bg-blue-50 border-blue-200';
      case 'waiting':
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-muted border-border';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });
  };

  const getRelativeTime = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className="w-96 bg-background border-l border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <h3 className="text-sm font-medium">Live Activity</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? (
                <Play className="h-3.5 w-3.5" />
              ) : (
                <Pause className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setActivities([])}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => setFilterStatus(null)}
            className={`p-2 rounded-lg border transition-all ${
              filterStatus === null
                ? 'bg-blue-50 border-blue-200'
                : 'bg-muted/30 border-border hover:bg-muted/50'
            }`}
          >
            <p className="text-xs text-muted-foreground mb-0.5">All</p>
            <p className="text-sm font-medium">{stats.total}</p>
          </button>
          <button
            onClick={() => setFilterStatus('success')}
            className={`p-2 rounded-lg border transition-all ${
              filterStatus === 'success'
                ? 'bg-green-50 border-green-200'
                : 'bg-muted/30 border-border hover:bg-muted/50'
            }`}
          >
            <p className="text-xs text-muted-foreground mb-0.5">Good</p>
            <p className="text-sm font-medium text-green-600">{stats.success}</p>
          </button>
          <button
            onClick={() => setFilterStatus('error')}
            className={`p-2 rounded-lg border transition-all ${
              filterStatus === 'error'
                ? 'bg-red-50 border-red-200'
                : 'bg-muted/30 border-border hover:bg-muted/50'
            }`}
          >
            <p className="text-xs text-muted-foreground mb-0.5">Error</p>
            <p className="text-sm font-medium text-red-600">{stats.error}</p>
          </button>
          <button
            onClick={() => setFilterStatus('running')}
            className={`p-2 rounded-lg border transition-all ${
              filterStatus === 'running'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-muted/30 border-border hover:bg-muted/50'
            }`}
          >
            <p className="text-xs text-muted-foreground mb-0.5">Live</p>
            <p className="text-sm font-medium text-blue-600">{stats.running}</p>
          </button>
        </div>
      </div>

      {/* Activity List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1.5">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">
                {filterStatus ? 'No matching activities' : 'No activity yet'}
              </p>
              {isPaused && (
                <p className="text-xs text-muted-foreground mt-1">
                  Activity feed is paused
                </p>
              )}
            </div>
          ) : (
            filteredActivities.map((activity, index) => (
              <div
                key={activity.id}
                className={`group relative p-3 rounded-lg border transition-all hover:shadow-sm cursor-pointer ${getStatusColor(activity.status)}`}
                style={{
                  animation: index === 0 ? 'slideIn 0.3s ease-out' : 'none',
                }}
              >
                {/* Status Indicator */}
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex-shrink-0">
                    {getStatusIcon(activity.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* Workflow & Node */}
                    <div className="flex items-center gap-1.5 mb-1">
                      <p className="text-xs font-medium truncate">{activity.workflowName}</p>
                      <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <p className="text-xs text-muted-foreground truncate">{activity.nodeName}</p>
                    </div>

                    {/* Message */}
                    <p className="text-xs text-foreground mb-1.5 leading-relaxed">
                      {activity.message}
                    </p>

                    {/* Time & Duration */}
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>{getRelativeTime(activity.timestamp)}</span>
                      {activity.duration && (
                        <>
                          <span>•</span>
                          <span>{activity.duration}</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="font-mono">{formatTime(activity.timestamp)}</span>
                    </div>
                  </div>

                  {/* Hover Actions */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer Stats */}
      {activities.length > 0 && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>
                {((stats.success / stats.total) * 100).toFixed(1)}% success rate
              </span>
            </div>
            <div className="text-muted-foreground">
              {activities.length} events
            </div>
          </div>
        </div>
      )}

      {/* CSS for animation */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
