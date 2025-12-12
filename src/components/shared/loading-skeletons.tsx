import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

/**
 * Reusable Loading Skeleton Components
 * 
 * Consistent loading states across the application.
 * All skeletons are responsive and use design tokens.
 */

/**
 * Table Loading Skeleton
 * Used in: CRM contacts, deals, campaigns lists
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {/* Table header */}
      <div className="flex gap-4 pb-3 border-b">
        <Skeleton className="h-4 w-8" /> {/* Checkbox */}
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      
      {/* Table rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center py-3">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

/**
 * Card Grid Loading Skeleton
 * Used in: Agents, Knowledge Base, Templates
 */
export function CardGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: cards }).map((_, i) => (
        <Card key={i} className="p-6">
          <div className="space-y-3">
            <Skeleton className="h-6 w-3/4" /> {/* Title */}
            <Skeleton className="h-4 w-full" /> {/* Line 1 */}
            <Skeleton className="h-4 w-5/6" /> {/* Line 2 */}
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-6 w-16" /> {/* Badge 1 */}
              <Skeleton className="h-6 w-20" /> {/* Badge 2 */}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/**
 * Dashboard Stats Loading Skeleton
 * Used in: Dashboard KPIs, Analytics cards
 */
export function StatsSkeleton({ stats = 4 }: { stats?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: stats }).map((_, i) => (
        <Card key={i} className="p-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" /> {/* Label */}
            <Skeleton className="h-8 w-24" /> {/* Value */}
            <Skeleton className="h-3 w-16" /> {/* Change indicator */}
          </div>
        </Card>
      ))}
    </div>
  );
}

/**
 * Chat Message Loading Skeleton
 * Used in: Neptune AI conversations, Support chat
 */
export function ChatSkeleton({ messages = 3 }: { messages?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: messages }).map((_, i) => (
        <div key={i} className={`flex gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
          <Skeleton className="h-8 w-8 rounded-full" /> {/* Avatar */}
          <div className="flex-1 space-y-2 max-w-md">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Form Loading Skeleton
 * Used in: Settings, Create/Edit dialogs
 */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" /> {/* Label */}
          <Skeleton className="h-10 w-full" /> {/* Input */}
        </div>
      ))}
      <div className="flex gap-2 pt-4">
        <Skeleton className="h-10 w-24" /> {/* Cancel button */}
        <Skeleton className="h-10 w-24" /> {/* Submit button */}
      </div>
    </div>
  );
}

/**
 * List Loading Skeleton
 * Used in: Activity feeds, Notifications, Search results
 */
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex gap-3 items-start p-3 border rounded-lg">
          <Skeleton className="h-10 w-10 rounded" /> {/* Icon/Image */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" /> {/* Title */}
            <Skeleton className="h-3 w-full" /> {/* Description */}
            <Skeleton className="h-3 w-20" /> {/* Timestamp */}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Timeline Loading Skeleton
 * Used in: Activity history, Workflow steps
 */
export function TimelineSkeleton({ events = 4 }: { events?: number }) {
  return (
    <div className="relative space-y-6">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
      
      {Array.from({ length: events }).map((_, i) => (
        <div key={i} className="relative flex gap-4">
          <Skeleton className="h-8 w-8 rounded-full relative z-10" /> {/* Dot */}
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-4 w-2/3" /> {/* Event title */}
            <Skeleton className="h-3 w-full" /> {/* Description */}
            <Skeleton className="h-3 w-20" /> {/* Timestamp */}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Kanban Column Loading Skeleton
 * Used in: CRM pipeline view, Workflow boards
 */
export function KanbanSkeleton({ columns = 3, cardsPerColumn = 3 }: { columns?: number; cardsPerColumn?: number }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-80">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <Skeleton className="h-5 w-24" /> {/* Column title */}
              <Skeleton className="h-5 w-8" /> {/* Count */}
            </div>
            
            <div className="space-y-3">
              {Array.from({ length: cardsPerColumn }).map((_, j) => (
                <Card key={j} className="p-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                    <div className="flex gap-2 pt-2">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Page Header Loading Skeleton
 * Used in: All major pages
 */
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" /> {/* Page title */}
          <Skeleton className="h-4 w-96" /> {/* Description */}
        </div>
        <Skeleton className="h-10 w-32" /> {/* Action button */}
      </div>
    </div>
  );
}

/**
 * Full Page Loading Skeleton
 * Combines header + content for complete page loading state
 */
export function PageLoadingSkeleton({ 
  type = 'table',
  showHeader = true 
}: { 
  type?: 'table' | 'cards' | 'form' | 'list';
  showHeader?: boolean;
}) {
  return (
    <div className="space-y-6">
      {showHeader && <PageHeaderSkeleton />}
      
      {type === 'table' && <TableSkeleton />}
      {type === 'cards' && <CardGridSkeleton />}
      {type === 'form' && <FormSkeleton />}
      {type === 'list' && <ListSkeleton />}
    </div>
  );
}
