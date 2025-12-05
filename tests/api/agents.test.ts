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
          id: 'conv-1',
          userId: 'test-user-id',
          workspaceId: 'test-workspace-id',
          title: 'Chat with Test Agent',
          context: { agentId: 'agent-1' },
          createdAt: new Date(),
        })),
      },
      aiMessages: {
        findMany: vi.fn(() => Promise.resolve([
          {
            id: 'msg-1',
            conversationId: 'conv-1',
            role: 'user',
            content: 'Hello',
            createdAt: new Date(),
          },
          {
            id: 'msg-2',
            conversationId: 'conv-1',
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

// Mock OpenAI
vi.mock('openai', () => ({
  default: class MockOpenAI {
    chat = {
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
    };
  },
}));

// Mock workflow executor
vi.mock('@/lib/workflow-executor', () => ({
  executeAgent: vi.fn(() => Promise.resolve({
    success: true,
    result: 'Agent executed successfully',
    output: { message: 'Task completed' },
  })),
}));

describe('POST /api/agents/[id]/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send message and get agent response', async () => {
    const request = new NextRequest('http://localhost:3000/api/agents/agent-1/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello, agent!',
      }),
    });

    const response = await CHAT(request, { params: { id: 'agent-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('message');
    expect(data).toHaveProperty('conversationId');
    expect(typeof data.message).toBe('string');
  });

  it('should validate required field: message', async () => {
    const request = new NextRequest('http://localhost:3000/api/agents/agent-1/chat', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await CHAT(request, { params: { id: 'agent-1' } });
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

    const response = await CHAT(request, { params: { id: 'nonexistent' } });
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

    const response = await CHAT(request, { params: { id: 'agent-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('conversationId');
  });

  it('should use existing conversation when provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/agents/agent-1/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Follow-up message',
        conversationId: 'conv-1',
      }),
    });

    const response = await CHAT(request, { params: { id: 'agent-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.conversationId).toBe('conv-1');
  });
});

describe('POST /api/agents/[id]/run', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute agent successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/agents/agent-1/run', {
      method: 'POST',
      body: JSON.stringify({
        input: 'Create a lead for John Doe',
      }),
    });

    const response = await RUN(request, { params: { id: 'agent-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('executionId');
  });

  it('should validate required field: input', async () => {
    const request = new NextRequest('http://localhost:3000/api/agents/agent-1/run', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await RUN(request, { params: { id: 'agent-1' } });
    expect(response.status).toBe(400);
  });

  it('should handle agent not found', async () => {
    const { db } = await import('@/lib/db');
    vi.mocked(db.query.agents.findFirst).mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/agents/nonexistent/run', {
      method: 'POST',
      body: JSON.stringify({
        input: 'Test input',
      }),
    });

    const response = await RUN(request, { params: { id: 'nonexistent' } });
    expect(response.status).toBe(404);
  });

  it('should execute agent with context', async () => {
    const request = new NextRequest('http://localhost:3000/api/agents/agent-1/run', {
      method: 'POST',
      body: JSON.stringify({
        input: 'Schedule a meeting',
        context: {
          contactId: 'contact-123',
          date: '2025-12-10',
        },
      }),
    });

    const response = await RUN(request, { params: { id: 'agent-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('success');
  });

  it('should increment agent execution count', async () => {
    const request = new NextRequest('http://localhost:3000/api/agents/agent-1/run', {
      method: 'POST',
      body: JSON.stringify({
        input: 'Test execution',
      }),
    });

    const response = await RUN(request, { params: { id: 'agent-1' } });
    
    expect(response.status).toBe(200);
    // Verify update was called (incrementing executionCount)
    const { db } = await import('@/lib/db');
    expect(db.update).toHaveBeenCalled();
  });
});

describe('POST /api/agents/test-run', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should test agent configuration without saving', async () => {
    const request = new NextRequest('http://localhost:3000/api/agents/test-run', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Agent',
        type: 'custom',
        systemPrompt: 'You are a test assistant',
        input: 'Hello, test!',
      }),
    });

    const response = await TEST_RUN(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('output');
  });

  it('should validate required fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/agents/test-run', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Agent',
        // Missing required fields
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
        input: 'Create a lead',
      }),
    });

    const response = await TEST_RUN(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('success');
  });

  it('should handle execution errors gracefully', async () => {
    const { executeAgent } = await import('@/lib/workflow-executor');
    vi.mocked(executeAgent).mockRejectedValueOnce(new Error('Execution failed'));

    const request = new NextRequest('http://localhost:3000/api/agents/test-run', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Error Agent',
        type: 'custom',
        systemPrompt: 'Test',
        input: 'Test',
      }),
    });

    const response = await TEST_RUN(request);
    expect(response.status).toBe(500);
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
          input: 'Test input',
        }),
      });

      const response = await TEST_RUN(request);
      expect(response.status).toBe(200);
    }
  });
});

describe('Agent Personality and Context', () => {
  it('should use agent system prompt in conversation', async () => {
    const request = new NextRequest('http://localhost:3000/api/agents/agent-1/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'What can you help me with?',
      }),
    });

    const response = await CHAT(request, { params: { id: 'agent-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBeTruthy();
    // Agent should respond according to its system prompt
  });

  it('should maintain conversation context across messages', async () => {
    const { db } = await import('@/lib/db');
    
    // Mock existing messages in conversation
    vi.mocked(db.query.aiMessages.findMany).mockResolvedValueOnce([
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        role: 'user',
        content: 'My name is Alice',
        createdAt: new Date(),
      },
      {
        id: 'msg-2',
        conversationId: 'conv-1',
        role: 'assistant',
        content: 'Nice to meet you, Alice!',
        createdAt: new Date(),
      },
    ] as any);

    const request = new NextRequest('http://localhost:3000/api/agents/agent-1/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'What is my name?',
        conversationId: 'conv-1',
      }),
    });

    const response = await CHAT(request, { params: { id: 'agent-1' } });
    expect(response.status).toBe(200);
    // Agent should have access to previous context
  });
});
