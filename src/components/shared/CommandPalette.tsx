"use client";

/**
 * Command Palette Component
 * 
 * Features:
 * - Keyboard shortcut (Cmd/Ctrl+K) to open
 * - Recent items from localStorage
 * - Suggested actions based on context
 * - Quick navigation across entities
 * - Search integration
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { 
  Search,
  Bot,
  Users,
  ListTodo,
  Settings,
  FileText,
  Sparkles,
  DollarSign,
  BarChart3,
  Mail,
  Phone,
  Calendar,
  Zap,
  Home,
  History,
  ChevronRight,
} from 'lucide-react';

interface RecentItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  timestamp: number;
}

interface CommandPaletteProps {
  workspaceId: string;
}

export default function CommandPalette({ workspaceId }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const router = useRouter();

  // Load recent items from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`command-palette-recent-${workspaceId}`);
    if (stored) {
      try {
        const items = JSON.parse(stored) as RecentItem[];
        // Sort by timestamp and keep last 5
        setRecentItems(items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5));
      } catch (e) {
        console.error('Failed to parse recent items', e);
      }
    }
  }, [workspaceId]);

  // Save recent items to localStorage
  const saveRecentItem = useCallback((item: Omit<RecentItem, 'timestamp'>) => {
    const newItem: RecentItem = {
      ...item,
      timestamp: Date.now(),
    };

    setRecentItems((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter((i) => i.id !== newItem.id);
      // Add new item at the beginning
      const updated = [newItem, ...filtered].slice(0, 5);
      
      // Save to localStorage
      localStorage.setItem(`command-palette-recent-${workspaceId}`, JSON.stringify(updated));
      
      return updated;
    });
  }, [workspaceId]);

  // Navigate to a page
  const navigate = useCallback((href: string, label: string, icon: string) => {
    saveRecentItem({ id: href, label, href, icon });
    router.push(href);
    setOpen(false);
    setSearch('');
  }, [router, saveRecentItem]);

  // Keyboard shortcut handler
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Get icon component from string
  const getIcon = (iconName: string) => {
    const icons: Record<string, typeof Home> = {
      home: Home,
      bot: Bot,
      users: Users,
      todo: ListTodo,
      settings: Settings,
      file: FileText,
      sparkles: Sparkles,
      dollar: DollarSign,
      chart: BarChart3,
      mail: Mail,
      phone: Phone,
      calendar: Calendar,
      zap: Zap,
    };
    const Icon = icons[iconName] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  // Suggested actions
  const suggestedActions = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: 'home',
      group: 'Navigation',
    },
    {
      id: 'agents',
      label: 'Agents',
      href: '/agents',
      icon: 'bot',
      group: 'Navigation',
    },
    {
      id: 'crm',
      label: 'CRM',
      href: '/crm',
      icon: 'users',
      group: 'Navigation',
    },
    {
      id: 'tasks',
      label: 'Tasks',
      href: '/tasks',
      icon: 'todo',
      group: 'Navigation',
    },
    {
      id: 'finance',
      label: 'Finance HQ',
      href: '/finance',
      icon: 'dollar',
      group: 'Navigation',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      href: '/admin/analytics',
      icon: 'chart',
      group: 'Navigation',
    },
    {
      id: 'settings',
      label: 'Settings',
      href: '/admin/settings',
      icon: 'settings',
      group: 'Settings',
    },
  ];

  // Quick actions
  const quickActions = [
    {
      id: 'create-agent',
      label: 'Create Agent',
      href: '/agents?action=create',
      icon: 'bot',
      group: 'Quick Actions',
    },
    {
      id: 'add-contact',
      label: 'Add Contact',
      href: '/crm?action=create',
      icon: 'users',
      group: 'Quick Actions',
    },
    {
      id: 'create-task',
      label: 'Create Task',
      href: '/tasks?action=create',
      icon: 'todo',
      group: 'Quick Actions',
    },
    {
      id: 'new-conversation',
      label: 'Start Conversation',
      href: '/conversations?action=create',
      icon: 'mail',
      group: 'Quick Actions',
    },
  ];

  return (
    <>
      {/* Keyboard hint */}
      <button
        onClick={() => setOpen(true)}
        className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Command Dialog */}
      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Command Menu"
        className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] rounded-lg border bg-background shadow-lg"
      >
        <div className="flex items-center border-b px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder="Type a command or search..."
            className="flex h-12 w-full rounded-md bg-transparent py-3 px-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <Command.List className="max-h-[400px] overflow-y-auto overflow-x-hidden p-2">
          <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
            No results found.
          </Command.Empty>

          {/* Recent Items */}
          {recentItems.length > 0 && !search && (
            <Command.Group heading="Recent" className="mb-2">
              {recentItems.map((item) => (
                <Command.Item
                  key={item.id}
                  value={item.label}
                  onSelect={() => navigate(item.href, item.label, item.icon)}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground hover:bg-accent/50"
                >
                  <History className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {/* Quick Actions */}
          {!search && (
            <Command.Group heading="Quick Actions" className="mb-2">
              {quickActions.map((action) => (
                <Command.Item
                  key={action.id}
                  value={action.label}
                  onSelect={() => navigate(action.href, action.label, action.icon)}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground hover:bg-accent/50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    {getIcon(action.icon)}
                  </div>
                  <span className="flex-1">{action.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {/* Navigation */}
          <Command.Group heading="Navigation" className="mb-2">
            {suggestedActions.map((action) => (
              <Command.Item
                key={action.id}
                value={action.label}
                onSelect={() => navigate(action.href, action.label, action.icon)}
                className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground hover:bg-accent/50"
              >
                {getIcon(action.icon)}
                <span className="flex-1">{action.label}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
        
        {/* Footer hint */}
        <div className="border-t px-4 py-3 text-xs text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ↑↓
              </kbd>
              <span>to navigate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ↵
              </kbd>
              <span>to select</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              esc
            </kbd>
            <span>to close</span>
          </div>
        </div>
      </Command.Dialog>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
