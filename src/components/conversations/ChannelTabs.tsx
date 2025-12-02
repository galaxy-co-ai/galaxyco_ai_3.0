"use client";

import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, Phone, MessageCircle, Globe, Inbox, Users } from "lucide-react";

export type ChannelType = 'all' | 'email' | 'sms' | 'call' | 'whatsapp' | 'social' | 'live_chat' | 'team';

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
  { value: 'all', label: 'All', icon: Inbox, activeColor: 'bg-gray-100 text-gray-700', badgeColor: 'bg-gray-500' },
  { value: 'team', label: 'Team', icon: Users, activeColor: 'bg-indigo-100 text-indigo-700', badgeColor: 'bg-indigo-500' },
  { value: 'email', label: 'Email', icon: Mail, activeColor: 'bg-blue-100 text-blue-700', badgeColor: 'bg-blue-500' },
  { value: 'sms', label: 'SMS', icon: MessageSquare, activeColor: 'bg-green-100 text-green-700', badgeColor: 'bg-green-500' },
  { value: 'call', label: 'Calls', icon: Phone, activeColor: 'bg-purple-100 text-purple-700', badgeColor: 'bg-purple-500' },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, activeColor: 'bg-emerald-100 text-emerald-700', badgeColor: 'bg-emerald-500' },
  { value: 'social', label: 'Social', icon: Globe, activeColor: 'bg-pink-100 text-pink-700', badgeColor: 'bg-pink-500' },
  { value: 'live_chat', label: 'Live Chat', icon: MessageCircle, activeColor: 'bg-orange-100 text-orange-700', badgeColor: 'bg-orange-500' },
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
              className={`relative px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                isActive
                  ? `${channel.activeColor} shadow-sm`
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-label={`Switch to ${channel.label} channel`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{channel.label}</span>
              {count !== undefined && count > 0 && (
                <Badge 
                  className={`${isActive ? 'bg-white/90 text-gray-700' : channel.badgeColor + ' text-white'} text-xs px-1.5 py-0 h-4 min-w-[18px]`}
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
