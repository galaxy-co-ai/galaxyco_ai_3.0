import { Metadata } from 'next';
import StudioDashboard from '@/components/studio/StudioDashboard';

export const metadata: Metadata = {
  title: 'Studio | GalaxyCo.ai',
  description: 'Build, customize, and manage your AI agents and workflows',
};

export default function StudioPage() {
  return <StudioDashboard />;
}
