import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Route } from "lucide-react";
import { NeptuneButton } from "@/components/ui/neptune-button";
import { UseCaseWizard } from "@/components/admin/ContentCockpit/UseCaseStudio";

export const metadata: Metadata = {
  title: "Create Use Case | Use Case Studio",
  description: "Create a new use case with personas, journey mapping, and AI-generated roadmaps",
};

export default function NewUseCasePage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/content/use-cases">
          <NeptuneButton size="icon" aria-label="Back to Use Case Studio">
            <ArrowLeft className="h-4 w-4" />
          </NeptuneButton>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Route className="h-6 w-6 text-rose-500" aria-hidden="true" />
            Create Use Case
          </h1>
          <p className="text-muted-foreground">
            Follow the wizard to define your user personas and generate an onboarding roadmap
          </p>
        </div>
      </div>

      {/* Wizard */}
      <UseCaseWizard mode="create" />
    </div>
  );
}

