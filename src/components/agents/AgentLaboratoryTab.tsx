"use client";

import { LaboratoryWizard } from "./laboratory";
import { useRouter } from "next/navigation";

interface AgentLaboratoryTabProps {
  onAgentCreated?: (agentId: string) => void;
  neptuneOpen?: boolean;
}

export default function AgentLaboratoryTab({ onAgentCreated, neptuneOpen = false }: AgentLaboratoryTabProps) {
  const router = useRouter();

  const handleComplete = (agentId: string) => {
    onAgentCreated?.(agentId);
    // Refresh the page to show the new agent
    router.refresh();
  };

  return (
    <div className="h-full">
      <LaboratoryWizard
        onComplete={handleComplete}
        onCancel={() => {
          // Could switch back to Activity tab or just stay
        }}
        neptuneOpen={neptuneOpen}
      />
    </div>
  );
}
