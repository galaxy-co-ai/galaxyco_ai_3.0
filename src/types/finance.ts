/**
 * Finance HQ TypeScript Types
 * 
 * All types for the Finance HQ feature including:
 * - Provider types (QuickBooks, Stripe, Shopify)
 * - API response types
 * - Component prop types
 * - Normalized data structures
 */

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Finance data source providers
 */
export type FinanceProvider = 'quickbooks' | 'stripe' | 'shopify';

/**
 * Date range for filtering financial data
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Filters for finance data
 */
export interface FinanceFilters {
  sources: FinanceProvider[];
  dateRange?: DateRange;
}

/**
 * Generic finance object for detail drawer
 */
export interface FinanceObject {
  type: 'module' | 'event' | 'transaction' | 'invoice';
  id: string;
  data: Record<string, unknown>;
}

// ============================================================================
// KPI TYPES
// ============================================================================

/**
 * Key Performance Indicator data
 */
export interface KPI {
  id: string;
  label: string;
  value: number;
  formattedValue: string;
  delta?: number;
  deltaLabel?: string;
  icon: string;
  iconColor: string;
  iconBg: string;
}

// ============================================================================
// OVERVIEW TYPES
// ============================================================================

/**
 * Finance overview/summary response
 */
export interface FinanceOverviewResponse {
  kpis: KPI[];
  summary: FinanceSummary;
  bySource: FinanceBySource;
}

/**
 * Aggregated financial summary
 */
export interface FinanceSummary {
  revenue: number;
  expenses: number;
  profit: number;
  cashflow: number;
  outstandingInvoices: number;
}

/**
 * Financial data broken down by source
 */
export interface FinanceBySource {
  quickbooks?: {
    revenue: number;
    expenses: number;
  };
  stripe?: {
    revenue: number;
    fees: number;
  };
  shopify?: {
    revenue: number;
    orders: number;
  };
}

// ============================================================================
// MODULE TYPES
// ============================================================================

/**
 * Finance module type
 */
export type FinanceModuleType = 'chart' | 'list' | 'metric';

/**
 * Finance module data union
 */
export type FinanceModuleData = ChartData | ListData | MetricData;

/**
 * Chart data structure
 */
export interface ChartData {
  type: 'line' | 'bar' | 'donut';
  dataPoints: Array<{ label: string; value: number }>;
}

/**
 * List data structure
 */
export interface ListData {
  items: Array<{
    id: string;
    title: string;
    subtitle?: string;
    amount?: number;
    status?: string;
  }>;
  total: number;
}

/**
 * Metric data structure
 */
export interface MetricData {
  value: number;
  formattedValue: string;
  trend?: number;
}

/**
 * Finance module definition
 */
export interface FinanceModule {
  id: string;
  title: string;
  source: FinanceProvider;
  type: FinanceModuleType;
  icon: string;
  data: FinanceModuleData;
  lastUpdated: string;
}

/**
 * Modules API response
 */
export interface FinanceModulesResponse {
  modules: FinanceModule[];
}

// ============================================================================
// INVOICE TYPES
// ============================================================================

/**
 * Invoice status
 */
export type InvoiceStatus = 'paid' | 'unpaid' | 'overdue' | 'draft';

/**
 * Invoice line item
 */
export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

/**
 * Invoice customer
 */
export interface InvoiceCustomer {
  id: string;
  name: string;
  email?: string;
}

/**
 * Invoice data structure
 */
export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  customer: InvoiceCustomer;
  dueDate: string;
  balance: number;
  total: number;
  lineItems: InvoiceLineItem[];
  createdAt: string;
  updatedAt: string;
  source: 'quickbooks';
  externalId: string;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  hasMore: boolean;
  nextCursor?: string;
  total: number;
}

/**
 * Invoices API response
 */
export interface InvoicesResponse {
  invoices: Invoice[];
  pagination: PaginationMeta;
}

/**
 * Create invoice request
 */
export interface CreateInvoiceRequest {
  customerId: string;
  dueDate: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  notes?: string;
}

/**
 * Send reminder request
 */
export interface SendReminderRequest {
  message?: string;
}

/**
 * Send reminder response
 */
