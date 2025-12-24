"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useNeptune } from "@/contexts/neptune-context";
import { generateQuickActions, type QuickActionContext } from "@/lib/neptune/quick-actions";
import {
  Lightbulb,
  PenLine,
  Palette,
  TrendingUp,
  RefreshCw,
  Wand2,
  User,
  Users,
  Mail,
  Calendar,
  BarChart3,
  Search,
  Plus,
  Zap,
  Target,
  FileText,
  Bot,
  DollarSign,
  Send,
  Clock,
  Star,
} from "lucide-react";

// ============================================================================
// ICON MAPPING
// ============================================================================

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Lightbulb,
  PenLine,
  Palette,
  TrendingUp,
  RefreshCw,
  Wand2,
  User,
  Users,
  Mail,
  Calendar,
  BarChart3,
  Search,
  Plus,
  Zap,
  Target,
  FileText,
  Bot,
  DollarSign,
  Send,
  Clock,
  Star,
};

// ============================================================================
// TYPES
// ============================================================================

interface DynamicQuickActionsProps {
  onAction: (prompt: string) => void;
  disabled?: boolean;
  workspaceState?: QuickActionContext['workspaceState'];
  variant?: 'default' | 'compact' | 'pills';
  maxActions?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function DynamicQuickActions({
  onAction,
  disabled = false,
  workspaceState,
  variant = 'default',
  maxActions = 4,
}: DynamicQuickActionsProps) {
  const { pageContext } = useNeptune();

  // Generate contextual actions
  const actions = useMemo(() => {
    const context: QuickActionContext = {
      pageContext,
      workspaceState,
    };
    return generateQuickActions(context).slice(0, maxActions);
  }, [pageContext, workspaceState, maxActions]);

  if (actions.length === 0) {
    return null;
  }

  // Compact pill variant (for sidebar)
  if (variant === 'pills') {
    return (
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const IconComponent = ICON_MAP[action.icon || 'Lightbulb'] || Lightbulb;
          return (
            <button
              key={action.id}
              onClick={() => onAction(action.prompt)}
              disabled={disabled}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all bg-white border border-gray-200 text-gray-600 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IconComponent className="h-3 w-3" />
              {action.label}
            </button>
          );
        })}
      </div>
    );
  }

  // Compact variant (single row)
  if (variant === 'compact') {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {actions.map((action) => {
          const IconComponent = ICON_MAP[action.icon || 'Lightbulb'] || Lightbulb;
          return (
            <Button
              key={action.id}
              variant="outline"
              size="sm"
              className="flex-shrink-0 h-8 gap-1.5 text-xs"
              onClick={() => onAction(action.prompt)}
              disabled={disabled}
            >
              <IconComponent className="h-3.5 w-3.5" />
              {action.label}
            </Button>
          );
        })}
      </div>
    );
  }

  // Default variant (grid)
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">Quick actions</p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const IconComponent = ICON_MAP[action.icon || 'Lightbulb'] || Lightbulb;
          return (
            <Button
              key={action.id}
              variant="outline"
              size="sm"
              className="h-auto gap-1.5 px-3 py-2 text-xs"
              onClick={() => onAction(action.prompt)}
              disabled={disabled}
            >
              <IconComponent className="h-3.5 w-3.5" />
              {action.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export { ICON_MAP };
