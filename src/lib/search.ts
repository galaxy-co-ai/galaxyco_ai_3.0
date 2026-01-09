/**
 * Web Search Integration
 * Supports Perplexity AI (primary) and Google Custom Search (fallback)
 * Used for lead intelligence, news enrichment, and real-time web browsing
 */

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
  formattedUrl: string;
  htmlSnippet?: string;
  pagemap?: {
    cse_image?: Array<{ src: string }>;
    metatags?: Array<Record<string, string>>;
  };
}

export interface PerplexitySearchResult {
  answer?: string;
  citations?: Array<{
    title: string;
    url: string;
    snippet?: string;
  }>;
  sources?: Array<{
    title: string;
    url: string;
    snippet?: string;
  }>;
}

/**
 * Search the web using Perplexity AI API (primary) or Google Custom Search (fallback)
 * Perplexity provides real-time web browsing and better AI-powered results
 */
export async function searchWeb(
  query: string,
  options?: {
    numResults?: number;
    siteSearch?: string;
    dateRestrict?: string;
  }
): Promise<SearchResult[]> {
  const { logger } = await import('@/lib/logger');

  // Check if Perplexity API key is configured
  const hasPerplexityKey = !!process.env.PERPLEXITY_API_KEY;
  const perplexityKeyPrefix = process.env.PERPLEXITY_API_KEY?.substring(0, 10) || 'not set';

  logger.info('searchWeb called', {
    query,
    hasPerplexityKey,
    keyPrefix: perplexityKeyPrefix,
    hasGoogleKey: !!process.env.GOOGLE_CUSTOM_SEARCH_API_KEY,
  });

  // Try Perplexity first (better for real-time browsing and AI-powered results)
  if (hasPerplexityKey) {
    try {
      logger.info('Attempting Perplexity search', {
        query,
        keyLength: process.env.PERPLEXITY_API_KEY?.length,
      });
      const result = await searchWebWithPerplexity(query, options);
      logger.info('Perplexity search succeeded', { resultCount: result.length });
      return result;
    } catch (error) {
      // Fall back to Google if Perplexity fails
      logger.warn('Perplexity search failed, falling back to Google', {
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        query,
      });
      // Don't return here - continue to Google fallback
    }
  } else {
    logger.warn('Perplexity API key not found in environment', {
      envKeys: Object.keys(process.env).filter(
        (k) => k.includes('PERPLEXITY') || k.includes('SEARCH')
      ),
    });
  }

  // Fallback to Google Custom Search
  if (process.env.GOOGLE_CUSTOM_SEARCH_API_KEY && process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID) {
    try {
      logger.info('Falling back to Google Custom Search', { query });
      return await searchWebWithGoogle(query, options);
    } catch (error) {
      logger.error('Google search also failed', {
        error: error instanceof Error ? error.message : String(error),
        query,
      });
      throw error; // Re-throw if both fail
    }
  }

  // If we get here, Perplexity failed and Google isn't configured
  logger.error('Both Perplexity and Google search failed or not configured', {
    hasPerplexityKey: !!process.env.PERPLEXITY_API_KEY,
    hasGoogleKey: !!process.env.GOOGLE_CUSTOM_SEARCH_API_KEY,
    hasGoogleEngineId: !!process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID,
  });

  throw new Error(
    'No search API configured or both APIs failed. Please set PERPLEXITY_API_KEY or GOOGLE_CUSTOM_SEARCH_API_KEY'
  );
}

/**
 * Search the web using Google Custom Search API (fallback)
 */
async function searchWebWithGoogle(
  query: string,
  options?: {
    numResults?: number;
    siteSearch?: string;
    dateRestrict?: string;
  }
): Promise<SearchResult[]> {
  if (!process.env.GOOGLE_CUSTOM_SEARCH_API_KEY) {
    throw new Error('GOOGLE_CUSTOM_SEARCH_API_KEY not configured');
  }

  if (!process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID) {
    throw new Error('GOOGLE_CUSTOM_SEARCH_ENGINE_ID not configured');
  }

  const params = new URLSearchParams({
    key: process.env.GOOGLE_CUSTOM_SEARCH_API_KEY,
    cx: process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID,
    q: query,
    num: (options?.numResults ?? 5).toString(),
  });

  if (options?.siteSearch) {
    params.append('siteSearch', options.siteSearch);
  }

  if (options?.dateRestrict) {
    params.append('dateRestrict', options.dateRestrict);
  }

  const response = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`);

  if (!response.ok) {
    throw new Error(`Google Search API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.items || [];
}

/**
 * Search the web using Perplexity AI API
 * Provides real-time web browsing and AI-powered search results
 */
