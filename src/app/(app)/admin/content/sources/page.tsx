import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, Construction } from "lucide-react";
import { NeptuneButton } from "@/components/ui/neptune-button";

export const metadata: Metadata = {
  title: "Sources Hub | Content Cockpit",
  description: "Bookmarked research sites and AI-suggested sources",
};

export default function SourcesHubPage() {
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
            <BookOpen className="h-6 w-6 text-emerald-500" />
            Sources Hub
          </h1>
          <p className="text-muted-foreground">
            Bookmarked research sites and AI-suggested sources
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
          Coming in Phase C
        </h2>
        <p className="text-sm text-gray-600 text-center max-w-md mb-4">
          The Sources Hub will allow you to bookmark research sites, get AI
          reviews of sources, and receive weekly suggestions for new sources.
        </p>
        <Link href="/admin/content">
          <NeptuneButton>Back to Content Cockpit</NeptuneButton>
        </Link>
      </div>
    </div>
  );
}

