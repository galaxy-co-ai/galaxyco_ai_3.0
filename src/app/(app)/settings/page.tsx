"use client";

import * as React from "react";
import { useUser, OrganizationProfile } from "@clerk/nextjs";
import useSWR from "swr";
import { 
  User, 
  Building2, 
  Users, 
  CreditCard, 
  Shield, 
  Bell, 
  Key,
  ChevronRight,
  Camera,
  Mail,
  Globe,
  Check,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Crown,
  Sparkles,
  Clock,
  RefreshCw,
  LogOut,
  Smartphone,
  Monitor,
  Loader2,
  Play,
  X,
  Palette,
  Sun,
  Moon,
  Webhook,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";


import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme-provider";

// SWR fetcher
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to fetch' }));
    throw new Error(error.error || 'Failed to fetch');
  }
  return res.json();
};

type SettingsSection = "profile" | "workspace" | "team" | "billing" | "security" | "notifications" | "appearance" | "webhooks" | "api";

interface SettingsCategory {
  id: SettingsSection;
  name: string;
  icon: React.ElementType;
  description: string;
}

const SETTINGS_CATEGORIES: SettingsCategory[] = [
  { id: "profile", name: "Profile", icon: User, description: "Your personal information" },
  { id: "workspace", name: "Workspace", icon: Building2, description: "Workspace settings" },
  { id: "team", name: "Team", icon: Users, description: "Manage team members" },
  { id: "billing", name: "Billing", icon: CreditCard, description: "Plans and payments" },
  { id: "security", name: "Security", icon: Shield, description: "Password and 2FA" },
  { id: "notifications", name: "Notifications", icon: Bell, description: "Alert preferences" },
  { id: "appearance", name: "Appearance", icon: Palette, description: "Theme and display" },
  { id: "webhooks", name: "Webhooks", icon: Webhook, description: "Manage webhooks" },
  { id: "api", name: "API Keys", icon: Key, description: "Developer access" },
];

