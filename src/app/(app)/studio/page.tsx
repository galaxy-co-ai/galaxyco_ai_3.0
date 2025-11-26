import { Metadata } from 'next';
import StudioDashboard from '@/components/studio/StudioDashboard';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

export const metadata: Metadata = {
  title: 'Studio | GalaxyCo.ai',
  description: 'Build, customize, and manage your AI agents and workflows',
};

export default function StudioPage() {
  return (
    <ErrorBoundary>
      <StudioDashboard />
    </ErrorBoundary>
  );
}
