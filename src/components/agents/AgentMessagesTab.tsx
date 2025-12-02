"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Send,
  Bot,
  User,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Lightbulb,
  Settings,
  RefreshCw,
  Mail,
  MessageSquare,
  FileText,
  Target,
  Brain,
  Calendar,
  Database,
  Workflow,
  Search,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { Agent } from "./AgentList";

interface Message {
  id: string;
  agentId: string;
  content: string;
  sender: "user" | "agent";
  timestamp: Date;
  type?: "text" | "update" | "error" | "tip" | "win";
}

// API response types
interface ApiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface AgentMessagesTabProps {
  selectedAgent: Agent | null;
  onSelectAgent: (agent: Agent | null) => void;
  onConfigureAgent?: (agent: Agent) => void;
}

// Agent type to icon mapping
const agentTypeIcons: Record<string, typeof Bot> = {
  email: Mail,
  call: MessageSquare,
  note: FileText,
  task: CheckCircle2,
  roadmap: Target,
  content: FileText,
  custom: Bot,
  browser: Database,
  "cross-app": Workflow,
  knowledge: Brain,
  sales: Target,
  trending: TrendingUp,
  research: Search,
  meeting: Calendar,
  code: Database,
  data: Database,
  security: AlertCircle,
  scope: Target,
};

// Agent type to color mapping
const agentTypeColors: Record<string, { text: string; bg: string }> = {
  email: { text: "text-blue-600", bg: "bg-blue-50" },
  call: { text: "text-green-600", bg: "bg-green-50" },
  note: { text: "text-amber-600", bg: "bg-amber-50" },
  task: { text: "text-purple-600", bg: "bg-purple-50" },
  roadmap: { text: "text-indigo-600", bg: "bg-indigo-50" },
  content: { text: "text-pink-600", bg: "bg-pink-50" },
  custom: { text: "text-gray-600", bg: "bg-gray-50" },
  browser: { text: "text-cyan-600", bg: "bg-cyan-50" },
  "cross-app": { text: "text-orange-600", bg: "bg-orange-50" },
  knowledge: { text: "text-violet-600", bg: "bg-violet-50" },
  sales: { text: "text-purple-600", bg: "bg-purple-50" },
  trending: { text: "text-red-600", bg: "bg-red-50" },
  research: { text: "text-blue-600", bg: "bg-blue-50" },
  meeting: { text: "text-green-600", bg: "bg-green-50" },
  code: { text: "text-gray-600", bg: "bg-gray-50" },
  data: { text: "text-cyan-600", bg: "bg-cyan-50" },
  security: { text: "text-red-600", bg: "bg-red-50" },
  scope: { text: "text-indigo-600", bg: "bg-indigo-50" },
};

// Transform API messages to local format
function transformApiMessage(msg: ApiMessage, agentId: string): Message {
  return {
    id: msg.id,
    agentId,
    content: msg.content,
    sender: msg.role === "assistant" ? "agent" : "user",
    timestamp: new Date(msg.timestamp),
    type: "text",
  };
}

function getMessageTypeIcon(type?: string) {
  switch (type) {
    case "error":
      return <AlertCircle className="h-3.5 w-3.5 text-red-500" />;
    case "tip":
      return <Lightbulb className="h-3.5 w-3.5 text-amber-500" />;
    case "win":
      return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />;
    case "update":
      return <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />;
    default:
      return null;
  }
}

