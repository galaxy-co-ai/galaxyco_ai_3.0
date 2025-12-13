"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  Users,
  MessageSquare,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trackClick } from "@/lib/analytics";

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  id: string;
}

// Primary mobile navigation items (max 5 for good UX)
const mobileNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", id: "dashboard" },
  { icon: Bot, label: "Agents", href: "/activity", id: "activity" },
  { icon: Users, label: "CRM", href: "/crm", id: "crm" },
  { icon: MessageSquare, label: "Chat", href: "/conversations", id: "conversations" },
];

interface MobileBottomNavProps {
  onMenuClick: () => void;
}

export function MobileBottomNav({ onMenuClick }: MobileBottomNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={cn(
        "lg:hidden", // Hide on desktop
        "fixed bottom-0 left-0 right-0 z-50",
        "h-16 bg-card/95 backdrop-blur-lg border-t border-border",
        "safe-area-inset-bottom" // Safe area for notched devices
      )}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-full px-2">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => trackClick(`mobile_nav_${item.id}`, { label: item.label })}
              className={cn(
                "flex flex-col items-center justify-center",
                "min-w-[44px] min-h-[44px]", // Touch target minimum
                "gap-1 px-3 py-2 rounded-lg",
                "transition-colors duration-200",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-[10px] font-medium leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Menu button for additional navigation */}
        <button
          onClick={() => {
            trackClick("mobile_nav_menu", { action: "open" });
            onMenuClick();
          }}
          className={cn(
            "flex flex-col items-center justify-center",
            "min-w-[44px] min-h-[44px]", // Touch target minimum
            "gap-1 px-3 py-2 rounded-lg",
            "text-muted-foreground hover:text-foreground",
            "transition-colors duration-200"
          )}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 shrink-0" />
          <span className="text-[10px] font-medium leading-none">Menu</span>
        </button>
      </div>
    </nav>
  );
}
