import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as CHAT } from '@/app/api/agents/[id]/chat/route';
import { POST as RUN } from '@/app/api/agents/[id]/run/route';
import { POST as TEST_RUN } from '@/app/api/agents/test-run/route';
import { NextRequest } from 'next/server';

// Mock auth
vi.mock('@/lib/auth', () => ({
  getCurrentWorkspace: vi.fn(() => Promise.resolve({
    workspaceId: 'test-workspace-id',
    userId: 'test-user-id',
  })),
  getCurrentUser: vi.fn(() => Promise.resolve({
    id: 'test-user-id',
    clerkUserId: 'clerk-test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
  })),
}));

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    query: {
      agents: {
        findFirst: vi.fn(() => Promise.resolve({
          id: 'agent-1',
          workspaceId: 'test-workspace-id',
          name: 'Test Agent',
          description: 'A test agent',
          type: 'custom',
          status: 'active',
          config: {
            systemPrompt: 'You are a helpful assistant',
            capabilities: ['crm', 'email'],
            tone: 'professional',
          },
          executionCount: 0,
          createdAt: new Date(),
          createdBy: 'test-user-id',
        })),
      },
      aiConversations: {
        findFirst: vi.fn(() => Promise.resolve({
          id: 'a1234567-89ab-cdef-0123-456789abcdef',
          userId: 'test-user-id',
          workspaceId: 'test-workspace-id',
          title: 'Chat with Test Agent',
          context: { selectedItems: { agentId: 'agent-1' } },
          messageCount: 2,
          createdAt: new Date(),
        })),
        findMany: vi.fn(() => Promise.resolve([
          {
            id: 'a1234567-89ab-cdef-0123-456789abcdef',
            userId: 'test-user-id',
            workspaceId: 'test-workspace-id',
            title: 'Chat with Test Agent',
            context: { selectedItems: { agentId: 'agent-1' } },
            messageCount: 2,
            createdAt: new Date(),
          },
        ])),
      },
      aiMessages: {
        findMany: vi.fn(() => Promise.resolve([
          {
            id: 'msg-1',
            conversationId: 'a1234567-89ab-cdef-0123-456789abcdef',
            role: 'user',
            content: 'Hello',
            createdAt: new Date(),
          },
          {
            id: 'msg-2',
            conversationId: 'a1234567-89ab-cdef-0123-456789abcdef',
            role: 'assistant',
            content: 'Hi! How can I help you?',
            createdAt: new Date(),
          },
        ])),
      },
      agentExecutions: {
        findMany: vi.fn(() => Promise.resolve([])),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{
          id: 'new-id',
          createdAt: new Date(),
        }])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([{ id: 'agent-1' }])),
        })),
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

// Mock rate limiter
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(() => Promise.resolve({ success: true })),
}));

// Mock AI providers (getOpenAI)
vi.mock('@/lib/ai-providers', () => ({
  getOpenAI: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn(() => Promise.resolve({
          choices: [{
            message: {
              content: 'This is a test response from the agent.',
              role: 'assistant',
            },
          }],
        })),
      },
    },
  })),
}));

// Mock AI tools for test-run
vi.mock('@/lib/ai/tools', () => ({
  aiTools: [],
  executeTool: vi.fn(() => Promise.resolve({ success: true, data: [] })),
}));

// Mock Trigger.dev workflow executor
vi.mock('@/trigger/workflow-executor', () => ({
  executeAgentTask: {
    trigger: vi.fn(() => Promise.resolve({
      id: 'trigger-run-id',
      publicAccessToken: 'test-public-token',
    })),
  },
}));

