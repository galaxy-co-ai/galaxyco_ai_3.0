"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
            <Link href="/orchestration">
              <Button
                variant="ghost"
                size="sm"
                aria-label="Back to orchestration dashboard"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <ClipboardCheck 
                className="w-7 h-7"
                style={{
                  stroke: 'url(#icon-gradient-approvals)',
                  strokeWidth: 2,
                  filter: 'drop-shadow(0 2px 4px rgba(234, 179, 8, 0.15))'
                }}
              />
              <svg width="0" height="0" className="absolute">
                <defs>
                  <linearGradient id="icon-gradient-approvals" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                </defs>
              </svg>
              <div>
                <h1 
                  className="branded-page-title text-2xl uppercase"
                  style={{ 
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  <span className="hidden sm:inline">A P P R O V A L S</span>
                  <span className="sm:hidden">APPROVALS</span>
                </h1>
                <p className="text-muted-foreground text-sm">
                  Review and process pending autonomous actions
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {teamId && (
              <Link href="/orchestration/approvals">
                <Button
                  variant="outline"
                  size="sm"
                >
                  Clear Filter
                </Button>
              </Link>
            )}
            <Link href="/orchestration">
              <Button
                variant="outline"
                size="sm"
              >
                View Dashboard
              </Button>
            </Link>
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
          <Link href="/orchestration/teams">
            <Button variant="outline">
              Manage Teams
            </Button>
          </Link>
          <Link href="/orchestration/workflows">
            <Button variant="outline">
              View Workflows
            </Button>
          </Link>
          <Link href="/orchestration">
            <Button variant="outline">
              Department Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
