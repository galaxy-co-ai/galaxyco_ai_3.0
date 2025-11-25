"use client";

import { Organization } from "./CRMDashboard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  Calendar,
  Building2,
  Globe,
  TrendingUp,
  Tag,
  Edit,
  MoreVertical,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface OrganizationDetailViewProps {
  organization: Organization;
  formatDate: (date: Date | null) => string;
  formatCurrency: (cents: number) => string;
}

export default function OrganizationDetailView({
  organization,
  formatDate,
  formatCurrency,
}: OrganizationDetailViewProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      lead: "bg-slate-100 text-slate-700",
      customer: "bg-green-100 text-green-700",
      partner: "bg-purple-100 text-purple-700",
      inactive: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-slate-100 text-slate-700";
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
    health: organization.status === "customer" ? "excellent" : organization.status === "lead" ? "good" : "fair",
    recommendation:
      organization.status === "customer"
        ? "Active customer. Consider upselling or expansion opportunities."
        : organization.status === "lead"
          ? "Warm lead. Schedule discovery call to understand needs."
          : "Inactive organization. Re-engage with value proposition.",
    nextAction: "Review engagement history and plan outreach",
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4 pb-6 border-b">
        <Avatar className="h-12 w-12 border-2 border-slate-200">
          <AvatarFallback className="text-sm font-semibold bg-blue-100 text-blue-700">
            {getInitials(organization.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h2 className="text-base font-semibold text-slate-900">{organization.name}</h2>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" aria-label="Edit organization">
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" aria-label="More options">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          {organization.company && (
            <p className="text-xs text-slate-600 mb-2">{organization.company}</p>
          )}
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-[10px] px-2 py-0.5 capitalize ${getStatusColor(organization.status)}`}
            >
              {organization.status}
            </Badge>
            {organization.industry && (
              <span className="text-[10px] text-slate-500">{organization.industry}</span>
            )}
          </div>
        </div>
      </div>

      {/* AI Insight Card */}
      <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
        <div className="flex items-start gap-2">
          <div className="h-6 w-6 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
            <TrendingUp className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide mb-1">
              AI Insight
            </p>
            <p className="text-xs text-slate-900 mb-1.5">{aiInsights.recommendation}</p>
            <p className="text-[10px] text-slate-600">Next: {aiInsights.nextAction}</p>
          </div>
        </div>
      </Card>

      {/* Contact Info */}
      <Card className="p-4">
        <h3 className="text-xs font-semibold text-slate-900 mb-3">Contact Information</h3>
        <div className="space-y-2">
          {organization.email && (
            <div className="flex items-center gap-2 text-xs">
              <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <a
                href={`mailto:${organization.email}`}
                className="text-slate-700 hover:text-indigo-600 truncate"
              >
                {organization.email}
              </a>
            </div>
          )}
          {organization.phone && (
            <div className="flex items-center gap-2 text-xs">
              <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <a
                href={`tel:${organization.phone}`}
                className="text-slate-700 hover:text-indigo-600"
              >
                {organization.phone}
              </a>
            </div>
          )}
          {organization.website && (
            <div className="flex items-center gap-2 text-xs">
              <Globe className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <a
                href={organization.website.startsWith("http") ? organization.website : `https://${organization.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-700 hover:text-indigo-600 truncate"
              >
                {organization.website}
              </a>
            </div>
          )}
        </div>
      </Card>

      {/* Details */}
      <div className="grid grid-cols-2 gap-4">
        {organization.revenue > 0 && (
          <Card className="p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Annual Revenue</p>
            <p className="text-sm font-semibold text-slate-900">{formatCurrency(organization.revenue)}</p>
          </Card>
        )}
        {organization.size && (
          <Card className="p-3 border-slate-200">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Company Size</p>
            <p className="text-sm font-semibold text-slate-900 capitalize">{organization.size}</p>
          </Card>
        )}
        {organization.industry && (
          <Card className="p-3 border-slate-200">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Industry</p>
            <p className="text-sm font-semibold text-slate-900">{organization.industry}</p>
          </Card>
        )}
        <Card className="p-3 border-slate-200">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Last Contact</p>
          <p className="text-sm font-semibold text-slate-900">{formatDate(organization.lastContactedAt)}</p>
        </Card>
      </div>

      {/* Tags */}
      {organization.tags.length > 0 && (
        <Card className="p-4">
          <h3 className="text-xs font-semibold text-slate-900 mb-3 flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5" />
            Tags
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {organization.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-[9px] px-1.5 py-0 h-4 bg-slate-50 border-slate-200 text-slate-700"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Notes */}
      {organization.notes && (
        <Card className="p-4">
          <h3 className="text-xs font-semibold text-slate-900 mb-2">Notes</h3>
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
            {organization.notes}
          </p>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex gap-3 pt-4">
        <Button className="flex-1">
          <Mail className="h-4 w-4 mr-2" />
          Contact
        </Button>
        <Button variant="outline" className="flex-1">
          <Users className="h-4 w-4 mr-2" />
          View Contacts
        </Button>
        <Button variant="outline" className="flex-1">
          <Calendar className="h-4 w-4 mr-2" />
          Schedule
        </Button>
      </div>
    </div>
  );
}

