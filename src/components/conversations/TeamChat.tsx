"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Hash,
  Plus,
  Send,
  Users,
  Lock,
  MessageSquare,
  Search,
  MoreHorizontal,
  Smile,
  Paperclip,
  AtSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import { toast } from "sonner";

interface TeamChannel {
  id: string;
  name: string;
  description: string | null;
  type: "general" | "direct" | "group" | "announcement";
  isPrivate: boolean;
  messageCount: number;
  lastMessageAt: string | null;
  unreadCount?: number;
  members?: Array<{
    id: string;
    userId: string;
    user: {
      firstName: string | null;
      lastName: string | null;
      email: string;
      avatarUrl: string | null;
    };
  }>;
}

interface TeamMessage {
  id: string;
  content: string;
  createdAt: string;
  isEdited: boolean;
  sender: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    avatarUrl: string | null;
  };
  reactions: Record<string, string[]>;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

export default function TeamChat() {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch channels
  const { data: channelsData, mutate: mutateChannels } = useSWR<{ channels: TeamChannel[] }>(
    "/api/team/channels",
    fetcher
  );

  // Fetch messages for selected channel
  const { data: messagesData, mutate: mutateMessages } = useSWR<{ messages: TeamMessage[] }>(
    selectedChannel ? `/api/team/channels/${selectedChannel}/messages` : null,
    fetcher,
    { refreshInterval: 5000 } // Poll every 5 seconds for new messages
  );

  const channels = channelsData?.channels || [];
  const messages = messagesData?.messages || [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Filter channels by search
  const filteredChannels = channels.filter((ch) =>
    ch.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedChannelData = channels.find((ch) => ch.id === selectedChannel);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChannel) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/team/channels/${selectedChannel}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      setMessage("");
      await mutateMessages();
      await mutateChannels();
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;

    try {
      const res = await fetch("/api/team/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newChannelName, type: "general" }),
      });

      if (!res.ok) throw new Error("Failed to create channel");

      const data = await res.json();
      setNewChannelName("");
      setShowNewChannel(false);
      await mutateChannels();
      setSelectedChannel(data.channel.id);
      toast.success(`#${newChannelName} created!`);
    } catch (error) {
      toast.error("Failed to create channel");
    }
  };

  const getInitials = (firstName: string | null, lastName: string | null, email: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return email[0]?.toUpperCase() || "?";
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="flex h-full">
      {/* Channels Sidebar */}
      <div className="w-64 border-r flex flex-col bg-muted/30">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Team Channels</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowNewChannel(true)}
              aria-label="Create new channel"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>

        {/* New Channel Input */}
        <AnimatePresence>
          {showNewChannel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 py-2 border-b bg-muted/50"
            >
              <div className="flex gap-2">
                <Input
                  placeholder="channel-name"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  className="h-8 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleCreateChannel()}
                />
                <Button size="sm" className="h-8" onClick={handleCreateChannel}>
                  Create
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Channel List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {filteredChannels.length === 0 ? (
              <div className="text-center py-8 px-4">
                <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No channels yet</p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setShowNewChannel(true)}
                  className="mt-1"
                >
                  Create your first channel
                </Button>
              </div>
            ) : (
              filteredChannels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannel(channel.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors",
                    selectedChannel === channel.id
                      ? "bg-indigo-100 text-indigo-700"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  {channel.type === "direct" ? (
                    <Users className="h-4 w-4 flex-shrink-0" />
                  ) : channel.isPrivate ? (
                    <Lock className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <Hash className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span className="flex-1 truncate text-sm font-medium">{channel.name}</span>
                  {channel.unreadCount && channel.unreadCount > 0 && (
                    <Badge className="bg-indigo-500 text-white text-xs px-1.5 py-0 h-5">
                      {channel.unreadCount}
                    </Badge>
                  )}
                </button>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Team Members Preview */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>Team members online</span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChannelData ? (
          <>
            {/* Channel Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedChannelData.type === "direct" ? (
                  <Users className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Hash className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <h2 className="font-semibold">{selectedChannelData.name}</h2>
                  {selectedChannelData.description && (
                    <p className="text-xs text-muted-foreground">{selectedChannelData.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Search className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <h3 className="font-medium mb-1">No messages yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Start the conversation in #{selectedChannelData.name}
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const showAvatar =
                      idx === 0 || messages[idx - 1].sender.id !== msg.sender.id;
                    return (
                      <div key={msg.id} className={cn("flex gap-3", !showAvatar && "ml-11")}>
                        {showAvatar && (
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={msg.sender.avatarUrl || undefined} />
                            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">
                              {getInitials(msg.sender.firstName, msg.sender.lastName, msg.sender.email)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex-1 min-w-0">
                          {showAvatar && (
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-medium text-sm">
                                {msg.sender.firstName && msg.sender.lastName
                                  ? `${msg.sender.firstName} ${msg.sender.lastName}`
                                  : msg.sender.email}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatTime(msg.createdAt)}
                              </span>
                              {msg.isEdited && (
                                <span className="text-xs text-muted-foreground">(edited)</span>
                              )}
                            </div>
                          )}
                          <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="relative flex-1">
                  <Input
                    placeholder={`Message #${selectedChannelData.name}`}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    className="pr-20"
                    disabled={isSending}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <AtSign className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Smile className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button
                  size="icon"
                  className="h-9 w-9 flex-shrink-0"
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isSending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md px-8">
              <div className="rounded-2xl bg-indigo-50 p-6 mb-6 inline-block">
                <Users className="h-10 w-10 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Team Chat</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Select a channel to start chatting with your team, or create a new one to get started.
              </p>
              <Button onClick={() => setShowNewChannel(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Channel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
