"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DollarSign,
  Calendar,
  Building2,
  TrendingUp,
  Edit,
  MoreVertical,
  Trash2,
  User,
  Target,
  Clock,
  FileText,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Deal {
  id: string;
  name: string;
  company?: string;
  estimatedValue?: number;
  stage: string;
  score?: number;
  nextFollowUpAt?: Date | string | null;
  notes?: string;
  tags?: string[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

interface DealDetailViewProps {
  deal: Deal;
  onEdit?: (deal: Deal) => void;
  onDelete?: (dealId: string) => void;
}

const STAGE_COLORS: Record<string, string> = {
  new: "bg-slate-100 text-slate-700 border-slate-200",
  contacted: "bg-blue-100 text-blue-700 border-blue-200",
  qualified: "bg-cyan-100 text-cyan-700 border-cyan-200",
  proposal: "bg-purple-100 text-purple-700 border-purple-200",
  negotiation: "bg-amber-100 text-amber-700 border-amber-200",
  won: "bg-green-100 text-green-700 border-green-200",
  lost: "bg-red-100 text-red-700 border-red-200",
};

const STAGE_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

export default function DealDetailView({ deal, onEdit, onDelete }: DealDetailViewProps) {
  const formatCurrency = (value?: number) => {
    if (!value) return "$0";
    // Value is in cents, convert to dollars
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value / 100);
  };

  const formatDate = (date?: Date | string | null) => {
    if (!date) return "Not set";
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d);
  };

  const getInitials = (name: string) => {
    const words = name.trim().split(" ");
    if (words.length >= 2) {
      return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const stageColor = STAGE_COLORS[deal.stage] || STAGE_COLORS.new;
  const stageLabel = STAGE_LABELS[deal.stage] || deal.stage;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4 pb-6 border-b">
        <Avatar className="h-12 w-12 border-2 border-slate-200">
          <AvatarFallback className="text-sm font-semibold bg-purple-100 text-purple-700">
            {getInitials(deal.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h2 className="text-base font-semibold text-slate-900">{deal.name}</h2>
            <div className="flex items-center gap-1.5">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  aria-label="Edit deal"
                  onClick={() => onEdit(deal)}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              )}
              {onDelete && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" aria-label="More options">
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onDelete(deal.id)}
                      className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Delete Deal
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-2">
            <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${stageColor}`}>
              {stageLabel}
            </Badge>
            {deal.tags && deal.tags.length > 0 && deal.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-[10px] px-2 py-0.5 bg-slate-50 border-slate-200 text-slate-700"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-slate-500" />
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Deal Value</p>
          </div>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(deal.estimatedValue)}</p>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-slate-500" />
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Win Probability</p>
          </div>
          <p className="text-xl font-bold text-slate-900">{deal.score || 0}%</p>
        </Card>
      </div>

      {/* Deal Info */}
      <Card className="p-4">
        <h3 className="text-xs font-semibold text-slate-900 mb-3">Deal Information</h3>
        <div className="space-y-2">
          {deal.company && (
            <div className="flex items-center gap-2 text-xs">
              <Building2 className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <span className="text-slate-700">{deal.company}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs">
            <Calendar className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <span className="text-slate-500">Next Follow-Up:</span>
            <span className="text-slate-700">{formatDate(deal.nextFollowUpAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Clock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <span className="text-slate-500">Created:</span>
            <span className="text-slate-700">{formatDate(deal.createdAt)}</span>
          </div>
        </div>
      </Card>

      {/* Notes */}
      {deal.notes && (
        <Card className="p-4">
          <h3 className="text-xs font-semibold text-slate-900 mb-3 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Notes
          </h3>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{deal.notes}</p>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex gap-3 pt-4">
        <Button className="flex-1" onClick={() => onEdit?.(deal)}>
          <Edit className="h-3.5 w-3.5 mr-1.5" />
          Edit Deal
        </Button>
        <Button variant="outline" className="flex-1">
          <TrendingUp className="h-4 w-4 mr-2" />
          View Activity
        </Button>
      </div>
    </div>
  );
}
