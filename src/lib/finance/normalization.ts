/**
 * Finance Data Normalization Utilities
 * 
 * Functions to merge and normalize data from multiple providers
 * into unified Finance HQ data structures.
 */

import type {
  FinanceProvider,
  FinanceTransaction,
  FinanceEvent,
  KPI,
  FinanceModule,
  UnifiedRevenue,
  StripeRevenueData,
  Payout,
} from '@/types/finance';

/**
 * Format currency value to display string
 */
export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format currency with cents
 */
export function formatCurrencyPrecise(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Calculate percentage change
 */
export function calculateDelta(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Calculate unified revenue from all providers
 */
export function calculateUnifiedRevenue(
  qbIncome: number,
  stripeData: StripeRevenueData,
  shopifyOrders: number
): UnifiedRevenue {
  const stripeNet = stripeData.charges - stripeData.fees - stripeData.refunds;
  
  return {
    total: qbIncome + stripeNet + shopifyOrders,
    quickbooks: qbIncome,
    stripe: stripeNet,
    shopify: shopifyOrders,
    breakdown: {
      grossRevenue: qbIncome + stripeData.charges + shopifyOrders,
      fees: stripeData.fees,
      refunds: stripeData.refunds,
      netRevenue: qbIncome + stripeNet + shopifyOrders,
    },
  };
}

/**
 * Generate KPIs from aggregated financial data
 */
export function generateKPIs(data: {
  revenue: number;
  expenses: number;
  profit: number;
  cashflow: number;
  outstandingInvoices: number;
  previousPeriod?: {
    revenue: number;
    expenses: number;
    profit: number;
    cashflow: number;
    outstandingInvoices: number;
  };
}): KPI[] {
  const { revenue, expenses, profit, cashflow, outstandingInvoices, previousPeriod } = data;

  return [
    {
      id: 'revenue',
      label: 'Revenue',
      value: revenue,
      formattedValue: formatCurrency(revenue),
      delta: previousPeriod ? calculateDelta(revenue, previousPeriod.revenue) : undefined,
      deltaLabel: 'vs last period',
      icon: 'TrendingUp',
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
    },
    {
      id: 'expenses',
      label: 'Expenses',
      value: expenses,
      formattedValue: formatCurrency(expenses),
      delta: previousPeriod ? calculateDelta(expenses, previousPeriod.expenses) : undefined,
      deltaLabel: 'vs last period',
      icon: 'TrendingDown',
      iconColor: 'text-red-600',
      iconBg: 'bg-red-50',
    },
    {
      id: 'profit',
      label: 'Profit',
      value: profit,
      formattedValue: formatCurrency(profit),
      delta: previousPeriod ? calculateDelta(profit, previousPeriod.profit) : undefined,
      deltaLabel: 'vs last period',
      icon: 'DollarSign',
      iconColor: profit >= 0 ? 'text-emerald-600' : 'text-red-600',
      iconBg: profit >= 0 ? 'bg-emerald-50' : 'bg-red-50',
    },
    {
      id: 'cashflow',
      label: 'Cash Flow',
      value: cashflow,
      formattedValue: formatCurrency(cashflow),
      delta: previousPeriod ? calculateDelta(cashflow, previousPeriod.cashflow) : undefined,
      deltaLabel: 'vs last period',
      icon: 'ArrowRightLeft',
      iconColor: cashflow >= 0 ? 'text-blue-600' : 'text-amber-600',
      iconBg: cashflow >= 0 ? 'bg-blue-50' : 'bg-amber-50',
    },
    {
      id: 'outstanding',
      label: 'Outstanding',
      value: outstandingInvoices,
      formattedValue: formatCurrency(outstandingInvoices),
      delta: previousPeriod ? calculateDelta(outstandingInvoices, previousPeriod.outstandingInvoices) : undefined,
      deltaLabel: 'vs last period',
      icon: 'Clock',
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
    },
  ];
}

/**
 * Merge transactions from multiple providers
 */
export function mergeTransactions(
  transactions: FinanceTransaction[][]
): FinanceTransaction[] {
  const merged = transactions.flat();
  
  // Sort by date descending
  return merged.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * Merge events from multiple providers
 */
export function mergeEvents(events: FinanceEvent[][]): FinanceEvent[] {
  const merged = events.flat();
  
  // Sort by date descending
  return merged.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * Filter transactions/events by source
 */
export function filterBySource<T extends { source: FinanceProvider }>(
  items: T[],
  sources: FinanceProvider[]
): T[] {
  if (sources.length === 0) return items;
  return items.filter(item => sources.includes(item.source));
}

/**
 * Generate module definitions based on connected integrations
 */
export function generateModules(
  connectedProviders: FinanceProvider[],
  data: {
    qbData?: { invoices: number; receivables: number };
    stripeData?: { charges: number; payouts: number };
    shopifyData?: { orders: number; revenue: number };
  }
): FinanceModule[] {
  const modules: FinanceModule[] = [];
  const now = new Date().toISOString();

  if (connectedProviders.includes('quickbooks') && data.qbData) {
    modules.push({
      id: 'qb-invoices',
      title: 'Invoices',
      source: 'quickbooks',
      type: 'metric',
      icon: 'FileText',
      data: {
        value: data.qbData.invoices,
        formattedValue: String(data.qbData.invoices),
      },
      lastUpdated: now,
    });

    modules.push({
      id: 'qb-receivables',
      title: 'Receivables',
      source: 'quickbooks',
      type: 'metric',
      icon: 'Wallet',
      data: {
        value: data.qbData.receivables,
        formattedValue: formatCurrency(data.qbData.receivables),
      },
      lastUpdated: now,
    });
  }

  if (connectedProviders.includes('stripe') && data.stripeData) {
    modules.push({
      id: 'stripe-payments',
      title: 'Payments',
      source: 'stripe',
      type: 'metric',
      icon: 'CreditCard',
      data: {
        value: data.stripeData.charges,
        formattedValue: formatCurrency(data.stripeData.charges),
      },
      lastUpdated: now,
    });

    modules.push({
      id: 'stripe-payouts',
      title: 'Payouts',
      source: 'stripe',
      type: 'metric',
      icon: 'Building2',
      data: {
        value: data.stripeData.payouts,
        formattedValue: formatCurrency(data.stripeData.payouts),
      },
      lastUpdated: now,
    });
  }

  if (connectedProviders.includes('shopify') && data.shopifyData) {
    modules.push({
      id: 'shopify-orders',
      title: 'Orders',
      source: 'shopify',
      type: 'metric',
      icon: 'ShoppingBag',
      data: {
        value: data.shopifyData.orders,
        formattedValue: String(data.shopifyData.orders),
      },
      lastUpdated: now,
    });

    modules.push({
      id: 'shopify-revenue',
      title: 'E-commerce Revenue',
      source: 'shopify',
      type: 'metric',
      icon: 'Store',
      data: {
        value: data.shopifyData.revenue,
        formattedValue: formatCurrency(data.shopifyData.revenue),
      },
      lastUpdated: now,
    });
  }

  return modules;
}

/**
 * Merge payouts from multiple providers
 */
export function mergePayouts(payouts: Payout[][]): Payout[] {
  const merged = payouts.flat();
  
  // Sort by arrival date descending
  return merged.sort((a, b) => 
    new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime()
  );
}

/**
 * Calculate cash flow from transactions
 */
export function calculateCashFlow(transactions: FinanceTransaction[]): {
  inflow: number;
  outflow: number;
  net: number;
} {
  let inflow = 0;
  let outflow = 0;

  for (const tx of transactions) {
    if (tx.type === 'income') {
      inflow += tx.amount;
    } else if (tx.type === 'expense' || tx.type === 'fee' || tx.type === 'refund') {
      outflow += Math.abs(tx.amount);
    }
  }

  return {
    inflow,
    outflow,
    net: inflow - outflow,
  };
}

/**
 * Group transactions by date for trend charts
 */
export function groupByDate(
  transactions: FinanceTransaction[],
  startDate: Date,
  endDate: Date
): Array<{ date: string; value: number }> {
  const dateMap = new Map<string, number>();
  
  // Initialize all dates in range
  const current = new Date(startDate);
  while (current <= endDate) {
    const dateKey = current.toISOString().split('T')[0];
    dateMap.set(dateKey, 0);
    current.setDate(current.getDate() + 1);
  }

  // Aggregate transactions
  for (const tx of transactions) {
    const dateKey = tx.date.split('T')[0];
    if (dateMap.has(dateKey)) {
      const current = dateMap.get(dateKey) || 0;
      if (tx.type === 'income') {
        dateMap.set(dateKey, current + tx.amount);
      } else {
        dateMap.set(dateKey, current - Math.abs(tx.amount));
      }
    }
  }

  // Convert to array
  return Array.from(dateMap.entries()).map(([date, value]) => ({
    date,
    value,
  }));
}

/**
 * Get provider display colors
 */
export function getProviderColors(provider: FinanceProvider): {
  bg: string;
  text: string;
  badge: string;
} {
  const colors = {
    quickbooks: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    stripe: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    shopify: {
      bg: 'bg-lime-50',
      text: 'text-lime-700',
      badge: 'bg-lime-50 text-lime-700 border-lime-200',
    },
  };

  return colors[provider];
}






























































