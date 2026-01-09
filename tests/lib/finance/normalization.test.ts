/**
 * Tests for Finance Data Normalization Utilities
 * 
 * Tests currency formatting, revenue calculations, KPI generation,
 * data merging, and provider-specific utilities for Finance HQ.
 */

import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatCurrencyPrecise,
  calculateDelta,
  calculateUnifiedRevenue,
  generateKPIs,
  mergeTransactions,
  mergeEvents,
  filterBySource,
  calculateCashFlow,
  getProviderColors,
} from '@/lib/finance/normalization';
import type {
  FinanceTransaction,
  FinanceEvent,
  StripeRevenueData,
} from '@/types/finance';

describe('finance/normalization', () => {
  describe('formatCurrency', () => {
    it('should format positive values', () => {
      expect(formatCurrency(1000)).toBe('$1,000');
      expect(formatCurrency(1234567)).toBe('$1,234,567');
      expect(formatCurrency(0)).toBe('$0');
    });

    it('should format negative values', () => {
      expect(formatCurrency(-500)).toBe('-$500');
      expect(formatCurrency(-12345)).toBe('-$12,345');
    });

    it('should round to nearest dollar', () => {
      expect(formatCurrency(1234.99)).toBe('$1,235');
      expect(formatCurrency(1234.01)).toBe('$1,234');
      expect(formatCurrency(1234.5)).toBe('$1,235');
    });

    it('should support different currencies', () => {
      expect(formatCurrency(1000, 'EUR')).toBe('€1,000');
      expect(formatCurrency(1000, 'GBP')).toBe('£1,000');
      expect(formatCurrency(1000, 'JPY')).toBe('¥1,000');
    });

    it('should handle large numbers', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000');
      expect(formatCurrency(999999999)).toBe('$999,999,999');
    });

    it('should handle decimal values', () => {
      expect(formatCurrency(1234.56)).toBe('$1,235');
      expect(formatCurrency(99.99)).toBe('$100');
    });
  });

  describe('formatCurrencyPrecise', () => {
    it('should format with cents', () => {
      expect(formatCurrencyPrecise(1000)).toBe('$1,000.00');
      expect(formatCurrencyPrecise(1234.56)).toBe('$1,234.56');
      expect(formatCurrencyPrecise(0)).toBe('$0.00');
    });

    it('should format negative values with cents', () => {
      expect(formatCurrencyPrecise(-500.75)).toBe('-$500.75');
      expect(formatCurrencyPrecise(-0.01)).toBe('-$0.01');
    });

    it('should always show two decimal places', () => {
      expect(formatCurrencyPrecise(100)).toBe('$100.00');
      expect(formatCurrencyPrecise(100.1)).toBe('$100.10');
      expect(formatCurrencyPrecise(100.123)).toBe('$100.12');
    });

    it('should support different currencies', () => {
      expect(formatCurrencyPrecise(1234.56, 'EUR')).toBe('€1,234.56');
      expect(formatCurrencyPrecise(1234.56, 'GBP')).toBe('£1,234.56');
    });

    it('should handle very small amounts', () => {
      expect(formatCurrencyPrecise(0.01)).toBe('$0.01');
      expect(formatCurrencyPrecise(0.99)).toBe('$0.99');
    });
  });

  describe('calculateDelta', () => {
    it('should calculate percentage increase', () => {
      expect(calculateDelta(150, 100)).toBe(50);
      expect(calculateDelta(200, 100)).toBe(100);
      expect(calculateDelta(110, 100)).toBe(10);
    });

    it('should calculate percentage decrease', () => {
      expect(calculateDelta(50, 100)).toBe(-50);
      expect(calculateDelta(75, 100)).toBe(-25);
      expect(calculateDelta(0, 100)).toBe(-100);
    });

    it('should handle zero previous value', () => {
      expect(calculateDelta(100, 0)).toBe(100);
      expect(calculateDelta(0, 0)).toBe(0);
      expect(calculateDelta(-50, 0)).toBe(0);
    });

    it('should round to nearest integer', () => {
      expect(calculateDelta(155, 100)).toBe(55);
      expect(calculateDelta(133, 100)).toBe(33);
    });

    it('should handle negative current values', () => {
      expect(calculateDelta(-50, 100)).toBe(-150);
      expect(calculateDelta(-100, 50)).toBe(-300);
    });

    it('should handle equal values', () => {
      expect(calculateDelta(100, 100)).toBe(0);
      expect(calculateDelta(0, 0)).toBe(0);
    });

    it('should handle decimal inputs', () => {
      expect(calculateDelta(150.5, 100.5)).toBe(50);
      expect(calculateDelta(33.33, 25.0)).toBe(33);
    });
  });

  describe('calculateUnifiedRevenue', () => {
    it('should calculate total revenue from all sources', () => {
      const stripeData: StripeRevenueData = {
        charges: 5000,
        fees: 150,
        refunds: 200,
        disputes: 50,
      };

      const result = calculateUnifiedRevenue(10000, stripeData, 3000);

      expect(result.total).toBe(17650); // 10000 + (5000-150-200) + 3000
      expect(result.quickbooks).toBe(10000);
      expect(result.stripe).toBe(4650);
      expect(result.shopify).toBe(3000);
    });

    it('should handle zero values', () => {
      const stripeData: StripeRevenueData = {
        charges: 0,
        fees: 0,
        refunds: 0,
        disputes: 0,
      };

      const result = calculateUnifiedRevenue(0, stripeData, 0);

      expect(result.total).toBe(0);
      expect(result.quickbooks).toBe(0);
      expect(result.stripe).toBe(0);
      expect(result.shopify).toBe(0);
    });

    it('should calculate breakdown correctly', () => {
      const stripeData: StripeRevenueData = {
        charges: 10000,
        fees: 300,
        refunds: 500,
        disputes: 0,
      };

      const result = calculateUnifiedRevenue(5000, stripeData, 2000);

      expect(result.breakdown.grossRevenue).toBe(17000); // 5000 + 10000 + 2000
      expect(result.breakdown.fees).toBe(300);
      expect(result.breakdown.refunds).toBe(500);
      expect(result.breakdown.netRevenue).toBe(16200); // 5000 + (10000-300-500) + 2000
    });

    it('should handle high fees and refunds', () => {
      const stripeData: StripeRevenueData = {
        charges: 5000,
        fees: 500,
        refunds: 1000,
        disputes: 0,
      };

      const result = calculateUnifiedRevenue(10000, stripeData, 0);

      expect(result.stripe).toBe(3500); // 5000 - 500 - 1000
      expect(result.total).toBe(13500);
    });

    it('should handle negative stripe net revenue', () => {
      const stripeData: StripeRevenueData = {
        charges: 1000,
        fees: 500,
        refunds: 2000,
        disputes: 0,
      };

      const result = calculateUnifiedRevenue(5000, stripeData, 1000);

      expect(result.stripe).toBe(-1500);
      expect(result.total).toBe(4500); // 5000 + (-1500) + 1000
    });
  });

  describe('generateKPIs', () => {
    it('should generate basic KPIs without previous period', () => {
      const kpis = generateKPIs({
        revenue: 50000,
        expenses: 30000,
        profit: 20000,
        cashflow: 15000,
        outstandingInvoices: 5000,
      });

      expect(kpis).toHaveLength(5);
      expect(kpis[0].id).toBe('revenue');
      expect(kpis[0].value).toBe(50000);
      expect(kpis[0].formattedValue).toBe('$50,000');
      expect(kpis[0].delta).toBeUndefined();
    });

    it('should generate KPIs with previous period comparison', () => {
      const kpis = generateKPIs({
        revenue: 60000,
        expenses: 35000,
        profit: 25000,
        cashflow: 20000,
        outstandingInvoices: 4000,
        previousPeriod: {
          revenue: 50000,
          expenses: 30000,
          profit: 20000,
          cashflow: 15000,
          outstandingInvoices: 5000,
        },
      });

      expect(kpis[0].delta).toBe(20); // Revenue +20%
      expect(kpis[1].delta).toBe(17); // Expenses +17%
      expect(kpis[2].delta).toBe(25); // Profit +25%
      expect(kpis[3].delta).toBe(33); // Cashflow +33%
      expect(kpis[4].delta).toBe(-20); // Outstanding -20%
    });

    it('should use correct icons for positive profit', () => {
      const kpis = generateKPIs({
        revenue: 50000,
        expenses: 30000,
        profit: 20000,
        cashflow: 15000,
        outstandingInvoices: 5000,
      });

      const profitKPI = kpis.find((k) => k.id === 'profit');
      expect(profitKPI?.iconColor).toBe('text-emerald-600');
      expect(profitKPI?.iconBg).toBe('bg-emerald-50');
    });

    it('should use correct icons for negative profit', () => {
      const kpis = generateKPIs({
        revenue: 30000,
        expenses: 50000,
        profit: -20000,
        cashflow: 10000,
        outstandingInvoices: 5000,
      });

      const profitKPI = kpis.find((k) => k.id === 'profit');
      expect(profitKPI?.iconColor).toBe('text-red-600');
      expect(profitKPI?.iconBg).toBe('bg-red-50');
    });

    it('should use correct icons for positive cashflow', () => {
      const kpis = generateKPIs({
        revenue: 50000,
        expenses: 30000,
        profit: 20000,
        cashflow: 15000,
        outstandingInvoices: 5000,
      });

      const cashflowKPI = kpis.find((k) => k.id === 'cashflow');
      expect(cashflowKPI?.iconColor).toBe('text-blue-600');
      expect(cashflowKPI?.iconBg).toBe('bg-blue-50');
    });

    it('should use correct icons for negative cashflow', () => {
      const kpis = generateKPIs({
        revenue: 50000,
        expenses: 30000,
        profit: 20000,
        cashflow: -5000,
        outstandingInvoices: 5000,
      });

      const cashflowKPI = kpis.find((k) => k.id === 'cashflow');
      expect(cashflowKPI?.iconColor).toBe('text-amber-600');
      expect(cashflowKPI?.iconBg).toBe('bg-amber-50');
    });

    it('should include deltaLabel for all KPIs', () => {
      const kpis = generateKPIs({
        revenue: 50000,
        expenses: 30000,
        profit: 20000,
        cashflow: 15000,
        outstandingInvoices: 5000,
        previousPeriod: {
          revenue: 40000,
          expenses: 25000,
          profit: 15000,
          cashflow: 10000,
          outstandingInvoices: 4000,
        },
      });

      kpis.forEach((kpi) => {
        expect(kpi.deltaLabel).toBe('vs last period');
      });
    });

    it('should handle zero values', () => {
      const kpis = generateKPIs({
        revenue: 0,
        expenses: 0,
        profit: 0,
        cashflow: 0,
        outstandingInvoices: 0,
      });

      expect(kpis[0].formattedValue).toBe('$0');
      expect(kpis[0].value).toBe(0);
    });
  });

  describe('mergeTransactions', () => {
    it('should merge transactions from multiple sources', () => {
      const qbTransactions: FinanceTransaction[] = [
        {
          id: 'qb-1',
          date: new Date('2024-01-15'),
          description: 'Invoice payment',
          amount: 1000,
          source: 'quickbooks',
          type: 'income',
          category: 'Sales',
        },
      ];

      const stripeTransactions: FinanceTransaction[] = [
        {
          id: 'stripe-1',
          date: new Date('2024-01-16'),
          description: 'Online payment',
          amount: 500,
          source: 'stripe',
          type: 'income',
          category: 'Revenue',
        },
      ];

      const result = mergeTransactions([qbTransactions, stripeTransactions]);

      expect(result).toHaveLength(2);
      expect(result[0].source).toBe('stripe'); // Sorted by date desc
      expect(result[1].source).toBe('quickbooks');
    });

    it('should sort merged transactions by date descending', () => {
      const transactions: FinanceTransaction[] = [
        {
          id: 't1',
          date: new Date('2024-01-10'),
          description: 'Old',
          amount: 100,
          source: 'quickbooks',
          type: 'income',
          category: 'Sales',
        },
        {
          id: 't2',
          date: new Date('2024-01-20'),
          description: 'New',
          amount: 200,
          source: 'stripe',
          type: 'income',
          category: 'Revenue',
        },
        {
          id: 't3',
          date: new Date('2024-01-15'),
          description: 'Middle',
          amount: 150,
          source: 'shopify',
          type: 'income',
          category: 'Sales',
        },
      ];

      const result = mergeTransactions([[transactions[0]], [transactions[1]], [transactions[2]]]);

      expect(result[0].description).toBe('New');
      expect(result[1].description).toBe('Middle');
      expect(result[2].description).toBe('Old');
    });

    it('should handle empty arrays', () => {
      const result = mergeTransactions([], []);
      expect(result).toHaveLength(0);
    });

    it('should handle single source', () => {
      const transactions: FinanceTransaction[] = [
        {
          id: 't1',
          date: new Date(),
          description: 'Test',
          amount: 100,
          source: 'quickbooks',
          type: 'income',
          category: 'Sales',
        },
      ];

      const result = mergeTransactions(transactions);
      expect(result).toHaveLength(1);
    });
  });

  describe('mergeEvents', () => {
    it('should merge events from multiple sources', () => {
      const qbEvents: FinanceEvent[] = [
        {
          id: 'qb-e1',
          date: new Date('2024-01-15'),
          title: 'Invoice sent',
          source: 'quickbooks',
          type: 'invoice',
          amount: 1000,
        },
      ];

      const stripeEvents: FinanceEvent[] = [
        {
          id: 'stripe-e1',
          date: new Date('2024-01-16'),
          title: 'Payment received',
          source: 'stripe',
          type: 'payment',
          amount: 500,
        },
      ];

      const result = mergeEvents([qbEvents, stripeEvents]);

      expect(result).toHaveLength(2);
      expect(result[0].source).toBe('stripe'); // Sorted by date desc
      expect(result[1].source).toBe('quickbooks');
    });

    it('should sort merged events by date descending', () => {
      const events: FinanceEvent[] = [
        {
          id: 'e1',
          date: new Date('2024-01-10'),
          title: 'Old event',
          source: 'quickbooks',
          type: 'invoice',
          amount: 100,
        },
        {
          id: 'e2',
          date: new Date('2024-01-20'),
          title: 'New event',
          source: 'stripe',
          type: 'payment',
          amount: 200,
        },
      ];

      const result = mergeEvents([[events[0]], [events[1]]]);

      expect(result[0].title).toBe('New event');
      expect(result[1].title).toBe('Old event');
    });

    it('should handle empty arrays', () => {
      const result = mergeEvents([], []);
      expect(result).toHaveLength(0);
    });
  });

  describe('filterBySource', () => {
    const transactions: FinanceTransaction[] = [
      {
        id: 't1',
        date: new Date(),
        description: 'QB Transaction',
        amount: 100,
        source: 'quickbooks',
        type: 'income',
        category: 'Sales',
      },
      {
        id: 't2',
        date: new Date(),
        description: 'Stripe Transaction',
        amount: 200,
        source: 'stripe',
        type: 'income',
        category: 'Revenue',
      },
      {
        id: 't3',
        date: new Date(),
        description: 'Shopify Transaction',
        amount: 150,
        source: 'shopify',
        type: 'income',
        category: 'Sales',
      },
    ];

    it('should filter by quickbooks source', () => {
      const result = filterBySource(transactions, ['quickbooks']);
      expect(result).toHaveLength(1);
      expect(result[0].source).toBe('quickbooks');
    });

    it('should filter by stripe source', () => {
      const result = filterBySource(transactions, ['stripe']);
      expect(result).toHaveLength(1);
      expect(result[0].source).toBe('stripe');
    });

    it('should filter by shopify source', () => {
      const result = filterBySource(transactions, ['shopify']);
      expect(result).toHaveLength(1);
      expect(result[0].source).toBe('shopify');
    });

    it('should return all items when filtering by all sources', () => {
      const result = filterBySource(transactions, ['quickbooks', 'stripe', 'shopify']);
      expect(result).toHaveLength(3);
    });

    it('should handle empty array', () => {
      const result = filterBySource([], ['quickbooks']);
      expect(result).toHaveLength(0);
    });
  });

  describe('calculateCashFlow', () => {
    it('should calculate positive cash flow', () => {
      const transactions: FinanceTransaction[] = [
        {
          id: 't1',
          date: new Date(),
          description: 'Income',
          amount: 5000,
          source: 'quickbooks',
          type: 'income',
          category: 'Sales',
        },
        {
          id: 't2',
          date: new Date(),
          description: 'Expense',
          amount: -2000,
          source: 'quickbooks',
          type: 'expense',
          category: 'Operating',
        },
      ];

      const result = calculateCashFlow(transactions);
      expect(result.inflow).toBe(5000);
      expect(result.outflow).toBe(2000);
      expect(result.net).toBe(3000);
    });

    it('should calculate negative cash flow', () => {
      const transactions: FinanceTransaction[] = [
        {
          id: 't1',
          date: new Date(),
          description: 'Income',
          amount: 1000,
          source: 'quickbooks',
          type: 'income',
          category: 'Sales',
        },
        {
          id: 't2',
          date: new Date(),
          description: 'Expense',
          amount: -5000,
          source: 'quickbooks',
          type: 'expense',
          category: 'Operating',
        },
      ];

      const result = calculateCashFlow(transactions);
      expect(result.inflow).toBe(1000);
      expect(result.outflow).toBe(5000);
      expect(result.net).toBe(-4000);
    });

    it('should handle empty transactions', () => {
      const result = calculateCashFlow([]);
      expect(result.inflow).toBe(0);
      expect(result.outflow).toBe(0);
      expect(result.net).toBe(0);
    });

    it('should sum all transaction amounts', () => {
      const transactions: FinanceTransaction[] = [
        {
          id: 't1',
          date: new Date(),
          description: 'Income 1',
          amount: 1000,
          source: 'quickbooks',
          type: 'income',
          category: 'Sales',
        },
        {
          id: 't2',
          date: new Date(),
          description: 'Income 2',
          amount: 500,
          source: 'stripe',
          type: 'income',
          category: 'Revenue',
        },
        {
          id: 't3',
          date: new Date(),
          description: 'Expense 1',
          amount: -300,
          source: 'quickbooks',
          type: 'expense',
          category: 'Operating',
        },
      ];

      const result = calculateCashFlow(transactions);
      expect(result.inflow).toBe(1500);
      expect(result.outflow).toBe(300);
      expect(result.net).toBe(1200);
    });
  });

  describe('getProviderColors', () => {
    it('should return quickbooks colors', () => {
      const colors = getProviderColors('quickbooks');
      expect(colors.bg).toBeDefined();
      expect(colors.text).toBeDefined();
      expect(colors.badge).toBeDefined();
    });

    it('should return stripe colors', () => {
      const colors = getProviderColors('stripe');
      expect(colors.bg).toBeDefined();
      expect(colors.text).toBeDefined();
      expect(colors.badge).toBeDefined();
    });

    it('should return shopify colors', () => {
      const colors = getProviderColors('shopify');
      expect(colors.bg).toBeDefined();
      expect(colors.text).toBeDefined();
      expect(colors.badge).toBeDefined();
    });

    it('should return different colors for each provider', () => {
      const qbColors = getProviderColors('quickbooks');
      const stripeColors = getProviderColors('stripe');
      const shopifyColors = getProviderColors('shopify');

      expect(qbColors.bg).not.toBe(stripeColors.bg);
      expect(stripeColors.bg).not.toBe(shopifyColors.bg);
    });
  });

  describe('edge cases', () => {
    it('should handle very large currency values', () => {
      const formatted = formatCurrency(999999999999);
      expect(formatted).toContain('$');
      expect(formatted).toContain(',');
    });

    it('should handle very small decimal values', () => {
      const formatted = formatCurrencyPrecise(0.001);
      expect(formatted).toBe('$0.00');
    });

    it('should handle division by zero in delta calculation', () => {
      const delta = calculateDelta(100, 0);
      expect(delta).toBe(100);
    });

    it('should handle all zero revenue sources', () => {
      const stripeData: StripeRevenueData = {
        charges: 0,
        fees: 0,
        refunds: 0,
        disputes: 0,
      };

      const result = calculateUnifiedRevenue(0, stripeData, 0);
      expect(result.total).toBe(0);
      expect(result.breakdown.netRevenue).toBe(0);
    });

    it('should handle mixed positive and negative transaction amounts', () => {
      const transactions: FinanceTransaction[] = [
        {
          id: 't1',
          date: new Date(),
          description: 'Income',
          amount: 1000,
          source: 'quickbooks',
          type: 'income',
          category: 'Sales',
        },
        {
          id: 't2',
          date: new Date(),
          description: 'Refund',
          amount: -500,
          source: 'stripe',
          type: 'refund',
          category: 'Refunds',
        },
        {
          id: 't3',
          date: new Date(),
          description: 'Income',
          amount: 750,
          source: 'shopify',
          type: 'income',
          category: 'Sales',
        },
      ];

      const result = calculateCashFlow(transactions);
      expect(result.net).toBe(1250);
    });
  });
});
