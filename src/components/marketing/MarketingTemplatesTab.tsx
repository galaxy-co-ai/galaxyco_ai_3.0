"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Megaphone,
  Sparkles,
  Target,
  UserPlus,
  TrendingUp,
  DollarSign,
  Clock,
  Users,
  Share2,
  RefreshCw,
  Briefcase,
  Calendar,
  Mail,
  Video,
  Zap,
  Grid3X3,
  List,
} from "lucide-react";

interface CampaignTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: any;
  color: string;
  duration?: string;
  budget?: string;
  channels?: string[];
  usageCount?: number;
  avgRating?: string;
}

// Campaign templates
const campaignTemplates: CampaignTemplate[] = [
  {
    id: 'product-launch',
    name: 'Product Launch',
    category: 'Launch',
    description: 'Multi-channel launch campaign for new products',
    icon: Megaphone,
    color: 'bg-gradient-to-br from-pink-500 to-pink-600',
    duration: '4 weeks',
    budget: '$15K',
    channels: ['Email', 'Social', 'Paid Ads'],
    usageCount: 47,
    avgRating: 'A-',
  },
  {
    id: 'linkedin-b2b',
    name: 'LinkedIn B2B Lead Gen',
    category: 'Lead Gen',
    description: 'Professional B2B outreach campaign',
    icon: UserPlus,
    color: 'bg-gradient-to-br from-blue-500 to-blue-600',
    duration: '6 weeks',
    budget: '$8K',
    channels: ['LinkedIn Ads', 'Email'],
    usageCount: 23,
    avgRating: 'B+',
  },
  {
    id: 'holiday-promo',
    name: 'Holiday Promotion',
    category: 'Sales',
    description: 'Seasonal promotion with urgency',
    icon: DollarSign,
    color: 'bg-gradient-to-br from-orange-500 to-orange-600',
    duration: '2 weeks',
    budget: '$12K',
    channels: ['Email', 'Social', 'Web'],
    usageCount: 89,
    avgRating: 'A',
  },
  {
    id: 'brand-awareness',
    name: 'Brand Awareness',
    category: 'Awareness',
    description: 'Increase brand recognition and reach',
    icon: Sparkles,
    color: 'bg-gradient-to-br from-purple-500 to-purple-600',
    duration: '8 weeks',
    budget: '$20K',
    channels: ['Social', 'Content', 'Influencer'],
    usageCount: 34,
    avgRating: 'B',
  },
  {
    id: 'webinar-funnel',
    name: 'Webinar Registration',
    category: 'Lead Gen',
    description: 'Webinar promotion and registration campaign',
    icon: Video,
    color: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    duration: '3 weeks',
    budget: '$6K',
    channels: ['Email', 'LinkedIn', 'Paid Ads'],
    usageCount: 18,
    avgRating: 'A-',
  },
  {
    id: 'flash-sale',
    name: 'Flash Sale',
    category: 'Sales',
    description: 'Limited-time offer with high urgency',
    icon: Zap,
    color: 'bg-gradient-to-br from-yellow-500 to-orange-600',
    duration: '48 hours',
    budget: '$5K',
    channels: ['Email', 'Social', 'SMS'],
    usageCount: 56,
    avgRating: 'A',
  },
  {
    id: 'loyalty-program',
    name: 'Customer Loyalty',
    category: 'Retention',
    description: 'Reward existing customers and increase LTV',
    icon: Users,
    color: 'bg-gradient-to-br from-amber-500 to-amber-600',
    duration: '12 weeks',
    budget: '$10K',
    channels: ['Email', 'App', 'Web'],
    usageCount: 42,
    avgRating: 'B+',
  },
  {
    id: 'winback',
    name: 'Win-Back Campaign',
    category: 'Retention',
    description: 'Re-engage inactive customers',
    icon: RefreshCw,
    color: 'bg-gradient-to-br from-amber-500 to-red-600',
    duration: '4 weeks',
    budget: '$7K',
    channels: ['Email', 'Retargeting Ads'],
    usageCount: 29,
    avgRating: 'B',
  },
  {
    id: 'account-based',
    name: 'Account-Based Marketing',
    category: 'ABM',
    description: 'Target specific high-value accounts',
    icon: Briefcase,
    color: 'bg-gradient-to-br from-slate-600 to-slate-700',
    duration: '10 weeks',
    budget: '$25K',
    channels: ['LinkedIn', 'Direct Mail', 'Email'],
    usageCount: 12,
    avgRating: 'A',
  },
];

const categories = ['All', 'Launch', 'Lead Gen', 'Sales', 'Awareness', 'Retention', 'ABM'];

// Rating colors
const ratingColors: Record<string, string> = {
  'A+': 'text-green-600',
  'A': 'text-green-600',
  'A-': 'text-green-500',
  'B+': 'text-blue-600',
  'B': 'text-blue-500',
  'B-': 'text-blue-400',
  'C': 'text-orange-500',
};

interface MarketingTemplatesTabProps {
  onSelectTemplate: (templateId: string) => void;
}

export default function MarketingTemplatesTab({ onSelectTemplate }: MarketingTemplatesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return campaignTemplates.filter((template) => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 text-white">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Campaign Templates</h2>
            <p className="text-sm text-gray-600">Ready-to-use templates for every marketing need</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              size="sm"
              variant={selectedCategory === category ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category)}
              className="rounded-full"
            >
              {category}
              {category !== 'All' && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1">
                  {campaignTemplates.filter(t => t.category === category).length}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              onClick={() => setViewMode('grid')}
              className="h-7 w-7 p-0"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              onClick={() => setViewMode('list')}
              className="h-7 w-7 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Templates Grid/List */}
      {filteredTemplates.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}>
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className={`${template.color} p-4 text-white`}>
                <div className="flex items-center justify-between mb-2">
                  <template.icon className="h-8 w-8" />
                  <Badge variant="secondary" className="text-xs">
                    {template.category}
                  </Badge>
                </div>
                <h3 className="font-semibold text-lg mb-1">{template.name}</h3>
                <p className="text-sm text-white/90">{template.description}</p>
              </div>

              <div className="p-4 space-y-3">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Duration</p>
                    <p className="font-medium">{template.duration}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Budget</p>
                    <p className="font-medium">{template.budget}</p>
                  </div>
                </div>

                {/* Channels */}
                <div>
                  <p className="text-gray-500 text-xs mb-1">Channels</p>
                  <div className="flex flex-wrap gap-1">
                    {template.channels?.map((channel, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {channel}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Usage stats */}
                <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t">
                  <span>→ {template.usageCount} uses</span>
                  <span className={`font-semibold ${ratingColors[template.avgRating || 'B']}`}>
                    Avg {template.avgRating} rating
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => onSelectTemplate(template.id)}
                    className="flex-1 rounded-full"
                  >
                    Use Template
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 rounded-full">
                    Preview
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600">Try adjusting your search or category filter</p>
        </Card>
      )}
    </div>
  );
}
