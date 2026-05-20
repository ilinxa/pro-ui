import type { TodoItem } from "../../todo-rich-card/types";
import type { TodoTreeVisibleRow } from "../types";

/**
 * Renderer-ready row variant. The optional `dimmed` flag is set by the
 * filter-fade path; the default renderer applies opacity-30 when true.
 */
export interface FlattenedRow extends TodoTreeVisibleRow {
  dimmed?: boolean;
}

export interface FlattenOptions {
  collapsedIds: ReadonlySet<string>;
  /** "fade" emits all rows with dimmed flag; "hide" omits non-matching + non-ancestor rows. */
  mode: "fade" | "hide";
  /** When mode === "hide" OR mode === "fade", drives the dim / hide decision. */
  matchMap?: ReadonlyMap<string, boolean>;
  /** When mode === "hide", ancestors-of-match still render. */
  ancestorOfMatch?: ReadonlySet<string>;
}

/**
 * DFS flatten respecting `collapsedIds`. Emits one row per visible item.
 *
 * When a row is collapsed, its descendants are skipped entirely (no rows
 * emitted for them) regardless of mode.
 *
 * Mode "fade":
 *   - every non-collapsed row emits
 *   - matchMap === false ⇒ row.dimmed = true
 *
 * Mode "hide":
 *   - rows where matchMap === true emit normally
 *   - rows in ancestorOfMatch emit normally (so context survives)
 *   - everything else is skipped
 *
 * When no matchMap is supplied (filter inactive), every non-collapsed row
 * emits without the dimmed flag in either mode.
 */
export function flattenTree(
  items: ReadonlyArray<TodoItem>,
  options: FlattenOptions,
): FlattenedRow[] {
  const out: FlattenedRow[] = [];
  walk(items, 0, null, options, out);
  return out;
}

function walk(
  items: ReadonlyArray<TodoItem>,
  level: number,
  parentId: string | null,
  options: FlattenOptions,
  out: FlattenedRow[],
): void {
  const { collapsedIds, mode, matchMap, ancestorOfMatch } = options;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const matches = matchMap ? matchMap.get(item.id) === true : true;
    const isAncestor = ancestorOfMatch ? ancestorOfMatch.has(item.id) : false;

    let emit = true;
    let dimmed = false;

    if (matchMap) {
      if (mode === "hide") {
        emit = matches || isAncestor;
      } else {
        // mode === "fade"
        emit = true;
        dimmed = !matches;
      }
    }

    if (emit) {
      out.push(
        dimmed
          ? { item, level, parentId, index: i, dimmed: true }
          : { item, level, parentId, index: i },
      );
    }

    const hasChildren = item.children && item.children.length > 0;
    const collapsed = collapsedIds.has(item.id);
    if (hasChildren && !collapsed) {
      walk(item.children!, level + 1, item.id, options, out);
    }
  }
}
