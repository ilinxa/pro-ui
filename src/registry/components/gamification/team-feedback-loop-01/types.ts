import type { ReactNode } from "react";

/**
 * `team-feedback-loop-01` — public type surface.
 *
 * Framework-free (no `"use client"`): importable from a server component's type
 * position. Per system D-03 every type is **re-declared locally** — this
 * component imports nothing from another registry component. These E6 trigger
 * shapes are intentionally component-local (system §4), not in the shared model.
 */

/** What just happened — drives the celebration. Host-owned; pushed in. */
export interface FeedbackEvent {
  kind: "milestone" | "badge" | "task-complete";
  /** Team-scoped copy ("Your team…"); NEVER an individual (D-08). */
  title: string;
  detail?: string;
  /** Optional progression-loop chapter line (E5 overlap). */
  narrativeBeat?: string;
}

/** What to do next — drives the nudge. Closes the engagement loop. */
export interface NextTaskSuggestion {
  /** Opaque to this component; returned on accept. */
  taskId: string;
  label: string;
}

/**
 * Telemetry slice (D-07 symmetry). **This component emits NOTHING** — the
 * catalogue lists no telemetry event for E6 (C4: accept-but-silent). The prop is
 * accepted for API symmetry; the host types its own envelope.
 */
export type GamificationEvent = { type: string; teamId: string; [key: string]: unknown };

export type NudgePlacement = "inline" | "corner";

/** Data + trigger + callback surface shared by the assembly and the headless `Root`. */
export interface TeamFeedbackLoopBaseProps {
  /** Team identity for team-scoped copy + (if wired) telemetry envelope. Identity-only (D-15). */
  teamId: string;

  // Celebration — controlled trigger (primary, C3).
  /** Set → (re)open the celebration; `null` → close (silently). Omit entirely for imperative-only. */
  event?: FeedbackEvent | null;
  /** Auto-dismiss after N ms. Clamped to [200, 999) (D-10). Default ~800. */
  celebrationDurationMs?: number;
  /** Opt-in lazy confetti for `milestone`/`badge` kinds. Default `false`. */
  enableConfetti?: boolean;
  /** Override the celebration body; the wrapper stays non-blocking regardless. */
  renderCelebration?: (event: FeedbackEvent) => ReactNode;
  /** Fired when the celebration is dismissed by the timer (`auto`) or the user (`skip`). */
  onCelebrationDismiss?: (event: FeedbackEvent, reason: "auto" | "skip") => void;

  // Next-task nudge.
  nextTask?: NextTaskSuggestion;
  onNextTask?: (suggestion: NextTaskSuggestion) => void;
  onNudgeDismiss?: (suggestion: NextTaskSuggestion) => void;
  /** Where the nudge mounts. Default `"inline"`. NEVER modal. */
  nudgePlacement?: NudgePlacement;

  /** Telemetry (D-07) — accepted for symmetry, emits nothing for E6 (C4). */
  onEvent?: (event: GamificationEvent) => void;

  className?: string;
  "aria-label"?: string;
}

/** Props for the batteries-included `TeamFeedbackLoop01` assembly. */
export interface TeamFeedbackLoop01Props extends TeamFeedbackLoopBaseProps {
  /** Render the celebration surface. Default `true`. */
  showCelebration?: boolean;
  /** Render the nudge surface. Default `true`. */
  showNudge?: boolean;
}

/** Props for the headless provider `TeamFeedbackLoopRoot`. */
export interface TeamFeedbackLoopRootProps extends TeamFeedbackLoopBaseProps {
  children: ReactNode;
}

/** Imperative handle (C3 — both trigger paths, controlled-primary). Lives on `Root`. */
export interface TeamFeedbackLoopHandle {
  /** Fire a celebration imperatively → reducer `open`. */
  celebrate(event: FeedbackEvent): void;
  /** Dismiss the current celebration now → reducer `close` (reason `"skip"`). */
  dismiss(): void;
}

/** Props for the context-free Tier-C `CelebrationOverlay`. */
export interface CelebrationOverlayProps {
  event: FeedbackEvent;
  reducedMotion: boolean;
  onSkip: () => void;
  render?: (event: FeedbackEvent) => ReactNode;
  /** Confetti burst slot (rendered inside the non-blocking wrapper). */
  children?: ReactNode;
  className?: string;
}

/** Props for the context-free Tier-C `NextTaskNudge`. */
export interface NextTaskNudgeProps {
  suggestion: NextTaskSuggestion;
  placement?: NudgePlacement;
  onAccept: (suggestion: NextTaskSuggestion) => void;
  onDismiss: (suggestion: NextTaskSuggestion) => void;
  className?: string;
}

/** The resolved state every context part reads — one source of truth. */
export interface TeamFeedbackContextValue {
  current: FeedbackEvent | null;
  reducedMotion: boolean;
  enableConfetti: boolean;
  renderCelebration?: (event: FeedbackEvent) => ReactNode;
  /** Dismiss the celebration now (fires `onCelebrationDismiss(event, "skip")`). */
  skip: () => void;
  /** The visible nudge (null when unset or dismissed). */
  nudge: NextTaskSuggestion | null;
  nudgePlacement: NudgePlacement;
  acceptNudge: (suggestion: NextTaskSuggestion) => void;
  dismissNudge: (suggestion: NextTaskSuggestion) => void;
  teamId: string;
}
