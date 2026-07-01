"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import { TeamFeedbackContext } from "../hooks/use-team-feedback-context";
import { clampDuration } from "../lib/clamp";
import type {
  FeedbackEvent,
  NextTaskSuggestion,
  TeamFeedbackContextValue,
  TeamFeedbackLoopHandle,
  TeamFeedbackLoopRootProps,
} from "../types";

// --- reduced-motion as an external store (SSR-safe; no set-state-in-effect) ---
function subscribeReducedMotion(callback: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}
function getReducedMotionSnapshot(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function getReducedMotionServerSnapshot(): boolean {
  return false;
}

// --- the single chokepoint reducer (both trigger paths funnel here, C3/C5) ---
type FeedbackState = {
  current: FeedbackEvent | null;
  epoch: number;
  dismissedTaskId: string | null;
};

type FeedbackAction =
  | { type: "open"; event: FeedbackEvent }
  | { type: "close" }
  | { type: "nudge-dismiss"; taskId: string }
  | { type: "nudge-rearm" };

function reducer(state: FeedbackState, action: FeedbackAction): FeedbackState {
  switch (action.type) {
    case "open":
      // Newest wins, never stack: one slot; bump epoch to re-arm the timer (C5).
      return { ...state, current: action.event, epoch: state.epoch + 1 };
    case "close":
      return state.current === null ? state : { ...state, current: null };
    case "nudge-dismiss":
      return { ...state, dismissedTaskId: action.taskId };
    case "nudge-rearm":
      return state.dismissedTaskId === null
        ? state
        : { ...state, dismissedTaskId: null };
    default:
      return state;
  }
}

/**
 * Tier B — headless provider. Owns the single current-event reducer that BOTH
 * the controlled `event` prop AND the imperative `celebrate()`/`dismiss()` handle
 * funnel into (C3), the < 1s auto-dismiss timer (clamped, D-10), the reduced-motion
 * read, the skip/Esc handlers, and the nudge dismissed/re-arm state. Holds NO
 * milestone/badge/task data — only "what to show right now". `onCelebrationDismiss`
 * fires ONLY on auto/skip/imperative-dismiss, never on a host-driven `event = null`
 * (controlled-echo). SSR-safe: `current` starts null, `reducedMotion` false on the
 * server → no animation/timer on first paint.
 */
export const TeamFeedbackLoopRoot = React.forwardRef<
  TeamFeedbackLoopHandle,
  TeamFeedbackLoopRootProps
>(function TeamFeedbackLoopRoot(
  {
    teamId,
    event,
    celebrationDurationMs,
    enableConfetti = false,
    renderCelebration,
    onCelebrationDismiss,
    nextTask,
    onNextTask,
    onNudgeDismiss,
    nudgePlacement = "inline",
    className,
    "aria-label": ariaLabel,
    children,
  },
  ref,
) {
  const [state, dispatch] = React.useReducer(reducer, {
    current: null,
    epoch: 0,
    dismissedTaskId: null,
  });
  // Destructure to locals so effect/memo deps are plain values (the exhaustive-deps
  // rule can't verify reducer-state member access is immutable).
  const { current, epoch, dismissedTaskId } = state;

  const reducedMotion = React.useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  // --- stable callback refs (assigning ref.current in an effect is NOT setState) ---
  const onDismissRef = React.useRef(onCelebrationDismiss);
  const onAcceptRef = React.useRef(onNextTask);
  const onNudgeDismissRef = React.useRef(onNudgeDismiss);
  const currentRef = React.useRef<FeedbackEvent | null>(null);
  React.useEffect(() => {
    onDismissRef.current = onCelebrationDismiss;
    onAcceptRef.current = onNextTask;
    onNudgeDismissRef.current = onNudgeDismiss;
  }, [onCelebrationDismiss, onNextTask, onNudgeDismiss]);
  React.useEffect(() => {
    currentRef.current = current;
  }, [current]);

  // --- skip = user/imperative dismiss (fires the callback with reason "skip") ---
  const skip = React.useCallback(() => {
    const evt = currentRef.current;
    if (evt) onDismissRef.current?.(evt, "skip");
    dispatch({ type: "close" });
  }, []);

  // --- auto-dismiss timer: armed per open (keyed on current + epoch), cleared on close ---
  React.useEffect(() => {
    if (current === null) return;
    const ms = clampDuration(celebrationDurationMs);
    const id = window.setTimeout(() => {
      onDismissRef.current?.(current, "auto");
      dispatch({ type: "close" });
    }, ms);
    return () => window.clearTimeout(id);
  }, [current, epoch, celebrationDurationMs]);

  // --- controlled `event` prop → funnels into the reducer (undefined = imperative-only) ---
  const lastEventRef = React.useRef<FeedbackEvent | null | undefined>(undefined);
  React.useEffect(() => {
    if (event === undefined) return; // uncontrolled: imperative handle only
    if (event === lastEventRef.current) return;
    lastEventRef.current = event;
    if (event != null) {
      dispatch({ type: "open", event });
    } else {
      // Host-driven close — silent (no onCelebrationDismiss echo).
      dispatch({ type: "close" });
    }
  }, [event]);

  // --- Esc skips (additive, non-trapping) while a celebration is open ---
  React.useEffect(() => {
    if (current === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [current, skip]);

  // --- imperative handle (both paths land in the same reducer) ---
  React.useImperativeHandle(
    ref,
    () => ({
      celebrate(evt: FeedbackEvent) {
        dispatch({ type: "open", event: evt });
      },
      dismiss() {
        skip();
      },
    }),
    [skip],
  );

  // --- nudge: re-arm when a NEW taskId arrives ---
  const lastTaskIdRef = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    const taskId = nextTask?.taskId;
    if (taskId === lastTaskIdRef.current) return;
    lastTaskIdRef.current = taskId;
    if (taskId != null) dispatch({ type: "nudge-rearm" });
  }, [nextTask?.taskId]);

  const acceptNudge = React.useCallback((s: NextTaskSuggestion) => {
    onAcceptRef.current?.(s);
  }, []);
  const dismissNudge = React.useCallback((s: NextTaskSuggestion) => {
    dispatch({ type: "nudge-dismiss", taskId: s.taskId });
    onNudgeDismissRef.current?.(s);
  }, []);

  const nudge =
    nextTask && nextTask.taskId !== dismissedTaskId ? nextTask : null;

  const contextValue = React.useMemo<TeamFeedbackContextValue>(
    () => ({
      current,
      reducedMotion,
      enableConfetti,
      renderCelebration,
      skip,
      nudge,
      nudgePlacement,
      acceptNudge,
      dismissNudge,
      teamId,
    }),
    [
      current,
      reducedMotion,
      enableConfetti,
      renderCelebration,
      skip,
      nudge,
      nudgePlacement,
      acceptNudge,
      dismissNudge,
      teamId,
    ],
  );

  return (
    <TeamFeedbackContext.Provider value={contextValue}>
      <div
        data-slot="team-feedback-loop"
        className={cn(className)}
        aria-label={ariaLabel}
      >
        {children}
      </div>
    </TeamFeedbackContext.Provider>
  );
});
