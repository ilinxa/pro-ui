import { useCallback, useEffect, useRef } from "react";
import type { TodoItem } from "../../todo-rich-card/types";
import type {
  TodoTreeAddEvent,
  TodoTreeDropEvent,
  TodoTreeFilter,
  TodoTreeItemEvent,
  TodoTreeMoveEvent,
  TodoTreePermissionDeniedEvent,
  TodoTreeRemoveEvent,
  TodoTreeSort,
} from "../types";

/**
 * Map of event names → payload shapes. Lets `fire` be typed without resorting
 * to a giant prop-name union switch.
 */
export interface TreeEventMap {
  itemMoved: TodoTreeMoveEvent;
  itemDropped: TodoTreeDropEvent;
  itemAdded: TodoTreeAddEvent;
  itemRemoved: TodoTreeRemoveEvent;
  activeToggled: { item: TodoItem; nextActive: boolean };
  collapseToggled: { item: TodoItem; collapsed: boolean };
  bulkToggleActive: { ids: ReadonlyArray<string>; nextActive: boolean };
  bulkRemove: { ids: ReadonlyArray<string> };
  bulkEdit: { ids: ReadonlyArray<string> };
  selectionChanged: { selectedIds: ReadonlySet<string> };
  searchChanged: { query: string };
  sortChanged: { sort: TodoTreeSort };
  filterChanged: { filter: TodoTreeFilter };
  itemClick: TodoTreeItemEvent;
  itemContextMenu: TodoTreeItemEvent;
  permissionDenied: TodoTreePermissionDeniedEvent;
}

/**
 * Consumer callbacks. Names mirror TreeEventMap; each is `on<Name>` with the
 * first letter upper-cased. Keeping callbacks in a single bag lets us
 * ref-mirror them to one stable identity for the lifetime of the host.
 */
export interface TreeEventCallbacks {
  onItemMoved?: (args: TodoTreeMoveEvent) => void;
  onItemDropped?: (args: TodoTreeDropEvent) => void;
  onItemAdded?: (args: TodoTreeAddEvent) => void;
  onItemRemoved?: (args: TodoTreeRemoveEvent) => void;
  onActiveToggled?: (args: { item: TodoItem; nextActive: boolean }) => void;
  onCollapseToggled?: (args: { item: TodoItem; collapsed: boolean }) => void;
  onBulkToggleActive?: (args: {
    ids: ReadonlyArray<string>;
    nextActive: boolean;
  }) => void;
  onBulkRemove?: (args: { ids: ReadonlyArray<string> }) => void;
  onBulkEdit?: (args: { ids: ReadonlyArray<string> }) => void;
  onSelectionChanged?: (args: { selectedIds: ReadonlySet<string> }) => void;
  onSearchChanged?: (args: { query: string }) => void;
  onSortChanged?: (args: { sort: TodoTreeSort }) => void;
  onFilterChanged?: (args: { filter: TodoTreeFilter }) => void;
  onItemClick?: (args: TodoTreeItemEvent) => void;
  onItemContextMenu?: (args: TodoTreeItemEvent) => void;
  onPermissionDenied?: (args: TodoTreePermissionDeniedEvent) => void;
}

const NAME_TO_PROP: { [K in keyof TreeEventMap]: keyof TreeEventCallbacks } = {
  itemMoved: "onItemMoved",
  itemDropped: "onItemDropped",
  itemAdded: "onItemAdded",
  itemRemoved: "onItemRemoved",
  activeToggled: "onActiveToggled",
  collapseToggled: "onCollapseToggled",
  bulkToggleActive: "onBulkToggleActive",
  bulkRemove: "onBulkRemove",
  bulkEdit: "onBulkEdit",
  selectionChanged: "onSelectionChanged",
  searchChanged: "onSearchChanged",
  sortChanged: "onSortChanged",
  filterChanged: "onFilterChanged",
  itemClick: "onItemClick",
  itemContextMenu: "onItemContextMenu",
  permissionDenied: "onPermissionDenied",
};

export interface TreeEventDispatcher {
  fire: <K extends keyof TreeEventMap>(name: K, args: TreeEventMap[K]) => void;
}

/**
 * Stable-identity event dispatcher. Microtask-defers each invocation to avoid
 * setState-during-render — same defense pattern as flow-canvas-01 v0.2.4's
 * fireOnChange. Callbacks are read from a ref at fire-time, so consumers can
 * pass inline event handlers without re-rendering the tree.
 *
 * `onItemClick` / `onItemContextMenu` fire SYNCHRONOUSLY (no microtask defer):
 * these are user-initiated and consumers commonly call `event.preventDefault()`
 * or navigate from within the handler. Deferring one tick would push focus /
 * scroll / navigation out of the same task as the original click event and
 * break the synchronous expectation. (React 17+ disabled synthetic-event
 * pooling, so deferring is technically safe — this is a UX choice, not a
 * correctness one.)
 */
export function useTreeEvents(
  callbacks: TreeEventCallbacks,
): TreeEventDispatcher {
  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  const fire = useCallback(
    <K extends keyof TreeEventMap>(name: K, args: TreeEventMap[K]) => {
      const propName = NAME_TO_PROP[name];
      const cb = callbacksRef.current[propName] as
        | ((args: TreeEventMap[K]) => void)
        | undefined;
      if (!cb) return;
      if (name === "itemClick" || name === "itemContextMenu") {
        cb(args);
        return;
      }
      queueMicrotask(() => {
        // Re-read the callback so a consumer mid-flight swap still routes.
        const live = callbacksRef.current[propName] as
          | ((args: TreeEventMap[K]) => void)
          | undefined;
        live?.(args);
      });
    },
    [],
  );

  return { fire };
}
