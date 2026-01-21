"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Palette,
  BookOpen,
  Users,
  MessageSquare,
  TrendingUp,
  MessageSquarePlus,
  Rocket,
  Sparkles,
  Bot,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { trackClick } from "@/lib/analytics";
import { useFeedback } from "@/contexts/feedback-context";
import { useConversationsUnread } from "@/hooks/useConversationsUnread";

// Core navigation items (always visible)
const coreNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", id: "dashboard" },
  { icon: Bot, label: "My Agents", href: "/activity", id: "activity" },
  { icon: Palette, label: "Creator", href: "/creator", id: "creator" },
  { icon: BookOpen, label: "Library", href: "/library", id: "library" },
  { icon: Users, label: "CRM", href: "/crm", id: "crm" },
  { icon: MessageSquare, label: "Conversations", href: "/conversations", id: "conversations" },
  { icon: Megaphone, label: "Marketing", href: "/marketing", id: "marketing" },
  { icon: TrendingUp, label: "Finance HQ", href: "/finance", id: "finance" },
];

// Secondary navigation items (Bottom section)
const secondaryNavItems = [
  { icon: Rocket, label: "Launchpad", href: "/blog", id: "launchpad" },
  { icon: Sparkles, label: "Neptune HQ", href: "/neptune-hq", id: "neptune-hq" },
];

interface SlimSidebarProps {
  className?: string;
}

export function SlimSidebar({ className }: SlimSidebarProps) {
  const pathname = usePathname();
  const { openFeedback } = useFeedback();
  const unreadCount = useConversationsUnread();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "flex flex-col w-[200px] bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex-shrink-0",
        "hidden lg:flex", // Hidden on mobile
        className
      )}
      aria-label="Main navigation"
    >
      {/* Main Navigation */}
      <nav className="flex-1 px-2 py-6 space-y-1">
        {/* MAIN Label */}
        <div className="px-3 mb-3">
          <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Main
          </p>
        </div>

        {coreNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => trackClick(`sidebar_${item.id}`, { section: 'main', label: item.label })}
            >
              <Button
                variant="ghost"
                className={cn(
                  "w-full h-10 flex items-center gap-3 justify-start px-3 rounded-md transition-all duration-150",
                  active
                    ? "bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900"
                )}
                aria-current={active ? "page" : undefined}
              >
                <div className="relative flex-shrink-0">
                  <Icon className="h-5 w-5" />
                  {/* Notification Badge for Conversations */}
                  {item.id === "conversations" && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" aria-hidden="true" />
                  )}
                </div>
                <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                {/* Unread Count Badge for Conversations */}
                {item.id === "conversations" && unreadCount > 0 && (
                  <span className="ml-auto h-5 min-w-[20px] px-1.5 flex items-center justify-center bg-red-500 text-white text-[10px] font-semibold rounded-full">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Button>
            </Link>
          );
        })}

        {/* Feedback Button */}
        <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
          <Button
            variant="ghost"
            className={cn(
              "w-full h-10 flex items-center gap-3 justify-start px-3 rounded-md transition-all duration-150",
              "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900"
            )}
            onClick={() => {
              trackClick('sidebar_feedback', { section: 'main', label: 'Feedback' });
              openFeedback();
            }}
          >
            <MessageSquarePlus className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">Feedback</span>
          </Button>
        </div>
      </nav>

      {/* Secondary Navigation (Bottom) */}
      <div className="px-2 py-4 border-t border-gray-200 dark:border-gray-800 space-y-1">
        <div className="px-3 mb-3">
          <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Quick Access
          </p>
        </div>

        {secondaryNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => trackClick(`sidebar_${item.id}`, { section: 'secondary', label: item.label })}
            >
              <Button
                variant="ghost"
                className={cn(
                  "w-full h-10 flex items-center gap-3 justify-start px-3 rounded-md transition-all duration-150",
                  active
                    ? "bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
