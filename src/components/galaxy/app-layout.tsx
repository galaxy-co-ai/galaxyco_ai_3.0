"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header, HeaderProps } from "./header";
import { Toaster } from "@/components/ui/sonner";
import { FeedbackPanel } from "@/components/shared/FeedbackButton";
import CommandPalette from "@/components/shared/CommandPalette";
import { NeptuneProvider, useNeptune } from "@/contexts/neptune-context";
import { FeedbackProvider } from "@/contexts/feedback-context";
import { AnalyticsProvider } from "@/providers/AnalyticsProvider";
import { cn } from "@/lib/utils";

// Component to sync current page with Neptune context
function PageTracker() {
  const pathname = usePathname();
  const { setCurrentPage } = useNeptune();

  React.useEffect(() => {
    // Extract page name from pathname
    const pageName = pathname === '/' ? 'home' : pathname.split('/')[1] || 'dashboard';
    setCurrentPage(pageName);
  }, [pathname, setCurrentPage]);

  return null;
}

// Component to handle Neptune navigation events
function NavigationHandler() {
  React.useEffect(() => {
    const handleNavigation = (event: CustomEvent<{ url: string }>) => {
      const url = event.detail.url;
      if (url && typeof window !== 'undefined') {
        // Use Next.js router for client-side navigation
        window.location.href = url;
      }
    };

    window.addEventListener('neptune-navigate', handleNavigation as EventListener);
    return () => window.removeEventListener('neptune-navigate', handleNavigation as EventListener);
  }, []);

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
              {/* Floating Sidebar */}
              {showSidebar && <Sidebar />}

              {/* Main Content */}
              <main className="flex-1 overflow-y-auto bg-background">
                {children}
              </main>
            </div>

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

