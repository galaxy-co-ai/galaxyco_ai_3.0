import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Route } from "lucide-react";
import { NeptuneButton } from "@/components/ui/neptune-button";
import { UseCaseWizard } from "@/components/admin/ContentCockpit/UseCaseStudio";
import { db } from "@/lib/db";
import { useCases, users } from "@/db/schema";
import { getCurrentWorkspace } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Edit Use Case | Use Case Studio",
  description: "Edit your use case personas, journey mapping, and roadmap",
};

interface EditUseCasePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditUseCasePage({ params }: EditUseCasePageProps) {
  const { id } = await params;
  
  // Get workspace context
  let workspaceId: string;
  try {
    const context = await getCurrentWorkspace();
    workspaceId = context.workspaceId;
  } catch {
    notFound();
  }

  // Fetch the use case
  const [useCase] = await db
    .select({
      id: useCases.id,
      workspaceId: useCases.workspaceId,
      name: useCases.name,
      description: useCases.description,
      category: useCases.category,
      status: useCases.status,
      personas: useCases.personas,
      platformTools: useCases.platformTools,
      journeyStages: useCases.journeyStages,
      messaging: useCases.messaging,
      onboardingQuestions: useCases.onboardingQuestions,
      roadmap: useCases.roadmap,
      createdBy: useCases.createdBy,
      publishedAt: useCases.publishedAt,
      createdAt: useCases.createdAt,
      updatedAt: useCases.updatedAt,
      createdByUser: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      },
    })
    .from(useCases)
    .leftJoin(users, eq(useCases.createdBy, users.id))
    .where(
      and(eq(useCases.id, id), eq(useCases.workspaceId, workspaceId))
    )
    .limit(1);

  if (!useCase) {
    notFound();
  }

  // Transform for the wizard component
  const initialData = {
    ...useCase,
    personas: useCase.personas || [],
    platformTools: useCase.platformTools || [],
    journeyStages: useCase.journeyStages || [],
    onboardingQuestions: useCase.onboardingQuestions || [],
    roadmap: useCase.roadmap || [],
    publishedAt: useCase.publishedAt?.toISOString() || null,
    createdAt: useCase.createdAt.toISOString(),
    updatedAt: useCase.updatedAt.toISOString(),
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/content/use-cases">
          <NeptuneButton size="icon" aria-label="Back to Use Case Studio">
            <ArrowLeft className="h-4 w-4" />
          </NeptuneButton>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Route className="h-6 w-6 text-rose-500" aria-hidden="true" />
            Edit Use Case
          </h1>
          <p className="text-muted-foreground">{useCase.name}</p>
        </div>
        
        {/* Status Badge */}
        <StatusBadge status={useCase.status} />
      </div>

      {/* Wizard */}
      <UseCaseWizard mode="edit" initialData={initialData} />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    draft: { label: "Draft", className: "bg-gray-100 text-gray-700" },
    complete: { label: "Complete", className: "bg-blue-100 text-blue-700" },
    published: { label: "Published", className: "bg-emerald-100 text-emerald-700" },
    archived: { label: "Archived", className: "bg-amber-100 text-amber-700" },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

