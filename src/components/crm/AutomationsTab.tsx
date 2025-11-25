"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Mail,
  Target,
  FileText,
  RefreshCw,
  Calendar,
  Bell,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Zap,
  Filter,
  UserPlus,
  TrendingUp,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Automation {
  id: string;
  title: string;
  description: string;
  status: "active" | "paused";
  icon: typeof Mail;
  iconColor: string;
  nodeCount: number;
}

interface AutomationNode {
  id: string;
  type: "trigger" | "action" | "condition" | "delay";
  title: string;
  description: string;
  icon: typeof Mail;
  iconColor: string;
}

export default function AutomationsTab() {
  const [selectedAutomation, setSelectedAutomation] = useState<string>("auto-respond");
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  const automations: Automation[] = [
    {
      id: "auto-respond",
      title: "Auto-respond to emails",
      description: "Automatically respond to incoming emails with AI-generated replies",
      status: "active",
      icon: Mail,
      iconColor: "bg-blue-500",
      nodeCount: 4,
    },
    {
      id: "score-leads",
      title: "Score and prioritize leads",
      description: "AI analyzes and scores new leads based on engagement and fit",
      status: "active",
      icon: Target,
      iconColor: "bg-purple-500",
      nodeCount: 5,
    },
    {
      id: "meeting-brief",
      title: "Generate meeting briefs",
      description: "Auto-generate meeting briefs from contact history and context",
      status: "active",
      icon: FileText,
      iconColor: "bg-green-500",
      nodeCount: 3,
    },
    {
      id: "sync-salesforce",
      title: "Sync contacts to Salesforce",
      description: "Automatically sync contact data and resolve duplicates",
      status: "active",
      icon: RefreshCw,
      iconColor: "bg-blue-500",
      nodeCount: 4,
    },
    {
      id: "daily-digest",
      title: "Create daily action digest",
      description: "Generate morning summary with top priorities and tasks",
      status: "active",
      icon: Calendar,
      iconColor: "bg-orange-500",
      nodeCount: 3,
    },
    {
      id: "follow-up",
      title: "Follow-up reminders",
      description: "Send reminders for leads that need follow-up after 7 days",
      status: "active",
      icon: Bell,
      iconColor: "bg-amber-500",
      nodeCount: 4,
    },
    {
      id: "enrich-leads",
      title: "Enrich lead data",
      description: "Automatically enrich lead profiles with company and contact data",
      status: "paused",
      icon: Sparkles,
      iconColor: "bg-indigo-500",
      nodeCount: 3,
    },
    {
      id: "deal-stage",
      title: "Auto-advance deal stages",
      description: "Move deals to next stage based on activity and probability",
      status: "active",
      icon: TrendingUp,
      iconColor: "bg-emerald-500",
      nodeCount: 5,
    },
  ];

  const getAutomationNodes = (automationId: string): AutomationNode[] => {
    switch (automationId) {
      case "auto-respond":
        return [
          {
            id: "1",
            type: "trigger",
            title: "New email received",
            description: "Triggered when an email arrives in inbox",
            icon: Mail,
            iconColor: "bg-blue-500",
          },
          {
            id: "2",
            type: "condition",
            title: "Check if auto-reply needed",
            description: "Analyze email content and sender to determine if response is needed",
            icon: Filter,
            iconColor: "bg-purple-500",
          },
          {
            id: "3",
            type: "action",
            title: "Generate AI response",
            description: "Create contextual reply using AI based on email content",
            icon: Sparkles,
            iconColor: "bg-indigo-500",
          },
          {
            id: "4",
            type: "action",
            title: "Send response",
            description: "Send the generated reply to the sender",
            icon: Mail,
            iconColor: "bg-green-500",
          },
        ];
      case "score-leads":
        return [
          {
            id: "1",
            type: "trigger",
            title: "New lead created",
            description: "Triggered when a new lead is added to the system",
            icon: UserPlus,
            iconColor: "bg-blue-500",
          },
          {
            id: "2",
            type: "action",
            title: "Enrich lead data",
            description: "Gather company information, industry, and contact details",
            icon: Sparkles,
            iconColor: "bg-indigo-500",
          },
          {
            id: "3",
            type: "action",
            title: "Analyze engagement",
            description: "Review email opens, clicks, website visits, and interactions",
            icon: Target,
            iconColor: "bg-purple-500",
          },
          {
            id: "4",
            type: "action",
            title: "Calculate score",
            description: "Generate AI score (0-100) based on fit, engagement, and signals",
            icon: TrendingUp,
            iconColor: "bg-emerald-500",
          },
          {
            id: "5",
            type: "action",
            title: "Assign priority",
            description: "Categorize as Hot (≥70), Warm (50-69), or Cold (<50)",
            icon: CheckCircle2,
            iconColor: "bg-green-500",
          },
        ];
      case "meeting-brief":
        return [
          {
            id: "1",
            type: "trigger",
            title: "Meeting scheduled",
            description: "Triggered when a calendar event is created or updated",
            icon: Calendar,
            iconColor: "bg-blue-500",
          },
          {
            id: "2",
            type: "action",
            title: "Gather context",
            description: "Collect contact history, emails, deals, and notes from 8+ sources",
            icon: FileText,
            iconColor: "bg-indigo-500",
          },
          {
            id: "3",
            type: "action",
            title: "Generate brief",
            description: "Create comprehensive meeting brief with key talking points",
            icon: Sparkles,
            iconColor: "bg-green-500",
          },
        ];
      case "sync-salesforce":
        return [
          {
            id: "1",
            type: "trigger",
            title: "Contact updated",
            description: "Triggered when contact data changes in CRM",
            icon: RefreshCw,
            iconColor: "bg-blue-500",
          },
          {
            id: "2",
            type: "action",
            title: "Check for duplicates",
            description: "Identify potential duplicate contacts in Salesforce",
            icon: Filter,
            iconColor: "bg-purple-500",
          },
          {
            id: "3",
            type: "condition",
            title: "Resolve duplicates",
            description: "Merge or update existing records if duplicates found",
            icon: CheckCircle2,
            iconColor: "bg-amber-500",
          },
          {
            id: "4",
            type: "action",
            title: "Sync to Salesforce",
            description: "Update or create contact record in Salesforce",
            icon: RefreshCw,
            iconColor: "bg-green-500",
          },
        ];
      case "daily-digest":
        return [
          {
            id: "1",
            type: "trigger",
            title: "Daily at 8:00 AM",
            description: "Scheduled to run every morning at 8:00 AM",
            icon: Clock,
            iconColor: "bg-blue-500",
          },
          {
            id: "2",
            type: "action",
            title: "Compile priorities",
            description: "Gather top 10 priorities: hot leads, deals to close, follow-ups",
            icon: Target,
            iconColor: "bg-indigo-500",
          },
          {
            id: "3",
            type: "action",
            title: "Generate summary",
            description: "Create morning digest email with actionable items",
            icon: FileText,
            iconColor: "bg-green-500",
          },
        ];
      case "follow-up":
        return [
          {
            id: "1",
            type: "trigger",
            title: "Daily check",
            description: "Runs daily to check for leads needing follow-up",
            icon: Clock,
            iconColor: "bg-blue-500",
          },
          {
            id: "2",
            type: "condition",
            title: "Check last contact",
            description: "Find leads with no contact in 7+ days",
            icon: Filter,
            iconColor: "bg-purple-500",
          },
          {
            id: "3",
            type: "action",
            title: "Create reminder",
            description: "Generate follow-up task and notification",
            icon: Bell,
            iconColor: "bg-amber-500",
          },
          {
            id: "4",
            type: "action",
            title: "Send notification",
            description: "Notify assigned user about follow-up needed",
            icon: Mail,
            iconColor: "bg-green-500",
          },
        ];
      case "enrich-leads":
        return [
          {
            id: "1",
            type: "trigger",
            title: "New lead added",
            description: "Triggered when a lead is created with minimal data",
            icon: UserPlus,
            iconColor: "bg-blue-500",
          },
          {
            id: "2",
            type: "action",
            title: "Fetch company data",
            description: "Look up company information, industry, size, revenue",
            icon: Sparkles,
            iconColor: "bg-indigo-500",
          },
          {
            id: "3",
            type: "action",
            title: "Update lead profile",
            description: "Enrich lead with gathered company and contact data",
            icon: CheckCircle2,
            iconColor: "bg-green-500",
          },
        ];
      case "deal-stage":
        return [
          {
            id: "1",
            type: "trigger",
            title: "Deal activity detected",
            description: "Triggered when deal has new activity or updates",
            icon: TrendingUp,
            iconColor: "bg-blue-500",
          },
          {
            id: "2",
            type: "condition",
            title: "Check probability",
            description: "Evaluate deal probability and stage criteria",
            icon: Filter,
            iconColor: "bg-purple-500",
          },
          {
            id: "3",
            type: "condition",
            title: "Check activity level",
            description: "Review recent interactions, meetings, and engagement",
            icon: Target,
            iconColor: "bg-amber-500",
          },
          {
            id: "4",
            type: "action",
            title: "Advance stage",
            description: "Move deal to next stage if criteria met",
            icon: ArrowRight,
            iconColor: "bg-emerald-500",
          },
          {
            id: "5",
            type: "action",
            title: "Update probability",
            description: "Recalculate and update deal probability score",
            icon: TrendingUp,
            iconColor: "bg-green-500",
          },
        ];
      default:
        return [];
    }
  };

  const selectedAutomationData = automations.find((a) => a.id === selectedAutomation) || automations[0];
  const nodes = getAutomationNodes(selectedAutomation);

  const getNodeTypeLabel = (type: string) => {
    switch (type) {
      case "trigger":
        return "Trigger";
      case "action":
        return "Action";
      case "condition":
        return "Condition";
      case "delay":
        return "Delay";
      default:
        return type;
    }
  };

  const getNodeTypeColor = (type: string) => {
    switch (type) {
      case "trigger":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "action":
        return "bg-green-50 text-green-700 border-green-200";
      case "condition":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "delay":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[600px]">
      {/* Left: Automation List */}
      <div className="flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {automations.map((automation) => (
            <button
              key={automation.id}
              onClick={() => setSelectedAutomation(automation.id)}
              className={cn(
                "w-full p-3 rounded-lg border border-slate-200 bg-white text-left hover:border-slate-300 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                selectedAutomation === automation.id && "border-blue-300 bg-blue-50/30 shadow-sm"
              )}
              aria-label={`Select automation ${automation.title}`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${automation.iconColor} flex-shrink-0`}>
                  <automation.icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-gray-900">{automation.title}</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5 py-0 h-4",
                        automation.status === "active"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      )}
                    >
                      {automation.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">{automation.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Automation Flow */}
      <div className="flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex-shrink-0 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 mb-1">{selectedAutomationData.title}</h3>
            <p className="text-sm text-gray-500">{selectedAutomationData.description}</p>
          </div>
          <Button
            size="icon"
            className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm border border-blue-200 text-blue-600 shadow-sm hover:bg-blue-50 hover:text-blue-700 transition-all flex-shrink-0"
            onClick={() => setShowSetupWizard(true)}
            aria-label="Setup automation"
          >
            <span className="text-lg font-light">+</span>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          <div className="relative min-h-full">
            {/* Node Flow Diagram */}
            <div className="flex flex-col gap-6">
              {nodes.map((node, index) => {
                const isLast = index === nodes.length - 1;

                const getGradientClasses = () => {
                  switch (node.type) {
                    case "trigger":
                      return "from-blue-500 to-blue-600";
                    case "action":
                      return "from-green-500 to-green-600";
                    case "condition":
                      return "from-purple-500 to-purple-600";
                    case "delay":
                      return "from-amber-500 to-amber-600";
                    default:
                      return "from-slate-500 to-slate-600";
                  }
                };

                return (
                  <div key={node.id} className="relative">
                    <div className="flex items-start gap-4">
                      {/* Node with gradient */}
                      <div className="relative flex-shrink-0">
                        <div
                          className={cn(
                            "w-16 h-16 rounded-xl bg-gradient-to-br shadow-lg flex items-center justify-center",
                            getGradientClasses()
                          )}
                        >
                          <node.icon className="h-7 w-7 text-white" />
                        </div>
                        
                        {/* Connector line */}
                        {!isLast && (
                          <div className="absolute left-1/2 top-16 -translate-x-1/2 w-0.5 h-6 bg-blue-400">
                            <div className="absolute left-1/2 top-full -translate-x-1/2 w-2 h-2 rounded-full bg-blue-400"></div>
                          </div>
                        )}
                      </div>

                      {/* Node Info */}
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-gray-900">{node.title}</p>
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] px-1.5 py-0 h-4", getNodeTypeColor(node.type))}
                          >
                            {getNodeTypeLabel(node.type)}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">{node.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Setup Wizard Dialog */}
      <Dialog open={showSetupWizard} onOpenChange={setShowSetupWizard}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Setup {selectedAutomationData.title}</DialogTitle>
            <DialogDescription>
              Follow these steps to configure your automation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Step Indicator */}
            <div className="flex items-center justify-between mb-6">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                      step <= wizardStep
                        ? "bg-blue-600 text-white"
                        : "bg-slate-200 text-slate-500"
                    )}
                  >
                    {step}
                  </div>
                  {step < 4 && (
                    <div
                      className={cn(
                        "flex-1 h-0.5 mx-2 transition-all",
                        step < wizardStep ? "bg-blue-600" : "bg-slate-200"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Trigger Configuration */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold mb-2">Configure Trigger</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Set up when this automation should start
                  </p>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="trigger-type">Trigger Type</Label>
                    <select
                      id="trigger-type"
                      className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option>When email is received</option>
                      <option>When lead is created</option>
                      <option>When deal stage changes</option>
                      <option>On schedule</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="trigger-conditions">Conditions (optional)</Label>
                    <Input
                      id="trigger-conditions"
                      placeholder="e.g., From specific domain, Contains keywords"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Action Configuration */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold mb-2">Configure Actions</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    What should happen when the trigger fires?
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <input type="checkbox" className="mt-1" defaultChecked />
                      <div className="flex-1">
                        <Label className="font-semibold">Generate AI Response</Label>
                        <p className="text-xs text-gray-500 mt-1">
                          Use AI to create contextual replies based on email content
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <input type="checkbox" className="mt-1" />
                      <div className="flex-1">
                        <Label className="font-semibold">Send Notification</Label>
                        <p className="text-xs text-gray-500 mt-1">
                          Notify team members when automation runs
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <input type="checkbox" className="mt-1" />
                      <div className="flex-1">
                        <Label className="font-semibold">Update Lead Score</Label>
                        <p className="text-xs text-gray-500 mt-1">
                          Automatically update lead engagement score
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Settings */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold mb-2">Automation Settings</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Fine-tune how the automation behaves
                  </p>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="automation-name">Automation Name</Label>
                    <Input
                      id="automation-name"
                      placeholder={selectedAutomationData.title}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="response-delay">Response Delay (minutes)</Label>
                    <Input
                      id="response-delay"
                      type="number"
                      placeholder="0"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Wait before sending response (0 = immediate)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="active-toggle" defaultChecked />
                    <Label htmlFor="active-toggle">Activate automation immediately</Label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {wizardStep === 4 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold mb-2">Review & Activate</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Review your automation settings before activating
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Trigger:</span>
                    <span className="text-sm font-semibold">Email received</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Actions:</span>
                    <span className="text-sm font-semibold">Generate AI response, Send email</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge className="bg-green-50 text-green-700 border-green-200">
                      Ready to activate
                    </Badge>
                  </div>
                </div>
                <div className="p-4 border border-blue-200 bg-blue-50/50 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Tip:</strong> You can always edit or pause this automation later from the automations list.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  if (wizardStep > 1) {
                    setWizardStep(wizardStep - 1);
                  } else {
                    setShowSetupWizard(false);
                  }
                }}
              >
                {wizardStep > 1 ? "Back" : "Cancel"}
              </Button>
              <Button
                onClick={() => {
                  if (wizardStep < 4) {
                    setWizardStep(wizardStep + 1);
                  } else {
                    // Complete setup
                    setShowSetupWizard(false);
                    setWizardStep(1);
                    // Here you would save the automation configuration
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {wizardStep < 4 ? "Next" : "Activate Automation"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

