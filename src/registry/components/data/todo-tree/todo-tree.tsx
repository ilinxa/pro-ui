"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { cn } from "@/lib/utils";
import type { TodoTreeHandle, TodoTreeProps } from "./types";

/**
 * Tree-row renderer for TodoItem outlines. Sibling to `<TodoRichCard>` —
 * same `TodoItem` schema, lightweight two-line row instead of the rich
 * card chrome.
 *
 * Implementation is being scaffolded across commits C2–C8:
 *   C2: lib/ (reducer, mutators, filter/sort/flatten, permissions, DnD payload)
 *   C3: hooks/ (state hook, context, controlled-mode, events, selection)
 *   C4: parts/ row primitives (chevron, status, checkbox, name, description, person, row-content)
 *   C5: parts/ list + virtualization
 *   C6: Dual DnD (parts/ row + grip + drop-indicator + drag-overlay; hooks/ dnd-internal + dnd-html5)
 *   C7: toolbar (search + sort + filter + bulk-action-bar)
 *   C8: keyboard handler + a11y + empty state
 *
 * GATE 1 description: docs/procomps/todo-tree-procomp/todo-tree-procomp-description.md
 * GATE 2 plan:        docs/procomps/todo-tree-procomp/todo-tree-procomp-plan.md
 */
export const TodoTree = forwardRef<TodoTreeHandle, TodoTreeProps>(
  function TodoTree(props, ref) {
    const handleRef = useRef<TodoTreeHandle | null>(null);

    useImperativeHandle(
      ref,
      () =>
        handleRef.current ?? {
          // Stub handle so consumer ref doesn't error before C3 lands.
          getValue: () => props.defaultValue ?? props.value ?? [],
          setValue: () => undefined,
          addItem: () => undefined,
          removeItem: () => undefined,
          addChild: () => undefined,
          removeItems: () => undefined,
          toggleActive: () => undefined,
          toggleActiveBulk: () => undefined,
          focusItem: () => undefined,
          getItemById: () => undefined,
          expandItem: () => undefined,
          collapseItem: () => undefined,
          toggleCollapse: () => undefined,
          expandAll: () => undefined,
          collapseAll: () => undefined,
          isCollapsed: () => false,
          selectItem: () => undefined,
          deselectItem: () => undefined,
          selectRange: () => undefined,
          selectAll: () => undefined,
          clearSelection: () => undefined,
          getSelectedIds: () => new Set<string>(),
          setQuery: () => undefined,
          setSort: () => undefined,
          setFilter: () => undefined,
          clearAllFilters: () => undefined,
        },
      [props.defaultValue, props.value],
    );

    return (
      <div
        role="tree"
        aria-label={props["aria-label"] ?? "Todo tree (scaffold)"}
        className={cn(
          "rounded-md border border-dashed border-border bg-card p-6 text-card-foreground",
          props.className,
        )}
      >
        <div className="flex flex-col gap-1">
          <span className="text-base font-semibold text-foreground">
            todo-tree
          </span>
          <span className="text-sm text-muted-foreground">
            Scaffolded · implementation lands in C2–C8 per
            todo-tree-procomp-plan.md §18.
          </span>
        </div>
      </div>
    );
  },
);
