/**
 * Pure helpers for bulk operations: deep-clone with fresh ids, deepest-first
 * sort for safe bulk-removal, parent-key generation for moved cards.
 */

import type { FlatFieldValue } from "../types";
import type { RichCardTree } from "./parse";

/**
 * Returns a depth map (id → traversal-order index) so callers can sort
 * card-ids deepest-first before bulk-removal.
 */
export function buildDepthMap(tree: RichCardTree): Map<string, number> {
  const out = new Map<string, number>();
  walk(tree, 0, out);
  return out;
}

function walk(node: RichCardTree, depth: number, out: Map<string, number>): void {
  out.set(node.id, depth);
  for (const c of node.children) walk(c, depth + 1, out);
}

/**
 * Returns true if any of `ids` is an ancestor of any other id in the same set.
 * Used to deduplicate selection: when an ancestor is selected, descendants
 * shouldn't be acted on independently.
 */
export function deduplicateSelection(
  tree: RichCardTree,
  ids: readonly string[],
): string[] {
  const set = new Set(ids);
  const out: string[] = [];
  for (const id of ids) {
    let hasAncestorSelected = false;
    const ancestorIds = collectAncestors(tree, id);
    for (const a of ancestorIds) {
      if (set.has(a)) {
        hasAncestorSelected = true;
        break;
      }
    }
    if (!hasAncestorSelected) out.push(id);
  }
  return out;
}

function collectAncestors(tree: RichCardTree, id: string): string[] {
  const out: string[] = [];
  walkAncestors(tree, id, [], out);
  return out;
}

function walkAncestors(
  node: RichCardTree,
  targetId: string,
  path: string[],
  out: string[],
): boolean {
  if (node.id === targetId) {
    out.push(...path);
    return true;
  }
  for (const c of node.children) {
    if (walkAncestors(c, targetId, [...path, node.id], out)) return true;
  }
  return false;
}

/* ───────── selection stats (for bulk-toolbar display) ───────── */

export type SelectionStats = {
  count: number;
  levelMin: number;
  levelMax: number;
  totalFields: number;
  totalPredefined: number;
  totalChildren: number;
  lockedCount: number;
};

export function computeSelectionStats(
  tree: RichCardTree,
  ids: ReadonlySet<string>,
): SelectionStats {
  const stats: SelectionStats = {
    count: 0,
    levelMin: Infinity,
    levelMax: 0,
    totalFields: 0,
    totalPredefined: 0,
    totalChildren: 0,
    lockedCount: 0,
  };
  walkStats(tree, ids, stats);
  if (stats.levelMin === Infinity) stats.levelMin = 0;
  return stats;
}

function walkStats(
  node: RichCardTree,
  ids: ReadonlySet<string>,
  stats: SelectionStats,
): void {
  if (ids.has(node.id)) {
    stats.count += 1;
    stats.levelMin = Math.min(stats.levelMin, node.level);
    stats.levelMax = Math.max(stats.levelMax, node.level);
    stats.totalFields += node.fields.length;
    stats.totalPredefined += node.predefined.length;
    stats.totalChildren += node.children.length;
    if (node.meta?.locked === true) stats.lockedCount += 1;
  }
  for (const c of node.children) walkStats(c, ids, stats);
}

/* ───────── bulk-edit field application ───────── */

export type BulkEditFieldArgs = {
  cardIds: readonly string[];
  key: string;
  value: FlatFieldValue;
  /**
   * 'set'   — set the field on every card (creates if missing)
   * 'unset' — remove the field from every card if present
   */
  mode: "set" | "unset";
};