export interface SendReminderResponse {
  success: boolean;
  sentTo: string;
  sentAt: string;
}

// ============================================================================
// REVENUE TYPES
// ============================================================================

/**
 * Revenue trend data point
 */
export interface RevenueTrendPoint {
  date: string;
  value: number;
  quickbooks?: number;
  stripe?: number;
  shopify?: number;
}

/**
 * Revenue API response
 */
export interface RevenueResponse {
  total: number;
  formattedTotal: string;
  bySource: {
    quickbooks?: number;
    stripe?: number;
    shopify?: number;
  };
  trend: RevenueTrendPoint[];
  period: {
    start: string;
    end: string;
  };
}

// ============================================================================
// CASH FLOW TYPES
// ============================================================================

/**
 * Payout data
 */
export interface Payout {
  id: string;
  source: 'stripe' | 'shopify';
  amount: number;
  status: string;
  arrivalDate: string;
  createdAt?: string;
}

/**
 * Cash flow trend data point
 */
export interface CashFlowTrendPoint {
  date: string;
  inflow: number;
  outflow: number;
  net: number;
}

/**
 * Cash flow API response
 */
export interface CashFlowResponse {
  net: number;
  inflow: number;
  outflow: number;
  trend: CashFlowTrendPoint[];
  payouts: Payout[];
}

// ============================================================================
// TIMELINE TYPES
// ============================================================================

/**
 * Finance event type
 */
export type FinanceEventType = 
  | 'invoice_created'
  | 'invoice_paid'
  | 'payout'
  | 'order'
  | 'expense'
  | 'refund';

/**
 * Financial event for timeline
 */
export interface FinanceEvent {
  id: string;
  type: FinanceEventType;
  source: FinanceProvider;
  label: string;
  description?: string;
  amount?: number;
  date: string;
  metadata?: Record<string, unknown>;
}

/**
 * Timeline API response
 */
export interface TimelineResponse {
  events: FinanceEvent[];
}

// ============================================================================
// ACTIVITY TYPES
// ============================================================================

/**
 * Transaction type
 */
export type TransactionType = 'income' | 'expense' | 'transfer' | 'fee' | 'refund';

/**
 * Unified financial transaction
 */
export interface FinanceTransaction {
  id: string;
  date: string;
  source: FinanceProvider;
  type: TransactionType;
  description: string;
  amount: number;
  currency: string;
  status?: string;
  externalId: string;
  metadata?: Record<string, unknown>;
}

/**
 * Activity API response
 */
export interface ActivityResponse {
  transactions: FinanceTransaction[];
  pagination: PaginationMeta;
}

// ============================================================================
// INTEGRATION TYPES
// ============================================================================

/**
 * Integration connection status
 */
export type IntegrationStatus = 'connected' | 'expired' | 'disconnected';

/**
 * Integration detail information
 */
export interface IntegrationDetail {
  status: IntegrationStatus;
  connectedAt?: string;
  lastSyncAt?: string;
  accountName?: string;
  error?: string;
}

/**
 * Integrations API response
 */
export interface FinanceIntegrationsResponse {
  connected: FinanceProvider[];
  expired: FinanceProvider[];
  available: FinanceProvider[];
  details: {
    quickbooks?: IntegrationDetail;
    stripe?: IntegrationDetail;
    shopify?: IntegrationDetail;
  };
}

// ============================================================================
// PROVIDER-SPECIFIC TYPES (QuickBooks)
// ============================================================================

/**
 * QuickBooks invoice reference
 */
export interface QBCustomerRef {
  value: string;
  name: string;
}

/**
 * QuickBooks sales item detail
 */
export interface QBSalesItemLineDetail {
  ItemRef?: { value: string; name: string };
  Qty?: number;
  UnitPrice?: number;
}

/**
 * QuickBooks invoice line
 */
export interface QBInvoiceLine {
  Id: string;
  Amount: number;
  Description?: string;
  DetailType: string;
  SalesItemLineDetail?: QBSalesItemLineDetail;
}

/**
 * QuickBooks metadata
 */
export interface QBMetaData {
  CreateTime: string;
  LastUpdatedTime: string;
}

