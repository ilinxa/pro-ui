"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
// F-S1 lock — RELATIVE imports for cross-procomp types/files. Same-category
// alias imports get the slug name substituted by shadcn's rewriter; relative
// paths bypass that and translate verbatim.
import type { NodeRenderer, RenderContext } from "../../flow-canvas/types";
import { PortsAt } from "../../flow-canvas/parts/ports-at";
import type { CardTreeCanvasNode } from "../types";
import { enumerateSubcards } from "../lib/enumerate-subcards";
import { deriveTitle } from "../lib/derive-title";
import { deriveFlatFields } from "../lib/derive-flat-fields";
import { FlatFieldStrip } from "./flat-field-strip";
import { SubcardBlock } from "./subcard-block";

// Locked constants (Q6 — v0.2 may open these as CardTreeViewerOptions).
const MAX_FLAT_FIELDS = 3;
const MAX_NESTED_OUTLINES = 4;

/**
 * Read-only renderer that paints a card-tree tree as a flow-canvas node.
 * Title strip + first 3 flat fields + nested-card outlines with their own
 * ports + root-level port handles. Clicks fire `ctx.onEditRequest(subPath?)`;
 * consumer routes to a dialog mounting `<CardTree editable>`.
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
 *   NodeShell → CardTreeViewer outer → SubcardBlock — each MUST be position:
 *   relative or xyflow's `<Handle>` (position: absolute) anchors to a wrong
 *   positioned ancestor. The "relative" className below is load-bearing.
 */
function CardTreeViewerImpl({
  data,
  ctx,
}: {
  data: CardTreeCanvasNode;
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
      aria-label={`Card tree: ${title ?? "Untitled"}`}
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
        <span className="truncate">{title ?? "Untitled card-tree"}</span>
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

const CardTreeViewer = memo(CardTreeViewerImpl);

/**
 * `NodeRenderer<CardTreeCanvasNode>` — drop-in for flow-canvas's
 * `renderers` prop. Consumer wiring:
 *
 *   <FlowCanvas
 *     renderers={[cardTreeViewerRenderer]}
 *     onEditRequest={(nodeId, subPath) => openDialog(nodeId, subPath)}
 *     data={canvasData}
 *     onChange={setCanvasData}
 *   />
 *
 * F-V6 lock — `NodeRenderer<TData extends NodeData>` requires `TData` to
 * extend `NodeData` (which mandates `__type: string`). CardTreeJsonNode alone
 * doesn't satisfy that constraint; `CardTreeCanvasNode = NodeData &
 * CardTreeJsonNode` is the type that flows into the registry. Precedent:
 * `customJsonRenderer`'s `NodeData & { _label?: string }` in flow-canvas.
 */
export const cardTreeViewerRenderer: NodeRenderer<CardTreeCanvasNode> = {
  type: "card-tree",
  label: "Card tree",
  render: (data, ctx) => <CardTreeViewer data={data} ctx={ctx} />,
};
