"use client";

import { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Sparkles, 
  MessageSquare, 
  Zap, 
  Brain,
  Target,
  FileText,
  Calendar,
  Mail,
  TrendingUp,
  Users,
  Bot,
  Send,
  Loader2,
  ChevronRight,
  Clock,
  CheckCircle2,
  Lightbulb,
  Workflow,
  Database,
  BarChart3,
  History,
  Plus,
  Trash2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

// SWR fetcher
const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  preview: string;
  capability: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface AssistantCapability {
  id: string;
  title: string;
  description: string;
  icon: typeof Sparkles;
  color: string;
  bgColor: string;
  borderColor: string;
  examples: string[];
  category: string;
}

type LeftPanelView = "capabilities" | "history";

export default function AssistantPage() {
  const [leftPanelView, setLeftPanelView] = useState<LeftPanelView>("capabilities");
  const [selectedCapability, setSelectedCapability] = useState<string>("workflow");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingConversation, setIsDeletingConversation] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations from API
  const { 
    data: conversationsData, 
    error: conversationsError, 
    mutate: mutateConversations,
    isLoading: isLoadingConversations 
  } = useSWR('/api/assistant/conversations', fetcher);

  // Map API data to local format (handle both array response and error response)
  const conversations: Conversation[] = Array.isArray(conversationsData) 
    ? conversationsData.map((conv: Conversation) => ({
        ...conv,
        messages: conv.messages?.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })) || [],
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
      }))
    : [];

  const capabilities: AssistantCapability[] = [
    {
      id: "workflow",
      title: "Workflow Automation",
      description: "Create and manage automated workflows",
      icon: Workflow,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      examples: [
        "Create a workflow to follow up with leads",
        "Automate my email responses",
        "Set up a meeting reminder sequence",
      ],
      category: "Automation",
    },
    {
      id: "insights",
      title: "Data Insights",
      description: "Get AI-powered analytics and insights",
      icon: BarChart3,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      examples: [
        "Analyze my sales pipeline",
        "Show me top performing campaigns",
        "What are my conversion trends?",
      ],
      category: "Analytics",
    },
    {
      id: "content",
      title: "Content Generation",
      description: "Generate emails, documents, and copy",
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      examples: [
        "Write a follow-up email for John",
        "Draft a proposal for the Q4 project",
        "Create a meeting agenda",
      ],
      category: "Content",
    },
    {
      id: "scheduling",
      title: "Smart Scheduling",
      description: "Manage calendar and schedule meetings",
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      examples: [
        "Find a time to meet with Sarah",
        "Block focus time tomorrow morning",
        "Reschedule my 3pm meeting",
      ],
      category: "Productivity",
    },
    {
      id: "leads",
      title: "Lead Intelligence",
      description: "Score and prioritize leads with AI",
      icon: Target,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-200",
      examples: [
        "Who are my hottest leads?",
        "Score the leads from yesterday",
        "Find leads ready to close",
      ],
      category: "Sales",
    },
    {
      id: "research",
      title: "Research Assistant",
      description: "Research companies and contacts",
      icon: Brain,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      examples: [
        "Research Acme Corp before my call",
        "Find decision makers at TechStart",
        "What's the latest news on GlobalTech?",
      ],
      category: "Research",
    },
  ];

  const selectedCapabilityData = capabilities.find(c => c.id === selectedCapability) || capabilities[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputValue;
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          conversationId: currentConversationId,
          context: {
            feature: selectedCapability,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: data.message.id,
        role: "assistant",
        content: data.message.content,
        timestamp: new Date(data.message.createdAt),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update conversation ID if this was a new conversation
      if (!currentConversationId && data.conversationId) {
        setCurrentConversationId(data.conversationId);
        setSelectedConversation(data.conversationId);
      }
      
      // Refresh conversation history
      mutateConversations();
    } catch (error) {
      logger.error('Failed to send message', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message. Please try again.');
      // Remove the optimistic user message on error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setInputValue(example);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectConversation = async (conv: Conversation) => {
    setSelectedConversation(conv.id);
    setCurrentConversationId(conv.id);
    setSelectedCapability(conv.capability);
    setLeftPanelView("history");
    
    // Fetch full conversation messages from API
    try {
      const response = await fetch(`/api/assistant/conversations/${conv.id}`);
      if (!response.ok) {
        throw new Error('Failed to load conversation');
      }
      const data = await response.json();
      
      // Map the messages to the correct format
      const loadedMessages: Message[] = data.messages.map((msg: { id: string; role: 'user' | 'assistant'; content: string; createdAt: string }) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.createdAt),
      }));
      
      setMessages(loadedMessages);
    } catch (error) {
      logger.error('Failed to load conversation', error);
      toast.error('Failed to load conversation');
      // Fall back to the preview messages we have
      setMessages(conv.messages || []);
    }
  };

  const handleNewConversation = () => {
    setSelectedConversation(null);
    setCurrentConversationId(null);
    setMessages([]);
    setLeftPanelView("capabilities");
    toast.success("Started new conversation");
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeletingConversation(convId);
    
    try {
      const response = await fetch(`/api/assistant/conversations/${convId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete conversation');
      }

      // Clear current conversation if it was deleted
      if (selectedConversation === convId) {
        setSelectedConversation(null);
        setCurrentConversationId(null);
        setMessages([]);
      }
      
      // Refresh conversation list
      mutateConversations();
      toast.success("Conversation deleted");
    } catch (error) {
      logger.error('Failed to delete conversation', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete conversation');
    } finally {
      setIsDeletingConversation(null);
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getCapabilityIcon = (capabilityId: string) => {
    const cap = capabilities.find(c => c.id === capabilityId);
    return cap?.icon || MessageSquare;
  };

  const getCapabilityColor = (capabilityId: string) => {
    const cap = capabilities.find(c => c.id === capabilityId);
    return cap?.color || "text-gray-600";
  };

  const getCapabilityBgColor = (capabilityId: string) => {
    const cap = capabilities.find(c => c.id === capabilityId);
    return cap?.bgColor || "bg-gray-50";
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Neptune</h1>
          <p className="text-gray-500 mt-1">Your AI sidekick for getting things done</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
            Online
          </Badge>
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1">
            <Bot className="h-3.5 w-3.5 mr-1.5" />
            GPT-4 Powered
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <Card className="p-8 shadow-lg border-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[650px]">
          {/* Left: Capabilities / History Toggle */}
          <div className="flex flex-col rounded-xl border bg-white overflow-hidden shadow-sm">
            {/* Header with Tabs */}
            <div className="px-6 py-4 border-b bg-gradient-to-r from-indigo-50 to-purple-50 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
                    <Sparkles className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[15px] text-gray-900">Neptune</h3>
                    <p className="text-[13px] text-indigo-600 flex items-center gap-1">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" aria-hidden="true" />
                      {leftPanelView === "capabilities" ? `${capabilities.length} capabilities` : `${conversations.length} conversations`}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={handleNewConversation}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  aria-label="New conversation"
                >
                  <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
                  New
                </Button>
              </div>

              {/* Tab Toggle */}
              <div className="flex gap-1 p-1 bg-white/60 rounded-lg">
                <button
                  onClick={() => setLeftPanelView("capabilities")}
                  className={cn(
                    "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2",
                    leftPanelView === "capabilities"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                  aria-label="View capabilities"
                  aria-pressed={leftPanelView === "capabilities"}
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Capabilities
                </button>
                <button
                  onClick={() => setLeftPanelView("history")}
                  className={cn(
                    "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2",
                    leftPanelView === "history"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                  aria-label="View history"
                  aria-pressed={leftPanelView === "history"}
                >
                  <History className="h-4 w-4" aria-hidden="true" />
                  History
                  {conversations.length > 0 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-indigo-50 text-indigo-600 border-indigo-200">
                      {conversations.length}
                    </Badge>
                  )}
                </button>
              </div>
            </div>

            {/* Content based on selected view */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {leftPanelView === "capabilities" ? (
                // Capabilities List
                capabilities.map((capability) => {
                  const isSelected = selectedCapability === capability.id && !selectedConversation;
                  const CapabilityIcon = capability.icon;
                  
                  return (
                    <button
                      key={capability.id}
                      onClick={() => {
                        setSelectedCapability(capability.id);
                        setSelectedConversation(null);
                        setCurrentConversationId(null);
                        setMessages([]);
                      }}
                      className={cn(
                        "w-full text-left p-4 rounded-lg border-2 transition-all duration-200",
                        isSelected 
                          ? `${capability.bgColor} ${capability.borderColor} shadow-md` 
                          : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                      )}
                      aria-label={`Select ${capability.title} capability`}
                      aria-pressed={isSelected}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("p-2 rounded-lg", capability.bgColor)}>
                          <CapabilityIcon className={cn("h-5 w-5", capability.color)} aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h4 className={cn("font-semibold text-sm", isSelected ? capability.color : "text-gray-900")}>
                                {capability.title}
                              </h4>
                              <Badge 
                                variant="outline" 
                                className="text-[10px] px-1.5 py-0 h-4 bg-gray-50 text-gray-600 border-gray-200"
                              >
                                {capability.category}
                              </Badge>
                            </div>
                            <ChevronRight className={cn(
                              "h-4 w-4 transition-transform",
                              isSelected ? `${capability.color} rotate-90` : "text-gray-400"
                            )} aria-hidden="true" />
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{capability.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : isLoadingConversations ? (
                // Loading state for conversations
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-lg border border-gray-100 bg-white">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-9 w-9 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  </div>
                ))
              ) : conversationsError ? (
                // Error state
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                    <AlertCircle className="h-8 w-8 text-red-400" aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Failed to load history</h3>
                  <p className="text-sm text-gray-500 max-w-xs mb-4">
                    We couldn&apos;t load your conversation history.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => mutateConversations()}
                  >
                    <RefreshCw className="h-4 w-4 mr-1.5" />
                    Retry
                  </Button>
                </div>
              ) : (
                // Conversation History
                conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <History className="h-8 w-8 text-gray-400" aria-hidden="true" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-2">No conversations yet</h3>
                    <p className="text-sm text-gray-500 max-w-xs">
                      Start a new conversation to see your chat history here.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setLeftPanelView("capabilities")}
                      className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      Start a conversation
                    </Button>
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const isSelected = selectedConversation === conv.id;
                    const ConvIcon = getCapabilityIcon(conv.capability);
                    const convColor = getCapabilityColor(conv.capability);
                    const convBgColor = getCapabilityBgColor(conv.capability);
                    
                    return (
                      <button
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv)}
                        className={cn(
                          "w-full text-left p-4 rounded-lg border-2 transition-all duration-200 group",
                          isSelected 
                            ? `${convBgColor} border-indigo-200 shadow-md` 
                            : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                        )}
                        aria-label={`View conversation: ${conv.title}`}
                        aria-pressed={isSelected}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn("p-2 rounded-lg", convBgColor)}>
                            <ConvIcon className={cn("h-5 w-5", convColor)} aria-hidden="true" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-sm text-gray-900 truncate pr-2">
                                {conv.title}
                              </h4>
                              <button
                                onClick={(e) => handleDeleteConversation(conv.id, e)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 transition-all disabled:opacity-50"
                                aria-label={`Delete conversation: ${conv.title}`}
                                disabled={isDeletingConversation === conv.id}
                              >
                                {isDeletingConversation === conv.id ? (
                                  <Loader2 className="h-3.5 w-3.5 text-red-500 animate-spin" aria-hidden="true" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
                                )}
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 truncate mb-2">{conv.preview}</p>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400">
                              <Clock className="h-3 w-3" aria-hidden="true" />
                              {formatRelativeTime(conv.updatedAt)}
                              <span className="text-gray-300">•</span>
                              <span>{conv.messages.length} messages</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )
              )}
            </div>
          </div>

          {/* Right: Chat Interface */}
          <div className="flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            {/* Header */}
            <div className={cn("px-6 py-4 border-b flex-shrink-0", selectedCapabilityData.bgColor)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2.5 rounded-lg border", selectedCapabilityData.bgColor, selectedCapabilityData.borderColor)}>
                    <selectedCapabilityData.icon className={cn("h-5 w-5", selectedCapabilityData.color)} aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[15px] text-gray-900">{selectedCapabilityData.title}</h3>
                    <p className="text-xs text-gray-500">{selectedCapabilityData.description}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className={cn(selectedCapabilityData.bgColor, selectedCapabilityData.color, selectedCapabilityData.borderColor)}
                  onClick={() => {
                    setMessages([]);
                    setSelectedConversation(null);
                    toast.success("Conversation cleared");
                  }}
                  aria-label="Clear conversation"
                >
                  Clear
                </Button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-4", selectedCapabilityData.bgColor)}>
                    <selectedCapabilityData.icon className={cn("h-8 w-8", selectedCapabilityData.color)} aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    Start a conversation
                  </h3>
                  <p className="text-sm text-gray-500 mb-6 max-w-xs">
                    Ask me anything about {selectedCapabilityData.title.toLowerCase()} or try one of these examples:
                  </p>
                  <div className="space-y-2 w-full max-w-sm">
                    {selectedCapabilityData.examples.map((example, index) => (
                      <button
                        key={index}
                        onClick={() => handleExampleClick(example)}
                        className="w-full p-3 text-left text-sm text-gray-600 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                        aria-label={`Use example: ${example}`}
                      >
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0" aria-hidden="true" />
                          <span>{example}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.role === "assistant" && (
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", selectedCapabilityData.bgColor)}>
                          <Bot className={cn("h-4 w-4", selectedCapabilityData.color)} aria-hidden="true" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                          message.role === "user"
                            ? "bg-indigo-600 text-white rounded-br-md"
                            : "bg-white border border-gray-200 text-gray-700 rounded-bl-md"
                        )}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p className={cn(
                          "text-[10px] mt-2",
                          message.role === "user" ? "text-indigo-200" : "text-gray-400"
                        )}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {message.role === "user" && (
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <Users className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", selectedCapabilityData.bgColor)}>
                        <Bot className={cn("h-4 w-4", selectedCapabilityData.color)} aria-hidden="true" />
                      </div>
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          Thinking...
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-white flex-shrink-0">
              <div className="flex items-center gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={`Ask about ${selectedCapabilityData.title.toLowerCase()}...`}
                  className="flex-1 h-11 bg-slate-50 border-slate-200 focus:border-indigo-300 focus:ring-indigo-200"
                  disabled={isLoading}
                  aria-label="Type your message"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="h-11 px-4 bg-indigo-600 hover:bg-indigo-700 text-white"
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="h-5 w-5" aria-hidden="true" />
                  )}
                </Button>
              </div>
              <p className="text-[11px] text-gray-400 mt-2 text-center">
                Press Enter to send • Powered by GPT-4
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
