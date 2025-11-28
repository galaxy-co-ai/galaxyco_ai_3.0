"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Share2,
  Calendar,
  Sparkles,
  CheckCircle2,
  Zap,
  Filter,
  TrendingUp,
  Clock,
  BarChart3,
  Users,
  FileText,
  Bell,
  Target,
  ChevronRight,
  Play,
  Pause,
  Settings,
  RefreshCw,
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

export default function MarketingAutomationsTab() {
  const [selectedAutomation, setSelectedAutomation] = useState<string>("email-campaign");

  const automations: Automation[] = [
    {
      id: "email-campaign",
      title: "Automated email campaigns",
      description: "Personalized email sequences based on behavior",
      status: "active",
      icon: Mail,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      nodeCount: 5,
      timeSaved: "~2 hrs/day",
    },
    {
      id: "social-scheduling",
      title: "Schedule social media posts",
      description: "Auto-schedule across all platforms",
      status: "active",
      icon: Share2,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      nodeCount: 4,
      timeSaved: "~1 hr/day",
    },
    {
      id: "content-publishing",
      title: "Auto-publish content",
      description: "Publish blog posts at scheduled times",
      status: "active",
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      nodeCount: 3,
      timeSaved: "~30 min/day",
    },
    {
      id: "lead-nurture",
      title: "Lead nurture sequences",
      description: "Nurture leads with targeted follow-ups",
      status: "active",
      icon: Users,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-200",
      nodeCount: 6,
      timeSaved: "~1.5 hrs/day",
    },
    {
      id: "campaign-optimization",
      title: "Campaign optimization",
      description: "Auto-adjust budgets and targeting",
      status: "active",
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      nodeCount: 5,
      timeSaved: "~45 min/day",
    },
    {
      id: "ab-testing",
      title: "A/B test automation",
      description: "Run tests and deploy winners",
      status: "active",
      icon: Target,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      nodeCount: 4,
      timeSaved: "~30 min/test",
    },
    {
      id: "re-engagement",
      title: "Re-engagement campaigns",
      description: "Re-engage inactive users automatically",
      status: "paused",
      icon: Bell,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      nodeCount: 4,
      timeSaved: "~1 hr/day",
    },
    {
      id: "analytics-reports",
      title: "Weekly analytics reports",
      description: "Auto-generate performance reports",
      status: "active",
      icon: BarChart3,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      nodeCount: 3,
      timeSaved: "~2 hrs/week",
    },
  ];

  const getAutomationNodes = (automationId: string): AutomationNode[] => {
    switch (automationId) {
      case "email-campaign":
        return [
          { id: "1", type: "trigger", title: "User action detected", description: "Sign up, download, or page visit", icon: Users },
          { id: "2", type: "condition", title: "Check user segment", description: "Determine email sequence", icon: Filter },
          { id: "3", type: "action", title: "Personalize email content", description: "AI generates personalized content", icon: Sparkles },
          { id: "4", type: "delay", title: "Wait 2 days", description: "Delay before next email", icon: Clock },
          { id: "5", type: "action", title: "Send email", description: "Send personalized email", icon: Mail },
        ];
      case "social-scheduling":
        return [
          { id: "1", type: "trigger", title: "Content published", description: "New content published or scheduled", icon: FileText },
          { id: "2", type: "action", title: "Generate social posts", description: "AI creates platform-specific posts", icon: Sparkles },
          { id: "3", type: "action", title: "Schedule posts", description: "Schedule across all platforms", icon: Calendar },
          { id: "4", type: "action", title: "Post to social media", description: "Publish at scheduled times", icon: Share2 },
        ];
      case "content-publishing":
        return [
          { id: "1", type: "trigger", title: "Publish date reached", description: "Scheduled time arrives", icon: Clock },
          { id: "2", type: "action", title: "Review and approve", description: "Check content is ready", icon: CheckCircle2 },
          { id: "3", type: "action", title: "Publish content", description: "Publish and notify team", icon: FileText },
        ];
      case "lead-nurture":
        return [
          { id: "1", type: "trigger", title: "New lead created", description: "New lead added to system", icon: Users },
          { id: "2", type: "action", title: "Score and segment lead", description: "AI assigns to nurture sequence", icon: Target },
          { id: "3", type: "delay", title: "Wait 1 day", description: "Delay before first email", icon: Clock },
          { id: "4", type: "action", title: "Send welcome content", description: "Personalized welcome email", icon: Mail },
          { id: "5", type: "delay", title: "Wait 3 days", description: "Delay before next email", icon: Clock },
          { id: "6", type: "action", title: "Send educational content", description: "Case studies and guides", icon: FileText },
        ];
      case "campaign-optimization":
        return [
          { id: "1", type: "trigger", title: "Daily performance check", description: "Analyze campaign metrics", icon: Clock },
          { id: "2", type: "condition", title: "Check performance", description: "Evaluate ROI, CTR, conversions", icon: BarChart3 },
          { id: "3", type: "condition", title: "Performance below target", description: "Determine if optimization needed", icon: Filter },
          { id: "4", type: "action", title: "Adjust budget and targeting", description: "Reallocate and refine", icon: TrendingUp },
          { id: "5", type: "action", title: "Notify team", description: "Send optimization notification", icon: Bell },
        ];
      case "ab-testing":
        return [
          { id: "1", type: "trigger", title: "A/B test started", description: "Test is launched", icon: Target },
          { id: "2", type: "condition", title: "Check test results", description: "Monitor variant performance", icon: BarChart3 },
          { id: "3", type: "condition", title: "Statistical significance", description: "Determine if winner found", icon: CheckCircle2 },
          { id: "4", type: "action", title: "Switch to winning variant", description: "Deploy winner and end test", icon: TrendingUp },
        ];
      case "re-engagement":
        return [
          { id: "1", type: "trigger", title: "Daily check", description: "Find inactive users", icon: Clock },
          { id: "2", type: "condition", title: "Check user activity", description: "No engagement in 30+ days", icon: Filter },
          { id: "3", type: "action", title: "Create re-engagement campaign", description: "Generate special offer", icon: Sparkles },
          { id: "4", type: "action", title: "Send re-engagement email", description: "Personalized re-engagement", icon: Mail },
        ];
      case "analytics-reports":
        return [
          { id: "1", type: "trigger", title: "Weekly on Monday", description: "Every Monday at 9:00 AM", icon: Clock },
          { id: "2", type: "action", title: "Compile metrics", description: "Gather all campaign data", icon: BarChart3 },
          { id: "3", type: "action", title: "Generate report", description: "Create performance report", icon: FileText },
        ];
      default:
        return [];
    }
  };

  const selectedAutomationData = automations.find((a) => a.id === selectedAutomation) || automations[0];
  const nodes = getAutomationNodes(selectedAutomation);

  const getNodeTypeLabel = (type: string) => {
    switch (type) {
      case "trigger": return "Trigger";
      case "action": return "Action";
      case "condition": return "Condition";
      case "delay": return "Delay";
      default: return type;
    }
  };

  const getNodeTypeStyles = (type: string) => {
    switch (type) {
      case "trigger":
        return { bg: "bg-blue-500", badge: "bg-blue-50 text-blue-700 border-blue-200" };
      case "action":
        return { bg: "bg-green-500", badge: "bg-green-50 text-green-700 border-green-200" };
      case "condition":
        return { bg: "bg-purple-500", badge: "bg-purple-50 text-purple-700 border-purple-200" };
      case "delay":
        return { bg: "bg-amber-500", badge: "bg-amber-50 text-amber-700 border-amber-200" };
      default:
        return { bg: "bg-slate-500", badge: "bg-slate-50 text-slate-700 border-slate-200" };
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
                  <h3 className="font-semibold text-[15px] text-gray-900">Marketing Automations</h3>
                  <p className="text-[13px] text-orange-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" aria-hidden="true"></span>
                    {activeCount} active workflows
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                <Sparkles className="h-3 w-3 mr-1" aria-hidden="true" />
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
                      <automation.icon className={`h-5 w-5 ${automation.color}`} aria-hidden="true" />
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
    </Card>
  );
}
