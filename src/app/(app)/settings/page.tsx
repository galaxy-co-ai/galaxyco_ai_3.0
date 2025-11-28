"use client";

import * as React from "react";
import { useUser } from "@clerk/nextjs";
import { 
  User, 
  Building2, 
  Users, 
  CreditCard, 
  Shield, 
  Bell, 
  Key,
  ChevronRight,
  ChevronDown,
  Camera,
  Mail,
  Phone,
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
  Pause,
  Play,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SettingsSection = "profile" | "workspace" | "team" | "billing" | "security" | "notifications" | "api";

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
  { id: "api", name: "API Keys", icon: Key, description: "Developer access" },
];

const mockWorkspace = {
  name: "GalaxyCo",
  slug: "galaxyco",
  plan: "Pro",
  members: 5,
  createdAt: "2024-01-15",
};

const mockTeamMembers = [
  { id: "1", name: "John Doe", email: "john@company.com", role: "Owner", avatar: "", status: "active" },
  { id: "2", name: "Sarah Chen", email: "sarah@company.com", role: "Admin", avatar: "", status: "active" },
  { id: "3", name: "Mike Johnson", email: "mike@company.com", role: "Member", avatar: "", status: "active" },
  { id: "4", name: "Emily Brown", email: "emily@company.com", role: "Member", avatar: "", status: "pending" },
];

const mockApiKeys = [
  { id: "1", name: "Production API", key: "gx_prod_****8a3f", created: "2024-10-01", lastUsed: "2 hours ago" },
  { id: "2", name: "Development", key: "gx_dev_****2b1c", created: "2024-11-15", lastUsed: "5 days ago" },
];

