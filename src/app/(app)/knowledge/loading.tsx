import { PageLoadingSkeleton } from '@/components/shared/loading-skeletons';

/**
 * Knowledge Base Loading State
 * Shown while knowledge base loads
 */
export default function KnowledgeLoading() {
  return <PageLoadingSkeleton type="cards" />;
}
