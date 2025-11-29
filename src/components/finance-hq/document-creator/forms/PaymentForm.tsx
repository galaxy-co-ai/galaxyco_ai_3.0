"use client";

import * as React from "react";
import { Calendar, FileText, Sparkles, User, CreditCard, Receipt } from "lucide-react";
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
import type { PaymentDocument, FinanceDocument } from "../types";

interface PaymentFormProps {
  initialData?: Partial<FinanceDocument>;
}

export type PaymentFormRef = {
  getFormData: () => Partial<FinanceDocument>;
};

const PAYMENT_METHODS = [
  { label: "Cash", value: "cash" },
  { label: "Check", value: "check" },
  { label: "Credit Card", value: "card" },
  { label: "Bank Transfer", value: "bank_transfer" },
  { label: "Other", value: "other" },
];

function generatePaymentId(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `PAY-${year}${month}-${random}`;
}

export const PaymentForm = React.forwardRef<PaymentFormRef, PaymentFormProps>(
  function PaymentForm({ initialData }, ref) {
    const [paymentId, setPaymentId] = React.useState(
      (initialData as PaymentDocument)?.id || generatePaymentId()
    );
    const [date, setDate] = React.useState(
      (initialData as PaymentDocument)?.date || new Date().toISOString().split("T")[0]
    );
    
    // Invoice reference
    const [invoiceNumber, setInvoiceNumber] = React.useState(
      (initialData as PaymentDocument)?.invoiceNumber || ""
    );
    
    // Client info
    const [clientName, setClientName] = React.useState(
      (initialData as PaymentDocument)?.clientName || ""
    );
    
    // Payment details
    const [amount, setAmount] = React.useState(
      (initialData as PaymentDocument)?.amount || 0
    );
    const [paymentMethod, setPaymentMethod] = React.useState<PaymentDocument["paymentMethod"]>(
      (initialData as PaymentDocument)?.paymentMethod || "bank_transfer"
    );
    const [reference, setReference] = React.useState(
      (initialData as PaymentDocument)?.reference || ""
    );
    
    const [notes, setNotes] = React.useState(
      (initialData as PaymentDocument)?.notes || ""
    );

    const getFormData = React.useCallback((): Partial<PaymentDocument> => ({
      type: "payment",
      id: paymentId,
      date,
      invoiceNumber,
      clientName,
      amount,
      paymentMethod,
      reference,
      notes,
      status: "pending",
    }), [
      paymentId, date, invoiceNumber, clientName, amount,
      paymentMethod, reference, notes
    ]);

    React.useImperativeHandle(ref, () => ({ getFormData }), [getFormData]);

    const formatCurrency = (value: number) => {
      return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <Receipt className="h-5 w-5 text-indigo-600" />
          <div>
            <p className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
              Record a Payment
            </p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400">
              Log a payment received against an outstanding invoice
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="payment-id" className="text-xs font-medium flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Payment ID
            </Label>
            <Input
              id="payment-id"
              value={paymentId}
              onChange={(e) => setPaymentId(e.target.value)}
              className="h-9 text-sm font-mono"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date" className="text-xs font-medium flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              Payment Date
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
            <Label htmlFor="invoice-number" className="text-xs font-medium">
              Invoice # <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="invoice-number"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="INV-XXXX-XXX"
                className="h-9 text-sm font-mono"
              />
              <Button type="button" variant="outline" size="sm" className="h-9 px-3 text-xs gap-1.5">
                <Sparkles className="h-3 w-3" />
                Find
              </Button>
            </div>
          </div>
        </div>

        {/* Received From */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="client-name" className="text-xs font-medium flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              Received From <span className="text-destructive">*</span>
            </Label>
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-primary">
              <Sparkles className="h-3 w-3" />
              Find Client
            </Button>
          </div>
          <Input
            id="client-name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Client or Company Name"
            className="h-9 text-sm"
          />
        </div>

        {/* Payment Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <Label htmlFor="payment-method" className="text-xs font-medium flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
              Payment Method
            </Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentDocument["paymentMethod"])}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
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

          <div className="space-y-2">
            <Label htmlFor="reference" className="text-xs font-medium">
              Reference / Check #
            </Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Transaction ID, Check #, etc."
              className="h-9 text-sm"
            />
          </div>
        </div>

        {/* Total */}
        <div className="flex justify-end">
          <div className="w-full max-w-xs p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
                Payment Amount
              </span>
              <span className="text-xl font-semibold text-indigo-600">
                {formatCurrency(amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-xs font-medium">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes about this payment..."
            className="min-h-[60px] text-sm resize-none"
          />
        </div>
      </div>
    );
  }
);

