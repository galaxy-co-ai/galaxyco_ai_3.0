/**
 * Website Analyzer Service
 * 
 * Uses GPT-4o to extract structured business intelligence from crawled website pages.
 * Now supports both Playwright crawler and lightweight fetch+cheerio crawler.
 */

import { getOpenAI } from '@/lib/ai-providers';
import { logger } from '@/lib/logger';
import type { CrawledPage as LiteCrawledPage } from '@/lib/website-crawler-lite';
import { crawlWebsiteLite } from '@/lib/website-crawler-lite';

// Support both crawler types
type CrawledPage = LiteCrawledPage;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface WebsiteAnalysis {
  companyName: string;
  companyDescription: string;
  products: Array<{ name: string; description: string }>;
  services: Array<{ name: string; description: string }>;
  teamMembers: Array<{ name: string; role: string }>;
  targetAudience: string;
  valuePropositions: string[];
  brandVoice: 'professional' | 'friendly' | 'technical' | 'casual' | 'formal' | 'creative' | 'other';
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  };
  socialLinks: Record<string, string>;
}

export interface QuickWebsiteInsights {
  companyName: string;
  description: string;
  keyOfferings: string[];
  targetAudience: string;
  suggestedActions: string[];
  websiteUrl: string;
  analysisNote?: string; // Optional note about analysis quality or limitations
  methodUsed?: string; // Which method succeeded: 'firecrawl', 'jina', 'direct_fetch', 'google_search', 'inferred'
  contentLength?: number; // Length of content retrieved
  fallbackUsed?: boolean; // Whether fallback methods were used
}

// ============================================================================
// CONTENT PREPARATION
// ============================================================================

/**
 * Prepare crawled pages for AI analysis
 * Combines and chunks content to fit within token limits
 */
function prepareContentForAnalysis(pages: CrawledPage[]): string {
  // Sort by depth (homepage first) and limit to most important pages
  const sortedPages = [...pages]
    .sort((a, b) => {
      // Homepage first
      if (a.depth === 0) return -1;
      if (b.depth === 0) return 1;
      return a.depth - b.depth;
    })
    .slice(0, 20); // Limit to top 20 pages for analysis

  // Build content summary
  const contentParts = sortedPages.map((page, index) => {
    const pageContent = `
=== Page ${index + 1}: ${page.title} (${page.url}) ===
${page.meta.description ? `Meta Description: ${page.meta.description}\n` : ''}
${page.content.slice(0, 5000)} // Limit each page to ~5000 chars
`;
    return pageContent;
  });

  return contentParts.join('\n\n');
}

// ============================================================================
// AI ANALYSIS
// ============================================================================

/**
 * Analyze website content and extract business intelligence
 */
