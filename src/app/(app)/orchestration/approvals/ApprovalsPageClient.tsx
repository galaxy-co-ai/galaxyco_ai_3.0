"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import {
  ChevronLeft,
  ClipboardCheck,
  AlertTriangle,
} from "lucide-react";
import ApprovalQueue from "@/components/orchestration/ApprovalQueue";

interface ApprovalsPageClientProps {
  workspaceId: string;
}

export default function ApprovalsPageClient({
  workspaceId,
}: ApprovalsPageClientProps) {
  const searchParams = useSearchParams();
  const teamId = searchParams.get("team") || undefined;

  // Handle approval processed
  const handleApprovalProcessed = useCallback(() => {
    // Could trigger a notification or dashboard refresh
  }, []);

  return (
    <div className="flex h-full flex-col bg-gray-50/50">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4">
          <div className="flex items-center gap-4">
            <Button
              asChild
              size="sm"
              variant="surface"
              aria-label="Back to orchestration dashboard"
            >
              <Link href="/orchestration">
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Back
              </Link>
            </Button>

            <PageTitle
              title="Approvals"
              icon={ClipboardCheck}
              gradientFrom="#eab308"
              gradientTo="#f97316"
            />
          </div>
          <div className="flex items-center gap-2">
            {teamId && (
              <Button asChild size="sm" variant="surface">
                <Link href="/orchestration/approvals">Clear Filter</Link>
              </Button>
            )}
            <Button asChild size="sm" variant="surface">
              <Link href="/orchestration">View Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-6 py-6 space-y-6">
        {/* Info Banner */}
        <Card className="p-4 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-amber-200">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-amber-100 shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Approval Queue</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Actions here require your review before execution. Higher risk actions need
                more careful consideration. You can approve or reject individually or in bulk.
              </p>
            </div>
          </div>
        </Card>

        {/* Approval Queue Component */}
        <ApprovalQueue
          teamId={teamId}
          onApprovalProcessed={handleApprovalProcessed}
        />

        {/* Help Section */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Understanding Risk Levels</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <h4 className="font-medium text-green-700 mb-2">Low Risk</h4>
              <p className="text-sm text-muted-foreground">
                Internal operations, read-only actions, drafts, and notes. Usually auto-approved.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <h4 className="font-medium text-yellow-700 mb-2">Medium Risk</h4>
              <p className="text-sm text-muted-foreground">
                Creating or updating records, scheduling internal tasks. May be auto-approved
                based on learning.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
              <h4 className="font-medium text-orange-700 mb-2">High Risk</h4>
              <p className="text-sm text-muted-foreground">
                External communications, publishing content, modifying workflows. Always requires
                review.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <h4 className="font-medium text-red-700 mb-2">Critical</h4>
              <p className="text-sm text-muted-foreground">
                Financial transactions, deleting data, system changes. Requires careful review
                and explicit approval.
              </p>
            </div>
          </div>
        </Card>

        {/* Quick Links */}
        <div className="flex flex-wrap gap-4">
          <Button asChild variant="outline">
            <Link href="/orchestration/teams">Manage Teams</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/orchestration/workflows">View Workflows</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/orchestration">Department Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
