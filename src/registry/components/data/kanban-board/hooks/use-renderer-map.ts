"use client";

import { useMemo } from "react";
import type { AnyKanbanCardRenderer } from "../types";

export function useRendererMap(
  renderers: AnyKanbanCardRenderer[],
): Map<string, AnyKanbanCardRenderer> {
  return useMemo(() => {
    const m = new Map<string, AnyKanbanCardRenderer>();
    for (const r of renderers) m.set(r.id, r);
    return m;
  }, [renderers]);
}
