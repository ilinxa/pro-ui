"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import type {
  FieldAddedEvent,
  FieldEditedEvent,
  FieldRemovedEvent,
  CardAddedEvent,
  CardRemovedEvent,
  CardRenamedEvent,
  FlatFieldValue,
  LevelStyle,
  PredefinedAddedEvent,
  PredefinedEditedEvent,
  PredefinedKey,
  PredefinedRemovedEvent,
  RichCardHandle,
  RichCardJsonNode,
  RichCardProps,
} from "./types";
import { parseInput, type ParseError, type RichCardTree } from "./lib/parse";
import { serializeTree, treeToJsonNode } from "./lib/serialize";
import {
  createInitialState,
  reducer,
  type DefaultCollapsed,
  type RichCardAction,
  type RichCardPredefinedEntry,
  type RichCardState,
} from "./lib/reducer";
import {
  validateCardRename,
  validateCardRemove,
  validateFieldAdd,
  validateFieldEditKey,
  validateFieldEditValue,
  validatePredefinedShape,
  type ValidationResult,
} from "./lib/validate-edit";
import type { FlatFieldType } from "./lib/infer-type";
import { useTreeKeyboard } from "./hooks/use-tree-keyboard";
import { useEditMode } from "./hooks/use-edit-mode";
import { isDirty as isDirtySelector } from "./hooks/use-dirty";
import { Card, type CardConfig, type EditDispatchers, type EditValidators } from "./parts/card";

/* ───────── default level styles ───────── */

const DEFAULT_LEVEL_STYLES: LevelStyle[] = [
  { containerClassName: "rounded-xl border border-border bg-card px-3 py-3 shadow-sm" },
  { containerClassName: "rounded-lg border border-border bg-muted/30 px-3 py-2.5" },
  { containerClassName: "rounded-md border border-border/70 bg-muted/20 px-2.5 py-2" },
  { containerClassName: "rounded-md border border-border/50 bg-muted/15 px-2 py-2" },
  { containerClassName: "rounded-sm border border-border/40 bg-muted/10 px-2 py-1.5" },
  { containerClassName: "rounded-sm border border-dashed border-border/30 px-2 py-1.5" },
];

function clampIndex(level: number, len: number): number {
  return Math.max(0, Math.min(level - 1, len - 1));
}

function makeErrorTree(message: string): RichCardTree {
  return {
    id: "rcc-error-root",
    order: 0,
    level: 1,
    fields: [{ key: "error", value: message, type: "string" }],
    predefined: [],
    children: [],
  };
}

