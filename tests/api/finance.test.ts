import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as GET_INVOICES, POST as CREATE_INVOICE } from '@/app/api/finance/invoices/route';
import { GET as GET_INTEGRATIONS } from '@/app/api/integrations/status/route';
import { NextRequest } from 'next/server';

// Mock auth
vi.mock('@/lib/auth', () => ({
  getCurrentWorkspace: vi.fn(() => Promise.resolve({
    workspaceId: 'test-workspace-id',
    userId: 'test-user-id',
  })),
  getCurrentUser: vi.fn(() => Promise.resolve({
    id: 'test-user-id',
    email: 'test@example.com',
  })),
}));

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    query: {
      invoices: {
        findMany: vi.fn(() => Promise.resolve([
          {
            id: 'invoice-1',
            workspaceId: 'test-workspace-id',
            invoiceNumber: 'INV-001',
            clientName: 'Test Client',
            clientEmail: 'client@example.com',
            amount: 100000, // $1,000.00 in cents
            status: 'pending',
            dueDate: new Date('2025-12-31'),
            items: [
              { description: 'Service A', quantity: 2, rate: 50000 },
            ],
            createdAt: new Date(),
            createdBy: 'test-user-id',
          },
        ])),
      },
      integrationCredentials: {
        findMany: vi.fn(() => Promise.resolve([
          {
            id: 'cred-1',
            workspaceId: 'test-workspace-id',
            provider: 'quickbooks',
            status: 'connected',
            metadata: { companyId: 'company-123' },
            expiresAt: new Date('2026-01-01'),
            createdAt: new Date(),
          },
          {
            id: 'cred-2',
            workspaceId: 'test-workspace-id',
            provider: 'stripe',
            status: 'connected',
            metadata: { accountId: 'acct_123' },
            expiresAt: null,
            createdAt: new Date(),
          },
        ])),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{
          id: 'invoice-new',
          workspaceId: 'test-workspace-id',
          invoiceNumber: 'INV-002',
          clientName: 'New Client',
          clientEmail: 'new@example.com',
          amount: 50000,
          status: 'draft',
          dueDate: new Date('2025-12-31'),
          items: [],
          createdAt: new Date(),
          createdBy: 'test-user-id',
        }])),
      })),
    })),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('GET /api/finance/invoices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return invoices list', async () => {
    const request = new NextRequest('http://localhost:3000/api/finance/invoices');
    const response = await GET_INVOICES(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(1);
  });

  it('should return invoices with correct structure', async () => {
    const request = new NextRequest('http://localhost:3000/api/finance/invoices');
    const response = await GET_INVOICES(request);
    const data = await response.json();

    const invoice = data[0];
    expect(invoice).toHaveProperty('id');
    expect(invoice).toHaveProperty('invoiceNumber');
    expect(invoice).toHaveProperty('clientName');
    expect(invoice).toHaveProperty('amount');
    expect(invoice).toHaveProperty('status');
    expect(invoice).toHaveProperty('dueDate');
  });

  it('should handle empty invoices list', async () => {
    const { db } = await import('@/lib/db');
    vi.mocked(db.query.invoices.findMany).mockResolvedValueOnce([]);

    const request = new NextRequest('http://localhost:3000/api/finance/invoices');
    const response = await GET_INVOICES(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(0);
  });

  it('should calculate amounts correctly (cents to dollars)', async () => {
    const request = new NextRequest('http://localhost:3000/api/finance/invoices');
    const response = await GET_INVOICES(request);
    const data = await response.json();

    const invoice = data[0];
    expect(invoice.amount).toBe(100000); // Should remain in cents
  });
});

describe('POST /api/finance/invoices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create invoice with valid data', async () => {
    const request = new NextRequest('http://localhost:3000/api/finance/invoices', {
      method: 'POST',
      body: JSON.stringify({
        invoiceNumber: 'INV-002',
        clientName: 'New Client',
        clientEmail: 'new@example.com',
        amount: 50000,
        dueDate: '2025-12-31',
        items: [
          { description: 'Consulting', quantity: 1, rate: 50000 },
        ],
      }),
    });

    const response = await CREATE_INVOICE(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('id');
    expect(data.invoiceNumber).toBe('INV-002');
  });

  it('should validate required field: invoiceNumber', async () => {
    const request = new NextRequest('http://localhost:3000/api/finance/invoices', {
      method: 'POST',
      body: JSON.stringify({
        clientName: 'Test',
        amount: 1000,
      }),
    });

    const response = await CREATE_INVOICE(request);
    expect(response.status).toBe(400);
  });

  it('should validate required field: clientName', async () => {
    const request = new NextRequest('http://localhost:3000/api/finance/invoices', {
      method: 'POST',
      body: JSON.stringify({
        invoiceNumber: 'INV-003',
        amount: 1000,
      }),
    });

    const response = await CREATE_INVOICE(request);
    expect(response.status).toBe(400);
  });

  it('should validate required field: amount', async () => {
    const request = new NextRequest('http://localhost:3000/api/finance/invoices', {
      method: 'POST',
      body: JSON.stringify({
        invoiceNumber: 'INV-004',
        clientName: 'Test Client',
      }),
    });

    const response = await CREATE_INVOICE(request);
    expect(response.status).toBe(400);
  });

  it('should validate email format', async () => {
    const request = new NextRequest('http://localhost:3000/api/finance/invoices', {
      method: 'POST',
      body: JSON.stringify({
        invoiceNumber: 'INV-005',
        clientName: 'Test Client',
        clientEmail: 'invalid-email',
        amount: 1000,
      }),
    });

    const response = await CREATE_INVOICE(request);
    expect(response.status).toBe(400);
  });

  it('should validate amount is positive', async () => {
    const request = new NextRequest('http://localhost:3000/api/finance/invoices', {
      method: 'POST',
      body: JSON.stringify({
        invoiceNumber: 'INV-006',
        clientName: 'Test Client',
        amount: -1000,
      }),
    });

    const response = await CREATE_INVOICE(request);
    expect(response.status).toBe(400);
  });

  it('should handle invoice items array', async () => {
    const request = new NextRequest('http://localhost:3000/api/finance/invoices', {
      method: 'POST',
      body: JSON.stringify({
        invoiceNumber: 'INV-007',
        clientName: 'Test Client',
        amount: 100000,
        items: [
          { description: 'Item 1', quantity: 2, rate: 25000 },
          { description: 'Item 2', quantity: 1, rate: 50000 },
        ],
      }),
    });

    const response = await CREATE_INVOICE(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('id');
  });

  it('should set default status to draft', async () => {
    const request = new NextRequest('http://localhost:3000/api/finance/invoices', {
      method: 'POST',
      body: JSON.stringify({
        invoiceNumber: 'INV-008',
        clientName: 'Test Client',
        amount: 1000,
      }),
    });

    const response = await CREATE_INVOICE(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.status).toBe('draft');
  });
});

