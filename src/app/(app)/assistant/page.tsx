"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock conversation history
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "conv-1",
      title: "Lead follow-up workflow",
      preview: "Create a workflow to follow up with leads automatically...",
      capability: "workflow",
      messages: [
        { id: "1", role: "user", content: "Create a workflow to follow up with leads", timestamp: new Date(Date.now() - 86400000) },
        { id: "2", role: "assistant", content: "I can help you create that workflow! Let me set up an automation that triggers when a new lead is added. It will:\n\n1. Send an immediate welcome email\n2. Wait 2 days, then send a follow-up\n3. Notify your sales team if they engage\n\nShould I create this workflow for you?", timestamp: new Date(Date.now() - 86400000) },
      ],
      createdAt: new Date(Date.now() - 86400000),
      updatedAt: new Date(Date.now() - 86400000),
    },
    {
      id: "conv-2",
      title: "Sales pipeline analysis",
      preview: "Analyze my sales pipeline and show key metrics...",
      capability: "insights",
      messages: [
        { id: "1", role: "user", content: "Analyze my sales pipeline", timestamp: new Date(Date.now() - 172800000) },
        { id: "2", role: "assistant", content: "Based on your data, here's what I found:\n\n📈 **Pipeline Health**: Strong - $1.2M value\n🎯 **Win Rate**: 23.5% (+2.3% this month)\n🔥 **Hot Leads**: 42 ready for outreach\n\nYour conversion rate has improved significantly. Want me to dig deeper into any metric?", timestamp: new Date(Date.now() - 172800000) },
      ],
      createdAt: new Date(Date.now() - 172800000),
      updatedAt: new Date(Date.now() - 172800000),
    },
    {
      id: "conv-3",
      title: "Email draft for John",
      preview: "Write a follow-up email for the meeting with John...",
      capability: "content",
      messages: [
        { id: "1", role: "user", content: "Write a follow-up email for John after our meeting yesterday", timestamp: new Date(Date.now() - 259200000) },
        { id: "2", role: "assistant", content: "I've drafted a follow-up email for you:\n\n---\n**Subject**: Great connecting yesterday, John!\n\nHi John,\n\nIt was wonderful speaking with you about your team's automation needs. I wanted to follow up on our conversation and share some resources...\n\n---\n\nWant me to personalize this further or send it directly?", timestamp: new Date(Date.now() - 259200000) },
      ],
      createdAt: new Date(Date.now() - 259200000),
      updatedAt: new Date(Date.now() - 259200000),
    },
    {
      id: "conv-4",
      title: "Meeting with Sarah",
      preview: "Find a time to meet with Sarah next week...",
      capability: "scheduling",
      messages: [
        { id: "1", role: "user", content: "Find a time to meet with Sarah next week", timestamp: new Date(Date.now() - 345600000) },
        { id: "2", role: "assistant", content: "I found 3 available slots that work for both you and Sarah:\n\n1. **Monday 2:00 PM** - 30 min\n2. **Wednesday 10:00 AM** - 30 min\n3. **Friday 3:30 PM** - 30 min\n\nWhich would you prefer? I'll send the invite automatically.", timestamp: new Date(Date.now() - 345600000) },
      ],
      createdAt: new Date(Date.now() - 345600000),
      updatedAt: new Date(Date.now() - 345600000),
    },
    {
      id: "conv-5",
      title: "Hot leads review",
      preview: "Who are my hottest leads right now?",
      capability: "leads",
      messages: [
        { id: "1", role: "user", content: "Who are my hottest leads right now?", timestamp: new Date(Date.now() - 432000000) },
        { id: "2", role: "assistant", content: "Here are your hottest leads right now:\n\n🔥 **Sarah Chen** (TechCorp) - Score: 94\n   Ready to buy, last engaged 2 hours ago\n\n🔥 **Mike Johnson** (StartupXYZ) - Score: 91\n   Requested pricing, demo scheduled\n\n🔥 **Lisa Park** (GlobalInc) - Score: 88\n   Multiple page visits today\n\nWant me to draft outreach for any of them?", timestamp: new Date(Date.now() - 432000000) },
      ],
      createdAt: new Date(Date.now() - 432000000),
      updatedAt: new Date(Date.now() - 432000000),
    },
  ]);

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
    setInputValue("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getAIResponse(inputValue, selectedCapability),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);

      // Save to conversation history if it's a new conversation
      if (!selectedConversation && messages.length === 0) {
        const newConv: Conversation = {
          id: `conv-${Date.now()}`,
          title: inputValue.slice(0, 40) + (inputValue.length > 40 ? "..." : ""),
          preview: inputValue,
          capability: selectedCapability,
          messages: [userMessage, assistantMessage],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setConversations(prev => [newConv, ...prev]);
        setSelectedConversation(newConv.id);
      }
    }, 1500);
  };

  const getAIResponse = (query: string, capability: string): string => {
    const responses: Record<string, string[]> = {
      workflow: [
        "I can help you create that workflow! Let me set up an automation that triggers when a new lead is added. It will:\n\n1. Send an immediate welcome email\n2. Wait 2 days, then send a follow-up\n3. Notify your sales team if they engage\n\nShould I create this workflow for you?",
        "Great idea! I'll create an automated email response system. It will analyze incoming emails and generate contextual replies. Want me to set this up with your email account?",
      ],
      insights: [
        "Based on your data, here's what I found:\n\n📈 **Pipeline Health**: Strong - $1.2M value\n🎯 **Win Rate**: 23.5% (+2.3% this month)\n🔥 **Hot Leads**: 42 ready for outreach\n\nYour conversion rate has improved significantly. Want me to dig deeper into any metric?",
        "Looking at your campaigns:\n\n1. **Email Campaign A** - 34% open rate (above avg)\n2. **Social Ads** - 285% ROI\n3. **Content Marketing** - 60% of qualified leads\n\nYour email campaigns are performing exceptionally well!",
      ],
      content: [
        "I've drafted a follow-up email for you:\n\n---\n**Subject**: Great connecting yesterday, [Name]!\n\nHi [Name],\n\nIt was wonderful speaking with you about [topic]. I wanted to follow up on our conversation...\n\n---\n\nWant me to personalize this further or send it directly?",
        "Here's a draft proposal outline:\n\n1. **Executive Summary**\n2. **Project Scope & Objectives**\n3. **Timeline & Milestones**\n4. **Investment & ROI**\n5. **Next Steps**\n\nShall I expand any section?",
      ],
      scheduling: [
        "I found 3 available slots that work for both you and Sarah:\n\n1. **Tomorrow 2:00 PM** - 30 min\n2. **Thursday 10:00 AM** - 30 min\n3. **Friday 3:30 PM** - 30 min\n\nWhich would you prefer? I'll send the invite automatically.",
        "Done! I've blocked 9:00 AM - 12:00 PM tomorrow as focus time. I'll also:\n\n• Decline any conflicting meetings\n• Set your status to 'Do Not Disturb'\n• Hold notifications until noon\n\nAnything else?",
      ],
      leads: [
        "Here are your hottest leads right now:\n\n🔥 **Sarah Chen** (TechCorp) - Score: 94\n   Ready to buy, last engaged 2 hours ago\n\n🔥 **Mike Johnson** (StartupXYZ) - Score: 91\n   Requested pricing, demo scheduled\n\n🔥 **Lisa Park** (GlobalInc) - Score: 88\n   Multiple page visits today\n\nWant me to draft outreach for any of them?",
        "I've scored your 15 new leads from yesterday:\n\n• **5 Hot** (score 80+) - Immediate follow-up\n• **7 Warm** (score 50-79) - Add to nurture\n• **3 Cold** (score <50) - Long-term nurture\n\nShould I create tasks for the hot leads?",
      ],
      research: [
        "Here's what I found on **Acme Corp**:\n\n📍 **Industry**: Enterprise Software\n👥 **Size**: 500-1000 employees\n💰 **Revenue**: ~$50M ARR\n📰 **Recent News**: Just raised Series C\n\n**Key Decision Makers**:\n• Jane Smith - VP of Sales\n• Tom Brown - CTO\n\nWant me to find their contact info?",
        "Found 3 decision makers at TechStart:\n\n1. **Alex Rivera** - CEO\n   LinkedIn: Connected 2nd degree\n\n2. **Maria Santos** - Head of Ops\n   Recently posted about automation\n\n3. **James Lee** - VP Engineering\n   Attended your webinar last month\n\nShall I draft personalized outreach?",
      ],
    };

    const capabilityResponses = responses[capability] || responses.workflow;
    return capabilityResponses[Math.floor(Math.random() * capabilityResponses.length)];
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

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv.id);
    setSelectedCapability(conv.capability);
    setMessages(conv.messages);
    setLeftPanelView("history");
  };

  const handleNewConversation = () => {
    setSelectedConversation(null);
    setMessages([]);
    setLeftPanelView("capabilities");
    toast.success("Started new conversation");
  };

  const handleDeleteConversation = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (selectedConversation === convId) {
      setSelectedConversation(null);
      setMessages([]);
    }
    toast.success("Conversation deleted");
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
          <h1 className="text-3xl font-bold text-gray-900">AI Assistant</h1>
          <p className="text-gray-500 mt-1">Your intelligent assistant for workflow automation and insights</p>
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
                    <h3 className="font-semibold text-[15px] text-gray-900">AI Assistant</h3>
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
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 transition-all"
                                aria-label={`Delete conversation: ${conv.title}`}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
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
                Press Enter to send • AI responses are simulated for demo purposes
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
