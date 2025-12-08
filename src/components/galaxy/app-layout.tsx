"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { Header, HeaderProps } from "./header";
import { Toaster } from "@/components/ui/sonner";
import { FeedbackPanel } from "@/components/shared/FeedbackButton";
import { NeptuneProvider } from "@/contexts/neptune-context";
import { FeedbackProvider } from "@/contexts/feedback-context";
import { AnalyticsProvider } from "@/providers/AnalyticsProvider";
import { cn } from "@/lib/utils";

export interface AppLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  headerProps?: HeaderProps;
  user?: {
    name: string;
    email: string;
    avatar?: string;
    initials?: string;
  };
  showSidebar?: boolean;
  sidebarCollapsed?: boolean;
}

export function AppLayout({
  children,
  headerProps,
  user,
  showSidebar = true,
  sidebarCollapsed: initialCollapsed = false,
  className,
  ...props
}: AppLayoutProps) {
  return (
    <NeptuneProvider>
      <FeedbackProvider>
        <AnalyticsProvider>
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
          </div>
        </AnalyticsProvider>
      </FeedbackProvider>
    </NeptuneProvider>
  );
}

