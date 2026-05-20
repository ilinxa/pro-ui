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
  onBulkToggleActive?: (args: {
    ids: ReadonlyArray<string>;
    nextActive: boolean;
  }) => void;
  onBulkRemove?: (args: { ids: ReadonlyArray<string> }) => void;
  onBulkEdit?: (args: { ids: ReadonlyArray<string> }) => void;
  className?: string;
}

/**
 * Default toolbar. Reads state from context; the host passes the bulk
 * callbacks + statusOptions as props because those are wired from the
 * top-level TodoTreeProps (not part of state).
 *
 * Layout per plan §7.1:
 *   [Search input (grows)] [Active toggle] [Sort dropdown] [Filter dropdown]
 *   [spacer] [Bulk action bar — when selectedIds.size > 0]
 */
export function TodoTreeToolbar({
  statusOptions,
  onBulkToggleActive,
  onBulkRemove,
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
          onToggleActive={
            onBulkToggleActive
              ? (next) =>
                  onBulkToggleActive({
                    ids: selectedIdsArray(),
                    nextActive: next,
                  })
              : undefined
          }
          onRemove={
            onBulkRemove
              ? () => onBulkRemove({ ids: selectedIdsArray() })
              : undefined
          }
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
