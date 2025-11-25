"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Interaction } from "@/types/crm";
import { Mail, Phone, Video, CheckCircle2, Circle, FileText, Sparkles } from "lucide-react";

interface InteractionTimelineProps {
  interactions: Interaction[];
  actionState: Record<string, boolean[]>;
  onToggleAction: (interactionId: string, index: number) => void;
}

const typeIconMap = {
  call: Phone,
  email: Mail,
  meeting: Video,
} as const;

export function InteractionTimeline({ interactions, actionState, onToggleAction }: InteractionTimelineProps) {
  return (
    <div className="relative pl-6">
      <div className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-border/40 to-transparent" />
      {interactions.map((interaction, idx) => {
        const Icon = typeIconMap[interaction.type];
        const currentActions = actionState[interaction.id] ?? interaction.actionItems.map((item) => item.completed);
        
        const typeColors = {
          call: { bg: 'bg-blue-50', icon: 'text-blue-500', circle: 'bg-blue-500' },
          email: { bg: 'bg-purple-50', icon: 'text-purple-500', circle: 'bg-purple-500' },
          meeting: { bg: 'bg-green-50', icon: 'text-green-500', circle: 'bg-green-500' },
        };
        const colors = typeColors[interaction.type] || typeColors.call;

        return (
          <div key={interaction.id} className="relative pl-6 pb-6 last:pb-2">
            <span className={`absolute left-[0.15rem] top-3 h-3 w-3 rounded-full border-2 border-white shadow-soft ring-2 ring-white ${colors.circle}/30 ${colors.circle}`} />
            <Card className={`p-4 rounded-2xl border-0 shadow-soft hover:shadow-soft-hover transition-all ${colors.bg}/30`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full ${colors.bg} flex items-center justify-center border border-white shadow-soft`}>
                    <Icon className={`h-5 w-5 ${colors.icon}`} />
                  </div>
                  <div>
                    <p className="capitalize leading-tight font-medium text-slate-900">{interaction.type}</p>
                    <p className="text-xs text-muted-foreground">{interaction.date}{interaction.duration ? ` • ${interaction.duration}` : ""}</p>
                  </div>
                </div>
                {interaction.sentiment && (
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      interaction.sentiment === "positive"
                        ? "bg-green-500/10 text-green-600 border-green-200"
                        : interaction.sentiment === "negative"
                          ? "bg-rose-500/10 text-rose-600 border-rose-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  >
                    {interaction.sentiment}
                  </Badge>
                )}
              </div>

              <div className="mt-3 rounded-xl bg-white/60 border border-white/50 p-3 text-sm text-slate-700 leading-relaxed">
                {interaction.summary}
              </div>

              {interaction.actionItems.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Action Items</div>
                  {interaction.actionItems.map((item, index) => {
                    const done = currentActions[index];
                    return (
                      <button
                        key={`${interaction.id}-${index}`}
                        className="flex items-start gap-2 text-left w-full group"
                        onClick={() => onToggleAction(interaction.id, index)}
                      >
                        {done ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground mt-0.5 group-hover:text-primary" />
                        )}
                        <span className={`text-sm ${done ? "line-through text-muted-foreground/70" : ""}`}>{item.text}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-3 flex items-center gap-3">
                <Button variant="ghost" size="sm" className="h-8 text-xs">
                  <FileText className="h-3.5 w-3.5 mr-1.5" />
                  View Transcript
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-xs">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Generate Recap
                </Button>
              </div>
            </Card>
          </div>
        );
      })}

      {interactions.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No interactions yet. Ask AI to log the latest touchpoint.
        </div>
      )}
    </div>
  );
}





