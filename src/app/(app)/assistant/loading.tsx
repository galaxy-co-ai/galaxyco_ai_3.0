import { ChatSkeleton } from '@/components/shared/loading-skeletons';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Assistant Loading State
 * Shown while assistant interface loads
 */
export default function AssistantLoading() {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <Skeleton className="h-6 w-32" />
      </div>

      {/* Chat area */}
      <div className="flex-1 p-6">
        <ChatSkeleton messages={3} />
      </div>

      {/* Input area */}
      <div className="border-t p-4">
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  );
}
