"use client";

import { type Dispatch } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type {
  FlatFieldValue,
  LevelStyle,
  MetaRenderer,
  PredefinedKey,
  SearchMatch,
} from "../types";
import type {
  RichCardPredefinedEntry,
  RichCardTree,
} from "../lib/parse";
import type {
  RichCardAction,
  RichCardState,
} from "../lib/reducer";
import type { FlatFieldType } from "../lib/infer-type";
import type { ValidationResult } from "../lib/validate-edit";
import type { EditMode } from "../hooks/use-edit-mode";
import type { UsePermissionsReturn } from "../hooks/use-permissions";
import { CardHeader } from "./card-header";
import { FieldRow } from "./field-row";
import { PredefinedCodeArea } from "./predefined-codearea";
import { PredefinedImage } from "./predefined-image";
import { PredefinedTable } from "./predefined-table";
import { PredefinedQuote } from "./predefined-quote";
import { PredefinedList } from "./predefined-list";
import { PredefinedEdit } from "./predefined-edit";
import { FieldAddButton, FieldAddForm } from "./field-add";
import { PredefinedAddMenu } from "./predefined-add-menu";
import { AddChildButton } from "./card-actions";

/* ───────── public config (passed from rich-card.tsx) ───────── */

export type EditDispatchers = {
  fieldEditValue: (
    cardId: string,
    key: string,
    value: FlatFieldValue,
    type: FlatFieldType,
  ) => void;
  fieldEditKey: (cardId: string, oldKey: string, newKey: string) => void;
  fieldAdd: (
    cardId: string,
    key: string,
    value: FlatFieldValue,
    type: FlatFieldType,
  ) => void;
  fieldRemove: (cardId: string, key: string) => void;
  cardAdd: (parentId: string) => void;
  cardRemove: (cardId: string, policy?: "cascade" | "promote") => void;
  cardRename: (cardId: string, newKey: string) => void;
  cardCancelTentative: (cardId: string) => void;
  cardDuplicate: (cardId: string) => void;
  predefinedAdd: (cardId: string, entry: RichCardPredefinedEntry) => void;
  predefinedEdit: (
    cardId: string,
    key: PredefinedKey | string,
    entry: RichCardPredefinedEntry,
  ) => void;
  predefinedRemove: (cardId: string, key: PredefinedKey | string) => void;
  metaEdit: (cardId: string, key: string, value: FlatFieldValue) => void;
  metaAdd: (cardId: string, key: string, value: FlatFieldValue) => void;
  metaRemove: (cardId: string, key: string) => void;
  // Selection
  selectCard: (
    cardId: string,
    event: { shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean },
  ) => void;
};

export type EditValidators = {
  fieldEditValue: (
    cardId: string,
    key: string,
    value: FlatFieldValue,
    type: FlatFieldType,
  ) => ValidationResult;
  fieldEditKey: (cardId: string, oldKey: string, newKey: string) => ValidationResult;
  fieldAdd: (
    cardId: string,
    key: string,
    value: FlatFieldValue,
    type: FlatFieldType,
  ) => ValidationResult;
  cardRename: (cardId: string, newKey: string) => ValidationResult;
  metaEdit: (cardId: string, key: string, value: FlatFieldValue) => ValidationResult;
  metaAdd: (cardId: string, key: string, value: FlatFieldValue) => ValidationResult;
};

export type CardConfig = {
  resolveLevelStyle: (level: number) => LevelStyle;
  predefinedKeyStyles?: Partial<Record<PredefinedKey | string, string | LevelStyle>>;
  metaPresentation: "hidden" | "inline" | "popover";
  metaRenderers?: Record<string, MetaRenderer>;
  rootTitle?: string;
  disabledPredefinedKeys: readonly PredefinedKey[];
  // v0.2 editor surface
  editable: boolean;
  editMode: EditMode | null;
  setEditMode: (mode: EditMode | null) => void;
  clearEditMode: () => void;
  tentativeCardId: string | null;
  dispatchers: EditDispatchers;
  validators: EditValidators;
  // v0.3
  perms: UsePermissionsReturn;
  allowRootRemoval: boolean;
  defaultDeletePolicy: "cascade" | "promote";
  searchMatches: readonly SearchMatch[];
  searchQuery: string;
  searchCaseSensitive: boolean;
  dndEnabled: boolean;
};

/* ───────── helpers ───────── */

function resolvePredefinedClass(
  style: string | LevelStyle | undefined,
): string | undefined {
  if (!style) return undefined;
  if (typeof style === "string") return style;
  return style.containerClassName;
}

