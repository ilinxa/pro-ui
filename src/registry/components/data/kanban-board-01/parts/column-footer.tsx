"use client";

import type { AnyKanbanCardRenderer, KanbanColumn, KanbanItem } from "../types";
import { InlineCreateEditor } from "./inline-create-editor";

export function ColumnFooter({
  column,
  renderers,
  onCreate,
}: {
  column: KanbanColumn;
  renderers: AnyKanbanCardRenderer[];
  onCreate: (item: KanbanItem) => void;
}) {
  // Filter renderers by column.acceptsRendererIds if set.
  const allowed =
    column.acceptsRendererIds === undefined
      ? renderers
      : renderers.filter((r) => column.acceptsRendererIds!.includes(r.id));

  if (allowed.length === 0) return null;

  return (
    <div className="border-t border-border/60 px-1.5 py-1.5">
      <InlineCreateEditor renderers={allowed} onCreate={onCreate} />
    </div>
  );
}
