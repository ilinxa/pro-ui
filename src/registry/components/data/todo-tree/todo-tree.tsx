"use client";

import {
  forwardRef,
  useCallback,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import {
  DndContext,
  DragOverlay,
  type DndContextProps,
} from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { TodoStatusOption } from "../todo-rich-card/types";
import type {
  TodoTreeHandle,
  TodoTreePermissionDeniedEvent,
  TodoTreeProps,
} from "./types";
import { useTodoTreeState } from "./hooks/use-todo-tree-state";
import {
  TodoTreeDndContext,
  TodoTreeRenderContext,
  TodoTreeStateContext,
  type TodoTreeDndContextValue,
  type TodoTreeRenderContextValue,
} from "./hooks/use-todo-tree-context";
import { useTreeDndInternal } from "./hooks/use-tree-dnd-internal";
import { useTreeDndHtml5 } from "./hooks/use-tree-dnd-html5";
import { evalPermission } from "./lib/permissions";
import { forEachItem } from "./lib/tree-walker";
import { TodoTreeList } from "./parts/todo-tree-list";
import { TodoTreeDragOverlay } from "./parts/todo-tree-drag-overlay";
import { TodoTreeToolbar } from "./parts/todo-tree-toolbar";
import { isValidElement, type ReactNode } from "react";

/**
 * Tree-row renderer for TodoItem outlines. Sibling to `<TodoRichCard>` —
 * same `TodoItem` schema, lightweight two-line row instead of the rich
 * card chrome.
 *
 * Status across the C1–C11 commit chain:
 *   C1–C6 ✓  — scaffold, lib, hooks, row primitives, list, DnD
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
      toolbar = "default",
      dndContext = "internal",
      readOnly,
      editable = false,
      createItem,
      onCreateRequest,
      renderRow,
      renderName,
      renderDescription,
      renderPerson,
      renderStatusIndicator,
      renderToolbar,
      renderEmptyState,
      renderDragOverlay,
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
      permissions,
      onPermissionDenied,
      className,
      "aria-label": ariaLabel,
    } = props;

    // Drag flags shared between useControlledMode (defense 3) and the DnD
    // hooks (set/unset on dragStart/dragEnd). isInternalDragRef is the
    // mutual-exclusion gate between @dnd-kit grip and native HTML5 drag.
    const isDraggingRef = useRef(false);
    const isInternalDragRef = useRef(false);

    // Stable id for <DndContext>. Without an explicit id, @dnd-kit allocates
    // `DndDescribedBy-N` from a module-level counter that diverges between
    // SSR (single pass) and CSR (StrictMode double-pass) — that triggers a
    // hydration mismatch on every grip button's `aria-describedby`. React's
    // useId is stable across SSR + CSR so we use it as the deterministic seed.
    const dndContextId = useId();

    const internalState = useTodoTreeState({
      defaultValue,
      value,
      onChange,
      defaultCollapsedIds,
      defaultSelectedIds,
      filterMode,
      isDraggingRef,
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
        renderRow,
        renderName,
        renderDescription,
        renderPerson,
        renderStatusIndicator,
        renderEmptyState,
      }),
      [
        statusIndicator,
        statusOptionMap,
        indentSize,
        renderRow,
        renderName,
        renderDescription,
        renderPerson,
        renderStatusIndicator,
        renderEmptyState,
      ],
    );

    // Resolve a drop-target's permission against the live tree, mirroring the
    // keyboard path's evalPermission gate. Predicates are target-keyed to match
    // the DnD hook's enforcement signature (TT1 — previously left undefined so
    // the matrix only applied on the keyboard path).
    const resolveDropPermission = useCallback(
      (targetId: string, action: "dropIntoChildren" | "dropAsSibling"): boolean => {
        let allowed = true;
        forEachItem(stateValue.items, (item, level) => {
          if (item.id === targetId) {
            allowed = evalPermission(permissions, action, item, level);
            return false;
          }
        });
        return allowed;
      },
      [permissions, stateValue.items],
    );
    const canDropIntoChildren = useCallback(
      (targetId: string) => resolveDropPermission(targetId, "dropIntoChildren"),
      [resolveDropPermission],
    );
    const canDropAsSibling = useCallback(
      (targetId: string) => resolveDropPermission(targetId, "dropAsSibling"),
      [resolveDropPermission],
    );

    // DnD wiring.
    const dndInternal = useTreeDndInternal({
      items: stateValue.items,
      dispatch: stateValue.dispatch,
      fireMoved: (args) => onItemMoved?.(args),
      firePermissionDenied: (args: TodoTreePermissionDeniedEvent) =>
        onPermissionDenied?.(args),
      isDraggingRef,
      isInternalDragRef,
      canDropIntoChildren,
      canDropAsSibling,
    });

    const dndHtml5 = useTreeDndHtml5({
      items: stateValue.items,
      dispatch: stateValue.dispatch,
      fireAdded: (args) => onItemAdded?.(args),
      fireDropped: (args) => onItemDropped?.(args),
      isInternalDragRef,
    });

    const dndContextValue = useMemo<TodoTreeDndContextValue>(
      () => ({
        activeItemId: dndInternal.activeItem?.id ?? null,
        overId: dndInternal.over?.overId ?? null,
        overZone: dndInternal.over?.zone ?? null,
        overCircular: dndInternal.over?.circular ?? false,
        handleRowClick: stateValue.handleRowClick,
        getRowHandlers: dndHtml5.getRowHandlers,
      }),
      [
        dndInternal.activeItem,
        dndInternal.over,
        stateValue.handleRowClick,
        dndHtml5.getRowHandlers,
      ],
    );

    // Virtualization config from prop variants.
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

    const defaultToolbar: ReactNode =
      toolbar === "default" ? (
        <TodoTreeToolbar
          statusOptions={statusOptions}
          onBulkEdit={onBulkEdit}
          createItem={createItem}
          onCreateRequest={onCreateRequest}
          readOnly={readOnly}
          editable={editable}
          permissions={permissions}
        />
      ) : null;
    const customNodeToolbar: ReactNode =
      toolbar !== "default" && toolbar !== "none" && isValidElement(toolbar)
        ? (toolbar as ReactNode)
        : null;
    const toolbarRendered: ReactNode = renderToolbar
      ? renderToolbar({ defaultToolbar, state: stateValue })
      : (customNodeToolbar ?? (toolbar === "none" ? null : defaultToolbar));

    const treeBody = (
      <TodoTreeStateContext.Provider value={stateValue}>
        <TodoTreeRenderContext.Provider value={renderContextValue}>
          <TodoTreeDndContext.Provider value={dndContextValue}>
            <div
              aria-label={ariaLabel ?? "Todo tree"}
              className={cn("flex h-full flex-col", className)}
            >
              {toolbarRendered}
              <TodoTreeList
                virtualize={virtualizeMode}
                virtualizeThreshold={virtualizeThreshold}
                suspended={dndInternal.activeItem !== null}
                permissions={permissions}
                onPermissionDenied={onPermissionDenied}
                readOnly={readOnly}
              />
            </div>
          </TodoTreeDndContext.Provider>
        </TodoTreeRenderContext.Provider>
      </TodoTreeStateContext.Provider>
    );

    const dndProps: DndContextProps = {
      id: dndContextId,
      sensors: dndInternal.sensors,
      onDragStart: dndInternal.onDragStart,
      onDragOver: dndInternal.onDragOver,
      onDragEnd: dndInternal.onDragEnd,
      onDragCancel: dndInternal.onDragCancel,
    };

    if (dndContext === "external") {
      return treeBody;
    }

    return (
      <DndContext {...dndProps}>
        {treeBody}
        <DragOverlay>
          {dndInternal.activeItem &&
            (renderDragOverlay
              ? renderDragOverlay({
                  item: dndInternal.activeItem,
                  level: dndInternal.activeLevel,
                })
              : (
                  <TodoTreeDragOverlay
                    item={dndInternal.activeItem}
                    level={dndInternal.activeLevel}
                  />
                ))}
        </DragOverlay>
      </DndContext>
    );
  },
);

