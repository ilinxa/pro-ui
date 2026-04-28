/**
 * Pure helpers for drag-drop math.
 * Auto-scroll utilities also live here.
 */

import { findAncestorIds, type RichCardTree } from "./reducer";

export type DropPosition = {
  parentId: string;
  order: number;
  /** Whether the drop is "into" the card (last child) or "between" siblings (specific order). */
  kind: "into" | "between";
};

/**
 * Determine if dragging `sourceId` onto `targetId` would create a cycle.
 * (Target is the source itself OR a descendant of source.)
 */
export function wouldCreateCycle(
  tree: RichCardTree,
  sourceId: string,
  targetId: string,
): boolean {
  if (sourceId === targetId) return true;
  const ancestorsOfTarget = findAncestorIds(tree, targetId);
  // If source is an ancestor of target, dropping target into source's subtree (or onto source) is fine;
  // but dropping source INTO target's subtree (where target is source's descendant) creates a cycle.
  // So we need to check: is target a descendant of source?
  return ancestorsOfTarget.includes(sourceId);
}

/**
 * Resolve drop intent based on pointer position within a target card's bounding rectangle.
 * Same-level reorder when in upper/lower 25%; cross-level reparent when in middle 50%.
 */
export function resolveDropIntent(args: {
  pointerY: number;
  rectTop: number;
  rectHeight: number;
  upperZoneRatio?: number;
  lowerZoneRatio?: number;
}): "before" | "after" | "into" {
  const upper = args.upperZoneRatio ?? 0.25;
  const lower = args.lowerZoneRatio ?? 0.75;
  const relative = (args.pointerY - args.rectTop) / args.rectHeight;
  if (relative < upper) return "before";
  if (relative > lower) return "after";
  return "into";
}

/**
 * Returns the auto-scroll velocity for a pointer near the edges of a scrollable container.
 * Returns 0 when not in the auto-scroll zone.
 *
 * Velocity scales linearly within the trigger zone (top/bottom 60px by default).
 */
export function autoScrollVelocity(args: {
  pointerY: number;
  containerTop: number;
  containerBottom: number;
  triggerZone?: number;
  maxVelocity?: number;
}): number {
  const zone = args.triggerZone ?? 60;
  const maxV = args.maxVelocity ?? 12;

  const distFromTop = args.pointerY - args.containerTop;
  const distFromBottom = args.containerBottom - args.pointerY;

  if (distFromTop < zone && distFromTop >= 0) {
    // Negative velocity = scroll up
    return -maxV * (1 - distFromTop / zone);
  }
  if (distFromBottom < zone && distFromBottom >= 0) {
    return maxV * (1 - distFromBottom / zone);
  }
  return 0;
}

/**
 * Animation-frame-driven scroll loop. Call to start; call the returned cleanup to stop.
 */
export function startAutoScroll(
  el: HTMLElement,
  getVelocity: () => number,
): () => void {
  let raf = 0;
  const tick = () => {
    const v = getVelocity();
    if (v !== 0) {
      el.scrollBy({ top: v });
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}
