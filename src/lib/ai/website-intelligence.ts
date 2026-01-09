/**
 * Website Intelligence System
 * 
 * Pre-analysis technology detection and intelligent method selection.
 * Determines the optimal crawling strategy before attempting to fetch content.
 * 
 * Strategy:
 * 1. Detect site technology stack (React, Vue, Angular, static HTML)
 * 2. Classify site type (SPA, MPA, hybrid)
 * 3. Select optimal crawl method (Firecrawl, Jina, Playwright, Direct)
 * 4. Predict success probability for each method
 */

import { logger } from '@/lib/logger';

export interface SiteTechnology {
  framework?: 'react' | 'vue' | 'angular' | 'nextjs' | 'gatsby' | 'nuxt' | 'svelte' | 'static';
  isJavaScriptHeavy: boolean;
  isSPA: boolean;
  hasSSR: boolean; // Server-side rendering
  requiresAuthentication: boolean;
  hasBotProtection: boolean;
}

export interface CrawlMethodScore {
  method: 'firecrawl' | 'jina' | 'playwright' | 'direct_fetch';
  score: number; // 0-100, higher is better
  reasoning: string;
  estimatedTime: number; // milliseconds
}

export interface IntelligentCrawlStrategy {
  primaryMethod: CrawlMethodScore['method'];
  fallbackMethods: CrawlMethodScore['method'][];
  technology: SiteTechnology;
  confidence: number; // 0-100
  recommendations: string[];
}

/**
 * Detect website technology using lightweight HEAD/initial GET request.
 * This runs BEFORE full crawl to optimize method selection.
 */
export async function detectSiteTechnology(url: string): Promise<SiteTechnology> {
  const startTime = Date.now();
  
  try {
    logger.debug('Detecting site technology', { url });

    // Quick HEAD request to get headers
    const headResponse = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(5000),
    });

    // Analyze response headers
    const headers = headResponse.headers;
    const server = headers.get('server')?.toLowerCase() || '';
    const _xPoweredBy = headers.get('x-powered-by')?.toLowerCase() || '';
    const _contentType = headers.get('content-type')?.toLowerCase() || '';

    // Check for common SPA/framework indicators in headers
    const hasNextJsHeader = headers.get('x-nextjs-cache') !== null;
    const _hasVercelHeader = headers.get('x-vercel-id') !== null;
    const _hasNetlifyHeader = headers.get('x-nf-request-id') !== null;

    // Quick GET request to analyze initial HTML (first 5KB)
    let initialHtml = '';
    let detectedFramework: SiteTechnology['framework'] = 'static';
    let isJavaScriptHeavy = false;
    let isSPA = false;
    let hasSSR = false;
    
    try {
      const getResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(8000),
      });

      const fullHtml = await getResponse.text();
      initialHtml = fullHtml.slice(0, 5000); // Analyze first 5KB

      // Detect frameworks based on HTML signatures
      if (initialHtml.includes('__NEXT_DATA__') || hasNextJsHeader) {
        detectedFramework = 'nextjs';
        hasSSR = true;
        isJavaScriptHeavy = true;
      } else if (initialHtml.includes('data-reactroot') || initialHtml.includes('data-react-root')) {
        detectedFramework = 'react';
        isJavaScriptHeavy = true;
        isSPA = initialHtml.includes('<div id="root"') || initialHtml.includes('<div id="app"');
      } else if (initialHtml.includes('ng-version') || initialHtml.includes('ng-app')) {
        detectedFramework = 'angular';
        isJavaScriptHeavy = true;
        isSPA = true;
      } else if (initialHtml.includes('data-v-') || initialHtml.includes('data-server-rendered')) {
        detectedFramework = 'vue';
        isJavaScriptHeavy = true;
        hasSSR = initialHtml.includes('data-server-rendered');
        isSPA = !hasSSR;
      } else if (initialHtml.includes('__NUXT__')) {
        detectedFramework = 'nuxt';
        hasSSR = true;
        isJavaScriptHeavy = true;
      } else if (initialHtml.includes('gatsby')) {
        detectedFramework = 'gatsby';
        hasSSR = true;
        isJavaScriptHeavy = true;
      } else if (initialHtml.includes('svelte')) {
        detectedFramework = 'svelte';
        isJavaScriptHeavy = true;
      }

      // Detect if it's a SPA based on minimal content + large JS bundles
      const scriptTags = (initialHtml.match(/<script/g) || []).length;
      const textContent = initialHtml
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, '')
        .trim();

      if (scriptTags > 5 && textContent.length < 500) {
        isSPA = true;
        isJavaScriptHeavy = true;
      }

    } catch (fetchError) {
      logger.warn('Failed to fetch initial HTML for analysis', { url, error: fetchError });
      // Continue with header-based detection
    }

    // Check for common bot protection indicators
    const hasBotProtection =
      server.includes('cloudflare') ||
      headers.get('cf-ray') !== null ||
      initialHtml.includes('cf-challenge') ||
      initialHtml.includes('DDoS protection by Cloudflare');

    // Check for authentication requirements (basic heuristics)
    const requiresAuthentication =
      headResponse.status === 401 ||
      headResponse.status === 403 ||
      initialHtml.includes('login') && initialHtml.includes('password');

    const duration = Date.now() - startTime;
    
    const technology: SiteTechnology = {
      framework: detectedFramework,
      isJavaScriptHeavy,
      isSPA,
      hasSSR,
      requiresAuthentication,
      hasBotProtection,
    };

    logger.info('Site technology detected', {
      url,
      technology,
      duration: `${duration}ms`,
    });

    return technology;

  } catch (error) {
    logger.warn('Technology detection failed, using defaults', { url, error });
    
    // Return conservative defaults on failure
    return {
      framework: 'static',
      isJavaScriptHeavy: false,
      isSPA: false,
      hasSSR: false,
      requiresAuthentication: false,
      hasBotProtection: false,
    };
  }
}

