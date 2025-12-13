import { getAdminContext } from '@/lib/auth';
import { PageTitle } from '@/components/ui/page-title';
import { BarChart3 } from 'lucide-react';
import ReportBuilder from '@/components/admin/ReportBuilder';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Reports | GalaxyCo.ai Admin',
  description: 'Generate and export custom reports',
};

export default async function ReportsPage() {
  // Verify admin access
  try {
    await getAdminContext();
  } catch {
    redirect('/dashboard');
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="pt-4">
          <PageTitle 
            title="Report Builder" 
            icon={BarChart3}
            description="Generate custom reports from your data"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <ReportBuilder />
      </div>
    </div>
  );
}
