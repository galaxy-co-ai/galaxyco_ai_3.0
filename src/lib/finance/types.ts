/**
 * Finance Service Internal Types
 * 
 * Types used internally by the finance services.
 * For API response types, see /src/types/finance.ts
 */

import type { FinanceProvider } from '@/types/finance';

/**
 * Service initialization result
 */
export interface ServiceInitResult {
  success: boolean;
  error?: string;
}

/**
 * Provider connection info stored in database
 */
export interface ProviderConnection {
  integrationId: string;
  workspaceId: string;
  provider: FinanceProvider;
  status: 'active' | 'expired' | 'error';
  config: ProviderConfig;
  lastSyncAt: Date | null;
  lastError: string | null;
}

/**
 * Provider-specific configuration
 */
export interface ProviderConfig {
  // QuickBooks
  companyId?: string;
  realmId?: string;
  
  // Shopify
  shopDomain?: string;
  
  // Common
  accountName?: string;
}

/**
 * Decrypted OAuth tokens
 */
export interface DecryptedTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

/**
 * Token refresh result
 */
export interface TokenRefreshResult {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

/**
 * Date range for queries
 */
export interface DateRangeQuery {
  startDate: Date;
  endDate: Date;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  limit?: number;
  cursor?: string;
  offset?: number;
}

/**
 * Aggregated financial data
 */
export interface AggregatedFinancials {
  revenue: number;
  expenses: number;
  profit: number;
  cashflow: number;
}

/**
 * Provider data fetch options
 */
export interface FetchOptions extends DateRangeQuery, PaginationOptions {
  includeDetails?: boolean;
}

/**
 * QuickBooks query response metadata
 */
export interface QBQueryResponseMeta {
  maxResults?: number;
  startPosition?: number;
  totalCount?: number;
}

/**
 * QuickBooks query response wrapper
 */
export interface QBQueryResponse<T> {
  QueryResponse: Record<string, T[] | number | undefined> & QBQueryResponseMeta;
  time: string;
}

/**
 * Stripe list response wrapper
 */
export interface StripeListResponse<T> {
  data: T[];
  has_more: boolean;
  object: 'list';
}

/**
 * Shopify response wrapper
 */
export interface ShopifyResponse<T> {
  [key: string]: T | T[];
}

