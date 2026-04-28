/**
 * Public types for the rich-card pro-component.
 *
 * v0.1: viewer (typed scalar fields, predefined-key blocks, per-level styling, ARIA tree).
 * v0.2: inline editor (click-to-edit, granular events, dirty tracking, single-select).
 * v0.3 (current): structural management — drag-drop, bulk multi-select, permission matrix,
 *                 custom predefined-keys, virtualization, native search, meta editing,
 *                 root-removal, promote-on-delete.
 *
 * See:
 *   - docs/procomps/rich-card-procomp/rich-card-procomp-plan.md (v0.1)
 *   - docs/procomps/rich-card-procomp/rich-card-procomp-plan-v0.2.md
 *   - docs/procomps/rich-card-procomp/rich-card-procomp-plan-v0.3.md
 */

import type { ReactNode } from "react";

/* ───────── reserved + predefined keys ───────── */

export const RESERVED_KEYS = ["__rcid", "__rcorder", "__rcmeta"] as const;
export type ReservedKey = (typeof RESERVED_KEYS)[number];

export const PREDEFINED_KEYS = [
  "codearea",
  "image",
  "table",
  "quote",
  "list",
] as const;
export type PredefinedKey = (typeof PREDEFINED_KEYS)[number];

/* ───────── flat-field scalar values ───────── */

export type FlatFieldValue = string | number | boolean | null;

/** Re-exported from lib/infer-type so it's part of the public surface (referenced by event types). */
export type { FlatFieldType } from "./lib/infer-type";

/* ───────── predefined-key payload shapes ───────── */

export type CodeAreaValue = { format: string; content: string };
export type ImageValue = { src: string; alt?: string };
export type TableValue = { headers: string[]; rows: FlatFieldValue[][] };
export type QuoteValue = string;
export type ListValue = FlatFieldValue[];

/* ───────── input node shape ───────── */

export type RichCardJsonNode = {
  __rcid?: string;
  __rcorder?: number;
  __rcmeta?: Record<string, FlatFieldValue>;
  [key: string]: unknown;
};

/* ───────── styling ───────── */

export type LevelStyle = {
  containerClassName?: string;
  headerClassName?: string;
  fieldsClassName?: string;
  childrenClassName?: string;
};

/* ───────── v0.2 event types ───────── */

import type { FlatFieldType as _FlatFieldType } from "./lib/infer-type";

export type FieldEditedEvent = {
  cardId: string;
  key: string;
  oldValue: FlatFieldValue;
  oldType: _FlatFieldType;
  newValue: FlatFieldValue;
  newType: _FlatFieldType;
};

export type FieldAddedEvent = {
  cardId: string;
  key: string;
  value: FlatFieldValue;
  type: _FlatFieldType;
};

export type FieldRemovedEvent = {
  cardId: string;
  key: string;
  oldValue: FlatFieldValue;
  oldType: _FlatFieldType;
};

export type CardAddedEvent = {
  parentId: string;
  card: RichCardJsonNode;
};

export type CardRemovedEvent = {
  cardId: string;
  removed: RichCardJsonNode;
  parentId: string | null;
};

export type CardRenamedEvent = {
  cardId: string;
  oldKey: string | undefined;
  newKey: string;
};

export type PredefinedAddedEvent = {
  cardId: string;
  key: PredefinedKey | string;
  value: unknown;
};

export type PredefinedEditedEvent = {
  cardId: string;
  key: PredefinedKey | string;
  oldValue: unknown;
  newValue: unknown;
};

export type PredefinedRemovedEvent = {
  cardId: string;
  key: PredefinedKey | string;
  oldValue: unknown;
};

/* ───────── v0.3 event types ───────── */

export type CardMovedEvent = {
  cardId: string;
  oldParentId: string;
  newParentId: string;
  oldOrder: number;
  newOrder: number;
};

export type CardDuplicatedEvent = {
  sourceCardId: string;
  newCardId: string;
  parentId: string;
};

