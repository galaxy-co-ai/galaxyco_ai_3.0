"use client";

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  name: string;
  avatar?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  status?: 'online' | 'offline' | 'away';
}

const sizeStyles = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
};

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  away: 'bg-amber-500',
};

export function UserAvatar({ 
  name, 
  avatar, 
  color = '#64B5F6', 
  size = 'md', 
  className,
  status 
}: UserAvatarProps) {
  return (
    <div className={cn('relative', className)}>
      <Avatar className={cn(sizeStyles[size], 'border-2 border-background')}>
        {avatar && <AvatarImage src={avatar} alt={name} />}
        <AvatarFallback 
          style={{ backgroundColor: color }}
          className="text-white font-medium"
        >
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      {status && (
        <div 
          className={cn(
            'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background',
            statusColors[status]
          )}
        />
      )}
    </div>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
