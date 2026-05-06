"use client";

import { cn } from "@/lib/utils";
import type { KanbanSwimlane } from "../types";

/**
 * Optional swimlane label band. Currently rendered inline within each column body.
 * This component is reserved for a future "single global label band above all columns" mode.
 */
export function SwimlaneRow({ swimlanes, className }: { swimlanes: KanbanSwimlane[]; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1", className)} aria-hidden="true">
      {swimlanes.map((s) => (
        <span key={s.id} className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
          {s.title}
        </span>
      ))}
    </div>
  );
}
