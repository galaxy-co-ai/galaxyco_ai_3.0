/**
 * Creator Templates API
 * 
 * GET /api/creator/templates - List available templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { creatorTemplates } from '@/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build where conditions
    const whereConditions = [];
    
    if (type) {
      whereConditions.push(eq(creatorTemplates.type, type));
    }
    
    if (category) {
      whereConditions.push(eq(creatorTemplates.category, category));
    }

    // Get templates
    const templates = await db.query.creatorTemplates.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      orderBy: [desc(creatorTemplates.usageCount), desc(creatorTemplates.createdAt)],
      limit,
      offset,
    });

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(creatorTemplates)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);
    
    const total = countResult[0]?.count || 0;

    // Get available categories
    const categoriesResult = await db
      .selectDistinct({ category: creatorTemplates.category })
      .from(creatorTemplates)
      .where(sql`${creatorTemplates.category} IS NOT NULL`);
    
    const categories = categoriesResult
      .map(c => c.category)
      .filter((c): c is string => c !== null);

    // Get available types
    const typesResult = await db
      .selectDistinct({ type: creatorTemplates.type })
      .from(creatorTemplates);
    
    const types = typesResult.map(t => t.type);

    return NextResponse.json({
      templates: templates.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        type: template.type,
        category: template.category,
        thumbnail: template.thumbnail,
        isPremium: template.isPremium,
        usageCount: template.usageCount,
        createdAt: template.createdAt,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + templates.length < total,
      },
      filters: {
        categories,
        types,
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Creator Templates GET error');
  }
}
