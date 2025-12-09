import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { getCacheOrFetch } from "@/lib/cache";
import { logger } from "@/lib/logger";
import type { LinkPreviewData } from "@/types/neptune";

/**
 * GET /api/link-preview
 * Fetches Open Graph metadata for a URL
 * 
 * Security:
 * - Validates URL format
 * - Blocks private IPs (SSRF protection)
 * - Rate limited per user
 * - Cached for 24 hours
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Rate limit: 30 requests per minute per user
    const rateLimitResult = await rateLimit(
      `link-preview:${user.id}`,
      30,
      60
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a moment." },
        { status: 429 }
      );
    }

    // Get URL from query params
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    let urlObj: URL;
    try {
      urlObj = new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // SSRF Protection: Block private IPs and localhost
    const hostname = urlObj.hostname.toLowerCase();
    const privatePatterns = [
      /^localhost$/,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^::1$/,
      /^fc00:/,
      /^fe80:/,
    ];

    if (privatePatterns.some((pattern) => pattern.test(hostname))) {
      return NextResponse.json(
        { error: "Private IPs and localhost are not allowed" },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = `link-preview:${url}`;
    const cached = await getCacheOrFetch<LinkPreviewData>(
      cacheKey,
      async () => {
        // Fetch page HTML with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        try {
          const response = await fetch(url, {
            signal: controller.signal,
            headers: {
              "User-Agent":
                "Mozilla/5.0 (compatible; GalaxyCoBot/1.0; +https://galaxyco.ai)",
              Accept: "text/html,application/xhtml+xml",
            },
            redirect: "follow",
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const html = await response.text();

          // Parse Open Graph metadata
          const ogTitle =
            html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)?.[1] ||
            html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();

          const ogDescription =
            html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i)?.[1] ||
            html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1];

          const ogImage =
            html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1];

          // Extract favicon
          const faviconMatch =
            html.match(/<link\s+rel=["'](?:shortcut\s+)?icon["']\s+href=["']([^"']+)["']/i) ||
            html.match(/<link\s+rel=["']apple-touch-icon["']\s+href=["']([^"']+)["']/i);

          let favicon = faviconMatch?.[1];
          if (favicon && !favicon.startsWith("http")) {
            // Resolve relative favicon URL
            try {
              favicon = new URL(favicon, url).href;
            } catch {
              favicon = undefined;
            }
          }

          // Resolve relative image URL
          let imageUrl = ogImage;
          if (imageUrl && !imageUrl.startsWith("http")) {
            try {
              imageUrl = new URL(imageUrl, url).href;
            } catch {
              imageUrl = undefined;
            }
          }

          // Sanitize text content (basic XSS protection)
          const sanitize = (text?: string) => {
            if (!text) return undefined;
            return text
              .replace(/<[^>]*>/g, "")
              .replace(/&[^;]+;/g, "")
              .trim()
              .slice(0, 500);
          };

          const domain = urlObj.hostname.replace("www.", "");

          return {
            url,
            title: sanitize(ogTitle),
            description: sanitize(ogDescription),
            image: imageUrl,
            favicon,
            domain,
          };
        } catch (error) {
          clearTimeout(timeoutId);
          logger.warn("Link preview fetch failed", {
            url,
            error: error instanceof Error ? error.message : String(error),
          });
          throw error;
        }
      },
      {
        prefix: "link-preview",
        ttl: 86400, // 24 hours
      }
    );

    return NextResponse.json({
      success: true,
      data: cached,
    });
  } catch (error) {
    logger.error("Link preview API error", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch link preview",
      },
      { status: 500 }
    );
  }
}

