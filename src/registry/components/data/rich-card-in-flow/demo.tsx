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
} from "@/registry/components/data/flow-canvas-01";
import {
  RichCard,
  type RichCardHandle,
  type RichCardJsonNode,
} from "@/registry/components/data/rich-card";
import { richCardViewerRenderer } from "./parts/rich-card-viewer";
import { richCardInFlowFixture } from "./dummy-data";

// Module-scope renderers (per xyflow-react-pro skill: recreating renderer
// arrays in render triggers teardown + remount on every render).
const RENDERERS: NodeRenderer[] = [richCardViewerRenderer];

export default function RichCardInFlowDemo() {
  // Controlled canvas state. onChange flows from flow-canvas-01 (after drag /
  // connect / delete) and from rich-card's onChange (live-save per Q2).
  const [canvas, setCanvas] = useState(richCardInFlowFixture);
  const [editing, setEditing] = useState<
    { nodeId: string; subPath?: string } | null
  >(null);

  // F-02 lock: imperative `RichCardHandle.focusCard(subPath)` via ref. There's
  // no `initialFocusCardId` prop on RichCard today, so this is how subcard-
  // level edit targeting reaches the editor.
  const richCardRef = useRef<RichCardHandle>(null);

  // Read the editing node's data once per open so RichCard's defaultValue is
  // stable across keystrokes (avoids the "value resets on every keystroke"
  // anti-pattern). Re-derived only when editing.nodeId changes.
  const editingTree: RichCardJsonNode | null = useMemo(() => {
    if (!editing) return null;
    const node = canvas.nodes.find((n) => n.id === editing.nodeId);
    if (!node) return null;
    return node.data as RichCardJsonNode;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing?.nodeId]);

  // F-02 lock continued: focus the targeted subcard once RichCard has mounted.
  // Runs after the dialog opens. If subPath is undefined (root-level edit),
  // skip — rich-card opens at root by default.
  useEffect(() => {
    if (!editing?.subPath) return;
    const handle = richCardRef.current;
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit rich card</DialogTitle>
            <DialogDescription>
              Edits live-save back into the canvas. Close the dialog or click
              another node to switch.
            </DialogDescription>
          </DialogHeader>

          {editing && editingTree && (
            // key={editing.nodeId} forces a clean remount when switching nodes.
            // Plate re-initializes per open — see plan §9 G3 for the perf trade.
            <div className="max-h-[60vh] overflow-auto">
              <RichCard
                key={editing.nodeId}
                ref={richCardRef}
                defaultValue={editingTree}
                editable={true}
                onChange={(next) => {
                  setCanvas((prev) =>
                    updateNodeData(
                      prev,
                      editing.nodeId,
                      // RichCard returns RichCardJsonNode; the canvas node's
                      // data is RichCardCanvasNode (NodeData & RichCardJsonNode).
                      // Preserve __type + ports by spreading the prior data
                      // shape onto the rich-card output.
                      {
                        ...(prev.nodes.find((n) => n.id === editing.nodeId)
                          ?.data ?? {}),
                        ...next,
                      } as RichCardJsonNode & { __type: string },
                    ),
                  );
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
