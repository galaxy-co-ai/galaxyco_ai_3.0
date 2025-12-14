"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  Palette,
  BookOpen,
  TrendingUp,
  Megaphone,
  FlaskConical,
  Sparkles,
  Rocket,
  Network,
  Settings,
  Plug,
  Gauge,
  MessageSquarePlus,
  User,
  ChevronDown,
  UsersRound,
  Workflow,
  ClipboardCheck,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { trackClick } from "@/lib/analytics";
import { useFeedback } from "@/contexts/feedback-context";

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  id: string;
  hasSubitems?: boolean;
}

interface SubItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  id: string;
}

// Additional navigation items (not in bottom nav)
const additionalNavItems: NavItem[] = [
  { icon: Palette, label: "Creator", href: "/creator", id: "creator" },
  { icon: BookOpen, label: "Library", href: "/library", id: "library" },
  { icon: TrendingUp, label: "Finance HQ", href: "/finance", id: "finance" },
  { icon: Megaphone, label: "Marketing", href: "/marketing", id: "marketing" },
  { icon: Network, label: "Orchestration", href: "/orchestration", id: "orchestration", hasSubitems: true },
  { icon: FlaskConical, label: "Lunar Labs", href: "/lunar-labs", id: "lunar-labs" },
];

// Orchestration subitems
const orchestrationSubitems: SubItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/orchestration", id: "orchestration-dashboard" },
  { icon: UsersRound, label: "Teams", href: "/orchestration/teams", id: "orchestration-teams" },
  { icon: Workflow, label: "Workflows", href: "/orchestration/workflows", id: "orchestration-workflows" },
  { icon: ClipboardCheck, label: "Approvals", href: "/orchestration/approvals", id: "orchestration-approvals" },
];

// Secondary items
const secondaryNavItems: NavItem[] = [
  { icon: Rocket, label: "Launchpad", href: "/blog", id: "launchpad" },
  { icon: Sparkles, label: "Neptune", href: "/assistant", id: "assistant" },
];

// Settings items
const settingsItems: NavItem[] = [
  { icon: Settings, label: "Settings", href: "/settings", id: "settings" },
  { icon: Plug, label: "Connectors", href: "/connectors", id: "connectors" },
  { icon: Gauge, label: "Mission Control", href: "/mission-control", id: "mission-control" },
  { icon: User, label: "Profile", href: "/profile", id: "profile" },
];

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set());
  const { openFeedback } = useFeedback();
  const menuRef = React.useRef<HTMLDivElement>(null);
  const touchStartX = React.useRef<number>(0);
  const touchStartY = React.useRef<number>(0);

  // Auto-expand Orchestration if on that page
  React.useEffect(() => {
    if (pathname.startsWith('/orchestration')) {
      setExpandedSections(prev => new Set(prev).add('orchestration'));
    }
  }, [pathname]);

  // Close menu on Escape key
  React.useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when menu is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Swipe to close gesture
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = Math.abs(touchEndY - touchStartY.current);

    // Swipe right to close (> 50px horizontal, < 30px vertical)
    if (deltaX > 50 && deltaY < 30) {
      onClose();
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Drawer */}
      <div
        ref={menuRef}
        className={cn(
          "fixed top-0 left-0 bottom-0 z-50",
          "w-[280px] max-w-[85vw]",
          "bg-card border-r border-border",
          "shadow-2xl",
          "overflow-y-auto",
          "lg:hidden",
          "transform transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label="Mobile menu"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Menu</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-9 w-9"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-6">
          {/* Additional Navigation */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
              Navigate
            </p>
            {additionalNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const hasSubitems = item.hasSubitems;
              const isExpanded = expandedSections.has(item.id);

              if (hasSubitems) {
                return (
                  <div key={item.id}>
                    <button
                      onClick={() => toggleSection(item.id)}
                      className={cn(
                        "w-full flex items-center justify-between gap-3",
                        "min-h-[44px] px-3 py-2.5 rounded-lg",
                        "text-sm font-medium",
                        "transition-colors duration-200",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-accent"
                      )}
                      aria-expanded={isExpanded}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronDown 
                        className={cn(
                          "h-4 w-4 shrink-0 transition-transform duration-200",
                          isExpanded && "rotate-180"
                        )} 
                      />
                    </button>
                    
                    {isExpanded && (
                      <div className="ml-8 mt-1 space-y-1">
                        {orchestrationSubitems.map((subitem) => {
                          const SubIcon = subitem.icon;
                          const subActive = pathname === subitem.href || 
                            (subitem.href !== '/orchestration' && pathname.startsWith(subitem.href));
                          
                          return (
                            <Link
                              key={subitem.id}
                              href={subitem.href}
                              onClick={() => {
                                trackClick(`mobile_menu_${subitem.id}`, { section: 'orchestration' });
                                onClose();
                              }}
                              className={cn(
                                "flex items-center gap-3",
                                "min-h-[44px] px-3 py-2.5 rounded-lg",
                                "text-sm",
                                "transition-colors duration-200",
                                subActive
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
                              )}
                              aria-current={subActive ? "page" : undefined}
                            >
                              <SubIcon className="h-4 w-4 shrink-0" />
                              <span>{subitem.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => {
                    trackClick(`mobile_menu_${item.id}`, { label: item.label });
                    onClose();
                  }}
                  className={cn(
                    "flex items-center gap-3",
                    "min-h-[44px] px-3 py-2.5 rounded-lg",
                    "text-sm font-medium",
                    "transition-colors duration-200",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-accent"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Secondary Navigation */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
              Tools
            </p>
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => {
                    trackClick(`mobile_menu_${item.id}`, { label: item.label });
                    onClose();
                  }}
                  className={cn(
                    "flex items-center gap-3",
                    "min-h-[44px] px-3 py-2.5 rounded-lg",
                    "text-sm font-medium",
                    "transition-colors duration-200",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-accent"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Settings */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
              Account
            </p>
            {settingsItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => {
                    trackClick(`mobile_menu_${item.id}`, { label: item.label });
                    onClose();
                  }}
                  className={cn(
                    "flex items-center gap-3",
                    "min-h-[44px] px-3 py-2.5 rounded-lg",
                    "text-sm font-medium",
                    "transition-colors duration-200",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-accent"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Feedback Button */}
          <div className="pt-2 border-t border-border">
            <Button
              variant="outline"
              className={cn(
                "w-full flex items-center justify-start gap-3",
                "min-h-[44px] px-3",
                "text-sm font-medium"
              )}
              onClick={() => {
                trackClick("mobile_menu_feedback", { action: "open" });
                openFeedback();
                onClose();
              }}
            >
              <MessageSquarePlus className="h-5 w-5 shrink-0" />
              <span>Send Feedback</span>
            </Button>
          </div>
        </nav>
      </div>
    </>
  );
}
