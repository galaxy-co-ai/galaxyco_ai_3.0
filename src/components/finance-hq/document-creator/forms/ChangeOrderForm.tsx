"use client";

import * as React from "react";
import { Calendar, FileText, Sparkles, AlertTriangle, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { LineItemsEditor } from "../LineItemsEditor";
import type { ChangeOrderDocument, LineItem, FinanceDocument } from "../types";

interface ChangeOrderFormProps {
  initialData?: Partial<FinanceDocument>;
}

export type ChangeOrderFormRef = {
  getFormData: () => Partial<FinanceDocument>;
};

function generateChangeOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 100).toString().padStart(2, "0");
  return `CO-${year}${month}-${random}`;
}

function createDefaultLineItem(): LineItem {
  return {
    id: `item-${Date.now()}`,
    description: "",
    quantity: 1,
    unitPrice: 0,
    amount: 0,
  };
}

export const ChangeOrderForm = React.forwardRef<ChangeOrderFormRef, ChangeOrderFormProps>(
  function ChangeOrderForm({ initialData }, ref) {
    const [orderNumber, setOrderNumber] = React.useState(
      (initialData as ChangeOrderDocument)?.number || generateChangeOrderNumber()
    );
    const [date, setDate] = React.useState(
      (initialData as ChangeOrderDocument)?.date || new Date().toISOString().split("T")[0]
    );
    
    // Original estimate reference
    const [originalEstimateNumber, setOriginalEstimateNumber] = React.useState(
      (initialData as ChangeOrderDocument)?.originalEstimateNumber || ""
    );
    
    // Client info (inherited from estimate)
    const [clientName, setClientName] = React.useState(
      (initialData as ChangeOrderDocument)?.client?.name || ""
    );
    
    // Change details
    const [changeReason, setChangeReason] = React.useState(
      (initialData as ChangeOrderDocument)?.changeReason || ""
    );
    const [approvalRequired, setApprovalRequired] = React.useState(
      (initialData as ChangeOrderDocument)?.approvalRequired ?? true
    );
    
    // Line items (additions/changes)
    const [lineItems, setLineItems] = React.useState<LineItem[]>(
      (initialData as ChangeOrderDocument)?.lineItems || [createDefaultLineItem()]
    );
    
    const [notes, setNotes] = React.useState(
      (initialData as ChangeOrderDocument)?.notes || ""
    );

    // Calculate totals
    const priceAdjustment = lineItems.reduce((sum, item) => sum + item.amount, 0);

    const getFormData = React.useCallback((): Partial<ChangeOrderDocument> => ({
      type: "change_order",
      number: orderNumber,
      date,
      originalEstimateNumber,
      client: { name: clientName },
      changeReason,
      approvalRequired,
      lineItems,
      priceAdjustment,
      subtotal: priceAdjustment,
      taxRate: 0,
      taxAmount: 0,
      total: priceAdjustment,
      notes,
      status: "draft",
    }), [
      orderNumber, date, originalEstimateNumber, clientName, changeReason,
      approvalRequired, lineItems, priceAdjustment, notes
    ]);

    React.useImperativeHandle(ref, () => ({ getFormData }), [getFormData]);

    const formatCurrency = (value: number) => {
      const prefix = value >= 0 ? "+" : "";
      return `${prefix}$${Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="order-number" className="text-xs font-medium flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Change Order #
            </Label>
            <Input
              id="order-number"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
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
            <Label htmlFor="original-estimate" className="text-xs font-medium">
              Original Estimate #
            </Label>
            <div className="flex gap-2">
              <Input
                id="original-estimate"
                value={originalEstimateNumber}
                onChange={(e) => setOriginalEstimateNumber(e.target.value)}
                placeholder="EST-XXXX-XXX"
                className="h-9 text-sm font-mono"
              />
              <Button type="button" variant="outline" size="sm" className="h-9 px-3 text-xs gap-1.5">
                <Sparkles className="h-3 w-3" />
                Find
              </Button>
            </div>
          </div>
        </div>

        {/* Client */}
        <div className="space-y-2">
          <Label htmlFor="client-name" className="text-xs font-medium">Client Name</Label>
          <Input
            id="client-name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Auto-filled from estimate"
            className="h-9 text-sm"
          />
        </div>

        {/* Change Reason */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="change-reason" className="text-xs font-medium flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              Reason for Change <span className="text-destructive">*</span>
            </Label>
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-primary">
              <Sparkles className="h-3 w-3" />
              Draft Reason
            </Button>
          </div>
          <Textarea
            id="change-reason"
            value={changeReason}
            onChange={(e) => setChangeReason(e.target.value)}
            placeholder="Describe what changed and why (e.g., Client requested additional work, unforeseen site conditions, material upgrades...)"
            className="min-h-[80px] text-sm resize-none"
          />
        </div>

        {/* Approval Required Toggle */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="approval-required" className="text-sm font-medium">
              Requires Client Approval
            </Label>
            <p className="text-xs text-muted-foreground">
              Client must approve before work proceeds
            </p>
          </div>
          <Switch
            checked={approvalRequired}
            onCheckedChange={setApprovalRequired}
            aria-label="Requires Client Approval"
          />
        </div>

        {/* Line Items (Changes) */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            Price Adjustments
          </h4>
          <p className="text-xs text-muted-foreground">
            Add line items for additional work or credits. Use negative amounts for deductions.
          </p>
          <LineItemsEditor
            items={lineItems}
            onChange={setLineItems}
            onAIFill={() => { /* TODO: Connect to Neptune */ }}
          />
        </div>

        {/* Total Adjustment */}
        <div className="flex justify-end">
          <div className="w-full max-w-xs p-4 bg-muted/50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Adjustment</span>
              <span className={cn(
                "text-lg font-semibold",
                priceAdjustment >= 0 ? "text-emerald-600" : "text-red-600"
              )}>
                {formatCurrency(priceAdjustment)}
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
            placeholder="Timeline impact, material specifications, etc."
            className="min-h-[60px] text-sm resize-none"
          />
        </div>
      </div>
    );
  }
);

