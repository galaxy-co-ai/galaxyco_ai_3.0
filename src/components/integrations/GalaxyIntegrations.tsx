"use client";

import * as React from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Sparkles, 
  Mail, 
  Calendar, 
  MessageSquare, 
  FileText, 
  Database, 
  Users, 
  Filter,
  Grid2X2,
  Plus
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CosmicBackground } from "@/components/shared/CosmicBackground";
import { GalaxyIntegrationCard } from "./GalaxyIntegrationCard";
import { cn } from "@/lib/utils";
import { useOAuth } from "@/hooks/useOAuth";
import { toast } from "sonner";

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Mock Data
const INTEGRATIONS = [
  {
    id: "gmail",
    name: "Gmail",
    description: "Sync emails, extract action items, and automate follow-ups directly from your inbox.",
    icon: <Mail className="h-6 w-6 text-red-500" />,
    category: "Communication",
  },
  {
    id: "calendar",
    name: "Google Calendar",
    description: "Coordinate schedules, auto-book meetings, and prevent conflicts across teams.",
    icon: <Calendar className="h-6 w-6 text-blue-500" />,
    category: "Productivity",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Real-time notifications and command-based actions for your entire workspace.",
    icon: <MessageSquare className="h-6 w-6 text-purple-500" />,
    category: "Communication",
  },
  {
    id: "notion",
    name: "Notion",
    description: "Access knowledge bases and sync documentation for context-aware AI responses.",
    icon: <FileText className="h-6 w-6 text-foreground" />,
    category: "Knowledge",
  },
  {
    id: "salesforce",
    name: "Salesforce",
    description: "Two-way sync for CRM records, deal tracking, and automated pipeline updates.",
    icon: <Users className="h-6 w-6 text-blue-400" />,
    category: "Sales",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description: "Marketing automation triggers and contact management synchronization.",
    icon: <Database className="h-6 w-6 text-orange-500" />,
    category: "Marketing",
  },
];

const CATEGORIES = ["All", "Communication", "Productivity", "Sales", "Marketing", "Knowledge"];

export function GalaxyIntegrations() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState("All");
  const [connectingId, setConnectingId] = React.useState<string | null>(null);
  const { connect, disconnect, isConnecting } = useOAuth();

  // Fetch integration status
  const { data: statusData, error: statusError, mutate: mutateStatus } = useSWR('/api/integrations/status', fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
  });

  // Map integration IDs to provider names
  const providerMap: Record<string, 'google' | 'microsoft'> = {
    'gmail': 'google',
    'calendar': 'google',
    'slack': 'microsoft', // Update based on actual provider
    'notion': 'microsoft', // Update based on actual provider
    'salesforce': 'microsoft', // Update based on actual provider
    'hubspot': 'microsoft', // Update based on actual provider
  };

  // Get connected IDs from API status
  const connectedIds = React.useMemo(() => {
    if (!statusData?.status) return new Set<string>();
    const connected = new Set<string>();
    Object.entries(statusData.status).forEach(([provider, isConnected]) => {
      if (isConnected) {
        // Find integration IDs that match this provider
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
      // Status will update via SWR after redirect/refresh
    } catch (error) {
      console.error('Connect error:', error);
      toast.error('Failed to connect. Please try again.');
      setConnectingId(null);
    }
  };

  const handleDisconnect = async (id: string) => {
    // Find integration ID from status data
    const integration = statusData?.integrations?.find((i: any) => {
      const prov = providerMap[id];
      return i.provider === prov;
    });

    if (!integration) {
      toast.error('Integration not found');
      return;
    }

    try {
      await disconnect(integration.id);
      await mutateStatus(); // Refresh status
      toast.success('Integration disconnected successfully');
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect. Please try again.');
    }
  };

  const filteredIntegrations = INTEGRATIONS.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="relative h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-50">
        <CosmicBackground />
      </div>

      {/* Header Section */}
      <div className="relative z-10 flex flex-col gap-6 px-6 py-8 md:px-12 lg:py-12 border-b bg-background/40 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Grid2X2 className="h-8 w-8 text-primary" />
              Integrations
            </h1>
            <p className="text-muted-foreground mt-2 max-w-xl">
              Supercharge your workflow by connecting your favorite tools. 
              Our AI agents work seamlessly across your entire stack.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="bg-background/50 backdrop-blur-sm border rounded-full px-4 py-1.5 text-sm text-muted-foreground shadow-sm">
                <span className="font-medium text-foreground">
                  {statusData ? connectedIds.size : '...'}
                </span> Active Connections
             </div>
             <Button className="rounded-full shadow-lg shadow-primary/20">
                <Plus className="mr-2 h-4 w-4" />
                Request App
             </Button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
           <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "rounded-full text-xs",
                    activeCategory === cat ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-background/50"
                  )}
                >
                  {cat}
                </Button>
              ))}
           </div>

           <div className="relative w-full md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input 
               placeholder="Search integrations..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-9 bg-background/50 border-white/10 focus:bg-background/80 rounded-full transition-all"
             />
           </div>
        </div>
      </div>

      {/* Content Grid */}
      <ScrollArea className="relative z-10 flex-1">
        <div className="p-6 md:p-12">
          <AnimatePresence mode="popLayout">
            {filteredIntegrations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {filteredIntegrations.map((integration) => (
                  <GalaxyIntegrationCard
                    key={integration.id}
                    {...integration}
                    isConnected={connectedIds.has(integration.id)}
                    isConnecting={connectingId === integration.id || (isConnecting && connectingId === integration.id)}
                    onConnect={() => handleConnect(integration.id)}
                    onDisconnect={() => handleDisconnect(integration.id)}
                  />
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="p-4 rounded-full bg-muted/30 mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No integrations found</h3>
                <p className="text-muted-foreground max-w-sm mt-2">
                  Try adjusting your search or category filter to find what you're looking for.
                </p>
                <Button 
                  variant="link" 
                  onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}
                  className="mt-4"
                >
                  Clear filters
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}

