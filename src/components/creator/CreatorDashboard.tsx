"use client";

import { useState } from "react";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PillTabs, type PillTab } from "@/components/ui/pill-tabs";
import { PageTitle } from "@/components/ui/page-title";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Palette,
  Sparkles,
  FolderOpen,
  LayoutTemplate,
  FileText,
  PenTool,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

import CreateTab from "./CreateTab";
import CollectionsTab from "./CollectionsTab";
import TemplatesTab from "./TemplatesTab";
import CreatorNeptunePanel from "./CreatorNeptunePanel";

export type CreatorTabType = "create" | "collections" | "templates";

// Tab configuration
const tabs: Array<PillTab<CreatorTabType>> = [
  {
    value: "create",
    label: "Create",
    Icon: PenTool,
    activeClassName: "bg-violet-100 text-violet-700",
    ariaLabel: "Switch to Create tab",
  },
  {
    value: "collections",
    label: "Collections",
    Icon: FolderOpen,
    activeClassName: "bg-emerald-100 text-emerald-700",
    ariaLabel: "Switch to Collections tab",
  },
  {
    value: "templates",
    label: "Templates",
    Icon: LayoutTemplate,
    activeClassName: "bg-blue-100 text-blue-700",
    ariaLabel: "Switch to Templates tab",
  },
];

// SWR fetcher with error handling
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    // Return null on error - the component will use default values
    return null;
  }
  return res.json();
};

// Stats response type
interface StatsResponse {
  stats: {
    totalCreations: number;
    collections: number;
    templates: number;
    starred: number;
    byType: Record<string, number>;
  };
}

interface CreatorDashboardProps {
  /**
   * When true, do not call live APIs (used on marketing/feature pages).
   */
  disableLiveData?: boolean;
}

export default function CreatorDashboard({ disableLiveData = false }: CreatorDashboardProps) {
  const [activeTab, setActiveTab] = useState<CreatorTabType>("create");
  const [showNeptune, setShowNeptune] = useState(false);

  // Fetch stats from API (disabled in demo mode)
  const statsKey = disableLiveData ? null : '/api/creator/stats';
  const { data: statsData, isLoading: statsLoading } = useSWR<StatsResponse>(
    statsKey,
    fetcher,
    { refreshInterval: 30000 } // Refresh every 30 seconds
  );

  const stats = statsData?.stats || { totalCreations: 0, collections: 0, templates: 0 };

  return (
    <div className="h-full bg-gray-50/50 overflow-hidden flex flex-col">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto w-full px-6 py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pt-4">
          <PageTitle title="Creator" icon={Palette} />

          {/* Stats Bar */}
          <div className="hidden lg:flex flex-wrap items-center gap-3">
            {statsLoading ? (
              <>
                <Skeleton className="h-8 w-28 rounded-full" />
                <Skeleton className="h-8 w-28 rounded-full" />
                <Skeleton className="h-8 w-28 rounded-full" />
              </>
            ) : (
              <>
                <Badge variant="soft" tone="violet" size="pill">
                  <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="font-semibold">{stats.totalCreations}</span>
                  <span className="ml-1 font-normal opacity-70">Creations</span>
                </Badge>
                <Badge variant="soft" tone="success" size="pill">
                  <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="font-semibold">{stats.collections}</span>
                  <span className="ml-1 font-normal opacity-70">Collections</span>
                </Badge>
                <Badge variant="soft" tone="info" size="pill">
                  <LayoutTemplate className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="font-semibold">{stats.templates}</span>
                  <span className="ml-1 font-normal opacity-70">Templates</span>
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* Tab Bar with Ask Neptune Button */}
        <div className="mt-14 relative flex items-center justify-center">
          <PillTabs value={activeTab} onValueChange={setActiveTab} tabs={tabs} />
          <div className="absolute right-0">
            <Button
              size="sm"
              variant="surface"
              onClick={() => setShowNeptune(!showNeptune)}
              aria-label="Toggle Neptune AI assistant"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden md:inline">Neptune</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden px-6 pb-6 gap-6">
        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "flex-1 transition-all duration-300",
              showNeptune ? "max-w-[70%]" : "max-w-full"
            )}
          >
            {activeTab === "create" && <CreateTab />}
            {activeTab === "collections" && <CollectionsTab />}
            {activeTab === "templates" && <TemplatesTab />}
          </motion.div>
        </AnimatePresence>

        {/* Neptune Panel (Toggleable) */}
        <AnimatePresence>
          {showNeptune && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "30%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex flex-col min-w-[320px] relative z-40"
            >
              <Card className="flex flex-col h-full rounded-l-2xl shadow-sm border border-r-0 bg-card overflow-hidden">
                <CreatorNeptunePanel activeTab={activeTab} />
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
