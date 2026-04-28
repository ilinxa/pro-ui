import { type Dispatch } from "react";
import { cn } from "@/lib/utils";
import type {
  FlatFieldValue,
  LevelStyle,
  PredefinedKey,
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

/* ───────── public config (passed from rich-card.tsx down through Card) ───────── */

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
  cardRemove: (cardId: string) => void;
  cardRename: (cardId: string, newKey: string) => void;
  cardCancelTentative: (cardId: string) => void;
  predefinedAdd: (
    cardId: string,
    entry: RichCardPredefinedEntry,
  ) => void;
  predefinedEdit: (
    cardId: string,
    key: PredefinedKey,
    entry: RichCardPredefinedEntry,
  ) => void;
  predefinedRemove: (cardId: string, key: PredefinedKey) => void;
  selectCard: (id: string | null) => void;
};

export type EditValidators = {
  fieldEditValue: (
    cardId: string,
    key: string,
    value: FlatFieldValue,
    type: FlatFieldType,
  ) => ValidationResult;
  fieldEditKey: (
    cardId: string,
    oldKey: string,
    newKey: string,
  ) => ValidationResult;
  fieldAdd: (
    cardId: string,
    key: string,
    value: FlatFieldValue,
    type: FlatFieldType,
  ) => ValidationResult;
  cardRename: (cardId: string, newKey: string) => ValidationResult;
};

export type CardConfig = {
  resolveLevelStyle: (level: number) => LevelStyle;
  predefinedKeyStyles?: Partial<Record<PredefinedKey, string | LevelStyle>>;
  metaPresentation: "hidden" | "inline" | "popover";
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
    return (
      <PredefinedEdit
        entry={entry}
        onCommit={onCommit}
        onCancel={onCancel}
      />
    );
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

/* ───────── Card (recursive) ───────── */

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
  const collapsed = state.collapsed.has(tree.id);
  const isFocused = state.focusedId === tree.id;
  const isSelected = state.selectedId === tree.id;
  const hasChildren = tree.children.length > 0;
  const hasFields = tree.fields.length > 0;
  const hasPredefined = tree.predefined.length > 0;
  const hasBody = hasFields || hasPredefined;
  const canCollapse = hasBody || hasChildren;

  const levelStyle = config.resolveLevelStyle(tree.level);
  const titleId = `rcc-title-${tree.id}`;
  const title =
    tree.parentKey ?? (tree.level === 1 ? config.rootTitle : undefined);

  const isAddingField =
    config.editable &&
    config.editMode?.kind === "field-add" &&
    config.editMode.cardId === tree.id;

  const presentPredefinedKeys = tree.predefined.map((p) => p.key);

  return (
    <li
      role="treeitem"
      aria-level={tree.level}
      aria-expanded={canCollapse ? !collapsed : undefined}
      aria-selected={isSelected}
      aria-labelledby={titleId}
      tabIndex={isFocused ? 0 : -1}
      data-rcid={tree.id}
      onFocus={(e) => {
        if (e.target === e.currentTarget) {
          dispatch({ type: "set-focus", id: tree.id });
        }
      }}
      className={cn(
        "block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        levelStyle.containerClassName,
        isSelected && "ring-2 ring-primary/40 ring-offset-1 ring-offset-background",
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
        onToggleCollapse={() =>
          dispatch({ type: "toggle-collapse", id: tree.id })
        }
        onSelect={() => config.dispatchers.selectCard(tree.id)}
        editable={config.editable}
        editMode={config.editMode}
        setEditMode={config.setEditMode}
        validators={config.validators}
        dispatchers={config.dispatchers}
        tentativeCardId={config.tentativeCardId}
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
                  editMode={config.editMode}
                  setEditMode={config.setEditMode}
                  validators={config.validators}
                  dispatchers={config.dispatchers}
                />
              ))}
            </dl>
          ) : null}

          {hasPredefined ? (
            <div className="space-y-2">
              {tree.predefined.map((entry, i) => {
                const isEditing =
                  config.editable &&
                  config.editMode?.kind === "predefined" &&
                  config.editMode.cardId === tree.id &&
                  config.editMode.key === entry.key;
                return (
                  <PredefinedRenderer
                    key={`${entry.key}-${i}`}
                    entry={entry}
                    styleProp={config.predefinedKeyStyles?.[entry.key]}
                    editable={config.editable}
                    isEditing={isEditing}
                    onEnterEdit={() =>
                      config.setEditMode({
                        kind: "predefined",
                        cardId: tree.id,
                        key: entry.key,
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

          {/* v0.2 add affordances */}
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
              ) : (
                <FieldAddButton
                  onClick={() =>
                    config.setEditMode({
                      kind: "field-add",
                      cardId: tree.id,
                    })
                  }
                />
              )}
              <PredefinedAddMenu
                presentKeys={presentPredefinedKeys}
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

      {/* "+ child" button in edit mode (always shown — adds child even to leaf cards) */}
      {config.editable && !collapsed ? (
        <div className={cn("mt-2", hasChildren && "ps-2")}>
          <AddChildButton onClick={() => config.dispatchers.cardAdd(tree.id)} />
        </div>
      ) : null}
    </li>
  );
}
