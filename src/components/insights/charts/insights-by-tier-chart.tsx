'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { INSIGHT_TYPE_COLORS } from '@/components/ui/chart';
import { cn } from '@/lib/utils';

interface InsightsByTierChartProps {
  data: {
    opportunity: number;
    warning: number;
    suggestion: number;
    achievement: number;
  };
  onSegmentClick?: (type: string) => void;
  activeSegment?: string | null;
  loading?: boolean;
}

const TIER_CONFIG = {
  opportunity: { label: 'Opportunities', color: INSIGHT_TYPE_COLORS.opportunity },
  warning: { label: 'Warnings', color: INSIGHT_TYPE_COLORS.warning },
  suggestion: { label: 'Suggestions', color: INSIGHT_TYPE_COLORS.suggestion },
  achievement: { label: 'Achievements', color: INSIGHT_TYPE_COLORS.achievement },
};

export function InsightsByTierChart({
  data,
  onSegmentClick,
  activeSegment,
  loading = false,
}: InsightsByTierChartProps) {
  const chartData = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: TIER_CONFIG[key as keyof typeof TIER_CONFIG]?.label || key,
      value,
      type: key,
      color: TIER_CONFIG[key as keyof typeof TIER_CONFIG]?.color || 'var(--chart-1)',
    }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (loading) {
    return (
      <div className="h-[250px] flex items-center justify-center">
        <div className="h-32 w-32 rounded-full border-4 border-muted animate-pulse" />
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
        No insights to display
      </div>
    );
  }

  return (
    <div className="h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            onClick={(_, index) => onSegmentClick?.(chartData[index].type)}
            style={{ cursor: onSegmentClick ? 'pointer' : 'default' }}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                opacity={activeSegment && activeSegment !== entry.type ? 0.3 : 1}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const item = payload[0].payload;
              return (
                <div className="bg-popover border rounded-lg shadow-lg p-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {item.value} insights ({Math.round((item.value / total) * 100)}%)
                  </div>
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center mt-2">
        {chartData.map((item) => (
          <button
            key={item.type}
            onClick={() => onSegmentClick?.(item.type)}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all',
              onSegmentClick && 'cursor-pointer hover:bg-muted',
              activeSegment === item.type && 'bg-muted ring-1 ring-primary',
              activeSegment && activeSegment !== item.type && 'opacity-50'
            )}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground">{item.name}</span>
            <span className="font-medium">{item.value}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
