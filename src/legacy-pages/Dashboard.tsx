"use client";

import { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { CustomCalendar } from "../components/ui/custom-calendar";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
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
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { DashboardData } from "../types/dashboard";

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then((r) => r.json());

type TabType = 'tips' | 'snapshot' | 'automations' | 'planner' | 'messages' | 'agents';

export function Dashboard({ initialData }: { initialData?: DashboardData }) {
  const [activeTab, setActiveTab] = useState<TabType>('tips');
  const [date, setDate] = useState<Date | undefined>(new Date(2025, 10, 7)); // November 7, 2025
  const [messageInput, setMessageInput] = useState("");
  const [agentMessageInput, setAgentMessageInput] = useState("");
  const [selectedConversation, setSelectedConversation] = useState(0); // Track selected conversation
  const [selectedAgent, setSelectedAgent] = useState(0); // Track selected agent
  const [isLoadingChat, setIsLoadingChat] = useState(false); // Loading state for AI chat

  // Fetch live dashboard stats (refreshes every 30 seconds)
  const { data: liveStats } = useSWR('/api/dashboard', fetcher, {
    refreshInterval: 30000, // 30 seconds
    fallbackData: initialData,
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

  // Example questions for Tips tab
  const exampleQuestions = [
    "How can I automate my email follow-ups?",
    "What's blocking my lead conversion?",
    "Show me what I should focus on today"
  ];

  // Quick actions for Tips tab
  const quickActions = [
    { 
      icon: Mail, 
      iconColor: 'bg-blue-100 text-blue-600',
      title: "Auto-respond to 12 emails", 
      subtitle: "Save ~45 min • Drafts ready for review" 
    },
    { 
      icon: FileText, 
      iconColor: 'bg-green-100 text-green-600',
      title: "Generate meeting brief for 3pm call", 
      subtitle: "TechCorp • Context from 8 sources" 
    },
    { 
      icon: Target, 
      iconColor: 'bg-purple-100 text-purple-600',
      title: "Score and prioritize 5 new leads", 
      subtitle: "AI confidence: High • Ready to assign" 
    },
    { 
      icon: Database, 
      iconColor: 'bg-blue-100 text-blue-600',
      title: "Sync 24 contacts to Salesforce", 
      subtitle: "Updated data • Resolve duplicates" 
    },
    { 
      icon: List, 
      iconColor: 'bg-orange-100 text-orange-600',
      title: "Create daily action digest", 
      subtitle: "Top 10 priorities • Morning summary" 
    },
  ];

  // Quick wins for Snapshot tab
  const quickWins = [
    { 
      title: "3 high-value leads need follow-up", 
      subtitle: "Qualified in last 24h • Avg. deal size $24k",
      button: "Review Leads" 
    },
    { 
      title: "12 emails can be auto-responded", 
      subtitle: "Save ~45 minutes • Drafts ready for review",
      button: "Review Drafts" 
    },
    { 
      title: "Meeting prep brief ready for 3pm call", 
      subtitle: "With TechCorp • Context from 8 sources",
      button: "View Brief" 
    },
  ];

  // Key insights for Snapshot tab
  const keyInsights = [
    "Lead qualification rate improved 28% after implementing new scoring criteria",
    "Meeting notes agent detected 5 action items across today's calls — all assigned",
    "CRM data quality score: 94% (up from 87% last month)",
    "Invoice processing time reduced to avg. 4.2 minutes (down from 12 minutes)",
    "Workflow automation saved 2.5 hours today — on track for 62 hours this month"
  ];

  // Automation pairs
  const automationPairs = [
    {
      problem: { 
        icon: AlertCircle, 
        iconColor: 'bg-red-100 text-red-600',
        title: "Inbox Overwhelm", 
        description: "47 unread high-priority emails are piling up, causing response delays and potentially missed opportunities" 
      },
      solution: { 
        icon: Zap, 
        iconColor: 'bg-green-100 text-green-600',
        title: "Email Triage Agent", 
        description: "Auto-categorize, draft responses, and queue for your review — save ~2 hours" 
      }
    },
    {
      problem: { 
        icon: Clock, 
        iconColor: 'bg-yellow-100 text-yellow-600',
        title: "Manual Lead Scoring", 
        description: "15 new leads need qualification, but manually researching each takes 20+ minutes per lead" 
      },
      solution: { 
        icon: Target, 
        iconColor: 'bg-blue-100 text-blue-600',
        title: "Smart Lead Qualifier", 
        description: "AI enriches data, scores leads by fit, and prioritizes — ready in 3 minutes" 
      }
    },
    {
      problem: { 
        icon: FileText, 
        iconColor: 'bg-purple-100 text-purple-600',
        title: "Meeting Prep Takes Forever", 
        description: "Upcoming client call in 1 hour — need to review emails, past notes, and CRM history" 
      },
      solution: { 
        icon: FileText, 
        iconColor: 'bg-indigo-100 text-indigo-600',
        title: "Meeting Prep Agent", 
        description: "Auto-generate context brief from 8 sources — delivered in 2 minutes" 
      }
    },
    {
      problem: { 
        icon: Database, 
        iconColor: 'bg-orange-100 text-orange-600',
        title: "CRM Data is Messy", 
        description: "34 duplicate contacts, missing fields, and outdated info — data quality at 67%" 
      },
      solution: { 
        icon: Sparkles, 
        iconColor: 'bg-cyan-100 text-cyan-600',
        title: "CRM Data Cleaner", 
        description: "Merge duplicates, enrich fields, update info — boost to 94% quality" 
      }
    },
  ];

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

  // Agents list with conversations
  const agentsList = [
    {
      name: "Email Triage Agent",
      initials: "ET",
      color: "bg-blue-500",
      message: "Daily Report: Processed 47 emails with 94% accuracy",
      time: "10 min ago",
      active: true,
      status: "Active now",
      role: "Email Automation",
      conversation: [
        {
          sender: "You",
          message: "Great work! Can you be more aggressive with filtering promotional emails?",
          time: "Yesterday, 5:15 PM",
          isUser: true
        },
        {
          sender: "Email Triage Agent",
          message: "Understood! I've adjusted my filtering rules to be more aggressive with promotional content. I'll learn from your preferences over the next few days and fine-tune automatically. 📊",
          time: "Yesterday, 5:16 PM",
          isUser: false
        },
        {
          sender: "Email Triage Agent",
          message: "Daily Report: Processed 47 emails today with 94% accuracy. Applied your preference - filtered 15 promotional emails (up from usual 8). Would you like me to continue at this level?",
          time: "10 min ago",
          isUser: false
        },
      ]
    },
    {
      name: "CRM Data Sync",
      initials: "CD",
      color: "bg-cyan-500",
      message: "Maintenance: API rate limit approaching, optimizing...",
      time: "30 min ago",
      active: true,
      status: "Active now",
      role: "Data Management",
      conversation: [
        {
          sender: "CRM Data Sync",
          message: "I've detected 34 duplicate contacts in your CRM. Should I merge them automatically?",
          time: "Today, 9:00 AM",
          isUser: false
        },
        {
          sender: "You",
          message: "Yes, please merge duplicates but show me a summary first.",
          time: "Today, 9:05 AM",
          isUser: true
        },
        {
          sender: "CRM Data Sync",
          message: "Perfect! All 34 duplicates merged successfully. I've also enriched 67 contacts with LinkedIn data. Maintenance: API rate limit approaching, optimizing refresh schedule...",
          time: "30 min ago",
          isUser: false
        },
      ]
    },
    {
      name: "Meeting Notes Generator",
      initials: "MN",
      color: "bg-purple-500",
      message: "Suggestion: I can now auto-create follow-up tasks",
      time: "1 hour ago",
      active: false,
      status: "Active 1h ago",
      role: "Meeting Assistant",
      conversation: [
        {
          sender: "You",
          message: "Can you generate notes from this morning's client call?",
          time: "Today, 11:30 AM",
          isUser: true
        },
        {
          sender: "Meeting Notes Generator",
          message: "Done! I've created comprehensive notes from the 45-minute call with TechCorp. Key points: Budget approved, timeline set for Q2, 3 action items assigned.",
          time: "Today, 11:35 AM",
          isUser: false
        },
        {
          sender: "Meeting Notes Generator",
          message: "Suggestion: I can now auto-create follow-up tasks from meeting action items and assign them to the right team members. Want me to enable this?",
          time: "1 hour ago",
          isUser: false
        },
      ]
    },
    {
      name: "Lead Qualifier",
      initials: "LQ",
      color: "bg-green-500",
      message: "Performance: Qualified 426 leads this month, 78% accuracy",
      time: "Yesterday",
      active: false,
      status: "Yesterday at 4:30 PM",
      role: "Sales Intelligence",
      conversation: [
        {
          sender: "Lead Qualifier",
          message: "I've qualified 23 new leads from yesterday's webinar. 8 are high-priority enterprise prospects.",
          time: "Yesterday, 2:00 PM",
          isUser: false
        },
        {
          sender: "You",
          message: "Excellent! What's their average company size?",
          time: "Yesterday, 2:15 PM",
          isUser: true
        },
        {
          sender: "Lead Qualifier",
          message: "Average: 250-500 employees. Top 3 prospects are in fintech, each with 500+ employees. Performance: Qualified 426 leads this month, 78% accuracy.",
          time: "Yesterday, 4:30 PM",
          isUser: false
        },
      ]
    },
    {
      name: "Invoice Processor",
      initials: "IP",
      color: "bg-orange-500",
      message: "I've learned your approval patterns - automating more",
      time: "2 days ago",
      active: false,
      status: "2 days ago at 3:15 PM",
      role: "Finance Automation",
      conversation: [
        {
          sender: "Invoice Processor",
          message: "I've processed 47 invoices this week. 12 are awaiting your approval for amounts over $5,000.",
          time: "2 days ago, 3:00 PM",
          isUser: false
        },
        {
          sender: "You",
          message: "Can you auto-approve invoices from verified vendors under $10k?",
          time: "2 days ago, 3:10 PM",
          isUser: true
        },
        {
          sender: "Invoice Processor",
          message: "Updated! I've learned your approval patterns from the past 6 months. Now auto-approving verified vendors under $10k. This should save you ~3 hours per week.",
          time: "2 days ago, 3:15 PM",
          isUser: false
        },
      ]
    },
    {
      name: "Content Generator",
      initials: "CG",
      color: "bg-pink-500",
      message: "Created 15 social media posts for next week",
      time: "3 days ago",
      active: false,
      status: "3 days ago",
      role: "Content Creation",
      conversation: [
        {
          sender: "Content Generator",
          message: "Created 15 social media posts for next week based on your content calendar and brand voice.",
          time: "3 days ago, 10:00 AM",
          isUser: false
        },
        {
          sender: "You",
          message: "Can you make them more engaging?",
          time: "3 days ago, 10:30 AM",
          isUser: true
        },
        {
          sender: "Content Generator",
          message: "Updated all posts with more engaging hooks and CTAs. Also added trending hashtags relevant to your industry.",
          time: "3 days ago, 11:00 AM",
          isUser: false
        },
      ]
    },
    {
      name: "Data Analyzer",
      initials: "DA",
      color: "bg-indigo-500",
      message: "Monthly analytics report is ready for review",
      time: "4 days ago",
      active: false,
      status: "4 days ago",
      role: "Business Intelligence",
      conversation: [
        {
          sender: "Data Analyzer",
          message: "Monthly analytics report is ready for review. Key insight: conversion rate increased 23% after implementing new email templates.",
          time: "4 days ago, 2:00 PM",
          isUser: false
        },
      ]
    },
  ];

  return (
    <>
      {/* Dashboard Container - No scroll, fixed to viewport */}
      <div className="h-full bg-gray-50/50 overflow-hidden">
        {/* Header Section - Compact */}
        <div className="max-w-7xl mx-auto px-6 py-4 space-y-4">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-base">
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

          {/* Floating Tab Bar */}
          <div className="flex justify-center">
            <div className="bg-background/80 backdrop-blur-lg rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-2 inline-flex gap-1">
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

        {/* Tab Content - Layout varies by tab */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* TIPS TAB - Constrained */}
            {activeTab === 'tips' && (
              <div className="max-w-7xl mx-auto px-6">
                <Card className="p-8 shadow-lg border-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left: Ask Your AI Assistant - Chat Window Style */}
                    <div className="flex flex-col h-[600px] rounded-xl border bg-white overflow-hidden shadow-sm">
                      {/* Chat Header */}
                      <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-purple-100/50 flex-shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md">
                            <MessageSquare className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-[15px] text-gray-900">AI Assistant</h3>
                            <p className="text-[13px] text-green-600 flex items-center gap-1">
                              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                              Ready to help
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Chat Messages Area */}
                      <div className="flex-1 overflow-y-auto px-6 py-4 bg-gradient-to-b from-gray-50/30 to-white">
                        <div className="space-y-4">
                          {/* AI Welcome Message */}
                          <div className="flex justify-start">
                            <div className="max-w-[85%]">
                              <div className="px-4 py-3 bg-gray-100 text-gray-900 rounded-[18px] rounded-bl-md border border-gray-200/50 shadow-sm">
                                <p className="text-[15px] leading-relaxed">
                                  👋 Hi! I&apos;m your AI assistant. I can help you automate tasks, answer questions about your workflows, or provide insights from your data.
                                </p>
                              </div>
                              <p className="text-[11px] text-gray-500 px-3 mt-1">Just now</p>
                            </div>
                          </div>

                          {/* Suggested Questions as Chips */}
                          {chatMessages.length === 0 && (
                            <div className="flex justify-start">
                              <div className="max-w-[90%]">
                                <div className="px-4 py-3 bg-gray-100 text-gray-900 rounded-[18px] rounded-bl-md border border-gray-200/50 shadow-sm">
                                  <p className="text-[14px] font-medium mb-3 text-gray-700">Try asking me:</p>
                                  <div className="space-y-2">
                                    {exampleQuestions.map((question, index) => (
                                      <button
                                        key={index}
                                        onClick={() => handleSuggestionClick(question)}
                                        disabled={isLoadingChat}
                                        className="w-full text-left px-4 py-2.5 bg-white hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-lg transition-all text-[14px] text-purple-600 hover:text-purple-700 font-medium shadow-sm hover:shadow group disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <span className="flex items-center gap-2">
                                          <Lightbulb className="h-4 w-4 group-hover:text-purple-600" />
                                          {question}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Chat Messages */}
                          {chatMessages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] ${msg.sender === 'user' ? 'max-w-[75%]' : ''}`}>
                                <div className={`px-4 py-3 rounded-[18px] border shadow-sm ${
                                  msg.sender === 'user' 
                                    ? 'bg-purple-500 text-white rounded-br-md border-purple-600' 
                                    : 'bg-gray-100 text-gray-900 rounded-bl-md border-gray-200/50'
                                }`}>
                                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                </div>
                                <p className={`text-[11px] text-gray-500 px-3 mt-1 ${msg.sender === 'user' ? 'text-right' : ''}`}>
                                  {msg.time}
                                </p>
                              </div>
                            </div>
                          ))}

                          {/* Loading Indicator */}
                          {isLoadingChat && (
                            <div className="flex justify-start">
                              <div className="max-w-[85%]">
                                <div className="px-4 py-3 bg-gray-100 text-gray-900 rounded-[18px] rounded-bl-md border border-gray-200/50 shadow-sm">
                                  <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                                    <p className="text-[15px] text-gray-600">AI is thinking...</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Helper Text */}
                          {chatMessages.length === 0 && (
                            <div className="flex justify-center">
                              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50/50 rounded-full">
                                <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                                <p className="text-[11px] text-purple-700 font-medium">
                                  AI analyzes your data in real-time for personalized insights
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Scroll anchor */}
                          <div ref={messagesEndRef} />
                        </div>
                      </div>

                      {/* Chat Input Area - iOS Style */}
                      <div className="px-4 py-3 border-t bg-white/80 backdrop-blur-sm flex-shrink-0">
                        <div className="flex items-end gap-2">
                          <div className="flex-1 relative">
                            <Input 
                              value={messageInput}
                              onChange={(e) => setMessageInput(e.target.value)}
                              onKeyPress={handleKeyPress}
                              disabled={isLoadingChat}
                              placeholder="Ask me anything about your workflows, tasks, or data..."
                              className="w-full rounded-full border-gray-300 bg-gray-50 px-4 py-2.5 text-[15px] focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                              aria-label="Ask AI Assistant"
                            />
                          </div>
                          <Button 
                            size="icon"
                            onClick={() => sendToAssistant(messageInput)}
                            disabled={isLoadingChat || !messageInput.trim()}
                            className="h-9 w-9 rounded-full bg-purple-500 hover:bg-purple-600 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                          >
                            {isLoadingChat ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Right: Quick Actions */}
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
                          <Zap className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold mb-1">Quick Actions</h3>
                          <p className="text-sm text-muted-foreground">
                            One-click solutions to solve your needs instantly
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {quickActions.map((action, index) => (
                          <div 
                            key={index}
                            className="flex items-start gap-3 p-4 rounded-lg border hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer group"
                          >
                            <div className={`p-2 rounded-lg ${action.iconColor} group-hover:scale-110 transition-transform`}>
                              <action.icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm mb-1">{action.title}</h4>
                              <p className="text-xs text-muted-foreground">{action.subtitle}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* SNAPSHOT TAB - Redesigned */}
            {activeTab === 'snapshot' && (
              <div className="max-w-7xl mx-auto px-6 pb-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Column 1: High Level Summary & Score */}
                  <div className="lg:col-span-3">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-1 shadow-xl">
                      <div className="relative h-full bg-white/95 backdrop-blur-xl rounded-[20px] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                          <div className="relative h-20 w-20 flex items-center justify-center">
                            <svg className="h-full w-full transform -rotate-90">
                              <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100" />
                              <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={226.2} strokeDashoffset={226.2 * (1 - 0.92)} className="text-purple-500" strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                              <span className="text-2xl font-bold text-purple-600">92</span>
                              <span className="text-[10px] font-medium text-gray-500 uppercase">Score</span>
                            </div>
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900">System Intelligence</h2>
                            <p className="text-gray-500 mt-1 max-w-md">
                              Your AI ecosystem is running efficiently. 3 actionable opportunities identified.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                           <Button variant="outline" className="rounded-full border-purple-200 text-purple-700 hover:bg-purple-50">
                             View Report
                           </Button>
                           <Button className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 shadow-lg shadow-purple-500/25 border-0">
                             <Sparkles className="mr-2 h-4 w-4" />
                             Optimize All
                           </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Quick Wins (Actionable) */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                       <h3 className="text-lg font-bold flex items-center gap-2">
                         <Zap className="h-5 w-5 text-amber-500" />
                         Actionable Wins
                       </h3>
                       <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">3 Available</Badge>
                    </div>
                    
                    <div className="grid gap-4">
                      {quickWins.map((win, index) => (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          key={index}
                          className="group relative bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:border-purple-200"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center border border-purple-100 flex-shrink-0">
                                <CheckCircle2 className="h-5 w-5 text-purple-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-800 text-sm">{win.title}</h4>
                                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{win.subtitle}</p>
                              </div>
                            </div>
                            <Button size="sm" className="rounded-full px-4 bg-white text-gray-700 border border-gray-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-all shadow-sm group-hover:shadow-md">
                              {win.button} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Column 3: Insights (Informational) */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <h3 className="text-lg font-bold flex items-center gap-2">
                         <Lightbulb className="h-5 w-5 text-blue-500" />
                         Key Insights
                       </h3>
                    </div>

                    <div className="bg-gradient-to-b from-white to-gray-50/50 rounded-3xl border border-gray-200/60 shadow-sm p-1">
                      <div className="space-y-1">
                        {keyInsights.map((insight, index) => (
                          <div key={index} className="p-4 hover:bg-white rounded-2xl transition-colors">
                            <div className="flex gap-3">
                              <div className="mt-1 h-2 w-2 rounded-full bg-blue-400 flex-shrink-0" />
                              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                {insight}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 pt-2 border-t border-gray-100/50">
                        <Button variant="ghost" className="w-full justify-between text-gray-500 hover:text-blue-600 text-xs font-medium h-8">
                          View All Insights <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                  </div>

                </div>
              </div>
            )}

            {/* AUTOMATIONS TAB - Constrained */}
            {activeTab === 'automations' && (
              <div className="max-w-7xl mx-auto px-6">
                <div className="space-y-6">
                  {automationPairs.map((pair, index) => (
                    <div key={index} className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-6 items-center min-w-0">
                      {/* Problem Card */}
                      <Card className="p-4 border hover:shadow-md transition-shadow min-w-0">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${pair.problem.iconColor} flex-shrink-0`}>
                            <pair.problem.icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm mb-1">{pair.problem.title}</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {pair.problem.description}
                            </p>
                          </div>
                        </div>
                      </Card>

                      {/* Arrow */}
                      <div className="flex justify-center flex-shrink-0">
                        <ArrowRight className="h-6 w-6 text-gray-400" />
                      </div>

                      {/* Solution Card */}
                      <Card className="p-4 border border-green-200 bg-gradient-to-br from-green-50/50 to-transparent hover:shadow-md transition-shadow min-w-0">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${pair.solution.iconColor} flex-shrink-0`}>
                            <pair.solution.icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm mb-1">{pair.solution.title}</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {pair.solution.description}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PLANNER TAB - Constrained */}
            {activeTab === 'planner' && (
              <div className="max-w-7xl mx-auto px-6">
                <Card className="p-6 shadow-lg border-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              </div>
            )}

            {/* MESSAGES TAB - Full Width with side margins */}
            {activeTab === 'messages' && (
              <div className="px-6">
                <div className="shadow-sm border rounded-lg overflow-hidden h-[700px] flex bg-white">
                  {/* Messages List - iOS Style */}
                  <div className="w-[360px] border-r flex flex-col flex-shrink-0 bg-white">
                    {/* Header */}
                    <div className="px-5 py-4 border-b flex-shrink-0">
                      <h3 className="text-2xl font-bold tracking-tight">Messages</h3>
                      <p className="text-sm text-gray-500 mt-0.5">12 conversations</p>
                    </div>
                    
                    {/* Conversation List */}
                    <div className="flex-1 overflow-y-scroll" style={{ maxHeight: 'calc(700px - 80px)' }}>
                      {messagesList.map((msg, index) => (
                        <div 
                          key={index}
                          onClick={() => setSelectedConversation(index)}
                          className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-all duration-150 border-b border-gray-100 ${
                            index === selectedConversation 
                              ? 'bg-blue-50/50 hover:bg-blue-50' 
                              : 'hover:bg-gray-50 active:bg-gray-100'
                          }`}
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
                              <div className="bg-blue-500 text-white text-[11px] font-semibold h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center">
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
                              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            )}
                            {messagesList[selectedConversation].status || 'Offline'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-scroll px-6 py-4" style={{ maxHeight: 'calc(700px - 140px)' }}>
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
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AGENTS TAB - Identical to Messages Tab */}
            {activeTab === 'agents' && (
              <div className="px-6">
                <div className="shadow-sm border rounded-lg overflow-hidden h-[700px] flex bg-white">
                  {/* Agents List - iOS Style */}
                  <div className="w-[360px] border-r flex flex-col flex-shrink-0 bg-white">
                    {/* Header */}
                    <div className="px-5 py-4 border-b flex-shrink-0">
                      <h3 className="text-2xl font-bold tracking-tight">AI Agents</h3>
                      <p className="text-sm text-gray-500 mt-0.5">7 autonomous agents</p>
                    </div>
                    
                    {/* Agent List */}
                    <div className="flex-1 overflow-y-scroll" style={{ maxHeight: 'calc(700px - 80px)' }}>
                      {agentsList.map((agent, index) => (
                        <div 
                          key={index}
                          onClick={() => setSelectedAgent(index)}
                          className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-all duration-150 border-b border-gray-100 ${
                            index === selectedAgent 
                              ? 'bg-blue-50/50 hover:bg-blue-50' 
                              : 'hover:bg-gray-50 active:bg-gray-100'
                          }`}
                        >
                          <div className="relative flex-shrink-0">
                            <Avatar className="h-12 w-12 ring-2 ring-white">
                              <AvatarFallback className={`${agent.color} text-white text-sm font-semibold`}>
                                {agent.initials}
                              </AvatarFallback>
                            </Avatar>
                            {agent.active && (
                              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
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
                      ))}
                    </div>
                  </div>

                  {/* Conversation Area - iOS iMessage Style */}
                  <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-gray-50/30 to-white">
                    {/* Conversation Header */}
                    <div className="px-6 py-4 border-b bg-white/80 backdrop-blur-sm flex-shrink-0">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                          <AvatarFallback className={`${agentsList[selectedAgent].color} text-white text-sm font-semibold`}>
                            {agentsList[selectedAgent].initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-[15px] text-gray-900">{agentsList[selectedAgent].name}</h3>
                          <p className={`text-[13px] flex items-center gap-1 ${agentsList[selectedAgent].status?.includes('Active now') ? 'text-green-600' : 'text-gray-500'}`}>
                            {agentsList[selectedAgent].status?.includes('Active now') && (
                              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            )}
                            {agentsList[selectedAgent].status || agentsList[selectedAgent].role}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-scroll px-6 py-4" style={{ maxHeight: 'calc(700px - 140px)' }}>
                      <div className="space-y-3">
                        {agentsList[selectedAgent].conversation.map((msg, index) => (
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
                            value={agentMessageInput}
                            onChange={(e) => setAgentMessageInput(e.target.value)}
                            className="w-full rounded-full border-gray-300 bg-gray-50 px-4 py-2.5 text-[15px] focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                            aria-label="Type message to agent"
                          />
                        </div>
                        <Button 
                          size="icon"
                          className="h-9 w-9 rounded-full bg-blue-500 hover:bg-blue-600 flex-shrink-0"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
