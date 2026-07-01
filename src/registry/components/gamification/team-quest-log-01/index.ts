// Tier A — batteries-included assembly.
export { TeamQuestLog01 } from "./team-quest-log-01";

// Tier B — headless provider + flat à-la-carte context parts.
export { TeamQuestLogRoot } from "./parts/team-quest-log-root";
export { TeamQuestNameEditor } from "./parts/team-quest-name-editor";
export { TeamQuestChapters } from "./parts/team-quest-chapters";

// Tier C — standalone, context-free primitives.
export { QuestTitle, QuestNameField } from "./parts/team-quest-name-editor";
export { ChapterRail, EmptyNarrative } from "./parts/team-quest-chapters";
export { ChapterBeat } from "./parts/chapter-beat";

// Context consumer for hand-assembled layouts.
export { useTeamQuestLog } from "./hooks/use-team-quest-log";

// Pure helpers (a hand-assembly resolves identically).
export { resolveQuestTitle } from "./lib/resolve-title";
export { deriveBeats } from "./lib/derive-beats";

// Public types.
export type {
  Team,
  Milestone,
  NarrativeChapter,
  GamificationEvent,
  BeatState,
  DerivedBeat,
  TeamQuestLogProps,
  TeamQuestLogBaseProps,
  TeamQuestLogRootProps,
  TeamQuestLogHandle,
  TeamQuestLogContextValue,
  QuestTitleProps,
  QuestNameFieldProps,
  ChapterBeatProps,
  ChapterRailProps,
} from "./types";