export type MetaChangedEvent = {
  cardId: string;
  key: string;
  oldValue: FlatFieldValue;
  newValue: FlatFieldValue;
};

export type MetaAddedEvent = {
  cardId: string;
  key: string;
  value: FlatFieldValue;
};

export type MetaRemovedEvent = {
  cardId: string;
  key: string;
  oldValue: FlatFieldValue;
};

/* ───────── v0.3 search ───────── */

export type SearchOptions = {
  query: string;
  caseSensitive?: boolean;
  matchTitles?: boolean;
  matchKeys?: boolean;
  matchValues?: boolean;
  matchPredefined?: boolean;
  matchMeta?: boolean;
};

export type SearchMatchType =
  | "title"
  | "field-key"
  | "field-value"
  | "predefined"
  | "meta-key"
  | "meta-value";

export type SearchMatch = {
  cardId: string;
  matchType: SearchMatchType;
  fieldKey?: string;
  excerpt: string;
  start: number;
  length: number;
};

export type SearchResult = {
  matches: SearchMatch[];
  matchedCardIds: ReadonlySet<string>;
  activeIndex: number | null;
};

/* ───────── v0.3 permissions ───────── */

export type PermissionRule = {
  edit?: boolean;
  add?: boolean;
  remove?: boolean;
  reorder?: boolean;
  reparent?: boolean;
};

export type RichCardPermissions = {
  default?: PermissionRule;
  byLevel?: Record<number, PermissionRule>;
  byCard?: Record<string, PermissionRule>;
  byPredefinedKey?: Partial<Record<PredefinedKey, PermissionRule>>;
  byFieldType?: Partial<Record<_FlatFieldType, PermissionRule>>;
  inherit?: boolean;
};

export type PermissionDenialReason =
  | "global-editable-false"
  | "meta-locked"
  | "by-card"
  | "by-predefined-key"
  | "by-field-type"
  | "by-level"
  | "default"
  | "predicate";

export type EffectivePermissions = PermissionRule & {
  reason?: PermissionDenialReason;
};

/* ───────── v0.3 DnD ───────── */

export type DndScopes = {
  sameLevel?: boolean;
  crossLevel?: boolean;
};

/* ───────── v0.3 custom predefined keys ───────── */

export type CustomKeyContext = {
  cardId: string;
  level: number;
  isEditing: boolean;
  className?: string;
};

export type CustomPredefinedKey = {
  key: string;
  description?: string;
  icon?: ReactNode;
  category?: string;
  validate: (value: unknown) => { ok: boolean; errors?: { code: string; message: string }[] };
  render: (value: unknown, ctx: CustomKeyContext) => ReactNode;
  edit?: (
    value: unknown,
    onSave: (next: unknown) => void,
    onCancel: () => void,
  ) => ReactNode;
  defaultValue: () => unknown;
  /** v0.4 candidate; not consumed in v0.3 */
  searchableText?: (value: unknown) => string[];
};

/* ───────── v0.3 meta renderers ───────── */

export type MetaRendererContext = {
  cardId: string;
  metaKey: string;
  className?: string;
};

export type MetaRenderer = (
  value: FlatFieldValue,
  ctx: MetaRendererContext,
) => ReactNode;

/* ───────── v0.3 audit trail ───────── */

export type AuditTrailConfig = {
  /** Author identifier stamped on `_lastEditor` meta entry. */
  editor?: string;
  /** Reserved meta key names for the audit trail. */
  lastEditedKey?: string;     // default '_lastEdited'
  lastEditorKey?: string;     // default '_lastEditor'
};

/* ───────── v0.4 validation hooks ───────── */

export type RichCardValidationError = { code: string; message: string };

export type RichCardValidationResponse =
  | { ok: true }
  | { ok: false; errors: RichCardValidationError[] };

