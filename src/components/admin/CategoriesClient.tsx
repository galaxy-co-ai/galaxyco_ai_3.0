"use client";

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Folder, 
  FolderPlus,
  Edit2, 
  Trash2,
  Loader2,
  Check,
  Grid3X3,
  List,
  Tag,
} from 'lucide-react';
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import slugify from 'slugify';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sortOrder: number;
  isActive: boolean;
  postCount: number;
}

interface CategoriesClientProps {
  initialCategories: Category[];
}

const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

// Color name mapping for display
const colorNames: Record<string, string> = {
  '#3B82F6': 'Blue',
  '#10B981': 'Green', 
  '#F59E0B': 'Amber',
  '#EF4444': 'Red',
  '#8B5CF6': 'Purple',
  '#EC4899': 'Pink',
  '#06B6D4': 'Cyan',
  '#F97316': 'Orange',
};

export function CategoriesClient({ initialCategories }: CategoriesClientProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  
  // Dialog states
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState(DEFAULT_COLORS[0]);

  // Calculate totals
  const totalPosts = categories.reduce((sum, cat) => sum + cat.postCount, 0);
  const activeCategories = categories.filter(cat => cat.isActive);
  const emptyCategories = categories.filter(cat => cat.postCount === 0);

  // Sidebar items
  const sidebarItems = [
    { id: "all", name: "All Categories", count: categories.length, color: "text-gray-600" },
    { id: "active", name: "With Posts", count: categories.filter(c => c.postCount > 0).length, color: "text-green-600" },
    { id: "empty", name: "Empty", count: emptyCategories.length, color: "text-zinc-500" },
  ];

  // Filter categories based on selection and search
  const filteredCategories = categories.filter((cat) => {
    const matchesFilter =
      selectedCategory === "all" ||
      (selectedCategory === "active" && cat.postCount > 0) ||
      (selectedCategory === "empty" && cat.postCount === 0);
    const matchesSearch =
      !searchQuery ||
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormColor(DEFAULT_COLORS[0]);
  };

  const handleAddCategory = async () => {
    if (!formName.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          slug: slugify(formName, { lower: true, strict: true }),
          description: formDescription || null,
          color: formColor,
          sortOrder: categories.length,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create category');
      }

      const newCategory = await response.json();
      setCategories([...categories, { ...newCategory, postCount: 0 }]);
      resetForm();
      setShowNewCategoryDialog(false);
      toast.success(`Category "${formName}" created!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create category');
    } finally {
      setIsSaving(false);
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormName(category.name);
    setFormDescription(category.description || '');
    setFormColor(category.color || DEFAULT_COLORS[0]);
    setShowEditDialog(true);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !formName.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          slug: slugify(formName, { lower: true, strict: true }),
          description: formDescription || null,
          color: formColor,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update category');
      }

      const updatedCategory = await response.json();
      setCategories(categories.map(cat => 
        cat.id === editingCategory.id 
          ? { ...cat, ...updatedCategory }
          : cat
      ));
      setShowEditDialog(false);
      setEditingCategory(null);
      resetForm();
      toast.success('Category updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update category');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string, postCount: number) => {
    if (postCount > 0) {
      toast.error(`Cannot delete category with ${postCount} posts. Move or delete posts first.`);
      return;
    }

    if (!confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete category');
      }

      setCategories(categories.filter(cat => cat.id !== id));
      toast.success('Category deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete category');
    }
  };

  return (
    <Card className="h-full rounded-2xl shadow-sm border bg-card overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b bg-gradient-to-r from-purple-50/80 to-indigo-50/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-gray-900">Categories</h2>
              <p className="text-sm text-gray-500">
                Organize your Launchpad content
              </p>
            </div>
          </div>
          
          {/* Stats badge */}
          <Badge className="bg-purple-100 text-purple-700 border-purple-200">
            <Tag className="h-3 w-3 mr-1" />
            {totalPosts} posts across {categories.length} categories
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Categories Sidebar */}
        <div className="w-56 border-r bg-gray-50/50 p-4 overflow-y-auto">
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              const isSelected = selectedCategory === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedCategory(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                    isSelected
                      ? "bg-purple-100 text-purple-700"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                  aria-label={`View ${item.name}`}
                  aria-current={isSelected ? "page" : undefined}
                >
                  <Folder className={cn("h-4 w-4", isSelected ? "text-purple-600" : item.color)} />
                  <span className="flex-1 text-left truncate">{item.name}</span>
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full",
                    isSelected ? "bg-purple-200 text-purple-700" : "bg-gray-200 text-gray-500"
                  )}>
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-4 border-t" />
          
          {/* Actual Categories */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 px-3 mb-2">CATEGORIES</p>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                  selectedCategory === cat.id
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <div 
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color || '#6B7280' }}
                />
                <span className="flex-1 text-left truncate">{cat.name}</span>
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full",
                  selectedCategory === cat.id ? "bg-purple-200 text-purple-700" : "bg-gray-200 text-gray-500"
                )}>
                  {cat.postCount}
                </span>
              </button>
            ))}
          </div>

          {/* Create Category Button */}
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-gray-600 hover:text-purple-700 hover:border-purple-300 hover:bg-purple-50"
              onClick={() => setShowNewCategoryDialog(true)}
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              New Category
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search and View Toggle */}
          <div className="px-4 py-3 border-b flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search categories..."
                className="pl-9 h-9 text-sm"
                aria-label="Search categories"
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

          {/* Categories List */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <FolderOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">No categories yet</h3>
                <p className="text-sm text-gray-500 max-w-xs mb-4">
                  Create your first category to organize your content.
                </p>
                <Button
                  onClick={() => setShowNewCategoryDialog(true)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Create Category
                </Button>
              </div>
            ) : viewMode === "list" ? (
              <div className="space-y-2">
                {filteredCategories.map((category) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-white hover:shadow-sm hover:border-gray-300 transition-all group"
                  >
                    {/* Color indicator */}
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <Folder 
                        className="h-5 w-5" 
                        style={{ color: category.color || '#6B7280' }}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm text-gray-900">
                          {category.name}
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          {category.postCount} posts
                        </Badge>
                      </div>
                      {category.description && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {category.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">
                          /{category.slug}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(category)}
                      >
                        <Edit2 className="h-4 w-4 text-gray-400" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteCategory(category.id, category.postCount)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              // Grid view
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredCategories.map((category) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-xl border bg-white hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <Folder 
                          className="h-5 w-5" 
                          style={{ color: category.color || '#6B7280' }}
                        />
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => openEditDialog(category)}
                        >
                          <Edit2 className="h-3.5 w-3.5 text-gray-400" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteCategory(category.id, category.postCount)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <h4 className="font-medium text-sm text-gray-900 mb-1">
                      {category.name}
                    </h4>
                    {category.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                        {category.description}
                      </p>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {category.postCount} posts
                    </Badge>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Category Dialog */}
      <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-100">
                <FolderPlus className="h-4 w-4 text-purple-600" />
              </div>
              Create New Category
            </DialogTitle>
            <DialogDescription>
              Organize your Launchpad posts into categories for better navigation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div>
              <label htmlFor="category-name" className="text-sm font-medium text-gray-700 mb-2 block">
                Category Name
              </label>
              <Input
                id="category-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Platform Tips"
                className="w-full"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isSaving) {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
                disabled={isSaving}
                autoFocus
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Color
              </label>
              <div className="flex gap-2">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      formColor === color 
                        ? "border-gray-900 scale-110" 
                        : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormColor(color)}
                    aria-label={`Select ${colorNames[color]} color`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="category-description" className="text-sm font-medium text-gray-700 mb-2 block">
                Description (optional)
              </label>
              <Input
                id="category-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Brief description of this category"
                disabled={isSaving}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowNewCategoryDialog(false);
                resetForm();
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCategory}
              disabled={!formName.trim() || isSaving}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Create Category
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-100">
                <Edit2 className="h-4 w-4 text-purple-600" />
              </div>
              Edit Category
            </DialogTitle>
            <DialogDescription>
              Update category details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div>
              <label htmlFor="edit-category-name" className="text-sm font-medium text-gray-700 mb-2 block">
                Category Name
              </label>
              <Input
                id="edit-category-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Platform Tips"
                className="w-full"
                disabled={isSaving}
                autoFocus
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Color
              </label>
              <div className="flex gap-2">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      formColor === color 
                        ? "border-gray-900 scale-110" 
                        : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormColor(color)}
                    aria-label={`Select ${colorNames[color]} color`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="edit-category-description" className="text-sm font-medium text-gray-700 mb-2 block">
                Description (optional)
              </label>
              <Input
                id="edit-category-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Brief description of this category"
                disabled={isSaving}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setEditingCategory(null);
                resetForm();
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateCategory}
              disabled={!formName.trim() || isSaving}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
