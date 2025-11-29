/**
 * Finance Document Creator Types
 * Shared types for all document creation forms
 */

export type DocumentType = 
  | "estimate"
  | "change_order"
  | "invoice"
  | "receipt"
  | "expense"
  | "payment";

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface ClientInfo {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface ProjectInfo {
  id?: string;
  name: string;
  number?: string;
  description?: string;
}

// Base document interface
export interface BaseDocument {
  id?: string;
  type: DocumentType;
  number?: string;
  date: string;
  client: ClientInfo;
  project?: ProjectInfo;
  lineItems: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
  terms?: string;
  status: "draft" | "sent" | "approved" | "paid" | "cancelled";
  createdAt?: string;
  updatedAt?: string;
}

// Estimate-specific fields
export interface EstimateDocument extends BaseDocument {
  type: "estimate";
  validUntil: string;
  scope?: string;
}

// Change Order specific fields
export interface ChangeOrderDocument extends BaseDocument {
  type: "change_order";
  originalEstimateId?: string;
  originalEstimateNumber?: string;
  changeReason: string;
  priceAdjustment: number;
  approvalRequired: boolean;
}

// Invoice specific fields
export interface InvoiceDocument extends BaseDocument {
  type: "invoice";
  estimateId?: string;
  estimateNumber?: string;
  dueDate: string;
  paymentTerms: string;
  amountPaid: number;
  balanceDue: number;
}

// Receipt specific fields
export interface ReceiptDocument extends BaseDocument {
  type: "receipt";
  invoiceId?: string;
  invoiceNumber?: string;
  paymentMethod: "cash" | "check" | "card" | "bank_transfer" | "other";
  paymentReference?: string;
  amountReceived: number;
}

// Expense specific fields
export interface ExpenseDocument extends Omit<BaseDocument, "client"> {
  type: "expense";
  vendor: string;
  category: string;
  receiptUrl?: string;
  projectAllocation?: string;
  reimbursable: boolean;
}

// Payment record specific fields
export interface PaymentDocument {
  id?: string;
  type: "payment";
  date: string;
  invoiceId?: string;
  invoiceNumber?: string;
  clientName: string;
  amount: number;
  paymentMethod: "cash" | "check" | "card" | "bank_transfer" | "other";
  reference?: string;
  notes?: string;
  status: "pending" | "completed" | "failed";
}

export type FinanceDocument = 
  | EstimateDocument 
  | ChangeOrderDocument 
  | InvoiceDocument 
  | ReceiptDocument 
  | ExpenseDocument 
  | PaymentDocument;

// Neptune chat message for document context
export interface DocumentChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  action?: {
    type: "fill_field" | "add_line_item" | "suggest" | "complete";
    data?: Record<string, unknown>;
  };
}

// Document creator state
export interface DocumentCreatorState {
  isOpen: boolean;
  documentType: DocumentType | null;
  document: Partial<FinanceDocument> | null;
  isDirty: boolean;
  isSaving: boolean;
  isNeptuneOpen: boolean;
  chatMessages: DocumentChatMessage[];
}

