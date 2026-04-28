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
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import type {
  CardAddedEvent,
  CardDuplicatedEvent,
  CardMovedEvent,
  CardRemovedEvent,
  CardRenamedEvent,
  CustomPredefinedKey,
  EffectivePermissions,
  FieldAddedEvent,
  FieldEditedEvent,
  FieldRemovedEvent,
  LevelStyle,
  MetaAddedEvent,
  MetaChangedEvent,
  MetaRemovedEvent,
  PredefinedAddedEvent,
  PredefinedEditedEvent,
  PredefinedKey,
  PredefinedRemovedEvent,
  RichCardHandle,
  RichCardJsonNode,
  RichCardProps,
  SearchMatch,
  SearchOptions,
} from "./types";
import { parseInput, type ParseError, type RichCardTree } from "./lib/parse";
import { serializeTree, treeToJsonNode } from "./lib/serialize";
import {
  createInitialState,
  findAncestorIds,
  findCard,
  findParentId,
  reducer,
  visibleIdsInOrder,
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
  validateMetaAdd,
  validateMetaEdit,
  validatePredefinedShape,
} from "./lib/validate-edit";
import {
  runHostValidators,
  type AnyChangeEvent,
  type ValidatorKey,
} from "./lib/validators";
import type { FlatFieldType } from "./lib/infer-type";
import { useTreeKeyboard } from "./hooks/use-tree-keyboard";
import { useEditMode } from "./hooks/use-edit-mode";
import { isDirty as isDirtySelector } from "./hooks/use-dirty";
import { usePermissions } from "./hooks/use-permissions";
import { useDndSensors, collisionStrategy } from "./hooks/use-dnd-config";
import { useSearch } from "./hooks/use-search";
import { useUndo } from "./hooks/use-undo";
import { Card, type CardConfig, type EditDispatchers, type EditValidators } from "./parts/card";
import { EmptyTreePlaceholder } from "./parts/empty-tree";

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

