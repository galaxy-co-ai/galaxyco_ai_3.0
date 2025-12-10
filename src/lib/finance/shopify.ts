/**
 * Shopify API Service
 * 
 * Handles all interactions with Shopify Admin API including:
 * - Order data
 * - Payout tracking
 * - Revenue calculations
 */

import { db } from '@/lib/db';
import { integrations, oauthTokens } from '@/db/schema';
import { decryptApiKey } from '@/lib/encryption';
import { logger } from '@/lib/logger';
import { eq, and } from 'drizzle-orm';
import type {
  FinanceTransaction,
  FinanceEvent,
  Payout,
  ShopifyOrder,
  ShopifyPayout,
} from '@/types/finance';
import type { ServiceInitResult } from './types';

const SHOPIFY_API_VERSION = '2024-01';

/**
 * Shopify Service for Finance HQ
 */
export class ShopifyService {
  private workspaceId: string;
  private accessToken: string | null = null;
  private shopDomain: string | null = null;

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
  }

  /**
   * Initialize the service by fetching shop domain and OAuth token
   */
  async initialize(): Promise<ServiceInitResult> {
    try {
      // Fetch integration
      const integration = await db.query.integrations.findFirst({
        where: and(
          eq(integrations.workspaceId, this.workspaceId),
          eq(integrations.provider, 'shopify'),
          eq(integrations.status, 'active')
        ),
      });

      if (!integration) {
        return { success: false, error: 'Shopify not connected' };
      }

      // Get shop domain from config
      const config = integration.config as { shopDomain?: string } | null;
      this.shopDomain = config?.shopDomain || null;

      if (!this.shopDomain) {
        return { success: false, error: 'Shopify shop domain not configured' };
      }

      // Get OAuth tokens
      const tokens = await db.query.oauthTokens.findFirst({
        where: eq(oauthTokens.integrationId, integration.id),
      });

      if (!tokens) {
        return { success: false, error: 'OAuth tokens not found' };
      }

      // Decrypt access token (Shopify tokens don't expire)
      this.accessToken = decryptApiKey(tokens.accessToken);

      return { success: true };
    } catch (error) {
      logger.error('Shopify initialization failed', error);
      return { success: false, error: 'Failed to initialize Shopify service' };
    }
  }

  /**
   * Make authenticated API request to Shopify
   */
  private async apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.accessToken || !this.shopDomain) {
      throw new Error('Shopify service not initialized');
    }

    const url = `https://${this.shopDomain}/admin/api/${SHOPIFY_API_VERSION}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'X-Shopify-Access-Token': this.accessToken,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Shopify API error', new Error(errorText), { endpoint, status: response.status });
      throw new Error(`Shopify API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get orders
   */
  async getOrders(options: {
    createdAtMin?: Date;
    createdAtMax?: Date;
    limit?: number;
    status?: string;
  } = {}): Promise<ShopifyOrder[]> {
    const params = new URLSearchParams();
    params.append('limit', String(options.limit || 100));
    params.append('status', options.status || 'any');
    
    if (options.createdAtMin) {
      params.append('created_at_min', options.createdAtMin.toISOString());
    }
    if (options.createdAtMax) {
      params.append('created_at_max', options.createdAtMax.toISOString());
    }

    const response = await this.apiRequest<{ orders: ShopifyOrder[] }>(
      `/orders.json?${params.toString()}`
    );
    
    return response.orders;
  }

  /**
   * Get payouts
   */
  async getPayouts(options: { limit?: number } = {}): Promise<Payout[]> {
    try {
      const params = new URLSearchParams();
      params.append('limit', String(options.limit || 100));

      const response = await this.apiRequest<{ payouts: ShopifyPayout[] }>(
        `/shopify_payments/payouts.json?${params.toString()}`
      );
      
      return response.payouts.map(p => this.normalizePayout(p));
    } catch {
      // Shopify Payments may not be available for all shops
      return [];
    }
  }

  /**
   * Get current balance
   */
  async getBalance(): Promise<{ available: number; pending: number }> {
    try {
      interface ShopifyBalance {
        balance: Array<{ amount: string; currency: string }>;
      }
      
      const response = await this.apiRequest<ShopifyBalance>(
        '/shopify_payments/balance.json'
      );
      
      const available = response.balance.reduce((sum, b) => sum + parseFloat(b.amount), 0);
      
      return { available, pending: 0 };
    } catch {
      // Shopify Payments may not be available
      return { available: 0, pending: 0 };
    }
  }

  /**
   * Get revenue data for a date range
   */
  async getRevenueData(startDate: Date, endDate: Date): Promise<{ total: number; orderCount: number }> {
    const orders = await this.getOrders({
      createdAtMin: startDate,
      createdAtMax: endDate,
      status: 'any',
    });

    // Filter for paid orders and sum total
    const paidOrders = orders.filter(o => 
      o.financial_status === 'paid' || 
      o.financial_status === 'partially_paid' ||
      o.financial_status === 'partially_refunded'
    );

    const total = paidOrders.reduce((sum, o) => sum + parseFloat(o.total_price), 0);

    return { total, orderCount: paidOrders.length };
  }

  /**
   * Get transactions for activity feed
   */
  async getTransactions(startDate: Date, endDate: Date): Promise<FinanceTransaction[]> {
    const orders = await this.getOrders({
      createdAtMin: startDate,
      createdAtMax: endDate,
    });
    
    return orders.map(order => this.normalizeOrder(order));
  }

  /**
   * Get timeline events
   */
  async getTimelineEvents(startDate: Date, endDate: Date): Promise<FinanceEvent[]> {
    const [orders, payouts] = await Promise.all([
      this.getOrders({ createdAtMin: startDate, createdAtMax: endDate }),
      this.getPayouts(),
    ]);

    const events: FinanceEvent[] = [];

    // Add order events
    for (const order of orders) {
      events.push({
        id: `shopify_order_${order.id}`,
        type: 'order',
        source: 'shopify',
        label: `Order #${order.order_number}`,
        description: order.email || 'Customer',
        amount: parseFloat(order.total_price),
        date: order.created_at,
        metadata: {
          orderId: order.id,
          financialStatus: order.financial_status,
          fulfillmentStatus: order.fulfillment_status,
        },
      });
    }

    // Add payout events (filter by date)
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    
    for (const payout of payouts) {
      const payoutTime = new Date(payout.arrivalDate).getTime();
      if (payoutTime >= startTime && payoutTime <= endTime) {
        events.push({
          id: `shopify_payout_${payout.id}`,
          type: 'payout',
          source: 'shopify',
          label: `Payout ${payout.status}`,
          amount: payout.amount,
          date: payout.arrivalDate,
          metadata: { payoutId: payout.id },
        });
      }
    }

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Normalize Shopify order to internal transaction format
   */
  private normalizeOrder(order: ShopifyOrder): FinanceTransaction {
    return {
      id: `shopify_${order.id}`,
      date: order.created_at,
      source: 'shopify',
      type: 'income',
      description: `Order #${order.order_number}`,
      amount: parseFloat(order.total_price),
      currency: order.currency,
      status: order.financial_status,
      externalId: order.id.toString(),
      metadata: {
        orderNumber: order.order_number,
        customerEmail: order.email,
        itemCount: order.line_items?.length || 0,
        fulfillmentStatus: order.fulfillment_status,
      },
    };
  }

  /**
   * Normalize Shopify payout to internal format
   */
  private normalizePayout(payout: ShopifyPayout): Payout {
    return {
      id: `shopify_${payout.id}`,
      source: 'shopify',
      amount: parseFloat(payout.amount),
      status: payout.status,
      arrivalDate: payout.date,
    };
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.accessToken !== null && this.shopDomain !== null;
  }
}











































