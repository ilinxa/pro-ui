"use client";

import { useRef } from "react";
import { useTodoTreeStateContext } from "../hooks/use-todo-tree-context";
import {
  useTreeVirtual,
  type TodoTreeVirtualizeMode,
} from "../hooks/use-tree-virtual";
import { TodoTreeRow } from "./todo-tree-row";
import { cn } from "@/lib/utils";

export interface TodoTreeListProps {
  /** Default "auto" — virtualize when total rows ≥ threshold (R9 lock). */
  virtualize?: TodoTreeVirtualizeMode;
  /** Default 200 (plan §10.2). */
  virtualizeThreshold?: number;
  /** Default 52 (Q-P2 fixed row height). */
  rowHeight?: number;
  /**
   * When true, virtualization auto-suspends. Wired by C6's DnD hooks; for
   * now the prop is optional so the list renders correctly pre-DnD.
   */
  suspended?: boolean;
  /** Override the empty-state slot; defaults to no visual when empty. */
  emptyState?: React.ReactNode;
  className?: string;
}

/**
 * List view over `visibleItems`. Optionally virtualizes via
 * `@tanstack/react-virtual` when the total tree exceeds the threshold OR
 * when the consumer forces "always". Static list paint otherwise so DnD
 * indicators + slot rows with variable heights work without virtualizer
 * measurement overrides.
 *
 * Row click + DnD bindings land in C6's `<TodoTreeRow>` wrapper; for C5 the
 * list renders `<TodoTreeRowContent>` directly with the basic interactive
 * wires (chevron toggle + checkbox active toggle).
 */
export function TodoTreeList({
  virtualize = "auto",
  virtualizeThreshold = 200,
  rowHeight = 52,
  suspended = false,
  emptyState,
  className,
}: TodoTreeListProps) {
  const state = useTodoTreeStateContext();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const { active, virtualizer } = useTreeVirtual({
    rows: state.visibleItems,
    scrollRef,
    mode: virtualize,
    threshold: virtualizeThreshold,
    rowHeight,
    suspended,
  });

  const rows = state.visibleItems;

  if (rows.length === 0) {
    return (
      <div
        ref={scrollRef}
        className={cn("h-full overflow-auto", className)}
        role="tree"
      >
        {emptyState ?? null}
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
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${vRow.start}px)`,
                  height: vRow.size,
                }}
                role="treeitem"
                aria-level={row.level + 1}
                aria-expanded={
                  row.item.children && row.item.children.length > 0
                    ? !state.collapsedIds.has(row.item.id)
                    : undefined
                }
                aria-selected={state.selectedIds.has(row.item.id) || undefined}
              >
                <TodoTreeRow
                  item={row.item}
                  level={row.level}
                  isSelected={state.selectedIds.has(row.item.id)}
                  isCollapsed={state.collapsedIds.has(row.item.id)}
                  dimmed={row.dimmed}
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
    >
      <div className="flex flex-col">
        {rows.map((row) => (
          <div
            key={row.item.id}
            role="treeitem"
            aria-level={row.level + 1}
            aria-expanded={
              row.item.children && row.item.children.length > 0
                ? !state.collapsedIds.has(row.item.id)
                : undefined
            }
            aria-selected={state.selectedIds.has(row.item.id) || undefined}
          >
            <TodoTreeRow
              item={row.item}
              level={row.level}
              isSelected={state.selectedIds.has(row.item.id)}
              isCollapsed={state.collapsedIds.has(row.item.id)}
              dimmed={row.dimmed}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
