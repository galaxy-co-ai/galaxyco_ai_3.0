"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Gauge,
  FileText,
  BarChart3,
  MessageSquareWarning,
  Users,
  Settings,
  ArrowLeft,
  Rocket,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Admin navigation items
const adminNavItems = [
  { 
    icon: Gauge, 
    label: "Overview", 
    href: "/admin", 
    id: "overview",
    description: "Dashboard & metrics"
  },
  { 
    icon: FileText, 
    label: "Content Studio", 
    href: "/admin/content", 
    id: "content",
    description: "Manage Launchpad posts"
  },
  { 
    icon: BarChart3, 
    label: "Analytics", 
    href: "/admin/analytics", 
    id: "analytics",
    description: "User engagement data"
  },
  { 
    icon: MessageSquareWarning, 
    label: "Feedback Hub", 
    href: "/admin/feedback", 
    id: "feedback",
    description: "Platform feedback"
  },
  { 
    icon: Users, 
    label: "Users", 
    href: "/admin/users", 
    id: "users",
    description: "User management"
  },
];

const secondaryNavItems = [
  { 
    icon: Settings, 
    label: "Admin Settings", 
    href: "/admin/settings", 
    id: "settings" 
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-zinc-950 border-r border-zinc-800 transition-all duration-300",
        isCollapsed ? "w-14" : "w-56"
      )}
      aria-label="Mission Control navigation"
    >
      {/* Header */}
      <div className={cn(
        "flex items-center border-b border-zinc-800 px-3 py-3",
        isCollapsed ? "flex-col gap-2" : "justify-between"
      )}>
        <Link 
          href="/admin" 
          className={cn(
            "flex items-center gap-2 rounded-lg transition-colors hover:opacity-80",
            isCollapsed && "justify-center"
          )}
          aria-label="Mission Control home"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
            <Rocket className="h-4 w-4 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Mission Control</h2>
              <p className="text-xs text-zinc-500">Admin Dashboard</p>
            </div>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Back to App */}
      <div className="px-2 py-3">
        <Link href="/dashboard">
          <Button
            variant="ghost"
            className={cn(
              "w-full h-9 rounded-lg transition-colors",
              "flex items-center gap-2.5",
              isCollapsed ? "justify-center px-0" : "justify-start px-2.5",
              "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50",
              "font-normal"
            )}
            aria-label="Back to app"
          >
            <ArrowLeft className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && (
              <span className="text-sm">Back to App</span>
            )}
          </Button>
        </Link>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Main Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-2 mb-2">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Management
            </p>
          </div>
        )}

        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link key={item.id} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full h-9 rounded-lg transition-colors",
                  "flex items-center gap-2.5",
                  isCollapsed ? "justify-center px-0" : "justify-start px-2.5",
                  active
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50",
                  "font-normal relative"
                )}
                aria-label={isCollapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                )}
                {active && !isCollapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-500 rounded-r-full" />
                )}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Secondary Navigation */}
      <div className="px-2 py-3 border-t border-zinc-800">
        {!isCollapsed && (
          <div className="px-2 mb-2">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              System
            </p>
          </div>
        )}

        <div className="space-y-0.5">
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link key={item.id} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full h-9 rounded-lg transition-colors",
                    "flex items-center gap-2.5",
                    isCollapsed ? "justify-center px-0" : "justify-start px-2.5",
                    active
                      ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50",
                    "font-normal relative"
                  )}
                  aria-label={isCollapsed ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                  )}
                  {active && !isCollapsed && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-500 rounded-r-full" />
                  )}
                </Button>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Version Info */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-t border-zinc-800">
          <p className="text-xs text-zinc-600">
            Mission Control v1.0
          </p>
        </div>
      )}
    </aside>
  );
}
