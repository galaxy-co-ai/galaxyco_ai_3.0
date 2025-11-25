import { AppLayout } from "@/components/galaxy/app-layout";
import { getCurrentUser } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";

export const dynamic = 'force-dynamic';

export default async function AppLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      // Redirect to sign-in if not authenticated
      return (
        <div className="flex items-center justify-center min-h-screen">
          <p>Please sign in to continue</p>
        </div>
      );
    }

    const user = await getCurrentUser();
    const userInitials = user.firstName && user.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : user.email[0].toUpperCase();

    return (
      <AppLayout
        user={{
          name: user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.email,
          email: user.email,
          initials: userInitials,
        }}
        headerProps={{
          showSearch: true,
          showNotifications: true,
          notificationCount: 0, // TODO: Get real notification count
        }}
      >
        {children}
      </AppLayout>
    );
  } catch (error) {
    console.error('Layout error:', error);
    // Fallback to basic layout on error
    return (
      <AppLayout
        user={{
          name: "User",
          email: "user@example.com",
          initials: "U",
        }}
        headerProps={{
          showSearch: true,
          showNotifications: true,
          notificationCount: 0,
        }}
      >
        {children}
      </AppLayout>
    );
  }
}

