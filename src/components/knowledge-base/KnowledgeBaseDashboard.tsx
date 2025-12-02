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
} from "@/components/ui/dialog";
import {
  Search,
  FileText,
  Folder,
  Star,
  Clock,
  BookOpen,
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
  Filter,
  Tag,
  User,
  Calendar,
  TrendingUp,
  ArrowRight,
  Code,
  MessageSquare,
  Loader2,
  CheckCircle2,
  Send,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { logger } from "@/lib/logger";

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
}

interface KnowledgeBaseDashboardProps {
  initialCollections: Collection[];
  initialItems: KnowledgeItem[];
}

type TabType = 'articles' | 'categories' | 'favorites' | 'recent' | 'upload';

export default function KnowledgeBaseDashboard({
  initialCollections,
  initialItems,
}: KnowledgeBaseDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('articles');
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<KnowledgeItem | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [createChatMessages, setCreateChatMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: Date }>>([]);
  const [createChatInput, setCreateChatInput] = useState("");
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);
  const [documentData, setDocumentData] = useState({
    title: "",
    type: "",
    category: "",
    content: "",
    description: "",
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [searchResults, setSearchResults] = useState<KnowledgeItem[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Neptune chat state (when no template selected)
  const [neptuneChatMessages, setNeptuneChatMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: Date }>>([
    {
      id: '1',
      role: 'assistant',
      content: "Hey! 👋 I'm Neptune. What would you like to create today? I can help you draft articles, SOPs, proposals, meeting notes, or any document you need. Just tell me what you're working on!",
      timestamp: new Date(),
    }
  ]);
  const [neptuneChatInput, setNeptuneChatInput] = useState("");
  const [isNeptuneTyping, setIsNeptuneTyping] = useState(false);

  // Fetch knowledge items from API
  const { data: knowledgeData, error: knowledgeError, mutate: mutateKnowledge } = useSWR<{
    collections: Collection[];
    items: KnowledgeItem[];
  }>('/api/knowledge', fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
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

      const result = await response.json();
      toast.success('File uploaded successfully!');
      setShowUploadDialog(false);
      setUploadProgress(100);
      
      // Refresh knowledge items
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
            collectionId: selectedCollection || undefined,
          }),
        });

        if (!response.ok) {
          throw new Error('Search failed');
        }

        const data = await response.json();
        setSearchResults(
          data.results.map((item: any) => ({
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
    }, 500); // 500ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, selectedCollection]);

  // Calculate stats
  const stats = {
    totalArticles: currentItems.length,
    totalCategories: currentCollections.length,
    totalViews: 0, // TODO: Calculate from database
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

  // Filter items based on active tab and search
  const filteredItems = useMemo(() => {
    // Use search results if available, otherwise use current items
    const itemsToFilter = searchResults !== null ? searchResults : [...currentItems];
    let items = [...itemsToFilter];

    // Filter by tab
    if (activeTab === 'favorites') {
      // TODO: Filter by favorite status
      items = items.slice(0, 10); // Placeholder
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
    } else if (activeTab === 'categories' && selectedCollection) {
      const selectedCollectionName = initialCollections.find(c => c.id === selectedCollection)?.name;
      if (selectedCollectionName) {
        items = items.filter((item) => item.project === selectedCollectionName);
      }
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
  }, [activeTab, searchQuery, selectedCollection, currentItems, searchResults]);

  // Filter collections
  const filteredCollections = useMemo(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return currentCollections.filter(
        (col) =>
          (col.name || '').toLowerCase().includes(query) ||
          (col.description || '').toLowerCase().includes(query)
      );
    }
    return currentCollections;
  }, [searchQuery, currentCollections]);

  // Stat badges
  const statBadges = [
    { label: `${stats.totalArticles} Articles`, icon: FileText, color: "bg-blue-100 text-blue-700" },
    { label: `${stats.totalCategories} Categories`, icon: Folder, color: "bg-purple-100 text-purple-700" },
    { label: `${stats.recentItems} Recent`, icon: Clock, color: "bg-green-100 text-green-700" },
  ];

  // Tab configuration
  const tabs = [
    { id: 'articles' as TabType, label: 'Articles', icon: FileText, activeColor: 'bg-blue-100 text-blue-700' },
    { id: 'categories' as TabType, label: 'Categories', icon: Folder, activeColor: 'bg-purple-100 text-purple-700' },
    { id: 'favorites' as TabType, label: 'Favorites', icon: Star, badge: '12', badgeColor: 'bg-amber-500', activeColor: 'bg-amber-100 text-amber-700' },
    { id: 'recent' as TabType, label: 'Recent', icon: Clock, activeColor: 'bg-cyan-100 text-cyan-700' },
    { id: 'upload' as TabType, label: 'Upload', icon: Plus, activeColor: 'bg-green-100 text-green-700' },
  ];

  // Get icon for document type
  const getTypeIcon = (type: string) => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('image') || typeLower === 'img') return ImageIcon;
    if (typeLower.includes('video')) return Video;
    if (typeLower.includes('pdf')) return File;
    if (typeLower.includes('spreadsheet') || typeLower.includes('excel')) return Archive;
    return FileText;
  };

  // Get type color
  const getTypeColor = (type: string) => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('image') || typeLower === 'img') return "bg-pink-500";
    if (typeLower.includes('video')) return "bg-red-500";
    if (typeLower.includes('pdf')) return "bg-red-500";
    if (typeLower.includes('spreadsheet') || typeLower.includes('excel')) return "bg-green-500";
    return "bg-blue-500";
  };

  // Document templates
  interface DocumentTemplate {
    id: string;
    name: string;
    description: string;
    icon: typeof FileText;
    iconColor: string;
    category: string;
  }

  const documentTemplates: DocumentTemplate[] = [
    {
      id: "article",
      name: "Article",
      description: "Create a standard article or blog post",
      icon: FileText,
      iconColor: "bg-blue-500",
      category: "Content",
    },
    {
      id: "documentation",
      name: "Documentation",
      description: "Technical documentation or user guides",
      icon: BookOpen,
      iconColor: "bg-purple-500",
      category: "Technical",
    },
    {
      id: "faq",
      name: "FAQ",
      description: "Frequently asked questions document",
      icon: MessageSquare,
      iconColor: "bg-green-500",
      category: "Support",
    },
    {
      id: "policy",
      name: "Policy Document",
      description: "Company policies, terms, or legal documents",
      icon: File,
      iconColor: "bg-amber-500",
      category: "Legal",
    },
    {
      id: "tutorial",
      name: "Tutorial",
      description: "Step-by-step tutorial or how-to guide",
      icon: Sparkles,
      iconColor: "bg-indigo-500",
      category: "Education",
    },
    {
      id: "meeting-notes",
      name: "Meeting Notes",
      description: "Template for meeting notes and summaries",
      icon: FileText,
      iconColor: "bg-cyan-500",
      category: "Business",
    },
    {
      id: "onboarding",
      name: "Onboarding Guide",
      description: "Employee or user onboarding documentation",
      icon: Users,
      iconColor: "bg-pink-500",
      category: "HR",
    },
    {
      id: "api-docs",
      name: "API Documentation",
      description: "API reference and integration guides",
      icon: Code,
      iconColor: "bg-emerald-500",
      category: "Technical",
    },
  ];

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = documentTemplates.find(t => t.id === templateId);
    if (template) {
      // Initialize chat with template-specific greeting
      setCreateChatMessages([{
        id: '1',
        role: 'assistant',
        content: `Hi! I'm here to help you create a ${template.name.toLowerCase()}. Let's start with the basics - what's the title or topic of this document?`,
        timestamp: new Date(),
      }]);
      setDocumentData({
        title: "",
        type: template.id,
        category: "",
        content: "",
        description: "",
      });
    }
  };

  // Handle chat message send - REAL API with document generation
  const handleSendCreateMessage = async () => {
    if (!createChatInput.trim() || !selectedTemplate) return;

    const userInput = createChatInput.trim();
    const template = documentTemplates.find(t => t.id === selectedTemplate);
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: userInput,
      timestamp: new Date(),
    };

    setCreateChatMessages(prev => [...prev, userMessage]);
    setCreateChatInput("");
    setIsCreatingDocument(true);

    try {
      // Build context about what we're creating
      const templateType = template?.id || 'general';
      const existingData = documentData;
      
      let prompt = `[Library - Document Creation]
Template: ${template?.name || 'General Document'}
`;

      if (!existingData.title) {
        prompt += `The user just provided a title: "${userInput}"
Please acknowledge the title and ask what category/folder they want to save it in. List available categories if possible using list_collections tool first.`;
      } else if (!existingData.category) {
        // Update local state with category
        setDocumentData(prev => ({ ...prev, category: userInput }));
        prompt += `Title: ${existingData.title}
Category chosen: ${userInput}
Ask the user to describe what content they want in this ${template?.name || 'document'}. What should it cover?`;
      } else if (!existingData.description) {
        // Update local state with description
        setDocumentData(prev => ({ ...prev, description: userInput }));
        prompt += `Title: ${existingData.title}
Category: ${existingData.category}
Description/Requirements: ${userInput}

NOW GENERATE THE DOCUMENT! Use the generate_document tool with:
- title: "${existingData.title}"
- documentType: "${templateType}"
- topic: "${userInput}"
- collectionName: "${existingData.category}"

After generating, use create_document to save it. Write comprehensive, professional, helpful content. Make it really good!`;
      } else {
        prompt += `We already have a document. User's follow-up: ${userInput}
If they want to modify or regenerate, do so. If they want to save, use create_document.`;
      }

      // Call real Neptune API
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from Neptune');
      }

      const data = await response.json();
      
      // Update document data if title was just set
      if (!existingData.title) {
        setDocumentData(prev => ({ ...prev, title: userInput }));
      }
      
      // Check if content was generated (look for markdown headers in response)
      const responseContent = data.message.content;
      if (responseContent.includes('# ') && responseContent.length > 500) {
        // Looks like generated content - extract it
        setDocumentData(prev => ({ 
          ...prev, 
          content: responseContent,
        }));
      }

      setCreateChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
      }]);

      // Refresh knowledge base in case document was saved
      mutateKnowledge();
    } catch (error) {
      logger.error('Document creation error', error);
      setCreateChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I encountered an issue while creating the document. Let me try again - please repeat your last message.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsCreatingDocument(false);
    }
  };

  // Handle Neptune chat message (when no template selected) - REAL API
  const handleSendNeptuneMessage = async () => {
    if (!neptuneChatInput.trim()) return;

    const userInput = neptuneChatInput.trim();
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: userInput,
      timestamp: new Date(),
    };

    setNeptuneChatMessages(prev => [...prev, userMessage]);
    setNeptuneChatInput("");
    setIsNeptuneTyping(true);

    try {
      // Call real Neptune API with knowledge base context
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `[Library Context] The user is in the Library "Create" tab and wants to create a document. Help them create high-quality content. If they describe what they want, use the generate_document tool to create it, then use create_document to save it. Be proactive and helpful.\n\nUser's request: ${userInput}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from Neptune');
      }

      const data = await response.json();
      
      setNeptuneChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message.content,
        timestamp: new Date(),
      }]);

      // Refresh knowledge base data in case document was created
      mutateKnowledge();
    } catch (error) {
      logger.error('Neptune chat error', error);
      setNeptuneChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment, or you can select a template from the list to get started.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsNeptuneTyping(false);
    }
  };

  // Handle document click - open in floating dialog
  const handleDocumentClick = (item: KnowledgeItem) => {
    setViewingDocument(item);
    setShowDocumentDialog(true);
  };

  return (
    <div className="h-full bg-gray-50/50 overflow-y-auto">
      {/* Header Section - Matching CRM/Marketing */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Library</h1>
          <p className="text-muted-foreground text-base">
            Organize, search, and access your documents and knowledge.
          </p>

          {/* Stats Bar - Compact Inline Centered */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Badge className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors">
              <FileText className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
              <span className="font-semibold">{stats.totalArticles}</span>
              <span className="ml-1 text-blue-600/70 font-normal">Articles</span>
            </Badge>
            <Badge className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors">
              <Folder className="h-3.5 w-3.5 mr-1.5 text-purple-600" />
              <span className="font-semibold">{stats.totalCategories}</span>
              <span className="ml-1 text-purple-600/70 font-normal">Categories</span>
            </Badge>
            <Badge className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors">
              <Clock className="h-3.5 w-3.5 mr-1.5 text-green-600" />
              <span className="font-semibold">{stats.recentItems}</span>
              <span className="ml-1 text-green-600/70 font-normal">Recent</span>
            </Badge>
          </div>
        </div>

        {/* Floating Tab Bar */}
        <div className="flex justify-center overflow-x-auto pb-2 -mb-2">
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

        {/* Search Bar - Below Tab Bar */}
        <div className="flex justify-center pt-4">
          <div className="w-full max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search documents, categories, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-12 h-12 text-base bg-background/80 backdrop-blur-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                aria-label="Search knowledge base"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {isSearching && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {searchQuery && !isSearching && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults(null);
                    }}
                    className="h-8 w-8"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
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
          className="max-w-7xl mx-auto px-4 sm:px-6 pb-6"
        >
          {/* ARTICLES / FAVORITES / RECENT TABS */}
          {(activeTab === 'articles' || activeTab === 'favorites' || activeTab === 'recent') && (
            <Card className="p-4 sm:p-6 lg:p-8 shadow-lg border-0 mb-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
                {/* Left: Articles List */}
                <div className="flex flex-col h-[calc(100vh-440px)] min-h-[400px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  {/* Header */}
                  <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-blue-100/50 flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[15px] text-gray-900">
                            {activeTab === 'favorites' ? 'Favorites' : activeTab === 'recent' ? 'Recent' : 'Articles'}
                          </h3>
                          <p className="text-[13px] text-blue-600 flex items-center gap-1">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:bg-white/90 text-blue-600 hover:text-blue-700 shadow-sm"
                        aria-label="Add document"
                        onClick={() => setShowUploadDialog(true)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Filter by Type */}
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-gray-500">Use search bar above to filter</span>
                    </div>
                  </div>

                  {/* Articles List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {filteredItems.length > 0 ? (
                      filteredItems.map((item) => {
                        const isSelected = selectedItem?.id === item.id;
                        const TypeIcon = getTypeIcon(item.type);
                        const typeColor = getTypeColor(item.type);
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setSelectedItem(item);
                              handleDocumentClick(item);
                            }}
                            className={cn(
                              "w-full p-3 rounded-lg border text-left transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                              isSelected
                                ? "border-blue-300 bg-blue-50/30 shadow-sm"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                            )}
                            aria-label={`Select document: ${item.name}`}
                            aria-pressed={isSelected}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-full ${typeColor} flex-shrink-0`}>
                                <TypeIcon className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0 h-4 bg-slate-50 text-slate-700 border-slate-200"
                                  >
                                    {item.type}
                                  </Badge>
                                </div>
                                {item.description && (
                                  <p className="text-xs text-gray-500 mb-1 line-clamp-2">{item.description}</p>
                                )}
                                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <Folder className="h-3 w-3" />
                                    {item.project}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {item.createdAt}
                                  </span>
                                  <span>{item.size}</span>
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 px-6">
                        {activeTab === 'favorites' ? (
                          <>
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center mx-auto mb-4">
                              <Star className="h-7 w-7 text-amber-500" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">No favorites yet</h3>
                            <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">
                              Star your most important documents to access them quickly here.
                            </p>
                          </>
                        ) : activeTab === 'recent' ? (
                          <>
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center mx-auto mb-4">
                              <Clock className="h-7 w-7 text-cyan-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Nothing recent</h3>
                            <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">
                              Documents you view or edit will show up here for quick access.
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
                              <FileText className="h-7 w-7 text-blue-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">
                              {searchQuery ? 'No matches found' : 'No articles yet'}
                            </h3>
                            <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">
                              {searchQuery 
                                ? `Try a different search term or browse categories.`
                                : `Upload documents or create content in the Creator page to build your knowledge base.`}
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Document Preview/Details */}
                <div className="flex flex-col h-[calc(100vh-440px)] min-h-[400px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  {/* Header */}
                  <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-blue-100/50 flex-shrink-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 mb-1">
                          {selectedItem?.name || "Select a document"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {selectedItem ? `${selectedItem.type} • ${selectedItem.project}` : "Choose a document to view details"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Document Details */}
                  <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                    {selectedItem ? (
                      <div className="space-y-6">
                        {/* Document Info */}
                        <div className="bg-white rounded-lg p-4 border border-slate-200">
                          <div className="flex items-start gap-4 mb-4">
                            <div className={`p-3 rounded-lg ${getTypeColor(selectedItem.type)}`}>
                              {(() => {
                                const Icon = getTypeIcon(selectedItem.type);
                                return <Icon className="h-6 w-6 text-white" />;
                              })()}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-2">{selectedItem.name}</h4>
                              <div className="flex flex-wrap gap-2 mb-3">
                                <Badge variant="outline" className="text-xs">
                                  {selectedItem.type}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {selectedItem.project}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {selectedItem.size}
                                </Badge>
                              </div>
                              {selectedItem.description && (
                                <p className="text-sm text-gray-600 mb-4">{selectedItem.description}</p>
                              )}
                            </div>
                          </div>

                          {/* Metadata */}
                          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Created By</p>
                              <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {selectedItem.createdBy}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Created</p>
                              <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {selectedItem.createdAt}
                              </p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
                            <Button
                              size="sm"
                              onClick={() => handleDocumentClick(selectedItem)}
                              className="flex-1"
                              aria-label="View full document"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Full
                            </Button>
                            <Button size="sm" variant="outline" aria-label="Download">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                            <Button size="sm" variant="outline" aria-label="Share">
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Preview Content */}
                        {selectedItem.content && (
                          <div className="bg-white rounded-lg p-4 border border-slate-200">
                            <h5 className="text-sm font-semibold text-gray-900 mb-3">Preview</h5>
                            <div className="text-sm text-gray-600 line-clamp-6">
                              {selectedItem.content}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-3 w-full"
                              onClick={() => handleDocumentClick(selectedItem)}
                            >
                              View Full Content <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center max-w-sm">
                          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                            <FileText className="h-8 w-8 text-slate-400" />
                          </div>
                          <h3 className="text-base font-semibold text-gray-900 mb-2">Select a document</h3>
                          <p className="text-sm text-gray-500">
                            Choose a document from the list to view details, preview, and access actions.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* CATEGORIES TAB */}
          {activeTab === 'categories' && (
            <Card className="p-4 sm:p-6 lg:p-8 shadow-lg border-0 mb-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
                {/* Left: Categories List */}
                <div className="flex flex-col h-[calc(100vh-440px)] min-h-[400px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  {/* Header */}
                  <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-purple-100/50 flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md">
                          <Folder className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[15px] text-gray-900">Categories</h3>
                          <p className="text-[13px] text-purple-600 flex items-center gap-1">
                            <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                            {filteredCollections.length} categories
                          </p>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:bg-white/90 text-purple-600 hover:text-purple-700 shadow-sm"
                        aria-label="Add category"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Filter Info */}
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-gray-500">Use search bar above to filter</span>
                    </div>
                  </div>

                  {/* Categories List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {filteredCollections.length > 0 ? (
                      filteredCollections.map((collection) => {
                        const isSelected = selectedCollection === collection.id;
                        return (
                          <button
                            key={collection.id}
                            onClick={() => {
                              setSelectedCollection(collection.id);
                              setActiveTab('articles'); // Switch to articles to show items
                            }}
                            className={cn(
                              "w-full p-3 rounded-lg border text-left transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1",
                              isSelected
                                ? "border-purple-300 bg-purple-50/30 shadow-sm"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                            )}
                            aria-label={`Select category: ${collection.name}`}
                            aria-pressed={isSelected}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${collection.color || 'bg-purple-500'} flex-shrink-0`}>
                                <Folder className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className="text-sm font-semibold text-gray-900">{collection.name}</p>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0 h-4 bg-purple-50 text-purple-700 border-purple-200"
                                  >
                                    {collection.itemCount}
                                  </Badge>
                                </div>
                                {collection.description && (
                                  <p className="text-xs text-gray-500">{collection.description}</p>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 px-6">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center mx-auto mb-4">
                          <Folder className="h-7 w-7 text-purple-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Organize your content</h3>
                        <p className="text-sm text-muted-foreground max-w-[200px] mx-auto mb-4">
                          Categories help you group related documents for easy navigation.
                        </p>
                        <Button size="sm" variant="outline" className="gap-2 text-purple-700 border-purple-200 hover:bg-purple-50">
                          <Plus className="h-4 w-4" />
                          Create Category
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Category Details */}
                <div className="flex flex-col h-[calc(100vh-440px)] min-h-[400px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  {/* Header */}
                  <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-purple-100/50 flex-shrink-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 mb-1">
                          {filteredCollections.find(c => c.id === selectedCollection)?.name || "Select a category"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {filteredCollections.find(c => c.id === selectedCollection)?.description || "Choose a category to view its contents"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Category Content */}
                  <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                    {selectedCollection ? (
                      <div className="space-y-4">
                        {(() => {
                          const categoryItems = initialItems.filter(item => item.project === filteredCollections.find(c => c.id === selectedCollection)?.name);
                          return categoryItems.length > 0 ? (
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold text-gray-900">Documents in this category</h4>
                              {categoryItems.map((item) => {
                                const TypeIcon = getTypeIcon(item.type);
                                const typeColor = getTypeColor(item.type);
                                return (
                                  <div
                                    key={item.id}
                                    className="p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer"
                                    onClick={() => {
                                      setSelectedItem(item);
                                      handleDocumentClick(item);
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`View document: ${item.name}`}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setSelectedItem(item);
                                        handleDocumentClick(item);
                                      }
                                    }}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`p-2 rounded-full ${typeColor} flex-shrink-0`}>
                                        <TypeIcon className="h-4 w-4 text-white" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                                        <p className="text-xs text-gray-500">{item.createdAt} • {item.size}</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-12 px-6">
                              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                <FileText className="h-6 w-6 text-slate-400" />
                              </div>
                              <h3 className="font-medium text-gray-900 mb-1">Empty category</h3>
                              <p className="text-sm text-muted-foreground max-w-[180px] mx-auto">
                                Add documents to this category to keep things organized.
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center max-w-sm">
                          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                            <Folder className="h-8 w-8 text-slate-400" />
                          </div>
                          <h3 className="text-base font-semibold text-gray-900 mb-2">Select a category</h3>
                          <p className="text-sm text-gray-500">
                            Choose a category from the list to view its documents and details.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Floating Document Viewer Dialog */}
      <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
          {viewingDocument && (
            <>
              {/* Dialog Header */}
              <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-blue-100/50 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`p-2.5 rounded-full ${getTypeColor(viewingDocument.type)} flex-shrink-0`}>
                    {(() => {
                      const Icon = getTypeIcon(viewingDocument.type);
                      return <Icon className="h-5 w-5 text-white" />;
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
                <div className="flex items-center gap-2 flex-shrink-0">
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

              {/* Document Content Area */}
              <div className="flex-1 overflow-y-auto p-6 bg-white">
                {viewingDocument.type.toLowerCase().includes('image') && viewingDocument.url ? (
                  // Image Viewer
                  <div className="flex items-center justify-center min-h-[400px]">
                    <img
                      src={viewingDocument.url}
                      alt={viewingDocument.name}
                      className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                    />
                  </div>
                ) : viewingDocument.content ? (
                  // Text/Content Viewer
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {viewingDocument.content}
                    </div>
                  </div>
                ) : (
                  // Placeholder for other document types
                  <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                    <div className={`p-6 rounded-full ${getTypeColor(viewingDocument.type)} mb-4`}>
                      {(() => {
                        const Icon = getTypeIcon(viewingDocument.type);
                        return <Icon className="h-12 w-12 text-white" />;
                      })()}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{viewingDocument.name}</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {viewingDocument.description || 'Document preview not available'}
                    </p>
                    <div className="flex gap-2">
                      <Button onClick={() => {}} aria-label="Open in new tab">
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Open Document
                      </Button>
                      <Button variant="outline" onClick={() => {}} aria-label="Download">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Document Metadata Footer */}
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
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a file to add it to your knowledge base. Supported formats: PDF, DOCX, TXT, MD, JSON (max 10MB)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) {
                  handleFileUpload(file, selectedCollection || undefined);
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
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
                        handleFileUpload(file, selectedCollection || undefined);
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

            {selectedCollection && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Collection:</span>{" "}
                {currentCollections.find((c) => c.id === selectedCollection)?.name || "Selected"}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
