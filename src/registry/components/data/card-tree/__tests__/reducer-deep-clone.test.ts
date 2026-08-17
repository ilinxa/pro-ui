/**
 * T3 widen — `lib/reducer.ts`'s `deepCloneWithFreshIds` (used by the
 * `card-duplicate` action) must deep-clone a custom entry's value, not just
 * shallow-spread the wrapper. A custom block's value is arbitrary host-owned
 * JSON (e.g. a Plate Value array); some editors mutate it in place before
 * calling `onSave`. A shared reference would let editing the duplicate
 * corrupt the source card.
 */
import { describe, expect, it } from "vitest";
import { parseInput } from "../lib/parse";
import { createInitialState, findCard, findParentId, reducer } from "../lib/reducer";
import { resolveCustomKeys } from "../lib/custom-keys";
import type { CardTreeJsonNode } from "../types";
import { bodyKey } from "./fixtures";

function buildState() {
  const resolved = resolveCustomKeys([bodyKey]);
  const { tree } = parseInput(
    {
      title: "Root",
      item1: {
        title: "Item",
        body: [{ type: "heading", level: 1, text: "original" }],
      },
    } as unknown as CardTreeJsonNode,
    { disabledPredefinedKeys: [], dateDetection: "auto", customKeys: resolved.keys },
  );
  return createInitialState(tree!, "none");
}

describe("card-duplicate: deep-clones custom entry values", () => {
  it("mutating the duplicate's array-valued custom entry leaves the original untouched", () => {
    const state = buildState();
    const source = findCard(state.tree, "rc-auto-item1");
    expect(source).toBeTruthy();
    const parentId = findParentId(state.tree, source!.id);
    expect(parentId).not.toBeNull();

    const next = reducer(state, {
      type: "card-duplicate",
      cardId: source!.id,
      newCardId: "dup-1",
    });

    const duplicate = findCard(next.tree, "dup-1");
    expect(duplicate).toBeTruthy();

    const dupEntry = duplicate!.predefined.find((p) => p.key === "body") as
      | { value: unknown }
      | undefined;
    const originalEntryBefore = source!.predefined.find((p) => p.key === "body") as
      | { value: unknown }
      | undefined;
    expect(dupEntry).toBeTruthy();
    expect(originalEntryBefore).toBeTruthy();

    // Not the same array reference.
    expect(dupEntry!.value).not.toBe(originalEntryBefore!.value);

    // Mutate the duplicate's array in place, as a careless editor might.
    (dupEntry!.value as Array<{ text: string }>).push({ text: "injected" });
    (dupEntry!.value as Array<{ text: string }>)[0].text = "mutated";

    // Re-fetch the original from the POST-duplicate tree (the tree the
    // duplicate action actually returned) and confirm it is unaffected.
    const originalAfter = findCard(next.tree, source!.id);
    const originalEntryAfter = originalAfter!.predefined.find(
      (p) => p.key === "body",
    ) as { value: unknown } | undefined;

    expect((originalEntryAfter!.value as Array<{ text: string }>).length).toBe(1);
    expect((originalEntryAfter!.value as Array<{ text: string }>)[0].text).toBe(
      "original",
    );
  });

  it("the duplicate gets a fresh id, distinct from the source", () => {
    const state = buildState();
    const source = findCard(state.tree, "rc-auto-item1")!;
    const next = reducer(state, {
      type: "card-duplicate",
      cardId: source.id,
      newCardId: "dup-2",
    });
    const duplicate = findCard(next.tree, "dup-2");
    expect(duplicate).toBeTruthy();
    expect(duplicate!.id).not.toBe(source.id);
  });
});
