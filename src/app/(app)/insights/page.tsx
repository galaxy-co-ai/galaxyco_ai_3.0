import { InsightsDashboard } from '@/components/insights/InsightsDashboard';
import { Brain } from 'lucide-react';

export const metadata = {
  title: 'Intelligence Command Center | GalaxyCo.ai',
  description: 'AI-powered analytics and insights for your workspace',
};

export default function InsightsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-[var(--chart-1)] to-[var(--chart-5)] bg-opacity-20">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Intelligence Command Center</h1>
        </div>
        <p className="text-muted-foreground">
          AI-powered analytics and proactive insights for your workspace
        </p>
      </div>

      {/* Full Insights Dashboard with all widgets */}
      <InsightsDashboard maxInsights={50} showFilters={true} />
    </div>
  );
}
