"use client";

import { useState, useRef, useEffect } from "react";
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
  Bot, 
  CheckCircle2, 
  Clock, 
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
  TrendingUp,
  Users,
  DollarSign,
  Eye,
  MousePointer,
  Star,
  RefreshCw,
  Megaphone,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { DashboardData } from "@/types/dashboard";

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then((r) => r.json());

type TabType = 'tips' | 'snapshot' | 'automations' | 'planner' | 'messages' | 'agents';

interface DashboardDashboardProps {
  initialData?: DashboardData;
  initialTab?: TabType;
}

interface Tip {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: typeof Mail;
  iconColor: string;
  timeSaved: string;
  difficulty: "Easy" | "Medium" | "Advanced";
}

interface TipStep {
  id: string;
  step: number;
  title: string;
  description: string;
  details: string[];
  icon: typeof Mail;
  iconColor: string;
}

export default function DashboardDashboard({ initialData, initialTab = 'tips' }: DashboardDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [date, setDate] = useState<Date | undefined>(new Date(2025, 10, 7)); // November 7, 2025
  const [messageInput, setMessageInput] = useState("");
  const [agentMessageInput, setAgentMessageInput] = useState("");
  const [selectedConversation, setSelectedConversation] = useState(0); // Track selected conversation
  const [selectedAgent, setSelectedAgent] = useState(0); // Track selected agent
  const [isLoadingChat, setIsLoadingChat] = useState(false); // Loading state for AI chat

  // Fetch live dashboard stats (refreshes every 30 seconds)
  const { data: liveStats, error: statsError, isLoading: isLoadingStats } = useSWR('/api/dashboard', fetcher, {
    refreshInterval: 30000, // 30 seconds
    fallbackData: initialData,
  });

  // Fetch agents list (refreshes every 30 seconds)
  const { data: agentsData, error: agentsError, isLoading: isLoadingAgents } = useSWR('/api/agents', fetcher, {
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

  // Top stat badges (using live stats)
  const statBadges = [
    { label: `${stats?.activeAgents ?? 0} Active Agents`, icon: Activity, color: "bg-blue-100 text-blue-700" },
    { label: `${stats?.tasksCompleted ?? 0} Tasks Completed`, icon: CheckCircle2, color: "bg-green-100 text-green-700" },
    { label: `${stats?.hoursSaved ?? 0} Hours Saved`, icon: Clock, color: "bg-purple-100 text-purple-700" },
  ];

  // Tab configuration
  const tabs = [
    { id: 'tips' as TabType, label: 'Tips', icon: Lightbulb, badge: '4', badgeColor: 'bg-purple-500', activeColor: 'bg-purple-100 text-purple-700' },
    { id: 'snapshot' as TabType, label: 'Snapshot', icon: Sparkles, activeColor: 'bg-blue-100 text-blue-700' },
    { id: 'automations' as TabType, label: 'Automations', icon: Bot, activeColor: 'bg-green-100 text-green-700' },
    { id: 'planner' as TabType, label: 'Planner', icon: CalendarDays, badge: '4', badgeColor: 'bg-orange-500', activeColor: 'bg-orange-100 text-orange-700' },
    { id: 'messages' as TabType, label: 'Messages', icon: MessageSquare, activeColor: 'bg-cyan-100 text-cyan-700' },
    { id: 'agents' as TabType, label: 'Agents', icon: Bot, badge: '3', badgeColor: 'bg-emerald-500', activeColor: 'bg-emerald-100 text-emerald-700' },
  ];

  // Tips data
  const [selectedTip, setSelectedTip] = useState<string>("auto-email");

  const tips: Tip[] = [
    {
      id: "auto-email",
      title: "Automate Email Responses",
      description: "Set up AI to automatically respond to common email inquiries",
      category: "Email Automation",
      icon: Mail,
      iconColor: "bg-blue-500",
      timeSaved: "2-3 hours/week",
      difficulty: "Easy",
    },
    {
      id: "lead-scoring",
      title: "Implement Smart Lead Scoring",
      description: "Use AI to automatically score and prioritize leads based on engagement",
      category: "Sales Intelligence",
      icon: Target,
      iconColor: "bg-purple-500",
      timeSaved: "5+ hours/week",
      difficulty: "Medium",
    },
    {
      id: "meeting-prep",
      title: "Auto-Generate Meeting Briefs",
      description: "Create comprehensive meeting prep from contact history and context",
      category: "Meeting Efficiency",
      icon: FileText,
      iconColor: "bg-green-500",
      timeSaved: "30 min/meeting",
      difficulty: "Easy",
    },
    {
      id: "crm-sync",
      title: "Sync Contacts to CRM",
      description: "Automatically sync and deduplicate contacts across platforms",
      category: "Data Management",
      icon: Database,
      iconColor: "bg-cyan-500",
      timeSaved: "1-2 hours/week",
      difficulty: "Medium",
    },
    {
      id: "daily-digest",
      title: "Create Daily Action Digest",
      description: "Get a morning summary with top priorities and actionable tasks",
      category: "Productivity",
      icon: List,
      iconColor: "bg-orange-500",
      timeSaved: "15 min/day",
      difficulty: "Easy",
    },
    {
      id: "follow-up-reminders",
      title: "Set Up Follow-Up Reminders",
      description: "Automatically remind you to follow up with leads after 7 days",
      category: "Sales Automation",
      icon: Clock,
      iconColor: "bg-amber-500",
      timeSaved: "1 hour/week",
      difficulty: "Easy",
    },
    {
      id: "data-enrichment",
      title: "Enrich Lead Data Automatically",
      description: "Auto-populate missing company and contact information",
      category: "Data Quality",
      icon: Sparkles,
      iconColor: "bg-indigo-500",
      timeSaved: "2 hours/week",
      difficulty: "Medium",
    },
    {
      id: "deal-advancement",
      title: "Auto-Advance Deal Stages",
      description: "Move deals to next stage based on activity and probability",
      category: "Sales Pipeline",
      icon: TrendingUp,
      iconColor: "bg-emerald-500",
      timeSaved: "1 hour/week",
      difficulty: "Advanced",
    },
  ];

  const getTipSteps = (tipId: string): TipStep[] => {
    switch (tipId) {
      case "auto-email":
        return [
          {
            id: "1",
            step: 1,
            title: "Enable Email Integration",
            description: "Connect your email account to the platform",
            details: [
              "Go to Settings → Integrations → Email",
              "Authorize access to your email account",
              "Select which folders to monitor (Inbox, Priority, etc.)",
              "Enable auto-response feature"
            ],
            icon: Mail,
            iconColor: "bg-blue-500",
          },
          {
            id: "2",
            step: 2,
            title: "Configure Response Rules",
            description: "Set up when and how to auto-respond",
            details: [
              "Define trigger conditions (e.g., specific keywords, sender domains)",
              "Set response templates for common inquiries",
              "Choose response tone (professional, friendly, etc.)",
              "Enable AI to customize responses based on email content"
            ],
            icon: Target,
            iconColor: "bg-purple-500",
          },
          {
            id: "3",
            step: 3,
            title: "Review & Approve",
            description: "Set up approval workflow for responses",
            details: [
              "Choose review mode: Auto-send or Queue for review",
              "For sensitive emails, always queue for manual approval",
              "Set up notifications for queued responses",
              "Review response quality and adjust templates as needed"
            ],
            icon: CheckCircle2,
            iconColor: "bg-green-500",
          },
        ];
      case "lead-scoring":
        return [
          {
            id: "1",
            step: 1,
            title: "Define Scoring Criteria",
            description: "Set up what factors contribute to lead score",
            details: [
              "Company size and industry fit (0-30 points)",
              "Engagement level: email opens, clicks, website visits (0-25 points)",
              "Budget and timeline indicators (0-20 points)",
              "Decision-maker status and title (0-15 points)",
              "Response time and interaction quality (0-10 points)"
            ],
            icon: Target,
            iconColor: "bg-purple-500",
          },
          {
            id: "2",
            step: 2,
            title: "Configure AI Scoring",
            description: "Enable AI to automatically calculate scores",
            details: [
              "Go to CRM → Settings → Lead Scoring",
              "Enable automatic scoring for new leads",
              "Set score thresholds: Hot (≥70), Warm (50-69), Cold (<50)",
              "Configure auto-enrichment to gather scoring data"
            ],
            icon: Sparkles,
            iconColor: "bg-indigo-500",
          },
          {
            id: "3",
            step: 3,
            title: "Set Up Alerts & Actions",
            description: "Automate actions based on lead scores",
            details: [
              "Create alerts for high-score leads (≥70)",
              "Auto-assign hot leads to sales team",
              "Set up automated nurture sequences for warm leads",
              "Schedule follow-up reminders based on score changes"
            ],
            icon: Zap,
            iconColor: "bg-amber-500",
          },
        ];
      case "meeting-prep":
        return [
          {
            id: "1",
            step: 1,
            title: "Connect Calendar",
            description: "Link your calendar to enable meeting detection",
            details: [
              "Go to Settings → Integrations → Calendar",
              "Connect Google Calendar, Outlook, or other calendar",
              "Enable automatic meeting detection",
              "Set notification preferences (e.g., 1 hour before meeting)"
            ],
            icon: CalendarDays,
            iconColor: "bg-blue-500",
          },
          {
            id: "2",
            step: 2,
            title: "Configure Brief Generation",
            description: "Set up what information to include in briefs",
            details: [
              "Select data sources: CRM history, emails, notes, deals",
              "Choose brief length: Summary (1 page) or Detailed (3+ pages)",
              "Enable AI to identify key talking points",
              "Include action items from previous interactions"
            ],
            icon: FileText,
            iconColor: "bg-green-500",
          },
          {
            id: "3",
            step: 3,
            title: "Review & Customize",
            description: "Review generated briefs and refine",
            details: [
              "Briefs are generated 1 hour before each meeting",
              "Review and edit briefs as needed",
              "Add custom notes or talking points",
              "Share briefs with team members if needed"
            ],
            icon: CheckCircle2,
            iconColor: "bg-purple-500",
          },
        ];
      case "crm-sync":
        return [
          {
            id: "1",
            step: 1,
            title: "Connect CRM Platform",
            description: "Link your CRM (Salesforce, HubSpot, etc.)",
            details: [
              "Go to Settings → Integrations → CRM",
              "Select your CRM platform",
              "Authorize API access with OAuth",
              "Test connection to verify sync capability"
            ],
            icon: Database,
            iconColor: "bg-cyan-500",
          },
          {
            id: "2",
            step: 2,
            title: "Configure Sync Rules",
            description: "Set up what data to sync and how",
            details: [
              "Choose sync direction: One-way or Bi-directional",
              "Select fields to sync: Name, Email, Phone, Company, etc.",
              "Set sync frequency: Real-time, Hourly, or Daily",
              "Enable duplicate detection and merging"
            ],
            icon: Target,
            iconColor: "bg-purple-500",
          },
          {
            id: "3",
            step: 3,
            title: "Resolve Duplicates",
            description: "Clean up existing duplicate contacts",
            details: [
              "Run duplicate detection scan",
              "Review detected duplicates",
              "Choose merge strategy: Keep most recent, most complete, or manual",
              "Set up auto-merge rules for future duplicates"
            ],
            icon: CheckCircle2,
            iconColor: "bg-green-500",
          },
        ];
      case "daily-digest":
        return [
          {
            id: "1",
            step: 1,
            title: "Enable Daily Digest",
            description: "Turn on automatic morning summaries",
            details: [
              "Go to Dashboard → Settings → Daily Digest",
              "Enable daily digest feature",
              "Set delivery time (default: 8:00 AM)",
              "Choose delivery method: Email or In-app notification"
            ],
            icon: CalendarDays,
            iconColor: "bg-orange-500",
          },
          {
            id: "2",
            step: 2,
            title: "Customize Digest Content",
            description: "Select what to include in your digest",
            details: [
              "Top 10 priorities for the day",
              "Hot leads needing follow-up",
              "Deals closing this week",
              "Overdue tasks and action items",
              "Key metrics and KPIs"
            ],
            icon: List,
            iconColor: "bg-blue-500",
          },
          {
            id: "3",
            step: 3,
            title: "Review & Act",
            description: "Use digest to plan your day",
            details: [
              "Digest arrives at your chosen time",
              "Review priorities and tasks",
              "Click items to jump directly to relevant pages",
              "Mark items as complete as you work through them"
            ],
            icon: CheckCircle2,
            iconColor: "bg-green-500",
          },
        ];
      case "follow-up-reminders":
        return [
          {
            id: "1",
            step: 1,
            title: "Set Follow-Up Rules",
            description: "Define when follow-ups are needed",
            details: [
              "Go to CRM → Settings → Follow-Up Rules",
              "Set follow-up window (default: 7 days)",
              "Choose which lead stages need follow-up",
              "Exclude leads that have been contacted recently"
            ],
            icon: Clock,
            iconColor: "bg-amber-500",
          },
          {
            id: "2",
            step: 2,
            title: "Configure Reminders",
            description: "Set up how you want to be notified",
            details: [
              "Choose notification method: Email, In-app, or Both",
              "Set reminder timing: Day of, 1 day before, or both",
              "Include lead context in reminder (company, last contact, etc.)",
              "Enable team-wide reminders for shared leads"
            ],
            icon: Mail,
            iconColor: "bg-blue-500",
          },
          {
            id: "3",
            step: 3,
            title: "Track & Complete",
            description: "Manage follow-up tasks",
            details: [
              "Reminders appear in your task list",
              "Click reminder to view lead details",
              "Mark as complete after following up",
              "System automatically resets timer for next follow-up"
            ],
            icon: CheckCircle2,
            iconColor: "bg-green-500",
          },
        ];
      case "data-enrichment":
        return [
          {
            id: "1",
            step: 1,
            title: "Enable Auto-Enrichment",
            description: "Turn on automatic data enrichment",
            details: [
              "Go to CRM → Settings → Data Enrichment",
              "Enable auto-enrichment for new leads",
              "Choose data sources: LinkedIn, Company databases, etc.",
              "Set enrichment triggers: On lead creation, after 24 hours, etc."
            ],
            icon: Sparkles,
            iconColor: "bg-indigo-500",
          },
          {
            id: "2",
            step: 2,
            title: "Select Data Fields",
            description: "Choose what information to enrich",
            details: [
              "Company: Industry, size, revenue, location",
              "Contact: Job title, LinkedIn profile, phone number",
              "Technographics: Tech stack, software used",
              "Firmographics: Funding, news, recent changes"
            ],
            icon: Database,
            iconColor: "bg-cyan-500",
          },
          {
            id: "3",
            step: 3,
            title: "Review & Verify",
            description: "Monitor enrichment quality",
            details: [
              "Review enriched data in lead profiles",
              "Verify accuracy of enriched information",
              "Flag incorrect data for correction",
              "System learns from your corrections over time"
            ],
            icon: CheckCircle2,
            iconColor: "bg-green-500",
          },
        ];
      case "deal-advancement":
        return [
          {
            id: "1",
            step: 1,
            title: "Define Stage Criteria",
            description: "Set conditions for advancing deals",
            details: [
              "Go to CRM → Settings → Deal Stages",
              "Define criteria for each stage transition",
              "Set probability thresholds (e.g., 70%+ to advance)",
              "Include activity requirements (meetings, emails, etc.)"
            ],
            icon: Target,
            iconColor: "bg-emerald-500",
          },
          {
            id: "2",
            step: 2,
            title: "Enable Auto-Advancement",
            description: "Turn on automatic stage progression",
            details: [
              "Enable auto-advancement feature",
              "Set review mode: Auto-advance or Suggest for review",
              "Configure activity detection (emails, calls, meetings)",
              "Set minimum time in stage before advancement"
            ],
            icon: TrendingUp,
            iconColor: "bg-blue-500",
          },
          {
            id: "3",
            step: 3,
            title: "Monitor & Adjust",
            description: "Track advancement accuracy",
            details: [
              "Review suggested advancements",
              "Approve or reject stage changes",
              "System learns from your decisions",
              "Adjust criteria based on conversion data"
            ],
            icon: CheckCircle2,
            iconColor: "bg-green-500",
          },
        ];
      default:
        return [];
    }
  };

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
    const difficultyOrder = { Easy: 1, Medium: 2, Advanced: 3 };
    return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
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

  // Events for Planner tab
  const events = [
    {
      icon: FileText,
      iconColor: 'bg-blue-100 text-blue-600',
      title: "Product Strategy Meeting",
      time: "10:00 AM - 11:00 AM • Conference Room A",
      badge: "Meeting",
      badgeColor: "bg-blue-100 text-blue-700 hover:bg-blue-200"
    },
    {
      icon: CheckCircle2,
      iconColor: 'bg-green-100 text-green-600',
      title: "Update sales pipeline",
      time: "11:30 AM • CRM cleanup",
      badge: "Task",
      badgeColor: "bg-green-100 text-green-700 hover:bg-green-200"
    },
    {
      icon: Target,
      iconColor: 'bg-purple-100 text-purple-600',
      title: "StartupXYZ - Seed Round",
      time: "2:00 PM • $500K opportunity",
      badge: "Opportunity",
      badgeColor: "bg-purple-100 text-purple-700 hover:bg-purple-200"
    },
    {
      icon: FileText,
      iconColor: 'bg-green-100 text-green-600',
      title: "Prepare weekly report",
      time: "4:00 PM • Analytics review",
      badge: "Task",
      badgeColor: "bg-green-100 text-green-700 hover:bg-green-200"
    },
  ];

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
  const agentsList = agentsData && Array.isArray(agentsData) 
    ? transformAgents(agentsData)
    : (initialData?.agents || []);

  return (
    <div className="min-h-0 bg-gray-50/50 overflow-hidden">
      {/* Header Section - Matching CRM/Marketing */}
      <div className="max-w-7xl mx-auto px-6 py-4 space-y-4">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Welcome back! Here&apos;s an overview of your AI agents and workflows.
          </p>

          {/* Stat Badges */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {statBadges.map((stat, index) => (
              <Badge 
                key={index}
                className={`${stat.color} px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2`}
              >
                <stat.icon className="h-4 w-4" />
                {stat.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Floating Tab Bar - Matching CRM/Marketing */}
        <div className="flex justify-center">
          <div className="bg-background/80 backdrop-blur-lg rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-1 inline-flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeTab === tab.id
                    ? `${tab.activeColor} shadow-md`
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                aria-label={`Switch to ${tab.label} tab`}
              >
                <tab.icon className="h-3 w-3" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <Badge 
                    className={`${activeTab === tab.id ? 'bg-white/90 text-gray-700' : tab.badgeColor + ' text-white'} text-xs px-1.5 py-0 h-5 min-w-[20px]`}
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
          className="max-w-7xl mx-auto px-6 pb-6"
        >
          {/* TIPS TAB */}
          {activeTab === 'tips' && (
            <Card className="p-8 shadow-lg border-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Tips List */}
                <div className="flex flex-col h-[600px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  {/* Header */}
                  <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-purple-100/50 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md">
                        <Lightbulb className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[15px] text-gray-900">Pro Tips</h3>
                        <p className="text-[13px] text-purple-600 flex items-center gap-1">
                          <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                          {tips.length} tips available
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tips List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {tips.map((tip) => {
                      const isSelected = selectedTip === tip.id;
                      return (
                        <button
                          key={tip.id}
                          onClick={() => setSelectedTip(tip.id)}
                          className={`w-full p-2 rounded-lg border text-left transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 ${
                            isSelected
                              ? 'border-purple-300 bg-purple-50/30 shadow-sm'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                          }`}
                          aria-label={`Select tip: ${tip.title}`}
                          aria-pressed={isSelected}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-full ${tip.iconColor} flex-shrink-0`}>
                              <tip.icon className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-sm font-semibold text-gray-900">{tip.title}</p>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-1.5 py-0 h-4 ${
                                    tip.difficulty === "Easy"
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : tip.difficulty === "Medium"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-red-50 text-red-700 border-red-200"
                                  }`}
                                >
                                  {tip.difficulty}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500 mb-1">{tip.description}</p>
                              <div className="flex items-center gap-3 text-[10px] text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {tip.timeSaved}
                                </span>
                                <span>{tip.category}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Implementation Details */}
                <div className="flex flex-col h-[600px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  {/* Header */}
                  <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-purple-100/50 flex-shrink-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 mb-1">
                          {tips.find(t => t.id === selectedTip)?.title || "Select a tip"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {tips.find(t => t.id === selectedTip)?.description || "Choose a tip from the list to see implementation steps"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Implementation Steps */}
                  <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                    {(() => {
                      const steps = getTipSteps(selectedTip);
                      if (steps.length === 0) {
                        return (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center max-w-sm">
                              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                <Lightbulb className="h-8 w-8 text-slate-400" />
                              </div>
                              <h3 className="text-base font-semibold text-gray-900 mb-2">Select a tip</h3>
                              <p className="text-sm text-gray-500">
                                Choose a tip from the list to view detailed implementation steps and best practices.
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div className="relative min-h-full">
                          <div className="flex flex-col gap-6">
                            {steps.map((step, index) => {
                              const isLast = index === steps.length - 1;
                            return (
                              <div key={step.id} className="relative">
                                <div className="flex items-start gap-4">
                                  {/* Step Number with gradient */}
                                  <div className="relative flex-shrink-0">
                                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${step.iconColor} shadow-lg flex items-center justify-center`}>
                                      <step.icon className="h-7 w-7 text-white" />
                                    </div>
                                    
                                    {/* Connector line */}
                                    {!isLast && (
                                      <div className="absolute left-1/2 top-16 -translate-x-1/2 w-0.5 h-6 bg-purple-400">
                                        <div className="absolute left-1/2 top-full -translate-x-1/2 w-2 h-2 rounded-full bg-purple-400"></div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Step Info */}
                                  <div className="flex-1 min-w-0 pt-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] px-1.5 py-0 h-4 bg-purple-50 text-purple-700 border-purple-200"
                                      >
                                        Step {step.step}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-gray-600 mb-3 leading-relaxed">{step.description}</p>
                                    
                                    {/* Step Details */}
                                    <div className="space-y-2">
                                      {step.details.map((detail, detailIndex) => (
                                        <div key={detailIndex} className="flex items-start gap-2">
                                          <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                                          <p className="text-xs text-gray-600 leading-relaxed">{detail}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* SNAPSHOT TAB */}
          {activeTab === 'snapshot' && (
            <Card className="p-8 shadow-lg border-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Categories List */}
                <div className="flex flex-col h-[600px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
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
                <div className="flex flex-col h-[600px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  {/* Header */}
                  <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-blue-100/50 flex-shrink-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 mb-1">
                          {categories.find(c => c.id === selectedCategory)?.name || "Select a category"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {categories.find(c => c.id === selectedCategory)?.description || "Choose a category to view performance metrics"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                    {(() => {
                      const category = categories.find(c => c.id === selectedCategory);
                      if (!category) {
                        return (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center max-w-sm">
                              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="h-8 w-8 text-slate-400" />
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
                        <div className="space-y-4">
                          {/* Score Card */}
                          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-1 shadow-lg">
                            <div className="relative bg-white/95 backdrop-blur-xl rounded-xl p-6 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="relative h-16 w-16 flex items-center justify-center">
                                  <svg className="h-full w-full transform -rotate-90" aria-label={`${category.name} Score: ${category.score}`}>
                                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-100" />
                                    <circle 
                                      cx="32" cy="32" r="28" 
                                      stroke="currentColor" 
                                      strokeWidth="6" 
                                      fill="transparent" 
                                      strokeDasharray={175.9} 
                                      strokeDashoffset={175.9 * (1 - category.score / 100)} 
                                      className="text-blue-500" 
                                      strokeLinecap="round" 
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                                    <span className="text-xl font-bold text-blue-600">{category.score}</span>
                                    <span className="text-[9px] font-medium text-gray-500 uppercase">Score</span>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-lg font-bold text-gray-900">{category.name}</h4>
                                  <p className="text-sm text-gray-500 mt-0.5">Overall performance score</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Metrics Grid */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-4">Key Metrics</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {category.metrics.map((metric, index) => (
                                <div
                                  key={index}
                                  className="p-4 rounded-lg border border-slate-200 bg-white hover:shadow-sm transition-all"
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <div className={`p-1.5 rounded-lg bg-blue-50`}>
                                        <metric.icon className="h-4 w-4 text-blue-600" />
                                      </div>
                                      <span className="text-xs font-medium text-gray-600">{metric.label}</span>
                                    </div>
                                    {metric.change && (
                                      <Badge
                                        variant="outline"
                                        className={`text-[10px] px-1.5 py-0 h-4 ${
                                          metric.trend === "up"
                                            ? "bg-green-50 text-green-700 border-green-200"
                                            : metric.trend === "down"
                                            ? "bg-red-50 text-red-700 border-red-200"
                                            : "bg-gray-50 text-gray-700 border-gray-200"
                                        }`}
                                      >
                                        {metric.change}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-lg font-bold text-gray-900">{metric.value}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Insights */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                              <Lightbulb className="h-4 w-4 text-blue-500" />
                              Key Insights
                            </h4>
                            <div className="space-y-2">
                              {category.insights.map((insight, index) => (
                                <div key={index} className="p-3 rounded-lg bg-white border border-slate-200 hover:border-blue-200 transition-colors">
                                  <div className="flex gap-2">
                                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                                    <p className="text-xs text-gray-600 leading-relaxed">{insight}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* AUTOMATIONS TAB */}
          {activeTab === 'automations' && (
            <Card className="p-8 shadow-lg border-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Automation List */}
                <div className="flex flex-col h-[600px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
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
                <div className="flex flex-col h-[600px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  {/* Header */}
                  <div className="px-6 py-4 border-b bg-gradient-to-r from-green-50 to-green-100/50 flex-shrink-0 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 mb-1">
                        {automations.find(a => a.id === selectedAutomation)?.title || "Select an automation"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {automations.find(a => a.id === selectedAutomation)?.description || "Choose an automation to view its workflow"}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm border border-green-200 text-green-600 shadow-sm hover:bg-green-50 hover:text-green-700 transition-all flex-shrink-0"
                      aria-label="Setup automation"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Flow Diagram */}
                  <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                    {(() => {
                      const nodes = getAutomationNodes(selectedAutomation);
                      if (nodes.length === 0) {
                        return (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center max-w-sm">
                              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                <Bot className="h-8 w-8 text-slate-400" />
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
                        <div className="relative min-h-full">
                          <div className="flex flex-col gap-6">
                            {nodes.map((node, index) => {
                              const isLast = index === nodes.length - 1;

                              const getGradientClasses = () => {
                                switch (node.type) {
                                  case "trigger":
                                    return "from-blue-500 to-blue-600";
                                  case "action":
                                    return "from-green-500 to-green-600";
                                  case "condition":
                                    return "from-purple-500 to-purple-600";
                                  case "delay":
                                    return "from-amber-500 to-amber-600";
                                  default:
                                    return "from-slate-500 to-slate-600";
                                }
                              };

                              return (
                                <div key={node.id} className="relative">
                                  <div className="flex items-start gap-4">
                                    {/* Node with gradient */}
                                    <div className="relative flex-shrink-0">
                                      <div
                                        className={cn(
                                          "w-16 h-16 rounded-xl bg-gradient-to-br shadow-lg flex items-center justify-center",
                                          getGradientClasses()
                                        )}
                                      >
                                        <node.icon className="h-7 w-7 text-white" />
                                      </div>
                                      
                                      {/* Connector line */}
                                      {!isLast && (
                                        <div className="absolute left-1/2 top-16 -translate-x-1/2 w-0.5 h-6 bg-green-400">
                                          <div className="absolute left-1/2 top-full -translate-x-1/2 w-2 h-2 rounded-full bg-green-400"></div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Node Info */}
                                    <div className="flex-1 min-w-0 pt-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-semibold text-gray-900">{node.title}</p>
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
                      );
                    })()}
                  </div>
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
                    <h3 className="text-lg font-semibold mb-1">November 7</h3>
                    <p className="text-sm text-muted-foreground">All events, tasks, and opportunities</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Morning</h4>
                    <div className="space-y-3">
                      {events.map((event, index) => (
                        <div 
                          key={index}
                          className="flex items-start gap-3 p-4 rounded-lg border hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
                          role="button"
                          tabIndex={0}
                          aria-label={`${event.title} - ${event.time}`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              // Handle event click
                            }
                          }}
                        >
                          <div className={`p-2 rounded-lg ${event.iconColor}`}>
                            <event.icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm mb-1">{event.title}</h4>
                            <p className="text-xs text-muted-foreground mb-2">{event.time}</p>
                            <Badge className={`${event.badgeColor} border-0 text-xs`}>
                              {event.badge}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* MESSAGES TAB */}
          {activeTab === 'messages' && (
            <Card className="p-8 shadow-lg border-0">
              <div className="shadow-sm border rounded-xl overflow-hidden h-[600px] flex bg-white">
              {/* Messages List - iOS Style */}
              <div className="w-[360px] border-r flex flex-col flex-shrink-0 bg-white">
                {/* Header */}
                <div className="px-5 py-4 border-b flex-shrink-0">
                  <h3 className="text-2xl font-bold tracking-tight">Messages</h3>
                  <p className="text-sm text-gray-500 mt-0.5">12 conversations</p>
                </div>
                
                {/* Conversation List */}
                <div className="flex-1 overflow-y-scroll" style={{ maxHeight: 'calc(600px - 80px)' }}>
                  {messagesList.map((msg, index) => (
                    <div 
                      key={index}
                      onClick={() => setSelectedConversation(index)}
                      className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-all duration-150 border-b border-gray-100 ${
                        index === selectedConversation 
                          ? 'bg-blue-50/50 hover:bg-blue-50' 
                          : 'hover:bg-gray-50 active:bg-gray-100'
                      }`}
                      role="button"
                      tabIndex={0}
                      aria-label={`Open conversation with ${msg.name}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedConversation(index);
                        }
                      }}
                    >
                      <Avatar className="flex-shrink-0 h-12 w-12 ring-2 ring-white">
                        <AvatarFallback className={`${msg.color} text-white text-sm font-semibold`}>
                          {msg.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-baseline justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-[15px] truncate text-gray-900">{msg.name}</h4>
                          <span className="text-[13px] text-gray-500 whitespace-nowrap">{msg.time}</span>
                        </div>
                        <p className="text-[15px] text-gray-600 line-clamp-2 leading-snug">{msg.message}</p>
                      </div>
                      {msg.unread && (
                        <div className="flex-shrink-0 self-start mt-1">
                          <div className="bg-blue-500 text-white text-[11px] font-semibold h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center" aria-label={`${msg.unread} unread messages`}>
                            {msg.unread}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Conversation Area - iOS iMessage Style */}
              <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-gray-50/30 to-white">
                {/* Conversation Header */}
                <div className="px-6 py-4 border-b bg-white/80 backdrop-blur-sm flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                      <AvatarFallback className={`${messagesList[selectedConversation].color} text-white text-sm font-semibold`}>
                        {messagesList[selectedConversation].initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-[15px] text-gray-900">{messagesList[selectedConversation].name}</h3>
                      <p className={`text-[13px] flex items-center gap-1 ${messagesList[selectedConversation].status?.includes('Active now') ? 'text-green-600' : 'text-gray-500'}`}>
                        {messagesList[selectedConversation].status?.includes('Active now') && (
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-label="Active now" />
                        )}
                        {messagesList[selectedConversation].status || 'Offline'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-scroll px-6 py-4" style={{ maxHeight: 'calc(600px - 140px)' }}>
                  <div className="space-y-3">
                    {messagesList[selectedConversation]?.conversation?.map((msg, index) => (
                      <div 
                        key={index}
                        className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[75%] ${msg.isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                          <div className={`px-4 py-2.5 shadow-sm ${
                            msg.isUser 
                              ? 'bg-blue-500 text-white rounded-[18px] rounded-br-md' 
                              : 'bg-gray-100 text-gray-900 rounded-[18px] rounded-bl-md border border-gray-200/50'
                          }`}>
                            <p className="text-[15px] leading-relaxed">{msg.message}</p>
                          </div>
                          <p className={`text-[11px] text-gray-500 px-3 ${msg.isUser ? 'text-right' : 'text-left'}`}>
                            {msg.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Input Area - iOS Style */}
                <div className="px-4 py-3 border-t bg-white/80 backdrop-blur-sm flex-shrink-0">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                      <Input 
                        placeholder="Message"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        className="w-full rounded-full border-gray-300 bg-gray-50 px-4 py-2.5 text-[15px] focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                        aria-label="Type message"
                      />
                    </div>
                    <Button 
                      size="icon" 
                      className="h-9 w-9 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-sm flex-shrink-0 transition-all hover:scale-105 active:scale-95"
                      aria-label="Send message"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              </div>
            </Card>
          )}

          {/* AGENTS TAB */}
          {activeTab === 'agents' && (
            <Card className="p-8 shadow-lg border-0">
              <div className="shadow-sm border rounded-xl overflow-hidden h-[600px] flex bg-white">
                {/* Agents List - iOS Style */}
              <div className="w-[360px] border-r flex flex-col flex-shrink-0 bg-white">
                {/* Header */}
                <div className="px-5 py-4 border-b flex-shrink-0">
                  <h3 className="text-2xl font-bold tracking-tight">AI Agents</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {isLoadingAgents 
                      ? 'Loading...' 
                      : agentsError 
                        ? 'Error loading agents' 
                        : `${agentsList.length} ${agentsList.length === 1 ? 'agent' : 'agents'}`}
                  </p>
                </div>
                
                {/* Agent List */}
                <div className="flex-1 overflow-y-scroll" style={{ maxHeight: 'calc(600px - 80px)' }}>
                  {isLoadingAgents ? (
                    <div className="p-4 space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-start gap-3">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : agentsError ? (
                    <div className="p-8 text-center">
                      <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-4">Failed to load agents</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // SWR will automatically retry
                          window.location.reload();
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                  ) : agentsList.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bot className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No agents found</p>
                    </div>
                  ) : (
                    agentsList.map((agent, index) => (
                    <div 
                      key={index}
                      onClick={() => setSelectedAgent(index)}
                      className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-all duration-150 border-b border-gray-100 ${
                        index === selectedAgent 
                          ? 'bg-blue-50/50 hover:bg-blue-50' 
                          : 'hover:bg-gray-50 active:bg-gray-100'
                      }`}
                      role="button"
                      tabIndex={0}
                      aria-label={`Open conversation with ${agent.name}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedAgent(index);
                        }
                      }}
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-12 w-12 ring-2 ring-white">
                          <AvatarFallback className={`${agent.color} text-white text-sm font-semibold`}>
                            {agent.initials}
                          </AvatarFallback>
                        </Avatar>
                        {agent.active && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" aria-label="Active" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-baseline justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-[15px] truncate text-gray-900">{agent.name}</h4>
                          <span className="text-[13px] text-gray-500 whitespace-nowrap">{agent.time}</span>
                        </div>
                        <p className="text-[15px] text-gray-600 line-clamp-2 leading-snug">{agent.message}</p>
                      </div>
                    </div>
                    ))
                  )}
                </div>
              </div>

              {/* Conversation Area - iOS iMessage Style */}
              <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-gray-50/30 to-white">
                {agentsList.length > 0 && agentsList[selectedAgent] ? (
                  <>
                    {/* Conversation Header */}
                    <div className="px-6 py-4 border-b bg-white/80 backdrop-blur-sm flex-shrink-0">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                          <AvatarFallback className={`${agentsList[selectedAgent]?.color} text-white text-sm font-semibold`}>
                            {agentsList[selectedAgent]?.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-[15px] text-gray-900">{agentsList[selectedAgent]?.name}</h3>
                          <p className={`text-[13px] flex items-center gap-1 ${agentsList[selectedAgent]?.status?.includes('Active now') ? 'text-green-600' : 'text-gray-500'}`}>
                            {agentsList[selectedAgent]?.status?.includes('Active now') && (
                              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-label="Active now" />
                            )}
                            {agentsList[selectedAgent]?.status || agentsList[selectedAgent]?.role}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-scroll px-6 py-4" style={{ maxHeight: 'calc(600px - 140px)' }}>
                      <div className="space-y-3">
                        {agentsList[selectedAgent]?.conversation && agentsList[selectedAgent].conversation.length > 0 ? (
                          agentsList[selectedAgent].conversation.map((msg, index) => (
                            <div 
                              key={index}
                              className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-[75%] ${msg.isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                <div className={`px-4 py-2.5 shadow-sm ${
                                  msg.isUser 
                                    ? 'bg-blue-500 text-white rounded-[18px] rounded-br-md' 
                                    : 'bg-gray-100 text-gray-900 rounded-[18px] rounded-bl-md border border-gray-200/50'
                                }`}>
                                  <p className="text-[15px] leading-relaxed">{msg.message}</p>
                                </div>
                                <p className={`text-[11px] text-gray-500 px-3 ${msg.isUser ? 'text-right' : 'text-left'}`}>
                                  {msg.time}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center justify-center h-full text-center p-8">
                            <div>
                              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                              <p className="text-sm text-muted-foreground">No conversation history</p>
                              <p className="text-xs text-muted-foreground mt-1">Start a conversation with this agent</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Input Area - iOS Style */}
                    <div className="px-4 py-3 border-t bg-white/80 backdrop-blur-sm flex-shrink-0">
                      <div className="flex items-end gap-2">
                        <div className="flex-1 relative">
                          <Input 
                            placeholder="Message"
                            value={agentMessageInput}
                            onChange={(e) => setAgentMessageInput(e.target.value)}
                            className="w-full rounded-full border-gray-300 bg-gray-50 px-4 py-2.5 text-[15px] focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                            aria-label="Type message to agent"
                          />
                        </div>
                        <Button 
                          size="icon"
                          className="h-9 w-9 rounded-full bg-blue-500 hover:bg-blue-600 flex-shrink-0"
                          aria-label="Send message"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-sm text-muted-foreground">Select an agent to view conversation</p>
                    </div>
                  </div>
                )}
              </div>
              </div>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

