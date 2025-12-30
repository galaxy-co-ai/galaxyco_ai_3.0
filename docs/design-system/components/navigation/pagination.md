# Pagination

**Version 1.0.0**

A navigation component for splitting content across multiple pages. Pagination allows users to navigate through large datasets or content collections.

---

## Table of Contents

- [Overview](#overview)
- [Anatomy](#anatomy)
- [Components](#components)
- [Variants](#variants)
- [States](#states)
- [Usage Guidelines](#usage-guidelines)
- [Content Standards](#content-standards)
- [Accessibility](#accessibility)
- [Implementation](#implementation)
- [Examples](#examples)

---

## Overview

### When to Use
- **Large datasets**: Tables with 25+ rows
- **Search results**: Multi-page result sets
- **Content lists**: Blog posts, products, articles
- **Infinite scroll alternative**: User-controlled paging
- **Known total pages**: When you can calculate total pages

### When Not to Use
- **Small datasets**: < 25 items (show all)
- **Real-time feeds**: Use infinite scroll instead
- **Unknown total**: Use "Load More" button
- **Single page content**: No pagination needed

---

## Anatomy

```
┌─────────────────────────────────────────────────────┐
│  < Previous   1   2   3   ...   10   Next >         │ ← Pagination (nav)
│      │        │   │   │    │     │     │            │
│      │        │   │   │    │     │     └─ PaginationNext
│      │        │   │   │    │     └─ PaginationLink (page 10)
│      │        │   │   │    └─ PaginationEllipsis
│      │        │   │   └─ PaginationLink (page 3)
│      │        │   └─ PaginationLink (active, page 2)
│      │        └─ PaginationLink (page 1)
│      └─ PaginationPrevious
└─────────────────────────────────────────────────────┘
```

**Component Parts:**
1. **Pagination** - Nav container (`<nav>` with role and aria-label)
2. **PaginationContent** - Unordered list (`<ul>`)
3. **PaginationItem** - List item (`<li>`)
4. **PaginationLink** - Page number link
5. **PaginationPrevious** - Previous page button
6. **PaginationNext** - Next page button
7. **PaginationEllipsis** - Skipped pages indicator (`...`)

---

## Components

### Pagination (Root)

The root navigation container.

```typescript
<Pagination>
  <PaginationContent>
    {/* pagination items */}
  </PaginationContent>
</Pagination>
```

**Props:**
- Extends `React.ComponentProps<"nav">`
- `role="navigation"`
- `aria-label="pagination"`

### PaginationContent

The list container for pagination items.

```typescript
<PaginationContent>
  <PaginationItem>...</PaginationItem>
</PaginationContent>
```

**Design tokens:**
- Display: `flex flex-row items-center`
- Gap: `gap-1` (4px between items)

### PaginationItem

Wrapper for pagination links.

```typescript
<PaginationItem>
  <PaginationLink href="/page/2">2</PaginationLink>
</PaginationItem>
```

### PaginationLink

Individual page link.

```typescript
<PaginationLink href="/page/2">2</PaginationLink>

// Active page
<PaginationLink href="/page/2" isActive>
  2
</PaginationLink>
```

**Props:**
- `isActive?: boolean` - Current page indicator
- `size?: "default" | "sm" | "lg" | "icon"` - Button size (default: `"icon"`)
- `href?: string` - Link destination

**Design tokens:**
- Default: `buttonVariants({ variant: "ghost", size: "icon" })`
- Active: `buttonVariants({ variant: "outline", size: "icon" })`
- Size: `size-9` (36×36px)

**ARIA:**
- `aria-current="page"` when `isActive={true}`

### PaginationPrevious

Previous page navigation button.

```typescript
<PaginationPrevious href="/page/1" />
```

**Features:**
- Shows ChevronLeft icon
- Label "Previous" (hidden on mobile with `hidden sm:block`)
- `aria-label="Go to previous page"`

### PaginationNext

Next page navigation button.

```typescript
<PaginationNext href="/page/3" />
```

**Features:**
- Shows ChevronRight icon
- Label "Next" (hidden on mobile)
- `aria-label="Go to next page"`

### PaginationEllipsis

Skipped pages indicator.

```typescript
<PaginationEllipsis />
```

**Features:**
- Shows MoreHorizontal icon (`...`)
- `aria-hidden="true"` (presentational)
- `sr-only` text "More pages" for screen readers

---

## Variants

### Basic Pagination
```typescript
<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="#" />
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">1</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#" isActive>2</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">3</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationNext href="#" />
    </PaginationItem>
  </PaginationContent>
</Pagination>
```

### With Ellipsis
```typescript
<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="#" />
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">1</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#" isActive>2</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">3</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationEllipsis />
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">10</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationNext href="#" />
    </PaginationItem>
  </PaginationContent>
</Pagination>
```

---

## States

### Default
- Ghost variant on page numbers
- Outline variant on active page

### Hover
- Background changes to accent color

### Active
- Current page has outline border
- `aria-current="page"` attribute

### Disabled
- Previous disabled on first page
- Next disabled on last page

---

## Usage Guidelines

### ✅ Do's

- **Show 5-7 page links**: Keep pagination compact
  ```typescript
  ✅ < 1 2 [3] 4 5 ... 10 >
  ❌ < 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 > (too many)
  ```

- **Use ellipsis for large gaps**: Collapse middle pages
  ```typescript
  ✅ < 1 2 [3] 4 5 ... 99 100 >
  ❌ < 1 2 [3] 4 5 6 7 8 ... 96 97 98 99 100 >
  ```

- **Disable navigation at boundaries**: No previous on page 1, no next on last page
  ```typescript
  ✅ Page 1: [Previous disabled] 1 2 3 Next
  ✅ Last page: Previous 8 9 10 [Next disabled]
  ```

- **Show total pages or results**: Help users understand scope
  ```typescript
  ✅ "Page 3 of 10" or "Showing 21-30 of 95 results"
  ```

- **Preserve query parameters**: Maintain filters, search, sort
  ```typescript
  ✅ /products?category=laptops&page=2
  ❌ /products?page=2 (lost category filter)
  ```

### ❌ Don'ts

- **Don't show pagination for small datasets**: < 25 items don't need it
  ```typescript
  ❌ Pagination for 15 items (show all instead)
  ```

- **Don't use with infinite scroll**: Choose one pattern
  ```typescript
  ❌ Pagination + "Load More" button (confusing)
  ```

- **Don't omit first/last pages**: Always show page 1 and last page
  ```typescript
  ❌ < ... 5 6 [7] 8 9 ... > (where's page 1?)
  ✅ < 1 ... 5 6 [7] 8 9 ... 20 >
  ```

- **Don't make current page clickable**: It's non-interactive
  ```typescript
  ❌ <PaginationLink href="/page/3" isActive>3</PaginationLink>
  ✅ <PaginationLink isActive>3</PaginationLink> (no href)
  ```

---

## Content Standards

### Labels
- **Previous**: "Previous" or "← Previous"
- **Next**: "Next" or "Next →"
- **Page numbers**: Just the number (e.g., "1", "2", "3")
- **Ellipsis**: "..." (three dots)

### ARIA Labels
- Previous: `aria-label="Go to previous page"`
- Next: `aria-label="Go to next page"`
- Active page: `aria-current="page"`
- Ellipsis: `aria-hidden="true"` with `sr-only` "More pages"

---

## Accessibility

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Focus next pagination link |
| `Shift + Tab` | Focus previous pagination link |
| `Enter` | Navigate to focused page |

### Screen Reader Support

**ARIA attributes (automatic):**
- `<nav role="navigation" aria-label="pagination">` on root
- `aria-current="page"` on active page
- `aria-label="Go to previous page"` on Previous
- `aria-label="Go to next page"` on Next
- `aria-hidden="true"` on ellipsis

**Announcement example:**
```
"Navigation pagination, list, Go to previous page link, Page 1 link, Page 2, current page, Page 3 link, More pages, Page 10 link, Go to next page link"
```

### Best Practices

1. **Focus visible**: All links have visible focus indicators
2. **Touch targets**: Minimum 44×44px on mobile (36×36px + padding)
3. **Color contrast**: Text meets 4.5:1 ratio
4. **Semantic HTML**: Use `<nav>` with proper ARIA

---

## Implementation

### Installation

```bash
npm install lucide-react
```

### Basic Implementation

```typescript
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";

export function BasicPagination() {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" isActive>2</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
```

---

## Examples

### Example 1: Simple Pagination (Few Pages)

```typescript
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";

export function SimplePagination({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious 
            href={currentPage > 1 ? `?page=${currentPage - 1}` : undefined}
            aria-disabled={currentPage === 1}
          />
        </PaginationItem>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <PaginationItem key={page}>
            <PaginationLink 
              href={`?page=${page}`}
              isActive={page === currentPage}
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext 
            href={currentPage < totalPages ? `?page=${currentPage + 1}` : undefined}
            aria-disabled={currentPage === totalPages}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
```

### Example 2: With Ellipsis (Many Pages)

```typescript
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination";

export function EllipsisPagination({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href={currentPage > 1 ? `?page=${currentPage - 1}` : undefined} />
        </PaginationItem>
        
        <PaginationItem>
          <PaginationLink href="?page=1" isActive={currentPage === 1}>
            1
          </PaginationLink>
        </PaginationItem>

        {currentPage > 3 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}

        {currentPage > 2 && (
          <PaginationItem>
            <PaginationLink href={`?page=${currentPage - 1}`}>
              {currentPage - 1}
            </PaginationLink>
          </PaginationItem>
        )}

        {currentPage !== 1 && currentPage !== totalPages && (
          <PaginationItem>
            <PaginationLink href={`?page=${currentPage}`} isActive>
              {currentPage}
            </PaginationLink>
          </PaginationItem>
        )}

        {currentPage < totalPages - 1 && (
          <PaginationItem>
            <PaginationLink href={`?page=${currentPage + 1}`}>
              {currentPage + 1}
            </PaginationLink>
          </PaginationItem>
        )}

        {currentPage < totalPages - 2 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}

        <PaginationItem>
          <PaginationLink href={`?page=${totalPages}`} isActive={currentPage === totalPages}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>

        <PaginationItem>
          <PaginationNext href={currentPage < totalPages ? `?page=${currentPage + 1}` : undefined} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
```

### Example 3: With Item Count Display

```typescript
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";

export function PaginationWithCount({ 
  currentPage, 
  totalPages, 
  itemsPerPage,
  totalItems 
}: { 
  currentPage: number; 
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
}) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-muted-foreground">
        Showing {startItem}-{endItem} of {totalItems} results
      </p>
      
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href={currentPage > 1 ? `?page=${currentPage - 1}` : undefined} />
          </PaginationItem>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
            <PaginationItem key={page}>
              <PaginationLink href={`?page=${page}`} isActive={page === currentPage}>
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext href={currentPage < totalPages ? `?page=${currentPage + 1}` : undefined} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
```

### Example 4: Client-Side Pagination Hook

```typescript
"use client";

import { useState } from "react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";

export function usePagination<T>(items: T[], itemsPerPage: number) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);

  return {
    currentPage,
    totalPages,
    currentItems,
    setCurrentPage,
    nextPage: () => setCurrentPage((p) => Math.min(p + 1, totalPages)),
    prevPage: () => setCurrentPage((p) => Math.max(p - 1, 1)),
  };
}

export function ClientSidePagination<T>({ items, renderItem }: { items: T[]; renderItem: (item: T) => React.ReactNode }) {
  const { currentPage, totalPages, currentItems, setCurrentPage, nextPage, prevPage } = usePagination(items, 10);

  return (
    <div>
      <div className="space-y-4">
        {currentItems.map((item, index) => (
          <div key={index}>{renderItem(item)}</div>
        ))}
      </div>

      <Pagination className="mt-8">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious onClick={prevPage} aria-disabled={currentPage === 1} />
          </PaginationItem>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <PaginationItem key={page}>
              <PaginationLink onClick={() => setCurrentPage(page)} isActive={page === currentPage}>
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext onClick={nextPage} aria-disabled={currentPage === totalPages} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
```

### Example 5: Server Component (Next.js App Router)

```typescript
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination";

interface PageProps {
  searchParams: { page?: string };
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = 20;
  
  const products = await fetchProducts(currentPage, itemsPerPage);
  const totalPages = Math.ceil(products.total / itemsPerPage);

  return (
    <div>
      <div className="grid grid-cols-4 gap-4">
        {products.items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <Pagination className="mt-8">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              href={currentPage > 1 ? `?page=${currentPage - 1}` : undefined}
            />
          </PaginationItem>
          
          <PaginationItem>
            <PaginationLink href="?page=1" isActive={currentPage === 1}>
              1
            </PaginationLink>
          </PaginationItem>

          {currentPage > 3 && <PaginationItem><PaginationEllipsis /></PaginationItem>}

          {currentPage > 2 && currentPage < totalPages && (
            <PaginationItem>
              <PaginationLink href={`?page=${currentPage}`} isActive>
                {currentPage}
              </PaginationLink>
            </PaginationItem>
          )}

          {currentPage < totalPages - 2 && <PaginationItem><PaginationEllipsis /></PaginationItem>}

          {totalPages > 1 && (
            <PaginationItem>
              <PaginationLink href={`?page=${totalPages}`} isActive={currentPage === totalPages}>
                {totalPages}
              </PaginationLink>
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationNext 
              href={currentPage < totalPages ? `?page=${currentPage + 1}` : undefined}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
```

### Example 6: Table Pagination

```typescript
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function TableWithPagination({ data, currentPage, totalPages }: { 
  data: any[]; 
  currentPage: number; 
  totalPages: number;
}) {
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.email}</TableCell>
              <TableCell>{row.role}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href={`?page=${currentPage - 1}`} />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink href={`?page=${page}`} isActive={page === currentPage}>
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext href={`?page=${currentPage + 1}`} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
```

### Example 7: Mobile-Friendly Pagination

```typescript
"use client";

import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination";
import { useMediaQuery } from "@/hooks/use-media-query";

export function ResponsivePagination({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (isMobile) {
    // Mobile: Show only prev/next and current page
    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href={currentPage > 1 ? `?page=${currentPage - 1}` : undefined} />
          </PaginationItem>
          <PaginationItem>
            <span className="flex size-9 items-center justify-center text-sm">
              {currentPage} / {totalPages}
            </span>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href={currentPage < totalPages ? `?page=${currentPage + 1}` : undefined} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  }

  // Desktop: Full pagination
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href={currentPage > 1 ? `?page=${currentPage - 1}` : undefined} />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=1" isActive={currentPage === 1}>1</PaginationLink>
        </PaginationItem>
        {currentPage > 3 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
        {currentPage > 2 && currentPage < totalPages && (
          <PaginationItem>
            <PaginationLink href={`?page=${currentPage}`} isActive>{currentPage}</PaginationLink>
          </PaginationItem>
        )}
        {currentPage < totalPages - 2 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
        {totalPages > 1 && (
          <PaginationItem>
            <PaginationLink href={`?page=${totalPages}`} isActive={currentPage === totalPages}>
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        )}
        <PaginationItem>
          <PaginationNext href={currentPage < totalPages ? `?page=${currentPage + 1}` : undefined} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
```

### Example 8: Pagination with Per-Page Selector

```typescript
"use client";

import { useState } from "react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function PaginationWithPerPage({ totalItems }: { totalItems: number }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Rows per page:</span>
        <Select
          value={String(itemsPerPage)}
          onValueChange={(value) => {
            setItemsPerPage(Number(value));
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              aria-disabled={currentPage === 1}
            />
          </PaginationItem>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
            <PaginationItem key={page}>
              <PaginationLink 
                onClick={() => setCurrentPage(page)}
                isActive={page === currentPage}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext 
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              aria-disabled={currentPage === totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
```

---

**Related Components:**
- [Table](../data/table.md) - Data tables with pagination
- [Button](../actions/button.md) - Button variants used in pagination
- [Select](../inputs/select.md) - Per-page selector

**Design Tokens:**
- [Colors](../../tokens/colors.md)
- [Spacing](../../tokens/spacing.md)
- [Typography](../../tokens/typography.md)