function logParseErrors(errors: ParseError[]): void {
  if (errors.length === 0) return;
  for (const err of errors) {
    console.warn(
      `[rich-card] ${err.path ? `at ${err.path}: ` : ""}${err.message}`,
    );
  }
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
      // v0.3
      dndScopes,
      onCardMoved,
      onCardDuplicated,
      permissions,
      canEditField,
      canAddField,
      canRemoveField,
      canEditCard,
      canAddCard,
      canRemoveCard,
      canEditPredefined,
      canAddPredefined,
      canRemovePredefined,
      canDragCard,
      canDropCard,
      onPermissionDenied,
      customPredefinedKeys,
      allowRootRemoval = false,
      onRootRemoved,
      defaultDeletePolicy = "cascade",
      promoteCollisionStrategy = "suffix",
      emptyTreeRenderer,
      metaRenderers,
      auditTrail,
      onMetaChanged,
      onMetaAdded,
      onMetaRemoved,
      search,
      onSearchResults,
      validators: hostValidators,
      validate,
      onValidationFailed,
      maxUndoDepth = 50,
      disableUndoShortcuts = false,
      onUndo,
      onRedo,
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
        tree ?? makeErrorTree("Invalid input — defaultValue must be a JSON object.");
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
    const [emptyRoot, setEmptyRoot] = useState(false);

    const disabledKeys = useMemo(
      () => disabledPredefinedKeys ?? [],
      [disabledPredefinedKeys],
    );

    /* ───────── permissions ───────── */

    const perms = usePermissions(
      state.tree,
      editable,
      permissions,
      {
        canEditField,
        canAddField,
        canRemoveField,
        canEditCard,
        canAddCard,
        canRemoveCard,
        canEditPredefined,
        canAddPredefined,
        canRemovePredefined,
        canDragCard,
        canDropCard,
      },
      onPermissionDenied,
    );

    /* ───────── search ───────── */

    const searchResult = useSearch(
      state,
      dispatch,
      search,
      customPredefinedKeys,
      onSearchResults,
    );

    /* ───────── validation gate (v0.4) ───────── */

    const gateValidation = useCallback(
      (
        validatorKey: ValidatorKey,
        event: AnyChangeEvent,
        actionType: string,
        cardId: string | undefined,
      ): boolean => {
        if (!hostValidators && !validate) return true;
        const treeJson = treeToJsonNode(stateRef.current.tree) as RichCardJsonNode;
        const result = runHostValidators(
          validatorKey,
          event,
          actionType,
          cardId,
          treeJson,
          hostValidators,
          validate,
        );
        if (!result.ok) {
          onValidationFailed?.({
            action: actionType,
            cardId,
            errors: result.errors,
            layer: result.layer,
          });
          return false;
        }
        return true;
      },
      [hostValidators, validate, onValidationFailed],
    );

    /* ───────── undo/redo (v0.4) ───────── */

    // Sync maxUndoDepth prop into reducer state
    useEffect(() => {
      dispatch({ type: "set-max-undo-depth", depth: maxUndoDepth });
    }, [maxUndoDepth]);

    /* ───────── event firing ───────── */

    const eventQueueRef = useRef<
      Array<{ action: RichCardAction; prevState: RichCardState }>
    >([]);

    const queueCommit = useCallback((action: RichCardAction) => {
      eventQueueRef.current.push({ action, prevState: stateRef.current });
      dispatch(action);
    }, []);

    const lastFiredVersionRef = useRef(state.version);
    useEffect(() => {
      if (state.version === lastFiredVersionRef.current) {
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
          onCardMoved,
          onCardDuplicated,
          onMetaChanged,
          onMetaAdded,
          onMetaRemoved,
        });
      }
      if (onChange) onChange(treeToJsonNode(state.tree));
    }, [
      state.version,
      state.tree,
      state,
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
      onCardMoved,
      onCardDuplicated,
      onMetaChanged,
      onMetaAdded,
      onMetaRemoved,
    ]);

    // Multi-selection change effect
    const lastSelectedIdsRef = useRef(state.selectedIds);
    useEffect(() => {
      if (state.selectedIds !== lastSelectedIdsRef.current) {
        lastSelectedIdsRef.current = state.selectedIds;
        onSelectionChange?.(Array.from(state.selectedIds));
      }
    }, [state.selectedIds, onSelectionChange]);

    /* ───────── styles ───────── */

    const resolveLevelStyle = useMemo(() => {
      if (getLevelStyle) return getLevelStyle;
      const arr =
        levelStyles && levelStyles.length > 0 ? levelStyles : DEFAULT_LEVEL_STYLES;
      return (level: number) => arr[clampIndex(level, arr.length)];
    }, [getLevelStyle, levelStyles]);

    /* ───────── dispatchers ───────── */

    const dispatchers: EditDispatchers = useMemo(
      () => ({
        fieldEditValue: (cardId, key, value, type) => {
          if (!perms.canEditField(cardId, key)) return;
          const r = validateFieldEditValue(stateRef.current, cardId, key, value, type);
          if (!r.ok) return;
          const oldField = findCard(stateRef.current.tree, cardId)?.fields.find(
            (f) => f.key === key,
          );
          if (!oldField) return;
          if (
            !gateValidation(
              "fieldEdit",
              {
                cardId,
                key,
                oldValue: oldField.value,
                oldType: oldField.type,
                newValue: value,
                newType: type,
              },
              "field-edit-value",
              cardId,
            )
          )
            return;
          queueCommit({
            type: "field-edit-value",
            cardId,
            key,
            value,
            valueType: type,
          });
          stampAuditTrail(queueCommit, stateRef.current, cardId, auditTrail);
          clearEditMode();
        },
        fieldEditKey: (cardId, oldKey, newKey) => {
          if (!perms.canEditField(cardId, oldKey)) return;
          const r = validateFieldEditKey(
            stateRef.current,
            cardId,
            oldKey,
            newKey,
            disabledKeys,
          );
          if (!r.ok) return;
          const oldField = findCard(stateRef.current.tree, cardId)?.fields.find(
            (f) => f.key === oldKey,
          );
          if (!oldField) return;
          if (
            !gateValidation(
              "fieldEdit",
              {
                cardId,
                key: newKey,
                oldValue: oldField.value,
                oldType: oldField.type,
                newValue: oldField.value,
                newType: oldField.type,
              },
              "field-edit-key",
              cardId,
            )
          )
            return;
          queueCommit({ type: "field-edit-key", cardId, oldKey, newKey });
          stampAuditTrail(queueCommit, stateRef.current, cardId, auditTrail);
          clearEditMode();
        },
        fieldAdd: (cardId, key, value, type) => {
          if (!perms.canAddField(cardId)) return;
          const r = validateFieldAdd(
            stateRef.current,
            cardId,
            key,
            value,
            type,
            disabledKeys,
          );
          if (!r.ok) return;
          if (
            !gateValidation(
              "fieldAdd",
              { cardId, key, value, type },
              "field-add",
              cardId,
            )
          )
            return;
          queueCommit({ type: "field-add", cardId, key, value, valueType: type });
          stampAuditTrail(queueCommit, stateRef.current, cardId, auditTrail);
          clearEditMode();
        },
        fieldRemove: (cardId, key) => {
          if (!perms.canRemoveField(cardId, key)) return;
          const oldField = findCard(stateRef.current.tree, cardId)?.fields.find(
            (f) => f.key === key,
          );
          if (!oldField) return;
          if (
            !gateValidation(
              "fieldRemove",
              { cardId, key, oldValue: oldField.value, oldType: oldField.type },
              "field-remove",
              cardId,
            )
          )
            return;
          queueCommit({ type: "field-remove", cardId, key });
          stampAuditTrail(queueCommit, stateRef.current, cardId, auditTrail);
        },
        cardAdd: (parentId) => {
          if (!perms.canAddCard(parentId)) return;
          const newId = generateId();
          const parent = findCard(stateRef.current.tree, parentId);
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
          if (
            !gateValidation(
              "cardAdd",
              {
                parentId,
                card: treeToJsonNode(newCard) as RichCardJsonNode,
              },
              "card-add",
              parentId,
            )
          )
            return;
          queueCommit({ type: "card-add", parentId, card: newCard });
          setTentativeCardId(newId);
          setEditMode({ kind: "card-title", cardId: newId });
        },
        cardRemove: (cardId, policy) => {
          if (!perms.canRemoveCard(cardId)) return;
          const isRoot = stateRef.current.tree.id === cardId;
          if (isRoot) {
            if (!allowRootRemoval) return;
            const currentJson = treeToJsonNode(stateRef.current.tree);
            const newRoot = onRootRemoved
              ? onRootRemoved(currentJson)
              : null;
            if (newRoot === null) {
              setEmptyRoot(true);
              // We don't actually mutate state here — empty-tree placeholder takes over rendering
            } else {
              const { tree } = parseInput(newRoot, {
                disabledPredefinedKeys: disabledKeys,
                dateDetection,
              });
              if (tree) {
                queueCommit({ type: "replace-tree", tree });
                setEmptyRoot(false);
              }
            }
            return;
          }
          const r = validateCardRemove(stateRef.current, cardId);
          if (!r.ok) return;
          const removingCard = findCard(stateRef.current.tree, cardId);
          if (!removingCard) return;
          const parentIdForEvent = findParentId(stateRef.current.tree, cardId);
          if (
            !gateValidation(
              "cardRemove",
              {
                cardId,
                removed: treeToJsonNode(removingCard) as RichCardJsonNode,
                parentId: parentIdForEvent,
              },
              "card-remove",
              cardId,
            )
          )
            return;
          queueCommit({
            type: "card-remove",
            cardId,
            policy: policy ?? defaultDeletePolicy,
            collisionStrategy: promoteCollisionStrategy,
          });
          clearEditMode();
        },
        cardRename: (cardId, newKey) => {
          if (!perms.canEditCard(cardId)) return;
          const r = validateCardRename(stateRef.current, cardId, newKey, disabledKeys);
          if (!r.ok) return;
          const oldKey = findCard(stateRef.current.tree, cardId)?.parentKey;
          if (
            !gateValidation(
              "cardRename",
              { cardId, oldKey, newKey },
              "card-rename",
              cardId,
            )
          )
            return;
          queueCommit({ type: "card-rename", cardId, newParentKey: newKey });
          stampAuditTrail(queueCommit, stateRef.current, cardId, auditTrail);
          if (tentativeCardId === cardId) setTentativeCardId(null);
          clearEditMode();
        },
        cardCancelTentative: (cardId) => {
          queueCommit({ type: "card-remove", cardId, policy: "cascade" });
          if (tentativeCardId === cardId) setTentativeCardId(null);
          clearEditMode();
        },
        cardDuplicate: (cardId) => {
          if (!perms.canEditCard(cardId)) return;
          const newCardId = generateId();
          const parentForEvent = findParentId(stateRef.current.tree, cardId);
          if (
            !gateValidation(
              "cardDuplicate",
              {
                sourceCardId: cardId,
                newCardId,
                parentId: parentForEvent ?? "",
              },
              "card-duplicate",
              cardId,
            )
          )
            return;
          queueCommit({ type: "card-duplicate", cardId, newCardId });
        },
        predefinedAdd: (cardId, entry) => {
          if (!perms.canAddPredefined(cardId, String(entry.key))) return;
          const shape = validatePredefinedShape(entry.key as PredefinedKey, entry.value);
          if (!shape.ok) return;
          if (
            !gateValidation(
              "predefinedAdd",
              { cardId, key: entry.key, value: entry.value },
              "predefined-add",
              cardId,
            )
          )
            return;
          queueCommit({ type: "predefined-add", cardId, entry });
          stampAuditTrail(queueCommit, stateRef.current, cardId, auditTrail);
          setEditMode({ kind: "predefined", cardId, key: entry.key as PredefinedKey });
        },
        predefinedEdit: (cardId, key, entry) => {
          if (!perms.canEditPredefined(cardId, String(key))) return;
          const shape = validatePredefinedShape(entry.key as PredefinedKey, entry.value);
          if (!shape.ok) return;
          const oldEntry = findCard(stateRef.current.tree, cardId)?.predefined.find(
            (p) => p.key === key,
          );
          if (
            !gateValidation(
              "predefinedEdit",
              {
                cardId,
                key,
                oldValue: oldEntry?.value ?? null,
                newValue: entry.value,
              },
              "predefined-edit",
              cardId,
            )
          )
            return;
          queueCommit({ type: "predefined-edit", cardId, key, entry });
          stampAuditTrail(queueCommit, stateRef.current, cardId, auditTrail);
          clearEditMode();
        },
        predefinedRemove: (cardId, key) => {
          if (!perms.canRemovePredefined(cardId, String(key))) return;
          const oldEntry = findCard(stateRef.current.tree, cardId)?.predefined.find(
            (p) => p.key === key,
          );
          if (
            !gateValidation(
              "predefinedRemove",
              { cardId, key, oldValue: oldEntry?.value ?? null },
              "predefined-remove",
              cardId,
            )
          )
            return;
          queueCommit({ type: "predefined-remove", cardId, key });
          stampAuditTrail(queueCommit, stateRef.current, cardId, auditTrail);
        },
        metaEdit: (cardId, key, value) => {
          const r = validateMetaEdit(stateRef.current, cardId, key, value);
          if (!r.ok) return;
          const oldValue =
            findCard(stateRef.current.tree, cardId)?.meta?.[key] ?? null;
          if (
            !gateValidation(
              "metaEdit",
              { cardId, key, oldValue, newValue: value },
              "meta-edit",
              cardId,
            )
          )
            return;
          queueCommit({ type: "meta-edit", cardId, key, value });
        },
        metaAdd: (cardId, key, value) => {
          const r = validateMetaAdd(stateRef.current, cardId, key, value);
          if (!r.ok) return;
          if (
            !gateValidation(
              "metaAdd",
              { cardId, key, value },
              "meta-add",
              cardId,
            )
          )
            return;
          queueCommit({ type: "meta-add", cardId, key, value });
        },
        metaRemove: (cardId, key) => {
          const oldValue =
            findCard(stateRef.current.tree, cardId)?.meta?.[key] ?? null;
          if (
            !gateValidation(
              "metaRemove",
              { cardId, key, oldValue },
              "meta-remove",
              cardId,
            )
          )
            return;
          queueCommit({ type: "meta-remove", cardId, key });
        },
        selectCard: (cardId, event) => {
          if (event.shiftKey) {
            dispatch({ type: "extend-selection-to", id: cardId });
          } else if (event.metaKey || event.ctrlKey) {
            dispatch({ type: "toggle-selection", id: cardId });
          } else {
            dispatch({ type: "set-multi-selection", ids: [cardId], anchor: cardId });
          }
        },
      }),
      [
        queueCommit,
        clearEditMode,
        setEditMode,
        tentativeCardId,
        perms,
        disabledKeys,
        defaultDeletePolicy,
        promoteCollisionStrategy,
        allowRootRemoval,
        onRootRemoved,
        dateDetection,
        auditTrail,
        gateValidation,
      ],
    );

    const validators: EditValidators = useMemo(
      () => ({
        fieldEditValue: (cardId, key, value, type) =>
          validateFieldEditValue(stateRef.current, cardId, key, value, type),
        fieldEditKey: (cardId, oldKey, newKey) =>
          validateFieldEditKey(stateRef.current, cardId, oldKey, newKey, disabledKeys),
        fieldAdd: (cardId, key, value, type) =>
          validateFieldAdd(stateRef.current, cardId, key, value, type, disabledKeys),
        cardRename: (cardId, newKey) =>
          validateCardRename(stateRef.current, cardId, newKey, disabledKeys),
        metaEdit: (cardId, key, value) =>
          validateMetaEdit(stateRef.current, cardId, key, value),
        metaAdd: (cardId, key, value) =>
          validateMetaAdd(stateRef.current, cardId, key, value),
      }),
      [disabledKeys],
    );

    /* ───────── DnD handlers ───────── */

    const dndEnabled =
      editable &&
      ((dndScopes?.sameLevel ?? true) || (dndScopes?.crossLevel ?? true));

    const sortableIds = useMemo(
      () => visibleIdsInOrder(state.tree, state.collapsed).filter((id) => id !== state.tree.id),
      [state.tree, state.collapsed],
    );

    const handleDragStart = useCallback(
      (event: DragStartEvent) => {
        const id = String(event.active.id);
        dispatch({ type: "drag-start", cardId: id });
      },
      [],
    );

    const handleDragEnd = useCallback(
      (event: DragEndEvent) => {
        dispatch({ type: "drag-end" });
        const { active, over } = event;
        if (!over) return;
        const activeId = String(active.id);
        const overId = String(over.id);
        if (activeId === overId) return;

        // Determine drop semantics: if over is the same parent's sibling → same-level reorder;
        // otherwise → cross-level reparent.
        const tree = stateRef.current.tree;
        const sourceParent = findParentId(tree, activeId);
        const overParent = findParentId(tree, overId);
        if (sourceParent === null) return; // can't drag root

        // Check permissions
        if (!perms.canDragCard(activeId)) return;

        let newParentId: string;
        let newOrder: number;

        if (sourceParent === overParent) {
          // Same-level reorder
          if (!(dndScopes?.sameLevel ?? true)) return;
          const overCard = findCard(tree, overId);
          if (!overCard) return;
          newParentId = overParent;
          newOrder = overCard.order + 0.5;
        } else {
          // Cross-level reparent (drop into target as last child)
          if (!(dndScopes?.crossLevel ?? true)) return;
          if (!perms.canDropCard(activeId, overId)) return;
          // Cycle check
          const targetAncestors = findAncestorIds(tree, overId);
          if (targetAncestors.includes(activeId) || activeId === overId) return;
          newParentId = overId;
          const overCard = findCard(tree, overId);
          if (!overCard) return;
          newOrder =
            overCard.children.reduce((m, c) => Math.max(m, c.order), -1) + 1;
        }

        queueCommit({
          type: "card-move",
          cardId: activeId,
          newParentId,
          newOrder,
        });
      },
      [perms, dndScopes, queueCommit],
    );

    /* ───────── config ───────── */

    const config: CardConfig = useMemo(
      () => ({
        resolveLevelStyle,
        predefinedKeyStyles,
        metaPresentation,
        metaRenderers,
        rootTitle: ariaLabel,
        disabledPredefinedKeys: disabledKeys,
        editable,
        editMode,
        setEditMode,
        clearEditMode,
        tentativeCardId,
        // eslint-disable-next-line react-hooks/refs
        dispatchers,
        // eslint-disable-next-line react-hooks/refs
        validators,
        perms,
        allowRootRemoval,
        defaultDeletePolicy,
        searchMatches: searchResult.matches,
        searchQuery: search?.query ?? "",
        searchCaseSensitive: search?.caseSensitive ?? false,
        dndEnabled,
      }),
      [
        resolveLevelStyle,
        predefinedKeyStyles,
        metaPresentation,
        metaRenderers,
        ariaLabel,
        disabledKeys,
        editable,
        editMode,
        setEditMode,
        clearEditMode,
        tentativeCardId,
        dispatchers,
        validators,
        perms,
        allowRootRemoval,
        defaultDeletePolicy,
        searchResult.matches,
        search?.query,
        search?.caseSensitive,
        dndEnabled,
      ],
    );

    const onKeyDown = useTreeKeyboard(state, dispatch, editMode);

    /* ───────── undo/redo (v0.4) ───────── */

    const rootContainerRef = useRef<HTMLDivElement | null>(null);
    const undoApi = useUndo(state, dispatch, {
      enableShortcuts: !disableUndoShortcuts,
      rootRef: rootContainerRef,
      onUndo,
      onRedo,
    });

    /* ───────── imperative handle ───────── */

    useImperativeHandle(
      ref,
      (): RichCardHandle => ({
        getValue: () => serializeTree(state.tree),
        getTree: () => treeToJsonNode(state.tree) as RichCardJsonNode,
        isDirty: () => isDirtySelector(state),
        markClean: () => dispatch({ type: "mark-clean" }),
        getSelectedId: () =>
          state.selectedIds.size > 0 ? Array.from(state.selectedIds)[0] ?? null : null,
        getSelectedIds: () => Array.from(state.selectedIds),
        setSelection: (ids) => {
          if (ids === null) {
            dispatch({ type: "clear-selection" });
            return;
          }
          const arr = typeof ids === "string" ? [ids] : Array.from(ids);
          dispatch({
            type: "set-multi-selection",
            ids: arr,
            anchor: arr[arr.length - 1] ?? null,
          });
        },
        focusCard: (id) => {
          dispatch({ type: "set-focus", id });
          requestAnimationFrame(() => {
            document.querySelector<HTMLElement>(`[data-rcid="${id}"]`)?.focus();
          });
        },
        addCardAt: (parentId) => {
          const newId = generateId();
          const parent = findCard(state.tree, parentId);
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
          return newId;
        },
        removeCard: (id) => {
          queueCommit({ type: "card-remove", cardId: id, policy: "cascade" });
        },
        replaceRoot: (newRoot) => {
          if (newRoot === null) {
            setEmptyRoot(true);
            return;
          }
          const { tree } = parseInput(newRoot, {
            disabledPredefinedKeys: disabledKeys,
            dateDetection,
          });
          if (tree) {
            queueCommit({ type: "replace-tree", tree });
            setEmptyRoot(false);
          }
        },
        getEffectivePermissions: (cardId, target) => {
          const card = findCard(state.tree, cardId);
          if (!card) {
            return {
              edit: false,
              add: false,
              remove: false,
              reorder: false,
              reparent: false,
            } as EffectivePermissions;
          }
          return perms.getEffective({
            cardId,
            level: card.level,
            kind: target?.kind ?? "card",
            key: target?.key,
          });
        },
        findNext: () => findNextMatch(state, searchResult, dispatch),
        findPrevious: () => findPrevMatch(state, searchResult, dispatch),
        scrollToMatch: (match) => {
          dispatch({ type: "set-active-match-index", index: searchResult.matches.indexOf(match) });
          requestAnimationFrame(() => {
            document
              .querySelector<HTMLElement>(`[data-rcid="${match.cardId}"]`)
              ?.scrollIntoView({ block: "center", behavior: "smooth" });
          });
        },
        clearSearch: () => {
          dispatch({ type: "clear-search" });
        },
        // v0.4
        undo: () => undoApi.undo(),
        redo: () => undoApi.redo(),
        canUndo: () => undoApi.canUndo,
        canRedo: () => undoApi.canRedo,
        clearHistory: () => undoApi.clearHistory(),
      }),
      [state, perms, searchResult, queueCommit, disabledKeys, dateDetection, undoApi],
    );

    /* ───────── render ───────── */

    if (emptyRoot) {
      return (
        <div role="region" aria-label={ariaLabel} className={cn("w-full", className)}>
          {emptyTreeRenderer ? (
            emptyTreeRenderer()
          ) : (
            <EmptyTreePlaceholder
              onAddRoot={
                editable
                  ? () => {
                      // Build a minimal new root and replace
                      const newRoot: RichCardJsonNode = {
                        title: "untitled",
                      };
                      const { tree } = parseInput(newRoot, {
                        disabledPredefinedKeys: disabledKeys,
                        dateDetection,
                      });
                      if (tree) {
                        dispatch({ type: "replace-tree", tree });
                        setEmptyRoot(false);
                      }
                    }
                  : undefined
              }
            />
          )}
        </div>
      );
    }

    const treeContent = (
      <ul
        role="tree"
        aria-label={ariaLabel}
        aria-multiselectable={editable ? "true" : undefined}
        onKeyDown={onKeyDown}
        className="block list-none p-0 m-0"
      >
        <Card tree={state.tree} config={config} state={state} dispatch={dispatch} />
      </ul>
    );

    return (
      <div
        ref={rootContainerRef}
        role="region"
        aria-label={ariaLabel}
        tabIndex={-1}
        className={cn("w-full focus:outline-none", className)}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            dispatch({ type: "clear-selection" });
          }
        }}
      >
        {dndEnabled ? (
          <DndContextWrapper
            sortableIds={sortableIds}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {treeContent}
          </DndContextWrapper>
        ) : (
          treeContent
        )}
      </div>
    );
  },
);

