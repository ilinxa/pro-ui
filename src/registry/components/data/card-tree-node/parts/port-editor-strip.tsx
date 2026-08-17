"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
// F-S1 lock — RELATIVE cross-procomp imports
import { defaultPortTypes } from "../../flow-canvas/registries/port-type-registry";
import type { CanvasData, Port } from "../../flow-canvas/types";
import type { CustomPredefinedKey, PredefinedKey } from "../../card-tree/types";
import { findPortTarget } from "../lib/find-port-target";
import { removePort, updatePort } from "../lib/port-mutators";
import type { PortEditorPermissions } from "../types";
import { PortEditorAddPopover } from "./port-editor-add-popover";
import { PortEditorRow } from "./port-editor-row";

export type PortEditorStripProps = {
  /** ID of the flow-canvas node whose ports are being edited. */
  nodeId: string;
  /**
   * Optional subPath: the `__rcid` of a nested card-tree subcard. When
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
  /**
   * The host's block registrations — **the same value passed to
   * `createCardTreeViewerRenderer()` and to `<CardTree>`**. The strip reads
   * only `key`, to decide which properties are nested cards it may walk into
   * and which are opaque block payloads it must not touch.
   *
   * Omitting it while the viewer *does* register keys puts the two back out
   * of step: a registered block whose payload happens to carry `ports` or an
   * `__rcid` becomes walkable again, and `onChange` can write a `ports` array
   * into it. Pass a stable reference — an inline literal re-derives the name
   * list every render.
   *
   * Import the type from `@ilinxa/card-tree`, not from this package.
   *
   * v0.5.0 addition (FU-A).
   */
  customPredefinedKeys?: readonly CustomPredefinedKey[];
  /**
   * Built-ins the consumer opted out of — mirrors `<CardTree>`'s prop and
   * `CardTreeViewerOptions.disabledPredefinedKeys`. An opted-out built-in is
   * demoted to a plain field, exactly as card-tree does it, so an
   * object-valued one is neither a block nor a walkable child.
   *
   * v0.5.0 addition (FU-A).
   */
  disabledPredefinedKeys?: readonly PredefinedKey[];
  /** Optional className applied to the strip root. */
  className?: string;
};

const EMPTY_PERMISSIONS: PortEditorPermissions = {};
/** Module-scope constants so the default path keeps a stable identity. */
const EMPTY_CUSTOM_KEYS: readonly CustomPredefinedKey[] = [];
const EMPTY_DISABLED_KEYS: readonly PredefinedKey[] = [];

/**
 * Editor strip for the `ports[]` array of a single card-tree / subcard inside
 * a flow-canvas node. Mount alongside `<CardTree editable>` inside a
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
 * <CardTree editable defaultValue={editingTree} onChange={...} />
 * ```
 */
export function PortEditorStrip({
  nodeId,
  subPath,
  canvas,
  onChange,
  editable = true,
  permissions = EMPTY_PERMISSIONS,
  customPredefinedKeys = EMPTY_CUSTOM_KEYS,
  disabledPredefinedKeys = EMPTY_DISABLED_KEYS,
  className,
}: PortEditorStripProps) {
  // v0.2 uses defaults only — Q5-bis lock; consumer-registered custom types
  // deferred to v0.3 with proper shared-context plumbing.
  const portTypes = defaultPortTypes;

  // v0.5.0 (FU-A) — the walker classifies keys with the same router the
  // viewer uses, so it needs the same registrations. Derived here rather than
  // inside the target memo so a stable `customPredefinedKeys` reference keeps
  // the name list stable too.
  const keyOptions = useMemo(
    () => ({
      customKeyNames: customPredefinedKeys.map((k) => k.key),
      disabledPredefinedKeys,
    }),
    [customPredefinedKeys, disabledPredefinedKeys],
  );

  const target = useMemo(
    () => findPortTarget(canvas, nodeId, subPath, keyOptions),
    [canvas, nodeId, subPath, keyOptions],
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

  // `target!` is safe here — narrowed by the `if (!target) return` guard
  // above; the assertion is needed only because the inner-function scope
  // loses TS flow-analysis.
  function commit(next: Port[]) {
    onChange(target!.updateIn(next));
  }

  // F-cross-13: TooltipProvider dropped with the row tooltips (the id-field
  // hint is a native `title` now — see port-editor-row.tsx).
  return (
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
        // Horizontal scroll wrapper — when the dialog or strip parent is
        // narrower than the row's combined column min-widths, rows stay at
        // their natural width and the strip becomes swipeable in x.
        <div className="-mx-3 overflow-x-auto px-3">
          <div className="min-w-max space-y-1.5">
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
        </div>
      )}
    </div>
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
