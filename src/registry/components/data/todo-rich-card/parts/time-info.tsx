"use client";

import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCardContext } from "../hooks/use-card-context";
import type { TodoItem } from "../types";
import { formatAbsolute, formatDuration, formatRelative, parseIso } from "../lib/time";

export function TimeInfo({ item }: { item: TodoItem }) {
  const { now: nowFactory } = useCardContext();
  const now = nowFactory();

  const setAt = parseIso(item.setAt);
  const startAt = parseIso(item.startAt ?? item.setAt);
  const expireAt = parseIso(item.expireAt);

  if (!setAt) return null;

  const primary = (() => {
    if (expireAt) return `Due ${formatRelative(expireAt, now)}`;
    if (item.duration && item.duration > 0)
      return `Duration: ${formatDuration(item.duration)}`;
    return null;
  })();

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {primary ? <span className="font-medium">{primary}</span> : null}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center text-muted-foreground/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              aria-label="Show timing details"
            >
              <Info className="size-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
              <dt className="text-muted-foreground">Created</dt>
              <dd>{formatAbsolute(setAt)}</dd>
              <dt className="text-muted-foreground">Starts</dt>
              <dd>{startAt ? formatAbsolute(startAt) : formatAbsolute(setAt)}</dd>
              <dt className="text-muted-foreground">Expires</dt>
              <dd>{expireAt ? formatAbsolute(expireAt) : "—"}</dd>
              {item.duration && item.duration > 0 ? (
                <>
                  <dt className="text-muted-foreground">Duration</dt>
                  <dd>{formatDuration(item.duration)}</dd>
                </>
              ) : null}
            </dl>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
