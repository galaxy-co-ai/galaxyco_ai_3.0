"use client";

import { Button } from "@/components/ui/button";
import { Lightbulb, FileText, Heart, Calendar, CheckSquare, Mail } from "lucide-react";

interface QuickActionsProps {
  conversationId: string | null;
  onAction: (action: string) => void;
  disabled?: boolean;
}

const actions = [
  {
    id: 'suggest-reply',
    label: 'Suggest Reply',
    icon: Lightbulb,
    description: 'AI drafts contextual response',
  },
  {
    id: 'summarize',
    label: 'Summarize Thread',
    icon: FileText,
    description: 'Condense conversation',
  },
  {
    id: 'sentiment',
    label: 'Sentiment Check',
    icon: Heart,
    description: 'Analyze customer mood',
  },
  {
    id: 'schedule-followup',
    label: 'Schedule Follow-up',
    icon: Calendar,
    description: 'Set reminder',
  },
  {
    id: 'create-task',
    label: 'Create Task',
    icon: CheckSquare,
    description: 'Generate CRM task',
  },
  {
    id: 'draft-email',
    label: 'Draft Email',
    icon: Mail,
    description: 'Convert to email',
  },
];

export default function QuickActions({
  conversationId,
  onAction,
  disabled = false,
}: QuickActionsProps) {
  if (!conversationId) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">
          Select a conversation to use quick actions
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-xs font-semibold text-muted-foreground">Quick Actions:</p>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              variant="outline"
              size="sm"
              className="h-auto flex-col items-start gap-1.5 p-3 text-left"
              onClick={() => onAction(action.id)}
              disabled={disabled}
            >
              <div className="flex w-full items-center justify-between">
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium">{action.label}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {action.description}
              </p>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
