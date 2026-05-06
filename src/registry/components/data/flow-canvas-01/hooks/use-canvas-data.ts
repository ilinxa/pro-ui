"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  addEdge as xyAddEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge as XyEdge,
  type EdgeChange,
  type Node as XyNode,
  type NodeChange,
} from "@xyflow/react";
import { findPortInTree } from "../lib/port-walker";
import { removeAtPath } from "../lib/sub-object-paths";
import type {
  CanvasData,
  EdgeRecord,
  FlowCanvasProps,
  NodeData,
  NodeRecord,
  Port,
} from "../types";

const EMPTY: CanvasData = { version: 1, nodes: [], edges: [] };

function makeEdgeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `e-${crypto.randomUUID()}`;
  }
  return `e-${Math.random().toString(36).slice(2, 10)}`;
}

function makeNodeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `n-${Math.random().toString(36).slice(2, 10)}`;
}

// xyflow's Node type carries `type`, `data`, `position`, etc. Our adapter
// always sets type to "ilinxa-node"; data carries our NodeData shape with
// a stable `id` mirror so the canvas can find it without our custom store.
type XyNodeData = NodeRecord["data"];

function toXyNode(n: NodeRecord): XyNode<XyNodeData> {
  return {
    id: n.id,
    type: "ilinxa-node",
    position: n.position,
    data: n.data,
    width: n.width,
    height: n.height,
    selected: n.selected,
    draggable: n.locked ? false : undefined,
  };
}

function toXyEdge(e: EdgeRecord): XyEdge {
  // xyflow expects sourceHandle / targetHandle as separate fields. Our
  // EdgeRecord encodes them inline as 'nodeId:portId'.
  const [source, sourceHandle] = e.source.split(":") as [string, string];
  const [target, targetHandle] = e.target.split(":") as [string, string];
  return {
    id: e.id,
    source,
    sourceHandle,
    target,
    targetHandle,
    type: e.type ?? "ilinxa-edge",
    selected: e.selected,
  };
}

function fromXyNode(n: XyNode<XyNodeData>): NodeRecord {
  return {
    id: n.id,
    position: n.position,
    data: n.data as XyNodeData,
    width: typeof n.width === "number" ? n.width : undefined,
    height: typeof n.height === "number" ? n.height : undefined,
    selected: n.selected,
    locked: n.draggable === false ? true : undefined,
  };
}

function fromXyEdge(e: XyEdge): EdgeRecord {
  const sourceHandle = e.sourceHandle ?? "";
  const targetHandle = e.targetHandle ?? "";
  return {
    id: e.id,
    source: `${e.source}:${sourceHandle}`,
    target: `${e.target}:${targetHandle}`,
    type: e.type === "ilinxa-edge" ? undefined : e.type,
    selected: e.selected,
  };
}