/* ───────── DnD wrapper (only mounts sensors when needed) ───────── */

function DndContextWrapper({
  sortableIds,
  onDragStart,
  onDragEnd,
  children,
}: {
  sortableIds: string[];
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  children: React.ReactNode;
}) {
  const sensors = useDndSensors();
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionStrategy}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

/* ───────── audit trail helper ───────── */

function stampAuditTrail(
  queueCommit: (action: RichCardAction) => void,
  state: RichCardState,
  cardId: string,
  auditTrail: { editor?: string; lastEditedKey?: string; lastEditorKey?: string } | undefined,
): void {
  if (!auditTrail) return;
  const lastEditedKey = auditTrail.lastEditedKey ?? "_lastEdited";
  const lastEditorKey = auditTrail.lastEditorKey ?? "_lastEditor";
  const card = findCard(state.tree, cardId);
  if (!card) return;
  const now = new Date().toISOString();
  if (card.meta?.[lastEditedKey] !== now) {
    queueCommit({ type: "meta-edit", cardId, key: lastEditedKey, value: now });
  }
  if (auditTrail.editor && card.meta?.[lastEditorKey] !== auditTrail.editor) {
    queueCommit({
      type: "meta-edit",
      cardId,
      key: lastEditorKey,
      value: auditTrail.editor,
    });
  }
}

