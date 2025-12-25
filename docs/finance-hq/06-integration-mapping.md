# Finance HQ — Integration Mapping Specification (GalaxyCo Tailored)

> **Document Purpose:** Technical mapping of how QuickBooks, Stripe, and Shopify integrate with Finance HQ. Uses GalaxyCo's existing OAuth and encryption infrastructure.

---

## 1. Integration with Existing GalaxyCo Infrastructure

Finance HQ leverages existing infrastructure:

| Existing Component | Location | Usage for Finance |
|-------------------|----------|-------------------|
| OAuth flow | `/lib/oauth.ts` | Extend for QB/Shopify |
| Token encryption | `/lib/encryption.ts` | Encrypt/decrypt API keys |
| Integration table | `/db/schema.ts` → `integrations` | Store connection metadata |
| OAuth tokens table | `/db/schema.ts` → `oauthTokens` | Store encrypted tokens |
| Integration status | `/api/integrations/status/route.ts` | Extend for finance providers |
| useOAuth hook | `/hooks/useOAuth.ts` | Extend for new providers |

---

## 2. Database Schema Modifications

### 2.1 Extend `integrationProviderEnum`

**Current (in `/src/db/schema.ts`):**
```typescript
export const integrationProviderEnum = pgEnum('integration_provider', [
  'google',
  'microsoft',
  'slack',
  'salesforce',
  'hubspot',
]);
```

**Updated:**
```typescript
export const integrationProviderEnum = pgEnum('integration_provider', [
  'google',
  'microsoft',
  'slack',
  'salesforce',
  'hubspot',
  'quickbooks',  // NEW
  'stripe',      // NEW
  'shopify',     // NEW
]);
```

> **Migration Note:** This requires a DB migration. Use `drizzle-kit push` after modifying schema.

### 2.2 Integration Record Structure

Each finance integration creates a record in `integrations` table:

```typescript
{
  id: uuid,
  workspaceId: uuid,
  userId: string, // Clerk user ID
  provider: 'quickbooks' | 'stripe' | 'shopify',
  type: 'finance', // NEW: distinguishes from email/calendar
  name: string, // e.g., "My QuickBooks Account"
  status: 'active' | 'expired' | 'error',
  providerAccountId: string, // External account ID
  email: string | null,
  displayName: string | null,
  scopes: string[], // Granted permissions
  config: {
    companyId?: string, // QuickBooks company ID
    realmId?: string,   // QuickBooks realm
    shopDomain?: string, // Shopify shop domain
  },
  lastSyncAt: timestamp,
  lastError: string | null,
  createdAt: timestamp,
  updatedAt: timestamp,
}
```

---

## 3. QuickBooks Online Integration

### 3.1 OAuth Configuration

**Add to `/src/lib/oauth.ts`:**

```typescript
// Extend OAuthProvider type
export type OAuthProvider = 'google' | 'microsoft' | 'quickbooks' | 'shopify';

// Add to oauthProviders object
quickbooks: {
  clientId: process.env.QUICKBOOKS_CLIENT_ID || '',
  clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET || '',
  authUrl: 'https://appcenter.intuit.com/connect/oauth2',
  tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
  scopes: [
    'com.intuit.quickbooks.accounting',
    'openid',
    'profile',
    'email',
  ],
},
```

### 3.2 QuickBooks API Endpoints Used

| Endpoint | Purpose | Finance HQ Usage |
|----------|---------|------------------|
| `GET /v3/company/{id}/query` | Query entities | Invoices, expenses, customers |
| `POST /v3/company/{id}/invoice` | Create invoice | Invoice creation |
| `GET /v3/company/{id}/reports/ProfitAndLoss` | P&L report | Revenue/expense data |
| `GET /v3/company/{id}/reports/CashFlow` | Cash flow report | Cash flow module |

### 3.3 Data Normalization - QuickBooks

```typescript
// QuickBooks Invoice → Internal Invoice
function normalizeQBInvoice(qbInvoice: QBInvoice): Invoice {
  return {
    id: `qb_${qbInvoice.Id}`,
    invoiceNumber: qbInvoice.DocNumber,
    status: mapQBStatus(qbInvoice.Balance, qbInvoice.DueDate),
    customer: {
      id: `qb_${qbInvoice.CustomerRef.value}`,
      name: qbInvoice.CustomerRef.name,
    },
    dueDate: qbInvoice.DueDate,
    balance: parseFloat(qbInvoice.Balance),
    total: parseFloat(qbInvoice.TotalAmt),
    lineItems: qbInvoice.Line.filter(l => l.DetailType === 'SalesItemLineDetail')
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

function mapQBStatus(balance: string, dueDate: string): Invoice['status'] {
  const balanceNum = parseFloat(balance);
  if (balanceNum === 0) return 'paid';
  if (new Date(dueDate) < new Date()) return 'overdue';
  return 'unpaid';
}
```

### 3.4 Token Refresh

QuickBooks access tokens expire in ~1 hour. Implement refresh:

