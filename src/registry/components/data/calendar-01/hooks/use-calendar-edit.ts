"use client";

/**
 * The calendar editing state machine (v0.2.0) — the date-grid sibling of gantt's
 * `use-gantt-edit.ts`. Owns the transient edit-UI targets (detail-editor +
 * inline-rename + quick-composer) and the mutation dispatchers. Every dispatcher
 * is a single chokepoint: re-check permission (veto-before-dispatch), compute the
 * NEXT forest from `data` via the pure `edit-mutations`, fire the typed
 * todo-rich-card-shaped event, then `onChange(next)`. No internal copy of `data`
 * — the controlled consumer echoes. When `editable` is false, `can()` returns
 * false so every dispatcher no-ops (the v1 read-only guarantee).
 *
 * Deltas vs gantt: no group-move (calendar renders a parent's own window, so a
 * parent moves alone via `setWindow`); reschedule is all-day aware (ms + allDay,
 * not ISO strings); create seeds `startAt`/`expireAt` from the gesture window;
 * `changePriority` is added (mutate + onChange only — "priority" is not a
 * `TodoEditableField`, so no typed field event, matching the card).
 */

import { useCallback, useMemo, useState } from "react";
import type {
  CalendarComposerTarget,
  CalendarEditAction,
  CalendarSnap,
  TodoEditableField,
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
  formatDateValue,
  isAncestor,
  moveItem,
  removeItem,
  renameItem,
  setWindow,
} from "../lib/edit-mutations";
import { evalCalendarPermission } from "../lib/edit-permissions";
import { reassignTaskIds } from "../lib/clipboard";
import { parseDateValue } from "../lib/classify";

