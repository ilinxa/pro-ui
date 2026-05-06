"use client";

import {
  Copy,
  CopyPlus,
  FileJson,
  Maximize2,
  RotateCcw,
  Scissors,
  Trash2,
} from "lucide-react";
import { useCallback, useState, type ReactNode } from "react";
import { useReactFlow } from "@xyflow/react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { findRenderer } from "../registries/renderer-registry";
import { useFlowCanvasContext } from "../registries/canvas-context";
import type {
  EdgeRecord,
  FlowCanvasProps,
  MenuItem,
  NodeData,
  NodeRecord,
} from "../types";
import { PasteDialog } from "./paste-dialog";

type Target =
  | { kind: "canvas"; point: { x: number; y: number } }
  | { kind: "node"; node: NodeRecord }
  | { kind: "edge"; edge: EdgeRecord };

type Actions = {
  duplicateNode: (id: string) => void;
  deleteNode: (id: string) => void;
  deleteEdge: (id: string) => void;
  updateNodeData: (id: string, mutate: (d: NodeData) => NodeData) => void;
  extractSubObject: (input: {
    parentId: string;
    path: string;
    gesture: "copy" | "move";
    newNode: NodeRecord;
  }) => void;
  appendNode: (node: NodeRecord) => void;
};

export function CanvasContextMenu({
  children,
  readOnly,
  menuItems,
  nodes,
  edges,
  actions,
}: {
  children: ReactNode;
  readOnly: boolean;
  menuItems: FlowCanvasProps["menuItems"];
  nodes: NodeRecord[];
  edges: EdgeRecord[];
  actions: Actions;
}) {
  const { renderers } = useFlowCanvasContext();
  const { fitView, zoomTo, screenToFlowPosition } = useReactFlow();
  const [target, setTarget] = useState<Target | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pastePoint, setPastePoint] = useState<{ x: number; y: number } | null>(
    null,
  );

  // Resolve what was right-clicked. The xyflow DOM exposes data-id on
  // .react-flow__node and .react-flow__edge.
  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const el = e.target as HTMLElement;
      const nodeEl = el.closest("[data-id]") as HTMLElement | null;
      const isNode = nodeEl?.classList.contains("react-flow__node") ?? false;
      const edgeEl = el.closest(".react-flow__edge") as HTMLElement | null;
      const isEdge = !!edgeEl;

      if (isNode && nodeEl) {
        const id = nodeEl.getAttribute("data-id");
        const node = id ? nodes.find((n) => n.id === id) : undefined;
        if (node) {
          setTarget({ kind: "node", node });
          return;
        }
      }
      if (isEdge && edgeEl) {
        const id = edgeEl.getAttribute("data-id");
        const edge = id ? edges.find((ed) => ed.id === id) : undefined;
        if (edge) {
          setTarget({ kind: "edge", edge });
          return;
        }
      }
      const point = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setTarget({ kind: "canvas", point });
    },
    [nodes, edges, screenToFlowPosition],
  );

  const copyAsJson = useCallback((node: NodeRecord) => {
    const text = JSON.stringify(node.data, null, 2);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => undefined);
    }
  }, []);

  const convertToCustomJson = useCallback(
    (node: NodeRecord) => {
      actions.updateNodeData(node.id, (d) => ({ ...d, __type: "custom-json" }));
    },
    [actions],
  );

  const addCustomNode = useCallback(
    (point: { x: number; y: number }) => {
      const node: NodeRecord = {
        id:
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `n-${Math.random().toString(36).slice(2, 10)}`,
        position: point,
        data: { __type: "custom-json", _label: "Custom JSON" },
      };
      actions.appendNode(node);
    },
    [actions],
  );

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div onContextMenu={handleContextMenu} className="contents">
            {children}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {target?.kind === "node" && (
            <NodeMenu
              node={target.node}
              renderers={renderers}
              readOnly={readOnly}
              consumerItems={menuItems?.node}
              onCopyJson={copyAsJson}
              onConvert={convertToCustomJson}
              onDuplicate={actions.duplicateNode}
              onDelete={actions.deleteNode}
              onExtract={(path) =>
                extractFromNode(target.node, path, actions.extractSubObject)
              }
            />
          )}
          {target?.kind === "edge" && (
            <EdgeMenu
              edge={target.edge}
              readOnly={readOnly}
              consumerItems={menuItems?.edge}
              onDelete={actions.deleteEdge}
            />
          )}
          {target?.kind === "canvas" && (
            <PaneMenu
              readOnly={readOnly}
              consumerItems={menuItems?.canvas}
              onPaste={() => {
                setPastePoint(target.point);
                setPasteOpen(true);
              }}
              onAddCustom={() => addCustomNode(target.point)}
              onFitView={() => fitView({ duration: 200 })}
              onResetZoom={() => zoomTo(1, { duration: 150 })}
            />
          )}
        </ContextMenuContent>
      </ContextMenu>
      <PasteDialog
        open={pasteOpen}
        onOpenChange={setPasteOpen}
        onSubmit={(data) => {
          if (!pastePoint) return;
          const node: NodeRecord = {
            id:
              typeof crypto !== "undefined" &&
              typeof crypto.randomUUID === "function"
                ? crypto.randomUUID()
                : `n-${Math.random().toString(36).slice(2, 10)}`,
            position: pastePoint,
            data,
          };
          actions.appendNode(node);
          setPasteOpen(false);
        }}
      />
    </>
  );
}

