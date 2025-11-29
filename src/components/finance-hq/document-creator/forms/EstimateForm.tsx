"use client";

import * as React from "react";
import { Calendar, User, FolderKanban, FileText, Percent, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { LineItemsEditor } from "../LineItemsEditor";
import type { EstimateDocument, LineItem, FinanceDocument } from "../types";

interface EstimateFormProps {
  initialData?: Partial<FinanceDocument>;
}

export type EstimateFormRef = {
  getFormData: () => Partial<FinanceDocument>;
};

const TAX_RATES = [
  { label: "No Tax", value: 0 },
  { label: "5%", value: 5 },
  { label: "7%", value: 7 },
  { label: "8.25%", value: 8.25 },
  { label: "10%", value: 10 },
];

const VALIDITY_PERIODS = [
  { label: "15 days", value: 15 },
  { label: "30 days", value: 30 },
  { label: "45 days", value: 45 },
  { label: "60 days", value: 60 },
  { label: "90 days", value: 90 },
];

function generateEstimateNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `EST-${year}${month}-${random}`;
}

function addDays(date: Date, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split("T")[0];
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

export const EstimateForm = React.forwardRef<EstimateFormRef, EstimateFormProps>(
  function EstimateForm({ initialData }, ref) {
    // Form state
    const [estimateNumber, setEstimateNumber] = React.useState(
      (initialData as EstimateDocument)?.number || generateEstimateNumber()
    );
    const [date, setDate] = React.useState(
      (initialData as EstimateDocument)?.date || new Date().toISOString().split("T")[0]
    );
    const [validityDays, setValidityDays] = React.useState(30);
    const [validUntil, setValidUntil] = React.useState(
      (initialData as EstimateDocument)?.validUntil || addDays(new Date(), 30)
    );
    
    // Client info
    const [clientName, setClientName] = React.useState(
      (initialData as EstimateDocument)?.client?.name || ""
    );
    const [clientEmail, setClientEmail] = React.useState(
      (initialData as EstimateDocument)?.client?.email || ""
    );
    const [clientPhone, setClientPhone] = React.useState(
      (initialData as EstimateDocument)?.client?.phone || ""
    );
    const [clientAddress, setClientAddress] = React.useState(
      (initialData as EstimateDocument)?.client?.address || ""
    );
    
    // Project info
    const [projectName, setProjectName] = React.useState(
      (initialData as EstimateDocument)?.project?.name || ""
    );
    const [projectDescription, setProjectDescription] = React.useState(
      (initialData as EstimateDocument)?.scope || ""
    );
    
    // Line items
    const [lineItems, setLineItems] = React.useState<LineItem[]>(
      (initialData as EstimateDocument)?.lineItems || [createDefaultLineItem()]
    );
    
    // Totals
    const [taxRate, setTaxRate] = React.useState(
      (initialData as EstimateDocument)?.taxRate || 0
    );
    const [notes, setNotes] = React.useState(
      (initialData as EstimateDocument)?.notes || ""
    );
    const [terms, setTerms] = React.useState(
      (initialData as EstimateDocument)?.terms || "Payment due upon project completion. 50% deposit required to begin work."
    );

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    // Update validity date when days change
    React.useEffect(() => {
      setValidUntil(addDays(new Date(date), validityDays));
    }, [date, validityDays]);

    // Compile form data
    const getFormData = React.useCallback((): Partial<EstimateDocument> => ({
      type: "estimate",
      number: estimateNumber,
      date,
      validUntil,
      client: {
        name: clientName,
        email: clientEmail,
        phone: clientPhone,
        address: clientAddress,
      },
      project: {
        name: projectName,
        description: projectDescription,
      },
      scope: projectDescription,
      lineItems,
      subtotal,
      taxRate,
      taxAmount,
      total,
      notes,
      terms,
      status: "draft",
    }), [
      estimateNumber, date, validUntil, clientName, clientEmail, clientPhone,
      clientAddress, projectName, projectDescription, lineItems, subtotal,
      taxRate, taxAmount, total, notes, terms
    ]);

    // Expose getFormData via ref
    React.useImperativeHandle(ref, () => ({
      getFormData,
    }), [getFormData]);

    // Note: We don't auto-notify parent on every change to avoid infinite loops
    // Parent should use the ref to get form data when needed (e.g., on save)

    const formatCurrency = (value: number) => {
      return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
      <div className="space-y-8">
        {/* Header Section - Estimate Number & Date */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="estimate-number" className="text-xs font-medium flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Estimate Number
            </Label>
            <Input
              id="estimate-number"
              value={estimateNumber}
              onChange={(e) => setEstimateNumber(e.target.value)}
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
            <Label htmlFor="validity" className="text-xs font-medium">Valid For</Label>
            <Select value={validityDays.toString()} onValueChange={(v) => setValidityDays(parseInt(v))}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VALIDITY_PERIODS.map((period) => (
                  <SelectItem key={period.value} value={period.value.toString()}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              Valid until {new Date(validUntil).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Client Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Client Information
            </h3>
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-primary">
              <Sparkles className="h-3 w-3" />
              Find Client
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client-name" className="text-xs font-medium">
                Client Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="client-name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="John Smith"
                className="h-9 text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="client-email" className="text-xs font-medium">Email</Label>
              <Input
                id="client-email"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="john@example.com"
                className="h-9 text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="client-phone" className="text-xs font-medium">Phone</Label>
              <Input
                id="client-phone"
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="h-9 text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="client-address" className="text-xs font-medium">Address</Label>
              <Input
                id="client-address"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="123 Main St, City, State 12345"
                className="h-9 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Project Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
              Project Details
            </h3>
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-primary">
              <Sparkles className="h-3 w-3" />
              Generate Scope
            </Button>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name" className="text-xs font-medium">
                Project Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Kitchen Remodel"
                className="h-9 text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="project-description" className="text-xs font-medium">
                Scope of Work
              </Label>
              <Textarea
                id="project-description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Describe the work to be performed..."
                className="min-h-[100px] text-sm resize-none"
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <LineItemsEditor
          items={lineItems}
          onChange={setLineItems}
          onAIFill={() => {
            // This will be connected to Neptune
            console.log("AI Fill requested");
          }}
        />

        {/* Tax & Totals */}
        <div className="flex justify-end">
          <div className="w-full max-w-xs space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="tax-rate" className="text-sm flex items-center gap-1.5">
                <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                Tax Rate
              </Label>
              <Select value={taxRate.toString()} onValueChange={(v) => setTaxRate(parseFloat(v))}>
                <SelectTrigger className="w-24 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TAX_RATES.map((rate) => (
                    <SelectItem key={rate.value} value={rate.value.toString()}>
                      {rate.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {taxRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax ({taxRate}%)</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold border-t pt-2">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes & Terms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs font-medium">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes for the client..."
              className="min-h-[80px] text-sm resize-none"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="terms" className="text-xs font-medium">Terms & Conditions</Label>
            <Textarea
              id="terms"
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="min-h-[80px] text-sm resize-none"
            />
          </div>
        </div>
      </div>
    );
  }
);

