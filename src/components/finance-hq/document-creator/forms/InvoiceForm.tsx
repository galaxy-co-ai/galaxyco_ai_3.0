"use client";

import * as React from "react";
import { Calendar, User, FolderKanban, FileText, Percent, Sparkles, CreditCard } from "lucide-react";
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
import type { InvoiceDocument, LineItem, FinanceDocument } from "../types";

interface InvoiceFormProps {
  initialData?: Partial<FinanceDocument>;
}

export type InvoiceFormRef = {
  getFormData: () => Partial<FinanceDocument>;
};

const TAX_RATES = [
  { label: "No Tax", value: 0 },
  { label: "5%", value: 5 },
  { label: "7%", value: 7 },
  { label: "8.25%", value: 8.25 },
  { label: "10%", value: 10 },
];

const PAYMENT_TERMS = [
  { label: "Due on Receipt", value: "due_on_receipt" },
  { label: "Net 15", value: "net_15" },
  { label: "Net 30", value: "net_30" },
  { label: "Net 45", value: "net_45" },
  { label: "Net 60", value: "net_60" },
];

function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `INV-${year}${month}-${random}`;
}

function addDays(date: Date, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split("T")[0];
}

function getPaymentTermDays(term: string): number {
  const termDays: Record<string, number> = {
    due_on_receipt: 0,
    net_15: 15,
    net_30: 30,
    net_45: 45,
    net_60: 60,
  };
  return termDays[term] || 30;
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

export const InvoiceForm = React.forwardRef<InvoiceFormRef, InvoiceFormProps>(
  function InvoiceForm({ initialData }, ref) {
    const [invoiceNumber, setInvoiceNumber] = React.useState(
      (initialData as InvoiceDocument)?.number || generateInvoiceNumber()
    );
    const [date, setDate] = React.useState(
      (initialData as InvoiceDocument)?.date || new Date().toISOString().split("T")[0]
    );
    const [paymentTerms, setPaymentTerms] = React.useState(
      (initialData as InvoiceDocument)?.paymentTerms || "net_30"
    );
    const [dueDate, setDueDate] = React.useState(
      (initialData as InvoiceDocument)?.dueDate || addDays(new Date(), 30)
    );
    
    // Client info
    const [clientName, setClientName] = React.useState(
      (initialData as InvoiceDocument)?.client?.name || ""
    );
    const [clientEmail, setClientEmail] = React.useState(
      (initialData as InvoiceDocument)?.client?.email || ""
    );
    const [clientAddress, setClientAddress] = React.useState(
      (initialData as InvoiceDocument)?.client?.address || ""
    );
    
    // Project info
    const [projectName, setProjectName] = React.useState(
      (initialData as InvoiceDocument)?.project?.name || ""
    );
    
    // Line items
    const [lineItems, setLineItems] = React.useState<LineItem[]>(
      (initialData as InvoiceDocument)?.lineItems || [createDefaultLineItem()]
    );
    
    // Totals
    const [taxRate, setTaxRate] = React.useState(
      (initialData as InvoiceDocument)?.taxRate || 0
    );
    const [notes, setNotes] = React.useState(
      (initialData as InvoiceDocument)?.notes || ""
    );

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    // Update due date when payment terms change
    React.useEffect(() => {
      const days = getPaymentTermDays(paymentTerms);
      setDueDate(addDays(new Date(date), days));
    }, [date, paymentTerms]);

    const getFormData = React.useCallback((): Partial<InvoiceDocument> => ({
      type: "invoice",
      number: invoiceNumber,
      date,
      dueDate,
      paymentTerms,
      client: {
        name: clientName,
        email: clientEmail,
        address: clientAddress,
      },
      project: { name: projectName },
      lineItems,
      subtotal,
      taxRate,
      taxAmount,
      total,
      amountPaid: 0,
      balanceDue: total,
      notes,
      status: "draft",
    }), [
      invoiceNumber, date, dueDate, paymentTerms, clientName, clientEmail,
      clientAddress, projectName, lineItems, subtotal, taxRate, taxAmount, total, notes
    ]);

    React.useImperativeHandle(ref, () => ({ getFormData }), [getFormData]);

    const formatCurrency = (value: number) => {
      return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="invoice-number" className="text-xs font-medium flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Invoice Number
            </Label>
            <Input
              id="invoice-number"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="h-9 text-sm font-mono"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date" className="text-xs font-medium flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              Invoice Date
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
            <Label htmlFor="payment-terms" className="text-xs font-medium flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
              Payment Terms
            </Label>
            <Select value={paymentTerms} onValueChange={setPaymentTerms}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_TERMS.map((term) => (
                  <SelectItem key={term.value} value={term.value}>
                    {term.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="due-date" className="text-xs font-medium">Due Date</Label>
            <Input
              id="due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        </div>

        {/* Bill To */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Bill To
            </h3>
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-primary">
              <Sparkles className="h-3 w-3" />
              Find Client
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client-name" className="text-xs font-medium">
                Client Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="client-name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Client or Company Name"
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
                placeholder="billing@client.com"
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-address" className="text-xs font-medium">Billing Address</Label>
              <Input
                id="client-address"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="123 Main St, City, State"
                className="h-9 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Project Reference */}
        <div className="space-y-2">
          <Label htmlFor="project-name" className="text-xs font-medium flex items-center gap-1.5">
            <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
            Project / Reference
          </Label>
          <Input
            id="project-name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Project name or reference number"
            className="h-9 text-sm"
          />
        </div>

        {/* Line Items */}
        <LineItemsEditor
          items={lineItems}
          onChange={setLineItems}
          onAIFill={() => { /* TODO: Connect to Neptune */ }}
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
                <span>Amount Due</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-xs font-medium">Notes / Memo</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Payment instructions, thank you message, etc."
            className="min-h-[60px] text-sm resize-none"
          />
        </div>
      </div>
    );
  }
);

