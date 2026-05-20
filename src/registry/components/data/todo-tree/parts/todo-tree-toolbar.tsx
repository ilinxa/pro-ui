"use client";

import { useTodoTreeStateContext } from "../hooks/use-todo-tree-context";
import { TodoTreeSearchInput } from "./todo-tree-search-input";
import { TodoTreeSortDropdown } from "./todo-tree-sort-dropdown";
import { TodoTreeFilterDropdown } from "./todo-tree-filter-dropdown";
import { TodoTreeFilterActiveToggle } from "./todo-tree-filter-active-toggle";
import { TodoTreeBulkActionBar } from "./todo-tree-bulk-action-bar";
import type { TodoStatusOption } from "../../todo-rich-card/types";
import { cn } from "@/lib/utils";

export interface TodoTreeToolbarProps {
  statusOptions?: ReadonlyArray<TodoStatusOption>;
  /**
   * Bulk-edit has no matching handle method (Q4 lock — v0.1 does not bake
   * an edit dialog). When provided, the Edit button renders and fires this
   * with the current selection; consumer wires their own dialog. When
   * omitted, the Edit button is hidden.
   */
  onBulkEdit?: (args: { ids: ReadonlyArray<string> }) => void;
  className?: string;
}

/**
 * Default toolbar. Reads state from context; the host passes statusOptions +
 * onBulkEdit (the only bulk action with no handle method — Q4 lock means
 * consumers wire their own edit dialog).
 *
 * Activate / Deactivate / Delete go through the handle methods
 * (state.toggleActiveBulk, state.removeItems) so they actually mutate
 * the tree. The matching event (onBulkToggleActive / onBulkRemove) fires
 * automatically via the handle's internal event dispatcher.
 *
 * Layout per plan §7.1:
 *   [Search input (grows)] [Active toggle] [Sort dropdown] [Filter dropdown]
 *   [Bulk action bar — when selectedIds.size > 0]
 */
export function TodoTreeToolbar({
  statusOptions,
  onBulkEdit,
  className,
}: TodoTreeToolbarProps) {
  const state = useTodoTreeStateContext();

  const selectedCount = state.selectedIds.size;
  const selectedIdsArray = (): string[] => Array.from(state.selectedIds);

  return (
    <div
      role="toolbar"
      aria-label="Tree controls"
      className={cn(
        "flex flex-wrap items-center gap-2 border-b border-border bg-background/50 px-2 py-1.5",
        className,
      )}
    >
      <TodoTreeSearchInput value={state.query} onChange={state.setQuery} />
      <TodoTreeFilterActiveToggle
        value={state.filter.active}
        onChange={(active) =>
          state.setFilter({ ...state.filter, active })
        }
      />
      <TodoTreeSortDropdown value={state.sort} onChange={state.setSort} />
      <TodoTreeFilterDropdown
        value={state.filter}
        onChange={state.setFilter}
        items={state.items}
        statusOptions={statusOptions}
      />
      {selectedCount > 0 && (
        <TodoTreeBulkActionBar
          count={selectedCount}
          onToggleActive={(next) =>
            state.toggleActiveBulk(selectedIdsArray(), next)
          }
          onRemove={() => state.removeItems(selectedIdsArray())}
          onEdit={
            onBulkEdit
              ? () => onBulkEdit({ ids: selectedIdsArray() })
              : undefined
          }
          onClear={state.clearSelection}
        />
      )}
    </div>
  );
}
