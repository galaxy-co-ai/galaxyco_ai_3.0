/**
 * Website Analysis Background Job
 * 
 * Crawls and analyzes company websites to extract business intelligence
 * for Neptune AI personalization.
 */

import { task } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/db";
import { workspaceIntelligence } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { crawlWebsite } from "@/lib/website-crawler";
import { analyzeWebsiteContent } from "@/lib/ai/website-analyzer";

/**
 * Analyze Company Website Task
 * Crawls a website and extracts business intelligence
 */
export const analyzeWebsiteTask = task({
  id: "analyze-website",
  retry: {
    maxAttempts: 2,
  },
  run: async (payload: {
    url: string;
    workspaceId: string;
    userId: string;
    pageLimit?: number;
  }) => {
    const { url, workspaceId, userId, pageLimit = 50 } = payload;

    logger.info('Starting website analysis', { url, workspaceId, pageLimit });

    try {
      // Step 1: Crawl the website
      logger.info('Crawling website', { url });
      const pages = await crawlWebsite(url, {
        maxPages: pageLimit,
        maxDepth: 3,
        rateLimitMs: 1000,
        respectRobotsTxt: true,
      });

      if (pages.length === 0) {
        logger.warn('No pages crawled', { url });
        return {
          success: false,
          error: 'No pages could be crawled from the website',
        };
      }

      logger.info('Website crawl complete', { 
        url, 
        pagesCrawled: pages.length 
      });

      // Step 2: Analyze content with AI
      logger.info('Analyzing website content', { url });
      const analysis = await analyzeWebsiteContent(pages, url);

      // Step 3: Save to workspace intelligence
      logger.info('Saving analysis to database', { workspaceId });
      
      // Get or create workspace intelligence record
      const existing = await db.query.workspaceIntelligence.findFirst({
        where: eq(workspaceIntelligence.workspaceId, workspaceId),
      });

      if (existing) {
        // Update existing record
        await db
          .update(workspaceIntelligence)
          .set({
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
            websiteUrl: url,
            websiteAnalyzedAt: new Date(),
            lastUpdated: new Date(),
          })
          .where(eq(workspaceIntelligence.workspaceId, workspaceId));
      } else {
        // Create new record
        await db.insert(workspaceIntelligence).values({
          workspaceId,
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
          websiteUrl: url,
          websiteAnalyzedAt: new Date(),
        });
      }

      logger.info('Website analysis complete', {
        workspaceId,
        companyName: analysis.companyName,
        pagesCrawled: pages.length,
      });

      return {
        success: true,
        companyName: analysis.companyName,
        pagesCrawled: pages.length,
        analysis,
      };
    } catch (error) {
      logger.error('Website analysis failed', { url, workspaceId, error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});
