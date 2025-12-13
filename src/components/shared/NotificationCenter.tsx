"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import {
  Bell,
  Check,
  CheckCheck,
  Archive,
  Trash2,
  MoreHorizontal,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: Date;
  read: boolean;
  archived: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAsUnread?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onAction?: (notification: Notification) => void;
  maxHeight?: string;
}

export function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAsUnread,
  onMarkAllAsRead,
  onArchive,
  onDelete,
  onAction,
  maxHeight = "400px",
}: NotificationCenterProps) {
  const [open, setOpen] = React.useState(false);
  const [filter, setFilter] = React.useState<"all" | "unread" | "archived">("all");

  // Filter notifications
  const filteredNotifications = React.useMemo(() => {
    return notifications.filter((notif) => {
      if (filter === "unread") return !notif.read && !notif.archived;
      if (filter === "archived") return notif.archived;
      return !notif.archived; // "all" shows non-archived
    });
  }, [notifications, filter]);

  // Count unread
  const unreadCount = React.useMemo(() => {
    return notifications.filter((n) => !n.read && !n.archived).length;
  }, [notifications]);

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return "bg-green-100 text-green-600";
      case "error":
        return "bg-red-100 text-red-600";
      case "warning":
        return "bg-amber-100 text-amber-600";
      default:
        return "bg-blue-100 text-blue-600";
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // seconds

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="soft"
              tone="danger"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className={cn(
            "z-50 w-[380px] rounded-lg border bg-popover p-0 text-popover-foreground shadow-md outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
            "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          )}
          align="end"
          sideOffset={8}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold text-sm">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && onMarkAllAsRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMarkAllAsRead}
                  className="h-8 text-xs"
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Mark all read
                </Button>
              )}
              <PopoverPrimitive.Close asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </PopoverPrimitive.Close>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b">
            <button
              className={cn(
                "flex-1 px-4 py-2 text-sm font-medium transition-colors",
                filter === "all"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button
              className={cn(
                "flex-1 px-4 py-2 text-sm font-medium transition-colors",
                filter === "unread"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setFilter("unread")}
            >
              Unread
              {unreadCount > 0 && (
                <Badge variant="soft" tone="danger" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </button>
            <button
              className={cn(
                "flex-1 px-4 py-2 text-sm font-medium transition-colors",
                filter === "archived"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setFilter("archived")}
            >
              Archived
            </button>
          </div>

          {/* Notifications List */}
          <ScrollArea className="h-[400px]">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {filter === "unread"
                    ? "No unread notifications"
                    : filter === "archived"
                    ? "No archived notifications"
                    : "No notifications"}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 transition-colors hover:bg-accent/50",
                      !notification.read && "bg-accent/30"
                    )}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div
                        className={cn(
                          "flex items-center justify-center h-8 w-8 rounded-full shrink-0",
                          getNotificationIcon(notification.type)
                        )}
                      >
                        <Bell className="h-4 w-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-none mb-1">
                              {notification.title}
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTimestamp(notification.timestamp)}
                            </p>
                          </div>

                          {/* Actions Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {notification.read ? (
                                <DropdownMenuItem
                                  onClick={() => onMarkAsUnread?.(notification.id)}
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Mark as unread
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => onMarkAsRead?.(notification.id)}
                                >
                                  <CheckCheck className="h-4 w-4 mr-2" />
                                  Mark as read
                                </DropdownMenuItem>
                              )}
                              {!notification.archived && onArchive && (
                                <DropdownMenuItem
                                  onClick={() => onArchive(notification.id)}
                                >
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                              )}
                              {onDelete && (
                                <DropdownMenuItem
                                  onClick={() => onDelete(notification.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Action Button */}
                        {notification.actionLabel && notification.actionUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => onAction?.(notification)}
                          >
                            {notification.actionLabel}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
