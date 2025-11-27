"use client";

import * as React from "react";
import useSWR from "swr";
import { 
  Search, 
  Mail, 
  Calendar, 
  MessageSquare, 
  FileText, 
  Database, 
  Users, 
  Plus,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Plug,
  Zap,
  Settings,
  ChevronRight,
  Globe,
  Shield,
  Clock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useOAuth } from "@/hooks/useOAuth";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Integration type
interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  category: string;
  features: string[];
  popularity: "high" | "medium" | "low";
}

// Mock Data
const INTEGRATIONS: Integration[] = [
  {
    id: "gmail",
    name: "Gmail",
    description: "Sync emails, extract action items, and automate follow-ups directly from your inbox.",
    icon: Mail,
    iconColor: "text-red-600",
    iconBg: "bg-red-50",
    category: "Communication",
    features: ["Email sync", "Auto-responses", "Action items"],
    popularity: "high",
  },
  {
    id: "calendar",
    name: "Google Calendar",
    description: "Coordinate schedules, auto-book meetings, and prevent conflicts across teams.",
    icon: Calendar,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
    category: "Productivity",
    features: ["Schedule sync", "Auto-booking", "Reminders"],
    popularity: "high",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Real-time notifications and command-based actions for your entire workspace.",
    icon: MessageSquare,
    iconColor: "text-purple-600",
    iconBg: "bg-purple-50",
    category: "Communication",
    features: ["Notifications", "Commands", "Channels"],
    popularity: "high",
  },
  {
    id: "notion",
    name: "Notion",
    description: "Access knowledge bases and sync documentation for context-aware AI responses.",
    icon: FileText,
    iconColor: "text-gray-700",
    iconBg: "bg-gray-100",
    category: "Knowledge",
    features: ["Docs sync", "Knowledge base", "Templates"],
    popularity: "medium",
  },
  {
    id: "salesforce",
    name: "Salesforce",
    description: "Two-way sync for CRM records, deal tracking, and automated pipeline updates.",
    icon: Users,
    iconColor: "text-sky-600",
    iconBg: "bg-sky-50",
    category: "Sales",
    features: ["CRM sync", "Deal tracking", "Pipeline"],
    popularity: "medium",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description: "Marketing automation triggers and contact management synchronization.",
    icon: Database,
    iconColor: "text-orange-600",
    iconBg: "bg-orange-50",
    category: "Marketing",
    features: ["Automation", "Contacts", "Analytics"],
    popularity: "medium",
  },
];

interface Category {
  id: string;
  name: string;
  icon: React.ElementType;
  count: number;
  color: string;
}

const CATEGORIES: Category[] = [
  { id: "all", name: "All Integrations", icon: Plug, count: 6, color: "text-indigo-600" },
  { id: "Communication", name: "Communication", icon: MessageSquare, count: 2, color: "text-purple-600" },
  { id: "Productivity", name: "Productivity", icon: Zap, count: 1, color: "text-blue-600" },
  { id: "Sales", name: "Sales", icon: Users, count: 1, color: "text-emerald-600" },
  { id: "Marketing", name: "Marketing", icon: Globe, count: 1, color: "text-orange-600" },
  { id: "Knowledge", name: "Knowledge", icon: FileText, count: 1, color: "text-gray-600" },
];

