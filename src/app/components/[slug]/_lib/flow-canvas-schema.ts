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

/**
 * Pre-loaded starter — a small graph exercising the JSON-authorable features:
 * typed `card` nodes, in/out ports with labels, a `multi` out port that fans out
 * to two nodes, a passthrough chain, and an untyped node on the built-in
 * custom-JSON fallback renderer.
 *
 * NOTE the load-bearing detail: ports must be listed EXPLICITLY in each node's
 * `data.ports` — a renderer's `defaultPorts` is only inflated for nodes created
 * via the drop pipeline, NOT for nodes loaded from `defaultData`. Without
 * explicit ports, no handles render and edges have nothing to anchor to.
 */
export const STARTER_CANVAS = `{
  "version": 1,
  "nodes": [
    {
      "id": "source",
      "position": { "x": 20, "y": 130 },
      "data": {
        "__type": "card",
        "title": "Source",
        "body": "A multi out-port fans out to two nodes.",
        "ports": [
          { "id": "out", "side": "right", "dir": "out", "type": "text", "multi": true, "label": "out" }
        ]
      }
    },
    {
      "id": "transform",
      "position": { "x": 320, "y": 30 },
      "data": {
        "__type": "card",
        "title": "Transform",
        "body": "in → out passthrough.",
        "ports": [
          { "id": "in", "side": "left", "dir": "in", "type": "text", "label": "in" },
          { "id": "out", "side": "right", "dir": "out", "type": "text", "label": "out" }
        ]
      }
    },
    {
      "id": "preview",
      "position": { "x": 320, "y": 240 },
      "data": {
        "__type": "card",
        "title": "Preview",
        "body": "Terminal — a single in-port.",
        "ports": [
          { "id": "in", "side": "left", "dir": "in", "type": "text", "label": "in" }
        ]
      }
    },
    {
      "id": "sink",
      "position": { "x": 620, "y": 30 },
      "data": {
        "__type": "card",
        "title": "Sink",
        "body": "Receives from Transform.",
        "ports": [
          { "id": "in", "side": "left", "dir": "in", "type": "text", "label": "in" }
        ]
      }
    },
    {
      "id": "note",
      "position": { "x": 620, "y": 240 },
      "data": {
        "__type": "note",
        "label": "Untyped __type → built-in custom-JSON fallback node",
        "value": 42,
        "tags": ["json", "fallback"]
      }
    }
  ],
  "edges": [
    { "id": "e1", "source": "source:out", "target": "transform:in" },
    { "id": "e2", "source": "source:out", "target": "preview:in" },
    { "id": "e3", "source": "transform:out", "target": "sink:in" }
  ]
}
`;
