"use client";

import * as React from "react";
import { Bell, Search, Command } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
      <div className="container flex h-16 items-center gap-4 px-4">
        {/* Title Section */}
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

        {/* Search */}
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
                  onBlur={() => setSearchOpen(false)}
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

        {/* Actions */}
        <div className="flex items-center gap-2">
          {actions}
        </div>
      </div>
    </header>
  );
}

