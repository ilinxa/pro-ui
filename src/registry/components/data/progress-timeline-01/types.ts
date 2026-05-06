import type { ComponentType, ReactNode } from "react";
import type {
  TimelineState,
  TimelineStatus,
} from "./lib/timeline-state";

export type { TimelineState, TimelineStatus };

export type TimelineLabelText =
  | string
  | ((state: TimelineState) => ReactNode);

export interface ProgressTimeline01Labels {
  /** Default: "Start". Static left-side caption. */
  startLabel?: ReactNode;
  /** Default: "End". Static right-side caption. */
  endLabel?: ReactNode;
  /** Default: state-aware — "{n} days until start". When `now < start`. */
  beforeText?: TimelineLabelText;
  /** Default: state-aware — "{n} days left". When `now ∈ [start, end]`. */
  activeText?: TimelineLabelText;
  /** Default: "Ended". When `now > end`. */
  afterText?: TimelineLabelText;
  /** aria-label on the progress bar. Default: "Timeline progress". */
  ariaLabel?: string;
}

export interface ProgressTimeline01Props {
  /** Start of the timeline window. ISO string or Date. Required. */
  start: Date | string;
  /** End of the timeline window. ISO string or Date. Required. */
  end: Date | string;

  /** Inject "now" for deterministic state (tests, live clocks). Default: new Date() at render. */
  now?: Date;

  /** Escape hatch: explicit 0-100 percentage. Overrides start/end-derived percent (state still derives from dates). */
  value?: number;

  /** Override the auto-derived state. Rare. */
  statusOverride?: TimelineStatus;

  // ─── Heading ─────────────────────────────────────────────────────
  /** Optional section heading. */
  heading?: string;
  /** Heading semantic level. Default: 'h3'. */
  headingAs?: "h2" | "h3" | "h4";
  /** Heading icon (default Timer). Pass null to omit. */
  headingIcon?: ComponentType<{
    className?: string;
    "aria-hidden"?: boolean | "true" | "false";
  }> | null;

  // ─── Visual ──────────────────────────────────────────────────────
  /** Wrap in card chrome (`bg-card rounded-2xl p-6 border ...`). Default: true. */
  framed?: boolean;
  /** Marker dot variant. Default: 'dot'. */
  marker?: "dot" | "none";

  /** Localized labels + render-function overrides. */
  labels?: ProgressTimeline01Labels;

  /** Custom center-label renderer — full takeover of the dynamic center caption. Receives derived TimelineState. */
  renderCenterLabel?: (state: TimelineState) => ReactNode;

  // ─── Style overrides ─────────────────────────────────────────────
  className?: string;
  headingClassName?: string;
  barClassName?: string;
  markerClassName?: string;
  captionsClassName?: string;
}

/** Default English labels — exported for consumer composition. */
export const DEFAULT_PROGRESS_TIMELINE_LABELS: {
  startLabel: ReactNode;
  endLabel: ReactNode;
  beforeText: TimelineLabelText;
  activeText: TimelineLabelText;
  afterText: TimelineLabelText;
  ariaLabel: string;
} = {
  startLabel: "Start",
  endLabel: "End",
  beforeText: (state) =>
    `${state.daysToStart} day${state.daysToStart === 1 ? "" : "s"} until start`,
  activeText: (state) =>
    `${state.daysToEnd} day${state.daysToEnd === 1 ? "" : "s"} left`,
  afterText: "Ended",
  ariaLabel: "Timeline progress",
};
