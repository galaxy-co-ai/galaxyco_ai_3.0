'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ConfidenceDistributionChartProps {
  data: {
    bucket: string;
    range: string;
    count: number;
  }[];
  onBucketClick?: (bucket: string) => void;
  activeBucket?: string | null;
  loading?: boolean;
}

const BUCKET_COLORS = {
  '0-50': 'var(--chart-3)',    // Orange - low confidence
  '50-70': 'var(--chart-5)',   // Violet - medium-low
  '70-85': 'var(--chart-2)',   // Blue - medium-high
  '85-100': 'var(--chart-4)',  // Teal - high confidence
};

export function ConfidenceDistributionChart({
  data,
  onBucketClick,
  activeBucket,
  loading = false,
}: ConfidenceDistributionChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    color: BUCKET_COLORS[item.bucket as keyof typeof BUCKET_COLORS] || 'var(--chart-1)',
  }));

  const total = chartData.reduce((sum, item) => sum + item.count, 0);

  if (loading) {
    return (
      <div className="h-[250px] flex items-end gap-4 justify-center px-8 pb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 flex-1">
            <div
              className="w-full bg-muted rounded-t animate-pulse"
              style={{ height: `${60 + Math.random() * 100}px` }}
            />
            <div className="h-3 w-12 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
        No data available
      </div>
    );
  }

  return (
    <div className="h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
        >
          <XAxis
            dataKey="range"
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
                    <span className="font-medium">Confidence {item.range}</span>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {item.count} insights ({total > 0 ? Math.round((item.count / total) * 100) : 0}%)
                  </div>
                </div>
              );
            }}
            cursor={{ fill: 'var(--muted)', opacity: 0.3 }}
          />
          <Bar
            dataKey="count"
            radius={[4, 4, 0, 0]}
            onClick={(data) => onBucketClick?.((data as unknown as { bucket: string }).bucket)}
            style={{ cursor: onBucketClick ? 'pointer' : 'default' }}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                opacity={activeBucket && activeBucket !== entry.bucket ? 0.3 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
