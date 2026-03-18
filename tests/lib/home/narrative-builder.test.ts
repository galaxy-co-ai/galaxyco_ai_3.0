// tests/lib/home/narrative-builder.test.ts

import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import {
  getTimeOfDay,
  buildNarrativePrompt,
  parseNarrativeResponse,
} from '@/lib/home/narrative-builder';
import type { WorkspaceSnapshot } from '@/lib/home/workspace-data';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const fullSnapshot: WorkspaceSnapshot = {
  contactCount: 120,
  hotContacts: [
    { id: '1', firstName: 'Alice', lastName: 'Smith', company: 'Acme Corp' },
    { id: '2', firstName: 'Bob', lastName: null, company: null },
  ],
  overdueTasks: [
    { id: 't1', title: 'Follow up with Alice', customerId: '1' },
    { id: 't2', title: 'Send proposal', customerId: null },
  ],
  recentCampaigns: [
    { id: 'c1', name: 'Q1 Newsletter', sentCount: 500, openCount: 150, clickCount: 40 },
    { id: 'c2', name: 'Promo Blast', sentCount: 200, openCount: 0, clickCount: 5 },
  ],
  activeAgentCount: 3,
  integrationCount: 5,
  isNewUser: false,
};

const emptySnapshot: WorkspaceSnapshot = {
  contactCount: 0,
  hotContacts: [],
  overdueTasks: [],
  recentCampaigns: [],
  activeAgentCount: 0,
  integrationCount: 0,
  isNewUser: true,
};

// ---------------------------------------------------------------------------
// getTimeOfDay
// ---------------------------------------------------------------------------

describe('getTimeOfDay', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns morning when hour < 12', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T09:00:00'));
    expect(getTimeOfDay()).toBe('morning');
  });

  it('returns afternoon when hour >= 12 and < 17', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T14:30:00'));
    expect(getTimeOfDay()).toBe('afternoon');
  });

  it('returns evening when hour >= 17', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T20:00:00'));
    expect(getTimeOfDay()).toBe('evening');
  });

  it('returns morning at midnight (hour 0)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00'));
    expect(getTimeOfDay()).toBe('morning');
  });

  it('returns evening exactly at hour 17', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T17:00:00'));
    expect(getTimeOfDay()).toBe('evening');
  });
});

// ---------------------------------------------------------------------------
// buildNarrativePrompt
// ---------------------------------------------------------------------------

describe('buildNarrativePrompt', () => {
  it('includes workspace data summary in prompt', () => {
    const prompt = buildNarrativePrompt(fullSnapshot, 'Dalton', 'morning');
    expect(prompt).toContain('120');
    expect(prompt).toContain('Dalton');
  });

  it('includes hot contact names', () => {
    const prompt = buildNarrativePrompt(fullSnapshot, 'Dalton', 'morning');
    expect(prompt).toContain('Alice Smith');
    expect(prompt).toContain('Acme Corp');
    expect(prompt).toContain('Bob');
  });

  it('includes overdue task titles', () => {
    const prompt = buildNarrativePrompt(fullSnapshot, 'Dalton', 'afternoon');
    expect(prompt).toContain('Follow up with Alice');
    expect(prompt).toContain('Send proposal');
  });

  it('includes campaign data', () => {
    const prompt = buildNarrativePrompt(fullSnapshot, 'Dalton', 'morning');
    expect(prompt).toContain('Q1 Newsletter');
    expect(prompt).toContain('Promo Blast');
    // open rate: 150/500 = 30%
    expect(prompt).toContain('30%');
  });

  it('adjusts tone for morning', () => {
    const prompt = buildNarrativePrompt(fullSnapshot, 'Dalton', 'morning');
    expect(prompt.toLowerCase()).toContain('morning');
  });

  it('adjusts tone for afternoon', () => {
    const prompt = buildNarrativePrompt(fullSnapshot, 'Dalton', 'afternoon');
    expect(prompt.toLowerCase()).toContain('afternoon');
  });

  it('adjusts tone for evening', () => {
    const prompt = buildNarrativePrompt(fullSnapshot, 'Dalton', 'evening');
    expect(prompt.toLowerCase()).toContain('evening');
  });

  it('handles new user with empty workspace', () => {
    const prompt = buildNarrativePrompt(emptySnapshot, 'Newbie', 'morning');
    expect(prompt).toContain('Newbie');
    // Should contain welcome-related language
    expect(prompt.toLowerCase()).toContain('welcome');
    // Should not include any workspace data numbers (all zeros)
    expect(prompt).not.toContain('contactCount');
    // Should tell the LLM not to use VISUAL markers (the phrase "Do not use" + VISUAL)
    expect(prompt).toContain('Do not use');
  });

  it('does not instruct LLM to use VISUAL markers for new users', () => {
    const prompt = buildNarrativePrompt(emptySnapshot, 'Newbie', 'evening');
    // The new-user prompt should explicitly prohibit VISUAL markers, not encourage them
    expect(prompt).toContain('Do not use');
    // The full-workspace prompt would have a [VISUAL:chartType:...] usage example; new user should not
    expect(prompt).not.toContain('[VISUAL:chartType:');
  });
});

// ---------------------------------------------------------------------------
// parseNarrativeResponse
// ---------------------------------------------------------------------------

