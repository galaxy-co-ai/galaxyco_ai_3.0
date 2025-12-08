import { NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/api-error-handler';
import { isSearchConfigured, getSearchProvider, searchWeb } from '@/lib/search';

/**
 * Web Search Debug API
 * GET /api/system/search-debug
 *
 * Returns a quick diagnostic view of Neptune's web search configuration
 * and runs an optional lightweight test query.
 */
export async function GET() {
  try {
    const hasPerplexityKey = !!process.env.PERPLEXITY_API_KEY;
    const hasGoogleKey = !!process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
    const hasGoogleEngineId = !!process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

    const configured = isSearchConfigured();
    const provider = getSearchProvider();

    const base = {
      success: true,
      environment: process.env.NODE_ENV,
      search: {
        configured,
        provider,
        hasPerplexityKey,
        hasGoogleKey,
        hasGoogleEngineId,
      },
    } as const;

    // Optionally run a tiny test query to surface runtime errors
    try {
      if (configured) {
        const results = await searchWeb('latest ai news', { numResults: 1 });
        return NextResponse.json({
          ...base,
          test: {
            ran: true,
            success: true,
            resultCount: results.length,
            firstResult: results[0]
              ? {
                  title: results[0].title,
                  link: results[0].link,
                  provider,
                }
              : null,
          },
        });
      }

      return NextResponse.json({
        ...base,
        test: {
          ran: false,
          success: false,
          error: 'Search is not configured, so no test query was run.',
        },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return NextResponse.json({
        ...base,
        test: {
          ran: true,
          success: false,
          error: errorMessage,
        },
      });
    }
  } catch (error) {
    return createErrorResponse(error, 'Search debug error');
  }
}
