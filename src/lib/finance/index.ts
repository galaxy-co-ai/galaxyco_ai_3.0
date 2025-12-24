/**
 * Finance HQ Services
 * 
 * Barrel export for all finance-related services and utilities.
 */

// Services
export { QuickBooksService } from './quickbooks';
export { StripeService } from './stripe';
export { ShopifyService } from './shopify';

// Normalization utilities
export {
  formatCurrency,
  formatCurrencyPrecise,
  calculateDelta,
  calculateUnifiedRevenue,
  generateKPIs,
  mergeTransactions,
  mergeEvents,
  filterBySource,
  generateModules,
  mergePayouts,
  calculateCashFlow,
  groupByDate,
  getProviderColors,
} from './normalization';

// Types
export type {
  ServiceInitResult,
  ProviderConnection,
  ProviderConfig,
  DecryptedTokens,
  TokenRefreshResult,
  DateRangeQuery,
  PaginationOptions,
  AggregatedFinancials,
  FetchOptions,
} from './types';































