// Mock sessions data for security section (TODO: Replace with real API data)
const mockSessions = [
  { id: "1", device: "MacBook Pro - Chrome", location: "San Francisco, CA", lastActive: "Now", current: true },
  { id: "2", device: "iPhone 15 Pro - Safari", location: "San Francisco, CA", lastActive: "2 hours ago", current: false },
  { id: "3", device: "Windows PC - Firefox", location: "New York, NY", lastActive: "Yesterday", current: false },
];

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const [activeSection, setActiveSection] = React.useState<SettingsSection>("profile");
  const [showApiKey, setShowApiKey] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const { theme, setTheme, accentColor, setAccentColor, fontSize, setFontSize } = useTheme();
  
  // Fetch data using SWR
  const { data: profileData, mutate: mutateProfile } = useSWR('/api/settings/profile', fetcher);
  const { data: workspaceData, mutate: mutateWorkspace } = useSWR('/api/settings/workspace', fetcher);
  const { data: apiKeysData, mutate: mutateApiKeys } = useSWR('/api/settings/api-keys', fetcher);
  const { data: notificationsData, mutate: mutateNotifications } = useSWR('/api/settings/notifications', fetcher);
  const { data: appearanceData, mutate: mutateAppearance } = useSWR('/api/settings/appearance', fetcher);
  const { data: webhooksData, mutate: mutateWebhooks } = useSWR('/api/settings/webhooks', fetcher);
  const { data: billingData, isLoading: billingLoading } = useSWR('/api/settings/billing', fetcher);
  
  // Build user profile from Clerk data and API
  const userProfile = React.useMemo(() => {
    if (!user) return null;
    const fullName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
    const email = user.primaryEmailAddress?.emailAddress || profileData?.email || '';
    const phone = user.primaryPhoneNumber?.phoneNumber || '';
    const avatar = user.imageUrl || profileData?.avatarUrl || '';
    
    return {
      name: fullName,
      email,
      phone,
      avatar,
      role: profileData?.role || "member",
      timezone: profileData?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }, [user, profileData]);
  
  // Form states - initialize with API data when available
  const [profileForm, setProfileForm] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    avatar: "",
    role: "Owner",
    timezone: "America/New_York",
  });
  
  const [workspaceForm, setWorkspaceForm] = React.useState({
    name: "",
    slug: "",
    plan: "Free",
    members: 0,
    createdAt: new Date().toISOString(),
  });
  
  // Update forms when API data loads
  React.useEffect(() => {
    if (profileData) {
      const nameParts = (profileData.firstName && profileData.lastName) 
        ? { firstName: profileData.firstName, lastName: profileData.lastName }
        : { firstName: user?.firstName || '', lastName: user?.lastName || '' };
      setProfileForm({
        firstName: nameParts.firstName || '',
        lastName: nameParts.lastName || '',
        email: profileData.email || user?.primaryEmailAddress?.emailAddress || '',
        phone: user?.primaryPhoneNumber?.phoneNumber || '',
        avatar: profileData.avatarUrl || user?.imageUrl || '',
        role: "Owner",
        timezone: profileData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    }
  }, [profileData, user]);
  
  React.useEffect(() => {
    if (workspaceData) {
      setWorkspaceForm({
        name: workspaceData.name || '',
        slug: workspaceData.slug || '',
        plan: workspaceData.plan || 'Free',
        members: workspaceData.members || 0,
        createdAt: workspaceData.createdAt || new Date().toISOString(),
      });
    }
  }, [workspaceData]);
  
  // Notification preferences
  const [notificationTypes, setNotificationTypes] = React.useState({
    new_task: { email: true, push: true },
    task_completed: { email: true, push: false },
    comment_added: { email: true, push: true },
    mention: { email: true, push: true },
    team_invite: { email: true, push: true },
    workspace_update: { email: false, push: false },
    billing: { email: true, push: false },
    security: { email: true, push: true },
    marketing: { email: false, push: false },
  });
  const [notificationFrequency, setNotificationFrequency] = React.useState<'instant' | 'hourly' | 'daily'>('instant');
  const [quietHours, setQuietHours] = React.useState({
    enabled: false,
    start: '22:00',
    end: '08:00',
  });
  
  // Webhook state
  const [showAddWebhook, setShowAddWebhook] = React.useState(false);
  const [webhookForm, setWebhookForm] = React.useState({
    name: '',
    url: '',
    events: [] as string[],
    description: '',
  });
  const [testingWebhook, setTestingWebhook] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    if (notificationsData) {
      if (notificationsData.types) {
        setNotificationTypes(notificationsData.types);
      }
      if (notificationsData.frequency) {
        setNotificationFrequency(notificationsData.frequency);
      }
      if (notificationsData.quietHours) {
        setQuietHours(notificationsData.quietHours);
      }
    }
  }, [notificationsData]);

  // Save handlers
  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const [firstName, ...lastNameParts] = profileForm.firstName.split(' ');
      const lastName = lastNameParts.join(' ') || profileForm.lastName;
      
      const res = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName || profileForm.firstName,
          lastName: lastName || profileForm.lastName,
          timezone: profileForm.timezone,
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save profile');
      }
      
      await mutateProfile();
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSaveWorkspace = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings/workspace', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: workspaceForm.name,
          slug: workspaceForm.slug,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save workspace');
      }
      
      // Update form with returned data to avoid stale state
      if (data.workspace) {
        setWorkspaceForm(prev => ({
          ...prev,
          name: data.workspace.name,
          slug: data.workspace.slug,
        }));
      }
      
      // Revalidate cache
      await mutateWorkspace();
      toast.success("Workspace updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save workspace");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleNotificationChange = async (updates: any) => {
    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save notifications');
      }
      
      await mutateNotifications();
      toast.success('Notification preferences updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save notifications');
    }
  };

  const handleCopyApiKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("API key copied to clipboard");
  };

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return (
          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-4">
              <div className="relative group cursor-pointer">
                <Avatar className="h-16 w-16 ring-2 ring-gray-100">
                  <AvatarImage src={profileForm.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-600 text-lg font-medium">
                    {[profileForm.firstName, profileForm.lastName].filter(Boolean).map(n => n[0]).join('') || profileForm.email[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <button 
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 group-hover:bg-black/40 transition-all duration-200"
                  aria-label="Change avatar"
                >
                  <Camera className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </button>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  {[profileForm.firstName, profileForm.lastName].filter(Boolean).join(' ') || profileForm.email || 'User'}
                </h3>
                <p className="text-sm text-gray-500">{profileForm.email}</p>
                <Badge className="mt-1 bg-indigo-100 text-indigo-700 border-0 text-xs">
                  <Crown className="h-3 w-3 mr-1" />
                  {profileForm.role}
                </Badge>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-xs text-gray-600">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    className="h-9 text-sm"
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-xs text-gray-600">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    className="h-9 text-sm"
                    disabled={isSaving}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs text-gray-600">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      disabled
                      className="h-9 text-sm pl-8 bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email is managed by Clerk</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="timezone" className="text-xs text-gray-600">Timezone</Label>
                  <div className="relative">
                    <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      id="timezone"
                      value={profileForm.timezone}
                      onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                      className="h-9 text-sm pl-8"
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <Button 
                size="sm" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white" 
                onClick={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        );

      case "workspace":
        return (
          <div className="space-y-6">
            <div className="grid gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="workspace-name" className="text-xs text-gray-600">Workspace Name</Label>
                <Input
                  id="workspace-name"
                  value={workspaceForm.name}
                  onChange={(e) => setWorkspaceForm({ ...workspaceForm, name: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="workspace-slug" className="text-xs text-gray-600">Workspace URL</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">galaxyco.ai/</span>
                  <Input
                    id="workspace-slug"
                    value={workspaceForm.slug}
                    onChange={(e) => setWorkspaceForm({ ...workspaceForm, slug: e.target.value })}
                    className="h-9 text-sm flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Workspace Stats */}
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Current Plan</span>
                <Badge className="bg-indigo-100 text-indigo-700 border-0">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {workspaceForm.plan}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm mt-3">
                <span className="text-gray-600">Team Members</span>
                <span className="text-gray-900 font-medium">{workspaceForm.members}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-3">
                <span className="text-gray-600">Created</span>
                <span className="text-gray-900">{new Date(workspaceForm.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <Button 
                size="sm" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white" 
                onClick={handleSaveWorkspace}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        );

      case "team":
        return (
          <div className="space-y-4">
            <OrganizationProfile
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border-0 w-full",
                  navbar: "hidden",
                  pageScrollBox: "p-0",
                  page: "p-0",
                },
              }}
              routing="hash"
            />
          </div>
        );

      case "billing":
        const handleUpgrade = async (planName: string, priceId: string) => {
          setIsSaving(true);
          try {
            const res = await fetch('/api/stripe/checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ priceId, planName }),
            });
            const data = await res.json();
            if (data.url) {
              window.location.href = data.url;
            } else {
              toast.error(data.error || 'Failed to start checkout');
            }
          } catch {
            toast.error('Failed to start checkout');
          } finally {
            setIsSaving(false);
          }
        };

        const handleManageBilling = async () => {
          setIsSaving(true);
          try {
            const res = await fetch('/api/stripe/portal', { method: 'POST' });
            const data = await res.json();
            if (data.url) {
              window.location.href = data.url;
            } else {
              toast.error(data.error || 'Failed to open billing portal');
            }
          } catch {
            toast.error('Failed to open billing portal');
          } finally {
            setIsSaving(false);
          }
        };

        if (billingLoading) {
          return (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          );
        }

        const plan = billingData?.plan || { id: 'free', name: 'Free', price: 0 };
        const usage = billingData?.usage || {
          aiCredits: { used: 0, limit: 100 },
          storage: { used: 0, limit: 1 },
          teamMembers: { used: 1, limit: 1 },
        };
        const paymentMethod = billingData?.paymentMethod;
        const renewalDate = billingData?.currentPeriodEnd 
          ? new Date(billingData.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : null;

        const planGradients: Record<string, string> = {
          free: 'from-gray-400 to-gray-600',
          starter: 'from-blue-500 to-cyan-500',
          professional: 'from-indigo-500 to-purple-600',
          enterprise: 'from-amber-500 to-orange-600',
        };

        return (
          <div className="space-y-6">
            {/* Current Plan */}
            <div className={`p-4 rounded-xl bg-gradient-to-r ${planGradients[plan.id] || planGradients.free} text-white`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm opacity-90">Current Plan</p>
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    {plan.id !== 'free' && <Sparkles className="h-5 w-5" />}
                    {plan.name}
                  </h3>
                </div>
                {plan.id === 'free' ? (
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="bg-white/20 hover:bg-white/30 text-white border-0"
                    onClick={() => handleUpgrade('starter', process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || '')}
                    disabled={isSaving}
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upgrade'}
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="bg-white/20 hover:bg-white/30 text-white border-0"
                    onClick={handleManageBilling}
                    disabled={isSaving}
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Manage'}
                  </Button>
                )}
              </div>
              <div className="text-sm opacity-90">
                {plan.price > 0 ? `$${plan.price}/month` : 'No charge'}
                {renewalDate && ` • Renews ${renewalDate}`}
                {billingData?.cancelAtPeriodEnd && ' • Cancels at period end'}
              </div>
            </div>

            {/* Upgrade Options (for free users) */}
            {plan.id === 'free' && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleUpgrade('starter', process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || '')}
                  className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50 hover:border-blue-400 transition-colors text-left"
                  disabled={isSaving}
                >
                  <p className="font-semibold text-blue-900">Starter</p>
                  <p className="text-sm text-blue-700">$19/month</p>
                  <p className="text-xs text-blue-600 mt-1">1,000 AI credits, 5GB storage</p>
                </button>
                <button
                  onClick={() => handleUpgrade('professional', process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '')}
                  className="p-4 rounded-lg border-2 border-indigo-200 bg-indigo-50 hover:border-indigo-400 transition-colors text-left"
                  disabled={isSaving}
                >
                  <p className="font-semibold text-indigo-900">Professional</p>
                  <p className="text-sm text-indigo-700">$49/month</p>
                  <p className="text-xs text-indigo-600 mt-1">10,000 AI credits, 25GB storage</p>
                </button>
              </div>
            )}

            {/* Usage */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Usage This Month</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">AI Credits</span>
                    <span className="text-gray-900">{usage.aiCredits.used.toLocaleString()} / {usage.aiCredits.limit.toLocaleString()}</span>
                  </div>
                  <Progress value={usage.aiCredits.limit > 0 ? (usage.aiCredits.used / usage.aiCredits.limit) * 100 : 0} className="h-1.5" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Storage</span>
                    <span className="text-gray-900">{usage.storage.used} GB / {usage.storage.limit} GB</span>
                  </div>
                  <Progress value={usage.storage.limit > 0 ? (usage.storage.used / usage.storage.limit) * 100 : 0} className="h-1.5" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Team Members</span>
                    <span className="text-gray-900">{usage.teamMembers.used} / {usage.teamMembers.limit}</span>
                  </div>
                  <Progress value={usage.teamMembers.limit > 0 ? (usage.teamMembers.used / usage.teamMembers.limit) * 100 : 0} className="h-1.5" />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            {paymentMethod ? (
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-white border border-gray-200">
                      <CreditCard className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {paymentMethod.brand} •••• {paymentMethod.last4}
                      </p>
                      <p className="text-xs text-gray-500">
                        Expires {paymentMethod.expMonth}/{paymentMethod.expYear}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs text-gray-600"
                    onClick={handleManageBilling}
                    disabled={isSaving}
                  >
                    Update
                  </Button>
                </div>
              </div>
            ) : plan.id !== 'free' && (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2 text-amber-800">
                  <CreditCard className="h-4 w-4" />
                  <p className="text-sm">No payment method on file</p>
                </div>
              </div>
            )}
          </div>
        );

      case "security":
        const twoFactorEnabled = user?.twoFactorEnabled ?? false;
        
        const handleManageSecurity = () => {
          // Open Clerk's user profile to security settings
          if (user) {
            // Clerk provides openUserProfile for managing security
            window.location.href = '/user';
          }
        };
        
        return (
          <div className="space-y-6">
            {/* Password */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Password</h4>
              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                <div>
                  <p className="text-sm text-gray-900">Password</p>
                  <p className="text-xs text-gray-500">Managed via your account settings</p>
                </div>
                <Button variant="outline" size="sm" className="text-xs" onClick={handleManageSecurity}>
                  Change Password
                </Button>
              </div>
            </div>

            {/* 2FA */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-md", twoFactorEnabled ? "bg-green-50" : "bg-amber-50")}>
                    <Shield className={cn("h-4 w-4", twoFactorEnabled ? "text-green-600" : "text-amber-600")} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">
                      {twoFactorEnabled ? "2FA Enabled" : "2FA Not Enabled"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {twoFactorEnabled 
                        ? "Your account is protected with two-factor authentication" 
                        : "Add an extra layer of security to your account"}
                    </p>
                  </div>
                </div>
                {twoFactorEnabled ? (
                  <Badge className="bg-green-100 text-green-700 border-0 text-[10px]">
                    <Check className="h-3 w-3 mr-0.5" />
                    Active
                  </Badge>
                ) : (
                  <Button variant="outline" size="sm" className="text-xs" onClick={handleManageSecurity}>
                    Enable 2FA
                  </Button>
                )}
              </div>
            </div>

            {/* Active Sessions */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Active Sessions</h4>
              <div className="space-y-2">
                {mockSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-gray-100">
                        {session.device.includes("iPhone") ? (
                          <Smartphone className="h-4 w-4 text-gray-600" />
                        ) : (
                          <Monitor className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-900">{session.device}</p>
                        <p className="text-xs text-gray-500">{session.location} • {session.lastActive}</p>
                      </div>
                    </div>
                    {session.current ? (
                      <Badge className="bg-green-100 text-green-700 border-0 text-[10px]">Current</Badge>
                    ) : (
                      <Button variant="ghost" size="sm" className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50">
                        <LogOut className="h-3 w-3 mr-1" />
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "notifications":
        const notificationCategories = [
          { key: 'new_task', label: 'New Task Assigned', description: 'When a task is assigned to you', icon: Bell },
          { key: 'task_completed', label: 'Task Completed', description: 'When a task you created is completed', icon: Check },
          { key: 'comment_added', label: 'New Comment', description: 'When someone comments on your task', icon: Bell },
          { key: 'mention', label: 'Mentions', description: 'When someone mentions you', icon: Bell },
          { key: 'team_invite', label: 'Team Invitations', description: 'When you are invited to a team', icon: Users },
          { key: 'workspace_update', label: 'Workspace Updates', description: 'Important workspace announcements', icon: Building2 },
          { key: 'billing', label: 'Billing', description: 'Payment and subscription updates', icon: CreditCard },
          { key: 'security', label: 'Security', description: 'Security alerts and login notifications', icon: Shield },
          { key: 'marketing', label: 'Marketing', description: 'Product updates and newsletters', icon: Mail },
        ];

        return (
          <div className="space-y-6">
            {/* Notification Types */}
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Notification Types</h4>
                <p className="text-xs text-gray-500 mt-0.5">Choose how you want to be notified for each event</p>
              </div>
              <div className="space-y-2">
                {notificationCategories.map((category) => {
                  const NotificationIcon = category.icon;
                  const prefs = notificationTypes[category.key as keyof typeof notificationTypes];
                  return (
                    <div
                      key={category.key}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 rounded-md bg-gray-100">
                          <NotificationIcon className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{category.label}</p>
                          <p className="text-xs text-gray-500">{category.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs text-gray-500 font-medium">Email</span>
                          <Switch
                            checked={prefs?.email ?? false}
                            onCheckedChange={(checked) => {
                              const updated = {
                                ...notificationTypes,
                                [category.key]: { ...prefs, email: checked },
                              };
                              setNotificationTypes(updated);
                              handleNotificationChange({ types: updated });
                            }}
                            aria-label={`Toggle email for ${category.label}`}
                          />
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs text-gray-500 font-medium">Push</span>
                          <Switch
                            checked={prefs?.push ?? false}
                            onCheckedChange={(checked) => {
                              const updated = {
                                ...notificationTypes,
                                [category.key]: { ...prefs, push: checked },
                              };
                              setNotificationTypes(updated);
                              handleNotificationChange({ types: updated });
                            }}
                            aria-label={`Toggle push for ${category.label}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery Settings */}
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Delivery Settings</h4>
                <p className="text-xs text-gray-500 mt-0.5">Control when and how often you receive notifications</p>
              </div>
              
              {/* Frequency */}
              <div className="p-3 rounded-lg border border-gray-100">
                <Label className="text-sm font-medium text-gray-900 mb-2 block">Notification Frequency</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { id: 'instant' as const, label: 'Instant', description: 'Real-time' },
                    { id: 'hourly' as const, label: 'Hourly', description: 'Digest' },
                    { id: 'daily' as const, label: 'Daily', description: 'Digest' },
                  ].map((freq) => {
                    const isActive = notificationFrequency === freq.id;
                    return (
                      <button
                        key={freq.id}
                        onClick={() => {
                          setNotificationFrequency(freq.id);
                          handleNotificationChange({ frequency: freq.id });
                        }}
                        className={cn(
                          "p-2 rounded-lg border-2 transition-all text-center",
                          isActive
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        )}
                      >
                        <p className="text-sm font-medium text-gray-900">{freq.label}</p>
                        <p className="text-xs text-gray-500">{freq.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quiet Hours */}
              <div className="p-3 rounded-lg border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-900">Quiet Hours</Label>
                    <p className="text-xs text-gray-500 mt-0.5">Pause notifications during specific hours</p>
                  </div>
                  <Switch
                    checked={quietHours.enabled}
                    onCheckedChange={(checked) => {
                      const updated = { ...quietHours, enabled: checked };
                      setQuietHours(updated);
                      handleNotificationChange({ quietHours: updated });
                    }}
                    aria-label="Toggle quiet hours"
                  />
                </div>
                {quietHours.enabled && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="quiet-start" className="text-xs text-gray-600">Start Time</Label>
                      <Input
                        id="quiet-start"
                        type="time"
                        value={quietHours.start}
                        onChange={(e) => {
                          const updated = { ...quietHours, start: e.target.value };
                          setQuietHours(updated);
                          handleNotificationChange({ quietHours: updated });
                        }}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="quiet-end" className="text-xs text-gray-600">End Time</Label>
                      <Input
                        id="quiet-end"
                        type="time"
                        value={quietHours.end}
                        onChange={(e) => {
                          const updated = { ...quietHours, end: e.target.value };
                          setQuietHours(updated);
                          handleNotificationChange({ quietHours: updated });
                        }}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "appearance":
        const accentColors = [
          { id: 'indigo' as const, name: 'Indigo', color: 'bg-indigo-500' },
          { id: 'purple' as const, name: 'Purple', color: 'bg-purple-500' },
          { id: 'blue' as const, name: 'Blue', color: 'bg-blue-500' },
          { id: 'teal' as const, name: 'Teal', color: 'bg-teal-500' },
          { id: 'pink' as const, name: 'Pink', color: 'bg-pink-500' },
          { id: 'amber' as const, name: 'Amber', color: 'bg-amber-500' },
        ];

        const fontSizes = [
          { id: 'small' as const, label: 'Small', description: '14px base' },
          { id: 'medium' as const, label: 'Medium', description: '16px base' },
          { id: 'large' as const, label: 'Large', description: '18px base' },
        ];

        const handleAppearanceChange = async (updates: Partial<{ theme: string; accentColor: string; fontSize: string }>) => {
          setIsSaving(true);
          try {
            const res = await fetch('/api/settings/appearance', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates),
            });
            
            if (!res.ok) {
              const error = await res.json();
              throw new Error(error.error || 'Failed to save appearance');
            }
            
            await mutateAppearance();
            toast.success('Appearance updated');
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save appearance');
          } finally {
            setIsSaving(false);
          }
        };

        return (
          <div className="space-y-6">
            {/* Theme Selection */}
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Theme</h4>
                <p className="text-xs text-gray-500 mt-0.5">Choose your interface theme</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'light' as const, label: 'Light', icon: Sun, description: 'Light mode' },
                  { id: 'dark' as const, label: 'Dark', icon: Moon, description: 'Dark mode' },
                  { id: 'system' as const, label: 'System', icon: Monitor, description: 'Follow system' },
                ].map((themeOption) => {
                  const isActive = theme === themeOption.id;
                  const ThemeIcon = themeOption.icon;
                  return (
                    <button
                      key={themeOption.id}
                      onClick={() => {
                        setTheme(themeOption.id);
                        handleAppearanceChange({ theme: themeOption.id });
                      }}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-all text-left",
                        isActive
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      )}
                      disabled={isSaving}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={cn(
                          "p-2 rounded-full",
                          isActive ? "bg-indigo-100" : "bg-gray-100"
                        )}>
                          <ThemeIcon className={cn(
                            "h-5 w-5",
                            isActive ? "text-indigo-600" : "text-gray-600"
                          )} />
                        </div>
                        <div className="text-center">
                          <p className={cn(
                            "text-sm font-medium",
                            isActive ? "text-indigo-900" : "text-gray-900"
                          )}>
                            {themeOption.label}
                          </p>
                          <p className="text-[10px] text-gray-500">{themeOption.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accent Color */}
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Accent Color</h4>
                <p className="text-xs text-gray-500 mt-0.5">Choose your preferred accent color</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {accentColors.map((color) => {
                  const isActive = accentColor === color.id;
                  return (
                    <button
                      key={color.id}
                      onClick={() => {
                        setAccentColor(color.id);
                        handleAppearanceChange({ accentColor: color.id });
                      }}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all",
                        isActive
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      )}
                      disabled={isSaving}
                      aria-label={`Select ${color.name} accent color`}
                    >
                      <div className={cn(
                        "h-5 w-5 rounded-full ring-2 ring-offset-2",
                        color.color,
                        isActive ? "ring-gray-900" : "ring-transparent"
                      )} />
                      <span className={cn(
                        "text-sm",
                        isActive ? "font-medium text-gray-900" : "text-gray-700"
                      )}>
                        {color.name}
                      </span>
                      {isActive && <Check className="h-4 w-4 text-gray-900" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font Size */}
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Font Size</h4>
                <p className="text-xs text-gray-500 mt-0.5">Adjust text size for better readability</p>
              </div>
              <div className="space-y-2">
                {fontSizes.map((size) => {
                  const isActive = fontSize === size.id;
                  return (
                    <button
                      key={size.id}
                      onClick={() => {
                        setFontSize(size.id);
                        handleAppearanceChange({ fontSize: size.id });
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all",
                        isActive
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      )}
                      disabled={isSaving}
                    >
                      <div>
                        <p className={cn(
                          "text-sm font-medium",
                          isActive ? "text-indigo-900" : "text-gray-900"
                        )}>
                          {size.label}
                        </p>
                        <p className="text-xs text-gray-500">{size.description}</p>
                      </div>
                      {isActive && (
                        <div className="p-1 rounded-full bg-indigo-100">
                          <Check className="h-4 w-4 text-indigo-600" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Info Box */}
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
              <p className="text-sm text-gray-600">
                Changes apply immediately and are saved to your account.
              </p>
            </div>
          </div>
        );

      case "webhooks":
        const userWebhooks = webhooksData?.webhooks || [];
        const availableEvents = [
          { id: 'task.created', label: 'Task Created', description: 'When a new task is created' },
          { id: 'task.updated', label: 'Task Updated', description: 'When a task is modified' },
          { id: 'task.completed', label: 'Task Completed', description: 'When a task is marked complete' },
          { id: 'task.deleted', label: 'Task Deleted', description: 'When a task is deleted' },
          { id: 'comment.added', label: 'Comment Added', description: 'When a comment is added' },
          { id: 'team.member_added', label: 'Member Added', description: 'When a team member joins' },
          { id: 'team.member_removed', label: 'Member Removed', description: 'When a team member leaves' },
        ];

        const handleCreateWebhook = async () => {
          setIsSaving(true);
          try {
            if (!webhookForm.name || !webhookForm.url || webhookForm.events.length === 0) {
              throw new Error('Please fill in all required fields');
            }

            const res = await fetch('/api/settings/webhooks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(webhookForm),
            });

            if (!res.ok) {
              const error = await res.json();
              throw new Error(error.error || 'Failed to create webhook');
            }

            await mutateWebhooks();
            toast.success('Webhook created successfully');
            setShowAddWebhook(false);
            setWebhookForm({ name: '', url: '', events: [], description: '' });
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create webhook');
          } finally {
            setIsSaving(false);
          }
        };

        const handleToggleWebhook = async (webhookId: string, enabled: boolean) => {
          try {
            const res = await fetch(`/api/settings/webhooks/${webhookId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ enabled }),
            });

            if (!res.ok) throw new Error('Failed to update webhook');

            await mutateWebhooks();
            toast.success(enabled ? 'Webhook enabled' : 'Webhook disabled');
          } catch {
            toast.error('Failed to update webhook');
          }
        };

        const handleTestWebhook = async (webhookId: string) => {
          setTestingWebhook(webhookId);
          try {
            const res = await fetch(`/api/settings/webhooks/${webhookId}/test`, {
              method: 'POST',
            });

            const result = await res.json();

            if (result.success) {
              toast.success(result.message || 'Test webhook sent successfully');
            } else {
              toast.error(result.message || 'Test webhook failed');
            }
          } catch {
            toast.error('Failed to test webhook');
          } finally {
            setTestingWebhook(null);
          }
        };

        const handleDeleteWebhook = async (webhookId: string, webhookName: string) => {
          if (!confirm(`Delete webhook "${webhookName}"?`)) return;

          try {
            const res = await fetch(`/api/settings/webhooks/${webhookId}`, {
              method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete webhook');

            await mutateWebhooks();
            toast.success('Webhook deleted');
          } catch {
            toast.error('Failed to delete webhook');
          }
        };

        return (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{userWebhooks.length} webhooks configured</span>
              <Button
                size="sm"
                className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => setShowAddWebhook(!showAddWebhook)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Webhook
              </Button>
            </div>

            {/* Add Webhook Form */}
            {showAddWebhook && (
              <div className="p-4 rounded-lg border border-gray-200 bg-gray-50 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900">New Webhook</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setShowAddWebhook(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="webhook-name" className="text-xs text-gray-600">Name *</Label>
                    <Input
                      id="webhook-name"
                      placeholder="Production Webhook"
                      value={webhookForm.name}
                      onChange={(e) => setWebhookForm({ ...webhookForm, name: e.target.value })}
                      className="h-9 text-sm"
                      disabled={isSaving}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="webhook-url" className="text-xs text-gray-600">URL *</Label>
                    <Input
                      id="webhook-url"
                      type="url"
                      placeholder="https://example.com/webhook"
                      value={webhookForm.url}
                      onChange={(e) => setWebhookForm({ ...webhookForm, url: e.target.value })}
                      className="h-9 text-sm"
                      disabled={isSaving}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-600">Events *</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableEvents.map((event) => {
                        const isSelected = webhookForm.events.includes(event.id);
                        return (
                          <button
                            key={event.id}
                            type="button"
                            onClick={() => {
                              setWebhookForm({
                                ...webhookForm,
                                events: isSelected
                                  ? webhookForm.events.filter(e => e !== event.id)
                                  : [...webhookForm.events, event.id],
                              });
                            }}
                            className={cn(
                              "p-2 rounded-lg border-2 text-left transition-all",
                              isSelected
                                ? "border-indigo-500 bg-indigo-50"
                                : "border-gray-200 hover:border-gray-300 bg-white"
                            )}
                            disabled={isSaving}
                          >
                            <p className={cn(
                              "text-xs font-medium",
                              isSelected ? "text-indigo-900" : "text-gray-900"
                            )}>
                              {event.label}
                            </p>
                            <p className="text-[10px] text-gray-500">{event.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="webhook-description" className="text-xs text-gray-600">Description</Label>
                    <Input
                      id="webhook-description"
                      placeholder="Optional description"
                      value={webhookForm.description}
                      onChange={(e) => setWebhookForm({ ...webhookForm, description: e.target.value })}
                      className="h-9 text-sm"
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddWebhook(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={handleCreateWebhook}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Webhook'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Webhooks List */}
            <div className="space-y-2">
              {userWebhooks.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500">
                  <Webhook className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No webhooks configured yet</p>
                  <p className="text-xs mt-1">Click "Add Webhook" to get started</p>
                </div>
              ) : (
                userWebhooks.map((webhook: any) => (
                  <div
                    key={webhook.id}
                    className="p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-gray-900">{webhook.name}</h4>
                          <Switch
                            checked={webhook.enabled}
                            onCheckedChange={(checked) => handleToggleWebhook(webhook.id, checked)}
                            aria-label={`Toggle ${webhook.name}`}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{webhook.url}</p>
                        {webhook.description && (
                          <p className="text-xs text-gray-600 mb-2">{webhook.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.map((event: string) => (
                            <Badge key={event} className="bg-gray-100 text-gray-700 border-0 text-[10px] font-normal">
                              {event}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleTestWebhook(webhook.id)}
                          disabled={testingWebhook === webhook.id}
                        >
                          {testingWebhook === webhook.id ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Testing...
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 mr-1" />
                              Test
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteWebhook(webhook.id, webhook.name)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {webhook.lastTriggeredAt && (
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-2 pt-2 border-t border-gray-100">
                        <Clock className="h-3 w-3" />
                        Last triggered: {new Date(webhook.lastTriggeredAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Info Box */}
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
              <p className="text-sm text-gray-600">
                Webhooks allow you to receive real-time notifications when events occur. Each webhook includes a signature for verification.
              </p>
            </div>
          </div>
        );

      case "api":
        const apiKeys = apiKeysData?.apiKeys || [];
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{apiKeys.length} API keys</span>
              <Button size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Create Key
              </Button>
            </div>

            <div className="space-y-2">
              {apiKeys.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No API keys yet</p>
              ) : apiKeys.map((apiKey: any) => (
                <div
                  key={apiKey.id}
                  className="p-3 rounded-lg border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{apiKey.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={async () => {
                        if (!confirm(`Delete API key "${apiKey.name}"?`)) return;
                        try {
                          const res = await fetch(`/api/settings/api-keys/${apiKey.id}`, {
                            method: 'DELETE',
                          });
                          if (!res.ok) throw new Error('Failed to delete API key');
                          await mutateApiKeys();
                          toast.success('API key deleted');
                        } catch {
                          toast.error('Failed to delete API key');
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <code className="flex-1 px-2 py-1 rounded bg-gray-100 text-xs font-mono text-gray-700">
                      {showApiKey === apiKey.id ? apiKey.key.replace('****', 'abcd') : apiKey.key}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setShowApiKey(showApiKey === apiKey.id ? null : apiKey.id)}
                      aria-label={showApiKey === apiKey.id ? "Hide API key" : "Show API key"}
                    >
                      {showApiKey === apiKey.id ? (
                        <EyeOff className="h-3.5 w-3.5 text-gray-500" />
                      ) : (
                        <Eye className="h-3.5 w-3.5 text-gray-500" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleCopyApiKey(apiKey.key)}
                      aria-label="Copy API key"
                    >
                      <Copy className="h-3.5 w-3.5 text-gray-500" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Created {apiKey.created}
                    </span>
                    <span className="flex items-center gap-1">
                      <RefreshCw className="h-3 w-3" />
                      Last used {apiKey.lastUsed}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* API Documentation Link */}
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
              <p className="text-sm text-gray-600">
                Need help with the API?{" "}
                <a href="/docs" className="text-indigo-600 hover:text-indigo-700 font-medium">
                  View Documentation →
                </a>
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const activeCategory = SETTINGS_CATEGORIES.find(c => c.id === activeSection);

  // Show loading state while user data is being fetched
  if (!isLoaded) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage your account and preferences</p>
        </div>
        <Badge className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 w-fit">
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          Pro Plan
        </Badge>
      </div>

      {/* Main Content - Two Panel Layout */}
      <Card className="p-6 shadow-lg border-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 min-h-[400px] lg:min-h-[550px]">
          
          {/* Left Panel - Settings Categories */}
          <div className="lg:col-span-3 flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-900">Settings</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {SETTINGS_CATEGORIES.map((category) => {
                const isActive = activeSection === category.id;
                const CategoryIcon = category.icon;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveSection(category.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                      isActive
                        ? "bg-indigo-50 border border-indigo-200"
                        : "hover:bg-gray-50"
                    )}
                    aria-label={`Go to ${category.name} settings`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <div className={cn(
                      "p-1.5 rounded-md",
                      isActive ? "bg-indigo-100" : "bg-gray-100"
                    )}>
                      <CategoryIcon className={cn(
                        "h-4 w-4",
                        isActive ? "text-indigo-600" : "text-gray-500"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm truncate",
                        isActive ? "font-medium text-indigo-900" : "text-gray-700"
                      )}>
                        {category.name}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {category.description}
                      </p>
                    </div>
                    <ChevronRight className={cn(
                      "h-4 w-4 flex-shrink-0 transition-transform",
                      isActive ? "text-indigo-500 rotate-90" : "text-gray-300"
                    )} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Panel - Settings Content */}
          <div className="lg:col-span-9 flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {activeCategory && (
                  <>
                    <activeCategory.icon className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm font-medium text-gray-900">{activeCategory.name}</span>
                  </>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {renderContent()}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
