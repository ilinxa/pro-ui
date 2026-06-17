"use client";

import { cn } from "@/lib/utils";
import { useBlackboard } from "../hooks/use-blackboard";
import { UnreadCount } from "./unread-count";

export interface BlackboardNotificationBadgeProps {
  className?: string;
}

/**
 * The handwritten red unread marker, positioned top-right of the board by default.
 * Reads `unreadCount` from context; clicking scrolls to the latest + marks all seen.
 */
export function BlackboardNotificationBadge({ className }: BlackboardNotificationBadgeProps) {
  const ctx = useBlackboard();
  if (ctx.unreadCount <= 0) return null;
  return (
    <div className={cn("pointer-events-none absolute right-2 top-2 z-20", className)}>
      <div className="pointer-events-auto">
        <UnreadCount
          count={ctx.unreadCount}
          ariaLabel={ctx.labels.unreadAria}
          onClick={() => {
            ctx.scrollToLatest();
            ctx.markAllSeen();
          }}
        />
      </div>
    </div>
  );
}
