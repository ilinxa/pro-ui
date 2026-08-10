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

// v0.2.3 lock — structural-equality fast check for controlled-mode resync.
// Skips the wholesale-replace path in the data-prop useEffect when the new
// `data` reference is the round-trip echo of our own `fireOnChange` fire.
// Without this guard, every consumer setCanvas (the canonical controlled
// pattern) would wipe xyflow's internal node references → xyflow re-measures
// dimensions every cycle → "trying to drag a node that is not initialized"
// warning during the re-measurement window.
//
// Compares id / position.x / position.y / data-ref on nodes, id / source /
// target on edges. Width/height intentionally NOT compared — those are
// xyflow-managed (`measured` field) and don't round-trip through NodeRecord
// cleanly. O(N) over nodes + edges; short-circuits on first mismatch. Fast
// enough for controlled-mode consumers at N up to a few thousand; for larger
// canvases, prefer `defaultData` (uncontrolled).
//
// v0.2.6 — viewport intentionally NOT compared (it was in v0.2.3–v0.2.5):
// the camera can only be set at mount (`defaultViewport`); a `data.viewport`
// change cannot move it afterwards, while the internal viewport now
// live-tracks the real camera via `onMoveEnd`. Comparing them would make
// every consumer echo that raced a pan/zoom look like a genuine external
// change and trigger exactly the wholesale replace (measured-wipe → xyflow
// #015) this guard exists to prevent. Nodes + edges alone decide.
//
// v0.2.4 — this check alone wasn't sufficient against the stale-snapshot
// race: mid-drag mixed batches (position + dimensions) queued microtasks
// whose snapshots fell behind further drag ticks, causing this check to
// fail on legitimate divergence and trigger wholesale replace anyway. The
// v0.2.4 fix is in onNodesChange + fireOnChange: suppress ALL onChange
// notifications during drag (not just position-only), and have queued
// microtasks bail at fire time if a drag started after they were queued.
// The check below is still load-bearing for the non-drag round-trip path
// (e.g. consumer applies an unrelated state update during steady state).
function canvasMatchesInternalState(
  data: CanvasData,
  internalNodes: XyNode<XyNodeData>[],
  internalEdges: XyEdge[],
): boolean {
  if (data.nodes.length !== internalNodes.length) return false;
  if (data.edges.length !== internalEdges.length) return false;
  for (let i = 0; i < data.nodes.length; i++) {
    const dn = data.nodes[i];
    const xn = internalNodes[i];
    if (dn.id !== xn.id) return false;
    if (dn.position.x !== xn.position.x) return false;
    if (dn.position.y !== xn.position.y) return false;
    if (dn.data !== xn.data) return false;
  }
  for (let i = 0; i < data.edges.length; i++) {
    const de = data.edges[i];
    const xe = internalEdges[i];
    if (de.id !== xe.id) return false;
    const expectedSource = `${xe.source}:${xe.sourceHandle ?? ""}`;
    const expectedTarget = `${xe.target}:${xe.targetHandle ?? ""}`;
    if (de.source !== expectedSource) return false;
    if (de.target !== expectedTarget) return false;
  }
  return true;
}

