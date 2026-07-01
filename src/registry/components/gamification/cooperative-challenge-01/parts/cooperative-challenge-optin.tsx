"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useCooperativeChallenge } from "../hooks/use-cooperative-challenge";
import {
  DEFAULT_JOIN_LABEL,
  DEFAULT_LEAVE_LABEL,
  DEFAULT_NO_PENALTY_HINT,
} from "../lib/derive";
import type { OptInToggleProps } from "../types";

/**
 * Tier C — the context-free opt-in **button-toggle** (catalogue C5), droppable
 * on any surface. The never-forced rule made literal (system §5.2):
 *
 *  - **Join** (opted-out) is a *prominent, inviting* primary action — never a
 *    greyed/disabled/failure treatment.
 *  - **Leave** (opted-in) is a *plain, single-click* action — no confirm dialog,
 *    no "are you sure you want to abandon?" guilt, no warning tone. Leaving is
 *    as cost-free as joining.
 *  - The `noPenaltyHint` is visible in **both** states and associated with the
 *    control via `aria-describedby`, so cost-free is explicit in copy, not just
 *    behavior.
 *
 * A labelled button (the visible text carries the copy) reads never-forced far
 * better than a bare `switch` thumb (which implies a "correct" default). State
 * is also conveyed via `aria-pressed`.
 */
export function OptInToggle({
  optedIn,
  onOptInChange,
  joinLabel = DEFAULT_JOIN_LABEL,
  leaveLabel = DEFAULT_LEAVE_LABEL,
  noPenaltyHint = DEFAULT_NO_PENALTY_HINT,
  disabled = false,
  className,
}: OptInToggleProps) {
  const hintId = React.useId();

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Button
        type="button"
        variant={optedIn ? "outline" : "default"}
        size="sm"
        aria-pressed={optedIn}
        aria-describedby={hintId}
        disabled={disabled}
        onClick={() => onOptInChange?.(!optedIn)}
        className="w-fit"
      >
        {optedIn ? leaveLabel : joinLabel}
      </Button>
      {noPenaltyHint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {noPenaltyHint}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Tier B — context wrapper: the opt-in/opt-out control. **Hides entirely** when
 * no `onOptInChange` is wired (capability-gating → a read-only card falls out
 * for free, §6.2). The assembly further gates it with `showOptIn`.
 */
export function CooperativeChallengeOptIn() {
  const { challenge, canOptIn, toggleOptIn, joinLabel, leaveLabel, noPenaltyHint } =
    useCooperativeChallenge();

  if (!canOptIn) return null;

  return (
    <OptInToggle
      optedIn={challenge.optedIn}
      onOptInChange={toggleOptIn}
      joinLabel={joinLabel}
      leaveLabel={leaveLabel}
      noPenaltyHint={noPenaltyHint}
    />
  );
}
