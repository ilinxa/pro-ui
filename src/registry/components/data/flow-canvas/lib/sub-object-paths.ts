import type { NodeData } from "../types";

// Mutate `data` to remove the value at `path`. Pure: returns a new tree;
// the input is not modified. Supports dot-paths and array indices —
// `media[0]`, `slots[2].thumb`.
//
// Used by the sub-object extraction pipeline when the user holds Alt on
// drop (move semantics): the new node spawns AND the parent loses the
// sub-object via `onNodeUpdate`.

export function removeAtPath(data: NodeData, path: string): NodeData {
  const segments = parsePath(path);
  if (segments.length === 0) return data;
  const cloned = JSON.parse(JSON.stringify(data)) as NodeData;
  removeAtPathMut(cloned as unknown, segments);
  return cloned;
}

type Segment =
  | { kind: "key"; value: string }
  | { kind: "index"; value: number };

function parsePath(path: string): Segment[] {
  const out: Segment[] = [];
  const re = /([^.[\]]+)|\[(\d+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(path)) !== null) {
    if (m[1] !== undefined) out.push({ kind: "key", value: m[1] });
    else if (m[2] !== undefined) out.push({ kind: "index", value: Number(m[2]) });
  }
  return out;
}

function removeAtPathMut(cursor: unknown, segments: Segment[]): void {
  if (segments.length === 0) return;
  if (cursor === null || typeof cursor !== "object") return;
  const last = segments[segments.length - 1];
  const parents = segments.slice(0, -1);

  let parent: unknown = cursor;
  for (const seg of parents) {
    if (parent === null || typeof parent !== "object") return;
    if (seg.kind === "key") {
      parent = (parent as Record<string, unknown>)[seg.value];
    } else {
      if (!Array.isArray(parent)) return;
      parent = parent[seg.value];
    }
  }
  if (parent === null || typeof parent !== "object") return;

  if (last.kind === "index") {
    if (!Array.isArray(parent)) return;
    parent.splice(last.value, 1);
  } else {
    delete (parent as Record<string, unknown>)[last.value];
  }
}
