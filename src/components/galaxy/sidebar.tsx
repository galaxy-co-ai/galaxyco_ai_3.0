"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Palette,
  BookOpen,
  Users,
  Megaphone,
  FlaskConical,
  Sparkles,
  Bot,
  PanelLeftClose,
  PanelLeftOpen,
  TrendingUp,
  MessageSquare,
  Rocket,
  MessageSquarePlus,
  Network,
  UsersRound,
  Workflow,
  ClipboardCheck,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { trackClick } from "@/lib/analytics";
import { useFeedback } from "@/contexts/feedback-context";
import { useConversationsUnread } from "@/hooks/useConversationsUnread";
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
  { icon: Network, label: "Orchestration", href: "/orchestration", id: "orchestration", hasSubitems: true },
  { icon: FlaskConical, label: "Lunar Labs", href: "/lunar-labs", id: "lunar-labs" },
];

// Orchestration subitems
const orchestrationSubitems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/orchestration", id: "orchestration-dashboard" },
  { icon: UsersRound, label: "Teams", href: "/orchestration/teams", id: "orchestration-teams" },
  { icon: Workflow, label: "Workflows", href: "/orchestration/workflows", id: "orchestration-workflows" },
  { icon: ClipboardCheck, label: "Approvals", href: "/orchestration/approvals", id: "orchestration-approvals" },
];

// Secondary navigation items (Settings, Connectors, Mission Control moved to avatar dropdown)
const secondaryNavItems = [
  { icon: Rocket, label: "Launchpad", href: "/blog", id: "launchpad" },
  { icon: Sparkles, label: "Neptune HQ", href: "/neptune-hq", id: "neptune-hq" },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isManuallyControlled, setIsManuallyControlled] = React.useState(false);
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set());
  const { openFeedback } = useFeedback();
  const unreadCount = useConversationsUnread();

  // Auto-expand Orchestration section if on orchestration page
  React.useEffect(() => {
    if (pathname.startsWith('/orchestration')) {
      setExpandedSections(prev => new Set(prev).add('orchestration'));
    }
  }, [pathname]);

  // Toggle section expansion
  const toggleSection = React.useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);
  
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
                  trackClick('sidebar_toggle', { action: isCollapsed ? 'expand' : 'collapse' });
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
            const hasSubitems = 'hasSubitems' in item && item.hasSubitems;
            const isExpanded = expandedSections.has(item.id);

            // For items with subitems (like Orchestration)
            if (hasSubitems && !isCollapsed) {
              return (
                <div key={item.id}>
                  <button
                    onClick={() => toggleSection(item.id)}
                    className={cn(
                      "w-full h-9 rounded-lg transition-all duration-200",
                      "flex items-center gap-2.5 justify-start px-2.5",
                      active
                        ? "shadow-[0_1px_3px_rgba(0,0,0,0.08)] text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
                      "font-normal"
                    )}
                    aria-expanded={isExpanded}
                    aria-label={`${item.label}, ${isExpanded ? 'collapse' : 'expand'} submenu`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-xs font-normal whitespace-nowrap flex-1 text-left">{item.label}</span>
                    <ChevronDown 
                      className={cn(
                        "h-3 w-3 shrink-0 transition-transform duration-200",
                        isExpanded && "rotate-180"
                      )} 
                    />
                  </button>
                  
                  {/* Subitems */}
                  {isExpanded && (
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l border-sidebar-border/50 pl-2">
                      {orchestrationSubitems.map((subitem) => {
                        const SubIcon = subitem.icon;
                        const subActive = pathname === subitem.href || 
                          (subitem.href !== '/orchestration' && pathname.startsWith(subitem.href));
                        
                        return (
                          <Link
                            key={subitem.id}
                            href={subitem.href}
                            onClick={() => trackClick(`sidebar_${subitem.id}`, { section: 'orchestration', label: subitem.label })}
                          >
                            <Button
                              variant="ghost"
                              className={cn(
                                "w-full h-8 rounded-lg transition-all duration-200",
                                "flex items-center gap-2 justify-start px-2",
                                subActive
                                  ? "shadow-[0_1px_3px_rgba(0,0,0,0.08)] text-sidebar-accent-foreground bg-sidebar-accent/50"
                                  : "text-sidebar-foreground/80 hover:shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
                                "font-normal"
                              )}
                              aria-current={subActive ? "page" : undefined}
                            >
                              <SubIcon className="h-3.5 w-3.5 shrink-0" />
                              <span className="text-xs font-normal whitespace-nowrap">{subitem.label}</span>
                            </Button>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const button = (
              <Button
                variant="ghost"
                className={cn(
                  "w-full h-9 rounded-lg transition-all duration-200",
                  "flex items-center gap-2.5 relative",
                  isCollapsed ? "justify-center px-0" : "justify-start px-2.5",
                  active
                    ? "shadow-[0_1px_3px_rgba(0,0,0,0.08)] text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
                  "font-normal"
                )}
                aria-label={isCollapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
              >
                <div className="relative">
                  <Icon className="h-4 w-4 shrink-0" />
                  {/* Notification Badge for Conversations */}
                  {item.id === "conversations" && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </div>
                {!isCollapsed && (
                  <>
                    <span className="text-xs font-normal whitespace-nowrap flex-1">{item.label}</span>
                    {/* Unread Count Badge for Conversations (expanded state) */}
                    {item.id === "conversations" && unreadCount > 0 && (
                      <span className="ml-auto h-5 min-w-[20px] px-1.5 flex items-center justify-center bg-red-500 text-white text-[10px] font-medium rounded-full">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </>
                )}
              </Button>
            );

            return (
              <Link 
                key={item.id} 
                href={item.href}
                onClick={() => trackClick(`sidebar_${item.id}`, { section: 'main', label: item.label })}
              >
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

          {/* Feedback Button - at bottom of Main section */}
          <div className="mt-2 pt-2 border-t border-sidebar-border/50">
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full h-9 rounded-lg transition-all duration-200",
                      "flex items-center gap-2.5",
                      "justify-center px-0",
                      "text-sidebar-foreground hover:shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
                      "font-normal"
                    )}
                    onClick={() => {
                      trackClick('sidebar_feedback', { section: 'main', label: 'Feedback' });
                      openFeedback();
                    }}
                    aria-label="Send Feedback"
                  >
                    <MessageSquarePlus className="h-4 w-4 shrink-0" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  align="center"
                  className="bg-white/95 backdrop-blur-xl border border-gray-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.12)] text-gray-900 font-medium px-3 py-1.5 rounded-lg"
                >
                  Feedback
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="ghost"
                className={cn(
                  "w-full h-9 rounded-lg transition-all duration-200",
                  "flex items-center gap-2.5",
                  "justify-start px-2.5",
                  "text-sidebar-foreground hover:shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
                  "font-normal"
                )}
                onClick={() => {
                  trackClick('sidebar_feedback', { section: 'main', label: 'Feedback' });
                  openFeedback();
                }}
              >
                <MessageSquarePlus className="h-4 w-4 shrink-0" />
                <span className="text-xs font-normal whitespace-nowrap">Feedback</span>
              </Button>
            )}
          </div>
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
                <Link 
                  key={item.id} 
                  href={item.href}
                  onClick={() => trackClick(`sidebar_${item.id}`, { section: 'secondary', label: item.label })}
                >
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

    </aside>
  );
}

