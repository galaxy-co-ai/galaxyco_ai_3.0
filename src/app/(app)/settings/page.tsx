import { SettingsPage as SettingsContent } from "@/components/settings/SettingsPage";

// Force dynamic rendering - this page uses Clerk hooks which require runtime context
export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  return <SettingsContent />;
}
