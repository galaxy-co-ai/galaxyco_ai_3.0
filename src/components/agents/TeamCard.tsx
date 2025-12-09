"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Play,
  Pause,
  Settings,
  Trash2,
  ChevronDown,
  ChevronUp,
  Bot,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentDepartment } from "@/lib/orchestration/types";

// Department icons and colors
const departmentConfig: Record<
  AgentDepartment,
  { icon: string; color: string; bgColor: string; borderColor: string }
> = {
  sales: {
    icon: "💰",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
  marketing: {
    icon: "📢",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  support: {
    icon: "🎧",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  operations: {
    icon: "⚙️",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  finance: {
    icon: "💳",
    color: "text-teal-700",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
  },
  product: {
    icon: "🚀",
    color: "text-indigo-700",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
  },
  general: {
    icon: "🤖",
    color: "text-gray-700",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
  },
};

export interface TeamMember {
  id: string;
  agentId: string;
  agentName: string;
  role: "coordinator" | "specialist" | "support";
  status: string;
}

export interface Team {
  id: string;
  name: string;
  department: AgentDepartment;
  description?: string;
  status: "active" | "paused" | "archived";
  memberCount: number;
  members?: TeamMember[];
  totalExecutions: number;
  successfulExecutions: number;
  lastActiveAt?: Date;
  config?: {
    autonomyLevel?: string;
    maxConcurrentTasks?: number;
  };
}

interface TeamCardProps {
  team: Team;
  isSelected?: boolean;
  onClick?: () => void;
  onRun?: (teamId: string) => void;
  onPause?: (teamId: string) => void;
  onConfigure?: (teamId: string) => void;
  onDelete?: (teamId: string) => void;
  isRunning?: boolean;
}

export default function TeamCard({
  team,
  isSelected = false,
  onClick,
  onRun,
  onPause,
  onConfigure,
  onDelete,
  isRunning = false,
}: TeamCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const config = departmentConfig[team.department] || departmentConfig.general;
  const successRate =
    team.totalExecutions > 0
      ? Math.round((team.successfulExecutions / team.totalExecutions) * 100)
      : 0;

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleRun = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRun?.(team.id);
  };

  const handlePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPause?.(team.id);
  };

  const handleConfigure = (e: React.MouseEvent) => {
    e.stopPropagation();
    onConfigure?.(team.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(team.id);
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-200 cursor-pointer",
        isSelected
          ? "ring-2 ring-primary shadow-md"
          : "hover:shadow-md hover:border-gray-300",
        team.status === "archived" && "opacity-60"
      )}
      onClick={onClick}
      role="button"
      aria-label={`Team ${team.name}`}
      aria-selected={isSelected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Main Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center text-lg",
                config.bgColor,
                config.borderColor,
                "border"
              )}
            >
              {config.icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{team.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge
                  variant="outline"
                  className={cn("text-xs capitalize", config.color, config.borderColor)}
                >
                  {team.department}
                </Badge>
                <Badge
                  variant={
                    team.status === "active"
                      ? "default"
                      : team.status === "paused"
                      ? "secondary"
                      : "outline"
                  }
                  className={cn(
                    "text-xs",
                    team.status === "active" && "bg-emerald-500 hover:bg-emerald-600"
                  )}
                >
                  {team.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {team.status === "active" ? (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={handleRun}
                disabled={isRunning}
                aria-label="Run team"
              >
                <Play className="h-4 w-4 text-emerald-600" />
              </Button>
            ) : team.status === "paused" ? (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={handleRun}
                aria-label="Resume team"
              >
                <Play className="h-4 w-4 text-blue-600" />
              </Button>
            ) : null}
            {team.status === "active" && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={handlePause}
                aria-label="Pause team"
              >
                <Pause className="h-4 w-4 text-amber-600" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={handleConfigure}
              aria-label="Configure team"
            >
              <Settings className="h-4 w-4 text-gray-600" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleDelete}
              aria-label="Delete team"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Description */}
        {team.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{team.description}</p>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-gray-600">
            <Users className="h-4 w-4" />
            <span>{team.memberCount} agents</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <Activity className="h-4 w-4" />
            <span>{team.totalExecutions} runs</span>
          </div>
          {team.totalExecutions > 0 && (
            <div
              className={cn(
                "flex items-center gap-1.5",
                successRate >= 80
                  ? "text-emerald-600"
                  : successRate >= 50
                  ? "text-amber-600"
                  : "text-red-600"
              )}
            >
              {successRate >= 80 ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : successRate >= 50 ? (
                <Clock className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <span>{successRate}% success</span>
            </div>
          )}
        </div>

        {/* Expand/Collapse Toggle */}
        {team.members && team.members.length > 0 && (
          <button
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mt-3 transition-colors"
            onClick={handleToggleExpand}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Hide team members" : "Show team members"}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                Hide members
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                Show {team.members.length} members
              </>
            )}
          </button>
        )}
      </div>

      {/* Expanded Members List */}
      {isExpanded && team.members && team.members.length > 0 && (
        <div className="border-t bg-gray-50/50 px-4 py-3">
          <div className="space-y-2">
            {team.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-700">
                    {member.agentName}
                  </span>
                  <Badge variant="outline" className="text-xs capitalize">
                    {member.role}
                  </Badge>
                </div>
                <Badge
                  variant={member.status === "active" ? "default" : "secondary"}
                  className={cn(
                    "text-xs",
                    member.status === "active" && "bg-emerald-500"
                  )}
                >
                  {member.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Running Indicator */}
      {isRunning && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-pulse" />
      )}
    </Card>
  );
}

