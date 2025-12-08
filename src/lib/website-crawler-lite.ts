/**
 * Lightweight Website Crawler
 * 
 * A serverless-compatible website crawler using fetch + cheerio.
 * Works in Vercel/serverless environments without Playwright.
 * 
 * Features:
 * - Pure fetch + cheerio (no browser required)
 * - Jina AI Reader fallback for JavaScript-heavy sites
 * - Fast, synchronous analysis
 * - Respects rate limits
 */

import * as cheerio from 'cheerio';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CrawlOptions {
  maxPages?: number;
  maxDepth?: number;
  timeout?: number;
  useJinaReader?: boolean;
  useFirecrawl?: boolean; // Use Firecrawl for better content extraction
  abortSignal?: AbortSignal;
}

export interface CrawledPage {
  url: string;
  title: string;
  content: string;
  meta: {
    description?: string;
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  };
  links: string[];
  depth: number;
}

export interface WebsiteContent {
  pages: CrawledPage[];
  mainPage: CrawledPage | null;
  totalPages: number;
  error?: string;
}

// ============================================================================
// URL UTILITIES
// ============================================================================

function normalizeUrl(url: string, baseUrl?: string): string {
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const normalized = new URL(url);
      // Remove trailing slash for consistency
      return normalized.href.replace(/\/$/, '');
    }
    if (baseUrl) {
      const normalized = new URL(url, baseUrl);
      return normalized.href.replace(/\/$/, '');
    }
    return url;
  } catch {
    return url;
  }
}

function isSameDomain(url1: string, url2: string): boolean {
  try {
    const domain1 = new URL(url1).hostname.replace(/^www\./, '');
    const domain2 = new URL(url2).hostname.replace(/^www\./, '');
    return domain1 === domain2;
  } catch {
    return false;
  }
}

function shouldCrawlUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname.toLowerCase();
    
    // Skip non-content paths
    const skipPatterns = [
      '/api/', '/admin/', '/login', '/logout', '/signup', '/signin',
      '/cart', '/checkout', '/account/', '/dashboard/', '/settings/',
      '.pdf', '.zip', '.jpg', '.jpeg', '.png', '.gif', '.svg',
      '.css', '.js', '.json', '.xml', '.ico', '.woff', '.woff2',
      '/feed', '/rss', '/sitemap', 'mailto:', 'tel:', 'javascript:',
    ];
    
    if (skipPatterns.some(pattern => path.includes(pattern) || url.includes(pattern))) {
      return false;
    }
    
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

// ============================================================================
// FIRECRAWL API (for reliable content extraction)
// ============================================================================

async function fetchWithFirecrawl(url: string): Promise<string | null> {
  if (!process.env.FIRECRAWL_API_KEY) {
    return null;
  }

  try {
    const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        pageOptions: {
          onlyMainContent: true,
        },
      }),
      signal: AbortSignal.timeout(20000),
    });
    
    if (!response.ok) {
      logger.warn('Firecrawl request failed', { url, status: response.status });
      return null;
    }
    
    const data = await response.json();
    if (data.data?.markdown || data.data?.content) {
      return data.data.markdown || data.data.content;
    }
    
    return null;
  } catch (error) {
    logger.warn('Firecrawl error', { url, error });
    return null;
  }
}

// ============================================================================
// JINA AI READER (for JS-rendered sites)
// ============================================================================

async function fetchWithJinaReader(url: string): Promise<string | null> {
  try {
    // Jina Reader API - converts any URL to clean markdown
    const jinaUrl = `https://r.jina.ai/${url}`;
    
    const response = await fetch(jinaUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
        'User-Agent': 'Mozilla/5.0 (compatible; GalaxyCoBot/1.0)',
      },
      signal: AbortSignal.timeout(15000),
    });
    
    if (!response.ok) {
      logger.warn('Jina Reader request failed', { url, status: response.status });
      return null;
    }
    
    const content = await response.text();
    return content;
  } catch (error) {
    logger.warn('Jina Reader error', { url, error });
    return null;
  }
}

// ============================================================================
// HTML CONTENT EXTRACTION
// ============================================================================

