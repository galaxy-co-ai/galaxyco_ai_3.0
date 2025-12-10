import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ListOrdered } from "lucide-react";
import { NeptuneButton } from "@/components/ui/neptune-button";
import { HitListPage } from "@/components/admin/ContentCockpit/HitList";

export const metadata: Metadata = {
  title: "Article Hit List | Content Cockpit",
  description: "Prioritized queue of topics with AI-calculated priority scores",
};

export default function HitListRoute() {
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
            <ListOrdered className="h-6 w-6 text-indigo-500" aria-hidden="true" />
            Article Hit List
          </h1>
          <p className="text-muted-foreground">
            Prioritized queue of topics with AI-calculated priority scores
          </p>
        </div>
      </div>

      {/* Hit List Content */}
      <HitListPage />
    </div>
  );
}
