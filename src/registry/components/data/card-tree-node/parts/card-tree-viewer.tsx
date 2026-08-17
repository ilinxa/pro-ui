"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
// F-S1 lock — RELATIVE imports for cross-procomp types/files. Same-category
// alias imports get the slug name substituted by shadcn's rewriter; relative
// paths bypass that and translate verbatim.
import type { NodeRenderer, RenderContext } from "../../flow-canvas/types";
import type { CustomPredefinedKey } from "../../card-tree/types";
import { PortsAt } from "../../flow-canvas/parts/ports-at";
import type { CardTreeCanvasNode, CardTreeViewerOptions } from "../types";
import { enumerateSubcards } from "../lib/enumerate-subcards";
import { deriveTitle } from "../lib/derive-title";
import { deriveFlatFields } from "../lib/derive-flat-fields";
import { countBlocks, deriveBlocks } from "../lib/derive-blocks";
import type { NodeKeyOptions } from "../lib/classify-node-key";
import { FlatFieldStrip } from "./flat-field-strip";
import { BlockStrip } from "./block-strip";
import { SubcardBlock } from "./subcard-block";

// Defaults for the caps Q6 kept hardcoded through v0.3. v0.4.0 opens them via
// CardTreeViewerOptions; these remain the zero-config values.
const MAX_FLAT_FIELDS = 3;
const MAX_BLOCKS = 3;
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
 *     <BlockStrip />                  ← v0.4.0 — predefined + custom blocks
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
  options,
}: {
  data: CardTreeCanvasNode;
  ctx: RenderContext;
  options: ResolvedViewerOptions;
}) {
  const title = deriveTitle(data);
  const { keyOptions, maxFlatFields, maxBlocks, maxSubcards } = options;
  const flatFields = deriveFlatFields(data, maxFlatFields, keyOptions);
  const blocks = deriveBlocks(data, maxBlocks, keyOptions);
  const totalBlocks = countBlocks(data, keyOptions);
  const subcards = enumerateSubcards(data, keyOptions).slice(0, maxSubcards);
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

      {/* Predefined + custom blocks (v0.4.0 — FU-2) */}
      <BlockStrip
        blocks={blocks}
        totalBlocks={totalBlocks}
        cardId={data.__rcid ?? ""}
        registrations={options.customPredefinedKeys}
        renderCustomBlocks={options.renderCustomBlocks}
      />

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

/** Options after defaulting — one stable object per renderer, see below. */
type ResolvedViewerOptions = {
  keyOptions: NodeKeyOptions;
  customPredefinedKeys?: readonly CustomPredefinedKey[];
  renderCustomBlocks: boolean;
  maxFlatFields: number;
  maxBlocks: number;
  maxSubcards: number;
};

/**
 * Build a `NodeRenderer<CardTreeCanvasNode>` for flow-canvas's `renderers`
 * prop (v0.4.0). Call it **once**, outside render — the resolved options
 * object is what keeps `memo(CardTreeViewerImpl)` effective, and the custom-key
 * name list is derived here rather than per node.
 *
 *   // module scope, or useMemo with a stable dep list
 *   const renderer = createCardTreeViewerRenderer({
 *     customPredefinedKeys: MY_KEYS,
 *     renderCustomBlocks: true,
 *   });
 *
 * Building it inline in JSX re-allocates every render and defeats the memo —
 * the same hazard card-tree v0.6.0 hit with an inline `customPredefinedKeys`
 * literal, which cascaded into an unbounded render loop.
 *
 * F-V6 lock — `NodeRenderer<TData extends NodeData>` requires `TData` to
 * extend `NodeData` (which mandates `__type: string`). CardTreeJsonNode alone
 * doesn't satisfy that constraint; `CardTreeCanvasNode = NodeData &
 * CardTreeJsonNode` is the type that flows into the registry. Precedent:
 * `customJsonRenderer`'s `NodeData & { _label?: string }` in flow-canvas.
 */
export function createCardTreeViewerRenderer(
  options: CardTreeViewerOptions = {},
): NodeRenderer<CardTreeCanvasNode> {
  const resolved: ResolvedViewerOptions = {
    keyOptions: {
      customKeyNames: (options.customPredefinedKeys ?? []).map((k) => k.key),
      disabledPredefinedKeys: options.disabledPredefinedKeys ?? [],
    },
    customPredefinedKeys: options.customPredefinedKeys,
    renderCustomBlocks: options.renderCustomBlocks ?? false,
    maxFlatFields: options.maxFlatFields ?? MAX_FLAT_FIELDS,
    maxBlocks: options.maxBlocks ?? MAX_BLOCKS,
    maxSubcards: options.maxSubcards ?? MAX_NESTED_OUTLINES,
  };

  return {
    type: "card-tree",
    label: "Card tree",
    render: (data, ctx) => <CardTreeViewer data={data} ctx={ctx} options={resolved} />,
  };
}

/**
 * Zero-config renderer — the shipped default since v0.1. Identical to
 * `createCardTreeViewerRenderer()`; consumers who register no custom keys can
 * keep using it unchanged.
 *
 *   <FlowCanvas
 *     renderers={[cardTreeViewerRenderer]}
 *     onEditRequest={(nodeId, subPath) => openDialog(nodeId, subPath)}
 *     data={canvasData}
 *     onChange={setCanvasData}
 *   />
 */
export const cardTreeViewerRenderer: NodeRenderer<CardTreeCanvasNode> =
  createCardTreeViewerRenderer();
