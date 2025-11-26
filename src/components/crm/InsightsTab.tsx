"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  Zap,
  Target,
  Users,
  Building2,
  DollarSign,
  BarChart3,
  Activity,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Lead, Organization, Deal } from "./CRMDashboard";

interface InsightsTabProps {
  leads: Lead[];
  organizations: Organization[];
  deals: Deal[];
  formatCurrency: (cents: number) => string;
  formatDate: (date: Date | null) => string;
}

interface KPI {
  id: string;
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: typeof Sparkles;
  iconColor: string;
  description: string;
}

export default function InsightsTab({
  leads,
  organizations,
  deals,
  formatCurrency,
  formatDate,
}: InsightsTabProps) {
  const [selectedKPI, setSelectedKPI] = useState<string>("pipeline");

  // Calculate KPIs
  const totalPipelineValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const avgDealSize = deals.length > 0 ? totalPipelineValue / deals.length : 0;
  const conversionRate = leads.length > 0 ? (deals.length / leads.length) * 100 : 0;
  const hotLeadsCount = leads.filter((l) => l.score >= 70).length;
  const avgLeadScore = leads.length > 0
    ? leads.reduce((sum, l) => sum + l.score, 0) / leads.length
    : 0;
  const coldLeadsCount = leads.filter((l) => l.score < 50).length;
  const dealsReadyToCloseArray = deals.filter((d) => d.probability >= 70);
  const dealsReadyToClose = dealsReadyToCloseArray.length;
  const dealsValue = dealsReadyToCloseArray.reduce((sum, d) => sum + d.value, 0);
  const leadsNeedingReEngagement = leads.filter(
    (l) => !l.lastContactedAt || daysSince(l.lastContactedAt) > 7
  ).length;

  const kpis: KPI[] = [
    {
      id: "pipeline",
      title: "Pipeline Value",
      value: formatCurrency(totalPipelineValue),
      change: "+12%",
      changeType: "positive",
      icon: DollarSign,
      iconColor: "bg-blue-500",
      description: "Total value of all active deals in your pipeline",
    },
    {
      id: "hot-leads",
      title: "Hot Leads",
      value: hotLeadsCount.toString(),
      change: `${Math.round((hotLeadsCount / Math.max(leads.length, 1)) * 100)}% of total`,
      changeType: "positive",
      icon: TrendingUp,
      iconColor: "bg-purple-500",
      description: "Leads with score ≥70, ready for immediate follow-up",
    },
    {
      id: "avg-deal-size",
      title: "Average Deal Size",
      value: formatCurrency(avgDealSize),
      change: "vs last month",
      changeType: "neutral",
      icon: BarChart3,
      iconColor: "bg-green-500",
      description: "Average value across all active deals",
    },
    {
      id: "conversion-rate",
      title: "Conversion Rate",
      value: `${Math.round(conversionRate)}%`,
      change: "Leads to deals",
      changeType: "neutral",
      icon: Target,
      iconColor: "bg-purple-500",
      description: "Percentage of leads converted to deals",
    },
    {
      id: "avg-lead-score",
      title: "Average Lead Score",
      value: Math.round(avgLeadScore).toString(),
      change: "/100",
      changeType: avgLeadScore >= 70 ? "positive" : avgLeadScore >= 50 ? "neutral" : "negative",
      icon: Activity,
      iconColor: "bg-blue-500",
      description: "Overall quality score of your lead database",
    },
    {
      id: "deals-ready",
      title: "Deals Ready to Close",
      value: dealsReadyToClose.toString(),
      change: formatCurrency(dealsValue),
      changeType: "positive",
      icon: CheckCircle2,
      iconColor: "bg-green-500",
      description: "High-probability deals (≥70%) ready for closing",
    },
    {
      id: "cold-leads",
      title: "Cold Leads",
      value: coldLeadsCount.toString(),
      change: "Need attention",
      changeType: "negative",
      icon: TrendingDown,
      iconColor: "bg-amber-500",
      description: "Leads with score <50 requiring re-engagement",
    },
    {
      id: "re-engagement",
      title: "Leads Needing Re-engagement",
      value: leadsNeedingReEngagement.toString(),
      change: "7+ days inactive",
      changeType: "negative",
      icon: AlertCircle,
      iconColor: "bg-orange-500",
      description: "Leads with no contact in the last 7 days",
    },
  ];

  const selectedKPIData = kpis.find((k) => k.id === selectedKPI) || kpis[0];

  function daysSince(date: Date | null): number {
    if (!date) return 999;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  function getKPIDetails(kpiId: string): {
    title: string;
    description: string;
    data: Array<{
      label: string;
      value?: string | number;
      company?: string;
      score?: number;
      probability?: number;
      stage?: string;
      daysSince?: number;
      closeDate?: Date | null;
      lastContact?: Date | null;
    }>;
  } {
    switch (kpiId) {
      case "pipeline":
        return {
          title: "Pipeline Value Breakdown",
          description: "Total value across all active deals",
          data: deals.map((deal) => ({
            label: deal.title,
            value: deal.value,
            company: deal.company,
            probability: deal.probability,
            stage: deal.stage,
          })),
        };
      case "hot-leads":
        return {
          title: "Hot Leads Breakdown",
          description: "Leads with score ≥70",
          data: leads
            .filter((l) => l.score >= 70)
            .map((lead) => ({
              label: lead.name,
              value: lead.estimatedValue,
              company: lead.company,
              score: lead.score,
              stage: lead.stage,
            })),
        };
      case "avg-deal-size":
        return {
          title: "Deal Size Analysis",
          description: "Distribution of deal values",
          data: deals.map((deal) => ({
            label: deal.title,
            value: deal.value,
            company: deal.company,
            probability: deal.probability,
          })),
        };
      case "conversion-rate":
        return {
          title: "Conversion Analysis",
          description: "Leads converted to deals",
          data: [
            { label: "Total Leads", value: leads.length },
            { label: "Total Deals", value: deals.length },
            { label: "Conversion Rate", value: Math.round(conversionRate) },
          ],
        };
      case "avg-lead-score":
        return {
          title: "Lead Score Distribution",
          description: "Breakdown of lead quality scores",
          data: [
            { label: "Hot (≥70)", value: leads.filter((l) => l.score >= 70).length },
            { label: "Warm (50-69)", value: leads.filter((l) => l.score >= 50 && l.score < 70).length },
            { label: "Cold (<50)", value: leads.filter((l) => l.score < 50).length },
            { label: "Average Score", value: Math.round(avgLeadScore) },
          ],
        };
      case "deals-ready":
        return {
          title: "Deals Ready to Close",
          description: "High-probability deals (≥70%)",
          data: deals
            .filter((d) => d.probability >= 70)
            .map((deal) => ({
              label: deal.title,
              value: deal.value,
              company: deal.company,
              probability: deal.probability,
              closeDate: deal.closeDate,
            })),
        };
      case "cold-leads":
        return {
          title: "Cold Leads",
          description: "Leads with score <50",
          data: leads
            .filter((l) => l.score < 50)
            .map((lead) => ({
              label: lead.name,
              value: lead.estimatedValue,
              company: lead.company,
              score: lead.score,
              lastContact: lead.lastContactedAt,
            })),
        };
      case "re-engagement":
        return {
          title: "Leads Needing Re-engagement",
          description: "No contact in 7+ days",
          data: leads
            .filter((l) => !l.lastContactedAt || daysSince(l.lastContactedAt) > 7)
            .map((lead) => ({
              label: lead.name,
              value: lead.estimatedValue,
              company: lead.company,
              score: lead.score,
              daysSince: daysSince(lead.lastContactedAt),
            })),
        };
      default:
        return {
          title: "KPI Details",
          description: "",
          data: [],
        };
    }
  }

  const kpiDetails = getKPIDetails(selectedKPIData.id);

  return (
    <Card className="p-8 shadow-lg border-0">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: KPI List */}
        <div className="flex flex-col h-[600px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          {/* KPI List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {kpis.map((kpi) => (
              <button
                key={kpi.id}
                onClick={() => setSelectedKPI(kpi.id)}
                className={cn(
                  "w-full p-3 rounded-lg border border-slate-200 bg-white text-left hover:border-slate-300 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                  selectedKPI === kpi.id && "border-blue-300 bg-blue-50/30 shadow-sm"
                )}
                aria-label={`Select KPI ${kpi.title}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${kpi.iconColor} flex-shrink-0`}>
                    <kpi.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 mb-0.5">{kpi.title}</p>
                    <p className="text-xs text-gray-500">{kpi.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">{kpi.value}</p>
                    {kpi.change && (
                      <span
                        className={cn(
                          "text-[10px] mt-0.5 block",
                          kpi.changeType === "positive"
                            ? "text-green-600"
                            : kpi.changeType === "negative"
                              ? "text-red-600"
                              : "text-gray-500"
                        )}
                      >
                        {kpi.change}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: KPI Details */}
        <div className="flex flex-col h-[600px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-200 flex-shrink-0 bg-gradient-to-r from-indigo-50 to-indigo-100/50">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-full ${selectedKPIData.iconColor}`}>
                <selectedKPIData.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">{kpiDetails.title}</h3>
                <p className="text-sm text-gray-500">{kpiDetails.description}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {kpiDetails.data.length > 0 ? (
              kpiDetails.data.map((item, index) => (
                <div key={index} className="p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 mb-0.5">{item.label}</p>
                      {item.company && (
                        <p className="text-xs text-gray-500">{item.company}</p>
                      )}
                      <div className="flex items-center gap-4 flex-wrap mt-2">
                        {item.value !== undefined && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Value</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {typeof item.value === "number" ? formatCurrency(item.value) : item.value}
                            </p>
                          </div>
                        )}
                        {"score" in item && item.score !== undefined && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Score</p>
                            <Badge
                              variant="outline"
                              className={
                                (item.score ?? 0) >= 70
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : (item.score ?? 0) >= 50
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-slate-50 text-slate-700 border-slate-200"
                              }
                            >
                              {item.score}
                            </Badge>
                          </div>
                        )}
                        {"probability" in item && item.probability !== undefined && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Probability</p>
                            <p
                              className={cn(
                                "text-sm font-semibold",
                                (item.probability ?? 0) >= 70
                                  ? "text-green-600"
                                  : (item.probability ?? 0) >= 50
                                    ? "text-amber-600"
                                    : "text-gray-600"
                              )}
                            >
                              {item.probability}%
                            </p>
                          </div>
                        )}
                        {"stage" in item && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Stage</p>
                            <Badge variant="outline" className="text-xs capitalize">
                              {item.stage}
                            </Badge>
                          </div>
                        )}
                        {"daysSince" in item && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Days Since Contact</p>
                            <p className="text-sm font-semibold text-gray-900">{item.daysSince} days</p>
                          </div>
                        )}
                        {"closeDate" in item && item.closeDate && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Close Date</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {formatDate(item.closeDate)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p>No data available for this insight.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
