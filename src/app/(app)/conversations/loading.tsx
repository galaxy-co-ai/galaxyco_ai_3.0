import { ChatSkeleton, PageHeaderSkeleton } from '@/components/shared/loading-skeletons';

/**
 * Conversations Loading State
 * Shown while conversations page loads
 */
export default function ConversationsLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <ChatSkeleton messages={5} />
    </div>
  );
}
