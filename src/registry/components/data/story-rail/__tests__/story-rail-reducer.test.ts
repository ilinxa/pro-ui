/**
 * Pure reducer for story-rail (v0.4.0). Covers every local action and every
 * subscribe-delta kind, plus the reference-equality contract the controlled
 * mode relies on (a no-op must return the SAME array, so `onItemsChange` is
 * not called for nothing).
 */
import { describe, expect, it } from "vitest";
import { storyRailReducer } from "../hooks/use-story-rail-state";
import type { StoryRailItem } from "../types";

const A: StoryRailItem = { id: "a", username: "ada", hasUnread: true };
const B: StoryRailItem = { id: "b", username: "bob", hasUnread: true };
const C: StoryRailItem = { id: "c", username: "cy", hasUnread: false };
const base = (): StoryRailItem[] => [A, B];

describe("storyRailReducer: local actions", () => {
  it("add defaults to the start", () => {
    expect(storyRailReducer(base(), { kind: "add", item: C }).map((i) => i.id)).toEqual(["c", "a", "b"]);
  });

  it("add position 'end' appends", () => {
    expect(
      storyRailReducer(base(), { kind: "add", item: C, position: "end" }).map((i) => i.id),
    ).toEqual(["a", "b", "c"]);
  });

  it("remove drops the item", () => {
    expect(storyRailReducer(base(), { kind: "remove", itemId: "a" }).map((i) => i.id)).toEqual(["b"]);
  });

  it("viewed flips hasUnread to false on that item only", () => {
    const next = storyRailReducer(base(), { kind: "viewed", itemId: "a" });
    expect(next.find((i) => i.id === "a")?.hasUnread).toBe(false);
    expect(next.find((i) => i.id === "b")?.hasUnread).toBe(true);
  });

  it("update merges a partial", () => {
    const next = storyRailReducer(base(), {
      kind: "update",
      itemId: "b",
      partial: { muted: true, username: "bobby" },
    });
    expect(next[1]).toMatchObject({ id: "b", muted: true, username: "bobby", hasUnread: true });
  });

  it("reset returns the supplied list by reference", () => {
    const next = [C];
    expect(storyRailReducer(base(), { kind: "reset", next })).toBe(next);
  });

  it("does not mutate the previous state", () => {
    const prev = base();
    storyRailReducer(prev, { kind: "viewed", itemId: "a" });
    storyRailReducer(prev, { kind: "add", item: C });
    expect(prev).toEqual([A, B]);
    expect(prev[0].hasUnread).toBe(true);
  });
});

describe("storyRailReducer: subscribe deltas", () => {
  it("added (default start / explicit end)", () => {
    expect(
      storyRailReducer(base(), { kind: "subscribe-delta", delta: { kind: "added", item: C } }).map((i) => i.id),
    ).toEqual(["c", "a", "b"]);
    expect(
      storyRailReducer(base(), {
        kind: "subscribe-delta",
        delta: { kind: "added", item: C, position: "end" },
      }).map((i) => i.id),
    ).toEqual(["a", "b", "c"]);
  });

  it("removed", () => {
    expect(
      storyRailReducer(base(), { kind: "subscribe-delta", delta: { kind: "removed", itemId: "b" } }).map(
        (i) => i.id,
      ),
    ).toEqual(["a"]);
  });

  it("viewed", () => {
    const next = storyRailReducer(base(), { kind: "subscribe-delta", delta: { kind: "viewed", itemId: "b" } });
    expect(next[1].hasUnread).toBe(false);
    expect(next[0].hasUnread).toBe(true);
  });

  it("updated", () => {
    const next = storyRailReducer(base(), {
      kind: "subscribe-delta",
      delta: { kind: "updated", itemId: "a", partial: { previewImage: "x.jpg" } },
    });
    expect(next[0].previewImage).toBe("x.jpg");
  });
});

describe("storyRailReducer: no-op actions keep the same reference", () => {
  it("remove / viewed / update of an unknown id", () => {
    const prev = base();
    expect(storyRailReducer(prev, { kind: "remove", itemId: "zzz" })).toBe(prev);
    expect(storyRailReducer(prev, { kind: "viewed", itemId: "zzz" })).toBe(prev);
    expect(storyRailReducer(prev, { kind: "update", itemId: "zzz", partial: { muted: true } })).toBe(prev);
  });

  it("subscribe-delta removed / viewed / updated of an unknown id", () => {
    const prev = base();
    expect(
      storyRailReducer(prev, { kind: "subscribe-delta", delta: { kind: "removed", itemId: "zzz" } }),
    ).toBe(prev);
    expect(
      storyRailReducer(prev, { kind: "subscribe-delta", delta: { kind: "viewed", itemId: "zzz" } }),
    ).toBe(prev);
    expect(
      storyRailReducer(prev, {
        kind: "subscribe-delta",
        delta: { kind: "updated", itemId: "zzz", partial: { muted: true } },
      }),
    ).toBe(prev);
  });

  it("a real change returns a NEW reference (control)", () => {
    const prev = base();
    expect(storyRailReducer(prev, { kind: "viewed", itemId: "a" })).not.toBe(prev);
  });
});
