import { z } from "zod";
import type { CanvasData } from "@/registry/components/data/flow-canvas-01";

/**
 * Validates the JSON-expressible part of a `CanvasData` — `version` + `nodes` +
 * `edges`. Node *renderers* are functions (registered separately by the
 * playground); the JSON references a renderer by `data.__type` (an unknown type
 * falls back to the built-in custom-JSON node). Edges connect `nodeId:portId`
 * refs. The original parsed JSON is returned at full fidelity on success.
 */

const portRef = z
  .string()
  .regex(/^[^:]+:[^:]+$/, "must be a `nodeId:portId` ref");

const node = z.object({
  id: z.string().min(1, "node `id` is required"),
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.object({
    __type: z.string().min(1, "node `data.__type` is required"),
  }),
});

const edge = z.object({
  id: z.string().min(1, "edge `id` is required"),
  source: portRef,
  target: portRef,
});

export const canvasDataSchema = z.object({
  version: z.literal(1),
  nodes: z.array(node),
  edges: z.array(edge),
});

export type ValidateCanvasResult =
  | { ok: true; value: CanvasData }
  | { ok: false; error: string };

export function validateCanvasData(text: string): ValidateCanvasResult {
  if (!text.trim()) return { ok: false, error: "Write a CanvasData to begin." };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return { ok: false, error: `Invalid JSON — ${(e as Error).message}` };
  }
  const res = canvasDataSchema.safeParse(parsed);
  if (!res.success) {
    const first = res.error.issues[0];
    const path = first.path.join(".");
    return {
      ok: false,
      error: path ? `${path} — ${first.message}` : first.message,
    };
  }
  return { ok: true, value: parsed as CanvasData };
}

/** Pre-loaded starter — two typed `card` nodes joined by an edge, plus one
 *  untyped node that lands on the built-in custom-JSON fallback renderer. */
export const STARTER_CANVAS = `{
  "version": 1,
  "nodes": [
    {
      "id": "a",
      "position": { "x": 40, "y": 70 },
      "data": { "__type": "card", "title": "Source", "body": "Edit me, then drag my right handle →" }
    },
    {
      "id": "b",
      "position": { "x": 380, "y": 70 },
      "data": { "__type": "card", "title": "Target", "body": "Connected from JSON via an edge." }
    },
    {
      "id": "c",
      "position": { "x": 380, "y": 250 },
      "data": { "__type": "note", "label": "Untyped → custom-JSON fallback", "value": 42, "tags": ["a", "b"] }
    }
  ],
  "edges": [
    { "id": "e1", "source": "a:out", "target": "b:in" }
  ]
}
`;
