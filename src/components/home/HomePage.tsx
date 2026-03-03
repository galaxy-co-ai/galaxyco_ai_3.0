'use client';

import { NeptuneFeed } from './NeptuneFeed';
import type { HomeFeedResponse } from '@/types/home-feed';

interface HomePageProps {
  initialData: HomeFeedResponse;
}

export function HomePage({ initialData }: HomePageProps) {
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
