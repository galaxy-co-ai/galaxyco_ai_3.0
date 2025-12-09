"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Network,
  UsersRound,
  Workflow,
  ClipboardCheck,
  ArrowRight,
  Sparkles,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import DepartmentDashboard from "@/components/orchestration/DepartmentDashboard";

interface OrchestrationDashboardClientProps {
  workspaceId: string;
}

// Quick action cards for navigation
const quickActions = [
  {
    title: "Agent Teams",
    description: "Create and manage AI agent teams for different departments",
    href: "/orchestration/teams",
    icon: UsersRound,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    hoverBorder: "hover:border-blue-300",
    action: "View Teams",
  },
  {
    title: "Workflows",
    description: "Build multi-agent workflows with visual editor",
    href: "/orchestration/workflows",
    icon: Workflow,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    hoverBorder: "hover:border-purple-300",
    action: "View Workflows",
  },
  {
    title: "Approval Queue",
    description: "Review and approve pending autonomous actions",
    href: "/orchestration/approvals",
    icon: ClipboardCheck,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    hoverBorder: "hover:border-amber-300",
    action: "View Approvals",
  },
];

export default function OrchestrationDashboardClient({
  workspaceId,
}: OrchestrationDashboardClientProps) {
  const router = useRouter();

  const handleTeamClick = (teamId: string) => {
    router.push(`/orchestration/teams/${teamId}`);
  };

  const handleViewApprovals = (teamId?: string) => {
    if (teamId) {
      router.push(`/orchestration/approvals?team=${teamId}`);
    } else {
      router.push("/orchestration/approvals");
    }
  };

  return (
    <div className="flex h-full flex-col bg-gray-50/50">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4">
          <div className="flex items-center gap-3">
            <Network 
              className="w-7 h-7"
              style={{
                stroke: 'url(#icon-gradient-orchestration)',
                strokeWidth: 2,
                filter: 'drop-shadow(0 2px 4px rgba(139, 92, 246, 0.15))'
              }}
            />
            <svg width="0" height="0" className="absolute">
              <defs>
                <linearGradient id="icon-gradient-orchestration" x1="0%" y1="0%" x2="100%" y2="100%">
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
              <span className="hidden sm:inline">O R C H E S T R A T I O N</span>
              <span className="sm:hidden">ORCHESTRATION</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/orchestration/teams">
              <Button
                size="sm"
                className="bg-white hover:bg-white text-gray-700 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:-translate-y-px hover:shadow-lg active:scale-[0.98] active:shadow-sm border border-gray-200 transition-all duration-150 gap-2"
                aria-label="Create new team"
              >
                <Plus className="h-4 w-4" />
                New Team
              </Button>
            </Link>
            <Link href="/orchestration/workflows">
              <Button
                size="sm"
                className="bg-white hover:bg-white text-gray-700 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:-translate-y-px hover:shadow-lg active:scale-[0.98] active:shadow-sm border border-gray-200 transition-all duration-150 gap-2"
                aria-label="Create new workflow"
              >
                <Workflow className="h-4 w-4" />
                New Workflow
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-6 py-6 space-y-8">
        {/* Quick Actions Grid */}
        <section aria-labelledby="quick-actions-heading">
          <h2 id="quick-actions-heading" className="sr-only">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href}>
                  <Card
                    className={cn(
                      "p-5 cursor-pointer transition-all duration-200",
                      action.hoverBorder,
                      "hover:shadow-md",
                      "group"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "p-3 rounded-xl transition-colors",
                          action.bgColor,
                          "group-hover:scale-110 transform duration-200"
                        )}
                      >
                        <Icon className={cn("h-6 w-6", action.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold group-hover:text-violet-600 transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {action.description}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-violet-600 group-hover:text-violet-700">
                      <span>{action.action}</span>
                      <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Department Dashboard */}
        <section aria-labelledby="department-dashboard-heading">
          <DepartmentDashboard
            onTeamClick={handleTeamClick}
            onViewApprovals={handleViewApprovals}
          />
        </section>

        {/* Getting Started Tip */}
        <Card className="p-6 bg-gradient-to-r from-violet-50 via-purple-50 to-blue-50 border-violet-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-3 rounded-xl bg-violet-100">
              <Sparkles className="h-6 w-6 text-violet-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                Getting Started with Agent Orchestration
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Create agent teams for different departments (Sales, Marketing, Support),
                build multi-agent workflows, and enable autonomous operations with
                human oversight.
              </p>
            </div>
            <Link href="/orchestration/teams">
              <Button className="bg-violet-600 hover:bg-violet-700 text-white shrink-0">
                Create Your First Team
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
