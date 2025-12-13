"use client";

/**
 * Widget Card - Base wrapper for dashboard widgets
 * Provides consistent styling and optional actions
 */

import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Maximize2, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface WidgetCardProps {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  onRemove?: () => void;
  onExpand?: () => void;
  actions?: ReactNode;
  noPadding?: boolean;
}

export default function WidgetCard({
  title,
  icon: Icon,
  children,
  className,
  onRemove,
  onExpand,
  actions,
  noPadding = false,
}: WidgetCardProps) {
  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            {title}
          </CardTitle>
          <div className="flex items-center gap-1">
            {actions}
            {(onExpand || onRemove) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onExpand && (
                    <DropdownMenuItem onClick={onExpand}>
                      <Maximize2 className="h-4 w-4 mr-2" />
                      Expand
                    </DropdownMenuItem>
                  )}
                  {onRemove && (
                    <DropdownMenuItem onClick={onRemove} className="text-red-600">
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn("flex-1 min-h-0", noPadding ? "p-0" : "")}>
        {children}
      </CardContent>
    </Card>
  );
}
