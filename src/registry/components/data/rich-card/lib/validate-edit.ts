/**
 * Pure synchronous validators for v0.2 edit operations.
 *
 * Each validator receives the current state + action params, returns either
 * { ok: true } or { ok: false, errors: ValidationError[] }. The reducer calls
 * these before any commit; on failure, state is unchanged and the calling
 * editor surfaces errors via <InlineError>.
 *
 * No async hooks here — those land in v0.4.
 */

import {
  PREDEFINED_KEYS,
  RESERVED_KEYS,
  type FlatFieldValue,
  type PredefinedKey,
} from "../types";
import {
  findAncestorIds,
  findCard,
  findParentId,
  type RichCardState,
} from "./reducer";
import type { FlatFieldType } from "./infer-type";

/* ───────── result + error types ───────── */

export type ValidationError = { code: string; message: string };

export type ValidationResult =
  | { ok: true }
  | { ok: false; errors: ValidationError[] };

const ok: ValidationResult = { ok: true };
const fail = (...errors: ValidationError[]): ValidationResult => ({
  ok: false,
  errors,
});

/* ───────── shared key checks ───────── */

function isReservedKey(key: string): boolean {
  return (RESERVED_KEYS as readonly string[]).includes(key);
}

function isPredefinedKey(key: string, disabled: readonly PredefinedKey[]): boolean {
  return (
    (PREDEFINED_KEYS as readonly string[]).includes(key) &&
    !(disabled as readonly string[]).includes(key)
  );
}

function checkKeyAvailable(
  newKey: string,
  cardId: string,
  state: RichCardState,
  disabled: readonly PredefinedKey[],
  excludeKey?: string,
): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!newKey || newKey.trim().length === 0) {
    errors.push({ code: "empty-key", message: "Key cannot be empty." });
    return errors;
  }
  if (isReservedKey(newKey)) {
    errors.push({
      code: "reserved-key",
      message: `"${newKey}" is reserved (${RESERVED_KEYS.join(", ")}).`,
    });
  }
  if (isPredefinedKey(newKey, disabled)) {
    errors.push({
      code: "predefined-key",
      message: `"${newKey}" is a predefined-key name. Add it to disabledPredefinedKeys to use as a flat field.`,
    });
  }
  const card = findCard(state.tree, cardId);
  if (card) {
    const fieldCollision = card.fields.some(
      (f) => f.key === newKey && f.key !== excludeKey,
    );
    if (fieldCollision) {
      errors.push({
        code: "sibling-key-collision",
        message: `Field "${newKey}" already exists on this card.`,
      });
    }
  }
  return errors;
}

/* ───────── flat-field validators ───────── */

export function validateFieldEditValue(
  state: RichCardState,
  cardId: string,
  key: string,
  value: FlatFieldValue,
  expectedType: FlatFieldType,
): ValidationResult {
  const card = findCard(state.tree, cardId);
  if (!card) return fail({ code: "no-card", message: "Card not found." });
  const field = card.fields.find((f) => f.key === key);
  if (!field) return fail({ code: "no-field", message: `Field "${key}" not found.` });

  // Type preservation: v0.2 doesn't allow type-changing on edit (Q-P2).
  // The editor passes through the inferred type; we just sanity-check it.
  if (expectedType === "number" && typeof value !== "number") {
    return fail({
      code: "type-mismatch",
      message: "Value must be a number.",
    });
  }
  if (expectedType === "boolean" && typeof value !== "boolean") {
    return fail({
      code: "type-mismatch",
      message: "Value must be a boolean.",
    });
  }
  if (
    (expectedType === "string" || expectedType === "date") &&
    typeof value !== "string"
  ) {
    return fail({
      code: "type-mismatch",
      message: "Value must be a string.",
    });
  }
  if (expectedType === "date" && typeof value === "string") {
    if (Number.isNaN(Date.parse(value))) {
      return fail({
        code: "invalid-date",
        message: "Must be a valid ISO-8601 date string.",
      });
    }
  }
  if (expectedType === "null" && value !== null) {
    return fail({
      code: "type-mismatch",
      message: "Null fields are read-only in v0.2.",
    });
  }
  return ok;
}

