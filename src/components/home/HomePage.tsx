'use client';

import { NeptuneFeed } from './NeptuneFeed';
import { NeptuneConversation } from './NeptuneConversation';
import type { HomeFeedResponse } from '@/types/home-feed';

interface HomePageProps {
  initialData: HomeFeedResponse;
  useConversational?: boolean;
}

export function HomePage({ initialData, useConversational }: HomePageProps) {
  if (useConversational) {
    return (
      <div className="h-full">
        <NeptuneConversation />
      </div>
    );
  }

  return (
    <div className="h-full">
      <NeptuneFeed
        greeting={initialData.greeting}
        cards={initialData.cards}
        isNewUser={initialData.isNewUser}
      />
    </div>
  );
}
