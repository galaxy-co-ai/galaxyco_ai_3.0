/**
 * Website Analysis API Endpoint
 * 
 * POST: Start website analysis job
 * GET: Check analysis status
 */

import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { createErrorResponse } from '@/lib/api-error-handler';
import { analyzeWebsiteTask } from '@/trigger/website-analysis';
import { db } from '@/lib/db';
import { workspaceIntelligence } from '@/db/schema';
import { eq } from 'drizzle-orm';

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

const analyzeWebsiteSchema = z.object({
  url: z.string().url('Invalid URL format'),
  pageLimit: z.number().int().min(1).max(100).optional().default(50),
  workspaceId: z.string().uuid(),
  userId: z.string(),
});

// ============================================================================
// POST: Start Website Analysis
// ============================================================================

export async function POST(request: Request) {
  try {
    // Get authenticated user and workspace
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspace = await getCurrentWorkspace();
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json().catch(() => ({}));
    const validated = analyzeWebsiteSchema.parse({
      ...body,
      workspaceId: workspace.workspaceId,
      userId: user.id,
    });

    // Validate URL format
    if (!validated.url.startsWith('http://') && !validated.url.startsWith('https://')) {
      return NextResponse.json(
        { error: 'URL must start with http:// or https://' },
        { status: 400 }
      );
    }

    logger.info('Starting website analysis', {
      url: validated.url,
      workspaceId: workspace.workspaceId,
      userId: user.id,
    });

    // Trigger background job
    const run = await analyzeWebsiteTask.trigger({
      url: validated.url,
      workspaceId: workspace.workspaceId,
      userId: user.id,
      pageLimit: validated.pageLimit,
    });

    return NextResponse.json({
      success: true,
      jobId: run.id,
      message: 'Website analysis started',
      status: 'processing',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: `Validation error: ${error.errors.map(e => e.message).join(', ')}` },
        { status: 400 }
      );
    }

    logger.error('Failed to start website analysis', error);
    return createErrorResponse(error, 'Start website analysis error');
  }
}

// ============================================================================
// GET: Check Analysis Status
// ============================================================================

export async function GET(request: Request) {
  try {
    // Get authenticated user and workspace
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspace = await getCurrentWorkspace();
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Get job ID from query params
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (jobId) {
      // Check specific job status (would need Trigger.dev API integration)
      // For now, check if analysis is complete by checking database
      const intelligence = await db.query.workspaceIntelligence.findFirst({
        where: eq(workspaceIntelligence.workspaceId, workspace.workspaceId),
      });

      if (intelligence?.websiteUrl && intelligence.websiteAnalyzedAt) {
        return NextResponse.json({
          success: true,
          status: 'completed',
          companyName: intelligence.companyName,
          analyzedAt: intelligence.websiteAnalyzedAt,
        });
      }

      return NextResponse.json({
        success: true,
        status: 'processing',
        jobId,
      });
    }

    // No job ID - return current analysis status
    const intelligence = await db.query.workspaceIntelligence.findFirst({
      where: eq(workspaceIntelligence.workspaceId, workspace.workspaceId),
    });

    if (intelligence?.websiteUrl && intelligence.websiteAnalyzedAt) {
      return NextResponse.json({
        success: true,
        status: 'completed',
        websiteUrl: intelligence.websiteUrl,
        companyName: intelligence.companyName,
        analyzedAt: intelligence.websiteAnalyzedAt,
        hasAnalysis: true,
      });
    }

    return NextResponse.json({
      success: true,
      status: 'not_started',
      hasAnalysis: false,
    });
  } catch (error) {
    logger.error('Failed to check website analysis status', error);
    return createErrorResponse(error, 'Check website analysis status error');
  }
}