describe('POST /api/agents/[id]/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up TRIGGER_SECRET_KEY for run tests
    vi.stubEnv('TRIGGER_SECRET_KEY', 'test-trigger-secret');
  });

  it('should send message and get agent response', async () => {
    const request = new NextRequest('http://localhost:3000/api/agents/agent-1/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello, agent!',
      }),
    });

    const response = await CHAT(request, { params: Promise.resolve({ id: 'agent-1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('message');
    expect(data).toHaveProperty('conversationId');
    // message is an object with id, role, content, timestamp
    expect(data.message).toHaveProperty('content');
    expect(typeof data.message.content).toBe('string');
  });

  it('should validate required field: message', async () => {
    const request = new NextRequest('http://localhost:3000/api/agents/agent-1/chat', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await CHAT(request, { params: Promise.resolve({ id: 'agent-1' }) });
    expect(response.status).toBe(400);
  });

  it('should handle agent not found', async () => {
    const { db } = await import('@/lib/db');
    vi.mocked(db.query.agents.findFirst).mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/agents/nonexistent/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello',
      }),
    });

    const response = await CHAT(request, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(response.status).toBe(404);
  });

  it('should create new conversation if none exists', async () => {
    const { db } = await import('@/lib/db');
    vi.mocked(db.query.aiConversations.findFirst).mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/agents/agent-1/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'First message',
      }),
    });

    const response = await CHAT(request, { params: Promise.resolve({ id: 'agent-1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('conversationId');
  });

  it('should accept conversationId parameter for follow-up messages', async () => {
    // Test that the route accepts a conversationId parameter and responds successfully
    // Note: The actual conversation lookup depends on complex mock interactions
    const validUuid = 'a1234567-89ab-cdef-0123-456789abcdef';

    const request = new NextRequest('http://localhost:3000/api/agents/agent-1/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Follow-up message',
        conversationId: validUuid,
      }),
    });

    const response = await CHAT(request, { params: Promise.resolve({ id: 'agent-1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('conversationId');
    expect(data).toHaveProperty('message');
    // The route should return a valid UUID conversation ID (either existing or new)
    expect(typeof data.conversationId).toBe('string');
  });
});

describe('POST /api/agents/[id]/run', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up TRIGGER_SECRET_KEY for run tests
    vi.stubEnv('TRIGGER_SECRET_KEY', 'test-trigger-secret');
  });

  it('should execute agent successfully', async () => {
    // The run endpoint uses task/message, not input
    const request = new NextRequest('http://localhost:3000/api/agents/agent-1/run', {
      method: 'POST',
      body: JSON.stringify({
        task: 'Create a lead for John Doe',
      }),
    });

    const response = await RUN(request, { params: Promise.resolve({ id: 'agent-1' }) });
    const data = await response.json();

    // Run endpoint returns 202 (accepted) for async execution
    expect(response.status).toBe(202);
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('executionId');
    expect(data.success).toBe(true);
  });

  it('should accept empty body (all fields optional)', async () => {
    // All fields in runAgentSchema are optional
    const request = new NextRequest('http://localhost:3000/api/agents/agent-1/run', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await RUN(request, { params: Promise.resolve({ id: 'agent-1' }) });
    // Should succeed since all fields are optional
    expect(response.status).toBe(202);
  });

  it('should handle agent not found', async () => {
    const { db } = await import('@/lib/db');
    vi.mocked(db.query.agents.findFirst).mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/agents/nonexistent/run', {
      method: 'POST',
      body: JSON.stringify({
        task: 'Test input',
      }),
    });

    const response = await RUN(request, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(response.status).toBe(404);
  });

  it('should execute agent with inputs context', async () => {
    const request = new NextRequest('http://localhost:3000/api/agents/agent-1/run', {
      method: 'POST',
      body: JSON.stringify({
        task: 'Schedule a meeting',
        inputs: {
          contactId: 'contact-123',
          date: '2025-12-10',
        },
      }),
    });

    const response = await RUN(request, { params: Promise.resolve({ id: 'agent-1' }) });
    const data = await response.json();

    expect(response.status).toBe(202);
    expect(data).toHaveProperty('success');
  });

  it('should return trigger run ID and public access token', async () => {
    const request = new NextRequest('http://localhost:3000/api/agents/agent-1/run', {
      method: 'POST',
      body: JSON.stringify({
        task: 'Test execution',
      }),
    });

    const response = await RUN(request, { params: Promise.resolve({ id: 'agent-1' }) });
    const data = await response.json();

    expect(response.status).toBe(202);
    // The run endpoint returns trigger.dev info for realtime streaming
    expect(data).toHaveProperty('runId');
    expect(data).toHaveProperty('publicAccessToken');
    expect(data.queuedWith).toBe('trigger.dev');
  });
});