type Args = {
  data: TodoItem[];
  editable: boolean;
  snap: CalendarSnap;
  statusOptions?: TodoStatusOption[];
  /** Select a node (newly created events auto-select). */
  select?: (id: string | null) => void;
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

const ACTION_RULE: Record<CalendarEditAction, keyof TodoPermissionRule> = {
  move: "drag",
  resize: "drag",
  delete: "remove",
  create: "addChildren",
  editDetails: "edit",
};

function freshId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `cal-${crypto.randomUUID()}`;
  }
  return `cal-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export function useCalendarEdit(args: Args) {
  const {
    data,
    editable,
    snap,
    statusOptions,
    select,
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
  const [composerTarget, setComposerTarget] =
    useState<CalendarComposerTarget | null>(null);
  // Live drag/resize preview — the renderers show this geometry mid-gesture; the
  // mutation commits only on release. Cleared when null.
  const [resizePreview, setResizePreview] = useState<{
    id: string;
    startMs: number;
    endMs: number;
  } | null>(null);

  const getItem = useCallback(
    (id: string): TodoItem | undefined => index.get(id)?.item,
    [index],
  );

  const predicateFor = useCallback(
    (action: CalendarEditAction): ((id: string) => boolean) | undefined => {
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
    (action: CalendarEditAction, item: TodoItem): boolean => {
      if (!editable) return false;
      const level = index.get(item.id)?.level ?? 1;
      if (!evalCalendarPermission(permissions, action, item, level))
        return false;
      const pred = predicateFor(action);
      if (pred && !pred(item.id)) return false;
      return true;
    },
    [editable, index, permissions, predicateFor],
  );

  /** Guard a dispatch: return the item if allowed, else report denial + null. */
  const guard = useCallback(
    (action: CalendarEditAction, id: string): TodoItem | null => {
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
      patch: { startMs?: number; endMs?: number; allDay: boolean },
      kind: "move" | "resize",
    ) => {
      const item = guard(kind, id);
      if (!item) return;
      const next = setWindow(data, id, patch);
      if (next === data) return;
      const updated = buildIndex(next).get(id)?.item;
      if (!updated) return;
      // Fire field events gated on the patch touching the key AND the instant
      // really changing — compare by parsed ms (date-only goes floating-local),
      // so a format-only rewrite (e.g. `+03:00` → `Z`) doesn't emit a phantom.
      if (patch.startMs != null) {
        const oldMs = parseDateValue(item.startAt ?? item.setAt).ms;
        const newMs = parseDateValue(updated.startAt ?? updated.setAt).ms;
        if (Number.isFinite(newMs) && newMs !== oldMs) {
          onFieldEdited?.({
            itemId: id,
            key: "startAt",
            oldValue: item.startAt,
            newValue: updated.startAt,
          });
        }
      }
      if (patch.endMs != null) {
        const oldMs = parseDateValue(item.expireAt ?? "").ms;
        const newMs = parseDateValue(updated.expireAt ?? "").ms;
        if (Number.isFinite(newMs) && newMs !== oldMs) {
          onFieldEdited?.({
            itemId: id,
            key: "expireAt",
            oldValue: item.expireAt,
            newValue: updated.expireAt,
          });
        }
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
    (
      parentId: string | null,
      seed: Partial<TodoItem> | undefined,
      window: { startMs: number; endMs?: number; allDay: boolean },
      opts?: { openEditor?: boolean },
    ) => {
      // Root create gates on `editable` only; child create gates the PARENT's
      // addChildren rule.
      if (!editable) return;
      if (parentId != null && !guard("create", parentId)) return;
      const nowIso = new Date().toISOString();
      const item: TodoItem = {
        id: seed?.id ?? freshId(),
        name: seed?.name ?? "New event",
        status: seed?.status ?? statusOptions?.[0]?.value ?? "todo",
        active: seed?.active ?? true,
        setAt: seed?.setAt ?? nowIso,
        ...seed,
        startAt: formatDateValue(window.startMs, window.allDay),
      };
      if (window.endMs != null && Number.isFinite(window.endMs)) {
        item.expireAt = formatDateValue(window.endMs, window.allDay);
      }
      const next = addItem(data, parentId, item);
      onItemAdded?.({ parentId: parentId ?? "", item });
      onChange?.(next);
      select?.(item.id); // auto-select the new event (opens the inspector on it)
      setComposerTarget(null);
      if (opts?.openEditor) setEditingId(item.id); // "More options" → full editor
    },
    [editable, guard, statusOptions, data, onItemAdded, onChange, select],
  );

  /**
   * Paste tasks from the cross-surface clipboard at a target window. Each root is
   * re-id'd (no collision with the source), its dates are rewritten from the
   * TARGET window (so paste lands where focus is AND converts all-day⇄timed by
   * the target), then inserted. One `onChange` for the whole paste (one undo
   * step); root-create gates on `editable`, child-paste on the parent's rule.
   */
  const pasteTasks = useCallback(
    (
      items: TodoItem[],
      window: { startMs: number; endMs?: number; allDay: boolean },
      parentId: string | null = null,
    ) => {
      if (!editable || items.length === 0) return;
      if (parentId != null && !guard("create", parentId)) return;
      let next = data;
      const created: TodoItem[] = [];
      for (const raw of items) {
        // Re-id the (typed `TodoItem`) source, then the TARGET window overrides the
        // dates — so the paste lands where focus is AND converts all-day⇄timed.
        const root: TodoItem = {
          ...reassignTaskIds(raw),
          startAt: formatDateValue(window.startMs, window.allDay),
        };
        if (window.endMs != null && Number.isFinite(window.endMs)) {
          root.expireAt = formatDateValue(window.endMs, window.allDay);
        } else {
          delete root.expireAt;
        }
        if (root.duration != null) delete root.duration; // canonicalize to expireAt-driven
        next = addItem(next, parentId, root);
        created.push(root);
      }
      if (next === data) return;
      created.forEach((item) =>
        onItemAdded?.({ parentId: parentId ?? "", item }),
      );
      onChange?.(next);
      select?.(created[created.length - 1]?.id ?? null);
    },
    [editable, guard, data, onItemAdded, onChange, select],
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

  /** Reserved reparent path (not wired by any v0.2.0 gesture; see plan §1). */
  const moveItemAction = useCallback(
    (id: string, newParentId: string | null, newIndex: number) => {
      const item = guard("move", id);
      if (!item) return;
      if (
        newParentId != null &&
        (newParentId === id || isAncestor(data, id, newParentId))
      )
        return;
      const from = index.get(id);
      let targetIndex = newIndex;
      if (
        from &&
        (from.parentId ?? null) === newParentId &&
        from.index < newIndex
      ) {
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
      onStatusChanged?.({
        itemId: id,
        oldStatus: item.status,
        newStatus: status,
      });
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

  const changePriority = useCallback(
    (id: string, priority: string) => {
      const item = guard("editDetails", id);
      if (!item || priority === item.priority) return;
      // "priority" is not a `TodoEditableField`, so no typed field event — the
      // forest echo carries it (parity with the card, which doesn't emit one).
      const apply = (items: TodoItem[]): TodoItem[] =>
        items.map((it) =>
          it.id === id
            ? { ...it, priority }
            : it.children?.length
              ? { ...it, children: apply(it.children) }
              : it,
        );
      onChange?.(apply(data));
    },
    [data, guard, onChange],
  );

  /** Splice an edited subtree (same root id) from the embedded card back in. */
  const applyEditedSubtree = useCallback(
    (nextItem: TodoItem) => {
      const prev = index.get(nextItem.id)?.item;
      if (!prev) {
        // Deleted (another path) while its editor was open — splicing an absent
        // id would echo the UNCHANGED forest, silently dropping the edit. Drop
        // the stale edit and close instead.
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
      // Emit a granular field event per changed editable field, so a consumer
      // persisting via `onFieldEdited` sees modal / inspector detail-editor edits
      // too — not only the consolidated forest echo (A1, v0.2.2). The embedded
      // card's own granular events are not wired (EventEditorPanel passes only
      // `onChange`), so there is no double-fire. `priority` is intentionally
      // excluded — it is not a `TodoEditableField`, so it persists via `onChange`
      // only (parity with `changePriority`).
      const FIELDS: TodoEditableField[] = [
        "name",
        "description",
        "status",
        "active",
        "setAt",
        "startAt",
        "expireAt",
        "duration",
      ];
      for (const key of FIELDS) {
        const oldValue = prev[key];
        const newValue = nextItem[key];
        if (!Object.is(oldValue, newValue)) {
          onFieldEdited?.({ itemId: nextItem.id, key, oldValue, newValue });
        }
      }
      if (prev.status !== nextItem.status) {
        onStatusChanged?.({
          itemId: nextItem.id,
          oldStatus: prev.status,
          newStatus: nextItem.status,
        });
      }
      onChange?.(forest);
    },
    [data, index, onFieldEdited, onStatusChanged, onChange],
  );

  const openEditor = useCallback(
    (id: string) => {
      if (!guard("editDetails", id)) return;
      setRenamingId(null); // editor + rename are mutually exclusive transients
      // Select the item too: the inspector hosts the editor keyed on selection,
      // so opening the editor (context-menu / Enter) without selecting first
      // would otherwise be a no-op when the inspector is mounted.
      select?.(id);
      setEditingId(id);
    },
    [guard, select],
  );
  const closeEditor = useCallback(() => setEditingId(null), []);
  const beginRename = useCallback(
    (id: string) => {
      if (!guard("editDetails", id)) return;
      setEditingId(null); // mutually exclusive with the editor
      setRenamingId(id);
    },
    [guard],
  );
  const endRename = useCallback(() => setRenamingId(null), []);
  const openComposer = useCallback(
    (target: CalendarComposerTarget) => {
      if (editable) setComposerTarget(target);
    },
    [editable],
  );
  const closeComposer = useCallback(() => setComposerTarget(null), []);

  return {
    editable,
    snap,
    can,
    getItem,
    rescheduleItem,
    createItem,
    pasteTasks,
    deleteItem,
    renameItemAction,
    moveItemAction,
    changeStatus,
    changePriority,
    applyEditedSubtree,
    editingId,
    openEditor,
    closeEditor,
    renamingId,
    beginRename,
    endRename,
    composerTarget,
    openComposer,
    closeComposer,
    resizePreview,
    setResizePreview,
  };
}
