/**
 * Fixed reference date used by every demo card via the `now` prop.
 * Without this, demo states depend on the real wall clock and silently drift.
 */
export const dummyNow = new Date("2026-06-01T12:00:00Z");

/** A timeline currently in progress — dummyNow is between start and end. */
export const dummyTimelineActive = {
  start: "2026-04-01",
  end: "2026-06-30",
} as const;

/** A timeline that hasn't started yet. */
export const dummyTimelineBefore = {
  start: "2026-08-01",
  end: "2026-09-15",
} as const;

/** A timeline that has already ended. */
export const dummyTimelineAfter = {
  start: "2026-03-01",
  end: "2026-05-15",
} as const;
