"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FolderOpen,
  Search,
  Plus,
  FileText,
  Image as ImageIcon,
  Mail,
  PenLine,
  MessageSquare,
  MoreHorizontal,
  ChevronRight,
  Clock,
  Tag,
  Sparkles,
  Filter,
  Grid3X3,
  List,
  Star,
  StarOff,
  Folder,
  FolderPlus,
  X,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Mock collection data - would come from API
interface CreatedItem {
  id: string;
  title: string;
  type: "document" | "image" | "newsletter" | "blog" | "social" | "other";
  collection: string;
  tags: string[];
  createdAt: Date;
  starred: boolean;
  preview?: string;
}

interface Collection {
  id: string;
  name: string;
  itemCount: number;
  icon: typeof FolderOpen;
  color: string;
  isAuto: boolean;
}

// Mock collections
const mockCollections: Collection[] = [
  { id: "all", name: "All Creations", itemCount: 24, icon: Grid3X3, color: "text-gray-600", isAuto: false },
  { id: "documents", name: "Documents", itemCount: 8, icon: FileText, color: "text-blue-600", isAuto: true },
  { id: "images", name: "Images", itemCount: 6, icon: ImageIcon, color: "text-pink-600", isAuto: true },
  { id: "newsletters", name: "Newsletters", itemCount: 4, icon: Mail, color: "text-amber-600", isAuto: true },
  { id: "blogs", name: "Blog Posts", itemCount: 3, icon: PenLine, color: "text-emerald-600", isAuto: true },
  { id: "social", name: "Social Posts", itemCount: 3, icon: MessageSquare, color: "text-cyan-600", isAuto: true },
];

