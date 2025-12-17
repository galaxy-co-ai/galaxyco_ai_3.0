'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Bot, AlertCircle, Loader2, RotateCcw, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AutonomyPreference {
  toolName: string;
  actionType: string;
  confidenceScore: number;
  approvalCount: number;
  rejectionCount: number;
  autoExecuteEnabled: boolean;
  lastUpdated: string;
}

export default function AutonomySettingsPage() {
  const [preferences, setPreferences] = useState<AutonomyPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingTool, setUpdatingTool] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  async function fetchPreferences() {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/autonomy');
      if (!response.ok) throw new Error('Failed to fetch preferences');
      const data = await response.json();
      setPreferences(data.preferences || []);
    } catch (error) {
      console.error('Failed to fetch preferences', error);
      toast.error('Failed to load autonomy settings');
    } finally {
      setLoading(false);
    }
  }

  async function toggleAutoExecute(toolName: string, enabled: boolean) {
    setUpdatingTool(toolName);
    try {
      const response = await fetch('/api/settings/autonomy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolName, autoExecuteEnabled: enabled }),
      });

      if (!response.ok) throw new Error('Failed to update preference');

      toast.success(
        enabled 
          ? `Auto-execute enabled for ${formatToolName(toolName)}`
          : `Auto-execute disabled for ${formatToolName(toolName)}`
      );
      fetchPreferences(); // Refresh
    } catch (error) {
      console.error('Failed to update preference', error);
      toast.error('Failed to update setting');
    } finally {
      setUpdatingTool(null);
    }
  }

  async function resetAllPreferences() {
    if (!confirm('Are you sure you want to reset all autonomy preferences? Neptune will start learning from scratch.')) {
      return;
    }

    setResetting(true);
    try {
      const response = await fetch('/api/settings/autonomy', {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to reset preferences');

      const data = await response.json();
      toast.success(data.message || 'All preferences reset');
      fetchPreferences(); // Refresh
    } catch (error) {
      console.error('Failed to reset preferences', error);
      toast.error('Failed to reset preferences');
    } finally {
      setResetting(false);
    }
  }

  function formatToolName(toolName: string): string {
    return toolName.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }

  const enabledTools = preferences.filter((p) => p.autoExecuteEnabled);
  const learningTools = preferences.filter(
    (p) => !p.autoExecuteEnabled && p.confidenceScore >= 60 && p.approvalCount < 5
  );
  const otherTools = preferences.filter(
    (p) => !p.autoExecuteEnabled && (p.confidenceScore < 60 || p.approvalCount >= 5)
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Neptune Autonomy Settings</h1>
        <p className="text-muted-foreground">
          Manage which actions Neptune can execute automatically. Neptune learns from your approval patterns.
        </p>
      </div>

      {/* Stats Summary */}
      {preferences.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{enabledTools.length}</p>
                <p className="text-sm text-muted-foreground">Auto-executing</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{learningTools.length}</p>
                <p className="text-sm text-muted-foreground">Learning</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Bot className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{preferences.length}</p>
                <p className="text-sm text-muted-foreground">Total tools</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* No preferences yet */}
      {preferences.length === 0 && (
        <Card className="p-12 text-center">
          <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No autonomy preferences yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Neptune will start learning your preferences as you use different tools.
          </p>
        </Card>
      )}

      {/* Enabled Tools Section */}
      {enabledTools.length > 0 && (
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">✅ Auto-Execute Enabled</h2>
              <p className="text-sm text-muted-foreground">
                Neptune executes these actions automatically ({enabledTools.length} tools)
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {enabledTools.map((pref) => (
              <div
                key={pref.toolName}
                className="flex items-center justify-between rounded-lg border bg-card p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{formatToolName(pref.toolName)}</span>
                    <Badge variant="outline" className="text-xs">
                      {pref.confidenceScore}% confident
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    ✓ {pref.approvalCount} approvals • {pref.rejectionCount} rejections
                  </p>
                </div>

                <Switch
                  checked={pref.autoExecuteEnabled}
                  onCheckedChange={(checked) => toggleAutoExecute(pref.toolName, checked)}
                  disabled={updatingTool === pref.toolName}
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Learning Tools Section */}
      {learningTools.length > 0 && (
        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">⏳ Learning Your Preferences</h2>
            <p className="text-sm text-muted-foreground">
              Neptune is learning these tools ({learningTools.length} tools)
            </p>
          </div>

          <div className="space-y-3">
            {learningTools.map((pref) => {
              const approvalsNeeded = Math.max(0, 5 - pref.approvalCount);
              return (
                <div
                  key={pref.toolName}
                  className="rounded-lg border bg-card p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatToolName(pref.toolName)}</span>
                        <Badge variant="secondary" className="text-xs">
                          {pref.confidenceScore}% confident
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        ✓ {pref.approvalCount} approvals • Need {approvalsNeeded} more approval
                        {approvalsNeeded !== 1 ? 's' : ''} for auto-execute
                      </p>
                    </div>

                    <Switch
                      checked={false}
                      onCheckedChange={(checked) => toggleAutoExecute(pref.toolName, checked)}
                      disabled={updatingTool === pref.toolName}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Other Tools Section */}
      {otherTools.length > 0 && (
        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Other Tools</h2>
            <p className="text-sm text-muted-foreground">
              Tools with minimal interaction history ({otherTools.length} tools)
            </p>
          </div>

          <div className="space-y-2">
            {otherTools.slice(0, 10).map((pref) => (
              <div
                key={pref.toolName}
                className="flex items-center justify-between rounded-lg border bg-muted/30 p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{formatToolName(pref.toolName)}</span>
                  <span className="text-xs text-muted-foreground">
                    ({pref.approvalCount} approvals)
                  </span>
                </div>

                <Switch
                  checked={false}
                  onCheckedChange={(checked) => toggleAutoExecute(pref.toolName, checked)}
                  disabled={updatingTool === pref.toolName}
                />
              </div>
            ))}
          </div>

          {otherTools.length > 10 && (
            <p className="mt-3 text-center text-sm text-muted-foreground">
              + {otherTools.length - 10} more tools
            </p>
          )}
        </Card>
      )}

      {/* Reset Section */}
      {preferences.length > 0 && (
        <Card className="border-destructive/50 p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div className="flex-1">
              <h3 className="font-semibold">Reset All Preferences</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                This will delete all autonomy preferences and Neptune will start learning from scratch.
                This action cannot be undone.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={resetAllPreferences}
              disabled={resetting}
            >
              {resetting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset All
                </>
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