function extractContent(html: string, url: string): Omit<CrawledPage, 'depth'> {
  const $ = cheerio.load(html);
  
  // Remove non-content elements
  $('script, style, noscript, nav, footer, header, aside, iframe, form, [role="navigation"], [role="banner"], [role="contentinfo"]').remove();
  
  // Extract title
  const title = $('title').text().trim() || 
                $('h1').first().text().trim() || 
                $('meta[property="og:title"]').attr('content') || 
                '';
  
  // Extract meta tags
  const meta = {
    description: $('meta[name="description"]').attr('content') || 
                 $('meta[property="og:description"]').attr('content') || undefined,
    keywords: $('meta[name="keywords"]').attr('content') || undefined,
    ogTitle: $('meta[property="og:title"]').attr('content') || undefined,
    ogDescription: $('meta[property="og:description"]').attr('content') || undefined,
    ogImage: $('meta[property="og:image"]').attr('content') || undefined,
  };
  
  // Extract main content
  const mainContent = $('main, article, [role="main"], .content, .main, #content, #main').first();
  const contentElement = mainContent.length ? mainContent : $('body');
  
  // Get text content, preserving structure
  let content = '';
  
  // Process headings and paragraphs
  contentElement.find('h1, h2, h3, h4, h5, h6, p, li, td, th, blockquote, figcaption').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 10) {
      content += text + '\n\n';
    }
  });
  
  // Fallback to all text if no structured content found
  if (content.length < 100) {
    content = contentElement.text()
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 10000);
  }
  
  // Extract links
  const links: string[] = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      try {
        const absoluteUrl = normalizeUrl(href, url);
        if (shouldCrawlUrl(absoluteUrl) && isSameDomain(absoluteUrl, url)) {
          links.push(absoluteUrl);
        }
      } catch {
        // Skip invalid URLs
      }
    }
  });
  
  return {
    url,
    title,
    content: content.slice(0, 15000), // Limit content size
    meta,
    links: [...new Set(links)], // Dedupe
  };
}

// ============================================================================
// MAIN CRAWLER
// ============================================================================

