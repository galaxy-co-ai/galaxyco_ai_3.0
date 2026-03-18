// src/lib/home/narrative-builder.ts

import { logger } from '@/lib/logger';
import type { ContentBlock, VisualSpec, ActionOption } from '@/types/neptune-conversation';
import type { WorkspaceSnapshot } from './workspace-data';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

// ---------------------------------------------------------------------------
// getTimeOfDay
// ---------------------------------------------------------------------------

export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

// ---------------------------------------------------------------------------
// buildNarrativePrompt
// ---------------------------------------------------------------------------

export function buildNarrativePrompt(
  snapshot: WorkspaceSnapshot,
  userName: string,
  timeOfDay: TimeOfDay,
): string {
  const toneGuide = {
    morning:
      'Tone: energising and forward-looking — the day is just beginning. Be concise and action-oriented.',
    afternoon:
      'Tone: focused and momentum-driven — the day is in full swing. Lead with what needs attention now.',
    evening:
      'Tone: reflective and measured — the day is winding down. Acknowledge progress and set up tomorrow.',
  }[timeOfDay];

  if (snapshot.isNewUser) {
    return `You are Neptune, an AI-native business operating system assistant. You are welcoming a brand-new user called ${userName} for the first time.

${toneGuide}

Their workspace is completely empty — no contacts, no tasks, no campaigns, no active agents. This is a blank slate.

Your job is to write a warm, genuine welcome that:
1. Acknowledges them by name and makes them feel at home
2. Briefly explains what Neptune can do for them (CRM, campaigns, tasks, automations)
3. Closes with a single, open question that invites them to share what matters most to them right now

Speak in natural prose. No bullet points. No lists. No headers. One or two paragraphs maximum.

You may use the following inline markers where they genuinely add value:
- [ACTION:{"prompt":"question text","actions":[{"label":"Label","intent":"intent-string"}]}] — to offer a small set of next steps
- [LINK:{"module":"moduleName","label":"link label"}] — to direct them to a specific area of the platform

Do not use [VISUAL:...] markers for new users — there is no data to display.`;
  }

  // Build data summaries
  const hotContactsSummary =
    snapshot.hotContacts.length === 0
      ? 'No hot contacts at this time.'
      : snapshot.hotContacts
          .map((c) => {
            const name = [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Unnamed';
            return c.company ? `${name} (${c.company})` : name;
          })
          .join(', ');

  const overdueTasksSummary =
    snapshot.overdueTasks.length === 0
      ? 'No overdue tasks.'
      : snapshot.overdueTasks.map((t) => `"${t.title}"`).join(', ');

  const campaignsSummary =
    snapshot.recentCampaigns.length === 0
      ? 'No recent campaign data.'
      : snapshot.recentCampaigns
          .map((c) => {
            const open = c.openCount ?? 0;
            const sent = c.sentCount ?? 0;
            const click = c.clickCount ?? 0;
            const openRate = sent > 0 ? Math.round((open / sent) * 100) : 0;
            return `"${c.name}" — ${sent} sent, ${openRate}% open rate, ${click} clicks`;
          })
          .join('; ');

  return `You are Neptune, the AI core of an agency operating system. You are speaking to ${userName} at the start of their ${timeOfDay}.

${toneGuide}

Here is their current workspace data:
- Total contacts: ${snapshot.contactCount}
- Hot leads (${snapshot.hotContacts.length}): ${hotContactsSummary}
- Overdue tasks (${snapshot.overdueTasks.length}): ${overdueTasksSummary}
- Recent campaigns: ${campaignsSummary}
- Active agents: ${snapshot.activeAgentCount}
- Connected integrations: ${snapshot.integrationCount}

Your task: Write Neptune's contextual opening. Follow this cadence precisely:
1. Acknowledge — greet ${userName} briefly and acknowledge the time of day
2. Lead — surface the single most important thing from the workspace data
3. Layer — add one or two supporting details (secondary tasks, campaign trends, agent activity)
4. Invite — close with a natural invitation to act or explore further

Rules:
- Speak in flowing natural prose. No bullet points, no numbered lists, no headers.
- Be warm, direct, and confident. Avoid corporate language and filler phrases.
- Do not narrate the data mechanically — synthesise it into a human observation.
- Adjust urgency and tone based on the time of day guidance above.
- Keep the response to 3–5 sentences of prose plus any inline markers.

Inline markers (use sparingly, only where they genuinely add value):
- [VISUAL:chartType:{"key":"value","title":"Chart Title"}] — embed a chart or metric. chartType must be one of: line, bar, metric, comparison, trend.
- [ACTION:{"prompt":"question text","actions":[{"label":"Button Label","intent":"intent-string","args":{}}]}] — surface an actionable suggestion with quick-reply buttons.
- [LINK:{"module":"moduleName","label":"link label"}] — create a navigation shortcut to a platform module (e.g. crm, campaigns, tasks, agents).

Important: The JSON inside markers may contain arrays and nested objects. Ensure all JSON is valid.`;
}

// ---------------------------------------------------------------------------
// parseNarrativeResponse — balanced-bracket parser
// ---------------------------------------------------------------------------

type MarkerType = 'VISUAL' | 'ACTION' | 'LINK';

interface FoundMarker {
  start: number; // index of the opening '['
  end: number; // index of the closing ']' (inclusive)
  markerType: MarkerType;
  raw: string; // full marker text including brackets
  payload: string; // everything after the marker prefix, before the final ']'
}

const MARKER_PREFIXES: Record<MarkerType, string> = {
  VISUAL: '[VISUAL:',
  ACTION: '[ACTION:',
  LINK: '[LINK:',
};

/**
 * Walk `text` from `startIndex` counting brackets until depth returns to 0.
 * Returns the index of the closing ']', or -1 if not found.
 */
function findClosingBracket(text: string, startIndex: number): number {
  let depth = 0;
  for (let i = startIndex; i < text.length; i++) {
    if (text[i] === '[') depth++;
    else if (text[i] === ']') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Scan `text` for all marker occurrences in order of their position.
 */
function findAllMarkers(text: string): FoundMarker[] {
  const markers: FoundMarker[] = [];

  // Build a combined regex that matches any of our marker prefixes
  const prefixPattern = /\[(VISUAL|ACTION|LINK):/g;
  let match: RegExpExecArray | null;

  while ((match = prefixPattern.exec(text)) !== null) {
    const markerType = match[1] as MarkerType;
    const start = match.index;
    const closingIndex = findClosingBracket(text, start);

    if (closingIndex === -1) {
      // Unmatched bracket — skip
      continue;
    }

    const raw = text.slice(start, closingIndex + 1);
    // payload = everything after "[VISUAL:", "[ACTION:", or "[LINK:"
    const prefixLength = MARKER_PREFIXES[markerType].length;
    const payload = raw.slice(prefixLength, raw.length - 1);

    markers.push({ start, end: closingIndex, markerType, raw, payload });

    // Advance regex past this marker to avoid re-matching inside it
    prefixPattern.lastIndex = closingIndex + 1;
  }

  return markers;
}

/**
 * Parse a VISUAL payload: "chartType:{...json...}"
 * Returns a VisualSpec or null on failure.
 */
function parseVisualPayload(payload: string): VisualSpec | null {
  // payload looks like: "line:{"title":"Revenue","key":"val"}"
  const colonIdx = payload.indexOf(':');
  if (colonIdx === -1) return null;

  const chartType = payload.slice(0, colonIdx).trim();
  const jsonPart = payload.slice(colonIdx + 1).trim();

  const validChartTypes = ['line', 'bar', 'metric', 'comparison', 'trend'];
  if (!validChartTypes.includes(chartType)) return null;

  try {
    const data = JSON.parse(jsonPart) as Record<string, unknown>;
    const title = typeof data.title === 'string' ? data.title : undefined;
    return {
      chartType: chartType as VisualSpec['chartType'],
      data,
      interactive: true,
      ...(title !== undefined ? { title } : {}),
    };
  } catch {
    return null;
  }
}

/**
 * Parse an ACTION payload: {"prompt":"...","actions":[...]}
 */
function parseActionPayload(payload: string): { prompt: string; actions: ActionOption[] } | null {
  try {
    const parsed = JSON.parse(payload) as unknown;
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof (parsed as Record<string, unknown>).prompt !== 'string' ||
      !Array.isArray((parsed as Record<string, unknown>).actions)
    ) {
      return null;
    }
    const obj = parsed as { prompt: string; actions: ActionOption[] };
    return { prompt: obj.prompt, actions: obj.actions };
  } catch {
    return null;
  }
}

/**
 * Parse a LINK payload: {"module":"crm","label":"Open CRM"}
 */
function parseLinkPayload(
  payload: string,
): { module: string; entity?: string; label: string } | null {
  try {
    const parsed = JSON.parse(payload) as unknown;
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof (parsed as Record<string, unknown>).module !== 'string' ||
      typeof (parsed as Record<string, unknown>).label !== 'string'
    ) {
      return null;
    }
    const obj = parsed as { module: string; entity?: string; label: string };
    return {
      module: obj.module,
      label: obj.label,
      ...(obj.entity !== undefined ? { entity: obj.entity } : {}),
    };
  } catch {
    return null;
  }
}

export function parseNarrativeResponse(response: string): ContentBlock[] {
  if (!response) return [];

  const markers = findAllMarkers(response);
  const blocks: ContentBlock[] = [];
  let cursor = 0;

  for (const marker of markers) {
    // Text before this marker
    const textBefore = response.slice(cursor, marker.start);
    const trimmed = textBefore.trim();
    if (trimmed.length > 0) {
      blocks.push({ type: 'text', content: trimmed });
    }

    // Parse the marker itself
    let parsed = false;

    if (marker.markerType === 'VISUAL') {
      const spec = parseVisualPayload(marker.payload);
      if (spec) {
        blocks.push({ type: 'visual', spec });
        parsed = true;
      } else {
        logger.warn('narrative-builder: failed to parse VISUAL marker', { raw: marker.raw });
      }
    } else if (marker.markerType === 'ACTION') {
      const result = parseActionPayload(marker.payload);
      if (result) {
        blocks.push({ type: 'action-affordance', prompt: result.prompt, actions: result.actions });
        parsed = true;
      } else {
        logger.warn('narrative-builder: failed to parse ACTION marker', { raw: marker.raw });
      }
    } else if (marker.markerType === 'LINK') {
      const result = parseLinkPayload(marker.payload);
      if (result) {
        blocks.push({ type: 'module-link', module: result.module, label: result.label, ...(result.entity !== undefined ? { entity: result.entity } : {}) });
        parsed = true;
      } else {
        logger.warn('narrative-builder: failed to parse LINK marker', { raw: marker.raw });
      }
    }

    // Fall back to text if parse failed
    if (!parsed) {
      blocks.push({ type: 'text', content: marker.raw });
    }

    cursor = marker.end + 1;
  }

  // Trailing text after the last marker
  const trailing = response.slice(cursor).trim();
  if (trailing.length > 0) {
    blocks.push({ type: 'text', content: trailing });
  }

  return blocks;
}
