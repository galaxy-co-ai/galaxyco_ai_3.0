"use client";

import { Lead } from "./CRMDashboard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Mail,
  Phone,
  Calendar,
  Building2,
  Sparkles,
  TrendingUp,
  MessageSquare,
  Tag,
  Edit,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface LeadDetailViewProps {
  lead: Lead;
  formatDate: (date: Date | null) => string;
  formatCurrency: (cents: number) => string;
  onDelete?: (leadId: string) => void;
}

export default function LeadDetailView({ lead, formatDate, formatCurrency, onDelete }: LeadDetailViewProps) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return "bg-red-50 text-red-700 border-red-200";
    if (score >= 50) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      new: "bg-slate-100 text-slate-700",
      contacted: "bg-blue-100 text-blue-700",
      qualified: "bg-purple-100 text-purple-700",
      proposal: "bg-indigo-100 text-indigo-700",
      negotiation: "bg-amber-100 text-amber-700",
      won: "bg-green-100 text-green-700",
      lost: "bg-red-100 text-red-700",
    };
    return colors[stage] || "bg-slate-100 text-slate-700";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // AI-generated insights (mock for now)
  const aiInsights = {
    nextAction: "Schedule follow-up call this week",
    confidence: 87,
    risk: lead.score < 50 ? "high" : lead.score < 70 ? "medium" : "low",
    recommendation: lead.score >= 70
      ? "High-value lead. Prioritize immediate follow-up."
      : lead.score >= 50
        ? "Warm lead. Send personalized email with case study."
        : "Cold lead. Add to nurture campaign.",
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4 pb-6 border-b">
        <Avatar className="h-12 w-12 border-2 border-slate-200">
          <AvatarFallback className="text-sm font-semibold bg-indigo-100 text-indigo-700">
            {getInitials(lead.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h2 className="text-base font-semibold text-slate-900">{lead.name}</h2>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" aria-label="Edit lead">
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" aria-label="More options">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => {
                      if (onDelete) {
                        onDelete(lead.id);
                      }
                    }}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Delete Lead
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <p className="text-xs text-slate-600 mb-2">{lead.title}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={`text-[10px] px-2 py-0.5 capitalize ${getStageColor(lead.stage)}`}
            >
              {lead.stage}
            </Badge>
            <Badge
              className={`text-[10px] px-2 py-0.5 border ${getScoreColor(lead.score)}`}
            >
              <Sparkles className="h-2.5 w-2.5 mr-1" />
              Score: {lead.score}
            </Badge>
          </div>
        </div>
      </div>

      {/* AI Insight Card */}
      <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
        <div className="flex items-start gap-2">
          <div className="h-6 w-6 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-indigo-700 uppercase tracking-wide mb-1">
              AI Recommendation
            </p>
            <p className="text-xs text-slate-900 mb-1.5">{aiInsights.recommendation}</p>
            <p className="text-[10px] text-slate-600">
              Next action: {aiInsights.nextAction} · Confidence: {aiInsights.confidence}%
            </p>
          </div>
        </div>
      </Card>

      {/* Contact Info */}
      <Card className="p-4">
        <h3 className="text-xs font-semibold text-slate-900 mb-3">Contact Information</h3>
        <div className="space-y-2">
          {lead.email && (
            <div className="flex items-center gap-2 text-xs">
              <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <a
                href={`mailto:${lead.email}`}
                className="text-slate-700 hover:text-indigo-600 truncate"
              >
                {lead.email}
              </a>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-2 text-xs">
              <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <a
                href={`tel:${lead.phone}`}
                className="text-slate-700 hover:text-indigo-600"
              >
                {lead.phone}
              </a>
            </div>
          )}
          {lead.company && (
            <div className="flex items-center gap-2 text-xs">
              <Building2 className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <span className="text-slate-700">{lead.company}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Details */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Estimated Value</p>
          <p className="text-sm font-semibold text-slate-900">
            {lead.estimatedValue > 0 ? formatCurrency(lead.estimatedValue) : "—"}
          </p>
        </Card>
        <Card className="p-3 border-slate-200">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Interactions</p>
          <p className="text-sm font-semibold text-slate-900">{lead.interactionCount}</p>
        </Card>
        <Card className="p-3 border-slate-200">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Last Contact</p>
          <p className="text-sm font-semibold text-slate-900">{formatDate(lead.lastContactedAt)}</p>
        </Card>
        <Card className="p-3 border-slate-200">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Next Follow-up</p>
          <p className="text-sm font-semibold text-slate-900">{formatDate(lead.nextFollowUpAt)}</p>
        </Card>
      </div>

      {/* Source & Tags */}
      {(lead.source || (lead.tags && lead.tags.length > 0)) && (
        <Card className="p-4">
          <h3 className="text-xs font-semibold text-slate-900 mb-3">Details</h3>
          <div className="space-y-2">
            {lead.source && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Source:</span>
                <span className="text-slate-700">{lead.source}</span>
              </div>
            )}
            {lead.tags && lead.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="h-3 w-3 text-slate-400" />
                {lead.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 h-4 bg-slate-50 border-slate-200 text-slate-700"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Notes */}
      {lead.notes && (
        <Card className="p-4">
          <h3 className="text-xs font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            Notes
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{lead.notes}</p>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex gap-3 pt-4">
        <Button className="flex-1">
          <Mail className="h-3 w-3 mr-1.5" />
          Send Email
        </Button>
        <Button variant="outline" className="flex-1">
          <Phone className="h-4 w-4 mr-2" />
          Call
        </Button>
        <Button variant="outline" className="flex-1">
          <Calendar className="h-4 w-4 mr-2" />
          Schedule
        </Button>
      </div>
    </div>
  );
}