const mockSessions = [
  { id: "1", device: "Chrome on macOS", location: "New York, US", current: true, lastActive: "Now" },
  { id: "2", device: "Safari on iPhone", location: "New York, US", current: false, lastActive: "1 hour ago" },
];

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const [activeSection, setActiveSection] = React.useState<SettingsSection>("profile");
  const [showApiKey, setShowApiKey] = React.useState<string | null>(null);
  
  // Build user profile from Clerk data
  const userProfile = React.useMemo(() => {
    if (!user) return null;
    const fullName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
    const email = user.primaryEmailAddress?.emailAddress || '';
    const phone = user.primaryPhoneNumber?.phoneNumber || '';
    const avatar = user.imageUrl || '';
    
    return {
      name: fullName,
      email,
      phone,
      avatar,
      role: "Owner", // TODO: Get from workspace membership
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }, [user]);
  
  // Form states - initialize with user data when available
  const [profileForm, setProfileForm] = React.useState({
    name: "",
    email: "",
    phone: "",
    avatar: "",
    role: "Owner",
    timezone: "America/New_York",
  });
  const [workspaceForm, setWorkspaceForm] = React.useState(mockWorkspace);
  
  // Update form when user data loads
  React.useEffect(() => {
    if (userProfile) {
      setProfileForm(userProfile);
    }
  }, [userProfile]);
  
  // Notification preferences
  const [notifications, setNotifications] = React.useState({
    emailDigest: true,
    emailAlerts: true,
    pushNotifications: false,
    weeklyReport: true,
    marketingEmails: false,
  });

  const handleSave = () => {
    toast.success("Settings saved successfully");
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
                    {profileForm.name.split(' ').map(n => n[0]).join('')}
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
                <h3 className="font-medium text-gray-900">{profileForm.name}</h3>
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
                  <Label htmlFor="name" className="text-xs text-gray-600">Full Name</Label>
                  <Input
                    id="name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs text-gray-600">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="h-9 text-sm pl-8"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs text-gray-600">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      id="phone"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="h-9 text-sm pl-8"
                    />
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
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSave}>
                Save Changes
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
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </div>
        );

      case "team":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{mockTeamMembers.length} members</span>
              <Button size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Invite Member
              </Button>
            </div>

            <div className="space-y-2">
              {mockTeamMembers.map((member) => {
                const isCurrentUser = userProfile?.email === member.email;
                const isPaused = member.status === "paused";
                const isOwner = member.role === "Owner";
                
                return (
                  <div
                    key={member.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-colors",
                      isPaused 
                        ? "border-gray-200 bg-gray-50 opacity-60" 
                        : "border-gray-100 hover:border-gray-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.status === "pending" && (
                        <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">Pending</Badge>
                      )}
                      {isPaused && (
                        <Badge className="bg-gray-200 text-gray-600 border-0 text-[10px]">Paused</Badge>
                      )}
                      
                      {/* Role badge - clickable dropdown for non-owners */}
                      {isOwner ? (
                        <Badge variant="outline" className="text-[10px]">
                          {member.role}
                        </Badge>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="inline-flex items-center gap-1 h-6 px-2.5 text-[11px] font-medium border border-gray-200 rounded-full bg-white text-gray-700 cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                              aria-label={`Change ${member.name}'s role`}
                            >
                              {member.role}
                              <ChevronDown className="h-3 w-3 text-gray-400" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            align="end" 
                            className="min-w-[120px] rounded-xl shadow-lg border border-gray-200/80 bg-white/95 backdrop-blur-xl p-1"
                          >
                            <DropdownMenuItem 
                              onClick={() => {
                                if (member.role !== "Admin") {
                                  toast.success(`${member.name}'s role changed to Admin`);
                                }
                              }}
                              className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer hover:bg-gray-100/80 transition-colors"
                            >
                              <span>Admin</span>
                              {member.role === "Admin" && (
                                <Check className="h-4 w-4 text-indigo-600" />
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                if (member.role !== "Member") {
                                  toast.success(`${member.name}'s role changed to Member`);
                                }
                              }}
                              className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer hover:bg-gray-100/80 transition-colors"
                            >
                              <span>Member</span>
                              {member.role === "Member" && (
                                <Check className="h-4 w-4 text-indigo-600" />
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      
                      {/* Action buttons - only show for non-owners and not current user */}
                      {!isCurrentUser && !isOwner && (
                        <div className="flex items-center gap-1 ml-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                            onClick={() => {
                              toast.success(isPaused ? `${member.name} has been reactivated` : `${member.name} has been paused`);
                            }}
                            aria-label={isPaused ? `Reactivate ${member.name}` : `Pause ${member.name}`}
                          >
                            {isPaused ? (
                              <Play className="h-3.5 w-3.5" />
                            ) : (
                              <Pause className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => {
                              toast.success(`${member.name} has been removed from the team`);
                            }}
                            aria-label={`Remove ${member.name}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "billing":
        return (
          <div className="space-y-6">
            {/* Current Plan */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm opacity-90">Current Plan</p>
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Pro Plan
                  </h3>
                </div>
                <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0">
                  Upgrade
                </Button>
              </div>
              <div className="text-sm opacity-90">
                $49/month • Renews Dec 26, 2024
              </div>
            </div>

            {/* Usage */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Usage This Month</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">AI Credits</span>
                    <span className="text-gray-900">8,234 / 10,000</span>
                  </div>
                  <Progress value={82} className="h-1.5" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Storage</span>
                    <span className="text-gray-900">2.4 GB / 10 GB</span>
                  </div>
                  <Progress value={24} className="h-1.5" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Team Members</span>
                    <span className="text-gray-900">5 / 10</span>
                  </div>
                  <Progress value={50} className="h-1.5" />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-white border border-gray-200">
                    <CreditCard className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">•••• •••• •••• 4242</p>
                    <p className="text-xs text-gray-500">Expires 12/25</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-gray-600">
                  Update
                </Button>
              </div>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="space-y-6">
            {/* Password */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Password</h4>
              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                <div>
                  <p className="text-sm text-gray-900">Password</p>
                  <p className="text-xs text-gray-500">Last changed 30 days ago</p>
                </div>
                <Button variant="outline" size="sm" className="text-xs">
                  Change Password
                </Button>
              </div>
            </div>

            {/* 2FA */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-green-50">
                    <Shield className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">2FA Enabled</p>
                    <p className="text-xs text-gray-500">Using authenticator app</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-700 border-0 text-[10px]">
                  <Check className="h-3 w-3 mr-0.5" />
                  Active
                </Badge>
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
        return (
          <div className="space-y-4">
            {[
              { key: "emailDigest", label: "Daily Email Digest", description: "Summary of your daily activity" },
              { key: "emailAlerts", label: "Email Alerts", description: "Important notifications via email" },
              { key: "pushNotifications", label: "Push Notifications", description: "Browser push notifications" },
              { key: "weeklyReport", label: "Weekly Report", description: "Performance summary every week" },
              { key: "marketingEmails", label: "Marketing Emails", description: "Product updates and news" },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
                <Switch
                  checked={notifications[item.key as keyof typeof notifications]}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, [item.key]: checked })
                  }
                  aria-label={`Toggle ${item.label}`}
                />
              </div>
            ))}

            <div className="pt-4 border-t border-gray-100">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSave}>
                Save Preferences
              </Button>
            </div>
          </div>
        );

      case "api":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{mockApiKeys.length} API keys</span>
              <Button size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Create Key
              </Button>
            </div>

            <div className="space-y-2">
              {mockApiKeys.map((apiKey) => (
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
      <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
          
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
