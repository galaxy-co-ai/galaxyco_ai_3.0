"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CustomCalendar } from "@/components/ui/custom-calendar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Activity,
  BarChart3,
  Bot, 
  Brain,
  Calendar,
  CheckCircle2, 
  ChevronRight,
  Clock, 
  History,
  Lightbulb,
  Sparkles,
  CalendarDays,
  MessageSquare,
  Mail,
  FileText,
  Target,
  Database,
  List,
  AlertCircle,
  Send,
  ArrowRight,
  Zap,
  Loader2,
  Trash2,
  TrendingUp,
  Users,
  DollarSign,
  Eye,
  MousePointer,
  Star,
  RefreshCw,
  Megaphone,
  Plus,
  Workflow,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import type { DashboardData } from "@/types/dashboard";

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then((r) => r.json());

type TabType = 'assistant' | 'snapshot' | 'automations' | 'planner';

interface DashboardDashboardProps {
  initialData?: DashboardData;
  initialTab?: TabType;
  /**
   * When true, disables live API calls so the dashboard runs in demo mode.
   * Used on marketing/feature pages to avoid 404s and auth errors.
   */
  disableLiveData?: boolean;
}

interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AssistantConversation {
  id: string;
  title: string;
  preview: string;
  capability: string;
  messages: AssistantMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface AssistantCapability {
  id: string;
  title: string;
  description: string;
  icon: typeof Mail;
  color: string;
  bgColor: string;
  borderColor: string;
  examples: string[];
  category: string;
}

type AssistantLeftPanelView = "capabilities" | "history";

export default function DashboardDashboard({ initialData, initialTab = 'assistant', disableLiveData = false }: DashboardDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [date, setDate] = useState<Date | undefined>(new Date()); // Current date
  const [messageInput, setMessageInput] = useState("");
  const [agentMessageInput, setAgentMessageInput] = useState("");
  const [selectedConversation, setSelectedConversation] = useState(0); // Track selected conversation
  const [selectedAgent, setSelectedAgent] = useState(0); // Track selected agent
  const [isLoadingChat, setIsLoadingChat] = useState(false); // Loading state for AI chat
  const [isLoadingAgentChat, setIsLoadingAgentChat] = useState(false); // Loading state for agent chat
  const [agentConversations, setAgentConversations] = useState<Record<string, Array<{ id: string; role: string; content: string; timestamp: Date }>>>({});
  const [agentConversationIds, setAgentConversationIds] = useState<Record<string, string>>({});
  const [calendarEvents, setCalendarEvents] = useState<Array<{
    id: string;
    title: string;
    description: string | null;
    startTime: string;
    endTime: string;
    location: string | null;
    meetingUrl: string | null;
    isAllDay: boolean;
    tags: string[];
  }>>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  // Fetch live dashboard stats (refreshes every 30 seconds). When disableLiveData
  // is true (marketing/demo usage), we pass a null key to SWR to avoid any
  // network calls and rely entirely on initialData.
  const dashboardKey = disableLiveData ? null : '/api/dashboard';
  const { data: liveStats, error: statsError, isLoading: isLoadingStats } = useSWR(dashboardKey, fetcher, {
    refreshInterval: 30000, // 30 seconds
    fallbackData: initialData,
  });

  // Fetch agents list (refreshes every 30 seconds)
  const agentsKey = disableLiveData ? null : '/api/agents';
  const { data: agentsData, error: agentsError, isLoading: isLoadingAgents } = useSWR(agentsKey, fetcher, {
    refreshInterval: 30000, // 30 seconds
  });

  // Use live stats if available, otherwise fall back to initialData
  const stats = liveStats?.stats || initialData?.stats;

  // AI Chat Messages State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai', message: string, time: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // AI Chat Handler
  const sendToAssistant = async (message: string) => {
    if (!message.trim()) return;
    
    // Add user message to chat
    const userMessage = {
      sender: 'user' as const,
      message: message.trim(),
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, userMessage]);
    setMessageInput('');
    setIsLoadingChat(true);
    
    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to send message');
      }
      
      const data = await res.json();
      
      // Add AI response to chat
      const aiMessage = {
        sender: 'ai' as const,
        message: data.message.content,
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, aiMessage]);
      toast.success('AI Assistant responded!');
    } catch (err) {
      toast.error('Failed to send message. Please try again.');
      // Remove user message on error
      setChatMessages(prev => prev.slice(0, -1));
      setMessageInput(message); // Restore the message
    } finally {
      setIsLoadingChat(false);
    }
  };

  // Handle suggestion chip click
  const handleSuggestionClick = (question: string) => {
    setMessageInput(question);
    sendToAssistant(question);
  };

  // Handle enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoadingChat) {
      sendToAssistant(messageInput);
    }
  };

  // Agent Chat: Load conversation history when selecting an agent
  const loadAgentConversation = async (agentId: string) => {
    try {
      const res = await fetch(`/api/agents/${agentId}/chat`);
      if (!res.ok) return;
      
      const data = await res.json();
      if (data.messages && data.messages.length > 0) {
        setAgentConversations(prev => ({
          ...prev,
          [agentId]: data.messages,
        }));
        if (data.conversation?.id) {
          setAgentConversationIds(prev => ({
            ...prev,
            [agentId]: data.conversation.id,
          }));
        }
      }
    } catch (error) {
      logger.error('Failed to load agent conversation', error);
    }
  };

  // Agent Chat: Send message to agent
  const sendToAgent = async (agentId: string, message: string) => {
    if (!message.trim() || isLoadingAgentChat) return;
    
    const userMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
    };
    
    // Optimistically add user message
    setAgentConversations(prev => ({
      ...prev,
      [agentId]: [...(prev[agentId] || []), userMessage],
    }));
    setAgentMessageInput('');
    setIsLoadingAgentChat(true);
    
    try {
      const res = await fetch(`/api/agents/${agentId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          conversationId: agentConversationIds[agentId],
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to send message');
      }
      
      const data = await res.json();
      
      // Save conversation ID for future messages
      if (data.conversationId) {
        setAgentConversationIds(prev => ({
          ...prev,
          [agentId]: data.conversationId,
        }));
      }
      
      // Add assistant response
      const assistantMessage = {
        id: data.message.id,
        role: 'assistant',
        content: data.message.content,
        timestamp: new Date(data.message.timestamp),
      };
      
      setAgentConversations(prev => ({
        ...prev,
        [agentId]: [...(prev[agentId] || []), assistantMessage],
      }));
    } catch (error) {
      logger.error('Failed to send message to agent', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
      // Remove the optimistic user message on error
      setAgentConversations(prev => ({
        ...prev,
        [agentId]: (prev[agentId] || []).filter(m => m.id !== userMessage.id),
      }));
    } finally {
      setIsLoadingAgentChat(false);
    }
  };

  // Agent Chat: Handle enter key press
  const handleAgentKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, agentId: string) => {
    if (e.key === 'Enter' && !isLoadingAgentChat) {
      sendToAgent(agentId, agentMessageInput);
    }
  };

  // Planner: Fetch calendar events for selected date
  const fetchCalendarEvents = async (selectedDate: Date) => {
    setIsLoadingEvents(true);
    try {
      // Get start and end of the selected day
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const res = await fetch(
        `/api/calendar/events?startDate=${startOfDay.toISOString()}&endDate=${endOfDay.toISOString()}`
      );
      
      if (!res.ok) {
        // Silently handle auth or server errors - just show empty calendar
        setCalendarEvents([]);
        return;
      }
      
      const data = await res.json();
      setCalendarEvents(data.events || []);
    } catch {
      // Network or parsing error - show empty calendar
      setCalendarEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // Fetch events when date changes (disabled in demo mode)
  useEffect(() => {
    if (date && !disableLiveData) {
      fetchCalendarEvents(date);
    }
  }, [date, disableLiveData]);

  // Top stat badges (using live stats)
  const statBadges = [
    { label: `${stats?.activeAgents ?? 0} Active Agents`, icon: Activity, color: "bg-blue-100 text-blue-700" },
    { label: `${stats?.tasksCompleted ?? 0} Tasks Completed`, icon: CheckCircle2, color: "bg-green-100 text-green-700" },
    { label: `${stats?.hoursSaved ?? 0} Hours Saved`, icon: Clock, color: "bg-purple-100 text-purple-700" },
  ];

  // Tab configuration (note: actual tabs array is defined after agentsList for proper access)

  // AI Assistant data
  const [assistantLeftView, setAssistantLeftView] = useState<AssistantLeftPanelView>("capabilities");
  const [selectedCapability, setSelectedCapability] = useState<string>("workflow");
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([]);
  const [assistantInput, setAssistantInput] = useState("");
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  const assistantMessagesEndRef = useRef<HTMLDivElement>(null);

  const [assistantConversations, setAssistantConversations] = useState<AssistantConversation[]>(() => {
    const now = Date.now();
    return [
      { id: "conv-1", title: "Lead follow-up workflow", preview: "Create a workflow to follow up...", capability: "workflow", messages: [{ id: "1", role: "user", content: "Create a workflow to follow up with leads", timestamp: new Date(now - 86400000) }, { id: "2", role: "assistant", content: "I can help you create that workflow!", timestamp: new Date(now - 86400000) }], createdAt: new Date(now - 86400000), updatedAt: new Date(now - 86400000) },
      { id: "conv-2", title: "Sales pipeline analysis", preview: "Analyze my sales pipeline...", capability: "insights", messages: [{ id: "1", role: "user", content: "Analyze my sales pipeline", timestamp: new Date(now - 172800000) }, { id: "2", role: "assistant", content: "Your pipeline health is strong at $1.2M", timestamp: new Date(now - 172800000) }], createdAt: new Date(now - 172800000), updatedAt: new Date(now - 172800000) },
      { id: "conv-3", title: "Email draft for John", preview: "Write a follow-up email...", capability: "content", messages: [{ id: "1", role: "user", content: "Write a follow-up email", timestamp: new Date(now - 259200000) }, { id: "2", role: "assistant", content: "I've drafted a professional follow-up email", timestamp: new Date(now - 259200000) }], createdAt: new Date(now - 259200000), updatedAt: new Date(now - 259200000) },
    ];
  });

  const assistantCapabilities: AssistantCapability[] = [
    { id: "workflow", title: "Workflow Automation", description: "Create automated workflows", icon: Workflow, color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200", examples: ["Create a workflow to follow up with leads", "Automate my email responses"], category: "Automation" },
    { id: "insights", title: "Data Insights", description: "Get AI-powered analytics", icon: BarChart3, color: "text-purple-600", bgColor: "bg-purple-50", borderColor: "border-purple-200", examples: ["Analyze my sales pipeline", "Show me top performing campaigns"], category: "Analytics" },
    { id: "content", title: "Content Generation", description: "Generate emails and documents", icon: FileText, color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200", examples: ["Write a follow-up email", "Draft a proposal"], category: "Content" },
    { id: "scheduling", title: "Smart Scheduling", description: "Manage calendar and meetings", icon: Calendar, color: "text-orange-600", bgColor: "bg-orange-50", borderColor: "border-orange-200", examples: ["Find a time to meet", "Block focus time"], category: "Productivity" },
    { id: "leads", title: "Lead Intelligence", description: "Score and prioritize leads", icon: Target, color: "text-cyan-600", bgColor: "bg-cyan-50", borderColor: "border-cyan-200", examples: ["Who are my hottest leads?", "Score the leads"], category: "Sales" },
    { id: "research", title: "Research Assistant", description: "Research companies and contacts", icon: Brain, color: "text-indigo-600", bgColor: "bg-indigo-50", borderColor: "border-indigo-200", examples: ["Research Acme Corp", "Find decision makers"], category: "Research" },
  ];

  const selectedCapabilityData = assistantCapabilities.find(c => c.id === selectedCapability) || assistantCapabilities[0];
  
  const scrollAssistantToBottom = () => { assistantMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  useEffect(() => { scrollAssistantToBottom(); }, [assistantMessages]);

  const getAssistantResponse = (capability: string): string => {
    const responses: Record<string, string> = {
      workflow: "I can help you create that workflow! Let me set up an automation that:\n\n1. Triggers on new lead\n2. Sends welcome email\n3. Waits 2 days, then follows up\n\nShall I create this?",
      insights: "Based on your data:\n\n📈 **Pipeline**: $1.2M value\n🎯 **Win Rate**: 23.5%\n🔥 **Hot Leads**: 42\n\nWant me to dig deeper?",
      content: "I've drafted a follow-up email:\n\n**Subject**: Great connecting!\n\nHi [Name],\n\nIt was wonderful speaking with you...\n\nWant me to personalize this further?",
      scheduling: "I found 3 available slots:\n\n1. Tomorrow 2:00 PM\n2. Thursday 10:00 AM\n3. Friday 3:30 PM\n\nWhich works best?",
      leads: "Here are your hottest leads:\n\n🔥 **Sarah Chen** - Score: 94\n🔥 **Mike Johnson** - Score: 91\n🔥 **Lisa Park** - Score: 88\n\nWant me to draft outreach?",
      research: "Here's what I found:\n\n📍 **Industry**: Enterprise Software\n👥 **Size**: 500-1000 employees\n💰 **Revenue**: ~$50M ARR\n\nWant their contact info?",
    };
    return responses[capability] || responses.workflow;
  };

  const handleAssistantSend = () => {
    if (!assistantInput.trim() || isAssistantLoading) return;
    const userMsg: AssistantMessage = { id: Date.now().toString(), role: "user", content: assistantInput, timestamp: new Date() };
    setAssistantMessages(prev => [...prev, userMsg]);
    setAssistantInput("");
    setIsAssistantLoading(true);
    setTimeout(() => {
      const aiMsg: AssistantMessage = { id: (Date.now() + 1).toString(), role: "assistant", content: getAssistantResponse(selectedCapability), timestamp: new Date() };
      setAssistantMessages(prev => [...prev, aiMsg]);
      setIsAssistantLoading(false);
    }, 1200);
  };

  const handleSelectConvo = (conv: AssistantConversation) => { setSelectedConvoId(conv.id); setSelectedCapability(conv.capability); setAssistantMessages(conv.messages); setAssistantLeftView("history"); };
  const handleNewConvo = () => { setSelectedConvoId(null); setAssistantMessages([]); setAssistantLeftView("capabilities"); toast.success("Started new conversation"); };
  const handleDeleteConvo = (convId: string, e: React.MouseEvent) => { e.stopPropagation(); setAssistantConversations(prev => prev.filter(c => c.id !== convId)); if (selectedConvoId === convId) { setSelectedConvoId(null); setAssistantMessages([]); } toast.success("Conversation deleted"); };
  const formatRelativeTime = (date: Date) => { const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)); if (diffDays === 0) return "Today"; if (diffDays === 1) return "Yesterday"; if (diffDays < 7) return `${diffDays} days ago`; return date.toLocaleDateString(); };
  const getCapIcon = (capId: string) => assistantCapabilities.find(c => c.id === capId)?.icon || MessageSquare;
  const getCapColor = (capId: string) => assistantCapabilities.find(c => c.id === capId)?.color || "text-gray-600";
  const getCapBgColor = (capId: string) => assistantCapabilities.find(c => c.id === capId)?.bgColor || "bg-gray-50";

  // Snapshot categories
  const [selectedCategory, setSelectedCategory] = useState<string>("sales");

  interface PerformanceMetric {
    label: string;
    value: string | number;
    change?: string;
    trend?: "up" | "down" | "neutral";
    icon: typeof Activity;
  }

  interface Category {
    id: string;
    name: string;
    description: string;
    icon: typeof Target;
    iconColor: string;
    metrics: PerformanceMetric[];
    insights: string[];
    score: number;
  }

  const categories: Category[] = [
    {
      id: "sales",
      name: "Sales Performance",
      description: "Lead conversion, pipeline health, and revenue metrics",
      icon: Target,
      iconColor: "bg-blue-500",
      score: 87,
      metrics: [
        { label: "Total Leads", value: 247, change: "+12%", trend: "up", icon: Users },
        { label: "Hot Leads", value: 42, change: "+8", trend: "up", icon: Zap },
        { label: "Conversion Rate", value: "23.5%", change: "+2.3%", trend: "up", icon: TrendingUp },
        { label: "Avg Deal Size", value: "$24,500", change: "+$2,100", trend: "up", icon: DollarSign },
        { label: "Pipeline Value", value: "$1.2M", change: "+$180K", trend: "up", icon: Database },
        { label: "Time to Close", value: "18 days", change: "-3 days", trend: "up", icon: Clock },
      ],
      insights: [
        "Lead qualification rate improved 28% after implementing new scoring criteria",
        "3 high-value leads need follow-up — qualified in last 24h",
        "Average deal size increased 9% this month",
        "Pipeline velocity improved by 15% with automated follow-ups"
      ]
    },
    {
      id: "marketing",
      name: "Marketing Performance",
      description: "Campaign effectiveness, engagement, and ROI",
      icon: Megaphone,
      iconColor: "bg-pink-500",
      score: 82,
      metrics: [
        { label: "Active Campaigns", value: 8, change: "+2", trend: "up", icon: Activity },
        { label: "Email Open Rate", value: "34.2%", change: "+5.1%", trend: "up", icon: Mail },
        { label: "Click-Through Rate", value: "8.7%", change: "+1.2%", trend: "up", icon: MousePointer },
        { label: "Marketing ROI", value: "285%", change: "+45%", trend: "up", icon: TrendingUp },
        { label: "Cost Per Lead", value: "$42", change: "-$8", trend: "up", icon: DollarSign },
        { label: "Content Views", value: "12.5K", change: "+2.1K", trend: "up", icon: Eye },
      ],
      insights: [
        "Email subject line optimization increased open rates by 28%",
        "Q4 campaign performing 45% above target",
        "Social media engagement up 34% month-over-month",
        "Content marketing driving 60% of qualified leads"
      ]
    },
    {
      id: "operations",
      name: "Operations Efficiency",
      description: "Workflow automation, task completion, and time savings",
      icon: Zap,
      iconColor: "bg-green-500",
      score: 94,
      metrics: [
        { label: "Tasks Completed", value: 342, change: "+48", trend: "up", icon: CheckCircle2 },
        { label: "Hours Saved", value: "124 hrs", change: "+18 hrs", trend: "up", icon: Clock },
        { label: "Automation Rate", value: "78%", change: "+12%", trend: "up", icon: Bot },
        { label: "Process Efficiency", value: "92%", change: "+5%", trend: "up", icon: TrendingUp },
        { label: "Error Rate", value: "2.1%", change: "-0.8%", trend: "up", icon: AlertCircle },
        { label: "Response Time", value: "4.2 min", change: "-1.8 min", trend: "up", icon: Clock },
      ],
      insights: [
        "Workflow automation saved 2.5 hours today — on track for 62 hours this month",
        "Invoice processing time reduced to avg. 4.2 minutes (down from 12 minutes)",
        "Task completion rate increased 18% with automated workflows",
        "Error rate decreased 28% with AI quality checks"
      ]
    },
    {
      id: "agents",
      name: "Agent Performance",
      description: "AI agent activity, accuracy, and productivity",
      icon: Bot,
      iconColor: "bg-purple-500",
      score: 91,
      metrics: [
        { label: "Active Agents", value: 7, change: "+1", trend: "up", icon: Activity },
        { label: "Tasks Processed", value: "1,247", change: "+189", trend: "up", icon: CheckCircle2 },
        { label: "Accuracy Rate", value: "94.2%", change: "+2.1%", trend: "up", icon: Target },
        { label: "Avg Response Time", value: "2.3 sec", change: "-0.5 sec", trend: "up", icon: Clock },
        { label: "Uptime", value: "99.8%", change: "+0.2%", trend: "up", icon: Activity },
        { label: "User Satisfaction", value: "4.7/5", change: "+0.3", trend: "up", icon: Star },
      ],
      insights: [
        "Email Triage Agent processed 47 emails with 94% accuracy today",
        "Lead Qualifier scored 426 leads this month with 78% accuracy",
        "Meeting Notes Generator created 23 comprehensive briefs this week",
        "All agents operating at 99.8% uptime this month"
      ]
    },
    {
      id: "data",
      name: "Data Quality",
      description: "CRM health, data completeness, and accuracy",
      icon: Database,
      iconColor: "bg-cyan-500",
      score: 94,
      metrics: [
        { label: "Data Quality Score", value: "94%", change: "+7%", trend: "up", icon: Target },
        { label: "Duplicate Contacts", value: 12, change: "-22", trend: "up", icon: Users },
        { label: "Complete Profiles", value: "87%", change: "+12%", trend: "up", icon: CheckCircle2 },
        { label: "Data Enrichment", value: "1,234", change: "+234", trend: "up", icon: Sparkles },
        { label: "Sync Accuracy", value: "98.5%", change: "+1.2%", trend: "up", icon: RefreshCw },
        { label: "Missing Fields", value: "3.2%", change: "-2.1%", trend: "up", icon: AlertCircle },
      ],
      insights: [
        "CRM data quality score: 94% (up from 87% last month)",
        "34 duplicate contacts merged and enriched automatically",
        "Data enrichment added 234 new company profiles this week",
        "Sync accuracy improved to 98.5% with new validation rules"
      ]
    },
    {
      id: "automation",
      name: "Automation Health",
      description: "Workflow status, success rates, and optimization",
      icon: Sparkles,
      iconColor: "bg-indigo-500",
      score: 89,
      metrics: [
        { label: "Active Workflows", value: 24, change: "+4", trend: "up", icon: Activity },
        { label: "Success Rate", value: "96.8%", change: "+2.3%", trend: "up", icon: CheckCircle2 },
        { label: "Failed Runs", value: 8, change: "-12", trend: "up", icon: AlertCircle },
        { label: "Avg Execution Time", value: "3.4 sec", change: "-0.8 sec", trend: "up", icon: Clock },
        { label: "Cost Savings", value: "$8,400", change: "+$1,200", trend: "up", icon: DollarSign },
        { label: "Optimization Score", value: "92%", change: "+5%", trend: "up", icon: TrendingUp },
      ],
      insights: [
        "24 active workflows running smoothly with 96.8% success rate",
        "Automation cost savings increased 17% this month",
        "Failed runs decreased 60% after optimization",
        "Average execution time improved 19% with performance tuning"
      ]
    },
  ];

  // Automations data
  const [selectedAutomation, setSelectedAutomation] = useState<string>("auto-email");

  interface Automation {
    id: string;
    title: string;
    description: string;
    status: "active" | "paused" | "available";
    icon: typeof Mail;
    iconColor: string;
    nodeCount: number;
    valueScore: number; // 1-10, higher = more valuable
    difficulty: "Easy" | "Medium" | "Advanced";
    timeSaved: string;
  }

  interface AutomationNode {
    id: string;
    type: "trigger" | "action" | "condition" | "delay";
    title: string;
    description: string;
    icon: typeof Mail;
    iconColor: string;
  }

  const automations: any[] = [
    {
      id: "auto-email",
      title: "Auto-respond to emails",
      description: "Automatically respond to incoming emails with AI-generated replies",
      status: "available",
      icon: Mail,
      iconColor: "bg-blue-500",
      nodeCount: 4,
      valueScore: 10,
      difficulty: "Easy",
      timeSaved: "2-3 hours/week",
    },
    {
      id: "score-leads",
      title: "Score and prioritize leads",
      description: "AI analyzes and scores new leads based on engagement and fit",
      status: "available",
      icon: Target,
      iconColor: "bg-purple-500",
      nodeCount: 5,
      valueScore: 9,
      difficulty: "Easy",
      timeSaved: "5+ hours/week",
    },
    {
      id: "meeting-brief",
      title: "Generate meeting briefs",
      description: "Auto-generate meeting briefs from contact history and context",
      status: "available",
      icon: FileText,
      iconColor: "bg-green-500",
      nodeCount: 3,
      valueScore: 9,
      difficulty: "Easy",
      timeSaved: "30 min/meeting",
    },
    {
      id: "daily-digest",
      title: "Create daily action digest",
      description: "Generate morning summary with top priorities and tasks",
      status: "available",
      icon: CalendarDays,
      iconColor: "bg-orange-500",
      nodeCount: 3,
      valueScore: 8,
      difficulty: "Easy",
      timeSaved: "15 min/day",
    },
    {
      id: "follow-up",
      title: "Follow-up reminders",
      description: "Send reminders for leads that need follow-up after 7 days",
      status: "available",
      icon: Clock,
      iconColor: "bg-amber-500",
      nodeCount: 4,
      valueScore: 8,
      difficulty: "Easy",
      timeSaved: "1 hour/week",
    },
    {
      id: "sync-crm",
      title: "Sync contacts to CRM",
      description: "Automatically sync contact data and resolve duplicates",
      status: "available",
      icon: Database,
      iconColor: "bg-cyan-500",
      nodeCount: 4,
      valueScore: 7,
      difficulty: "Medium",
      timeSaved: "1-2 hours/week",
    },
    {
      id: "enrich-leads",
      title: "Enrich lead data",
      description: "Automatically enrich lead profiles with company and contact data",
      status: "available",
      icon: Sparkles,
      iconColor: "bg-indigo-500",
      nodeCount: 3,
      valueScore: 7,
      difficulty: "Medium",
      timeSaved: "2 hours/week",
    },
    {
      id: "deal-stage",
      title: "Auto-advance deal stages",
      description: "Move deals to next stage based on activity and probability",
      status: "available",
      icon: TrendingUp,
      iconColor: "bg-emerald-500",
      nodeCount: 5,
      valueScore: 8,
      difficulty: "Advanced",
      timeSaved: "1 hour/week",
    },
  ].sort((a, b) => {
    // Sort by highest value first, then easiest
    if (b.valueScore !== a.valueScore) {
      return b.valueScore - a.valueScore;
    }
    const difficultyOrder: Record<string, number> = { Easy: 1, Medium: 2, Advanced: 3 };
    return (difficultyOrder[a.difficulty] ?? 2) - (difficultyOrder[b.difficulty] ?? 2);
  });

  const getAutomationNodes = (automationId: string): AutomationNode[] => {
    switch (automationId) {
      case "auto-email":
        return [
          {
            id: "1",
            type: "trigger",
            title: "New email received",
            description: "Triggered when an email arrives in inbox",
            icon: Mail,
            iconColor: "bg-blue-500",
          },
          {
            id: "2",
            type: "condition",
            title: "Check if auto-reply needed",
            description: "Analyze email content and sender to determine if response is needed",
            icon: Target,
            iconColor: "bg-purple-500",
          },
          {
            id: "3",
            type: "action",
            title: "Generate AI response",
            description: "Create contextual reply using AI based on email content",
            icon: Sparkles,
            iconColor: "bg-indigo-500",
          },
          {
            id: "4",
            type: "action",
            title: "Send response",
            description: "Send the generated reply to the sender",
            icon: Mail,
            iconColor: "bg-green-500",
          },
        ];
      case "score-leads":
        return [
          {
            id: "1",
            type: "trigger",
            title: "New lead created",
            description: "Triggered when a new lead is added to the system",
            icon: Users,
            iconColor: "bg-blue-500",
          },
          {
            id: "2",
            type: "action",
            title: "Enrich lead data",
            description: "Gather company information, industry, and contact details",
            icon: Sparkles,
            iconColor: "bg-indigo-500",
          },
          {
            id: "3",
            type: "action",
            title: "Analyze engagement",
            description: "Review email opens, clicks, website visits, and interactions",
            icon: Target,
            iconColor: "bg-purple-500",
          },
          {
            id: "4",
            type: "action",
            title: "Calculate score",
            description: "Generate AI score (0-100) based on fit, engagement, and signals",
            icon: TrendingUp,
            iconColor: "bg-emerald-500",
          },
          {
            id: "5",
            type: "action",
            title: "Assign priority",
            description: "Categorize as Hot (≥70), Warm (50-69), or Cold (<50)",
            icon: CheckCircle2,
            iconColor: "bg-green-500",
          },
        ];
      case "meeting-brief":
        return [
          {
            id: "1",
            type: "trigger",
            title: "Meeting scheduled",
            description: "Triggered when a calendar event is created or updated",
            icon: CalendarDays,
            iconColor: "bg-blue-500",
          },
          {
            id: "2",
            type: "action",
            title: "Gather context",
            description: "Collect contact history, emails, deals, and notes from 8+ sources",
            icon: FileText,
            iconColor: "bg-indigo-500",
          },
          {
            id: "3",
            type: "action",
            title: "Generate brief",
            description: "Create comprehensive meeting brief with key talking points",
            icon: Sparkles,
            iconColor: "bg-green-500",
          },
        ];
      case "daily-digest":
        return [
          {
            id: "1",
            type: "trigger",
            title: "Daily at 8:00 AM",
            description: "Scheduled to run every morning at 8:00 AM",
            icon: Clock,
            iconColor: "bg-blue-500",
          },
          {
            id: "2",
            type: "action",
            title: "Compile priorities",
            description: "Gather top 10 priorities: hot leads, deals to close, follow-ups",
            icon: Target,
            iconColor: "bg-indigo-500",
          },
          {
            id: "3",
            type: "action",
            title: "Generate summary",
            description: "Create morning digest email with actionable items",
            icon: FileText,
            iconColor: "bg-green-500",
          },
        ];
      case "follow-up":
        return [
          {
            id: "1",
            type: "trigger",
            title: "Daily check",
            description: "Runs daily to check for leads needing follow-up",
            icon: Clock,
            iconColor: "bg-blue-500",
          },
          {
            id: "2",
            type: "condition",
            title: "Check last contact",
            description: "Find leads with no contact in 7+ days",
            icon: Target,
            iconColor: "bg-purple-500",
          },
          {
            id: "3",
            type: "action",
            title: "Create reminder",
            description: "Generate follow-up task and notification",
            icon: AlertCircle,
            iconColor: "bg-amber-500",
          },
          {
            id: "4",
            type: "action",
            title: "Send notification",
            description: "Notify assigned user about follow-up needed",
            icon: Mail,
            iconColor: "bg-green-500",
          },
        ];
      case "sync-crm":
        return [
          {
            id: "1",
            type: "trigger",
            title: "Contact updated",
            description: "Triggered when contact data changes in CRM",
            icon: RefreshCw,
            iconColor: "bg-blue-500",
          },
          {
            id: "2",
            type: "action",
            title: "Check for duplicates",
            description: "Identify potential duplicate contacts in CRM",
            icon: Target,
            iconColor: "bg-purple-500",
          },
          {
            id: "3",
            type: "condition",
            title: "Resolve duplicates",
            description: "Merge or update existing records if duplicates found",
            icon: CheckCircle2,
            iconColor: "bg-amber-500",
          },
          {
            id: "4",
            type: "action",
            title: "Sync to CRM",
            description: "Update or create contact record in CRM",
            icon: RefreshCw,
            iconColor: "bg-green-500",
          },
        ];
      case "enrich-leads":
        return [
          {
            id: "1",
            type: "trigger",
            title: "New lead added",
            description: "Triggered when a lead is created with minimal data",
            icon: Users,
            iconColor: "bg-blue-500",
          },
          {
            id: "2",
            type: "action",
            title: "Fetch company data",
            description: "Look up company information, industry, size, revenue",
            icon: Sparkles,
            iconColor: "bg-indigo-500",
          },
          {
            id: "3",
            type: "action",
            title: "Update lead profile",
            description: "Enrich lead with gathered company and contact data",
            icon: CheckCircle2,
            iconColor: "bg-green-500",
          },
        ];
      case "deal-stage":
        return [
          {
            id: "1",
            type: "trigger",
            title: "Deal activity detected",
            description: "Triggered when deal has new activity or updates",
            icon: TrendingUp,
            iconColor: "bg-blue-500",
          },
          {
            id: "2",
            type: "condition",
            title: "Check probability",
            description: "Evaluate deal probability and stage criteria",
            icon: Target,
            iconColor: "bg-purple-500",
          },
          {
            id: "3",
            type: "condition",
            title: "Check activity level",
            description: "Review recent interactions, meetings, and engagement",
            icon: Activity,
            iconColor: "bg-amber-500",
          },
          {
            id: "4",
            type: "action",
            title: "Advance stage",
            description: "Move deal to next stage if criteria met",
            icon: ArrowRight,
            iconColor: "bg-emerald-500",
          },
          {
            id: "5",
            type: "action",
            title: "Update probability",
            description: "Recalculate and update deal probability score",
            icon: TrendingUp,
            iconColor: "bg-green-500",
          },
        ];
      default:
        return [];
    }
  };

  const getNodeTypeLabel = (type: string) => {
    switch (type) {
      case "trigger":
        return "Trigger";
      case "action":
        return "Action";
      case "condition":
        return "Condition";
      case "delay":
        return "Delay";
      default:
        return type;
    }
  };

  const getNodeTypeColor = (type: string) => {
    switch (type) {
      case "trigger":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "action":
        return "bg-green-50 text-green-700 border-green-200";
      case "condition":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "delay":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  // Events for Planner tab are now fetched dynamically via fetchCalendarEvents

  // Messages data with conversations for each person
  const messagesList = [
    { 
      name: "Sarah Chen", 
      initials: "SC", 
      color: "bg-purple-500",
      message: "FYI - Lead Qualifier just scored 8 new leads...",
      time: "2:28 PM",
      unread: 2,
      status: "Active now",
      conversation: [
        {
          sender: "Sarah Chen",
          message: "Hey team! The Email Triage Agent just processed 47 high-priority emails in the last hour. Looking great! 🎉",
          time: "9:42 AM",
          isUser: false
        },
        {
          sender: "You",
          message: "Awesome! Did it flag anything urgent?",
          time: "9:43 AM",
          isUser: true
        },
        {
          sender: "Sarah Chen",
          message: "Yes. 3 emails from TechCorp about the enterprise deal. Already added to your high-priority list.",
          time: "9:44 AM",
          isUser: false
        },
        {
          sender: "Sarah Chen",
          message: "FYI - Lead Qualifier just scored 8 new leads from the webinar yesterday. All look promising!",
          time: "2:28 PM",
          isUser: false
        },
      ]
    },
    { 
      name: "Marcus Rodriguez", 
      initials: "MR", 
      color: "bg-green-500",
      message: "The AI also suggested 12 additional fields...",
      time: "10:17 AM",
      status: "Active 15m ago",
      conversation: [
        {
          sender: "Marcus Rodriguez",
          message: "The CRM Data Cleaner found 34 duplicate contacts this morning.",
          time: "9:00 AM",
          isUser: false
        },
        {
          sender: "You",
          message: "Great! Did it auto-merge them?",
          time: "9:05 AM",
          isUser: true
        },
        {
          sender: "Marcus Rodriguez",
          message: "Yes, all merged and enriched. The AI also suggested 12 additional fields we should track.",
          time: "10:17 AM",
          isUser: false
        },
      ]
    },
    { 
      name: "Emily Park", 
      initials: "EP", 
      color: "bg-orange-500",
      message: "Already done! Also created action items for follow-ups.",
      time: "11:05 AM",
      status: "Active 1h ago",
      conversation: [
        {
          sender: "You",
          message: "Can you prepare the meeting notes for the client call?",
          time: "10:45 AM",
          isUser: true
        },
        {
          sender: "Emily Park",
          message: "Already done! Also created action items for follow-ups. Check the shared folder.",
          time: "11:05 AM",
          isUser: false
        },
      ]
    },
    { 
      name: "Alex Thompson", 
      initials: "AT", 
      color: "bg-cyan-500",
      message: "The automation workflow saved us 4 hours today.",
      time: "Yesterday",
      status: "Yesterday at 4:30 PM",
      conversation: [
        {
          sender: "Alex Thompson",
          message: "Just finished setting up the new automation workflow for lead qualification.",
          time: "Yesterday, 3:15 PM",
          isUser: false
        },
        {
          sender: "You",
          message: "How's it performing?",
          time: "Yesterday, 3:20 PM",
          isUser: true
        },
        {
          sender: "Alex Thompson",
          message: "The automation workflow saved us 4 hours today. Processed 150 leads with 92% accuracy!",
          time: "Yesterday, 4:30 PM",
          isUser: false
        },
      ]
    },
    { 
      name: "Jordan Lee", 
      initials: "JL", 
      color: "bg-pink-500",
      message: "Can you check the new integration settings?",
      time: "Monday",
      unread: 1,
      status: "Monday at 2:45 PM",
      conversation: [
        {
          sender: "Jordan Lee",
          message: "I updated the integration settings for Salesforce. Can you check if everything looks good?",
          time: "Monday, 2:45 PM",
          isUser: false
        },
        {
          sender: "Jordan Lee",
          message: "Also enabled the auto-sync feature. Should save us a lot of manual work.",
          time: "Monday, 2:46 PM",
          isUser: false
        },
      ]
    },
    { 
      name: "David Kim", 
      initials: "DK", 
      color: "bg-blue-500",
      message: "New leads from the webinar are ready for review",
      time: "Tuesday",
      status: "Tuesday at 11:20 AM",
      conversation: [
        {
          sender: "David Kim",
          message: "New leads from the webinar are ready for review. Looks like we got 47 sign-ups!",
          time: "Tuesday, 11:20 AM",
          isUser: false
        },
        {
          sender: "You",
          message: "Excellent! Any standout prospects?",
          time: "Tuesday, 11:25 AM",
          isUser: true
        },
        {
          sender: "David Kim",
          message: "Yes! 8 enterprise leads. I'll send over the detailed breakdown.",
          time: "Tuesday, 11:30 AM",
          isUser: false
        },
      ]
    },
    { 
      name: "Lisa Wang", 
      initials: "LW", 
      color: "bg-indigo-500",
      message: "Can we schedule a demo for the new client?",
      time: "Wednesday",
      status: "Wednesday at 9:15 AM",
      conversation: [
        {
          sender: "Lisa Wang",
          message: "Can we schedule a demo for the new client? They're very interested in our AI automation features.",
          time: "Wednesday, 9:15 AM",
          isUser: false
        },
      ]
    },
    { 
      name: "Michael Brown", 
      initials: "MB", 
      color: "bg-red-500",
      message: "The quarterly report has been generated",
      time: "Thursday",
      status: "Thursday at 5:00 PM",
      conversation: [
        {
          sender: "Michael Brown",
          message: "The quarterly report has been generated by the AI. Numbers look solid across the board!",
          time: "Thursday, 5:00 PM",
          isUser: false
        },
        {
          sender: "You",
          message: "Thanks! I'll review it tonight.",
          time: "Thursday, 5:05 PM",
          isUser: true
        },
      ]
    },
    { 
      name: "Nina Patel", 
      initials: "NP", 
      color: "bg-teal-500",
      message: "Updated the CRM with all the new contact info",
      time: "Friday",
      status: "Friday at 3:30 PM",
      conversation: [
        {
          sender: "Nina Patel",
          message: "Updated the CRM with all the new contact info from the conference. 67 new contacts added!",
          time: "Friday, 3:30 PM",
          isUser: false
        },
      ]
    },
    { 
      name: "Robert Garcia", 
      initials: "RG", 
      color: "bg-amber-500",
      message: "Meeting notes from yesterday are in the shared folder",
      time: "Last week",
      status: "Last week",
      conversation: [
        {
          sender: "Robert Garcia",
          message: "Meeting notes from yesterday are in the shared folder. AI generated action items too.",
          time: "Last week",
          isUser: false
        },
      ]
    },
    { 
      name: "Sophie Martinez", 
      initials: "SM", 
      color: "bg-violet-500",
      message: "The campaign analytics look promising!",
      time: "Last week",
      status: "Last week",
      conversation: [
        {
          sender: "Sophie Martinez",
          message: "The campaign analytics look promising! 34% increase in engagement over last month.",
          time: "Last week",
          isUser: false
        },
        {
          sender: "You",
          message: "That's fantastic! What's driving the improvement?",
          time: "Last week",
          isUser: true
        },
        {
          sender: "Sophie Martinez",
          message: "The AI-optimized email subject lines are performing really well. Open rates up 28%!",
          time: "Last week",
          isUser: false
        },
      ]
    },
    { 
      name: "James Wilson", 
      initials: "JW", 
      color: "bg-rose-500",
      message: "Client feedback has been compiled and reviewed",
      time: "2 weeks ago"
    },
  ];

  // Transform API agents data to match component format
  const transformAgents = (apiAgents: any[]) => {
    if (!apiAgents || apiAgents.length === 0) {
      return initialData?.agents || [];
    }

    return apiAgents.map((agent, index) => {
      const initials = agent.name
        .split(' ')
        .map((word: string) => word[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
      
      const colors = [
        'bg-blue-500',
        'bg-cyan-500',
        'bg-purple-500',
        'bg-green-500',
        'bg-orange-500',
        'bg-pink-500',
        'bg-indigo-500',
      ];
      const color = colors[index % colors.length];

      // Format last executed time
      let time = 'Never';
      let status = 'Idle';
      if (agent.lastExecutedAt) {
        const lastExec = new Date(agent.lastExecutedAt);
        const now = new Date();
        const diffMs = now.getTime() - lastExec.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) {
          time = 'Just now';
          status = 'Active now';
        } else if (diffMins < 60) {
          time = `${diffMins} min ago`;
          status = diffMins < 5 ? 'Active now' : 'Active';
        } else if (diffHours < 24) {
          time = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
          status = 'Active';
        } else if (diffDays < 7) {
          time = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
          status = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else {
          time = lastExec.toLocaleDateString();
          status = lastExec.toLocaleDateString();
        }
      }

      return {
        id: agent.id,
        name: agent.name,
        initials,
        color,
        message: agent.description || 'Ready to help',
        time,
        active: agent.status === 'active' && (time === 'Just now' || time.includes('min ago')),
        status,
        role: agent.type || 'Agent',
        conversation: [], // Conversations can be loaded separately if needed
      };
    });
  };

  // Use API agents if available, otherwise fall back to initialData or empty array
  const agentsList = agentsData?.agents && Array.isArray(agentsData.agents) 
    ? transformAgents(agentsData.agents)
    : (initialData?.agents || []);

  // Tab configuration (defined after agentsList for proper access)
  const tabs = [
    { id: 'assistant' as TabType, label: 'Neptune', icon: Sparkles, activeColor: 'bg-indigo-100 text-indigo-700' },
    { id: 'snapshot' as TabType, label: 'Snapshot', icon: BarChart3, activeColor: 'bg-blue-100 text-blue-700' },
    { id: 'automations' as TabType, label: 'Automations', icon: Bot, activeColor: 'bg-green-100 text-green-700' },
    { id: 'planner' as TabType, label: 'Planner', icon: CalendarDays, badge: calendarEvents.length > 0 ? String(calendarEvents.length) : undefined, badgeColor: 'bg-orange-500', activeColor: 'bg-orange-100 text-orange-700' },
  ];

  // Load agent conversation when selected agent changes (skip in demo mode)
  useEffect(() => {
    if (disableLiveData) return;

    if (agentsList.length > 0 && agentsList[selectedAgent]) {
      const agentId = agentsList[selectedAgent].id;
      if (agentId && !agentConversations[agentId]) {
        loadAgentConversation(agentId);
      }
    }
  }, [disableLiveData, selectedAgent, agentsList, agentConversations]);

  return (
    <div className="min-h-0 bg-gray-50/50 overflow-y-auto">
      {/* Header Section - Matching CRM/Marketing */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Welcome back! Here&apos;s an overview of your AI agents and workflows.
          </p>

          {/* Stats Bar - Compact Inline Centered */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Badge className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors">
              <Activity className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
              <span className="font-semibold">{stats?.activeAgents ?? 0}</span>
              <span className="ml-1 text-blue-600/70 font-normal">Active Agents</span>
            </Badge>
            <Badge className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-green-600" />
              <span className="font-semibold">{stats?.tasksCompleted ?? 0}</span>
              <span className="ml-1 text-green-600/70 font-normal">Tasks Completed</span>
            </Badge>
            <Badge className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors">
              <Clock className="h-3.5 w-3.5 mr-1.5 text-purple-600" />
              <span className="font-semibold">{stats?.hoursSaved ?? 0}</span>
              <span className="ml-1 text-purple-600/70 font-normal">Hours Saved</span>
            </Badge>
          </div>
        </div>

        {/* Floating Tab Bar - Matching CRM/Marketing */}
        <div className="flex justify-center overflow-x-auto pb-2 -mb-2">
          <div className="bg-background/80 backdrop-blur-lg rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-1 inline-flex gap-1 flex-nowrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? `${tab.activeColor} shadow-sm`
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                aria-label={`Switch to ${tab.label} tab`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <Badge 
                    className={`${activeTab === tab.id ? 'bg-white/90 text-gray-700' : tab.badgeColor + ' text-white'} text-xs px-1.5 py-0 h-4 min-w-[18px]`}
                  >
                    {tab.badge}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 pb-6"
        >
          {/* AI ASSISTANT TAB */}
          {activeTab === 'assistant' && (
            <Card className="p-4 sm:p-6 lg:p-8 shadow-lg border-0 mb-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 h-[calc(100vh-360px)] min-h-[400px]">
                {/* Left: Capabilities / History */}
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
                            {assistantLeftView === "capabilities" ? `${assistantCapabilities.length} capabilities` : `${assistantConversations.length} conversations`}
                        </p>
                      </div>
                    </div>
                      <Button size="sm" onClick={handleNewConvo} className="bg-indigo-600 hover:bg-indigo-700 text-white" aria-label="New conversation">
                        <Plus className="h-4 w-4 mr-1" aria-hidden="true" />New
                      </Button>
                  </div>
                    {/* Tab Toggle */}
                    <div className="flex gap-1 p-1 bg-white/60 rounded-lg">
                      <button onClick={() => setAssistantLeftView("capabilities")} className={cn("flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2", assistantLeftView === "capabilities" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-600 hover:text-gray-900")} aria-label="View capabilities" aria-pressed={assistantLeftView === "capabilities"}>
                        <Sparkles className="h-4 w-4" aria-hidden="true" />Capabilities
                      </button>
                      <button onClick={() => setAssistantLeftView("history")} className={cn("flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2", assistantLeftView === "history" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-600 hover:text-gray-900")} aria-label="View history" aria-pressed={assistantLeftView === "history"}>
                        <History className="h-4 w-4" aria-hidden="true" />History
                        {assistantConversations.length > 0 && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-indigo-50 text-indigo-600 border-indigo-200">{assistantConversations.length}</Badge>}
                      </button>
                    </div>
                  </div>
                  {/* Content */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {assistantLeftView === "capabilities" ? (
                      assistantCapabilities.map((cap) => {
                        const isSelected = selectedCapability === cap.id && !selectedConvoId;
                        const CapIcon = cap.icon;
                      return (
                          <button key={cap.id} onClick={() => { setSelectedCapability(cap.id); setSelectedConvoId(null); setAssistantMessages([]); }} className={cn("w-full text-left p-4 rounded-lg border-2 transition-all duration-200", isSelected ? `${cap.bgColor} ${cap.borderColor} shadow-md` : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50")} aria-label={`Select ${cap.title}`} aria-pressed={isSelected}>
                            <div className="flex items-start gap-3">
                              <div className={cn("p-2 rounded-lg", cap.bgColor)}><CapIcon className={cn("h-5 w-5", cap.color)} aria-hidden="true" /></div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                                    <h4 className={cn("font-semibold text-sm", isSelected ? cap.color : "text-gray-900")}>{cap.title}</h4>
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-gray-50 text-gray-600 border-gray-200">{cap.category}</Badge>
                            </div>
                                  <ChevronRight className={cn("h-4 w-4 transition-transform", isSelected ? `${cap.color} rotate-90` : "text-gray-400")} aria-hidden="true" />
                              </div>
                                <p className="text-xs text-gray-500 mt-0.5">{cap.description}</p>
                            </div>
                          </div>
                        </button>
                      );
                      })
                    ) : assistantConversations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4"><History className="h-8 w-8 text-gray-400" aria-hidden="true" /></div>
                        <h3 className="text-base font-semibold text-gray-900 mb-2">No conversations yet</h3>
                        <p className="text-sm text-gray-500 max-w-xs">Start a new conversation to see your chat history here.</p>
                        <Button size="sm" onClick={() => setAssistantLeftView("capabilities")} className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">Start a conversation</Button>
                  </div>
                    ) : (
                      assistantConversations.map((conv) => {
                        const isSelected = selectedConvoId === conv.id;
                        const ConvIcon = getCapIcon(conv.capability);
                        return (
                          <div key={conv.id} onClick={() => handleSelectConvo(conv)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectConvo(conv); } }} role="button" tabIndex={0} className={cn("w-full text-left p-4 rounded-lg border-2 transition-all duration-200 group cursor-pointer", isSelected ? `${getCapBgColor(conv.capability)} border-indigo-200 shadow-md` : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50")} aria-label={`View conversation: ${conv.title}`} aria-pressed={isSelected}>
                            <div className="flex items-start gap-3">
                              <div className={cn("p-2 rounded-lg", getCapBgColor(conv.capability))}><ConvIcon className={cn("h-5 w-5", getCapColor(conv.capability))} aria-hidden="true" /></div>
                      <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-semibold text-sm text-gray-900 truncate pr-2">{conv.title}</h4>
                                  <button onClick={(e) => handleDeleteConvo(conv.id, e)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 transition-all" aria-label={`Delete conversation: ${conv.title}`}><Trash2 className="h-3.5 w-3.5 text-red-500" aria-hidden="true" /></button>
                      </div>
                                <p className="text-xs text-gray-500 truncate mb-2">{conv.preview}</p>
                                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                  <Clock className="h-3 w-3" aria-hidden="true" />{formatRelativeTime(conv.updatedAt)}<span className="text-gray-300">•</span><span>{conv.messages.length} messages</span>
                    </div>
                  </div>
                              </div>
                          </div>
                        );
                      })
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
                      <Button size="sm" variant="outline" className={cn(selectedCapabilityData.bgColor, selectedCapabilityData.color, selectedCapabilityData.borderColor)} onClick={() => { setAssistantMessages([]); setSelectedConvoId(null); toast.success("Conversation cleared"); }} aria-label="Clear conversation">Clear</Button>
                                    </div>
                                        </div>
                  {/* Chat Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                    {assistantMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center px-4">
                        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-4", selectedCapabilityData.bgColor)}>
                          <selectedCapabilityData.icon className={cn("h-8 w-8", selectedCapabilityData.color)} aria-hidden="true" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 mb-2">Start a conversation</h3>
                        <p className="text-sm text-gray-500 mb-6 max-w-xs">Ask me anything about {selectedCapabilityData.title.toLowerCase()} or try an example:</p>
                        <div className="space-y-2 w-full max-w-sm">
                          {selectedCapabilityData.examples.map((ex, i) => (
                            <button key={i} onClick={() => setAssistantInput(ex)} className="w-full p-3 text-left text-sm text-gray-600 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors" aria-label={`Use example: ${ex}`}>
                              <div className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0" aria-hidden="true" /><span>{ex}</span></div>
                            </button>
                                      ))}
                                    </div>
                                  </div>
                    ) : (
                      <>
                        {assistantMessages.map((msg) => (
                          <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
                            {msg.role === "assistant" && <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", selectedCapabilityData.bgColor)}><Bot className={cn("h-4 w-4", selectedCapabilityData.color)} aria-hidden="true" /></div>}
                            <div className={cn("max-w-[80%] rounded-2xl px-4 py-3 text-sm", msg.role === "user" ? "bg-indigo-600 text-white rounded-br-md" : "bg-white border border-gray-200 text-gray-700 rounded-bl-md")}>
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                              <p className={cn("text-[10px] mt-2", msg.role === "user" ? "text-indigo-200" : "text-gray-400")}>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            {msg.role === "user" && <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0"><Users className="h-4 w-4 text-indigo-600" aria-hidden="true" /></div>}
                              </div>
                        ))}
                        {isAssistantLoading && (
                          <div className="flex gap-3 justify-start">
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", selectedCapabilityData.bgColor)}><Bot className={cn("h-4 w-4", selectedCapabilityData.color)} aria-hidden="true" /></div>
                            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3"><div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Thinking...</div></div>
                          </div>
                        )}
                        <div ref={assistantMessagesEndRef} />
                      </>
                    )}
                        </div>
                  {/* Input */}
                  <div className="p-4 border-t bg-white flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <Input value={assistantInput} onChange={(e) => setAssistantInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAssistantSend(); } }} placeholder={`Ask about ${selectedCapabilityData.title.toLowerCase()}...`} className="flex-1 h-11 bg-slate-50 border-slate-200 focus:border-indigo-300 focus:ring-indigo-200" disabled={isAssistantLoading} aria-label="Type your message" />
                      <Button onClick={handleAssistantSend} disabled={!assistantInput.trim() || isAssistantLoading} className="h-11 px-4 bg-indigo-600 hover:bg-indigo-700 text-white" aria-label="Send message">
                        {isAssistantLoading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Send className="h-5 w-5" aria-hidden="true" />}
                      </Button>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2 text-center">Press Enter to send • Powered by Neptune AI</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* SNAPSHOT TAB */}
          {activeTab === 'snapshot' && (
            <Card className="p-4 sm:p-6 lg:p-8 shadow-lg border-0 mb-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
                {/* Left: Categories List */}
                <div className="flex flex-col h-[calc(100vh-360px)] min-h-[400px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  {/* Header */}
                  <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-blue-100/50 flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[15px] text-gray-900">Performance Categories</h3>
                        <p className="text-[13px] text-blue-600 flex items-center gap-1">
                          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                          {categories.length} categories
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Categories List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {categories.map((category) => {
                      const isSelected = selectedCategory === category.id;
                      return (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`w-full p-3 rounded-lg border text-left transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                            isSelected
                              ? 'border-blue-300 bg-blue-50/30 shadow-sm'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                          }`}
                          aria-label={`Select category: ${category.name}`}
                          aria-pressed={isSelected}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${category.iconColor} flex-shrink-0`}>
                              <category.icon className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-sm font-semibold text-gray-900">{category.name}</p>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 h-4 bg-blue-50 text-blue-700 border-blue-200"
                                >
                                  {category.score}%
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500">{category.description}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Performance Breakdown */}
                <div className="flex flex-col h-[calc(100vh-360px)] min-h-[400px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    {(() => {
                      const category = categories.find(c => c.id === selectedCategory);
                    
                      if (!category) {
                        return (
                        <div className="flex-1 flex items-center justify-center p-8">
                            <div className="text-center max-w-sm">
                              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                              <Sparkles className="h-8 w-8 text-slate-400" aria-hidden="true" />
                              </div>
                              <h3 className="text-base font-semibold text-gray-900 mb-2">Select a category</h3>
                              <p className="text-sm text-gray-500">
                                Choose a category from the list to view detailed performance metrics and insights.
                              </p>
                            </div>
                          </div>
                        );
                      }

                      return (
                      <>
                        {/* Header */}
                        <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-blue-100/50 flex-shrink-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2.5 rounded-lg ${category.iconColor}`}>
                                <category.icon className="h-5 w-5 text-white" aria-hidden="true" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-[15px] text-gray-900">{category.name}</h3>
                                <p className="text-xs text-gray-500">{category.description}</p>
                              </div>
                            </div>
                            {/* Score Badge */}
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-blue-200 shadow-sm">
                              <div className="relative h-8 w-8 flex items-center justify-center">
                                <svg className="h-full w-full transform -rotate-90" aria-label={`Score: ${category.score}`}>
                                  <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-gray-100" />
                                    <circle 
                                    cx="16" cy="16" r="14" 
                                      stroke="currentColor" 
                                    strokeWidth="3" 
                                      fill="transparent" 
                                    strokeDasharray={87.96} 
                                    strokeDashoffset={87.96 * (1 - category.score / 100)} 
                                      className="text-blue-500" 
                                      strokeLinecap="round" 
                                    />
                                  </svg>
                                <span className="absolute text-xs font-bold text-blue-600">{category.score}</span>
                                  </div>
                              <span className="text-xs text-gray-500 font-medium">Score</span>
                              </div>
                            </div>
                          </div>

                        {/* Performance Metrics */}
                        <div className="flex-1 overflow-y-auto p-6">
                          {/* Key Metrics - Compact Grid */}
                          <div className="mb-5">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <BarChart3 className="h-4 w-4 text-blue-500" aria-hidden="true" />
                              Key Metrics
                            </h4>
                            <div className="grid grid-cols-3 gap-2">
                              {category.metrics.map((metric, index) => {
                                const MetricIcon = metric.icon;
                                return (
                                <div
                                  key={index}
                                    className="p-3 rounded-lg bg-slate-50/70 hover:bg-slate-100/70 transition-colors"
                                  >
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <MetricIcon className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                                      <span className="text-[11px] text-gray-500 truncate">{metric.label}</span>
                                      </div>
                                    <div className="flex items-baseline gap-2">
                                      <span className="text-base font-semibold text-gray-900">{metric.value}</span>
                                    {metric.change && (
                                        <span className={`text-[10px] font-medium ${
                                          metric.trend === "up" ? "text-green-600" : 
                                          metric.trend === "down" ? "text-red-600" : "text-gray-500"
                                        }`}>
                                        {metric.change}
                                        </span>
                                    )}
                                  </div>
                                </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Insights - Compact List */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <Lightbulb className="h-4 w-4 text-blue-500" aria-hidden="true" />
                              Key Insights
                            </h4>
                            <div className="space-y-2">
                              {category.insights.map((insight, index) => (
                                <div 
                                  key={index} 
                                  className="flex items-start gap-2 py-2 px-3 rounded-lg bg-slate-50/70 hover:bg-blue-50/50 transition-colors"
                                >
                                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0" aria-hidden="true" />
                                    <p className="text-xs text-gray-600 leading-relaxed">{insight}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                      );
                    })()}
                </div>
              </div>
            </Card>
          )}

          {/* AUTOMATIONS TAB */}
          {activeTab === 'automations' && (
            <Card className="p-4 sm:p-6 lg:p-8 shadow-lg border-0 mb-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
                {/* Left: Automation List */}
                <div className="flex flex-col h-[calc(100vh-360px)] min-h-[400px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  {/* Header */}
                  <div className="px-6 py-4 border-b bg-gradient-to-r from-green-50 to-green-100/50 flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[15px] text-gray-900">Automations</h3>
                        <p className="text-[13px] text-green-600 flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          {automations.length} available
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Automations List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {automations.map((automation) => {
                      const isSelected = selectedAutomation === automation.id;
                      return (
                        <button
                          key={automation.id}
                          onClick={() => setSelectedAutomation(automation.id)}
                          className={cn(
                            "w-full p-3 rounded-lg border text-left transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1",
                            isSelected
                              ? "border-green-300 bg-green-50/30 shadow-sm"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                          )}
                          aria-label={`Select automation ${automation.title}`}
                          aria-pressed={isSelected}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${automation.iconColor} flex-shrink-0`}>
                              <automation.icon className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-sm font-semibold text-gray-900">{automation.title}</p>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[10px] px-1.5 py-0 h-4",
                                    automation.status === "active"
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : automation.status === "paused"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-blue-50 text-blue-700 border-blue-200"
                                  )}
                                >
                                  {automation.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500 mb-1">{automation.description}</p>
                              <div className="flex items-center gap-3 text-[10px] text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {automation.timeSaved}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={`text-[9px] px-1 py-0 h-3 ${
                                    automation.difficulty === "Easy"
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : automation.difficulty === "Medium"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-red-50 text-red-700 border-red-200"
                                  }`}
                                >
                                  {automation.difficulty}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Automation Flow */}
                <div className="flex flex-col h-[calc(100vh-360px)] min-h-[400px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    {(() => {
                    const selectedAuto = automations.find(a => a.id === selectedAutomation);
                      const nodes = getAutomationNodes(selectedAutomation);
                    
                    if (!selectedAuto || nodes.length === 0) {
                        return (
                        <div className="flex-1 flex items-center justify-center p-8">
                            <div className="text-center max-w-sm">
                              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                              <Bot className="h-8 w-8 text-slate-400" aria-hidden="true" />
                              </div>
                              <h3 className="text-base font-semibold text-gray-900 mb-2">Select an automation</h3>
                              <p className="text-sm text-gray-500">
                                Choose an automation from the list to view its workflow steps and configuration.
                              </p>
                            </div>
                          </div>
                        );
                      }

                      return (
                      <>
                        {/* Header */}
                        <div className="px-6 py-4 border-b bg-gradient-to-r from-green-50 to-green-100/50 flex-shrink-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2.5 rounded-lg ${selectedAuto.iconColor}`}>
                                <selectedAuto.icon className="h-5 w-5 text-white" aria-hidden="true" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-[15px] text-gray-900">{selectedAuto.title}</h3>
                                <p className="text-xs text-gray-500">{selectedAuto.description}</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                              aria-label="Setup automation"
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                              Setup
                            </Button>
                          </div>
                        </div>

                        {/* Inline Stats */}
                        <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-400">Steps:</span>
                            <span className="font-medium text-gray-700">{selectedAuto.nodeCount}</span>
                          </div>
                          <span className="text-gray-300">•</span>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-green-500" aria-hidden="true" />
                            <span className="text-gray-400">Saves:</span>
                            <span className="font-medium text-green-600">{selectedAuto.timeSaved}</span>
                          </div>
                          <span className="text-gray-300">•</span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 h-4 font-normal ${
                              selectedAuto.difficulty === "Easy"
                                ? "bg-green-50 text-green-600 border-green-200"
                                : selectedAuto.difficulty === "Medium"
                                ? "bg-amber-50 text-amber-600 border-amber-200"
                                : "bg-red-50 text-red-600 border-red-200"
                            }`}
                          >
                            {selectedAuto.difficulty}
                          </Badge>
                        </div>

                        {/* Workflow Steps */}
                        <div className="flex-1 overflow-y-auto p-6">
                          <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Bot className="h-4 w-4 text-green-500" aria-hidden="true" />
                            Workflow Steps
                          </h4>
                          <div className="space-y-3">
                            {nodes.map((node, index) => {
                              const isLast = index === nodes.length - 1;
                              const NodeIcon = node.icon;

                              const getNodeBgColor = () => {
                                switch (node.type) {
                                  case "trigger": return "bg-blue-500";
                                  case "action": return "bg-green-500";
                                  case "condition": return "bg-purple-500";
                                  case "delay": return "bg-amber-500";
                                  default: return "bg-slate-500";
                                }
                              };

                              return (
                                <div key={node.id} className="relative">
                                  <div className="flex items-start gap-3">
                                    {/* Compact Node */}
                                    <div className="relative flex-shrink-0">
                                      <div className={`w-10 h-10 rounded-lg ${getNodeBgColor()} flex items-center justify-center shadow-sm`}>
                                        <NodeIcon className="h-5 w-5 text-white" aria-hidden="true" />
                                      </div>
                                      {/* Connector line */}
                                      {!isLast && (
                                        <div className="absolute left-1/2 top-10 -translate-x-1/2 w-0.5 h-3 bg-gray-200" aria-hidden="true" />
                                      )}
                                    </div>

                                    {/* Node Info */}
                                    <div className="flex-1 min-w-0 pb-3">
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <p className="text-sm font-medium text-gray-900">{node.title}</p>
                                        <Badge
                                          variant="outline"
                                          className={cn("text-[10px] px-1.5 py-0 h-4", getNodeTypeColor(node.type))}
                                        >
                                          {getNodeTypeLabel(node.type)}
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-gray-500">{node.description}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                      );
                    })()}
                </div>
              </div>
            </Card>
          )}

          {/* PLANNER TAB */}
          {activeTab === 'planner' && (
            <Card className="p-8 shadow-lg border-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Calendar */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Monthly Overview</h3>
                    <p className="text-sm text-muted-foreground">Select a day to view details</p>
                  </div>
                  <CustomCalendar
                    selected={date}
                    onSelect={setDate}
                  />
                </div>

                {/* Events List */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      {date ? date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a date'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {calendarEvents.length} event{calendarEvents.length !== 1 ? 's' : ''} scheduled
                    </p>
                  </div>

                  <div className="space-y-3">
                    {isLoadingEvents ? (
                      // Loading skeletons
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 rounded-lg border">
                          <Skeleton className="h-9 w-9 rounded-lg" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                            <Skeleton className="h-5 w-16" />
                          </div>
                        </div>
                      ))
                    ) : calendarEvents.length === 0 ? (
                      // Empty state
                      <div className="text-center py-12">
                        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <p className="text-sm text-muted-foreground">No events scheduled</p>
                        <p className="text-xs text-muted-foreground mt-1">Click below to add an event</p>
                        <Button
                          size="sm"
                          className="mt-4"
                          onClick={() => toast.info('Event creation coming soon!')}
                        >
                          <Plus className="h-4 w-4 mr-1.5" />
                          Add Event
                        </Button>
                      </div>
                    ) : (
                      // Event list
                      <>
                        {/* Group events by time of day */}
                        {(() => {
                          const morning = calendarEvents.filter(e => {
                            const hour = new Date(e.startTime).getHours();
                            return hour < 12;
                          });
                          const afternoon = calendarEvents.filter(e => {
                            const hour = new Date(e.startTime).getHours();
                            return hour >= 12 && hour < 17;
                          });
                          const evening = calendarEvents.filter(e => {
                            const hour = new Date(e.startTime).getHours();
                            return hour >= 17;
                          });

                          const renderEventGroup = (title: string, events: typeof calendarEvents) => {
                            if (events.length === 0) return null;
                            return (
                              <div key={title}>
                                <h4 className="text-sm font-medium text-muted-foreground mb-3">{title}</h4>
                                <div className="space-y-3">
                                  {events.map((event) => {
                                    const startTime = new Date(event.startTime);
                                    const endTime = new Date(event.endTime);
                                    const timeStr = event.isAllDay
                                      ? 'All Day'
                                      : `${startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
                                    
                                    // Determine icon and colors based on tags or title
                                    const isMeeting = event.title.toLowerCase().includes('meeting') || event.meetingUrl;
                                    const isTask = event.tags?.includes('task') || event.title.toLowerCase().includes('task');
                                    
                                    const iconColor = isMeeting ? 'bg-blue-100 text-blue-600' : 
                                                      isTask ? 'bg-green-100 text-green-600' : 
                                                      'bg-purple-100 text-purple-600';
                                    const badgeColor = isMeeting ? 'bg-blue-100 text-blue-700' : 
                                                       isTask ? 'bg-green-100 text-green-700' : 
                                                       'bg-purple-100 text-purple-700';
                                    const badgeText = isMeeting ? 'Meeting' : isTask ? 'Task' : 'Event';
                                    const EventIcon = isMeeting ? CalendarDays : isTask ? CheckCircle2 : Target;

                                    return (
                                      <div 
                                        key={event.id}
                                        className="flex items-start gap-3 p-4 rounded-lg border hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`${event.title} - ${timeStr}`}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            toast.info(`Opening event: ${event.title}`);
                                          }
                                        }}
                                        onClick={() => toast.info(`Opening event: ${event.title}`)}
                                      >
                                        <div className={`p-2 rounded-lg ${iconColor}`}>
                                          <EventIcon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-medium text-sm mb-1">{event.title}</h4>
                                          <p className="text-xs text-muted-foreground mb-2">
                                            {timeStr}
                                            {event.location && ` • ${event.location}`}
                                          </p>
                                          <div className="flex items-center gap-2">
                                            <Badge className={`${badgeColor} border-0 text-xs`}>
                                              {badgeText}
                                            </Badge>
                                            {event.meetingUrl && (
                                              <Badge className="bg-cyan-100 text-cyan-700 border-0 text-xs">
                                                Video Call
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          };

                          return (
                            <>
                              {renderEventGroup('Morning', morning)}
                              {renderEventGroup('Afternoon', afternoon)}
                              {renderEventGroup('Evening', evening)}
                            </>
                          );
                        })()}
                        
                        {/* Add Event Button */}
                        <div className="pt-4 border-t">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => toast.info('Event creation coming soon!')}
                          >
                            <Plus className="h-4 w-4 mr-1.5" />
                            Add Event for {date?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}

