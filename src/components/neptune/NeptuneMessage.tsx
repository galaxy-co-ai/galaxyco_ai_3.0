"use client";

import * as React from "react";
import { MarkdownContent } from "./MarkdownContent";
import { LinkPreviewCard } from "./LinkPreviewCard";
import { SearchResultsCard } from "./SearchResultsCard";
import { cn } from "@/lib/utils";
import type { SearchResultDisplay } from "@/types/neptune";

interface NeptuneMessageProps {
  content: string;
  isStreaming?: boolean;
  metadata?: {
    functionCalls?: Array<{
      name: string;
      result?: {
        success?: boolean;
        data?: unknown;
      };
    }>;
  };
  className?: string;
}

// Extract URLs from markdown content
function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s\)]+)/gi;
  const matches = text.match(urlRegex);
  return matches ? [...new Set(matches)] : [];
}

export function NeptuneMessage({
  content,
  isStreaming = false,
  metadata,
  className,
}: NeptuneMessageProps) {
  // Extract URLs from content
  const urls = React.useMemo(() => extractUrls(content), [content]);

  // Check if search_web was used
  const searchWebCall = React.useMemo(() => {
    if (!metadata?.functionCalls) return null;

    const call = metadata.functionCalls.find((fc) => fc.name === "search_web");
    if (!call?.result?.success || !call.result.data) return null;

    const data = call.result.data as {
      query?: string;
      results?: Array<{
        title: string;
        link: string;
        snippet: string;
        displayLink?: string;
      }>;
      provider?: "perplexity" | "google";
    };

    if (!data.results || data.results.length === 0) return null;

    return {
      query: data.query,
      results: data.results.map(
        (r): SearchResultDisplay => ({
          title: r.title,
          link: r.link,
          snippet: r.snippet,
          displayLink: r.displayLink || r.link,
        })
      ),
      provider: data.provider || "google",
    };
  }, [metadata]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Main markdown content */}
      <MarkdownContent content={content} />

      {/* Streaming indicator */}
      {isStreaming && (
        <span className="inline-flex items-center gap-1 ml-1">
          <span
            className="h-1.5 w-1.5 rounded-full bg-current animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="h-1.5 w-1.5 rounded-full bg-current animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="h-1.5 w-1.5 rounded-full bg-current animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </span>
      )}

      {/* Search Results Card */}
      {searchWebCall && (
        <SearchResultsCard
          results={searchWebCall.results}
          provider={searchWebCall.provider}
          query={searchWebCall.query}
        />
      )}

      {/* Link Preview Cards */}
      {urls.length > 0 && (
        <div className="space-y-2">
          {urls.map((url, index) => (
            <LinkPreviewCard key={`${url}-${index}`} url={url} />
          ))}
        </div>
      )}
    </div>
  );
}

