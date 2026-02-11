'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CATEGORY_COLORS } from '@/components/ui/chart';
import { cn } from '@/lib/utils';

interface InsightsBySurfaceChartProps {
  data: {
    sales: number;
    marketing: number;
    operations: number;
    finance: number;
    content: number;
  };
  onBarClick?: (category: string) => void;
  activeBar?: string | null;
  loading?: boolean;
}

const SURFACE_CONFIG = {
  sales: { label: 'Sales', color: CATEGORY_COLORS.sales },
  marketing: { label: 'Marketing', color: CATEGORY_COLORS.marketing },
  operations: { label: 'Operations', color: CATEGORY_COLORS.operations },
  finance: { label: 'Finance', color: CATEGORY_COLORS.finance },
  content: { label: 'Content', color: CATEGORY_COLORS.content },
};

export function InsightsBySurfaceChart({
  data,
  onBarClick,
  activeBar,
  loading = false,
}: InsightsBySurfaceChartProps) {
  const chartData = Object.entries(data)
    .map(([key, value]) => ({
      name: SURFACE_CONFIG[key as keyof typeof SURFACE_CONFIG]?.label || key,
      value,
      category: key,
      color: SURFACE_CONFIG[key as keyof typeof SURFACE_CONFIG]?.color || 'var(--chart-1)',
    }))
    .sort((a, b) => b.value - a.value);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (loading) {
    return (
      <div className="h-[250px] flex flex-col gap-3 justify-center px-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-16 h-4 bg-muted rounded animate-pulse" />
            <div
              className="h-6 bg-muted rounded animate-pulse"
              style={{ width: `${100 - i * 15}%` }}
            />
          </div>
        ))}
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
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
            width={60}
          />
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
                    {item.value} insights ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
                  </div>
                </div>
              );
            }}
            cursor={{ fill: 'var(--muted)', opacity: 0.3 }}
          />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
            onClick={(data) => onBarClick?.(data.category)}
            style={{ cursor: onBarClick ? 'pointer' : 'default' }}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                opacity={activeBar && activeBar !== entry.category ? 0.3 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
