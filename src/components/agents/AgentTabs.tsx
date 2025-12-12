"use client";

import { PillTabs, type PillTab } from "@/components/ui/pill-tabs";
import { Activity, MessageSquare, FlaskConical, Users, Workflow } from "lucide-react";

export type AgentTabType = "activity" | "messages" | "teams" | "workflows" | "laboratory";

interface AgentTabsProps {
  activeTab: AgentTabType;
  onTabChange: (tab: AgentTabType) => void;
  counts?: {
    activity?: number;
    messages?: number;
    teams?: number;
    workflows?: number;
    laboratory?: number;
  };
}

const tabs: Array<Omit<PillTab<AgentTabType>, "badge">> = [
  {
    value: "activity",
    label: "Activity",
    Icon: Activity,
    activeClassName: "bg-emerald-100 text-emerald-700",
    badgeClassName: "bg-emerald-500",
    ariaLabel: "Switch to Activity tab",
  },
  {
    value: "messages",
    label: "Messages",
    Icon: MessageSquare,
    activeClassName: "bg-blue-100 text-blue-700",
    badgeClassName: "bg-blue-500",
    ariaLabel: "Switch to Messages tab",
  },
  {
    value: "teams",
    label: "Teams",
    Icon: Users,
    activeClassName: "bg-amber-100 text-amber-700",
    badgeClassName: "bg-amber-500",
    ariaLabel: "Switch to Teams tab",
  },
  {
    value: "workflows",
    label: "Workflows",
    Icon: Workflow,
    activeClassName: "bg-violet-100 text-violet-700",
    badgeClassName: "bg-violet-500",
    ariaLabel: "Switch to Workflows tab",
  },
  {
    value: "laboratory",
    label: "Laboratory",
    Icon: FlaskConical,
    activeClassName: "bg-purple-100 text-purple-700",
    badgeClassName: "bg-purple-500",
    ariaLabel: "Switch to Laboratory tab",
  },
];

export default function AgentTabs({
  activeTab,
  onTabChange,
  counts = {},
}: AgentTabsProps) {
  const tabItems: Array<PillTab<AgentTabType>> = tabs.map((tab) => ({
    ...tab,
    badge: counts[tab.value],
  }));

  return <PillTabs value={activeTab} onValueChange={onTabChange} tabs={tabItems} />;
}
