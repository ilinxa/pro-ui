"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
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
import type { TaskItem, TaskStatusOption } from "../task-card/types";
import {
  readTasksFromClipboardEvent,
  writeTasksToClipboardEvent,
  reassignTaskIds,
} from "../task-card/lib/clipboard";
import type {
  TaskTreeHandle,
  TaskTreePermissionDeniedEvent,
  TaskTreeProps,
} from "./types";
import { useTaskTreeState } from "./hooks/use-task-tree-state";
import {
  TaskTreeDndContext,
  TaskTreeRenderContext,
  TaskTreeStateContext,
  type TaskTreeDndContextValue,
  type TaskTreeRenderContextValue,
} from "./hooks/use-task-tree-context";
import { useTreeDndInternal } from "./hooks/use-tree-dnd-internal";
import { useTreeDndHtml5 } from "./hooks/use-tree-dnd-html5";
import { evalPermission } from "./lib/permissions";
import {
  findItemWithLevel,
  forEachItem,
  pruneNestedIds,
} from "./lib/tree-walker";
import { TaskTreeList } from "./parts/task-tree-list";
import { TaskTreeDragOverlay } from "./parts/task-tree-drag-overlay";
import { TaskTreeToolbar } from "./parts/task-tree-toolbar";
import { isValidElement, type ReactNode } from "react";

/**
 * Tree-row renderer for TaskItem outlines. Sibling to `<TaskCard>` —
 * same `TaskItem` schema, lightweight two-line row instead of the rich
 * card chrome.
 *
 * Status across the C1–C11 commit chain:
 *   C1–C6 ✓  — scaffold, lib, hooks, row primitives, list, DnD
 *   C7   ◌  — toolbar
 *   C8   ◌  — keyboard + a11y + empty state
 *   C9+  ◌  — wrapper + demo + usage + meta sync + ship
 *
 * GATE 1: docs/procomps/task-tree-procomp/task-tree-procomp-description.md
 * GATE 2: docs/procomps/task-tree-procomp/task-tree-procomp-plan.md
 */
