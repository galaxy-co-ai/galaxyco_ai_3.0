"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Eye,
  Clock,
  MousePointerClick,
  TrendingUp,
  TrendingDown,
  Share2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NeptuneButton } from "@/components/ui/neptune-button";

interface ArticleMetrics {
  totalViews: number;
  uniqueVisitors: number;
  avgTimeOnPage: number;
  avgScrollDepth: number;
  bounceRate: number;
  socialShares: number;
  engagementScore: number;
}

interface ArticlePerformanceCardProps {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  featuredImage?: string | null;
  publishedAt: string | Date | null;
  readingTimeMinutes?: number | null;
  metrics: ArticleMetrics;
  previousMetrics?: Partial<ArticleMetrics>;
  className?: string;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

function formatDate(date: string | Date | null): string {
  if (!date) return "Not published";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getScoreColor(score: number): string {
  if (score >= 70) return "text-emerald-600 bg-emerald-100";
  if (score >= 40) return "text-amber-600 bg-amber-100";
  return "text-gray-600 bg-gray-100";
}

function MetricItem({
  icon,
  label,
  value,
  change,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400">{icon}</span>
      <div className="flex flex-col">
        <span className="text-xs text-gray-500">{label}</span>
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-gray-900">{value}</span>
          {change !== undefined && change !== 0 && (
            <span
              className={cn(
                "inline-flex items-center text-xs",
                change > 0 ? "text-emerald-600" : "text-red-600"
              )}
            >
              {change > 0 ? (
                <TrendingUp className="h-3 w-3" aria-hidden="true" />
              ) : (
                <TrendingDown className="h-3 w-3" aria-hidden="true" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ArticlePerformanceCard({
  id,
  title,
  slug,
  excerpt,
  featuredImage,
  publishedAt,
  readingTimeMinutes,
  metrics,
  previousMetrics,
  className,
}: ArticlePerformanceCardProps) {
  // Calculate changes if previous metrics provided
  const viewsChange = previousMetrics?.totalViews
    ? ((metrics.totalViews - previousMetrics.totalViews) /
        previousMetrics.totalViews) *
      100
    : undefined;

  return (
    <div
      className={cn(
        "group relative rounded-xl bg-white overflow-hidden",
        "shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-200",
        "hover:-translate-y-px hover:shadow-lg",
        "transition-all duration-200",
        className
      )}
      role="article"
      aria-label={`Performance card for ${title}`}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Featured Image */}
        {featuredImage && (
          <div className="relative w-full sm:w-48 h-32 sm:h-auto flex-shrink-0">
            <Image
              src={featuredImage}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 192px"
            />
            {/* Engagement Score Badge */}
            <div
              className={cn(
                "absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-bold",
                getScoreColor(metrics.engagementScore)
              )}
            >
              {metrics.engagementScore}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <Link
                href={`/admin/content/analytics/${id}`}
                className="font-semibold text-gray-900 line-clamp-1 hover:text-indigo-600 transition-colors"
              >
                {title}
              </Link>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <span>{formatDate(publishedAt)}</span>
                {readingTimeMinutes && (
                  <>
                    <span>•</span>
                    <span>{readingTimeMinutes} min read</span>
                  </>
                )}
              </div>
            </div>
            {!featuredImage && (
              <div
                className={cn(
                  "px-2 py-1 rounded-lg text-xs font-bold flex-shrink-0",
                  getScoreColor(metrics.engagementScore)
                )}
                title="Engagement Score"
              >
                {metrics.engagementScore}
              </div>
            )}
          </div>

          {excerpt && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{excerpt}</p>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricItem
              icon={<Eye className="h-4 w-4" />}
              label="Views"
              value={formatNumber(metrics.totalViews)}
              change={viewsChange}
            />
            <MetricItem
              icon={<Clock className="h-4 w-4" />}
              label="Avg. Time"
              value={formatTime(metrics.avgTimeOnPage)}
            />
            <MetricItem
              icon={<MousePointerClick className="h-4 w-4" />}
              label="Scroll Depth"
              value={`${metrics.avgScrollDepth}%`}
            />
            <MetricItem
              icon={<Share2 className="h-4 w-4" />}
              label="Shares"
              value={formatNumber(metrics.socialShares)}
            />
          </div>
        </div>

        {/* Actions - Desktop */}
        <div className="hidden sm:flex flex-col justify-center p-4 gap-2">
          <Link href={`/admin/content/analytics/${id}`}>
            <NeptuneButton size="sm" aria-label={`View analytics for ${title}`}>
              View Details
            </NeptuneButton>
          </Link>
          <Link href={`/blog/${slug}`} target="_blank" rel="noopener noreferrer">
            <NeptuneButton
              variant="ghost"
              size="sm"
              aria-label={`Open ${title} in new tab`}
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              View Post
            </NeptuneButton>
          </Link>
        </div>
      </div>

      {/* Mobile Actions */}
      <div className="sm:hidden flex items-center gap-2 px-4 pb-4">
        <Link href={`/admin/content/analytics/${id}`} className="flex-1">
          <NeptuneButton
            className="w-full"
            size="sm"
            aria-label={`View analytics for ${title}`}
          >
            View Details
          </NeptuneButton>
        </Link>
        <Link href={`/blog/${slug}`} target="_blank" rel="noopener noreferrer">
          <NeptuneButton
            variant="ghost"
            size="icon"
            aria-label={`Open ${title} in new tab`}
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </NeptuneButton>
        </Link>
      </div>
    </div>
  );
}

