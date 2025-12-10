/**
 * Dashboard v2 Loading Skeleton
 * 
 * Loading state that matches the actual dashboard layout
 */

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export function DashboardV2Loading() {
  return (
    <div className="min-h-screen p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8">
      {/* Welcome Section Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-5 w-96" />
        <div className="flex gap-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-28" />
        </div>
      </div>

      {/* Next Step Card Skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Skeleton className="hidden md:block size-12 shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-8 w-80" />
              <Skeleton className="h-4 w-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-72" />
                <Skeleton className="h-4 w-60" />
              </div>
            </div>
            <Skeleton className="h-12 w-full md:w-32 shrink-0" />
          </div>
        </CardContent>
      </Card>

      {/* Pathways Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Skeleton className="size-11 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Wins & Tools Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3 pb-3 border-b">
                  <Skeleton className="size-8 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="size-6" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