export type UseCanvasDataResult = {
  // xyflow-shaped state for direct binding to <ReactFlow>
  xyNodes: XyNode<XyNodeData>[];
  xyEdges: XyEdge[];
  onNodesChange: (changes: NodeChange<XyNode<XyNodeData>>[]) => void;
  onEdgesChange: (changes: EdgeChange<XyEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  // Snapshot in our CanvasData shape (used by exportRef + viewport setters)
  snapshot: () => CanvasData;
  // Imperative helpers used by drop pipeline / sub-object extract / menus
  appendNode: (node: NodeRecord) => void;
  updateNodeData: (nodeId: string, mutate: (data: NodeData) => NodeData) => void;
  duplicateNode: (nodeId: string) => void;
  deleteNode: (nodeId: string) => void;
  deleteEdge: (edgeId: string) => void;
  setEdges: (edges: EdgeRecord[]) => void;
  setNodes: (nodes: NodeRecord[]) => void;
  replace: (data: CanvasData) => void;
  // Sub-object extraction (atomic: append + optionally remove from parent)
  extractSubObject: (input: {
    parentId: string;
    path: string;
    gesture: "copy" | "move";
    newNode: NodeRecord;
  }) => void;
};

export function useCanvasData({
  data,
  defaultData,
  onChange,
  onBeforeConnect,
  onNodeCreate,
  onNodeUpdate,
  onNodeDelete,
  onEdgeCreate,
  onEdgeDelete,
  onSubObjectExtract,
}: {
  data?: CanvasData;
  defaultData?: CanvasData;
  onChange?: (next: CanvasData) => void;
  onBeforeConnect?: FlowCanvasProps["onBeforeConnect"];
  onNodeCreate?: FlowCanvasProps["onNodeCreate"];
  onNodeUpdate?: FlowCanvasProps["onNodeUpdate"];
  onNodeDelete?: FlowCanvasProps["onNodeDelete"];
  onEdgeCreate?: FlowCanvasProps["onEdgeCreate"];
  onEdgeDelete?: FlowCanvasProps["onEdgeDelete"];
  onSubObjectExtract?: FlowCanvasProps["onSubObjectExtract"];
}): UseCanvasDataResult {
  const isControlled = data !== undefined;
  const initial = data ?? defaultData ?? EMPTY;

  const [internalNodes, setInternalNodes] = useState<XyNode<XyNodeData>[]>(() =>
    initial.nodes.map(toXyNode),
  );
  const [internalEdges, setInternalEdges] = useState<XyEdge[]>(() =>
    initial.edges.map(toXyEdge),
  );
  const [viewport, setViewport] = useState(initial.viewport);

  // Reflect controlled-mode changes — `data` prop wholesale replacement
  const lastControlledData = useRef<CanvasData | undefined>(data);
  useEffect(() => {
    if (!isControlled) return;
    if (data === lastControlledData.current) return;
    lastControlledData.current = data;
    setInternalNodes((data ?? EMPTY).nodes.map(toXyNode));
    setInternalEdges((data ?? EMPTY).edges.map(toXyEdge));
    setViewport(data?.viewport);
  }, [isControlled, data]);

  const fireOnChange = useCallback(
    (
      nodes: XyNode<XyNodeData>[],
      edges: XyEdge[],
      vp: CanvasData["viewport"],
    ) => {
      if (!onChange) return;
      onChange({
        version: 1,
        nodes: nodes.map(fromXyNode),
        edges: edges.map(fromXyEdge),
        viewport: vp,
      });
    },
    [onChange],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange<XyNode<XyNodeData>>[]) => {
      setInternalNodes((prev) => {
        const next = applyNodeChanges(changes, prev);
        fireOnChange(next, internalEdges, viewport);
        return next;
      });
    },
    [fireOnChange, internalEdges, viewport],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<XyEdge>[]) => {
      setInternalEdges((prev) => {
        const next = applyEdgeChanges(changes, prev);
        fireOnChange(internalNodes, next, viewport);
        return next;
      });
    },
    [fireOnChange, internalNodes, viewport],
  );

  // onConnect — adds an edge after typed validation (in canvas.tsx) AND
  // the consumer's onBeforeConnect hook (here). Pipeline:
  //   xyflow drag-release
  //     → isValidConnection (typed: same-type + dir + multi)  [canvas.tsx]
  //     → onConnect          (this fn)
  //         → onBeforeConnect (consumer; can reject or rewrite the edge)
  //         → addEdge to state, fireOnChange, fire onEdgeCreate
  const onConnect = useCallback(
    (connection: Connection) => {
      // Lookup the resolved Port objects so we can hand them to onBeforeConnect.
      let candidate: EdgeRecord = {
        id: makeEdgeId(),
        source: `${connection.source}:${connection.sourceHandle ?? ""}`,
        target: `${connection.target}:${connection.targetHandle ?? ""}`,
      };

      if (onBeforeConnect) {
        const srcNode = internalNodes.find((n) => n.id === connection.source);
        const tgtNode = internalNodes.find((n) => n.id === connection.target);
        const srcPort: Port | undefined =
          srcNode && connection.sourceHandle
            ? findPortInTree(srcNode.data as NodeData, connection.sourceHandle)?.port
            : undefined;
        const tgtPort: Port | undefined =
          tgtNode && connection.targetHandle
            ? findPortInTree(tgtNode.data as NodeData, connection.targetHandle)?.port
            : undefined;
        if (!srcPort || !tgtPort) return;

        const result = onBeforeConnect(candidate, {
          source: srcPort,
          target: tgtPort,
        });
        if (result === false) return;
        if (typeof result === "object" && result !== null) candidate = result;
      }

      setInternalEdges((prev) => {
        const next = xyAddEdge(
          {
            ...connection,
            id: candidate.id,
            type: "ilinxa-edge",
          },
          prev,
        );
        fireOnChange(internalNodes, next, viewport);
        return next;
      });
      onEdgeCreate?.(candidate);
    },
    [fireOnChange, internalNodes, viewport, onBeforeConnect, onEdgeCreate],
  );

  const snapshot = useCallback<() => CanvasData>(
    () => ({
      version: 1,
      nodes: internalNodes.map(fromXyNode),
      edges: internalEdges.map(fromXyEdge),
      viewport,
    }),
    [internalNodes, internalEdges, viewport],
  );

  const appendNode = useCallback(
    (node: NodeRecord) => {
      setInternalNodes((prev) => {
        const next = [...prev, toXyNode(node)];
        fireOnChange(next, internalEdges, viewport);
        return next;
      });
      onNodeCreate?.(node);
    },
    [fireOnChange, internalEdges, viewport, onNodeCreate],
  );

  const updateNodeData = useCallback(
    (nodeId: string, mutate: (data: NodeData) => NodeData) => {
      let updatedRecord: NodeRecord | undefined;
      setInternalNodes((prev) => {
        const next = prev.map((n) => {
          if (n.id !== nodeId) return n;
          const updated = mutate(n.data as NodeData);
          updatedRecord = fromXyNode({ ...n, data: updated });
          return { ...n, data: updated };
        });
        fireOnChange(next, internalEdges, viewport);
        return next;
      });
      if (updatedRecord) onNodeUpdate?.(updatedRecord);
    },
    [fireOnChange, internalEdges, viewport, onNodeUpdate],
  );

  const duplicateNode = useCallback(
    (nodeId: string) => {
      const target = internalNodes.find((n) => n.id === nodeId);
      if (!target) return;
      const clone: NodeRecord = {
        id: makeNodeId(),
        position: { x: target.position.x + 24, y: target.position.y + 24 },
        data: JSON.parse(JSON.stringify(target.data)),
      };
      appendNode(clone);
    },
    [internalNodes, appendNode],
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      // Cascade incident edges per Q15.
      setInternalEdges((prev) => {
        const next = prev.filter(
          (e) => e.source !== nodeId && e.target !== nodeId,
        );
        return next;
      });
      setInternalNodes((prev) => {
        const next = prev.filter((n) => n.id !== nodeId);
        fireOnChange(next, internalEdges, viewport);
        return next;
      });
      onNodeDelete?.(nodeId);
    },
    [fireOnChange, internalEdges, viewport, onNodeDelete],
  );

  const deleteEdge = useCallback(
    (edgeId: string) => {
      setInternalEdges((prev) => {
        const next = prev.filter((e) => e.id !== edgeId);
        fireOnChange(internalNodes, next, viewport);
        return next;
      });
      onEdgeDelete?.(edgeId);
    },
    [fireOnChange, internalNodes, viewport, onEdgeDelete],
  );

  const setNodes = useCallback(
    (nodes: NodeRecord[]) => {
      const next = nodes.map(toXyNode);
      setInternalNodes(next);
      fireOnChange(next, internalEdges, viewport);
    },
    [fireOnChange, internalEdges, viewport],
  );

  const setEdges = useCallback(
    (edges: EdgeRecord[]) => {
      const next = edges.map(toXyEdge);
      setInternalEdges(next);
      fireOnChange(internalNodes, next, viewport);
    },
    [fireOnChange, internalNodes, viewport],
  );

  const replace = useCallback(
    (next: CanvasData) => {
      const xn = next.nodes.map(toXyNode);
      const xe = next.edges.map(toXyEdge);
      setInternalNodes(xn);
      setInternalEdges(xe);
      setViewport(next.viewport);
      fireOnChange(xn, xe, next.viewport);
    },
    [fireOnChange],
  );

  // Atomic sub-object extraction: append the new node AND (if 'move') remove
  // the sub-object from the parent's data tree in a single state update.
  // Plan §3.8 + Q23 — gesture defaults to 'copy' (parent retains).
  const extractSubObject = useCallback(
    ({
      parentId,
      path,
      gesture,
      newNode,
    }: {
      parentId: string;
      path: string;
      gesture: "copy" | "move";
      newNode: NodeRecord;
    }) => {
      let updatedParentRecord: NodeRecord | undefined;
      setInternalNodes((prev) => {
        const withChild = [...prev, toXyNode(newNode)];
        if (gesture === "copy") {
          fireOnChange(withChild, internalEdges, viewport);
          return withChild;
        }
        // Move — remove the sub-object from parent.data at `path`.
        const next = withChild.map((n) => {
          if (n.id !== parentId) return n;
          const nextData = removeAtPath(n.data as NodeData, path);
          updatedParentRecord = fromXyNode({ ...n, data: nextData });
          return { ...n, data: nextData };
        });
        fireOnChange(next, internalEdges, viewport);
        return next;
      });
      onNodeCreate?.(newNode);
      if (updatedParentRecord) onNodeUpdate?.(updatedParentRecord);
      onSubObjectExtract?.(parentId, path, gesture);
    },
    [
      fireOnChange,
      internalEdges,
      viewport,
      onNodeCreate,
      onNodeUpdate,
      onSubObjectExtract,
    ],
  );

  return useMemo(
    () => ({
      xyNodes: internalNodes,
      xyEdges: internalEdges,
      onNodesChange,
      onEdgesChange,
      onConnect,
      snapshot,
      appendNode,
      updateNodeData,
      duplicateNode,
      deleteNode,
      deleteEdge,
      setEdges,
      setNodes,
      replace,
      extractSubObject,
    }),
    [
      internalNodes,
      internalEdges,
      onNodesChange,
      onEdgesChange,
      onConnect,
      snapshot,
      appendNode,
      updateNodeData,
      duplicateNode,
      deleteNode,
      deleteEdge,
      setEdges,
      setNodes,
      replace,
      extractSubObject,
    ],
  );
}
