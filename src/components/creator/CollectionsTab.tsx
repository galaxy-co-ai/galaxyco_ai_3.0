"use client";

import { useState, useMemo } from "react";
import useSWR, { mutate } from "swr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  FileText,
  Image as ImageIcon,
  Mail,
  PenLine,
  MessageSquare,
  MoreHorizontal,
  Clock,
  Sparkles,
  Grid3X3,
  List,
  Star,
  StarOff,
  Folder,
  FolderPlus,
  Loader2,
  Trash2,
  Briefcase,
  Presentation,
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

// API response types
interface CollectionItem {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  isAuto: boolean;
  itemCount: number;
  type: string | null;
  createdAt: string | null;
}

interface CreatedItem {
  id: string;
  title: string;
  type: string;
  content: unknown;
  metadata: Record<string, string>;
  starred: boolean;
  gammaUrl: string | null;
  collectionIds: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface CollectionsResponse {
  collections: CollectionItem[];
}

interface ItemsResponse {
  items: CreatedItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  Grid3X3: Grid3X3,
  FileText: FileText,
  Image: ImageIcon,
  Mail: Mail,
  PenLine: PenLine,
  MessageSquare: MessageSquare,
  Folder: Folder,
  FolderOpen: FolderOpen,
  Briefcase: Briefcase,
  Presentation: Presentation,
};

// Type colors
const typeColors: Record<string, string> = {
  document: "bg-blue-100 text-blue-600",
  image: "bg-pink-100 text-pink-600",
  newsletter: "bg-amber-100 text-amber-600",
  blog: "bg-emerald-100 text-emerald-600",
  social: "bg-cyan-100 text-cyan-600",
  proposal: "bg-purple-100 text-purple-600",
  presentation: "bg-indigo-100 text-indigo-600",
  "brand-kit": "bg-rose-100 text-rose-600",
  other: "bg-gray-100 text-gray-600",
};

// Type icons
const typeIcons: Record<string, React.ElementType> = {
  document: FileText,
  image: ImageIcon,
  newsletter: Mail,
  blog: PenLine,
  social: MessageSquare,
  proposal: Briefcase,
  presentation: Presentation,
  "brand-kit": Folder,
  other: FileText,
};

// Format relative time
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
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
  
  // New Collection Dialog State
  const [showNewCollectionDialog, setShowNewCollectionDialog] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);

  // Fetch collections
  const { data: collectionsData, isLoading: collectionsLoading, error: collectionsError } = useSWR<CollectionsResponse>(
    '/api/creator/collections',
    fetcher
  );

  // Build items URL based on selected collection
  const itemsUrl = useMemo(() => {
    if (selectedCollection === 'all') {
      return '/api/creator/items';
    }
    
    // Check if collections data is loaded
    const collections = collectionsData?.collections;
    const selectedColl = collections?.find(c => c.id === selectedCollection);
    
    // Auto collections filter by type
    if (selectedColl?.type) {
      return `/api/creator/items?type=${selectedColl.type}`;
    }
    
    // User collections filter by collectionId
    if (selectedCollection.startsWith('auto-')) {
      // This is an auto collection, filter by type
      const type = selectedCollection.replace('auto-', '');
      return `/api/creator/items?type=${type}`;
    }
    
    return `/api/creator/items?collectionId=${selectedCollection}`;
  }, [selectedCollection, collectionsData]);

  // Fetch items
  const { data: itemsData, isLoading: itemsLoading } = useSWR<ItemsResponse>(
    itemsUrl,
    fetcher
  );

  const collections = collectionsData?.collections || [];
  const items = itemsData?.items || [];

  // Show error state if API fails (e.g., tables don't exist yet)
  if (collectionsError) {
    return (
      <Card className="h-full rounded-2xl shadow-sm border bg-card overflow-hidden flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-4 mx-auto">
            <FolderOpen className="h-8 w-8 text-red-500" />
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

  // Filter items by search query (client-side for responsiveness)
  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item =>
      item.title.toLowerCase().includes(query) ||
      Object.values(item.metadata || {}).some(v => v.toLowerCase().includes(query))
    );
  }, [items, searchQuery]);

  // Toggle star
  const toggleStar = async (itemId: string, currentStarred: boolean) => {
    try {
      const response = await fetch(`/api/creator/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: !currentStarred }),
      });

      if (!response.ok) throw new Error('Failed to update');

      // Revalidate items
      mutate(itemsUrl);
      mutate('/api/creator/stats');
    } catch {
      toast.error('Failed to update item');
    }
  };

  // Delete item
  const deleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/creator/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      toast.success('Item deleted');
      mutate(itemsUrl);
      mutate('/api/creator/collections');
      mutate('/api/creator/stats');
    } catch {
      toast.error('Failed to delete item');
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
      const response = await fetch('/api/creator/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCollectionName.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create collection');
      }

      const data = await response.json();
      
      // Revalidate collections
      mutate('/api/creator/collections');
      mutate('/api/creator/stats');
      
      setSelectedCollection(data.collection.id);
      setShowNewCollectionDialog(false);
      setNewCollectionName("");
      
      toast.success(`Collection "${data.collection.name}" created!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create collection');
    } finally {
      setIsCreatingCollection(false);
    }
  };

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
          {collectionsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-9 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {collections.map((collection) => {
                const isSelected = selectedCollection === collection.id;
                const IconComponent = iconMap[collection.icon] || Folder;
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
                    <IconComponent className={cn("h-4 w-4", isSelected ? "text-emerald-600" : collection.color)} />
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
          )}

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
            {itemsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
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
                  const TypeIcon = typeIcons[item.type] || FileText;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-white hover:shadow-sm hover:border-gray-300 transition-all group cursor-pointer"
                    >
                      {/* Type Icon */}
                      <div className={cn("p-2 rounded-lg", typeColors[item.type] || typeColors.other)}>
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
                          <span className="text-xs text-gray-500">{item.type}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStar(item.id, item.starred);
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
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteItem(item.id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          aria-label="Delete item"
                        >
                          <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
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
                  const TypeIcon = typeIcons[item.type] || FileText;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-xl border bg-white hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={cn("p-2 rounded-lg", typeColors[item.type] || typeColors.other)}>
                          <TypeIcon className="h-4 w-4" />
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStar(item.id, item.starred);
                            }}
                            aria-label={item.starred ? "Remove from favorites" : "Add to favorites"}
                          >
                            {item.starred ? (
                              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                            ) : (
                              <StarOff className="h-4 w-4 text-gray-400 hover:text-amber-500" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteItem(item.id);
                            }}
                            aria-label="Delete item"
                          >
                            <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
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
