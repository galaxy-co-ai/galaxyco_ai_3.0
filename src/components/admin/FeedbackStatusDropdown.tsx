"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  CheckCircle2, 
  Clock, 
  Eye, 
  Lightbulb, 
  PlayCircle, 
  XCircle,
  AlertCircle,
  ChevronDown
} from "lucide-react";
import { toast } from "sonner";

type FeedbackStatus = 'new' | 'in_review' | 'planned' | 'in_progress' | 'done' | 'closed' | 'wont_fix';

interface FeedbackStatusDropdownProps {
  feedbackId: string;
  currentStatus: FeedbackStatus;
  onStatusChange?: (newStatus: FeedbackStatus) => void;
}

const statusConfig: Record<FeedbackStatus, {
  label: string;
  icon: typeof CheckCircle2;
  bgColor: string;
  textColor: string;
  borderColor: string;
}> = {
  new: {
    label: 'New',
    icon: AlertCircle,
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-500/20',
  },
  in_review: {
    label: 'In Review',
    icon: Eye,
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-600',
    borderColor: 'border-amber-500/20',
  },
  planned: {
    label: 'Planned',
    icon: Lightbulb,
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-600',
    borderColor: 'border-purple-500/20',
  },
  in_progress: {
    label: 'In Progress',
    icon: PlayCircle,
    bgColor: 'bg-indigo-500/10',
    textColor: 'text-indigo-600',
    borderColor: 'border-indigo-500/20',
  },
  done: {
    label: 'Done',
    icon: CheckCircle2,
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-600',
    borderColor: 'border-green-500/20',
  },
  closed: {
    label: 'Closed',
    icon: XCircle,
    bgColor: 'bg-zinc-500/10',
    textColor: 'text-zinc-600',
    borderColor: 'border-zinc-500/20',
  },
  wont_fix: {
    label: "Won't Fix",
    icon: XCircle,
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-600',
    borderColor: 'border-red-500/20',
  },
};

export default function FeedbackStatusDropdown({ 
  feedbackId, 
  currentStatus,
  onStatusChange 
}: FeedbackStatusDropdownProps) {
  const [status, setStatus] = useState<FeedbackStatus>(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  const config = statusConfig[status];
  const Icon = config.icon;

  const handleStatusChange = async (newStatus: FeedbackStatus) => {
    if (newStatus === status) return;
    
    setIsUpdating(true);
    const previousStatus = status;
    
    // Optimistic update
    setStatus(newStatus);

    try {
      const response = await fetch(`/api/admin/feedback/${feedbackId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Notify parent of status change
      onStatusChange?.(newStatus);
      
      toast.success(`Status updated to ${statusConfig[newStatus].label}`);
    } catch (error) {
      // Revert on error
      setStatus(previousStatus);
      toast.error('Failed to update status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isUpdating}>
        <button 
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 ${config.bgColor} ${config.textColor} ${config.borderColor} ${isUpdating ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
          aria-label={`Change status from ${config.label}`}
        >
          <Icon className="h-3 w-3" />
          {config.label}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {(Object.keys(statusConfig) as FeedbackStatus[]).map((statusKey) => {
          const statusItem = statusConfig[statusKey];
          const StatusIcon = statusItem.icon;
          const isActive = statusKey === status;
          
          return (
            <DropdownMenuItem
              key={statusKey}
              onClick={() => handleStatusChange(statusKey)}
              className={`flex items-center gap-2 cursor-pointer ${isActive ? 'bg-muted' : ''}`}
            >
              <StatusIcon className={`h-4 w-4 ${statusItem.textColor}`} />
              <span>{statusItem.label}</span>
              {isActive && (
                <CheckCircle2 className="h-3 w-3 ml-auto text-green-500" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

