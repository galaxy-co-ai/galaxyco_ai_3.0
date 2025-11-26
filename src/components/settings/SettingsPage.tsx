"use client";

import * as React from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  Key, 
  Palette, 
  Mail, 
  Smartphone,
  Globe,
  Check,
  LogOut,
  Laptop,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CosmicBackground } from "@/components/shared/CosmicBackground";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useClerk } from "@clerk/nextjs";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Settings context for sharing data between components
interface SettingsContextType {
  workspace: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    settings: Record<string, unknown>;
  } | null;
  profile: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string;
  } | null;
  isLoading: boolean;
  isSaving: boolean;
  saveWorkspace: (data: Record<string, unknown>) => Promise<void>;
  saveProfile: (data: Record<string, unknown>) => Promise<void>;
  mutate: () => void;
}

const SettingsContext = React.createContext<SettingsContextType | null>(null);

function useSettings() {
  const context = React.useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}

const SETTINGS_TABS = [
  { id: "general", label: "General", icon: Settings },
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "api", label: "API Keys", icon: Key },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "appearance", label: "Appearance", icon: Palette },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState("general");
  const [isSaving, setIsSaving] = React.useState(false);
  const { signOut } = useClerk();

  // Fetch settings from API
  const { data, error, isLoading, mutate } = useSWR('/api/settings', fetcher);

  const saveWorkspace = async (workspaceData: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace: workspaceData }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save');
      }

      toast.success('Workspace settings saved');
      mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const saveProfile = async (profileData: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: profileData }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save');
      }

      toast.success('Profile saved');
      mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const contextValue: SettingsContextType = {
    workspace: data?.workspace || null,
    profile: data?.profile || null,
    isLoading,
    isSaving,
    saveWorkspace,
    saveProfile,
    mutate,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
    <div className="relative h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-50">
        <CosmicBackground />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-8 md:px-12 border-b bg-background/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your workspace preferences and account details
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r bg-background/30 backdrop-blur-sm hidden md:flex flex-col">
          <div className="p-4 space-y-1">
            {SETTINGS_TABS.map((tab) => (
              <Button
                key={tab.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 font-medium",
                  activeTab === tab.id 
                    ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary" 
                    : "text-muted-foreground hover:bg-background/50"
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </Button>
            ))}
          </div>
          
          <div className="mt-auto p-4 border-t border-border/50">
            <div className="flex items-center gap-3 px-2 py-3 mb-2">
              <Avatar className="h-9 w-9 border">
                <AvatarImage src={data?.profile?.avatarUrl || "/avatars/user.png"} />
                <AvatarFallback>
                  {data?.profile?.firstName?.[0] || ''}{data?.profile?.lastName?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">
                  {data?.profile?.firstName && data?.profile?.lastName 
                    ? `${data.profile.firstName} ${data.profile.lastName}`
                    : 'Loading...'}
                </p>
                <p className="text-xs text-muted-foreground truncate">{data?.profile?.email || ''}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              onClick={() => signOut({ redirectUrl: '/' })}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 scroll-smooth">
          <div className="max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {activeTab === "general" && <GeneralSettings />}
                {activeTab === "profile" && <ProfileSettings />}
                {activeTab === "notifications" && <NotificationSettings />}
                {activeTab === "security" && <SecuritySettings />}
                {activeTab === "api" && <ApiSettings />}
                {activeTab === "billing" && <BillingSettings />}
                {activeTab === "appearance" && <AppearanceSettings />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
    </SettingsContext.Provider>
  );
}

/* --- Sub-components for Sections --- */

function GeneralSettings() {
  const { workspace, isLoading, isSaving, saveWorkspace } = useSettings();
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");

  React.useEffect(() => {
    if (workspace) {
      setName(workspace.name || "");
      setSlug(workspace.slug || "");
    }
  }, [workspace]);

  const handleSave = () => {
    saveWorkspace({ name, slug });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Workspace Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your workspace information and defaults.</p>
      </div>
      <Separator />
      
      <Card>
        <CardHeader>
          <CardTitle>Workspace Information</CardTitle>
          <CardDescription>This is visible to all members of your team.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="workspace-name">Workspace Name</Label>
            <Input 
              id="workspace-name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              placeholder={isLoading ? "Loading..." : "Workspace name"}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="workspace-url">Workspace URL</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md border">
                galaxyco.ai/
              </span>
              <Input 
                id="workspace-url" 
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                disabled={isLoading}
                placeholder={isLoading ? "Loading..." : "workspace-url"}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4 bg-muted/20">
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Language & Region</CardTitle>
          <CardDescription>Set your preferred language and timezone.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
             <div className="grid gap-2">
               <Label>Language</Label>
               <Input defaultValue="English (US)" readOnly className="bg-muted/50" />
             </div>
             <div className="grid gap-2">
               <Label>Timezone</Label>
               <Input defaultValue="Pacific Time (US & Canada)" readOnly className="bg-muted/50" />
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileSettings() {
  const { profile, isLoading, isSaving, saveProfile } = useSettings();
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");

  React.useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || "");
      setLastName(profile.lastName || "");
    }
  }, [profile]);

  const handleSave = () => {
    saveProfile({ firstName, lastName });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Profile</h2>
        <p className="text-sm text-muted-foreground">Manage your personal information.</p>
      </div>
      <Separator />

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={profile?.avatarUrl || "/avatars/user.png"} />
                <AvatarFallback className="text-2xl">
                  {firstName?.[0] || ''}{lastName?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm">Change Avatar</Button>
            </div>
            <div className="flex-1 space-y-4 w-full">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isLoading}
                  placeholder={isLoading ? "Loading..." : "First name"}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isLoading}
                  placeholder={isLoading ? "Loading..." : "Last name"}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  value={profile?.email || ""}
                  disabled
                  className="bg-muted/50"
                />
                <p className="text-xs text-muted-foreground">Email is managed by your authentication provider</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end border-t px-6 py-4 bg-muted/20">
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Profile"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function NotificationSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Notifications</h2>
        <p className="text-sm text-muted-foreground">Choose how and when you want to be notified.</p>
      </div>
      <Separator />

      <div className="space-y-4">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Mail className="h-4 w-4" /> Email Notifications
        </h3>
        <Card>
          <CardContent className="grid gap-4 p-6">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="marketing" className="flex flex-col space-y-1">
                <span>Product Updates</span>
                <span className="font-normal text-sm text-muted-foreground">Receive news about new features and improvements.</span>
              </Label>
              <Switch id="marketing" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="security" className="flex flex-col space-y-1">
                <span>Security Alerts</span>
                <span className="font-normal text-sm text-muted-foreground">Get notified about login attempts and security changes.</span>
              </Label>
              <Switch id="security" defaultChecked disabled />
            </div>
            <Separator />
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="digest" className="flex flex-col space-y-1">
                <span>Weekly Digest</span>
                <span className="font-normal text-sm text-muted-foreground">A summary of your team's activity and performance.</span>
              </Label>
              <Switch id="digest" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Smartphone className="h-4 w-4" /> Push Notifications
        </h3>
        <Card>
          <CardContent className="grid gap-4 p-6">
             <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="push-mentions" className="flex flex-col space-y-1">
                <span>Mentions & Comments</span>
                <span className="font-normal text-sm text-muted-foreground">When someone mentions you or replies to your comment.</span>
              </Label>
              <Switch id="push-mentions" defaultChecked />
            </div>
            <Separator />
             <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="push-assigned" className="flex flex-col space-y-1">
                <span>Task Assignments</span>
                <span className="font-normal text-sm text-muted-foreground">When a task is assigned to you.</span>
              </Label>
              <Switch id="push-assigned" defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Security</h2>
        <p className="text-sm text-muted-foreground">Manage your password and security preferences.</p>
      </div>
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your password or enable 2FA.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input id="current-password" type="password" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input id="confirm-password" type="password" />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4 bg-muted/20 flex justify-between">
          <Button variant="ghost">Forgot password?</Button>
          <Button>Update Password</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
             <div className="space-y-1">
               <CardTitle>Two-Factor Authentication</CardTitle>
               <CardDescription>Add an extra layer of security to your account.</CardDescription>
             </div>
             <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Enabled</Badge>
          </div>
        </CardHeader>
        <CardContent>
           <p className="text-sm text-muted-foreground mb-4">
             Two-factor authentication is currently enabled using an authenticator app.
           </p>
           <Button variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50">Disable 2FA</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ApiSettings() {
  return (
    <div className="space-y-6">
       <div>
        <h2 className="text-lg font-medium">API Keys</h2>
        <p className="text-sm text-muted-foreground">Manage your API keys for external integrations.</p>
      </div>
      <Separator />

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
             <div>
                <h3 className="font-medium">Production Key</h3>
                <p className="text-xs text-muted-foreground">Created on Oct 24, 2023</p>
             </div>
             <div className="flex items-center gap-2">
                <code className="bg-muted px-2 py-1 rounded text-xs font-mono">sk_live_...9f2a</code>
                <Button variant="ghost" size="icon" className="h-8 w-8"><Check className="h-4 w-4" /></Button>
                <Button variant="destructive" size="sm">Revoke</Button>
             </div>
          </div>
          <Separator className="my-4" />
          <div className="flex items-center justify-between mb-4">
             <div>
                <h3 className="font-medium">Development Key</h3>
                <p className="text-xs text-muted-foreground">Created on Nov 01, 2023</p>
             </div>
             <div className="flex items-center gap-2">
                <code className="bg-muted px-2 py-1 rounded text-xs font-mono">sk_test_...8b1c</code>
                <Button variant="ghost" size="icon" className="h-8 w-8"><Check className="h-4 w-4" /></Button>
                <Button variant="destructive" size="sm">Revoke</Button>
             </div>
          </div>
          
          <Button className="w-full mt-4" variant="outline">
             <PlusIcon className="h-4 w-4 mr-2" /> Generate New Key
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function BillingSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Billing & Plans</h2>
        <p className="text-sm text-muted-foreground">Manage your subscription and payment methods.</p>
      </div>
      <Separator />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/20 shadow-md bg-gradient-to-b from-primary/5 to-transparent">
          <CardHeader>
             <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-primary">Pro Plan</CardTitle>
                  <CardDescription>For growing teams</CardDescription>
                </div>
                <Badge className="bg-primary">Active</Badge>
             </div>
          </CardHeader>
          <CardContent>
             <div className="text-3xl font-bold mb-4">$29<span className="text-base font-normal text-muted-foreground">/mo</span></div>
             <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Unlimited AI Agents</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Advanced Analytics</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Priority Support</li>
             </ul>
          </CardContent>
          <CardFooter>
             <Button variant="outline" className="w-full">Change Plan</Button>
          </CardFooter>
        </Card>

        <Card>
           <CardHeader>
             <CardTitle>Payment Method</CardTitle>
             <CardDescription>Manage your billing details</CardDescription>
           </CardHeader>
           <CardContent>
              <div className="flex items-center gap-4 p-4 border rounded-lg mb-4">
                 <div className="h-8 w-12 bg-slate-800 rounded flex items-center justify-center text-white text-xs font-bold">VISA</div>
                 <div>
                    <p className="text-sm font-medium">Visa ending in 4242</p>
                    <p className="text-xs text-muted-foreground">Expires 12/24</p>
                 </div>
              </div>
              <p className="text-xs text-muted-foreground">Next billing date: November 24, 2025</p>
           </CardContent>
           <CardFooter>
              <Button variant="outline" className="w-full">Update Payment</Button>
           </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function AppearanceSettings() {
    return (
        <div className="space-y-6">
             <div>
                <h2 className="text-lg font-medium">Appearance</h2>
                <p className="text-sm text-muted-foreground">Customize the look and feel of your workspace.</p>
            </div>
            <Separator />

            <Card>
                <CardContent className="p-6">
                    <div className="grid gap-8">
                        <div className="space-y-4">
                            <Label>Theme</Label>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2 cursor-pointer group">
                                    <div className="h-24 rounded-lg border-2 border-primary bg-[#f8fafc] p-2 shadow-sm">
                                        <div className="h-full w-full rounded bg-white border border-dashed border-slate-300" />
                                    </div>
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-sm font-medium">Light</span>
                                        <Check className="h-3 w-3 text-primary" />
                                    </div>
                                </div>
                                <div className="space-y-2 cursor-pointer group opacity-50 hover:opacity-100 transition-opacity">
                                    <div className="h-24 rounded-lg border-2 border-transparent bg-[#0f172a] p-2 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
                                        <div className="h-full w-full rounded bg-slate-900 border border-dashed border-slate-700" />
                                    </div>
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-sm font-medium">Dark</span>
                                    </div>
                                </div>
                                <div className="space-y-2 cursor-pointer group opacity-50 hover:opacity-100 transition-opacity">
                                    <div className="h-24 rounded-lg border-2 border-transparent bg-gradient-to-br from-slate-100 to-slate-900 p-2 shadow-sm ring-1 ring-slate-200">
                                         <div className="h-full w-full rounded bg-gradient-to-br from-white to-slate-900 border border-dashed border-slate-400" />
                                    </div>
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-sm font-medium">System</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function PlusIcon(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12h14" />
        <path d="M12 5v14" />
      </svg>
    )
  }









