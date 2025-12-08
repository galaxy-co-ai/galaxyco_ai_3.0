"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Search, Command, Rocket } from "lucide-react";
import { OrganizationSwitcher } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAnalytics } from "@/hooks/useAnalytics";

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  description?: string;
  showSearch?: boolean;
  showNotifications?: boolean;
  notificationCount?: number;
  user?: {
    name: string;
    email: string;
    avatar?: string;
    initials?: string;
  };
  actions?: React.ReactNode;
}

export function Header({
  title,
  description,
  showSearch = false,
  showNotifications = true,
  notificationCount = 0,
  user,
  actions,
  className,
  ...props
}: HeaderProps) {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const { trackEvent } = useAnalytics({ trackPageViews: false });
  const searchSubmittedRef = React.useRef(false); // Prevent duplicate tracking

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
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
      {...props}
    >
      <div className="flex h-16 items-center gap-4 px-4 w-full">
        {/* Logo and Branding (Left) */}
        <Link 
          href="/" 
          className="flex items-center gap-2 rounded-lg transition-colors hover:opacity-80 flex-shrink-0"
          aria-label="Go to landing page"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/25">
            <Rocket className="h-4.5 w-4.5 text-white" />
          </div>
          <h2 className="text-sm font-bold tracking-[0.25em] text-foreground uppercase">Galaxy</h2>
        </Link>

        {/* Title Section (if provided) */}
        {(title || description) && (
          <div className="flex-1 min-w-0">
            {title && (
              <h1 className="text-lg font-semibold text-foreground truncate">{title}</h1>
            )}
            {description && (
              <p className="text-sm text-muted-foreground truncate">{description}</p>
            )}
          </div>
        )}

        {/* Search (Center) */}
        {showSearch && (
          <div className="flex-1 max-w-md mx-auto">
            {searchOpen ? (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="pl-9 pr-9"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      searchSubmittedRef.current = true; // Mark as submitted to prevent duplicate onBlur tracking
                      trackEvent({
                        eventType: 'search',
                        eventName: 'global_search',
                        metadata: {
                          searchQuery: searchQuery.trim(),
                          source: 'header',
                          method: 'enter'
                        }
                      });
                      // TODO: Navigate to search results or perform search
                      setSearchOpen(false);
                      setSearchQuery("");
                    }
                  }}
                  onBlur={() => {
                    // Only track on blur if not already tracked via Enter key
                    if (searchQuery.trim() && !searchSubmittedRef.current) {
                      trackEvent({
                        eventType: 'search',
                        eventName: 'global_search',
                        metadata: {
                          searchQuery: searchQuery.trim(),
                          source: 'header',
                          method: 'blur'
                        }
                      });
                    }
                    searchSubmittedRef.current = false; // Reset for next search
                    setSearchOpen(false);
                    setSearchQuery("");
                  }}
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                  <Command className="h-3 w-3" />K
                </kbd>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start text-muted-foreground"
                onClick={() => setSearchOpen(true)}
                aria-label="Open search"
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline-flex">Search...</span>
                <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:ml-auto sm:flex">
                  <Command className="h-3 w-3" />K
                </kbd>
              </Button>
            )}
          </div>
        )}

        {/* Actions and User Controls (Right) */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {actions}
          
          {/* Organization Switcher */}
          <OrganizationSwitcher
            hidePersonal={false}
            afterCreateOrganizationUrl="/dashboard"
            afterLeaveOrganizationUrl="/dashboard"
            afterSelectOrganizationUrl="/dashboard"
            afterSelectPersonalUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: "w-auto",
                organizationSwitcherTrigger: "rounded-lg border border-border bg-background hover:bg-accent transition-colors px-3 py-1.5",
                organizationPreviewMainIdentifier: "text-sm font-medium text-foreground",
                organizationPreviewSecondaryIdentifier: "text-xs text-muted-foreground",
                organizationSwitcherTriggerIcon: "text-muted-foreground",
              },
            }}
          />

          {/* User Avatar */}
          {user && (
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </header>
  );
}

