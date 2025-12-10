"use client";

import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolCardProps {
  /** Lucide icon component to display */
  icon: LucideIcon;
  /** Tool title */
  title: string;
  /** Brief description of the tool */
  description: string;
  /** Optional badge count (e.g., items in queue) */
  badgeCount?: number;
  /** Badge color theme */
  badgeColor?: "blue" | "green" | "amber" | "purple" | "red" | "indigo";
  /** Destination link */
  href: string;
  /** Optional gradient colors for the icon background */
  iconGradient?: string;
}

const badgeColorMap = {
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  green: "bg-emerald-100 text-emerald-700 border-emerald-200",
  amber: "bg-amber-100 text-amber-700 border-amber-200",
  purple: "bg-purple-100 text-purple-700 border-purple-200",
  red: "bg-red-100 text-red-700 border-red-200",
  indigo: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

const iconGradientMap: Record<string, string> = {
  sparkles: "from-amber-400 to-orange-500",
  listOrdered: "from-indigo-400 to-purple-500",
  bookOpen: "from-emerald-400 to-teal-500",
  route: "from-rose-400 to-pink-500",
  barChart: "from-blue-400 to-cyan-500",
  fileText: "from-slate-400 to-gray-500",
};

/**
 * ToolCard Component
 *
 * A reusable card for Content Cockpit tools with Neptune-style hover effects.
 * Features an icon with gradient background, title, description, and optional
 * badge count for queue items.
 *
 * @example
 * ```tsx
 * <ToolCard
 *   icon={Sparkles}
 *   title="Article Studio"
 *   description="Create AI-assisted articles"
 *   href="/admin/content/article-studio"
 *   iconGradient="sparkles"
 * />
 * ```
 */
export function ToolCard({
  icon: Icon,
  title,
  description,
  badgeCount,
  badgeColor = "blue",
  href,
  iconGradient = "sparkles",
}: ToolCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col rounded-xl bg-white p-5",
        "shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-200",
        "hover:-translate-y-1 hover:shadow-lg active:scale-[0.99] active:shadow-sm",
        "transition-all duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
      )}
      aria-label={`${title}: ${description}${badgeCount ? `. ${badgeCount} items in queue.` : ""}`}
    >
      {/* Icon with gradient background */}
      <div
        className={cn(
          "mb-4 flex h-12 w-12 items-center justify-center rounded-xl",
          "bg-gradient-to-br shadow-sm",
          iconGradientMap[iconGradient] || iconGradientMap.sparkles
        )}
      >
        <Icon className="h-6 w-6 text-white" aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
            {title}
          </h3>
          {/* Badge count */}
          {typeof badgeCount === "number" && badgeCount > 0 && (
            <span
              className={cn(
                "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium border",
                badgeColorMap[badgeColor]
              )}
              aria-label={`${badgeCount} items`}
            >
              {badgeCount > 99 ? "99+" : badgeCount}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{description}</p>
      </div>

      {/* Hover arrow indicator */}
      <div
        className={cn(
          "absolute bottom-4 right-4 h-6 w-6 rounded-full",
          "flex items-center justify-center",
          "bg-gray-100 text-gray-400",
          "opacity-0 transform translate-x-1",
          "group-hover:opacity-100 group-hover:translate-x-0",
          "transition-all duration-200"
        )}
        aria-hidden="true"
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </Link>
  );
}

