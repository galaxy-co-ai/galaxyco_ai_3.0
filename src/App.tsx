"use client";

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import { TooltipProvider } from "./components/ui/tooltip";
import { AppSidebar } from "./components/shared/AppSidebar";
import { Dashboard } from "./pages/Dashboard";
import { Studio } from "./pages/Studio";
import CRM from "./pages/CRM";
import { KnowledgeBase } from "./pages/KnowledgeBase";
import { Marketing } from "./pages/Marketing";
import { Integrations } from "./pages/Integrations";
import { Landing } from "./pages/Landing";
import LunarLabs from "./pages/LunarLabs";

import { FloatingAIAssistant } from "./components/shared/FloatingAIAssistant";
import { OnboardingFlow } from "./components/shared/OnboardingFlow";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  const [activePage, setActivePage] = useState("landing");
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if user has completed onboarding
  // To reset onboarding for testing: localStorage.removeItem("galaxyco_onboarding_completed") or use "Guided Setup" button in Integrations
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem("galaxyco_onboarding_completed");
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem("galaxyco_onboarding_completed", "true");
    setShowOnboarding(false);
    setActivePage("dashboard");
  };

  const restartOnboarding = () => {
    setShowOnboarding(true);
  };

  const renderPage = () => {
    switch (activePage) {
      case "landing":
        return <Landing />;
      case "dashboard":
        return <Dashboard />;
      case "studio":
        return <Studio />;
      case "knowledge":
        return <KnowledgeBase />;
      case "crm":
        return <CRM />;
      case "marketing":
        return <Marketing />;
      case "assistant":
        return (
          <div>
            <h1>AI Assistant</h1>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        );
      case "integrations":
        return <Integrations onStartOnboarding={restartOnboarding} />;
      case "lunar-labs":
        return <LunarLabs />;
      case "settings":
        return (
          <div>
            <h1>Settings</h1>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        );
      default:
        return <Landing />;
    }
  };

  return (
    <TooltipProvider>
      {showOnboarding ? (
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      ) : activePage === "landing" ? (
        // Landing page without sidebar
        <div className="min-h-screen">
          <Landing onEnterApp={() => setActivePage("dashboard")} />
          <Toaster />
        </div>
      ) : (
      <SidebarProvider defaultOpen={false}>
        <div className="flex h-screen w-full">
        <AppSidebar activePage={activePage} onNavigate={setActivePage} />
        <main className="flex-1 overflow-auto bg-gray-50/50">
          {activePage !== "lunar-labs" && (
            <div className="border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 sticky top-0 z-10">

            </div>
          )}

          <div className={activePage === "lunar-labs" ? "" : "p-6"}>
            {renderPage()}
          </div>
        </main>
        
        {/* Floating AI Assistant */}
        <FloatingAIAssistant />
        </div>
        <Toaster />
      </SidebarProvider>
      )}
    </TooltipProvider>
  );
}
