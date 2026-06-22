"use client";

/**
 * Quick-create composer (Tier B + Tier C). When a create gesture sets
 * `composerTarget`, this floats a small title-entry popup at the pointer:
 * type a title + Enter to create, or "More options" to open the full editor.
 * Deliberately a plain fixed-position panel (NOT a Radix Popover) to dodge the
 * Base-UI `PopoverAnchor`/`asChild` divergence (the engagement-bar lesson).
 * Mounted by the assembly; reads context (lives inside `Calendar01Root`).
 */

import { useState } from "react";
import type { ReactNode } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCalendar } from "../hooks/use-calendar-context";
import type {
  CalendarComposerTarget,
  CalendarContextValue,
  TodoItem,
} from "../types";

function whenText(t: CalendarComposerTarget): string {
  if (t.allDay) return `${format(t.date, "EEE, MMM d")} · all day`;
  return `${format(t.date, "EEE, MMM d")} · ${format(t.date, "p")} – ${format(
    t.defaultEnd,
    "p",
  )}`;
}

function windowOf(t: CalendarComposerTarget) {
  const endMs =
    t.allDay && t.defaultEnd.getTime() === t.date.getTime()
      ? undefined
      : t.defaultEnd.getTime();
  return { startMs: t.date.getTime(), endMs, allDay: t.allDay };
}

function Floating({
  x,
  y,
  onClose,
  children,
}: {
  x: number;
  y: number;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-label="Create event"
        className="fixed z-50 w-64 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg"
        style={{ left: x, top: y }}
      >
        {children}
      </div>
    </>
  );
}

function ComposerPopup({
  target,
  onClose,
  onCreate,
  render,
}: {
  target: CalendarComposerTarget;
  onClose: () => void;
  onCreate: CalendarContextValue["createItem"];
  render?: CalendarContextValue["renderQuickComposer"];
}) {
  const [title, setTitle] = useState("");
  const commit = (seed?: Partial<TodoItem>) =>
    onCreate(
      null,
      { name: title.trim() || "New event", ...seed },
      windowOf(target),
    );
  const openFull = () =>
    onCreate(null, { name: title.trim() || "New event" }, windowOf(target), {
      openEditor: true,
    });

  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const vh = typeof window !== "undefined" ? window.innerHeight : 768;
  const x = Math.max(8, Math.min(target.x ?? 80, vw - 272));
  const y = Math.max(8, Math.min(target.y ?? 80, vh - 180));

  if (render) {
    return (
      <Floating x={x} y={y} onClose={onClose}>
        {render({
          date: target.date,
          allDay: target.allDay,
          defaultEnd: target.defaultEnd,
          commit,
          cancel: onClose,
          openFull,
        })}
      </Floating>
    );
  }

  return (
    <Floating x={x} y={y} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          commit();
        }}
        className="flex flex-col gap-2"
      >
        <p className="text-xs text-muted-foreground">{whenText(target)}</p>
        <Input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
          }}
          placeholder="Add title"
          className="h-8"
        />
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={openFull}
            className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            More options
          </button>
          <div className="flex gap-1.5">
            <Button type="button" size="sm" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Create
            </Button>
          </div>
        </div>
      </form>
    </Floating>
  );
}

export function CalendarQuickComposer() {
  const { composerTarget, closeComposer, createItem, renderQuickComposer } =
    useCalendar();
  if (!composerTarget) return null;
  return (
    <ComposerPopup
      key={`${composerTarget.date.getTime()}:${composerTarget.x ?? 0}:${composerTarget.y ?? 0}`}
      target={composerTarget}
      onClose={closeComposer}
      onCreate={createItem}
      render={renderQuickComposer}
    />
  );
}
