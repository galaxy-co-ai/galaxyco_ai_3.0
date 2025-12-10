import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ListOrdered, Construction } from "lucide-react";
import { NeptuneButton } from "@/components/ui/neptune-button";

export const metadata: Metadata = {
  title: "Article Hit List | Content Cockpit",
  description: "Prioritized queue of topics with AI-calculated priority scores",
};

export default function HitListPage() {
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
            <ListOrdered className="h-6 w-6 text-indigo-500" />
            Article Hit List
          </h1>
          <p className="text-muted-foreground">
            Prioritized queue of topics with AI-calculated priority scores
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
          Coming in Phase D
        </h2>
        <p className="text-sm text-gray-600 text-center max-w-md mb-4">
          The Article Hit List will include drag-and-drop reordering, AI
          priority scoring, and direct integration with Article Studio.
        </p>
        <Link href="/admin/content/article-studio">
          <NeptuneButton variant="primary">
            Use Article Studio Instead
          </NeptuneButton>
        </Link>
      </div>
    </div>
  );
}

