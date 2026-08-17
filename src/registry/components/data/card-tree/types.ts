/**
 * Public types for the card-tree pro-component.
 *
 * v0.1: viewer (typed scalar fields, predefined-key blocks, per-level styling, ARIA tree).
 * v0.2: inline editor (click-to-edit, granular events, dirty tracking, single-select).
 * v0.3: structural management — drag-drop, bulk multi-select, permission matrix,
 *       virtualization, native search, meta editing, root-removal, promote-on-delete.
 * v0.4: validation hooks + per-commit undo/redo.
 * v0.6 (current): **custom predefined-keys actually work.** The prop, the types and the
 *       docs shipped in v0.3, but nothing between `parse` and the renderers ever read
 *       them — registration was inert through 0.5.0. v0.6 wires the whole path
 *       (classify → parse/validate → render/edit → serialize verbatim), which also
 *       makes array-valued blocks (Plate Value, editor.js) registrable.
 *
 * See:
 *   - docs/procomps/card-tree-procomp/card-tree-procomp-plan.md (v0.1)
 *   - docs/procomps/card-tree-procomp/card-tree-procomp-plan-v0.2.md
 *   - docs/procomps/card-tree-procomp/card-tree-procomp-plan-v0.3.md (§9 = the custom-key spec)
 *   - docs/procomps/card-tree-procomp/card-tree-procomp-plan-v0.4.md
 *   - docs/procomps/card-tree-procomp/card-tree-loop.md (v0.6 U-loop)
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

export type CardTreeJsonNode = {
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
  card: CardTreeJsonNode;
};

export type CardRemovedEvent = {
  cardId: string;
  removed: CardTreeJsonNode;
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

export type CardTreePermissions = {
  default?: PermissionRule;
  byLevel?: Record<number, PermissionRule>;
  byCard?: Record<string, PermissionRule>;
  /**
   * v0.6: accepts registered custom-key names too, not just the five built-ins.
   * The runtime lookup in `lib/permissions.ts` always resolved this by string;
   * the narrower type was the only thing preventing a custom block from being
   * permission-controlled. `string & {}` keeps built-in autocomplete alive.
   */
  byPredefinedKey?: Partial<Record<PredefinedKey | (string & {}), PermissionRule>>;
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
  /**
   * Makes this block searchable by the native data-model search. Optional —
   * omit it and the block is simply skipped by search (never an error).
   *
   * Q-P15 deferred custom-key search out of v0.3; `lib/search.ts` shipped the
   * consumption early and it is live as of v0.6.
   */
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

export type CardTreeValidationError = { code: string; message: string };

export type CardTreeValidationResponse =
  | { ok: true }
  | { ok: false; errors: CardTreeValidationError[] };

export type CardTreeValidators = {
  fieldEdit?: (
    event: FieldEditedEvent,
    tree: CardTreeJsonNode,
  ) => CardTreeValidationResponse;
  fieldAdd?: (
    event: FieldAddedEvent,
    tree: CardTreeJsonNode,
  ) => CardTreeValidationResponse;
  fieldRemove?: (
    event: FieldRemovedEvent,
    tree: CardTreeJsonNode,
  ) => CardTreeValidationResponse;
  cardAdd?: (
    event: CardAddedEvent,
    tree: CardTreeJsonNode,
  ) => CardTreeValidationResponse;
  cardRemove?: (
    event: CardRemovedEvent,
    tree: CardTreeJsonNode,
  ) => CardTreeValidationResponse;
  cardRename?: (
    event: CardRenamedEvent,
    tree: CardTreeJsonNode,
  ) => CardTreeValidationResponse;
  cardMove?: (
    event: CardMovedEvent,
    tree: CardTreeJsonNode,
  ) => CardTreeValidationResponse;
  cardDuplicate?: (
    event: CardDuplicatedEvent,
    tree: CardTreeJsonNode,
  ) => CardTreeValidationResponse;
  predefinedAdd?: (
    event: PredefinedAddedEvent,
    tree: CardTreeJsonNode,
  ) => CardTreeValidationResponse;
  predefinedEdit?: (
    event: PredefinedEditedEvent,
    tree: CardTreeJsonNode,
  ) => CardTreeValidationResponse;
  predefinedRemove?: (
    event: PredefinedRemovedEvent,
    tree: CardTreeJsonNode,
  ) => CardTreeValidationResponse;
  metaEdit?: (
    event: MetaChangedEvent,
    tree: CardTreeJsonNode,
  ) => CardTreeValidationResponse;
  metaAdd?: (
    event: MetaAddedEvent,
    tree: CardTreeJsonNode,
  ) => CardTreeValidationResponse;
  metaRemove?: (
    event: MetaRemovedEvent,
    tree: CardTreeJsonNode,
  ) => CardTreeValidationResponse;
};

export type CardTreeMasterValidator = (
  action: { type: string; cardId?: string },
  tree: CardTreeJsonNode,
) => CardTreeValidationResponse;

export type ValidationFailedEvent = {
  action: string;
  cardId?: string;
  errors: CardTreeValidationError[];
  layer: "per-action" | "master";
};

/* ───────── component props ───────── */

export type CardTreeProps = {
  defaultValue: CardTreeJsonNode;

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
  onChange?: (tree: CardTreeJsonNode) => void;
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
  permissions?: CardTreePermissions;
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

  /**
   * Register additional content blocks at mount (v0.3 API — **functional since v0.6**).
   *
   * Precedence: reserved (`__rc*`) → built-in predefined → **custom** → scalar
   * field → child card. Matching happens on the key NAME before the value is
   * inspected, so a custom block may hold any JSON shape, arrays included —
   * unlike ordinary children, which still reject arrays per Q-P4.
   *
   * Mount-only. A name that collides with a built-in or reserved key, or that is
   * registered twice, is dropped with a `console.error`.
   *
   * ⚠️ Registering a name **claims that name everywhere in the tree**. If existing
   * documents already use it for something else — a child card, say — those
   * values are now routed to your `validate`, and a rejection drops the entry
   * (same rule the five built-ins have always followed: a malformed `quote` is
   * dropped too). Pick names you own, and treat adding a registration to a
   * populated corpus as a migration. Parse diagnostics are emitted via
   * `console.warn`.
   */
  customPredefinedKeys?: CustomPredefinedKey[];

  // v0.3 — root-removal + delete policy
  allowRootRemoval?: boolean;
  onRootRemoved?: (current: CardTreeJsonNode) => CardTreeJsonNode | null;
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
  validators?: CardTreeValidators;
  validate?: CardTreeMasterValidator;
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

export type CardTreeHandle = {
  // v0.1
  /** Canonical pretty-printed JSON string with auto-attached IDs. */
  getValue(): string;
  /** Object form of the parsed tree, with auto-attached IDs preserved. */
  getTree(): CardTreeJsonNode;
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
  replaceRoot(newRoot: CardTreeJsonNode | null): void;
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
