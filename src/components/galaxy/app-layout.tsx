"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { Header, HeaderProps } from "./header";
import { FloatingAIAssistant } from "../shared/FloatingAIAssistant";
import { Toaster } from "@/components/ui/sonner";
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
    <div className={cn("flex h-screen overflow-hidden relative", className)} {...props}>
      {/* Sidebar */}
      {showSidebar && <Sidebar user={user} />}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        {headerProps && <Header {...headerProps} user={user} />}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>

      {/* Floating Assistant Overlay */}
      <FloatingAIAssistant />
      
      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}