/**
 * QuickBooks invoice structure
 */
export interface QBInvoice {
  Id: string;
  DocNumber: string;
  TxnDate: string;
  DueDate: string;
  TotalAmt: string;
  Balance: string;
  CustomerRef: QBCustomerRef;
  Line: QBInvoiceLine[];
  MetaData: QBMetaData;
}

/**
 * QuickBooks company info
 */
export interface QBCompanyInfo {
  companyId: string;
  companyName: string;
  country: string;
}

// ============================================================================
// PROVIDER-SPECIFIC TYPES (Stripe)
// ============================================================================

/**
 * Stripe billing details
 */
export interface StripeBillingDetails {
  name?: string;
  email?: string;
}

/**
 * Stripe payment method details
 */
export interface StripePaymentMethodDetails {
  type?: string;
}

/**
 * Stripe charge structure (simplified)
 */
export interface StripeCharge {
  id: string;
  amount: number;
  currency: string;
  created: number;
  status: string;
  description?: string;
  customer?: string;
  receipt_url?: string;
  billing_details?: StripeBillingDetails;
  payment_method_details?: StripePaymentMethodDetails;
}

/**
 * Stripe payout structure (simplified)
 */
export interface StripePayout {
  id: string;
  amount: number;
  currency: string;
  created: number;
  arrival_date: number;
  status: string;
}

/**
 * Stripe balance transaction (simplified)
 */
export interface StripeBalanceTransaction {
  id: string;
  amount: number;
  fee: number;
  net: number;
  currency: string;
  created: number;
  type: string;
  description?: string;
}

// ============================================================================
// PROVIDER-SPECIFIC TYPES (Shopify)
// ============================================================================

/**
 * Shopify order line item
 */
export interface ShopifyLineItem {
  id: number;
  title: string;
  quantity: number;
  price: string;
}

/**
 * Shopify order structure (simplified)
 */
export interface ShopifyOrder {
  id: number;
  order_number: number;
  created_at: string;
  total_price: string;
  currency: string;
  financial_status: string;
  fulfillment_status: string | null;
  email?: string;
  line_items?: ShopifyLineItem[];
}

/**
 * Shopify payout structure (simplified)
 */
export interface ShopifyPayout {
  id: number;
  amount: string;
  status: string;
  date: string;
}

// ============================================================================
// SERVICE TYPES
// ============================================================================

/**
 * Options for fetching invoices
 */
export interface GetInvoicesOptions {
  startDate?: Date;
  endDate?: Date;
  status?: InvoiceStatus | 'all';
  limit?: number;
  cursor?: string;
}

/**
 * Options for fetching transactions
 */
export interface GetTransactionsOptions {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  startingAfter?: string;
}

/**
 * Unified revenue data from a provider
 */
export interface UnifiedRevenue {
  total: number;
  quickbooks: number;
  stripe: number;
  shopify: number;
  breakdown: {
    grossRevenue: number;
    fees: number;
    refunds: number;
    netRevenue: number;
  };
}

/**
 * Stripe revenue data
 */
export interface StripeRevenueData {
  charges: number;
  fees: number;
  refunds: number;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Integration error response
 */
export interface IntegrationErrorResponse {
  error: 'integration_not_connected' | 'integration_expired' | 'integration_error';
  provider: FinanceProvider;
  message?: string;
}

/**
 * Partial data warning response
 */
export interface PartialDataWarning {
  warning: 'partial_data';
  message: string;
  availableSources: FinanceProvider[];
}

// ============================================================================
// HELPER TYPE GUARDS
// ============================================================================

/**
 * Type guard for checking if data is ChartData
 */
export function isChartData(data: FinanceModuleData): data is ChartData {
  return 'dataPoints' in data && 'type' in data;
}

/**
 * Type guard for checking if data is ListData
 */
export function isListData(data: FinanceModuleData): data is ListData {
  return 'items' in data && 'total' in data;
}

/**
 * Type guard for checking if data is MetricData
 */
export function isMetricData(data: FinanceModuleData): data is MetricData {
  return 'formattedValue' in data && !('dataPoints' in data) && !('items' in data);
}
































































