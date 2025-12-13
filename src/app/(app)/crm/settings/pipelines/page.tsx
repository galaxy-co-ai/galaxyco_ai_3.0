import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { PipelineSettings } from "@/components/crm/PipelineSettings";

export const metadata: Metadata = {
  title: "Deal Pipelines | CRM Settings",
  description: "Configure sales pipelines and customize deal stages",
};

export default function PipelinesPage() {
  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/crm/settings">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deal Pipelines</h1>
          <p className="text-muted-foreground">
            Manage sales pipelines and customize stages for your deals
          </p>
        </div>
      </div>

      {/* Content */}
      <PipelineSettings />
    </div>
  );
}
