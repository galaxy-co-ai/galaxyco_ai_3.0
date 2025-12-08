"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  FileText,
  Folder,
  Star,
  Clock,
  Sparkles,
  Plus,
  Eye,
  Download,
  Share2,
  X,
  Image as ImageIcon,
  Video,
  File,
  Archive,
  User,
  Calendar,
  ArrowRight,
  Loader2,
  FolderOpen,
  FolderPlus,
  Grid3X3,
  List,
  StarOff,
  MoreHorizontal,
  Trash2,
  Upload,
  Mail,
  PenLine,
  MessageSquare,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import NeptuneAssistPanel from "@/components/conversations/NeptuneAssistPanel";

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Collection {
  id: string;
  name: string;
  description?: string;
  itemCount: number;
  color?: string;
  icon?: string;
}

interface KnowledgeItem {
  id: string;
  name: string;
  type: string;
  project: string;
  createdBy: string;
  createdAt: string;
  size: string;
  description?: string;
  content?: string;
  url?: string;
  starred?: boolean;
  tags?: string[];
}

interface KnowledgeBaseDashboardProps {
  initialCollections: Collection[];
  initialItems: KnowledgeItem[];
}

type TabType = 'collections' | 'favorites' | 'recent' | 'upload';

// Type icon mapping
const typeIcons: Record<string, typeof FileText> = {
  document: FileText,
  pdf: File,
  image: ImageIcon,
  newsletter: Mail,
  blog: PenLine,
  social: MessageSquare,
  video: Video,
  spreadsheet: Archive,
  other: FileText,
};

const typeColors: Record<string, string> = {
  document: "bg-blue-100 text-blue-600",
  pdf: "bg-red-100 text-red-600",
  image: "bg-pink-100 text-pink-600",
  newsletter: "bg-amber-100 text-amber-600",
  blog: "bg-emerald-100 text-emerald-600",
  social: "bg-cyan-100 text-cyan-600",
  video: "bg-purple-100 text-purple-600",
  spreadsheet: "bg-green-100 text-green-600",
  other: "bg-gray-100 text-gray-600",
};

// Format relative time
function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  } catch {
    return dateStr;
  }
}

// Get type from item
function getItemType(type: string): string {
  const typeLower = type.toLowerCase();
  if (typeLower.includes('pdf')) return 'pdf';
  if (typeLower.includes('image') || typeLower === 'img') return 'image';
  if (typeLower.includes('video')) return 'video';
  if (typeLower.includes('spreadsheet') || typeLower.includes('excel')) return 'spreadsheet';
  if (typeLower.includes('newsletter') || typeLower.includes('email')) return 'newsletter';
  if (typeLower.includes('blog') || typeLower.includes('article')) return 'blog';
  if (typeLower.includes('social')) return 'social';
  if (typeLower.includes('doc') || typeLower.includes('text')) return 'document';
  return 'document';
}

// Default collection categories for sidebar
const defaultCollectionCategories = [
  { id: "all", name: "All Items", icon: Grid3X3, color: "text-gray-600" },
  { id: "documents", name: "Documents", icon: FileText, color: "text-blue-600" },
  { id: "images", name: "Images", icon: ImageIcon, color: "text-pink-600" },
  { id: "pdfs", name: "PDFs", icon: File, color: "text-red-600" },
];

