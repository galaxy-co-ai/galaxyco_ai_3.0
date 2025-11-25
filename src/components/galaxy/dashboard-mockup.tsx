"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Mail, 
  Calendar, 
  TrendingUp, 
  Users, 
  FileText,
  Lightbulb,
  Image as ImageIcon,
  Zap,
  BarChart3,
  MessageSquare,
  Bot as BotIcon
} from "lucide-react";

export function DashboardMockup() {
  return (
    <div className="w-full bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white px-3 py-2 flex gap-1.5">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-600 text-white text-xs font-medium">
          <Lightbulb className="h-3.5 w-3.5" />
          Tips
          <span className="ml-0.5">4</span>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-gray-100 text-xs font-medium text-gray-600">
          <ImageIcon className="h-3.5 w-3.5" />
          Snapshot
          <span className="ml-0.5 text-blue-600">2</span>
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-gray-100 text-xs font-medium text-gray-600">
          <Zap className="h-3.5 w-3.5" />
          Automations
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-gray-100 text-xs font-medium text-gray-600">
          <BarChart3 className="h-3.5 w-3.5" />
          Planner
          <span className="ml-0.5 text-orange-600">0</span>
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-gray-100 text-xs font-medium text-gray-600">
          <MessageSquare className="h-3.5 w-3.5" />
          Messages
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-gray-100 text-xs font-medium text-gray-600">
          <BotIcon className="h-3.5 w-3.5" />
          Agents
          <span className="ml-0.5 text-green-600">3</span>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 grid md:grid-cols-2 gap-4 bg-white">
        {/* Left Column - Ask Your AI Assistant */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-purple-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Ask Your AI Assistant</h3>
              <p className="text-xs text-gray-600">Get instant help with blockers, questions, or needs</p>
            </div>
          </div>
          <div className="space-y-2 mb-3">
            <p className="text-xs text-gray-500 mb-1.5">💡 Example questions:</p>
            {[
              "How can I automate my email follow-ups?",
              "What's blocking my lead conversion?",
              "Show me what I should focus on today"
            ].map((question, i) => (
              <div
                key={i}
                className="text-xs px-2.5 py-1.5 rounded bg-white border border-purple-200 text-purple-900"
              >
                "{question}"
              </div>
            ))}
          </div>
          <div className="relative">
            <Input
              placeholder="Ask me anything about your workflows, tasks, or data..."
              className="text-xs h-8 bg-white border-purple-200"
            />
            <button className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded bg-purple-600 text-white">
              <Sparkles className="h-3 w-3" />
            </button>
          </div>
          <p className="text-[10px] text-gray-500 text-center mt-2">
            AI analyzes your data in real-time to provide personalized insights
          </p>
        </div>

        {/* Right Column - Quick Actions */}
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg border border-cyan-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-cyan-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Quick Actions</h3>
              <p className="text-xs text-gray-600">One-click solutions to solve your needs instantly</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {[
              { icon: Mail, bg: "bg-blue-100", text: "text-blue-600", title: "Auto-respond to 12 emails", desc: "Save ~45 min • Drafts ready for review" },
              { icon: Calendar, bg: "bg-green-100", text: "text-green-600", title: "Generate meeting brief for 3pm call", desc: "TechCorp • Context from 8 sources" },
              { icon: TrendingUp, bg: "bg-purple-100", text: "text-purple-600", title: "Score and prioritize 5 new leads", desc: "AI confidence: High • Ready to assign" },
              { icon: Users, bg: "bg-blue-100", text: "text-blue-600", title: "Sync 24 contacts to Salesforce", desc: "Updated data • Resolve duplicates" },
              { icon: FileText, bg: "bg-orange-100", text: "text-orange-600", title: "Create daily action digest", desc: "Top 10 priorities • Morning summary" }
            ].map((action, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white border border-cyan-100 hover:border-cyan-200 transition-colors"
              >
                <div className={`p-1.5 rounded-lg ${action.bg} mt-0.5`}>
                  <action.icon className={`h-3.5 w-3.5 ${action.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900">{action.title}</p>
                  <p className="text-[10px] text-gray-500">{action.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Navigation at Bottom */}
      <div className="border-t border-gray-200 bg-white px-4 py-2.5 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-12 h-0.5 bg-purple-600 rounded-full"></div>
          <span className="font-medium text-gray-900">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-400">
          <div className="w-12 h-0.5 bg-gray-300 rounded-full"></div>
          <span>AI Agents</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-400">
          <div className="w-12 h-0.5 bg-gray-300 rounded-full"></div>
          <span>Automations</span>
        </div>
      </div>
    </div>
  );
}

