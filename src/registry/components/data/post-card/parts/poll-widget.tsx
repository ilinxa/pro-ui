"use client";

import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { useNow } from "../hooks/use-now";
import { resolveLocale, toDate } from "../../comment-thread/lib/format-time";
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
    /** `formatted` is the count in the card's locale. */
    pollTotalVotesLabel: (count: number, formatted: string) => string;
    pollClosesAtLabel: (time: string) => string;
    pollClosedLabel: string;
  };
  /** Relative-time formatter for the closesAt countdown. */
  formatRelativeTime?: (date: Date, now: Date) => string;
  /** Count formatter for the total. Default: the plain number. */
  formatCount?: (n: number) => string;
  /**
   * "Now" for the closed check and the countdown. Without it the widget reads the clock after
   * mount (before that the poll counts as open and shows no countdown).
   */
  now?: Date;
  /** BCP 47 locale of the percentages. Default "en". */
  locale?: string;
  /**
   * A vote is in flight: the vote buttons stay (`aria-disabled`) and ignore taps, so a second tap
   * cannot send a second vote.
   */
  busy?: boolean;
  className?: string;
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
 * Optimistic vote: the card applies the vote to the shown post itself and passes
 * `optimisticIncrement={false}`; `optimisticIncrement` remains for standalone use, where
 * the caller wants the picked option's count + the total bumped by one.
 *
 * Multi-select polls are not supported — single-vote
 * behavior renders regardless of `poll.multiSelect` (not implemented).
 * (additive when added).
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
  formatCount,
  now: nowProp,
  locale,
  busy = false,
  className,
}: PollWidgetProps) {
  const now = useNow(nowProp);
  const percent = useMemo(
    () => new Intl.NumberFormat(resolveLocale(locale), { style: "percent", maximumFractionDigits: 0 }),
    [locale],
  );
  const closesDate = poll.closesAt ? toDate(poll.closesAt) : undefined;
  const isClosed = !!(closesDate && now && closesDate.getTime() <= now.getTime());
  const showResults = isOwnerView || hasVoted || isClosed;

  // Tapping a vote button unmounts it when the view flips to the results; focus moves to the
  // poll group (a programmatic target only) instead of falling to <body>.
  const groupRef = useRef<HTMLDivElement>(null);
  const refocus = useRef(false);
  useEffect(() => {
    if (showResults) {
      if (refocus.current) {
        refocus.current = false;
        groupRef.current?.focus();
      }
    } else if (!busy) {
      refocus.current = false;
    }
  }, [showResults, busy]);

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

  // Closes-at line. Needs "now": before it is known (the server and the first client render)
  // the poll counts as open and shows no countdown.
  let closesAtLine: string | undefined;
  if (isClosed) {
    closesAtLine = labels.pollClosedLabel;
  } else if (closesDate && now && formatRelativeTime) {
    closesAtLine = labels.pollClosesAtLabel(formatRelativeTime(closesDate, now));
  }

  const totalVotesLine = labels.pollTotalVotesLabel(
    displayedTotal,
    formatCount ? formatCount(displayedTotal) : String(displayedTotal),
  );

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-border bg-card p-3",
        className,
      )}
      role="group"
      aria-label={labels.pollHeading}
      ref={groupRef}
      tabIndex={-1}
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
                    "absolute inset-y-0 start-0 transition-[width] duration-300 ease-out motion-reduce:transition-none",
                    opt.isViewerChoice ? "bg-primary/20" : "bg-foreground/[0.06]",
                  )}
                  style={{ width: `${opt.pct}%` }}
                />
                <span className="relative min-w-0 truncate font-medium">
                  {opt.label}
                </span>
                <span className="relative shrink-0 tabular-nums text-xs text-muted-foreground">
                  {percent.format(opt.pct / 100)}
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
                onClick={
                  onVote
                    ? () => {
                        if (busy) return;
                        refocus.current = true;
                        onVote(opt.id);
                      }
                    : undefined
                }
                disabled={!onVote}
                aria-disabled={busy ? true : undefined}
                className={cn(
                  "flex h-11 w-full items-center justify-start rounded-md border border-border bg-background px-3 text-sm font-medium",
                  "transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:opacity-60",
                  "focus:outline-none",
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
