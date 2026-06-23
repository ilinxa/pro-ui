"use client";

/**
 * Quick-create composer (Tier B + Tier C). When a double-click on an empty row
 * area sets `composerTarget`, this floats a small title-entry popup at the
 * pointer: type a name + Enter to create, or "More options" to open the full
 * editor on the new task. Deliberately a plain fixed-position panel (NOT a Radix
 * Popover) to dodge the Base-UI anchor/asChild divergence — mirrors calendar's
 * quick-composer. A native `<select>` keeps the status pick dep-free.
 *
 * Mounted by the Root (lives inside `GanttTimelineRoot`); reads context.
 */

import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGanttTimeline } from "../hooks/use-gantt-context";
import type {
  GanttComposerTarget,
  GanttContextValue,
  TodoItem,
} from "../types";

const iso = (ms: number) => new Date(ms).toISOString();

function whenText(t: GanttComposerTarget): string {
  const start = new Date(t.startMs).toLocaleDateString();
  if (t.endMs == null || t.endMs <= t.startMs) return start;
  const end = new Date(t.endMs).toLocaleDateString();
  return start === end ? start : `${start} → ${end}`;
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
        aria-label="Create task"
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
  statusOptions,
  render,
}: {
  target: GanttComposerTarget;
  onClose: () => void;
  onCreate: GanttContextValue["createItem"];
  statusOptions: GanttContextValue["statusOptions"];
  render?: GanttContextValue["renderQuickComposer"];
}) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState(statusOptions?.[0]?.value ?? "");

  const seedOf = (extra?: Partial<TodoItem>): Partial<TodoItem> => ({
    name: title.trim() || "New task",
    startAt: iso(target.startMs),
    setAt: iso(target.startMs),
    ...(target.endMs != null ? { expireAt: iso(target.endMs) } : {}),
    ...(status ? { status } : {}),
    ...extra,
  });
  const commit = (extra?: Partial<TodoItem>) => {
    onCreate(target.parentId, seedOf(extra), target.index);
    onClose();
  };
  const openFull = () => {
    onCreate(target.parentId, seedOf(), target.index, { openEditor: true });
    onClose();
  };

  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const vh = typeof window !== "undefined" ? window.innerHeight : 768;
  const px = Math.max(8, Math.min(target.x ?? 80, vw - 272));
  const py = Math.max(8, Math.min(target.y ?? 80, vh - 200));

  if (render) {
    return (
      <Floating x={px} y={py} onClose={onClose}>
        {render({
          startMs: target.startMs,
          endMs: target.endMs,
          commit: (seed) => commit(seed),
          cancel: onClose,
          openFull,
        })}
      </Floating>
    );
  }

  return (
    <Floating x={px} y={py} onClose={onClose}>
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
          placeholder="Task name"
          className="h-8"
        />
        {statusOptions && statusOptions.length > 0 ? (
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            aria-label="Status"
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : null}
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

export function GanttQuickComposer() {
  const { composerTarget, closeComposer, createItem, renderQuickComposer, statusOptions } =
    useGanttTimeline();
  if (!composerTarget) return null;
  return (
    <ComposerPopup
      key={`${composerTarget.startMs}:${composerTarget.x ?? 0}:${composerTarget.y ?? 0}`}
      target={composerTarget}
      onClose={closeComposer}
      onCreate={createItem}
      statusOptions={statusOptions}
      render={renderQuickComposer}
    />
  );
}
