import { Metadata } from 'next';
import { ArticleStudioClient } from './ArticleStudioClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Article Studio | Content Studio',
  description: 'AI-assisted article creation with topic generation and brainstorming',
};

export default function ArticleStudioPage() {
  return <ArticleStudioClient />;
}

