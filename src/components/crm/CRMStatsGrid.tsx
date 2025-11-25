import type { ReactNode } from "react";
import { ArrowRight, Sparkles, Target, TrendingUp, Activity, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function CRMStatsGrid() {
  return (
    <div className="space-y-3">
      <Card className="relative overflow-hidden border-0 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-blue-600 text-white shadow-soft">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 blur-3xl translate-x-1/3 -translate-y-1/3" />

        <div className="relative flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-[180px]">
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-white/80">Total Pipeline Value</p>
              <Badge className="bg-white/15 text-white border-0 text-[10px] h-5 px-1.5">
                <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                +12.5%
              </Badge>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <h2 className="text-2xl font-bold tracking-tight">$1,245,000</h2>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-white/90">
              <Sparkles className="w-3 h-3 text-yellow-300" />
              <span>AI Forecast <strong>$1.4M</strong> by EOM</span>
            </div>
            <div className="mt-3 h-1 w-40 bg-white/15 rounded-full overflow-hidden">
              <div className="h-full w-[78%] rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.45)]" />
            </div>
          </div>

          <div className="hidden h-12 w-px bg-white/20 md:block" />

          <div className="flex flex-wrap items-center gap-4 md:flex-1 md:justify-center">
            <StatPill
              icon={<Target className="w-3.5 h-3.5" />}
              label="Active Deals"
              value="42"
              trend="+4 this week"
            />
            <StatPill
              icon={<Activity className="w-3.5 h-3.5" />}
              label="Win Rate"
              value="68%"
              trend="+2.4% vs avg"
            />
            <StatPill
              icon={<Sparkles className="w-3.5 h-3.5" />}
              label="AI Priority"
              value="3"
              trend="actions detected"
            />
          </div>
        </div>
      </Card>

      <Card className="rounded-2xl border-0 bg-white px-4 py-3 shadow-soft">
        <div className="flex flex-col gap-3 min-w-0 items-start md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-pink-500 text-white shadow-soft">
              <Zap className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-slate-900 leading-tight">
                3 High-Priority Actions Detected
              </h4>
              <p className="text-xs text-muted-foreground truncate">
                Sarah Chen viewed “Enterprise Pricing” 3× today. Re-engage now?
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="h-7 rounded-full bg-gradient-to-r from-orange-500 to-pink-600 px-3 text-xs text-white shadow-soft hover:shadow-soft-hover md:ml-auto"
          >
            View Actions
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

function StatPill({
  icon,
  label,
  value,
  trend,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <div className="flex min-w-[120px] flex-col gap-1 rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 text-[11px] text-white/70">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-semibold text-white">{value}</span>
        <span className="text-[11px] text-white/70">{trend}</span>
      </div>
    </div>
  );
}
