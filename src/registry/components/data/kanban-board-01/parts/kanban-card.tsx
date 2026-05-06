"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { KanbanCardData, KanbanCardRenderer, KanbanRenderContext } from "../types";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function KanbanCardView({
  data,
  ctx,
}: {
  data: KanbanCardData;
  ctx: KanbanRenderContext;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-md border border-border bg-card p-3 text-card-foreground shadow-xs",
        "transition-shadow",
        ctx.isDragging && "shadow-md",
        ctx.isLocked && "opacity-90",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-tight text-foreground">{data.title}</span>
      </div>
      {data.description ? (
        <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
          {data.description}
        </p>
      ) : null}
      {data.tags && data.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {data.tags.map((tag, i) => (
            <Badge key={`${tag.label}-${i}`} variant="secondary" className="text-[10px]">
              {tag.label}
            </Badge>
          ))}
        </div>
      ) : null}
      {data.meta && data.meta.length > 0 ? (
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {data.meta.map((m) => (
            <li key={m.key} className="flex items-center gap-1">
              <span className="font-mono text-muted-foreground/70">{m.label}:</span>
              <span className="text-foreground">{m.value}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {data.assignees && data.assignees.length > 0 ? (
        <div className="flex -space-x-1.5">
          {data.assignees.slice(0, 5).map((a) => (
            <Avatar key={a.id} className="size-5 border border-card">
              {a.avatarUrl ? <AvatarImage src={a.avatarUrl} alt={a.name} /> : null}
              <AvatarFallback className="text-[10px]">{initials(a.name)}</AvatarFallback>
            </Avatar>
          ))}
          {data.assignees.length > 5 ? (
            <span className="ml-2 text-[10px] text-muted-foreground">
              +{data.assignees.length - 5}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function KanbanCardEditForm({
  data,
  onSave,
  onCancel,
}: {
  data: KanbanCardData;
  onSave: (next: KanbanCardData) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(data.title);
  const [description, setDescription] = useState(data.description ?? "");

  function handleSave() {
    if (!title.trim()) return;
    onSave({ ...data, title: title.trim(), description: description.trim() || undefined });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
      className="flex flex-col gap-2 rounded-md border border-border bg-card p-3"
    >
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Card title"
        autoFocus
        className="h-8 text-sm"
      />
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
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

export const kanbanCardRenderer: KanbanCardRenderer<KanbanCardData> = {
  id: "kanban-card",
  label: "Card",
  render: (data, ctx) => <KanbanCardView data={data} ctx={ctx} />,
  newItem: () => ({ title: "" }),
  editForm: (data, onSave, onCancel) => (
    <KanbanCardEditForm data={data} onSave={onSave} onCancel={onCancel} />
  ),
};
