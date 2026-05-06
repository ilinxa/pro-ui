"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { newItemId } from "../lib/ids";
import type { AnyKanbanCardRenderer, KanbanItem } from "../types";

type Mode =
  | { kind: "idle" }
  | { kind: "editing"; rendererId: string; data: unknown };

export function InlineCreateEditor({
  renderers,
  onCreate,
}: {
  renderers: AnyKanbanCardRenderer[];
  onCreate: (item: KanbanItem) => void;
}) {
  const [mode, setMode] = useState<Mode>({ kind: "idle" });

  function startCreate(renderer: AnyKanbanCardRenderer) {
    if (renderer.editForm && renderer.newItem) {
      setMode({ kind: "editing", rendererId: renderer.id, data: renderer.newItem() });
    } else {
      // No inline editor; emit stub item and let consumer handle it.
      const stub: KanbanItem = {
        id: newItemId(),
        rendererId: renderer.id,
        data: renderer.newItem ? renderer.newItem() : {},
      };
      onCreate(stub);
    }
  }

  function handleSave(next: unknown) {
    if (mode.kind !== "editing") return;
    onCreate({ id: newItemId(), rendererId: mode.rendererId, data: next });
    setMode({ kind: "idle" });
  }

  function handleCancel() {
    setMode({ kind: "idle" });
  }

  if (mode.kind === "editing") {
    const renderer = renderers.find((r) => r.id === mode.rendererId);
    if (renderer?.editForm) {
      return <>{renderer.editForm(mode.data, handleSave, handleCancel)}</>;
    }
    setMode({ kind: "idle" });
    return null;
  }

  // Idle: show the trigger button. If 1 renderer, click → start. If ≥2, open picker.
  if (renderers.length === 1) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-full justify-start text-xs text-muted-foreground hover:text-foreground"
        onClick={() => startCreate(renderers[0])}
      >
        <Plus className="size-3.5" />
        Add {renderers[0].label.toLowerCase()}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-full justify-start text-xs text-muted-foreground hover:text-foreground"
          aria-label={`Add item to column`}
          data-stop-click
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Plus className="size-3.5" />
          Add
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {renderers.map((r) => (
          <DropdownMenuItem
            key={r.id}
            onClick={() => startCreate(r)}
          >
            {r.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
