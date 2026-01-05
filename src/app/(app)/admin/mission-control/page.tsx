/**
 * Mission Control - Agent Builder
 * 
 * Build, test, and deploy n8n-powered agents for users.
 * 
 * Workflow:
 * 1. Build agents in local n8n desktop app
 * 2. Export workflow JSON
 * 3. Import and configure in Mission Control
 * 4. Deploy to production cloud n8n
 * 5. Make available to users as agent templates
 */

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { MissionControlClient } from '@/components/admin/MissionControlClient';

export const metadata = {
  title: 'Mission Control - Agent Builder | GalaxyCo Admin',
  description: 'Build and deploy AI agents for users',
};

export default async function MissionControlPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }
  
  // TODO: Add admin check
  // const isAdmin = await checkIsAdmin(userId);
  // if (!isAdmin) redirect('/dashboard');
  
  return (
    <div className="h-full">
      <MissionControlClient />
    </div>
  );
}
