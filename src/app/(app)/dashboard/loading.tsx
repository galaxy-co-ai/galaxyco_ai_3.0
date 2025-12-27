import { Skeleton } from '@/components/ui/skeleton';

/**
 * Dashboard Loading State
 * Matches the Neptune-focused dashboard layout
 */
export default function DashboardLoading() {
  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      {/* Header skeleton */}
      <div className="border-b bg-gradient-to-r from-nebula-frost via-white to-nebula-frost/80 px-6 py-4">
        <div className="flex items-center justify-between pt-4">
          <Skeleton className="h-8 w-40" />
        </div>
      </div>

      {/* Neptune panel skeleton */}
      <div className="flex-1 p-6">
        <div className="h-full rounded-lg border-2 border-nebula-violet/20 bg-white/50 p-6">
          {/* Neptune header */}
          <div className="border-b pb-4 mb-6">
            <Skeleton className="h-6 w-32" />
          </div>

          {/* Neptune message */}
          <div className="space-y-4">
            <div className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-full max-w-xl" />
                <Skeleton className="h-4 w-3/4 max-w-md" />
              </div>
            </div>
          </div>

          {/* Input area skeleton at bottom */}
          <div className="absolute bottom-6 left-6 right-6">
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