/**
 * Score different crawl methods based on site technology.
 * Returns prioritized list of methods with success probability.
 */
export function scoreCrawlMethods(technology: SiteTechnology): CrawlMethodScore[] {
  const scores: CrawlMethodScore[] = [];

  // Score Firecrawl (best for most sites, especially complex ones)
  if (technology.requiresAuthentication) {
    scores.push({
      method: 'firecrawl',
      score: 30,
      reasoning: 'Site requires authentication - Firecrawl may struggle',
      estimatedTime: 5000,
    });
  } else if (technology.hasBotProtection) {
    scores.push({
      method: 'firecrawl',
      score: 60,
      reasoning: 'Bot protection detected - Firecrawl has good bypass capabilities',
      estimatedTime: 6000,
    });
  } else if (technology.isJavaScriptHeavy) {
    scores.push({
      method: 'firecrawl',
      score: 90,
      reasoning: 'JS-heavy site - Firecrawl excels at rendering modern frameworks',
      estimatedTime: 5000,
    });
  } else {
    scores.push({
      method: 'firecrawl',
      score: 95,
      reasoning: 'Standard site - Firecrawl is the most reliable option',
      estimatedTime: 4000,
    });
  }

  // Score Jina Reader (good for content-focused sites)
  if (technology.isSPA) {
    scores.push({
      method: 'jina',
      score: 40,
      reasoning: 'SPA detected - Jina may miss client-rendered content',
      estimatedTime: 3000,
    });
  } else if (technology.hasSSR) {
    scores.push({
      method: 'jina',
      score: 85,
      reasoning: 'SSR detected - Jina works well with server-rendered content',
      estimatedTime: 3000,
    });
  } else if (technology.hasBotProtection) {
    scores.push({
      method: 'jina',
      score: 50,
      reasoning: 'Bot protection may block Jina Reader',
      estimatedTime: 3500,
    });
  } else {
    scores.push({
      method: 'jina',
      score: 80,
      reasoning: 'Static or hybrid site - Jina is fast and effective',
      estimatedTime: 2500,
    });
  }

  // Score Playwright (most powerful but slowest and resource-intensive)
  if (technology.requiresAuthentication) {
    scores.push({
      method: 'playwright',
      score: 40,
      reasoning: 'Requires auth - Playwright cannot handle login flows automatically',
      estimatedTime: 15000,
    });
  } else if (technology.isSPA || technology.isJavaScriptHeavy) {
    scores.push({
      method: 'playwright',
      score: 95,
      reasoning: 'Heavy JS site - Playwright can fully render dynamic content',
      estimatedTime: 12000,
    });
  } else if (technology.hasBotProtection) {
    scores.push({
      method: 'playwright',
      score: 85,
      reasoning: 'Bot protection - Playwright can mimic real browser behavior',
      estimatedTime: 14000,
    });
  } else {
    scores.push({
      method: 'playwright',
      score: 70,
      reasoning: 'Standard site - Playwright works but is overkill',
      estimatedTime: 10000,
    });
  }

  // Score Direct Fetch (fastest but least capable)
  if (technology.isJavaScriptHeavy || technology.isSPA) {
    scores.push({
      method: 'direct_fetch',
      score: 20,
      reasoning: 'JS-heavy site - Direct fetch will miss rendered content',
      estimatedTime: 1500,
    });
  } else if (technology.hasBotProtection) {
    scores.push({
      method: 'direct_fetch',
      score: 30,
      reasoning: 'Bot protection likely blocks direct requests',
      estimatedTime: 2000,
    });
  } else if (!technology.framework || technology.framework === 'static') {
    scores.push({
      method: 'direct_fetch',
      score: 85,
      reasoning: 'Static HTML site - Direct fetch is fast and sufficient',
      estimatedTime: 1000,
    });
  } else {
    scores.push({
      method: 'direct_fetch',
      score: 60,
      reasoning: 'Hybrid site - Direct fetch may work as fallback',
      estimatedTime: 1500,
    });
  }

  // Sort by score (descending)
  return scores.sort((a, b) => b.score - a.score);
}

