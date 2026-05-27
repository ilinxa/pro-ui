"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { PostPoll, PostPollOption } from "../types";

export interface PollWidgetProps {
  poll: PostPoll;
  /**
   * Whether the viewer has already cast a vote. Resolved from local-mirror
   * (optimistic, takes precedence) OR `poll.hasVoted` (server-resolved).
   * When true, the results view renders instead of vote buttons.
   */
  hasVoted: boolean;
  /**
   * Owner-side view — always shows results, never the vote buttons (owners
   * don't vote on their own polls).
   */
  isOwnerView: boolean;
  /**
   * The option id the viewer voted for (highlights in results view). When
   * sourced from the local mirror, the optimistic increment is applied to
   * that option's display count.
   */
  optimisticVoteOptionId?: string;
  /**
   * Whether the optimistic-vote increment should bump the displayed counts.
   * `true` when `optimisticVoteOptionId` came from the in-card local mirror
   * (the host hasn't reconciled yet). `false` when sourced from
   * `poll.viewerVoteOptionId` (server-resolved; counts already reflect it).
   */
  optimisticIncrement: boolean;
  /** Fires when the viewer taps a vote button. */
  onVote?: (optionId: string) => void;
  labels: {
    pollHeading: string;
    pollTotalVotesLabel: string;
    pollClosesAtLabel: string;
    pollClosedLabel: string;
  };
  /** Relative-time formatter for the closesAt countdown. */
  formatRelativeTime?: (date: Date, now: Date) => string;
  className?: string;
}

function toDate(value: Date | string | number): Date {
  if (value instanceof Date) return value;
  return new Date(value);
}

function clampPct(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n >= 100) return 100;
  return n;
}

interface ResolvedOption extends PostPollOption {
  pct: number;
  isViewerChoice: boolean;
}

/**
 * Sealed client component rendering the inline poll widget. Two views:
 *   - **Vote view** (viewer + not voted + not closed) — list of vote buttons,
 *     min h-11 per WCAG 2.5.5 (Q-P40).
 *   - **Results view** (owner OR voted OR closed) — bar chart with width
 *     transition (Q-P17 / Q-P41 motion-reduce safe). Viewer's option is
 *     highlighted via accent ring.
 *
 * Optimistic vote per Q-D5 / Q-P32 — when `optimisticVoteOptionId` comes from
 * the local mirror (`optimisticIncrement === true`), the picked option's
 * displayed count + the displayed total both get +1 immediately. Host can
 * reject by calling `ref.current.reset(originalPost)`, which clears the
 * local mirror upstream.
 *
 * Multi-select polls are not yet fully supported in v0.2.0 — single-vote
 * behavior renders regardless of `poll.multiSelect`. Tracked as a v0.2.x /
 * v0.3 follow-up.
 */
export function PollWidget({
  poll,
  hasVoted,
  isOwnerView,
  optimisticVoteOptionId,
  optimisticIncrement,
  onVote,
  labels,
  formatRelativeTime,
  className,
}: PollWidgetProps) {
  const now = new Date();
  const closesDate = poll.closesAt ? toDate(poll.closesAt) : undefined;
  const isClosed = !!(closesDate && closesDate.getTime() <= now.getTime());
  const showResults = isOwnerView || hasVoted || isClosed;

  const { resolvedOptions, displayedTotal } = useMemo(() => {
    const bumpedTotal =
      poll.totalVotes + (optimisticVoteOptionId && optimisticIncrement ? 1 : 0);
    const safeTotal = bumpedTotal > 0 ? bumpedTotal : 1;
    const resolved: ResolvedOption[] = poll.options.map((opt) => {
      const isViewerChoice = opt.id === optimisticVoteOptionId;
      const bumpedCount =
        isViewerChoice && optimisticIncrement
          ? opt.voteCount + 1
          : opt.voteCount;
      return {
        ...opt,
        voteCount: bumpedCount,
        isViewerChoice,
        pct: clampPct((bumpedCount / safeTotal) * 100),
      };
    });
    return { resolvedOptions: resolved, displayedTotal: bumpedTotal };
  }, [poll, optimisticVoteOptionId, optimisticIncrement]);

  // Closes-at line. Computed inline (not memoized) so the relative-time string
  // refreshes whenever the parent re-renders. Memoization would freeze `now`
  // on first render — same hydration / refresh convention as `formattedTime`
  // in post-card-01.tsx.
  let closesAtLine: string | undefined;
  if (isClosed) {
    closesAtLine = labels.pollClosedLabel;
  } else if (closesDate && formatRelativeTime) {
    closesAtLine = labels.pollClosesAtLabel.replace(
      "{time}",
      formatRelativeTime(closesDate, now),
    );
  }

  const totalVotesLine = labels.pollTotalVotesLabel.replace(
    "{count}",
    String(displayedTotal),
  );

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-border bg-card p-3",
        className,
      )}
      role="group"
      aria-label={labels.pollHeading}
    >
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{labels.pollHeading}</span>
        <span className="flex items-center gap-2">
          <span>{totalVotesLine}</span>
          {closesAtLine ? <span aria-hidden="true">·</span> : null}
          {closesAtLine ? <span>{closesAtLine}</span> : null}
        </span>
      </div>

      {showResults ? (
        <ul className="flex flex-col gap-2">
          {resolvedOptions.map((opt) => (
            <li key={opt.id} className="relative">
              <div
                className={cn(
                  "relative flex items-center justify-between gap-2 overflow-hidden rounded-md border border-border bg-muted/30 px-3 py-2 text-sm",
                  opt.isViewerChoice && "ring-1 ring-primary",
                )}
              >
                <div
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-y-0 left-0 transition-[width] duration-300 ease-out motion-reduce:transition-none",
                    opt.isViewerChoice ? "bg-primary/20" : "bg-foreground/[0.06]",
                  )}
                  style={{ width: `${opt.pct}%` }}
                />
                <span className="relative min-w-0 truncate font-medium">
                  {opt.label}
                </span>
                <span className="relative shrink-0 tabular-nums text-xs text-muted-foreground">
                  {Math.round(opt.pct)}%
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="flex flex-col gap-2">
          {resolvedOptions.map((opt) => (
            <li key={opt.id}>
              <button
                type="button"
                onClick={onVote ? () => onVote(opt.id) : undefined}
                disabled={!onVote}
                className={cn(
                  "flex h-11 w-full items-center justify-start rounded-md border border-border bg-background px-3 text-sm font-medium",
                  "transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                <span className="min-w-0 truncate">{opt.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

PollWidget.displayName = "PollWidget";
