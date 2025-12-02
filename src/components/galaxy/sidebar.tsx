"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { OrganizationSwitcher } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Palette,
  BookOpen,
  Users,
  Megaphone,
  FlaskConical,
  Sparkles,
  Plug,
  Settings,
  Bot,
  PanelLeftClose,
  PanelLeftOpen,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

// Main navigation items
const mainNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", id: "dashboard" },
  { icon: Bot, label: "My Agents", href: "/activity", id: "activity" },
  { icon: Palette, label: "Creator", href: "/creator", id: "creator" },
  { icon: BookOpen, label: "Library", href: "/library", id: "library" },
  { icon: Users, label: "CRM", href: "/crm", id: "crm" },
  { icon: MessageSquare, label: "Conversations", href: "/conversations", id: "conversations" },
  { icon: TrendingUp, label: "Finance HQ", href: "/finance", id: "finance" },
  { icon: Megaphone, label: "Marketing", href: "/marketing", id: "marketing" },
  { icon: FlaskConical, label: "Lunar Labs", href: "/lunar-labs", id: "lunar-labs" },
];

// Secondary navigation items
const secondaryNavItems = [
  { icon: Sparkles, label: "Neptune", href: "/assistant", id: "assistant" },
  { icon: Plug, label: "Connected Apps", href: "/connected-apps", id: "connected-apps" },
  { icon: Settings, label: "Settings", href: "/settings", id: "settings" },
];

interface SidebarProps {
  className?: string;
  user?: {
    name: string;
    email: string;
    avatar?: string;
    initials?: string;
  };
}

export function Sidebar({ className, user }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const userInitials = user?.initials || (user?.name ? getInitials(user.name) : "JD");

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        isCollapsed ? "w-14" : "w-52",
        className
      )}
      aria-label="Main navigation"
    >
      {/* Header */}
      <div className={cn(
        "flex items-center border-b border-sidebar-border px-3 py-3",
        isCollapsed ? "flex-col gap-2" : "justify-between"
      )}>
        <Link 
          href="/" 
          className={cn(
            "flex items-center gap-2 rounded-lg transition-colors hover:opacity-80",
            isCollapsed && "justify-center"
          )}
          aria-label="Go to landing page"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <Bot className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!isCollapsed && (
            <h2 className="text-base font-semibold text-sidebar-foreground">GalaxyCo.ai</h2>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
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

      {/* Main Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-2 mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Main
            </p>
          </div>
        )}

        {mainNavItems.map((item) => {
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
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50",
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
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-sidebar-primary rounded-r-full" />
                )}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Secondary Navigation */}
      <div className="px-2 py-3 border-t border-sidebar-border">
        {!isCollapsed && (
          <div className="px-2 mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Secondary
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
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50",
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
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-sidebar-primary rounded-r-full" />
                  )}
                </Button>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Organization Switcher */}
      <Separator />
      <div className={cn("p-3", isCollapsed && "flex justify-center")}>
        <OrganizationSwitcher
          hidePersonal={false}
          afterCreateOrganizationUrl="/dashboard"
          afterLeaveOrganizationUrl="/dashboard"
          afterSelectOrganizationUrl="/dashboard"
          afterSelectPersonalUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: cn(
                "w-full",
                isCollapsed && "w-auto"
              ),
              organizationSwitcherTrigger: cn(
                "w-full rounded-lg border border-sidebar-border bg-sidebar hover:bg-sidebar-accent/50 transition-colors",
                isCollapsed ? "p-1.5 justify-center" : "p-2 justify-start gap-2"
              ),
              organizationPreviewMainIdentifier: "text-sm font-medium text-sidebar-foreground",
              organizationPreviewSecondaryIdentifier: "text-xs text-muted-foreground",
              organizationSwitcherTriggerIcon: "text-muted-foreground",
            },
          }}
        />
      </div>

      {/* User Profile */}
      {user && (
        <>
          <Separator />
          <div className="p-3">
            <div
              className={cn(
                "flex items-center gap-2.5",
                isCollapsed && "justify-center"
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </aside>
  );
}

