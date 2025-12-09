"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ClipboardCheck,
  RefreshCw,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ApprovalQueue from "@/components/orchestration/ApprovalQueue";

interface ApprovalsPageClientProps {
  workspaceId: string;
}

export default function ApprovalsPageClient({
  workspaceId,
}: ApprovalsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamId = searchParams.get("team") || undefined;

  // Handle approval processed
  const handleApprovalProcessed = useCallback(() => {
    // Could trigger a notification or dashboard refresh
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <div className="border-b border-white/5 bg-gray-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/orchestration">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                  aria-label="Back to orchestration dashboard"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                  <ClipboardCheck className="h-8 w-8 text-yellow-400" />
                  <span className="tracking-wide">
                    <span className="hidden sm:inline">A P P R O V A L S</span>
                    <span className="sm:hidden">APPROVALS</span>
                  </span>
                </h1>
                <p className="text-gray-400 mt-1 text-sm">
                  Review and process pending autonomous actions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {teamId && (
                <Link href="/orchestration/approvals">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    Clear Filter
                  </Button>
                </Link>
              )}
              <Link href="/orchestration">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  View Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Info Banner */}
        <Card className="p-4 bg-gradient-to-r from-yellow-900/20 via-amber-900/20 to-orange-900/20 border-yellow-500/20">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-yellow-500/20 shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">Approval Queue</h3>
              <p className="text-sm text-gray-400 mt-1">
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
        <Card className="p-6 bg-gray-900/50 border-white/10">
          <h3 className="font-semibold text-white mb-4">Understanding Risk Levels</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <h4 className="font-medium text-green-400 mb-2">Low Risk</h4>
              <p className="text-sm text-gray-400">
                Internal operations, read-only actions, drafts, and notes. Usually auto-approved.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <h4 className="font-medium text-yellow-400 mb-2">Medium Risk</h4>
              <p className="text-sm text-gray-400">
                Creating or updating records, scheduling internal tasks. May be auto-approved
                based on learning.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <h4 className="font-medium text-orange-400 mb-2">High Risk</h4>
              <p className="text-sm text-gray-400">
                External communications, publishing content, modifying workflows. Always requires
                review.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <h4 className="font-medium text-red-400 mb-2">Critical</h4>
              <p className="text-sm text-gray-400">
                Financial transactions, deleting data, system changes. Requires careful review
                and explicit approval.
              </p>
            </div>
          </div>
        </Card>

        {/* Quick Links */}
        <div className="flex flex-wrap gap-4">
          <Link href="/orchestration/teams">
            <Button
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Manage Teams
            </Button>
          </Link>
          <Link href="/orchestration/workflows">
            <Button
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              View Workflows
            </Button>
          </Link>
          <Link href="/orchestration">
            <Button
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Department Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