export async function analyzeWebsiteContent(
  pages: CrawledPage[],
  websiteUrl: string
): Promise<WebsiteAnalysis> {
  if (pages.length === 0) {
    throw new Error('No pages to analyze');
  }

  logger.info('Analyzing website content', { 
    url: websiteUrl, 
    pageCount: pages.length 
  });

  // Prepare content
  const content = prepareContentForAnalysis(pages);

  // Use GPT-4o to extract structured information
  const openai = getOpenAI();
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are analyzing a company website to extract business intelligence. Extract structured information about the company, its products/services, team, target audience, brand voice, and contact information.

Output a JSON object with this exact structure:
{
  "companyName": "string - the company name",
  "companyDescription": "string - 1-2 sentence description of what the company does",
  "products": [{"name": "string", "description": "string"}],
  "services": [{"name": "string", "description": "string"}],
  "teamMembers": [{"name": "string", "role": "string"}],
  "targetAudience": "string - who the company serves (e.g., 'Small businesses', 'Enterprise customers', 'Consumers')",
  "valuePropositions": ["string - key value propositions"],
  "brandVoice": "professional|friendly|technical|casual|formal|creative|other",
  "contactInfo": {
    "email": "string or null",
    "phone": "string or null",
    "address": "string or null"
  },
  "socialLinks": {
    "linkedin": "url or empty string",
    "twitter": "url or empty string",
    "facebook": "url or empty string",
    "instagram": "url or empty string"
  }
}

Be thorough but accurate. Only include information you can confidently extract from the website content. If information is not available, use empty strings or empty arrays.`,
        },
        {
          role: 'user',
          content: `Analyze this website content and extract the business information:\n\n${content}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const analysisText = response.choices[0]?.message?.content;
    if (!analysisText) {
      throw new Error('No response from AI');
    }

    const analysis = JSON.parse(analysisText) as WebsiteAnalysis;

    // Validate and clean the analysis
    const cleanedAnalysis: WebsiteAnalysis = {
      companyName: analysis.companyName || 'Unknown Company',
      companyDescription: analysis.companyDescription || '',
      products: Array.isArray(analysis.products) ? analysis.products : [],
      services: Array.isArray(analysis.services) ? analysis.services : [],
      teamMembers: Array.isArray(analysis.teamMembers) ? analysis.teamMembers : [],
      targetAudience: analysis.targetAudience || '',
      valuePropositions: Array.isArray(analysis.valuePropositions) 
        ? analysis.valuePropositions 
        : [],
      brandVoice: analysis.brandVoice || 'professional',
      contactInfo: {
        email: analysis.contactInfo?.email || undefined,
        phone: analysis.contactInfo?.phone || undefined,
        address: analysis.contactInfo?.address || undefined,
      },
      socialLinks: analysis.socialLinks || {},
    };

    // Clean social links (remove empty strings)
    const cleanedSocialLinks: Record<string, string> = {};
    for (const [key, value] of Object.entries(cleanedAnalysis.socialLinks)) {
      if (value && typeof value === 'string' && value.trim()) {
        cleanedSocialLinks[key] = value.trim();
      }
    }
    cleanedAnalysis.socialLinks = cleanedSocialLinks;

    logger.info('Website analysis complete', { 
      url: websiteUrl,
      companyName: cleanedAnalysis.companyName,
      productsCount: cleanedAnalysis.products.length,
      servicesCount: cleanedAnalysis.services.length,
    });

    return cleanedAnalysis;
  } catch (error) {
    logger.error('Failed to analyze website content', { url: websiteUrl, error });
    throw error;
  }
}

// ============================================================================
// QUICK WEBSITE ANALYSIS (Synchronous, for Neptune)
// ============================================================================

/**
 * Retry helper with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) {
        logger.warn(`Retry failed after ${maxRetries} attempts`, { error });
        return null;
      }
      const delay = initialDelay * Math.pow(2, attempt);
      logger.debug(`Retry attempt ${attempt + 1} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return null;
}

/**
 * Quick website analysis for immediate Neptune responses.
 * Uses Firecrawl-first approach with multiple fallbacks for reliability.
 * Includes 7-day caching to avoid re-analyzing the same websites.
 */
