"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageTitle } from "@/components/ui/page-title";
import {
  Search,
  Mail,
  MessageSquare,
  Sparkles,
  Users,
  Zap,
  MessagesSquare,
  Phone,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ConversationList from "./ConversationList";
import ConversationThread from "./ConversationThread";
import ContactProfileCard from "./ContactProfileCard";
import NeptuneAssistPanel from "./NeptuneAssistPanel";
import ChannelTabs, { ChannelType } from "./ChannelTabs";
import DepartmentFilter, { DepartmentType } from "./DepartmentFilter";
import TeamChat from "./TeamChat";

export interface Conversation {
  id: string;
  channel: 'email' | 'sms' | 'call' | 'whatsapp' | 'social' | 'live_chat' | 'text' | 'support';
  status: 'active' | 'archived' | 'closed' | 'spam';
  subject: string;
  snippet: string;
  isUnread: boolean;
  isStarred: boolean;
  isPinned: boolean;
  unreadCount: number;
  messageCount: number;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
  assignedTo: string | null;
  labels: string[];
  tags: string[];
  latestMessage: {
    id: string;
    body: string;
    direction: 'inbound' | 'outbound';
    senderName: string;
    createdAt: Date;
  } | null;
  participants: Array<{
    id: string;
    contactId: string | null;
    prospectId: string | null;
    customerId: string | null;
    userId: string | null;
    email: string;
    phone: string;
    name: string;
  }>;
}

interface WorkspacePhoneNumber {
  id: string;
  phoneNumber: string;
  friendlyName: string | null;
  numberType: 'primary' | 'sales' | 'support' | 'custom';
  status: string;
  [key: string]: any; // Allow additional fields from database
}

interface ConversationsDashboardProps {
  phoneNumbers: WorkspacePhoneNumber[];
  initialConversations: Conversation[];
  stats: {
    totalConversations: number;
    unreadMessages: number;
    activeChannels: number;
    avgResponseTime: number;
  };
}

export default function ConversationsDashboard({
  phoneNumbers,
  initialConversations,
  stats,
}: ConversationsDashboardProps) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [activeChannel, setActiveChannel] = useState<ChannelType>('team');
  const [activeDepartment, setActiveDepartment] = useState<DepartmentType>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [showNeptune, setShowNeptune] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");


  // Filter conversations based on channel, department, and search
  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Filter by channel
    if (activeChannel !== 'team') {
      if (activeChannel === 'text') {
        // Combine SMS and WhatsApp into "Text"
        filtered = filtered.filter(conv => conv.channel === 'sms' || conv.channel === 'whatsapp');
      } else if (activeChannel === 'support') {
        // Map "Support" to live_chat
        filtered = filtered.filter(conv => conv.channel === 'live_chat');
      } else {
        filtered = filtered.filter(conv => conv.channel === activeChannel);
      }
    }

    // Filter by department (based on tags)
    if (activeDepartment !== 'all') {
      const departmentTag = `department:${activeDepartment}`;
      filtered = filtered.filter(conv => conv.tags.includes(departmentTag));
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(conv => conv.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(conv =>
        conv.subject.toLowerCase().includes(query) ||
        conv.snippet.toLowerCase().includes(query) ||
        conv.participants.some(p => 
          p.name.toLowerCase().includes(query) ||
          p.email.toLowerCase().includes(query) ||
          p.phone.includes(query)
        )
      );
    }

    return filtered;
  }, [conversations, activeChannel, activeDepartment, statusFilter, searchQuery]);

  // Calculate department counts
  const departmentCounts = useMemo(() => {
    const counts: Partial<Record<DepartmentType, number>> = {
      all: conversations.length,
    };
    
    (['primary', 'sales', 'support', 'custom'] as const).forEach(dept => {
      counts[dept] = conversations.filter(conv => 
        conv.tags.includes(`department:${dept}`)
      ).length;
    });
    
    return counts;
  }, [conversations]);

  const selectedConv = useMemo(() => {
    return conversations.find(c => c.id === selectedConversation) || null;
  }, [conversations, selectedConversation]);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between pt-4">
          <PageTitle title="Conversations" icon={MessagesSquare} />

          {/* Stats Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Phone Number Badge */}
            {phoneNumbers.length > 0 && (
              <Badge variant="soft" tone="success" size="pill">
                <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="font-semibold">
                  {phoneNumbers[0].phoneNumber.replace(
                    /^\+1(\d{3})(\d{3})(\d{4})$/,
                    "($1) $2-$3"
                  )}
                </span>
                {phoneNumbers[0].friendlyName && (
                  <span className="ml-1 font-normal opacity-70">
                    • {phoneNumbers[0].friendlyName}
                  </span>
                )}
                {phoneNumbers.length > 1 && (
                  <span className="ml-1 font-normal opacity-70">
                    +{phoneNumbers.length - 1} more
                  </span>
                )}
              </Badge>
            )}

            <Badge variant="soft" tone="info" size="pill">
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="font-semibold">{stats.totalConversations}</span>
              <span className="ml-1 font-normal opacity-70">Conversations</span>
            </Badge>
            <Badge variant="soft" tone="warning" size="pill">
              <Mail className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="font-semibold">{stats.unreadMessages}</span>
              <span className="ml-1 font-normal opacity-70">Unread</span>
            </Badge>
            <Badge variant="soft" tone="violet" size="pill">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="font-semibold">{stats.activeChannels}</span>
              <span className="ml-1 font-normal opacity-70">Channels</span>
            </Badge>
          </div>
        </div>

        {/* Tab Bar with Ask Neptune Button */}
        <div className="mt-14 relative flex items-center justify-center">
          <ChannelTabs
            activeChannel={activeChannel}
            onChannelChange={setActiveChannel}
            counts={{
              team: 0, // Team chat has its own UI
              email: conversations.filter(c => c.channel === 'email').length,
              text: conversations.filter(c => c.channel === 'sms' || c.channel === 'whatsapp').length,
              call: conversations.filter(c => c.channel === 'call').length,
              social: conversations.filter(c => c.channel === 'social').length,
              support: conversations.filter(c => c.channel === 'live_chat').length,
            }}
          />
          <div className="absolute right-0">
            <Button
              size="sm"
              variant="surface"
              onClick={() => setShowNeptune(!showNeptune)}
              aria-label="Toggle Neptune AI assistant"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span className="hidden md:inline">Neptune</span>
            </Button>
          </div>
        </div>

        {/* Department Filter - Only show for text/call channels */}
        {(activeChannel === 'text' || activeChannel === 'call') && (
          <div className="mt-4 flex items-center justify-center">
            <DepartmentFilter
              activeDepartment={activeDepartment}
              onDepartmentChange={setActiveDepartment}
              counts={departmentCounts}
            />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeChannel === 'team' ? (
        // Team Chat View with optional Neptune
        <div className="flex flex-1 overflow-hidden p-6 gap-6">
          <Card className={`flex flex-col rounded-2xl shadow-sm border bg-card overflow-hidden transition-all ${
            showNeptune ? 'flex-1' : 'flex-1'
          }`}>
            <TeamChat />
          </Card>
          
          {/* Neptune Panel for Team Chat */}
          <AnimatePresence>
            {showNeptune && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '30%', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col relative z-40"
              >
                <Card className="flex flex-col h-full rounded-l-2xl shadow-sm border border-r-0 bg-card overflow-hidden">
                  <NeptuneAssistPanel
                    conversationId={null}
                    conversation={null}
                  />
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        // Regular Conversations View
        <div className="flex flex-1 overflow-hidden p-6 gap-6">
          {/* Left Panel - Conversation List */}
          <Card className={`flex flex-col rounded-2xl shadow-sm border bg-card overflow-hidden transition-all ${
            showNeptune ? 'w-[25%]' : 'w-[30%]'
          }`}>
            <div className="border-b p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <ConversationList
              conversations={filteredConversations}
              selectedId={selectedConversation}
              onSelect={setSelectedConversation}
              activeChannel={activeChannel}
            />
          </Card>

          {/* Center Panel - Conversation Thread */}
          <Card className={`flex flex-col rounded-2xl shadow-sm border bg-card overflow-hidden transition-all ${
            showNeptune ? 'w-[45%]' : 'w-[70%]'
          }`}>
            {selectedConv ? (
              <>
                <ContactProfileCard conversation={selectedConv} />
                <ConversationThread
                  conversationId={selectedConv.id}
                  channel={selectedConv.channel}
                />
              </>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center max-w-md px-8">
                  <div className="rounded-2xl bg-muted/50 p-6 mb-6 inline-block">
                    <MessageSquare className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {filteredConversations.length === 0 
                      ? "No conversations yet" 
                      : "Select a conversation"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {filteredConversations.length === 0 
                      ? "Once you connect your channels, incoming messages will appear in the sidebar."
                      : "Choose a conversation from the list to view the message thread and respond."}
                  </p>
                  {filteredConversations.length === 0 && (
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button variant="outline" size="sm" asChild>
                        <a href="/settings">
                          <Zap className="mr-2 h-4 w-4" />
                          Connect Channels
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Right Panel - Neptune AI (Toggleable) */}
          <AnimatePresence>
            {showNeptune && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '30%', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col relative z-40"
              >
                <Card className="flex flex-col h-full rounded-l-2xl shadow-sm border border-r-0 bg-card overflow-hidden">
                  <NeptuneAssistPanel
                    conversationId={selectedConversation}
                    conversation={selectedConv}
                  />
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
