"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Palette,
  Sparkles,
  FolderOpen,
  LayoutTemplate,
  FileText,
  Image as ImageIcon,
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

// Mock stats - these would come from API in production
const stats = {
  totalCreations: 24,
  collections: 6,
  templates: 0, // Coming soon
};

export default function CreatorDashboard() {
  const [activeTab, setActiveTab] = useState<CreatorTabType>("create");
  const [showNeptune, setShowNeptune] = useState(false);

  return (
    <div className="h-full bg-gray-50/50 overflow-hidden flex flex-col">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto w-full px-6 py-4 space-y-4">
        {/* Header with title and Neptune button */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Creator</h1>
              <p className="text-muted-foreground text-base mt-1">
                AI-powered content and asset creation studio
              </p>
            </div>

            {/* Ask Neptune Button */}
            <Button
              variant={showNeptune ? "default" : "outline"}
              size="sm"
              onClick={() => setShowNeptune(!showNeptune)}
              className={cn(
                "gap-2 transition-all shrink-0",
                showNeptune && "bg-purple-600 hover:bg-purple-700"
              )}
              aria-label={showNeptune ? "Hide Neptune assistant" : "Show Neptune assistant"}
            >
              <Sparkles className="h-4 w-4" />
              {showNeptune ? "Hide" : "Ask"} Neptune
            </Button>
          </div>

          {/* Stats Bar - Centered */}
          <div className="flex flex-wrap items-center justify-center gap-3">
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
          </div>
        </div>

        {/* Floating Tab Bar */}
        <div className="flex justify-center">
          <div className="bg-background/80 backdrop-blur-lg rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-1 inline-flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2",
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
              <Card className="flex flex-col h-full rounded-2xl shadow-sm border bg-card overflow-hidden">
                <CreatorNeptunePanel activeTab={activeTab} />
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