export async function crawlWebsiteLite(
  startUrl: string,
  options: CrawlOptions = {}
): Promise<WebsiteContent> {
  const {
    maxPages = 10,
    maxDepth = 2,
    timeout = 10000,
    useJinaReader = false,
    useFirecrawl = true, // Default to true if Firecrawl is available
  } = options;
  
  const baseUrl = normalizeUrl(startUrl);
  const crawledPages: CrawledPage[] = [];
  const visitedUrls = new Set<string>();
  const urlQueue: Array<{ url: string; depth: number }> = [{ url: baseUrl, depth: 0 }];
  
  logger.info('Starting lightweight website crawl', { 
    url: baseUrl, 
    maxPages, 
    maxDepth,
    useFirecrawl: useFirecrawl && !!process.env.FIRECRAWL_API_KEY,
    useJinaReader 
  });
  
  while (urlQueue.length > 0 && crawledPages.length < maxPages) {
    const { url: currentUrl, depth } = urlQueue.shift()!;
    
    // Skip if already visited or too deep
    if (visitedUrls.has(currentUrl) || depth > maxDepth) continue;
    if (!isSameDomain(currentUrl, baseUrl)) continue;
    if (!shouldCrawlUrl(currentUrl)) continue;
    
    visitedUrls.add(currentUrl);
    
    try {
      logger.info('Crawling page', { url: currentUrl, depth, pageCount: crawledPages.length });
      
      let pageData: Omit<CrawledPage, 'depth'> | null = null;
      
      // PRIORITY 1: Try Firecrawl first if enabled (most reliable)
      if (useFirecrawl && process.env.FIRECRAWL_API_KEY && depth === 0) {
        // Use Firecrawl for homepage and key pages
        const firecrawlContent = await fetchWithFirecrawl(currentUrl);
        if (firecrawlContent && firecrawlContent.length > 200) {
          // Extract basic metadata from URL
          const urlObj = new URL(currentUrl);
          pageData = {
            url: currentUrl,
            title: urlObj.hostname.replace('www.', ''),
            content: firecrawlContent.slice(0, 15000),
            meta: {},
            links: [], // Firecrawl doesn't return links, we'll extract from HTML if needed
          };
          logger.info('Got content from Firecrawl', { url: currentUrl, length: firecrawlContent.length });
        }
      }
      
      // PRIORITY 2: Try standard fetch if Firecrawl didn't work
      if (!pageData) {
        try {
          const response = await fetch(currentUrl, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; GalaxyCoBot/1.0; +https://galaxyco.ai)',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
            signal: AbortSignal.timeout(timeout),
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          const contentType = response.headers.get('content-type') || '';
          if (!contentType.includes('text/html')) {
            logger.warn('Skipping non-HTML page', { url: currentUrl, contentType });
            continue;
          }
          
          const html = await response.text();
          pageData = extractContent(html, currentUrl);
          
          // Check if content is too sparse (likely JS-rendered)
          if (pageData.content.length < 200 && useJinaReader) {
            logger.info('Content sparse, trying Jina Reader', { url: currentUrl });
            const jinaContent = await fetchWithJinaReader(currentUrl);
            if (jinaContent && jinaContent.length > pageData.content.length) {
              pageData.content = jinaContent.slice(0, 15000);
            }
          }
        } catch (fetchError) {
          // Fallback to Jina Reader on fetch failure
          if (useJinaReader) {
            logger.info('Fetch failed, trying Jina Reader', { url: currentUrl });
            const jinaContent = await fetchWithJinaReader(currentUrl);
            if (jinaContent) {
              pageData = {
                url: currentUrl,
                title: currentUrl.split('/').pop() || 'Page',
                content: jinaContent.slice(0, 15000),
                meta: {},
                links: [],
              };
            }
          }
          
          if (!pageData) {
            logger.warn('Failed to crawl page', { url: currentUrl, error: fetchError });
            continue;
          }
        }
      }
      
      if (pageData && pageData.content.length > 50) {
        crawledPages.push({ ...pageData, depth });
        
        // Add links to queue
        if (depth < maxDepth) {
          for (const link of pageData.links.slice(0, 20)) { // Limit links per page
            if (!visitedUrls.has(link)) {
              urlQueue.push({ url: link, depth: depth + 1 });
            }
          }
        }
      }
      
      // Small delay between requests
      if (crawledPages.length < maxPages && urlQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      logger.warn('Error crawling page', { url: currentUrl, error });
    }
  }
  
  logger.info('Lightweight website crawl complete', { 
    url: baseUrl, 
    pagesCrawled: crawledPages.length 
  });
  
  return {
    pages: crawledPages,
    mainPage: crawledPages.find(p => p.depth === 0) || null,
    totalPages: crawledPages.length,
  };
}

// ============================================================================
// QUICK SINGLE PAGE FETCH (for instant analysis)
// ============================================================================

export async function fetchSinglePage(url: string): Promise<CrawledPage | null> {
  try {
    const normalizedUrl = normalizeUrl(url);
    
    // Try standard fetch
    const response = await fetch(normalizedUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GalaxyCoBot/1.0; +https://galaxyco.ai)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      // Fallback to Jina Reader
      const jinaContent = await fetchWithJinaReader(normalizedUrl);
      if (jinaContent) {
        return {
          url: normalizedUrl,
          title: normalizedUrl,
          content: jinaContent.slice(0, 15000),
          meta: {},
          links: [],
          depth: 0,
        };
      }
      return null;
    }
    
    const html = await response.text();
    const pageData = extractContent(html, normalizedUrl);
    
    // If content is sparse, try Jina Reader
    if (pageData.content.length < 200) {
      const jinaContent = await fetchWithJinaReader(normalizedUrl);
      if (jinaContent && jinaContent.length > pageData.content.length) {
        pageData.content = jinaContent.slice(0, 15000);
      }
    }
    
    return { ...pageData, depth: 0 };
  } catch (error) {
    logger.error('Failed to fetch single page', { url, error });
    
    // Last resort: Jina Reader
    try {
      const jinaContent = await fetchWithJinaReader(url);
      if (jinaContent) {
        return {
          url,
          title: url,
          content: jinaContent.slice(0, 15000),
          meta: {},
          links: [],
          depth: 0,
        };
      }
    } catch {
      // Give up
    }
    
    return null;
  }
}
