import { AppLayout } from "@/components/galaxy/app-layout";

// Mock user data - replace with actual auth
const mockUser = {
  name: "John Doe",
  email: "john@company.com",
  initials: "JD",
};

export default function AppLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout
      user={mockUser}
      headerProps={{
        showSearch: true,
        showNotifications: true,
        notificationCount: 1,
      }}
    >
      {children}
    </AppLayout>
  );
}

