'use client';

import Link from 'next/link';
import type { ContentBlock, ActionOption } from '@/types/neptune-conversation';
import { ActionAffordance } from './ActionAffordance';

interface ContentBlockRendererProps {
  block: ContentBlock;
  onAction?: (action: ActionOption) => void;
}

const MODULE_ROUTES: Record<string, string> = {
  crm: '/crm',
  finance: '/finance-hq',
  marketing: '/marketing',
  agents: '/agents',
  settings: '/settings',
  knowledge: '/knowledge',
};

export function ContentBlockRenderer({ block, onAction }: ContentBlockRendererProps) {
  switch (block.type) {
    case 'text':
      return <p className="text-sm leading-relaxed text-foreground">{block.content}</p>;

    case 'visual':
      return (
        <div
          data-chart-type={block.spec.chartType}
          className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground"
        >
          {block.spec.title ?? block.spec.chartType}
        </div>
      );

    case 'action-affordance':
      return (
        <ActionAffordance
          prompt={block.prompt}
          actions={block.actions}
          onAction={onAction}
        />
      );

    case 'module-link': {
      const href = MODULE_ROUTES[block.module] ?? `/${block.module}`;
      return (
        <Link
          href={href}
          className="text-sm text-foreground underline underline-offset-2 hover:text-muted-foreground transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)]"
        >
          {block.label}
        </Link>
      );
    }

    default:
      return null;
  }
}
