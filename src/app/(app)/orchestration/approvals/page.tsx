import { Metadata } from "next";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { getCurrentWorkspace } from "@/lib/auth";
import { logger } from "@/lib/logger";
import ApprovalsPageClient from "./ApprovalsPageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Approvals | Orchestration | GalaxyCo.ai",
  description: "Review and approve pending autonomous actions",
};

/**
 * Approvals Page
 *
 * Shows the approval queue for pending autonomous actions.
 * Allows bulk approve/reject operations with filtering.
 */
export default async function ApprovalsPage() {
  let workspaceId = "";

  try {
    const workspace = await getCurrentWorkspace();
    workspaceId = workspace.workspaceId;
  } catch (error) {
    logger.error("Approvals page error", { error });
  }

  return (
    <ErrorBoundary>
      <ApprovalsPageClient workspaceId={workspaceId} />
    </ErrorBoundary>
  );
}

