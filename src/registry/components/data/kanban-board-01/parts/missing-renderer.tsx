"use client";

import { TriangleAlert } from "lucide-react";

export function MissingRendererFallback({ rendererId }: { rendererId: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-2.5 text-xs">
      <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-destructive" />
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-destructive">Renderer not found</span>
        <span className="font-mono text-[10px] text-muted-foreground">{rendererId}</span>
      </div>
    </div>
  );
}

const warned = new Set<string>();

export function warnMissingRenderer(rendererId: string) {
  if (warned.has(rendererId)) return;
  warned.add(rendererId);
  if (typeof console !== "undefined") {
    console.warn(
      `[kanban-board-01] No renderer found for rendererId="${rendererId}". ` +
        `Add a renderer with id="${rendererId}" to the renderers prop.`,
    );
  }
}
