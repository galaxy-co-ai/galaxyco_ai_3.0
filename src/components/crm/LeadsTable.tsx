"use client";

import { Lead } from "./CRMDashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sparkles, Mail, Phone, UserPlus, Target, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadsTableProps {
  leads: Lead[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddNew?: () => void;
  onDelete?: (id: string) => void;
  formatDate: (date: Date | null) => string;
  formatCurrency: (cents: number) => string;
}

export default function LeadsTable({
  leads,
  selectedId,
  onSelect,
  onAddNew,
  onDelete,
  formatDate,
  formatCurrency,
}: LeadsTableProps) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return "bg-red-500/10 text-red-700 border-red-200";
    if (score >= 50) return "bg-amber-500/10 text-amber-700 border-amber-200";
    return "bg-slate-500/10 text-slate-700 border-slate-200";
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

  if (leads.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center px-6 py-8">
        <div className="max-w-xs">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
            <Target className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Start building your pipeline</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your first lead to begin tracking prospects and growing your business.
          </p>
          <div className="flex flex-col gap-2">
            <Button 
              size="sm" 
              className="gap-2 bg-blue-600 hover:bg-blue-700"
              onClick={onAddNew}
            >
              <UserPlus className="h-4 w-4" />
              Add Your First Lead
            </Button>
            <p className="text-xs text-muted-foreground">
              Or ask Neptune: &quot;Create a lead for...&quot;
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {leads.map((lead) => (
        <button
          key={lead.id}
          onClick={() => onSelect(lead.id)}
          className={cn(
            "w-full p-4 text-left hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            selectedId === lead.id && "bg-muted"
          )}
          aria-label={`Select lead ${lead.name}`}
        >
          <div className="flex items-start gap-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-sm font-medium">
                {getInitials(lead.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{lead.name}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {lead.title} {lead.company && `· ${lead.company}`}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn("text-xs border", getScoreColor(lead.score))}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {lead.score}
                </Badge>
              </div>

              <div className="flex items-center gap-4 mt-2">
                {lead.email && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate max-w-[140px]">{lead.email}</span>
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{lead.phone}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 mt-3 relative">
                <Badge
                  variant="outline"
                  className={cn("text-xs capitalize", getStageColor(lead.stage))}
                >
                  {lead.stage}
                </Badge>
                {lead.estimatedValue > 0 && (
                  <span className="text-xs font-medium text-muted-foreground">
                    {formatCurrency(lead.estimatedValue)}
                  </span>
                )}
                {onDelete && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onDelete(lead.id);
                    }}
                    className="ml-auto p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        e.preventDefault();
                        onDelete(lead.id);
                      }
                    }}
                    aria-label={`Delete ${lead.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
