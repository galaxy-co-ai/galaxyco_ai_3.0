import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { 
  Search, 
  Mail, 
  Calendar, 
  FileText, 
  Database, 
  Zap, 
  Filter, 
  MessageSquare,
  Plug,
  Clock,
  GitBranch,
  Code,
  Globe,
  Webhook,
  Send,
  FileJson,
  Cpu,
  BarChart3,
  Calculator,
  Settings,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Check,
  X,
  Repeat,
  PauseCircle
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";

interface NodeTemplate {
  id: string;
  type: string;
  icon: any;
  label: string;
  description: string;
  gradient: string;
  category: string;
  isPro?: boolean;
}

const nodeTemplates: NodeTemplate[] = [
  // Triggers
  {
    id: "trigger-email",
    type: "email-trigger",
    icon: Mail,
    label: "Email Received",
    description: "Triggers when a new email arrives",
    gradient: "from-cyan-500 to-cyan-600",
    category: "Triggers"
  },
  {
    id: "trigger-calendar",
    type: "calendar-trigger",
    icon: Calendar,
    label: "Calendar Event",
    description: "Triggers on calendar events",
    gradient: "from-rose-500 to-rose-600",
    category: "Triggers"
  },
  {
    id: "trigger-webhook",
    type: "webhook-trigger",
    icon: Webhook,
    label: "Webhook",
    description: "Triggers on HTTP webhook",
    gradient: "from-purple-500 to-purple-600",
    category: "Triggers"
  },
  {
    id: "trigger-schedule",
    type: "schedule-trigger",
    icon: Clock,
    label: "Schedule",
    description: "Triggers on a time schedule",
    gradient: "from-blue-500 to-blue-600",
    category: "Triggers"
  },

  // AI Tools
  {
    id: "ai-assistant",
    type: "ai-assistant",
    icon: Sparkles,
    label: "AI Assistant",
    description: "Process with AI intelligence",
    gradient: "from-fuchsia-500 to-fuchsia-600",
    category: "AI Tools"
  },
  {
    id: "ai-summarize",
    type: "ai-summarize",
    icon: FileText,
    label: "AI Summarize",
    description: "Generate text summaries",
    gradient: "from-violet-500 to-violet-600",
    category: "AI Tools"
  },
  {
    id: "ai-transcribe",
    type: "ai-transcribe",
    icon: MessageSquare,
    label: "AI Transcribe",
    description: "Convert speech to text",
    gradient: "from-pink-500 to-pink-600",
    category: "AI Tools"
  },
  {
    id: "ai-analyze",
    type: "ai-analyze",
    icon: BarChart3,
    label: "AI Analyze",
    description: "Analyze data with AI",
    gradient: "from-purple-500 to-purple-600",
    category: "AI Tools",
    isPro: true
  },

  // Actions
  {
    id: "action-send-email",
    type: "send-email",
    icon: Send,
    label: "Send Email",
    description: "Send an email message",
    gradient: "from-orange-500 to-orange-600",
    category: "Actions"
  },
  {
    id: "action-create-record",
    type: "create-record",
    icon: Database,
    label: "Create Record",
    description: "Create database record",
    gradient: "from-emerald-500 to-emerald-600",
    category: "Actions"
  },
  {
    id: "action-update-record",
    type: "update-record",
    icon: Database,
    label: "Update Record",
    description: "Update database record",
    gradient: "from-teal-500 to-teal-600",
    category: "Actions"
  },
  {
    id: "action-api-call",
    type: "api-call",
    icon: Globe,
    label: "HTTP Request",
    description: "Make API calls",
    gradient: "from-indigo-500 to-indigo-600",
    category: "Actions"
  },

  // Logic & Flow
  {
    id: "logic-condition",
    type: "condition",
    icon: GitBranch,
    label: "Condition",
    description: "If/else branching logic",
    gradient: "from-amber-500 to-amber-600",
    category: "Logic"
  },
  {
    id: "logic-filter",
    type: "filter",
    icon: Filter,
    label: "Filter",
    description: "Filter items by criteria",
    gradient: "from-yellow-500 to-yellow-600",
    category: "Logic"
  },
  {
    id: "logic-loop",
    type: "loop",
    icon: Repeat,
    label: "Loop",
    description: "Iterate over items",
    gradient: "from-lime-500 to-lime-600",
    category: "Logic"
  },
  {
    id: "logic-delay",
    type: "delay",
    icon: PauseCircle,
    label: "Delay",
    description: "Wait before continuing",
    gradient: "from-sky-500 to-sky-600",
    category: "Logic"
  },

  // Data Transform
  {
    id: "data-extract",
    type: "extract",
    icon: FileJson,
    label: "Extract Data",
    description: "Extract specific fields",
    gradient: "from-blue-400 to-blue-500",
    category: "Data"
  },
  {
    id: "data-transform",
    type: "transform",
    icon: Code,
    label: "Transform",
    description: "Transform data structure",
    gradient: "from-violet-400 to-violet-500",
    category: "Data"
  },
  {
    id: "data-calculate",
    type: "calculate",
    icon: Calculator,
    label: "Calculate",
    description: "Perform calculations",
    gradient: "from-cyan-400 to-cyan-500",
    category: "Data"
  },
  {
    id: "data-merge",
    type: "merge",
    icon: Zap,
    label: "Merge Data",
    description: "Combine multiple inputs",
    gradient: "from-pink-400 to-pink-500",
    category: "Data"
  },

  // Integrations
  {
    id: "integration-salesforce",
    type: "salesforce",
    icon: Plug,
    label: "Salesforce",
    description: "Connect to Salesforce",
    gradient: "from-blue-600 to-blue-700",
    category: "Integrations",
    isPro: true
  },
  {
    id: "integration-slack",
    type: "slack",
    icon: MessageSquare,
    label: "Slack",
    description: "Send Slack messages",
    gradient: "from-purple-600 to-purple-700",
    category: "Integrations"
  },
  {
    id: "integration-hubspot",
    type: "hubspot",
    icon: Database,
    label: "HubSpot",
    description: "Connect to HubSpot",
    gradient: "from-orange-600 to-orange-700",
    category: "Integrations",
    isPro: true
  },

  // Error Handling
  {
    id: "error-catch",
    type: "error-catch",
    icon: AlertTriangle,
    label: "Catch Error",
    description: "Handle errors gracefully",
    gradient: "from-red-500 to-red-600",
    category: "Error Handling"
  },
  {
    id: "error-retry",
    type: "retry",
    icon: Repeat,
    label: "Retry",
    description: "Retry on failure",
    gradient: "from-amber-500 to-amber-600",
    category: "Error Handling"
  },
];

const categories = [
  { name: "Triggers", icon: Zap, color: "text-cyan-600" },
  { name: "AI Tools", icon: Sparkles, color: "text-fuchsia-600" },
  { name: "Actions", icon: Send, color: "text-orange-600" },
  { name: "Logic", icon: GitBranch, color: "text-amber-600" },
  { name: "Data", icon: FileJson, color: "text-blue-600" },
  { name: "Integrations", icon: Plug, color: "text-purple-600" },
  { name: "Error Handling", icon: AlertTriangle, color: "text-red-600" },
];

export function NodePalette() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const filteredTemplates = nodeTemplates.filter(template => 
    template.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleDragStart = (e: React.DragEvent, template: NodeTemplate) => {
    e.dataTransfer.setData('nodeTemplate', JSON.stringify(template));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-64 lg:w-72 xl:w-80 bg-background border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-3 lg:p-4 border-b border-border">
        <h3 className="text-sm mb-3">Node Library</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Node Categories */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 lg:p-4 space-y-2">
          {searchQuery ? (
            // Search Results
            <div className="space-y-2">
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No nodes found</p>
                </div>
              ) : (
                filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, template)}
                    className="group flex items-center gap-3 p-3 bg-muted/30 hover:bg-muted/60 rounded-lg cursor-grab active:cursor-grabbing transition-all hover:shadow-md border border-transparent hover:border-border"
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${template.gradient} flex items-center justify-center shadow-sm flex-shrink-0`}>
                      <template.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{template.label}</p>
                        {template.isPro && (
                          <Badge variant="outline" className="text-xs bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-700">
                            Pro
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{template.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            // Categorized View
            categories.map((category) => {
              const categoryTemplates = nodeTemplates.filter(t => t.category === category.name);
              if (categoryTemplates.length === 0) return null;

              const isExpanded = expandedCategories.includes(category.name);

              return (
                <Collapsible
                  key={category.name}
                  open={isExpanded}
                  onOpenChange={() => toggleCategory(category.name)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between h-auto py-2 px-3 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <category.icon className={`h-4 w-4 ${category.color}`} />
                        <span className="text-sm font-medium">{category.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {categoryTemplates.length}
                        </Badge>
                      </div>
                      <ChevronRight 
                        className={`h-4 w-4 transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`} 
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1.5 mt-1.5 mb-2">
                    {categoryTemplates.map((template) => (
                      <div
                        key={template.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, template)}
                        className="group flex items-center gap-3 p-2.5 ml-2 bg-muted/20 hover:bg-muted/50 rounded-lg cursor-grab active:cursor-grabbing transition-all hover:shadow-sm border border-transparent hover:border-border"
                      >
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${template.gradient} flex items-center justify-center shadow-sm flex-shrink-0`}>
                          <template.icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-medium truncate">{template.label}</p>
                            {template.isPro && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-700">
                                Pro
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate leading-tight">
                            {template.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            })
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-lg p-3">
          <p className="text-xs font-medium mb-1">💡 Drag & Drop</p>
          <p className="text-xs text-muted-foreground">
            Drag any node onto the canvas to add it to your workflow
          </p>
        </div>
      </div>
    </div>
  );
}
