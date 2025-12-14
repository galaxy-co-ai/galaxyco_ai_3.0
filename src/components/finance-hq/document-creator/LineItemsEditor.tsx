"use client";

import * as React from "react";
import { Plus, Trash2, GripVertical, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { LineItem } from "./types";

interface LineItemsEditorProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  onAIFill?: () => void;
  currency?: string;
}

function generateId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function createEmptyItem(): LineItem {
  return {
    id: generateId(),
    description: "",
    quantity: 1,
    unitPrice: 0,
    amount: 0,
  };
}

export function LineItemsEditor({
  items,
  onChange,
  onAIFill,
  currency = "$",
}: LineItemsEditorProps) {
  const handleAddItem = () => {
    onChange([...items, createEmptyItem()]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return; // Keep at least one item
    onChange(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof LineItem, value: string | number) => {
    onChange(items.map(item => {
      if (item.id !== id) return item;
      
      const updated = { ...item, [field]: value };
      
      // Auto-calculate amount when quantity or unitPrice changes
      if (field === "quantity" || field === "unitPrice") {
        const qty = field === "quantity" ? Number(value) : item.quantity;
        const price = field === "unitPrice" ? Number(value) : item.unitPrice;
        updated.amount = qty * price;
      }
      
      return updated;
    }));
  };

  const formatCurrency = (value: number) => {
    return `${currency}${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">Line Items</h4>
        {onAIFill && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5 text-primary hover:text-primary"
            onClick={onAIFill}
          >
            <Sparkles className="h-3 w-3" />
            Fill with AI
          </Button>
        )}
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-[1fr_80px_100px_100px_32px] gap-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wide px-1">
        <span>Description</span>
        <span className="text-center">Qty</span>
        <span className="text-right">Unit Price</span>
        <span className="text-right">Amount</span>
        <span></span>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="grid grid-cols-[1fr_80px_100px_100px_32px] gap-2 items-center group"
          >
            {/* Description */}
            <div className="flex items-center gap-1">
              <GripVertical className="h-4 w-4 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
              <Input
                value={item.description}
                onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                placeholder={`Item ${index + 1} description`}
                className="h-9 text-sm"
              />
            </div>

            {/* Quantity */}
            <Input
              type="number"
              min="0"
              step="1"
              value={item.quantity}
              onChange={(e) => handleItemChange(item.id, "quantity", parseFloat(e.target.value) || 0)}
              className="h-9 text-sm text-center"
            />

            {/* Unit Price */}
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                {currency}
              </span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={item.unitPrice || ""}
                onChange={(e) => handleItemChange(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                className="h-9 text-sm text-right pl-5 pr-2"
                placeholder="0.00"
              />
            </div>

            {/* Amount (calculated, read-only) */}
            <div className="h-9 flex items-center justify-end px-2 bg-muted/50 rounded-md text-sm font-medium">
              {formatCurrency(item.amount)}
            </div>

            {/* Delete */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 w-9 p-0 text-muted-foreground hover:text-destructive",
                items.length <= 1 && "opacity-30 pointer-events-none"
              )}
              onClick={() => handleRemoveItem(item.id)}
              disabled={items.length <= 1}
              aria-label="Remove item"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add Item Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full h-9 text-xs gap-1.5 border-dashed"
        onClick={handleAddItem}
      >
        <Plus className="h-3.5 w-3.5" />
        Add Line Item
      </Button>

      {/* Totals */}
      <div className="pt-3 border-t space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">
            {formatCurrency(items.reduce((sum, item) => sum + item.amount, 0))}
          </span>
        </div>
      </div>
    </div>
  );
}
















































