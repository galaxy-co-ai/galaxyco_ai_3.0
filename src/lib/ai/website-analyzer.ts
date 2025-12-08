/**
 * Website Analyzer Service
 * 
 * Uses GPT-4o to extract structured business intelligence from crawled website pages.
 * Now supports both Playwright crawler and lightweight fetch+cheerio crawler.
 */

import { getOpenAI } from '@/lib/ai-providers';
import { logger } from '@/lib/logger';
import type { CrawledPage as LiteCrawledPage } from '@/lib/website-crawler-lite';
import { crawlWebsiteLite, fetchSinglePage } from '@/lib/website-crawler-lite';

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
 * Uses multiple methods with short timeouts to ensure fast response.
 * Includes retry logic with exponential backoff for reliability.
 */
export async function analyzeWebsiteQuick(
  websiteUrl: string,
  options?: { maxPages?: number }
): Promise<QuickWebsiteInsights | null> {
  logger.info('Starting quick website analysis', { url: websiteUrl });
  
  // Normalize URL
  let normalizedUrl = websiteUrl.trim();
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = 'https://' + normalizedUrl;
  }
  
  let contentSummary = '';
  let methodUsed = '';
  
  // Try Jina Reader FIRST - it handles auth-protected and JS-heavy sites best
  // With retry logic
  const jinaResult = await retryWithBackoff(async () => {
    logger.info('Trying Jina Reader', { url: normalizedUrl });
    const jinaUrl = `https://r.jina.ai/${normalizedUrl}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout (increased from 15s)
    
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
          return { content: jinaContent.slice(0, 6000), method: 'jina' };
        }
      }
      throw new Error(`Jina returned status ${jinaResponse.status}`);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }, 2, 1000); // 2 retries with 1s initial delay
  
  if (jinaResult) {
    contentSummary = jinaResult.content;
    methodUsed = jinaResult.method;
    logger.info('Got content from Jina Reader', { url: normalizedUrl, length: contentSummary.length });
  }
  
  // Fallback to Firecrawl API if Jina failed (if configured)
  if (!contentSummary || contentSummary.length < 200) {
    if (process.env.FIRECRAWL_API_KEY) {
      const firecrawlResult = await retryWithBackoff(async () => {
        logger.info('Trying Firecrawl API as fallback', { url: normalizedUrl });
        
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
                return { content: content.slice(0, 6000), method: 'firecrawl' };
              }
            }
          }
          throw new Error(`Firecrawl returned status ${firecrawlResponse.status}`);
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      }, 1, 1000); // 1 retry with 1s delay
      
      if (firecrawlResult) {
        contentSummary = firecrawlResult.content;
        methodUsed = firecrawlResult.method;
        logger.info('Got content from Firecrawl', { url: normalizedUrl, length: contentSummary.length });
      }
    }
  }

  // Fallback to direct fetch if previous methods failed
  if (!contentSummary || contentSummary.length < 200) {
    const fetchResult = await retryWithBackoff(async () => {
      logger.info('Trying direct fetch as fallback', { url: normalizedUrl });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased from 8s to 10s
      
      try {
        const response = await fetch(normalizedUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html',
          },
          signal: controller.signal,
          redirect: 'follow', // Follow redirects but limit depth
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
    }, 2, 500); // 2 retries with 500ms initial delay
    
    if (fetchResult) {
      contentSummary = fetchResult.content;
      methodUsed = fetchResult.method;
      logger.info('Got content from direct fetch', { url: normalizedUrl, length: contentSummary.length });
    }
  }
  
  // If we still have no content, try URL inference as last resort
  if (!contentSummary || contentSummary.length < 100) {
    logger.warn('Could not fetch website content, using URL inference', { 
      url: websiteUrl,
      methodsAttempted: ['jina', process.env.FIRECRAWL_API_KEY ? 'firecrawl' : null, 'direct_fetch'].filter(Boolean)
    });
    
    // Extract domain name for basic inference
    let domainName = normalizedUrl;
    try {
      domainName = new URL(normalizedUrl).hostname.replace('www.', '');
    } catch {}
    
    // Return partial success with inferred data and clear error message
    return {
      companyName: domainName.split('.')[0].charAt(0).toUpperCase() + domainName.split('.')[0].slice(1),
      description: `Company website at ${domainName}. Note: I couldn't fully access the website content (it may be blocking automated requests or require authentication).`,
      keyOfferings: ['Products and services - details unavailable'],
      targetAudience: 'To be determined - please share more about your business',
      suggestedActions: [
        'Share more details about what your company does',
        'Tell me about your main products or services',
        'Describe your target customers or market',
        'The website may be blocking automated access - you can paste key information here'
      ],
      websiteUrl: normalizedUrl,
      analysisNote: 'Limited analysis - website content could not be fully accessed. Please provide additional details about your business.',
    };
  }
  
  // Use GPT-4o for analysis
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
      max_tokens: 400,
      response_format: { type: 'json_object' },
    });
    
    const analysisText = response.choices[0]?.message?.content;
    if (!analysisText) {
      throw new Error('No AI response');
    }
    
    const analysis = JSON.parse(analysisText) as Omit<QuickWebsiteInsights, 'websiteUrl'>;
    
    logger.info('Website analysis complete', { 
      url: websiteUrl, 
      companyName: analysis.companyName,
      method: methodUsed || 'unknown'
    });
    
    return { ...analysis, websiteUrl };
  } catch (aiError) {
    logger.error('AI analysis failed', { url: websiteUrl, error: aiError, methodUsed });
    
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
    };
  }
}

/**
 * Full website analysis with crawling and database storage.
 * Use this for background processing or detailed analysis.
 */
export async function analyzeWebsiteFull(
  websiteUrl: string,
  options?: { maxPages?: number; saveToDb?: boolean; workspaceId?: string }
): Promise<WebsiteAnalysis | null> {
  const maxPages = options?.maxPages || 20;
  
  logger.info('Starting full website analysis', { url: websiteUrl, maxPages });
  
  try {
    // Use lightweight crawler
    const { pages } = await crawlWebsiteLite(websiteUrl, {
      maxPages,
      maxDepth: 2,
      useJinaReader: true,
    });
    
    if (pages.length === 0) {
      logger.warn('No pages crawled', { url: websiteUrl });
      return null;
    }
    
    // Use full analysis
    const analysis = await analyzeWebsiteContent(pages, websiteUrl);
    
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
        websiteUrl,
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
      });
    }
    
    return analysis;
  } catch (error) {
    logger.error('Full website analysis failed', { url: websiteUrl, error });
    return null;
  }
}