export default function KnowledgeBaseDashboard({
  initialCollections,
  initialItems,
}: KnowledgeBaseDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('collections');
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<KnowledgeItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [searchResults, setSearchResults] = useState<KnowledgeItem[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showNeptune, setShowNeptune] = useState(false);
  const [starredItems, setStarredItems] = useState<Set<string>>(new Set());
  
  // New Collection Dialog State
  const [showNewCollectionDialog, setShowNewCollectionDialog] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);

  // Fetch knowledge items from API
  const { data: knowledgeData, mutate: mutateKnowledge } = useSWR<{
    collections: Collection[];
    items: KnowledgeItem[];
  }>('/api/knowledge', fetcher, {
    refreshInterval: 30000,
    fallbackData: { collections: initialCollections, items: initialItems },
  });

  // Use API data if available, otherwise fall back to initial data
  const currentItems: KnowledgeItem[] = knowledgeData?.items || initialItems;
  const currentCollections: Collection[] = knowledgeData?.collections || initialCollections;

  // Handle file upload
  const handleFileUpload = async (file: File, collectionId?: string) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (collectionId) {
        formData.append('collectionId', collectionId);
      }
      if (file.name) {
        formData.append('title', file.name.replace(/\.[^/.]+$/, ''));
      }

      const response = await fetch('/api/knowledge/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      toast.success('File uploaded successfully!');
      setShowUploadDialog(false);
      setUploadProgress(100);
      
      await mutateKnowledge();
    } catch (error) {
      logger.error('Upload error', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  // Handle search with debouncing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch('/api/knowledge/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: searchQuery.trim(),
            limit: 20,
          }),
        });

        if (!response.ok) {
          throw new Error('Search failed');
        }

        const data = await response.json();
        setSearchResults(
          data.results.map((item: { id: string; title: string; type: string; collection?: string; createdAt: string; summary?: string; content?: string; url?: string }) => ({
            id: item.id,
            name: item.title,
            type: item.type.toUpperCase(),
            project: item.collection || 'Uncategorized',
            createdBy: 'User',
            createdAt: new Date(item.createdAt).toLocaleDateString(),
            size: 'N/A',
            description: item.summary || item.content?.substring(0, 100) || '',
            content: item.content,
            url: item.url,
          }))
        );
      } catch (error) {
        logger.error('Search error', error);
        toast.error('Search failed. Please try again.');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Calculate stats
  const stats = {
    totalItems: currentItems.length,
    totalCollections: currentCollections.length,
    recentItems: currentItems.filter((item) => {
      try {
        const date = new Date(item.createdAt);
        if (isNaN(date.getTime())) return false;
        const daysAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
        return daysAgo <= 7;
      } catch {
        return false;
      }
    }).length,
  };

  // Filter items based on active tab and category
  const filteredItems = useMemo(() => {
    const itemsToFilter = searchResults !== null ? searchResults : [...currentItems];
    let items = [...itemsToFilter];

    // Filter by tab
    if (activeTab === 'favorites') {
      items = items.filter((item) => starredItems.has(item.id));
    } else if (activeTab === 'recent') {
      items = items
        .filter((item) => {
          try {
            const date = new Date(item.createdAt);
            if (isNaN(date.getTime())) return false;
            const daysAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
            return daysAgo <= 7;
          } catch {
            return false;
          }
        })
        .sort((a, b) => {
          try {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
            return dateB.getTime() - dateA.getTime();
          } catch {
            return 0;
          }
        });
    } else if (activeTab === 'collections' && selectedCategory !== 'all') {
      // Filter by type category
      items = items.filter((item) => {
        const itemType = getItemType(item.type);
        if (selectedCategory === 'documents') return itemType === 'document' || itemType === 'blog';
        if (selectedCategory === 'images') return itemType === 'image';
        if (selectedCategory === 'pdfs') return itemType === 'pdf';
        // Check if it matches a custom collection
        const collection = currentCollections.find(c => c.id === selectedCategory);
        if (collection) return item.project === collection.name;
        return true;
      });
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          (item.name || '').toLowerCase().includes(query) ||
          (item.description || '').toLowerCase().includes(query) ||
          (item.project || '').toLowerCase().includes(query)
      );
    }

    return items;
  }, [activeTab, searchQuery, selectedCategory, currentItems, searchResults, starredItems, currentCollections]);

  // Get category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: currentItems.length };
    currentItems.forEach((item) => {
      const itemType = getItemType(item.type);
      if (itemType === 'document' || itemType === 'blog') {
        counts.documents = (counts.documents || 0) + 1;
      }
      if (itemType === 'image') {
        counts.images = (counts.images || 0) + 1;
      }
      if (itemType === 'pdf') {
        counts.pdfs = (counts.pdfs || 0) + 1;
      }
    });
    // Add custom collection counts
    currentCollections.forEach((col) => {
      counts[col.id] = col.itemCount;
    });
    return counts;
  }, [currentItems, currentCollections]);

  // Tab configuration
  const tabs = [
    { id: 'collections' as TabType, label: 'Collections', icon: Folder, activeColor: 'bg-emerald-100 text-emerald-700' },
    { id: 'favorites' as TabType, label: 'Favorites', icon: Star, badge: starredItems.size.toString(), badgeColor: 'bg-amber-500', activeColor: 'bg-amber-100 text-amber-700' },
    { id: 'recent' as TabType, label: 'Recent', icon: Clock, activeColor: 'bg-cyan-100 text-cyan-700' },
    { id: 'upload' as TabType, label: 'Upload', icon: Upload, activeColor: 'bg-blue-100 text-blue-700' },
  ];

  // Toggle star
  const toggleStar = (itemId: string) => {
    setStarredItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
        toast.success("Removed from favorites");
      } else {
        newSet.add(itemId);
        toast.success("Added to favorites");
      }
      return newSet;
    });
  };

  // Handle document click
  const handleDocumentClick = (item: KnowledgeItem) => {
    setViewingDocument(item);
    setShowDocumentDialog(true);
  };

  // Handle view document
  const handleViewDocument = (item: KnowledgeItem, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setViewingDocument(item);
    setShowDocumentDialog(true);
  };

  // Handle download document
  const handleDownloadDocument = async (item: KnowledgeItem, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!item.url) {
      toast.error('Document URL not available');
      return;
    }

    try {
      // Open in new tab for download
      const link = document.createElement('a');
      link.href = item.url;
      link.download = item.name || 'document';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started');
    } catch (error) {
      logger.error('Failed to download document', { error, itemId: item.id });
      toast.error('Failed to download document');
    }
  };

  // Handle delete document
  const handleDeleteDocument = async (item: KnowledgeItem, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const response = await fetch(`/api/knowledge/${item.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete document');
      }

      // Optimistically remove from list
      await mutateKnowledge();
      
      // Clear selection if this was the selected item
      if (selectedItem?.id === item.id) {
        setSelectedItem(null);
      }

      toast.success('Document deleted');
    } catch (error) {
      logger.error('Failed to delete document', { error, itemId: item.id });
      toast.error(error instanceof Error ? error.message : 'Failed to delete document');
    }
  };

  // Create new collection
  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      toast.error("Please enter a collection name");
      return;
    }

    setIsCreatingCollection(true);
    try {
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 800));

      setShowNewCollectionDialog(false);
      setNewCollectionName("");
      
      toast.success(`Collection "${newCollectionName}" created!`, {
        description: "Start adding items to your new collection",
      });
      
      await mutateKnowledge();
    } catch (error) {
      toast.error("Failed to create collection");
    } finally {
      setIsCreatingCollection(false);
    }
  };

  // Get icon for document type
  const getTypeIcon = (type: string) => {
    const itemType = getItemType(type);
    return typeIcons[itemType] || FileText;
  };

  // Get type color
  const getTypeColorClass = (type: string) => {
    const itemType = getItemType(type);
    return typeColors[itemType] || "bg-gray-100 text-gray-600";
  };

  return (
    <div className="flex h-full flex-col bg-gray-50/50">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-3">
            <BookOpen 
              className="w-7 h-7"
              style={{
                stroke: 'url(#icon-gradient-kb)',
                strokeWidth: 2,
                filter: 'drop-shadow(0 2px 4px rgba(139, 92, 246, 0.15))'
              }}
            />
            <svg width="0" height="0" className="absolute">
              <defs>
                <linearGradient id="icon-gradient-kb" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <h1 
              className="text-2xl uppercase"
              style={{ 
                fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif',
                fontWeight: 700,
                letterSpacing: '0.25em',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.04)' 
              }}
            >
              Library
            </h1>
          </div>

          {/* Stats Bar */}
          <div className="hidden lg:flex flex-wrap items-center gap-3">
            <Badge className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
              <FileText className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
              <span className="font-semibold">{stats.totalItems}</span>
              <span className="ml-1 text-emerald-600/70 font-normal">Items</span>
            </Badge>
            <Badge className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors">
              <Folder className="h-3.5 w-3.5 mr-1.5 text-purple-600" />
              <span className="font-semibold">{stats.totalCollections}</span>
              <span className="ml-1 text-purple-600/70 font-normal">Collections</span>
            </Badge>
            <Badge className="px-3 py-1.5 bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100 transition-colors">
              <Clock className="h-3.5 w-3.5 mr-1.5 text-cyan-600" />
              <span className="font-semibold">{stats.recentItems}</span>
              <span className="ml-1 text-cyan-600/70 font-normal">Recent</span>
            </Badge>
          </div>
        </div>

        {/* Tab Bar with Ask Neptune Button */}
        <div className="mt-14 relative flex items-center justify-center overflow-x-auto pb-2 -mb-2">
          <div className="bg-background/80 backdrop-blur-lg rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-1 inline-flex gap-1 flex-nowrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'upload') {
                    setShowUploadDialog(true);
                  } else {
                    setActiveTab(tab.id);
                  }
                }}
                className={cn(
                  "relative h-8 px-3.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2",
                  activeTab === tab.id
                    ? `${tab.activeColor} shadow-sm`
                    : 'text-gray-600 hover:bg-gray-100'
                )}
                aria-label={`Switch to ${tab.label} tab`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.badge && tab.badge !== "0" && (
                  <Badge
                    className={cn(
                      "text-xs px-1.5 py-0 h-4 min-w-[18px]",
                      activeTab === tab.id ? 'bg-white/90 text-gray-700' : tab.badgeColor + ' text-white'
                    )}
                  >
                    {tab.badge}
                  </Badge>
                )}
              </button>
            ))}
          </div>
          <div className="absolute right-0">
            <Button
              size="sm"
              onClick={() => setShowNeptune(!showNeptune)}
              className="bg-white hover:bg-white text-gray-700 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:-translate-y-px hover:shadow-lg active:scale-[0.98] active:shadow-sm border border-gray-200 transition-all duration-150 gap-2"
              aria-label="Toggle Neptune AI assistant"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden md:inline">Neptune</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content with Neptune Panel */}
      <div className="flex flex-1 overflow-hidden gap-6 px-4 sm:px-6 pb-6 max-w-7xl mx-auto w-full">
        <div className={cn("flex-1 transition-all duration-200", showNeptune ? "w-[70%]" : "w-full")}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {/* COLLECTIONS TAB - Creator-style design */}
              {activeTab === 'collections' && (
                <Card className="h-full rounded-2xl shadow-lg border-0 bg-card overflow-hidden flex flex-col">
                  {/* Header */}
                  <div className="px-6 py-5 border-b bg-gradient-to-r from-emerald-50/80 to-green-50/80 shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg">
                          <FolderOpen className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="font-semibold text-lg text-gray-900">Collections</h2>
                          <p className="text-sm text-gray-500">
                            AI-organized library of your documents
                          </p>
                        </div>
                      </div>
                      
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Auto-organized
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 overflow-hidden min-h-0">
                    {/* Collections Sidebar */}
                    <div className="w-56 border-r bg-gray-50/50 p-4 overflow-y-auto shrink-0">
                      <div className="space-y-1">
                        {defaultCollectionCategories.map((category) => {
                          const isSelected = selectedCategory === category.id;
                          const count = categoryCounts[category.id] || 0;
                          return (
                            <button
                              key={category.id}
                              onClick={() => setSelectedCategory(category.id)}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                                isSelected
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "text-gray-600 hover:bg-gray-100"
                              )}
                              aria-label={`View ${category.name}`}
                              aria-current={isSelected ? "page" : undefined}
                            >
                              <category.icon className={cn("h-4 w-4", isSelected ? "text-emerald-600" : category.color)} />
                              <span className="flex-1 text-left truncate">{category.name}</span>
                              <span className={cn(
                                "text-xs px-1.5 py-0.5 rounded-full",
                                isSelected ? "bg-emerald-200 text-emerald-700" : "bg-gray-200 text-gray-500"
                              )}>
                                {count}
                              </span>
                            </button>
                          );
                        })}
                        
                        {/* Custom Collections */}
                        {currentCollections.length > 0 && (
                          <>
                            <div className="my-3 border-t" />
                            {currentCollections.map((collection) => {
                              const isSelected = selectedCategory === collection.id;
                              return (
                                <button
                                  key={collection.id}
                                  onClick={() => setSelectedCategory(collection.id)}
                                  className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                                    isSelected
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "text-gray-600 hover:bg-gray-100"
                                  )}
                                  aria-label={`View ${collection.name} collection`}
                                >
                                  <Folder className={cn("h-4 w-4", isSelected ? "text-emerald-600" : "text-gray-400")} />
                                  <span className="flex-1 text-left truncate">{collection.name}</span>
                                  <span className={cn(
                                    "text-xs px-1.5 py-0.5 rounded-full",
                                    isSelected ? "bg-emerald-200 text-emerald-700" : "bg-gray-200 text-gray-500"
                                  )}>
                                    {collection.itemCount}
                                  </span>
                                </button>
                              );
                            })}
                          </>
                        )}
                      </div>

                      {/* Create Collection Button */}
                      <div className="mt-4 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-gray-600 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
                          onClick={() => setShowNewCollectionDialog(true)}
                        >
                          <FolderPlus className="h-4 w-4 mr-2" />
                          New Collection
                        </Button>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                      {/* Search and View Toggle */}
                      <div className="px-4 py-3 border-b flex items-center gap-3 shrink-0">
                        <div className="flex-1 relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search documents..."
                            className="pl-9 h-9 text-sm"
                            aria-label="Search documents"
                          />
                          {isSearching && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                          )}
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

                      {/* Items */}
                      <div className="flex-1 overflow-y-auto p-4">
                        {filteredItems.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-center py-12">
                            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                              <FolderOpen className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {searchQuery ? 'No matches found' : 'No documents yet'}
                            </h3>
                            <p className="text-sm text-gray-500 max-w-xs">
                              {searchQuery 
                                ? 'Try a different search term or browse collections.'
                                : 'Upload documents or create content to build your library.'}
                            </p>
                            {!searchQuery && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="mt-4"
                                onClick={() => setShowUploadDialog(true)}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Document
                              </Button>
                            )}
                          </div>
                        ) : viewMode === "list" ? (
                          <div className="space-y-2">
                            {filteredItems.map((item) => {
                              const TypeIcon = getTypeIcon(item.type);
                              const isStarred = starredItems.has(item.id);
                              return (
                                <motion.div
                                  key={item.id}
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="flex items-center gap-3 p-3 rounded-lg border bg-white hover:shadow-sm hover:border-gray-300 transition-all group cursor-pointer"
                                  onClick={() => handleDocumentClick(item)}
                                >
                                  {/* Type Icon */}
                                  <div className={cn("p-2 rounded-lg", getTypeColorClass(item.type))}>
                                    <TypeIcon className="h-4 w-4" />
                                  </div>

                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium text-sm text-gray-900 truncate">
                                        {item.name}
                                      </h4>
                                      {isStarred && (
                                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatRelativeTime(item.createdAt)}
                                      </span>
                                      <span className="text-gray-300">•</span>
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] px-1.5 py-0 h-4 text-gray-500 border-gray-200"
                                      >
                                        {item.project}
                                      </Badge>
                                      {item.tags && item.tags.length > 0 && (
                                        <>
                                          <span className="text-gray-300">•</span>
                                          <span className="text-xs text-gray-400">
                                            +{item.tags.length} tags
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleStar(item.id);
                                      }}
                                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                      aria-label={isStarred ? "Remove from favorites" : "Add to favorites"}
                                    >
                                      {isStarred ? (
                                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                      ) : (
                                        <StarOff className="h-4 w-4 text-gray-400" />
                                      )}
                                    </button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <button
                                          onClick={(e) => e.stopPropagation()}
                                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                          aria-label="More options"
                                        >
                                          <MoreHorizontal className="h-4 w-4 text-gray-400" />
                                        </button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem
                                          onClick={(e) => handleViewDocument(item, e)}
                                        >
                                          <Eye className="h-4 w-4 mr-2" />
                                          View
                                        </DropdownMenuItem>
                                        {item.url && (
                                          <DropdownMenuItem
                                            onClick={(e) => handleDownloadDocument(item, e)}
                                          >
                                            <Download className="h-4 w-4 mr-2" />
                                            Download
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={(e) => handleDeleteDocument(item, e)}
                                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        ) : (
                          // Grid view
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {filteredItems.map((item) => {
                              const TypeIcon = getTypeIcon(item.type);
                              const isStarred = starredItems.has(item.id);
                              return (
                                <motion.div
                                  key={item.id}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="p-4 rounded-xl border bg-white hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
                                  onClick={() => handleDocumentClick(item)}
                                >
                                  <div className="flex items-start justify-between mb-3">
                                    <div className={cn("p-2 rounded-lg", getTypeColorClass(item.type))}>
                                      <TypeIcon className="h-4 w-4" />
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleStar(item.id);
                                        }}
                                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                        aria-label={isStarred ? "Remove from favorites" : "Add to favorites"}
                                      >
                                        {isStarred ? (
                                          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                        ) : (
                                          <StarOff className="h-4 w-4 text-gray-400" />
                                        )}
                                      </button>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <button
                                            onClick={(e) => e.stopPropagation()}
                                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                            aria-label="More options"
                                          >
                                            <MoreHorizontal className="h-4 w-4 text-gray-400" />
                                          </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                          <DropdownMenuItem
                                            onClick={(e) => handleViewDocument(item, e)}
                                          >
                                            <Eye className="h-4 w-4 mr-2" />
                                            View
                                          </DropdownMenuItem>
                                          {item.url && (
                                            <DropdownMenuItem
                                              onClick={(e) => handleDownloadDocument(item, e)}
                                            >
                                              <Download className="h-4 w-4 mr-2" />
                                              Download
                                            </DropdownMenuItem>
                                          )}
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            onClick={(e) => handleDeleteDocument(item, e)}
                                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>
                                  <h4 className="font-medium text-sm text-gray-900 line-clamp-2 mb-2">
                                    {item.name}
                                  </h4>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Clock className="h-3 w-3" />
                                    {formatRelativeTime(item.createdAt)}
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
              )}

              {/* FAVORITES TAB */}
              {activeTab === 'favorites' && (
                <Card className="h-full rounded-2xl shadow-lg border-0 bg-card overflow-hidden flex flex-col">
                  {/* Header */}
                  <div className="px-6 py-5 border-b bg-gradient-to-r from-amber-50/80 to-yellow-50/80 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-white shadow-lg">
                        <Star className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-lg text-gray-900">Favorites</h2>
                        <p className="text-sm text-gray-500">
                          Your starred documents for quick access
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {filteredItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
                          <Star className="h-8 w-8 text-amber-500" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">No favorites yet</h3>
                        <p className="text-sm text-gray-500 max-w-xs">
                          Star your most important documents to access them quickly here.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredItems.map((item) => {
                          const TypeIcon = getTypeIcon(item.type);
                          return (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center gap-3 p-3 rounded-lg border bg-white hover:shadow-sm hover:border-gray-300 transition-all group cursor-pointer"
                              onClick={() => handleDocumentClick(item)}
                            >
                              <div className={cn("p-2 rounded-lg", getTypeColorClass(item.type))}>
                                <TypeIcon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-sm text-gray-900 truncate">{item.name}</h4>
                                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-gray-500">{formatRelativeTime(item.createdAt)}</span>
                                  <span className="text-gray-300">•</span>
                                  <span className="text-xs text-gray-500">{item.project}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleStar(item.id);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                  aria-label="Remove from favorites"
                                >
                                  <X className="h-4 w-4 text-gray-400" />
                                </button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                      aria-label="More options"
                                    >
                                      <MoreHorizontal className="h-4 w-4 text-gray-400" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem
                                      onClick={(e) => handleViewDocument(item, e)}
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      View
                                    </DropdownMenuItem>
                                    {item.url && (
                                      <DropdownMenuItem
                                        onClick={(e) => handleDownloadDocument(item, e)}
                                      >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={(e) => handleDeleteDocument(item, e)}
                                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* RECENT TAB */}
              {activeTab === 'recent' && (
                <Card className="h-full rounded-2xl shadow-lg border-0 bg-card overflow-hidden flex flex-col">
                  {/* Header */}
                  <div className="px-6 py-5 border-b bg-gradient-to-r from-cyan-50/80 to-blue-50/80 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-lg text-gray-900">Recent</h2>
                        <p className="text-sm text-gray-500">
                          Documents from the past 7 days
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {filteredItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <div className="w-16 h-16 rounded-2xl bg-cyan-100 flex items-center justify-center mb-4">
                          <Clock className="h-8 w-8 text-cyan-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">Nothing recent</h3>
                        <p className="text-sm text-gray-500 max-w-xs">
                          Documents you view or edit will show up here for quick access.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredItems.map((item) => {
                          const TypeIcon = getTypeIcon(item.type);
                          const isStarred = starredItems.has(item.id);
                          return (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center gap-3 p-3 rounded-lg border bg-white hover:shadow-sm hover:border-gray-300 transition-all group cursor-pointer"
                              onClick={() => handleDocumentClick(item)}
                            >
                              <div className={cn("p-2 rounded-lg", getTypeColorClass(item.type))}>
                                <TypeIcon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-sm text-gray-900 truncate">{item.name}</h4>
                                  {isStarred && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-gray-500">{formatRelativeTime(item.createdAt)}</span>
                                  <span className="text-gray-300">•</span>
                                  <span className="text-xs text-gray-500">{item.project}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleStar(item.id);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                  aria-label={isStarred ? "Remove from favorites" : "Add to favorites"}
                                >
                                  {isStarred ? (
                                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                  ) : (
                                    <StarOff className="h-4 w-4 text-gray-400" />
                                  )}
                                </button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                      aria-label="More options"
                                    >
                                      <MoreHorizontal className="h-4 w-4 text-gray-400" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem
                                      onClick={(e) => handleViewDocument(item, e)}
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      View
                                    </DropdownMenuItem>
                                    {item.url && (
                                      <DropdownMenuItem
                                        onClick={(e) => handleDownloadDocument(item, e)}
                                      >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={(e) => handleDeleteDocument(item, e)}
                                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Neptune Panel */}
        <AnimatePresence>
          {showNeptune && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '30%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col shrink-0 relative z-40"
            >
              <Card className="flex flex-col h-full rounded-l-2xl shadow-lg border-0 border-r-0 bg-card overflow-hidden">
                <NeptuneAssistPanel
                  conversationId={null}
                  conversation={null}
                />
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Document Viewer Dialog */}
      <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
          {viewingDocument && (
            <>
              <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-blue-100/50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn("p-2.5 rounded-full shrink-0", getTypeColorClass(viewingDocument.type))}>
                    {(() => {
                      const Icon = getTypeIcon(viewingDocument.type);
                      return <Icon className="h-5 w-5" />;
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-lg font-semibold text-gray-900 truncate">
                      {viewingDocument.name}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-500">
                      {viewingDocument.type} • {viewingDocument.project} • {viewingDocument.size}
                    </DialogDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="icon" variant="ghost" aria-label="Download">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" aria-label="Share">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setShowDocumentDialog(false)}
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-white">
                {viewingDocument.type.toLowerCase().includes('image') && viewingDocument.url ? (
                  <div className="flex items-center justify-center min-h-[400px]">
                    <img
                      src={viewingDocument.url}
                      alt={viewingDocument.name}
                      className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                    />
                  </div>
                ) : viewingDocument.content ? (
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {viewingDocument.content}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                    <div className={cn("p-6 rounded-full mb-4", getTypeColorClass(viewingDocument.type))}>
                      {(() => {
                        const Icon = getTypeIcon(viewingDocument.type);
                        return <Icon className="h-12 w-12" />;
                      })()}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{viewingDocument.name}</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {viewingDocument.description || 'Document preview not available'}
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        aria-label="Open document"
                        onClick={() => {
                          if (viewingDocument.url) {
                            window.open(viewingDocument.url, '_blank', 'noopener,noreferrer');
                          } else {
                            toast.error('Document URL not available');
                          }
                        }}
                        disabled={!viewingDocument.url}
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Open Document
                      </Button>
                      <Button 
                        variant="outline" 
                        aria-label="Download"
                        onClick={() => {
                          if (viewingDocument.url) {
                            const link = document.createElement('a');
                            link.href = viewingDocument.url;
                            link.download = viewingDocument.name || 'document';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            toast.success('Download started');
                          } else {
                            toast.error('Download not available');
                          }
                        }}
                        disabled={!viewingDocument.url}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t bg-slate-50/50 flex items-center justify-between text-sm">
                <div className="flex items-center gap-4 text-gray-600">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {viewingDocument.createdBy}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {viewingDocument.createdAt}
                  </span>
                  <span className="flex items-center gap-1">
                    <Folder className="h-4 w-4" />
                    {viewingDocument.project}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {viewingDocument.type}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {viewingDocument.size}
                  </Badge>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-100">
                <Upload className="h-4 w-4 text-blue-600" />
              </div>
              Upload Document
            </DialogTitle>
            <DialogDescription>
              Upload a file to add it to your library. Supported formats: PDF, DOCX, TXT, MD, JSON (max 10MB)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) {
                  handleFileUpload(file);
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                isUploading
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
              )}
            >
              {isUploading ? (
                <div className="space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Uploading...</p>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{uploadProgress}%</p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    Drag and drop a file here, or click to browse
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    PDF, DOCX, TXT, MD, JSON up to 10MB
                  </p>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".pdf,.docx,.txt,.md,.json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    aria-label="Browse files"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Browse Files
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Collection Dialog */}
      <Dialog open={showNewCollectionDialog} onOpenChange={setShowNewCollectionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-100">
                <FolderPlus className="h-4 w-4 text-emerald-600" />
              </div>
              Create New Collection
            </DialogTitle>
            <DialogDescription>
              Organize your documents by adding them to custom collections.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <label htmlFor="collection-name" className="text-sm font-medium text-gray-700 mb-2 block">
              Collection Name
            </label>
            <Input
              id="collection-name"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="e.g., Q1 Marketing Campaign"
              className="w-full"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isCreatingCollection) {
                  e.preventDefault();
                  handleCreateCollection();
                }
              }}
              disabled={isCreatingCollection}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-2">
              You can rename or delete collections later.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowNewCollectionDialog(false);
                setNewCollectionName("");
              }}
              disabled={isCreatingCollection}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCollection}
              disabled={!newCollectionName.trim() || isCreatingCollection}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isCreatingCollection ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Create Collection
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
