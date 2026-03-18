'use client';

import dynamic from 'next/dynamic';
import type { VisualSpec } from '@/types/neptune-conversation';

// --- Recharts lazy-loaded (SSR off — happy-dom/jsdom safe) ---
const ResponsiveContainer = dynamic(
  () => import('recharts').then((m) => m.ResponsiveContainer),
  { ssr: false },
);
const LineChart = dynamic(() => import('recharts').then((m) => m.LineChart), { ssr: false });
const BarChart = dynamic(() => import('recharts').then((m) => m.BarChart), { ssr: false });
const Line = dynamic(() => import('recharts').then((m) => m.Line), { ssr: false });
const Bar = dynamic(() => import('recharts').then((m) => m.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((m) => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false });

// --- Data shapes ---

interface MetricData {
  value: number;
  label?: string;
  prefix?: string;
  suffix?: string;
}

interface TrendData extends MetricData {
  direction?: 'up' | 'down';
}

interface SeriesData {
  points: Array<{ label: string; value: number }>;
}

// --- Helpers ---

function formatNumber(value: number): string {
  return value.toLocaleString();
}

function isMetricData(d: unknown): d is MetricData {
  return typeof d === 'object' && d !== null && 'value' in d && typeof (d as MetricData).value === 'number';
}

function isSeriesData(d: unknown): d is SeriesData {
  return (
    typeof d === 'object' &&
    d !== null &&
    'points' in d &&
    Array.isArray((d as SeriesData).points)
  );
}

// --- Chart container shared wrapper ---

function ChartWrapper({
  children,
  chartType,
  title,
}: {
  children: React.ReactNode;
  chartType: string;
  title?: string;
}) {
  return (
    <div
      data-chart-type={chartType}
      className="rounded-lg border border-border/50 bg-card/50 p-3"
    >
      {title && <p className="mb-1 text-xs text-muted-foreground">{title}</p>}
      <div style={{ height: 120 }}>{children}</div>
    </div>
  );
}

// --- Metric ---

function MetricVisual({ spec }: { spec: VisualSpec }) {
  if (!isMetricData(spec.data)) return null;
  const { value, label, prefix = '', suffix = '' } = spec.data;

  return (
    <div data-chart-type="metric" className="flex flex-col gap-0.5">
      <span
        className="font-semibold text-2xl text-foreground"
        style={{ fontFamily: 'var(--font-space-grotesk)' }}
      >
        {prefix}
        {formatNumber(value)}
        {suffix}
      </span>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </div>
  );
}

// --- Trend ---

function TrendVisual({ spec }: { spec: VisualSpec }) {
  if (!isMetricData(spec.data)) return null;
  const { value, label, prefix = '', suffix = '', direction } = spec.data as TrendData;

  const arrowColor =
    direction === 'up'
      ? 'var(--status-success)'
      : direction === 'down'
        ? 'var(--status-error)'
        : undefined;

  return (
    <div data-chart-type="trend" className="flex flex-col gap-0.5">
      <span
        className="font-semibold text-2xl text-foreground"
        style={{ fontFamily: 'var(--font-space-grotesk)' }}
      >
        {direction && (
          <span style={{ color: arrowColor }}>{direction === 'up' ? '↑' : '↓'} </span>
        )}
        {prefix}
        {formatNumber(value)}
        {suffix}
      </span>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </div>
  );
}

// --- Line chart ---

function LineVisual({ spec }: { spec: VisualSpec }) {
  const points = isSeriesData(spec.data) ? spec.data.points : [];

  return (
    <ChartWrapper chartType="line" title={spec.title}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points}>
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
          <YAxis hide />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--accent-cyan)"
            fill="var(--accent-cyan-soft)"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

// --- Bar chart ---

function BarVisual({ spec }: { spec: VisualSpec }) {
  const points = isSeriesData(spec.data) ? spec.data.points : [];

  return (
    <ChartWrapper chartType="bar" title={spec.title}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points}>
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
          <YAxis hide />
          <Tooltip />
          <Bar dataKey="value" stroke="var(--accent-cyan)" fill="var(--accent-cyan-soft)" />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

// --- Comparison ---

function ComparisonVisual({ spec }: { spec: VisualSpec }) {
  const entries = Object.entries(spec.data as Record<string, number | string>);

  return (
    <div data-chart-type="comparison" className="flex flex-row flex-wrap gap-4">
      {entries.map(([key, val]) => (
        <div key={key} className="flex flex-col gap-0.5">
          <span
            className="font-semibold text-2xl text-foreground"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            {typeof val === 'number' ? formatNumber(val) : val}
          </span>
          <span className="text-xs text-muted-foreground">{key}</span>
        </div>
      ))}
    </div>
  );
}

// --- Public component ---

interface InlineVisualProps {
  spec: VisualSpec;
}

export function InlineVisual({ spec }: InlineVisualProps) {
  switch (spec.chartType) {
    case 'metric':
      return <MetricVisual spec={spec} />;
    case 'trend':
      return <TrendVisual spec={spec} />;
    case 'line':
      return <LineVisual spec={spec} />;
    case 'bar':
      return <BarVisual spec={spec} />;
    case 'comparison':
      return <ComparisonVisual spec={spec} />;
    default:
      return null;
  }
}
