"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Search,
  Play,
  Pause,
  Eye,
  MousePointer,
  Target,
  TrendingUp,
  Calendar,
  DollarSign,
  Mail,
  Linkedin,
  Twitter,
  Instagram,
  Globe,
  Share2,
} from "lucide-react";

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
  successRating?: string; // A+, A, B+, B, C, etc.
}

interface MarketingCampaignsTabProps {
  campaigns: Campaign[];
  onCreateCampaign: () => void;
}

// Mock Neptune recommendations (replace with real API later)
const neptuneRecommendations = [
  {
    id: '1',
    title: '127 B2B leads discussing workflow automation on LinkedIn',
    description: 'High engagement detected on LinkedIn this week. Create targeted campaign?',
    action: 'Create Campaign: "LinkedIn B2B Outreach"',
  },
  {
    id: '2',
    title: 'Competitors running holiday promos',
    description: '73% engagement spike detected in your industry for holiday campaigns',
    action: 'Create Campaign: "Holiday Flash Sale"',
  },
];

// Channel icon mapping
const channelIcons: Record<string, any> = {
  email: Mail,
  linkedin: Linkedin,
  twitter: Twitter,
  instagram: Instagram,
  facebook: Share2,
  'social media': Share2,
  'paid ads': Target,
  web: Globe,
};

// Status colors
const statusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-600 border-green-500/20',
  paused: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  draft: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  completed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
};

// Success rating colors
const ratingColors: Record<string, string> = {
  'A+': 'bg-green-500',
  'A': 'bg-green-500',
  'A-': 'bg-green-500',
  'B+': 'bg-blue-500',
  'B': 'bg-blue-500',
  'B-': 'bg-blue-500',
  'C+': 'bg-orange-500',
  'C': 'bg-orange-500',
  'C-': 'bg-orange-500',
  'D': 'bg-red-500',
  'F': 'bg-red-500',
};

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export default function MarketingCampaignsTab({ campaigns, onCreateCampaign }: MarketingCampaignsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter campaigns
  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Neptune Recommendations Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h2 className="text-lg font-semibold">Neptune's Daily Opportunities</h2>
        </div>
        {neptuneRecommendations.map((rec) => (
          <Card key={rec.id} className="p-5 bg-gradient-to-br from-purple-50/50 to-blue-50/50 border-purple-200/50">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium text-gray-900 mb-1">{rec.title}</p>
                <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={onCreateCampaign} className="rounded-full">
                    {rec.action}
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full">
                    Schedule for Later
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Campaigns Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Your Campaigns</h2>
          <div className="flex items-center gap-2">
            {/* Status filters */}
            <div className="flex gap-1">
              {['all', 'active', 'paused', 'draft', 'completed'].map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={statusFilter === status ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(status)}
                  className="rounded-full capitalize"
                >
                  {status}
                </Button>
              ))}
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </div>

        {/* Campaign Grid */}
        {filteredCampaigns.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCampaigns.map((campaign) => {
              const successRating = campaign.successRating || 'B+';
              const ratingColor = ratingColors[successRating] || 'bg-gray-500';

              return (
                <Card key={campaign.id} className="p-5 hover:shadow-lg transition-shadow cursor-pointer">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{campaign.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${statusColors[campaign.status]} border rounded-full capitalize text-xs`}>
                          {campaign.status}
                        </Badge>
                        <Badge className={`${ratingColor} text-white rounded-full text-xs`}>
                          ⭐ {successRating}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Channels */}
                  <div className="flex items-center gap-1.5 mb-3 pb-3 border-b">
                    {campaign.channels.slice(0, 4).map((channel, idx) => {
                      const Icon = channelIcons[channel.toLowerCase()] || Globe;
                      return (
                        <div
                          key={idx}
                          className="h-7 w-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center"
                          title={channel}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                      );
                    })}
                  </div>

                  {/* KPIs */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Impressions</p>
                      <p className="font-semibold">{formatNumber(campaign.impressions)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Clicks</p>
                      <p className="font-semibold">{formatNumber(campaign.clicks)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Conversions</p>
                      <p className="font-semibold">{formatNumber(campaign.conversions)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">ROI</p>
                      <p className="font-semibold text-green-600">{campaign.roi}%</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>{formatCurrency(campaign.spent)} / {formatCurrency(campaign.budget)}</span>
                  </div>

                  <Button size="sm" variant="outline" className="w-full rounded-full">
                    View Details
                  </Button>
                </Card>
              );
            })}
          </div>
        ) : (
          // Empty state
          <Card className="p-12 text-center">
            <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No campaigns found' : 'Ready to launch your first campaign?'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Create a campaign using AI or choose from our templates'}
            </p>
            {!searchQuery && (
              <div className="flex gap-2 justify-center">
                <Button onClick={onCreateCampaign}>Create with AI</Button>
                <Button variant="outline">Browse Templates</Button>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
