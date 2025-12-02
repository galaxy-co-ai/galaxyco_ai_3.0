import { Metadata } from 'next';
import CreatorDashboard from '@/components/creator/CreatorDashboard';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

export const metadata: Metadata = {
  title: 'Creator | GalaxyCo.ai',
  description: 'AI-powered content and asset creation studio',
};

export default function CreatorPage() {
  return (
    <ErrorBoundary>
      <CreatorDashboard />
    </ErrorBoundary>
  );
}
