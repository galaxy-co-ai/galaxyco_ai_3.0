"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Upload, Receipt } from "lucide-react";
import { toast } from "sonner";

const EXPENSE_CATEGORIES = [
  { value: "travel", label: "Travel" },
  { value: "meals", label: "Meals & Entertainment" },
  { value: "supplies", label: "Office Supplies" },
  { value: "software", label: "Software" },
  { value: "hardware", label: "Hardware" },
  { value: "marketing", label: "Marketing" },
  { value: "payroll", label: "Payroll" },
  { value: "utilities", label: "Utilities" },
  { value: "rent", label: "Rent" },
  { value: "insurance", label: "Insurance" },
  { value: "professional_services", label: "Professional Services" },
  { value: "other", label: "Other" },
] as const;

const PAYMENT_METHODS = [
  { value: "credit_card", label: "Credit Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
  { value: "check", label: "Check" },
  { value: "other", label: "Other" },
];

const expenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  category: z.enum([
    "travel", "meals", "supplies", "software", "hardware",
    "marketing", "payroll", "utilities", "rent", "insurance",
    "professional_services", "other"
  ]),
  amount: z.coerce.number().positive("Amount must be positive"),
  taxAmount: z.coerce.number().min(0),
  vendor: z.string(),
  expenseDate: z.string().min(1, "Date is required"),
  paymentMethod: z.string(),
  referenceNumber: z.string(),
  receiptUrl: z.string(),
  isReimbursable: z.boolean(),
  notes: z.string(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  taxAmount?: number | null;
  vendor?: string | null;
  expenseDate: string;
  paymentMethod?: string | null;
  referenceNumber?: string | null;
  receiptUrl?: string | null;
  isReimbursable?: boolean;
  notes?: string | null;
}

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
  onSuccess?: () => void;
}

export function ExpenseDialog({
  open,
  onOpenChange,
  expense,
  onSuccess,
}: ExpenseDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isEditing = !!expense;

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      category: "other",
      amount: 0,
      taxAmount: 0,
      vendor: "",
      expenseDate: new Date().toISOString().split("T")[0],
      paymentMethod: "",
      referenceNumber: "",
      receiptUrl: "",
      isReimbursable: false,
      notes: "",
    },
  });

  // Reset form when expense changes
  React.useEffect(() => {
    if (expense) {
      form.reset({
        description: expense.description,
        category: expense.category as ExpenseFormData["category"],
        amount: expense.amount / 100, // Convert from cents
        taxAmount: (expense.taxAmount || 0) / 100,
        vendor: expense.vendor || "",
        expenseDate: new Date(expense.expenseDate).toISOString().split("T")[0],
        paymentMethod: expense.paymentMethod || "",
        referenceNumber: expense.referenceNumber || "",
        receiptUrl: expense.receiptUrl || "",
        isReimbursable: expense.isReimbursable || false,
        notes: expense.notes || "",
      });
    } else {
      form.reset({
        description: "",
        category: "other",
        amount: 0,
        taxAmount: 0,
        vendor: "",
        expenseDate: new Date().toISOString().split("T")[0],
        paymentMethod: "",
        referenceNumber: "",
        receiptUrl: "",
        isReimbursable: false,
        notes: "",
      });
    }
  }, [expense, form]);

  const onSubmit = async (data: ExpenseFormData) => {
    setIsSubmitting(true);
    try {
      const url = isEditing
        ? `/api/finance/expenses/${expense.id}`
        : "/api/finance/expenses";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          receiptUrl: data.receiptUrl || undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save expense");
      }

      toast.success(isEditing ? "Expense updated" : "Expense created");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-indigo-600" />
            {isEditing ? "Edit Expense" : "Add Expense"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the expense details below."
              : "Enter the expense details below."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              placeholder="e.g., Office supplies from Staples"
              {...form.register("description")}
              disabled={isSubmitting}
            />
            {form.formState.errors.description && (
              <p className="text-xs text-red-500">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={form.watch("category")}
                onValueChange={(value) =>
                  form.setValue("category", value as ExpenseFormData["category"])
                }
                disabled={isSubmitting}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
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

            <div className="space-y-1.5">
              <Label htmlFor="expenseDate">Date *</Label>
              <Input
                id="expenseDate"
                type="date"
                {...form.register("expenseDate")}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount ($) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...form.register("amount")}
                disabled={isSubmitting}
              />
              {form.formState.errors.amount && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="taxAmount">Tax ($)</Label>
              <Input
                id="taxAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...form.register("taxAmount")}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="vendor">Vendor</Label>
              <Input
                id="vendor"
                placeholder="e.g., Amazon, Home Depot"
                {...form.register("vendor")}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={form.watch("paymentMethod") || ""}
                onValueChange={(value) => form.setValue("paymentMethod", value)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="referenceNumber">Reference #</Label>
              <Input
                id="referenceNumber"
                placeholder="e.g., Check #, Invoice #"
                {...form.register("referenceNumber")}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="receiptUrl">Receipt URL</Label>
              <Input
                id="receiptUrl"
                type="url"
                placeholder="https://..."
                {...form.register("receiptUrl")}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional details..."
              rows={2}
              {...form.register("notes")}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
            <div>
              <Label htmlFor="isReimbursable" className="font-medium">
                Reimbursable
              </Label>
              <p className="text-xs text-gray-500">
                Mark if this expense should be reimbursed
              </p>
            </div>
            <Switch
              checked={form.watch("isReimbursable")}
              onCheckedChange={(checked) =>
                form.setValue("isReimbursable", checked)
              }
              disabled={isSubmitting}
              aria-label="Mark as reimbursable"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                "Update Expense"
              ) : (
                "Add Expense"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
