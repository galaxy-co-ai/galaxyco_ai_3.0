import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { blogCategories } from '@/db/schema';
import { isSystemAdmin } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Validation schema
const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});

// GET - List all categories
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

    const categories = await db.query.blogCategories.findMany({
      orderBy: (cats, { asc }) => [asc(cats.sortOrder)],
    });

    return NextResponse.json(categories);
  } catch (error) {
    logger.error('Failed to fetch categories', { error });
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST - Create new category
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

    const body = await request.json();
    const validationResult = categorySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if slug already exists
    const existing = await db.query.blogCategories.findFirst({
      where: eq(blogCategories.slug, data.slug),
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A category with this slug already exists' },
        { status: 409 }
      );
    }

    // Create the category
    const [newCategory] = await db
      .insert(blogCategories)
      .values({
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        icon: data.icon || null,
        color: data.color || null,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      })
      .returning();

    logger.info('Blog category created', { categoryId: newCategory.id, name: newCategory.name });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    logger.error('Failed to create category', { error });
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
