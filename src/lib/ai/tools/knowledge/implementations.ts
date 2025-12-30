/**
 * Knowledge Tool Implementations
 *
 * Implementations for knowledge base search, content sources, hit list management,
 * and content analytics tools.
 */
import { logger } from '@/lib/logger';
import type { ToolImplementations, ToolResult } from '../types';

export const knowledgeToolImplementations: ToolImplementations = {
  // search_knowledge
  async search_knowledge(args, context): Promise<ToolResult> {
    try {
      const query = (args.query as string) || '';
      const type = args.type as string | undefined;
      const limit = (args.limit as number) || 5;

      // Use the RAG module for enhanced search with citations
      const { searchKnowledgeBase, formatCitations } = await import('@/lib/ai/rag');

      const ragResults = await searchKnowledgeBase(query, context.workspaceId, {
        topK: limit,
        minScore: 0.5,
        documentType: type,
      });

      if (ragResults.hasResults) {
        // Format documents with citations for RAG
        const documents = ragResults.results.map((r, idx) => ({
          id: r.itemId,
          title: r.title,
          type: r.documentType,
          collection: r.collectionName,
          relevantContent: r.relevantChunk, // The most relevant chunk for RAG
          relevanceScore: Math.round(r.score * 100) + '%',
          sourceUrl: r.sourceUrl,
          citation: `[${idx + 1}]`, // Citation marker
        }));

        // Build a helpful message with citations
        const citationList = formatCitations(ragResults.citations);
        const searchType = ragResults.results[0]?.score > 0.5 ? 'semantic' : 'keyword';

        logger.info('AI search_knowledge (RAG)', {
          query: query.slice(0, 50),
          resultsCount: documents.length,
          searchType,
        });

        return {
          success: true,
          message: `Found ${documents.length} relevant document(s). When answering, cite sources like "According to [1] Document Title..."`,
          data: {
            documents,
            searchType,
            contextForAI: ragResults.contextText, // Inject this into the prompt
            citations: citationList,
          },
        };
      }

      // No results found
      return {
        success: true,
        message: `No documents found matching "${query}". The user may need to upload relevant documents first.`,
        data: {
          documents: [],
          searchType: 'none',
        },
      };
    } catch (error) {
      logger.error('AI search_knowledge failed', error);
      return {
        success: false,
        message: 'Failed to search knowledge base',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // add_content_source
  async add_content_source(args, context): Promise<ToolResult> {
    try {
      const { addContentSource } = await import('@/lib/ai/content-cockpit-handlers');

      const result = await addContentSource(
        { workspaceId: context.workspaceId, userId: context.userId },
        {
          name: args.name as string,
          url: args.url as string,
          description: args.description as string | undefined,
          type: args.type as 'news' | 'research' | 'competitor' | 'inspiration' | 'industry' | 'other' | undefined,
        }
      );

      if (!result.success) {
        return {
          success: false,
          message: result.message,
        };
      }

      return {
        success: true,
        message: result.message,
        data: { sourceId: result.sourceId },
      };
    } catch (error) {
      logger.error('AI add_content_source failed', error);
      return {
        success: false,
        message: 'Failed to add content source. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // add_to_hit_list
  async add_to_hit_list(args, context): Promise<ToolResult> {
    try {
      const { addTopicToHitList } = await import('@/lib/ai/content-cockpit-handlers');

      const result = await addTopicToHitList(
        { workspaceId: context.workspaceId, userId: context.userId },
        {
          title: args.title as string,
          description: args.description as string | undefined,
          whyItWorks: args.whyItWorks as string | undefined,
          category: args.category as string | undefined,
          priority: args.priority as 'low' | 'medium' | 'high' | 'urgent' | undefined,
        }
      );

      if (!result.success) {
        return {
          success: false,
          message: result.message,
        };
      }

      return {
        success: true,
        message: result.message,
        data: { topicId: result.topicId },
      };
    } catch (error) {
      logger.error('AI add_to_hit_list failed', error);
      return {
        success: false,
        message: 'Failed to add topic to hit list. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // get_hit_list_insights
  async get_hit_list_insights(args, context): Promise<ToolResult> {
    try {
      const { getWhatToWriteNext } = await import('@/lib/ai/content-cockpit-handlers');

      const insights = await getWhatToWriteNext({
        workspaceId: context.workspaceId,
        userId: context.userId,
      });

      let message = `**Hit List Insights**\n`;
      message += `- Queued Topics: ${insights.totalQueued}\n`;
      message += `- In Progress: ${insights.inProgress}\n`;
      message += `- Recently Published: ${insights.recentlyPublished}\n\n`;

      if (insights.topPriority) {
        message += `**Top Priority:** "${insights.topPriority.title}"\n`;
        message += `Score: ${insights.topPriority.score}/100\n`;
        message += `${insights.topPriority.reason}\n\n`;
      }

      message += `**Recommendation:** ${insights.recommendation}`;

      return {
        success: true,
        message,
        data: {
          topPriority: insights.topPriority,
          totalQueued: insights.totalQueued,
          inProgress: insights.inProgress,
          recentlyPublished: insights.recentlyPublished,
        },
      };
    } catch (error) {
      logger.error('AI get_hit_list_insights failed', error);
      return {
        success: false,
        message: 'Failed to get hit list insights. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // reprioritize_hit_list
  async reprioritize_hit_list(args, context): Promise<ToolResult> {
    try {
      const { reprioritizeHitList } = await import('@/lib/ai/content-cockpit-handlers');

      const result = await reprioritizeHitList({
        workspaceId: context.workspaceId,
        userId: context.userId,
      });

      return {
        success: result.success,
        message: result.message,
        data: { changesCount: result.changesCount },
      };
    } catch (error) {
      logger.error('AI reprioritize_hit_list failed', error);
      return {
        success: false,
        message: 'Failed to reprioritize hit list. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // get_article_analytics
  async get_article_analytics(args, context): Promise<ToolResult> {
    try {
      const { getContentPerformanceInsights } = await import('@/lib/ai/content-cockpit-handlers');

      const period = (args.period as '7d' | '30d' | '90d') || '30d';
      const insights = await getContentPerformanceInsights(
        { workspaceId: context.workspaceId, userId: context.userId },
        period
      );

      const periodLabel = period === '7d' ? 'Last 7 Days' : period === '90d' ? 'Last 90 Days' : 'Last 30 Days';
      const trendIndicator = insights.trend === 'up' ? 'Increasing' : insights.trend === 'down' ? 'Decreasing' : 'Stable';

      let message = `**Article Analytics (${periodLabel})**\n\n`;
      message += `- Total Views: ${insights.totalViews.toLocaleString()}\n`;
      message += `- Articles Tracked: ${insights.totalArticles}\n`;
      message += `- Trend: ${trendIndicator}\n\n`;

      if (insights.topPerformer) {
        message += `**Top Performer:** "${insights.topPerformer.title}"\n`;
        message += `Views: ${insights.topPerformer.views.toLocaleString()}\n\n`;
      }

      message += `**Recommendation:** ${insights.recommendation}`;

      return {
        success: true,
        message,
        data: {
          totalViews: insights.totalViews,
          totalArticles: insights.totalArticles,
          topPerformer: insights.topPerformer,
          trend: insights.trend,
          recommendation: insights.recommendation,
        },
      };
    } catch (error) {
      logger.error('AI get_article_analytics failed', error);
      return {
        success: false,
        message: 'Failed to get article analytics. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // get_content_insights
  async get_content_insights(args, context): Promise<ToolResult> {
    try {
      const { getAIContentRecommendations } = await import('@/lib/ai/content-cockpit-handlers');

      const suggestions = await getAIContentRecommendations({
        workspaceId: context.workspaceId,
        userId: context.userId,
      });

      if (suggestions.length === 0) {
        return {
          success: true,
          message:
            'No specific recommendations at this time. Try adding some topics to your hit list or publishing content to get personalized insights.',
          data: { suggestions: [] },
        };
      }

      let message = '**Content Recommendations**\n\n';
      suggestions.forEach((s, i) => {
        const typeIndicator =
          s.type === 'article' ? 'Article' : s.type === 'source' ? 'Source' : s.type === 'use_case' ? 'Use Case' : 'Tip';
        message += `${i + 1}. **${s.title}** (${typeIndicator})\n`;
        message += `   ${s.description}\n\n`;
      });

      return {
        success: true,
        message,
        data: { suggestions },
      };
    } catch (error) {
      logger.error('AI get_content_insights failed', error);
      return {
        success: false,
        message: 'Failed to get content insights. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // get_use_case_recommendation
  async get_use_case_recommendation(args, context): Promise<ToolResult> {
    try {
      const { getUseCaseRecommendations } = await import('@/lib/ai/content-cockpit-handlers');

      const description = args.description as string;
      const result = await getUseCaseRecommendations(
        { workspaceId: context.workspaceId, userId: context.userId },
        description
      );

      let message = '';
      if (result.matchedUseCase) {
        message = `**Matched Use Case:** "${result.matchedUseCase.name}"\n`;
        message += `Match Confidence: ${result.matchedUseCase.match}%\n\n`;
        message += `${result.suggestion}`;
      } else {
        message = result.suggestion;
      }

      return {
        success: true,
        message,
        data: { matchedUseCase: result.matchedUseCase },
      };
    } catch (error) {
      logger.error('AI get_use_case_recommendation failed', error);
      return {
        success: false,
        message: 'Failed to get use case recommendations. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // get_source_suggestions
  async get_source_suggestions(args, context): Promise<ToolResult> {
    try {
      const { getSuggestedSources } = await import('@/lib/ai/content-cockpit-handlers');

      const result = await getSuggestedSources({
        workspaceId: context.workspaceId,
        userId: context.userId,
      });

      if (result.count === 0) {
        return {
          success: true,
          message:
            'No source suggestions available at this time. I can discover new sources based on your content topics.',
          data: { suggestions: [], count: 0 },
        };
      }

      let message = `**${result.count} Source Suggestion${result.count > 1 ? 's' : ''}**\n\n`;
      result.suggestions.forEach((s, i) => {
        message += `${i + 1}. **${s.name}**\n`;
        message += `   ${s.url}\n`;
        message += `   ${s.reason}\n\n`;
      });

      message += 'Visit Sources Hub to approve or reject these suggestions.';

      return {
        success: true,
        message,
        data: result,
      };
    } catch (error) {
      logger.error('AI get_source_suggestions failed', error);
      return {
        success: false,
        message: 'Failed to get source suggestions. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
