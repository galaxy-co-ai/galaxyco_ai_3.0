import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/workflows/route';
import { GET as GET_BY_ID, PATCH, DELETE } from '@/app/api/workflows/[id]/route';
import { POST as EXECUTE } from '@/app/api/workflows/[id]/execute/route';
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
      agents: {
        findMany: vi.fn(() => Promise.resolve([
          {
            id: 'workflow-1',
            workspaceId: 'test-workspace-id',
            name: 'Test Workflow',
            description: 'A test workflow',
            type: 'custom',
            status: 'active',
            config: { nodes: [{ id: 'node-1' }, { id: 'node-2' }] },
            executionCount: 5,
            createdAt: new Date(),
            lastExecutedAt: new Date(),
            createdBy: 'test-user-id',
          },
        ])),
        findFirst: vi.fn(() => Promise.resolve({
          id: 'workflow-1',
          workspaceId: 'test-workspace-id',
          name: 'Test Workflow',
          description: 'A test workflow',
          type: 'custom',
          status: 'active',
          config: { nodes: [], systemPrompt: 'Test prompt' },
          executionCount: 5,
          createdAt: new Date(),
          lastExecutedAt: new Date(),
          createdBy: 'test-user-id',
        })),
      },
      agentExecutions: {
        findMany: vi.fn(() => Promise.resolve([])),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{
          id: 'workflow-new',
          workspaceId: 'test-workspace-id',
          name: 'New Workflow',
          description: 'New workflow description',
          type: 'custom',
          status: 'draft',
          config: {},
          executionCount: 0,
          createdAt: new Date(),
          createdBy: 'test-user-id',
        }])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([{
            id: 'workflow-1',
            name: 'Updated Workflow',
            status: 'active',
          }])),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve({ rowCount: 1 })),
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

// Mock workflow executor
vi.mock('@/lib/workflow-executor', () => ({
  executeWorkflow: vi.fn(() => Promise.resolve({
    success: true,
    result: 'Workflow executed successfully',
  })),
}));

// Mock AI providers for execute tests
vi.mock('@/lib/ai-providers', () => ({
  getOpenAI: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn(() => Promise.resolve({
          choices: [{ message: { content: 'Test execution result' } }],
        })),
      },
    },
  })),
}));

describe('GET /api/workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return workflows list', async () => {
    const request = new NextRequest('http://localhost:3000/api/workflows');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('workflows');
    expect(Array.isArray(data.workflows)).toBe(true);
    expect(data.workflows).toHaveLength(1);
  });

  it('should return workflows with calculated fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/workflows');
    const response = await GET(request);
    const data = await response.json();

    const workflow = data.workflows[0];
    expect(workflow).toHaveProperty('id');
    expect(workflow).toHaveProperty('name');
    expect(workflow).toHaveProperty('type');
    expect(workflow).toHaveProperty('status');
    expect(workflow).toHaveProperty('nodeCount');
    expect(workflow).toHaveProperty('executionCount');
    expect(workflow.nodeCount).toBe(2);
  });

  it('should handle empty workflows list', async () => {
    const { db } = await import('@/lib/db');
    vi.mocked(db.query.agents.findMany).mockResolvedValueOnce([]);

    const request = new NextRequest('http://localhost:3000/api/workflows');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.workflows).toHaveLength(0);
  });
});

describe('POST /api/workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create workflow with valid data', async () => {
    const request = new NextRequest('http://localhost:3000/api/workflows', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New Workflow',
        description: 'A new workflow',
        type: 'custom',
        systemPrompt: 'You are a helpful assistant',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('id');
    expect(data.name).toBe('New Workflow');
    expect(data.type).toBe('custom');
    expect(data.status).toBe('draft');
  });

  it('should validate required field: name', async () => {
    const request = new NextRequest('http://localhost:3000/api/workflows', {
      method: 'POST',
      body: JSON.stringify({
        description: 'Missing name',
        type: 'custom',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should validate workflow type enum', async () => {
    const request = new NextRequest('http://localhost:3000/api/workflows', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Workflow',
        type: 'invalid-type',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should handle all valid workflow types', async () => {
    const types = ['scope', 'call', 'email', 'note', 'task', 'roadmap', 'content', 'custom',
      'browser', 'cross-app', 'knowledge', 'sales', 'trending', 'research',
      'meeting', 'code', 'data', 'security'];
    
    for (const type of types) {
      const request = new NextRequest('http://localhost:3000/api/workflows', {
        method: 'POST',
        body: JSON.stringify({
          name: `${type} Workflow`,
          type,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
    }
  });

  it('should create workflow with optional fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/workflows', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Complex Workflow',
        description: 'A complex workflow',
        type: 'custom',
        nodes: [{ id: 'node-1', type: 'start' }],
        edges: [{ source: 'node-1', target: 'node-2' }],
        systemPrompt: 'Custom system prompt',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('id');
  });
});

describe('GET /api/workflows/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return workflow by ID', async () => {
    const request = new NextRequest('http://localhost:3000/api/workflows/workflow-1');
    const response = await GET_BY_ID(request, { params: Promise.resolve({ id: 'workflow-1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('config');
  });

  it('should return 404 for non-existent workflow', async () => {
    const { db } = await import('@/lib/db');
    vi.mocked(db.query.agents.findFirst).mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/workflows/nonexistent');
    const response = await GET_BY_ID(request, { params: Promise.resolve({ id: 'nonexistent' }) });

    expect(response.status).toBe(404);
  });
});

describe('PATCH /api/workflows/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update workflow successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/workflows/workflow-1', {
      method: 'PATCH',
      body: JSON.stringify({
        name: 'Updated Workflow',
        status: 'active',
      }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'workflow-1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('id');
  });

  it('should handle workflow not found on update', async () => {
    const { db } = await import('@/lib/db');
    vi.mocked(db.query.agents.findFirst).mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/workflows/nonexistent', {
      method: 'PATCH',
      body: JSON.stringify({
        name: 'Updated Workflow',
      }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(response.status).toBe(404);
  });
});

describe('DELETE /api/workflows/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete workflow successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/workflows/workflow-1', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: 'workflow-1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('success');
  });

  it('should handle workflow not found on delete', async () => {
    const { db } = await import('@/lib/db');
    vi.mocked(db.query.agents.findFirst).mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/workflows/nonexistent', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(response.status).toBe(404);
  });
});

describe('POST /api/workflows/[id]/execute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute workflow successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/workflows/workflow-1/execute', {
      method: 'POST',
      body: JSON.stringify({
        input: { message: 'Test input' },
      }),
    });

    const response = await EXECUTE(request, { params: Promise.resolve({ id: 'workflow-1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('executionId');
    expect(data).toHaveProperty('status');
  });

  it('should handle workflow not found on execute', async () => {
    const { db } = await import('@/lib/db');
    vi.mocked(db.query.agents.findFirst).mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/workflows/nonexistent/execute', {
      method: 'POST',
      body: JSON.stringify({
        input: { message: 'Test input' },
      }),
    });

    const response = await EXECUTE(request, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(response.status).toBe(404);
  });

  it('should handle execution with empty input', async () => {
    const request = new NextRequest('http://localhost:3000/api/workflows/workflow-1/execute', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await EXECUTE(request, { params: Promise.resolve({ id: 'workflow-1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('executionId');
    expect(data).toHaveProperty('status');
  });
});
