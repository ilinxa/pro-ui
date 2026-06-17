"use client";

import { useEffect, useRef } from "react";
import type { TodoPermissions } from "../../todo-rich-card/types";
import type { TodoTreePermissionDeniedEvent } from "../types";
import {
  useTodoTreeRenderContext,
  useTodoTreeStateContext,
} from "../hooks/use-todo-tree-context";
import {
  useTreeVirtual,
  type TodoTreeVirtualizeMode,
} from "../hooks/use-tree-virtual";
import { useTreeKeyboard } from "../hooks/use-tree-keyboard";
import { TodoTreeRow } from "./todo-tree-row";
import { TodoTreeEmptyState } from "./todo-tree-empty-state";
import { isFilterActive } from "../lib/filter-items";
import { evalPermission } from "../lib/permissions";
import { cn } from "@/lib/utils";

export interface TodoTreeListProps {
  /** Default "auto" — virtualize when total rows ≥ threshold (R9 lock). */
  virtualize?: TodoTreeVirtualizeMode;
  /** Default 200 (plan §10.2). */
  virtualizeThreshold?: number;
  /** Default 52 (Q-P2 fixed row height). */
  rowHeight?: number;
  /**
   * When true, virtualization auto-suspends (R7 mitigation). Wired by C6's
   * DnD hooks so virtualizer + drag don't fight over scroll position.
   */
  suspended?: boolean;
  /** Forwarded into the keyboard hook so Space + Delete honor permissions. */
  permissions?: TodoPermissions;
  /** Forwarded into the keyboard hook for permission-denied events. */
  onPermissionDenied?: (args: TodoTreePermissionDeniedEvent) => void;
  /** When true, keyboard Space + Delete fire `denied-by-readOnly`. */
  readOnly?: boolean;
  className?: string;
}

/**
 * List view over `visibleItems`. Optionally virtualizes via
 * `@tanstack/react-virtual` when the total tree exceeds the threshold OR
 * when the consumer forces "always". Static list paint otherwise so DnD
 * indicators + slot rows with variable heights work without virtualizer
 * measurement overrides.
 *
 * Owns the tree's keydown handler + focus management + empty-state slot.
 * One row at a time has tabIndex=0 (the focused row or the first visible
 * when nothing is focused); a useEffect programmatically focuses the
 * matching DOM element when state.focusedItemId changes.
 */
export function TodoTreeList({
  virtualize = "auto",
  virtualizeThreshold = 200,
  rowHeight = 52,
  suspended = false,
  permissions,
  onPermissionDenied,
  readOnly,
  className,
}: TodoTreeListProps) {
  const state = useTodoTreeStateContext();
  const { renderEmptyState } = useTodoTreeRenderContext();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { onKeyDown } = useTreeKeyboard({
    state,
    permissions,
    onPermissionDenied,
    readOnly,
  });

  const { active, virtualizer } = useTreeVirtual({
    rows: state.visibleItems,
    scrollRef,
    mode: virtualize,
    threshold: virtualizeThreshold,
    rowHeight,
    suspended,
  });

  const rows = state.visibleItems;

  // Resolve the tabbable row id: the focused one if it's still visible, else
  // the first visible row. Lets Tab into the tree always land on something
  // meaningful and keeps the WAI-ARIA "exactly one tabindex=0 treeitem" rule.
  const tabbableId =
    state.focusedItemId &&
    rows.some((r) => r.item.id === state.focusedItemId)
      ? state.focusedItemId
      : (rows[0]?.item.id ?? null);

  // Sync DOM focus to focusedItemId. Only fires when the id changes — clicks
  // that don't change focus don't re-trigger focus() (which would clobber a
  // text input the consumer might've focused from a slot row).
  useEffect(() => {
    if (!state.focusedItemId || !scrollRef.current) return;
    const el = scrollRef.current.querySelector<HTMLElement>(
      `[data-treeitem-id="${CSS.escape(state.focusedItemId)}"]`,
    );
    if (el && document.activeElement !== el) {
      el.focus({ preventScroll: false });
    }
  }, [state.focusedItemId]);

  const hasFilter = isFilterActive(state.filter, state.query);

  if (rows.length === 0) {
    const emptyArgs = { hasFilter };
    const emptyContent = renderEmptyState
      ? renderEmptyState(emptyArgs)
      : <TodoTreeEmptyState hasFilter={hasFilter} />;
    return (
      <div
        ref={scrollRef}
        className={cn("h-full overflow-auto", className)}
        role="tree"
        aria-label="Todo tree"
        aria-multiselectable="true"
        onKeyDown={onKeyDown}
      >
        {emptyContent}
      </div>
    );
  }

  if (active) {
    const virtualItems = virtualizer.getVirtualItems();
    return (
      <div
        ref={scrollRef}
        className={cn("h-full overflow-auto", className)}
        role="tree"
        aria-label="Todo tree"
        aria-multiselectable="true"
        onKeyDown={onKeyDown}
      >
        <div
          style={{
            height: virtualizer.getTotalSize(),
            position: "relative",
            width: "100%",
          }}
        >
          {virtualItems.map((vRow) => {
            const row = rows[vRow.index];
            return (
              <div
                key={row.item.id}
                data-treeitem-id={row.item.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${vRow.start}px)`,
                  height: vRow.size,
                }}
                role="treeitem"
                tabIndex={tabbableId === row.item.id ? 0 : -1}
                aria-level={row.level + 1}
                aria-expanded={
                  row.item.children && row.item.children.length > 0
                    ? !state.collapsedIds.has(row.item.id)
                    : undefined
                }
                aria-selected={state.selectedIds.has(row.item.id) || undefined}
                onFocus={() => {
                  if (state.focusedItemId !== row.item.id) {
                    state.focusItem(row.item.id);
                  }
                }}
              >
                <TodoTreeRow
                  item={row.item}
                  level={row.level}
                  isSelected={state.selectedIds.has(row.item.id)}
                  isCollapsed={state.collapsedIds.has(row.item.id)}
                  dimmed={row.dimmed}
                  canDrag={!readOnly && evalPermission(permissions, "drag", row.item, row.level)}
                  canToggleActive={
                    !readOnly &&
                    evalPermission(permissions, "toggleActive", row.item, row.level)
                  }
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Static list paint (small trees + dragging).
  return (
    <div
      ref={scrollRef}
      className={cn("h-full overflow-auto", className)}
      role="tree"
      aria-label="Todo tree"
      aria-multiselectable="true"
      onKeyDown={onKeyDown}
    >
      <div className="flex flex-col">
        {rows.map((row) => (
          <div
            key={row.item.id}
            data-treeitem-id={row.item.id}
            role="treeitem"
            tabIndex={tabbableId === row.item.id ? 0 : -1}
            aria-level={row.level + 1}
            aria-expanded={
              row.item.children && row.item.children.length > 0
                ? !state.collapsedIds.has(row.item.id)
                : undefined
            }
            aria-selected={state.selectedIds.has(row.item.id) || undefined}
            onFocus={() => {
              if (state.focusedItemId !== row.item.id) {
                state.focusItem(row.item.id);
              }
            }}
          >
            <TodoTreeRow
              item={row.item}
              level={row.level}
              isSelected={state.selectedIds.has(row.item.id)}
              isCollapsed={state.collapsedIds.has(row.item.id)}
              dimmed={row.dimmed}
              canDrag={!readOnly && evalPermission(permissions, "drag", row.item, row.level)}
              canToggleActive={
                !readOnly &&
                evalPermission(permissions, "toggleActive", row.item, row.level)
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
