"use client";

import { PillTabs, type PillTab } from "@/components/ui/pill-tabs";
import { Mail, MessageSquare, Phone, MessageCircle, Globe, Users } from "lucide-react";

export type ChannelType = "email" | "text" | "call" | "social" | "support" | "team";

interface ChannelTabsProps {
  activeChannel: ChannelType;
  onChannelChange: (channel: ChannelType) => void;
  counts?: Partial<Record<ChannelType, number>>;
}

const channels: Array<Omit<PillTab<ChannelType>, "badge">> = [
  {
    value: "team",
    label: "Team",
    Icon: Users,
    activeClassName: "bg-indigo-100 text-indigo-700",
    badgeClassName: "bg-indigo-500",
    ariaLabel: "Switch to Team channel",
  },
  {
    value: "email",
    label: "Email",
    Icon: Mail,
    activeClassName: "bg-blue-100 text-blue-700",
    badgeClassName: "bg-blue-500",
    ariaLabel: "Switch to Email channel",
  },
  {
    value: "text",
    label: "Text",
    Icon: MessageSquare,
    activeClassName: "bg-green-100 text-green-700",
    badgeClassName: "bg-green-500",
    ariaLabel: "Switch to Text channel",
  },
  {
    value: "call",
    label: "Calls",
    Icon: Phone,
    activeClassName: "bg-purple-100 text-purple-700",
    badgeClassName: "bg-purple-500",
    ariaLabel: "Switch to Calls channel",
  },
  {
    value: "social",
    label: "Social",
    Icon: Globe,
    activeClassName: "bg-pink-100 text-pink-700",
    badgeClassName: "bg-pink-500",
    ariaLabel: "Switch to Social channel",
  },
  {
    value: "support",
    label: "Support",
    Icon: MessageCircle,
    activeClassName: "bg-orange-100 text-orange-700",
    badgeClassName: "bg-orange-500",
    ariaLabel: "Switch to Support channel",
  },
];

export default function ChannelTabs({
  activeChannel,
  onChannelChange,
  counts = {},
}: ChannelTabsProps) {
  const tabItems: Array<PillTab<ChannelType>> = channels.map((tab) => ({
    ...tab,
    badge: counts[tab.value],
  }));

  return (
    <PillTabs value={activeChannel} onValueChange={onChannelChange} tabs={tabItems} />
  );
}
