import { z } from 'zod';

const ChartTypeSchema = z.enum(['line', 'bar', 'metric', 'comparison', 'trend']);

const VisualSpecSchema = z.object({
  chartType: ChartTypeSchema,
  data: z.record(z.unknown()),
  interactive: z.boolean(),
  title: z.string().optional(),
});

const ActionOptionSchema = z.object({
  label: z.string(),
  intent: z.string(),
  args: z.record(z.unknown()).optional(),
  requiresConfirmation: z.boolean().optional(),
});

const TextBlockSchema = z.object({
  type: z.literal('text'),
  content: z.string(),
});

const VisualBlockSchema = z.object({
  type: z.literal('visual'),
  spec: VisualSpecSchema,
});

const ActionAffordanceBlockSchema = z.object({
  type: z.literal('action-affordance'),
  prompt: z.string(),
  actions: z.array(ActionOptionSchema).min(1),
});

const ModuleLinkBlockSchema = z.object({
  type: z.literal('module-link'),
  module: z.string(),
  entity: z.string().optional(),
  label: z.string(),
});

export const ContentBlockSchema = z.discriminatedUnion('type', [
  TextBlockSchema,
  VisualBlockSchema,
  ActionAffordanceBlockSchema,
  ModuleLinkBlockSchema,
]);

export const ConversationMessageSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  timestamp: z.string(),
  role: z.enum(['neptune', 'user']),
  blocks: z.array(ContentBlockSchema).min(1),
});

export const ConversationInitRequestSchema = z.object({
  sessionId: z.string().uuid().optional(),
});

export const ConversationSendRequestSchema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().min(1).max(4000),
});
