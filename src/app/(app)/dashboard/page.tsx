import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { HomePage } from '@/components/home';
import { getCurrentWorkspace } from '@/lib/auth';
import { generateFeedCards, generateGreeting } from '@/lib/home/card-engine';
import { logger } from '@/lib/logger';
import type { HomeFeedResponse } from '@/types/home-feed';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Home | GalaxyCo.ai',
  description: 'Your proactive business command center',
};

export default async function DashboardPage() {
  let initialData: HomeFeedResponse = {
    greeting: 'Welcome back.',
    cards: [],
    isNewUser: true,
  };

  try {
    const { workspaceId, userId, user } = await getCurrentWorkspace();
    const userName =
      `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'there';

    const cards = await generateFeedCards(workspaceId, userId, userName);
    const greeting = generateGreeting(userName);
    const isNewUser = cards.some((c) => c.category === 'onboarding');

    initialData = { greeting, cards, isNewUser };
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      redirect('/sign-in');
    }
    logger.error('Home page error', { error });
  }

  return (
    <ErrorBoundary>
      <HomePage initialData={initialData} />
    </ErrorBoundary>
  );
}
