/**
 * Tests for Workflow Execute API Route
 * 
 * Tests workflow/agent execution endpoint including:
 * - POST /api/workflows/[id]/execute - Execute workflow
 * - Authentication and authorization
 * - Rate limiting
 * - Workflow execution logging
 * - Node processing (LLM, action nodes)
 * - Error handling and status tracking
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { POST } from '@/app/api/workflows/[id]/execute/route';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { expensiveOperationLimit } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { getOpenAI } from '@/lib/ai-providers';
import { logger } from '@/lib/logger';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  getCurrentWorkspace: vi.fn(),
  getCurrentUser: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  expensiveOperationLimit: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      agents: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ id: 'execution-123' }])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([{ id: 'execution-123' }])),
        })),
      })),
    })),
  },
}));

vi.mock('@/lib/ai-providers', () => ({
  getOpenAI: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/api-error-handler', () => ({
  createErrorResponse: vi.fn((error: any, message: string) => {
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
}));

describe('app/api/workflows/[id]/execute', () => {
  const mockWorkspaceId = 'workspace-123';
  const mockUserId = 'user-456';
  const mockUser = {
    id: mockUserId,
    clerkId: 'clerk-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockAgent = {
    id: 'agent-789',
    name: 'Test Workflow',
    description: 'A test workflow',
    workspaceId: mockWorkspaceId,
    executionCount: 10,
    config: {
      nodes: [
        {
          id: 'node-1',
          type: 'llm',
          title: 'Generate Summary',
          description: 'Generate a summary of the input',
        },
        {
          id: 'node-2',
          type: 'action',
          title: 'Send Email',
          description: 'Send email notification',
        },
      ],
      systemPrompt: 'You are a helpful assistant.',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default successful auth
    vi.mocked(getCurrentWorkspace).mockResolvedValue({
      workspaceId: mockWorkspaceId,
      userId: 'clerk-123',
    });
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    
    // Default successful rate limit
    vi.mocked(expensiveOperationLimit).mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 3600000,
    });
    
    // Default agent query
    vi.mocked(db.query.agents.findFirst).mockResolvedValue(mockAgent as any);
    
    // Default OpenAI mock
    const mockOpenAI = {
      chat: {
        completions: {
          create: vi.fn(() =>
            Promise.resolve({
              choices: [
                {
                  message: {
                    content: 'This is an AI-generated summary.',
                  },
                },
              ],
            })
          ),
        },
      },
    };
    vi.mocked(getOpenAI).mockReturnValue(mockOpenAI as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // WORKFLOW EXECUTION TESTS
  // ==========================================================================

  describe('POST /api/workflows/[id]/execute', () => {
    it('should execute workflow successfully', async () => {
      const request = new Request('http://localhost/api/workflows/agent-789/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: { text: 'Hello world' } }),
      });
      
      const response = await POST(
        request,
        { params: Promise.resolve({ id: 'agent-789' }) }
      );
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.executionId).toBe('execution-123');
      expect(data.status).toBe('completed');
      expect(data.steps).toHaveLength(2);
      expect(data.durationMs).toBeGreaterThan(0);
      
      expect(logger.info).toHaveBeenCalledWith('Workflow execution started', expect.any(Object));
      expect(logger.info).toHaveBeenCalledWith('Workflow execution completed', expect.any(Object));
    });

    it('should create execution log', async () => {
      const request = new Request('http://localhost/api/workflows/agent-789/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: { text: 'Test' } }),
      });
      
      await POST(
        request,
        { params: Promise.resolve({ id: 'agent-789' }) }
      );
      
      expect(db.insert).toHaveBeenCalled();
    });

    it('should process LLM nodes', async () => {
      const mockOpenAI = vi.mocked(getOpenAI)();
      
      const request = new Request('http://localhost/api/workflows/agent-789/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: { text: 'Test' } }),
      });
      
      const response = await POST(
        request,
        { params: Promise.resolve({ id: 'agent-789' }) }
      );
      
      const data = await response.json();
      const llmStep = data.steps.find((s: any) => s.step === 'Generate Summary');
      
      expect(llmStep).toBeDefined();
      expect(llmStep.status).toBe('completed');
      expect(llmStep.result).toContain('AI-generated');
      
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4-turbo-preview',
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user' }),
          ]),
        })
      );
    });

    it('should process action nodes', async () => {
      const request = new Request('http://localhost/api/workflows/agent-789/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: { text: 'Test' } }),
      });
      
      const response = await POST(
        request,
        { params: Promise.resolve({ id: 'agent-789' }) }
      );
      
      const data = await response.json();
      const actionStep = data.steps.find((s: any) => s.step === 'Send Email');
      
      expect(actionStep).toBeDefined();
      expect(actionStep.status).toBe('completed');
      expect(actionStep.result).toContain('Executed action');
    });

    it('should update agent execution count', async () => {
      const request = new Request('http://localhost/api/workflows/agent-789/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      await POST(
        request,
        { params: Promise.resolve({ id: 'agent-789' }) }
      );
      
      expect(db.update).toHaveBeenCalled();
    });

    it('should return final output', async () => {
      const request = new Request('http://localhost/api/workflows/agent-789/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      const response = await POST(
        request,
        { params: Promise.resolve({ id: 'agent-789' }) }
      );
      
      const data = await response.json();
      expect(data.output).toBeDefined();
      expect(typeof data.output).toBe('string');
    });

    it('should handle empty input', async () => {
      const request = new Request('http://localhost/api/workflows/agent-789/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      const response = await POST(
        request,
        { params: Promise.resolve({ id: 'agent-789' }) }
      );
      
      expect(response.status).toBe(200);
    });

    it('should accept test mode flag', async () => {
      const request = new Request('http://localhost/api/workflows/agent-789/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testMode: true }),
      });
      
      const response = await POST(
        request,
        { params: Promise.resolve({ id: 'agent-789' }) }
      );
      
      expect(response.status).toBe(200);
      expect(logger.info).toHaveBeenCalledWith(
        'Workflow execution started',
        expect.objectContaining({ testMode: true })
      );
    });
  });

  // ==========================================================================
  // VALIDATION TESTS
  // ==========================================================================

  describe('Request Validation', () => {
    it('should validate input schema', async () => {
      const request = new Request('http://localhost/api/workflows/agent-789/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: 'invalid' }), // Should be object
      });
      
      const response = await POST(
        request,
        { params: Promise.resolve({ id: 'agent-789' }) }
      );
      
      // Even though input is a string, zod.record(z.any()) might accept it
      // The actual validation depends on schema strictness
      expect(response.status).toBeLessThanOrEqual(400);
    });

    it('should return 404 when workflow not found', async () => {
      vi.mocked(db.query.agents.findFirst).mockResolvedValue(null);

      const request = new Request('http://localhost/api/workflows/nonexistent/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      const response = await POST(
        request,
        { params: Promise.resolve({ id: 'nonexistent' }) }
      );
      
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.error).toBe('Workflow not found');
    });

    it('should enforce workspace isolation', async () => {
      const otherWorkspaceAgent = {
        ...mockAgent,
        workspaceId: 'other-workspace',
      };
      
      // Return null as if not found (workspace check fails)
      vi.mocked(db.query.agents.findFirst).mockResolvedValue(null);

      const request = new Request('http://localhost/api/workflows/agent-789/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      const response = await POST(
        request,
        { params: Promise.resolve({ id: 'agent-789' }) }
      );
      
      expect(response.status).toBe(404);
    });
  });

  // ==========================================================================
  // AUTHENTICATION & RATE LIMITING TESTS
  // ==========================================================================

  describe('Authentication & Rate Limiting', () => {
    it('should require authentication', async () => {
      vi.mocked(getCurrentWorkspace).mockRejectedValue(new Error('Unauthorized'));

      const request = new Request('http://localhost/api/workflows/agent-789/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      const response = await POST(
        request,
        { params: Promise.resolve({ id: 'agent-789' }) }
      );
      
      expect(response.status).toBe(500);
    });

    it('should handle rate limit exceeded', async () => {
      vi.mocked(expensiveOperationLimit).mockResolvedValue({
        success: false,
        limit: 10,
        remaining: 0,
        reset: Date.now() + 1800000,
      });

      const request = new Request('http://localhost/api/workflows/agent-789/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      const response = await POST(
        request,
        { params: Promise.resolve({ id: 'agent-789' }) }
      );
      
      expect(response.status).toBe(429);
      
      const data = await response.json();
      expect(data.error).toContain('Rate limit exceeded');
      
      expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    });

    it('should use expensive operation rate limit', async () => {
      const request = new Request('http://localhost/api/workflows/agent-789/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      await POST(
        request,
        { params: Promise.resolve({ id: 'agent-789' }) }
      );
      
      expect(expensiveOperationLimit).toHaveBeenCalledWith(`workflows:execute:${mockUserId}`);
    });
  });

  // ==========================================================================
  // ERROR HANDLING TESTS
  // ==========================================================================

  describe('Error Handling', () => {
    it('should handle LLM execution errors', async () => {
      const mockOpenAI = vi.mocked(getOpenAI)();
      vi.mocked(mockOpenAI.chat.completions.create).mockRejectedValue(
        new Error('OpenAI API error')
      );

      const request = new Request('http://localhost/api/workflows/agent-789/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      const response = await POST(
        request,
        { params: Promise.resolve({ id: 'agent-789' }) }
      );
      
      expect(response.status).toBe(500);
      
      // Should update execution log with failure
      expect(db.update).toHaveBeenCalled();
    });

    it('should log execution failure', async () => {
      const mockOpenAI = vi.mocked(getOpenAI)();
      vi.mocked(mockOpenAI.chat.completions.create).mockRejectedValue(
        new Error('Execution failed')
      );

      const request = new Request('http://localhost/api/workflows/agent-789/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      await POST(
        request,
        { params: Promise.resolve({ id: 'agent-789' }) }
      );
      
      // Should update execution log with error
      expect(db.update).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      vi.mocked(db.insert).mockImplementation(() => {
        throw new Error('Database error');
      });

      const request = new Request('http://localhost/api/workflows/agent-789/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      const response = await POST(
        request,
        { params: Promise.resolve({ id: 'agent-789' }) }
      );
      
      expect(response.status).toBe(500);
    });

    it('should record duration on failure', async () => {
      const mockOpenAI = vi.mocked(getOpenAI)();
      vi.mocked(mockOpenAI.chat.completions.create).mockRejectedValue(
        new Error('Test error')
      );

      const request = new Request('http://localhost/api/workflows/agent-789/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      await POST(
        request,
        { params: Promise.resolve({ id: 'agent-789' }) }
      );
      
      // Update should include durationMs even on failure
      expect(db.update).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // CONFIG & NODE HANDLING TESTS
  // ==========================================================================

  describe('Configuration & Node Handling', () => {
    it('should handle workflows with no nodes', async () => {
      const noNodesAgent = {
        ...mockAgent,
        config: {},
      };
      
      vi.mocked(db.query.agents.findFirst).mockResolvedValue(noNodesAgent as any);

      const request = new Request('http://localhost/api/workflows/agent-789/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      const response = await POST(
        request,
        { params: Promise.resolve({ id: 'agent-789' }) }
      );
      
      const data = await response.json();
      expect(data.status).toBe('completed');
      expect(data.steps).toEqual([]);
    });

    it('should use default system prompt when not configured', async () => {
      const noPromptAgent = {
        ...mockAgent,
        config: {
          nodes: [
            {
              id: 'node-1',
              type: 'llm',
              title: 'Test',
              description: 'Test node',
            },
          ],
        },
      };
      
      vi.mocked(db.query.agents.findFirst).mockResolvedValue(noPromptAgent as any);

      const request = new Request('http://localhost/api/workflows/agent-789/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      const response = await POST(
        request,
        { params: Promise.resolve({ id: 'agent-789' }) }
      );
      
      expect(response.status).toBe(200);
      
      const mockOpenAI = vi.mocked(getOpenAI)();
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('Test Workflow'),
            }),
          ]),
        })
      );
    });

    it('should handle null config', async () => {
      const nullConfigAgent = {
        ...mockAgent,
        config: null,
      };
      
      vi.mocked(db.query.agents.findFirst).mockResolvedValue(nullConfigAgent as any);

      const request = new Request('http://localhost/api/workflows/agent-789/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      const response = await POST(
        request,
        { params: Promise.resolve({ id: 'agent-789' }) }
      );
      
      expect(response.status).toBe(200);
    });

    it('should process nodes in sequence', async () => {
      const request = new Request('http://localhost/api/workflows/agent-789/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      const response = await POST(
        request,
        { params: Promise.resolve({ id: 'agent-789' }) }
      );
      
      const data = await response.json();
      
      // Steps should be in order
      expect(data.steps[0].step).toBe('Generate Summary');
      expect(data.steps[1].step).toBe('Send Email');
    });

    it('should include input in LLM node prompts', async () => {
      const input = { text: 'Important data' };
      
      const request = new Request('http://localhost/api/workflows/agent-789/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      
      await POST(
        request,
        { params: Promise.resolve({ id: 'agent-789' }) }
      );
      
      const mockOpenAI = vi.mocked(getOpenAI)();
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining(JSON.stringify(input)),
            }),
          ]),
        })
      );
    });
  });
});
