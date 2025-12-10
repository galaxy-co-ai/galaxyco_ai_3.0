"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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
import type { RevenueTrendPoint } from "@/types/finance";

/**
 * Chart configuration for revenue sources
 */
const chartConfig = {
  total: {
    label: "Total Revenue",
    color: "hsl(var(--chart-1))",
  },
  quickbooks: {
    label: "QuickBooks",
    color: "hsl(142.1 76.2% 36.3%)", // emerald-600
  },
  stripe: {
    label: "Stripe",
    color: "hsl(243 75% 59%)", // indigo-500
  },
  shopify: {
    label: "Shopify",
    color: "hsl(82 85% 40%)", // lime-600
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

interface RevenueChartProps {
  data?: RevenueTrendPoint[];
  isLoading?: boolean;
  showSources?: boolean;
}

/**
 * Line chart showing revenue trends over time.
 * Can display total revenue or broken down by source.
 */
export function RevenueChart({
  data,
  isLoading,
  showSources = false,
}: RevenueChartProps) {
  if (isLoading) {
    return <RevenueChartSkeleton />;
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-6 rounded-2xl shadow-sm border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Revenue Trend</h3>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          No revenue data available for this period.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 rounded-2xl shadow-sm border" role="img" aria-label="Revenue trend chart">
      <h3 className="text-lg font-semibold text-foreground mb-4">Revenue Trend</h3>
      <ChartContainer config={chartConfig} className="h-64 w-full">
        <LineChart
          data={data}
          margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
        >
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
          {showSources ? (
            <>
              <Line
                type="monotone"
                dataKey="quickbooks"
                stroke="var(--color-quickbooks)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="stripe"
                stroke="var(--color-stripe)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="shopify"
                stroke="var(--color-shopify)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </>
          ) : (
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-total)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          )}
        </LineChart>
      </ChartContainer>
    </Card>
  );
}

/**
 * Loading skeleton for RevenueChart
 */
export function RevenueChartSkeleton() {
  return (
    <Card className="p-6 rounded-2xl shadow-sm border">
      <Skeleton className="h-6 w-32 mb-4" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </Card>
  );
}











