export function validateFieldEditKey(
  state: RichCardState,
  cardId: string,
  oldKey: string,
  newKey: string,
  disabledPredefinedKeys: readonly PredefinedKey[],
): ValidationResult {
  if (oldKey === newKey) return ok;
  const errors = checkKeyAvailable(
    newKey,
    cardId,
    state,
    disabledPredefinedKeys,
    oldKey,
  );
  return errors.length === 0 ? ok : fail(...errors);
}

export function validateFieldAdd(
  state: RichCardState,
  cardId: string,
  key: string,
  value: FlatFieldValue,
  type: FlatFieldType,
  disabledPredefinedKeys: readonly PredefinedKey[],
): ValidationResult {
  const keyErrors = checkKeyAvailable(
    key,
    cardId,
    state,
    disabledPredefinedKeys,
  );
  if (keyErrors.length > 0) return fail(...keyErrors);

  if (type === "null") {
    return fail({
      code: "no-null-add",
      message: "Adding null fields is not supported in v0.2.",
    });
  }
  // delegate the value/type sanity check to validateFieldEditValue logic minus card/field lookup
  if (type === "number" && typeof value !== "number")
    return fail({ code: "type-mismatch", message: "Value must be a number." });
  if (type === "boolean" && typeof value !== "boolean")
    return fail({ code: "type-mismatch", message: "Value must be a boolean." });
  if ((type === "string" || type === "date") && typeof value !== "string")
    return fail({ code: "type-mismatch", message: "Value must be a string." });
  if (type === "date" && typeof value === "string" && Number.isNaN(Date.parse(value)))
    return fail({
      code: "invalid-date",
      message: "Must be a valid ISO-8601 date string.",
    });
  return ok;
}

/* ───────── card validators ───────── */

export function validateCardRename(
  state: RichCardState,
  cardId: string,
  newKey: string,
  disabledPredefinedKeys: readonly PredefinedKey[],
): ValidationResult {
  if (!newKey || newKey.trim().length === 0) {
    return fail({ code: "empty-key", message: "Card name cannot be empty." });
  }
  if (isReservedKey(newKey)) {
    return fail({
      code: "reserved-key",
      message: `"${newKey}" is a reserved key.`,
    });
  }
  if (isPredefinedKey(newKey, disabledPredefinedKeys)) {
    return fail({
      code: "predefined-key",
      message: `"${newKey}" is a predefined-key name; pick a different card name.`,
    });
  }
  // Sibling-key collision: find this card's parent + check siblings (excluding self)
  const parentId = findParentIdLocal(state.tree, cardId);
  if (parentId === null) return ok; // root has no siblings
  const parent = findCard(state.tree, parentId);
  if (!parent) return ok;
  const collision = parent.children.some(
    (c) => c.id !== cardId && c.parentKey === newKey,
  );
  if (collision) {
    return fail({
      code: "sibling-collision",
      message: `Sibling "${newKey}" already exists on the parent.`,
    });
  }
  // Also collide with any flat field on the parent (since on serialize they share namespace)
  const fieldCollision = parent.fields.some((f) => f.key === newKey);
  if (fieldCollision) {
    return fail({
      code: "sibling-collision",
      message: `Parent already has a field named "${newKey}".`,
    });
  }
  return ok;
}

function findParentIdLocal(
  tree: { id: string; children: { id: string }[] } & {
    [key: string]: unknown;
  },
  childId: string,
): string | null {
  for (const c of tree.children) {
    if (c.id === childId) return tree.id;
  }
  for (const c of tree.children) {
    // @ts-expect-error recurse into RichCardTree shape
    const inner = findParentIdLocal(c, childId);
    if (inner) return inner;
  }
  return null;
}

export function validateCardRemove(
  state: RichCardState,
  cardId: string,
): ValidationResult {
  if (state.tree.id === cardId) {
    return fail({
      code: "no-root-remove",
      message: "Removing the root card is not supported in v0.2.",
    });
  }
  if (!findCard(state.tree, cardId)) {
    return fail({ code: "no-card", message: "Card not found." });
  }
  return ok;
}

/* ───────── predefined-key validators ───────── */

