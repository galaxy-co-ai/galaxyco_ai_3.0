import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { NeptuneButton } from "@/components/ui/neptune-button";
import { AnalyticsDashboard } from "@/components/admin/ContentCockpit/Analytics";

export const metadata: Metadata = {
  title: "Article Analytics | Content Cockpit",
  description: "Performance insights, engagement metrics, and AI recommendations",
};

export default function ArticleAnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/content">
          <NeptuneButton size="icon" aria-label="Back to Content Cockpit">
            <ArrowLeft className="h-4 w-4" />
          </NeptuneButton>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-500" aria-hidden="true" />
            Article Analytics
          </h1>
          <p className="text-muted-foreground">
            Performance insights, engagement metrics, and content trends
          </p>
        </div>
      </div>

      {/* Dashboard */}
      <AnalyticsDashboard />
    </div>
  );
}
