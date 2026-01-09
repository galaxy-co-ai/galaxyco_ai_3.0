/**
 * Tests for Assistant Chat API Route
 * 
 * Tests the main Neptune chat endpoint including:
 * - Authentication and authorization
 * - Rate limiting
 * - Request validation
 * - Message streaming
 * - Semantic caching
 * - Tool execution
 * - Context gathering
 * - Error handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { POST } from '@/app/api/assistant/chat/route';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { getCachedResponse } from '@/lib/ai/cache';
import { gatherAIContext } from '@/lib/ai/context';
import { generateSystemPrompt } from '@/lib/ai/system-prompt';
import { checkTokenLimit } from '@/lib/cost-protection';
import { trackNeptuneRequest } from '@/lib/observability';
import { logger } from '@/lib/logger';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  getCurrentWorkspace: vi.fn(),
  getCurrentUser: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      workspaces: {
        findFirst: vi.fn(),
      },
      aiConversations: {
        findFirst: vi.fn(),
      },
      aiMessages: {
        findMany: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ id: 'conv-123' }])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
  },
}));

vi.mock('@/lib/ai/cache', () => ({
  getCachedResponse: vi.fn(),
  cacheResponse: vi.fn(),
}));

vi.mock('@/lib/ai/context', () => ({
  gatherAIContext: vi.fn(),
}));

vi.mock('@/lib/ai/system-prompt', () => ({
  generateSystemPrompt: vi.fn(),
}));

vi.mock('@/lib/ai-providers', () => ({
  getOpenAI: vi.fn(),
}));

vi.mock('@/lib/cost-protection', () => ({
  checkTokenLimit: vi.fn(),
  trackTokenUsage: vi.fn(),
  estimateTokens: vi.fn(() => 100),
}));

vi.mock('@/lib/observability', () => ({
  trackNeptuneRequest: vi.fn(),
  trackNeptuneError: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/ai/tools', () => ({
  aiTools: [],
  executeTool: vi.fn(),
  getToolsForCapability: vi.fn(() => []),
}));

vi.mock('@/lib/ai/memory', () => ({
  trackFrequentQuestion: vi.fn(),
  analyzeConversationForLearning: vi.fn(),
  updateUserPreferencesFromInsights: vi.fn(),
}));

vi.mock('@/lib/ai/autonomy-learning', () => ({
  shouldAutoExecute: vi.fn(() => Promise.resolve({ autoExecute: false, confidence: 0.5 })),
  recordActionExecution: vi.fn(),
}));

vi.mock('@/lib/ai/intent-classifier', () => ({
  classifyIntent: vi.fn(() => Promise.resolve({ intent: 'general', confidence: 0.9 })),
}));

vi.mock('@/lib/integrations', () => ({
  getConnectedApps: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@/lib/document-processing', () => ({
  processDocuments: vi.fn(),
}));

describe('app/api/assistant/chat/route', () => {
  const mockWorkspaceId = 'workspace-123';
  const mockUserId = 'user-456';
  const mockUser = {
    id: mockUserId,
    clerkId: 'clerk-123',
    email: 'test@example.com',
    name: 'Test User',
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
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 20,
      remaining: 19,
      reset: Date.now() + 60000,
    });
    
    // Default workspace query
    vi.mocked(db.query.workspaces.findFirst).mockResolvedValue({
      id: mockWorkspaceId,
      subscriptionTier: 'pro',
    } as any);
    
    // Default token limit check
    vi.mocked(checkTokenLimit).mockResolvedValue({ allowed: true });
    
    // Default context
    vi.mocked(gatherAIContext).mockResolvedValue({
      workspace: { name: 'Test Workspace' },
      user: mockUser,
      recentActivity: [],
      connectedApps: [],
    } as any);
    
    // Default system prompt
    vi.mocked(generateSystemPrompt).mockReturnValue('You are Neptune, an AI assistant.');
    
    // No cached response by default
    vi.mocked(getCachedResponse).mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // AUTHENTICATION TESTS
  // ==========================================================================

  describe('Authentication', () => {
    it('should return error when workspace auth fails', async () => {
      vi.mocked(getCurrentWorkspace).mockRejectedValue(new Error('Not authenticated'));

      const request = new Request('http://localhost/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello' }),
      });

      const response = await POST(request);
      
      // SSE stream returns 200 but contains error in stream
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      
      // Read stream to verify error message
      const reader = response.body?.getReader();
      const { value } = await reader!.read();
      const text = new TextDecoder().decode(value);
      
      expect(text).toContain('error');
      expect(text).toContain('sign in');
      expect(logger.error).toHaveBeenCalledWith('[AI Chat Stream] Authentication error', expect.any(Error));
    });

    it('should return error when user retrieval fails', async () => {
      vi.mocked(getCurrentUser).mockRejectedValue(new Error('User not found'));

      const request = new Request('http://localhost/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello' }),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      const reader = response.body?.getReader();
      const { value } = await reader!.read();
      const text = new TextDecoder().decode(value);
      
      expect(text).toContain('error');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // RATE LIMITING TESTS
  // ==========================================================================

  describe('Rate Limiting', () => {
    it('should return error when rate limit exceeded', async () => {
      vi.mocked(rateLimit).mockResolvedValue({
        success: false,
        limit: 20,
        remaining: 0,
        reset: Date.now() + 30000,
      });

      const request = new Request('http://localhost/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello' }),
      });

      const response = await POST(request);
      
      const reader = response.body?.getReader();
      const { value } = await reader!.read();
      const text = new TextDecoder().decode(value);
      
      expect(text).toContain('Rate limit exceeded');
      expect(text).toContain('rateLimitExceeded');
      expect(logger.warn).toHaveBeenCalledWith('[AI Chat Stream] Rate limit exceeded', expect.any(Object));
    });

    it('should pass rate limit check for valid requests', async () => {
      vi.mocked(rateLimit).mockResolvedValue({
        success: true,
        limit: 20,
        remaining: 15,
        reset: Date.now() + 60000,
      });

      const request = new Request('http://localhost/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello' }),
      });

      await POST(request);
      
      expect(rateLimit).toHaveBeenCalledWith(
        `ai:chat:${mockUserId}`,
        20,
        60
      );
    });
  });

  // ==========================================================================
  // REQUEST VALIDATION TESTS
  // ==========================================================================

  describe('Request Validation', () => {
    it('should return error for empty message', async () => {
      const request = new Request('http://localhost/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '' }),
      });

      const response = await POST(request);
      
      const reader = response.body?.getReader();
      const { value } = await reader!.read();
      const text = new TextDecoder().decode(value);
      
      expect(text).toContain('Invalid request');
      expect(logger.warn).toHaveBeenCalledWith('[AI Chat Stream] Validation failed', expect.any(Object));
    });

    it('should return error for message too long', async () => {
      const longMessage = 'a'.repeat(10001);
      
      const request = new Request('http://localhost/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: longMessage }),
      });

      const response = await POST(request);
      
      const reader = response.body?.getReader();
      const { value } = await reader!.read();
      const text = new TextDecoder().decode(value);
      
      expect(text).toContain('Invalid request');
    });

    it('should accept valid message', async () => {
      const request = new Request('http://localhost/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello Neptune!' }),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should accept valid conversation ID', async () => {
      const conversationId = '550e8400-e29b-41d4-a716-446655440000';
      
      const request = new Request('http://localhost/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: 'Hello',
          conversationId,
        }),
      });

      await POST(request);
      
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should accept attachments', async () => {
      const request = new Request('http://localhost/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: 'Analyze this',
          attachments: [
            {
              type: 'document',
              url: 'https://example.com/doc.pdf',
              name: 'document.pdf',
              size: 1024,
              mimeType: 'application/pdf',
            },
          ],
        }),
      });

      await POST(request);
      
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should accept page context', async () => {
      const request = new Request('http://localhost/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: 'What should I do?',
          pageContext: {
            pageName: 'CRM Dashboard',
            pageType: 'dashboard',
            module: 'crm',
            path: '/crm',
          },
        }),
      });

      await POST(request);
      
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // SEMANTIC CACHING TESTS
  // ==========================================================================

  describe('Semantic Caching', () => {
    it('should return cached response when available', async () => {
      const cachedResponse = {
        response: 'This is a cached response',
        toolsUsed: ['search_knowledge'],
        timestamp: new Date().toISOString(),
      };
      
      vi.mocked(getCachedResponse).mockResolvedValue(cachedResponse);

      const request = new Request('http://localhost/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'What is AI?' }),
      });

      const response = await POST(request);
      
      const reader = response.body?.getReader();
      let fullText = '';
      
      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        fullText += new TextDecoder().decode(value);
      }
      
      expect(fullText).toContain('cached response');
      expect(fullText).toContain('cached');
      expect(trackNeptuneRequest).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({
          cached: true,
          tokensUsed: 0,
        })
      );
    });

    it('should not use cache when attachments present', async () => {
      vi.mocked(getCachedResponse).mockResolvedValue({
        response: 'Cached',
        toolsUsed: [],
        timestamp: new Date().toISOString(),
      });

      const request = new Request('http://localhost/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: 'Analyze this',
          attachments: [
            {
              type: 'document',
              url: 'https://example.com/doc.pdf',
              name: 'doc.pdf',
              size: 1024,
              mimeType: 'application/pdf',
            },
          ],
        }),
      });

      await POST(request);
      
      // Should not check cache when attachments present
      expect(getCachedResponse).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // CONTEXT GATHERING TESTS
  // ==========================================================================

  describe('Context Gathering', () => {
    it('should gather workspace context', async () => {
      const request = new Request('http://localhost/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello' }),
      });

      await POST(request);
      
      expect(gatherAIContext).toHaveBeenCalledWith(
        mockWorkspaceId,
        mockUserId,
        expect.any(Object)
      );
    });

    it('should include page context when provided', async () => {
      const pageContext = {
        pageName: 'Finance HQ',
        pageType: 'hq' as const,
        module: 'finance' as const,
        path: '/finance',
      };

      const request = new Request('http://localhost/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: 'Show me revenue',
          pageContext,
        }),
      });

      await POST(request);
      
      expect(logger.debug).toHaveBeenCalledWith(
        '[AI Chat Stream] Request validated',
        expect.objectContaining({
          pageModule: 'finance',
          pageName: 'Finance HQ',
        })
      );
    });
  });

  // ==========================================================================
  // SYSTEM PROMPT GENERATION TESTS
  // ==========================================================================

  describe('System Prompt Generation', () => {
    it('should generate system prompt with context', async () => {
      const mockContext = {
        workspace: { name: 'Acme Corp' },
        user: mockUser,
        recentActivity: [],
      };
      
      vi.mocked(gatherAIContext).mockResolvedValue(mockContext as any);

      const request = new Request('http://localhost/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello' }),
      });

      await POST(request);
      
      expect(generateSystemPrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          workspace: expect.objectContaining({ name: 'Acme Corp' }),
        }),
        expect.any(Object)
      );
    });
  });

  // ==========================================================================
  // STREAMING RESPONSE TESTS
  // ==========================================================================

  describe('Streaming Response', () => {
    it('should return SSE stream', async () => {
      const request = new Request('http://localhost/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello' }),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-transform');
      expect(response.headers.get('Connection')).toBe('keep-alive');
    });

    it('should stream content chunks', async () => {
      // Note: Full streaming test requires mocking OpenAI streaming
      // This is a basic structure test
      
      const request = new Request('http://localhost/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello' }),
      });

      const response = await POST(request);
      
      expect(response.body).toBeDefined();
      expect(response.body?.getReader).toBeDefined();
    });
  });

  // ==========================================================================
  // ERROR HANDLING TESTS
  // ==========================================================================

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      vi.mocked(db.query.workspaces.findFirst).mockRejectedValue(new Error('DB connection failed'));

      const request = new Request('http://localhost/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello' }),
      });

      const response = await POST(request);
      
      const reader = response.body?.getReader();
      const { value } = await reader!.read();
      const text = new TextDecoder().decode(value);
      
      // Should handle error gracefully
      expect(response.status).toBe(200); // SSE always returns 200
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle context gathering errors', async () => {
      vi.mocked(gatherAIContext).mockRejectedValue(new Error('Context error'));

      const request = new Request('http://localhost/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello' }),
      });

      const response = await POST(request);
      
      // Should still return a response, maybe with degraded context
      expect(response.status).toBe(200);
    });
  });

  // ==========================================================================
  // WORKSPACE TIER TESTS
  // ==========================================================================

  describe('Workspace Tier Handling', () => {
    it('should detect free tier workspace', async () => {
      vi.mocked(db.query.workspaces.findFirst).mockResolvedValue({
        id: mockWorkspaceId,
        subscriptionTier: 'free',
      } as any);

      const request = new Request('http://localhost/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello' }),
      });

      await POST(request);
      
      // Workspace tier should be used for cost protection
      expect(db.query.workspaces.findFirst).toHaveBeenCalled();
    });

    it('should detect pro tier workspace', async () => {
      vi.mocked(db.query.workspaces.findFirst).mockResolvedValue({
        id: mockWorkspaceId,
        subscriptionTier: 'pro',
      } as any);

      const request = new Request('http://localhost/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello' }),
      });

      await POST(request);
      
      expect(db.query.workspaces.findFirst).toHaveBeenCalled();
    });

    it('should default to free tier when not specified', async () => {
      vi.mocked(db.query.workspaces.findFirst).mockResolvedValue({
        id: mockWorkspaceId,
        subscriptionTier: null,
      } as any);

      const request = new Request('http://localhost/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello' }),
      });

      await POST(request);
      
      // Should handle null tier gracefully
      expect(response.status).not.toBe(500);
    });
  });
});
