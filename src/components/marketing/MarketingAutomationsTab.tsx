"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Share2,
  Calendar,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Zap,
  Filter,
  TrendingUp,
  Clock,
  Megaphone,
  BarChart3,
  Users,
  FileText,
  Bell,
  Target,
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

export default function MarketingAutomationsTab() {
  const [selectedAutomation, setSelectedAutomation] = useState<string>("email-campaign");

  const automations: Automation[] = [
    {
      id: "email-campaign",
      title: "Automated email campaigns",
      description: "Send personalized email sequences based on user behavior and triggers",
      status: "active",
      icon: Mail,
      iconColor: "bg-blue-500",
      nodeCount: 5,
    },
    {
      id: "social-scheduling",
      title: "Schedule social media posts",
      description: "Automatically schedule and post content across social platforms",
      status: "active",
      icon: Share2,
      iconColor: "bg-purple-500",
      nodeCount: 4,
    },
    {
      id: "content-publishing",
      title: "Auto-publish content",
      description: "Automatically publish blog posts and content at scheduled times",
      status: "active",
      icon: FileText,
      iconColor: "bg-green-500",
      nodeCount: 3,
    },
    {
      id: "lead-nurture",
      title: "Lead nurture sequences",
      description: "Automatically nurture leads with targeted content and follow-ups",
      status: "active",
      icon: Users,
      iconColor: "bg-cyan-500",
      nodeCount: 6,
    },
    {
      id: "campaign-optimization",
      title: "Campaign performance optimization",
      description: "Automatically adjust campaign budgets and targeting based on performance",
      status: "active",
      icon: TrendingUp,
      iconColor: "bg-emerald-500",
      nodeCount: 5,
    },
    {
      id: "ab-testing",
      title: "A/B test automation",
      description: "Automatically run A/B tests and switch to winning variants",
      status: "active",
      icon: Target,
      iconColor: "bg-orange-500",
      nodeCount: 4,
    },
    {
      id: "re-engagement",
      title: "Re-engagement campaigns",
      description: "Automatically trigger re-engagement campaigns for inactive users",
      status: "paused",
      icon: Bell,
      iconColor: "bg-amber-500",
      nodeCount: 4,
    },
    {
      id: "analytics-reports",
      title: "Weekly analytics reports",
      description: "Automatically generate and send weekly marketing performance reports",
      status: "active",
      icon: BarChart3,
      iconColor: "bg-indigo-500",
      nodeCount: 3,
    },
  ];

  const getAutomationNodes = (automationId: string): AutomationNode[] => {
    switch (automationId) {
      case "email-campaign":
        return [
          {
            id: "1",
            type: "trigger",
            title: "User action detected",
            description: "Triggered when user signs up, downloads content, or visits specific pages",
            icon: Users,
            iconColor: "bg-blue-500",
          },
          {
            id: "2",
            type: "condition",
            title: "Check user segment",
            description: "Determine which email sequence to send based on user profile and behavior",
            icon: Filter,
            iconColor: "bg-purple-500",
          },
          {
            id: "3",
            type: "action",
            title: "Personalize email content",
            description: "Generate personalized email content using AI based on user data",
            icon: Sparkles,
            iconColor: "bg-indigo-500",
          },
          {
            id: "4",
            type: "delay",
            title: "Wait 2 days",
            description: "Delay before sending next email in sequence",
            icon: Clock,
            iconColor: "bg-amber-500",
          },
          {
            id: "5",
            type: "action",
            title: "Send email",
            description: "Send personalized email to user",
            icon: Mail,
            iconColor: "bg-green-500",
          },
        ];
      case "social-scheduling":
        return [
          {
            id: "1",
            type: "trigger",
            title: "Content published",
            description: "Triggered when new content is published or scheduled",
            icon: FileText,
            iconColor: "bg-blue-500",
          },
          {
            id: "2",
            type: "action",
            title: "Generate social posts",
            description: "AI generates platform-specific social media posts from content",
            icon: Sparkles,
            iconColor: "bg-indigo-500",
          },
          {
            id: "3",
            type: "action",
            title: "Schedule posts",
            description: "Schedule posts across Facebook, Twitter, LinkedIn, and Instagram",
            icon: Calendar,
            iconColor: "bg-purple-500",
          },
          {
            id: "4",
            type: "action",
            title: "Post to social media",
            description: "Automatically publish posts at scheduled times",
            icon: Share2,
            iconColor: "bg-green-500",
          },
        ];
      case "content-publishing":
        return [
          {
            id: "1",
            type: "trigger",
            title: "Publish date reached",
            description: "Triggered when scheduled publish date and time arrives",
            icon: Clock,
            iconColor: "bg-blue-500",
          },
          {
            id: "2",
            type: "action",
            title: "Review and approve",
            description: "Check content status and ensure it's ready for publication",
            icon: CheckCircle2,
            iconColor: "bg-amber-500",
          },
          {
            id: "3",
            type: "action",
            title: "Publish content",
            description: "Publish content to website and notify team",
            icon: FileText,
            iconColor: "bg-green-500",
          },
        ];
      case "lead-nurture":
        return [
          {
            id: "1",
            type: "trigger",
            title: "New lead created",
            description: "Triggered when a new lead is added to the system",
            icon: Users,
            iconColor: "bg-blue-500",
          },
          {
            id: "2",
            type: "action",
            title: "Score and segment lead",
            description: "AI analyzes lead and assigns to appropriate nurture sequence",
            icon: Target,
            iconColor: "bg-purple-500",
          },
          {
            id: "3",
            type: "delay",
            title: "Wait 1 day",
            description: "Delay before sending first nurture email",
            icon: Clock,
            iconColor: "bg-amber-500",
          },
          {
            id: "4",
            type: "action",
            title: "Send welcome content",
            description: "Send personalized welcome email with relevant content",
            icon: Mail,
            iconColor: "bg-green-500",
          },
          {
            id: "5",
            type: "delay",
            title: "Wait 3 days",
            description: "Delay before sending next nurture email",
            icon: Clock,
            iconColor: "bg-amber-500",
          },
          {
            id: "6",
            type: "action",
            title: "Send educational content",
            description: "Send case studies, guides, or product information",
            icon: FileText,
            iconColor: "bg-green-500",
          },
        ];
      case "campaign-optimization":
        return [
          {
            id: "1",
            type: "trigger",
            title: "Daily performance check",
            description: "Runs daily to analyze campaign performance metrics",
            icon: Clock,
            iconColor: "bg-blue-500",
          },
          {
            id: "2",
            type: "condition",
            title: "Check performance",
            description: "Evaluate ROI, CTR, conversion rates, and cost metrics",
            icon: BarChart3,
            iconColor: "bg-purple-500",
          },
          {
            id: "3",
            type: "condition",
            title: "Performance below target",
            description: "Determine if campaign needs optimization",
            icon: Filter,
            iconColor: "bg-amber-500",
          },
          {
            id: "4",
            type: "action",
            title: "Adjust budget and targeting",
            description: "Automatically reallocate budget and refine targeting",
            icon: TrendingUp,
            iconColor: "bg-emerald-500",
          },
          {
            id: "5",
            type: "action",
            title: "Notify team",
            description: "Send notification about optimization changes",
            icon: Bell,
            iconColor: "bg-green-500",
          },
        ];
      case "ab-testing":
        return [
          {
            id: "1",
            type: "trigger",
            title: "A/B test started",
            description: "Triggered when A/B test is launched",
            icon: Target,
            iconColor: "bg-blue-500",
          },
          {
            id: "2",
            type: "condition",
            title: "Check test results",
            description: "Monitor performance of test variants daily",
            icon: BarChart3,
            iconColor: "bg-purple-500",
          },
          {
            id: "3",
            type: "condition",
            title: "Statistical significance reached",
            description: "Determine if winner can be declared with confidence",
            icon: CheckCircle2,
            iconColor: "bg-amber-500",
          },
          {
            id: "4",
            type: "action",
            title: "Switch to winning variant",
            description: "Automatically deploy winning variant and end test",
            icon: TrendingUp,
            iconColor: "bg-green-500",
          },
        ];
      case "re-engagement":
        return [
          {
            id: "1",
            type: "trigger",
            title: "Daily check",
            description: "Runs daily to find inactive users",
            icon: Clock,
            iconColor: "bg-blue-500",
          },
          {
            id: "2",
            type: "condition",
            title: "Check user activity",
            description: "Find users with no engagement in 30+ days",
            icon: Filter,
            iconColor: "bg-purple-500",
          },
          {
            id: "3",
            type: "action",
            title: "Create re-engagement campaign",
            description: "Generate special offer or content to re-engage users",
            icon: Sparkles,
            iconColor: "bg-indigo-500",
          },
          {
            id: "4",
            type: "action",
            title: "Send re-engagement email",
            description: "Send personalized re-engagement message",
            icon: Mail,
            iconColor: "bg-green-500",
          },
        ];
      case "analytics-reports":
        return [
          {
            id: "1",
            type: "trigger",
            title: "Weekly on Monday",
            description: "Scheduled to run every Monday at 9:00 AM",
            icon: Clock,
            iconColor: "bg-blue-500",
          },
          {
            id: "2",
            type: "action",
            title: "Compile metrics",
            description: "Gather performance data from all campaigns and channels",
            icon: BarChart3,
            iconColor: "bg-indigo-500",
          },
          {
            id: "3",
            type: "action",
            title: "Generate report",
            description: "Create comprehensive weekly marketing performance report",
            icon: FileText,
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
                selectedAutomation === automation.id && "border-orange-300 bg-orange-50/30 shadow-sm"
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
        <div className="p-6 border-b border-slate-200 flex-shrink-0">
          <h3 className="text-base font-semibold text-gray-900 mb-1">{selectedAutomationData.title}</h3>
          <p className="text-sm text-gray-500">{selectedAutomationData.description}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          <div className="relative">
            {/* Node Flow Diagram */}
            <div className="space-y-6">
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
    </div>
  );
}







