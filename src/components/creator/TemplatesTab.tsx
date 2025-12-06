"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutTemplate,
  Mail,
  MessageSquare,
  FileText,
  PenLine,
  Sparkles,
  Search,
  Crown,
  TrendingUp,
  Grid3X3,
  List,
  Briefcase,
  Presentation,
  Folder,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// SWR fetcher with error handling
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('Failed to fetch data');
    throw error;
  }
  return res.json();
};

// Template response types
interface Template {
  id: string;
  name: string;
  description: string | null;
  type: string;
  category: string | null;
  thumbnail: string | null;
  isPremium: boolean;
  usageCount: number;
  createdAt: string;
}

interface TemplatesResponse {
  templates: Template[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  filters: {
    categories: string[];
    types: string[];
  };
}

// Category configuration
interface CategoryConfig {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const CATEGORIES: CategoryConfig[] = [
  { id: 'all', name: 'All Templates', icon: Grid3X3, color: 'text-gray-600', bgColor: 'bg-gray-100' },
  { id: 'email', name: 'Email', icon: Mail, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  { id: 'social', name: 'Social Media', icon: MessageSquare, color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
  { id: 'document', name: 'Documents', icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { id: 'blog', name: 'Blog Posts', icon: PenLine, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  { id: 'proposal', name: 'Proposals', icon: Briefcase, color: 'text-purple-600', bgColor: 'bg-purple-100' },
];

// Category colors for cards
const categoryColors: Record<string, { bg: string; text: string; badge: string }> = {
  email: { bg: 'from-amber-100 to-orange-100', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  social: { bg: 'from-cyan-100 to-blue-100', text: 'text-cyan-600', badge: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  document: { bg: 'from-blue-100 to-indigo-100', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700 border-blue-200' },
  blog: { bg: 'from-emerald-100 to-green-100', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  proposal: { bg: 'from-purple-100 to-violet-100', text: 'text-purple-600', badge: 'bg-purple-100 text-purple-700 border-purple-200' },
  presentation: { bg: 'from-indigo-100 to-purple-100', text: 'text-indigo-600', badge: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
};

// Category icons for cards
const categoryIcons: Record<string, React.ElementType> = {
  email: Mail,
  social: MessageSquare,
  document: FileText,
  blog: PenLine,
  proposal: Briefcase,
  presentation: Presentation,
};

export default function TemplatesTab() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch templates
  const { data, isLoading, error } = useSWR<TemplatesResponse>(
    '/api/creator/templates',
    fetcher
  );

  const templates = data?.templates || [];

  // Count templates per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: templates.length };
    templates.forEach(t => {
      const cat = t.category || 'other';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [templates]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let filtered = templates;
    
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.type.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [templates, selectedCategory, searchQuery]);

  // Use template
  const handleUseTemplate = async (templateId: string, templateName: string) => {
    try {
      const response = await fetch(`/api/creator/templates/${templateId}/use`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to use template');
      }

      toast.success(`Template "${templateName}" loaded!`, {
        description: "Switching to Create tab...",
      });

      // In a real implementation, we'd pass the template data to the Create tab
    } catch {
      toast.error("Failed to load template");
    }
  };

  // Show error state if API fails
  if (error) {
    return (
      <Card className="h-full rounded-2xl shadow-sm border bg-card overflow-hidden flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-4 mx-auto">
            <LayoutTemplate className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Database Setup Required</h3>
          <p className="text-sm text-gray-500 mb-4">
            The Creator tables need to be created. Run the following command to set up the database:
          </p>
          <code className="block text-sm text-blue-700 bg-blue-50 rounded-lg p-3 font-mono mb-4">
            npm run db:push
          </code>
          <p className="text-xs text-gray-400">
            Then restart your development server.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full rounded-2xl shadow-sm border bg-card overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b bg-gradient-to-r from-blue-50/80 to-indigo-50/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
              <LayoutTemplate className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-gray-900">Templates</h2>
              <p className="text-sm text-gray-500">
                Ready-to-use templates for every need
              </p>
            </div>
          </div>
          
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            <Sparkles className="h-3 w-3 mr-1" />
            {templates.length} Templates
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Categories Sidebar */}
        <div className="w-56 border-r bg-gray-50/50 p-4 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-9 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {CATEGORIES.map((category) => {
                const isSelected = selectedCategory === category.id;
                const count = categoryCounts[category.id] || 0;
                
                // Only show categories that have templates (except 'all')
                if (category.id !== 'all' && count === 0) return null;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                      isSelected
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                    aria-label={`View ${category.name} templates`}
                    aria-current={isSelected ? "page" : undefined}
                  >
                    <category.icon className={cn("h-4 w-4", isSelected ? "text-blue-600" : category.color)} />
                    <span className="flex-1 text-left truncate">{category.name}</span>
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded-full",
                      isSelected ? "bg-blue-200 text-blue-700" : "bg-gray-200 text-gray-500"
                    )}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Templates List */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search and View Toggle */}
          <div className="px-4 py-3 border-b flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="pl-9 h-9 text-sm"
                aria-label="Search templates"
              />
            </div>
            <div className="flex items-center border rounded-lg overflow-hidden">
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
            </div>
          </div>

          {/* Templates */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Skeleton key={i} className="h-40 rounded-xl" />
                ))}
              </div>
            ) : filteredTemplates.length === 0 ? (
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
                  const colors = categoryColors[template.category || ''] || categoryColors.document;
                  const CategoryIcon = categoryIcons[template.category || ''] || FileText;
                  
                  return (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-white hover:shadow-sm hover:border-gray-300 transition-all group cursor-pointer"
                      onClick={() => handleUseTemplate(template.id, template.name)}
                    >
                      {/* Icon */}
                      <div className={cn("p-2 rounded-lg", colors.badge.split(' ')[0], colors.text)}>
                        <CategoryIcon className="h-4 w-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm text-gray-900 truncate">
                            {template.name}
                          </h4>
                          {template.isPremium && (
                            <Crown className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4", colors.badge)}>
                            {template.category || template.type}
                          </Badge>
                          {template.usageCount > 0 && (
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

                      {/* Use Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        Use Template
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              // Grid View
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => {
                  const colors = categoryColors[template.category || ''] || categoryColors.document;
                  const CategoryIcon = categoryIcons[template.category || ''] || FileText;
                  
                  return (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group relative rounded-xl border bg-white hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                      onClick={() => handleUseTemplate(template.id, template.name)}
                    >
                      {/* Header area with icon and title */}
                      <div className={cn(
                        "relative px-3 py-2.5 bg-gradient-to-br flex items-center gap-2.5",
                        colors.bg
                      )}>
                        {/* Icon */}
                        <div className={cn("p-1.5 rounded-md bg-white/60 backdrop-blur-sm shrink-0", colors.text)}>
                          <CategoryIcon className="h-4 w-4" />
                        </div>
                        
                        {/* Title */}
                        <h4 className="font-semibold text-sm text-gray-900 line-clamp-1 flex-1 min-w-0">
                          {template.name}
                        </h4>
                        
                        {/* Premium badge */}
                        {template.isPremium && (
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-sm text-[10px] shrink-0">
                            <Crown className="h-3 w-3 mr-0.5" />
                            Pro
                          </Badge>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-3">
                        <Badge className={cn("text-[10px] mb-2", colors.badge)}>
                          {template.category || template.type}
                        </Badge>
                        
                        {template.description && (
                          <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                            {template.description}
                          </p>
                        )}

                        {template.usageCount > 0 && (
                          <div className="flex items-center text-xs text-gray-400">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {template.usageCount} uses
                          </div>
                        )}
                      </div>

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-lg">
                          Use Template
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
