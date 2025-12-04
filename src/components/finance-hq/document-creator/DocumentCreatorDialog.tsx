"use client";

import * as React from "react";
import { X, Sparkles, ChevronRight, Save, Send, FileText } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { NeptuneDocumentSidebar } from "./NeptuneDocumentSidebar";
import { EstimateForm } from "./forms/EstimateForm";
import { InvoiceForm } from "./forms/InvoiceForm";
import { ChangeOrderForm } from "./forms/ChangeOrderForm";
import { ReceiptForm } from "./forms/ReceiptForm";
import { ExpenseForm } from "./forms/ExpenseForm";
import { PaymentForm } from "./forms/PaymentForm";
import type { DocumentType, FinanceDocument, DocumentChatMessage } from "./types";

interface DocumentCreatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: DocumentType;
  onSave?: (document: Partial<FinanceDocument>, asDraft: boolean) => Promise<void>;
  initialData?: Partial<FinanceDocument>;
}

const documentTypeConfig: Record<DocumentType, {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  badgeClass: string;
}> = {
  estimate: {
    title: "New Estimate",
    description: "Create a project estimate for your client",
    icon: <FileText className="h-4 w-4" />,
    color: "text-blue-600",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  change_order: {
    title: "Change Order",
    description: "Document changes to an existing estimate",
    icon: <FileText className="h-4 w-4" />,
    color: "text-orange-600",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
  },
  invoice: {
    title: "New Invoice",
    description: "Bill your client for completed work",
    icon: <FileText className="h-4 w-4" />,
    color: "text-emerald-600",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  receipt: {
    title: "New Receipt",
    description: "Record a payment received",
    icon: <FileText className="h-4 w-4" />,
    color: "text-teal-600",
    badgeClass: "bg-teal-50 text-teal-700 border-teal-200",
  },
  expense: {
    title: "New Expense",
    description: "Track a business expense",
    icon: <FileText className="h-4 w-4" />,
    color: "text-red-600",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
  },
  payment: {
    title: "Record Payment",
    description: "Log a payment against an invoice",
    icon: <FileText className="h-4 w-4" />,
    color: "text-indigo-600",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
};

export function DocumentCreatorDialog({
  open,
  onOpenChange,
  documentType,
  onSave,
  initialData,
}: DocumentCreatorDialogProps) {
  const [isNeptuneOpen, setIsNeptuneOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [chatMessages, setChatMessages] = React.useState<DocumentChatMessage[]>([]);
  const [formData, setFormData] = React.useState<Partial<FinanceDocument>>(initialData || {});
  const formRef = React.useRef<{ getFormData: () => Partial<FinanceDocument> } | null>(null);

  const config = documentTypeConfig[documentType];

  // Initialize chat with welcome message
  React.useEffect(() => {
    if (open && chatMessages.length === 0) {
      setChatMessages([{
        id: "welcome",
        role: "assistant",
        content: getWelcomeMessage(documentType),
        timestamp: new Date(),
      }]);
    }
  }, [open, documentType, chatMessages.length]);

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setChatMessages([]);
      setFormData({});
      setIsNeptuneOpen(false);
    }
  }, [open]);

  const handleSave = async (asDraft: boolean) => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      const currentData = formRef.current?.getFormData() || formData;
      await onSave(currentData, asDraft);
      onOpenChange(false);
    } catch (error) {
      logger.error("Failed to save document", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNeptuneMessage = async (message: string) => {
    // Add user message
    const userMsg: DocumentChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, userMsg]);

    // Get current form data for context
    const currentFormData = formRef.current?.getFormData() || formData;

    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: buildNeptuneContext(documentType, message, currentFormData),
          context: {
            feature: "finance_document_creator",
            documentType,
            formData: currentFormData,
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      
      const assistantMsg: DocumentChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message?.content || data.message || "I can help you with that.",
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, assistantMsg]);

      // Check if Neptune returned form updates
      if (data.formUpdates) {
        setFormData(prev => ({ ...prev, ...data.formUpdates }));
      }
    } catch (error) {
      logger.error("Neptune error", error);
      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm having trouble connecting. Please try again.",
        timestamp: new Date(),
      }]);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay 
          className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed top-[50%] left-[50%] z-50 translate-x-[-50%] translate-y-[-50%]",
            "w-[95vw] max-w-[1200px] h-[90vh] max-h-[800px]",
            "bg-background rounded-xl border shadow-2xl",
            "flex flex-col overflow-hidden",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "duration-200"
          )}
          aria-describedby="document-creator-description"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", config.badgeClass.replace("text-", "bg-").split(" ")[0] + "/20")}>
                <span className={config.color}>{config.icon}</span>
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  {config.title}
                  <Badge variant="outline" className={cn("text-[10px] h-5", config.badgeClass)}>
                    Draft
                  </Badge>
                </h2>
                <p id="document-creator-description" className="text-xs text-muted-foreground">
                  {config.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 gap-1.5 text-xs",
                  isNeptuneOpen && "bg-primary/10 border-primary/30"
                )}
                onClick={() => setIsNeptuneOpen(!isNeptuneOpen)}
                aria-label={isNeptuneOpen ? "Hide Neptune AI" : "Show Neptune AI"}
              >
                <Sparkles className={cn("h-3.5 w-3.5", isNeptuneOpen && "text-primary")} />
                Neptune
                <ChevronRight className={cn(
                  "h-3 w-3 transition-transform",
                  isNeptuneOpen && "rotate-180"
                )} />
              </Button>
              <DialogPrimitive.Close asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Close">
                  <X className="h-4 w-4" />
                </Button>
              </DialogPrimitive.Close>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Form Section */}
            <div className={cn(
              "flex-1 overflow-y-auto transition-all duration-300",
              isNeptuneOpen ? "w-[60%]" : "w-full"
            )}>
              <div className="p-6">
                {documentType === "estimate" && (
                  <EstimateForm ref={formRef} initialData={formData} />
                )}
                {documentType === "invoice" && (
                  <InvoiceForm ref={formRef} initialData={formData} />
                )}
                {documentType === "change_order" && (
                  <ChangeOrderForm ref={formRef} initialData={formData} />
                )}
                {documentType === "receipt" && (
                  <ReceiptForm ref={formRef} initialData={formData} />
                )}
                {documentType === "expense" && (
                  <ExpenseForm ref={formRef} initialData={formData} />
                )}
                {documentType === "payment" && (
                  <PaymentForm ref={formRef} initialData={formData} />
                )}
              </div>
            </div>

            {/* Neptune Sidebar */}
            <div className={cn(
              "border-l bg-muted/20 transition-all duration-300 overflow-hidden",
              isNeptuneOpen ? "w-[40%] opacity-100" : "w-0 opacity-0"
            )}>
              {isNeptuneOpen && (
                <NeptuneDocumentSidebar
                  documentType={documentType}
                  messages={chatMessages}
                  onSendMessage={handleNeptuneMessage}
                  onClose={() => setIsNeptuneOpen(false)}
                />
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/30">
            <p className="text-xs text-muted-foreground">
              All documents are automatically saved to your Library
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => handleSave(true)}
                disabled={isSaving}
              >
                <Save className="h-3.5 w-3.5" />
                Save Draft
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => handleSave(false)}
                disabled={isSaving}
              >
                <Send className="h-3.5 w-3.5" />
                {documentType === "estimate" && "Send Estimate"}
                {documentType === "invoice" && "Send Invoice"}
                {documentType === "change_order" && "Submit Change Order"}
                {documentType === "receipt" && "Issue Receipt"}
                {documentType === "expense" && "Record Expense"}
                {documentType === "payment" && "Record Payment"}
              </Button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// Helper functions