export async function analyzeWebsiteQuick(
  websiteUrl: string,
  options?: { maxPages?: number; skipCache?: boolean }
): Promise<QuickWebsiteInsights> {
  const startTime = Date.now();
  let methodUsed = '';
  let contentSummary = '';
  let fallbackUsed = false;
  
  try {
    logger.info('Starting quick website analysis', { url: websiteUrl });
    
    // Normalize URL
    let normalizedUrl = websiteUrl.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    
    // Validate URL format
    try {
      new URL(normalizedUrl);
    } catch {
      logger.warn('Invalid URL format', { url: normalizedUrl });
      const domainName = normalizedUrl.split('/')[0].replace('www.', '');
      return {
        companyName: domainName.split('.')[0]?.charAt(0).toUpperCase() + domainName.split('.')[0]?.slice(1) || 'Unknown',
        description: `Invalid URL format: ${normalizedUrl}. Please provide a valid website URL.`,
        keyOfferings: ['Unable to analyze - invalid URL'],
        targetAudience: 'Please provide a valid URL',
        suggestedActions: ['Please provide a valid website URL starting with http:// or https://'],
        websiteUrl: normalizedUrl,
        analysisNote: 'Invalid URL format provided',
        methodUsed: 'invalid',
        contentLength: 0,
        fallbackUsed: false,
      };
    }

    // Check cache first (unless skipCache is true)
    if (!options?.skipCache) {
      const { getCache, ContextCacheKeys, CONTEXT_CACHE_TTL } = await import('@/lib/cache');
      const cacheKey = ContextCacheKeys.websiteAnalysis(normalizedUrl);
      const cached = await getCache<QuickWebsiteInsights>(cacheKey);
      
      if (cached) {
        const duration = Date.now() - startTime;
        logger.info('Website analysis cache hit', {
          url: normalizedUrl,
          duration: `${duration}ms`,
        });
        return cached;
      }
    }
  
    // PRIORITY 1: Try Firecrawl FIRST (most reliable, configured)
    if (process.env.FIRECRAWL_API_KEY) {
      const firecrawlStart = Date.now();
      const firecrawlResult = await retryWithBackoff(async () => {
        logger.info('Trying Firecrawl API (primary)', { url: normalizedUrl });
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);
        
        try {
          const firecrawlResponse = await fetch('https://api.firecrawl.dev/v0/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: normalizedUrl,
              pageOptions: {
                onlyMainContent: true,
              },
            }),
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          if (firecrawlResponse.ok) {
            const firecrawlData = await firecrawlResponse.json();
            if (firecrawlData.data?.markdown || firecrawlData.data?.content) {
              const content = firecrawlData.data.markdown || firecrawlData.data.content;
              if (content && content.length > 200) {
                return { content: content.slice(0, 8000), method: 'firecrawl' };
              }
            }
          }
          throw new Error(`Firecrawl returned status ${firecrawlResponse.status}`);
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      }, 2, 1000); // 2 retries with 1s initial delay
      
      if (firecrawlResult) {
        contentSummary = firecrawlResult.content;
        methodUsed = firecrawlResult.method;
        const duration = Date.now() - firecrawlStart;
        logger.info('Got content from Firecrawl', { 
          url: normalizedUrl, 
          length: contentSummary.length,
          duration: `${duration}ms`
        });
      }
    }
  
    // PRIORITY 2: Fallback to Jina Reader if Firecrawl failed
    if (!contentSummary || contentSummary.length < 200) {
      fallbackUsed = true;
      const jinaStart = Date.now();
      const jinaResult = await retryWithBackoff(async () => {
        logger.info('Trying Jina Reader (fallback)', { url: normalizedUrl });
        const jinaUrl = `https://r.jina.ai/${normalizedUrl}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);
        
        try {
          const jinaResponse = await fetch(jinaUrl, {
            method: 'GET',
            headers: {
              'Accept': 'text/plain',
              'X-No-Cache': 'true',
            },
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          if (jinaResponse.ok) {
            const jinaContent = await jinaResponse.text();
            if (jinaContent && jinaContent.length > 200) {
              return { content: jinaContent.slice(0, 8000), method: 'jina' };
            }
          }
          throw new Error(`Jina returned status ${jinaResponse.status}`);
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      }, 2, 1000);
      
      if (jinaResult) {
        contentSummary = jinaResult.content;
        methodUsed = jinaResult.method;
        const duration = Date.now() - jinaStart;
        logger.info('Got content from Jina Reader', { 
          url: normalizedUrl, 
          length: contentSummary.length,
          duration: `${duration}ms`
        });
      }
    }

    // PRIORITY 3: Fallback to Playwright if previous methods failed (JS-heavy sites)
    if (!contentSummary || contentSummary.length < 200) {
      fallbackUsed = true;
      const playwrightStart = Date.now();
      
      try {
        logger.info('Trying Playwright (JS-heavy fallback)', { url: normalizedUrl });
        
        // Import Playwright crawler dynamically
        const { crawlWithPlaywright } = await import('@/lib/website-crawler');
        
        const playwrightResult = await crawlWithPlaywright(normalizedUrl, {
          waitForNetworkIdle: true,
          waitForTimeout: 2000,
          maxTimeout: 15000,
        });
        
        if (playwrightResult.content && playwrightResult.content.length > 200) {
          contentSummary = playwrightResult.content.slice(0, 8000);
          methodUsed = 'playwright';
          const duration = Date.now() - playwrightStart;
          logger.info('Got content from Playwright', {
            url: normalizedUrl,
            length: contentSummary.length,
            duration: `${duration}ms`,
          });
        }
      } catch (playwrightError) {
        logger.warn('Playwright failed', { url: normalizedUrl, error: playwrightError });
      }
    }

    // PRIORITY 4: Fallback to direct fetch as last resort before giving up
    if (!contentSummary || contentSummary.length < 200) {
      const fetchStart = Date.now();
      const fetchResult = await retryWithBackoff(async () => {
        logger.info('Trying direct fetch (last resort)', { url: normalizedUrl });
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        try {
          const response = await fetch(normalizedUrl, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
            },
            signal: controller.signal,
            redirect: 'follow',
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok || response.status === 200) {
            const html = await response.text();
            
            // Quick extraction
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
            
            const textContent = html
              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 5000);
            
            if (textContent.length > 100) {
              return {
                content: `Title: ${titleMatch?.[1] || 'Unknown'}\nDescription: ${descMatch?.[1] || ''}\n\nContent:\n${textContent}`,
                method: 'direct_fetch'
              };
            }
          }
          throw new Error(`Direct fetch returned status ${response.status}`);
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      }, 2, 500);
      
      if (fetchResult) {
        contentSummary = fetchResult.content;
        methodUsed = fetchResult.method;
        const duration = Date.now() - fetchStart;
        logger.info('Got content from direct fetch', { 
          url: normalizedUrl, 
          length: contentSummary.length,
          duration: `${duration}ms`
        });
      }
    }

    // PRIORITY 5: Google Custom Search enrichment if content is sparse
    if ((!contentSummary || contentSummary.length < 500) && process.env.GOOGLE_CUSTOM_SEARCH_API_KEY && process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID) {
      try {
        logger.info('Content sparse, enriching with Google Search', { url: normalizedUrl });
        const { searchCompanyInfo } = await import('@/lib/search');
        let domainName = normalizedUrl;
        try {
          domainName = new URL(normalizedUrl).hostname.replace('www.', '');
        } catch {}
        
        const searchResults = await searchCompanyInfo(domainName.split('.')[0]);
        if (searchResults && searchResults.length > 0) {
          const searchSnippets = searchResults
            .slice(0, 3)
            .map(r => `${r.title}: ${r.snippet}`)
            .join('\n\n');
          
          if (contentSummary) {
            contentSummary += `\n\n--- Additional Information from Web Search ---\n${searchSnippets}`;
          } else {
            contentSummary = `--- Information from Web Search ---\n${searchSnippets}`;
          }
          
          if (!methodUsed) {
            methodUsed = 'google_search';
          } else {
            methodUsed += '+google_search';
          }
          
          logger.info('Enriched content with Google Search', { 
            url: normalizedUrl, 
            resultsCount: searchResults.length,
            totalLength: contentSummary.length
          });
        }
      } catch (searchError) {
        logger.warn('Google Search enrichment failed', { url: normalizedUrl, error: searchError });
        // Continue without search enrichment
      }
    }
  
    // If we still have no content, try URL inference as last resort
    if (!contentSummary || contentSummary.length < 100) {
      logger.warn('Could not fetch website content, using URL inference', { 
        url: websiteUrl,
        methodsAttempted: [
          process.env.FIRECRAWL_API_KEY ? 'firecrawl' : null,
          'jina',
          'direct_fetch',
          process.env.GOOGLE_CUSTOM_SEARCH_API_KEY ? 'google_search' : null
        ].filter(Boolean),
        duration: `${Date.now() - startTime}ms`
      });
      
      // Extract domain name for basic inference
      let domainName = normalizedUrl;
      try {
        domainName = new URL(normalizedUrl).hostname.replace('www.', '');
      } catch {}
      
      // Extract company name from domain
      const companyName = domainName.split('.')[0]
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ') || 'Your Company';
      
      // Return positive, actionable result even when content can't be fetched
      return {
        companyName,
        description: `I found your website at ${domainName}! The site appears to be active, but I couldn't access the full content automatically. This is common with sites that have special security settings. I can still help you set up GalaxyCo.ai - just share a bit about what you do!`,
        keyOfferings: [
          'Ready to discover your offerings',
          'Products and services to be identified',
          'Business capabilities to be explored'
        ],
        targetAudience: 'Your target customers - tell me who you serve!',
        suggestedActions: [
          'Share what your company does in a sentence or two',
          'Tell me about your main products or services',
          'Describe your ideal customers or target market',
          'Or paste key information from your website here'
        ],
        websiteUrl: normalizedUrl,
        analysisNote: `Website detected at ${domainName}. Content access was limited, but I'm ready to help you get started!`,
        methodUsed: 'inferred',
        contentLength: 0,
        fallbackUsed: true,
      };
    }
  
    // Use GPT-4o for analysis
    const aiStart = Date.now();
    try {
      const openai = getOpenAI();
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Analyze this website content and extract business information. Output JSON only:
{
  "companyName": "company name",
  "description": "one sentence about what they do",
  "keyOfferings": ["offering 1", "offering 2", "offering 3"],
  "targetAudience": "who they serve",
  "suggestedActions": ["action 1 to help them grow", "action 2", "action 3"]
}`,
          },
          {
            role: 'user',
            content: `URL: ${websiteUrl}\n\n${contentSummary}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 600,
        response_format: { type: 'json_object' },
      });
      
      const analysisText = response.choices[0]?.message?.content;
      if (!analysisText) {
        throw new Error('No AI response');
      }
      
      const analysis = JSON.parse(analysisText) as Omit<QuickWebsiteInsights, 'websiteUrl' | 'methodUsed' | 'contentLength' | 'fallbackUsed'>;
      const totalDuration = Date.now() - startTime;
      const aiDuration = Date.now() - aiStart;
      
      logger.info('Website analysis complete', { 
        url: websiteUrl, 
        companyName: analysis.companyName,
        method: methodUsed || 'unknown',
        contentLength: contentSummary.length,
        fallbackUsed,
        totalDuration: `${totalDuration}ms`,
        aiDuration: `${aiDuration}ms`
      });
      
      const result: QuickWebsiteInsights = { 
        ...analysis, 
        websiteUrl,
        methodUsed: methodUsed || 'unknown',
        contentLength: contentSummary.length,
        fallbackUsed,
      };

      // Cache the successful result for 7 days
      if (!options?.skipCache) {
        const { setCache, ContextCacheKeys, CONTEXT_CACHE_TTL } = await import('@/lib/cache');
        const cacheKey = ContextCacheKeys.websiteAnalysis(normalizedUrl);
        await setCache(cacheKey, result, { ttl: CONTEXT_CACHE_TTL.WEBSITE_ANALYSIS });
      }
      
      return result;
    } catch (aiError) {
      logger.error('AI analysis failed', { 
        url: websiteUrl, 
        error: aiError, 
        methodUsed,
        contentLength: contentSummary.length,
        duration: `${Date.now() - startTime}ms`
      });
      
      // Return a helpful error response instead of null
      let domainName = normalizedUrl;
      try {
        domainName = new URL(normalizedUrl).hostname.replace('www.', '');
      } catch {}
      
      return {
        companyName: domainName.split('.')[0].charAt(0).toUpperCase() + domainName.split('.')[0].slice(1),
        description: `I encountered an error analyzing ${domainName}. The website may be blocking automated access, require authentication, or have connectivity issues.`,
        keyOfferings: ['Unable to determine - website analysis failed'],
        targetAudience: 'Unable to determine - please share details',
        suggestedActions: [
          'The website could not be analyzed automatically',
          'Please share key information about your business',
          'Tell me about your products, services, and target customers',
          'Check if the website requires authentication or blocks bots'
        ],
        websiteUrl: normalizedUrl,
        analysisNote: `Analysis failed: ${aiError instanceof Error ? aiError.message : 'Unknown error'}. Please provide business details manually.`,
        methodUsed: methodUsed || 'failed',
        contentLength: contentSummary.length,
        fallbackUsed: true,
      };
    }
  } catch (outerError) {
    // Catch any unexpected errors and return a helpful response
    const totalDuration = Date.now() - startTime;
    logger.error('Unexpected error in analyzeWebsiteQuick', { 
      url: websiteUrl, 
      error: outerError,
      duration: `${totalDuration}ms`
    });
    
    let domainName = websiteUrl;
    try {
      const urlObj = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`);
      domainName = urlObj.hostname.replace('www.', '');
    } catch {}
    
    return {
      companyName: domainName.split('.')[0]?.charAt(0).toUpperCase() + domainName.split('.')[0]?.slice(1) || 'Unknown',
      description: `I encountered an unexpected error while analyzing ${domainName}. Please try again or share details about your business.`,
      keyOfferings: ['Unable to determine - analysis error'],
      targetAudience: 'Please share details about your business',
      suggestedActions: [
        'Please try again with the website URL',
        'Or share key information about your business directly',
        'Tell me about your products, services, and target customers'
      ],
      websiteUrl: websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`,
      analysisNote: `Unexpected error: ${outerError instanceof Error ? outerError.message : 'Unknown error'}`,
      methodUsed: 'error',
      contentLength: 0,
      fallbackUsed: true,
    };
  }
}