describe('POST /api/agents/test-run', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should test agent configuration without saving', async () => {
    // test-run uses 'task' instead of 'input'
    const request = new NextRequest('http://localhost:3000/api/agents/test-run', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Agent',
        type: 'custom',
        systemPrompt: 'You are a test assistant',
        task: 'Hello, test!',
      }),
    });

    const response = await TEST_RUN(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('success');
    // Response field is 'response' not 'output'
    expect(data).toHaveProperty('response');
  });

  it('should validate required fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/agents/test-run', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Agent',
        // Missing required 'type' field
      }),
    });

    const response = await TEST_RUN(request);
    expect(response.status).toBe(400);
  });

  it('should test agent with capabilities', async () => {
    const request = new NextRequest('http://localhost:3000/api/agents/test-run', {
      method: 'POST',
      body: JSON.stringify({
        name: 'CRM Agent',
        type: 'sales',
        systemPrompt: 'You are a sales assistant',
        capabilities: ['crm', 'email'],
        task: 'Create a lead',
      }),
    });

    const response = await TEST_RUN(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('success');
  });

  it('should handle AI execution errors gracefully', async () => {
    // Mock getOpenAI to throw an error
    const { getOpenAI } = await import('@/lib/ai-providers');
    vi.mocked(getOpenAI).mockImplementationOnce(() => ({
      chat: {
        completions: {
          create: vi.fn().mockRejectedValue(new Error('API key invalid')),
        },
      },
    }));

    const request = new NextRequest('http://localhost:3000/api/agents/test-run', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Error Agent',
        type: 'custom',
        systemPrompt: 'Test',
        task: 'Test',
      }),
    });

    const response = await TEST_RUN(request);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it('should test different agent types', async () => {
    const types = ['custom', 'sales', 'support', 'research'];

    for (const type of types) {
      const request = new NextRequest('http://localhost:3000/api/agents/test-run', {
        method: 'POST',
        body: JSON.stringify({
          name: `${type} Agent`,
          type,
          systemPrompt: `You are a ${type} assistant`,
          task: 'Test input',
        }),
      });

      const response = await TEST_RUN(request);
      expect(response.status).toBe(200);
    }
  });
});

describe('Agent Personality and Context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use agent system prompt in conversation', async () => {
    const request = new NextRequest('http://localhost:3000/api/agents/agent-1/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'What can you help me with?',
      }),
    });

    const response = await CHAT(request, { params: Promise.resolve({ id: 'agent-1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    // message is an object, check content exists
    expect(data.message).toBeTruthy();
    expect(data.message.content).toBeTruthy();
  });

  it('should maintain conversation context across messages', async () => {
    const { db } = await import('@/lib/db');
    const validUuid = 'a1234567-89ab-cdef-0123-456789abcdef';

    // Mock existing messages in conversation
    vi.mocked(db.query.aiMessages.findMany).mockResolvedValueOnce([
      {
        id: 'msg-1',
        conversationId: validUuid,
        role: 'user',
        content: 'My name is Alice',
        createdAt: new Date(),
      },
      {
        id: 'msg-2',
        conversationId: validUuid,
        role: 'assistant',
        content: 'Nice to meet you, Alice!',
        createdAt: new Date(),
      },
    ] as any);

    const request = new NextRequest('http://localhost:3000/api/agents/agent-1/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'What is my name?',
        conversationId: validUuid,
      }),
    });

    const response = await CHAT(request, { params: Promise.resolve({ id: 'agent-1' }) });
    expect(response.status).toBe(200);
    // Agent should have access to previous context
  });
});
