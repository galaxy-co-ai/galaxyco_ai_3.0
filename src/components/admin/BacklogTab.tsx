"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BacklogItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export function BacklogTab() {
  const [items, setItems] = useState<BacklogItem[]>([]);
  const [newItemText, setNewItemText] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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

  const addItem = () => {
    if (!newItemText.trim()) return;

    const newItem: BacklogItem = {
      id: Date.now().toString(),
      text: newItemText.trim(),
      completed: false,
      createdAt: Date.now(),
    };

    setItems([newItem, ...items]);
    setNewItemText("");
  };

  const toggleItem = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const activeItems = items.filter(item => !item.completed);
  const completedItems = items.filter(item => item.completed);

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
          <CardDescription>Create a new backlog item</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter task description..."
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addItem();
                }
              }}
              className="flex-1"
            />
            <Button onClick={addItem} disabled={!newItemText.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

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
      </div>

      {/* Active Items */}
      {activeItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Tasks</CardTitle>
            <CardDescription>{activeItems.length} items to complete</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                >
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() => toggleItem(item.id)}
                    aria-label={`Mark "${item.text}" as complete`}
                  />
                  <span className="flex-1 text-sm">{item.text}</span>
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
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                >
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() => toggleItem(item.id)}
                    aria-label={`Mark "${item.text}" as incomplete`}
                  />
                  <span className={cn(
                    "flex-1 text-sm text-muted-foreground line-through"
                  )}>
                    {item.text}
                  </span>
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