export function GalaxyIntegrations() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState("all");
  const [selectedIntegration, setSelectedIntegration] = React.useState<Integration | null>(null);
  const [connectingId, setConnectingId] = React.useState<string | null>(null);
  const { connect, disconnect, isConnecting } = useOAuth();

  // Fetch integration status
  const { data: statusData, mutate: mutateStatus } = useSWR('/api/integrations/status', fetcher, {
    refreshInterval: 30000,
  });

  // Map integration IDs to provider names
  const providerMap: Record<string, 'google' | 'microsoft'> = {
    'gmail': 'google',
    'calendar': 'google',
    'slack': 'microsoft',
    'notion': 'microsoft',
    'salesforce': 'microsoft',
    'hubspot': 'microsoft',
  };

  // Get connected IDs from API status
  const connectedIds = React.useMemo(() => {
    if (!statusData?.status) return new Set<string>();
    const connected = new Set<string>();
    Object.entries(statusData.status).forEach(([provider, isConnected]) => {
      if (isConnected) {
        Object.entries(providerMap).forEach(([id, prov]) => {
          if (prov === provider) {
            connected.add(id);
          }
        });
      }
    });
    return connected;
  }, [statusData]);

  const handleConnect = async (id: string) => {
    const provider = providerMap[id];
    if (!provider) {
      toast.error('Provider not configured');
      return;
    }

    setConnectingId(id);
    try {
      await connect(provider);
    } catch (error) {
      logger.error('Connect error', error);
      toast.error('Failed to connect. Please try again.');
      setConnectingId(null);
    }
  };

  const handleDisconnect = async (id: string) => {
    const integration = statusData?.integrations?.find((i: { provider: string }) => {
      const prov = providerMap[id];
      return i.provider === prov;
    });

    if (!integration) {
      toast.error('Integration not found');
      return;
    }

    try {
      await disconnect(integration.id);
      await mutateStatus();
      toast.success('Integration disconnected');
    } catch (error) {
      logger.error('Disconnect error', error);
      toast.error('Failed to disconnect. Please try again.');
    }
  };

  const filteredIntegrations = INTEGRATIONS.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const connectedCount = connectedIds.size;

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Integrations</h1>
          <p className="text-gray-500 text-sm mt-0.5">Connect your favorite tools to supercharge your workflow</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            {connectedCount} Connected
          </Badge>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="h-4 w-4 mr-1.5" />
            Request App
          </Button>
        </div>
      </div>

      {/* Main Content - Two Panel Layout */}
      <Card className="p-6 shadow-lg border-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
          
          {/* Left Panel - Categories */}
          <div className="lg:col-span-3 flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-900">Categories</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {CATEGORIES.map((category) => {
                const isActive = activeCategory === category.id;
                const CategoryIcon = category.icon;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                      isActive
                        ? "bg-indigo-50 border border-indigo-200"
                        : "hover:bg-gray-50"
                    )}
                    aria-label={`Filter by ${category.name}`}
                    aria-pressed={isActive}
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
                    </div>
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded",
                      isActive ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500"
                    )}>
                      {category.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Stats */}
            <div className="p-3 border-t border-gray-100 bg-gray-50 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Shield className="h-3 w-3" />
                  Secure OAuth
                </span>
                <span className="text-green-600">Enabled</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  Sync Interval
                </span>
                <span className="text-gray-700">Real-time</span>
              </div>
            </div>
          </div>

          {/* Right Panel - Integrations Grid */}
          <div className="lg:col-span-9 flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden">
            {/* Header with Search */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {activeCategory === "all" ? "All Apps" : activeCategory}
                </span>
                <span className="text-xs text-gray-400">({filteredIntegrations.length})</span>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-sm bg-gray-50 border-gray-200"
                />
              </div>
            </div>

            {/* Integrations Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredIntegrations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filteredIntegrations.map((integration) => {
                    const isConnected = connectedIds.has(integration.id);
                    const isLoading = connectingId === integration.id || (isConnecting && connectingId === integration.id);
                    const IntegrationIcon = integration.icon;
                    const isSelected = selectedIntegration?.id === integration.id;

                    return (
                      <button
                        key={integration.id}
                        onClick={() => setSelectedIntegration(isSelected ? null : integration)}
                        className={cn(
                          "text-left p-4 rounded-xl border transition-all duration-200 group",
                          isSelected
                            ? "bg-indigo-50 border-indigo-200 shadow-sm"
                            : isConnected
                            ? "bg-green-50/50 border-green-200 hover:border-green-300"
                            : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
                        )}
                        aria-label={`${integration.name} integration`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn("p-2 rounded-lg", integration.iconBg)}>
                            <IntegrationIcon className={cn("h-5 w-5", integration.iconColor)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-medium text-gray-900">{integration.name}</h3>
                              {isConnected && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{integration.description}</p>
                            
                            {/* Feature Pills */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {integration.features.slice(0, 2).map((feature) => (
                                <span key={feature} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                          <ChevronRight className={cn(
                            "h-4 w-4 text-gray-300 transition-transform flex-shrink-0",
                            isSelected && "rotate-90 text-indigo-500"
                          )} />
                        </div>

                        {/* Expanded Actions */}
                        {isSelected && (
                          <div className="mt-3 pt-3 border-t border-indigo-100 flex gap-2" onClick={(e) => e.stopPropagation()}>
                            {isConnected ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 h-8 text-xs"
                                  onClick={() => handleDisconnect(integration.id)}
                                >
                                  Disconnect
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                >
                                  <Settings className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                className="flex-1 h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                                onClick={() => handleConnect(integration.id)}
                                disabled={isLoading}
                              >
                                {isLoading ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                                    Connecting...
                                  </>
                                ) : (
                                  <>
                                    <Plus className="h-3 w-3 mr-1.5" />
                                    Connect
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="p-3 rounded-full bg-gray-100 mb-3">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">No integrations found</h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs">
                    Try adjusting your search or category filter
                  </p>
                  <Button 
                    variant="link" 
                    size="sm"
                    onClick={() => { setSearchQuery(""); setActiveCategory("all"); }}
                    className="mt-2 text-xs"
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </div>

            {/* Footer Stats */}
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <Plug className="h-3 w-3" />
                  {INTEGRATIONS.length} available
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  {connectedCount} connected
                </span>
              </div>
              <span className="text-gray-400">Last synced: Just now</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