// Mock created items
const mockItems: CreatedItem[] = [
  {
    id: "1",
    title: "Q4 Product Launch Email",
    type: "newsletter",
    collection: "newsletters",
    tags: ["product", "launch", "Q4"],
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    starred: true,
    preview: "Introducing our latest innovation...",
  },
  {
    id: "2",
    title: "2024 Annual Report Draft",
    type: "document",
    collection: "documents",
    tags: ["annual", "report", "2024"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    starred: false,
    preview: "Executive Summary: This year marked...",
  },
  {
    id: "3",
    title: "Feature Announcement Banner",
    type: "image",
    collection: "images",
    tags: ["banner", "feature", "marketing"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    starred: true,
  },
  {
    id: "4",
    title: "LinkedIn Thought Leadership Post",
    type: "social",
    collection: "social",
    tags: ["linkedin", "thought-leadership"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    starred: false,
    preview: "The future of AI in business...",
  },
  {
    id: "5",
    title: "How-To Guide: Getting Started",
    type: "blog",
    collection: "blogs",
    tags: ["how-to", "onboarding", "guide"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    starred: false,
    preview: "Welcome to our comprehensive guide...",
  },
  {
    id: "6",
    title: "Weekly Digest Template",
    type: "newsletter",
    collection: "newsletters",
    tags: ["template", "digest", "weekly"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    starred: true,
    preview: "This week's highlights include...",
  },
];

// Type icon mapping
const typeIcons: Record<string, typeof FileText> = {
  document: FileText,
  image: ImageIcon,
  newsletter: Mail,
  blog: PenLine,
  social: MessageSquare,
  other: FileText,
};

const typeColors: Record<string, string> = {
  document: "bg-blue-100 text-blue-600",
  image: "bg-pink-100 text-pink-600",
  newsletter: "bg-amber-100 text-amber-600",
  blog: "bg-emerald-100 text-emerald-600",
  social: "bg-cyan-100 text-cyan-600",
  other: "bg-gray-100 text-gray-600",
};

// Format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function CollectionsTab() {
  const [selectedCollection, setSelectedCollection] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [items, setItems] = useState(mockItems);
  const [collections, setCollections] = useState(mockCollections);
  
  // New Collection Dialog State
  const [showNewCollectionDialog, setShowNewCollectionDialog] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);

  // Filter items based on collection and search
  const filteredItems = items.filter((item) => {
    const matchesCollection =
      selectedCollection === "all" || item.collection === selectedCollection;
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCollection && matchesSearch;
  });

  // Toggle star
  const toggleStar = (itemId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, starred: !item.starred } : item
      )
    );
  };

  // Create new collection
  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      toast.error("Please enter a collection name");
      return;
    }

    setIsCreatingCollection(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      const newCollection: Collection = {
        id: `custom-${Date.now()}`,
        name: newCollectionName.trim(),
        itemCount: 0,
        icon: Folder,
        color: "text-gray-600",
        isAuto: false,
      };

      setCollections((prev) => [...prev, newCollection]);
      setSelectedCollection(newCollection.id);
      setShowNewCollectionDialog(false);
      setNewCollectionName("");
      
      toast.success(`Collection "${newCollection.name}" created!`, {
        description: "Start adding items to your new collection",
      });
    } catch (error) {
      toast.error("Failed to create collection", {
        description: "Please try again",
      });
    } finally {
      setIsCreatingCollection(false);
    }
  };

  const selectedCollectionData = collections.find(
    (c) => c.id === selectedCollection
  );

  return (
    <Card className="h-full rounded-2xl shadow-sm border bg-card overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b bg-gradient-to-r from-emerald-50/80 to-green-50/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-gray-900">Collections</h2>
              <p className="text-sm text-gray-500">
                AI-organized library of your creations
              </p>
            </div>
          </div>
          
          {/* Auto-organize badge */}
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
            <Sparkles className="h-3 w-3 mr-1" />
            Auto-organized
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Collections Sidebar */}
        <div className="w-56 border-r bg-gray-50/50 p-4 overflow-y-auto">
          <div className="space-y-1">
            {collections.map((collection) => {
              const isSelected = selectedCollection === collection.id;
              return (
                <button
                  key={collection.id}
                  onClick={() => setSelectedCollection(collection.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                    isSelected
                      ? "bg-emerald-100 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                  aria-label={`View ${collection.name} collection`}
                  aria-current={isSelected ? "page" : undefined}
                >
                  <collection.icon className={cn("h-4 w-4", isSelected ? "text-emerald-600" : collection.color)} />
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
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search and View Toggle */}
          <div className="px-4 py-3 border-b flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search creations..."
                className="pl-9 h-9 text-sm"
                aria-label="Search creations"
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

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <FolderOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">No creations yet</h3>
                <p className="text-sm text-gray-500 max-w-xs">
                  Start creating content and it will automatically appear here, organized by type.
                </p>
              </div>
            ) : viewMode === "list" ? (
              <div className="space-y-2">
                {filteredItems.map((item) => {
                  const TypeIcon = typeIcons[item.type];
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-white hover:shadow-sm hover:border-gray-300 transition-all group cursor-pointer"
                    >
                      {/* Type Icon */}
                      <div className={cn("p-2 rounded-lg", typeColors[item.type])}>
                        <TypeIcon className="h-4 w-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm text-gray-900 truncate">
                            {item.title}
                          </h4>
                          {item.starred && (
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatRelativeTime(item.createdAt)}
                          </span>
                          <span className="text-gray-300">•</span>
                          <div className="flex items-center gap-1">
                            {item.tags.slice(0, 2).map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 h-4 text-gray-500 border-gray-200"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {item.tags.length > 2 && (
                              <span className="text-xs text-gray-400">
                                +{item.tags.length - 2}
                              </span>
                            )}
                          </div>
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
                          aria-label={item.starred ? "Remove from favorites" : "Add to favorites"}
                        >
                          {item.starred ? (
                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          ) : (
                            <StarOff className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                        <button
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          aria-label="More options"
                        >
                          <MoreHorizontal className="h-4 w-4 text-gray-400" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              // Grid view
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredItems.map((item) => {
                  const TypeIcon = typeIcons[item.type];
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-xl border bg-white hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={cn("p-2 rounded-lg", typeColors[item.type])}>
                          <TypeIcon className="h-4 w-4" />
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStar(item.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label={item.starred ? "Remove from favorites" : "Add to favorites"}
                        >
                          {item.starred ? (
                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          ) : (
                            <StarOff className="h-4 w-4 text-gray-400 hover:text-amber-500" />
                          )}
                        </button>
                      </div>
                      <h4 className="font-medium text-sm text-gray-900 line-clamp-2 mb-2">
                        {item.title}
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
              Organize your creations by adding them to custom collections.
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
    </Card>
  );
}
