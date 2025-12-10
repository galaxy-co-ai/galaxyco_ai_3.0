"use client";

/**
 * Neptune Dashboard Welcome Component
 * 
 * Contextual welcome message for Neptune-first dashboard experience.
 * Shows different greetings for new vs returning users with suggested prompts.
 * Only shows for new users and can be dismissed.
 */

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Bot, FolderOpen, X } from 'lucide-react';

interface NeptuneDashboardWelcomeProps {
  userId: string;
  workspaceId: string;
  userName: string;
}

interface WelcomeData {
  isNewUser: boolean;
  recentActivity?: {
    newLeads: number;
    agentRuns: number;
    recentAgents: Array<{ name: string }>;
  };
  workspaceHealth?: {
    completionPercentage: number;
    missingItems: string[];
  };
}

export default function NeptuneDashboardWelcome({
  userId,
  workspaceId,
  userName,
}: NeptuneDashboardWelcomeProps) {
  const [welcomeData, setWelcomeData] = useState<WelcomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the welcome before
    const dismissed = localStorage.getItem(`welcome-dismissed-${userId}`);
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, [userId]);

  useEffect(() => {
    async function fetchWelcomeData() {
      try {
        const response = await fetch(
          `/api/dashboard/welcome?userId=${userId}&workspaceId=${workspaceId}`
        );
        if (response.ok) {
          const data = await response.json();
          setWelcomeData(data);
        }
      } catch (error) {
        console.error('Error fetching welcome data', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchWelcomeData();
  }, [userId, workspaceId]);

  // Fetch insights for returning users
  const [insights, setInsights] = useState<Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    priority: number;
    suggestedActions: Array<{ action: string; toolName?: string; args?: Record<string, unknown> }>;
  }>>([]);

  useEffect(() => {
    if (!welcomeData || welcomeData.isNewUser) return;

    async function fetchInsights() {
      try {
        const response = await fetch(`/api/assistant/insights?limit=3`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.insights) {
            setInsights(data.insights);
          }
        }
      } catch (error) {
        console.error('Error fetching insights', error);
      }
    }

    fetchInsights();
  }, [welcomeData]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(`welcome-dismissed-${userId}`, 'true');
  };

  if (isLoading || !welcomeData || isDismissed) {
    return null; // Don't show welcome until data is loaded or if dismissed
  }

  const { isNewUser, recentActivity, workspaceHealth } = welcomeData;
  const firstName = userName.split(' ')[0] || 'there';

  // Show insights for returning users, welcome for new users
  if (!isNewUser) {
    if (insights.length === 0) {
      return null; // No insights to show
    }

    // Show top 3 insights for returning users
    return (
      <Card className="mb-4 p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200/50">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 shrink-0">
            <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Today's Top Priorities
            </h3>
            <div className="space-y-3">
              {insights.slice(0, 3).map((insight) => (
                <div key={insight.id} className="p-3 rounded-lg bg-background/50 border">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      insight.priority >= 8 ? 'bg-red-100 text-red-700' :
                      insight.priority >= 6 ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {insight.priority >= 8 ? 'High' : insight.priority >= 6 ? 'Medium' : 'Low'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{insight.description}</p>
                  {insight.suggestedActions.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => {
                        const event = new CustomEvent('neptune-prompt', {
                          detail: { prompt: insight.suggestedActions[0].action },
                        });
                        window.dispatchEvent(event);
                      }}
                    >
                      {insight.suggestedActions[0].action}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Helper to dispatch Neptune prompt event
  const sendNeptunePrompt = (prompt: string) => {
    const event = new CustomEvent('neptune-prompt', {
      detail: { prompt },
    });
    window.dispatchEvent(event);
  };

  // New user onboarding-focused welcome
  if (isNewUser) {
    const suggestedPrompts = [
      {
        text: 'Help me create my first agent',
        prompt: 'Help me create my first AI agent. What kind of agent would be most useful for my business?',
        icon: Bot,
      },
      {
        text: 'Show me what I can do',
        prompt: 'What can I do with GalaxyCo? Show me all the features and capabilities available to me.',
        icon: Sparkles,
      },
      {
        text: 'Upload a document',
        prompt: 'Help me upload a document to my knowledge base. What types of documents can I upload and how will Neptune use them?',
        icon: FolderOpen,
      },
    ];

    return (
      <Card className="mb-4 p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200/50 relative">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="absolute top-4 right-4 h-6 w-6 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss welcome message"
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="flex items-start gap-4 pr-8">
          <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 shrink-0">
            <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Welcome to Galaxy, {firstName}! 👋
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              I'm Neptune, your AI assistant. Let's get your workspace set up and
              help you build something amazing.
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((prompt, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => sendNeptunePrompt(prompt.prompt)}
                  className="text-xs h-8"
                >
                  <prompt.icon className="h-3.5 w-3.5 mr-1.5" />
                  {prompt.text}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // This should never be reached since we return null for non-new users above
  return null;
}