/**
 * Full website analysis with crawling and database storage.
 * Use this for background processing or detailed analysis.
 * Uses serverless-compatible lite crawler with deep crawl settings.
 */
export async function analyzeWebsiteFull(
  websiteUrl: string,
  options?: { maxPages?: number; saveToDb?: boolean; workspaceId?: string }
): Promise<WebsiteAnalysis | null> {
  const startTime = Date.now();
  const maxPages = options?.maxPages || 50; // Deep crawl default
  const maxDepth = 4; // Deep crawl depth
  
  logger.info('Starting full website analysis', { 
    url: websiteUrl, 
    maxPages,
    maxDepth,
    workspaceId: options?.workspaceId 
  });
  
  try {
    // Normalize URL
    let normalizedUrl = websiteUrl.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    
    // Use lightweight crawler (serverless-compatible)
    const crawlResult = await crawlWebsiteLite(normalizedUrl, {
      maxPages,
      maxDepth,
      timeout: 15000, // 15s per page
      useFirecrawl: true, // Use Firecrawl for better content extraction
      useJinaReader: true, // Enable Jina fallback for JS-heavy sites
    });
    
    if (crawlResult.pages.length === 0) {
      logger.warn('No pages crawled', { 
        url: websiteUrl,
        totalPages: crawlResult.totalPages
      });
      return null;
    }
    
    logger.info('Website crawl complete', {
      url: websiteUrl,
      pagesCrawled: crawlResult.pages.length,
      duration: `${Date.now() - startTime}ms`
    });
    
    // Use full analysis
    const analysis = await analyzeWebsiteContent(crawlResult.pages, normalizedUrl);
    
    // Optionally save to database
    if (options?.saveToDb && options?.workspaceId) {
      const { db } = await import('@/lib/db');
      const { workspaceIntelligence } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');
      
      const existing = await db.query.workspaceIntelligence.findFirst({
        where: eq(workspaceIntelligence.workspaceId, options.workspaceId),
      });
      
      const data = {
        companyName: analysis.companyName,
        companyDescription: analysis.companyDescription,
        products: analysis.products,
        services: analysis.services,
        teamMembers: analysis.teamMembers,
        targetAudience: analysis.targetAudience,
        valuePropositions: analysis.valuePropositions,
        brandVoice: analysis.brandVoice,
        contactInfo: analysis.contactInfo,
        socialLinks: analysis.socialLinks,
        websiteUrl: normalizedUrl,
        websiteAnalyzedAt: new Date(),
        lastUpdated: new Date(),
      };
      
      if (existing) {
        await db.update(workspaceIntelligence)
          .set(data)
          .where(eq(workspaceIntelligence.workspaceId, options.workspaceId));
      } else {
        await db.insert(workspaceIntelligence).values({
          ...data,
          workspaceId: options.workspaceId,
        });
      }
      
      logger.info('Saved website analysis to database', { 
        workspaceId: options.workspaceId,
        companyName: analysis.companyName,
        pagesCrawled: crawlResult.pages.length,
        totalDuration: `${Date.now() - startTime}ms`
      });
    }
    
    return analysis;
  } catch (error) {
    logger.error('Full website analysis failed', { 
      url: websiteUrl, 
      error,
      duration: `${Date.now() - startTime}ms`,
      workspaceId: options?.workspaceId
    });
    return null;
  }
}
