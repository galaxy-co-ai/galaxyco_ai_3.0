"use client";

import { cn } from "@/lib/utils";
import {
  Target,
  TrendingUp,
  Heart,
  Sun,
  Users,
  MessageSquare,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface PriorityScoreBreakdownData {
  contentGap?: number;
  trendingScore?: number;
  engagementPotential?: number;
  seasonality?: number;
  competitorCoverage?: number;
  userSentiment?: number;
  calculatedAt?: string;
  reasoning?: {
    contentGap?: string;
    trendingScore?: string;
    engagementPotential?: string;
    seasonality?: string;
    competitorCoverage?: string;
    userSentiment?: string;
  };
}

interface PriorityScoreBreakdownProps {
  breakdown: PriorityScoreBreakdownData;
  showReasoning?: boolean;
}

interface FactorConfig {
  key: keyof Omit<PriorityScoreBreakdownData, "calculatedAt" | "reasoning">;
  label: string;
  maxScore: number;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
}

const factorConfigs: FactorConfig[] = [
  {
    key: "contentGap",
    label: "Content Gap",
    maxScore: 20,
    icon: Target,
    colorClass: "text-indigo-600",
    bgClass: "bg-indigo-500",
  },
  {
    key: "trendingScore",
    label: "Trending",
    maxScore: 20,
    icon: TrendingUp,
    colorClass: "text-emerald-600",
    bgClass: "bg-emerald-500",
  },
  {
    key: "engagementPotential",
    label: "Engagement",
    maxScore: 20,
    icon: Heart,
    colorClass: "text-pink-600",
    bgClass: "bg-pink-500",
  },
  {
    key: "seasonality",
    label: "Seasonality",
    maxScore: 15,
    icon: Sun,
    colorClass: "text-amber-600",
    bgClass: "bg-amber-500",
  },
  {
    key: "competitorCoverage",
    label: "Competitor",
    maxScore: 15,
    icon: Users,
    colorClass: "text-purple-600",
    bgClass: "bg-purple-500",
  },
  {
    key: "userSentiment",
    label: "Sentiment",
    maxScore: 10,
    icon: MessageSquare,
    colorClass: "text-blue-600",
    bgClass: "bg-blue-500",
  },
];

function ScoreBar({
  score,
  maxScore,
  colorClass,
  bgClass,
}: {
  score: number;
  maxScore: number;
  colorClass: string;
  bgClass: string;
}) {
  const percentage = Math.min(100, Math.max(0, (score / maxScore) * 100));

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-300", bgClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={cn("text-xs font-medium w-12 text-right", colorClass)}>
        {score}/{maxScore}
      </span>
    </div>
  );
}

export function PriorityScoreBreakdown({
  breakdown,
  showReasoning = true,
}: PriorityScoreBreakdownProps) {
  const totalScore =
    (breakdown.contentGap || 0) +
    (breakdown.trendingScore || 0) +
    (breakdown.engagementPotential || 0) +
    (breakdown.seasonality || 0) +
    (breakdown.competitorCoverage || 0) +
    (breakdown.userSentiment || 0);

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-3" role="region" aria-label="Priority score breakdown">
      {/* Total Score Summary */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <span className="text-sm font-medium text-gray-700">Total Score</span>
        <span className="text-lg font-bold text-gray-900">{totalScore}/100</span>
      </div>

      {/* Individual Factors */}
      <div className="space-y-3">
        {factorConfigs.map((factor) => {
          const score = breakdown[factor.key] ?? 0;
          const reasoning = breakdown.reasoning?.[factor.key];
          const Icon = factor.icon;

          return (
            <div key={factor.key} className="space-y-1">
              <div className="flex items-center gap-2">
                <Icon
                  className={cn("h-4 w-4", factor.colorClass)}
                  aria-hidden="true"
                />
                <span className="text-sm text-gray-700 flex-1">{factor.label}</span>
              </div>
              <ScoreBar
                score={score}
                maxScore={factor.maxScore}
                colorClass={factor.colorClass}
                bgClass={factor.bgClass}
              />
              {showReasoning && reasoning && (
                <p className="text-xs text-gray-500 pl-6 leading-relaxed">
                  {reasoning}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Calculated At */}
      {breakdown.calculatedAt && (
        <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
          Last calculated: {formatDate(breakdown.calculatedAt)}
        </p>
      )}
    </div>
  );
}

/**
 * Compact version for sidebar or summary views
 */
export function PriorityScoreCompact({
  breakdown,
}: {
  breakdown: PriorityScoreBreakdownData;
}) {
  const totalScore =
    (breakdown.contentGap || 0) +
    (breakdown.trendingScore || 0) +
    (breakdown.engagementPotential || 0) +
    (breakdown.seasonality || 0) +
    (breakdown.competitorCoverage || 0) +
    (breakdown.userSentiment || 0);

  return (
    <div className="flex flex-wrap gap-1.5" role="list" aria-label="Score factors">
      {factorConfigs.map((factor) => {
        const score = breakdown[factor.key] ?? 0;
        const percentage = Math.round((score / factor.maxScore) * 100);
        const Icon = factor.icon;

        return (
          <div
            key={factor.key}
            className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs",
              percentage >= 70 ? "bg-emerald-50" : percentage >= 40 ? "bg-amber-50" : "bg-gray-50"
            )}
            title={`${factor.label}: ${score}/${factor.maxScore}`}
            role="listitem"
          >
            <Icon className={cn("h-3 w-3", factor.colorClass)} aria-hidden="true" />
            <span className="text-gray-600">{score}</span>
          </div>
        );
      })}
    </div>
  );
}

