"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTodoTreeStateContext } from "../hooks/use-todo-tree-context";
import { TodoTreeSearchInput } from "./todo-tree-search-input";
import { TodoTreeSortDropdown } from "./todo-tree-sort-dropdown";
import { TodoTreeFilterDropdown } from "./todo-tree-filter-dropdown";
import { TodoTreeFilterActiveToggle } from "./todo-tree-filter-active-toggle";
import { TodoTreeBulkActionBar } from "./todo-tree-bulk-action-bar";
import type {
  TodoItem,
  TodoPermissions,
  TodoStatusOption,
} from "../../todo-rich-card/types";
import { evalPermission } from "../lib/permissions";
import { cn } from "@/lib/utils";

// Synthetic level-0 item used only to evaluate the root-create gate against
// `permissions.default` / `byLevel[0]` (there's no real root node to attach a
// rule to). Its empty id never matches a `byItem` rule.
const ROOT_CREATE_SENTINEL: TodoItem = {
  id: "",
  name: "",
  status: "",
  active: true,
  setAt: "",
};

export interface TodoTreeToolbarProps {
  statusOptions?: ReadonlyArray<TodoStatusOption>;
  /**
   * Bulk-edit has no matching handle method (Q4 lock — v0.1 does not bake
   * an edit dialog). When provided, the Edit button renders and fires this
   * with the current selection; consumer wires their own dialog. When
   * omitted, the Edit button is hidden.
   */
  onBulkEdit?: (args: { ids: ReadonlyArray<string> }) => void;
  /**
   * Optional factory for the "+ New" button. Falls back to a built-in
   * default item (`name: "Untitled"`, first statusOption, `active: true`,
   * `setAt: now`) when omitted but `statusOptions` is non-empty. Button
   * hides entirely if neither path can produce a valid TodoItem or if
   * `readOnly` is set.
   */
  createItem?: () => TodoItem;
  /**
   * Intercepts the "+ New" click. When provided, the toolbar calls this
   * with the factory's output instead of committing to the tree itself —
   * the consumer (e.g., `<TodoTreeWithEditor>`) takes over to open an
   * editor on a pending item and commit only on user submit.
   */
  onCreateRequest?: (item: TodoItem) => void;
  /** Suppresses the "+ New" button when true. */
  readOnly?: boolean;
  /**
   * Gates the "+ New" button AND the bulk action bar's Delete button.
   * Without an editing affordance there's nothing meaningful to do with
   * a freshly-added "Untitled" row or with a row the user can't otherwise
   * interact with — so we hide both.
   */
  editable?: boolean;
  /**
   * Permission matrix. The "+ New" (root-create) button also honors
   * `default` / `byLevel[0]` `addChildren` so root creation can be denied via
   * the matrix (there's no root node to attach a `byItem` rule to).
   */
  permissions?: TodoPermissions;
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
  createItem,
  onCreateRequest,
  readOnly,
  editable = false,
  permissions,
  className,
}: TodoTreeToolbarProps) {
  const state = useTodoTreeStateContext();

  const selectedCount = state.selectedIds.size;
  const selectedIdsArray = (): string[] => Array.from(state.selectedIds);

  // Resolve the new-item factory. Explicit prop wins; otherwise build a
  // minimal default that satisfies TodoItem's required fields — needs
  // statusOptions[0] for `status`. When neither path can produce an item
  // we hide the button rather than insert invalid data.
  const factory: (() => TodoItem) | null =
    createItem ??
    (statusOptions && statusOptions.length > 0
      ? () => ({
          id:
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `todo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: "Untitled",
          status: statusOptions[0].value,
          active: true,
          setAt: new Date().toISOString(),
        })
      : null);

  // Root-create gate: honor the matrix's level-0 `addChildren` rule (mapped via
  // the dropIntoChildren action) so consumers can deny root creation.
  const canCreateRoot = evalPermission(
    permissions,
    "dropIntoChildren",
    ROOT_CREATE_SENTINEL,
    0,
  );
  const canAdd = editable && !readOnly && factory !== null && canCreateRoot;
  const canBulkRemove = editable && !readOnly;

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
      {canAdd && (
        <Button
          size="sm"
          variant="default"
          className="ml-auto"
          onClick={(e) => {
            const next = factory!();
            if (onCreateRequest) {
              // Blur the trigger before the consumer mounts a Radix Dialog
              // — Radix flips aria-hidden on the surrounding tree wrapper
              // synchronously on open, and a still-focused button inside
              // an aria-hidden ancestor trips the browser's a11y warning.
              // Blurring here lets the dialog's auto-focus take over
              // cleanly.
              (e.currentTarget as HTMLButtonElement).blur();
              // Deferred-commit path — consumer opens an editor and commits
              // on submit. Toolbar stays out of the tree mutation entirely.
              onCreateRequest(next);
              return;
            }
            // Default path — commit immediately + focus.
            state.addItem(next);
            state.focusItem(next.id);
          }}
        >
          <Plus className="size-3.5" />
          New
        </Button>
      )}
      {selectedCount > 0 && (
        <TodoTreeBulkActionBar
          count={selectedCount}
          onToggleActive={(next) =>
            state.toggleActiveBulk(selectedIdsArray(), next)
          }
          onRemove={
            canBulkRemove
              ? () => state.removeItems(selectedIdsArray())
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
