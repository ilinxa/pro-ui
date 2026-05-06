import type { NodeData, NodeRenderer, Port } from "../types";

// Apply renderer.defaultPorts + renderer.defaultSubPorts to a NodeData ONLY
// where the corresponding `ports` field is absent. Presence of `ports` (even
// empty `[]`) is the deliberate-state signal — never re-inflate (Q23).
//
// Pure: returns a new NodeData; the input is untouched. Source-shape data is
// preserved this way.

export function inflateDefaultPorts(
  data: NodeData,
  renderer: NodeRenderer | undefined,
): NodeData {
  if (!renderer) return data;

  let out: NodeData = data;

  // Root-level ports inflation
  if (!Object.prototype.hasOwnProperty.call(data, "ports") && renderer.defaultPorts) {
    const ports: Port[] = renderer.defaultPorts(data);
    out = { ...out, ports };
  }

  // Sub-object port inflation, by JSON path. We support a small subset of
  // path syntax: dot-path and array-index (`media[0].thumb`). Plan §3.5
  // commits to this shape; richer JSONPath is a future extension.
  if (renderer.defaultSubPorts) {
    const subMap = renderer.defaultSubPorts(data);
    for (const [path, defaultPorts] of Object.entries(subMap)) {
      out = setPortsAtPath(out, path, defaultPorts);
    }
  }

  return out;
}

// Apply `ports` to the object at `path` inside `data`, ONLY if absent.
// Immutable — clones the affected branches.
function setPortsAtPath(
  data: NodeData,
  path: string,
  ports: Port[],
): NodeData {
  const segments = parsePath(path);
  if (segments.length === 0) return data;

  const cloned = JSON.parse(JSON.stringify(data)) as NodeData;
  let cursor: unknown = cloned;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (cursor === null || typeof cursor !== "object") return data;
    if (seg.kind === "key") {
      cursor = (cursor as Record<string, unknown>)[seg.value];
    } else {
      if (!Array.isArray(cursor)) return data;
      cursor = cursor[seg.value];
    }
  }
  if (!cursor || typeof cursor !== "object" || Array.isArray(cursor)) return data;
  const obj = cursor as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(obj, "ports")) return data; // respect existing
  obj.ports = ports;
  return cloned;
}

type PathSegment =
  | { kind: "key"; value: string }
  | { kind: "index"; value: number };

function parsePath(path: string): PathSegment[] {
  // Splits "media[0].thumb" → [{key,'media'},{index,0},{key,'thumb'}]
  const out: PathSegment[] = [];
  const re = /([^.[\]]+)|\[(\d+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(path)) !== null) {
    if (m[1] !== undefined) out.push({ kind: "key", value: m[1] });
    else if (m[2] !== undefined) out.push({ kind: "index", value: Number(m[2]) });
  }
  return out;
}
