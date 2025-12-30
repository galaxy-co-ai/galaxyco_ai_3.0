import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { getOpenAI } from '@/lib/ai-providers';
import { searchWeb, isSearchConfigured } from '@/lib/search';
import { logger } from '@/lib/logger';
import { expensiveOperationLimit } from '@/lib/rate-limit';
import { createErrorResponse } from '@/lib/api-error-handler';

// Request schema
const findSourceSchema = z.object({
  claim: z.string().min(1).max(2000),
  postId: z.string().uuid().optional(),
  context: z.string().max(5000).optional(), // Additional article context
});

// Source result type
interface FoundSource {
  title: string;
  url: string;
  publication: string;
  snippet: string;
  publishedDate: string | null;
  confidenceScore: number;
  relevantQuote: string | null;
}

/**
 * POST /api/admin/ai/source
 * Find sources for a claim using web search and AI analysis
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return createErrorResponse(new Error('Unauthorized'), 'Find source auth');
    }

    // Rate limiting for expensive AI operation
    const rateLimitResult = await expensiveOperationLimit(`ai-source:${userId}`);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
        }}
      );
    }

    const body = await request.json();
    const validation = findSourceSchema.safeParse(body);
    
    if (!validation.success) {
      return createErrorResponse(new Error('Invalid request: validation failed'), 'Find source validation');
    }

    const { claim, context } = validation.data;

    // Check if search is configured
    if (!isSearchConfigured()) {
      logger.warn('Source search attempted but no search API configured');
      return NextResponse.json({
        sources: [],
        warning: 'Web search is not configured. Please add sources manually or configure PERPLEXITY_API_KEY or GOOGLE_CUSTOM_SEARCH_API_KEY.',
      });
    }

    logger.info('Finding sources for claim', { 
      claimLength: claim.length,
      hasContext: !!context,
    });

    // Step 1: Use AI to extract the key factual assertion
    const openai = getOpenAI();
    
    const extractionResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a fact-checking assistant. Extract the key factual claim from the given text that would benefit from a source citation. Focus on:
- Statistics and numbers
- Historical facts
- Scientific claims
- Attributable quotes
- Industry trends or data

Respond with a JSON object:
{
  "factualClaim": "The specific factual assertion to verify",
  "searchQuery": "An optimized search query to find supporting sources",
  "claimType": "statistic" | "quote" | "historical" | "scientific" | "trend" | "general"
}

If the text is purely opinion or doesn't contain verifiable facts, respond with:
{
  "factualClaim": null,
  "searchQuery": null,
  "claimType": "opinion",
  "reason": "Why this doesn't need a source"
}`,
        },
        {
          role: 'user',
          content: `Text to analyze:\n"${claim}"${context ? `\n\nArticle context:\n${context.substring(0, 500)}` : ''}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const extractionContent = extractionResponse.choices[0]?.message?.content;
    if (!extractionContent) {
      throw new Error('Failed to analyze claim');
    }

    const extraction = JSON.parse(extractionContent);

    // If it's an opinion, return early with a message
    if (!extraction.factualClaim || extraction.claimType === 'opinion') {
      return NextResponse.json({
        sources: [],
        warning: extraction.reason || 'This appears to be an opinion that doesn\'t require a source citation.',
        claimType: 'opinion',
      });
    }

    // Step 2: Search for sources using the optimized query
    const searchResults = await searchWeb(extraction.searchQuery || claim, {
      numResults: 8,
    });

    if (!searchResults || searchResults.length === 0) {
      return NextResponse.json({
        sources: [],
        warning: 'No sources found for this claim. Consider rephrasing or verifying manually.',
        factualClaim: extraction.factualClaim,
      });
    }

    // Step 3: Use AI to analyze search results and score relevance
    const analysisResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a source verification assistant. Analyze the search results to find sources that support the factual claim. Score each source's relevance and reliability.

For each relevant source, provide:
- confidenceScore: 0-1 (how well it supports the claim)
  - 0.8-1.0: Directly supports with matching data/quotes
  - 0.5-0.8: Partially supports or related
  - Below 0.5: Tangentially related
- relevantQuote: Extract the most relevant quote that supports the claim (if available)
- publication: Extract the publication name from the URL or content

IMPORTANT: Only include sources that actually support the claim. Do NOT make up information. If a source doesn't directly support the claim, give it a low score.

Respond with a JSON object:
{
  "sources": [
    {
      "index": 0,
      "confidenceScore": 0.85,
      "relevantQuote": "Exact quote from the source",
      "publication": "Publication name"
    }
  ],
  "overallAssessment": "How well the claim is supported",
  "verified": true/false
}

If no sources adequately support the claim:
{
  "sources": [],
  "overallAssessment": "Why the claim couldn't be verified",
  "verified": false
}`,
        },
        {
          role: 'user',
          content: `Claim to verify: "${extraction.factualClaim}"

Search results:
${searchResults.map((result, idx) => `
[${idx}] ${result.title}
URL: ${result.link}
Snippet: ${result.snippet}
`).join('\n')}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const analysisContent = analysisResponse.choices[0]?.message?.content;
    if (!analysisContent) {
      throw new Error('Failed to analyze search results');
    }

    const analysis = JSON.parse(analysisContent);

    // Step 4: Build the final source list
    const sources: FoundSource[] = [];

    if (analysis.sources && analysis.sources.length > 0) {
      for (const sourceAnalysis of analysis.sources) {
        const searchResult = searchResults[sourceAnalysis.index];
        if (!searchResult) continue;

        // Only include sources with reasonable confidence
        if (sourceAnalysis.confidenceScore < 0.3) continue;

        sources.push({
          title: searchResult.title || 'Unknown Source',
          url: searchResult.link || '',
          publication: sourceAnalysis.publication || searchResult.displayLink || 'Unknown Publication',
          snippet: searchResult.snippet || '',
          publishedDate: extractPublishedDate(searchResult),
          confidenceScore: Math.min(1, Math.max(0, sourceAnalysis.confidenceScore)),
          relevantQuote: sourceAnalysis.relevantQuote || null,
        });
      }
    }

    // Sort by confidence score
    sources.sort((a, b) => b.confidenceScore - a.confidenceScore);

    logger.info('Source search completed', {
      claim: claim.substring(0, 50),
      sourcesFound: sources.length,
      topConfidence: sources[0]?.confidenceScore,
    });

    return NextResponse.json({
      sources,
      factualClaim: extraction.factualClaim,
      claimType: extraction.claimType,
      overallAssessment: analysis.overallAssessment,
      verified: analysis.verified,
    });

  } catch (error) {
    return createErrorResponse(error, 'Find source error');
  }
}

/**
 * Extract published date from search result metadata
 */
function extractPublishedDate(result: { pagemap?: { metatags?: Array<Record<string, string>> } }): string | null {
  try {
    const metatags = result.pagemap?.metatags?.[0];
    if (!metatags) return null;

    // Try various date metadata fields
    const dateFields = [
      'article:published_time',
      'og:published_time',
      'datePublished',
      'date',
      'pubdate',
    ];

    for (const field of dateFields) {
      if (metatags[field]) {
        return metatags[field];
      }
    }

    return null;
  } catch {
    return null;
  }
}

