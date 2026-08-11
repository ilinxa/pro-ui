"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useBlackboard } from "../hooks/use-blackboard";
import { BoardBackground } from "./board-background";

export interface BlackboardSurfaceProps {
  children?: ReactNode;
  className?: string;
}

/**
 * The visible board — a dark, rounded, self-contained surface (chalkboard identity:
 * dark in both themes). Lays its children out as a column (pinned row / stream /
 * composer) over the themeable background, and is a `@container` so the chrome can
 * adapt to a narrow dashboard tile. In `double-click` composer mode, double-clicking
 * the surface reveals the composer; a faint hint advertises it.
 */
export function BlackboardSurface({ children, className }: BlackboardSurfaceProps) {
  const { background, canWrite, composerMode, composerOpen, openComposer, labels } =
    useBlackboard();

  const doubleClickEnabled = composerMode === "double-click" && canWrite;

  return (
    <div
      onDoubleClick={doubleClickEnabled ? () => openComposer() : undefined}
      className={cn(
        "@container/board relative isolate flex h-full min-h-80 flex-col overflow-hidden rounded-xl border border-white/10 text-white shadow-sm",
        className,
      )}
    >
      <BoardBackground background={background} className="absolute inset-0 -z-10 size-full" />
      {children}
      {doubleClickEnabled && !composerOpen ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center">
          <span className="rounded-full bg-black/25 px-2.5 py-1 text-[0.7rem] text-white/40 backdrop-blur-sm">
            {labels.doubleClickHint}
          </span>
        </div>
      ) : null}
    </div>
  );
}