export const TaskTree = forwardRef<TaskTreeHandle, TaskTreeProps>(
  function TaskTree(props, ref) {
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

    const internalState = useTaskTreeState({
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
      permissions,
    });

    const stateValue = externalState ?? internalState;

    useImperativeHandle(ref, () => stateValue, [stateValue]);

    // Latest state for the document clipboard listeners (kept in a ref so the
    // listeners attach once, not on every tree mutation).
    const treeRef = useRef<HTMLDivElement | null>(null);
    const stateValueRef = useRef(stateValue);
    useEffect(() => {
      stateValueRef.current = stateValue;
    }, [stateValue]);
    // Permission matrix + denial callback mirrored to refs so the document
    // clipboard listeners (attach-once) always gate against the live values.
    const permissionsRef = useRef(permissions);
    const onPermissionDeniedRef = useRef(onPermissionDenied);
    useEffect(() => {
      permissionsRef.current = permissions;
      onPermissionDeniedRef.current = onPermissionDenied;
    }, [permissions, onPermissionDenied]);

    /* ── cross-surface clipboard (v0.3.0) — copy/cut/paste TaskItems through the
          OS clipboard (shared ilinxa/task envelope). Document-level, gated on the
          tree containing focus + skipped over text inputs; mirrors gantt/calendar.
          Operates on the current selection (or the focused row). ── */
    useEffect(() => {
      if (!editable || readOnly) return;
      const owns = () => {
        const active = document.activeElement;
        return !!treeRef.current && !!active && treeRef.current.contains(active);
      };
      const overText = () => {
        const el = document.activeElement as HTMLElement | null;
        return (
          el?.tagName === "INPUT" ||
          el?.tagName === "TEXTAREA" ||
          el?.tagName === "SELECT" ||
          el?.isContentEditable === true
        );
      };
      const targetIds = (): string[] => {
        const s = stateValueRef.current;
        const sel = s.getSelectedIds();
        // Prune ids whose ancestor is also selected — a parent's payload
        // already carries the subtree; keeping both duplicates it on paste.
        if (sel.size > 0) return pruneNestedIds(s.items, [...sel]);
        return s.focusedItemId ? [s.focusedItemId] : [];
      };
      const collect = (ids: string[]): TaskItem[] =>
        ids
          .map((id) => stateValueRef.current.getItemById(id))
          .filter((it): it is TaskItem => !!it);
      const onCopy = (e: ClipboardEvent) => {
        if (!owns() || overText()) return;
        const items = collect(targetIds());
        if (items.length === 0) return;
        writeTasksToClipboardEvent(e, items, "task-tree");
        e.preventDefault();
      };
      const onCut = (e: ClipboardEvent) => {
        if (!owns() || overText()) return;
        const ids = targetIds();
        if (ids.length === 0) return;
        // Gate each id on the remove rule + `locked`, mirroring keyboard
        // Delete: blocked ids are reported + skipped, allowed ids are cut.
        const allowed: string[] = [];
        for (const id of ids) {
          const found = findItemWithLevel(stateValueRef.current.items, id);
          if (!found) continue;
          if (
            evalPermission(permissionsRef.current, "remove", found.item, found.level)
          ) {
            allowed.push(id);
          } else {
            onPermissionDeniedRef.current?.({
              action: "remove",
              itemId: id,
              reason:
                found.item.locked === true ? "denied-by-lock" : "denied-by-rule",
            });
          }
        }
        const items = collect(allowed);
        if (items.length === 0) return;
        writeTasksToClipboardEvent(e, items, "task-tree");
        stateValueRef.current.removeItems(allowed);
        e.preventDefault();
      };
      const onPaste = (e: ClipboardEvent) => {
        if (!owns() || overText()) return;
        const items = readTasksFromClipboardEvent(e);
        if (!items) return;
        const s = stateValueRef.current;
        const parentId = s.focusedItemId;
        if (parentId) {
          // Gate the graft target on its dropIntoChildren (addChildren) rule +
          // `locked` — same rule the DnD drop path enforces (TT1 parity).
          const target = findItemWithLevel(s.items, parentId);
          if (
            target &&
            !evalPermission(
              permissionsRef.current,
              "dropIntoChildren",
              target.item,
              target.level,
            )
          ) {
            onPermissionDeniedRef.current?.({
              action: "dropIntoChildren",
              itemId: parentId,
              reason:
                target.item.locked === true ? "denied-by-lock" : "denied-by-rule",
            });
            // The payload was ours — consume the event, deny the graft.
            e.preventDefault();
            return;
          }
        }
        for (const raw of items) {
          const fresh = reassignTaskIds(raw);
          if (parentId) s.addChild(parentId, fresh);
          else s.addItem(fresh);
        }
        e.preventDefault();
      };
      document.addEventListener("copy", onCopy);
      document.addEventListener("cut", onCut);
      document.addEventListener("paste", onPaste);
      return () => {
        document.removeEventListener("copy", onCopy);
        document.removeEventListener("cut", onCut);
        document.removeEventListener("paste", onPaste);
      };
    }, [editable, readOnly]);

    const statusOptionMap = useMemo(() => {
      const map = new Map<string, TaskStatusOption>();
      if (statusOptions) {
        for (const o of statusOptions) map.set(o.value, o);
      }
      return map;
    }, [statusOptions]);

    const renderContextValue = useMemo<TaskTreeRenderContextValue>(
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
      firePermissionDenied: (args: TaskTreePermissionDeniedEvent) =>
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

    const dndContextValue = useMemo<TaskTreeDndContextValue>(
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
        <TaskTreeToolbar
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
      <TaskTreeStateContext.Provider value={stateValue}>
        <TaskTreeRenderContext.Provider value={renderContextValue}>
          <TaskTreeDndContext.Provider value={dndContextValue}>
            <div
              ref={treeRef}
              aria-label={ariaLabel ?? "Task tree"}
              className={cn("flex h-full flex-col", className)}
            >
              {toolbarRendered}
              <TaskTreeList
                virtualize={virtualizeMode}
                virtualizeThreshold={virtualizeThreshold}
                suspended={dndInternal.activeItem !== null}
                permissions={permissions}
                onPermissionDenied={onPermissionDenied}
                readOnly={readOnly}
              />
            </div>
          </TaskTreeDndContext.Provider>
        </TaskTreeRenderContext.Provider>
      </TaskTreeStateContext.Provider>
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
                  <TaskTreeDragOverlay
                    item={dndInternal.activeItem}
                    level={dndInternal.activeLevel}
                  />
                ))}
        </DragOverlay>
      </DndContext>
    );
  },
);

