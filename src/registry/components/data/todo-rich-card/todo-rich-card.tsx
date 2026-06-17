"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { cn } from "@/lib/utils";
import { useColorEngine } from "./hooks/use-color-engine";
import { useKeyboard } from "./hooks/use-keyboard";
import { TodoCardContext } from "./hooks/use-card-context";
import { Card } from "./parts/card";
import {
  copyToClipboard as copyToClipboardFn,
  readFromClipboard,
} from "./lib/json-io";
import { denormalize, findNode, normalize } from "./lib/normalize";
import { buildResolver } from "./lib/permissions";
import { resolveRamp } from "./lib/ramp";
import { resolveNowFactory } from "./lib/time";
import { createInitialState, reducer } from "./lib/reducer";
import type {
  TodoCardContextValue,
  TodoEventMap,
  TodoPermissionReason,
  TodoPermissionRule,
  TodoRichCardHandle,
  TodoRichCardProps,
} from "./types";

export const TodoRichCard = forwardRef<TodoRichCardHandle, TodoRichCardProps>(
  function TodoRichCard(props, ref) {
    const {
      defaultValue,
      value,
      colorRamp,
      colorRefreshIntervalMs = 60_000,
      now: nowProp,
      editable = false,
      showEditButton = true,
      statusOptions,
      permissions,
      className,
      "aria-label": ariaLabel,
    } = props;

    const [state, dispatch] = useReducer(
      reducer,
      value ?? defaultValue,
      createInitialState,
    );

    /* ───────── derive context inputs ───────── */

    const nowFactory = useMemo(() => resolveNowFactory(nowProp), [nowProp]);
    const ramp = useMemo(() => resolveRamp(colorRamp), [colorRamp]);
    const tick = useColorEngine(colorRefreshIntervalMs);

    const resolvePermissions = useMemo(
      () => buildResolver(state.root, props),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [
        state.root,
        permissions,
        props.canEditItem,
        props.canRemoveItem,
        props.canAddChildren,
        props.canDragItem,
        props.canToggleActive,
        props.canOverrideColor,
      ],
    );

    /* ───────── event firing ───────── */

    const propsRef = useRef(props);
    useEffect(() => {
      propsRef.current = props;
    });

    const reportPermissionDenied = useCallback(
      (
        action: keyof TodoPermissionRule,
        itemId: string,
        reason: TodoPermissionReason,
      ) => {
        propsRef.current.onPermissionDenied?.(action, itemId, reason);
      },
      [],
    );

    const fireEvent = useCallback(
      <K extends keyof TodoEventMap>(name: K, event: TodoEventMap[K]) => {
        const p = propsRef.current;
        switch (name) {
          case "change":
            p.onChange?.(event as TodoEventMap["change"]);
            break;
          case "fieldEdited":
            p.onFieldEdited?.(event as TodoEventMap["fieldEdited"]);
            break;
          case "statusChanged":
            p.onStatusChanged?.(event as TodoEventMap["statusChanged"]);
            break;
          case "itemAdded":
            p.onItemAdded?.(event as TodoEventMap["itemAdded"]);
            break;
          case "itemRemoved":
            p.onItemRemoved?.(event as TodoEventMap["itemRemoved"]);
            break;
          case "itemMoved":
            p.onItemMoved?.(event as TodoEventMap["itemMoved"]);
            break;
          case "colorOverridden":
            p.onColorOverridden?.(event as TodoEventMap["colorOverridden"]);
            break;
          case "activeToggled":
            p.onActiveToggled?.(event as TodoEventMap["activeToggled"]);
            break;
          case "lockedToggled":
            p.onLockedToggled?.(event as TodoEventMap["lockedToggled"]);
            break;
          case "copy":
            p.onCopy?.(event as TodoEventMap["copy"]);
            break;
          case "paste":
            p.onPaste?.(event as TodoEventMap["paste"]);
            break;
        }
      },
      [],
    );

    /* ───────── edit veto (single entry point for header/keyboard/handle) ───────── */

    const requestEdit = useCallback(
      (itemId: string, mode: "popup" | "inline") => {
        // Consult the veto BEFORE dispatching, so a vetoed edit never flash-opens.
        const veto = propsRef.current.onEditRequest?.({ itemId, mode });
        if (veto === false) return;
        dispatch({ type: "open-edit", itemId, mode });
      },
      [],
    );

    /* ───────── fire onChange after structural mutations ───────── */

    // A root change from reconciling an external `value` sets this flag so the
    // controlled consumer isn't notified of its own update (avoids double-fire).
    const suppressChangeRef = useRef(false);
    const initialMount = useRef(true);
    useEffect(() => {
      if (initialMount.current) {
        initialMount.current = false;
        return;
      }
      if (suppressChangeRef.current) {
        suppressChangeRef.current = false;
        return;
      }
      fireEvent("change", denormalize(state.root));
    }, [state.root, fireEvent]);

    /* ───────── controlled-mode reconcile ─────────
     * When `value` is provided the card is controlled. Reconcile ONLY on a
     * genuine external `value` change (deps = [value]); the echo guard skips
     * no-op syncs. `state.root` is read for comparison but deliberately NOT a
     * dep, so internal optimistic mutations don't revert themselves.
     */
    useEffect(() => {
      if (value === undefined) return;
      const incoming = JSON.stringify(denormalize(normalize(value).root));
      const current = JSON.stringify(denormalize(state.root));
      if (incoming === current) return;
      suppressChangeRef.current = true;
      dispatch({ type: "sync-tree", tree: value });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    /* ───────── context value ───────── */

    const ctxValue: TodoCardContextValue = useMemo(
      () => ({
        now: nowFactory,
        tick,
        ramp,
        dispatch,
        editState: state.edit,
        focusedId: state.focusedId,
        dirty: state.dirty,
        isCollapsed: (id: string) => state.collapsedIds.has(id),
        resolvePermissions,
        statusOptions,
        editable,
        showEditButton,
        fireEvent,
        requestEdit,
        reportPermissionDenied,
      }),
      [
        nowFactory,
        tick,
        ramp,
        state.edit,
        state.focusedId,
        state.dirty,
        state.collapsedIds,
        resolvePermissions,
        statusOptions,
        editable,
        showEditButton,
        fireEvent,
        requestEdit,
        reportPermissionDenied,
      ],
    );

    /* ───────── imperative handle ───────── */

    useImperativeHandle(
      ref,
      (): TodoRichCardHandle => ({
        getValue: () => JSON.stringify(denormalize(state.root), null, 2),
        getTree: () => denormalize(state.root),
        isDirty: () => state.dirty,
        markClean: () => dispatch({ type: "mark-clean" }),
        focusItem: (id) => dispatch({ type: "set-focus", itemId: id }),
        copy: async (itemId) => {
          const target = itemId ? findNode(state.root, itemId) : state.root;
          if (!target) return;
          await copyToClipboardFn(target.item);
          fireEvent("copy", { itemId: target.item.id, payload: target.item });
        },
        paste: async (parentId) => {
          const target = parentId
            ? findNode(state.root, parentId)
            : state.root;
          if (!target) return;
          const payload = await readFromClipboard();
          if (!payload) return;
          dispatch({
            type: "add-child",
            parentId: target.item.id,
            item: payload,
          });
          fireEvent("paste", { parentId: target.item.id, payload });
          fireEvent("itemAdded", { parentId: target.item.id, item: payload });
        },
        setBorderColor: (itemId, color) => {
          const target = findNode(state.root, itemId);
          if (!target) return;
          const oldColor = target.item.borderColor;
          dispatch({ type: "set-border-color", itemId, color });
          fireEvent("colorOverridden", {
            itemId,
            oldColor,
            newColor: color ?? undefined,
          });
        },
        toggleActive: (itemId) => {
          const target = findNode(state.root, itemId);
          if (!target) return;
          const oldActive = target.item.active;
          dispatch({ type: "toggle-active", itemId });
          fireEvent("activeToggled", {
            itemId,
            oldActive,
            newActive: !oldActive,
          });
        },
        setLocked: (itemId, locked) => {
          const target = findNode(state.root, itemId);
          if (!target) return;
          const oldLocked = Boolean(target.item.locked);
          dispatch({ type: "set-locked", itemId, locked });
          fireEvent("lockedToggled", {
            itemId,
            oldLocked,
            newLocked: locked,
          });
        },
        openEdit: (itemId, mode = "popup") => requestEdit(itemId, mode),
        closeEdit: () => dispatch({ type: "close-edit" }),
      }),
      [state.root, state.dirty, fireEvent, requestEdit],
    );

    /* ───────── root keyboard ───────── */

    const onKeyDown = useKeyboard({
      rootNode: state.root,
      focusedId: state.focusedId,
      editState: state.edit,
      editable,
      dispatch,
      resolvePermissions,
      fireCopy: (p) => fireEvent("copy", p),
      firePaste: (p) => fireEvent("paste", p),
      fireItemAdded: (p) => fireEvent("itemAdded", p),
      requestEdit,
      reportPermissionDenied,
    });

    return (
      <TodoCardContext.Provider value={ctxValue}>
        <section
          role="region"
          aria-label={ariaLabel ?? state.root.item.name}
          onKeyDown={onKeyDown}
          className={cn("w-full", className)}
        >
          <Card node={state.root} />
        </section>
      </TodoCardContext.Provider>
    );
  },
);

TodoRichCard.displayName = "TodoRichCard";