describe('parseNarrativeResponse', () => {
  it('returns empty array for empty string', () => {
    expect(parseNarrativeResponse('')).toEqual([]);
  });

  it('parses plain text into a single text block', () => {
    const blocks = parseNarrativeResponse('Good morning, Dalton. Here is your briefing.');
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toEqual({ type: 'text', content: 'Good morning, Dalton. Here is your briefing.' });
  });

  it('parses text with a VISUAL marker into mixed blocks', () => {
    const response = 'Here is your pipeline. [VISUAL:metric:{"title":"Open Rate","value":30}] Let me know if you want to dig in.';
    const blocks = parseNarrativeResponse(response);

    expect(blocks).toHaveLength(3);
    expect(blocks[0]).toEqual({ type: 'text', content: 'Here is your pipeline.' });
    expect(blocks[1]).toMatchObject({ type: 'visual', spec: { chartType: 'metric', title: 'Open Rate' } });
    expect(blocks[2]).toEqual({ type: 'text', content: "Let me know if you want to dig in." });
  });

  it('parses ACTION markers with nested JSON arrays', () => {
    const response =
      'You have two hot leads. [ACTION:{"prompt":"Want me to draft outreach?","actions":[{"label":"Yes, draft it","intent":"draft-outreach"},{"label":"Not now","intent":"dismiss"}]}]';
    const blocks = parseNarrativeResponse(response);

    expect(blocks).toHaveLength(2);
    expect(blocks[1]).toMatchObject({
      type: 'action-affordance',
      prompt: 'Want me to draft outreach?',
      actions: [
        { label: 'Yes, draft it', intent: 'draft-outreach' },
        { label: 'Not now', intent: 'dismiss' },
      ],
    });
  });

  it('parses LINK markers', () => {
    const response = 'Your CRM needs attention. [LINK:{"module":"crm","label":"Open CRM"}]';
    const blocks = parseNarrativeResponse(response);

    expect(blocks).toHaveLength(2);
    expect(blocks[1]).toEqual({ type: 'module-link', module: 'crm', label: 'Open CRM' });
  });

  it('parses LINK markers with optional entity field', () => {
    const response = '[LINK:{"module":"crm","entity":"contact-123","label":"View Alice"}]';
    const blocks = parseNarrativeResponse(response);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toEqual({ type: 'module-link', module: 'crm', entity: 'contact-123', label: 'View Alice' });
  });

  it('handles multiple markers in sequence', () => {
    const response =
      'Morning briefing. [VISUAL:line:{"title":"Revenue"}] Two tasks are overdue. [ACTION:{"prompt":"Tackle them?","actions":[{"label":"Yes","intent":"open-tasks"}]}] Head to tasks here: [LINK:{"module":"tasks","label":"Open Tasks"}]';
    const blocks = parseNarrativeResponse(response);

    expect(blocks).toHaveLength(6);
    expect(blocks[0]).toMatchObject({ type: 'text' });
    expect(blocks[1]).toMatchObject({ type: 'visual' });
    expect(blocks[2]).toMatchObject({ type: 'text' });
    expect(blocks[3]).toMatchObject({ type: 'action-affordance' });
    expect(blocks[4]).toMatchObject({ type: 'text' });
    expect(blocks[5]).toMatchObject({ type: 'module-link' });
  });

  it('falls back to text on malformed JSON in VISUAL marker', () => {
    const response = 'Here. [VISUAL:line:{bad json}] Done.';
    const blocks = parseNarrativeResponse(response);

    // The malformed marker becomes a text block
    const textBlocks = blocks.filter((b) => b.type === 'text');
    expect(textBlocks.some((b) => b.type === 'text' && b.content.includes('[VISUAL:'))).toBe(true);
    expect(blocks.some((b) => b.type === 'visual')).toBe(false);
  });

  it('falls back to text on malformed JSON in ACTION marker', () => {
    const response = '[ACTION:{not valid json}]';
    const blocks = parseNarrativeResponse(response);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ type: 'text', content: '[ACTION:{not valid json}]' });
  });

  it('falls back to text on malformed JSON in LINK marker', () => {
    const response = '[LINK:{"module":"crm"}]'; // missing label field
    const blocks = parseNarrativeResponse(response);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ type: 'text' });
  });

  it('handles ACTION with deeply nested args without breaking the bracket parser', () => {
    const response =
      '[ACTION:{"prompt":"Send campaign?","actions":[{"label":"Send","intent":"send-campaign","args":{"campaignId":"abc","filters":{"status":"active"}}}]}]';
    const blocks = parseNarrativeResponse(response);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ type: 'action-affordance' });
    const block = blocks[0] as { type: 'action-affordance'; prompt: string; actions: Array<{ args?: Record<string, unknown> }> };
    expect(block.actions[0].args).toMatchObject({ campaignId: 'abc' });
  });

  it('handles response with only whitespace between markers', () => {
    const response = '[LINK:{"module":"crm","label":"CRM"}]   [LINK:{"module":"tasks","label":"Tasks"}]';
    const blocks = parseNarrativeResponse(response);

    const linkBlocks = blocks.filter((b) => b.type === 'module-link');
    expect(linkBlocks).toHaveLength(2);
  });

  it('handles unknown chart type in VISUAL marker by falling back to text', () => {
    const response = '[VISUAL:donut:{"title":"Bad"}]';
    const blocks = parseNarrativeResponse(response);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('text');
  });
});
