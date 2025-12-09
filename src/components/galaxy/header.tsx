"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Command, Rocket, Settings, Plug, Gauge, LogOut } from "lucide-react";
import { OrganizationSwitcher, useUser, useClerk } from "@clerk/nextjs";
import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAnalytics } from "@/hooks/useAnalytics";
import { SearchResults, type SearchResult } from "@/components/shared/SearchResults";
import { useDebounce } from "@/hooks/useDebounce";

/**
 * System admin email whitelist (client-side mirror of server-side list)
 * Keep in sync with src/lib/auth.ts SYSTEM_ADMIN_EMAILS
 */
const SYSTEM_ADMIN_EMAILS: string[] = [
  'dev@galaxyco.ai',
];

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

// Search response type
interface SearchResponse {
  query: string;
  results: SearchResult[];
  categories: {
    contacts: SearchResult[];
    campaigns: SearchResult[];
    knowledge: SearchResult[];
    creator: SearchResult[];
    agents: SearchResult[];
    blog: SearchResult[];
  };
  totalCount: number;
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
  const router = useRouter();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<SearchResponse | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);
  const debouncedQuery = useDebounce(searchQuery, 300);
  const { trackEvent } = useAnalytics({ trackPageViews: false });
  const searchSubmittedRef = React.useRef(false); // Prevent duplicate tracking
  const searchContainerRef = React.useRef<HTMLDivElement>(null);
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();

  // Fetch search results when debounced query changes
  React.useEffect(() => {
    const fetchResults = async () => {
      if (debouncedQuery.length < 2) {
        setSearchResults(null);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=5`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data);
        }
      } catch {
        // Silently handle search errors
        setSearchResults(null);
      } finally {
        setIsSearching(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  // Close search on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
        setSearchQuery("");
        setSearchResults(null);
      }
    };

    if (searchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchOpen]);

  // Handle keyboard shortcut to open search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchClose = () => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults(null);
  };

  const handleSearchSelect = (result: SearchResult) => {
    trackEvent({
      eventType: 'click',
      eventName: 'search_result_click',
      metadata: {
        query: searchQuery,
        resultType: result.type,
        resultId: result.id,
        resultTitle: result.title,
      }
    });
    handleSearchClose();
  };

  // Check if user is system admin (by metadata OR email whitelist)
  const isSystemAdmin = React.useMemo(() => {
    if (!clerkUser) return false;
    
    // Check Clerk metadata first (most secure)
    const metadata = clerkUser.publicMetadata as { isSystemAdmin?: boolean } | undefined;
    if (metadata?.isSystemAdmin === true) {
      return true;
    }
    
    // Check email whitelist (case-insensitive)
    const primaryEmail = clerkUser.primaryEmailAddress?.emailAddress?.toLowerCase();
    if (primaryEmail && SYSTEM_ADMIN_EMAILS.some(email => email.toLowerCase() === primaryEmail)) {
      return true;
    }
    
    return false;
  }, [clerkUser]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const userInitials = user?.initials || (user?.name ? getInitials(user.name) : "JD");

  const handleSignOut = async () => {
    trackEvent({
      eventType: 'click',
      eventName: 'sign_out',
      metadata: { source: 'avatar_dropdown' }
    });
    await signOut(() => router.push('/'));
  };

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
          <div className="flex-1 max-w-md mx-auto" ref={searchContainerRef}>
            {searchOpen ? (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search contacts, campaigns, documents..."
                  className="pl-9 pr-9"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      handleSearchClose();
                    } else if (e.key === 'Enter' && searchQuery.trim() && !searchResults?.results.length) {
                      // Only track if no results (results have their own tracking)
                      searchSubmittedRef.current = true;
                      trackEvent({
                        eventType: 'search',
                        eventName: 'global_search',
                        metadata: {
                          searchQuery: searchQuery.trim(),
                          source: 'header',
                          method: 'enter',
                          hasResults: false
                        }
                      });
                    }
                  }}
                  aria-label="Search"
                  aria-expanded={searchOpen && (isSearching || (searchResults?.results.length ?? 0) > 0)}
                  aria-controls="search-results"
                  aria-autocomplete="list"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                  esc
                </kbd>

                {/* Search Results Dropdown */}
                <AnimatePresence>
                  {(isSearching || searchQuery.length >= 2) && (
                    <SearchResults
                      results={searchResults?.results || []}
                      categories={searchResults?.categories}
                      isLoading={isSearching}
                      query={searchQuery}
                      onSelect={handleSearchSelect}
                      onClose={handleSearchClose}
                    />
                  )}
                </AnimatePresence>
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

          {/* User Avatar with Dropdown */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-8 w-8 rounded-full p-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Open user menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/settings" 
                      className="flex items-center cursor-pointer"
                      onClick={() => trackEvent({
                        eventType: 'click',
                        eventName: 'avatar_dropdown_settings',
                        metadata: { destination: '/settings' }
                      })}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/connected-apps" 
                      className="flex items-center cursor-pointer"
                      onClick={() => trackEvent({
                        eventType: 'click',
                        eventName: 'avatar_dropdown_connectors',
                        metadata: { destination: '/connected-apps' }
                      })}
                    >
                      <Plug className="mr-2 h-4 w-4" />
                      <span>Connectors</span>
                    </Link>
                  </DropdownMenuItem>
                  {isSystemAdmin && (
                    <DropdownMenuItem asChild>
                      <Link 
                        href="/admin" 
                        className="flex items-center cursor-pointer"
                        onClick={() => trackEvent({
                          eventType: 'click',
                          eventName: 'avatar_dropdown_mission_control',
                          metadata: { destination: '/admin' }
                        })}
                      >
                        <Gauge className="mr-2 h-4 w-4" />
                        <span>Mission Control</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}

