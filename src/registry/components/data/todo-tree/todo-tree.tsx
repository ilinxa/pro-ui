"use client";

import {
  forwardRef,
  useImperativeHandle,
  useMemo,
} from "react";
import { cn } from "@/lib/utils";
import type { TodoStatusOption } from "../todo-rich-card/types";
import type { TodoTreeHandle, TodoTreeProps } from "./types";
import { useTodoTreeState } from "./hooks/use-todo-tree-state";
import {
  TodoTreeRenderContext,
  TodoTreeStateContext,
  type TodoTreeRenderContextValue,
} from "./hooks/use-todo-tree-context";
import { TodoTreeList } from "./parts/todo-tree-list";

/**
 * Tree-row renderer for TodoItem outlines. Sibling to `<TodoRichCard>` —
 * same `TodoItem` schema, lightweight two-line row instead of the rich
 * card chrome.
 *
 * Status across the C1–C11 commit chain:
 *   C1–C5 ✓  — scaffold, lib, hooks, row primitives, list + virtualization
 *   C6   ◌  — Dual DnD wiring
 *   C7   ◌  — toolbar
 *   C8   ◌  — keyboard + a11y + empty state
 *   C9+  ◌  — wrapper + demo + usage + meta sync + ship
 *
 * GATE 1: docs/procomps/todo-tree-procomp/todo-tree-procomp-description.md
 * GATE 2: docs/procomps/todo-tree-procomp/todo-tree-procomp-plan.md
 */
export const TodoTree = forwardRef<TodoTreeHandle, TodoTreeProps>(
  function TodoTree(props, ref) {
    const {
      defaultValue,
      value,
      onChange,
      state: externalState,
      statusOptions,
      defaultCollapsedIds,
      defaultSelectedIds,
      indentSize = 20,
      filterMode = "fade",
      statusIndicator = "dot",
      virtualize,
      renderRow,
      renderName,
      renderDescription,
      renderPerson,
      renderStatusIndicator,
      onItemClick,
      onItemContextMenu,
      onActiveToggled,
      onCollapseToggled,
      onItemMoved,
      onItemDropped,
      onItemAdded,
      onItemRemoved,
      onBulkToggleActive,
      onBulkRemove,
      onBulkEdit,
      onSelectionChanged,
      onSearchChanged,
      onSortChanged,
      onFilterChanged,
      onPermissionDenied,
      className,
      "aria-label": ariaLabel,
    } = props;

    // The headless hook runs unconditionally; when an externalState is
    // supplied we ignore the hook's value and use the external one as the
    // single source of truth for context.
    const internalState = useTodoTreeState({
      defaultValue,
      value,
      onChange,
      defaultCollapsedIds,
      defaultSelectedIds,
      filterMode,
      onItemClick,
      onItemContextMenu,
      onActiveToggled,
      onCollapseToggled,
      onItemMoved,
      onItemDropped,
      onItemAdded,
      onItemRemoved,
      onBulkToggleActive,
      onBulkRemove,
      onBulkEdit,
      onSelectionChanged,
      onSearchChanged,
      onSortChanged,
      onFilterChanged,
      onPermissionDenied,
    });

    const stateValue = externalState ?? internalState;

    useImperativeHandle(ref, () => stateValue, [stateValue]);

    const statusOptionMap = useMemo(() => {
      const map = new Map<string, TodoStatusOption>();
      if (statusOptions) {
        for (const o of statusOptions) map.set(o.value, o);
      }
      return map;
    }, [statusOptions]);

    const renderContextValue = useMemo<TodoTreeRenderContextValue>(
      () => ({
        statusIndicator,
        statusOptionMap,
        indentSize,
        renderName,
        renderDescription,
        renderPerson,
        renderStatusIndicator,
      }),
      [
        statusIndicator,
        statusOptionMap,
        indentSize,
        renderName,
        renderDescription,
        renderPerson,
        renderStatusIndicator,
      ],
    );

    // Virtualization config from prop variants:
    //   - boolean true  → "always"
    //   - boolean false → "never"
    //   - object        → "auto" with custom threshold
    //   - undefined     → "auto" default
    const virtualizeMode: "auto" | "always" | "never" =
      virtualize === true
        ? "always"
        : virtualize === false
          ? "never"
          : "auto";
    const virtualizeThreshold =
      typeof virtualize === "object" && virtualize !== null
        ? (virtualize.threshold ?? 200)
        : 200;

    return (
      <TodoTreeStateContext.Provider value={stateValue}>
        <TodoTreeRenderContext.Provider value={renderContextValue}>
          <div
            aria-label={ariaLabel ?? "Todo tree"}
            className={cn("flex h-full flex-col", className)}
          >
            {/* Toolbar slot — C7 lands the default toolbar; for now we
                leave the surface unrendered when toolbar is "default" so
                consumers can drop in their own bar via renderToolbar. */}
            {renderRow
              ? null /* slot row replaces row-content; wired in C6's <TodoTreeRow> */
              : null}
            <TodoTreeList
              virtualize={virtualizeMode}
              virtualizeThreshold={virtualizeThreshold}
            />
          </div>
        </TodoTreeRenderContext.Provider>
      </TodoTreeStateContext.Provider>
    );
  },
);