```typescript
async function refreshQuickBooksToken(integrationId: string): Promise<void> {
  const integration = await getIntegrationWithTokens(integrationId);
  const refreshToken = decryptApiKey(integration.tokens.refreshToken);
  
  const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.QUICKBOOKS_CLIENT_ID!,
      client_secret: process.env.QUICKBOOKS_CLIENT_SECRET!,
    }),
  });
  
  const tokens = await response.json();
  
  // Re-encrypt and save
  await updateOAuthTokens(integrationId, {
    accessToken: encryptApiKey(tokens.access_token),
    refreshToken: tokens.refresh_token 
      ? encryptApiKey(tokens.refresh_token) 
      : integration.tokens.refreshToken,
    expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
  });
}
```

---

## 4. Stripe Integration

### 4.1 Authentication Method

Stripe uses **API keys** instead of OAuth. Store encrypted in database:

```typescript
// Stripe doesn't use OAuth - uses API key
// Store in workspace settings or dedicated field

interface StripeConfig {
  secretKey: string; // Encrypted with AES-256-GCM
  publishableKey?: string;
  webhookSecret?: string; // For webhook verification
}
```

**Storage approach:** Use existing `workspaceApiKeys` table:

```typescript
// Store Stripe API key
await db.insert(workspaceApiKeys).values({
  workspaceId,
  provider: 'stripe',
  name: 'Stripe API Key',
  encryptedKey: encryptedData.encryptedKey,
  iv: encryptedData.iv,
  authTag: encryptedData.authTag,
  createdBy: userId,
});
```

### 4.2 Stripe API Endpoints Used

| Endpoint | Purpose | Finance HQ Usage |
|----------|---------|------------------|
| `GET /v1/charges` | List charges | Revenue data |
| `GET /v1/balance_transactions` | Balance transactions | Net revenue, fees |
| `GET /v1/payouts` | Payouts | Cash flow, payout tracking |
| `GET /v1/subscriptions` | Subscriptions | Recurring revenue |
| `GET /v1/refunds` | Refunds | Revenue adjustments |

### 4.3 Data Normalization - Stripe

```typescript
// Stripe Charge → Internal Transaction
function normalizeStripeCharge(charge: Stripe.Charge): FinanceTransaction {
  return {
    id: `stripe_${charge.id}`,
    date: new Date(charge.created * 1000).toISOString(),
    source: 'stripe',
    type: 'income',
    description: charge.description || `Payment from ${charge.billing_details?.name || 'Customer'}`,
    amount: charge.amount / 100, // Convert from cents
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

// Stripe Payout → Internal Payout
function normalizeStripePayout(payout: Stripe.Payout): Payout {
  return {
    id: `stripe_${payout.id}`,
    source: 'stripe',
    amount: payout.amount / 100,
    status: payout.status,
    arrivalDate: new Date(payout.arrival_date * 1000).toISOString(),
    createdAt: new Date(payout.created * 1000).toISOString(),
  };
}
```

### 4.4 Stripe Service Implementation

```typescript
// /src/lib/finance/stripe.ts
import Stripe from 'stripe';
import { decryptApiKey } from '@/lib/encryption';

export class StripeService {
  private stripe: Stripe | null = null;
  private workspaceId: string;

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
  }

  async initialize(): Promise<boolean> {
    const apiKey = await this.getDecryptedApiKey();
    if (!apiKey) return false;
    
    this.stripe = new Stripe(apiKey, { apiVersion: '2024-06-20' });
    return true;
  }

  private async getDecryptedApiKey(): Promise<string | null> {
    const keyRecord = await db.query.workspaceApiKeys.findFirst({
      where: and(
        eq(workspaceApiKeys.workspaceId, this.workspaceId),
        eq(workspaceApiKeys.provider, 'stripe'),
        eq(workspaceApiKeys.isActive, true)
      ),
    });

    if (!keyRecord) return null;

    return decryptApiKey({
      encryptedKey: keyRecord.encryptedKey,
      iv: keyRecord.iv,
      authTag: keyRecord.authTag,
    });
  }

  async getCharges(options: { limit?: number; starting_after?: string }): Promise<Stripe.Charge[]> {
    if (!this.stripe) throw new Error('Stripe not initialized');
    
    const charges = await this.stripe.charges.list({
      limit: options.limit || 100,
      starting_after: options.starting_after,
    });
    
    return charges.data;
  }

  // ... more methods
}
```

---

## 5. Shopify Integration

### 5.1 OAuth Configuration

**Add to `/src/lib/oauth.ts`:**

```typescript
shopify: {
  clientId: process.env.SHOPIFY_CLIENT_ID || '',
  clientSecret: process.env.SHOPIFY_CLIENT_SECRET || '',
  // Shopify uses per-shop OAuth URLs
  authUrl: 'https://{shop}.myshopify.com/admin/oauth/authorize',
  tokenUrl: 'https://{shop}.myshopify.com/admin/oauth/access_token',
  scopes: [
    'read_orders',
    'read_products',
    'read_customers',
    'read_shopify_payments_payouts',
    'read_shopify_payments_disputes',
  ],
},
```

