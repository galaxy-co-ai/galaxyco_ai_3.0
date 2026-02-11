'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { INSIGHT_TYPE_COLORS } from '@/components/ui/chart';

interface TrendDataPoint {
  week: string;
  date: string;
  opportunity: number;
  warning: number;
  suggestion: number;
  achievement: number;
  total: number;
}

interface InsightsTrendChartProps {
  data: TrendDataPoint[];
  onPointClick?: (week: string) => void;
  activeWeek?: string | null;
  loading?: boolean;
  stacked?: boolean;
}

const TYPE_CONFIG = {
  opportunity: { label: 'Opportunities', color: INSIGHT_TYPE_COLORS.opportunity },
  warning: { label: 'Warnings', color: INSIGHT_TYPE_COLORS.warning },
  suggestion: { label: 'Suggestions', color: INSIGHT_TYPE_COLORS.suggestion },
  achievement: { label: 'Achievements', color: INSIGHT_TYPE_COLORS.achievement },
};

export function InsightsTrendChart({
  data,
  onPointClick,
  activeWeek,
  loading = false,
  stacked = true,
}: InsightsTrendChartProps) {
  if (loading) {
    return (
      <div className="h-[250px] flex items-center justify-center">
        <div className="w-full h-32 bg-muted/30 rounded animate-pulse mx-8" />
      </div>
    );
  }

  const hasData = data.some((d) => d.total > 0);

  if (!hasData) {
    return (
      <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
        No trend data available
      </div>
    );
  }

  return (
    <div className="h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
          onClick={(e) => {
            if (e?.activeLabel) {
              onPointClick?.(e.activeLabel);
            }
          }}
          style={{ cursor: onPointClick ? 'pointer' : 'default' }}
        >
          <defs>
            {Object.entries(TYPE_CONFIG).map(([key, config]) => (
              <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={config.color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={config.color} stopOpacity={0.05} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="week"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            width={30}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const dataPoint = payload[0]?.payload as TrendDataPoint;
              return (
                <div className="bg-popover border rounded-lg shadow-lg p-3 min-w-[160px]">
                  <p className="font-medium text-sm mb-2">{label}</p>
                  <div className="space-y-1.5">
                    {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                      <div key={key} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: config.color }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {config.label}
                          </span>
                        </div>
                        <span className="text-xs font-medium">
                          {dataPoint[key as keyof TrendDataPoint] || 0}
                        </span>
                      </div>
                    ))}
                    <div className="pt-1.5 border-t flex items-center justify-between">
                      <span className="text-xs font-medium">Total</span>
                      <span className="text-xs font-bold">{dataPoint.total}</span>
                    </div>
                  </div>
                </div>
              );
            }}
          />
          {stacked ? (
            <>
              <Area
                type="monotone"
                dataKey="achievement"
                stackId="1"
                stroke={TYPE_CONFIG.achievement.color}
                fill={`url(#gradient-achievement)`}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="suggestion"
                stackId="1"
                stroke={TYPE_CONFIG.suggestion.color}
                fill={`url(#gradient-suggestion)`}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="warning"
                stackId="1"
                stroke={TYPE_CONFIG.warning.color}
                fill={`url(#gradient-warning)`}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="opportunity"
                stackId="1"
                stroke={TYPE_CONFIG.opportunity.color}
                fill={`url(#gradient-opportunity)`}
                strokeWidth={2}
              />
            </>
          ) : (
            Object.entries(TYPE_CONFIG).map(([key, config]) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={config.color}
                fill={`url(#gradient-${key})`}
                strokeWidth={2}
              />
            ))
          )}
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center mt-2">
        {Object.entries(TYPE_CONFIG).map(([key, config]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: config.color }}
            />
            <span className="text-muted-foreground">{config.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
