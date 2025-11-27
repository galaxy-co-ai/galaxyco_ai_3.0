/**
 * Google Custom Search API Integration
 * Used for lead intelligence and news enrichment
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

/**
 * Search the web using Google Custom Search API
 */
export async function searchWeb(
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

  const response = await fetch(
    `https://www.googleapis.com/customsearch/v1?${params}`
  );

  if (!response.ok) {
    throw new Error(`Google Search API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.items || [];
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
export async function searchSite(
  query: string,
  site: string
): Promise<SearchResult[]> {
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