/* ───────── search navigation ───────── */

function findNextMatch(
  state: RichCardState,
  result: { matches: SearchMatch[]; activeIndex: number | null },
  dispatch: (action: RichCardAction) => void,
): SearchMatch | null {
  if (result.matches.length === 0) return null;
  const next = ((result.activeIndex ?? -1) + 1) % result.matches.length;
  dispatch({ type: "set-active-match-index", index: next });
  const match = result.matches[next];
  requestAnimationFrame(() => {
    document
      .querySelector<HTMLElement>(`[data-rcid="${match.cardId}"]`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  });
  return match;
}

function findPrevMatch(
  state: RichCardState,
  result: { matches: SearchMatch[]; activeIndex: number | null },
  dispatch: (action: RichCardAction) => void,
): SearchMatch | null {
  if (result.matches.length === 0) return null;
  const prev =
    (result.activeIndex ?? 0) - 1 < 0
      ? result.matches.length - 1
      : (result.activeIndex ?? 0) - 1;
  dispatch({ type: "set-active-match-index", index: prev });
  const match = result.matches[prev];
  requestAnimationFrame(() => {
    document
      .querySelector<HTMLElement>(`[data-rcid="${match.cardId}"]`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  });
  return match;
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
  onCardMoved?: (e: CardMovedEvent) => void;
  onCardDuplicated?: (e: CardDuplicatedEvent) => void;
  onMetaChanged?: (e: MetaChangedEvent) => void;
  onMetaAdded?: (e: MetaAddedEvent) => void;
  onMetaRemoved?: (e: MetaRemovedEvent) => void;
};

function fireGranularEvent(
  action: RichCardAction,
  prev: RichCardState,
  next: RichCardState,
  h: EventHandlers,
) {
  switch (action.type) {
    case "field-edit-value": {
      const prevCard = findCard(prev.tree, action.cardId);
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
      const prevCard = findCard(prev.tree, action.cardId);
      const prevField = prevCard?.fields.find((f) => f.key === action.oldKey);
      if (!prevField) return;
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
    case "field-add":
      h.onFieldAdded?.({
        cardId: action.cardId,
        key: action.key,
        value: action.value,
        type: action.valueType,
      });
      return;
    case "field-remove": {
      const prevCard = findCard(prev.tree, action.cardId);
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
    case "card-add":
      h.onCardAdded?.({
        parentId: action.parentId,
        card: treeToJsonNode(action.card) as RichCardJsonNode,
      });
      return;
    case "card-remove": {
      const prevSubtree = findCard(prev.tree, action.cardId);
      if (!prevSubtree) return;
      const parentId = findParentId(prev.tree, action.cardId);
      h.onCardRemoved?.({
        cardId: action.cardId,
        removed: treeToJsonNode(prevSubtree) as RichCardJsonNode,
        parentId,
      });
      return;
    }
    case "card-rename": {
      const prevCard = findCard(prev.tree, action.cardId);
      h.onCardRenamed?.({
        cardId: action.cardId,
        oldKey: prevCard?.parentKey,
        newKey: action.newParentKey,
      });
      return;
    }
    case "card-move": {
      const prevCard = findCard(prev.tree, action.cardId);
      const prevParentId = findParentId(prev.tree, action.cardId);
      h.onCardMoved?.({
        cardId: action.cardId,
        oldParentId: prevParentId ?? "",
        newParentId: action.newParentId,
        oldOrder: prevCard?.order ?? 0,
        newOrder: action.newOrder,
      });
      return;
    }
    case "card-duplicate": {
      const sourceParentId = findParentId(prev.tree, action.cardId);
      h.onCardDuplicated?.({
        sourceCardId: action.cardId,
        newCardId: action.newCardId,
        parentId: sourceParentId ?? "",
      });
      return;
    }
    case "predefined-add":
      h.onPredefinedAdded?.({
        cardId: action.cardId,
        key: action.entry.key,
        value: action.entry.value,
      });
      return;
    case "predefined-edit": {
      const prevCard = findCard(prev.tree, action.cardId);
      const prevEntry = prevCard?.predefined.find((p) => p.key === action.key);
      h.onPredefinedEdited?.({
        cardId: action.cardId,
        key: action.key as PredefinedKey,
        oldValue: prevEntry?.value ?? null,
        newValue: action.entry.value,
      });
      return;
    }
    case "predefined-remove": {
      const prevCard = findCard(prev.tree, action.cardId);
      const prevEntry = prevCard?.predefined.find((p) => p.key === action.key);
      h.onPredefinedRemoved?.({
        cardId: action.cardId,
        key: action.key as PredefinedKey,
        oldValue: prevEntry?.value ?? null,
      });
      return;
    }
    case "meta-edit": {
      const prevCard = findCard(prev.tree, action.cardId);
      const oldValue = prevCard?.meta?.[action.key] ?? null;
      h.onMetaChanged?.({
        cardId: action.cardId,
        key: action.key,
        oldValue,
        newValue: action.value,
      });
      return;
    }
    case "meta-add":
      h.onMetaAdded?.({
        cardId: action.cardId,
        key: action.key,
        value: action.value,
      });
      return;
    case "meta-remove": {
      const prevCard = findCard(prev.tree, action.cardId);
      const oldValue = prevCard?.meta?.[action.key] ?? null;
      h.onMetaRemoved?.({
        cardId: action.cardId,
        key: action.key,
        oldValue,
      });
      return;
    }
    default:
      return;
  }
  // Reference unused imports
  void ({} as RichCardPredefinedEntry);
  void ({} as FlatFieldType);
  void ({} as CustomPredefinedKey);
  void ({} as SearchOptions);
}
