import { currentUser } from "@clerk/nextjs/server";
import { AppLayout } from "@/components/galaxy/app-layout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export default async function AppLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  // Build user data for the layout
  const userData = user
    ? {
        name: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.emailAddresses[0]?.emailAddress?.split("@")[0] || "User",
        email: user.emailAddresses[0]?.emailAddress || "",
        avatar: user.imageUrl || undefined,
        initials: user.firstName && user.lastName
          ? `${user.firstName[0]}${user.lastName[0]}`
          : user.emailAddresses[0]?.emailAddress?.[0]?.toUpperCase() || "U",
      }
    : {
        name: "Guest",
        email: "",
        initials: "G",
      };

  return (
    <ErrorBoundary>
      <AppLayout
        user={userData}
        headerProps={{
          showSearch: true,
          showNotifications: true,
          notificationCount: 0,
        }}
      >
        {children}
      </AppLayout>
    </ErrorBoundary>
  );
}
