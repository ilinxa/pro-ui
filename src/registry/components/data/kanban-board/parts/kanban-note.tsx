"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { DEFAULT_PALETTE, findSwatch, swatchCssColor } from "../lib/palette";
import type { KanbanCardRenderer, KanbanNoteData, KanbanRenderContext } from "../types";

// `data.color` keys into the kanban palette (KanbanNoteData.color); default
// "amber" preserves the v0.1 visual (amber-tinted note) but via the swatch's
// --chart-1 token instead of hardcoded `amber-*` Tailwind classes — keeps the
// component honest to the project's design-system mandate. Consumers using a
// custom board-level `palette` prop see DEFAULT_PALETTE here in v0.2.1; full
// palette propagation through `KanbanRenderContext` is a v0.3 follow-up
// (would be additive — no breaking change).
const NOTE_FALLBACK_COLOR_ID = "amber";

export function KanbanNoteView({
  data,
  ctx,
}: {
  data: KanbanNoteData;
  ctx: KanbanRenderContext;
}) {
  const swatch = findSwatch(DEFAULT_PALETTE, data.color ?? NOTE_FALLBACK_COLOR_ID);
  const accentColor = swatchCssColor(swatch);
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-md border-l-2 border-y border-r border-border bg-muted/40 p-2.5",
        "transition-shadow",
        ctx.isDragging && "shadow-md",
        ctx.isLocked && "opacity-90",
      )}
      style={accentColor ? { borderLeftColor: accentColor } : undefined}
    >
      <span className="text-xs font-semibold tracking-wide uppercase text-foreground">
        {data.title}
      </span>
      {data.body ? (
        <p className="text-xs leading-relaxed text-foreground/80">{data.body}</p>
      ) : null}
    </div>
  );
}

function KanbanNoteEditForm({
  data,
  onSave,
  onCancel,
}: {
  data: KanbanNoteData;
  onSave: (next: KanbanNoteData) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(data.title);
  const [body, setBody] = useState(data.body ?? "");
  const swatch = findSwatch(DEFAULT_PALETTE, data.color ?? NOTE_FALLBACK_COLOR_ID);
  const accentColor = swatchCssColor(swatch);

  function handleSave() {
    if (!title.trim()) return;
    onSave({ ...data, title: title.trim(), body: body.trim() || undefined });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
      className="flex flex-col gap-2 rounded-md border-l-2 border-y border-r border-border bg-muted/40 p-2.5"
      style={accentColor ? { borderLeftColor: accentColor } : undefined}
    >
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Note title"
        autoFocus
        className="h-7 text-xs"
      />
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Body (optional)"
        rows={2}
        className="resize-none text-xs"
      />
      <div className="flex justify-end gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={!title.trim()}>
          Save
        </Button>
      </div>
    </form>
  );
}

export const kanbanNoteRenderer: KanbanCardRenderer<KanbanNoteData> = {
  id: "kanban-note",
  label: "Note",
  render: (data, ctx) => <KanbanNoteView data={data} ctx={ctx} />,
  newItem: () => ({ title: "" }),
  editForm: (data, onSave, onCancel) => (
    <KanbanNoteEditForm data={data} onSave={onSave} onCancel={onCancel} />
  ),
};
