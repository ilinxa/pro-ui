"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import { TeamQuestLogContext } from "../hooks/use-team-quest-log";
import { deriveBeats } from "../lib/derive-beats";
import { resolveQuestTitle } from "../lib/resolve-title";
import type {
  TeamQuestLogContextValue,
  TeamQuestLogHandle,
  TeamQuestLogRootProps,
} from "../types";

/**
 * Tier B — headless provider. The single source of state: the resolved quest
 * title (`questName?.trim() || name` — the never-forced core), the transient
 * name draft/edit state (UI state, not data state — controlled, D-06), the
 * memoized beat derivation, chapter interaction + telemetry pass-through, and
 * the imperative handle. Renders `children`, no layout opinion beyond a labelled
 * region + `reveal-up`.
 */
export const TeamQuestLogRoot = React.forwardRef<
  TeamQuestLogHandle,
  TeamQuestLogRootProps
>(function TeamQuestLogRoot(
  {
    team,
    milestones,
    chapters,
    editableName = true,
    onQuestNameChange,
    onEvent,
    onChapterClick,
    renderChapter,
    children,
    className,
    "aria-label": ariaLabel,
  },
  ref,
) {
  const { title, isDefault } = React.useMemo(
    () => resolveQuestTitle(team),
    [team],
  );

  const beats = React.useMemo(
    () => deriveBeats(chapters, milestones),
    [chapters, milestones],
  );

  const canEditName = editableName && typeof onQuestNameChange === "function";

  // Transient draft/edit state (UI, not data — D-06 intact).
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState("");

  const startEditing = React.useCallback(() => {
    if (!canEditName) return;
    setDraft(isDefault ? "" : title);
    setEditing(true);
  }, [canEditName, isDefault, title]);

  const onQuestNameChangeRef = React.useRef(onQuestNameChange);
  React.useEffect(() => {
    onQuestNameChangeRef.current = onQuestNameChange;
  });

  const saveDraft = React.useCallback(() => {
    // Blank/whitespace ⇒ "" ⇒ host clears questName ⇒ title reverts (the skip path).
    onQuestNameChangeRef.current?.(draft.trim());
    setEditing(false);
  }, [draft]);

  const cancelEditing = React.useCallback(() => setEditing(false), []);

  // Node registries for the imperative handle.
  const nameInputRef = React.useRef<HTMLInputElement | null>(null);
  const railRef = React.useRef<HTMLElement | null>(null);
  const registerNameInput = React.useCallback(
    (node: HTMLInputElement | null) => {
      nameInputRef.current = node;
    },
    [],
  );
  const registerRail = React.useCallback((node: HTMLElement | null) => {
    railRef.current = node;
  }, []);

  React.useImperativeHandle(
    ref,
    () => ({
      focusNameEditor() {
        startEditing(); // QuestNameField auto-focuses its input on mount.
      },
      scrollToChapter(chapterId: string) {
        const node = railRef.current?.querySelector<HTMLElement>(
          `[data-chapter-id="${chapterId}"]`,
        );
        node?.scrollIntoView({ block: "nearest" });
      },
    }),
    [startEditing],
  );

  const contextValue = React.useMemo<TeamQuestLogContextValue>(
    () => ({
      team,
      title,
      isDefaultTitle: isDefault,
      beats,
      editableName,
      canEditName,
      editing,
      draft,
      startEditing,
      setDraft,
      saveDraft,
      cancelEditing,
      onChapterClick,
      onEvent,
      renderChapter,
      registerNameInput,
      registerRail,
    }),
    [
      team,
      title,
      isDefault,
      beats,
      editableName,
      canEditName,
      editing,
      draft,
      startEditing,
      saveDraft,
      cancelEditing,
      onChapterClick,
      onEvent,
      renderChapter,
      registerNameInput,
      registerRail,
    ],
  );

  return (
    <TeamQuestLogContext.Provider value={contextValue}>
      <section
        aria-label={ariaLabel ?? `${title} — team quest log`}
        className={cn("reveal-up flex w-full flex-col gap-5", className)}
      >
        {children}
      </section>
    </TeamQuestLogContext.Provider>
  );
});
