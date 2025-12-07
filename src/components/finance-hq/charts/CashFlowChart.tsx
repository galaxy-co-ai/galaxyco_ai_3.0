"use client";

import * as React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { CashFlowTrendPoint } from "@/types/finance";

/**
 * Chart configuration for cash flow
 */
const chartConfig = {
  inflow: {
    label: "Cash In",
    color: "hsl(142.1 76.2% 36.3%)", // emerald-600
  },
  outflow: {
    label: "Cash Out",
    color: "hsl(0 84.2% 60.2%)", // red-500
  },
  net: {
    label: "Net",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

/**
 * Format date for chart axis
 */
function formatAxisDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Format currency for tooltip
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface CashFlowChartProps {
  data?: CashFlowTrendPoint[];
  isLoading?: boolean;
  showNet?: boolean;
}

/**
 * Area chart showing cash flow (inflow/outflow) over time.
 * Can optionally show net cash flow line.
 */
export function CashFlowChart({
  data,
  isLoading,
  showNet = true,
}: CashFlowChartProps) {
  if (isLoading) {
    return <CashFlowChartSkeleton />;
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-6 rounded-2xl shadow-sm border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Cash Flow</h3>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          No cash flow data available for this period.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 rounded-2xl shadow-sm border" role="img" aria-label="Cash flow chart">
      <h3 className="text-lg font-semibold text-foreground mb-4">Cash Flow</h3>
      <ChartContainer config={chartConfig} className="h-64 w-full">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="inflowGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-inflow)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-inflow)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="outflowGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-outflow)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-outflow)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            tickFormatter={formatAxisDate}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground"
          />
          <YAxis
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground"
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => (
                  <span className="font-mono">
                    {formatCurrency(value as number)}
                  </span>
                )}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="inflow"
            stroke="var(--color-inflow)"
            fill="url(#inflowGradient)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="outflow"
            stroke="var(--color-outflow)"
            fill="url(#outflowGradient)"
            strokeWidth={2}
          />
          {showNet && (
            <Area
              type="monotone"
              dataKey="net"
              stroke="var(--color-net)"
              fill="none"
              strokeWidth={2}
              strokeDasharray="4 4"
            />
          )}
        </AreaChart>
      </ChartContainer>
    </Card>
  );
}

/**
 * Loading skeleton for CashFlowChart
 */
export function CashFlowChartSkeleton() {
  return (
    <Card className="p-6 rounded-2xl shadow-sm border">
      <Skeleton className="h-6 w-28 mb-4" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </Card>
  );
}


