function generateId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }
  return `rc-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

/* ───────── component ───────── */

export const RichCard = forwardRef<RichCardHandle, RichCardProps>(
  function RichCard(props, ref) {
    const {
      defaultValue,
      levelStyles,
      getLevelStyle,
      predefinedKeyStyles,
      defaultCollapsed = "none",
      metaPresentation = "hidden",
      disabledPredefinedKeys,
      dateDetection = "auto",
      editable = false,
      onChange,
      onFieldEdited,
      onFieldAdded,
      onFieldRemoved,
      onCardAdded,
      onCardRemoved,
      onCardRenamed,
      onPredefinedAdded,
      onPredefinedEdited,
      onPredefinedRemoved,
      onSelectionChange,
      className,
      "aria-label": ariaLabel = "Rich card",
    } = props;

    const initialState = useMemo(() => {
      const { tree, errors } = parseInput(defaultValue, {
        disabledPredefinedKeys: disabledPredefinedKeys ?? [],
        dateDetection,
      });
      logParseErrors(errors);
      const root =
        tree ??
        makeErrorTree("Invalid input — defaultValue must be a JSON object.");
      return createInitialState(root, defaultCollapsed as DefaultCollapsed);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [state, dispatch] = useReducer(reducer, initialState);
    const stateRef = useRef(state);
    useEffect(() => {
      stateRef.current = state;
    }, [state]);

    const { mode: editMode, setMode: setEditMode, clear: clearEditMode } =
      useEditMode();
    const [tentativeCardId, setTentativeCardId] = useState<string | null>(null);

    const disabledKeys = useMemo(
      () => disabledPredefinedKeys ?? [],
      [disabledPredefinedKeys],
    );

    /* ───────── event firing (post-commit) ───────── */

    const eventQueueRef = useRef<
      Array<{ action: RichCardAction; prevState: RichCardState }>
    >([]);

    const queueCommit = useCallback(
      (action: RichCardAction) => {
        eventQueueRef.current.push({ action, prevState: stateRef.current });
        dispatch(action);
      },
      [],
    );

    // Fire events after commit (version-change driven).
    const lastFiredVersionRef = useRef(state.version);
    useEffect(() => {
      if (state.version === lastFiredVersionRef.current) {
        // Drop any queued actions that didn't increment version (e.g. validation rejected at reducer or no-op).
        eventQueueRef.current = [];
        return;
      }
      lastFiredVersionRef.current = state.version;
      const queued = eventQueueRef.current;
      eventQueueRef.current = [];
      for (const { action, prevState } of queued) {
        fireGranularEvent(action, prevState, state, {
          onFieldEdited,
          onFieldAdded,
          onFieldRemoved,
          onCardAdded,
          onCardRemoved,
          onCardRenamed,
          onPredefinedAdded,
          onPredefinedEdited,
          onPredefinedRemoved,
        });
      }
      // Coarse onChange (always fired after granular).
      if (onChange) onChange(treeToJsonNode(state.tree));
    }, [
      state.version,
      state.tree,
      onChange,
      onFieldEdited,
      onFieldAdded,
      onFieldRemoved,
      onCardAdded,
      onCardRemoved,
      onCardRenamed,
      onPredefinedAdded,
      onPredefinedEdited,
      onPredefinedRemoved,
      state,
    ]);

    // Selection-change effect (fires whenever selectedId changes).
    const lastSelectedRef = useRef(state.selectedId);
    useEffect(() => {
      if (state.selectedId !== lastSelectedRef.current) {
        lastSelectedRef.current = state.selectedId;
        onSelectionChange?.(state.selectedId);
      }
    }, [state.selectedId, onSelectionChange]);

    /* ───────── styles ───────── */

    const resolveLevelStyle = useMemo(() => {
      if (getLevelStyle) return getLevelStyle;
      const arr =
        levelStyles && levelStyles.length > 0
          ? levelStyles
          : DEFAULT_LEVEL_STYLES;
      return (level: number) => arr[clampIndex(level, arr.length)];
    }, [getLevelStyle, levelStyles]);

    /* ───────── dispatchers (validate → commit) ───────── */

    const dispatchers: EditDispatchers = useMemo(
      () => ({
        fieldEditValue: (cardId, key, value, type) => {
          const r = validateFieldEditValue(
            stateRef.current,
            cardId,
            key,
            value,
            type,
          );
          if (!r.ok) return;
          queueCommit({
            type: "field-edit-value",
            cardId,
            key,
            value,
            valueType: type,
          });
          clearEditMode();
        },
        fieldEditKey: (cardId, oldKey, newKey) => {
          const r = validateFieldEditKey(
            stateRef.current,
            cardId,
            oldKey,
            newKey,
            disabledKeys,
          );
          if (!r.ok) return;
          queueCommit({ type: "field-edit-key", cardId, oldKey, newKey });
          clearEditMode();
        },
        fieldAdd: (cardId, key, value, type) => {
          const r = validateFieldAdd(
            stateRef.current,
            cardId,
            key,
            value,
            type,
            disabledKeys,
          );
          if (!r.ok) return;
          queueCommit({
            type: "field-add",
            cardId,
            key,
            value,
            valueType: type,
          });
          clearEditMode();
        },
        fieldRemove: (cardId, key) => {
          queueCommit({ type: "field-remove", cardId, key });
        },
        cardAdd: (parentId) => {
          const newId = generateId();
          const parent = findCardLocal(stateRef.current.tree, parentId);
          const order = parent
            ? parent.children.reduce((m, c) => Math.max(m, c.order), -1) + 1
            : 0;
          const newCard: RichCardTree = {
            id: newId,
            order,
            level: (parent?.level ?? 0) + 1,
            parentKey: "untitled",
            fields: [],
            predefined: [],
            children: [],
          };
          queueCommit({ type: "card-add", parentId, card: newCard });
          // Mark as tentative + auto-enter title edit
          setTentativeCardId(newId);
          setEditMode({ kind: "card-title", cardId: newId });
        },
        cardRemove: (cardId) => {
          const r = validateCardRemove(stateRef.current, cardId);
          if (!r.ok) return;
          queueCommit({ type: "card-remove", cardId });
          clearEditMode();
        },
        cardRename: (cardId, newKey) => {
          const r = validateCardRename(
            stateRef.current,
            cardId,
            newKey,
            disabledKeys,
          );
          if (!r.ok) return;
          queueCommit({ type: "card-rename", cardId, newParentKey: newKey });
          // Tentative card is now real
          if (tentativeCardId === cardId) setTentativeCardId(null);
          clearEditMode();
        },
        cardCancelTentative: (cardId) => {
          // Remove the tentative card without firing card-removed event.
          // For event consistency: just dispatch card-remove (the event fires);
          // hosts treat it like any cancel.
          queueCommit({ type: "card-remove", cardId });
          if (tentativeCardId === cardId) setTentativeCardId(null);
          clearEditMode();
        },
        predefinedAdd: (cardId, entry) => {
          const shape = validatePredefinedShape(entry.key, entry.value);
          if (!shape.ok) return;
          queueCommit({ type: "predefined-add", cardId, entry });
          // Auto-enter edit on the new entry so user can fill it in
          setEditMode({ kind: "predefined", cardId, key: entry.key });
        },
        predefinedEdit: (cardId, key, entry) => {
          const shape = validatePredefinedShape(entry.key, entry.value);
          if (!shape.ok) return;
          queueCommit({ type: "predefined-edit", cardId, key, entry });
          clearEditMode();
        },
        predefinedRemove: (cardId, key) => {
          queueCommit({ type: "predefined-remove", cardId, key });
        },
        selectCard: (id) => {
          dispatch({ type: "set-selection", id });
        },
      }),
      // disabledKeys is stable per render via stateRef + reactive dep,
      // queueCommit is stable, clearEditMode/setEditMode are stable callbacks.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [queueCommit, clearEditMode, setEditMode, tentativeCardId],
    );

    const validators: EditValidators = useMemo(
      () => ({
        fieldEditValue: (cardId, key, value, type) =>
          validateFieldEditValue(stateRef.current, cardId, key, value, type),
        fieldEditKey: (cardId, oldKey, newKey) =>
          validateFieldEditKey(
            stateRef.current,
            cardId,
            oldKey,
            newKey,
            disabledKeys,
          ),
        fieldAdd: (cardId, key, value, type) =>
          validateFieldAdd(
            stateRef.current,
            cardId,
            key,
            value,
            type,
            disabledKeys,
          ),
        cardRename: (cardId, newKey) =>
          validateCardRename(stateRef.current, cardId, newKey, disabledKeys),
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    );

    /* ───────── config + keyboard ───────── */

    const config: CardConfig = useMemo(
      () => ({
        resolveLevelStyle,
        predefinedKeyStyles,
        metaPresentation,
        rootTitle: ariaLabel,
        disabledPredefinedKeys: disabledKeys,
        editable,
        editMode,
        setEditMode,
        clearEditMode,
        tentativeCardId,
        dispatchers,
        validators,
      }),
      [
        resolveLevelStyle,
        predefinedKeyStyles,
        metaPresentation,
        ariaLabel,
        disabledKeys,
        editable,
        editMode,
        setEditMode,
        clearEditMode,
        tentativeCardId,
        dispatchers,
        validators,
      ],
    );

    const onKeyDown = useTreeKeyboard(state, dispatch, editMode);

    /* ───────── imperative handle ───────── */

    useImperativeHandle(
      ref,
      (): RichCardHandle => ({
        getValue: () => serializeTree(state.tree),
        getTree: () => treeToJsonNode(state.tree) as RichCardJsonNode,
        isDirty: () => isDirtySelector(state),
        markClean: () => dispatch({ type: "mark-clean" }),
        getSelectedId: () => state.selectedId,
      }),
      [state],
    );

    return (
      <div
        role="region"
        aria-label={ariaLabel}
        className={cn("w-full", className)}
        onClick={(e) => {
          // Click outside any card → clear selection
          if (e.target === e.currentTarget) {
            dispatch({ type: "set-selection", id: null });
          }
        }}
      >
        <ul
          role="tree"
          aria-label={ariaLabel}
          onKeyDown={onKeyDown}
          className="block list-none p-0 m-0"
        >
          <Card
            tree={state.tree}
            config={config}
            state={state}
            dispatch={dispatch}
          />
        </ul>
      </div>
    );
  },
);

/* ───────── helpers ───────── */

function findCardLocal(
  tree: RichCardTree,
  id: string,
): RichCardTree | null {
  if (tree.id === id) return tree;
  for (const child of tree.children) {
    const found = findCardLocal(child, id);
    if (found) return found;
  }
  return null;
}

function logParseErrors(errors: ParseError[]): void {
  if (errors.length === 0) return;
  for (const err of errors) {
    console.warn(
      `[rich-card] ${err.path ? `at ${err.path}: ` : ""}${err.message}`,
    );
  }
  if (errors.length > 1) {
    console.error(
      `[rich-card] ${errors.length} parse issues; tree rendered best-effort.`,
    );
  }
}

/* ───────── granular event firing ───────── */

type EventHandlers = {
  onFieldEdited?: (e: FieldEditedEvent) => void;
  onFieldAdded?: (e: FieldAddedEvent) => void;
  onFieldRemoved?: (e: FieldRemovedEvent) => void;
  onCardAdded?: (e: CardAddedEvent) => void;
  onCardRemoved?: (e: CardRemovedEvent) => void;
  onCardRenamed?: (e: CardRenamedEvent) => void;
  onPredefinedAdded?: (e: PredefinedAddedEvent) => void;
  onPredefinedEdited?: (e: PredefinedEditedEvent) => void;
  onPredefinedRemoved?: (e: PredefinedRemovedEvent) => void;
};

function fireGranularEvent(
  action: RichCardAction,
  prev: RichCardState,
  next: RichCardState,
  h: EventHandlers,
) {
  switch (action.type) {
    case "field-edit-value": {
      const prevCard = findCardLocal(prev.tree, action.cardId);
      const prevField = prevCard?.fields.find((f) => f.key === action.key);
      if (!prevField) return;
      h.onFieldEdited?.({
        cardId: action.cardId,
        key: action.key,
        oldValue: prevField.value,
        oldType: prevField.type,
        newValue: action.value,
        newType: action.valueType,
      });
      return;
    }
    case "field-edit-key": {
      const prevCard = findCardLocal(prev.tree, action.cardId);
      const prevField = prevCard?.fields.find((f) => f.key === action.oldKey);
      if (!prevField) return;
      // Treat rename as edit + add? Cleanest: emit field-edited with same value but new key context.
      // For v0.2 simplicity, fire onFieldEdited with the rename.
      h.onFieldEdited?.({
        cardId: action.cardId,
        key: action.newKey,
        oldValue: prevField.value,
        oldType: prevField.type,
        newValue: prevField.value,
        newType: prevField.type,
      });
      return;
    }
    case "field-add": {
      h.onFieldAdded?.({
        cardId: action.cardId,
        key: action.key,
        value: action.value,
        type: action.valueType,
      });
      return;
    }
    case "field-remove": {
      const prevCard = findCardLocal(prev.tree, action.cardId);
      const prevField = prevCard?.fields.find((f) => f.key === action.key);
      if (!prevField) return;
      h.onFieldRemoved?.({
        cardId: action.cardId,
        key: action.key,
        oldValue: prevField.value,
        oldType: prevField.type,
      });
      return;
    }
    case "card-add": {
      h.onCardAdded?.({
        parentId: action.parentId,
        card: treeToJsonNode(action.card) as RichCardJsonNode,
      });
      return;
    }
    case "card-remove": {
      const prevSubtree = findCardLocal(prev.tree, action.cardId);
      if (!prevSubtree) return;
      const parentId = findParentIdLocal(prev.tree, action.cardId);
      h.onCardRemoved?.({
        cardId: action.cardId,
        removed: treeToJsonNode(prevSubtree) as RichCardJsonNode,
        parentId,
      });
      return;
    }
    case "card-rename": {
      const prevCard = findCardLocal(prev.tree, action.cardId);
      h.onCardRenamed?.({
        cardId: action.cardId,
        oldKey: prevCard?.parentKey,
        newKey: action.newParentKey,
      });
      return;
    }
    case "predefined-add": {
      h.onPredefinedAdded?.({
        cardId: action.cardId,
        key: action.entry.key,
        value: action.entry.value,
      });
      return;
    }
    case "predefined-edit": {
      const prevCard = findCardLocal(prev.tree, action.cardId);
      const prevEntry = prevCard?.predefined.find((p) => p.key === action.key);
      h.onPredefinedEdited?.({
        cardId: action.cardId,
        key: action.key,
        oldValue: prevEntry?.value ?? null,
        newValue: action.entry.value,
      });
      return;
    }
    case "predefined-remove": {
      const prevCard = findCardLocal(prev.tree, action.cardId);
      const prevEntry = prevCard?.predefined.find((p) => p.key === action.key);
      h.onPredefinedRemoved?.({
        cardId: action.cardId,
        key: action.key,
        oldValue: prevEntry?.value ?? null,
      });
      return;
    }
    default:
      // toggle-collapse, set-focus, set-selection, mark-clean, replace-tree — no granular event
      return;
  }
  // Reference unused FlatFieldValue / PredefinedKey imports for type-checking only
  void (undefined as unknown as FlatFieldValue);
  void (undefined as unknown as PredefinedKey);
  void (undefined as unknown as FlatFieldType);
  void (undefined as unknown as RichCardPredefinedEntry);
}

function findParentIdLocal(
  tree: RichCardTree,
  id: string,
): string | null {
  if (tree.id === id) return null;
  for (const child of tree.children) {
    if (child.id === id) return tree.id;
    const inner = findParentIdLocal(child, id);
    if (inner) return inner;
  }
  return null;
}

// Reference imports used only for types
void (undefined as unknown as ValidationResult);