// ─── Pane (canvas) menu ───────────────────────────────────────────────

function PaneMenu({
  readOnly,
  consumerItems,
  onPaste,
  onAddCustom,
  onFitView,
  onResetZoom,
}: {
  readOnly: boolean;
  consumerItems?: MenuItem[];
  onPaste: () => void;
  onAddCustom: () => void;
  onFitView: () => void;
  onResetZoom: () => void;
}) {
  return (
    <>
      <ContextMenuLabel>Canvas</ContextMenuLabel>
      {!readOnly && (
        <>
          <ContextMenuItem onSelect={onPaste}>
            <FileJson aria-hidden />
            Paste JSON…
          </ContextMenuItem>
          <ContextMenuItem onSelect={onAddCustom}>
            <CopyPlus aria-hidden />
            Add custom node
          </ContextMenuItem>
          <ContextMenuSeparator />
        </>
      )}
      <ContextMenuItem onSelect={onFitView}>
        <Maximize2 aria-hidden />
        Fit view
      </ContextMenuItem>
      <ContextMenuItem onSelect={onResetZoom}>
        <RotateCcw aria-hidden />
        Reset zoom
      </ContextMenuItem>
      {consumerItems && consumerItems.length > 0 && (
        <>
          <ContextMenuSeparator />
          <ConsumerItems items={consumerItems} />
        </>
      )}
    </>
  );
}

// ─── Node menu ────────────────────────────────────────────────────────

function NodeMenu({
  node,
  renderers,
  readOnly,
  consumerItems,
  onCopyJson,
  onConvert,
  onDuplicate,
  onDelete,
  onExtract,
}: {
  node: NodeRecord;
  renderers: ReturnType<typeof useFlowCanvasContext>["renderers"];
  readOnly: boolean;
  consumerItems?: (n: NodeRecord) => MenuItem[];
  onCopyJson: (n: NodeRecord) => void;
  onConvert: (n: NodeRecord) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onExtract: (path: string) => void;
}) {
  const renderer = findRenderer(renderers, node.data.__type);
  const extractablePaths = renderer?.extractablePaths?.(node.data) ?? [];
  const consumerExtras = consumerItems ? consumerItems(node) : [];

  return (
    <>
      <ContextMenuLabel className="truncate">
        {renderer?.label ?? node.data.__type}
      </ContextMenuLabel>
      <ContextMenuItem onSelect={() => onCopyJson(node)}>
        <Copy aria-hidden />
        Copy as JSON
      </ContextMenuItem>
      {!readOnly && (
        <>
          <ContextMenuItem onSelect={() => onDuplicate(node.id)}>
            <CopyPlus aria-hidden />
            Duplicate
          </ContextMenuItem>
          {node.data.__type !== "custom-json" && (
            <ContextMenuItem onSelect={() => onConvert(node)}>
              <FileJson aria-hidden />
              Convert to custom-JSON
            </ContextMenuItem>
          )}
          {extractablePaths.length > 0 && (
            <>
              <ContextMenuSeparator />
              <ContextMenuLabel className="text-[10px]">
                Extract sub-object
              </ContextMenuLabel>
              {extractablePaths.map((path) => (
                <ContextMenuItem key={path} onSelect={() => onExtract(path)}>
                  <Scissors aria-hidden />
                  {path}
                </ContextMenuItem>
              ))}
            </>
          )}
          <ContextMenuSeparator />
          <ContextMenuItem
            variant="destructive"
            onSelect={() => onDelete(node.id)}
          >
            <Trash2 aria-hidden />
            Delete
          </ContextMenuItem>
        </>
      )}
      {consumerExtras.length > 0 && (
        <>
          <ContextMenuSeparator />
          <ConsumerItems items={consumerExtras} />
        </>
      )}
    </>
  );
}

