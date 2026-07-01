import type { ReactNode } from "react";

/**
 * `team-quest-log-01` — public type surface.
 *
 * Framework-free (no `"use client"`). Per system D-03 the domain slice is
 * **re-declared locally** — this component imports nothing from another registry
 * component. The `gamification-system` §4 model is the source of truth these are
 * copied from (only the rendered fields), byte-faithful, not imported.
 */

/** This team (D-15 subset). `name` is the fallback title; `questName` the chosen one. */
export interface Team {
  id: string;
  name: string;
  /** The chosen quest title; empty/blank → falls back to `name` (never forced). */
  questName?: string;
}

/** A host-owned milestone — the shared spine each chapter frames (D-09). */
export interface Milestone {
  id: string;
  label: string;
  done: boolean;
  /** ISO 8601 — optional "completed on" affordance. */
  doneAt?: string;
  order: number;
}

/** A narrative beat framing a milestone. */
export interface NarrativeChapter {
  id: string;
  title: string;
  /** Links the beat to its `Milestone` (the shared spine, D-09). */
  milestoneId: string;
  order: number;
}

/** The local slice of the system §6 union — the one event this component emits. */
export type GamificationEvent = {
  type: "narrative.chapter-viewed";
  teamId: string;
  chapterId: string;
};

/** Resolved beat state (see `lib/derive-beats.ts`). */
export type BeatState = "done" | "current" | "upcoming";

/** One derived beat — the render-ready unit. */
export interface DerivedBeat {
  chapter: NarrativeChapter;
  /** Resolved by `milestoneId`; `undefined` → unresolved (renders gracefully + warns). */
  milestone?: Milestone;
  state: BeatState;
  /** `true` → `milestoneId` matched no milestone. */
  unresolved: boolean;
}

/** Data + behavioral surface shared by the assembly and the headless Root. */
export interface TeamQuestLogBaseProps {
  /** The team — literal name (fallback) + optional quest name (D-15 subset). */
  team: Team;
  /** Host-owned milestones — the shared spine (D-09). */
  milestones: Milestone[];
  /** The narrative beats; each frames a milestone. Empty → quiet empty state. */
  chapters: NarrativeChapter[];
  /** Allow inline name editing. Default `true`; `false` → display-only title. */
  editableName?: boolean;
  /** Fires on save. Empty/blank ⇒ revert to the team's literal name (never forced). */
  onQuestNameChange?: (questName: string) => void;
  /** Telemetry (system §6, D-07) — emits `narrative.chapter-viewed`, fire-once per mount. */
  onEvent?: (event: GamificationEvent) => void;
  /** Fires when a chapter beat is activated; also drives the telemetry fallback when IO is unavailable. */
  onChapterClick?: (chapter: NarrativeChapter) => void;
  /** Override an individual beat's render. */
  renderChapter?: (ctx: {
    chapter: NarrativeChapter;
    state: BeatState;
  }) => ReactNode;
  className?: string;
  "aria-label"?: string;
}

/** Props for the batteries-included `TeamQuestLog01` assembly. */
export interface TeamQuestLogProps extends TeamQuestLogBaseProps {
  /** Show the quest-name editor. Default `true`. */
  showNameEditor?: boolean;
  /** Show the chapter timeline. Default `true`. */
  showChapters?: boolean;
}

/** Props for the headless provider `TeamQuestLogRoot`. */
export interface TeamQuestLogRootProps extends TeamQuestLogBaseProps {
  children: ReactNode;
}

/** Light imperative handle (exposed via `forwardRef` on Root + the assembly). */
export interface TeamQuestLogHandle {
  /** Enter edit mode + focus the quest-name input. */
  focusNameEditor(): void;
  /** Scroll the matching chapter beat into view. */
  scrollToChapter(chapterId: string): void;
}

/** The value every context part reads — one source of truth. */
export interface TeamQuestLogContextValue {
  team: Team;
  /** Resolved title = `questName?.trim() || name`. */
  title: string;
  /** `true` when falling back to the literal team name. */
  isDefaultTitle: boolean;
  beats: DerivedBeat[];
  editableName: boolean;
  /** `true` when the edit affordance should show (editable + a save handler wired). */
  canEditName: boolean;
  // Name draft/edit state (transient UI state — not data state, D-06).
  editing: boolean;
  draft: string;
  startEditing(): void;
  setDraft(value: string): void;
  saveDraft(): void;
  cancelEditing(): void;
  // Chapter interaction + telemetry.
  onChapterClick?: (chapter: NarrativeChapter) => void;
  onEvent?: (event: GamificationEvent) => void;
  renderChapter?: (ctx: {
    chapter: NarrativeChapter;
    state: BeatState;
  }) => ReactNode;
  /** Registers the quest-name input node for focus + the chapter rail node for scroll. */
  registerNameInput(node: HTMLInputElement | null): void;
  registerRail(node: HTMLElement | null): void;
}

// Tier-C primitive prop types.

export interface QuestTitleProps {
  title: string;
  isDefault?: boolean;
  className?: string;
}

export interface QuestNameFieldProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  inputRef?: (node: HTMLInputElement | null) => void;
  className?: string;
}

export interface ChapterBeatProps {
  chapter: NarrativeChapter;
  state: BeatState;
  milestone?: Milestone;
  onClick?: (chapter: NarrativeChapter) => void;
  className?: string;
}

export interface ChapterRailProps {
  beats: DerivedBeat[];
  onBeatClick?: (chapter: NarrativeChapter) => void;
  renderChapter?: (ctx: {
    chapter: NarrativeChapter;
    state: BeatState;
  }) => ReactNode;
  className?: string;
}