function PredefinedRenderer({
  entry,
  styleProp,
  editable,
  isEditing,
  onEnterEdit,
  onCommit,
  onCancel,
  onRemove,
}: {
  entry: RichCardPredefinedEntry;
  styleProp: string | LevelStyle | undefined;
  editable: boolean;
  isEditing: boolean;
  onEnterEdit: () => void;
  onCommit: (next: RichCardPredefinedEntry) => void;
  onCancel: () => void;
  onRemove: () => void;
}) {
  if (isEditing) {
    return <PredefinedEdit entry={entry} onCommit={onCommit} onCancel={onCancel} />;
  }
  const className = resolvePredefinedClass(styleProp);
  const block = (() => {
    switch (entry.key) {
      case "codearea":
        return <PredefinedCodeArea value={entry.value} className={className} />;
      case "image":
        return <PredefinedImage value={entry.value} className={className} />;
      case "table":
        return <PredefinedTable value={entry.value} className={className} />;
      case "quote":
        return <PredefinedQuote value={entry.value} className={className} />;
      case "list":
        return <PredefinedList value={entry.value} className={className} />;
    }
  })();
  if (!editable) return block;
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onEnterEdit}
        className="block w-full cursor-text text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
        aria-label={`Edit ${entry.key}`}
      >
        {block}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        aria-label={`Remove ${entry.key}`}
        className="absolute right-1 top-1 inline-flex size-5 items-center justify-center rounded bg-card/80 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/20 hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        ×
      </button>
    </div>
  );
}

/* ───────── Card (recursive, sortable) ───────── */

