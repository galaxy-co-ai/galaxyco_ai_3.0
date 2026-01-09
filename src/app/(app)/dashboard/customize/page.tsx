"use client";

/**
 * Dashboard Customize Page
 * 
 * Allows users to customize their dashboard layout by:
 * - Adding/removing widgets
 * - Reordering widgets (future: drag-drop)
 * - Saving preferences to localStorage
 */

import { useState } from 'react';
import Link from 'next/link';
import { PageTitle } from '@/components/ui/page-title';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  LayoutDashboard,
  ArrowLeft,
  Save,
  RotateCcw,
  Bot,
  Users,
  Activity,
  BarChart3,
  Zap,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle2,
  Briefcase,
  HeadphonesIcon,
  Megaphone,
  Settings2,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface WidgetConfig {
  id: string;
  name: string;
  description: string;
  icon: typeof Bot;
  enabled: boolean;
  category: 'stats' | 'activity' | 'actions' | 'charts';
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  {
    id: 'agents-stat',
    name: 'Active Agents',
    description: 'Shows count of active AI agents',
    icon: Bot,
    enabled: true,
    category: 'stats',
  },
  {
    id: 'contacts-stat',
    name: 'CRM Contacts',
    description: 'Shows total contacts count',
    icon: Users,
    enabled: true,
    category: 'stats',
  },
  {
    id: 'tasks-stat',
    name: 'Completed Tasks',
    description: 'Shows completed tasks count',
    icon: CheckCircle2,
    enabled: true,
    category: 'stats',
  },
  {
    id: 'activity-feed',
    name: 'Activity Feed',
    description: 'Real-time activity stream',
    icon: Activity,
    enabled: true,
    category: 'activity',
  },
  {
    id: 'quick-actions',
    name: 'Quick Actions',
    description: 'Shortcut buttons for common actions',
    icon: Zap,
    enabled: true,
    category: 'actions',
  },
  {
    id: 'roadmap',
    name: 'Roadmap',
    description: 'Dynamic goal tracking',
    icon: TrendingUp,
    enabled: true,
    category: 'activity',
  },
  {
    id: 'recent-docs',
    name: 'Recent Documents',
    description: 'Recently accessed knowledge base items',
    icon: FileText,
    enabled: false,
    category: 'activity',
  },
  {
    id: 'performance-chart',
    name: 'Performance Chart',
    description: 'Agent execution metrics over time',
    icon: BarChart3,
    enabled: false,
    category: 'charts',
  },
  {
    id: 'uptime',
    name: 'System Uptime',
    description: 'System health at a glance',
    icon: Clock,
    enabled: false,
    category: 'stats',
  },
];

const STORAGE_KEY = 'dashboard-widget-config';

// Role-based dashboard templates
interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  icon: typeof Bot;
  widgets: string[];
}

const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    id: 'executive',
    name: 'Executive',
    description: 'High-level KPIs and performance metrics',
    icon: Briefcase,
    widgets: ['agents-stat', 'contacts-stat', 'tasks-stat', 'performance-chart', 'roadmap', 'uptime'],
  },
  {
    id: 'sales',
    name: 'Sales',
    description: 'CRM-focused with contacts and quick actions',
    icon: TrendingUp,
    widgets: ['contacts-stat', 'tasks-stat', 'quick-actions', 'activity-feed', 'roadmap'],
  },
  {
    id: 'support',
    name: 'Support',
    description: 'Activity monitoring and task management',
    icon: HeadphonesIcon,
    widgets: ['tasks-stat', 'activity-feed', 'quick-actions', 'recent-docs', 'uptime'],
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Content and engagement focused',
    icon: Megaphone,
    widgets: ['contacts-stat', 'activity-feed', 'performance-chart', 'recent-docs', 'roadmap'],
  },
  {
    id: 'operations',
    name: 'Operations',
    description: 'System health and automation monitoring',
    icon: Settings2,
    widgets: ['agents-stat', 'uptime', 'performance-chart', 'activity-feed', 'tasks-stat'],
  },
];

