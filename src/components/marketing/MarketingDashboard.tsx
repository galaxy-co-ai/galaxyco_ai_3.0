"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PillTabs, type PillTab } from "@/components/ui/pill-tabs";
import { PageTitle } from "@/components/ui/page-title";
import {
  Plus,
  ArrowUpRight,
  Sparkles,
  FileText,
  Megaphone,
  BarChart3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CampaignCreateTab from "./CampaignCreateTab";
import MarketingCampaignsTab from "./MarketingCampaignsTab";
import MarketingTemplatesTab, { campaignTemplates as marketingCampaignTemplates } from "./MarketingTemplatesTab";
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

export default function MarketingDashboard({
  initialCampaigns,
  initialContent: _initialContent,
  initialChannels,
  stats,
  disableLiveData = false,
}: MarketingDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('campaigns');
  const [selectedTemplateForCreate, setSelectedTemplateForCreate] = useState<SelectedTemplateState | null>(null);
  const [searchQuery] = useState("");
  const [showNeptune, setShowNeptune] = useState(false);
  const [selectedCampaign] = useState<Campaign | null>(null);
  const [selectedContent] = useState<Content | null>(null);
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

  // SWR for real-time campaign data (skip in demo mode)
  const campaignsKey = disableLiveData ? null : '/api/campaigns';
  const { data: campaignsData } = useSWR(
    campaignsKey,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      fallbackData: { campaigns: initialCampaigns }
    }
  );

  const currentCampaigns = campaignsData?.campaigns || initialCampaigns;

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
