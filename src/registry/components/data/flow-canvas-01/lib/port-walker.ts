import type { NodeData, Port } from "../types";

// Pure tree-walker. Returns the first port matching `portId` at any depth,
// plus the JSON path to its containing object. Walker assumes port ids are
// unique within a node (locked decision Q9 / plan §3.4).

export type FoundPort = {
  port: Port;
  path: string; // JSONPath to the containing object — "" for root
};

export function findPortInTree(
  data: NodeData,
  portId: string,
): FoundPort | undefined {
  return walk(data, portId, "");
}

function walk(
  value: unknown,
  portId: string,
  path: string,
): FoundPort | undefined {
  if (!value || typeof value !== "object") return undefined;

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const found = walk(value[i], portId, `${path}[${i}]`);
      if (found) return found;
    }
    return undefined;
  }

  const obj = value as Record<string, unknown>;

  // Direct port match — this object owns ports[]
  const ports = obj.ports;
  if (Array.isArray(ports)) {
    for (const p of ports) {
      if (p && typeof p === "object" && (p as Port).id === portId) {
        return { port: p as Port, path };
      }
    }
  }

  // Recurse into children
  for (const [key, child] of Object.entries(obj)) {
    if (key === "ports") continue;
    if (key === "__type") continue;
    const childPath = path ? `${path}.${key}` : key;
    const found = walk(child, portId, childPath);
    if (found) return found;
  }
  return undefined;
}

// Convenience: count edges whose `nodeId:portId` matches a side.
// Used by the connection validator for `multi: false` enforcement.
export function countEdgesAtPort(
  edges: ReadonlyArray<{
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
  }>,
  nodeId: string,
  portId: string,
  side: "source" | "target",
): number {
  if (side === "source") {
    return edges.filter(
      (e) => e.source === nodeId && (e.sourceHandle ?? "") === portId,
    ).length;
  }
  return edges.filter(
    (e) => e.target === nodeId && (e.targetHandle ?? "") === portId,
  ).length;
}
