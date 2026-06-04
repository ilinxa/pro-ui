"use client";

import { TriangleAlert } from "lucide-react";

// Module-level dedupe set — warns once per slot-kind per process, NOT per render
// (verbatim port of kanban-board-01/parts/missing-renderer.tsx).
const warned = new Set<string>();

export function warnMissingSubstrate(slotKind: string) {
  if (warned.has(slotKind)) return;
  warned.add(slotKind);
  if (typeof console !== "undefined") {
    console.warn(
      `[content-composer-01] No substrate registered for slot="${slotKind}". ` +
        `Provide one via the substrates prop (defaults ship for metadataFields/bodySlot/mediaSlot).`,
    );
  }
}

export function MissingSubstrateFallback({ slotKind }: { slotKind: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-2.5 text-xs">
      <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-destructive" />
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-destructive">Substrate not found</span>
        <span className="font-mono text-[10px] text-muted-foreground">{slotKind}</span>
      </div>
    </div>
  );
}