export type RichCardValidators = {
  fieldEdit?: (
    event: FieldEditedEvent,
    tree: RichCardJsonNode,
  ) => RichCardValidationResponse;
  fieldAdd?: (
    event: FieldAddedEvent,
    tree: RichCardJsonNode,
  ) => RichCardValidationResponse;
  fieldRemove?: (
    event: FieldRemovedEvent,
    tree: RichCardJsonNode,
  ) => RichCardValidationResponse;
  cardAdd?: (
    event: CardAddedEvent,
    tree: RichCardJsonNode,
  ) => RichCardValidationResponse;
  cardRemove?: (
    event: CardRemovedEvent,
    tree: RichCardJsonNode,
  ) => RichCardValidationResponse;
  cardRename?: (
    event: CardRenamedEvent,
    tree: RichCardJsonNode,
  ) => RichCardValidationResponse;
  cardMove?: (
    event: CardMovedEvent,
    tree: RichCardJsonNode,
  ) => RichCardValidationResponse;
  cardDuplicate?: (
    event: CardDuplicatedEvent,
    tree: RichCardJsonNode,
  ) => RichCardValidationResponse;
  predefinedAdd?: (
    event: PredefinedAddedEvent,
    tree: RichCardJsonNode,
  ) => RichCardValidationResponse;
  predefinedEdit?: (
    event: PredefinedEditedEvent,
    tree: RichCardJsonNode,
  ) => RichCardValidationResponse;
  predefinedRemove?: (
    event: PredefinedRemovedEvent,
    tree: RichCardJsonNode,
  ) => RichCardValidationResponse;
  metaEdit?: (
    event: MetaChangedEvent,
    tree: RichCardJsonNode,
  ) => RichCardValidationResponse;
  metaAdd?: (
    event: MetaAddedEvent,
    tree: RichCardJsonNode,
  ) => RichCardValidationResponse;
  metaRemove?: (
    event: MetaRemovedEvent,
    tree: RichCardJsonNode,
  ) => RichCardValidationResponse;
};

export type RichCardMasterValidator = (
  action: { type: string; cardId?: string },
  tree: RichCardJsonNode,
) => RichCardValidationResponse;

export type ValidationFailedEvent = {
  action: string;
  cardId?: string;
  errors: RichCardValidationError[];
  layer: "per-action" | "master";
};

/* ───────── component props ───────── */

