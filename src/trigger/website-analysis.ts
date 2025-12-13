/**
 * Website Analysis Background Job
 * 
 * Crawls and analyzes company websites to extract business intelligence
 * for Neptune AI personalization.
 * 
 * Uses serverless-compatible lite crawler (no Playwright dependency).
 */

import { task } from "@trigger.dev/sdk/v3";
import { logger } from "@/lib/logger";
import { analyzeWebsiteFull } from "@/lib/ai/website-analyzer";

/**
 * Analyze Company Website Task
 * Crawls a website and extracts business intelligence using serverless-compatible methods
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
    const startTime = Date.now();
    const { url, workspaceId, userId, pageLimit = 50 } = payload;

    logger.info('Starting website analysis (serverless)', { 
      url, 
      workspaceId, 
      pageLimit,
      userId 
    });

    try {
      // Use analyzeWebsiteFull which uses lite crawler (serverless-compatible)
      // This replaces the Playwright-based crawlWebsite
      const analysis = await analyzeWebsiteFull(url, {
        maxPages: pageLimit,
        saveToDb: true,
        workspaceId,
      });

      if (!analysis) {
        logger.warn('Website analysis returned null', { url, workspaceId });
        return {
          success: false,
          error: 'No pages could be crawled from the website or analysis failed',
        };
      }

      const duration = Date.now() - startTime;
      logger.info('Website analysis complete', {
        workspaceId,
        companyName: analysis.companyName,
        duration: `${duration}ms`,
      });

      return {
        success: true,
        companyName: analysis.companyName,
        analysis,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Website analysis failed', { 
        url, 
        workspaceId, 
        error,
        duration: `${duration}ms`
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});
