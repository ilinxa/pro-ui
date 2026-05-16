"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
// F-S1 lock — RELATIVE imports for cross-procomp types/files. Same-category
// alias imports get the slug name substituted by shadcn's rewriter; relative
// paths bypass that and translate verbatim.
import { PortsAt } from "../../flow-canvas-01/parts/ports-at";
import type { NodeData } from "../../flow-canvas-01/types";
import type { RichCardJsonNode } from "../../rich-card/types";
import { deriveTitle } from "../lib/derive-title";

/**
 * Visual block for one nested rich-card subcard inside a `<RichCardViewer>`.
 * Renders the subcard's title + its own port handles (recursively via xyflow's
 * `<Handle>` model — flow-canvas-01's port-walker traverses `Object.entries`
 * and finds these without any new plumbing per F-05 in the plan).
 *
 * MUST stay `position: relative` — xyflow's `<Handle>` is `position: absolute`
 * and anchors to the nearest positioned ancestor. Removing `relative` here
 * will silently break subcard handle visual positioning (G1 lock).
 */
function SubcardBlockImpl({
  cardKey,
  card,
  onEdit,
}: {
  cardKey: string;
  card: RichCardJsonNode;
  onEdit: (rcid: string) => void;
}) {
  const rcid = card.__rcid;
  const title = deriveTitle(card) ?? cardKey;
  // Subcards stay typed as RichCardJsonNode (they're inner tree nodes, not
  // flow-canvas nodes). NodeData cast lets us read the optional ports[] —
  // structurally sound because NodeData.ports?: Port[] flows through
  // RichCardJsonNode's `[key: string]: unknown` index signature.
  const ports = (card as NodeData).ports;
  const canFocusThisSubcard = rcid !== undefined;

  // F-03 lock: only fire onEdit(rcid) when __rcid is present.
  // Missing __rcid → click bubbles to the title strip → root edit.
  const handleClick = (e: React.MouseEvent) => {
    if (canFocusThisSubcard) {
      e.stopPropagation(); // F-V1: keep subcard click from bubbling to title strip
      onEdit(rcid!);
    }
    // else: fall through; parent title-strip handler opens dialog at root.
  };

  // F-03 dev-mode warning. Cheap; helps the consumer notice missing __rcid.
  if (!canFocusThisSubcard && process.env.NODE_ENV === "development") {
    console.warn(
      `[rich-card-in-flow] Subcard "${cardKey}" has no __rcid — click-to-focus disabled. ` +
        "Pass the canvas data through <RichCard> once or use rich-card's ID-attach helper.",
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      // Consumer can style "subcard missing __rcid" via [data-subcard-focusable=false]
      data-subcard-focusable={canFocusThisSubcard ? undefined : "false"}
      // F-05 + G1 lock — MUST stay position: relative; do not remove.
      className={cn(
        "relative w-full rounded-sm border border-border/60 bg-muted/30 p-2 text-left",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        canFocusThisSubcard && "cursor-pointer hover:border-border hover:bg-muted/50",
        !canFocusThisSubcard && "cursor-default",
      )}
      aria-haspopup={canFocusThisSubcard ? "dialog" : undefined}
      aria-label={`Subcard: ${title}`}
    >
      <div className="text-xs font-medium text-muted-foreground">{title}</div>
      {/* Subcard's own ports — port-walker finds them via Object.entries recursion. */}
      <PortsAt ports={ports} position="left" />
      <PortsAt ports={ports} position="right" />
      <PortsAt ports={ports} position="top" />
      <PortsAt ports={ports} position="bottom" />
    </button>
  );
}

export const SubcardBlock = memo(SubcardBlockImpl);
