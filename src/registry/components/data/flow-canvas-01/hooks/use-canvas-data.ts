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
  // Drag lifecycle — bind to <ReactFlow>'s onNodeDragStart/onNodeDragStop
  // props. During a drag the per-tick onChange is suppressed (position-only
  // changes are batched); onNodeDragStop flushes a single final fire with
  // the committed state. Internal only — not re-exported from index.ts.
  onNodeDragStart: () => void;
  onNodeDragStop: () => void;
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
  // Ref-based resolvers — used by callers (e.g. <CanvasContextMenu>) that
  // need to look up nodes/edges by id without re-rendering on every state
  // change. The returned functions are stable across renders; the lookup
  // closes over a ref so it always sees the latest state.
  getNodeById: (id: string) => NodeRecord | undefined;
  getEdgeById: (id: string) => EdgeRecord | undefined;
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

  // Refs mirror the latest state so we can keep event handlers stable
  // (empty-dep useCallback). This is the canonical xyflow perf pattern —
  // see xyflow-react-pro skill "Performance" + "useCallback every event
  // handler". At 200 nodes, dep-changing handlers cascade into a full
  // ReactFlow reconciliation on every drag tick.
  const nodesRef = useRef(internalNodes);
  const edgesRef = useRef(internalEdges);
  const viewportRef = useRef(viewport);
  // Drag-lifecycle ref — flipped true between xyflow's onNodeDragStart and
  // onNodeDragStop. While true, the position-only onNodesChange path skips
  // the consumer onChange (per-tick suppression); onNodeDragStop flushes
  // one final fire with the committed state. v0.2.0 Tier 1 perf change.
  const isDraggingRef = useRef(false);
  useEffect(() => {
    nodesRef.current = internalNodes;
  }, [internalNodes]);
  useEffect(() => {
    edgesRef.current = internalEdges;
  }, [internalEdges]);
  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  // Also mirror callback props in refs so changing the consumer's callback
  // identity doesn't churn our internal handlers.
  const onChangeRef = useRef(onChange);
  const onBeforeConnectRef = useRef(onBeforeConnect);
  const onNodeCreateRef = useRef(onNodeCreate);
  const onNodeUpdateRef = useRef(onNodeUpdate);
  const onNodeDeleteRef = useRef(onNodeDelete);
  const onEdgeCreateRef = useRef(onEdgeCreate);
  const onEdgeDeleteRef = useRef(onEdgeDelete);
  const onSubObjectExtractRef = useRef(onSubObjectExtract);
  useEffect(() => {
    onChangeRef.current = onChange;
    onBeforeConnectRef.current = onBeforeConnect;
    onNodeCreateRef.current = onNodeCreate;
    onNodeUpdateRef.current = onNodeUpdate;
    onNodeDeleteRef.current = onNodeDelete;
    onEdgeCreateRef.current = onEdgeCreate;
    onEdgeDeleteRef.current = onEdgeDelete;
    onSubObjectExtractRef.current = onSubObjectExtract;
  });

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
      const cb = onChangeRef.current;
      if (!cb) return;
      cb({
        version: 1,
        nodes: nodes.map(fromXyNode),
        edges: edges.map(fromXyEdge),
        viewport: vp,
      });
    },
    [],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange<XyNode<XyNodeData>>[]) => {
      setInternalNodes((prev) => {
        const next = applyNodeChanges(changes, prev);
        // Skip the per-tick consumer callback during continuous drag IF all
        // changes in this batch are position changes. onNodeDragStop flushes
        // a single final fire when the drag ends. Mixed batches (e.g.
        // position + dimensions) still fire immediately so a consumer's
        // measurement-driven layout effect can't be silently delayed.
        const isAllPositionChanges = changes.every((c) => c.type === "position");
        if (isDraggingRef.current && isAllPositionChanges) {
          return next;
        }
        fireOnChange(next, edgesRef.current, viewportRef.current);
        return next;
      });
    },
    [fireOnChange],
  );

  // Drag-lifecycle callbacks — wired to <ReactFlow>'s onNodeDragStart /
  // onNodeDragStop props in canvas.tsx. The pair plus the position-only
  // short-circuit above implement description §4.1 Change #2 + #3 (batch
  // per-tick consumer fires during drag; skip the full re-map at end-of-drag
  // when only positions changed).
  const onNodeDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  const onNodeDragStop = useCallback(() => {
    isDraggingRef.current = false;
    // Flush a final onChange with the committed state. The setInternalNodes
    // reducer reads the latest committed value synchronously and returns it
    // unchanged (React bails out on identity-equal state, no re-render).
    // Matches the existing reducer-side-effect pattern used by 11 other
    // sites in this file (v0.2.0 plan F-V4 — picked consistency over a
    // one-off divergence; cleanup is a v0.3 candidate).
    setInternalNodes((latestNodes) => {
      fireOnChange(latestNodes, edgesRef.current, viewportRef.current);
      return latestNodes;
    });
  }, [fireOnChange]);

  const onEdgesChange = useCallback(
    (changes: EdgeChange<XyEdge>[]) => {
      setInternalEdges((prev) => {
        const next = applyEdgeChanges(changes, prev);
        fireOnChange(nodesRef.current, next, viewportRef.current);
        return next;
      });
    },
    [fireOnChange],
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
      let candidate: EdgeRecord = {
        id: makeEdgeId(),
        source: `${connection.source}:${connection.sourceHandle ?? ""}`,
        target: `${connection.target}:${connection.targetHandle ?? ""}`,
      };

      const before = onBeforeConnectRef.current;
      if (before) {
        const nodes = nodesRef.current;
        const srcNode = nodes.find((n) => n.id === connection.source);
        const tgtNode = nodes.find((n) => n.id === connection.target);
        const srcPort: Port | undefined =
          srcNode && connection.sourceHandle
            ? findPortInTree(srcNode.data as NodeData, connection.sourceHandle)?.port
            : undefined;
        const tgtPort: Port | undefined =
          tgtNode && connection.targetHandle
            ? findPortInTree(tgtNode.data as NodeData, connection.targetHandle)?.port
            : undefined;
        if (!srcPort || !tgtPort) return;

        const result = before(candidate, { source: srcPort, target: tgtPort });
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
        fireOnChange(nodesRef.current, next, viewportRef.current);
        return next;
      });
      onEdgeCreateRef.current?.(candidate);
    },
    [fireOnChange],
  );

  const snapshot = useCallback<() => CanvasData>(
    () => ({
      version: 1,
      nodes: nodesRef.current.map(fromXyNode),
      edges: edgesRef.current.map(fromXyEdge),
      viewport: viewportRef.current,
    }),
    [],
  );

  const appendNode = useCallback(
    (node: NodeRecord) => {
      setInternalNodes((prev) => {
        const next = [...prev, toXyNode(node)];
        fireOnChange(next, edgesRef.current, viewportRef.current);
        return next;
      });
      onNodeCreateRef.current?.(node);
    },
    [fireOnChange],
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
        fireOnChange(next, edgesRef.current, viewportRef.current);
        return next;
      });
      if (updatedRecord) onNodeUpdateRef.current?.(updatedRecord);
    },
    [fireOnChange],
  );

  const duplicateNode = useCallback(
    (nodeId: string) => {
      const target = nodesRef.current.find((n) => n.id === nodeId);
      if (!target) return;
      const clone: NodeRecord = {
        id: makeNodeId(),
        position: { x: target.position.x + 24, y: target.position.y + 24 },
        data: JSON.parse(JSON.stringify(target.data)),
      };
      appendNode(clone);
    },
    [appendNode],
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      // Cascade incident edges per Q15.
      setInternalEdges((prev) =>
        prev.filter((e) => e.source !== nodeId && e.target !== nodeId),
      );
      setInternalNodes((prev) => {
        const next = prev.filter((n) => n.id !== nodeId);
        fireOnChange(next, edgesRef.current, viewportRef.current);
        return next;
      });
      onNodeDeleteRef.current?.(nodeId);
    },
    [fireOnChange],
  );

  const deleteEdge = useCallback(
    (edgeId: string) => {
      setInternalEdges((prev) => {
        const next = prev.filter((e) => e.id !== edgeId);
        fireOnChange(nodesRef.current, next, viewportRef.current);
        return next;
      });
      onEdgeDeleteRef.current?.(edgeId);
    },
    [fireOnChange],
  );

  const setNodes = useCallback(
    (nodes: NodeRecord[]) => {
      const next = nodes.map(toXyNode);
      setInternalNodes(next);
      fireOnChange(next, edgesRef.current, viewportRef.current);
    },
    [fireOnChange],
  );

  const setEdges = useCallback(
    (edges: EdgeRecord[]) => {
      const next = edges.map(toXyEdge);
      setInternalEdges(next);
      fireOnChange(nodesRef.current, next, viewportRef.current);
    },
    [fireOnChange],
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
          fireOnChange(withChild, edgesRef.current, viewportRef.current);
          return withChild;
        }
        // Move — remove the sub-object from parent.data at `path`.
        const next = withChild.map((n) => {
          if (n.id !== parentId) return n;
          const nextData = removeAtPath(n.data as NodeData, path);
          updatedParentRecord = fromXyNode({ ...n, data: nextData });
          return { ...n, data: nextData };
        });
        fireOnChange(next, edgesRef.current, viewportRef.current);
        return next;
      });
      onNodeCreateRef.current?.(newNode);
      if (updatedParentRecord) onNodeUpdateRef.current?.(updatedParentRecord);
      onSubObjectExtractRef.current?.(parentId, path, gesture);
    },
    [fireOnChange],
  );

  const getNodeById = useCallback((id: string): NodeRecord | undefined => {
    const n = nodesRef.current.find((x) => x.id === id);
    return n ? fromXyNode(n) : undefined;
  }, []);

  const getEdgeById = useCallback((id: string): EdgeRecord | undefined => {
    const e = edgesRef.current.find((x) => x.id === id);
    return e ? fromXyEdge(e) : undefined;
  }, []);

  return useMemo(
    () => ({
      xyNodes: internalNodes,
      xyEdges: internalEdges,
      onNodesChange,
      onEdgesChange,
      onConnect,
      onNodeDragStart,
      onNodeDragStop,
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
      getNodeById,
      getEdgeById,
    }),
    [
      internalNodes,
      internalEdges,
      onNodesChange,
      onEdgesChange,
      onConnect,
      onNodeDragStart,
      onNodeDragStop,
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
      getNodeById,
      getEdgeById,
    ],
  );
}
