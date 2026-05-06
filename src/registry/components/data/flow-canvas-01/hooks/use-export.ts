"use client";

import { useImperativeHandle, type Ref } from "react";
import type {
  CanvasData,
  EdgeRecord,
  FlowCanvasExportHandle,
  NodeData,
  NodeRecord,
} from "../types";

function stripPortsFromNodeData(data: NodeData): NodeData {
  const { ports: _ports, ...rest } = data;
  void _ports;
  const out: NodeData = { __type: data.__type };
  for (const [key, value] of Object.entries(rest)) {
    if (key === "__type") continue;
    out[key] = stripPortsFromValue(value);
  }
  return out;
}

function stripPortsFromValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((v) => stripPortsFromValue(v));
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.__type === "string") {
      return stripPortsFromNodeData(obj as NodeData);
    }
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k === "ports") continue;
      cleaned[k] = stripPortsFromValue(v);
    }
    return cleaned;
  }
  return value;
}

function stripSelected<T extends { selected?: boolean }>(
  record: T,
): Omit<T, "selected"> {
  const { selected: _selected, ...rest } = record;
  void _selected;
  return rest;
}

export function useExportHandle(
  ref: Ref<FlowCanvasExportHandle> | undefined,
  getSnapshot: () => CanvasData,
) {
  useImperativeHandle(
    ref,
    () => ({
      export: ({ withPorts }) => {
        const snap = getSnapshot();
        if (withPorts) {
          return {
            ...snap,
            nodes: snap.nodes.map((n) => stripSelected(n) as NodeRecord),
            edges: snap.edges.map((e) => stripSelected(e) as EdgeRecord),
          };
        }
        return {
          ...snap,
          nodes: snap.nodes.map((n) => ({
            ...stripSelected(n),
            data: stripPortsFromNodeData(n.data),
          })) as NodeRecord[],
          edges: [],
        };
      },
    }),
    [getSnapshot],
  );
}
