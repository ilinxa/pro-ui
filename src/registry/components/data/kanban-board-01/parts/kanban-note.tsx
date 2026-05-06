"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { KanbanCardRenderer, KanbanNoteData, KanbanRenderContext } from "../types";

export function KanbanNoteView({
  data,
  ctx,
}: {
  data: KanbanNoteData;
  ctx: KanbanRenderContext;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-md border-l-2 border-l-amber-500/60 border-y border-r border-border bg-amber-50/30 p-2.5",
        "dark:bg-amber-950/20",
        "transition-shadow",
        ctx.isDragging && "shadow-md",
        ctx.isLocked && "opacity-90",
      )}
    >
      <span className="text-xs font-semibold tracking-wide uppercase text-amber-900 dark:text-amber-200">
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
      className="flex flex-col gap-2 rounded-md border-l-2 border-l-amber-500/60 border-y border-r border-border bg-amber-50/30 p-2.5 dark:bg-amber-950/20"
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
