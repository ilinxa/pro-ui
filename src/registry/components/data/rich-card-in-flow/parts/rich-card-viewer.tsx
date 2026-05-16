"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import type {
  NodeRenderer,
  RenderContext,
} from "@/registry/components/data/flow-canvas-01";
import { PortsAt } from "@/registry/components/data/flow-canvas-01";
import type { RichCardCanvasNode } from "../types";
import { enumerateSubcards } from "../lib/enumerate-subcards";
import { deriveTitle } from "../lib/derive-title";
import { deriveFlatFields } from "../lib/derive-flat-fields";
import { FlatFieldStrip } from "./flat-field-strip";
import { SubcardBlock } from "./subcard-block";

// Locked constants (Q6 — v0.2 may open these as RichCardViewerOptions).
const MAX_FLAT_FIELDS = 3;
const MAX_NESTED_OUTLINES = 4;

/**
 * Read-only renderer that paints a rich-card tree as a flow-canvas-01 node.
 * Title strip + first 3 flat fields + nested-card outlines with their own
 * ports + root-level port handles. Clicks fire `ctx.onEditRequest(subPath?)`;
 * consumer routes to a dialog mounting `<RichCard editable>`.
 *
 * Composition (F-V1 lock — see procomp plan §3.5):
 *   <div role="group">                ← outer (NOT a button)
 *     <button>title strip</button>    ← root edit affordance
 *     <FlatFieldStrip />              ← read-only fields (no buttons)
 *     <SubcardBlock /> × N            ← each a <button> with its own ports
 *     <PortsAt /> × 4 sides           ← root-level ports
 *   </div>
 *
 * Position-relative chain (F-05 + G1 lock):
 *   NodeShell → RichCardViewer outer → SubcardBlock — each MUST be position:
 *   relative or xyflow's `<Handle>` (position: absolute) anchors to a wrong
 *   positioned ancestor. The "relative" className below is load-bearing.
 */
function RichCardViewerImpl({
  data,
  ctx,
}: {
  data: RichCardCanvasNode;
  ctx: RenderContext;
}) {
  const title = deriveTitle(data);
  const flatFields = deriveFlatFields(data, MAX_FLAT_FIELDS);
  const subcards = enumerateSubcards(data).slice(0, MAX_NESTED_OUTLINES);
  const ports = data.ports;

  // F-V1 lock: outer is <div role="group">, NOT a button. Nested buttons
  // (title strip + each subcard) compose cleanly because the outer is a
  // grouping role, not an interactive element.
  return (
    <div
      role="group"
      aria-label={`Rich card: ${title ?? "Untitled"}`}
      className={cn(
        // F-05 + G1: position: relative is REQUIRED — xyflow handles anchor here.
        "relative min-w-60 max-w-90 rounded-md border border-border",
        "bg-card text-card-foreground shadow-sm",
      )}
    >
      {/* Title strip — click opens root dialog */}
      <button
        type="button"
        onClick={() => ctx.onEditRequest?.()}
        disabled={!ctx.onEditRequest}
        className={cn(
          "flex w-full items-center gap-2 border-b border-border px-3 py-2",
          "text-left text-sm font-semibold",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          ctx.onEditRequest && "cursor-pointer hover:bg-accent/40",
          !ctx.onEditRequest && "cursor-default",
        )}
        aria-haspopup={ctx.onEditRequest ? "dialog" : undefined}
      >
        <span className="truncate">{title ?? "Untitled rich-card"}</span>
      </button>

      {/* First-N flat fields */}
      {flatFields.length > 0 && <FlatFieldStrip fields={flatFields} />}

      {/* Subcard outlines (one level deep in v0.1) */}
      {subcards.length > 0 && (
        <div className="space-y-1.5 p-2">
          {subcards.map(({ key, card }) => (
            <SubcardBlock
              key={card.__rcid ?? key}
              cardKey={key}
              card={card}
              onEdit={(rcid) => ctx.onEditRequest?.(rcid)}
            />
          ))}
        </div>
      )}

      {/* Root-level port handles */}
      <PortsAt ports={ports} position="left" />
      <PortsAt ports={ports} position="right" />
      <PortsAt ports={ports} position="top" />
      <PortsAt ports={ports} position="bottom" />
    </div>
  );
}

const RichCardViewer = memo(RichCardViewerImpl);

/**
 * `NodeRenderer<RichCardCanvasNode>` — drop-in for flow-canvas-01's
 * `renderers` prop. Consumer wiring:
 *
 *   <FlowCanvas
 *     renderers={[richCardViewerRenderer]}
 *     onEditRequest={(nodeId, subPath) => openDialog(nodeId, subPath)}
 *     data={canvasData}
 *     onChange={setCanvasData}
 *   />
 *
 * F-V6 lock — `NodeRenderer<TData extends NodeData>` requires `TData` to
 * extend `NodeData` (which mandates `__type: string`). RichCardJsonNode alone
 * doesn't satisfy that constraint; `RichCardCanvasNode = NodeData &
 * RichCardJsonNode` is the type that flows into the registry. Precedent:
 * `customJsonRenderer`'s `NodeData & { _label?: string }` in flow-canvas-01.
 */
export const richCardViewerRenderer: NodeRenderer<RichCardCanvasNode> = {
  type: "rich-card",
  label: "Rich card",
  render: (data, ctx) => <RichCardViewer data={data} ctx={ctx} />,
};
