"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
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
  ChevronRight,
  Play,
  Pause,
  Settings,
} from "lucide-react";

interface Automation {
  id: string;
  title: string;
  description: string;
  status: "active" | "paused";
  icon: typeof Mail;
  color: string;
  bgColor: string;
  borderColor: string;
  nodeCount: number;
  timeSaved: string;
}

interface AutomationNode {
  id: string;
  type: "trigger" | "action" | "condition" | "delay";
  title: string;
  description: string;
  icon: typeof Mail;
}

export default function AutomationsTab() {
  const [selectedAutomation, setSelectedAutomation] = useState<string>("auto-respond");
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  const automations: Automation[] = [
    {
      id: "auto-respond",
      title: "Auto-respond to emails",
      description: "AI-generated replies to incoming emails",
      status: "active",
      icon: Mail,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      nodeCount: 4,
      timeSaved: "~45 min/day",
    },
    {
      id: "score-leads",
      title: "Score and prioritize leads",
      description: "AI scores leads based on engagement",
      status: "active",
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      nodeCount: 5,
      timeSaved: "~30 min/day",
    },
    {
      id: "meeting-brief",
      title: "Generate meeting briefs",
      description: "Context from 8+ sources before calls",
      status: "active",
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      nodeCount: 3,
      timeSaved: "~15 min/meeting",
    },
    {
      id: "sync-salesforce",
      title: "Sync contacts to Salesforce",
      description: "Auto-sync and resolve duplicates",
      status: "active",
      icon: RefreshCw,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-200",
      nodeCount: 4,
      timeSaved: "~20 min/day",
    },
    {
      id: "daily-digest",
      title: "Create daily action digest",
      description: "Morning summary with priorities",
      status: "active",
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      nodeCount: 3,
      timeSaved: "~10 min/day",
    },
    {
      id: "follow-up",
      title: "Follow-up reminders",
      description: "Remind for 7+ day old leads",
      status: "active",
      icon: Bell,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      nodeCount: 4,
      timeSaved: "~25 min/day",
    },
    {
      id: "enrich-leads",
      title: "Enrich lead data",
      description: "Auto-enrich with company data",
      status: "paused",
      icon: Sparkles,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      nodeCount: 3,
      timeSaved: "~35 min/day",
    },
    {
      id: "deal-stage",
      title: "Auto-advance deal stages",
      description: "Move deals based on activity",
      status: "active",
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      nodeCount: 5,
      timeSaved: "~15 min/day",
    },
  ];

  const getAutomationNodes = (automationId: string): AutomationNode[] => {
    switch (automationId) {
      case "auto-respond":
        return [
          { id: "1", type: "trigger", title: "New email received", description: "Triggered when an email arrives in inbox", icon: Mail },
          { id: "2", type: "condition", title: "Check if auto-reply needed", description: "Analyze email content and sender", icon: Filter },
          { id: "3", type: "action", title: "Generate AI response", description: "Create contextual reply using AI", icon: Sparkles },
          { id: "4", type: "action", title: "Send response", description: "Send the generated reply", icon: Mail },
        ];
      case "score-leads":
        return [
          { id: "1", type: "trigger", title: "New lead created", description: "Triggered when a new lead is added", icon: UserPlus },
          { id: "2", type: "action", title: "Enrich lead data", description: "Gather company info and details", icon: Sparkles },
          { id: "3", type: "action", title: "Analyze engagement", description: "Review opens, clicks, and visits", icon: Target },
          { id: "4", type: "action", title: "Calculate score", description: "Generate AI score (0-100)", icon: TrendingUp },
          { id: "5", type: "action", title: "Assign priority", description: "Hot (≥70), Warm (50-69), Cold (<50)", icon: CheckCircle2 },
        ];
      case "meeting-brief":
        return [
          { id: "1", type: "trigger", title: "Meeting scheduled", description: "Calendar event created or updated", icon: Calendar },
          { id: "2", type: "action", title: "Gather context", description: "Collect from 8+ sources", icon: FileText },
          { id: "3", type: "action", title: "Generate brief", description: "Create with key talking points", icon: Sparkles },
        ];
      case "sync-salesforce":
        return [
          { id: "1", type: "trigger", title: "Contact updated", description: "When contact data changes in CRM", icon: RefreshCw },
          { id: "2", type: "action", title: "Check for duplicates", description: "Identify potential duplicates", icon: Filter },
          { id: "3", type: "condition", title: "Resolve duplicates", description: "Merge or update existing records", icon: CheckCircle2 },
          { id: "4", type: "action", title: "Sync to Salesforce", description: "Update or create record", icon: RefreshCw },
        ];
      case "daily-digest":
        return [
          { id: "1", type: "trigger", title: "Daily at 8:00 AM", description: "Scheduled to run every morning", icon: Clock },
          { id: "2", type: "action", title: "Compile priorities", description: "Top 10 priorities for the day", icon: Target },
          { id: "3", type: "action", title: "Generate summary", description: "Create digest with action items", icon: FileText },
        ];
      case "follow-up":
        return [
          { id: "1", type: "trigger", title: "Daily check", description: "Runs daily for follow-up needs", icon: Clock },
          { id: "2", type: "condition", title: "Check last contact", description: "Find leads with no contact in 7+ days", icon: Filter },
          { id: "3", type: "action", title: "Create reminder", description: "Generate follow-up task", icon: Bell },
          { id: "4", type: "action", title: "Send notification", description: "Notify assigned user", icon: Mail },
        ];
      case "enrich-leads":
        return [
          { id: "1", type: "trigger", title: "New lead added", description: "Lead created with minimal data", icon: UserPlus },
          { id: "2", type: "action", title: "Fetch company data", description: "Look up industry, size, revenue", icon: Sparkles },
          { id: "3", type: "action", title: "Update lead profile", description: "Enrich with gathered data", icon: CheckCircle2 },
        ];
      case "deal-stage":
        return [
          { id: "1", type: "trigger", title: "Deal activity detected", description: "New activity or updates", icon: TrendingUp },
          { id: "2", type: "condition", title: "Check probability", description: "Evaluate stage criteria", icon: Filter },
          { id: "3", type: "condition", title: "Check activity level", description: "Review recent engagement", icon: Target },
          { id: "4", type: "action", title: "Advance stage", description: "Move to next stage if met", icon: ArrowRight },
          { id: "5", type: "action", title: "Update probability", description: "Recalculate probability score", icon: TrendingUp },
        ];
      default:
        return [];
    }
  };

  const selectedAutomationData = automations.find((a) => a.id === selectedAutomation) || automations[0];
  const nodes = getAutomationNodes(selectedAutomation);

  const getNodeTypeStyles = (type: string) => {
    switch (type) {
      case "trigger":
        return { bg: "bg-blue-500", text: "text-blue-700", badge: "bg-blue-50 text-blue-700 border-blue-200" };
      case "action":
        return { bg: "bg-green-500", text: "text-green-700", badge: "bg-green-50 text-green-700 border-green-200" };
      case "condition":
        return { bg: "bg-purple-500", text: "text-purple-700", badge: "bg-purple-50 text-purple-700 border-purple-200" };
      case "delay":
        return { bg: "bg-amber-500", text: "text-amber-700", badge: "bg-amber-50 text-amber-700 border-amber-200" };
      default:
        return { bg: "bg-slate-500", text: "text-slate-700", badge: "bg-slate-50 text-slate-700 border-slate-200" };
    }
  };

  const getNodeTypeLabel = (type: string) => {
    switch (type) {
      case "trigger": return "Trigger";
      case "action": return "Action";
      case "condition": return "Condition";
      case "delay": return "Delay";
      default: return type;
    }
  };

  // Count active automations
  const activeCount = automations.filter(a => a.status === "active").length;

  return (
    <Card className="p-8 shadow-lg border-0">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Automation Types List */}
        <div className="flex flex-col h-[600px] rounded-xl border bg-white overflow-hidden shadow-sm">
          {/* Header */}
          <div className="px-6 py-4 border-b bg-gradient-to-r from-orange-50 to-orange-100/50 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md">
                  <Zap className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-semibold text-[15px] text-gray-900">Automations</h3>
                  <p className="text-[13px] text-orange-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" aria-hidden="true"></span>
                    {activeCount} active workflows
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                <Zap className="h-3 w-3 mr-1" aria-hidden="true" />
                AI Powered
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Select an automation to view its workflow and configuration.
            </p>
          </div>

          {/* Automation List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {automations.map((automation) => {
              const Icon = automation.icon;
              const isSelected = selectedAutomation === automation.id;
              
              return (
                <button
                  key={automation.id}
                  onClick={() => setSelectedAutomation(automation.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                    isSelected 
                      ? `${automation.bgColor} ${automation.borderColor} shadow-md` 
                      : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                  }`}
                  aria-label={`View ${automation.title} automation`}
                  aria-pressed={isSelected}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${automation.bgColor}`}>
                      <Icon className={`h-5 w-5 ${automation.color}`} aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-semibold text-sm ${isSelected ? automation.color : "text-gray-900"}`}>
                            {automation.title}
                          </h4>
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] px-1.5 py-0 h-4 ${
                              automation.status === "active" 
                                ? "bg-green-50 text-green-700 border-green-200" 
                                : "bg-slate-50 text-slate-600 border-slate-200"
                            }`}
                          >
                            {automation.status === "active" ? (
                              <><Play className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />Active</>
                            ) : (
                              <><Pause className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />Paused</>
                            )}
                          </Badge>
                        </div>
                        <ChevronRight className={`h-4 w-4 transition-transform ${isSelected ? `${automation.color} rotate-90` : "text-gray-400"}`} aria-hidden="true" />
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{automation.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-xs ${isSelected ? automation.color : "text-gray-600"}`}>
                          {automation.nodeCount} steps
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-green-600 font-medium">
                          Saves {automation.timeSaved}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Automation Flow */}
        <div className="flex flex-col h-[600px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          {selectedAutomationData ? (
            <div className="flex-1 overflow-y-auto">
              {/* Detail Header */}
              <div className={`px-6 py-4 border-b ${selectedAutomationData.bgColor}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${selectedAutomationData.bgColor} border ${selectedAutomationData.borderColor}`}>
                      <selectedAutomationData.icon className={`h-6 w-6 ${selectedAutomationData.color}`} aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{selectedAutomationData.title}</h3>
                      <p className="text-sm text-gray-500">{selectedAutomationData.description}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowSetupWizard(true)}
                    className={`${selectedAutomationData.bgColor} ${selectedAutomationData.color} ${selectedAutomationData.borderColor}`}
                    aria-label="Configure automation"
                  >
                    <Settings className="h-4 w-4 mr-1" aria-hidden="true" />
                    Configure
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Stats - Inline subtle display */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400">Steps:</span>
                    <span className="font-medium text-gray-700">{selectedAutomationData.nodeCount}</span>
                  </div>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400">Saves:</span>
                    <span className="font-medium text-green-600">{selectedAutomationData.timeSaved}</span>
                  </div>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-1.5">
                    {selectedAutomationData.status === "active" ? (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-green-50 text-green-600 border-green-200 font-normal">
                        <Play className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-gray-50 text-gray-500 border-gray-200 font-normal">
                        <Pause className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />
                        Paused
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Workflow Steps */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-orange-500" aria-hidden="true" />
                    Workflow Steps
                  </h4>
                  <div className="space-y-3">
                    {nodes.map((node, index) => {
                      const styles = getNodeTypeStyles(node.type);
                      const isLast = index === nodes.length - 1;
                      const NodeIcon = node.icon;
                      
                      return (
                        <div key={node.id} className="relative">
                          <div className="flex items-start gap-3">
                            {/* Step indicator */}
                            <div className="relative flex-shrink-0">
                              <div className={`w-10 h-10 rounded-lg ${styles.bg} flex items-center justify-center shadow-sm`}>
                                <NodeIcon className="h-5 w-5 text-white" aria-hidden="true" />
                              </div>
                              {/* Connector line */}
                              {!isLast && (
                                <div className="absolute left-1/2 top-10 -translate-x-1/2 w-0.5 h-3 bg-gray-200" aria-hidden="true" />
                              )}
                            </div>

                            {/* Step content */}
                            <div className="flex-1 min-w-0 pb-3">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-sm font-medium text-gray-900">{node.title}</p>
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${styles.badge}`}>
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

                {/* Quick Actions */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={selectedAutomationData.status === "active" ? "outline" : "default"}
                      className={selectedAutomationData.status === "active" 
                        ? "text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100" 
                        : "bg-green-600 hover:bg-green-700 text-white"
                      }
                    >
                      {selectedAutomationData.status === "active" ? (
                        <><Pause className="h-3.5 w-3.5 mr-1" aria-hidden="true" />Pause</>
                      ) : (
                        <><Play className="h-3.5 w-3.5 mr-1" aria-hidden="true" />Activate</>
                      )}
                    </Button>
                    <Button size="sm" variant="outline" className="text-gray-600">
                      <RefreshCw className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                      Run Now
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-sm">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-slate-400" aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">Select an automation</h3>
                <p className="text-sm text-gray-500">
                  Choose an automation from the list to view its workflow and configuration.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Setup Wizard Dialog */}
      <Dialog open={showSetupWizard} onOpenChange={setShowSetupWizard}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure {selectedAutomationData.title}</DialogTitle>
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
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      step <= wizardStep ? "bg-orange-600 text-white" : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {step}
                  </div>
                  {step < 4 && (
                    <div className={`flex-1 h-0.5 mx-2 transition-all ${step < wizardStep ? "bg-orange-600" : "bg-slate-200"}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Trigger Configuration */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold mb-2">Configure Trigger</h3>
                  <p className="text-sm text-gray-500 mb-4">Set up when this automation should start</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="trigger-type">Trigger Type</Label>
                    <select id="trigger-type" className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm">
                      <option>When email is received</option>
                      <option>When lead is created</option>
                      <option>When deal stage changes</option>
                      <option>On schedule</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="trigger-conditions">Conditions (optional)</Label>
                    <Input id="trigger-conditions" placeholder="e.g., From specific domain, Contains keywords" className="mt-1" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Action Configuration */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold mb-2">Configure Actions</h3>
                  <p className="text-sm text-gray-500 mb-4">What should happen when the trigger fires?</p>
                </div>
                <div className="space-y-3">
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <input type="checkbox" className="mt-1" defaultChecked aria-label="Generate AI Response" />
                      <div className="flex-1">
                        <Label className="font-semibold">Generate AI Response</Label>
                        <p className="text-xs text-gray-500 mt-1">Use AI to create contextual replies based on content</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <input type="checkbox" className="mt-1" aria-label="Send Notification" />
                      <div className="flex-1">
                        <Label className="font-semibold">Send Notification</Label>
                        <p className="text-xs text-gray-500 mt-1">Notify team members when automation runs</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <input type="checkbox" className="mt-1" aria-label="Update Lead Score" />
                      <div className="flex-1">
                        <Label className="font-semibold">Update Lead Score</Label>
                        <p className="text-xs text-gray-500 mt-1">Automatically update lead engagement score</p>
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
                  <p className="text-sm text-gray-500 mb-4">Fine-tune how the automation behaves</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="automation-name">Automation Name</Label>
                    <Input id="automation-name" placeholder={selectedAutomationData.title} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="response-delay">Response Delay (minutes)</Label>
                    <Input id="response-delay" type="number" placeholder="0" className="mt-1" />
                    <p className="text-xs text-gray-500 mt-1">Wait before executing (0 = immediate)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="active-toggle" defaultChecked aria-label="Activate automation immediately" />
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
                  <p className="text-sm text-gray-500 mb-4">Review your automation settings before activating</p>
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
                    <Badge className="bg-green-50 text-green-700 border-green-200">Ready to activate</Badge>
                  </div>
                </div>
                <div className="p-4 border border-orange-200 bg-orange-50/50 rounded-lg">
                  <p className="text-sm text-orange-900">
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
                    setShowSetupWizard(false);
                    setWizardStep(1);
                  }
                }}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {wizardStep < 4 ? "Next" : "Activate Automation"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
