import type { FeedbackEvent, NextTaskSuggestion } from "./types";

/** One event per kind — all copy TEAM-scoped, never an individual (D-08). */
export const FEEDBACK_EVENTS: Record<FeedbackEvent["kind"], FeedbackEvent> = {
  milestone: {
    kind: "milestone",
    title: "Your team reached the first playable build!",
    detail: "Chapter 3 of the journey is complete.",
    narrativeBeat: "The prototype breathes",
  },
  badge: {
    kind: "badge",
    title: "Your team earned the Vertical Slice trophy",
    detail: "A polished slice, end to end.",
  },
  "task-complete": {
    kind: "task-complete",
    title: "Your team cleared the backlog column",
  },
};

/** A long title to exercise graceful truncation. */
export const LONG_TITLE_EVENT: FeedbackEvent = {
  kind: "milestone",
  title:
    "Your team shipped the entire onboarding flow, the settings panel, and the localization pass all in one sprint",
  detail: "An unusually big week — every planned milestone landed at once.",
  narrativeBeat: "A season closes",
};

/** The next-task suggestion for the nudge. */
export const NEXT_TASK: NextTaskSuggestion = {
  taskId: "task-42",
  label: "Pick up: wire the win screen",
};

/** A long-label suggestion to exercise the nudge's line-clamp + title fallback. */
export const LONG_NEXT_TASK: NextTaskSuggestion = {
  taskId: "task-99",
  label:
    "Pick up: reconcile the analytics events with the new milestone schema and backfill the last two weeks",
};
