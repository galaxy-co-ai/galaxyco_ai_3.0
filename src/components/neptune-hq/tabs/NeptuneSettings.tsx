"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@clerk/nextjs';
import { 
  Settings, 
  Bell, 
  MessageSquare, 
  Zap, 
  Shield,
  Globe,
  Palette,
  Save,
  RotateCcw
} from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface NeptuneConfig {
  notifications: {
    emailDigest: boolean;
    slackAlerts: boolean;
    inAppNotifications: boolean;
    dailySummary: boolean;
  };
  behavior: {
    autoSuggest: boolean;
    proactiveInsights: boolean;
    learningEnabled: boolean;
    responseLength: 'concise' | 'balanced' | 'detailed';
  };
  privacy: {
    shareAnalytics: boolean;
    dataRetentionDays: number;
    anonymizeData: boolean;
  };
  integrations: {
    connectedApps: number;
    apiEnabled: boolean;
    webhooksEnabled: boolean;
  };
}

export function NeptuneSettings() {
  const { orgId } = useAuth();
  const [hasChanges, setHasChanges] = useState(false);
  
  const { data, isLoading, mutate } = useSWR<{ config: NeptuneConfig }>(
    orgId ? `/api/neptune-hq/settings?workspaceId=${orgId}` : null,
    fetcher
  );

  const [config, setConfig] = useState<NeptuneConfig | null>(null);

  // Initialize local config when data loads
  if (data?.config && !config) {
    setConfig(data.config);
  }

  const updateConfig = <K extends keyof NeptuneConfig>(
    section: K,
    key: keyof NeptuneConfig[K],
    value: NeptuneConfig[K][keyof NeptuneConfig[K]]
  ) => {
    if (!config) return;
    setConfig({
      ...config,
      [section]: {
        ...config[section],
        [key]: value,
      },
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    // In production, this would POST to the API
    setHasChanges(false);
  };

  const handleReset = () => {
    if (data?.config) {
      setConfig(data.config);
      setHasChanges(false);
    }
  };

  const currentConfig = config || data?.config;

  return (
    <div className="space-y-6">
      {/* Header with Save Actions */}
      {hasChanges && (
        <Card className="shadow-sm border-amber-200 bg-amber-50">
          <CardContent className="p-3 flex items-center justify-between">
            <p className="text-xs text-amber-700">You have unsaved changes</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset} className="h-7 text-xs">
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
              <Button size="sm" onClick={handleSave} className="h-7 text-xs">
                <Save className="h-3 w-3 mr-1" />
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : currentConfig ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notifications */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </CardTitle>
              <CardDescription className="text-xs">
                Configure how Neptune communicates with you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-medium">Email Digest</Label>
                  <p className="text-[10px] text-muted-foreground">Weekly summary of Neptune activity</p>
                </div>
                <Switch
                  checked={currentConfig.notifications.emailDigest}
                  onCheckedChange={(v) => updateConfig('notifications', 'emailDigest', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-medium">Slack Alerts</Label>
                  <p className="text-[10px] text-muted-foreground">Important notifications in Slack</p>
                </div>
                <Switch
                  checked={currentConfig.notifications.slackAlerts}
                  onCheckedChange={(v) => updateConfig('notifications', 'slackAlerts', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-medium">In-App Notifications</Label>
                  <p className="text-[10px] text-muted-foreground">Real-time notifications in the app</p>
                </div>
                <Switch
                  checked={currentConfig.notifications.inAppNotifications}
                  onCheckedChange={(v) => updateConfig('notifications', 'inAppNotifications', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-medium">Daily Summary</Label>
                  <p className="text-[10px] text-muted-foreground">Morning briefing of AI insights</p>
                </div>
                <Switch
                  checked={currentConfig.notifications.dailySummary}
                  onCheckedChange={(v) => updateConfig('notifications', 'dailySummary', v)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Behavior */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Behavior
              </CardTitle>
              <CardDescription className="text-xs">
                Customize how Neptune responds and learns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-medium">Auto-Suggest</Label>
                  <p className="text-[10px] text-muted-foreground">Proactive suggestions while typing</p>
                </div>
                <Switch
                  checked={currentConfig.behavior.autoSuggest}
                  onCheckedChange={(v) => updateConfig('behavior', 'autoSuggest', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-medium">Proactive Insights</Label>
                  <p className="text-[10px] text-muted-foreground">Neptune initiates helpful suggestions</p>
                </div>
                <Switch
                  checked={currentConfig.behavior.proactiveInsights}
                  onCheckedChange={(v) => updateConfig('behavior', 'proactiveInsights', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-medium">Learning Mode</Label>
                  <p className="text-[10px] text-muted-foreground">Learn from your preferences</p>
                </div>
                <Switch
                  checked={currentConfig.behavior.learningEnabled}
                  onCheckedChange={(v) => updateConfig('behavior', 'learningEnabled', v)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Response Length</Label>
                <div className="flex gap-2">
                  {(['concise', 'balanced', 'detailed'] as const).map((option) => (
                    <Button
                      key={option}
                      variant={currentConfig.behavior.responseLength === option ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 h-7 text-[10px] capitalize"
                      onClick={() => updateConfig('behavior', 'responseLength', option)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Privacy & Data
              </CardTitle>
              <CardDescription className="text-xs">
                Control your data and privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-medium">Share Analytics</Label>
                  <p className="text-[10px] text-muted-foreground">Help improve Neptune with usage data</p>
                </div>
                <Switch
                  checked={currentConfig.privacy.shareAnalytics}
                  onCheckedChange={(v) => updateConfig('privacy', 'shareAnalytics', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-medium">Anonymize Data</Label>
                  <p className="text-[10px] text-muted-foreground">Remove personal info from analytics</p>
                </div>
                <Switch
                  checked={currentConfig.privacy.anonymizeData}
                  onCheckedChange={(v) => updateConfig('privacy', 'anonymizeData', v)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Data Retention</Label>
                  <Badge variant="secondary" className="text-[10px]">
                    {currentConfig.privacy.dataRetentionDays} days
                  </Badge>
                </div>
                <Slider
                  value={[currentConfig.privacy.dataRetentionDays]}
                  onValueChange={([v]) => updateConfig('privacy', 'dataRetentionDays', v)}
                  min={30}
                  max={365}
                  step={30}
                  className="w-full"
                />
                <p className="text-[10px] text-muted-foreground">
                  Conversation history retained for {currentConfig.privacy.dataRetentionDays} days
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Integrations */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Integrations
              </CardTitle>
              <CardDescription className="text-xs">
                Manage connected apps and API access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs font-medium">Connected Apps</p>
                  <p className="text-[10px] text-muted-foreground">Third-party integrations</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {currentConfig.integrations.connectedApps} apps
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-medium">API Access</Label>
                  <p className="text-[10px] text-muted-foreground">Allow external API requests</p>
                </div>
                <Switch
                  checked={currentConfig.integrations.apiEnabled}
                  onCheckedChange={(v) => updateConfig('integrations', 'apiEnabled', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-medium">Webhooks</Label>
                  <p className="text-[10px] text-muted-foreground">Send events to external URLs</p>
                </div>
                <Switch
                  checked={currentConfig.integrations.webhooksEnabled}
                  onCheckedChange={(v) => updateConfig('integrations', 'webhooksEnabled', v)}
                />
              </div>
              <Button variant="outline" size="sm" className="w-full h-8 text-xs">
                <Globe className="h-3 w-3 mr-1" />
                Manage Integrations
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
