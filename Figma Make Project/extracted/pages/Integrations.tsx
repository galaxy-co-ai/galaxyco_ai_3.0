import { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { 
  Search, 
  Mail, 
  Calendar, 
  MessageSquare, 
  Database, 
  FileText, 
  Users,
  Plus,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  Filter,
  Lightbulb,
  TrendingUp,
  Clock
} from "lucide-react";
import { IntegrationCard } from "../components/IntegrationCard";
import { StockTicker } from "../components/StockTicker";
import { motion } from "motion/react";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  category: "essential" | "recommended" | "optional";
  features: string[];
  isConnected: boolean;
}

interface IntegrationsProps {
  onStartOnboarding?: () => void;
}

export function Integrations({ onStartOnboarding }: IntegrationsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "gmail",
      name: "Gmail",
      description: "Auto-organize emails and extract action items",
      icon: <Mail className="h-7 w-7 text-white" />,
      gradient: "from-red-500 to-red-600",
      category: "essential",
      features: [
        "Auto-categorize emails by priority",
        "Extract action items and deadlines",
        "Smart email summaries",
        "Automated follow-up reminders"
      ],
      isConnected: false
    },
    {
      id: "google-calendar",
      name: "Google Calendar",
      description: "Sync meetings and auto-transcribe calls",
      icon: <Calendar className="h-7 w-7 text-white" />,
      gradient: "from-blue-500 to-blue-600",
      category: "essential",
      features: [
        "Auto-transcribe meetings",
        "Extract meeting notes and action items",
        "Smart scheduling suggestions",
        "Calendar conflict detection"
      ],
      isConnected: false
    },
    {
      id: "slack",
      name: "Slack",
      description: "Sync messages and organize conversations",
      icon: <MessageSquare className="h-7 w-7 text-white" />,
      gradient: "from-purple-500 to-purple-600",
      category: "recommended",
      features: [
        "Auto-summarize channel discussions",
        "Track mentions and action items",
        "Smart notifications",
        "Thread sentiment analysis"
      ],
      isConnected: false
    },
    {
      id: "notion",
      name: "Notion",
      description: "Sync your company knowledge base",
      icon: <FileText className="h-7 w-7 text-white" />,
      gradient: "from-gray-700 to-gray-800",
      category: "recommended",
      features: [
        "Import existing documentation",
        "AI-powered search across all docs",
        "Auto-update knowledge base",
        "Version tracking"
      ],
      isConnected: false
    },
    {
      id: "salesforce",
      name: "Salesforce",
      description: "Sync CRM data and contacts",
      icon: <Users className="h-7 w-7 text-white" />,
      gradient: "from-cyan-500 to-cyan-600",
      category: "optional",
      features: [
        "Import contacts and deals",
        "Auto-update CRM from calls/emails",
        "Smart lead scoring",
        "Pipeline forecasting"
      ],
      isConnected: false
    },
    {
      id: "hubspot",
      name: "HubSpot",
      description: "Sync marketing and sales data",
      icon: <Database className="h-7 w-7 text-white" />,
      gradient: "from-orange-500 to-orange-600",
      category: "optional",
      features: [
        "Import contacts and campaigns",
        "Track engagement automatically",
        "AI-powered insights",
        "Marketing attribution"
      ],
      isConnected: false
    },
    {
      id: "microsoft-teams",
      name: "Microsoft Teams",
      description: "Connect Teams for meeting insights",
      icon: <MessageSquare className="h-7 w-7 text-white" />,
      gradient: "from-indigo-500 to-indigo-600",
      category: "recommended",
      features: [
        "Auto-transcribe Teams calls",
        "Extract action items from chats",
        "Meeting summaries",
        "Channel insights"
      ],
      isConnected: false
    },
    {
      id: "zoom",
      name: "Zoom",
      description: "Auto-transcribe and analyze Zoom calls",
      icon: <Calendar className="h-7 w-7 text-white" />,
      gradient: "from-blue-400 to-blue-500",
      category: "recommended",
      features: [
        "Auto-record and transcribe meetings",
        "Speaker identification",
        "Generate meeting summaries",
        "Extract key moments"
      ],
      isConnected: false
    }
  ]);

  const [connectingId, setConnectingId] = useState<string | null>(null);

  // Load integration state from localStorage on mount
  useEffect(() => {
    setIntegrations(prev =>
      prev.map(int => ({
        ...int,
        isConnected: localStorage.getItem(`integration_${int.id}`) === 'connected'
      }))
    );
  }, []);

  const handleConnect = (id: string) => {
    setConnectingId(id);
    
    // Simulate OAuth flow
    setTimeout(() => {
      setIntegrations(prev =>
        prev.map(int =>
          int.id === id ? { ...int, isConnected: true } : int
        )
      );
      // Save to localStorage so other pages can check integration status
      localStorage.setItem(`integration_${id}`, 'connected');
      setConnectingId(null);
    }, 1500);
  };

  const handleDisconnect = (id: string) => {
    setIntegrations(prev =>
      prev.map(int =>
        int.id === id ? { ...int, isConnected: false } : int
      )
    );
    // Remove from localStorage
    localStorage.removeItem(`integration_${id}`);
  };

  const filteredIntegrations = integrations
    .filter(int => {
      const matchesSearch = int.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           int.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (activeTab === "all") return matchesSearch;
      if (activeTab === "connected") return matchesSearch && int.isConnected;
      return matchesSearch && int.category === activeTab;
    })
    .sort((a, b) => {
      // Sort by category priority: essential > recommended > optional
      const categoryOrder = { essential: 0, recommended: 1, optional: 2 };
      if (activeTab === "all") {
        return categoryOrder[a.category] - categoryOrder[b.category];
      }
      return 0;
    });

  const connectedCount = integrations.filter(i => i.isConnected).length;
  const essentialCount = integrations.filter(i => i.category === "essential").length;
  const essentialConnected = integrations.filter(i => i.category === "essential" && i.isConnected).length;
  const setupProgress = Math.round((connectedCount / integrations.length) * 100);

  const handleConnectAllEssential = () => {
    const essentialIntegrations = integrations.filter(
      int => int.category === "essential" && !int.isConnected
    );
    
    essentialIntegrations.forEach((int, index) => {
      setTimeout(() => {
        handleConnect(int.id);
      }, index * 800);
    });
  };

  // AI Suggestion based on what's connected
  const getAISuggestion = () => {
    if (connectedCount === 0) {
      return {
        text: "Connect Gmail & Google Calendar first for instant productivity gains",
        icon: Lightbulb,
        color: "text-blue-600"
      };
    } else if (essentialConnected < essentialCount) {
      return {
        text: "Complete essential setup to unlock full AI capabilities",
        icon: Zap,
        color: "text-orange-600"
      };
    } else if (!integrations.find(i => i.id === "slack" && i.isConnected)) {
      return {
        text: "Connect Slack to get 3x more insights from team conversations",
        icon: TrendingUp,
        color: "text-purple-600"
      };
    } else {
      return {
        text: "You're all set! AI agents are learning from your ecosystem",
        icon: Sparkles,
        color: "text-green-600"
      };
    }
  };

  const suggestion = getAISuggestion();

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-6 pb-32">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl mb-2">Integrations</h1>
            <p className="text-muted-foreground mb-4">
              Connect your work apps to unlock AI-powered automation
            </p>
            {/* Progress Bar */}
            <div className="max-w-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Setup Progress</span>
                <span className="text-xs">{setupProgress}% Complete</span>
              </div>
              <Progress value={setupProgress} className="h-2" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {essentialConnected < essentialCount && (
              <Button 
                onClick={handleConnectAllEssential}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md"
              >
                <Zap className="h-4 w-4 mr-2" />
                Connect Essential Apps
              </Button>
            )}
            {onStartOnboarding && (
              <Button 
                variant="outline"
                onClick={onStartOnboarding}
                className="shadow-sm"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Guided Setup
              </Button>
            )}
            <Button variant="outline" className="shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Request Integration
            </Button>
          </div>
        </div>

        {/* AI Suggestion Banner */}
        {connectedCount < integrations.length && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                  <suggestion.icon className={`h-5 w-5 ${suggestion.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm">{suggestion.text}</p>
                </div>
                {connectedCount === 0 && (
                  <Button
                    onClick={handleConnectAllEssential}
                    size="sm"
                    className="bg-[#007AFF] hover:bg-[#0051D5] text-white"
                  >
                    Quick Start
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Search and Filter */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="all">
              All ({integrations.length})
            </TabsTrigger>
            <TabsTrigger 
              value="essential"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
            >
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              Essential ({essentialCount})
            </TabsTrigger>
            <TabsTrigger value="connected">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              Connected ({connectedCount})
            </TabsTrigger>
            <TabsTrigger value="recommended">
              Recommended
            </TabsTrigger>
            <TabsTrigger value="optional">
              Optional
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredIntegrations.length === 0 ? (
              <Card className="p-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No integrations found</p>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredIntegrations.map((integration) => (
                  <IntegrationCard
                    key={integration.id}
                    {...integration}
                    isConnecting={connectingId === integration.id}
                    onConnect={() => handleConnect(integration.id)}
                    onDisconnect={() => handleDisconnect(integration.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Stock Ticker */}
      <div className="fixed bottom-0 left-0 right-0 z-10 bg-background border-t">
        <IntegrationStockTicker 
          connectedCount={connectedCount}
          totalCount={integrations.length}
          essentialConnected={essentialConnected}
          essentialCount={essentialCount}
          setupProgress={setupProgress}
        />
      </div>
    </div>
  );
}

// Integration-specific Stock Ticker
function IntegrationStockTicker({ 
  connectedCount, 
  totalCount, 
  essentialConnected, 
  essentialCount,
  setupProgress
}: { 
  connectedCount: number;
  totalCount: number;
  essentialConnected: number;
  essentialCount: number;
  setupProgress: number;
}) {
  const tickerItems = [
    {
      id: "1",
      icon: CheckCircle2,
      label: "Connected Apps",
      value: `${connectedCount}/${totalCount}`,
      description: "Integrations active and syncing",
      color: "from-blue-500/10 to-blue-500/20",
      iconColor: "text-blue-500"
    },
    {
      id: "2",
      icon: Zap,
      label: "Essential Setup",
      value: `${essentialConnected}/${essentialCount}`,
      description: essentialConnected === essentialCount ? "All essential apps connected!" : "Critical integrations remaining",
      color: essentialConnected === essentialCount ? "from-green-500/10 to-green-500/20" : "from-orange-500/10 to-orange-500/20",
      iconColor: essentialConnected === essentialCount ? "text-green-500" : "text-orange-500"
    },
    {
      id: "3",
      icon: TrendingUp,
      label: "Setup Progress",
      value: `${setupProgress}%`,
      description: "Overall integration completion",
      color: "from-purple-500/10 to-purple-500/20",
      iconColor: "text-purple-500"
    },
    {
      id: "4",
      icon: Sparkles,
      label: "AI Status",
      value: connectedCount === 0 ? "Ready" : "Active",
      description: connectedCount === 0 ? "Connect apps to activate AI" : `Learning from ${connectedCount} data sources`,
      color: "from-indigo-500/10 to-indigo-500/20",
      iconColor: "text-indigo-500"
    }
  ];

  const duplicatedItems = [...tickerItems, ...tickerItems];

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 rounded-xl py-2 mx-4 my-2">
      <div className="animate-ticker flex gap-2">
        {duplicatedItems.map((item, index) => (
          <Card
            key={`${item.id}-${index}`}
            className="flex-shrink-0 px-3 py-1.5 shadow-[0_2px_10px_rgb(0,0,0,0.03)] border-0 rounded-lg bg-white"
          >
            <div className="flex items-center gap-2">
              <div className={`h-6 w-6 rounded-md bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0`}>
                <item.icon className={`h-3 w-3 ${item.iconColor}`} />
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-xs text-muted-foreground whitespace-nowrap">{item.label}</p>
                <p className="text-sm whitespace-nowrap">{item.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
