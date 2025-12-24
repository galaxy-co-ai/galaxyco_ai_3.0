"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PillTabs, type PillTab } from "@/components/ui/pill-tabs";
import { PageTitle } from "@/components/ui/page-title";




import {
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
  UserPlus,
  Clock,
  DollarSign,
  Video,
  Image as ImageIcon,
  MessageSquare,
  Globe,
  Presentation,
  Newspaper,
  RefreshCw,
  Twitter,
  Linkedin,
  Instagram,
  Facebook,
  Briefcase,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import CampaignCreateTab from "./CampaignCreateTab";
import MarketingCampaignsTab from "./MarketingCampaignsTab";
import MarketingTemplatesTab, { campaignTemplates as marketingCampaignTemplates } from "./MarketingTemplatesTab";
import { logger } from "@/lib/logger";
import NeptuneAssistPanel from "@/components/conversations/NeptuneAssistPanel";
import useSWR from 'swr';
import { AddChannelDialog } from "./AddChannelDialog";
import { usePageContext } from "@/hooks/usePageContext";

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((r) => r.json());

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
  /**
   * When true, disable live API calls and rely entirely on initial props.
   * Used on marketing/landing demos to avoid 404s and auth noise.
   */
  disableLiveData?: boolean;
}

type TabType = 'campaigns' | 'templates' | 'create';

