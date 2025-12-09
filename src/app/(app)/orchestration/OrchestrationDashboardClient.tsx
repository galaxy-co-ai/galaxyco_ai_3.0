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
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    action: "View Teams",
  },
  {
    title: "Workflows",
    description: "Build multi-agent workflows with visual editor",
    href: "/orchestration/workflows",
    icon: Workflow,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    action: "View Workflows",
  },
  {
    title: "Approval Queue",
    description: "Review and approve pending autonomous actions",
    href: "/orchestration/approvals",
    icon: ClipboardCheck,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <div className="border-b border-white/5 bg-gray-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                <Network className="h-8 w-8 text-violet-400" />
                <span className="tracking-wide">
                  <span className="hidden sm:inline">O R C H E S T R A T I O N</span>
                  <span className="sm:hidden">ORCHESTRATION</span>
                </span>
              </h1>
              <p className="text-gray-400 mt-1 text-sm sm:text-base">
                Multi-agent orchestration for autonomous business operations
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/orchestration/teams">
                <Button
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                  aria-label="Create new team"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Team
                </Button>
              </Link>
              <Link href="/orchestration/workflows">
                <Button
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  aria-label="Create new workflow"
                >
                  <Workflow className="h-4 w-4 mr-2" />
                  New Workflow
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-8">
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
                      "p-5 bg-gray-900/50 border-white/10 cursor-pointer transition-all duration-200",
                      "hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5",
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
                        <h3 className="font-semibold text-white group-hover:text-violet-300 transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                          {action.description}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-violet-400 group-hover:text-violet-300">
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
        <Card className="p-6 bg-gradient-to-r from-violet-900/20 via-purple-900/20 to-blue-900/20 border-violet-500/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-3 rounded-xl bg-violet-500/20">
              <Sparkles className="h-6 w-6 text-violet-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">
                Getting Started with Agent Orchestration
              </h3>
              <p className="text-sm text-gray-400 mt-1">
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

