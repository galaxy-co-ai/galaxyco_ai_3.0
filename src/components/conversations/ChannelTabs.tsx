"use client";

import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, Phone, MessageCircle, Globe, Users } from "lucide-react";

export type ChannelType = 'email' | 'text' | 'call' | 'social' | 'support' | 'team';

interface ChannelTabsProps {
  activeChannel: ChannelType;
  onChannelChange: (channel: ChannelType) => void;
  counts?: Partial<Record<ChannelType, number>>;
}

const channels: Array<{
  value: ChannelType;
  label: string;
  icon: typeof Mail;
  activeColor: string;
  badgeColor: string;
}> = [
  { value: 'team', label: 'Team', icon: Users, activeColor: 'bg-indigo-100 text-indigo-700', badgeColor: 'bg-indigo-500' },
  { value: 'email', label: 'Email', icon: Mail, activeColor: 'bg-blue-100 text-blue-700', badgeColor: 'bg-blue-500' },
  { value: 'text', label: 'Text', icon: MessageSquare, activeColor: 'bg-green-100 text-green-700', badgeColor: 'bg-green-500' },
  { value: 'call', label: 'Calls', icon: Phone, activeColor: 'bg-purple-100 text-purple-700', badgeColor: 'bg-purple-500' },
  { value: 'social', label: 'Social', icon: Globe, activeColor: 'bg-pink-100 text-pink-700', badgeColor: 'bg-pink-500' },
  { value: 'support', label: 'Support', icon: MessageCircle, activeColor: 'bg-orange-100 text-orange-700', badgeColor: 'bg-orange-500' },
];

export default function ChannelTabs({ activeChannel, onChannelChange, counts = {} }: ChannelTabsProps) {
  return (
    <div className="flex justify-center">
      <div className="bg-background/80 backdrop-blur-lg rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-1 inline-flex gap-1">
        {channels.map((channel) => {
          const Icon = channel.icon;
          const isActive = activeChannel === channel.value;
          const count = counts[channel.value];
          
          return (
            <button
              key={channel.value}
              onClick={() => onChannelChange(channel.value)}
              className={`relative h-8 px-3.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                isActive
                  ? `${channel.activeColor} shadow-sm`
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-label={`Switch to ${channel.label} channel`}
            >
              <Icon className="h-4 w-4" />
              <span>{channel.label}</span>
              {count !== undefined && count > 0 && (
                <Badge 
                  className={`${isActive ? 'bg-white/90 text-gray-700' : channel.badgeColor + ' text-white'} text-xs px-1.5 py-0.5 h-4 min-w-[16px] flex items-center justify-center`}
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