async function searchWebWithPerplexity(
  query: string,
  options?: {
    numResults?: number;
    siteSearch?: string;
    dateRestrict?: string;
  }
): Promise<SearchResult[]> {
  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY not configured');
  }

  const { logger } = await import('@/lib/logger');
  logger.info('Using Perplexity AI for web search', {
    query,
    numResults: options?.numResults,
    hasApiKey: !!process.env.PERPLEXITY_API_KEY,
  });

  // Build query with optional site restriction
  let searchQuery = query;
  if (options?.siteSearch) {
    searchQuery = `site:${options.siteSearch} ${query}`;
  }

  // Map date restrictions to Perplexity format
  let searchRecencyFilter = 'month'; // default
  if (options?.dateRestrict) {
    if (options.dateRestrict.startsWith('d')) {
      const days = parseInt(options.dateRestrict.substring(1));
      if (days <= 7) searchRecencyFilter = 'week';
      else if (days <= 1) searchRecencyFilter = 'day';
      else if (days <= 30) searchRecencyFilter = 'month';
      else searchRecencyFilter = 'year';
    }
  }

  // Use Perplexity's chat completions API for web search
  // Try "sonar-pro" first (best quality), fall back to "sonar" if not available
  let model = 'sonar-pro'; // Online model for real-time web browsing

  let response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: searchQuery,
        },
      ],
      return_citations: true,
      return_related_questions: false,
      search_domain_filter: options?.siteSearch ? [options.siteSearch] : undefined,
      search_recency_filter: searchRecencyFilter,
      temperature: 0.2, // Lower temperature for more factual results
    }),
  });

  // If sonar-pro fails (e.g., not available on free tier), try sonar
  if (!response.ok && model === 'sonar-pro') {
    const _errorData = await response.json().catch(() => ({}));
    // If it's a model not found error, try the regular sonar model
    if (response.status === 400 || response.status === 404) {
      model = 'sonar';
      response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: searchQuery,
            },
          ],
          return_citations: true,
          return_related_questions: false,
          search_domain_filter: options?.siteSearch ? [options.siteSearch] : undefined,
          search_recency_filter: searchRecencyFilter,
          temperature: 0.2,
        }),
      });
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Perplexity API request failed', {
      status: response.status,
      statusText: response.statusText,
      errorText: errorText.substring(0, 500),
      model,
      query: searchQuery.substring(0, 100),
    });
    throw new Error(`Perplexity API error: ${response.status} - ${errorText.substring(0, 200)}`);
  }

  const data = await response.json();

  // Extract the answer and search results from Perplexity response
  // Perplexity uses search_results array, not citations
  const answer = data.choices?.[0]?.message?.content || '';
  const searchResults = data.search_results || [];

  logger.info('Perplexity search completed', {
    model,
    answerLength: answer.length,
    searchResultsCount: searchResults.length,
    hasAnswer: !!answer,
    responseKeys: Object.keys(data),
  });

  // Convert Perplexity search_results to our SearchResult format
  const results: SearchResult[] = searchResults
    .slice(0, options?.numResults || 5)
    .map((source: any, index: number) => {
      try {
        const url = source.url || source.link || '';
        return {
          title: source.title || `Source ${index + 1}`,
          link: url,
          snippet: source.snippet || source.text || source.description || answer.substring(0, 200),
          displayLink: url ? new URL(url).hostname : 'perplexity.ai',
          formattedUrl: url,
        };
      } catch {
        return {
          title: source.title || `Source ${index + 1}`,
          link: source.url || '',
          snippet: answer.substring(0, 200),
          displayLink: 'perplexity.ai',
          formattedUrl: source.url || '',
        };
      }
    });

  // If we have an answer but no search results, create a result from the answer
  // This is important - Perplexity might return just an answer without sources
  if (answer && results.length === 0) {
    logger.info('Perplexity returned answer but no search results, creating result from answer');
    results.push({
      title: 'AI-Powered Answer from Perplexity',
      link: '',
      snippet: answer.substring(0, 1000), // Use more of the answer
      displayLink: 'perplexity.ai',
      formattedUrl: '',
    });
  }

  // If we have both answer and search results, enhance the first result with the answer
  if (answer && results.length > 0) {
    // Add answer as additional context to first result
    results[0].snippet = `${answer.substring(0, 500)}\n\n--- Sources ---\n${results[0].snippet}`;
  }

  // If we have no answer and no results, something went wrong
  if (!answer && results.length === 0) {
    logger.warn('Perplexity returned no answer and no search results', {
      responseData: JSON.stringify(data).substring(0, 500),
    });
    throw new Error('Perplexity API returned no results or answer');
  }

  logger.info('Returning Perplexity search results', { resultCount: results.length });
  return results;
}

/**
 * Search for company news (for lead intelligence)
 */
export async function searchCompanyNews(
  companyName: string,
  options?: { daysBack?: number }
): Promise<SearchResult[]> {
  const dateRestrict = options?.daysBack ? `d${options.daysBack}` : 'd30';

  return searchWeb(`${companyName} news`, {
    numResults: 10,
    dateRestrict,
  });
}

/**
 * Search for company information
 */
export async function searchCompanyInfo(companyName: string): Promise<SearchResult[]> {
  return searchWeb(`${companyName} company about`, {
    numResults: 5,
  });
}

/**
 * Search within a specific website
 */
export async function searchSite(query: string, site: string): Promise<SearchResult[]> {
  return searchWeb(query, {
    numResults: 10,
    siteSearch: site,
  });
}

/**
 * Extract key information from search results for AI processing
 */
export function extractSearchInsights(results: SearchResult[]): string {
  if (results.length === 0) {
    return 'No search results found.';
  }

  return results
    .map((result, idx) => {
      return `${idx + 1}. ${result.title}\n   ${result.snippet}\n   Source: ${result.link}`;
    })
    .join('\n\n');
}

/**
 * Check if web search is configured
 * Supports both Perplexity (preferred) and Google Custom Search
 */
export function isSearchConfigured(): boolean {
  return !!(
    process.env.PERPLEXITY_API_KEY ||
    (process.env.GOOGLE_CUSTOM_SEARCH_API_KEY && process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID)
  );
}

/**
 * Get the primary search provider name
 */
export function getSearchProvider(): 'perplexity' | 'google' | 'none' {
  if (process.env.PERPLEXITY_API_KEY) {
    return 'perplexity';
  }
  if (process.env.GOOGLE_CUSTOM_SEARCH_API_KEY && process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID) {
    return 'google';
  }
  return 'none';
}
