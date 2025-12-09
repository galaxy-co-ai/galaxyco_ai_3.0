"use client";

import * as React from "react";
import { ExternalLink, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { LinkPreviewData } from "@/types/neptune";

interface LinkPreviewCardProps {
  url: string;
  className?: string;
}

export function LinkPreviewCard({ url, className }: LinkPreviewCardProps) {
  const [preview, setPreview] = React.useState<LinkPreviewData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    const fetchPreview = async () => {
      try {
        setIsLoading(true);
        setError(false);

        const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
        
        if (cancelled) return;

        if (!response.ok) {
          throw new Error("Failed to fetch preview");
        }

        const data = await response.json();
        if (data.success && data.data) {
          setPreview(data.data);
        } else {
          throw new Error("No preview data");
        }
      } catch (err) {
        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchPreview();

    return () => {
      cancelled = true;
    };
  }, [url]);

  // Fallback: simple link pill if fetch fails
  if (error || (!isLoading && !preview)) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace("www.", "");
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex items-center gap-2 px-3 py-2 rounded-lg",
            "bg-muted hover:bg-muted/80 transition-colors",
            "text-sm text-foreground",
            className
          )}
        >
          <Globe className="h-4 w-4 shrink-0" />
          <span className="truncate max-w-[200px]">{domain}</span>
          <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
        </a>
      );
    } catch {
      return null;
    }
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-muted/50 overflow-hidden",
          "flex gap-3 p-3",
          className
        )}
      >
        <Skeleton className="h-20 w-20 shrink-0 rounded" />
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    );
  }

  if (!preview) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "block rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors",
        "overflow-hidden group",
        className
      )}
    >
      <div className="flex gap-3 p-3">
        {/* Thumbnail */}
        {preview.image ? (
          <img
            src={preview.image}
            alt={preview.title || "Preview"}
            className="h-20 w-20 shrink-0 rounded object-cover"
            onError={(e) => {
              // Hide image on error
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="h-20 w-20 shrink-0 rounded bg-muted flex items-center justify-center">
            {preview.favicon ? (
              <img
                src={preview.favicon}
                alt=""
                className="h-8 w-8"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <Globe className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {preview.title && (
            <h4 className="text-sm font-semibold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
              {preview.title}
            </h4>
          )}
          {preview.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
              {preview.description}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {preview.favicon && (
              <img
                src={preview.favicon}
                alt=""
                className="h-3 w-3"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
            <span className="truncate">{preview.domain}</span>
            <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
          </div>
        </div>
      </div>
    </a>
  );
}

