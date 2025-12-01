/**
 * QuickBooks Online API Service
 * 
 * Handles all interactions with QuickBooks API including:
 * - Invoice management
 * - Revenue/expense data
 * - Cash flow reports
 */

import { db } from '@/lib/db';
import { integrations, oauthTokens } from '@/db/schema';
import { decryptApiKey } from '@/lib/encryption';
import { logger } from '@/lib/logger';
import { eq, and } from 'drizzle-orm';
import type {
  Invoice,
  QBInvoice,
  GetInvoicesOptions,
  FinanceTransaction,
  FinanceEvent,
} from '@/types/finance';
import type {
  ServiceInitResult,
  QBQueryResponse,
  AggregatedFinancials,
} from './types';

const QUICKBOOKS_API_BASE = 'https://quickbooks.api.intuit.com/v3/company';

/**
 * QuickBooks Service for Finance HQ
 */
export class QuickBooksService {
  private workspaceId: string;
  private accessToken: string | null = null;
  private companyId: string | null = null;
  private integrationId: string | null = null;

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
  }

  /**
   * Initialize the service by fetching and decrypting OAuth token
   */
  async initialize(): Promise<ServiceInitResult> {
    try {
      // Fetch integration with tokens
      const integration = await db.query.integrations.findFirst({
        where: and(
          eq(integrations.workspaceId, this.workspaceId),
          eq(integrations.provider, 'quickbooks'),
          eq(integrations.status, 'active')
        ),
      });

      if (!integration) {
        return { success: false, error: 'QuickBooks not connected' };
      }

      // Get OAuth tokens
      const tokens = await db.query.oauthTokens.findFirst({
        where: eq(oauthTokens.integrationId, integration.id),
      });

      if (!tokens) {
        return { success: false, error: 'OAuth tokens not found' };
      }

      // Check token expiration
      if (tokens.expiresAt && new Date(tokens.expiresAt) < new Date()) {
        // Token expired - attempt refresh
        const refreshed = await this.refreshToken(integration.id, tokens.refreshToken);
        if (!refreshed.success) {
          return { success: false, error: 'Token expired and refresh failed' };
        }
        this.accessToken = refreshed.accessToken ?? null;
      } else {
        // Decrypt access token
        this.accessToken = decryptApiKey(tokens.accessToken);
      }

      // Get company ID from integration config
      const config = integration.config as { companyId?: string; realmId?: string } | null;
      this.companyId = config?.companyId || config?.realmId || null;
      this.integrationId = integration.id;

      if (!this.companyId) {
        return { success: false, error: 'QuickBooks company ID not configured' };
      }

      return { success: true };
    } catch (error) {
      logger.error('QuickBooks initialization failed', error);
      return { success: false, error: 'Failed to initialize QuickBooks service' };
    }
  }

  /**
   * Refresh expired OAuth token
   */
  private async refreshToken(
    integrationId: string,
    encryptedRefreshToken: string | null
  ): Promise<{ success: boolean; accessToken?: string }> {
    if (!encryptedRefreshToken) {
      return { success: false };
    }

    try {
      const refreshToken = decryptApiKey(encryptedRefreshToken);
      
      const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: process.env.QUICKBOOKS_CLIENT_ID || '',
          client_secret: process.env.QUICKBOOKS_CLIENT_SECRET || '',
        }),
      });

      if (!response.ok) {
        logger.error('QuickBooks token refresh failed', new Error(await response.text()));
        return { success: false };
      }

      const data = await response.json();
      
      // Update tokens in database
      const { encryptApiKey } = await import('@/lib/encryption');
      await db.update(oauthTokens)
        .set({
          accessToken: encryptApiKey(data.access_token).encryptedKey,
          refreshToken: data.refresh_token 
            ? encryptApiKey(data.refresh_token).encryptedKey 
            : encryptedRefreshToken,
          expiresAt: new Date(Date.now() + data.expires_in * 1000),
          updatedAt: new Date(),
        })
        .where(eq(oauthTokens.integrationId, integrationId));

      return { success: true, accessToken: data.access_token };
    } catch (error) {
      logger.error('QuickBooks token refresh error', error);
      return { success: false };
    }
  }

  /**
   * Make authenticated API request to QuickBooks
   */
  private async apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.accessToken || !this.companyId) {
      throw new Error('QuickBooks service not initialized');
    }

    const url = `${QUICKBOOKS_API_BASE}/${this.companyId}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('QuickBooks API error', new Error(errorText), { endpoint, status: response.status });
      throw new Error(`QuickBooks API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Execute a QuickBooks query
   */
  private async query<T>(sql: string): Promise<T[]> {
    const response = await this.apiRequest<QBQueryResponse<T>>(
      `/query?query=${encodeURIComponent(sql)}`
    );
    
    // Extract the data from the response
    // QuickBooks returns data in a key matching the entity type (e.g., "Invoice", "Customer")
    const keys = Object.keys(response.QueryResponse).filter(
      k => k !== 'maxResults' && k !== 'startPosition' && k !== 'totalCount'
    );
    
    if (keys.length === 0) {
      return [];
    }
    
    const data = response.QueryResponse[keys[0]];
    // Ensure we return an array (filter out metadata fields)
    return Array.isArray(data) ? data : [];
  }

  /**
   * Get invoices from QuickBooks
   */
  async getInvoices(options: GetInvoicesOptions = {}): Promise<Invoice[]> {
    const { startDate, endDate, status = 'all', limit = 50 } = options;

    let sql = `SELECT * FROM Invoice`;
    const conditions: string[] = [];

    if (startDate) {
      conditions.push(`TxnDate >= '${startDate.toISOString().split('T')[0]}'`);
    }
    if (endDate) {
      conditions.push(`TxnDate <= '${endDate.toISOString().split('T')[0]}'`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ` ORDERBY TxnDate DESC MAXRESULTS ${limit}`;

    const qbInvoices = await this.query<QBInvoice>(sql);
    
    // Normalize and filter by status
    return qbInvoices
      .map(inv => this.normalizeInvoice(inv))
      .filter(inv => status === 'all' || inv.status === status);
  }

  /**
   * Get a single invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    try {
      const response = await this.apiRequest<{ Invoice: QBInvoice }>(
        `/invoice/${invoiceId}`
      );
      return this.normalizeInvoice(response.Invoice);
    } catch {
      return null;
    }
  }

  /**
   * Send payment reminder for an invoice
   */
  async sendInvoiceReminder(invoiceId: string): Promise<{ sentTo: string; sentAt: string }> {
    // QuickBooks API endpoint for sending invoice
    await this.apiRequest(`/invoice/${invoiceId}/send`, {
      method: 'POST',
    });

    // Get invoice to retrieve customer email
    const invoice = await this.getInvoice(invoiceId);
    
    return {
      sentTo: invoice?.customer.email || 'customer',
      sentAt: new Date().toISOString(),
    };
  }

  /**
   * Get aggregated financial data
   */
  async getFinancials(startDate: Date, endDate: Date): Promise<AggregatedFinancials> {
    // Query profit and loss report
    const reportUrl = `/reports/ProfitAndLoss?start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`;
    
    try {
      const report = await this.apiRequest<Record<string, unknown>>(reportUrl);
      
      // Parse report data - structure varies, so we use a safe approach
      const revenue = this.extractReportValue(report, 'TotalIncome') || 0;
      const expenses = this.extractReportValue(report, 'TotalExpenses') || 0;
      const profit = revenue - expenses;

      return {
        revenue,
        expenses,
        profit,
        cashflow: profit, // Simplified - could use CashFlow report
      };
    } catch {
      // Return zeros if report fails
      return { revenue: 0, expenses: 0, profit: 0, cashflow: 0 };
    }
  }

  /**
   * Get recent transactions for activity feed
   */
  async getTransactions(startDate: Date, endDate: Date): Promise<FinanceTransaction[]> {
    const sql = `SELECT * FROM Invoice WHERE TxnDate >= '${startDate.toISOString().split('T')[0]}' AND TxnDate <= '${endDate.toISOString().split('T')[0]}' ORDERBY TxnDate DESC MAXRESULTS 100`;
    
    const invoices = await this.query<QBInvoice>(sql);
    
    return invoices.map(inv => ({
      id: `qb_inv_${inv.Id}`,
      date: inv.TxnDate,
      source: 'quickbooks' as const,
      type: 'income' as const,
      description: `Invoice #${inv.DocNumber} - ${inv.CustomerRef.name}`,
      amount: parseFloat(inv.TotalAmt),
      currency: 'USD',
      status: parseFloat(inv.Balance) === 0 ? 'paid' : 'unpaid',
      externalId: inv.Id,
    }));
  }

  /**
   * Get timeline events
   */
  async getTimelineEvents(startDate: Date, endDate: Date): Promise<FinanceEvent[]> {
    const invoices = await this.getInvoices({ startDate, endDate });
    
    const events: FinanceEvent[] = [];
    
    for (const inv of invoices) {
      // Invoice created event
      events.push({
        id: `qb_created_${inv.id}`,
        type: 'invoice_created',
        source: 'quickbooks',
        label: `Invoice #${inv.invoiceNumber} created`,
        description: inv.customer.name,
        amount: inv.total,
        date: inv.createdAt,
      });

      // Invoice paid event (if paid)
      if (inv.status === 'paid') {
        events.push({
          id: `qb_paid_${inv.id}`,
          type: 'invoice_paid',
          source: 'quickbooks',
          label: `Invoice #${inv.invoiceNumber} paid`,
          description: inv.customer.name,
          amount: inv.total,
          date: inv.updatedAt,
        });
      }
    }

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Normalize QuickBooks invoice to internal format
   */
  private normalizeInvoice(qbInvoice: QBInvoice): Invoice {
    const balance = parseFloat(qbInvoice.Balance);
    const dueDate = new Date(qbInvoice.DueDate);
    const now = new Date();

    let status: Invoice['status'];
    if (balance === 0) {
      status = 'paid';
    } else if (dueDate < now) {
      status = 'overdue';
    } else {
      status = 'unpaid';
    }

    return {
      id: `qb_${qbInvoice.Id}`,
      invoiceNumber: qbInvoice.DocNumber,
      status,
      customer: {
        id: `qb_${qbInvoice.CustomerRef.value}`,
        name: qbInvoice.CustomerRef.name,
      },
      dueDate: qbInvoice.DueDate,
      balance,
      total: parseFloat(qbInvoice.TotalAmt),
      lineItems: qbInvoice.Line
        .filter(l => l.DetailType === 'SalesItemLineDetail')
        .map(l => ({
          description: l.Description || l.SalesItemLineDetail?.ItemRef?.name || '',
          quantity: l.SalesItemLineDetail?.Qty || 1,
          unitPrice: l.SalesItemLineDetail?.UnitPrice || 0,
          amount: l.Amount,
        })),
      createdAt: qbInvoice.MetaData.CreateTime,
      updatedAt: qbInvoice.MetaData.LastUpdatedTime,
      source: 'quickbooks',
      externalId: qbInvoice.Id,
    };
  }

  /**
   * Extract value from QuickBooks report structure
   */
  private extractReportValue(report: Record<string, unknown>, key: string): number {
    // QuickBooks reports have complex nested structures
    // This is a simplified extraction - in production, parse the full structure
    try {
      const rows = (report as { Rows?: { Row?: Array<{ Summary?: { ColData?: Array<{ value?: string }> }; group?: string }> } }).Rows?.Row || [];
      for (const row of rows) {
        if (row.group === key || row.Summary) {
          const colData = row.Summary?.ColData;
          if (colData && colData[1]) {
            return parseFloat(colData[1].value || '0') || 0;
          }
        }
      }
    } catch {
      // Ignore parsing errors
    }
    return 0;
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.accessToken !== null && this.companyId !== null;
  }
}

