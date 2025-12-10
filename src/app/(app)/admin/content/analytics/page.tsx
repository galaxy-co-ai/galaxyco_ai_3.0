import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BarChart3, Construction } from "lucide-react";
import { NeptuneButton } from "@/components/ui/neptune-button";

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
            <BarChart3 className="h-6 w-6 text-blue-500" />
            Article Analytics
          </h1>
          <p className="text-muted-foreground">
            Performance insights, engagement metrics, and AI recommendations
          </p>
        </div>
      </div>

      {/* Placeholder content */}
      <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-gray-300 bg-gray-50/50">
        <Construction
          className="h-12 w-12 text-gray-400 mb-4"
          aria-hidden="true"
        />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Coming in Phase E
        </h2>
        <p className="text-sm text-gray-600 text-center max-w-md mb-4">
          Article Analytics will provide detailed performance charts, traffic
          source breakdowns, and AI-generated insights to improve your content
          strategy.
        </p>
        <Link href="/admin/content">
          <NeptuneButton>Back to Content Cockpit</NeptuneButton>
        </Link>
      </div>
    </div>
  );
}

