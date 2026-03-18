/** @deprecated Use schemas from '@/lib/validation/neptune-conversation' */
import { z } from 'zod';

const feedCardCategories = [
  'money', 'lead', 'followup', 'campaign',
  'opportunity', 'milestone', 'onboarding',
] as const;

const chipVariants = ['primary', 'secondary', 'ghost'] as const;

export const SmartChipSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  action: z.string().min(1),
  variant: z.enum(chipVariants),
  args: z.record(z.unknown()).optional(),
});

export const FeedCardSchema = z.object({
  id: z.string().min(1),
  category: z.enum(feedCardCategories),
  icon: z.string().min(1),
  headline: z.string().min(1).max(200),
  context: z.string().min(1).max(500),
  chips: z.array(SmartChipSchema).min(1).max(4),
  priority: z.number().min(1).max(10),
  dismissible: z.boolean(),
  metadata: z.record(z.unknown()).optional(),
});

export const FeedActionRequestSchema = z.object({
  cardId: z.string().min(1),
  chipId: z.string().min(1),
  action: z.string().min(1),
  args: z.record(z.unknown()).optional(),
});

export type { FeedCard, SmartChip, FeedActionRequest } from '@/types/home-feed';
