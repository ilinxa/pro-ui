"use client";

import * as React from "react";
import { Check, Circle, MapPin } from "lucide-react";

import { cn } from "@/lib/utils";

import type { ChapterBeatProps } from "../types";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Deterministic, locale/TZ-independent date format (UTC parts + fixed month
 * names) so a `doneAt` reads identically on server + client — no hydration
 * mismatch. Returns null for an unparseable value.
 */
function formatDoneAt(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

const STATE_LABEL = {
  done: "completed",
  current: "current",
  upcoming: "upcoming",
} as const;

/**
 * Tier C — a single chapter beat: a state marker (with a **non-color** cue —
 * `Check` done / `MapPin` "you are here" current / hollow `Circle` upcoming, so
 * state reads without color, D-13/§10), the chapter title, the milestone label
 * subtitle, and an optional "completed" date. Interactive only when `onClick` is
 * passed (a real `<button>`); otherwise static. Tagged `data-chapter-id` for the
 * visibility telemetry + scroll-into-view.
 */
export function ChapterBeat({
  chapter,
  state,
  milestone,
  onClick,
  className,
}: ChapterBeatProps) {
  const interactive = typeof onClick === "function";
  const doneAtText =
    state === "done" && milestone?.doneAt ? formatDoneAt(milestone.doneAt) : null;

  const marker = (
    <span
      aria-hidden
      className={cn(
        "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border transition-[transform,box-shadow,border-color,background-color,color] duration-200 ease-out motion-safe:group-hover:scale-110",
        state === "done" &&
          "border-primary bg-primary text-primary-foreground group-hover:shadow-md group-hover:shadow-primary/30",
        state === "current" &&
          "border-primary bg-background text-primary ring-2 ring-primary/30 group-hover:ring-primary/50",
        state === "upcoming" &&
          "border-border bg-muted text-muted-foreground group-hover:border-primary/40 group-hover:text-foreground",
      )}
    >
      {state === "done" ? (
        <Check className="size-4" />
      ) : state === "current" ? (
        <MapPin className="size-4" />
      ) : (
        <Circle className="size-3" />
      )}
    </span>
  );

  const body = (
    <span className="flex min-w-0 flex-col gap-0.5 pb-4 text-left">
      <span
        className={cn(
          "truncate text-sm font-medium",
          state === "upcoming" ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {chapter.title}
      </span>
      {milestone?.label ? (
        <span className="truncate text-xs text-muted-foreground">
          {milestone.label}
        </span>
      ) : null}
      {doneAtText ? (
        <span className="font-mono text-[11px] text-muted-foreground">
          Completed {doneAtText}
        </span>
      ) : null}
    </span>
  );

  const accessibleName = `${chapter.title} — ${STATE_LABEL[state]}`;

  const inner = (
    <>
      {marker}
      {body}
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        role="listitem"
        data-chapter-id={chapter.id}
        aria-label={accessibleName}
        onClick={() => onClick?.(chapter)}
        className={cn(
          "group flex w-full items-start gap-3 rounded-md text-left outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          className,
        )}
      >
        {inner}
      </button>
    );
  }

  return (
    <div
      role="listitem"
      data-chapter-id={chapter.id}
      aria-label={accessibleName}
      className={cn("group flex items-start gap-3", className)}
    >
      {inner}
    </div>
  );
}