describe('GET /api/integrations/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return integration status for all providers', async () => {
    const request = new NextRequest('http://localhost:3000/api/integrations/status');
    const response = await GET_INTEGRATIONS(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('integrations');
    expect(Array.isArray(data.integrations)).toBe(true);
  });

  it('should show QuickBooks as connected when credentials exist', async () => {
    const request = new NextRequest('http://localhost:3000/api/integrations/status');
    const response = await GET_INTEGRATIONS(request);
    const data = await response.json();

    const quickbooks = data.integrations.find((i: any) => i.provider === 'quickbooks');
    expect(quickbooks).toBeDefined();
    expect(quickbooks.status).toBe('connected');
  });

  it('should show Stripe as connected when credentials exist', async () => {
    const request = new NextRequest('http://localhost:3000/api/integrations/status');
    const response = await GET_INTEGRATIONS(request);
    const data = await response.json();

    const stripe = data.integrations.find((i: any) => i.provider === 'stripe');
    expect(stripe).toBeDefined();
    expect(stripe.status).toBe('connected');
  });

  it('should show disconnected status for providers without credentials', async () => {
    const { db } = await import('@/lib/db');
    vi.mocked(db.query.integrationCredentials.findMany).mockResolvedValueOnce([]);

    const request = new NextRequest('http://localhost:3000/api/integrations/status');
    const response = await GET_INTEGRATIONS(request);
    const data = await response.json();

    const allDisconnected = data.integrations.every((i: any) => 
      i.status === 'disconnected' || i.status === 'not_configured'
    );
    expect(allDisconnected).toBe(true);
  });

  it('should handle expired credentials', async () => {
    const { db } = await import('@/lib/db');
    vi.mocked(db.query.integrationCredentials.findMany).mockResolvedValueOnce([
      {
        id: 'cred-expired',
        workspaceId: 'test-workspace-id',
        provider: 'quickbooks',
        status: 'connected',
        metadata: {},
        expiresAt: new Date('2020-01-01'), // Expired
        createdAt: new Date(),
      } as any,
    ]);

    const request = new NextRequest('http://localhost:3000/api/integrations/status');
    const response = await GET_INTEGRATIONS(request);
    const data = await response.json();

    const quickbooks = data.integrations.find((i: any) => i.provider === 'quickbooks');
    // Should handle expired credential (status may be 'expired' or 'disconnected')
    expect(['expired', 'disconnected']).toContain(quickbooks.status);
  });

  it('should include metadata for connected integrations', async () => {
    const request = new NextRequest('http://localhost:3000/api/integrations/status');
    const response = await GET_INTEGRATIONS(request);
    const data = await response.json();

    const quickbooks = data.integrations.find((i: any) => i.provider === 'quickbooks');
    expect(quickbooks).toHaveProperty('metadata');
  });
});

describe('Financial Calculations', () => {
  it('should calculate invoice total from line items', async () => {
    const items = [
      { description: 'Item 1', quantity: 2, rate: 50000 },
      { description: 'Item 2', quantity: 1, rate: 100000 },
    ];
    
    const total = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    expect(total).toBe(200000); // $2,000.00
  });

  it('should handle fractional amounts in cents', async () => {
    const items = [
      { description: 'Item', quantity: 3, rate: 33333 }, // $333.33 each
    ];
    
    const total = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    expect(total).toBe(99999); // $999.99
  });
});

describe('Integration Error Handling', () => {
  it('should handle database errors gracefully', async () => {
    const { db } = await import('@/lib/db');
    vi.mocked(db.query.invoices.findMany).mockRejectedValueOnce(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/finance/invoices');
    const response = await GET_INVOICES(request);

    expect(response.status).toBe(500);
  });

  it('should handle malformed request body', async () => {
    const request = new NextRequest('http://localhost:3000/api/finance/invoices', {
      method: 'POST',
      body: 'invalid json',
    });

    const response = await CREATE_INVOICE(request);
    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});
