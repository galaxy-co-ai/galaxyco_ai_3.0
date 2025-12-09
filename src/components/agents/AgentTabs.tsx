"use client";

import { Badge } from "@/components/ui/badge";
import { Activity, MessageSquare, FlaskConical, Users } from "lucide-react";

export type AgentTabType = "activity" | "messages" | "teams" | "laboratory";

interface AgentTabsProps {
  activeTab: AgentTabType;
  onTabChange: (tab: AgentTabType) => void;
  counts?: {
    activity?: number;
    messages?: number;
    teams?: number;
  };
}

const tabs: Array<{
  value: AgentTabType;
  label: string;
  icon: typeof Activity;
  activeColor: string;
  badgeColor: string;
}> = [
  {
    value: "activity",
    label: "Activity",
    icon: Activity,
    activeColor: "bg-emerald-100 text-emerald-700",
    badgeColor: "bg-emerald-500",
  },
  {
    value: "messages",
    label: "Messages",
    icon: MessageSquare,
    activeColor: "bg-blue-100 text-blue-700",
    badgeColor: "bg-blue-500",
  },
  {
    value: "teams",
    label: "Teams",
    icon: Users,
    activeColor: "bg-amber-100 text-amber-700",
    badgeColor: "bg-amber-500",
  },
  {
    value: "laboratory",
    label: "Laboratory",
    icon: FlaskConical,
    activeColor: "bg-purple-100 text-purple-700",
    badgeColor: "bg-purple-500",
  },
];

export default function AgentTabs({
  activeTab,
  onTabChange,
  counts = {},
}: AgentTabsProps) {
  return (
    <div className="flex justify-center">
      <div className="bg-background/80 backdrop-blur-lg rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-1 inline-flex gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.value;
          const count = counts[tab.value as keyof typeof counts];

          return (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={`relative h-8 px-3.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                isActive
                  ? `${tab.activeColor} shadow-sm`
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              aria-label={`Switch to ${tab.label} tab`}
              aria-selected={isActive}
              role="tab"
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {count !== undefined && count > 0 && (
                <Badge
                  className={`${
                    isActive
                      ? "bg-white/90 text-gray-700"
                      : tab.badgeColor + " text-white"
                  } text-xs px-1.5 py-0.5 h-4 min-w-[16px] flex items-center justify-center`}
                >
                  {count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
