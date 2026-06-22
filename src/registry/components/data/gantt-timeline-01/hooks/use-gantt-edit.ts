"use client";

/**
 * The editing state machine (v0.2.0). Owns the transient edit-UI targets
 * (detail-editor + inline-rename) and the mutation dispatchers. Every dispatcher
 * is a single chokepoint: re-check permission (veto-before-dispatch), compute the
 * NEXT forest from `data` via the pure `edit-mutations`, fire the typed
 * todo-rich-card-shaped event, then `onChange(next)`. No internal copy of `data`
 * — the controlled consumer echoes. When `editable` is false, `can()` returns
 * false so every dispatcher no-ops (the v1 read-only guarantee).
 */

import { useCallback, useMemo, useState } from "react";
import type {
  GanttEditAction,
  GanttSnap,
  TodoFieldEditedEvent,
  TodoItem,
  TodoItemAddedEvent,
  TodoItemMovedEvent,
  TodoItemRemovedEvent,
  TodoPermissionReason,
  TodoPermissionRule,
  TodoPermissions,
  TodoStatusChangedEvent,
  TodoStatusOption,
} from "../types";
import {
  addItem,
  buildIndex,
  isAncestor,
  moveItem,
  removeItem,
  renameItem,
  setWindow,
  shiftSubtree,
  subtreeLeaves,
} from "../lib/edit-mutations";
import { evalGanttPermission } from "../lib/edit-permissions";

type Args = {
  data: TodoItem[];
  editable: boolean;
  snap: GanttSnap;
  statusOptions?: TodoStatusOption[];
  onChange?: (data: TodoItem[]) => void;
  onTaskReschedule?: (next: {
    itemId: string;
    startAt: string;
    expireAt?: string;
  }) => void;
  onItemAdded?: (e: TodoItemAddedEvent) => void;
  onItemRemoved?: (e: TodoItemRemovedEvent) => void;
  onItemMoved?: (e: TodoItemMovedEvent) => void;
  onFieldEdited?: (e: TodoFieldEditedEvent) => void;
  onStatusChanged?: (e: TodoStatusChangedEvent) => void;
  permissions?: TodoPermissions;
  canMoveItem?: (id: string) => boolean;
  canResizeItem?: (id: string) => boolean;
  canDeleteItem?: (id: string) => boolean;
  canCreateChild?: (id: string) => boolean;
  canEditItem?: (id: string) => boolean;
  onPermissionDenied?: (
    action: keyof TodoPermissionRule,
    itemId: string,
    reason: TodoPermissionReason,
  ) => void;
};

const ACTION_RULE: Record<GanttEditAction, keyof TodoPermissionRule> = {
  move: "drag",
  resize: "drag",
  delete: "remove",
  create: "addChildren",
  editDetails: "edit",
};