export type RichCardProps = {
  defaultValue: RichCardJsonNode;

  // styling (v0.1)
  levelStyles?: LevelStyle[];
  getLevelStyle?: (level: number) => LevelStyle;
  predefinedKeyStyles?: Partial<Record<PredefinedKey | string, string | LevelStyle>>;

  // viewer behavior (v0.1)
  defaultCollapsed?: "all" | "none" | ((level: number) => boolean);
  metaPresentation?: "hidden" | "inline" | "popover";
  disabledPredefinedKeys?: PredefinedKey[];
  dateDetection?: "auto" | "never" | ((value: string) => boolean);

  // editor behavior (v0.2)
  editable?: boolean;
  onChange?: (tree: RichCardJsonNode) => void;
  onFieldEdited?: (event: FieldEditedEvent) => void;
  onFieldAdded?: (event: FieldAddedEvent) => void;
  onFieldRemoved?: (event: FieldRemovedEvent) => void;
  onCardAdded?: (event: CardAddedEvent) => void;
  onCardRemoved?: (event: CardRemovedEvent) => void;
  onCardRenamed?: (event: CardRenamedEvent) => void;
  onPredefinedAdded?: (event: PredefinedAddedEvent) => void;
  onPredefinedEdited?: (event: PredefinedEditedEvent) => void;
  onPredefinedRemoved?: (event: PredefinedRemovedEvent) => void;

  // v0.3 — DnD
  dndScopes?: DndScopes;
  onCardMoved?: (event: CardMovedEvent) => void;
  onCardDuplicated?: (event: CardDuplicatedEvent) => void;

  // v0.3 — permissions (declarative + predicate escape hatches)
  permissions?: RichCardPermissions;
  canEditField?: (cardId: string, key: string) => boolean;
  canAddField?: (cardId: string) => boolean;
  canRemoveField?: (cardId: string, key: string) => boolean;
  canEditCard?: (cardId: string) => boolean;
  canAddCard?: (parentId: string) => boolean;
  canRemoveCard?: (cardId: string) => boolean;
  canEditPredefined?: (cardId: string, key: string) => boolean;
  canAddPredefined?: (cardId: string, key: string) => boolean;
  canRemovePredefined?: (cardId: string, key: string) => boolean;
  canDragCard?: (cardId: string) => boolean;
  canDropCard?: (cardId: string, targetParentId: string) => boolean;
  /** Fired (analytics-only) when an action would have been blocked. */
  onPermissionDenied?: (
    action: keyof PermissionRule,
    cardId: string,
    target: string | undefined,
    reason: PermissionDenialReason,
  ) => void;

  // v0.3 — custom predefined keys
  customPredefinedKeys?: CustomPredefinedKey[];

  // v0.3 — virtualization
  virtualize?: boolean | "auto";

  // v0.3 — root-removal + delete policy
  allowRootRemoval?: boolean;
  onRootRemoved?: (current: RichCardJsonNode) => RichCardJsonNode | null;
  defaultDeletePolicy?: "cascade" | "promote";
  promoteCollisionStrategy?: "suffix" | "qualify" | "reject";
  emptyTreeRenderer?: () => ReactNode;

  // v0.3 — meta editing + audit
  metaRenderers?: Record<string, MetaRenderer>;
  auditTrail?: AuditTrailConfig;
  onMetaChanged?: (event: MetaChangedEvent) => void;
  onMetaAdded?: (event: MetaAddedEvent) => void;
  onMetaRemoved?: (event: MetaRemovedEvent) => void;

  // v0.3 — search (controlled by host)
  search?: SearchOptions;
  onSearchResults?: (result: SearchResult) => void;

  // v0.3 — multi-select handler (BREAKING change from v0.2's `id: string | null`)
  onSelectionChange?: (ids: readonly string[]) => void;

  // v0.4 — validation hooks
  validators?: RichCardValidators;
  validate?: RichCardMasterValidator;
  onValidationFailed?: (event: ValidationFailedEvent) => void;

  // v0.4 — undo/redo
  maxUndoDepth?: number;
  disableUndoShortcuts?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;

  // container
  className?: string;
  "aria-label"?: string;
};

/* ───────── imperative ref handle ───────── */

export type RichCardHandle = {
  // v0.1
  /** Canonical pretty-printed JSON string with auto-attached IDs. */
  getValue(): string;
  /** Object form of the parsed tree, with auto-attached IDs preserved. */
  getTree(): RichCardJsonNode;
  // v0.2
  isDirty(): boolean;
  markClean(): void;
  /** Returns the first selected card id, or null. v0.3 retains for backward compat with single-select consumers. */
  getSelectedId(): string | null;
  // v0.3
  getSelectedIds(): readonly string[];
  setSelection(ids: readonly string[] | string | null): void;
  focusCard(id: string): void;
  addCardAt(parentId: string, position?: number): string;
  removeCard(id: string): void;
  /** Programmatic root replacement when allowRootRemoval is enabled. */
  replaceRoot(newRoot: RichCardJsonNode | null): void;
  /** Returns effective permission resolution for a card (debug / host-side gating). */
  getEffectivePermissions(
    cardId: string,
    target?: { kind: "field" | "predefined" | "card"; key?: string },
  ): EffectivePermissions;
  // v0.3 — search
  findNext(): SearchMatch | null;
  findPrevious(): SearchMatch | null;
  scrollToMatch(match: SearchMatch): void;
  clearSearch(): void;
  // v0.4 — undo/redo
  undo(): boolean;
  redo(): boolean;
  canUndo(): boolean;
  canRedo(): boolean;
  clearHistory(): void;
};
