import { getAdminContext } from '@/lib/auth';
import { PageTitle } from '@/components/ui/page-title';
import { Activity } from 'lucide-react';
import SystemHealthClient from '@/components/admin/SystemHealthClient';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'System Health | GalaxyCo.ai Admin',
  description: 'Monitor system health and performance',
};

async function getHealthData() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/admin/metrics/health`, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      return null;
    }
    
    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error('Failed to fetch health data', error);
    return null;
  }
}

export default async function SystemHealthPage() {
  // Verify admin access
  try {
    await getAdminContext();
  } catch {
    redirect('/dashboard');
  }

  const initialData = await getHealthData();

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="pt-4">
          <PageTitle 
            title="System Health" 
            icon={Activity}
            description="Monitor platform health and performance metrics"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <SystemHealthClient initialData={initialData} />
      </div>
    </div>
  );
}
