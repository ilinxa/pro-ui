"use client";

import type { AnyKanbanCardRenderer, KanbanItem } from "../types";

export function InlineEditEditor({
  item,
  renderer,
  onSave,
  onCancel,
}: {
  item: KanbanItem;
  renderer: AnyKanbanCardRenderer;
  onSave: (item: KanbanItem) => void;
  onCancel: () => void;
}) {
  if (!renderer.editForm) return null;
  return (
    <>
      {renderer.editForm(
        item.data,
        (next) => onSave({ ...item, data: next }),
        onCancel,
      )}
    </>
  );
}