export function Card({
  tree,
  config,
  state,
  dispatch,
}: {
  tree: RichCardTree;
  config: CardConfig;
  state: RichCardState;
  dispatch: Dispatch<RichCardAction>;
}) {
  const { perms } = config;
  const collapsed = state.collapsed.has(tree.id);
  const isFocused = state.focusedId === tree.id;
  const isSelected = state.selectedIds.has(tree.id);
  const hasChildren = tree.children.length > 0;
  const hasFields = tree.fields.length > 0;
  const hasPredefined = tree.predefined.length > 0;
  const hasBody = hasFields || hasPredefined;
  const canCollapse = hasBody || hasChildren;
  const isLocked = perms.isLocked(tree.id);

  const levelStyle = config.resolveLevelStyle(tree.level);
  const titleId = `rcc-title-${tree.id}`;
  const title =
    tree.parentKey ?? (tree.level === 1 ? config.rootTitle : undefined);

  const isAddingField =
    config.editable &&
    perms.canAddField(tree.id) &&
    config.editMode?.kind === "field-add" &&
    config.editMode.cardId === tree.id;

  const presentPredefinedKeys = tree.predefined.map((p) => p.key);
  const isRoot = tree.level === 1;

  // v0.3: sortable integration
  const {
    attributes: sortableAttributes,
    listeners: sortableListeners,
    setNodeRef: sortableSetNodeRef,
    transform: sortableTransform,
    transition: sortableTransition,
    isDragging: sortableIsDragging,
  } = useSortable({
    id: tree.id,
    disabled:
      !config.dndEnabled || !config.editable || isRoot || !perms.canDragCard(tree.id),
  });
  const sortableStyle = {
    transform: CSS.Translate.toString(sortableTransform),
    transition: sortableTransition,
    opacity: sortableIsDragging ? 0.5 : 1,
  };

  const canEdit = perms.canEditCard(tree.id);
  const canAddField = perms.canAddField(tree.id);
  const canRemoveCard = perms.canRemoveCard(tree.id);
  const canAddCard = perms.canAddCard(tree.id);
  const canDuplicateCard = !isRoot && perms.canEditCard(tree.id);
  const canDrag = !isRoot && perms.canDragCard(tree.id);

  return (
    <li
      ref={sortableSetNodeRef}
      role="treeitem"
      aria-level={tree.level}
      aria-expanded={canCollapse ? !collapsed : undefined}
      aria-selected={isSelected}
      aria-labelledby={titleId}
      data-readonly={isLocked || undefined}
      tabIndex={isFocused ? 0 : -1}
      data-rcid={tree.id}
      style={sortableStyle}
      onFocus={(e) => {
        if (e.target === e.currentTarget) {
          dispatch({ type: "set-focus", id: tree.id });
        }
      }}
      className={cn(
        "block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        levelStyle.containerClassName,
        isSelected &&
          "ring-2 ring-primary/40 ring-offset-1 ring-offset-background",
        isLocked && "opacity-90",
      )}
    >
      <CardHeader
        tree={tree}
        title={title}
        titleId={titleId}
        collapsed={collapsed}
        canCollapse={canCollapse}
        meta={tree.meta}
        metaPresentation={config.metaPresentation}
        metaRenderers={config.metaRenderers}
        onToggleCollapse={() =>
          dispatch({ type: "toggle-collapse", id: tree.id })
        }
        onSelect={(event) => config.dispatchers.selectCard(tree.id, event)}
        editable={config.editable}
        canEdit={canEdit}
        canRemove={canRemoveCard}
        canDuplicate={canDuplicateCard}
        canDrag={canDrag}
        isLocked={isLocked}
        isRoot={isRoot}
        allowRootRemoval={config.allowRootRemoval}
        hasChildren={hasChildren}
        defaultDeletePolicy={config.defaultDeletePolicy}
        editMode={config.editMode}
        setEditMode={config.setEditMode}
        validators={config.validators}
        dispatchers={config.dispatchers}
        tentativeCardId={config.tentativeCardId}
        dragHandleListeners={
          sortableListeners as
            | Record<string, (event: unknown) => void>
            | undefined
        }
        dragHandleAttributes={
          sortableAttributes as unknown as Record<string, unknown> | undefined
        }
        searchMatches={config.searchMatches}
        searchQuery={config.searchQuery}
        searchCaseSensitive={config.searchCaseSensitive}
        className={levelStyle.headerClassName}
      />

      {hasBody && !collapsed ? (
        <div className={cn("mt-2 space-y-2", levelStyle.fieldsClassName)}>
          {hasFields ? (
            <dl className="grid gap-1">
              {tree.fields.map((f) => (
                <FieldRow
                  key={f.key}
                  cardId={tree.id}
                  fieldKey={f.key}
                  value={f.value}
                  type={f.type}
                  editable={config.editable}
                  canEdit={perms.canEditField(tree.id, f.key)}
                  canEditKey={perms.canEditField(tree.id, f.key)}
                  canRemove={perms.canRemoveField(tree.id, f.key)}
                  editMode={config.editMode}
                  setEditMode={config.setEditMode}
                  validators={config.validators}
                  dispatchers={config.dispatchers}
                  searchMatches={config.searchMatches}
                  searchQuery={config.searchQuery}
                  searchCaseSensitive={config.searchCaseSensitive}
                />
              ))}
            </dl>
          ) : null}

          {hasPredefined ? (
            <div className="space-y-2">
              {tree.predefined.map((entry, i) => {
                const isEditing =
                  config.editable &&
                  perms.canEditPredefined(tree.id, String(entry.key)) &&
                  config.editMode?.kind === "predefined" &&
                  config.editMode.cardId === tree.id &&
                  config.editMode.key === entry.key;
                return (
                  <PredefinedRenderer
                    key={`${entry.key}-${i}`}
                    entry={entry}
                    styleProp={config.predefinedKeyStyles?.[entry.key]}
                    editable={
                      config.editable &&
                      perms.canEditPredefined(tree.id, String(entry.key))
                    }
                    isEditing={isEditing}
                    onEnterEdit={() =>
                      config.setEditMode({
                        kind: "predefined",
                        cardId: tree.id,
                        key: entry.key as PredefinedKey,
                      })
                    }
                    onCommit={(next) =>
                      config.dispatchers.predefinedEdit(
                        tree.id,
                        entry.key,
                        next,
                      )
                    }
                    onCancel={() => config.clearEditMode()}
                    onRemove={() =>
                      config.dispatchers.predefinedRemove(tree.id, entry.key)
                    }
                  />
                );
              })}
            </div>
          ) : null}

          {/* v0.2/0.3 add affordances */}
          {config.editable ? (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {isAddingField ? (
                <FieldAddForm
                  validateAll={(key, value, type) =>
                    config.validators.fieldAdd(tree.id, key, value, type)
                  }
                  onCommit={(key, value, type) =>
                    config.dispatchers.fieldAdd(tree.id, key, value, type)
                  }
                  onCancel={() => config.clearEditMode()}
                />
              ) : canAddField ? (
                <FieldAddButton
                  onClick={() =>
                    config.setEditMode({
                      kind: "field-add",
                      cardId: tree.id,
                    })
                  }
                />
              ) : null}
              <PredefinedAddMenu
                presentKeys={presentPredefinedKeys as PredefinedKey[]}
                disabledKeys={config.disabledPredefinedKeys}
                onAdd={(entry) =>
                  config.dispatchers.predefinedAdd(tree.id, entry)
                }
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {hasChildren && !collapsed ? (
        <ul
          role="group"
          className={cn(
            "mt-2 space-y-1.5 ps-2 border-s border-border/40",
            levelStyle.childrenClassName,
          )}
        >
          {tree.children.map((child) => (
            <Card
              key={child.id}
              tree={child}
              config={config}
              state={state}
              dispatch={dispatch}
            />
          ))}
        </ul>
      ) : null}

      {/* "+ child" button in edit mode */}
      {config.editable && canAddCard && !collapsed ? (
        <div className={cn("mt-2", hasChildren && "ps-2")}>
          <AddChildButton
            onClick={() => config.dispatchers.cardAdd(tree.id)}
            disabled={!canAddCard}
          />
        </div>
      ) : null}
    </li>
  );
}
