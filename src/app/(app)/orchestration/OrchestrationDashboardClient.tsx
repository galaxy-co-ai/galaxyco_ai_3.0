"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
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
          <PageTitle title="Orchestration" icon={Network} />

          <div className="flex items-center gap-3">
            <Button asChild size="sm" variant="surface" aria-label="Create new team">
              <Link href="/orchestration/teams">
                <Plus className="h-4 w-4" aria-hidden="true" />
                New Team
              </Link>
            </Button>
            <Button asChild size="sm" variant="surface" aria-label="Create new workflow">
              <Link href="/orchestration/workflows">
                <Workflow className="h-4 w-4" aria-hidden="true" />
                New Workflow
              </Link>
            </Button>
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
            <Button asChild className="shrink-0" aria-label="Create your first team">
              <Link href="/orchestration/teams">
                Create Your First Team
                <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