export function validatePredefinedShape(
  key: PredefinedKey,
  value: unknown,
): ValidationResult {
  switch (key) {
    case "codearea": {
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        typeof (value as Record<string, unknown>).format === "string" &&
        typeof (value as Record<string, unknown>).content === "string"
      )
        return ok;
      return fail({
        code: "shape-mismatch",
        message: "codearea must be { format: string, content: string }.",
      });
    }
    case "image": {
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        typeof (value as Record<string, unknown>).src === "string"
      ) {
        const alt = (value as Record<string, unknown>).alt;
        if (alt === undefined || typeof alt === "string") return ok;
      }
      return fail({
        code: "shape-mismatch",
        message: "image must be { src: string, alt?: string }.",
      });
    }
    case "table": {
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {
        const v = value as Record<string, unknown>;
        if (
          Array.isArray(v.headers) &&
          v.headers.every((h) => typeof h === "string") &&
          Array.isArray(v.rows) &&
          v.rows.every(
            (row) =>
              Array.isArray(row) &&
              row.length === (v.headers as string[]).length &&
              row.every(
                (c) =>
                  c === null ||
                  typeof c === "string" ||
                  typeof c === "number" ||
                  typeof c === "boolean",
              ),
          )
        )
          return ok;
      }
      return fail({
        code: "shape-mismatch",
        message:
          "table must be { headers: string[], rows: scalar[][] } with consistent row widths.",
      });
    }
    case "quote": {
      if (typeof value === "string") return ok;
      return fail({
        code: "shape-mismatch",
        message: "quote must be a string.",
      });
    }
    case "list": {
      if (
        Array.isArray(value) &&
        value.every(
          (v) =>
            v === null ||
            typeof v === "string" ||
            typeof v === "number" ||
            typeof v === "boolean",
        )
      )
        return ok;
      return fail({
        code: "shape-mismatch",
        message: "list must be an array of scalar values.",
      });
    }
  }
}

/* ───────── v0.3: meta validators ───────── */

export function validateMetaEdit(
  state: RichCardState,
  cardId: string,
  key: string,
  value: FlatFieldValue,
): ValidationResult {
  const card = findCard(state.tree, cardId);
  if (!card) return fail({ code: "no-card", message: "Card not found." });
  if (!card.meta || !(key in card.meta)) {
    return fail({ code: "no-meta-key", message: `Meta key "${key}" not found.` });
  }
  if (
    value !== null &&
    typeof value !== "string" &&
    typeof value !== "number" &&
    typeof value !== "boolean"
  ) {
    return fail({
      code: "invalid-meta-value",
      message: "Meta values must be scalars (string / number / boolean / null).",
    });
  }
  return ok;
}

export function validateMetaAdd(
  state: RichCardState,
  cardId: string,
  key: string,
  value: FlatFieldValue,
): ValidationResult {
  if (!key || key.trim().length === 0) {
    return fail({ code: "empty-key", message: "Meta key cannot be empty." });
  }
  if (isReservedKey(key)) {
    return fail({
      code: "reserved-key",
      message: `"${key}" is a reserved key.`,
    });
  }
  const card = findCard(state.tree, cardId);
  if (!card) return fail({ code: "no-card", message: "Card not found." });
  if (card.meta && key in card.meta) {
    return fail({
      code: "meta-key-collision",
      message: `Meta key "${key}" already exists on this card.`,
    });
  }
  if (
    value !== null &&
    typeof value !== "string" &&
    typeof value !== "number" &&
    typeof value !== "boolean"
  ) {
    return fail({
      code: "invalid-meta-value",
      message: "Meta values must be scalars.",
    });
  }
  return ok;
}

/* ───────── v0.3: card-move validator ───────── */

export function validateCardMove(
  state: RichCardState,
  cardId: string,
  newParentId: string,
): ValidationResult {
  if (cardId === newParentId) {
    return fail({
      code: "self-parent",
      message: "Cannot drop a card onto itself.",
    });
  }
  if (!findCard(state.tree, cardId)) {
    return fail({ code: "no-card", message: "Card not found." });
  }
  if (!findCard(state.tree, newParentId)) {
    return fail({ code: "no-parent", message: "Target parent not found." });
  }
  // Cycle detection: target cannot be a descendant of source
  const targetAncestors = findAncestorIds(state.tree, newParentId);
  if (targetAncestors.includes(cardId)) {
    return fail({
      code: "cycle",
      message: "Cannot drop a card into its own descendant (would create a cycle).",
    });
  }
  // Prevent moving root
  if (state.tree.id === cardId) {
    return fail({
      code: "no-root-move",
      message: "Cannot move the root card.",
    });
  }
  // Suppress unused parent-id helper warning
  void findParentId;
  return ok;
}
