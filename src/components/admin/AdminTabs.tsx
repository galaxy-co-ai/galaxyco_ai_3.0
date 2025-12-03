"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { 
  Gauge, 
  FileText, 
  BarChart3, 
  MessageSquareWarning, 
  Users, 
  Settings,
  FolderOpen
} from "lucide-react";

export type AdminTabType = 'overview' | 'content' | 'categories' | 'analytics' | 'feedback' | 'users' | 'settings';

interface AdminTabsProps {
  counts?: Partial<Record<AdminTabType, number>>;
}

const tabs: Array<{
  value: AdminTabType;
  label: string;
  href: string;
  icon: typeof Gauge;
  activeColor: string;
  badgeColor: string;
}> = [
  { 
    value: 'overview', 
    label: 'Overview', 
    href: '/admin',
    icon: Gauge, 
    activeColor: 'bg-indigo-100 text-indigo-700', 
    badgeColor: 'bg-indigo-500' 
  },
  { 
    value: 'content', 
    label: 'Content', 
    href: '/admin/content',
    icon: FileText, 
    activeColor: 'bg-blue-100 text-blue-700', 
    badgeColor: 'bg-blue-500' 
  },
  { 
    value: 'categories', 
    label: 'Categories', 
    href: '/admin/content/categories',
    icon: FolderOpen, 
    activeColor: 'bg-cyan-100 text-cyan-700', 
    badgeColor: 'bg-cyan-500' 
  },
  { 
    value: 'analytics', 
    label: 'Analytics', 
    href: '/admin/analytics',
    icon: BarChart3, 
    activeColor: 'bg-green-100 text-green-700', 
    badgeColor: 'bg-green-500' 
  },
  { 
    value: 'feedback', 
    label: 'Feedback', 
    href: '/admin/feedback',
    icon: MessageSquareWarning, 
    activeColor: 'bg-amber-100 text-amber-700', 
    badgeColor: 'bg-amber-500' 
  },
  { 
    value: 'users', 
    label: 'Users', 
    href: '/admin/users',
    icon: Users, 
    activeColor: 'bg-purple-100 text-purple-700', 
    badgeColor: 'bg-purple-500' 
  },
  { 
    value: 'settings', 
    label: 'Settings', 
    href: '/admin/settings',
    icon: Settings, 
    activeColor: 'bg-zinc-100 text-zinc-700', 
    badgeColor: 'bg-zinc-500' 
  },
];

export default function AdminTabs({ counts = {} }: AdminTabsProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex justify-center">
      <div className="bg-background/80 backdrop-blur-lg rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-1 inline-flex gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.href);
          const count = counts[tab.value];
          
          return (
            <Link
              key={tab.value}
              href={tab.href}
              className={`relative px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                active
                  ? `${tab.activeColor} shadow-sm`
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-label={`Go to ${tab.label}`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              {count !== undefined && count > 0 && (
                <Badge 
                  className={`${active ? 'bg-white/90 text-gray-700' : tab.badgeColor + ' text-white'} text-xs px-1.5 py-0 h-4 min-w-[18px]`}
                >
                  {count}
                </Badge>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
