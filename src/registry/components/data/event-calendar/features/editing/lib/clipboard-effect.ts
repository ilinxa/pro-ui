"use client";

/**
 * Cross-surface clipboard (copy/cut/paste `TaskItem`s through the OS
 * clipboard — the shared `ilinxa/task` envelope; foreign text is ignored).
 * Extracted from the pre-split `calendar-root.tsx` MIXED host (features-editing
 * split, v0.3) as a hook. Document-level so it fires regardless of which
 * focused element the UA targets; gated on the calendar containing focus,
 * skipped over text inputs (so the composer / rename keep native text
 * copy/paste). An open editor / rename / composer owns the clipboard (it may
 * hold non-input controls), so this defers to native copy/paste while one is up.
 */

import { useEffect } from "react";
import type { RefObject } from "react";
import {
  readTasksFromClipboardEvent,
  writeTasksToClipboardEvent,
} from "../../../../task-card/lib/clipboard";
import { resolvePasteWindow } from "./paste-window";
import type {
  CalendarComposerTarget,
  CalendarOccurrence,
  CalendarView,
  TaskItem,
} from "../../../types";

type Args = {
  rootRef: RefObject<HTMLDivElement | null>;
  editable: boolean;
  selectedId: string | null;
  getItem: (id: string) => TaskItem | undefined;
  deleteItem: (id: string) => void;
  pasteTasks: (
    items: TaskItem[],
    window: { startMs: number; endMs?: number; allDay: boolean },
  ) => void;
  occurrences: CalendarOccurrence[];
  view: CalendarView;
  focusDate: Date;
  scrollToHour: number;
  editingId: string | null;
  renamingId: string | null;
  composerTarget: CalendarComposerTarget | null;
};

export function useCalendarClipboard(args: Args) {
  const {
    rootRef,
    editable,
    selectedId,
    getItem,
    deleteItem,
    pasteTasks,
    occurrences,
    view,
    focusDate,
    scrollToHour,
    editingId,
    renamingId,
    composerTarget,
  } = args;

  useEffect(() => {
    if (!editable) return;
    const owns = () => {
      const active = document.activeElement;
      return !!rootRef.current && !!active && rootRef.current.contains(active);
    };
    const overText = () => {
      const el = document.activeElement as HTMLElement | null;
      return (
        el?.tagName === "INPUT" ||
        el?.tagName === "TEXTAREA" ||
        el?.isContentEditable === true
      );
    };
    const busy = () =>
      editingId != null || renamingId != null || composerTarget != null;
    const targetId = (): string | null => {
      const active = document.activeElement as HTMLElement | null;
      const occId = active
        ?.closest?.("[data-occ-id]")
        ?.getAttribute("data-occ-id");
      return occId ?? selectedId ?? null;
    };
    const onCopy = (e: ClipboardEvent) => {
      if (!owns() || overText() || busy()) return;
      const id = targetId();
      const item = id ? getItem(id) : undefined;
      if (!item) return;
      writeTasksToClipboardEvent(e, [item], "event-calendar");
      e.preventDefault();
    };
    const onCut = (e: ClipboardEvent) => {
      if (!owns() || overText() || busy()) return;
      const id = targetId();
      const item = id ? getItem(id) : undefined;
      if (!item) return;
      writeTasksToClipboardEvent(e, [item], "event-calendar");
      deleteItem(item.id);
      e.preventDefault();
    };
    const onPaste = (e: ClipboardEvent) => {
      if (!owns() || overText() || busy()) return;
      const items = readTasksFromClipboardEvent(e);
      if (!items) return;
      pasteTasks(
        items,
        resolvePasteWindow(items, {
          activeEl: document.activeElement,
          occurrences,
          view,
          focusDate,
          scrollToHour,
        }),
      );
      e.preventDefault();
    };
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCut);
    document.addEventListener("paste", onPaste);
    return () => {
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("paste", onPaste);
    };
  }, [
    rootRef,
    editable,
    selectedId,
    getItem,
    deleteItem,
    pasteTasks,
    occurrences,
    view,
    focusDate,
    scrollToHour,
    editingId,
    renamingId,
    composerTarget,
  ]);
}