function getWelcomeMessage(docType: DocumentType): string {
  const messages: Record<DocumentType, string> = {
    estimate: "Hi! I'm here to help you create an estimate. You can describe your project and I'll help fill in the details, or you can enter information manually. What would you like to do?",
    change_order: "I can help you document changes to an existing estimate. Would you like me to pull up a previous estimate to reference?",
    invoice: "Let's create an invoice. Do you want to base this on an existing estimate or project, or start fresh?",
    receipt: "I'll help you record a payment receipt. Which invoice is this payment for?",
    expense: "I can help you log a business expense. What did you purchase and from which vendor?",
    payment: "Let's record a payment. Which client or invoice is this payment from?",
  };
  return messages[docType];
}

function buildNeptuneContext(
  docType: DocumentType, 
  userMessage: string, 
  formData: Partial<FinanceDocument>
): string {
  return `[Finance Document Creator - ${docType.toUpperCase()}]

Current form state:
${JSON.stringify(formData, null, 2)}

User's request: "${userMessage}"

Help the user create their ${docType}. You can:
- Suggest values for fields based on their description
- Help calculate totals and taxes
- Recommend payment terms or validity periods
- Draft professional descriptions
- Answer questions about the document

Be concise and helpful. If you can fill in form values, describe what you're adding.`;
}

