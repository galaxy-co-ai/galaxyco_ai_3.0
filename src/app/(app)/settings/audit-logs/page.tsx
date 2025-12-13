import { getCurrentWorkspace } from '@/lib/auth';
import { PageTitle } from '@/components/ui/page-title';
import { FileText } from 'lucide-react';
import AuditLogsClient from '@/components/settings/AuditLogsClient';

export const metadata = {
  title: 'Audit Logs | GalaxyCo.ai',
  description: 'View and filter audit log entries',
};

async function getAuditLogs(workspaceId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/orchestration/audit?limit=100`, {
      headers: {
        'x-workspace-id': workspaceId,
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    return data.entries || [];
  } catch (error) {
    console.error('Failed to fetch audit logs', error);
    return [];
  }
}

export default async function AuditLogsPage() {
  const { workspaceId } = await getCurrentWorkspace();
  const initialEntries = await getAuditLogs(workspaceId);

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="pt-4">
          <PageTitle 
            title="Audit Logs" 
            icon={FileText}
            description="Track all system actions and changes"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <AuditLogsClient initialEntries={initialEntries} />
      </div>
    </div>
  );
}
