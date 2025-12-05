"use client";

import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Mail, MessageSquare, Phone, MessageCircle, Globe } from "lucide-react";
import type { Conversation } from "./ConversationsDashboard";
import ChannelEmptyState from "./ChannelEmptyState";
import type { ChannelType } from "./ChannelTabs";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  activeChannel?: ChannelType;
}

const channelIcons = {
  email: Mail,
  sms: MessageSquare,
  text: MessageSquare,
  call: Phone,
  whatsapp: MessageCircle,
  social: Globe,
  live_chat: MessageCircle,
  support: MessageCircle,
};

const channelColors = {
  email: "bg-blue-100 text-blue-700",
  sms: "bg-green-100 text-green-700",
  text: "bg-green-100 text-green-700",
  call: "bg-purple-100 text-purple-700",
  whatsapp: "bg-emerald-100 text-emerald-700",
  social: "bg-pink-100 text-pink-700",
  live_chat: "bg-orange-100 text-orange-700",
  support: "bg-orange-100 text-orange-700",
};

export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
  activeChannel = 'team',
}: ConversationListProps) {
  if (conversations.length === 0) {
    return <ChannelEmptyState channel={activeChannel} />;
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conv) => {
        const Icon = channelIcons[conv.channel];
        const isSelected = conv.id === selectedId;
        const primaryParticipant = conv.participants.find(p => p.contactId || p.prospectId || p.customerId) || conv.participants[0];
        const displayName = primaryParticipant?.name || primaryParticipant?.email || "Unknown";

        return (
          <div
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={cn(
              "cursor-pointer border-b p-4 transition-colors hover:bg-muted/50",
              isSelected && "bg-muted"
            )}
          >
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" />
                <AvatarFallback>
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{displayName}</p>
                    {conv.isPinned && (
                      <Badge variant="outline" className="h-4 px-1 text-xs">
                        Pinned
                      </Badge>
                    )}
                    {conv.isStarred && (
                      <span className="text-yellow-500">★</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(conv.lastMessageAt, { addSuffix: true })}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Icon className={cn("h-3.5 w-3.5", channelColors[conv.channel].split(" ")[1])} />
                  <p className="truncate text-sm text-muted-foreground">
                    {conv.subject || conv.snippet || "No subject"}
                  </p>
                </div>
                {conv.unreadCount > 0 && (
                  <Badge
                    variant="default"
                    className="mt-1 h-5 w-5 rounded-full p-0 text-xs"
                  >
                    {conv.unreadCount}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
