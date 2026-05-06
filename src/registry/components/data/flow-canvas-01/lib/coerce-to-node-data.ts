import type { NodeData } from "../types";

// Coerce arbitrary parsed JSON into a `NodeData` shape. Rules:
//   - `null` / non-objects / arrays → undefined (caller aborts)
//   - object with string `__type` → returned as-is (already NodeData)
//   - object without `__type`     → wrapped as `{ __type: 'custom-json', ...obj }`
//
// This is the canonical single-place where unknown payloads get the fallback
// discriminator. M5 sub-object extraction also funnels through here when an
// extracted sub-object lacks `__type` (description risk §10).

export function coerceToNodeData(input: unknown): NodeData | undefined {
  if (!input || typeof input !== "object") return undefined;
  if (Array.isArray(input)) return undefined;

  const obj = input as Record<string, unknown>;
  if (typeof obj.__type === "string" && obj.__type.length > 0) {
    return obj as NodeData;
  }
  return { __type: "custom-json", ...obj };
}
