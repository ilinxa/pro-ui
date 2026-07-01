"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import { CooperativeChallengeContext } from "../hooks/use-cooperative-challenge";
import {
  DEFAULT_JOIN_LABEL,
  DEFAULT_LEAVE_LABEL,
  DEFAULT_NO_PENALTY_HINT,
  deriveChallenge,
} from "../lib/derive";
import { openedEvent, optInEvent } from "../lib/events";
import type {
  CooperativeChallengeContextValue,
  CooperativeChallengeRootProps,
} from "../types";

/**
 * Tier B — headless provider. The **single** source of derived state, the
 * **single** controlled-echo chokepoint (reads `challenge.optedIn`, holds no
 * local opt-in state — the rich-card/calendar controlled-echo lesson), and the
 * **single** telemetry chokepoint (`challenge.opened` mount-effect,
 * double-emit-guarded + `challenge.opt-in` on toggle). No layout opinion beyond
 * the labelled region + `reveal-up`; renders `children`.
 */
export function CooperativeChallengeRoot({
  challenge,
  team,
  onOptInChange,
  onEvent,
  joinLabel = DEFAULT_JOIN_LABEL,
  leaveLabel = DEFAULT_LEAVE_LABEL,
  noPenaltyHint = DEFAULT_NO_PENALTY_HINT,
  children,
  className,
  "aria-label": ariaLabel,
}: CooperativeChallengeRootProps) {
  // Latest props read through refs so `toggleOptIn` + the opened-effect stay
  // stable and an inline `onEvent`/`onOptInChange` never re-subscribes anything.
  const challengeRef = React.useRef(challenge);
  const teamRef = React.useRef(team);
  const onOptInChangeRef = React.useRef(onOptInChange);
  const onEventRef = React.useRef(onEvent);
  React.useEffect(() => {
    challengeRef.current = challenge;
    teamRef.current = team;
    onOptInChangeRef.current = onOptInChange;
    onEventRef.current = onEvent;
  });

  const derived = React.useMemo(() => deriveChallenge(challenge), [challenge]);

  // `challenge.opened` — once on first reveal/mount (D-C5). Guard keyed on the
  // challenge id: StrictMode double-invoke + re-renders don't re-fire, but a new
  // challenge mounted into the same Root is correctly a fresh "opened".
  const firedRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (firedRef.current === challenge.id) return;
    firedRef.current = challenge.id;
    onEventRef.current?.(openedEvent(teamRef.current, challengeRef.current));
  }, [challenge.id]);

  const toggleOptIn = React.useCallback(() => {
    const next = !challengeRef.current.optedIn;
    // Host callback first (it owns the value + re-renders with the new
    // `challenge.optedIn`), then telemetry — the family's veto-friendly order.
    onOptInChangeRef.current?.(next);
    onEventRef.current?.(
      optInEvent(teamRef.current, challengeRef.current, next),
    );
  }, []);

  const canOptIn = typeof onOptInChange === "function";

  const contextValue = React.useMemo<CooperativeChallengeContextValue>(
    () => ({
      challenge,
      team,
      derived,
      canOptIn,
      toggleOptIn,
      joinLabel,
      leaveLabel,
      noPenaltyHint,
    }),
    [
      challenge,
      team,
      derived,
      canOptIn,
      toggleOptIn,
      joinLabel,
      leaveLabel,
      noPenaltyHint,
    ],
  );

  return (
    <CooperativeChallengeContext.Provider value={contextValue}>
      <div
        role="group"
        aria-label={ariaLabel ?? challenge.label}
        data-state={
          derived.isComplete
            ? "complete"
            : derived.isActive
              ? "active"
              : "joinable"
        }
        className={cn(
          "reveal-up flex w-full flex-col gap-4 rounded-xl border bg-card p-5 text-card-foreground transition-colors",
          // Earned = signal-lime emphasis; active = subtle lime ring; joinable = neutral.
          derived.isComplete
            ? "border-primary/60 bg-primary/5"
            : derived.isActive
              ? "border-primary/40"
              : "border-border",
          className,
        )}
      >
        {children}
      </div>
    </CooperativeChallengeContext.Provider>
  );
}
