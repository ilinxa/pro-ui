/**
 * T3 widen — `lib/validate-edit.ts`: a registered custom-key name must be
 * unavailable as a flat-field key and as a card name. Without this check the
 * edit commits, but the next parse re-classifies the key as `custom`, runs
 * the host validator against a plain scalar, and silently drops the value —
 * data loss across one round trip. See `isCustomKeyName` in validate-edit.ts.
 */
import { describe, expect, it } from "vitest";
import { parseInput } from "../lib/parse";
import { createInitialState, findCard } from "../lib/reducer";
import {
  validateCardRename,
  validateFieldAdd,
  validateFieldEditKey,
} from "../lib/validate-edit";
import type { CardTreeJsonNode } from "../types";

function buildState() {
  const { tree } = parseInput(
    { title: "Root", x: 1, child1: { title: "Child" } } as unknown as CardTreeJsonNode,
    { disabledPredefinedKeys: [], dateDetection: "auto" },
  );
  return createInitialState(tree!, "none");
}

describe("validate-edit: custom-key names are unavailable as flat-field keys", () => {
  it("validateFieldAdd rejects a registered custom-key name", () => {
    const state = buildState();
    const result = validateFieldAdd(
      state,
      state.tree.id,
      "body",
      "some value",
      "string",
      [],
      ["body"],
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.code === "custom-key")).toBe(true);
    }
  });

  it("validateFieldAdd allows the same key when it is NOT registered as custom", () => {
    const state = buildState();
    const result = validateFieldAdd(
      state,
      state.tree.id,
      "body",
      "some value",
      "string",
      [],
      [], // no custom registrations
    );
    expect(result.ok).toBe(true);
  });

  it("validateFieldEditKey rejects renaming a field to a registered custom-key name", () => {
    const state = buildState();
    const result = validateFieldEditKey(state, state.tree.id, "x", "body", [], ["body"]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.code === "custom-key")).toBe(true);
    }
  });

  it("validateFieldEditKey allows the rename when the name is not a custom registration", () => {
    const state = buildState();
    const result = validateFieldEditKey(state, state.tree.id, "x", "body", [], []);
    expect(result.ok).toBe(true);
  });
});

describe("validate-edit: custom-key names are unavailable as card names", () => {
  it("validateCardRename rejects renaming a card to a registered custom-key name", () => {
    const state = buildState();
    const child = findCard(state.tree, "rc-auto-child1");
    expect(child).toBeTruthy();
    const result = validateCardRename(state, child!.id, "body", [], ["body"]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.code === "custom-key")).toBe(true);
    }
  });

  it("validateCardRename allows the rename when the name is not a custom registration", () => {
    const state = buildState();
    const child = findCard(state.tree, "rc-auto-child1");
    expect(child).toBeTruthy();
    const result = validateCardRename(state, child!.id, "body", [], []);
    expect(result.ok).toBe(true);
  });
});
