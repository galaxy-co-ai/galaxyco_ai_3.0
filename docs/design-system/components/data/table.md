# Table

**Version 1.0.0**

Tables display structured data in rows and columns, making it easy to scan, compare, and take action on large datasets.

---

## Table of Contents

- [Overview](#overview)
- [Anatomy](#anatomy)
- [Components](#components)
- [Options](#options)
- [Behaviors](#behaviors)
- [Usage Guidelines](#usage-guidelines)
- [Content Standards](#content-standards)
- [Accessibility](#accessibility)
- [Implementation](#implementation)
- [Examples](#examples)

---

## Overview

### When to Use
- **Structured data**: Display datasets with multiple attributes
- **Data comparison**: Compare values across rows or columns
- **Scannable lists**: Large lists that benefit from columnar organization
- **Sortable data**: Data that users need to sort by different criteria
- **Actionable items**: When users need to select or act on rows

### When Not to Use
- **Small datasets**: Use simple lists for < 5 items
- **Complex hierarchies**: Consider tree view or nested lists
- **Key-value pairs**: Use description lists
- **Mobile-first content**: Tables are hard to adapt to mobile
- **Narrative content**: Use regular text formatting

---

## Anatomy

```
┌─────────────────────────────────────────────────────┐
│ Caption (optional)                                  │
├──────────┬──────────┬──────────┬──────────┬────────┤
│ Header 1 │ Header 2 │ Header 3 │ Header 4 │ Actions│ ← TableHead
├──────────┼──────────┼──────────┼──────────┼────────┤
│ Cell 1.1 │ Cell 1.2 │ Cell 1.3 │ Cell 1.4 │  [•]   │ ← TableRow
│ Cell 2.1 │ Cell 2.2 │ Cell 2.3 │ Cell 2.4 │  [•]   │
│ Cell 3.1 │ Cell 3.2 │ Cell 3.3 │ Cell 3.4 │  [•]   │
├──────────┼──────────┼──────────┼──────────┼────────┤
│ Footer   │          │          │          │        │ ← TableFooter
└──────────┴──────────┴──────────┴──────────┴────────┘
```

**Component Parts:**
1. **Table** - Container with overflow handling
2. **TableCaption** - Optional title/description
3. **TableHeader** - Column headers (thead)
4. **TableBody** - Main content (tbody)
5. **TableFooter** - Summary row (tfoot)
6. **TableRow** - Horizontal row (tr)
7. **TableHead** - Header cell (th)
8. **TableCell** - Data cell (td)

---

## Components

### Table (Container)

Main container that wraps all table components with overflow handling.

```typescript
<Table>
  {/* Table content */}
</Table>
```

**Props:**
- Standard HTML `<table>` props
- `className`: Additional CSS classes

**Design tokens:**
- Width: `w-full` (100%)
- Font size: `text-sm`
- Container: `overflow-x-auto` for horizontal scrolling

### TableCaption

Optional title or description, typically placed at top or bottom.

```typescript
<Table>
  <TableCaption>A list of your recent invoices.</TableCaption>
  {/* ... */}
</Table>
```

**Design tokens:**
- Color: `text-muted-foreground`
- Size: `text-sm`
- Margin: `mt-4`

### TableHeader

Container for header rows (usually one row with column titles).

```typescript
<TableHeader>
  <TableRow>
    <TableHead>Name</TableHead>
    <TableHead>Email</TableHead>
  </TableRow>
</TableHeader>
```

**Design tokens:**
- Border: `border-b` on rows

### TableBody

Container for data rows.

```typescript
<TableBody>
  <TableRow>
    <TableCell>John Doe</TableCell>
    <TableCell>john@example.com</TableCell>
  </TableRow>
</TableBody>
```

**Design tokens:**
- Last row: `border-0` (no border on last child)

### TableFooter

Optional footer for summary information.

```typescript
<TableFooter>
  <TableRow>
    <TableCell colSpan={2}>Total</TableCell>
    <TableCell>$1,250.00</TableCell>
  </TableRow>
</TableFooter>
```

**Design tokens:**
- Background: `bg-muted/50`
- Border: `border-t` (top border)
- Font: `font-medium`

### TableRow

Individual row in header, body, or footer.

```typescript
<TableRow>
  <TableCell>Data 1</TableCell>
  <TableCell>Data 2</TableCell>
</TableRow>
```

**Design tokens:**
- Hover: `hover:bg-muted/50`
- Selected: `data-[state=selected]:bg-muted`
- Border: `border-b`
- Transition: `transition-colors`

### TableHead

Header cell (column title).

```typescript
<TableHead>Column Name</TableHead>
```

**Design tokens:**
- Height: `h-10` (40px)
- Padding: `px-2`
- Alignment: `text-left`
- Font: `font-medium`
- Color: `text-foreground`
- White space: `whitespace-nowrap`

### TableCell

Data cell.

```typescript
<TableCell>Cell content</TableCell>
```

**Design tokens:**
- Padding: `p-2`
- Alignment: `align-middle`
- White space: `whitespace-nowrap`

---

## Options

### Variants

#### Basic Table
Standard table with headers and rows.

```typescript
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>Active</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

#### With Caption
Table with descriptive caption.

```typescript
<Table>
  <TableCaption>List of recent transactions</TableCaption>
  {/* ... */}
</Table>
```

#### With Footer
Table with summary footer row.

```typescript
<Table>
  {/* ... */}
  <TableFooter>
    <TableRow>
      <TableCell colSpan={2}>Total</TableCell>
      <TableCell>$1,000</TableCell>
    </TableRow>
  </TableFooter>
</Table>
```

#### Hoverable Rows
Rows highlight on hover (default behavior).

```typescript
<TableRow>  {/* Automatic hover effect */}
  <TableCell>Data</TableCell>
</TableRow>
```

#### Selectable Rows
Rows can be selected with visual feedback.

```typescript
<TableRow data-state={isSelected ? "selected" : undefined}>
  <TableCell>
    <Checkbox checked={isSelected} />
  </TableCell>
  <TableCell>Data</TableCell>
</TableRow>
```

### Alignment

#### Left-aligned (Default)
Default for text content.

```typescript
<TableHead>Name</TableHead>  {/* text-left by default */}
```

#### Right-aligned
For numeric data.

```typescript
<TableHead className="text-right">Amount</TableHead>
<TableCell className="text-right">$1,250</TableCell>
```

#### Center-aligned
For icons or short content.

```typescript
<TableHead className="text-center">Status</TableHead>
<TableCell className="text-center">✓</TableCell>
```

---

## Behaviors

### Scrolling

Horizontal scroll on overflow (for wide tables).

```typescript
{/* Automatic via container wrapper */}
<div className="overflow-x-auto">
  <table>...</table>
</div>
```

### Hover

Rows highlight on mouse hover.

```typescript
{/* Automatic via hover:bg-muted/50 */}
<TableRow>...</TableRow>
```

### Selection

Rows can show selected state.

```typescript
<TableRow data-state="selected">
  {/* Visual feedback via data-[state=selected]:bg-muted */}
</TableRow>
```

### Sorting

Column headers can be made sortable (requires implementation).

```typescript
<TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
  Name {sortIcon}
</TableHead>
```

---

## Usage Guidelines

### ✅ Do's

**Use clear, concise headers**
```typescript
✅
<TableHeader>
  <TableRow>
    <TableHead>Name</TableHead>
    <TableHead>Email</TableHead>
    <TableHead>Role</TableHead>
    <TableHead>Status</TableHead>
  </TableRow>
</TableHeader>
```

**Right-align numeric data**
```typescript
✅
<TableHead className="text-right">Amount</TableHead>
<TableCell className="text-right">$1,250.00</TableCell>
<TableCell className="text-right">$890.50</TableCell>
```

**Use consistent date formatting**
```typescript
✅
<TableCell>Jan 15, 2024</TableCell>
<TableCell>Feb 3, 2024</TableCell>
<TableCell>Mar 22, 2024</TableCell>
```

**Add captions for context**
```typescript
✅
<Table>
  <TableCaption>
    Showing 1-10 of 247 invoices
  </TableCaption>
  {/* ... */}
</Table>
```

**Group related actions in a column**
```typescript
✅
<TableHead>Actions</TableHead>
<TableCell>
  <Button variant="ghost" size="sm">Edit</Button>
  <Button variant="ghost" size="sm">Delete</Button>
</TableCell>
```

### ❌ Don'ts

**Don't use tables for layout**
```typescript
❌
<Table>
  <TableRow>
    <TableCell>Logo</TableCell>
    <TableCell>Navigation</TableCell>
  </TableRow>
</Table>

✅ Use flex or grid
<div className="flex justify-between">
  <div>Logo</div>
  <nav>Navigation</nav>
</div>
```

**Don't truncate important data**
```typescript
❌
<TableCell className="truncate max-w-[100px]">
  very-long-email-address@example.com
</TableCell>

✅ Allow wrapping or use tooltip
<TableCell>
  very-long-email-address@example.com
</TableCell>
```

**Don't mix alignments within a column**
```typescript
❌
<TableBody>
  <TableRow>
    <TableCell className="text-left">100</TableCell>
  </TableRow>
  <TableRow>
    <TableCell className="text-right">200</TableCell>
  </TableRow>
</TableBody>

✅ Consistent alignment
<TableHead className="text-right">Quantity</TableHead>
<TableCell className="text-right">100</TableCell>
<TableCell className="text-right">200</TableCell>
```

**Don't use vague headers**
```typescript
❌
<TableHead>Info</TableHead>
<TableHead>Data</TableHead>
<TableHead>Things</TableHead>

✅ Be specific
<TableHead>Product Name</TableHead>
<TableHead>Price</TableHead>
<TableHead>Stock Level</TableHead>
```

---

## Content Standards

### Headers

**Structure:**
- Use title case or sentence case consistently
- Keep short (1-3 words)
- Be specific and descriptive
- Avoid abbreviations unless widely understood

**Examples:**
```typescript
✅ Good:
- "Customer Name"
- "Order Date"
- "Total Amount"
- "Status"

❌ Avoid:
- "Cust. Nm." (unclear abbreviation)
- "The Customer's Full Name" (too long)
- "name" (not capitalized)
```

### Cell Content

**Structure:**
- Use consistent formatting within columns
- Align numbers right, text left
- Use placeholder for empty cells: "—" or "N/A"
- Format dates consistently

**Examples:**
```typescript
✅ Good:
<TableCell>$1,234.56</TableCell>
<TableCell>Jan 15, 2024</TableCell>
<TableCell>—</TableCell>  {/* Empty state */}

❌ Avoid:
<TableCell>1234.56</TableCell>  {/* Missing currency */}
<TableCell>2024-01-15</TableCell>  {/* Inconsistent format */}
<TableCell></TableCell>  {/* Truly empty */}
```

### Captions

**Structure:**
- Describe table purpose or summarize contents
- Use sentence case
- Keep under 15 words
- Place above table (default) or below

**Examples:**
```typescript
✅ Good:
"A list of your recent invoices from the last 30 days."
"Showing 1-25 of 150 results"
"Team members and their current roles"

❌ Avoid:
"Table" (not descriptive)
"This is a table showing all of the invoices that have been created..." (too long)
```

---

## Accessibility

### Semantic HTML

Tables use proper semantic elements:

```typescript
<table>       {/* Not divs */}
  <thead>     {/* Header section */}
  <tbody>     {/* Body section */}
  <tfoot>     {/* Footer section */}
  <tr>        {/* Rows */}
  <th>        {/* Header cells */}
  <td>        {/* Data cells */}
```

### ARIA Attributes

**Table with caption:**
```typescript
<Table aria-describedby="table-caption">
  <TableCaption id="table-caption">
    Recent transactions
  </TableCaption>
</Table>
```

**Sortable headers:**
```typescript
<TableHead
  aria-sort={sortDirection}
  onClick={() => handleSort('name')}
>
  Name
</TableHead>
```

**Row selection:**
```typescript
<TableRow
  aria-selected={isSelected}
  data-state={isSelected ? "selected" : undefined}
>
  <TableCell>
    <Checkbox
      checked={isSelected}
      aria-label={`Select ${rowName}`}
    />
  </TableCell>
</TableRow>
```

### Keyboard Navigation

- **Tab**: Move through interactive elements (links, buttons, checkboxes)
- **Shift + Tab**: Move backwards
- **Enter/Space**: Activate focused element
- **Arrow keys**: Can be added for custom navigation

### Screen Reader Support

- Table structure announced (rows × columns)
- Headers associated with cells
- Caption read as table description
- Selected state announced

### Focus Management

```typescript
{/* Ensure interactive elements are focusable */}
<TableCell>
  <Button variant="ghost" size="sm">
    Edit
  </Button>
</TableCell>
```

---

## Implementation

### Component Structure

**File:** `src/components/ui/table.tsx`

```typescript
"use client";

import * as React from "react";

import { cn } from "../../lib/utils";

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
```

### Design Tokens Used

**Colors:**
- Text: `text-foreground`
- Muted text: `text-muted-foreground`
- Background hover: `bg-muted/50`
- Selected background: `bg-muted`
- Border: `border-b` (default border color)

**Spacing:**
- Cell padding: `p-2` (0.5rem)
- Header padding: `px-2`
- Header height: `h-10` (40px)
- Caption margin: `mt-4`

**Typography:**
- Base size: `text-sm`
- Header font: `font-medium`
- Footer font: `font-medium`

**Effects:**
- Transitions: `transition-colors`
- Hover: Automatic background change
- White space: `whitespace-nowrap`

---

## Examples

### Basic Table

```typescript
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const invoices = [
  { id: "INV001", amount: 250.00, status: "Paid" },
  { id: "INV002", amount: 150.00, status: "Pending" },
  { id: "INV003", amount: 350.00, status: "Paid" },
];

export function BasicTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-medium">{invoice.id}</TableCell>
            <TableCell>{invoice.status}</TableCell>
            <TableCell className="text-right">
              ${invoice.amount.toFixed(2)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### With Caption

```typescript
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function TableWithCaption() {
  return (
    <Table>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>INV001</TableCell>
          <TableCell>Paid</TableCell>
          <TableCell className="text-right">$250.00</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
```

### With Footer

```typescript
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const invoices = [
  { id: "INV001", amount: 250.00 },
  { id: "INV002", amount: 150.00 },
  { id: "INV003", amount: 350.00 },
];

export function TableWithFooter() {
  const total = invoices.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell>{invoice.id}</TableCell>
            <TableCell className="text-right">
              ${invoice.amount.toFixed(2)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell className="text-right">${total.toFixed(2)}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
```

### With Row Selection

```typescript
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

const data = [
  { id: "1", name: "John Doe", email: "john@example.com" },
  { id: "2", name: "Jane Smith", email: "jane@example.com" },
  { id: "3", name: "Bob Johnson", email: "bob@example.com" },
];

export function TableWithSelection() {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedRows(newSet);
  };

  const toggleAll = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.map((row) => row.id)));
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              checked={selectedRows.size === data.length}
              onCheckedChange={toggleAll}
              aria-label="Select all"
            />
          </TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow
            key={row.id}
            data-state={selectedRows.has(row.id) ? "selected" : undefined}
          >
            <TableCell>
              <Checkbox
                checked={selectedRows.has(row.id)}
                onCheckedChange={() => toggleRow(row.id)}
                aria-label={`Select ${row.name}`}
              />
            </TableCell>
            <TableCell className="font-medium">{row.name}</TableCell>
            <TableCell>{row.email}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### With Sorting

```typescript
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

type SortDirection = "asc" | "desc" | null;

const data = [
  { id: 1, name: "Alice", score: 95 },
  { id: 2, name: "Bob", score: 87 },
  { id: 3, name: "Charlie", score: 92 },
];

export function TableWithSorting() {
  const [sortKey, setSortKey] = useState<"name" | "score" | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (key: "name" | "score") => {
    if (sortKey === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortKey(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey || !sortDirection) return 0;
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    const modifier = sortDirection === "asc" ? 1 : -1;
    return aVal < bVal ? -modifier : aVal > bVal ? modifier : 0;
  });

  const SortIcon = ({ column }: { column: "name" | "score" }) => {
    if (sortKey !== column) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    if (sortDirection === "asc") return <ArrowUp className="ml-2 h-4 w-4" />;
    return <ArrowDown className="ml-2 h-4 w-4" />;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Button
              variant="ghost"
              onClick={() => handleSort("name")}
              className="-ml-4"
            >
              Name
              <SortIcon column="name" />
            </Button>
          </TableHead>
          <TableHead>
            <Button
              variant="ghost"
              onClick={() => handleSort("score")}
              className="-ml-4"
            >
              Score
              <SortIcon column="score" />
            </Button>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedData.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.name}</TableCell>
            <TableCell>{row.score}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### With Actions

```typescript
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const users = [
  { id: 1, name: "John Doe", email: "john@example.com", role: "Admin" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", role: "User" },
];

export function TableWithActions() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.role}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem>Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### With Status Badges

```typescript
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const orders = [
  { id: "ORD001", customer: "John Doe", status: "delivered" },
  { id: "ORD002", customer: "Jane Smith", status: "processing" },
  { id: "ORD003", customer: "Bob Johnson", status: "cancelled" },
];

export function TableWithBadges() {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "delivered":
        return "success";
      case "processing":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order ID</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-medium">{order.id}</TableCell>
            <TableCell>{order.customer}</TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(order.status)}>
                {order.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### In a Card

```typescript
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function TableInCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Sales</CardTitle>
        <CardDescription>
          You made 265 sales this month.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>John Doe</TableCell>
              <TableCell className="text-right">$250.00</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Jane Smith</TableCell>
              <TableCell className="text-right">$150.00</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

---

**Last Updated:** 2024-12-30
