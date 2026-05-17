"use client";

import { useMemo } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
// F-S1 lock — RELATIVE cross-procomp imports
import { defaultPortTypes } from "../../flow-canvas-01/registries/port-type-registry";
import type { CanvasData, Port } from "../../flow-canvas-01/types";
import { findPortTarget } from "../lib/find-port-target";
import { removePort, updatePort } from "../lib/port-mutators";
import type { PortEditorPermissions } from "../types";
import { PortEditorAddPopover } from "./port-editor-add-popover";
import { PortEditorRow } from "./port-editor-row";

export type PortEditorStripProps = {
  /** ID of the flow-canvas-01 node whose ports are being edited. */
  nodeId: string;
  /**
   * Optional subPath: the `__rcid` of a nested rich-card subcard. When
   * undefined, the strip targets the node's root card. When defined, walks
   * the data tree to find the matching subcard.
   */
  subPath?: string;
  /** Current canvas data (uncontrolled — strip reads + computes mutations). */
  canvas: CanvasData;
  /** Fires with the next CanvasData after every port mutation (live save per Q6). */
  onChange: (next: CanvasData) => void;
  /** When false, renders read-only summary rows. Default `true`. */
  editable?: boolean;
  /** Optional per-card / per-port / per-field permission predicates. */
  permissions?: PortEditorPermissions;
  /** Optional className applied to the strip root. */
  className?: string;
};

const EMPTY_PERMISSIONS: PortEditorPermissions = {};

/**
 * Editor strip for the `ports[]` array of a single rich-card / subcard inside
 * a flow-canvas-01 node. Mount alongside `<RichCard editable>` inside a
 * consumer-owned dialog. v0.2.0 addition.
 *
 * **Uncontrolled by design** (operates on the `canvas` prop directly). No
 * `key={nodeId}` remount needed — re-reads ports on prop change.
 *
 * **Live save:** every mutation calls `onChange(updatedCanvas)`. There is no
 * commit / cancel button. Per Q6 lock.
 *
 * **Add-flow supports "both"** via `[✓in] [✓out]` checkboxes — splits into 2
 * atomic port rows that are independent post-save (per description Q3 lock —
 * no auto-grouping at re-render).
 *
 * @example
 * ```tsx
 * <PortEditorStrip
 *   nodeId={editing.nodeId}
 *   subPath={editing.subPath}
 *   canvas={canvas}
 *   onChange={setCanvas}
 *   editable={true}
 * />
 * <RichCard editable defaultValue={editingTree} onChange={...} />
 * ```
 */
export function PortEditorStrip({
  nodeId,
  subPath,
  canvas,
  onChange,
  editable = true,
  permissions = EMPTY_PERMISSIONS,
  className,
}: PortEditorStripProps) {
  // v0.2 uses defaults only — Q5-bis lock; consumer-registered custom types
  // deferred to v0.3 with proper shared-context plumbing.
  const portTypes = defaultPortTypes;

  const target = useMemo(
    () => findPortTarget(canvas, nodeId, subPath),
    [canvas, nodeId, subPath],
  );

  // Pre-compute live-edges map per F-07 — one O(E) pass over the whole canvas.
  // Key is `${nodeId}:${portId}` (matches EdgeRecord's inline encoding).
  const liveEdgesMap = useMemo(() => {
    const out = new Map<string, { asSource: number; asTarget: number }>();
    for (const edge of canvas.edges) {
      bumpCount(out, edge.source, "asSource");
      bumpCount(out, edge.target, "asTarget");
    }
    return out;
  }, [canvas.edges]);

  if (!target) {
    return (
      <div
        className={cn(
          "rounded-md border border-dashed border-border/50 bg-muted/30 px-3 py-4 text-xs text-muted-foreground",
          className,
        )}
      >
        No card found at this path.
      </div>
    );
  }

  const cardId = target.cardRcid ?? target.node.id;
  const canAdd = editable && (permissions.canAddPort?.(cardId) ?? true);

  function commit(next: Port[]) {
    onChange(target!.updateIn(next));
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "space-y-2 rounded-md border border-border/60 bg-card/20 p-3",
          className,
        )}
      >
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Ports {target.ports.length > 0 ? `(${target.ports.length})` : ""}
          </p>
          {canAdd && (
            <PortEditorAddPopover
              cardRcid={target.cardRcid}
              portTypes={portTypes}
              onAdd={(newPorts) => commit([...target.ports, ...newPorts])}
            />
          )}
        </div>

        {target.ports.length === 0 ? (
          <p className="py-2 text-center text-xs text-muted-foreground">
            {editable
              ? "No ports yet. Click + add port to begin."
              : "No ports."}
          </p>
        ) : (
          <div className="space-y-1.5">
            {target.ports.map((port) => (
              <PortEditorRow
                key={port.id}
                cardId={cardId}
                port={port}
                portTypes={portTypes}
                existingPorts={target.ports}
                liveEdgeCount={
                  liveEdgesMap.get(`${target.node.id}:${port.id}`) ?? {
                    asSource: 0,
                    asTarget: 0,
                  }
                }
                editable={editable}
                permissions={permissions}
                onUpdate={(mut) =>
                  commit(updatePort(target.ports, port.id, mut))
                }
                onRemove={() => commit(removePort(target.ports, port.id))}
              />
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

function bumpCount(
  map: Map<string, { asSource: number; asTarget: number }>,
  edgeRef: `${string}:${string}`,
  key: "asSource" | "asTarget",
): void {
  const existing = map.get(edgeRef) ?? { asSource: 0, asTarget: 0 };
  existing[key] += 1;
  map.set(edgeRef, existing);
}