> **Note:** Shopify requires the shop domain to construct OAuth URLs. This is handled during the OAuth flow.

### 5.2 Shopify API Endpoints Used

| Endpoint | Purpose | Finance HQ Usage |
|----------|---------|------------------|
| `GET /admin/api/2024-01/orders.json` | List orders | Revenue, order data |
| `GET /admin/api/2024-01/orders/{id}/transactions.json` | Order transactions | Payment details |
| `GET /admin/api/2024-01/shopify_payments/payouts.json` | Payouts | Cash flow |
| `GET /admin/api/2024-01/shopify_payments/balance.json` | Balance | Current balance |

### 5.3 Data Normalization - Shopify

```typescript
// Shopify Order → Internal Transaction
function normalizeShopifyOrder(order: ShopifyOrder): FinanceTransaction {
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
```

---

## 6. Unified Data Model

### 6.1 Cross-Provider Transaction

All providers normalize to this common structure:

```typescript
interface FinanceTransaction {
  id: string;                    // Prefixed: qb_123, stripe_abc, shopify_456
  date: string;                  // ISO datetime
  source: 'quickbooks' | 'stripe' | 'shopify';
  type: 'income' | 'expense' | 'transfer' | 'fee' | 'refund';
  description: string;
  amount: number;                // Always in dollars (not cents)
  currency: string;              // 'USD', 'EUR', etc.
  status?: string;
  externalId: string;            // Original ID from provider
  metadata?: Record<string, unknown>;
}
```

### 6.2 Revenue Calculation

```typescript
interface UnifiedRevenue {
  total: number;
  quickbooks: number;  // QB income accounts
  stripe: number;      // Stripe charges - fees - refunds
  shopify: number;     // Shopify orders total
  breakdown: {
    grossRevenue: number;
    fees: number;
    refunds: number;
    netRevenue: number;
  };
}

function calculateUnifiedRevenue(
  qbIncome: number,
  stripeData: { charges: number; fees: number; refunds: number },
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
```

---

## 7. Extend useOAuth Hook

**Modify `/src/hooks/useOAuth.ts`:**

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

type OAuthProvider = 'google' | 'microsoft' | 'quickbooks' | 'shopify';

// Providers that require shop domain input
const SHOP_DOMAIN_PROVIDERS = ['shopify'];

export function useOAuth() {
  const [isConnecting, setIsConnecting] = useState(false);
  const router = useRouter();

  const connect = async (
    provider: OAuthProvider,
    options?: { shopDomain?: string }
  ) => {
    if (isConnecting) return;

    // Shopify requires shop domain
    if (SHOP_DOMAIN_PROVIDERS.includes(provider) && !options?.shopDomain) {
      toast.error('Shop domain is required for Shopify');
      return;
    }

    setIsConnecting(true);

    try {
      const state = Math.random().toString(36).substring(7);
      sessionStorage.setItem('oauth_state', state);

      const redirectUri = `${window.location.origin}/api/auth/oauth/${provider}/callback`;
      let authUrl = `/api/auth/oauth/${provider}/authorize?redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
      
      // Add shop domain for Shopify
      if (options?.shopDomain) {
        authUrl += `&shop=${encodeURIComponent(options.shopDomain)}`;
      }

      window.location.href = authUrl;
    } catch (error) {
      logger.error('OAuth connection error', error);
      toast.error('Failed to connect. Please try again.');
      setIsConnecting(false);
    }
  };

  // ... rest of hook
}
```

---

## 8. Environment Variables Required

Add to `.env.local`:

```bash
# QuickBooks
QUICKBOOKS_CLIENT_ID=your_client_id
QUICKBOOKS_CLIENT_SECRET=your_client_secret

# Shopify
SHOPIFY_CLIENT_ID=your_client_id
SHOPIFY_CLIENT_SECRET=your_client_secret

# Stripe (API key stored per-workspace in DB, but webhook secret is global)
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

## 9. Sync & Refresh Policy

| Provider | Refresh Interval | Token Expiry | Webhook Support |
|----------|------------------|--------------|-----------------|
| QuickBooks | 5-15 minutes | ~1 hour (refresh available) | Limited |
| Stripe | 3 minutes | Never (API key) | Full |
| Shopify | 10 minutes | Never (OAuth) | Full |

### Background Sync (Optional - Trigger.dev)

```typescript
// /src/trigger/finance-sync.ts
import { schedules } from "@trigger.dev/sdk/v3";

export const financeSync = schedules.task({
  id: "finance-sync",
  cron: "*/5 * * * *", // Every 5 minutes
  run: async () => {
    // Sync all workspaces with active finance integrations
    const workspaces = await getWorkspacesWithFinanceIntegrations();
    
    for (const workspace of workspaces) {
      await syncWorkspaceFinanceData(workspace.id);
    }
  },
});
```

---

## End of Integration Mapping Specification


































