// Load saved widget config from localStorage (runs once at component init)
function getInitialWidgets(): WidgetConfig[] {
  if (typeof window === 'undefined') return DEFAULT_WIDGETS;
  
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return DEFAULT_WIDGETS;
  
  try {
    const savedConfig = JSON.parse(saved) as { id: string; enabled: boolean }[];
    return DEFAULT_WIDGETS.map((widget) => {
      const savedWidget = savedConfig.find((s) => s.id === widget.id);
      return savedWidget ? { ...widget, enabled: savedWidget.enabled } : widget;
    });
  } catch {
    return DEFAULT_WIDGETS;
  }
}

export default function DashboardCustomizePage() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(getInitialWidgets);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  const toggleWidget = (id: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))
    );
    setHasChanges(true);
  };

  const saveConfig = () => {
    const config = widgets.map(({ id, enabled }) => ({ id, enabled }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    setHasChanges(false);
  };

  const resetConfig = () => {
    setWidgets(DEFAULT_WIDGETS);
    localStorage.removeItem(STORAGE_KEY);
    setHasChanges(false);
    setActiveTemplate(null);
  };

  const applyTemplate = (template: RoleTemplate) => {
    setWidgets((prev) =>
      prev.map((w) => ({
        ...w,
        enabled: template.widgets.includes(w.id),
      }))
    );
    setActiveTemplate(template.id);
    setHasChanges(true);
  };

  const currentTemplate = ROLE_TEMPLATES.find((t) => t.id === activeTemplate);

  const enabledCount = widgets.filter((w) => w.enabled).length;

  const categories = [
    { key: 'stats', label: 'Statistics', icon: TrendingUp },
    { key: 'activity', label: 'Activity', icon: Activity },
    { key: 'actions', label: 'Actions', icon: Zap },
    { key: 'charts', label: 'Charts', icon: BarChart3 },
  ] as const;

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="pt-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <PageTitle
              title="Customize Dashboard"
              icon={LayoutDashboard}
              description="Choose which widgets appear on your dashboard"
            />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="soft" tone="neutral" size="md">
              {enabledCount} widgets enabled
            </Badge>
            
            {/* Role Template Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Sparkles className="h-4 w-4 mr-2" />
                  {currentTemplate ? currentTemplate.name : 'Apply Template'}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Role Templates</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {ROLE_TEMPLATES.map((template) => (
                  <DropdownMenuItem
                    key={template.id}
                    onClick={() => applyTemplate(template)}
                    className="flex items-start gap-3 py-2.5"
                  >
                    <div className={`p-1.5 rounded-md mt-0.5 ${
                      activeTemplate === template.id ? 'bg-primary/20' : 'bg-muted'
                    }`}>
                      <template.icon className={`h-4 w-4 ${
                        activeTemplate === template.id ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{template.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {template.description}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" onClick={resetConfig}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button size="sm" onClick={saveConfig} disabled={!hasChanges}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {categories.map((category) => {
            const categoryWidgets = widgets.filter((w) => w.category === category.key);
            if (categoryWidgets.length === 0) return null;

            return (
              <div key={category.key}>
                <div className="flex items-center gap-2 mb-4">
                  <category.icon className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">{category.label}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categoryWidgets.map((widget) => (
                    <Card
                      key={widget.id}
                      className={`transition-all ${
                        widget.enabled
                          ? 'border-primary/50 bg-primary/5'
                          : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              widget.enabled ? 'bg-primary/10' : 'bg-muted'
                            }`}>
                              <widget.icon className={`h-5 w-5 ${
                                widget.enabled ? 'text-primary' : 'text-muted-foreground'
                              }`} />
                            </div>
                            <div>
                              <CardTitle className="text-base">{widget.name}</CardTitle>
                              <CardDescription className="text-xs mt-0.5">
                                {widget.description}
                              </CardDescription>
                            </div>
                          </div>
                          <Switch
                            checked={widget.enabled}
                            onCheckedChange={() => toggleWidget(widget.id)}
                          />
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Info Card */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <LayoutDashboard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Dashboard Customization</h3>
                  <p className="text-sm text-muted-foreground">
                    Your widget preferences are saved locally in your browser. 
                    Enable or disable widgets to customize your dashboard experience.
                    Changes take effect after saving.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
