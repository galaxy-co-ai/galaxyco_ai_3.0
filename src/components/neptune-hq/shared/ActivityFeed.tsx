"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  user: {
    name: string;
    avatar?: string;
    color?: string;
  };
  action: string;
  description: string;
  timestamp: Date;
}

interface ActivityFeedProps {
  title?: string;
  items: ActivityItem[];
  className?: string;
}

export function ActivityFeed({ title = 'Recent Activity', items, className }: ActivityFeedProps) {
  return (
    <Card className={cn('shadow-sm', className)}>
      {title && (
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {items.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No recent activity
            </div>
          ) : (
            items.map((item, index) => (
              <div key={item.id} className="flex gap-3 p-4 hover:bg-muted/50 transition-colors">
                <Avatar className="h-8 w-8 shrink-0">
                  {item.user.avatar && <AvatarImage src={item.user.avatar} alt={item.user.name} />}
                  <AvatarFallback 
                    style={{ backgroundColor: item.user.color }}
                    className="text-white text-xs font-medium"
                  >
                    {getInitials(item.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{item.user.name}</span>{' '}
                    <span className="text-muted-foreground">{item.action}</span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">
                    {item.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
