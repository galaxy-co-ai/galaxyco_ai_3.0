"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Search,
  Plus,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  FileText,
  Zap,
  Megaphone,
  BarChart3,
  Users,
  Mail,
  Share2,
  Target,
  Send,
  X,
  UserPlus,
  TrendingDown,
  Clock,
  DollarSign,
  CheckCircle2,
  Video,
  Image as ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import MarketingAutomationsTab from "./MarketingAutomationsTab";
import { logger } from "@/lib/logger";

interface Campaign {
  id: string;
  name: string;
  status: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roi: number;
  startDate: Date | null;
  endDate: Date | null;
  channels: string[];
}

interface Content {
  id: string;
  title: string;
  type: string;
  status: string;
  views: number;
  engagement: number;
  publishedAt: Date | null;
  author: string;
  content?: string;
  excerpt?: string;
}

interface Channel {
  id: string;
  name: string;
  type: string;
  status: string;
  performance: number;
  budget: number;
  reach: number;
}

interface MarketingDashboardProps {
  initialCampaigns: Campaign[];
  initialContent: Content[];
  initialChannels: Channel[];
  stats: {
    activeCampaigns: number;
    totalBudget: number;
    totalImpressions: number;
    avgROI: number;
  };
}

type TabType = 'campaigns' | 'content' | 'channels' | 'analytics' | 'audiences' | 'automations';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function MarketingDashboard({
  initialCampaigns,
  initialContent,
  initialChannels,
  stats,
}: MarketingDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('campaigns');
  const [searchQuery, setSearchQuery] = useState("");
  const [showCampaignChat, setShowCampaignChat] = useState(false);
  const [showContentChat, setShowContentChat] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [channelSearchQuery, setChannelSearchQuery] = useState("");
  const [selectedAnalyticsCampaign, setSelectedAnalyticsCampaign] = useState<Campaign | null>(null);
  const [analyticsSearchQuery, setAnalyticsSearchQuery] = useState("");
  const [selectedAudience, setSelectedAudience] = useState<string>("high-value");
  const [audienceSearchQuery, setAudienceSearchQuery] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm here to help you create a new marketing campaign. Let's start with the basics - what's the goal of this campaign? (e.g., product launch, brand awareness, lead generation)",
      timestamp: new Date(),
    },
  ]);
  const [contentChatMessages, setContentChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm here to help you create new marketing content. What type of content would you like to create? (e.g., blog post, social media post, email newsletter, video script)",
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [contentChatInput, setContentChatInput] = useState("");
  const [campaignData, setCampaignData] = useState({
    name: "",
    goal: "",
    budget: "",
    channels: [] as string[],
    startDate: "",
    endDate: "",
    targetAudience: "",
  });
  const [contentData, setContentData] = useState({
    title: "",
    type: "",
    topic: "",
    targetAudience: "",
    tone: "",
    keywords: [] as string[],
    publishDate: "",
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const getAudienceBehaviorData = (audienceId: string) => {
    const behaviors: Record<string, Array<{ label: string; description: string; value: string; percentage?: number }>> = {
      'high-value': [
        { label: 'Email Opens', description: 'Average opens per email campaign', value: '68%', percentage: 68 },
        { label: 'Website Visits', description: 'Monthly active website visitors', value: '89%', percentage: 89 },
        { label: 'Content Downloads', description: 'Downloads per user per month', value: '3.2', percentage: 65 },
        { label: 'Purchase Frequency', description: 'Average purchases per quarter', value: '2.8', percentage: 70 },
      ],
      'new-leads': [
        { label: 'Email Opens', description: 'Average opens per email campaign', value: '45%', percentage: 45 },
        { label: 'Website Visits', description: 'Monthly active website visitors', value: '62%', percentage: 62 },
        { label: 'Content Downloads', description: 'Downloads per user per month', value: '1.5', percentage: 30 },
        { label: 'Form Submissions', description: 'Average form submissions per user', value: '2.1', percentage: 42 },
      ],
      'engaged': [
        { label: 'Email Opens', description: 'Average opens per email campaign', value: '72%', percentage: 72 },
        { label: 'Website Visits', description: 'Monthly active website visitors', value: '94%', percentage: 94 },
        { label: 'Content Downloads', description: 'Downloads per user per month', value: '4.8', percentage: 96 },
        { label: 'Social Interactions', description: 'Average social engagements per user', value: '12.3', percentage: 82 },
      ],
      'inactive': [
        { label: 'Email Opens', description: 'Average opens per email campaign', value: '12%', percentage: 12 },
        { label: 'Website Visits', description: 'Monthly active website visitors', value: '8%', percentage: 8 },
        { label: 'Last Activity', description: 'Average days since last activity', value: '45 days', percentage: 5 },
        { label: 'Re-engagement Rate', description: 'Response to re-engagement campaigns', value: '3%', percentage: 3 },
      ],
      'trial': [
        { label: 'Email Opens', description: 'Average opens per email campaign', value: '58%', percentage: 58 },
        { label: 'Feature Usage', description: 'Average features used per user', value: '6.2', percentage: 62 },
        { label: 'Support Tickets', description: 'Average support interactions', value: '1.8', percentage: 36 },
        { label: 'Conversion Likelihood', description: 'Predicted conversion probability', value: '28%', percentage: 28 },
      ],
      'churned': [
        { label: 'Email Opens', description: 'Average opens per email campaign', value: '8%', percentage: 8 },
        { label: 'Website Visits', description: 'Monthly active website visitors', value: '5%', percentage: 5 },
        { label: 'Win-Back Response', description: 'Response to win-back campaigns', value: '2%', percentage: 2 },
        { label: 'Days Since Churn', description: 'Average days since cancellation', value: '120 days', percentage: 1 },
      ],
      'vip': [
        { label: 'Email Opens', description: 'Average opens per email campaign', value: '85%', percentage: 85 },
        { label: 'Website Visits', description: 'Monthly active website visitors', value: '96%', percentage: 96 },
        { label: 'Content Downloads', description: 'Downloads per user per month', value: '8.5', percentage: 85 },
        { label: 'Referral Rate', description: 'Average referrals per user', value: '3.2', percentage: 80 },
      ],
      'prospects': [
        { label: 'Email Opens', description: 'Average opens per email campaign', value: '52%', percentage: 52 },
        { label: 'Website Visits', description: 'Monthly active website visitors', value: '71%', percentage: 71 },
        { label: 'Content Downloads', description: 'Downloads per user per month', value: '2.8', percentage: 56 },
        { label: 'Meeting Requests', description: 'Average meeting requests per user', value: '1.2', percentage: 24 },
      ],
    };
    return behaviors[audienceId] || [];
  };

  const getChannelEngagementData = (audienceId: string) => {
    const channels: Record<string, Array<{ name: string; icon: string; engagement: number }>> = {
      'high-value': [
        { name: 'Email', icon: 'mail', engagement: 68 },
        { name: 'Social Media', icon: 'social', engagement: 45 },
        { name: 'Paid Ads', icon: 'ads', engagement: 32 },
      ],
      'new-leads': [
        { name: 'Email', icon: 'mail', engagement: 45 },
        { name: 'Social Media', icon: 'social', engagement: 38 },
        { name: 'Paid Ads', icon: 'ads', engagement: 52 },
      ],
      'engaged': [
        { name: 'Email', icon: 'mail', engagement: 72 },
        { name: 'Social Media', icon: 'social', engagement: 68 },
        { name: 'Paid Ads', icon: 'ads', engagement: 28 },
      ],
      'inactive': [
        { name: 'Email', icon: 'mail', engagement: 12 },
        { name: 'Social Media', icon: 'social', engagement: 8 },
        { name: 'Paid Ads', icon: 'ads', engagement: 5 },
      ],
      'trial': [
        { name: 'Email', icon: 'mail', engagement: 58 },
        { name: 'Social Media', icon: 'social', engagement: 42 },
        { name: 'Paid Ads', icon: 'ads', engagement: 18 },
      ],
      'churned': [
        { name: 'Email', icon: 'mail', engagement: 8 },
        { name: 'Social Media', icon: 'social', engagement: 4 },
        { name: 'Paid Ads', icon: 'ads', engagement: 2 },
      ],
      'vip': [
        { name: 'Email', icon: 'mail', engagement: 85 },
        { name: 'Social Media', icon: 'social', engagement: 72 },
        { name: 'Paid Ads', icon: 'ads', engagement: 15 },
      ],
      'prospects': [
        { name: 'Email', icon: 'mail', engagement: 52 },
        { name: 'Social Media', icon: 'social', engagement: 48 },
        { name: 'Paid Ads', icon: 'ads', engagement: 61 },
      ],
    };
    return channels[audienceId] || [];
  };

  // Stat badges
  const statBadges = [
    { label: `${stats.activeCampaigns} Active Campaigns`, icon: Megaphone, color: "bg-pink-100 text-pink-700" },
    { label: `${formatCurrency(stats.totalBudget)} Budget`, icon: TrendingUp, color: "bg-blue-100 text-blue-700" },
    { label: `${stats.totalImpressions.toLocaleString()} Impressions`, icon: BarChart3, color: "bg-purple-100 text-purple-700" },
    { label: `${stats.avgROI}% Avg ROI`, icon: ArrowUpRight, color: "bg-green-100 text-green-700" },
  ];

  // Tab configuration
  const tabs = [
    { id: 'campaigns' as TabType, label: 'Campaigns', icon: Megaphone, badge: stats.activeCampaigns.toString(), badgeColor: 'bg-pink-500', activeColor: 'bg-pink-100 text-pink-700' },
    { id: 'content' as TabType, label: 'Content', icon: FileText, activeColor: 'bg-blue-100 text-blue-700' },
    { id: 'channels' as TabType, label: 'Channels', icon: Share2, activeColor: 'bg-purple-100 text-purple-700' },
    { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3, activeColor: 'bg-indigo-100 text-indigo-700' },
    { id: 'audiences' as TabType, label: 'Audiences', icon: Users, activeColor: 'bg-cyan-100 text-cyan-700' },
    { id: 'automations' as TabType, label: 'Automations', icon: Zap, activeColor: 'bg-orange-100 text-orange-700' },
  ];

  const [contentSearchQuery, setContentSearchQuery] = useState("");

  const filteredCampaigns = useMemo(() => {
    let filtered = initialCampaigns;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (campaign) =>
          campaign.name.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [initialCampaigns, searchQuery]);

  const filteredContent = useMemo(() => {
    let filtered = initialContent;
    if (contentSearchQuery) {
      const query = contentSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (content) =>
          content.title.toLowerCase().includes(query) ||
          content.type.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [initialContent, contentSearchQuery]);

  const filteredChannels = useMemo(() => {
    let filtered = initialChannels;
    if (channelSearchQuery) {
      const query = channelSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (channel) =>
          channel.name.toLowerCase().includes(query) ||
          channel.type.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [initialChannels, channelSearchQuery]);

  const filteredAnalyticsCampaigns = useMemo(() => {
    let filtered = initialCampaigns;
    if (analyticsSearchQuery) {
      const query = analyticsSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (campaign) =>
          campaign.name.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [initialCampaigns, analyticsSearchQuery]);

  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isLoadingContentChat, setIsLoadingContentChat] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [contentConversationId, setContentConversationId] = useState<string | null>(null);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isLoadingChat) return;

    const userMessageText = chatInput.trim();
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessageText,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    const currentInput = chatInput;
    setChatInput("");
    setIsLoadingChat(true);

    try {
      // Build context about campaign creation
      const contextMessage = campaignData.goal || campaignData.name || campaignData.budget
        ? `\n\nCurrent campaign data collected so far:\n${JSON.stringify(campaignData, null, 2)}`
        : '';

      logger.debug('Sending message to API', { currentInput, conversationId });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          message: `You are helping create a marketing campaign. The user said: "${currentInput}".${contextMessage}

Please help guide them through creating a marketing campaign. Ask about:
- Campaign goal (product launch, brand awareness, lead generation, etc.)
- Campaign name
- Budget
- Marketing channels (email, social media, paid ads, content marketing)
- Target audience
- Start and end dates

Be conversational and helpful. If they're testing or asking if something works, acknowledge that and continue helping them create a campaign.`,
          conversationId: conversationId || undefined,
          context: {
            workspace: 'Marketing',
            feature: 'campaign-creation',
          },
        }),
      });

      clearTimeout(timeoutId);
      logger.debug('API response received', { status: response.status, ok: response.ok });

      if (!response.ok) {
        let errorMessage = 'Failed to send message';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response isn't JSON, use status text
          errorMessage = response.statusText || `Server error (${response.status})`;
        }
        logger.error('API error', { status: response.status, message: errorMessage });
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Update conversation ID if this is a new conversation
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      // Try to extract campaign data from AI response
      const aiResponseText = data.message.content;
      
      // Simple extraction of campaign data if mentioned
      if (aiResponseText.toLowerCase().includes('goal') && !campaignData.goal && currentInput.length > 10) {
        // Likely the user provided a goal
        setCampaignData((prev) => ({ ...prev, goal: currentInput }));
      }

      const assistantMessage: ChatMessage = {
        id: data.message.id || (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponseText,
        timestamp: data.message.createdAt ? new Date(data.message.createdAt) : new Date(),
      };

      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      logger.error('AI chat error', error);
      
      let errorMessage = 'Failed to send message. Please try again.';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. Please try again.';
        } else {
          errorMessage = error.message || errorMessage;
        }
      }
      
      // Show error as a message in the chat
      const errorChatMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `❌ Error: ${errorMessage}\n\nPlease check your console for more details or try again.`,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorChatMessage]);
      
      // Also show toast notification
      toast.error(errorMessage, {
        duration: 5000,
      });
      
      // Don't remove user message - keep it so user can see what they sent
      // setChatInput(currentInput); // Keep message in input for retry
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleSendContentMessage = async () => {
    if (!contentChatInput.trim() || isLoadingContentChat) return;

    const userMessageText = contentChatInput.trim();
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessageText,
      timestamp: new Date(),
    };

    setContentChatMessages((prev) => [...prev, userMessage]);
    const currentInput = contentChatInput;
    setContentChatInput("");
    setIsLoadingContentChat(true);

    try {
      // Build context about content creation
      const contextMessage = contentData.type || contentData.topic || contentData.title
        ? `\n\nCurrent content data collected so far:\n${JSON.stringify(contentData, null, 2)}`
        : '';

      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `You are helping create marketing content. The user said: "${currentInput}".${contextMessage}

Please help guide them through creating marketing content. Ask about:
- Content type (blog post, social media post, email newsletter, video script, etc.)
- Topic or subject
- Title or headline
- Target audience
- Tone (professional, casual, friendly, authoritative, etc.)
- Keywords or phrases to include
- Publish date

Be conversational and helpful. If they're testing or asking if something works, acknowledge that and continue helping them create content.`,
          conversationId: contentConversationId || undefined,
          context: {
            workspace: 'Marketing',
            feature: 'content-creation',
          },
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to send message';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response isn't JSON, use status text
          errorMessage = response.statusText || `Server error (${response.status})`;
        }
        logger.error('API error', { status: response.status, message: errorMessage });
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Update conversation ID if this is a new conversation
      if (data.conversationId && !contentConversationId) {
        setContentConversationId(data.conversationId);
      }

      const assistantMessage: ChatMessage = {
        id: data.message.id || (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message.content,
        timestamp: data.message.createdAt ? new Date(data.message.createdAt) : new Date(),
      };

      setContentChatMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      logger.error('AI content chat error', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message. Please try again.');
      
      // Remove user message on error
      setContentChatMessages((prev) => prev.slice(0, -1));
      setContentChatInput(currentInput); // Restore the message
    } finally {
      setIsLoadingContentChat(false);
    }
  };

  return (
    <div className="h-full bg-gray-50/50 overflow-hidden">
      {/* Header Section - Matching CRM */}
      <div className="max-w-7xl mx-auto px-6 py-4 space-y-4">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Marketing</h1>
          <p className="text-muted-foreground text-base">
            Manage campaigns, content, channels, and marketing performance.
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

        {/* Floating Tab Bar - Matching CRM */}
        <div className="flex justify-center">
          <div className="bg-background/80 backdrop-blur-lg rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-1 inline-flex gap-1">
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

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* CAMPAIGNS TAB */}
            {activeTab === 'campaigns' && (
              <Card className="p-8 shadow-lg border-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left: Campaigns List */}
                  <div className="flex flex-col h-[600px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    {/* Header */}
                    <div className="px-6 py-4 border-b bg-gradient-to-r from-pink-50 to-pink-100/50 flex-shrink-0">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-md">
                            <Megaphone className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-[15px] text-gray-900">Campaigns</h3>
                            <p className="text-[13px] text-pink-600 flex items-center gap-1">
                              <span className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span>
                              {filteredCampaigns.length} campaigns
                            </p>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          onClick={() => setShowCampaignChat(true)}
                          className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:bg-white/90 text-blue-600 hover:text-blue-700 shadow-sm"
                          aria-label="Add campaign"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search campaigns..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 h-9 text-sm bg-white dark:bg-card"
                          aria-label="Search campaigns"
                        />
                      </div>
                    </div>

                    {/* Campaigns List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {filteredCampaigns.length > 0 ? (
                        filteredCampaigns.map((campaign) => (
                          <div
                            key={campaign.id}
                            onClick={() => setSelectedCampaign(campaign)}
                            className="p-4 rounded-lg border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-sm font-semibold text-gray-900">{campaign.name}</h4>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-2 py-0.5 ${
                                  campaign.status === 'active'
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : campaign.status === 'paused'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                                }`}
                              >
                                {campaign.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mt-2">
                              <div>
                                <span className="font-medium">Budget:</span> {formatCurrency(campaign.budget)}
                              </div>
                              <div>
                                <span className="font-medium">ROI:</span> {campaign.roi}%
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 px-6">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center mx-auto mb-4">
                            <Megaphone className="h-7 w-7 text-pink-600" />
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2">Launch your first campaign</h3>
                          <p className="text-sm text-muted-foreground mb-4 max-w-[200px] mx-auto">
                            Create targeted marketing campaigns to reach your audience.
                          </p>
                          <Button size="sm" className="gap-2 bg-pink-600 hover:bg-pink-700">
                            <Plus className="h-4 w-4" />
                            New Campaign
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Campaign Chat or Details */}
                  <div className="flex flex-col h-[600px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    {showCampaignChat ? (
                      <>
                        {/* Chat Header */}
                        <div className="px-6 py-4 border-b bg-gradient-to-r from-pink-50 to-pink-100/50 flex items-center justify-between flex-shrink-0">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 text-white">
                              <Sparkles className="h-4 w-4" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm text-gray-900">AI Campaign Setup</h3>
                              <p className="text-xs text-pink-600">Guided campaign creation</p>
                            </div>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setShowCampaignChat(false);
                              setChatMessages([{
                                id: '1',
                                role: 'assistant',
                                content: "Hi! I'm here to help you create a new marketing campaign. Let's start with the basics - what's the goal of this campaign? (e.g., product launch, brand awareness, lead generation)",
                                timestamp: new Date(),
                              }]);
                              setChatInput("");
                              setCampaignData({
                                name: "",
                                goal: "",
                                budget: "",
                                channels: [],
                                startDate: "",
                                endDate: "",
                                targetAudience: "",
                              });
                            }}
                            className="h-7 w-7"
                            aria-label="Close chat"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                          {chatMessages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-lg p-3 ${
                                  message.role === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 text-gray-900'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              </div>
                            </div>
                ))}
              </div>

                        {/* Chat Input */}
                        <div className="px-4 py-3 border-t flex items-center gap-2 flex-shrink-0">
                          <Input
                            placeholder="Type your message..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            disabled={isLoadingChat}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey && !isLoadingChat) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            className="flex-1 disabled:opacity-50"
                            aria-label="Message input"
                          />
                          <Button
                            size="icon"
                            onClick={handleSendMessage}
                            disabled={!chatInput.trim() || isLoadingChat}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                            aria-label="Send message"
                          >
                            {isLoadingChat ? (
                              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </>
                    ) : selectedCampaign ? (
                      <div className="flex-1 overflow-y-auto p-6">
                        {/* Campaign Header */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold text-gray-900">{selectedCampaign.name}</h2>
                            <Badge
                              className={`${
                                selectedCampaign.status === 'active'
                                  ? 'bg-green-100 text-green-700'
                                  : selectedCampaign.status === 'paused'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {selectedCampaign.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">Campaign Briefing</p>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                          <div className="bg-blue-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-blue-600 mb-1">
                              <DollarSign className="h-4 w-4" />
                              <span className="text-xs font-medium">Budget</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900">
                              {formatCurrency(selectedCampaign.budget)}
                            </p>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-purple-600 mb-1">
                              <Target className="h-4 w-4" />
                              <span className="text-xs font-medium">ROI Target</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900">
                              {selectedCampaign.roi}%
                            </p>
                          </div>
                        </div>

                        {/* Campaign Period */}
                        <div className="mb-6">
                          <h3 className="text-sm font-semibold text-gray-900 mb-3">Campaign Period</h3>
                          <div className="bg-slate-50 rounded-lg p-4">
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-2 text-gray-700">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <div>
                                  <p className="text-xs text-gray-500">Start Date</p>
                                  <p className="font-medium">
                                    {selectedCampaign.startDate
                                      ? formatDate(selectedCampaign.startDate)
                                      : 'Not set'}
                                  </p>
                                </div>
                              </div>
                              <span className="text-gray-400">→</span>
                              <div>
                                <p className="text-xs text-gray-500">End Date</p>
                                <p className="font-medium">
                                  {selectedCampaign.endDate
                                    ? formatDate(selectedCampaign.endDate)
                                    : 'Ongoing'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Marketing Channels */}
                        <div className="mb-6">
                          <h3 className="text-sm font-semibold text-gray-900 mb-3">Marketing Channels</h3>
                          <div className="space-y-2">
                            {selectedCampaign.channels.map((channel) => (
                              <div key={channel} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  {channel === 'email' && <Mail className="h-4 w-4 text-blue-600" />}
                                  {channel === 'social' && <Share2 className="h-4 w-4 text-purple-600" />}
                                  {channel === 'ads' && <Target className="h-4 w-4 text-orange-600" />}
                                  <span className="text-sm font-medium capitalize">{channel}</span>
                                </div>
                                <Badge variant="outline" className="text-xs bg-white">
                                  Active
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Campaign Assets */}
                        <div className="mb-6">
                          <h3 className="text-sm font-semibold text-gray-900 mb-3">Campaign Assets</h3>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center">
                                  <FileText className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Email Templates</p>
                                  <p className="text-xs text-gray-500">3 templates</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded bg-purple-100 flex items-center justify-center">
                                  <ImageIcon className="h-4 w-4 text-purple-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Social Media Graphics</p>
                                  <p className="text-xs text-gray-500">12 images</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded bg-green-100 flex items-center justify-center">
                                  <Video className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Video Content</p>
                                  <p className="text-xs text-gray-500">2 videos</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Target Demographics */}
                        <div className="mb-6">
                          <h3 className="text-sm font-semibold text-gray-900 mb-3">Target Demographics</h3>
                          <div className="bg-slate-50 rounded-lg p-4 space-y-4">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">Age Range</span>
                                <span className="text-sm font-medium">25-45 years</span>
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">Gender</span>
                                <span className="text-sm font-medium">All</span>
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">Location</span>
                                <span className="text-sm font-medium">United States</span>
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">Interests</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                <Badge variant="outline" className="text-xs">Technology</Badge>
                                <Badge variant="outline" className="text-xs">Business</Badge>
                                <Badge variant="outline" className="text-xs">Productivity</Badge>
                                <Badge variant="outline" className="text-xs">SaaS</Badge>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Campaign Goals */}
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-3">Campaign Goals</h3>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">Generate 250+ qualified leads</p>
                                <p className="text-xs text-gray-600">Primary objective</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                              <Target className="h-4 w-4 text-blue-600 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">Achieve 125% ROI</p>
                                <p className="text-xs text-gray-600">Financial target</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg">
                              <TrendingUp className="h-4 w-4 text-purple-600 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">Increase brand awareness</p>
                                <p className="text-xs text-gray-600">Secondary objective</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center p-8">
                        <div className="text-center max-w-sm">
                          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                            <Megaphone className="h-8 w-8 text-slate-400" />
                          </div>
                          <h3 className="text-base font-semibold text-gray-900 mb-2">Select a campaign</h3>
                          <p className="text-sm text-gray-500 mb-4">
                            Choose a campaign from the list to view detailed information, performance metrics, and analytics.
                          </p>
                          <Button
                            onClick={() => setShowCampaignChat(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Get Started!
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
          </Card>
            )}

            {/* CONTENT TAB */}
            {activeTab === 'content' && (
              <Card className="p-8 shadow-lg border-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left: Content List */}
                  <div className="flex flex-col h-[600px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    {/* Header */}
                    <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-blue-100/50 flex-shrink-0">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-[15px] text-gray-900">Content</h3>
                            <p className="text-[13px] text-blue-600 flex items-center gap-1">
                              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                              {filteredContent.length} items
                            </p>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          onClick={() => setShowContentChat(true)}
                          className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:bg-white/90 text-blue-600 hover:text-blue-700 shadow-sm"
                          aria-label="Add content"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search content..."
                          value={contentSearchQuery}
                          onChange={(e) => setContentSearchQuery(e.target.value)}
                          className="pl-9 h-9 text-sm bg-white dark:bg-card"
                          aria-label="Search content"
                        />
                      </div>
                    </div>

                    {/* Content List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {filteredContent.length > 0 ? (
                        filteredContent.map((content) => (
                          <div
                            key={content.id}
                            onClick={() => setSelectedContent(content)}
                            className="p-4 rounded-lg border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-sm font-semibold text-gray-900">{content.title}</h4>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-2 py-0.5 ${
                                  content.status === 'published'
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : content.status === 'draft'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                                }`}
                              >
                                {content.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                              <span className="font-medium capitalize">{content.type}</span>
                              <span>•</span>
                              <span>{content.views.toLocaleString()} views</span>
                              <span>•</span>
                              <span>{content.engagement}% engagement</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 px-6">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center mx-auto mb-4">
                            <FileText className="h-7 w-7 text-orange-600" />
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2">Create your first content</h3>
                          <p className="text-sm text-muted-foreground mb-4 max-w-[200px] mx-auto">
                            Write blog posts, social media content, and email templates with Neptune.
                          </p>
                          <Button size="sm" className="gap-2 bg-orange-600 hover:bg-orange-700">
                            <Sparkles className="h-4 w-4" />
                            Generate Content
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Content Chat or Details */}
                  <div className="flex flex-col h-[600px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    {showContentChat ? (
                      <>
                        {/* Chat Header */}
                        <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-blue-100/50 flex items-center justify-between flex-shrink-0">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                              <Sparkles className="h-4 w-4" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm text-gray-900">AI Content Creation</h3>
                              <p className="text-xs text-blue-600">Guided content creation</p>
                            </div>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setShowContentChat(false);
                              setContentChatMessages([{
                                id: '1',
                                role: 'assistant',
                                content: "Hi! I'm here to help you create new marketing content. What type of content would you like to create? (e.g., blog post, social media post, email newsletter, video script)",
                                timestamp: new Date(),
                              }]);
                              setContentChatInput("");
                              setContentData({
                                title: "",
                                type: "",
                                topic: "",
                                targetAudience: "",
                                tone: "",
                                keywords: [],
                                publishDate: "",
                              });
                            }}
                            className="h-7 w-7"
                            aria-label="Close chat"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                          {contentChatMessages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-lg p-3 ${
                                  message.role === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 text-gray-900'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              </div>
                            </div>
                  ))}
              </div>

                        {/* Chat Input */}
                        <div className="px-4 py-3 border-t flex items-center gap-2 flex-shrink-0">
                          <Input
                            placeholder="Type your message..."
                            value={contentChatInput}
                            onChange={(e) => setContentChatInput(e.target.value)}
                            disabled={isLoadingContentChat}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey && !isLoadingContentChat) {
                                e.preventDefault();
                                handleSendContentMessage();
                              }
                            }}
                            className="flex-1 disabled:opacity-50"
                            aria-label="Message input"
                          />
                          <Button
                            size="icon"
                            onClick={handleSendContentMessage}
                            disabled={!contentChatInput.trim() || isLoadingContentChat}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                            aria-label="Send message"
                          >
                            {isLoadingContentChat ? (
                              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </>
                    ) : selectedContent ? (
                      <div className="flex-1 overflow-y-auto">
                        {/* Content Header */}
                        <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-blue-100/50 flex-shrink-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-lg text-gray-900">{selectedContent.title}</h3>
                            <Badge
                              className={`${
                                selectedContent.status === 'published'
                                  ? 'bg-green-100 text-green-700'
                                  : selectedContent.status === 'draft'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {selectedContent.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            <span className="capitalize font-medium">{selectedContent.type}</span>
                            <span>•</span>
                            <span>By {selectedContent.author}</span>
                            {selectedContent.publishedAt && (
                              <>
                                <span>•</span>
                                <span>{formatDate(selectedContent.publishedAt)}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Content Stats */}
                        <div className="px-6 py-4 border-b bg-slate-50">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="flex items-center gap-2 text-blue-600 mb-1">
                                <Users className="h-4 w-4" />
                                <span className="text-xs font-medium">Views</span>
                              </div>
                              <p className="text-xl font-bold text-gray-900">
                                {selectedContent.views.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 text-purple-600 mb-1">
                                <TrendingUp className="h-4 w-4" />
                                <span className="text-xs font-medium">Engagement</span>
                              </div>
                              <p className="text-xl font-bold text-gray-900">
                                {selectedContent.engagement}%
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Content Body */}
                        <div className="p-6">
                          {selectedContent.excerpt && (
                            <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                              <p className="text-sm text-gray-700 italic">{selectedContent.excerpt}</p>
                            </div>
                          )}

                          {selectedContent.content && (
                            <div className="prose prose-sm max-w-none">
                              {selectedContent.type === 'blog' ? (
                                <div className="space-y-3">
                                  {selectedContent.content.split('\n').map((line, index) => {
                                    if (line.startsWith('# ')) {
                                      return <h1 key={index} className="text-2xl font-bold text-gray-900 mt-6 mb-3">{line.substring(2)}</h1>;
                                    } else if (line.startsWith('## ')) {
                                      return <h2 key={index} className="text-xl font-semibold text-gray-900 mt-5 mb-2">{line.substring(3)}</h2>;
                                    } else if (line.trim() === '') {
                                      return <div key={index} className="h-2" />;
                                    } else {
                                      return <p key={index} className="text-sm text-gray-700 leading-relaxed">{line}</p>;
                                    }
                                  })}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                  {selectedContent.content}
                                </div>
                              )}
                            </div>
                          )}

                          {!selectedContent.content && (
                            <div className="text-center py-12">
                              <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                              <p className="text-sm text-gray-500">No content available</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center p-8">
                        <div className="text-center max-w-sm">
                          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                            <FileText className="h-8 w-8 text-slate-400" />
                          </div>
                          <h3 className="text-base font-semibold text-gray-900 mb-2">Select content</h3>
                          <p className="text-sm text-gray-500">
                            Choose a content item from the list to view detailed information, performance metrics, and analytics.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
          </Card>
            )}

            {/* CHANNELS TAB */}
            {activeTab === 'channels' && (
              <Card className="p-8 shadow-lg border-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left: Channels List */}
                  <div className="flex flex-col h-[600px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    {/* Header */}
                    <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-purple-100/50 flex-shrink-0">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md">
                            <Share2 className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-[15px] text-gray-900">Channels</h3>
                            <p className="text-[13px] text-purple-600 flex items-center gap-1">
                              <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                              {filteredChannels.length} channels
                            </p>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          onClick={() => toast.info("Add channel dialog coming soon")}
                          className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:bg-white/90 text-blue-600 hover:text-blue-700 shadow-sm"
                          aria-label="Add channel"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search channels..."
                          value={channelSearchQuery}
                          onChange={(e) => setChannelSearchQuery(e.target.value)}
                          className="pl-9 h-9 text-sm bg-white dark:bg-card"
                          aria-label="Search channels"
                        />
                      </div>
                    </div>

                    {/* Channels List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {filteredChannels.length > 0 ? (
                        filteredChannels.map((channel) => (
                          <div
                            key={channel.id}
                            onClick={() => setSelectedChannel(channel)}
                            className={`p-4 rounded-lg border transition-all cursor-pointer ${
                              selectedChannel?.id === channel.id
                                ? 'border-purple-300 bg-purple-50/30 shadow-sm'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${
                                  channel.type === 'email' ? 'bg-blue-100 text-blue-600' :
                                  channel.type === 'social' ? 'bg-purple-100 text-purple-600' :
                                  channel.type === 'ads' ? 'bg-orange-100 text-orange-600' :
                                  'bg-slate-100 text-slate-600'
                                }`}>
                                  {channel.type === 'email' ? <Mail className="h-4 w-4" /> :
                                   channel.type === 'social' ? <Share2 className="h-4 w-4" /> :
                                   channel.type === 'ads' ? <Target className="h-4 w-4" /> :
                                   <BarChart3 className="h-4 w-4" />}
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900">{channel.name}</h4>
                                  <p className="text-xs text-gray-500 capitalize">{channel.type}</p>
                                </div>
                              </div>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-2 py-0.5 ${
                                  channel.status === 'active'
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                                }`}
                              >
                                {channel.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mt-2">
                              <div>
                                <span className="font-medium">Performance:</span> {channel.performance}%
                              </div>
                              <div>
                                <span className="font-medium">Budget:</span> {formatCurrency(channel.budget)}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 px-6">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mx-auto mb-4">
                            <Share2 className="h-7 w-7 text-indigo-600" />
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2">Connect your channels</h3>
                          <p className="text-sm text-muted-foreground mb-4 max-w-[200px] mx-auto">
                            Link social media, email providers, and other platforms to distribute content.
                          </p>
                          <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="h-4 w-4" />
                            Add Channel
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Channel Settings */}
                  <div className="flex flex-col h-[600px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    {selectedChannel ? (
                      <>
                        {/* Settings Header */}
                        <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-purple-100/50 flex-shrink-0">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              selectedChannel.type === 'email' ? 'bg-blue-100 text-blue-600' :
                              selectedChannel.type === 'social' ? 'bg-purple-100 text-purple-600' :
                              selectedChannel.type === 'ads' ? 'bg-orange-100 text-orange-600' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {selectedChannel.type === 'email' ? <Mail className="h-5 w-5" /> :
                               selectedChannel.type === 'social' ? <Share2 className="h-5 w-5" /> :
                               selectedChannel.type === 'ads' ? <Target className="h-5 w-5" /> :
                               <BarChart3 className="h-5 w-5" />}
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm text-gray-900">{selectedChannel.name}</h3>
                              <p className="text-xs text-purple-600 capitalize">{selectedChannel.type} channel</p>
                            </div>
                          </div>
                        </div>

                        {/* Channel Insights Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                          {/* Channel Status & Performance */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-green-50 rounded-lg p-4">
                              <div className="flex items-center gap-2 text-green-600 mb-1">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-xs font-medium">Status</span>
                              </div>
                              <p className="text-xl font-bold text-gray-900 capitalize">
                                {selectedChannel.status}
                              </p>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-4">
                              <div className="flex items-center gap-2 text-blue-600 mb-1">
                                <TrendingUp className="h-4 w-4" />
                                <span className="text-xs font-medium">Performance</span>
                              </div>
                              <p className="text-xl font-bold text-gray-900">
                                {selectedChannel.performance}%
                              </p>
                            </div>
                          </div>

                          {/* Budget & Reach */}
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Budget & Reach</h3>
                            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Monthly Budget</span>
                                <span className="font-semibold">{formatCurrency(selectedChannel.budget)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Total Reach</span>
                                <span className="font-semibold">{selectedChannel.reach.toLocaleString()} people</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Cost Per Reach</span>
                                <span className="font-semibold">
                                  ${((selectedChannel.budget / 100) / selectedChannel.reach).toFixed(3)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Channel-Specific Insights */}
                          {selectedChannel.type === 'email' && (
                            <>
                              <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Email Performance</h3>
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <Mail className="h-4 w-4 text-blue-600" />
                                      <span className="text-sm text-gray-700">Open Rate</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">24.5%</span>
                                  </div>
                                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <Target className="h-4 w-4 text-purple-600" />
                                      <span className="text-sm text-gray-700">Click Rate</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">3.8%</span>
                                  </div>
                                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <Users className="h-4 w-4 text-green-600" />
                                      <span className="text-sm text-gray-700">Subscriber Growth</span>
                                    </div>
                                    <span className="text-sm font-semibold text-green-600">+12.3%</span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Top Performing Emails</h3>
                                <div className="space-y-2">
                                  <div className="p-3 bg-slate-50 rounded-lg">
                                    <p className="text-sm font-medium text-gray-900 mb-1">Product Launch Announcement</p>
                                    <div className="flex items-center gap-3 text-xs text-gray-600">
                                      <span>32% open</span>
                                      <span>•</span>
                                      <span>5.2% click</span>
                                      <span>•</span>
                                      <span>15K sent</span>
                                    </div>
                                  </div>
                                  <div className="p-3 bg-slate-50 rounded-lg">
                                    <p className="text-sm font-medium text-gray-900 mb-1">Weekly Newsletter #42</p>
                                    <div className="flex items-center gap-3 text-xs text-gray-600">
                                      <span>28% open</span>
                                      <span>•</span>
                                      <span>4.1% click</span>
                                      <span>•</span>
                                      <span>12K sent</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}

                          {selectedChannel.type === 'social' && (
                            <>
                              <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Social Media Performance</h3>
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <Users className="h-4 w-4 text-blue-600" />
                                      <span className="text-sm text-gray-700">Followers</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">45,200</span>
                                  </div>
                                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <TrendingUp className="h-4 w-4 text-purple-600" />
                                      <span className="text-sm text-gray-700">Engagement Rate</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">4.2%</span>
                                  </div>
                                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <Share2 className="h-4 w-4 text-green-600" />
                                      <span className="text-sm text-gray-700">Avg. Shares/Post</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">156</span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Top Performing Posts</h3>
                                <div className="space-y-2">
                                  <div className="p-3 bg-slate-50 rounded-lg">
                                    <p className="text-sm font-medium text-gray-900 mb-1">New Feature Demo Video</p>
                                    <div className="flex items-center gap-3 text-xs text-gray-600">
                                      <span>12.5K views</span>
                                      <span>•</span>
                                      <span>890 likes</span>
                                      <span>•</span>
                                      <span>124 shares</span>
                                    </div>
                                  </div>
                                  <div className="p-3 bg-slate-50 rounded-lg">
                                    <p className="text-sm font-medium text-gray-900 mb-1">Customer Success Story</p>
                                    <div className="flex items-center gap-3 text-xs text-gray-600">
                                      <span>8.2K views</span>
                                      <span>•</span>
                                      <span>652 likes</span>
                                      <span>•</span>
                                      <span>98 shares</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Best Posting Times</h3>
                                <div className="bg-slate-50 rounded-lg p-4">
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Weekdays</span>
                                      <span className="font-medium">10 AM - 12 PM</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Weekends</span>
                                      <span className="font-medium">2 PM - 4 PM</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Peak Engagement</span>
                                      <span className="font-medium">Thursday 11 AM</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}

                          {selectedChannel.type === 'ads' && (
                            <>
                              <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Advertising Performance</h3>
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <Target className="h-4 w-4 text-blue-600" />
                                      <span className="text-sm text-gray-700">Impressions</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">1.2M</span>
                                  </div>
                                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <TrendingUp className="h-4 w-4 text-purple-600" />
                                      <span className="text-sm text-gray-700">CTR</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">2.8%</span>
                                  </div>
                                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <DollarSign className="h-4 w-4 text-green-600" />
                                      <span className="text-sm text-gray-700">Cost Per Click</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">$1.24</span>
                                  </div>
                                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <Users className="h-4 w-4 text-orange-600" />
                                      <span className="text-sm text-gray-700">Conversions</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">8,450</span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Top Performing Ads</h3>
                                <div className="space-y-2">
                                  <div className="p-3 bg-slate-50 rounded-lg">
                                    <p className="text-sm font-medium text-gray-900 mb-1">Holiday Sale Campaign</p>
                                    <div className="flex items-center gap-3 text-xs text-gray-600">
                                      <span>245K impressions</span>
                                      <span>•</span>
                                      <span>3.2% CTR</span>
                                      <span>•</span>
                                      <span>$0.98 CPC</span>
                                    </div>
                                  </div>
                                  <div className="p-3 bg-slate-50 rounded-lg">
                                    <p className="text-sm font-medium text-gray-900 mb-1">Product Demo Video Ad</p>
                                    <div className="flex items-center gap-3 text-xs text-gray-600">
                                      <span>198K impressions</span>
                                      <span>•</span>
                                      <span>2.9% CTR</span>
                                      <span>•</span>
                                      <span>$1.15 CPC</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Audience Demographics</h3>
                                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                                  <div>
                                    <div className="flex justify-between text-sm mb-1">
                                      <span className="text-gray-600">Age 25-34</span>
                                      <span className="font-medium">42%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '42%' }} />
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex justify-between text-sm mb-1">
                                      <span className="text-gray-600">Age 35-44</span>
                                      <span className="font-medium">35%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '35%' }} />
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex justify-between text-sm mb-1">
                                      <span className="text-gray-600">Age 45-54</span>
                                      <span className="font-medium">23%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '23%' }} />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}

                          {/* Recommendations */}
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">AI Recommendations</h3>
                            <div className="space-y-2">
                              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                                <Sparkles className="h-4 w-4 text-blue-600 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">Increase budget by 15%</p>
                                  <p className="text-xs text-gray-600">Channel is performing above target</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                                <Zap className="h-4 w-4 text-purple-600 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">Optimize posting schedule</p>
                                  <p className="text-xs text-gray-600">Peak engagement times identified</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center p-8">
                        <div className="text-center max-w-sm">
                          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                            <Share2 className="h-8 w-8 text-slate-400" />
                          </div>
                          <h3 className="text-base font-semibold text-gray-900 mb-2">Select a channel</h3>
                          <p className="text-sm text-gray-500">
                            Choose a channel from the list to configure settings, manage budgets, and optimize performance.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && (
              <Card className="p-8 shadow-lg border-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left: Campaigns List */}
                  <div className="flex flex-col h-[600px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    {/* Header */}
                    <div className="px-6 py-4 border-b bg-gradient-to-r from-indigo-50 to-indigo-100/50 flex-shrink-0">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-md">
                            <BarChart3 className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-[15px] text-gray-900">Campaigns</h3>
                            <p className="text-[13px] text-indigo-600 flex items-center gap-1">
                              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                              {filteredAnalyticsCampaigns.length} campaigns
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search campaigns..."
                          value={analyticsSearchQuery}
                          onChange={(e) => setAnalyticsSearchQuery(e.target.value)}
                          className="pl-9 h-9 text-sm bg-white dark:bg-card"
                          aria-label="Search campaigns"
                        />
                      </div>
                    </div>

                    {/* Campaigns List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {filteredAnalyticsCampaigns.length > 0 ? (
                        filteredAnalyticsCampaigns.map((campaign) => (
                          <div
                            key={campaign.id}
                            onClick={() => setSelectedAnalyticsCampaign(campaign)}
                            className={`p-4 rounded-lg border transition-all cursor-pointer ${
                              selectedAnalyticsCampaign?.id === campaign.id
                                ? 'border-indigo-300 bg-indigo-50/30 shadow-sm'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-sm font-semibold text-gray-900">{campaign.name}</h4>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-2 py-0.5 ${
                                  campaign.status === 'active'
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : campaign.status === 'paused'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                                }`}
                              >
                                {campaign.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mt-2">
                              <div>
                                <span className="font-medium">ROI:</span> {campaign.roi}%
                              </div>
                              <div>
                                <span className="font-medium">Spent:</span> {formatCurrency(campaign.spent)}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 px-6">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-100 to-teal-100 flex items-center justify-center mx-auto mb-4">
                            <BarChart3 className="h-7 w-7 text-cyan-600" />
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2">No campaigns to analyze</h3>
                          <p className="text-sm text-muted-foreground mb-4 max-w-[200px] mx-auto">
                            Once you launch campaigns, their performance metrics will appear here.
                          </p>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="gap-2"
                            onClick={() => setActiveTab('campaigns')}
                          >
                            <Megaphone className="h-4 w-4" />
                            Go to Campaigns
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Campaign Analytics */}
                  <div className="flex flex-col h-[600px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    {selectedAnalyticsCampaign ? (
                      <>
                        {/* Analytics Header */}
                        <div className="px-6 py-4 border-b bg-gradient-to-r from-indigo-50 to-indigo-100/50 flex-shrink-0">
                          <div>
                            <h3 className="font-semibold text-sm text-gray-900">{selectedAnalyticsCampaign.name}</h3>
                            <p className="text-xs text-indigo-600">Campaign Analytics</p>
                          </div>
                        </div>

                        {/* Analytics Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                          {/* Key Metrics */}
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Key Metrics</h3>
                            <div className="grid grid-cols-2 gap-4">
                              <Card className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <TrendingUp className="h-4 w-4 text-blue-600" />
                                  <p className="text-xs text-gray-500">Impressions</p>
                                </div>
                                <p className="text-xl font-semibold text-gray-900">
                                  {selectedAnalyticsCampaign.impressions.toLocaleString()}
                                </p>
                              </Card>
                              <Card className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Target className="h-4 w-4 text-purple-600" />
                                  <p className="text-xs text-gray-500">Clicks</p>
                                </div>
                                <p className="text-xl font-semibold text-gray-900">
                                  {selectedAnalyticsCampaign.clicks.toLocaleString()}
                                </p>
                              </Card>
                              <Card className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Users className="h-4 w-4 text-green-600" />
                                  <p className="text-xs text-gray-500">Conversions</p>
                                </div>
                                <p className="text-xl font-semibold text-gray-900">
                                  {selectedAnalyticsCampaign.conversions.toLocaleString()}
                                </p>
                              </Card>
                              <Card className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                                  <p className="text-xs text-gray-500">ROI</p>
                                </div>
                                <p className="text-xl font-semibold text-gray-900">
                                  {selectedAnalyticsCampaign.roi}%
                                </p>
                              </Card>
                            </div>
                          </div>

                          {/* Performance Rates */}
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Performance Rates</h3>
                            <div className="space-y-4">
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-gray-600">Click-Through Rate (CTR)</span>
                                  <span className="text-sm font-semibold text-gray-900">
                                    {selectedAnalyticsCampaign.impressions > 0
                                      ? ((selectedAnalyticsCampaign.clicks / selectedAnalyticsCampaign.impressions) * 100).toFixed(2)
                                      : 0}%
                                  </span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                    style={{
                                      width: `${Math.min((selectedAnalyticsCampaign.clicks / selectedAnalyticsCampaign.impressions) * 100, 100)}%`,
                                    }}
                                  />
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-gray-600">Conversion Rate</span>
                                  <span className="text-sm font-semibold text-gray-900">
                                    {selectedAnalyticsCampaign.clicks > 0
                                      ? ((selectedAnalyticsCampaign.conversions / selectedAnalyticsCampaign.clicks) * 100).toFixed(2)
                                      : 0}%
                                  </span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2">
                                  <div
                                    className="bg-green-600 h-2 rounded-full transition-all"
                                    style={{
                                      width: `${Math.min((selectedAnalyticsCampaign.conversions / selectedAnalyticsCampaign.clicks) * 100, 100)}%`,
                                    }}
                                  />
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-gray-600">Cost Per Click (CPC)</span>
                                  <span className="text-sm font-semibold text-gray-900">
                                    {selectedAnalyticsCampaign.clicks > 0
                                      ? formatCurrency(selectedAnalyticsCampaign.spent / selectedAnalyticsCampaign.clicks)
                                      : formatCurrency(0)}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-gray-600">Cost Per Conversion</span>
                                  <span className="text-sm font-semibold text-gray-900">
                                    {selectedAnalyticsCampaign.conversions > 0
                                      ? formatCurrency(selectedAnalyticsCampaign.spent / selectedAnalyticsCampaign.conversions)
                                      : formatCurrency(0)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Budget Performance */}
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Budget Performance</h3>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-sm text-gray-500">Total Budget</span>
                                <span className="text-sm font-semibold text-gray-900">
                                  {formatCurrency(selectedAnalyticsCampaign.budget)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-sm text-gray-500">Amount Spent</span>
                                <span className="text-sm font-semibold text-gray-900">
                                  {formatCurrency(selectedAnalyticsCampaign.spent)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between py-2">
                                <span className="text-sm text-gray-500">Remaining Budget</span>
                                <span className="text-sm font-semibold text-gray-900">
                                  {formatCurrency(selectedAnalyticsCampaign.budget - selectedAnalyticsCampaign.spent)}
                                </span>
                              </div>
                              <div className="mt-3">
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                  <span>Budget Utilization</span>
                                  <span>
                                    {Math.round((selectedAnalyticsCampaign.spent / selectedAnalyticsCampaign.budget) * 100)}%
                                  </span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2">
                                  <div
                                    className="bg-indigo-600 h-2 rounded-full transition-all"
                                    style={{
                                      width: `${Math.min((selectedAnalyticsCampaign.spent / selectedAnalyticsCampaign.budget) * 100, 100)}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Campaign Details */}
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Campaign Details</h3>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-sm text-gray-500">Start Date</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {selectedAnalyticsCampaign.startDate
                                    ? formatDate(selectedAnalyticsCampaign.startDate)
                                    : 'Not set'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-sm text-gray-500">End Date</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {selectedAnalyticsCampaign.endDate
                                    ? formatDate(selectedAnalyticsCampaign.endDate)
                                    : 'Not set'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between py-2">
                                <span className="text-sm text-gray-500">Channels</span>
                                <div className="flex gap-2">
                                  {selectedAnalyticsCampaign.channels.map((channel) => (
                                    <Badge
                                      key={channel}
                                      variant="outline"
                                      className="text-xs bg-slate-50 text-slate-700 border-slate-200"
                                    >
                                      {channel}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center p-8">
                        <div className="text-center max-w-sm">
                          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                            <BarChart3 className="h-8 w-8 text-slate-400" />
                          </div>
                          <h3 className="text-base font-semibold text-gray-900 mb-2">Select a campaign</h3>
                          <p className="text-sm text-gray-500">
                            Choose a campaign from the list to view detailed analytics, performance metrics, and insights.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* AUDIENCES TAB */}
            {activeTab === 'audiences' && (
              <Card className="p-8 shadow-lg border-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left: Audience Types List */}
                  <div className="flex flex-col h-[600px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    {/* Header */}
                    <div className="px-6 py-4 border-b bg-gradient-to-r from-cyan-50 to-cyan-100/50 flex-shrink-0">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-md">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-[15px] text-gray-900">Audience Segments</h3>
                            <p className="text-[13px] text-cyan-600 flex items-center gap-1">
                              <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
                              8 segments
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search audiences..."
                          value={audienceSearchQuery}
                          onChange={(e) => setAudienceSearchQuery(e.target.value)}
                          className="pl-9 h-9 text-sm bg-white dark:bg-card"
                          aria-label="Search audiences"
                        />
                      </div>
                    </div>

                    {/* Audience Types List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {[
                        { id: 'high-value', name: 'High-Value Customers', count: 1240, icon: TrendingUp, color: 'bg-emerald-500' },
                        { id: 'new-leads', name: 'New Leads', count: 3420, icon: UserPlus, color: 'bg-blue-500' },
                        { id: 'engaged', name: 'Engaged Users', count: 5680, icon: Sparkles, color: 'bg-purple-500' },
                        { id: 'inactive', name: 'Inactive Users', count: 2100, icon: Clock, color: 'bg-amber-500' },
                        { id: 'trial', name: 'Trial Users', count: 890, icon: Target, color: 'bg-cyan-500' },
                        { id: 'churned', name: 'Churned Customers', count: 1560, icon: TrendingDown, color: 'bg-red-500' },
                        { id: 'vip', name: 'VIP Customers', count: 320, icon: Users, color: 'bg-indigo-500' },
                        { id: 'prospects', name: 'Hot Prospects', count: 1250, icon: Zap, color: 'bg-orange-500' },
                      ]
                        .filter((audience) =>
                          audienceSearchQuery === '' ||
                          audience.name.toLowerCase().includes(audienceSearchQuery.toLowerCase())
                        )
                        .map((audience) => (
                          <div
                            key={audience.id}
                            onClick={() => setSelectedAudience(audience.id)}
                            className={`p-4 rounded-lg border transition-all cursor-pointer ${
                              selectedAudience === audience.id
                                ? 'border-cyan-300 bg-cyan-50/30 shadow-sm'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${audience.color} flex-shrink-0`}>
                                <audience.icon className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900">{audience.name}</h4>
                                <p className="text-xs text-gray-500 mt-0.5">{audience.count.toLocaleString()} members</p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Right: Engagement Behavior Breakdown */}
                  <div className="flex flex-col h-[600px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    {selectedAudience ? (
                      <>
                        {/* Header */}
                        <div className="px-6 py-4 border-b bg-gradient-to-r from-cyan-50 to-cyan-100/50 flex-shrink-0">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
                              <Users className="h-5 w-5" aria-hidden="true" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm text-gray-900">
                                {[
                                  { id: 'high-value', name: 'High-Value Customers' },
                                  { id: 'new-leads', name: 'New Leads' },
                                  { id: 'engaged', name: 'Engaged Users' },
                                  { id: 'inactive', name: 'Inactive Users' },
                                  { id: 'trial', name: 'Trial Users' },
                                  { id: 'churned', name: 'Churned Customers' },
                                  { id: 'vip', name: 'VIP Customers' },
                                  { id: 'prospects', name: 'Hot Prospects' },
                                ].find((a) => a.id === selectedAudience)?.name || 'Audience'}
                              </h3>
                              <p className="text-xs text-cyan-600">Engagement Behavior Breakdown</p>
                            </div>
                          </div>
                        </div>

                        {/* Engagement Metrics */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                          {/* Inline Stats Row */}
                          <div className="flex items-center justify-between text-sm border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-blue-500" aria-hidden="true" />
                              <span className="text-gray-500">Open</span>
                              <span className="font-medium text-gray-800">
                                {selectedAudience === 'high-value' ? '68%' :
                                 selectedAudience === 'new-leads' ? '45%' :
                                 selectedAudience === 'engaged' ? '72%' :
                                 selectedAudience === 'inactive' ? '12%' :
                                 selectedAudience === 'trial' ? '58%' :
                                 selectedAudience === 'churned' ? '8%' :
                                 selectedAudience === 'vip' ? '85%' : '52%'}
                              </span>
                            </div>
                            <span className="text-gray-300">•</span>
                            <div className="flex items-center gap-1.5">
                              <Target className="h-3.5 w-3.5 text-purple-500" aria-hidden="true" />
                              <span className="text-gray-500">CTR</span>
                              <span className="font-medium text-gray-800">
                                {selectedAudience === 'high-value' ? '24%' :
                                 selectedAudience === 'new-leads' ? '18%' :
                                 selectedAudience === 'engaged' ? '31%' :
                                 selectedAudience === 'inactive' ? '3%' :
                                 selectedAudience === 'trial' ? '22%' :
                                 selectedAudience === 'churned' ? '2%' :
                                 selectedAudience === 'vip' ? '42%' : '19%'}
                              </span>
                            </div>
                            <span className="text-gray-300">•</span>
                            <div className="flex items-center gap-1.5">
                              <TrendingUp className="h-3.5 w-3.5 text-green-500" aria-hidden="true" />
                              <span className="text-gray-500">Conv</span>
                              <span className="font-medium text-gray-800">
                                {selectedAudience === 'high-value' ? '15%' :
                                 selectedAudience === 'new-leads' ? '8%' :
                                 selectedAudience === 'engaged' ? '12%' :
                                 selectedAudience === 'inactive' ? '1%' :
                                 selectedAudience === 'trial' ? '28%' :
                                 selectedAudience === 'churned' ? '0.5%' :
                                 selectedAudience === 'vip' ? '22%' : '14%'}
                              </span>
                            </div>
                            <span className="text-gray-300">•</span>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-indigo-500" aria-hidden="true" />
                              <span className="text-gray-500">Avg</span>
                              <span className="font-medium text-gray-800">
                                {selectedAudience === 'high-value' ? '4.2m' :
                                 selectedAudience === 'new-leads' ? '2.8m' :
                                 selectedAudience === 'engaged' ? '5.1m' :
                                 selectedAudience === 'inactive' ? '0.5m' :
                                 selectedAudience === 'trial' ? '6.3m' :
                                 selectedAudience === 'churned' ? '0.2m' :
                                 selectedAudience === 'vip' ? '7.8m' : '3.5m'}
                              </span>
                            </div>
                          </div>

                          {/* Behavior Patterns - Compact */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-cyan-500" aria-hidden="true" />
                              Behavior Patterns
                            </h4>
                            <div className="space-y-2">
                              {getAudienceBehaviorData(selectedAudience).map((behavior, index) => (
                                <div 
                                  key={index} 
                                  className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-slate-50/70 hover:bg-slate-100/70 transition-colors"
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800">{behavior.label}</p>
                                    <p className="text-xs text-gray-500 truncate">{behavior.description}</p>
                                  </div>
                                  <div className="flex items-center gap-2 ml-3">
                                    <span className="text-sm font-medium text-gray-700">{behavior.value}</span>
                                    {behavior.percentage !== undefined && (
                                      <div className="w-12 bg-gray-200 rounded-full h-1.5">
                                        <div
                                          className={`h-1.5 rounded-full transition-all ${
                                            behavior.percentage >= 50 ? 'bg-green-500' :
                                            behavior.percentage >= 25 ? 'bg-amber-500' : 'bg-slate-400'
                                          }`}
                                          style={{ width: `${Math.min(behavior.percentage, 100)}%` }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Channel Engagement - Compact */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <Share2 className="h-4 w-4 text-cyan-500" aria-hidden="true" />
                              Channel Engagement
                            </h4>
                            <div className="space-y-2">
                              {getChannelEngagementData(selectedAudience).map((channel, index) => (
                                <div key={index} className="flex items-center gap-3 py-2">
                                  <div className="flex items-center gap-2 w-24">
                                    {channel.icon === 'mail' && <Mail className="h-3.5 w-3.5 text-blue-500" aria-hidden="true" />}
                                    {channel.icon === 'social' && <Share2 className="h-3.5 w-3.5 text-purple-500" aria-hidden="true" />}
                                    {channel.icon === 'ads' && <Target className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" />}
                                    <span className="text-sm text-gray-600">{channel.name}</span>
                                  </div>
                                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full transition-all ${
                                        channel.icon === 'mail' ? 'bg-blue-500' :
                                        channel.icon === 'social' ? 'bg-purple-500' : 'bg-orange-500'
                                      }`}
                                      style={{ width: `${channel.engagement}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium text-gray-700 w-10 text-right">{channel.engagement}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center p-8">
                        <div className="text-center max-w-sm">
                          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                            <Users className="h-8 w-8 text-slate-400" />
                          </div>
                          <h3 className="text-base font-semibold text-gray-900 mb-2">Select an audience</h3>
                          <p className="text-sm text-gray-500">
                            Choose an audience segment from the list to view engagement behavior breakdowns and insights.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* AUTOMATIONS TAB */}
            {activeTab === 'automations' && (
              <MarketingAutomationsTab />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
