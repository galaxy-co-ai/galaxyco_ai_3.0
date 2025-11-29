"use client";

import * as React from "react";
import { Calendar, FileText, Sparkles, Store, Tag, FolderKanban, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ExpenseDocument, FinanceDocument } from "../types";

interface ExpenseFormProps {
  initialData?: Partial<FinanceDocument>;
}

export interface ExpenseFormRef {
  getFormData: () => Partial<ExpenseDocument>;
}

const EXPENSE_CATEGORIES = [
  { label: "Materials & Supplies", value: "materials" },
  { label: "Equipment", value: "equipment" },
  { label: "Subcontractor", value: "subcontractor" },
  { label: "Labor", value: "labor" },
  { label: "Travel", value: "travel" },
  { label: "Office", value: "office" },
  { label: "Utilities", value: "utilities" },
  { label: "Software & Subscriptions", value: "software" },
  { label: "Insurance", value: "insurance" },
  { label: "Other", value: "other" },
];

function generateExpenseNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `EXP-${year}${month}-${random}`;
}

export const ExpenseForm = React.forwardRef<ExpenseFormRef, ExpenseFormProps>(
  function ExpenseForm({ initialData }, ref) {
    const [expenseNumber, setExpenseNumber] = React.useState(
      (initialData as ExpenseDocument)?.number || generateExpenseNumber()
    );
    const [date, setDate] = React.useState(
      (initialData as ExpenseDocument)?.date || new Date().toISOString().split("T")[0]
    );
    
    // Vendor info
    const [vendor, setVendor] = React.useState(
      (initialData as ExpenseDocument)?.vendor || ""
    );
    
    // Expense details
    const [category, setCategory] = React.useState(
      (initialData as ExpenseDocument)?.category || "materials"
    );
    const [amount, setAmount] = React.useState(
      (initialData as ExpenseDocument)?.total || 0
    );
    const [description, setDescription] = React.useState(
      (initialData as ExpenseDocument)?.notes || ""
    );
    
    // Project allocation
    const [projectAllocation, setProjectAllocation] = React.useState(
      (initialData as ExpenseDocument)?.projectAllocation || ""
    );
    const [reimbursable, setReimbursable] = React.useState(
      (initialData as ExpenseDocument)?.reimbursable ?? false
    );
    
    const [notes, setNotes] = React.useState("");

    const getFormData = React.useCallback((): Partial<ExpenseDocument> => ({
      type: "expense",
      number: expenseNumber,
      date,
      vendor,
      category,
      projectAllocation,
      reimbursable,
      lineItems: [{
        id: "main",
        description,
        quantity: 1,
        unitPrice: amount,
        amount,
      }],
      subtotal: amount,
      taxRate: 0,
      taxAmount: 0,
      total: amount,
      notes,
      status: "draft",
    }), [
      expenseNumber, date, vendor, category, amount, description,
      projectAllocation, reimbursable, notes
    ]);

    React.useImperativeHandle(ref, () => ({ getFormData }), [getFormData]);

    const formatCurrency = (value: number) => {
      return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expense-number" className="text-xs font-medium flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Expense ID
            </Label>
            <Input
              id="expense-number"
              value={expenseNumber}
              onChange={(e) => setExpenseNumber(e.target.value)}
              className="h-9 text-sm font-mono"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date" className="text-xs font-medium flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-xs font-medium flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              Category
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Vendor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="vendor" className="text-xs font-medium flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5 text-muted-foreground" />
              Vendor / Merchant <span className="text-destructive">*</span>
            </Label>
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-primary">
              <Sparkles className="h-3 w-3" />
              Find Vendor
            </Button>
          </div>
          <Input
            id="vendor"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="Home Depot, Amazon, Local Supplier..."
            className="h-9 text-sm"
          />
        </div>

        {/* Amount & Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-xs font-medium">
              Amount <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={amount || ""}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="h-9 text-sm pl-7"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-medium">
              Description <span className="text-destructive">*</span>
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was purchased?"
              className="h-9 text-sm"
            />
          </div>
        </div>

        {/* Project Allocation */}
        <div className="space-y-2">
          <Label htmlFor="project" className="text-xs font-medium flex items-center gap-1.5">
            <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
            Allocate to Project (Optional)
          </Label>
          <div className="flex gap-2">
            <Input
              id="project"
              value={projectAllocation}
              onChange={(e) => setProjectAllocation(e.target.value)}
              placeholder="Project name or number"
              className="h-9 text-sm"
            />
            <Button type="button" variant="outline" size="sm" className="h-9 px-3 text-xs gap-1.5">
              <Sparkles className="h-3 w-3" />
              Find
            </Button>
          </div>
        </div>

        {/* Receipt Upload Placeholder */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Attach Receipt</Label>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              Drag & drop receipt image or click to browse
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              PNG, JPG, PDF up to 10MB
            </p>
          </div>
        </div>

        {/* Reimbursable Toggle */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="reimbursable" className="text-sm font-medium">
              Reimbursable Expense
            </Label>
            <p className="text-xs text-muted-foreground">
              This expense can be billed back to a client
            </p>
          </div>
          <Switch
            id="reimbursable"
            checked={reimbursable}
            onCheckedChange={setReimbursable}
          />
        </div>

        {/* Total */}
        <div className="flex justify-end">
          <div className="w-full max-w-xs p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-red-800 dark:text-red-200">
                Expense Total
              </span>
              <span className="text-xl font-semibold text-red-600">
                {formatCurrency(amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-xs font-medium">Additional Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional details about this expense..."
            className="min-h-[60px] text-sm resize-none"
          />
        </div>
      </div>
    );
  }
);

