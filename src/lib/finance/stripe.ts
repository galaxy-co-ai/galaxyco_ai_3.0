/**
 * Stripe API Service
 * 
 * Handles all interactions with Stripe API including:
 * - Charge/payment data
 * - Payout tracking
 * - Balance transactions
 */

import { db } from '@/lib/db';
import { workspaceApiKeys } from '@/db/schema';
import { decryptApiKey } from '@/lib/encryption';
import { logger } from '@/lib/logger';
import { eq, and } from 'drizzle-orm';
import type {
  FinanceTransaction,
  FinanceEvent,
  Payout,
  StripeCharge,
  StripePayout,
  StripeBalanceTransaction,
  StripeRevenueData,
} from '@/types/finance';
import type { ServiceInitResult, StripeListResponse } from './types';

const STRIPE_API_BASE = 'https://api.stripe.com/v1';
const STRIPE_API_VERSION = '2024-06-20';

/**
 * Stripe Service for Finance HQ
 */
export class StripeService {
  private workspaceId: string;
  private apiKey: string | null = null;

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
  }

  /**
   * Initialize the service by fetching and decrypting API key
   */
  async initialize(): Promise<ServiceInitResult> {
    try {
      // Fetch Stripe API key from workspace_api_keys table
      const keyRecord = await db.query.workspaceApiKeys.findFirst({
        where: and(
          eq(workspaceApiKeys.workspaceId, this.workspaceId),
          eq(workspaceApiKeys.provider, 'stripe'),
          eq(workspaceApiKeys.isActive, true)
        ),
      });

      if (!keyRecord) {
        return { success: false, error: 'Stripe API key not configured' };
      }

      // Decrypt the API key
      this.apiKey = decryptApiKey({
        encryptedKey: keyRecord.encryptedKey,
        iv: keyRecord.iv,
        authTag: keyRecord.authTag,
      });

      // Validate the key by making a simple request
      const isValid = await this.validateApiKey();
      if (!isValid) {
        return { success: false, error: 'Invalid Stripe API key' };
      }

      return { success: true };
    } catch (error) {
      logger.error('Stripe initialization failed', error);
      return { success: false, error: 'Failed to initialize Stripe service' };
    }
  }

  /**
   * Validate API key by checking account
   */
  private async validateApiKey(): Promise<boolean> {
    try {
      await this.apiRequest<{ id: string }>('/account');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Make authenticated API request to Stripe
   */
  private async apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Stripe service not initialized');
    }

    const url = `${STRIPE_API_BASE}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Stripe-Version': STRIPE_API_VERSION,
        'Content-Type': 'application/x-www-form-urlencoded',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = (errorData as { error?: { message?: string } }).error?.message || response.statusText;
      logger.error('Stripe API error', new Error(errorMessage), { endpoint, status: response.status });
      throw new Error(`Stripe API error: ${errorMessage}`);
    }

    return response.json();
  }

  /**
   * Get charges (payments)
   */
  async getCharges(options: { limit?: number; startingAfter?: string; created?: { gte?: number; lte?: number } } = {}): Promise<StripeCharge[]> {
    const params = new URLSearchParams();
    params.append('limit', String(options.limit || 100));
    
    if (options.startingAfter) {
      params.append('starting_after', options.startingAfter);
    }
    if (options.created?.gte) {
      params.append('created[gte]', String(options.created.gte));
    }
    if (options.created?.lte) {
      params.append('created[lte]', String(options.created.lte));
    }

    const response = await this.apiRequest<StripeListResponse<StripeCharge>>(
      `/charges?${params.toString()}`
    );
    
    return response.data;
  }

  /**
   * Get payouts
   */
  async getPayouts(options: { limit?: number; created?: { gte?: number; lte?: number } } = {}): Promise<Payout[]> {
    const params = new URLSearchParams();
    params.append('limit', String(options.limit || 100));
    
    if (options.created?.gte) {
      params.append('created[gte]', String(options.created.gte));
    }
    if (options.created?.lte) {
      params.append('created[lte]', String(options.created.lte));
    }

    const response = await this.apiRequest<StripeListResponse<StripePayout>>(
      `/payouts?${params.toString()}`
    );
    
    return response.data.map(p => this.normalizePayout(p));
  }

  /**
   * Get balance transactions
   */
  async getBalanceTransactions(options: { limit?: number; created?: { gte?: number; lte?: number } } = {}): Promise<StripeBalanceTransaction[]> {
    const params = new URLSearchParams();
    params.append('limit', String(options.limit || 100));
    
    if (options.created?.gte) {
      params.append('created[gte]', String(options.created.gte));
    }
    if (options.created?.lte) {
      params.append('created[lte]', String(options.created.lte));
    }

    const response = await this.apiRequest<StripeListResponse<StripeBalanceTransaction>>(
      `/balance_transactions?${params.toString()}`
    );
    
    return response.data;
  }

  /**
   * Get current balance
   */
  async getBalance(): Promise<{ available: number; pending: number }> {
    interface StripeBalance {
      available: Array<{ amount: number; currency: string }>;
      pending: Array<{ amount: number; currency: string }>;
    }
    
    const balance = await this.apiRequest<StripeBalance>('/balance');
    
    // Sum up all currencies (convert to USD equivalent in production)
    const available = balance.available.reduce((sum, b) => sum + b.amount, 0) / 100;
    const pending = balance.pending.reduce((sum, b) => sum + b.amount, 0) / 100;
    
    return { available, pending };
  }

  /**
   * Get revenue data for a date range
   */
  async getRevenueData(startDate: Date, endDate: Date): Promise<StripeRevenueData> {
    const created = {
      gte: Math.floor(startDate.getTime() / 1000),
      lte: Math.floor(endDate.getTime() / 1000),
    };

    const transactions = await this.getBalanceTransactions({ created, limit: 100 });
    
    let charges = 0;
    let fees = 0;
    let refunds = 0;

    for (const tx of transactions) {
      if (tx.type === 'charge') {
        charges += tx.amount / 100;
        fees += tx.fee / 100;
      } else if (tx.type === 'refund') {
        refunds += Math.abs(tx.amount) / 100;
      }
    }

    return { charges, fees, refunds };
  }

  /**
   * Get transactions for activity feed
   */
  async getTransactions(startDate: Date, endDate: Date): Promise<FinanceTransaction[]> {
    const created = {
      gte: Math.floor(startDate.getTime() / 1000),
      lte: Math.floor(endDate.getTime() / 1000),
    };

    const charges = await this.getCharges({ created, limit: 100 });
    
    return charges.map(charge => this.normalizeCharge(charge));
  }

  /**
   * Get timeline events
   */
  async getTimelineEvents(startDate: Date, endDate: Date): Promise<FinanceEvent[]> {
    const created = {
      gte: Math.floor(startDate.getTime() / 1000),
      lte: Math.floor(endDate.getTime() / 1000),
    };

    const [charges, payouts] = await Promise.all([
      this.getCharges({ created, limit: 50 }),
      this.getPayouts({ created }),
    ]);

    const events: FinanceEvent[] = [];

    // Add charge events
    for (const charge of charges) {
      if (charge.status === 'succeeded') {
        events.push({
          id: `stripe_charge_${charge.id}`,
          type: 'invoice_paid',
          source: 'stripe',
          label: `Payment received`,
          description: charge.description || charge.billing_details?.name || 'Customer',
          amount: charge.amount / 100,
          date: new Date(charge.created * 1000).toISOString(),
          metadata: { chargeId: charge.id },
        });
      }
    }

    // Add payout events
    for (const payout of payouts) {
      events.push({
        id: `stripe_payout_${payout.id}`,
        type: 'payout',
        source: 'stripe',
        label: `Payout ${payout.status}`,
        amount: payout.amount,
        date: payout.arrivalDate,
        metadata: { payoutId: payout.id },
      });
    }

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Normalize Stripe charge to internal transaction format
   */
  private normalizeCharge(charge: StripeCharge): FinanceTransaction {
    return {
      id: `stripe_${charge.id}`,
      date: new Date(charge.created * 1000).toISOString(),
      source: 'stripe',
      type: 'income',
      description: charge.description || `Payment from ${charge.billing_details?.name || 'Customer'}`,
      amount: charge.amount / 100,
      currency: charge.currency.toUpperCase(),
      status: charge.status,
      externalId: charge.id,
      metadata: {
        customerId: charge.customer,
        paymentMethod: charge.payment_method_details?.type,
        receiptUrl: charge.receipt_url,
      },
    };
  }

  /**
   * Normalize Stripe payout to internal format
   */
  private normalizePayout(payout: StripePayout): Payout {
    return {
      id: `stripe_${payout.id}`,
      source: 'stripe',
      amount: payout.amount / 100,
      status: payout.status,
      arrivalDate: new Date(payout.arrival_date * 1000).toISOString(),
      createdAt: new Date(payout.created * 1000).toISOString(),
    };
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.apiKey !== null;
  }
}











































