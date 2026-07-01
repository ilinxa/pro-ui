"use client";

import * as React from "react";
import { BookOpen } from "lucide-react";

import { cn } from "@/lib/utils";

import { useChapterViewTelemetry } from "../hooks/use-chapter-view-telemetry";
import { useTeamQuestLog } from "../hooks/use-team-quest-log";
import { ChapterBeat } from "./chapter-beat";
import type { ChapterRailProps } from "../types";

/**
 * Tier C — quiet empty-state placeholder (no chapters authored). Never an error.
 */
export function EmptyNarrative({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center",
        className,
      )}
    >
      <BookOpen aria-hidden className="size-5 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        Your team&apos;s story will appear here as milestones are reached.
      </p>
    </div>
  );
}

/**
 * Tier C — the vertical rail: a connecting spine (the done portion accents in
 * signal-lime, the upcoming portion is muted) mapping `beats[]` to `ChapterBeat`s.
 * Prop-driven, context-free.
 */
export function ChapterRail({
  beats,
  onBeatClick,
  renderChapter,
  className,
}: ChapterRailProps) {
  return (
    <div role="list" className={cn("relative flex flex-col", className)}>
      {beats.map((beat, i) => {
        const isLast = i === beats.length - 1;
        return (
          <div key={beat.chapter.id} className="relative">
            {!isLast ? (
              <span
                aria-hidden
                className={cn(
                  "absolute top-7 bottom-0 left-[13px] w-px",
                  beat.state === "done" ? "bg-primary" : "bg-border",
                )}
              />
            ) : null}
            {renderChapter ? (
              <div role="listitem" data-chapter-id={beat.chapter.id}>
                {renderChapter({ chapter: beat.chapter, state: beat.state })}
              </div>
            ) : (
              <ChapterBeat
                chapter={beat.chapter}
                state={beat.state}
                milestone={beat.milestone}
                onClick={onBeatClick}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Tier B — the chapter timeline surface. Reads the derived beats, attaches the
 * fire-once visibility telemetry (one IntersectionObserver over all beat nodes),
 * and renders the `ChapterRail` (or `EmptyNarrative` when there are no chapters).
 * Beats are interactive only when `onChapterClick` is wired (capability-gating).
 */
export function TeamQuestChapters({ className }: { className?: string }) {
  const { team, beats, onChapterClick, onEvent, renderChapter, registerRail } =
    useTeamQuestLog();

  const chapterKey = beats.map((b) => b.chapter.id).join(",");
  const { containerRef, fireForChapter } = useChapterViewTelemetry({
    teamId: team.id,
    chapterKey,
    onEvent,
  });

  // Dev-only: surface any chapter whose milestoneId matched no milestone (it
  // renders gracefully as upcoming, never crashes — §7). NODE_ENV is the one
  // sanctioned env reference, kept in a function body (erased in prod builds).
  React.useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const missing = beats.filter((b) => b.unresolved);
    if (missing.length > 0) {
      console.warn(
        `[team-quest-log-01] ${missing.length} chapter(s) reference an unknown milestoneId: ${missing
          .map((b) => b.chapter.milestoneId)
          .join(", ")}`,
      );
    }
  }, [beats]);

  const setNode = React.useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;
      registerRail(node);
    },
    [containerRef, registerRail],
  );

  const handleBeatClick = React.useCallback(
    (chapter: (typeof beats)[number]["chapter"]) => {
      onChapterClick?.(chapter);
      // Telemetry fallback when IO is unavailable — fire-once via the shared Set.
      fireForChapter(chapter.id);
    },
    [onChapterClick, fireForChapter],
  );

  return (
    <div ref={setNode} className={cn("w-full", className)}>
      {beats.length === 0 ? (
        <EmptyNarrative />
      ) : (
        <ChapterRail
          beats={beats}
          onBeatClick={onChapterClick ? handleBeatClick : undefined}
          renderChapter={renderChapter}
        />
      )}
    </div>
  );
}
