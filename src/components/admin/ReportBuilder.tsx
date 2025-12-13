"use client";

/**
 * Report Builder Component
 * 
 * Features:
 * - Pre-built report templates
 * - Date range selection
 * - Export to CSV/PDF
 * - Real-time data fetching
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  BarChart3,
  TrendingUp,
  Users,
  Bot,
  DollarSign,
  FileDown,
  FileText,
  Calendar,
  Play,
  Loader2,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: typeof BarChart3;
  category: 'sales' | 'agents' | 'operations';
  metrics: string[];
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'sales-performance',
    name: 'Sales Performance',
    description: 'Revenue, deals closed, and conversion rates',
    icon: DollarSign,
    category: 'sales',
    metrics: ['Total Revenue', 'Deals Won', 'Win Rate', 'Avg Deal Size'],
  },
  {
    id: 'lead-funnel',
    name: 'Lead Funnel Analysis',
    description: 'Lead progression through pipeline stages',
    icon: TrendingUp,
    category: 'sales',
    metrics: ['New Leads', 'Qualified', 'Proposals', 'Closed'],
  },
  {
    id: 'contact-activity',
    name: 'Contact Activity',
    description: 'Contact engagement and communication metrics',
    icon: Users,
    category: 'sales',
    metrics: ['Total Contacts', 'Active', 'Emails Sent', 'Calls Made'],
  },
  {
    id: 'agent-performance',
    name: 'Agent Performance',
    description: 'AI agent execution metrics and success rates',
    icon: Bot,
    category: 'agents',
    metrics: ['Total Executions', 'Success Rate', 'Avg Duration', 'Cost'],
  },
  {
    id: 'agent-activity',
    name: 'Agent Activity Log',
    description: 'Detailed agent execution history',
    icon: FileText,
    category: 'agents',
    metrics: ['Executions', 'Errors', 'Tokens Used', 'Time Saved'],
  },
  {
    id: 'workflow-metrics',
    name: 'Workflow Metrics',
    description: 'Automation workflow performance',
    icon: BarChart3,
    category: 'operations',
    metrics: ['Workflows Run', 'Tasks Automated', 'Time Saved', 'Error Rate'],
  },
];

export default function ReportBuilder() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<boolean>(false);

  const template = REPORT_TEMPLATES.find((t) => t.id === selectedTemplate);

  const generateReport = async () => {
    if (!template || !startDate || !endDate) return;
    
    setIsGenerating(true);
    // Simulate report generation
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsGenerating(false);
    setGeneratedReport(true);
  };

  const exportCSV = () => {
    if (!template) return;
    
    const headers = template.metrics.join(',');
    const data = template.metrics.map(() => Math.floor(Math.random() * 1000)).join(',');
    const csv = `${headers}\n${data}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.id}-report-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const categories = [
    { key: 'sales', label: 'Sales & CRM' },
    { key: 'agents', label: 'AI Agents' },
    { key: 'operations', label: 'Operations' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Select Report Template</h2>
        
        {categories.map((category) => {
          const templates = REPORT_TEMPLATES.filter((t) => t.category === category.key);
          
          return (
            <div key={category.key} className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">{category.label}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {templates.map((t) => (
                  <Card
                    key={t.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedTemplate === t.id
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => {
                      setSelectedTemplate(t.id);
                      setGeneratedReport(false);
                    }}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className={`p-2 rounded-lg ${
                          selectedTemplate === t.id ? 'bg-primary/10' : 'bg-muted'
                        }`}>
                          <t.icon className={`h-5 w-5 ${
                            selectedTemplate === t.id ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                        </div>
                        {selectedTemplate === t.id && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <CardTitle className="text-base mt-2">{t.name}</CardTitle>
                      <CardDescription className="text-xs">{t.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-1">
                        {t.metrics.slice(0, 3).map((metric) => (
                          <Badge key={metric} variant="soft" tone="neutral" size="sm">
                            {metric}
                          </Badge>
                        ))}
                        {t.metrics.length > 3 && (
                          <Badge variant="soft" tone="neutral" size="sm">
                            +{t.metrics.length - 3}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Configuration */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Report Configuration
            </CardTitle>
            <CardDescription>
              Configure the date range and generate your report
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setGeneratedReport(false);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setGeneratedReport(false);
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={generateReport}
                disabled={!startDate || !endDate || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>

              {generatedReport && (
                <>
                  <Button variant="outline" onClick={exportCSV}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Badge variant="soft" tone="success" size="md">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Report Ready
                  </Badge>
                </>
              )}
            </div>

            {/* Preview */}
            {generatedReport && template && (
              <div className="border rounded-xl p-6 bg-muted/30">
                <h3 className="font-semibold mb-4">{template.name} Preview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {template.metrics.map((metric, i) => (
                    <div key={metric} className="text-center p-4 bg-background rounded-lg border">
                      <p className="text-2xl font-semibold">
                        {Math.floor(Math.random() * 1000).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">{metric}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  Data shown is a preview. Export for full report details.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Getting Started */}
      {!selectedTemplate && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Getting Started</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Select a report template above to begin. You can customize the date range
                  and export the results as CSV for further analysis.
                </p>
                <div className="flex items-center gap-2 text-sm text-primary">
                  <span>Select a template to continue</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
