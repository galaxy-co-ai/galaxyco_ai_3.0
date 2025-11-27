"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  DollarSign,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  BarChart3,
  Lightbulb,
  PieChart,
  Activity,
  Zap,
  ChevronRight,
} from "lucide-react";
import type { Lead, Organization, Deal } from "./CRMDashboard";

interface InsightsTabProps {
  leads: Lead[];
  organizations: Organization[];
  deals: Deal[];
  formatCurrency: (value: number) => string;
  formatDate: (date: Date | null) => string;
}

type InsightType = "pipeline" | "contacts" | "scoring" | "performance";

interface InsightCategory {
  id: InsightType;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  metrics: { label: string; value: string | number }[];
}

export default function InsightsTab({
  leads,
  organizations,
  deals,
  formatCurrency,
}: InsightsTabProps) {
  const [selectedInsight, setSelectedInsight] = useState<InsightType>("pipeline");

  // Calculate insights from the data
  const insights = useMemo(() => {
    const hotLeads = leads.filter((l) => l.tags.includes("hot")).length;
    const qualifiedLeads = leads.filter((l) => l.stage === "qualified").length;
    const avgLeadScore = leads.length > 0 
      ? Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length) 
      : 0;
    
    const totalPipelineValue = deals.reduce((sum, d) => sum + d.value, 0);
    const weightedPipelineValue = deals.reduce(
      (sum, d) => sum + d.value * (d.probability / 100),
      0
    );
    
    const activeDeals = deals.filter((d) => d.stage !== "closed-won" && d.stage !== "closed-lost").length;
    const wonDeals = deals.filter((d) => d.stage === "closed-won").length;
    const lostDeals = deals.filter((d) => d.stage === "closed-lost").length;
    const winRate = wonDeals + lostDeals > 0 
      ? Math.round((wonDeals / (wonDeals + lostDeals)) * 100) 
      : 0;

    // Contact engagement metrics
    const contactsWithEmail = leads.filter((l) => l.email).length;
    const recentlyContacted = leads.filter((l) => {
      if (!l.lastContactedAt) return false;
      const daysSince = Math.floor((Date.now() - new Date(l.lastContactedAt).getTime()) / (1000 * 60 * 60 * 24));
      return daysSince <= 7;
    }).length;

    // Lead scoring distribution
    const highScoreLeads = leads.filter((l) => l.score >= 70).length;
    const mediumScoreLeads = leads.filter((l) => l.score >= 40 && l.score < 70).length;
    const lowScoreLeads = leads.filter((l) => l.score < 40).length;

    return {
      hotLeads,
      qualifiedLeads,
      avgLeadScore,
      totalPipelineValue,
      weightedPipelineValue,
      activeDeals,
      wonDeals,
      lostDeals,
      winRate,
      totalLeads: leads.length,
      totalOrgs: organizations.length,
      totalDeals: deals.length,
      contactsWithEmail,
      recentlyContacted,
      highScoreLeads,
      mediumScoreLeads,
      lowScoreLeads,
    };
  }, [leads, organizations, deals]);

  // Insight categories for left panel
  const insightCategories: InsightCategory[] = useMemo(() => [
    {
      id: "pipeline",
      title: "Pipeline Analysis",
      description: "Deal flow and revenue insights",
      icon: Target,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      metrics: [
        { label: "Active Deals", value: insights.activeDeals },
        { label: "Pipeline Value", value: formatCurrency(insights.totalPipelineValue) },
      ],
    },
    {
      id: "contacts",
      title: "Contact Engagement",
      description: "Relationship health metrics",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      metrics: [
        { label: "Total Contacts", value: insights.totalLeads },
        { label: "Recently Active", value: insights.recentlyContacted },
      ],
    },
    {
      id: "scoring",
      title: "Lead Scoring",
      description: "Quality distribution analysis",
      icon: BarChart3,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      metrics: [
        { label: "High-Value Leads", value: insights.highScoreLeads },
        { label: "Avg Score", value: `${insights.avgLeadScore}%` },
      ],
    },
    {
      id: "performance",
      title: "Performance Metrics",
      description: "Win rates and conversion data",
      icon: Activity,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      metrics: [
        { label: "Win Rate", value: `${insights.winRate}%` },
        { label: "Deals Won", value: insights.wonDeals },
      ],
    },
  ], [insights, formatCurrency]);

  // Get recommendations based on selected insight type
  const getRecommendations = (type: InsightType) => {
    const recs = [];

    switch (type) {
      case "pipeline":
        if (insights.activeDeals > 0) {
          recs.push({
            type: "opportunity",
            icon: TrendingUp,
            title: `${insights.activeDeals} deal${insights.activeDeals > 1 ? "s" : ""} in active pipeline`,
            description: "Review upcoming close dates and prioritize high-value opportunities.",
            priority: "high" as const,
          });
        }
        if (insights.weightedPipelineValue > 0) {
          recs.push({
            type: "info",
            icon: DollarSign,
            title: `${formatCurrency(insights.weightedPipelineValue)} weighted pipeline value`,
            description: "Focus on deals with highest probability to maximize revenue.",
            priority: "medium" as const,
          });
        }
        if (insights.totalDeals === 0) {
          recs.push({
            type: "action",
            icon: Target,
            title: "No deals in pipeline",
            description: "Start by converting qualified leads into deals to build your pipeline.",
            priority: "high" as const,
          });
        }
        break;

      case "contacts":
        if (insights.hotLeads > 0) {
          recs.push({
            type: "opportunity",
            icon: Zap,
            title: `${insights.hotLeads} hot lead${insights.hotLeads > 1 ? "s" : ""} need attention`,
            description: "These leads have high engagement. Prioritize outreach within 24 hours.",
            priority: "high" as const,
          });
        }
        if (insights.recentlyContacted < insights.totalLeads * 0.3) {
          recs.push({
            type: "warning",
            icon: AlertCircle,
            title: "Low recent contact activity",
            description: `Only ${insights.recentlyContacted} of ${insights.totalLeads} contacts engaged this week. Schedule follow-ups.`,
            priority: "medium" as const,
          });
        }
        recs.push({
          type: "info",
          icon: Users,
          title: `${insights.totalOrgs} organization${insights.totalOrgs !== 1 ? "s" : ""} in database`,
          description: "Maintain healthy relationships with regular check-ins.",
          priority: "low" as const,
        });
        break;

      case "scoring":
        if (insights.highScoreLeads > 0) {
          recs.push({
            type: "success",
            icon: CheckCircle2,
            title: `${insights.highScoreLeads} high-value lead${insights.highScoreLeads > 1 ? "s" : ""} identified`,
            description: "These leads score 70+ and have the highest conversion potential.",
            priority: "high" as const,
          });
        }
        if (insights.avgLeadScore < 50 && insights.totalLeads > 0) {
          recs.push({
            type: "warning",
            icon: AlertCircle,
            title: "Lead quality needs improvement",
            description: "Average score is below 50. Consider refining lead sources and qualification criteria.",
            priority: "medium" as const,
          });
        }
        if (insights.lowScoreLeads > 0) {
          recs.push({
            type: "action",
            icon: Clock,
            title: `${insights.lowScoreLeads} low-score leads need nurturing`,
            description: "Set up automated email sequences to warm these leads.",
            priority: "low" as const,
          });
        }
        break;

      case "performance":
        if (insights.winRate >= 60) {
          recs.push({
            type: "success",
            icon: TrendingUp,
            title: "Strong win rate performance",
            description: `Your ${insights.winRate}% win rate is excellent. Keep up the momentum!`,
            priority: "low" as const,
          });
        } else if (insights.winRate > 0 && insights.winRate < 40) {
          recs.push({
            type: "warning",
            icon: TrendingDown,
            title: "Win rate below target",
            description: "Analyze lost deals to identify improvement areas in your sales process.",
            priority: "high" as const,
          });
        }
        if (insights.wonDeals > 0) {
          recs.push({
            type: "info",
            icon: CheckCircle2,
            title: `${insights.wonDeals} deal${insights.wonDeals > 1 ? "s" : ""} closed won`,
            description: "Review what worked well in these deals to replicate success.",
            priority: "medium" as const,
          });
        }
        if (insights.lostDeals > 0) {
          recs.push({
            type: "action",
            icon: AlertCircle,
            title: `${insights.lostDeals} deal${insights.lostDeals > 1 ? "s" : ""} closed lost`,
            description: "Conduct loss analysis to understand and address common objections.",
            priority: "medium" as const,
          });
        }
        break;
    }

    if (recs.length === 0) {
      recs.push({
        type: "info",
        icon: Lightbulb,
        title: "Add more data for insights",
        description: "Import leads, create deals, and track activities to unlock AI-powered recommendations.",
        priority: "low" as const,
      });
    }

    return recs;
  };

  const selectedCategory = insightCategories.find((c) => c.id === selectedInsight);
  const recommendations = getRecommendations(selectedInsight);

  const priorityColors = {
    high: "bg-red-50 border-red-200 text-red-700",
    medium: "bg-amber-50 border-amber-200 text-amber-700",
    low: "bg-green-50 border-green-200 text-green-700",
  };

  // Breakdown data for the selected insight
  const getBreakdownData = (type: InsightType) => {
    switch (type) {
      case "pipeline":
        return {
          metrics: [
            { label: "Total Pipeline Value", value: formatCurrency(insights.totalPipelineValue), icon: DollarSign, color: "text-green-600" },
            { label: "Weighted Value", value: formatCurrency(insights.weightedPipelineValue), icon: Target, color: "text-blue-600" },
            { label: "Active Deals", value: insights.activeDeals, icon: Activity, color: "text-purple-600" },
            { label: "Average Deal Size", value: formatCurrency(insights.activeDeals > 0 ? insights.totalPipelineValue / insights.activeDeals : 0), icon: PieChart, color: "text-amber-600" },
          ],
          stages: [
            { stage: "Won", count: insights.wonDeals, color: "bg-green-500" },
            { stage: "Active", count: insights.activeDeals, color: "bg-blue-500" },
            { stage: "Lost", count: insights.lostDeals, color: "bg-red-500" },
          ],
        };
      case "contacts":
        return {
          metrics: [
            { label: "Total Leads", value: insights.totalLeads, icon: Users, color: "text-blue-600" },
            { label: "Hot Leads", value: insights.hotLeads, icon: Zap, color: "text-red-600" },
            { label: "Recently Contacted", value: insights.recentlyContacted, icon: Clock, color: "text-green-600" },
            { label: "Organizations", value: insights.totalOrgs, icon: Target, color: "text-purple-600" },
          ],
          stages: [
            { stage: "Hot", count: insights.hotLeads, color: "bg-red-500" },
            { stage: "Qualified", count: insights.qualifiedLeads, color: "bg-green-500" },
            { stage: "Other", count: insights.totalLeads - insights.hotLeads - insights.qualifiedLeads, color: "bg-gray-400" },
          ],
        };
      case "scoring":
        return {
          metrics: [
            { label: "Average Score", value: `${insights.avgLeadScore}%`, icon: BarChart3, color: "text-purple-600" },
            { label: "High Score (70+)", value: insights.highScoreLeads, icon: TrendingUp, color: "text-green-600" },
            { label: "Medium Score (40-69)", value: insights.mediumScoreLeads, icon: Activity, color: "text-amber-600" },
            { label: "Low Score (<40)", value: insights.lowScoreLeads, icon: TrendingDown, color: "text-red-600" },
          ],
          stages: [
            { stage: "High (70+)", count: insights.highScoreLeads, color: "bg-green-500" },
            { stage: "Medium (40-69)", count: insights.mediumScoreLeads, color: "bg-amber-500" },
            { stage: "Low (<40)", count: insights.lowScoreLeads, color: "bg-red-500" },
          ],
        };
      case "performance":
        return {
          metrics: [
            { label: "Win Rate", value: `${insights.winRate}%`, icon: TrendingUp, color: "text-green-600" },
            { label: "Deals Won", value: insights.wonDeals, icon: CheckCircle2, color: "text-green-600" },
            { label: "Deals Lost", value: insights.lostDeals, icon: AlertCircle, color: "text-red-600" },
            { label: "Total Closed", value: insights.wonDeals + insights.lostDeals, icon: Target, color: "text-blue-600" },
          ],
          stages: [
            { stage: "Won", count: insights.wonDeals, color: "bg-green-500" },
            { stage: "Lost", count: insights.lostDeals, color: "bg-red-500" },
          ],
        };
      default:
        return { metrics: [], stages: [] };
    }
  };

  const breakdownData = getBreakdownData(selectedInsight);
  const totalForProgress = breakdownData.stages.reduce((sum, s) => sum + s.count, 0);

  return (
    <Card className="p-8 shadow-lg border-0">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Insight Types List */}
        <div className="flex flex-col h-[600px] rounded-xl border bg-white overflow-hidden shadow-sm">
          {/* Header */}
          <div className="px-6 py-4 border-b bg-gradient-to-r from-indigo-50 to-indigo-100/50 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-md">
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-semibold text-[15px] text-gray-900">AI Insights</h3>
                  <p className="text-[13px] text-indigo-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" aria-hidden="true"></span>
                    Intelligent analysis
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                <Sparkles className="h-3 w-3 mr-1" aria-hidden="true" />
                AI Powered
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Select an insight category to view detailed analysis and recommendations.
            </p>
          </div>

          {/* Insight Categories List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {insightCategories.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedInsight === category.id;
              
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedInsight(category.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                    isSelected 
                      ? `${category.bgColor} ${category.borderColor} shadow-md` 
                      : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                  }`}
                  aria-label={`View ${category.title} insights`}
                  aria-pressed={isSelected}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${category.bgColor}`}>
                      <Icon className={`h-5 w-5 ${category.color}`} aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-semibold text-sm ${isSelected ? category.color : "text-gray-900"}`}>
                          {category.title}
                        </h4>
                        <ChevronRight className={`h-4 w-4 transition-transform ${isSelected ? `${category.color} rotate-90` : "text-gray-400"}`} aria-hidden="true" />
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{category.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        {category.metrics.map((metric, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <span className={`text-xs font-medium ${isSelected ? category.color : "text-gray-700"}`}>
                              {metric.value}
                            </span>
                            <span className="text-xs text-gray-400">{metric.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Insight Breakdown */}
        <div className="flex flex-col h-[600px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          {selectedCategory ? (
            <div className="flex-1 overflow-y-auto">
              {/* Detail Header */}
              <div className={`px-6 py-4 border-b ${selectedCategory.bgColor}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${selectedCategory.bgColor} border ${selectedCategory.borderColor}`}>
                    <selectedCategory.icon className={`h-6 w-6 ${selectedCategory.color}`} aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{selectedCategory.title}</h3>
                    <p className="text-sm text-gray-500">{selectedCategory.description}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Key Metrics Grid */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-gray-500" aria-hidden="true" />
                    Key Metrics
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {breakdownData.metrics.map((metric, idx) => {
                      const MetricIcon = metric.icon;
                      return (
                        <div key={idx} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                          <div className="flex items-center gap-2 mb-1">
                            <MetricIcon className={`h-4 w-4 ${metric.color}`} aria-hidden="true" />
                            <span className="text-xs text-gray-500">{metric.label}</span>
                          </div>
                          <p className="text-lg font-bold text-gray-900">{metric.value}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Distribution */}
                {breakdownData.stages.length > 0 && totalForProgress > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <PieChart className="h-4 w-4 text-gray-500" aria-hidden="true" />
                      Distribution
                    </h4>
                    <div className="space-y-3">
                      {breakdownData.stages.map((stage, idx) => {
                        const percentage = Math.round((stage.count / totalForProgress) * 100);
                        return (
                          <div key={idx}>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-600">{stage.stage}</span>
                              <span className="font-medium text-gray-900">{stage.count} ({percentage}%)</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                                role="progressbar"
                                aria-valuenow={percentage}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`${stage.stage}: ${percentage}%`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* AI Recommendations */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" aria-hidden="true" />
                    AI Recommendations
                  </h4>
                  <div className="space-y-3">
                    {recommendations.map((rec, index) => {
                      const RecIcon = rec.icon;
                      return (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${priorityColors[rec.priority]}`}
                          role="article"
                          aria-label={rec.title}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <RecIcon className="h-4 w-4" aria-hidden="true" />
                            </div>
                            <div>
                              <h5 className="font-medium text-sm">{rec.title}</h5>
                              <p className="text-xs opacity-80 mt-0.5">{rec.description}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-sm">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-slate-400" aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">Select an insight</h3>
                <p className="text-sm text-gray-500">
                  Choose an insight category from the list to view detailed analysis and AI recommendations.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
