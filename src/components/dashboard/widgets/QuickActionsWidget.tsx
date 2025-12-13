"use client";

/**
 * Quick Actions Widget - Shortcut buttons for common actions
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Users, 
  Bot, 
  FileText, 
  MessageSquare, 
  BarChart3,
  Settings,
  Zap,
} from 'lucide-react';
import WidgetCard from './WidgetCard';

interface QuickAction {
  label: string;
  href: string;
  icon: typeof Plus;
  color?: string;
}

const DEFAULT_ACTIONS: QuickAction[] = [
  { label: 'New Contact', href: '/crm?action=create', icon: Users, color: 'text-blue-600' },
  { label: 'New Agent', href: '/agents?action=create', icon: Bot, color: 'text-violet-600' },
  { label: 'New Document', href: '/knowledge-base?action=upload', icon: FileText, color: 'text-amber-600' },
  { label: 'New Message', href: '/conversations', icon: MessageSquare, color: 'text-emerald-600' },
  { label: 'View Analytics', href: '/admin/analytics', icon: BarChart3, color: 'text-pink-600' },
  { label: 'Workflows', href: '/orchestration', icon: Zap, color: 'text-orange-600' },
];

interface QuickActionsWidgetProps {
  actions?: QuickAction[];
  onRemove?: () => void;
}

export default function QuickActionsWidget({ 
  actions = DEFAULT_ACTIONS,
  onRemove,
}: QuickActionsWidgetProps) {
  return (
    <WidgetCard title="Quick Actions" icon={Zap} onRemove={onRemove}>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            size="sm"
            className="justify-start h-auto py-3"
            asChild
          >
            <Link href={action.href}>
              <action.icon className={`h-4 w-4 mr-2 ${action.color || 'text-muted-foreground'}`} />
              <span className="truncate">{action.label}</span>
            </Link>
          </Button>
        ))}
      </div>
    </WidgetCard>
  );
}
