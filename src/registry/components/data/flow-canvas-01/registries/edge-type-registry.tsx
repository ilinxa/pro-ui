"use client";

import type { EdgeRenderer } from "../types";
import { defaultEdgeRenderer } from "../parts/default-edge";
import { useFlowCanvasContext } from "./canvas-context";

export { defaultEdgeRenderer };

export function findEdgeType(
  edgeTypes: EdgeRenderer[],
  type: string,
): EdgeRenderer | undefined {
  return edgeTypes.find((t) => t.type === type);
}

export function useEdgeType(type: string): EdgeRenderer | undefined {
  const { edgeTypes } = useFlowCanvasContext();
  return findEdgeType(edgeTypes, type);
}

export function mergeEdgeTypes(
  consumer: EdgeRenderer[] | undefined,
): EdgeRenderer[] {
  const merged: EdgeRenderer[] = [defaultEdgeRenderer];
  const seen = new Set<string>([defaultEdgeRenderer.type]);
  for (const t of consumer ?? []) {
    if (seen.has(t.type) && process.env.NODE_ENV !== "production") {
      console.warn(
        `[flow-canvas-01] edge type collision for "${t.type}" — last-wins`,
      );
    }
    const idx = merged.findIndex((m) => m.type === t.type);
    if (idx >= 0) merged[idx] = t;
    else merged.push(t);
    seen.add(t.type);
  }
  return merged;
}
