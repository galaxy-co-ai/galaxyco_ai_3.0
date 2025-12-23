"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, CheckCircle2, Circle, Image as ImageIcon, Eye, AlertCircle, Tag, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BacklogItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  screenshots: string[]; // Base64 encoded images
  page?: string;
  priority?: "low" | "medium" | "high";
  needsReview: boolean;
}

const PAGE_OPTIONS = [
  "Dashboard",
  "CRM",
  "Marketing",
  "Conversations",
  "Knowledge Base",
  "Agents",
  "Workflows",
  "Finance HQ",
  "Mission Control",
  "Settings",
  "Other",
];

const PRIORITY_COLORS = {
  low: "bg-blue-50 text-blue-700 border-blue-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-red-50 text-red-700 border-red-200",
};

export function BacklogTab() {
  const [items, setItems] = useState<BacklogItem[]>([]);
  const [newItemText, setNewItemText] = useState("");
  const [newItemPage, setNewItemPage] = useState<string>();
  const [newItemPriority, setNewItemPriority] = useState<"low" | "medium" | "high">();
  const [newItemNeedsReview, setNewItemNeedsReview] = useState(false);
  const [newItemScreenshots, setNewItemScreenshots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<BacklogItem | null>(null);
  const [filterPage, setFilterPage] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [showNeedsReviewOnly, setShowNeedsReviewOnly] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load items from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("mission-control-backlog");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setItems(parsed);
      } catch (error) {
        console.error("Failed to parse backlog items", error);
      }
    }
    setIsLoading(false);
  }, []);

  // Save items to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("mission-control-backlog", JSON.stringify(items));
    }
  }, [items, isLoading]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newScreenshots: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file size (max 2MB per image)
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max 2MB per image.`);
        continue;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image.`);
        continue;
      }

      // Convert to base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      newScreenshots.push(base64);
    }

    setNewItemScreenshots([...newItemScreenshots, ...newScreenshots]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeScreenshot = (index: number) => {
    setNewItemScreenshots(newItemScreenshots.filter((_, i) => i !== index));
  };

  const addItem = () => {
    if (!newItemText.trim()) {
      toast.error("Please enter a task description");
      return;
    }

    const newItem: BacklogItem = {
      id: Date.now().toString(),
      text: newItemText.trim(),
      completed: false,
      createdAt: Date.now(),
      screenshots: newItemScreenshots,
      page: newItemPage,
      priority: newItemPriority,
      needsReview: newItemNeedsReview,
    };

    setItems([newItem, ...items]);
    
    // Reset form
    setNewItemText("");
    setNewItemPage(undefined);
    setNewItemPriority(undefined);
    setNewItemNeedsReview(false);
    setNewItemScreenshots([]);
    
    toast.success("Task added to backlog");
  };

  const toggleItem = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    toast.success("Task deleted");
  };

  const filteredItems = items.filter(item => {
    if (filterPage !== "all" && item.page !== filterPage) return false;
    if (filterPriority !== "all" && item.priority !== filterPriority) return false;
    if (showNeedsReviewOnly && !item.needsReview) return false;
    return true;
  });

  const activeItems = filteredItems.filter(item => !item.completed);
  const completedItems = filteredItems.filter(item => item.completed);
  const needsReviewCount = items.filter(item => item.needsReview && !item.completed).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add New Item */}
      <Card>
        <CardHeader>
          <CardTitle>Add Task</CardTitle>
          <CardDescription>Create a new backlog item with details and screenshots</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Task Description */}
          <div className="space-y-2">
            <Label htmlFor="task-text">Task Description *</Label>
            <Input
              id="task-text"
              placeholder="Enter task description..."
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  addItem();
                }
              }}
            />
          </div>

          {/* Page & Priority */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="task-page">Page/Section</Label>
              <Select value={newItemPage} onValueChange={setNewItemPage}>
                <SelectTrigger id="task-page">
                  <SelectValue placeholder="Select page..." />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_OPTIONS.map((page) => (
                    <SelectItem key={page} value={page}>
                      {page}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-priority">Priority</Label>
              <Select value={newItemPriority} onValueChange={(value: "low" | "medium" | "high") => setNewItemPriority(value)}>
                <SelectTrigger id="task-priority">
                  <SelectValue placeholder="Select priority..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Needs Review Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="needs-review"
              checked={newItemNeedsReview}
              onCheckedChange={(checked) => setNewItemNeedsReview(checked as boolean)}
            />
            <Label htmlFor="needs-review" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
              Needs AI review before starting
            </Label>
          </div>

          {/* Screenshots */}
          <div className="space-y-2">
            <Label>Screenshots (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {newItemScreenshots.map((screenshot, index) => (
                <div key={index} className="relative group">
                  <img
                    src={screenshot}
                    alt={`Screenshot ${index + 1}`}
                    className="h-20 w-20 object-cover rounded-lg border"
                  />
                  <button
                    onClick={() => removeScreenshot(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Remove screenshot ${index + 1}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-20 w-20"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="h-5 w-5" />
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
            <p className="text-xs text-muted-foreground">
              Max 2MB per image. Click to add multiple screenshots.
            </p>
          </div>

          {/* Add Button */}
          <Button onClick={addItem} disabled={!newItemText.trim()} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </CardContent>
      </Card>

      {/* Stats & Filters */}
      <div className="space-y-3">
        {/* Stats */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Badge className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200">
            <Circle className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
            <span className="font-semibold">{activeItems.length}</span>
            <span className="ml-1 text-blue-600/70 font-normal">Active</span>
          </Badge>
          <Badge className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-green-600" />
            <span className="font-semibold">{completedItems.length}</span>
            <span className="ml-1 text-green-600/70 font-normal">Completed</span>
          </Badge>
          {needsReviewCount > 0 && (
            <Badge className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200">
              <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-purple-600" />
              <span className="font-semibold">{needsReviewCount}</span>
              <span className="ml-1 text-purple-600/70 font-normal">Needs Review</span>
            </Badge>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <Select value={filterPage} onValueChange={setFilterPage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by page..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Pages</SelectItem>
                    {PAGE_OPTIONS.map((page) => (
                      <SelectItem key={page} value={page}>
                        {page}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1 min-w-[200px]">
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by priority..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant={showNeedsReviewOnly ? "default" : "outline"}
                onClick={() => setShowNeedsReviewOnly(!showNeedsReviewOnly)}
                className="gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                Needs Review Only
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Items */}
      {activeItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Tasks</CardTitle>
            <CardDescription>{activeItems.length} items to complete</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
                >
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() => toggleItem(item.id)}
                    aria-label={`Mark "${item.text}" as complete`}
                    className="mt-1"
                  />
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{item.text}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() => deleteItem(item.id)}
                        aria-label={`Delete "${item.text}"`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {item.page && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Tag className="h-3 w-3" />
                          {item.page}
                        </Badge>
                      )}
                      {item.priority && (
                        <Badge className={cn("text-xs", PRIORITY_COLORS[item.priority])}>
                          {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)} Priority
                        </Badge>
                      )}
                      {item.needsReview && (
                        <Badge className="text-xs bg-purple-50 text-purple-700 border border-purple-200">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Needs Review
                        </Badge>
                      )}
                      {item.screenshots.length > 0 && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-xs gap-1"
                              onClick={() => setSelectedItem(item)}
                            >
                              <Eye className="h-3 w-3" />
                              {item.screenshots.length} screenshot{item.screenshots.length > 1 ? "s" : ""}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Screenshots</DialogTitle>
                              <DialogDescription>{item.text}</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4">
                              {item.screenshots.map((screenshot, index) => (
                                <img
                                  key={index}
                                  src={screenshot}
                                  alt={`Screenshot ${index + 1}`}
                                  className="w-full rounded-lg border"
                                />
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Items */}
      {completedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completed Tasks</CardTitle>
            <CardDescription>{completedItems.length} items done</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                >
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() => toggleItem(item.id)}
                    aria-label={`Mark "${item.text}" as incomplete`}
                  />
                  <div className="flex-1">
                    <span className="text-sm text-muted-foreground line-through block">
                      {item.text}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => deleteItem(item.id)}
                    aria-label={`Delete "${item.text}"`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {filteredItems.length === 0 && items.length > 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Tag className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tasks match filters</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your filters to see more tasks
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setFilterPage("all");
                setFilterPriority("all");
                setShowNeedsReviewOnly(false);
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {items.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first backlog item to get started
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

