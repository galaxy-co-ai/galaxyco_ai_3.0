import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { blogVoiceProfiles } from '@/db/schema';
import { isSystemAdmin, getCurrentWorkspace } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Validation schema for voice profile
const voiceProfileSchema = z.object({
  toneDescriptors: z.array(z.string().max(50)).max(10).optional(),
  examplePhrases: z.array(z.string().max(200)).max(20).optional(),
  avoidPhrases: z.array(z.string().max(200)).max(20).optional(),
  avgSentenceLength: z.number().min(5).max(50).optional(),
  structurePreferences: z.object({
    preferredIntroStyle: z.string().max(200).optional(),
    preferredConclusionStyle: z.string().max(200).optional(),
    usesSubheadings: z.boolean().optional(),
    usesBulletPoints: z.boolean().optional(),
    includesCallToAction: z.boolean().optional(),
  }).optional(),
});

// GET - Get voice profile for workspace
export async function GET() {
  try {
    // Check admin access
    const isAdmin = await isSystemAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get workspace context
    let context;
    try {
      context = await getCurrentWorkspace();
    } catch {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    const profile = await db.query.blogVoiceProfiles.findFirst({
      where: eq(blogVoiceProfiles.workspaceId, context.workspace.id),
    });

    if (!profile) {
      // Return default profile structure if none exists
      return NextResponse.json({
        exists: false,
        profile: {
          toneDescriptors: [],
          examplePhrases: [],
          avoidPhrases: [],
          avgSentenceLength: null,
          structurePreferences: {
            preferredIntroStyle: null,
            preferredConclusionStyle: null,
            usesSubheadings: true,
            usesBulletPoints: true,
            includesCallToAction: true,
          },
          analyzedPostCount: 0,
          lastAnalyzedAt: null,
        },
      });
    }

    return NextResponse.json({
      exists: true,
      profile,
    });
  } catch (error) {
    logger.error('Failed to fetch voice profile', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice profile' },
      { status: 500 }
    );
  }
}

// POST - Create or update voice profile
export async function POST(request: NextRequest) {
  try {
    // Check admin access
    const isAdmin = await isSystemAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get workspace context
    let context;
    try {
      context = await getCurrentWorkspace();
    } catch {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validationResult = voiceProfileSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if profile exists
    const existingProfile = await db.query.blogVoiceProfiles.findFirst({
      where: eq(blogVoiceProfiles.workspaceId, context.workspace.id),
    });

    let profile;

    if (existingProfile) {
      // Update existing profile
      [profile] = await db
        .update(blogVoiceProfiles)
        .set({
          toneDescriptors: data.toneDescriptors || existingProfile.toneDescriptors,
          examplePhrases: data.examplePhrases || existingProfile.examplePhrases,
          avoidPhrases: data.avoidPhrases || existingProfile.avoidPhrases,
          avgSentenceLength: data.avgSentenceLength ?? existingProfile.avgSentenceLength,
          structurePreferences: data.structurePreferences || existingProfile.structurePreferences,
          updatedAt: new Date(),
        })
        .where(eq(blogVoiceProfiles.id, existingProfile.id))
        .returning();

      logger.info('Voice profile updated', { 
        profileId: profile.id,
        workspaceId: context.workspace.id 
      });
    } else {
      // Create new profile
      [profile] = await db
        .insert(blogVoiceProfiles)
        .values({
          workspaceId: context.workspace.id,
          toneDescriptors: data.toneDescriptors || [],
          examplePhrases: data.examplePhrases || [],
          avoidPhrases: data.avoidPhrases || [],
          avgSentenceLength: data.avgSentenceLength || null,
          structurePreferences: data.structurePreferences || null,
        })
        .returning();

      logger.info('Voice profile created', { 
        profileId: profile.id,
        workspaceId: context.workspace.id 
      });
    }

    return NextResponse.json({
      exists: true,
      profile,
    }, { status: existingProfile ? 200 : 201 });
  } catch (error) {
    logger.error('Failed to save voice profile', error);
    return NextResponse.json(
      { error: 'Failed to save voice profile' },
      { status: 500 }
    );
  }
}

