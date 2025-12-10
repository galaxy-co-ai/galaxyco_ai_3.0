import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { NeptuneButton } from "@/components/ui/neptune-button";
import { SourcesHubPage } from "@/components/admin/ContentCockpit/SourcesHub";

export const metadata: Metadata = {
  title: "Sources Hub | Content Cockpit",
  description: "Bookmarked research sites and AI-suggested sources",
};

export default function SourcesHubPageWrapper() {
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
            <BookOpen className="h-6 w-6 text-emerald-500" aria-hidden="true" />
            Sources Hub
          </h1>
          <p className="text-muted-foreground">
            Bookmarked research sites and AI-suggested sources
          </p>
        </div>
      </div>

      {/* Main Content */}
      <SourcesHubPage />
    </div>
  );
}
