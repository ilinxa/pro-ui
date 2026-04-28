/**
 * Public types for the rich-card pro-component.
 *
 * The component is JSON-native: input is a single root `RichCardJsonNode`,
 * children are object-keyed (arrays-of-objects rejected in v0.1 per Q-P4),
 * flat-field values are JSON scalars (string/number/boolean/null + ISO-8601-date subtype).
 *
 * v0.2 adds: inline editing (gated by `editable: boolean`), granular change
 * events, dirty tracking, click-driven single-select, sync validation on edit.
 *
 * See:
 *   - docs/procomps/rich-card-procomp/rich-card-procomp-plan.md (v0.1)
 *   - docs/procomps/rich-card-procomp/rich-card-procomp-plan-v0.2.md
 */

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

/** Re-exported from lib/infer-type so it's part of the public surface (referenced by event types in v0.2). */
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
  key: PredefinedKey;
  value: unknown;
};

export type PredefinedEditedEvent = {
  cardId: string;
  key: PredefinedKey;
  oldValue: unknown;
  newValue: unknown;
};

export type PredefinedRemovedEvent = {
  cardId: string;
  key: PredefinedKey;
  oldValue: unknown;
};

/* ───────── component props ───────── */

export type RichCardProps = {
  defaultValue: RichCardJsonNode;

  // styling
  levelStyles?: LevelStyle[];
  getLevelStyle?: (level: number) => LevelStyle;
  predefinedKeyStyles?: Partial<Record<PredefinedKey, string | LevelStyle>>;

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
  onSelectionChange?: (id: string | null) => void;

  // container
  className?: string;
  "aria-label"?: string;
};

/* ───────── imperative ref handle ───────── */

export type RichCardHandle = {
  /** Canonical pretty-printed JSON string with auto-attached IDs. */
  getValue(): string;
  /** Object form of the parsed tree, with auto-attached IDs preserved. */
  getTree(): RichCardJsonNode;
  /** v0.2 — true if any committing action has fired since mount or last markClean(). */
  isDirty(): boolean;
  /** v0.2 — snapshots the current state as the new clean baseline. */
  markClean(): void;
  /** v0.2 — currently-selected card id, or null. */
  getSelectedId(): string | null;
};
