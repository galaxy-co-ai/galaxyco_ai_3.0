"use client";

import { useState } from "react";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
const tabs = [
  {
    id: "create" as CreatorTabType,
    label: "Create",
    icon: PenTool,
    activeColor: "bg-violet-100 text-violet-700",
  },
  {
    id: "collections" as CreatorTabType,
    label: "Collections",
    icon: FolderOpen,
    activeColor: "bg-emerald-100 text-emerald-700",
  },
  {
    id: "templates" as CreatorTabType,
    label: "Templates",
    icon: LayoutTemplate,
    activeColor: "bg-blue-100 text-blue-700",
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

export default function CreatorDashboard() {
  const [activeTab, setActiveTab] = useState<CreatorTabType>("create");
  const [showNeptune, setShowNeptune] = useState(false);

  // Fetch stats from API
  const { data: statsData, isLoading: statsLoading } = useSWR<StatsResponse>(
    '/api/creator/stats',
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
          <div className="flex items-center gap-3">
            <Palette 
              className="w-7 h-7"
              style={{
                stroke: 'url(#icon-gradient-creator)',
                strokeWidth: 2,
                filter: 'drop-shadow(0 2px 4px rgba(139, 92, 246, 0.15))'
              }}
            />
            <svg width="0" height="0" className="absolute">
              <defs>
                <linearGradient id="icon-gradient-creator" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <h1 
              className="text-2xl uppercase"
              style={{ 
                fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif',
                fontWeight: 700,
                letterSpacing: '0.25em',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.04)' 
              }}
            >
              Creator
            </h1>
          </div>

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
                <Badge className="px-3 py-1.5 bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition-colors">
                  <FileText className="h-3.5 w-3.5 mr-1.5 text-violet-600" />
                  <span className="font-semibold">{stats.totalCreations}</span>
                  <span className="ml-1 text-violet-600/70 font-normal">
                    Creations
                  </span>
                </Badge>
                <Badge className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
                  <FolderOpen className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                  <span className="font-semibold">{stats.collections}</span>
                  <span className="ml-1 text-emerald-600/70 font-normal">
                    Collections
                  </span>
                </Badge>
                <Badge className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors">
                  <LayoutTemplate className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                  <span className="font-semibold">{stats.templates}</span>
                  <span className="ml-1 text-blue-600/70 font-normal">
                    Templates
                  </span>
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* Tab Bar with Ask Neptune Button */}
        <div className="mt-14 relative flex items-center justify-center">
          <div className="bg-background/80 backdrop-blur-lg rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-1 inline-flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative h-8 px-3.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2",
                  activeTab === tab.id
                    ? `${tab.activeColor} shadow-sm`
                    : "text-gray-600 hover:bg-gray-100"
                )}
                aria-label={`Switch to ${tab.label} tab`}
                aria-current={activeTab === tab.id ? "page" : undefined}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          <div className="absolute right-0">
            <Button
              size="sm"
              onClick={() => setShowNeptune(!showNeptune)}
              className="bg-white hover:bg-white text-gray-700 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:-translate-y-px hover:shadow-lg active:scale-[0.98] active:shadow-sm border border-gray-200 transition-all duration-150 gap-2"
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
