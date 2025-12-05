"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
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
  Rocket,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

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
  { icon: Rocket, label: "Launchpad", href: "/launchpad", id: "launchpad" },
  { icon: Sparkles, label: "Neptune", href: "/assistant", id: "assistant" },
  { icon: Plug, label: "Connectors", href: "/connected-apps", id: "connected-apps" },
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
  const [isManuallyControlled, setIsManuallyControlled] = React.useState(false);
  const { user: clerkUser } = useUser();
  
  // Auto-collapse sidebar on smaller screens
  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      // Auto-collapse below lg breakpoint (1024px) if not manually controlled
      if (width < 1024 && !isManuallyControlled) {
        setIsCollapsed(true);
      } else if (width >= 1024 && !isManuallyControlled) {
        setIsCollapsed(false);
      }
    };

    // Initial check
    handleResize();

    // Listen for resize events
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isManuallyControlled]);
  
  // Check if user is system admin
  const isSystemAdmin = React.useMemo(() => {
    if (!clerkUser) return false;
    const metadata = clerkUser.publicMetadata as { isSystemAdmin?: boolean } | undefined;
    return metadata?.isSystemAdmin === true;
  }, [clerkUser]);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar/95 backdrop-blur-md border-r border-white/40 transition-all duration-300",
        "rounded-r-2xl mt-4 mb-4 mr-4 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.1)] self-stretch",
        isCollapsed ? "w-14" : "w-52",
        className
      )}
      aria-label="Main navigation"
    >
      {/* Collapse Toggle */}
      <TooltipProvider delayDuration={0}>
        <div className="flex items-center justify-end px-3 py-3 border-b border-sidebar-border">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setIsManuallyControlled(true);
                  setIsCollapsed(!isCollapsed);
                }}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              align="center"
              className="bg-white/95 backdrop-blur-xl border border-gray-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.12)] text-gray-900 font-medium px-3 py-1.5 rounded-lg"
            >
              {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Main Navigation */}
      <TooltipProvider delayDuration={0}>
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

            const button = (
              <Button
                variant="ghost"
                className={cn(
                  "w-full h-9 rounded-lg transition-all duration-200",
                  "flex items-center gap-2.5",
                  isCollapsed ? "justify-center px-0" : "justify-start px-2.5",
                  active
                    ? "shadow-[0_1px_3px_rgba(0,0,0,0.08)] text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
                  "font-normal"
                )}
                aria-label={isCollapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && (
                  <span className="text-xs font-normal whitespace-nowrap">{item.label}</span>
                )}
              </Button>
            );

            return (
              <Link key={item.id} href={item.href}>
                {isCollapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {button}
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      align="center"
                      className="bg-white/95 backdrop-blur-xl border border-gray-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.12)] text-gray-900 font-medium px-3 py-1.5 rounded-lg"
                    >
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  button
                )}
              </Link>
            );
          })}
        </nav>
      </TooltipProvider>

      {/* Secondary Navigation */}
      <TooltipProvider delayDuration={0}>
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

              const button = (
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full h-9 rounded-lg transition-all duration-200",
                    "flex items-center gap-2.5",
                    isCollapsed ? "justify-center px-0" : "justify-start px-2.5",
                    active
                      ? "shadow-[0_1px_3px_rgba(0,0,0,0.08)] text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
                    "font-normal"
                  )}
                  aria-label={isCollapsed ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!isCollapsed && (
                    <span className="text-xs font-normal whitespace-nowrap">{item.label}</span>
                  )}
                </Button>
              );

              return (
                <Link key={item.id} href={item.href}>
                  {isCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {button}
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        align="center"
                        className="bg-white/95 backdrop-blur-xl border border-gray-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.12)] text-gray-900 font-medium px-3 py-1.5 rounded-lg"
                      >
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    button
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </TooltipProvider>

      {/* Mission Control (Admin Only) */}
      {isSystemAdmin && (
        <>
          <Separator className="mt-auto" />
          <TooltipProvider delayDuration={0}>
            <div className="px-2 py-3">
              {!isCollapsed && (
                <div className="px-2 mb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Admin
                  </p>
                </div>
              )}
              <Link href="/admin">
                {isCollapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full h-9 rounded-lg transition-all duration-200",
                          "flex items-center gap-2.5",
                          "justify-center px-0",
                          isActive("/admin")
                            ? "shadow-[0_1px_3px_rgba(0,0,0,0.08)] text-indigo-600"
                            : "text-sidebar-foreground hover:shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
                          "font-normal"
                        )}
                        aria-label="Mission Control"
                        aria-current={isActive("/admin") ? "page" : undefined}
                      >
                        <Gauge className="h-4 w-4 shrink-0" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      align="center"
                      className="bg-white/95 backdrop-blur-xl border border-gray-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.12)] text-gray-900 font-medium px-3 py-1.5 rounded-lg"
                    >
                      Mission Control
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full h-9 rounded-lg transition-all duration-200",
                      "flex items-center gap-2.5",
                      "justify-start px-2.5",
                      isActive("/admin")
                        ? "shadow-[0_1px_3px_rgba(0,0,0,0.08)] text-indigo-600"
                        : "text-sidebar-foreground hover:shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
                      "font-normal"
                    )}
                    aria-current={isActive("/admin") ? "page" : undefined}
                  >
                    <Gauge className="h-4 w-4 shrink-0" />
                    <span className="text-xs font-normal whitespace-nowrap">Mission Control</span>
                  </Button>
                )}
              </Link>
            </div>
          </TooltipProvider>
        </>
      )}
    </aside>
  );
}

