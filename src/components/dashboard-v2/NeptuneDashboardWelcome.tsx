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
import { Sparkles, Bot, Users, FolderOpen, Zap, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
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

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(`welcome-dismissed-${userId}`, 'true');
  };

  if (isLoading || !welcomeData || isDismissed) {
    return null; // Don't show welcome until data is loaded or if dismissed
  }

  const { isNewUser, recentActivity, workspaceHealth } = welcomeData;
  const firstName = userName.split(' ')[0] || 'there';

  // Only show welcome card for new users
  if (!isNewUser) {
    return null;
  }

  // New user onboarding-focused welcome
  if (isNewUser) {
    const suggestedPrompts = [
      {
        text: 'Help me create my first agent',
        action: () => router.push('/activity?tab=laboratory'),
        icon: Bot,
      },
      {
        text: 'Show me what I can do',
        action: () => {
          // This will be handled by Neptune chat
          return 'What can I do with GalaxyCo?';
        },
        icon: Sparkles,
      },
      {
        text: 'Upload a document to my knowledge base',
        action: () => router.push('/library?tab=upload'),
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
                  onClick={() => {
                    if (typeof prompt.action === 'function') {
                      const result = prompt.action();
                      if (typeof result === 'string') {
                        // If it returns a string, it's a prompt for Neptune
                        // We'll need to pass this to the parent component
                        // For now, just navigate
                      }
                    }
                  }}
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
