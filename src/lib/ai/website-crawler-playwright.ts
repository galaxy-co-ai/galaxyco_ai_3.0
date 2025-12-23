/**
 * Playwright Website Crawler
 * 
 * Headless browser crawler for JavaScript-heavy websites that require rendering.
 * Handles SPAs (React, Vue, Angular) and sites with complex client-side hydration.
 * 
 * Use this when:
 * - Static crawlers fail (Firecrawl, Jina)
 * - Site requires JavaScript execution
 * - Content is loaded dynamically
 */

import { chromium, type Browser, type Page } from 'playwright';
import { logger } from '@/lib/logger';

export interface PlaywrightCrawlOptions {
  waitForNetworkIdle?: boolean;
  waitForTimeout?: number; // Additional wait time for JS frameworks to hydrate
  maxTimeout?: number; // Maximum timeout for page load
  screenshot?: boolean; // Capture screenshot for visual context
  userAgent?: string;
}

export interface PlaywrightCrawlResult {
  url: string;
  title: string;
  content: string;
  screenshot?: string; // Base64 encoded screenshot
  metadata: {
    loadTime: number;
    contentLength: number;
    finalUrl: string; // After redirects
  };
}

/**
 * Crawl a website using Playwright headless browser.
 * Waits for JavaScript frameworks to hydrate and render content.
 */
export async function crawlWithPlaywright(
  url: string,
  options: PlaywrightCrawlOptions = {}
): Promise<PlaywrightCrawlResult> {
  const startTime = Date.now();
  const {
    waitForNetworkIdle = true,
    waitForTimeout = 2000, // 2 seconds for framework hydration
    maxTimeout = 15000, // 15 seconds max
    screenshot = false,
    userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  } = options;

  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    logger.info('Starting Playwright crawl', { url, options });

    // Launch browser in headless mode
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    // Create new page with custom user agent
    page = await browser.newPage({
      userAgent,
      viewport: { width: 1920, height: 1080 },
    });

    // Set extra headers to appear more like a real browser
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    });

    // Navigate to URL with appropriate wait strategy
    await page.goto(url, {
      waitUntil: waitForNetworkIdle ? 'networkidle' : 'load',
      timeout: maxTimeout,
    });

    // Wait additional time for JavaScript frameworks to hydrate
    if (waitForTimeout > 0) {
      await page.waitForTimeout(waitForTimeout);
    }

    // Extract page title
    const title = await page.title();

    // Extract clean text content (remove scripts, styles, nav, footer)
    const content = await page.evaluate(() => {
      // Clone the document to avoid modifying the actual DOM
      const clone = document.body.cloneNode(true) as HTMLElement;

      // Remove unwanted elements
      const unwantedSelectors = [
        'script',
        'style',
        'noscript',
        'iframe',
        'nav',
        'footer',
        'header',
        '.advertisement',
        '.cookie-banner',
        '[role="navigation"]',
        '[role="complementary"]',
      ];

      unwantedSelectors.forEach((selector) => {
        clone.querySelectorAll(selector).forEach((el) => el.remove());
      });

      // Extract text content
      const text = clone.innerText || clone.textContent || '';

      // Clean up whitespace
      return text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join('\n');
    });

    // Get final URL (after redirects)
    const finalUrl = page.url();

    // Optionally capture screenshot
    let screenshotData: string | undefined;
    if (screenshot) {
      const screenshotBuffer = await page.screenshot({
        type: 'jpeg',
        quality: 80,
        fullPage: false, // Only viewport
      });
      screenshotData = screenshotBuffer.toString('base64');
    }

    const loadTime = Date.now() - startTime;

    logger.info('Playwright crawl successful', {
      url,
      finalUrl,
      title,
      contentLength: content.length,
      loadTime: `${loadTime}ms`,
    });

    return {
      url,
      title,
      content,
      screenshot: screenshotData,
      metadata: {
        loadTime,
        contentLength: content.length,
        finalUrl,
      },
    };
  } catch (error) {
    const loadTime = Date.now() - startTime;
    logger.error('Playwright crawl failed', {
      url,
      error,
      loadTime: `${loadTime}ms`,
    });
    throw new Error(
      `Playwright crawl failed for ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  } finally {
    // Always clean up browser resources
    if (page) {
      await page.close().catch(() => {});
    }
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

/**
 * Batch crawl multiple URLs using Playwright.
 * Opens pages in parallel for faster crawling.
 */
export async function batchCrawlWithPlaywright(
  urls: string[],
  options: PlaywrightCrawlOptions = {}
): Promise<PlaywrightCrawlResult[]> {
  const results: PlaywrightCrawlResult[] = [];
  const batchSize = 3; // Crawl 3 pages at a time to avoid overwhelming resources

  logger.info('Starting batch Playwright crawl', {
    urlCount: urls.length,
    batchSize,
  });

  // Process URLs in batches
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map((url) => crawlWithPlaywright(url, options))
    );

    // Collect successful results
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        logger.warn('Batch crawl item failed', { error: result.reason });
      }
    }
  }

  logger.info('Batch Playwright crawl complete', {
    totalUrls: urls.length,
    successCount: results.length,
    failureCount: urls.length - results.length,
  });

  return results;
}

/**
 * Check if a URL likely requires Playwright (JavaScript rendering).
 * Uses heuristics based on common SPA patterns.
 */
export function requiresPlaywright(url: string, contentHint?: string): boolean {
  // Check URL patterns that commonly indicate SPAs
  const spaIndicators = [
    /\/#\//i, // Hash-based routing (React Router)
    /\/app\//i, // Common SPA path
    /\/dashboard\//i, // Common SPA path
  ];

  if (spaIndicators.some((pattern) => pattern.test(url))) {
    return true;
  }

  // Check content hints (if we got minimal content from static crawl)
  if (contentHint) {
    const jsFrameworkIndicators = [
      'react',
      'vue',
      'angular',
      'next.js',
      'gatsby',
      'nuxt',
      '__NEXT_DATA__',
      'ng-version',
      'data-reactroot',
    ];

    const lowerContent = contentHint.toLowerCase();
    if (
      jsFrameworkIndicators.some((indicator) =>
        lowerContent.includes(indicator.toLowerCase())
      )
    ) {
      return true;
    }

    // If content is suspiciously short, might need JS rendering
    if (contentHint.length < 500) {
      return true;
    }
  }

  return false;
}

