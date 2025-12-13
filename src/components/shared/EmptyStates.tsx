"use client";

/**
 * Empty State Components
 * 
 * Reusable empty states with:
 * - Visual illustrations
 * - Clear messaging
 * - Call-to-action buttons
 * - Onboarding hints
 * - Contextual suggestions
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Bot,
  Users,
  ListTodo,
  Search,
  Inbox,
  Database,
  FolderOpen,
  MessagesSquare,
  Bell,
  Calendar,
  Tag,
  Lightbulb,
  Sparkles,
  BookOpen,
  Zap,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  suggestions?: string[];
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  suggestions,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex items-center justify-center min-h-[400px] p-8", className)}>
      <div className="text-center max-w-md">
        {/* Icon */}
        {icon && (
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
            {icon}
          </div>
        )}

        {/* Title */}
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-6">{description}</p>

        {/* Actions */}
        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            {action && (
              <Button
                onClick={action.onClick}
                variant={action.variant || 'default'}
                className="w-full sm:w-auto"
              >
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button
                onClick={secondaryAction.onClick}
                variant="outline"
                className="w-full sm:w-auto"
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}

        {/* Suggestions */}
        {suggestions && suggestions.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">Quick tips:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {suggestions.map((suggestion, i) => (
                <li key={i}>• {suggestion}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// Preset Empty States

export function EmptyAgents({ onCreateAgent }: { onCreateAgent: () => void }) {
  return (
    <EmptyState
      icon={<Bot className="h-8 w-8 text-primary" />}
      title="No agents yet"
      description="AI agents automate repetitive tasks and work 24/7. Create your first agent to get started."
      action={{
        label: 'Create Agent',
        onClick: onCreateAgent,
      }}
      suggestions={[
        'Agents can monitor emails, schedule meetings, and update records',
        'Start with a template or build from scratch',
        'Test agents in sandbox mode before going live',
      ]}
    />
  );
}

export function EmptyContacts({ onAddContact, onImport }: { onAddContact: () => void; onImport?: () => void }) {
  return (
    <EmptyState
      icon={<Users className="h-8 w-8 text-primary" />}
      title="No contacts yet"
      description="Build your network by adding contacts. Track interactions and never miss a follow-up."
      action={{
        label: 'Add Contact',
        onClick: onAddContact,
      }}
      secondaryAction={onImport ? {
        label: 'Import CSV',
        onClick: onImport,
      } : undefined}
      suggestions={[
        'Import contacts from CSV or sync with email',
        'Add tags to organize your contacts',
        'Track all interactions in one place',
      ]}
    />
  );
}

export function EmptyTasks({ onCreateTask }: { onCreateTask: () => void }) {
  return (
    <EmptyState
      icon={<ListTodo className="h-8 w-8 text-primary" />}
      title="No tasks yet"
      description="Stay organized by creating tasks. Track progress and never miss a deadline."
      action={{
        label: 'Create Task',
        onClick: onCreateTask,
      }}
      suggestions={[
        'Set due dates and priorities',
        'Assign tasks to team members',
        'Get reminders before deadlines',
      ]}
    />
  );
}

export function EmptySearchResults({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <EmptyState
      icon={<Search className="h-8 w-8 text-muted-foreground" />}
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try adjusting your search.`}
      action={{
        label: 'Clear Search',
        onClick: onClear,
        variant: 'outline',
      }}
      suggestions={[
        'Check your spelling',
        'Try different keywords',
        'Use broader search terms',
      ]}
    />
  );
}

export function EmptyInbox() {
  return (
    <EmptyState
      icon={<Inbox className="h-8 w-8 text-primary" />}
      title="Inbox zero!"
      description="You're all caught up. No messages to read right now."
      suggestions={[
        'Great job staying on top of your messages',
        'Check back later for new updates',
      ]}
    />
  );
}

export function EmptyNotifications() {
  return (
    <EmptyState
      icon={<Bell className="h-8 w-8 text-primary" />}
      title="No notifications"
      description="You're all caught up! We'll notify you when something needs your attention."
    />
  );
}

export function EmptyCalendar({ onSchedule }: { onSchedule: () => void }) {
  return (
    <EmptyState
      icon={<Calendar className="h-8 w-8 text-primary" />}
      title="No events scheduled"
      description="Your calendar is clear. Schedule a meeting or event to get started."
      action={{
        label: 'Schedule Event',
        onClick: onSchedule,
      }}
    />
  );
}

export function EmptyKnowledge({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      icon={<BookOpen className="h-8 w-8 text-primary" />}
      title="Knowledge base is empty"
      description="Add documents, guides, or training materials to help your AI agents learn."
      action={{
        label: 'Add Knowledge',
        onClick: onAdd,
      }}
      secondaryAction={{
        label: 'Upload Files',
        onClick: onAdd,
      }}
      suggestions={[
        'Upload PDFs, Word docs, or text files',
        'AI agents can reference this knowledge',
        'Keep your knowledge base organized with tags',
      ]}
    />
  );
}

export function EmptyConversations({ onStart }: { onStart: () => void }) {
  return (
    <EmptyState
      icon={<MessagesSquare className="h-8 w-8 text-primary" />}
      title="No conversations yet"
      description="Start a conversation with Neptune AI to get help with your work."
      action={{
        label: 'Start Conversation',
        onClick: onStart,
      }}
      suggestions={[
        'Ask Neptune to help automate tasks',
        'Get insights from your data',
        'Create content or analyze documents',
      ]}
    />
  );
}

export function EmptyActivity() {
  return (
    <EmptyState
      icon={<Zap className="h-8 w-8 text-primary" />}
      title="No activity yet"
      description="When your agents run or tasks complete, activity will appear here."
      suggestions={[
        'Activity updates in real-time',
        'Filter by type to find what you need',
        'Click any item to see details',
      ]}
    />
  );
}

export function EmptyData({ type }: { type: string }) {
  return (
    <EmptyState
      icon={<Database className="h-8 w-8 text-muted-foreground" />}
      title={`No ${type} found`}
      description={`You don't have any ${type} yet. Create your first one to get started.`}
    />
  );
}

export function EmptyFiles({ onUpload }: { onUpload: () => void }) {
  return (
    <EmptyState
      icon={<FolderOpen className="h-8 w-8 text-primary" />}
      title="No files uploaded"
      description="Upload files to store and manage them in one place."
      action={{
        label: 'Upload Files',
        onClick: onUpload,
      }}
      suggestions={[
        'Drag and drop files to upload',
        'Organize files with folders and tags',
        'Share files with your team',
      ]}
    />
  );
}

export function EmptyTags({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={<Tag className="h-8 w-8 text-primary" />}
      title="No tags created"
      description="Create tags to organize and categorize your items."
      action={{
        label: 'Create Tag',
        onClick: onCreate,
      }}
    />
  );
}

export function ErrorState({ 
  title = "Something went wrong",
  description = "We encountered an error loading this content. Please try again.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon={<Lightbulb className="h-8 w-8 text-amber-600" />}
      title={title}
      description={description}
      action={onRetry ? {
        label: 'Try Again',
        onClick: onRetry,
      } : undefined}
    />
  );
}

// Onboarding Hints

export function OnboardingHint({
  title,
  description,
  action,
  onDismiss,
  className,
}: {
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <Card className={cn("p-4 border-primary/20 bg-primary/5", className)}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-foreground mb-1">{title}</h4>
          <p className="text-xs text-muted-foreground mb-3">{description}</p>
          <div className="flex items-center gap-2">
            {action && (
              <Button size="sm" onClick={action.onClick} className="h-7 text-xs">
                {action.label}
              </Button>
            )}
            {onDismiss && (
              <Button size="sm" variant="ghost" onClick={onDismiss} className="h-7 text-xs">
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// Quick Start Card

export function QuickStartCard({
  title,
  description,
  steps,
  onStart,
  progress = 0,
  className,
}: {
  title: string;
  description: string;
  steps: Array<{ label: string; completed: boolean }>;
  onStart: () => void;
  progress?: number;
  className?: string;
}) {
  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Target className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">
            {steps.filter(s => s.completed).length} of {steps.length} completed
          </span>
          <span className="text-xs font-medium text-primary">{progress}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2 mb-4">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            {step.completed ? (
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-muted flex-shrink-0" />
            )}
            <span className={step.completed ? 'text-foreground line-through' : 'text-muted-foreground'}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <Button onClick={onStart} className="w-full">
        Continue Setup
      </Button>
    </Card>
  );
}