export type UseCanvasDataResult = {
  // xyflow-shaped state for direct binding to <ReactFlow>
  xyNodes: XyNode<XyNodeData>[];
  xyEdges: XyEdge[];
  onNodesChange: (changes: NodeChange<XyNode<XyNodeData>>[]) => void;
  onEdgesChange: (changes: EdgeChange<XyEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  // Drag lifecycle — bind to <ReactFlow>'s onNodeDragStart/onNodeDragStop
  // props. During a drag, ALL consumer onChange notifications are suppressed
  // (v0.2.4 widened from v0.2.0's position-only short-circuit); onNodeDragStop
  // flushes a single authoritative fire with the committed post-drag state.
  // Internal only — not re-exported from index.ts.
  onNodeDragStart: () => void;
  onNodeDragStop: () => void;
  // Camera tracking — bind to <ReactFlow>'s onMoveEnd prop. Syncs the real
  // viewport into state/ref after every pan/zoom so snapshot()/export/onChange
  // carry the actual camera (v0.2.6; previously the viewport slice stayed
  // frozen at its mount-time value). Camera-only moves deliberately do NOT
  // fire onChange — a pan is not a data edit (and mount-time fitView would
  // otherwise mark consumer documents dirty); the tracked value rides along
  // on the next data-driven fire. Internal only — not re-exported.
  onMoveEnd: (event: unknown, viewport: { x: number; y: number; zoom: number }) => void;
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
  //
  // v0.2.6 — every mutation site ALSO syncs its ref synchronously (inside
  // its updater / before a direct set) so the coalesced fireOnChange
  // microtask reads current state; the useEffect syncs below remain as the
  // post-commit safety net (they also cover React discarding a render).
  const nodesRef = useRef(internalNodes);
  const edgesRef = useRef(internalEdges);
  const viewportRef = useRef(viewport);
  // Drag-lifecycle ref — flipped true between xyflow's onNodeDragStart and
  // onNodeDragStop. While true, `onNodesChange` suppresses ALL consumer
  // onChange notifications (v0.2.4 widened this from v0.2.0's position-only
  // short-circuit — see the v0.2.4 lock comment on `onNodesChange` below).
  // `fireOnChange`'s microtask body also checks this ref at fire time to
  // drop pre-drag snapshots that would otherwise round-trip during drag.
  // `onNodeDragStop` flushes a single authoritative fire with the committed
  // post-drag state.
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

  // Reflect controlled-mode changes — `data` prop wholesale replacement.
  //
  // v0.2.3: skip the resync when the new `data` prop is the round-trip echo
  // of our own `fireOnChange`. After v0.2.2's microtask defer, consumer
  // setCanvas creates a new top-level data reference even for echoes —
  // reference equality alone (the v0.2.2 guard) misses every round-trip and
  // wholesale-replaces xyflow's internal node refs each cycle, causing
  // xyflow to re-measure dimensions and emit "trying to drag a node that is
  // not initialized" warnings during the re-measurement window. Structural
  // equality catches the echo while still allowing genuine external data
  // changes to trigger the resync.
  const lastControlledData = useRef<CanvasData | undefined>(data);
  useEffect(() => {
    if (!isControlled) return;
    if (data === lastControlledData.current) return;
    lastControlledData.current = data;
    if (
      data &&
      canvasMatchesInternalState(data, nodesRef.current, edgesRef.current)
    ) {
      // Round-trip echo — internal state already correct, no resync.
      return;
    }
    const nextNodes = (data ?? EMPTY).nodes.map(toXyNode);
    const nextEdges = (data ?? EMPTY).edges.map(toXyEdge);
    nodesRef.current = nextNodes;
    edgesRef.current = nextEdges;
    setInternalNodes(nextNodes);
    setInternalEdges(nextEdges);
    // v0.2.6 — viewport deliberately NOT adopted from `data`: the camera
    // cannot be moved post-mount by the data prop (defaultViewport only) and
    // the internal viewport tracks the REAL camera via onMoveEnd; overwriting
    // it here would make snapshot()/onChange report a camera the user isn't
    // seeing.
  }, [isControlled, data]);

  // v0.2.2 lock: notify the consumer in a microtask AFTER React commits the
  // current state update. Why deferred:
  //
  // - `fireOnChange` is called from 13 sites in this file, MOST of which sit
  //   inside `setInternalNodes/Edges/Viewport((prev) => { ... })` reducers
  //   (the "reducer-side-effect" pattern acknowledged in v0.2.0 plan F-V4 as
  //   a v0.3 cleanup candidate). When xyflow emits initial `dimensions`
  //   changes during its own render-phase measurement, the reducer-side-
  //   effect fires the consumer's `onChange` synchronously → consumer's
  //   `setCanvas` → React 19 "setState during render" warning on the
  //   consumer component. Surfaced 2026-05-16 by rich-card-in-flow@v0.1.0's
  //   demo (first controlled-mode consumer in the library).
  //
  // - Wrapping the body in `queueMicrotask` gives ONE invariant: consumer
  //   `onChange` always fires post-commit. Every code path in this file
  //   becomes render-phase-safe — no need to refactor each reducer-side-
  //   effect site individually. Promotes the v0.3-deferred cleanup forward
  //   because the bug surfaced; "consistency over a one-off divergence" per
  //   F-V4 still holds (all 13 sites get the SAME deferred behavior, not a
  //   mixed bag of one-microtask-deferred + twelve-still-synchronous).
  //
  // - v0.2.6 lock — COALESCED, REF-READ-AT-FIRE-TIME (replaces the v0.2.2
  //   "capture semantics" paragraph). Previously each call captured
  //   (nodes, edges, vp) in closure; call sites inside one updater passed
  //   their own `next` but read the SIBLING slice from its ref synchronously
  //   — before the sibling's updater/commit effect had run — so multi-slice
  //   mutations (node delete + edge cascade; keyboard delete's two change
  //   batches) notified with half-stale snapshots that could resurrect
  //   dangling edges through the controlled round-trip. Now:
  //     * every mutation site syncs its ref SYNCHRONOUSLY (inside the
  //       updater, or before a direct set) and calls the zero-arg
  //       fireOnChange();
  //     * multiple requests in one tick coalesce into ONE microtask
  //       (pending flag), whose body reads nodesRef/edgesRef/viewportRef at
  //       fire time — by then every same-tick ref sync has happened → one
  //       complete, self-consistent snapshot;
  //     * StrictMode's double-invoked updaters coalesce to a single fire for
  //       free (the double-fire noted in the 2026-08-10 review).
  //   The v0.2.4 drag guard below is unchanged and composes: fires requested
  //   during a drag are dropped at microtask time; onNodeDragStop requests
  //   the single authoritative post-drag fire.
  //
  // - Latency: one microtask. Imperceptible. React batches the consumer's
  //   resulting setState into the next paint either way.
  const firePendingRef = useRef(false);
  const fireOnChange = useCallback(() => {
    if (firePendingRef.current) return;
    firePendingRef.current = true;
    queueMicrotask(() => {
      firePendingRef.current = false;
      // v0.2.4 lock — drop the fire if a drag started between request and
      // microtask. Mid-drag round-trips would fail the structural-equality
      // check → wholesale replace → measured wiped → xyflow #015.
      // onNodeDragStop fires the authoritative post-drag snapshot.
      if (isDraggingRef.current) return;
      const cb = onChangeRef.current;
      if (!cb) return;
      cb({
        version: 1,
        nodes: nodesRef.current.map(fromXyNode),
        edges: edgesRef.current.map(fromXyEdge),
        viewport: viewportRef.current,
      });
    });
  }, []);

  const onNodesChange = useCallback(
    (changes: NodeChange<XyNode<XyNodeData>>[]) => {
      setInternalNodes((prev) => {
        const next = applyNodeChanges(changes, prev);
        // v0.2.6 — sync the ref inside the updater so the coalesced
        // fireOnChange microtask reads current state (refs also stay live
        // during drag; only the FIRE is suppressed).
        nodesRef.current = next;
        // v0.2.4 lock — suppress ALL consumer onChange notifications during
        // drag, not just position-only batches. Mid-drag mixed batches
        // (position + dimensions for non-dragged nodes during multi-select
        // or auto-layout resize) used to slip through, queue a microtask
        // with a snapshot, and by the time the microtask ran, further drag
        // ticks had moved internal state on. The stale snapshot round-
        // tripped through the consumer, failed structural-equality, and
        // triggered wholesale replace → xyflow #015. onNodeDragStop flushes
        // a single authoritative fire at drag end.
        if (isDraggingRef.current) return next;
        fireOnChange();
        return next;
      });
    },
    [fireOnChange],
  );

  // Drag-lifecycle callbacks — wired to <ReactFlow>'s onNodeDragStart /
  // onNodeDragStop props in canvas.tsx. The pair plus the v0.2.4 drag-time
  // suppression in `onNodesChange` and the microtask drag-guard in
  // `fireOnChange` together implement the description §4.1 Change #2 + #3
  // intent (no per-tick consumer fires during drag; single authoritative
  // fire at drag end), widened in v0.2.4 to cover mixed batches too.
  const onNodeDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  const onNodeDragStop = useCallback(() => {
    isDraggingRef.current = false;
    // Flush a final onChange with the committed state. The identity-read
    // updater runs AFTER any still-queued drag-tick updaters (React applies
    // queued updaters in dispatch order), so `latestNodes` — and the ref
    // sync — reflect the final position; returning the same reference bails
    // out of a re-render. The reducer-side-effect pattern (here + the other
    // sites in this file) is safe post-v0.2.2/v0.2.6: `fireOnChange` is
    // microtask-deferred + coalesced, so it never runs synchronously during
    // a reducer and double-invoked reducers request a single fire.
    setInternalNodes((latestNodes) => {
      nodesRef.current = latestNodes;
      fireOnChange();
      return latestNodes;
    });
  }, [fireOnChange]);

  // v0.2.6 — live camera tracking (bound to <ReactFlow>'s onMoveEnd in
  // canvas.tsx). See the UseCanvasDataResult comment for why camera-only
  // moves don't fire onChange.
  const onMoveEnd = useCallback(
    (_event: unknown, vp: { x: number; y: number; zoom: number }) => {
      const prev = viewportRef.current;
      if (prev && prev.x === vp.x && prev.y === vp.y && prev.zoom === vp.zoom) {
        return;
      }
      viewportRef.current = vp;
      setViewport(vp);
    },
    [],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<XyEdge>[]) => {
      setInternalEdges((prev) => {
        const next = applyEdgeChanges(changes, prev);
        edgesRef.current = next;
        fireOnChange();
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
        edgesRef.current = next;
        fireOnChange();
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
        nodesRef.current = next;
        fireOnChange();
        return next;
      });
      onNodeCreateRef.current?.(node);
    },
    [fireOnChange],
  );

  const updateNodeData = useCallback(
    (nodeId: string, mutate: (data: NodeData) => NodeData) => {
      // v0.2.6 (review §6 medium) — compute the next record eagerly from the
      // ref BEFORE dispatch; the updater only applies the precomputed data.
      // Running `mutate` + record capture inside the updater tied the
      // `onNodeUpdate` decision to WHEN React ran it (an eager first-updater
      // ran it in time; a deferred/StrictMode-replayed one ran it after the
      // `if (updatedRecord)` check → the callback silently never fired, and
      // consumer `mutate` code executed twice under StrictMode).
      const target = nodesRef.current.find((n) => n.id === nodeId);
      if (!target) return;
      const updatedData = mutate(target.data as NodeData);
      const updatedRecord = fromXyNode({ ...target, data: updatedData });
      setInternalNodes((prev) => {
        const next = prev.map((n) =>
          n.id === nodeId ? { ...n, data: updatedData } : n,
        );
        nodesRef.current = next;
        fireOnChange();
        return next;
      });
      onNodeUpdateRef.current?.(updatedRecord);
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
      // Cascade incident edges per Q15. Both updaters sync their ref and
      // request a fire — the single coalesced microtask (v0.2.6) sees the
      // node removal AND the edge cascade in one snapshot (pre-v0.2.6 the
      // node updater read a stale pre-cascade edgesRef → the notified data
      // could resurrect dangling edges through the controlled round-trip).
      setInternalEdges((prev) => {
        const next = prev.filter(
          (e) => e.source !== nodeId && e.target !== nodeId,
        );
        edgesRef.current = next;
        fireOnChange();
        return next;
      });
      setInternalNodes((prev) => {
        const next = prev.filter((n) => n.id !== nodeId);
        nodesRef.current = next;
        fireOnChange();
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
        edgesRef.current = next;
        fireOnChange();
        return next;
      });
      onEdgeDeleteRef.current?.(edgeId);
    },
    [fireOnChange],
  );

  const setNodes = useCallback(
    (nodes: NodeRecord[]) => {
      const next = nodes.map(toXyNode);
      nodesRef.current = next;
      setInternalNodes(next);
      fireOnChange();
    },
    [fireOnChange],
  );

  const setEdges = useCallback(
    (edges: EdgeRecord[]) => {
      const next = edges.map(toXyEdge);
      edgesRef.current = next;
      setInternalEdges(next);
      fireOnChange();
    },
    [fireOnChange],
  );

  const replace = useCallback(
    (next: CanvasData) => {
      const xn = next.nodes.map(toXyNode);
      const xe = next.edges.map(toXyEdge);
      nodesRef.current = xn;
      edgesRef.current = xe;
      viewportRef.current = next.viewport;
      setInternalNodes(xn);
      setInternalEdges(xe);
      setViewport(next.viewport);
      fireOnChange();
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
      // v0.2.6 (review §6 medium) — same eager-compute rule as
      // updateNodeData: the parent's post-removal record is derived from the
      // ref BEFORE dispatch so `onNodeUpdate` cannot be skipped by updater
      // timing; the updater only applies precomputed data.
      let updatedParentData: NodeData | undefined;
      let updatedParentRecord: NodeRecord | undefined;
      if (gesture === "move") {
        const parent = nodesRef.current.find((n) => n.id === parentId);
        if (parent) {
          updatedParentData = removeAtPath(parent.data as NodeData, path);
          updatedParentRecord = fromXyNode({ ...parent, data: updatedParentData });
        }
      }
      setInternalNodes((prev) => {
        const withChild = [...prev, toXyNode(newNode)];
        const parentData = updatedParentData;
        const next =
          parentData === undefined
            ? withChild
            : withChild.map((n) =>
                n.id === parentId ? { ...n, data: parentData } : n,
              );
        nodesRef.current = next;
        fireOnChange();
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
      onMoveEnd,
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
      onMoveEnd,
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
