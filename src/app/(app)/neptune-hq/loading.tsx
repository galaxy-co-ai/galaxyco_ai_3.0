import { ChatSkeleton, PageHeaderSkeleton } from '@/components/shared/loading-skeletons';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Neptune HQ Loading State
 * Shown while Neptune AI interface loads
 */
export default function NeptuneHQLoading() {
  return (
    <div className="flex h-full flex-col">
      <PageHeaderSkeleton />

      {/* Chat area */}
      <div className="flex-1 p-6">
        <ChatSkeleton messages={4} />
      </div>

      {/* Input area */}
      <div className="border-t p-4">
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  );
}
