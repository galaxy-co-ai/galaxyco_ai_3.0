import { InsightsDashboard } from '@/components/insights/InsightsDashboard';
import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export const metadata = {
  title: 'Proactive Insights | GalaxyCo.ai',
  description: 'AI-powered insights and suggestions for your workspace',
};

export default function InsightsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Proactive Insights</h1>
        </div>
        <p className="text-muted-foreground">
          AI-powered suggestions and opportunities based on your workspace activity
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-2xl font-bold mb-1">⚡</div>
          <div className="text-sm text-muted-foreground">Real-time Analysis</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold mb-1">🎯</div>
          <div className="text-sm text-muted-foreground">Actionable Suggestions</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold mb-1">🤖</div>
          <div className="text-sm text-muted-foreground">Automated Monitoring</div>
        </Card>
      </div>

      {/* Insights Dashboard */}
      <InsightsDashboard maxInsights={50} showFilters={true} />
    </div>
  );
}