// ─── Edge menu ────────────────────────────────────────────────────────

function EdgeMenu({
  edge,
  readOnly,
  consumerItems,
  onDelete,
}: {
  edge: EdgeRecord;
  readOnly: boolean;
  consumerItems?: (e: EdgeRecord) => MenuItem[];
  onDelete: (id: string) => void;
}) {
  const consumerExtras = consumerItems ? consumerItems(edge) : [];
  return (
    <>
      <ContextMenuLabel className="truncate">Edge</ContextMenuLabel>
      {!readOnly && (
        <ContextMenuItem
          variant="destructive"
          onSelect={() => onDelete(edge.id)}
        >
          <Trash2 aria-hidden />
          Delete
        </ContextMenuItem>
      )}
      {consumerExtras.length > 0 && (
        <>
          <ContextMenuSeparator />
          <ConsumerItems items={consumerExtras} />
        </>
      )}
    </>
  );
}

// ─── Consumer-supplied items ──────────────────────────────────────────

function ConsumerItems({ items }: { items: MenuItem[] }) {
  return (
    <>
      {items.map((item) =>
        item.separatorBefore ? (
          <ContextMenuSeparator key={`sep-${item.id}`} />
        ) : (
          <ContextMenuItem
            key={item.id}
            disabled={item.disabled}
            onSelect={item.onSelect}
          >
            {item.icon}
            {item.label}
          </ContextMenuItem>
        ),
      )}
    </>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────

function extractFromNode(
  parent: NodeRecord,
  path: string,
  extractSubObject: Actions["extractSubObject"],
) {
  // Walk parent.data at `path` to grab the sub-data, then dispatch as a
  // copy-extract (no Alt-modifier through the menu — keyboard-first
  // accessibility per Q10 / plan §3.8).
  const sub = walkPathRead(parent.data, path);
  if (!sub) return;

  const subData =
    typeof (sub as Record<string, unknown>).__type === "string"
      ? (sub as NodeData)
      : { __type: "custom-json" as const, ...(sub as Record<string, unknown>) };

  const newNode: NodeRecord = {
    id:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `n-${Math.random().toString(36).slice(2, 10)}`,
    position: { x: parent.position.x + 320, y: parent.position.y + 40 },
    data: subData,
  };
  extractSubObject({
    parentId: parent.id,
    path,
    gesture: "copy",
    newNode,
  });
}

function walkPathRead(data: unknown, path: string): unknown {
  const re = /([^.[\]]+)|\[(\d+)\]/g;
  let cursor: unknown = data;
  let m: RegExpExecArray | null;
  while ((m = re.exec(path)) !== null) {
    if (cursor === null || typeof cursor !== "object") return undefined;
    if (m[1] !== undefined) {
      cursor = (cursor as Record<string, unknown>)[m[1]];
    } else if (m[2] !== undefined) {
      if (!Array.isArray(cursor)) return undefined;
      cursor = cursor[Number(m[2])];
    }
  }
  return cursor;
}
