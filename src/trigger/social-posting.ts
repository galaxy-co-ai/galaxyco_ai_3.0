/**
 * Social Media Scheduled Posting Background Job
 * 
 * Executes scheduled social media posts at their scheduled time
 */

import { task, schedules } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/db";
import { socialMediaPosts } from "@/db/schema";
import { eq, and, lte } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { postTweet, getTwitterIntegration } from "@/lib/social/twitter";

/**
 * Process Scheduled Social Media Posts
 * Runs every minute to check for posts that need to be published
 */
async function processScheduledPosts() {
    logger.info('Processing scheduled social media posts');

    // Find posts that are scheduled and due
    const now = new Date();
    const duePosts = await db.query.socialMediaPosts.findMany({
      where: and(
        eq(socialMediaPosts.status, 'scheduled'),
        lte(socialMediaPosts.scheduledFor, now)
      ),
      limit: 50, // Process up to 50 posts per run
    });

    if (duePosts.length === 0) {
      logger.info('No scheduled posts due');
      return { processed: 0, success: 0, failed: 0 };
    }

    logger.info(`Found ${duePosts.length} scheduled posts to process`);

    let successCount = 0;
    let failedCount = 0;

    for (const post of duePosts) {
      try {
        if (post.platform === 'twitter') {
          // Get Twitter integration
          const twitterIntegration = await getTwitterIntegration(post.workspaceId);
          
          if (!twitterIntegration) {
            logger.warn('Twitter integration not found for scheduled post', { postId: post.id });
            await db
              .update(socialMediaPosts)
              .set({
                status: 'failed',
                errorMessage: 'Twitter account not connected',
                updatedAt: new Date(),
              })
              .where(eq(socialMediaPosts.id, post.id));
            failedCount++;
            continue;
          }

          // Post to Twitter
          const result = await postTweet(twitterIntegration.id, post.content);

          if (result.success && result.tweetId) {
            // Update post status
            await db
              .update(socialMediaPosts)
              .set({
                status: 'posted',
                postedAt: new Date(),
                externalPostId: result.tweetId,
                updatedAt: new Date(),
              })
              .where(eq(socialMediaPosts.id, post.id));

            logger.info('Successfully posted scheduled tweet', {
              postId: post.id,
              tweetId: result.tweetId,
            });
            successCount++;
          } else {
            // Update with error
            await db
              .update(socialMediaPosts)
              .set({
                status: 'failed',
                errorMessage: result.error || 'Unknown error',
                retryCount: (post.retryCount || 0) + 1,
                updatedAt: new Date(),
              })
              .where(eq(socialMediaPosts.id, post.id));

            logger.error('Failed to post scheduled tweet', {
              postId: post.id,
              error: result.error,
            });
            failedCount++;
          }
        } else {
          logger.warn('Unsupported platform for scheduled post', {
            postId: post.id,
            platform: post.platform,
          });
          failedCount++;
        }
      } catch (error) {
        logger.error('Error processing scheduled post', {
          postId: post.id,
          error,
        });

        // Update post with error
        await db
          .update(socialMediaPosts)
          .set({
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            retryCount: (post.retryCount || 0) + 1,
            updatedAt: new Date(),
          })
          .where(eq(socialMediaPosts.id, post.id));

        failedCount++;
      }
    }

    logger.info('Completed processing scheduled posts', {
      processed: duePosts.length,
      success: successCount,
      failed: failedCount,
    });

    return {
      processed: duePosts.length,
      success: successCount,
      failed: failedCount,
    };
}

/**
 * Task for processing scheduled posts (can be triggered manually)
 */
export const processScheduledSocialPosts = task({
  id: "process-scheduled-social-posts",
  retry: {
    maxAttempts: 2,
  },
  run: async () => {
    return await processScheduledPosts();
  },
});

/**
 * Scheduled task to run every minute
 */
export const scheduledSocialPosting = schedules.task({
  id: "scheduled-social-posting",
  cron: "*/1 * * * *", // Every minute
  run: async () => {
    return await processScheduledPosts();
  },
});
