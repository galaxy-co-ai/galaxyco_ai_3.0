"use client";

import * as React from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header, HeaderProps } from "./header";
import { Toaster } from "@/components/ui/sonner";
import { FeedbackPanel } from "@/components/shared/FeedbackButton";
import CommandPalette from "@/components/shared/CommandPalette";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { MobileMenu } from "@/components/mobile/MobileMenu";
import { NeptuneProvider, useNeptune } from "@/contexts/neptune-context";
import { FeedbackProvider } from "@/contexts/feedback-context";
import { AnalyticsProvider } from "@/providers/AnalyticsProvider";
import { cn } from "@/lib/utils";
import {
  createPageContextFromPath,
} from "@/lib/neptune/page-context";

// Component to sync current page with Neptune context
// This enhanced version extracts rich context for Neptune's awareness
function PageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setCurrentPage, setPageContext } = useNeptune();
  const previousPathRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    // Skip if pathname hasn't changed
    if (previousPathRef.current === pathname) return;
    previousPathRef.current = pathname;

    // Extract basic page name for backward compatibility
    const pageName = pathname === '/' ? 'home' : pathname.split('/')[1] || 'dashboard';
    setCurrentPage(pageName);

    // Create rich page context
    const pageContext = createPageContextFromPath(pathname);

    // Extract additional context from URL search params
    const activeTab = searchParams?.get('tab') || searchParams?.get('view') || undefined;
    if (activeTab) {
      pageContext.activeTab = activeTab;
    }

    // Extract entity IDs from pathname (e.g., /crm/contacts/123)
    const pathParts = pathname.split('/').filter(Boolean);
    if (pathParts.length >= 3) {
      const potentialId = pathParts[2];
      // Check if it looks like an ID (UUID or numeric)
      if (/^[a-f0-9-]{36}$/i.test(potentialId) || /^\d+$/.test(potentialId)) {
        // Map path segment to valid SelectedItem type
        const typeMap: Record<string, 'lead' | 'contact' | 'campaign' | 'template' | 'document' | 'agent' | 'invoice' | 'task' | 'event' | 'content' | 'collection'> = {
          contacts: 'contact',
          leads: 'lead',
          campaigns: 'campaign',
          templates: 'template',
          documents: 'document',
          agents: 'agent',
          invoices: 'invoice',
          tasks: 'task',
          events: 'event',
          content: 'content',
          collections: 'collection',
        };
        const itemType = typeMap[pathParts[1]] || 'document';
        pageContext.focusedItem = {
          id: potentialId,
          type: itemType,
          name: `${pathParts[1].slice(0, -1)} ${potentialId.slice(0, 8)}`,
        };
        pageContext.pageType = 'view';
      }
    }

    // Set the enriched context
    setPageContext(pageContext);
  }, [pathname, searchParams, setCurrentPage, setPageContext]);

  return null;
}

// Component to handle Neptune navigation events
function NavigationHandler() {
  const router = useRouter();

  React.useEffect(() => {
    const handleNavigation = (event: CustomEvent<{ url: string }>) => {
      const url = event.detail.url;
      if (url) {
        // Use Next.js router for client-side navigation (no full page reload)
        router.push(url);
      }
    };

    window.addEventListener('neptune-navigate', handleNavigation as EventListener);
    return () => window.removeEventListener('neptune-navigate', handleNavigation as EventListener);
  }, [router]);

  return null;
}

export interface AppLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  headerProps?: HeaderProps;
  user?: {
    name: string;
    email: string;
    avatar?: string;
    initials?: string;
  };
  workspaceId?: string | null;
  showSidebar?: boolean;
  sidebarCollapsed?: boolean;
}

export function AppLayout({
  children,
  headerProps,
  user,
  workspaceId,
  showSidebar = true,
  sidebarCollapsed: initialCollapsed = false,
  className,
  ...props
}: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <NeptuneProvider>
      <FeedbackProvider>
        <AnalyticsProvider>
          {/* Track current page for Neptune context awareness */}
          <PageTracker />
          {/* Handle Neptune navigation requests */}
          <NavigationHandler />
          <div className={cn("flex flex-col h-screen overflow-hidden relative", className)} {...props}>
            {/* Full-width Header */}
            {headerProps && <Header {...headerProps} user={user} />}

            {/* Content Area with Floating Sidebar */}
            <div className="flex flex-1 overflow-hidden">
              {/* Floating Sidebar (hidden on mobile) */}
              {showSidebar && <Sidebar />}

              {/* Main Content */}
              <main className={cn(
                "flex-1 overflow-y-auto bg-background",
                "pb-16 lg:pb-0" // Bottom padding on mobile for bottom nav
              )}>
                {children}
              </main>
            </div>

            {/* Mobile Navigation */}
            <MobileBottomNav onMenuClick={() => setIsMobileMenuOpen(true)} />
            <MobileMenu 
              isOpen={isMobileMenuOpen} 
              onClose={() => setIsMobileMenuOpen(false)} 
            />

            {/* Toast Notifications */}
            <Toaster />
            
            {/* Feedback Panel (triggered from sidebar) */}
            <FeedbackPanel />
            
            {/* Command Palette (Cmd/Ctrl+K) */}
            {workspaceId && <CommandPalette workspaceId={workspaceId} />}
          </div>
        </AnalyticsProvider>
      </FeedbackProvider>
    </NeptuneProvider>
  );
}

