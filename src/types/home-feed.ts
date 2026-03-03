export type FeedCardCategory =
  | 'money'
  | 'lead'
  | 'followup'
  | 'campaign'
  | 'opportunity'
  | 'milestone'
  | 'onboarding';

export type ChipVariant = 'primary' | 'secondary' | 'ghost';

export interface SmartChip {
  id: string;
  label: string;
  action: string;
  variant: ChipVariant;
  args?: Record<string, unknown>;
}

export interface FeedCard {
  id: string;
  category: FeedCardCategory;
  icon: string;
  headline: string;
  context: string;
  chips: SmartChip[];
  priority: number;
  dismissible: boolean;
  metadata?: Record<string, unknown>;
}

export interface FeedCardExpansion {
  cardId: string;
  message: string;
  chips?: SmartChip[];
  slidePanel?: {
    title: string;
    href: string;
  };
}

export interface FeedActionRequest {
  cardId: string;
  chipId: string;
  action: string;
  args?: Record<string, unknown>;
}

export interface FeedActionResponse {
  success: boolean;
  expansion: FeedCardExpansion;
}

export interface HomeFeedResponse {
  greeting: string;
  cards: FeedCard[];
  isNewUser: boolean;
}
