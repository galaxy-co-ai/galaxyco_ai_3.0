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
  UserPlus,
  TrendingUp,
  DollarSign,
  Clock,
  Users,
  RefreshCw,
  Briefcase,
  Video,
  Zap,
  Grid3X3,
  List,
  LayoutTemplate,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Export campaign template interface for use in other components
export interface CampaignTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ElementType;
  duration?: string;
  budget?: string;
  channels?: string[];
  usageCount?: number;
  avgRating?: string;
}

// Category colors for cards - soft pastel gradients matching Creator style
const categoryColors: Record<string, { bg: string; text: string; badge: string }> = {
  'Launch': { bg: 'from-pink-100 to-rose-100', text: 'text-pink-600', badge: 'bg-pink-100 text-pink-700 border-pink-200' },
  'Lead Gen': { bg: 'from-blue-100 to-indigo-100', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700 border-blue-200' },
  'Sales': { bg: 'from-amber-100 to-orange-100', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  'Awareness': { bg: 'from-purple-100 to-violet-100', text: 'text-purple-600', badge: 'bg-purple-100 text-purple-700 border-purple-200' },
  'Retention': { bg: 'from-emerald-100 to-green-100', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  'ABM': { bg: 'from-slate-100 to-gray-100', text: 'text-slate-600', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
};

// Campaign templates - exported for use in CampaignCreateTab
export const campaignTemplates: CampaignTemplate[] = [
  {
    id: 'product-launch',
    name: 'Product Launch',
    category: 'Launch',
    description: 'Multi-channel launch campaign for new products',
    icon: Megaphone,
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
    duration: '10 weeks',
    budget: '$25K',
    channels: ['LinkedIn', 'Direct Mail', 'Email'],
    usageCount: 12,
    avgRating: 'A',
  },
];

const categories = ['All', 'Launch', 'Lead Gen', 'Sales', 'Awareness', 'Retention', 'ABM'];

interface MarketingTemplatesTabProps {
  onSelectTemplate: (templateId: string) => void;
}

export default function MarketingTemplatesTab({ onSelectTemplate }: MarketingTemplatesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Count templates per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { 'All': campaignTemplates.length };
    campaignTemplates.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return counts;
  }, []);

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
    <Card className="h-full rounded-2xl shadow-sm border bg-card overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b bg-gradient-to-r from-pink-50/80 to-orange-50/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-pink-500 to-orange-600 text-white shadow-lg">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-gray-900">Campaign Templates</h2>
              <p className="text-sm text-gray-500">
                Ready-to-use templates for every marketing need
              </p>
            </div>
          </div>
          
          <Badge className="bg-pink-100 text-pink-700 border-pink-200">
            <Sparkles className="h-3 w-3 mr-1" />
            {campaignTemplates.length} Templates
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Controls: Category Chips + Search + View Toggle */}
        <div className="px-4 py-3 border-b">
          <div className="flex items-center justify-between gap-4">
            {/* Category Chips */}
            <div className="flex items-center gap-2 flex-wrap">
              {categories.map((category) => {
                const isSelected = selectedCategory === category;
                const count = categoryCounts[category] || 0;
                
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5",
                      isSelected
                        ? "bg-pink-600 text-white shadow-sm"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                    aria-label={`Filter by ${category}`}
                    aria-pressed={isSelected}
                  >
                    {category}
                    {category !== 'All' && (
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full",
                        isSelected ? "bg-pink-500 text-white" : "bg-gray-200 text-gray-500"
                      )}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search and View Toggle */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates..."
                  className="pl-9 h-9 text-sm w-48"
                  aria-label="Search templates"
                />
              </div>
              <div className="flex items-center border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-1.5 transition-colors",
                    viewMode === "grid" ? "bg-gray-100" : "hover:bg-gray-50"
                  )}
                  aria-label="Grid view"
                  aria-pressed={viewMode === "grid"}
                >
                  <Grid3X3 className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-1.5 transition-colors",
                    viewMode === "list" ? "bg-gray-100" : "hover:bg-gray-50"
                  )}
                  aria-label="List view"
                  aria-pressed={viewMode === "list"}
                >
                  <List className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Templates */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <LayoutTemplate className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">No templates found</h3>
              <p className="text-sm text-gray-500 max-w-xs">
                {searchQuery 
                  ? "Try adjusting your search to find what you're looking for."
                  : "No templates available in this category yet."}
              </p>
            </div>
          ) : viewMode === "list" ? (
            // List View
            <div className="space-y-2">
              {filteredTemplates.map((template) => {
                const colors = categoryColors[template.category] || categoryColors['Launch'];
                const TemplateIcon = template.icon;
                
                return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-white hover:shadow-sm hover:border-gray-300 transition-all"
                  >
                    {/* Icon */}
                    <div className={cn("p-2 rounded-lg", colors.badge.split(' ')[0], colors.text)}>
                      <TemplateIcon className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm text-gray-900 truncate">
                          {template.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4", colors.badge)}>
                          {template.category}
                        </Badge>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs text-gray-500">{template.duration}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs text-gray-500">{template.budget}</span>
                        {template.usageCount && template.usageCount > 0 && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {template.usageCount} uses
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Build Button - matches Neptune button style */}
                    <Button
                      size="sm"
                      variant="surface"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTemplate(template.id);
                      }}
                      className="shrink-0"
                      aria-label={`Build ${template.name} campaign`}
                    >
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Build</span>
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            // Grid View
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => {
                const colors = categoryColors[template.category] || categoryColors['Launch'];
                const TemplateIcon = template.icon;
                
                return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group relative rounded-xl border bg-white hover:shadow-md transition-all overflow-hidden"
                  >
                    {/* Header area with icon, title, and Build button */}
                    <div className={cn(
                      "relative px-3 py-2.5 bg-gradient-to-br flex items-center gap-2.5",
                      colors.bg
                    )}>
                      {/* Icon */}
                      <div className={cn("p-1.5 rounded-md bg-white/60 backdrop-blur-sm shrink-0", colors.text)}>
                        <TemplateIcon className="h-4 w-4" />
                      </div>
                      
                      {/* Title */}
                      <h4 className="font-semibold text-sm text-gray-900 line-clamp-1 flex-1 min-w-0">
                        {template.name}
                      </h4>

                      {/* Build Button - matches Neptune button style */}
                      <Button
                        size="sm"
                        variant="surface"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTemplate(template.id);
                        }}
                        className="shrink-0 h-7 px-2.5 text-xs"
                        aria-label={`Build ${template.name} campaign`}
                      >
                        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Build</span>
                      </Button>
                    </div>

                    {/* Content */}
                    <div className="p-3">
                      <Badge className={cn("text-[10px] mb-2", colors.badge)}>
                        {template.category}
                      </Badge>
                      
                      {template.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                          {template.description}
                        </p>
                      )}

                      {/* Stats - all on one line */}
                      <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {template.duration}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span>{template.budget}</span>
                        {template.usageCount && template.usageCount > 0 && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {template.usageCount} uses
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
