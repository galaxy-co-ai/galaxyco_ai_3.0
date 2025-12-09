import { Metadata } from "next";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { getCurrentWorkspace } from "@/lib/auth";
import { logger } from "@/lib/logger";
import OrchestrationDashboardClient from "./OrchestrationDashboardClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Orchestration | GalaxyCo.ai",
  description: "Multi-agent orchestration dashboard - coordinate AI teams and autonomous workflows",
};

/**
 * Orchestration Dashboard Page
 *
 * Main entry point for the orchestration system.
 * Shows department metrics, team status, and pending approvals.
 */
export default async function OrchestrationPage() {
  let workspaceId = "";

  try {
    const workspace = await getCurrentWorkspace();
    workspaceId = workspace.workspaceId;
  } catch (error) {
    logger.error("Orchestration page error", { error });
  }

  return (
    <ErrorBoundary>
      <OrchestrationDashboardClient workspaceId={workspaceId} />
    </ErrorBoundary>
  );
}

