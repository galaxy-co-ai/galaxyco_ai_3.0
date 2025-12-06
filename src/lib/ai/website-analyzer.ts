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
 * Quick website analysis for immediate Neptune responses.
 * Uses lightweight crawler and GPT-4o for fast, actionable insights.
 */
export async function analyzeWebsiteQuick(
  websiteUrl: string,
  options?: { maxPages?: number }
): Promise<QuickWebsiteInsights | null> {
  const maxPages = options?.maxPages || 5;
  
  logger.info('Starting quick website analysis', { url: websiteUrl, maxPages });
  
  try {
    // Use lightweight crawler
    const { pages, mainPage } = await crawlWebsiteLite(websiteUrl, {
      maxPages,
      maxDepth: 1,
      useJinaReader: true, // Enable Jina fallback for JS sites
    });
    
    if (pages.length === 0 && !mainPage) {
      // Try single page fetch as last resort
      const singlePage = await fetchSinglePage(websiteUrl);
      if (!singlePage || singlePage.content.length < 100) {
        logger.warn('Could not fetch website content', { url: websiteUrl });
        return null;
      }
      pages.push(singlePage);
    }
    
    // Prepare condensed content for quick analysis
    const contentSummary = pages
      .slice(0, 5)
      .map(p => `## ${p.title}\n${p.meta.description || ''}\n${p.content.slice(0, 2000)}`)
      .join('\n\n---\n\n');
    
    // Use GPT-4o for quick analysis
    const openai = getOpenAI();
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are analyzing a company website to provide quick, actionable insights. Be concise and practical.

Output a JSON object with this structure:
{
  "companyName": "the company name",
  "description": "one sentence about what the company does",
  "keyOfferings": ["product/service 1", "product/service 2", "product/service 3"],
  "targetAudience": "who they serve in one phrase",
  "suggestedActions": ["specific action 1 to help launch/grow", "specific action 2", "specific action 3"]
}

For suggestedActions, think about what would help this business grow:
- If they sell products: suggest marketing strategies, CRM setup, etc.
- If they offer services: suggest lead generation, content marketing, etc.
- Always be specific to their industry and offerings.`,
        },
        {
          role: 'user',
          content: `Analyze this website and provide quick insights:\n\nURL: ${websiteUrl}\n\n${contentSummary}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });
    
    const analysisText = response.choices[0]?.message?.content;
    if (!analysisText) {
      throw new Error('No response from AI');
    }
    
    const analysis = JSON.parse(analysisText) as Omit<QuickWebsiteInsights, 'websiteUrl'>;
    
    logger.info('Quick website analysis complete', { 
      url: websiteUrl,
      companyName: analysis.companyName,
    });
    
    return {
      ...analysis,
      websiteUrl,
    };
  } catch (error) {
    logger.error('Quick website analysis failed', { url: websiteUrl, error });
    return null;
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
