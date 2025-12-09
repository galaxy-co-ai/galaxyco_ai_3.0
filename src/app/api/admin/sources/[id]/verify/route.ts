import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { articleSources } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

/**
 * POST /api/admin/sources/[id]/verify
 * Verify a source by checking if the URL is accessible and contains relevant content
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get source
    const source = await db.query.articleSources.findFirst({
      where: eq(articleSources.id, id),
    });

    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    if (!source.url) {
      return NextResponse.json(
        { error: 'Source has no URL to verify' },
        { status: 400 }
      );
    }

    logger.info('Verifying source', { sourceId: id, url: source.url });

    let verified = false;
    let verificationNotes = '';

    try {
      // Step 1: Check if URL is accessible
      const response = await fetch(source.url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GalaxyCo-SourceVerifier/1.0)',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        verificationNotes = `URL returned status ${response.status}`;
      } else {
        // Step 2: Try to fetch content and check for relevance
        const contentResponse = await fetch(source.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; GalaxyCo-SourceVerifier/1.0)',
          },
          redirect: 'follow',
        });

        if (contentResponse.ok) {
          const contentType = contentResponse.headers.get('content-type') || '';
          
          if (contentType.includes('text/html')) {
            const html = await contentResponse.text();
            
            // Check if the page contains the title or relevant content
            const titleLower = source.title.toLowerCase();
            const htmlLower = html.toLowerCase();
            
            // Simple relevance check - page should contain parts of the source title
            const titleWords = titleLower.split(' ').filter((w: string) => w.length > 3);
            const matchingWords = titleWords.filter((word: string) => htmlLower.includes(word));
            const matchRatio = matchingWords.length / titleWords.length;

            if (matchRatio >= 0.5) {
              verified = true;
              verificationNotes = `URL accessible and contains relevant content (${Math.round(matchRatio * 100)}% title match)`;
            } else {
              verificationNotes = `URL accessible but content relevance is low (${Math.round(matchRatio * 100)}% title match)`;
            }
          } else if (contentType.includes('application/pdf')) {
            // PDF - mark as verified but note it's a PDF
            verified = true;
            verificationNotes = 'URL accessible (PDF document)';
          } else {
            verified = true;
            verificationNotes = `URL accessible (${contentType})`;
          }
        } else {
          verificationNotes = `Could not fetch content: ${contentResponse.status}`;
        }
      }
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : 'Unknown error';
      verificationNotes = `Verification failed: ${message}`;
    }

    // Update source
    const [updatedSource] = await db
      .update(articleSources)
      .set({
        verified,
        verificationStatus: verified ? 'verified' : 'failed',
        verificationMethod: 'url_check',
        verificationNotes,
        verifiedAt: verified ? new Date() : null,
      })
      .where(eq(articleSources.id, id))
      .returning();

    logger.info('Source verification complete', {
      sourceId: id,
      verified,
      notes: verificationNotes,
    });

    return NextResponse.json(updatedSource);
  } catch (error) {
    logger.error('Error verifying source', error);
    return NextResponse.json(
      { error: 'Failed to verify source' },
      { status: 500 }
    );
  }
}

