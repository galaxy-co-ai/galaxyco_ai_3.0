import { redirect } from 'next/navigation';
import { isSystemAdmin } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

/**
 * Admin Layout - Mission Control
 * 
 * This layout wraps all /admin routes and provides:
 * - Server-side admin verification (double-check after middleware)
 * - Admin-specific sidebar navigation
 * - Consistent styling for Mission Control
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Double-check admin access (middleware should have already checked)
  const isAdmin = await isSystemAdmin();
  
  if (!isAdmin) {
    redirect('/dashboard');
  }

  return (
    <div className="flex h-full">
      {/* Admin Sidebar */}
      <AdminSidebar />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
