Create a database schema change using Drizzle ORM:

## Current Project Uses
- **Drizzle ORM 0.44.7** with Neon PostgreSQL
- Schema file: `src/db/schema.ts`
- Push to database: `npm run db:push`
- Open Studio: `npm run db:studio`

## Adding a New Table

```typescript
// src/db/schema.ts

import { pgTable, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Define the table
export const myNewTable = pgTable('my_new_table', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').notNull().default('active'), // or use enum
  organizationId: text('organization_id').notNull(), // REQUIRED for multi-tenancy
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Define relations (if needed)
export const myNewTableRelations = relations(myNewTable, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [myNewTable.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [myNewTable.createdBy],
    references: [users.id],
  }),
  // Add other relations here
}));

// 3. Add to schema type exports
export type MyNewTable = typeof myNewTable.$inferSelect;
export type NewMyNewTable = typeof myNewTable.$inferInsert;
```

## Adding a Column to Existing Table

```typescript
// src/db/schema.ts

export const existingTable = pgTable('existing_table', {
  // ... existing columns
  
  // Add new column
  newField: text('new_field'), // nullable by default
  // or
  requiredField: text('required_field').notNull().default('default_value'),
});
```

## Creating an Enum

```typescript
// src/db/schema.ts

import { pgEnum } from 'drizzle-orm/pg-core';

// 1. Define enum
export const myStatusEnum = pgEnum('my_status', ['draft', 'active', 'archived']);

// 2. Use in table
export const myTable = pgTable('my_table', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  status: myStatusEnum('status').notNull().default('draft'),
  // ... other fields
});
```

## Common Field Types

```typescript
// Text fields
text('field_name')                    // VARCHAR (unlimited)
text('field_name', { length: 255 })   // VARCHAR(255)

// Numbers
integer('field_name')                 // INT
bigint('field_name', { mode: 'number' })  // BIGINT
real('field_name')                    // REAL (floating point)

// Booleans
boolean('field_name')                 // BOOLEAN

// Timestamps
timestamp('field_name')               // TIMESTAMP
timestamp('field_name').defaultNow()  // With default
timestamp('field_name', { mode: 'string' })  // Return as ISO string

// JSON
json('field_name')                    // JSON
jsonb('field_name')                   // JSONB (better performance)

// Arrays
text('tags').array()                  // TEXT[]
```

## Multi-Tenancy Pattern (CRITICAL)

**EVERY table MUST have organizationId:**

```typescript
export const myTable = pgTable('my_table', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  // REQUIRED: Multi-tenant isolation
  organizationId: text('organization_id').notNull(),
  
  // REQUIRED: Audit trail
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  
  // Your fields...
});
```

## Migration Process

1. **Edit schema**: Add/modify tables in `src/db/schema.ts`

2. **Push to database**:
   ```bash
   npm run db:push
   ```

3. **Verify in Studio**:
   ```bash
   npm run db:studio
   # Opens http://localhost:4983
   ```

4. **Update seed script** (if needed):
   ```typescript
   // src/scripts/seed.ts
   await db.insert(myNewTable).values([
     {
       id: '1',
       name: 'Example',
       organizationId: org.id,
       createdBy: user.id,
     },
   ]);
   ```

5. **Test queries**:
   ```typescript
   const items = await db.query.myNewTable.findMany({
     where: eq(myNewTable.organizationId, orgId),
   });
   ```

## Common Relations

### One-to-Many
```typescript
// Parent side (has many children)
export const parentTableRelations = relations(parentTable, ({ many }) => ({
  children: many(childTable),
}));

// Child side (belongs to parent)
export const childTableRelations = relations(childTable, ({ one }) => ({
  parent: one(parentTable, {
    fields: [childTable.parentId],
    references: [parentTable.id],
  }),
}));
```

### Many-to-Many
```typescript
// Junction table
export const itemsToTags = pgTable('items_to_tags', {
  itemId: text('item_id').notNull().references(() => items.id),
  tagId: text('tag_id').notNull().references(() => tags.id),
});

// Relations
export const itemsRelations = relations(items, ({ many }) => ({
  itemsToTags: many(itemsToTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  itemsToTags: many(itemsToTags),
}));

export const itemsToTagsRelations = relations(itemsToTags, ({ one }) => ({
  item: one(items, {
    fields: [itemsToTags.itemId],
    references: [items.id],
  }),
  tag: one(tags, {
    fields: [itemsToTags.tagId],
    references: [tags.id],
  }),
}));
```

## Indexes (for performance)

```typescript
import { index } from 'drizzle-orm/pg-core';

export const myTable = pgTable('my_table', {
  // ... columns
}, (table) => ({
  // Index on single column
  orgIdIdx: index('org_id_idx').on(table.organizationId),
  
  // Composite index
  orgStatusIdx: index('org_status_idx').on(table.organizationId, table.status),
  
  // Unique constraint
  emailIdx: index('email_idx').on(table.email).unique(),
}));
```

## Checklist
- [ ] Added organizationId to new tables
- [ ] Added createdBy, createdAt, updatedAt
- [ ] Defined proper relations
- [ ] Created TypeScript types
- [ ] Ran `npm run db:push`
- [ ] Verified in Drizzle Studio
- [ ] Updated seed script (if needed)
- [ ] Tested queries in code
- [ ] Added to relevant API endpoints

