"use client";

import type { NodeRenderer } from "../types";
import { customJsonRenderer } from "../parts/custom-json-node";
import { useFlowCanvasContext } from "./canvas-context";

export { customJsonRenderer };

export function findRenderer(
  renderers: NodeRenderer[],
  type: string,
): NodeRenderer | undefined {
  return renderers.find((r) => r.type === type);
}

export function useRenderer(type: string): NodeRenderer | undefined {
  const { renderers } = useFlowCanvasContext();
  return findRenderer(renderers, type);
}

// Merges built-in 'custom-json' renderer with consumer-supplied renderers.
// Last-wins on collision (consumer can deliberately override). Dev-mode warns.
export function mergeRenderers(
  consumer: NodeRenderer[] | undefined,
): NodeRenderer[] {
  const merged: NodeRenderer[] = [customJsonRenderer];
  const seen = new Set<string>([customJsonRenderer.type]);
  for (const r of consumer ?? []) {
    if (seen.has(r.type) && process.env.NODE_ENV !== "production") {
      console.warn(
        `[flow-canvas-01] renderer collision for "${r.type}" — last-wins`,
      );
    }
    const idx = merged.findIndex((m) => m.type === r.type);
    if (idx >= 0) merged[idx] = r;
    else merged.push(r);
    seen.add(r.type);
  }
  return merged;
}