function freshId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `gt-${crypto.randomUUID()}`;
  }
  return `gt-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export function useGanttEdit(args: Args) {
  const {
    data,
    editable,
    snap,
    statusOptions,
    onChange,
    onTaskReschedule,
    onItemAdded,
    onItemRemoved,
    onItemMoved,
    onFieldEdited,
    onStatusChanged,
    permissions,
    canMoveItem,
    canResizeItem,
    canDeleteItem,
    canCreateChild,
    canEditItem,
    onPermissionDenied,
  } = args;

  const index = useMemo(() => buildIndex(data), [data]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  const nodeInfo = useCallback(
    (id: string) => {
      const info = index.get(id);
      return info
        ? { parentId: info.parentId, index: info.index, level: info.level }
        : undefined;
    },
    [index],
  );

  const predicateFor = useCallback(
    (action: GanttEditAction): ((id: string) => boolean) | undefined => {
      switch (action) {
        case "move":
          return canMoveItem;
        case "resize":
          return canResizeItem;
        case "delete":
          return canDeleteItem;
        case "create":
          return canCreateChild;
        case "editDetails":
          return canEditItem;
      }
    },
    [canMoveItem, canResizeItem, canDeleteItem, canCreateChild, canEditItem],
  );

  const can = useCallback(
    (action: GanttEditAction, item: TodoItem): boolean => {
      if (!editable) return false;
      const level = index.get(item.id)?.level ?? 1;
      if (!evalGanttPermission(permissions, action, item, level)) return false;
      const pred = predicateFor(action);
      if (pred && !pred(item.id)) return false;
      return true;
    },
    [editable, index, permissions, predicateFor],
  );

  /** Guard a dispatch: return the item if allowed, else report denial + null. */
  const guard = useCallback(
    (action: GanttEditAction, id: string): TodoItem | null => {
      const item = index.get(id)?.item;
      if (!item) return null;
      if (can(action, item)) return item;
      const reason: TodoPermissionReason = item.locked
        ? "locked"
        : predicateFor(action)?.(id) === false
          ? "predicate"
          : "default";
      onPermissionDenied?.(ACTION_RULE[action], id, reason);
      return null;
    },
    [index, can, predicateFor, onPermissionDenied],
  );

  const rescheduleItem = useCallback(
    (
      id: string,
      patch: { startAt?: string; expireAt?: string; duration?: number },
      kind: "move" | "resize",
    ) => {
      const item = guard(kind, id);
      if (!item) return;
      const next = setWindow(data, id, patch);
      if (next === data) return;
      const updated = buildIndex(next).get(id)?.item;
      if (!updated) return;
      // Each field event is gated on the patch actually touching that key AND on
      // the value really changing. `setWindow` re-serializes `expireAt` whenever
      // the item has one (even on a start-only resize), so compare by instant —
      // a non-canonical stored date (e.g. `+03:00` offset) must not fire a phantom
      // event whose old/new are the same moment.
      if (
        patch.startAt != null &&
        Date.parse(updated.startAt ?? "") !== Date.parse(item.startAt ?? "")
      ) {
        onFieldEdited?.({
          itemId: id,
          key: "startAt",
          oldValue: item.startAt,
          newValue: updated.startAt,
        });
      }
      if (
        patch.expireAt != null &&
        Date.parse(updated.expireAt ?? "") !== Date.parse(item.expireAt ?? "")
      ) {
        onFieldEdited?.({
          itemId: id,
          key: "expireAt",
          oldValue: item.expireAt,
          newValue: updated.expireAt,
        });
      }
      if (patch.duration != null && updated.duration !== item.duration) {
        onFieldEdited?.({
          itemId: id,
          key: "duration",
          oldValue: item.duration,
          newValue: updated.duration,
        });
      }
      onTaskReschedule?.({
        itemId: id,
        startAt: updated.startAt ?? updated.setAt,
        expireAt: updated.expireAt,
      });
      onChange?.(next);
    },
    [data, guard, onFieldEdited, onTaskReschedule, onChange],
  );

  const createItem = useCallback(
    (parentId: string | null, seed?: Partial<TodoItem>, at?: number) => {
      // Root create gates on `editable` only; child create gates the PARENT's
      // addChildren rule.
      if (!editable) return;
      if (parentId != null && !guard("create", parentId)) return;
      const nowIso = seed?.setAt ?? new Date().toISOString();
      const item: TodoItem = {
        id: seed?.id ?? freshId(),
        name: seed?.name ?? "New task",
        status: seed?.status ?? statusOptions?.[0]?.value ?? "todo",
        active: seed?.active ?? true,
        setAt: nowIso,
        ...seed,
      };
      const next = addItem(data, parentId, item, at);
      onItemAdded?.({ parentId: parentId ?? "", item });
      onChange?.(next);
    },
    [editable, guard, statusOptions, data, onItemAdded, onChange],
  );

  const deleteItem = useCallback(
    (id: string) => {
      if (!guard("delete", id)) return;
      const { next, removed, parentId } = removeItem(data, id);
      if (!removed) return;
      onItemRemoved?.({ itemId: id, removed, parentId: parentId ?? "" });
      onChange?.(next);
      if (editingId === id) setEditingId(null);
      if (renamingId === id) setRenamingId(null);
    },
    [data, guard, onItemRemoved, onChange, editingId, renamingId],
  );

  const renameItemAction = useCallback(
    (id: string, name: string) => {
      const item = guard("editDetails", id);
      if (!item || name === item.name) return;
      const next = renameItem(data, id, name);
      onFieldEdited?.({
        itemId: id,
        key: "name",
        oldValue: item.name,
        newValue: name,
      });
      onChange?.(next);
    },
    [data, guard, onFieldEdited, onChange],
  );

  const moveItemAction = useCallback(
    (id: string, newParentId: string | null, newIndex: number) => {
      const item = guard("move", id);
      if (!item) return;
      // Circular drop is a structural invalid, not a permission denial — no-op.
      if (newParentId != null && (newParentId === id || isAncestor(data, id, newParentId)))
        return;
      const from = index.get(id);
      // Same-parent move-down: removing the source shifts indices, so the drop
      // index is one too far. (todo-tree semantics.)
      let targetIndex = newIndex;
      if (from && (from.parentId ?? null) === newParentId && from.index < newIndex) {
        targetIndex = newIndex - 1;
      }
      const next = moveItem(data, id, newParentId, targetIndex);
      if (next === data) return;
      onItemMoved?.({
        itemId: id,
        oldParentId: from?.parentId ?? "",
        newParentId: newParentId ?? "",
        oldIndex: from?.index ?? 0,
        newIndex: targetIndex,
      });
      onChange?.(next);
    },
    [data, guard, index, onItemMoved, onChange],
  );

  /* ── group-move (v0.3.0) ── */

  /** Atomic gate: the summary is movable AND every descendant leaf is movable. */
  const canGroupMove = useCallback(
    (item: TodoItem): boolean => {
      if (!editable || !can("move", item)) return false;
      const leaves = subtreeLeaves(item);
      return leaves.length > 0 && leaves.every((l) => can("move", l));
    },
    [editable, can],
  );

  /** Shift a summary's whole subtree by `deltaMs` — single-move applied per leaf. */
  const moveSubtree = useCallback(
    (id: string, deltaMs: number) => {
      const summary = guard("move", id); // reports denial if the summary itself is blocked
      if (!summary) return;
      const leaves = subtreeLeaves(summary);
      if (leaves.length === 0) return;
      // Atomic (D23): a single blocked leaf vetoes the whole group; report + abort.
      for (const leaf of leaves) {
        if (!can("move", leaf)) {
          const reason: TodoPermissionReason = leaf.locked
            ? "locked"
            : canMoveItem?.(leaf.id) === false
              ? "predicate"
              : "default";
          onPermissionDenied?.("drag", leaf.id, reason);
          return;
        }
      }
      if (deltaMs === 0) return;
      const next = shiftSubtree(data, id, deltaMs);
      if (next === data) return;
      const nextIndex = buildIndex(next);
      // D25 — per-leaf field events (parity with single-move) + one onChange (= one undo step).
      for (const leaf of leaves) {
        const updated = nextIndex.get(leaf.id)?.item;
        if (!updated) continue;
        onFieldEdited?.({
          itemId: leaf.id,
          key: "startAt",
          oldValue: leaf.startAt,
          newValue: updated.startAt,
        });
        if (updated.expireAt !== leaf.expireAt) {
          onFieldEdited?.({
            itemId: leaf.id,
            key: "expireAt",
            oldValue: leaf.expireAt,
            newValue: updated.expireAt,
          });
        }
        onTaskReschedule?.({
          itemId: leaf.id,
          startAt: updated.startAt ?? updated.setAt,
          expireAt: updated.expireAt,
        });
      }
      onChange?.(next);
    },
    [
      data,
      can,
      guard,
      canMoveItem,
      onPermissionDenied,
      onFieldEdited,
      onTaskReschedule,
      onChange,
    ],
  );

  const changeStatus = useCallback(
    (id: string, status: string) => {
      const item = guard("editDetails", id);
      if (!item || status === item.status) return;
      const apply = (items: TodoItem[]): TodoItem[] =>
        items.map((it) =>
          it.id === id
            ? { ...it, status }
            : it.children?.length
              ? { ...it, children: apply(it.children) }
              : it,
        );
      onStatusChanged?.({ itemId: id, oldStatus: item.status, newStatus: status });
      onFieldEdited?.({
        itemId: id,
        key: "status",
        oldValue: item.status,
        newValue: status,
      });
      onChange?.(apply(data));
    },
    [data, guard, onStatusChanged, onFieldEdited, onChange],
  );

  /** Splice an edited subtree (same root id) from the embedded card back in. */
  const applyEditedSubtree = useCallback(
    (nextItem: TodoItem) => {
      const prev = index.get(nextItem.id)?.item;
      if (!prev) {
        // The item was deleted (another path) while its editor was open. Splicing
        // an absent id would be a no-op map and echo the UNCHANGED forest, silently
        // dropping the edit. Drop the stale edit and close instead.
        setEditingId(null);
        return;
      }
      const apply = (items: TodoItem[]): TodoItem[] =>
        items.map((it) =>
          it.id === nextItem.id
            ? nextItem
            : it.children?.length
              ? { ...it, children: apply(it.children) }
              : it,
        );
      const forest = apply(data);
      if (prev.status !== nextItem.status) {
        onStatusChanged?.({
          itemId: nextItem.id,
          oldStatus: prev.status,
          newStatus: nextItem.status,
        });
      }
      onChange?.(forest);
    },
    [data, index, onStatusChanged, onChange],
  );

  const openEditor = useCallback(
    (id: string) => {
      if (guard("editDetails", id)) setEditingId(id);
    },
    [guard],
  );
  const closeEditor = useCallback(() => setEditingId(null), []);
  const beginRename = useCallback(
    (id: string) => {
      if (guard("editDetails", id)) setRenamingId(id);
    },
    [guard],
  );
  const endRename = useCallback(() => setRenamingId(null), []);

  return {
    editable,
    snap,
    can,
    canGroupMove,
    nodeInfo,
    rescheduleItem,
    createItem,
    deleteItem,
    renameItemAction,
    moveItemAction,
    moveSubtree,
    changeStatus,
    editingId,
    openEditor,
    closeEditor,
    applyEditedSubtree,
    renamingId,
    beginRename,
    endRename,
  };
}
