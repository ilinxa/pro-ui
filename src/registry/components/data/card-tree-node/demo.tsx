"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FlowCanvas,
  type NodeRenderer,
  updateNodeData,
} from "@/registry/components/data/flow-canvas";
import {
  CardTree,
  type CardTreeHandle,
  type CardTreeJsonNode,
} from "@/registry/components/data/card-tree";
import { PortEditorStrip } from "./parts/port-editor-strip";
import { cardTreeViewerRenderer } from "./parts/card-tree-viewer";
import { cardTreeNodeFixture } from "./dummy-data";

// Module-scope renderers (per xyflow-react-pro skill: recreating renderer
// arrays in render triggers teardown + remount on every render).
const RENDERERS: NodeRenderer[] = [cardTreeViewerRenderer];

// Reserved keys that belong to flow-canvas's NodeData shape (ports + the
// `__type` discriminator) but not to card-tree's open-shape data model.
// card-tree v0.1 logs warnings when it sees `ports: Port[]` arrays as
// children (its parser only supports object-keyed children + the `list`
// predefined key for scalar arrays). Strip these before handing to
// `<CardTree>`; merge back on save so flow-canvas keeps its routing data.
const FLOW_CANVAS_RESERVED_KEYS = new Set(["ports", "__type"]);

function stripFlowCanvasFields(data: CardTreeJsonNode): CardTreeJsonNode {
  const out: CardTreeJsonNode = {};
  for (const [key, value] of Object.entries(data)) {
    if (FLOW_CANVAS_RESERVED_KEYS.has(key)) continue;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = stripFlowCanvasFields(value as CardTreeJsonNode);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function mergeFlowCanvasFields(
  edited: CardTreeJsonNode,
  original: CardTreeJsonNode,
): CardTreeJsonNode {
  const out: CardTreeJsonNode = { ...edited };
  // Restore the reserved keys from the original at this level.
  for (const key of FLOW_CANVAS_RESERVED_KEYS) {
    if (original[key] !== undefined) {
      out[key] = original[key];
    }
  }
  // Recurse into nested object children (subcards) by key match. Subcards
  // not present in `edited` are dropped (user deleted them via card-tree);
  // new subcards in `edited` not in `original` are preserved as-is (they
  // have no flow-canvas data to merge).
  for (const [key, value] of Object.entries(edited)) {
    if (FLOW_CANVAS_RESERVED_KEYS.has(key)) continue;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const origChild = original[key];
      if (
        origChild &&
        typeof origChild === "object" &&
        !Array.isArray(origChild)
      ) {
        out[key] = mergeFlowCanvasFields(
          value as CardTreeJsonNode,
          origChild as CardTreeJsonNode,
        );
      }
    }
  }
  return out;
}

export default function CardTreeNodeDemo() {
  // Controlled canvas state. onChange flows from flow-canvas (after drag /
  // connect / delete) and from card-tree's onChange (live-save per Q2).
  const [canvas, setCanvas] = useState(cardTreeNodeFixture);
  const [editing, setEditing] = useState<
    { nodeId: string; subPath?: string } | null
  >(null);

  // F-02 lock: imperative `CardTreeHandle.focusCard(subPath)` via ref. There's
  // no `initialFocusCardId` prop on CardTree today, so this is how subcard-
  // level edit targeting reaches the editor.
  const cardTreeRef = useRef<CardTreeHandle>(null);

  // Read the editing node's data once per open so CardTree's defaultValue is
  // stable across keystrokes (avoids the "value resets on every keystroke"
  // anti-pattern). Strips flow-canvas reserved keys before handing to CardTree.
  // Re-derived only when editing.nodeId changes (dep array intentional —
  // `canvas` is read at memo time but doesn't trigger re-derivation; CardTree
  // is uncontrolled via defaultValue + key= remount).
  const editingTree: CardTreeJsonNode | null = useMemo(() => {
    if (!editing) return null;
    const node = canvas.nodes.find((n) => n.id === editing.nodeId);
    if (!node) return null;
    return stripFlowCanvasFields(node.data as CardTreeJsonNode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing?.nodeId]);

  // F-02 lock continued: focus the targeted subcard once CardTree has mounted.
  // Runs after the dialog opens. If subPath is undefined (root-level edit),
  // skip — card-tree opens at root by default.
  useEffect(() => {
    if (!editing?.subPath) return;
    const handle = cardTreeRef.current;
    if (!handle) return;
    handle.focusCard(editing.subPath);
  }, [editing?.subPath, editing?.nodeId]);

  return (
    <div className="flex h-150 flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        Click any node to edit. Click a nested subcard to open the editor
        pre-focused on it. Marquee-select or shift-click for multi-select
        (canvas-level — bulk edit deferred to v0.2).
      </p>

      <div className="relative flex-1 overflow-hidden rounded-lg border border-border bg-card/40">
        <FlowCanvas
          data={canvas}
          onChange={setCanvas}
          renderers={RENDERERS}
          onEditRequest={(nodeId, subPath) => setEditing({ nodeId, subPath })}
        />
      </div>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        {/* shadcn DialogContent defaults to `sm:max-w-sm` (384px) at the sm
            breakpoint — must use the responsive variant to override it.
            Plain `max-w-N` would be capped to 384px on sm+. */}
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit rich card</DialogTitle>
            <DialogDescription>
              Edits live-save back into the canvas. Close the dialog or click
              another node to switch.
            </DialogDescription>
          </DialogHeader>

          {editing && editingTree && (
            // key={editing.nodeId} forces a clean remount on CardTree when
            // switching nodes — Plate re-initializes per open (plan §9 G3).
            // PortEditorStrip is uncontrolled-by-design (Q9 lock); no key=
            // remount needed — it re-reads ports on canvas-prop change.
            <div className="max-h-[60vh] space-y-3 overflow-auto">
              {/* v0.2 — port editor strip above the card-tree editor per Q1 lock */}
              <PortEditorStrip
                nodeId={editing.nodeId}
                subPath={editing.subPath}
                canvas={canvas}
                onChange={setCanvas}
                editable={true}
              />
              <CardTree
                key={editing.nodeId}
                ref={cardTreeRef}
                defaultValue={editingTree}
                editable={true}
                onChange={(next) => {
                  setCanvas((prev) => {
                    const original = prev.nodes.find(
                      (n) => n.id === editing.nodeId,
                    )?.data as CardTreeJsonNode | undefined;
                    if (!original) return prev;
                    // Merge card-tree's edited tree with the prior data shape
                    // so flow-canvas-only reserved keys (ports + __type) round-
                    // trip through the edit cleanly.
                    const merged = mergeFlowCanvasFields(next, original);
                    return updateNodeData(
                      prev,
                      editing.nodeId,
                      merged as CardTreeJsonNode & { __type: string },
                    );
                  });
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