/**
 * Generate intelligent crawl strategy based on site analysis.
 * Returns optimal method order and recommendations.
 */
export async function generateCrawlStrategy(url: string): Promise<IntelligentCrawlStrategy> {
  const technology = await detectSiteTechnology(url);
  const methodScores = scoreCrawlMethods(technology);

  // Primary method is the highest scored
  const primaryMethod = methodScores[0].method;

  // Fallback methods are the rest (excluding primary)
  const fallbackMethods = methodScores
    .slice(1)
    .filter((score) => score.score > 50) // Only use methods with reasonable success probability
    .map((score) => score.method);

  // Calculate confidence based on primary method score and technology certainty
  const primaryScore = methodScores[0].score;
  const techCertainty = technology.framework !== 'static' ? 80 : 60;
  const confidence = Math.round((primaryScore + techCertainty) / 2);

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (technology.requiresAuthentication) {
    recommendations.push('Site requires authentication - automated crawl may fail. Consider manual content extraction.');
  }
  
  if (technology.hasBotProtection) {
    recommendations.push('Bot protection detected - expect slower crawl times and potential failures.');
  }
  
  if (technology.isSPA && !technology.hasSSR) {
    recommendations.push('Pure SPA detected - content may require JavaScript rendering. Playwright recommended if other methods fail.');
  }
  
  if (methodScores[0].score < 70) {
    recommendations.push('Low confidence in automated crawl. Consider asking user for business details directly.');
  }

  if (technology.isJavaScriptHeavy && primaryMethod !== 'playwright') {
    recommendations.push('JS-heavy site detected - if Firecrawl fails, Playwright will be used as fallback.');
  }

  logger.info('Generated crawl strategy', {
    url,
    primaryMethod,
    fallbackMethods,
    confidence,
    technology,
  });

  return {
    primaryMethod,
    fallbackMethods,
    technology,
    confidence,
    recommendations,
  };
}

