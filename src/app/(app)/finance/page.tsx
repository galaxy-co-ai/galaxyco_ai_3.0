import { Metadata } from "next";
import { FinanceHQDashboard } from "@/components/finance-hq";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export const metadata: Metadata = {
  title: "Finance HQ | GalaxyCo.ai",
  description:
    "Unified financial command center - aggregate data from QuickBooks, Stripe, and Shopify in one dashboard",
};

/**
 * Finance HQ Page
 * 
 * Displays unified financial data from connected integrations.
 * The FinanceHQDashboard component handles all data fetching client-side.
 */
export default function FinancePage() {
  return (
    <ErrorBoundary>
      <FinanceHQDashboard />
    </ErrorBoundary>
  );
}























