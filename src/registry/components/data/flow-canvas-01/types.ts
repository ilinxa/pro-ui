import type { ReactNode, Ref } from "react";

// ───── Port — embedded inside data at any tree depth ─────

export type PortDir = "in" | "out";
export type PortSide = "left" | "right" | "top" | "bottom";

export type Port = {
  id: string;
  side: PortSide;
  dir: PortDir;
  type: string;
  multi?: boolean;
  label?: string;
};

// ───── Node data — pure JSON, schema-discriminated, ports recursive ─────

export type NodeData = {
  __type: string;
  ports?: Port[];
  [key: string]: unknown;
};

export type NodeRecord = {
  id: string;
  position: { x: number; y: number };
  data: NodeData;
  width?: number;
  height?: number;
  selected?: boolean;
  locked?: boolean;
};

export type EdgeRecord = {
  id: string;
  source: `${string}:${string}`;
  target: `${string}:${string}`;
  type?: string;
  selected?: boolean;
};

export type CanvasData = {
  version: 1;
  nodes: NodeRecord[];
  edges: EdgeRecord[];
  viewport?: { x: number; y: number; zoom: number };
};

// ───── Registries ─────

export type RenderContext = {
  nodeId: string;
  isSelected: boolean;
  isDragging: boolean;
  isReadOnly: boolean;
  renderChild: (data: NodeData, opts?: { path?: string }) => ReactNode;
};

export type NodeRenderer<TData extends NodeData = NodeData> = {
  type: string;
  label: string;
  defaultPorts?: (data: TData) => Port[];
  defaultSubPorts?: (data: TData) => Record<string, Port[]>;
  render: (data: TData, ctx: RenderContext) => ReactNode;
  extractablePaths?: (data: TData) => string[];
};

export type PortType = {
  id: string;
  label?: string;
  color: string;
  icon?: ReactNode;
};

export type EdgeRenderContext = {
  edgeId: string;
  source: { node: NodeRecord; port: Port };
  target: { node: NodeRecord; port: Port };
  isSelected: boolean;
};

export type EdgeRenderer = {
  type: string;
  label?: string;
  render: (edge: EdgeRecord, ctx: EdgeRenderContext) => ReactNode;
};

// ───── Right-click menu ─────

export type MenuItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  separatorBefore?: boolean;
};

// ───── The canvas component ─────

export type FlowCanvasBackgroundConfig = {
  light?: { from: string; to: string; angle?: number };
  dark?: { from: string; to: string; angle?: number };
  overlay?: "none" | "dots" | "grid" | "cross";
  overlayOpacity?: number;
};

export type FlowCanvasExportHandle = {
  export: (opts: { withPorts: boolean }) => CanvasData;
};

export type FlowCanvasProps = {
  renderers?: NodeRenderer[];
  portTypes?: PortType[];
  edgeTypes?: EdgeRenderer[];

  data?: CanvasData;
  defaultData?: CanvasData;
  onChange?: (next: CanvasData) => void;

  onBeforeDrop?: (
    incoming: unknown,
    point: { x: number; y: number },
  ) => NodeData | null;
  onBeforeConnect?: (
    edge: EdgeRecord,
    ctx: { source: Port; target: Port },
  ) => boolean | EdgeRecord;

  onNodeCreate?: (node: NodeRecord) => void;
  onNodeUpdate?: (node: NodeRecord) => void;
  onNodeDelete?: (nodeId: string) => void;
  onEdgeCreate?: (edge: EdgeRecord) => void;
  onEdgeDelete?: (edgeId: string) => void;
  onSubObjectExtract?: (
    parentId: string,
    path: string,
    gesture: "copy" | "move",
  ) => void;

  menuItems?: {
    canvas?: MenuItem[];
    node?: (node: NodeRecord) => MenuItem[];
    edge?: (edge: EdgeRecord) => MenuItem[];
  };

  background?: FlowCanvasBackgroundConfig;

  readOnly?: boolean;
  panOnDrag?: boolean;
  zoomOnScroll?: boolean;
  selectionMode?: "single" | "multi";

  /**
   * When true (default v0.2.0+), xyflow culls nodes + edges outside the
   * viewport before rendering. Transforms perf at large N (5k+ heavy: ~12×
   * FPS lift on one machine, per 2026-05-14 baseline). Marginal effect
   * below ~200 nodes.
   *
   * Known caveats (don't block adoption):
   * - All nodes still render on initial mount; culling kicks in after the
   *   first viewport movement (xyflow issue #4378).
   * - Offscreen edges may stutter if their offscreen target node has an
   *   explicit height (xyflow issue #4329).
   *
   * Pass `={false}` to opt out (e.g. if you rely on offscreen-node DOM for
   * layout measurement — rare).
   */
  onlyRenderVisibleElements?: boolean;

  exportRef?: Ref<FlowCanvasExportHandle>;

  "aria-label"?: string;

  className?: string;
};

// ───── Layout helper props ─────

export type PortsAtProps = {
  ports: Port[] | undefined;
  position: PortSide;
  spacing?: number;
};