function getMessageTypeBadge(type?: string) {
  switch (type) {
    case "error":
      return (
        <Badge className="text-[10px] px-1.5 py-0 h-4 bg-red-50 text-red-600 border-red-200">
          Error
        </Badge>
      );
    case "tip":
      return (
        <Badge className="text-[10px] px-1.5 py-0 h-4 bg-amber-50 text-amber-600 border-amber-200">
          Tip
        </Badge>
      );
    case "win":
      return (
        <Badge className="text-[10px] px-1.5 py-0 h-4 bg-emerald-50 text-emerald-600 border-emerald-200">
          Win
        </Badge>
      );
    case "update":
      return (
        <Badge className="text-[10px] px-1.5 py-0 h-4 bg-blue-50 text-blue-600 border-blue-200">
          Update
        </Badge>
      );
    default:
      return null;
  }
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function AgentMessagesTab({
  selectedAgent,
  onSelectAgent,
  onConfigureAgent,
}: AgentMessagesTabProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages from API
  const fetchMessages = useCallback(async (agentId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/agents/${agentId}/chat`);
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      const data = await response.json();
      
      if (data.messages && Array.isArray(data.messages)) {
        setMessages(data.messages.map((msg: ApiMessage) => transformApiMessage(msg, agentId)));
        setConversationId(data.conversation?.id || null);
      } else {
        setMessages([]);
        setConversationId(null);
      }
    } catch (error) {
      logger.error("Failed to fetch agent messages", error);
      toast.error("Failed to load messages");
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load messages when agent changes
  useEffect(() => {
    if (selectedAgent) {
      fetchMessages(selectedAgent.id);
    } else {
      setMessages([]);
      setConversationId(null);
    }
  }, [selectedAgent?.id, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedAgent || isSending) return;

    const messageContent = inputValue.trim();
    
    // Optimistically add user message
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      agentId: selectedAgent.id,
      content: messageContent,
      sender: "user",
      timestamp: new Date(),
      type: "text",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsSending(true);

    try {
      const response = await fetch(`/api/agents/${selectedAgent.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageContent,
          conversationId: conversationId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send message");
      }

      const data = await response.json();
      
      // Update conversation ID if new
      if (data.conversationId && data.conversationId !== conversationId) {
        setConversationId(data.conversationId);
      }

      // Add agent response
      if (data.message) {
        const agentResponse: Message = {
          id: data.message.id,
          agentId: selectedAgent.id,
          content: data.message.content,
          sender: "agent",
          timestamp: new Date(data.message.timestamp),
          type: "text",
        };
        setMessages((prev) => [...prev, agentResponse]);
      }
    } catch (error) {
      logger.error("Failed to send message", error);
      toast.error(error instanceof Error ? error.message : "Failed to send message");
      // Remove the optimistic user message on error
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      setInputValue(messageContent); // Restore input
    } finally {
      setIsSending(false);
    }
  };

  const handleClearHistory = async () => {
    if (!selectedAgent || isClearing) return;
    
    setIsClearing(true);
    try {
      const response = await fetch(`/api/agents/${selectedAgent.id}/chat`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to clear history");
      }

      setMessages([]);
      setConversationId(null);
      toast.success("Chat history cleared");
    } catch (error) {
      logger.error("Failed to clear chat history", error);
      toast.error("Failed to clear history");
    } finally {
      setIsClearing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!selectedAgent) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-6">
          <MessageSquare className="h-10 w-10 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Select an Agent to Chat
        </h3>
        <p className="text-sm text-gray-500 max-w-sm mb-6">
          Choose an agent from the list to start a conversation. Use messaging to
          train, tune preferences, and receive updates from your agents.
        </p>
        <div className="flex flex-col gap-2 text-sm text-gray-500 text-left">
          <div className="flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <span>Train agents with your preferences</span>
          </div>
          <div className="flex items-center gap-3">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span>Receive KPIs and win notifications</span>
          </div>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span>Get error alerts and improvement tips</span>
          </div>
        </div>
      </div>
    );
  }

  const Icon = agentTypeIcons[selectedAgent.type] || Bot;
  const colors = agentTypeColors[selectedAgent.type] || {
    text: "text-gray-600",
    bg: "bg-gray-50",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2.5 rounded-xl", colors.bg)}>
              <Icon className={cn("h-5 w-5", colors.text)} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {selectedAgent.name}
              </h3>
              <p className="text-xs text-gray-500">
                {selectedAgent.status === "active"
                  ? "Online • Ready to assist"
                  : selectedAgent.status === "paused"
                  ? "Paused • Limited responses"
                  : "Offline • May not respond"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearHistory}
                disabled={isClearing}
                className="h-8 text-gray-500 hover:text-red-600"
                aria-label="Clear chat history"
              >
                {isClearing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            )}
            {onConfigureAgent && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onConfigureAgent(selectedAgent)}
                className="h-8"
                aria-label="Agent settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-3",
                i % 2 === 0 ? "justify-start" : "justify-end"
              )}
            >
              {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full" />}
              <Skeleton
                className={cn(
                  "h-16 rounded-2xl",
                  i % 2 === 0 ? "w-3/4" : "w-2/3"
                )}
              />
              {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full" />}
            </div>
          ))
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No messages yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Start a conversation with {selectedAgent.name}
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isAgent = message.sender === "agent";

            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  isAgent ? "justify-start" : "justify-end"
                )}
              >
                {isAgent && (
                  <div className={cn("p-2 rounded-full h-fit", colors.bg)}>
                    <Icon className={cn("h-4 w-4", colors.text)} />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-3",
                    isAgent
                      ? "bg-gray-100 text-gray-900"
                      : "bg-blue-600 text-white"
                  )}
                >
                  {isAgent && message.type && message.type !== "text" && (
                    <div className="flex items-center gap-2 mb-2">
                      {getMessageTypeIcon(message.type)}
                      {getMessageTypeBadge(message.type)}
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p
                    className={cn(
                      "text-[10px] mt-2",
                      isAgent ? "text-gray-400" : "text-blue-200"
                    )}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
                {!isAgent && (
                  <div className="p-2 rounded-full h-fit bg-gray-100">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                )}
              </div>
            );
          })
        )}
        {isSending && (
          <div className="flex gap-3 justify-start">
            <div className={cn("p-2 rounded-full h-fit", colors.bg)}>
              <Icon className={cn("h-4 w-4", colors.text)} />
            </div>
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="flex gap-3">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message ${selectedAgent.name}...`}
            className="flex-1 h-11 rounded-full px-4 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-100"
            disabled={isSending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isSending}
            className="h-11 w-11 rounded-full bg-blue-600 hover:bg-blue-700 p-0"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-2">
          Messages help train and tune this agent&apos;s behavior
        </p>
      </div>
    </div>
  );
}
