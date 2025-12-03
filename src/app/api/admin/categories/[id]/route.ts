import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { blogCategories } from '@/db/schema';
import { isSystemAdmin } from '@/lib/auth';
import { eq, and, ne } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Validation schema
const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Get single category
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const isAdmin = await isSystemAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const category = await db.query.blogCategories.findFirst({
      where: eq(blogCategories.id, id),
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    logger.error('Failed to fetch category', { error });
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
  }
}

// PUT - Update category
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const isAdmin = await isSystemAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const existing = await db.query.blogCategories.findFirst({
      where: eq(blogCategories.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const body = await request.json();
    const validationResult = updateCategorySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if slug already exists (for another category)
    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await db.query.blogCategories.findFirst({
        where: and(
          eq(blogCategories.slug, data.slug),
          ne(blogCategories.id, id)
        ),
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'A category with this slug already exists' },
          { status: 409 }
        );
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const [updatedCategory] = await db
      .update(blogCategories)
      .set(updateData)
      .where(eq(blogCategories.id, id))
      .returning();

    logger.info('Blog category updated', { categoryId: id });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    logger.error('Failed to update category', { error });
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// DELETE - Delete category
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const isAdmin = await isSystemAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const existing = await db.query.blogCategories.findFirst({
      where: eq(blogCategories.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    await db.delete(blogCategories).where(eq(blogCategories.id, id));

    logger.info('Blog category deleted', { categoryId: id, name: existing.name });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete category', { error });
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