// Selected template state for passing to Create tab
interface SelectedTemplateState {
  templateId: string;
  templateName: string;
  templateCategory: string;
  templateDescription: string;
  duration?: string;
  budget?: string;
  channels?: string[];
}

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
  disableLiveData = false,
}: MarketingDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('campaigns');
  const [selectedTemplateForCreate, setSelectedTemplateForCreate] = useState<SelectedTemplateState | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNeptune, setShowNeptune] = useState(false);
  const [showCampaignChat, setShowCampaignChat] = useState(false);
  const [showContentChat, setShowContentChat] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [channelSearchQuery, setChannelSearchQuery] = useState("");
  const [showAddChannelDialog, setShowAddChannelDialog] = useState(false);
  
  // Fetch channels from API (skip in demo mode)
  const channelsKey = disableLiveData ? null : '/api/marketing/channels';
  const { data: channelsData, mutate: mutateChannels } = useSWR<{
    channels: Array<{
      id: string;
      name: string;
      type: string;
      status: string;
      performance: number;
      budget: number | null;
      budgetDollars: number | null;
      spentDollars: number;
      impressions: number;
      clicks: number;
      conversions: number;
      revenueDollars: number;
    }>;
    total: number;
  }>(channelsKey, fetcher);
  
  // Use API channels if available, otherwise fall back to initial
  const channels = channelsData?.channels?.map(ch => ({
    id: ch.id,
    name: ch.name,
    type: ch.type,
    status: ch.status,
    performance: ch.performance,
    budget: ch.budgetDollars || 0,
    reach: ch.impressions,
  })) ?? initialChannels;
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

  // Report page context to Neptune for contextual awareness
  const { setSelectedItems, setFocusedItem } = usePageContext({
    module: 'marketing',
    pageName: 'Marketing Hub',
    pageType: selectedCampaign || selectedContent ? 'view' : 'dashboard',
    activeTab,
    customData: {
      stats,
      campaignsCount: initialCampaigns.length,
      channelsCount: channels.length,
      activeCampaigns: stats.activeCampaigns,
    },
  });

  // Update Neptune when selections change
  useEffect(() => {
    if (selectedCampaign) {
      setSelectedItems([{ id: selectedCampaign.id, type: 'campaign', name: selectedCampaign.name }]);
      setFocusedItem({ id: selectedCampaign.id, type: 'campaign', name: selectedCampaign.name });
    } else if (selectedContent) {
      setSelectedItems([{ id: selectedContent.id, type: 'content', name: selectedContent.title }]);
      setFocusedItem({ id: selectedContent.id, type: 'content', name: selectedContent.title });
    } else {
      setSelectedItems([]);
      setFocusedItem(undefined);
    }
  }, [selectedCampaign, selectedContent, setSelectedItems, setFocusedItem]);
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

  // Assets tab state
  const [selectedAssetTemplate, setSelectedAssetTemplate] = useState<string | null>(null);
  const [assetCategoryFilter, setAssetCategoryFilter] = useState<string>('All');
  const [assetChatMessages, setAssetChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hey! 👋 I'm Neptune. Ready to create some killer marketing assets? Pick a template from the list, or just tell me what you need — I can write emails, social posts, ad copy, landing page content, and more!",
      timestamp: new Date(),
    },
  ]);
  const [assetChatInput, setAssetChatInput] = useState("");
  const [isCreatingAsset, setIsCreatingAsset] = useState(false);
  const [assetData, setAssetData] = useState({
    title: "",
    type: "",
    content: "",
    targetAudience: "",
    tone: "",
    keyMessages: "",
    variations: [] as string[],
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [assetChatMessages]);

  // SWR for real-time campaign data (skip in demo mode)
  const campaignsKey = disableLiveData ? null : '/api/campaigns';
  const { data: campaignsData, mutate: mutateCampaigns } = useSWR(
    campaignsKey,
    fetcher,
    { 
      refreshInterval: 30000, // Refresh every 30 seconds
      fallbackData: { campaigns: initialCampaigns }
    }
  );

  const currentCampaigns = campaignsData?.campaigns || initialCampaigns;

  // Campaign API Handlers
  const handleCreateCampaign = async (campaignData: {
    name: string;
    type: 'email' | 'drip' | 'newsletter' | 'promotion';
    subject: string;
    body: string;
    targetAudience: string;
    scheduledFor?: string;
  }) => {
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create campaign');
      }

      const data = await response.json();
      toast.success('Campaign created successfully!');
      await mutateCampaigns();
      return data;
    } catch (error) {
      logger.error('Campaign creation error', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create campaign');
      throw error;
    }
  };

  const handleUpdateCampaign = async (campaignId: string, updates: Partial<typeof campaignData>) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update campaign');
      }

      toast.success('Campaign updated successfully!');
      await mutateCampaigns();
    } catch (error) {
      logger.error('Campaign update error', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update campaign');
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete campaign');
      }

      toast.success('Campaign deleted successfully!');
      await mutateCampaigns();
    } catch (error) {
      logger.error('Campaign delete error', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete campaign');
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/send`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send campaign');
      }

      const data = await response.json();
      toast.success(`Campaign queued! Sending to ${data.recipientCount} recipients.`);
      await mutateCampaigns();
    } catch (error) {
      logger.error('Campaign send error', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send campaign');
    }
  };

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

  // Tab configuration - New 3-tab user journey structure
  const tabs = [
    { id: 'campaigns' as TabType, label: 'Campaigns', icon: Megaphone, badge: stats.activeCampaigns.toString(), badgeColor: 'bg-pink-500', activeColor: 'bg-pink-100 text-pink-700' },
    { id: 'templates' as TabType, label: 'Templates', icon: FileText, activeColor: 'bg-purple-100 text-purple-700' },
    { id: 'create' as TabType, label: 'Create', icon: Plus, activeColor: 'bg-emerald-100 text-emerald-700' },
  ];

  const pillTabs: Array<PillTab<TabType>> = tabs.map((tab) => ({
    value: tab.id,
    label: tab.label,
    Icon: tab.icon,
    activeClassName: tab.activeColor,
    badgeClassName: tab.badgeColor,
    badge: tab.badge ? Number(tab.badge) : undefined,
    ariaLabel: `Switch to ${tab.label} tab`,
  }));

  // Marketing Asset Templates
  const assetTemplates = [
    { id: 'email-welcome', name: 'Welcome Email', category: 'Email', icon: Mail, description: 'Onboarding welcome sequence', color: 'bg-pink-500' },
    { id: 'email-nurture', name: 'Nurture Email', category: 'Email', icon: Mail, description: 'Lead nurturing content', color: 'bg-pink-500' },
    { id: 'email-promo', name: 'Promotional Email', category: 'Email', icon: Mail, description: 'Product/service promotion', color: 'bg-pink-500' },
    { id: 'email-announcement', name: 'Announcement', category: 'Email', icon: Mail, description: 'News and updates', color: 'bg-pink-500' },
    { id: 'social-twitter', name: 'Twitter Thread', category: 'Social', icon: Twitter, description: 'Engaging thread content', color: 'bg-sky-500' },
    { id: 'social-linkedin', name: 'LinkedIn Post', category: 'Social', icon: Linkedin, description: 'Professional content', color: 'bg-blue-600' },
    { id: 'social-instagram', name: 'Instagram Caption', category: 'Social', icon: Instagram, description: 'Visual storytelling', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { id: 'social-facebook', name: 'Facebook Post', category: 'Social', icon: Facebook, description: 'Community engagement', color: 'bg-blue-500' },
    { id: 'ad-google', name: 'Google Ad Copy', category: 'Ads', icon: Target, description: 'Search & display ads', color: 'bg-red-500' },
    { id: 'ad-meta', name: 'Meta Ad Copy', category: 'Ads', icon: Target, description: 'Facebook & Instagram ads', color: 'bg-indigo-500' },
    { id: 'ad-banner', name: 'Display Banner', category: 'Ads', icon: ImageIcon, description: 'Banner ad copy', color: 'bg-amber-500' },
    { id: 'landing-hero', name: 'Landing Page Hero', category: 'Landing Pages', icon: Globe, description: 'Headlines & value props', color: 'bg-emerald-500' },
    { id: 'landing-cta', name: 'CTA Copy', category: 'Landing Pages', icon: Zap, description: 'Call-to-action buttons', color: 'bg-orange-500' },
    { id: 'sales-onepager', name: 'One-Pager', category: 'Sales', icon: FileText, description: 'Product/service overview', color: 'bg-violet-500' },
    { id: 'sales-casestudy', name: 'Case Study', category: 'Sales', icon: Presentation, description: 'Success story template', color: 'bg-teal-500' },
    { id: 'brand-tagline', name: 'Taglines', category: 'Brand', icon: Sparkles, description: 'Brand messaging', color: 'bg-rose-500' },
    { id: 'video-script', name: 'Video Script', category: 'Video', icon: Video, description: 'Explainer & demo scripts', color: 'bg-red-600' },
    { id: 'pr-release', name: 'Press Release', category: 'PR', icon: Newspaper, description: 'Media announcements', color: 'bg-slate-600' },
  ];

  const assetCategories = ['All', 'Email', 'Social', 'Ads', 'Landing Pages', 'Sales', 'Brand', 'Video', 'PR'];

  // Content Templates (for Content tab)
  const contentTemplates = [
    { id: 'blog-post', name: 'Blog Post', category: 'Blog', icon: FileText, description: 'Long-form article content', color: 'bg-blue-500' },
    { id: 'blog-listicle', name: 'Listicle', category: 'Blog', icon: FileText, description: 'List-based article format', color: 'bg-blue-500' },
    { id: 'blog-howto', name: 'How-To Guide', category: 'Blog', icon: FileText, description: 'Step-by-step tutorials', color: 'bg-blue-500' },
    { id: 'social-carousel', name: 'Social Carousel', category: 'Social', icon: ImageIcon, description: 'Multi-slide social content', color: 'bg-pink-500' },
    { id: 'social-story', name: 'Story Script', category: 'Social', icon: Video, description: 'Instagram/TikTok stories', color: 'bg-pink-500' },
    { id: 'social-reel', name: 'Reel/Short Script', category: 'Social', icon: Video, description: 'Short-form video scripts', color: 'bg-pink-500' },
    { id: 'email-newsletter', name: 'Newsletter', category: 'Email', icon: Mail, description: 'Regular email updates', color: 'bg-violet-500' },
    { id: 'email-drip', name: 'Drip Sequence', category: 'Email', icon: Mail, description: 'Automated email series', color: 'bg-violet-500' },
    { id: 'email-broadcast', name: 'Broadcast Email', category: 'Email', icon: Mail, description: 'One-time announcements', color: 'bg-violet-500' },
    { id: 'video-explainer', name: 'Explainer Script', category: 'Video', icon: Video, description: 'Product/service explainers', color: 'bg-red-500' },
    { id: 'video-testimonial', name: 'Testimonial Script', category: 'Video', icon: Video, description: 'Customer success stories', color: 'bg-red-500' },
    { id: 'video-tutorial', name: 'Tutorial Script', category: 'Video', icon: Video, description: 'Educational how-tos', color: 'bg-red-500' },
    { id: 'podcast-outline', name: 'Podcast Outline', category: 'Audio', icon: MessageSquare, description: 'Episode planning', color: 'bg-purple-500' },
    { id: 'podcast-shownotes', name: 'Show Notes', category: 'Audio', icon: MessageSquare, description: 'Episode summaries', color: 'bg-purple-500' },
    { id: 'whitepaper', name: 'Whitepaper', category: 'Long-form', icon: FileText, description: 'In-depth research content', color: 'bg-slate-600' },
    { id: 'ebook-chapter', name: 'eBook Chapter', category: 'Long-form', icon: FileText, description: 'Book-style content', color: 'bg-slate-600' },
    { id: 'webinar-script', name: 'Webinar Script', category: 'Events', icon: Presentation, description: 'Live presentation scripts', color: 'bg-teal-500' },
    { id: 'event-promo', name: 'Event Promotion', category: 'Events', icon: Megaphone, description: 'Event marketing copy', color: 'bg-teal-500' },
  ];

  const contentCategories = ['All', 'Blog', 'Social', 'Email', 'Video', 'Audio', 'Long-form', 'Events'];

  // Campaign Templates
  const campaignTemplates = [
    { id: 'launch-product', name: 'Product Launch', category: 'Launch', icon: Megaphone, description: 'New product or feature release', color: 'bg-pink-500' },
    { id: 'launch-brand', name: 'Brand Launch', category: 'Launch', icon: Sparkles, description: 'New brand or rebrand campaign', color: 'bg-pink-500' },
    { id: 'launch-event', name: 'Event Launch', category: 'Launch', icon: Calendar, description: 'Webinar, conference, or event', color: 'bg-pink-500' },
    { id: 'awareness-brand', name: 'Brand Awareness', category: 'Awareness', icon: TrendingUp, description: 'Increase brand recognition', color: 'bg-purple-500' },
    { id: 'awareness-thought', name: 'Thought Leadership', category: 'Awareness', icon: Target, description: 'Establish industry authority', color: 'bg-purple-500' },
    { id: 'lead-gen', name: 'Lead Generation', category: 'Lead Gen', icon: UserPlus, description: 'Capture qualified leads', color: 'bg-blue-500' },
    { id: 'lead-nurture', name: 'Lead Nurturing', category: 'Lead Gen', icon: Mail, description: 'Convert leads to customers', color: 'bg-blue-500' },
    { id: 'lead-webinar', name: 'Webinar Funnel', category: 'Lead Gen', icon: Video, description: 'Webinar registration campaign', color: 'bg-blue-500' },
    { id: 'sales-promo', name: 'Promotional Sale', category: 'Sales', icon: DollarSign, description: 'Discounts and special offers', color: 'bg-green-500' },
    { id: 'sales-seasonal', name: 'Seasonal Campaign', category: 'Sales', icon: Clock, description: 'Holiday or seasonal promotions', color: 'bg-green-500' },
    { id: 'sales-flash', name: 'Flash Sale', category: 'Sales', icon: Zap, description: 'Limited-time offers', color: 'bg-green-500' },
    { id: 'retention-loyalty', name: 'Loyalty Program', category: 'Retention', icon: Users, description: 'Customer loyalty rewards', color: 'bg-amber-500' },
    { id: 'retention-winback', name: 'Win-Back Campaign', category: 'Retention', icon: RefreshCw, description: 'Re-engage inactive customers', color: 'bg-amber-500' },
    { id: 'retention-referral', name: 'Referral Program', category: 'Retention', icon: Share2, description: 'Customer referral incentives', color: 'bg-amber-500' },
    { id: 'social-ugc', name: 'UGC Campaign', category: 'Social', icon: ImageIcon, description: 'User-generated content', color: 'bg-indigo-500' },
    { id: 'social-contest', name: 'Contest/Giveaway', category: 'Social', icon: Target, description: 'Engagement contests', color: 'bg-indigo-500' },
    { id: 'social-influencer', name: 'Influencer Campaign', category: 'Social', icon: Users, description: 'Influencer partnerships', color: 'bg-indigo-500' },
    { id: 'abm', name: 'Account-Based Marketing', category: 'ABM', icon: Briefcase, description: 'Target specific accounts', color: 'bg-slate-600' },
  ];

  const campaignCategories = ['All', 'Launch', 'Awareness', 'Lead Gen', 'Sales', 'Retention', 'Social', 'ABM'];

  // Campaign tab state (new template-based)
  const [selectedCampaignTemplate, setSelectedCampaignTemplate] = useState<string | null>(null);
  const [campaignCategoryFilter, setCampaignCategoryFilter] = useState<string>('All');
  const [campaignNeptuneChatMessages, setCampaignNeptuneChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hey! 👋 I'm Neptune. Ready to launch a powerful marketing campaign? Pick a template from the list, or tell me your goals — I'll help you plan the strategy, channels, budget, and timeline!",
      timestamp: new Date(),
    },
  ]);
  const [campaignNeptuneChatInput, setCampaignNeptuneChatInput] = useState("");
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const campaignMessagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll campaign chat
  useEffect(() => {
    campaignMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [campaignNeptuneChatMessages]);

  // Filter campaign templates
  const filteredCampaignTemplates = campaignCategoryFilter === 'All' 
    ? campaignTemplates 
    : campaignTemplates.filter(t => t.category === campaignCategoryFilter);

  // Content tab state
  const [selectedContentTemplate, setSelectedContentTemplate] = useState<string | null>(null);
  const [contentCategoryFilter, setContentCategoryFilter] = useState<string>('All');
  const [contentNeptuneChatMessages, setContentNeptuneChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hey! 👋 I'm Neptune. Ready to create some amazing content? Pick a template from the list, or just tell me what you need — blog posts, social content, email campaigns, video scripts, and more!",
      timestamp: new Date(),
    },
  ]);
  const [contentNeptuneChatInput, setContentNeptuneChatInput] = useState("");
  const [isCreatingContent, setIsCreatingContent] = useState(false);
  const contentMessagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll content chat
  useEffect(() => {
    contentMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [contentNeptuneChatMessages]);

  // Filter content templates
  const filteredContentTemplates = contentCategoryFilter === 'All' 
    ? contentTemplates 
    : contentTemplates.filter(t => t.category === contentCategoryFilter);

  const [contentSearchQuery, setContentSearchQuery] = useState("");

  const filteredCampaigns = useMemo(() => {
    let filtered = currentCampaigns;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (campaign: Campaign) =>
          campaign.name.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [currentCampaigns, searchQuery]);

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
    let filtered = channels;
    if (channelSearchQuery) {
      const query = channelSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (channel) =>
          channel.name.toLowerCase().includes(query) ||
          channel.type.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [channels, channelSearchQuery]);

  const filteredAnalyticsCampaigns = useMemo(() => {
    let filtered = currentCampaigns;
    if (analyticsSearchQuery) {
      const query = analyticsSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (campaign: Campaign) =>
          campaign.name.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [currentCampaigns, analyticsSearchQuery]);

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

  // Handle Asset Chat Message - REAL API
  const handleSendAssetMessage = async () => {
    if (!assetChatInput.trim() || isCreatingAsset) return;

    const userInput = assetChatInput.trim();
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
      timestamp: new Date(),
    };

    setAssetChatMessages(prev => [...prev, userMessage]);
    setAssetChatInput("");
    setIsCreatingAsset(true);

    try {
      const selectedTemplate = assetTemplates.find(t => t.id === selectedAssetTemplate);
      
      // Build context for Neptune
      let prompt = `[Marketing Assets Creation]
You are helping create marketing assets. The user is in the Marketing → Assets tab.
`;

      if (selectedTemplate) {
        prompt += `Selected template: ${selectedTemplate.name} (${selectedTemplate.category})
Template description: ${selectedTemplate.description}

`;
      }

      if (assetData.title || assetData.targetAudience || assetData.tone) {
        prompt += `Current asset data:
${JSON.stringify(assetData, null, 2)}

`;
      }

      prompt += `User's message: "${userInput}"

IMPORTANT INSTRUCTIONS:
1. If the user is describing what they want to create, use the generate_document tool with:
   - documentType: "${selectedTemplate?.category?.toLowerCase() || 'general'}"
   - collectionName: "Marketing Assets"
   - Include the asset type in the title
2. Generate HIGH QUALITY, PROFESSIONAL marketing copy
3. If creating social media posts, provide 2-3 variations
4. If creating ad copy, include headline options and body text
5. If creating emails, include subject line options
6. Always ask clarifying questions if needed (audience, tone, key messages)
7. After generating, offer to save to the knowledge base

Be creative, engaging, and write copy that converts!`;

      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from Neptune');
      }

      const data = await response.json();
      
      // Check if content was generated
      const responseContent = data.message.content;
      if (responseContent.length > 300) {
        setAssetData(prev => ({ 
          ...prev, 
          content: responseContent,
          type: selectedTemplate?.name || prev.type,
        }));
      }

      setAssetChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
      }]);
    } catch (error) {
      logger.error('Asset chat error', error);
      setAssetChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsCreatingAsset(false);
    }
  };

  // Handle suggestion click in assets chat
  const handleAssetSuggestionClick = (suggestion: string) => {
    setAssetChatInput(suggestion);
  };

  // Filter templates by category
  const filteredAssetTemplates = assetCategoryFilter === 'All' 
    ? assetTemplates 
    : assetTemplates.filter(t => t.category === assetCategoryFilter);

  // Handle Campaign Neptune Chat Message - REAL API
  const handleSendCampaignNeptuneMessage = async () => {
    if (!campaignNeptuneChatInput.trim() || isCreatingCampaign) return;

    const userInput = campaignNeptuneChatInput.trim();
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
      timestamp: new Date(),
    };

    setCampaignNeptuneChatMessages(prev => [...prev, userMessage]);
    setCampaignNeptuneChatInput("");
    setIsCreatingCampaign(true);

    try {
      const selectedTemplate = campaignTemplates.find(t => t.id === selectedCampaignTemplate);
      
      // Build context for Neptune
      let prompt = `[Marketing Campaign Planning]
You are helping plan and create a marketing campaign. The user is in the Marketing → Campaigns tab.
`;

      if (selectedTemplate) {
        prompt += `Selected campaign type: ${selectedTemplate.name} (${selectedTemplate.category})
Campaign description: ${selectedTemplate.description}

`;
      }

      prompt += `User's message: "${userInput}"

IMPORTANT INSTRUCTIONS:
1. Help the user plan a comprehensive marketing campaign
2. Ask about and help define:
   - Campaign goals and KPIs
   - Target audience and personas
   - Budget allocation
   - Channel strategy (email, social, paid ads, content, etc.)
   - Timeline and milestones
   - Key messaging and value propositions
   - Success metrics
3. If they're ready, use create_campaign tool to set it up
4. Offer to create supporting content/assets using generate_document
5. Be strategic and provide actionable recommendations
6. Consider industry best practices

Be a strategic marketing partner!`;

      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from Neptune');
      }

      const data = await response.json();

      setCampaignNeptuneChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message.content,
        timestamp: new Date(),
      }]);
    } catch (error) {
      logger.error('Campaign chat error', error);
      setCampaignNeptuneChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  // Handle Content Neptune Chat Message - REAL API
  const handleSendContentNeptuneMessage = async () => {
    if (!contentNeptuneChatInput.trim() || isCreatingContent) return;

    const userInput = contentNeptuneChatInput.trim();
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
      timestamp: new Date(),
    };

    setContentNeptuneChatMessages(prev => [...prev, userMessage]);
    setContentNeptuneChatInput("");
    setIsCreatingContent(true);

    try {
      const selectedTemplate = contentTemplates.find(t => t.id === selectedContentTemplate);
      
      // Build context for Neptune
      let prompt = `[Marketing Content Creation]
You are helping create marketing content. The user is in the Marketing → Content tab.
`;

      if (selectedTemplate) {
        prompt += `Selected template: ${selectedTemplate.name} (${selectedTemplate.category})
Template description: ${selectedTemplate.description}

`;
      }

      prompt += `User's message: "${userInput}"

IMPORTANT INSTRUCTIONS:
1. Generate HIGH QUALITY, ENGAGING content that's ready to publish
2. Use the generate_document tool with:
   - documentType: "${selectedTemplate?.category?.toLowerCase() || 'article'}"
   - collectionName: "Marketing Content"
3. For blog posts: Include compelling headlines, intro hooks, subheadings, and CTAs
4. For social content: Make it platform-appropriate, engaging, with relevant hashtags
5. For email: Include subject lines (multiple options), preview text, and body
6. For video scripts: Include scene descriptions, dialogue, and timing
7. Ask clarifying questions if needed (audience, tone, key messages, goals)
8. After generating, offer to save to the knowledge base

Be creative, engaging, and write content that resonates!`;

      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from Neptune');
      }

      const data = await response.json();

      setContentNeptuneChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message.content,
        timestamp: new Date(),
      }]);
    } catch (error) {
      logger.error('Content chat error', error);
      setContentNeptuneChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsCreatingContent(false);
    }
  };

  return (
    <div className="h-full bg-gray-50/50 overflow-hidden flex flex-col">
      {/* Header Section - Matching CRM */}
      <div className="px-6 py-4 space-y-4 shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between pt-4">
          <PageTitle title="Marketing" icon={Megaphone} />

          {/* Stats Bar */}
          <div className="hidden lg:flex flex-wrap items-center gap-3">
            <Badge variant="soft" tone="pink" size="pill">
              <Megaphone className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="font-semibold">{stats.activeCampaigns}</span>
              <span className="ml-1 font-normal opacity-70">Active Campaigns</span>
            </Badge>
            <Badge variant="soft" tone="violet" size="pill">
              <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="font-semibold">{stats.totalImpressions.toLocaleString()}</span>
              <span className="ml-1 font-normal opacity-70">Impressions</span>
            </Badge>
            <Badge variant="soft" tone="success" size="pill">
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="font-semibold">{stats.avgROI}%</span>
              <span className="ml-1 font-normal opacity-70">Avg ROI</span>
            </Badge>
          </div>
        </div>

        {/* Tab Bar with Ask Neptune Button */}
        <div className="mt-14 flex items-center justify-between gap-4">
          <div className="flex-1 flex items-center justify-center">
            <PillTabs value={activeTab} onValueChange={setActiveTab} tabs={pillTabs} />
          </div>
          <div className="flex-shrink-0">
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
      </div>

      {/* Content Area with Neptune Panel */}
      <div className="flex flex-1 min-h-0 overflow-hidden gap-6 px-6 pb-6">
        <div className={`flex flex-col min-h-0 transition-all duration-200 ${showNeptune ? 'flex-1' : 'flex-1'}`}>
          {/* Create tab needs full height - no max-width constraint */}
          {activeTab === 'create' ? (
            <CampaignCreateTab 
              selectedTemplate={selectedTemplateForCreate}
              onCampaignCreated={() => {
                setActiveTab('campaigns');
                setSelectedTemplateForCreate(null); // Clear selected template after campaign is created
              }} 
            />
          ) : (
          <div className="max-w-7xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >

            {/* CAMPAIGNS TAB - New user journey based */}
            {activeTab === 'campaigns' && (
              <MarketingCampaignsTab 
                campaigns={filteredCampaigns}
                onCreateCampaign={() => setActiveTab('create')}
              />
            )}

            {/* TEMPLATES TAB - Campaign template library */}
            {activeTab === 'templates' && (
              <MarketingTemplatesTab 
                onSelectTemplate={(templateId) => {
                  // Look up the template data
                  const template = marketingCampaignTemplates.find(t => t.id === templateId);
                  if (template) {
                    // Set the selected template for the Create tab
                    setSelectedTemplateForCreate({
                      templateId: template.id,
                      templateName: template.name,
                      templateCategory: template.category,
                      templateDescription: template.description,
                      duration: template.duration,
                      budget: template.budget,
                      channels: template.channels,
                    });
                  }
                  // Navigate to Create tab with pre-selected template
                  setActiveTab('create');
                }}
              />
            )}

              </motion.div>
            </AnimatePresence>
          </div>
          )}
        </div>

        {/* Neptune Panel */}
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

      {/* Add Channel Dialog */}
      <AddChannelDialog
        open={showAddChannelDialog}
        onOpenChange={setShowAddChannelDialog}
        onSuccess={() => {
          mutateChannels();
        }}
      />
    </div>
  );
}
