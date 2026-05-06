"use client";

import { useCallback, type DragEvent, type ClipboardEvent } from "react";
import { useReactFlow } from "@xyflow/react";
import { coerceToNodeData } from "../lib/coerce-to-node-data";
import { inflateDefaultPorts } from "../lib/inflate-default-ports";
import { parseJsonSafe } from "../lib/parse-json";
import { findRenderer } from "../registries/renderer-registry";
import type {
  FlowCanvasProps,
  NodeData,
  NodeRecord,
  NodeRenderer,
} from "../types";

const NODE_DROP_MIME = "application/json";
// MIME used by xyflow's own sidebar pattern. We accept this too so consumers
// who already use that convention keep working.
const REACTFLOW_DROP_MIME = "application/reactflow";
// Custom MIME for in-canvas sub-object drag-extract (M5). Carries
// `parentId|path` so the drop handler can route through the extraction
// pipeline instead of treating it as an external JSON drop.
const SUBOBJECT_DROP_MIME = "application/x-ilinxa-subobject";

type DropContext = {
  renderers: NodeRenderer[];
  appendNode: (node: NodeRecord) => void;
  extractSubObject: (input: {
    parentId: string;
    path: string;
    gesture: "copy" | "move";
    newNode: NodeRecord;
  }) => void;
  onBeforeDrop?: FlowCanvasProps["onBeforeDrop"];
  onNodeCreate?: FlowCanvasProps["onNodeCreate"];
};

// Build the drag-over / drop / paste handlers. The caller spreads these onto
// the canvas wrapper element.
//
// `useReactFlow()` requires <ReactFlowProvider> in an ancestor — our root
// already provides it.
export function useDropPipeline({
  renderers,
  appendNode,
  extractSubObject,
  onBeforeDrop,
  onNodeCreate,
}: DropContext) {
  const { screenToFlowPosition } = useReactFlow();

  const buildNode = useCallback(
    (rawData: NodeData, point: { x: number; y: number }): NodeRecord | null => {
      let data: NodeData | null = rawData;
      if (onBeforeDrop) {
        const result = onBeforeDrop(rawData, point);
        if (result === null) return null;
        if (result) data = result;
      }
      if (!data) return null;
      const renderer = findRenderer(renderers, data.__type);
      const inflated = inflateDefaultPorts(data, renderer);
      return { id: makeNodeId(), position: point, data: inflated };
    },
    [renderers, onBeforeDrop],
  );

  const dispatch = useCallback(
    (rawData: NodeData, point: { x: number; y: number }) => {
      const node = buildNode(rawData, point);
      if (!node) return;
      // appendNode fires onNodeCreate internally now, but the prop hook also
      // runs here for parity with paste-without-renderer paths.
      appendNode(node);
      onNodeCreate?.(node);
    },
    [buildNode, appendNode, onNodeCreate],
  );

  const dispatchExtraction = useCallback(
    (
      rawData: NodeData,
      point: { x: number; y: number },
      parentId: string,
      path: string,
      gesture: "copy" | "move",
    ) => {
      const node = buildNode(rawData, point);
      if (!node) return;
      extractSubObject({ parentId, path, gesture, newNode: node });
    },
    [buildNode, extractSubObject],
  );

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      const dt = e.dataTransfer;

      // Sub-object extraction branch — own-canvas drag tagged by emitSubObjectDrag.
      const subPayload = dt.getData(SUBOBJECT_DROP_MIME);
      const jsonPayload = dt.getData(NODE_DROP_MIME);
      if (subPayload && jsonPayload) {
        const parsed = parseJsonSafe(jsonPayload);
        const data = coerceToNodeData(parsed);
        if (!data) return;
        const meta = parseJsonSafe(subPayload) as
          | { parentId?: string; path?: string }
          | undefined;
        if (!meta?.parentId || !meta.path) return;
        const point = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        // Alt held → move; otherwise copy. Documented as the gesture.
        const gesture = e.altKey ? "move" : "copy";
        dispatchExtraction(data, point, meta.parentId, meta.path, gesture);
        return;
      }

      // Order of preference: explicit JSON, xyflow's reactflow MIME, plain text.
      const payload =
        jsonPayload ||
        dt.getData(REACTFLOW_DROP_MIME) ||
        dt.getData("text/plain");

      // No text payload — try files (first one only).
      if (!payload && dt.files.length > 0) {
        const file = dt.files[0];
        if (!file.type.includes("json") && !file.name.endsWith(".json")) return;
        // Read async; abort if it fails.
        file
          .text()
          .then((text) => {
            const parsed = parseJsonSafe(text);
            const data = coerceToNodeData(parsed);
            if (!data) return;
            const point = screenToFlowPosition({ x: e.clientX, y: e.clientY });
            dispatch(data, point);
          })
          .catch(() => undefined);
        return;
      }

      if (!payload) return;
      const parsed = parseJsonSafe(payload);
      const data = coerceToNodeData(parsed);
      if (!data) return;
      const point = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      dispatch(data, point);
    },
    [screenToFlowPosition, dispatch, dispatchExtraction],
  );

  const onPaste = useCallback(
    (e: ClipboardEvent) => {
      // Don't steal paste from focused inputs/textareas/contenteditables.
      const target = e.target as HTMLElement | null;
      if (target && isEditableTarget(target)) return;

      const text = e.clipboardData.getData("text/plain");
      if (!text) return;
      const parsed = parseJsonSafe(text);
      const data = coerceToNodeData(parsed);
      if (!data) return;

      // Paste lands at the viewport center (no mouse coordinates available).
      // Compute via the canvas root's bounding box.
      const root =
        target && target.closest<HTMLDivElement>("[data-flow-canvas-root]");
      const rect = root?.getBoundingClientRect();
      const sx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
      const sy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
      const point = screenToFlowPosition({ x: sx, y: sy });

      e.preventDefault();
      dispatch(data, point);
    },
    [screenToFlowPosition, dispatch],
  );

  return { onDragOver, onDrop, onPaste };
}

function isEditableTarget(el: HTMLElement): boolean {
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function makeNodeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `n-${Math.random().toString(36).slice(2, 10)}`;
}
