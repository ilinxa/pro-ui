/** Pure reducer + state derivation (C6: null counts stay null). */
import { describe, expect, it } from "vitest";
import { deriveStateFromActions, engagementReducer } from "../hooks/use-engagement-state";
import type { EngagementState } from "../types";

const base: EngagementState = {
  liked: false,
  likeCount: null,
  commentCount: null,
  shareCount: null,
  viewCount: null,
  bookmarked: false,
  reactionCounts: null,
  reactionTotalCount: null,
  viewerReaction: null,
};

describe("engagementReducer: withheld counts stay null", () => {
  it("like-toggle flips liked, keeps a null count null (both directions)", () => {
    const on = engagementReducer(base, { kind: "like-toggle" });
    expect(on.liked).toBe(true);
    expect(on.likeCount).toBeNull();
    const off = engagementReducer(on, { kind: "like-toggle" });
    expect(off.liked).toBe(false);
    expect(off.likeCount).toBeNull();
  });

  it("like-toggle on a known count steps it by one and never below 0", () => {
    const on = engagementReducer({ ...base, likeCount: 4 }, { kind: "like-toggle" });
    expect(on.likeCount).toBe(5);
    expect(engagementReducer({ ...on, likeCount: 0 }, { kind: "like-toggle" }).likeCount).toBe(0);
  });

  it("like-set flips liked, keeps a null count null", () => {
    const s = engagementReducer(base, { kind: "like-set", liked: true });
    expect(s.liked).toBe(true);
    expect(s.likeCount).toBeNull();
  });

  it("like-set with the same value is a no-op (identity)", () => {
    expect(engagementReducer(base, { kind: "like-set", liked: false })).toBe(base);
    const liked = { ...base, liked: true, likeCount: 3 };
    expect(engagementReducer(liked, { kind: "like-set", liked: true })).toBe(liked);
  });

  it("like-set with a different value adjusts a known count by one", () => {
    expect(engagementReducer({ ...base, likeCount: 3 }, { kind: "like-set", liked: true }).likeCount).toBe(4);
    expect(engagementReducer({ ...base, liked: true, likeCount: 3 }, { kind: "like-set", liked: false }).likeCount).toBe(2);
  });

  it("bookmark-toggle and bookmark-set", () => {
    expect(engagementReducer(base, { kind: "bookmark-toggle" }).bookmarked).toBe(true);
    const set = engagementReducer(base, { kind: "bookmark-set", bookmarked: true });
    expect(set.bookmarked).toBe(true);
    expect(engagementReducer(set, { kind: "bookmark-set", bookmarked: true })).toBe(set);
    expect(engagementReducer(set, { kind: "bookmark-set", bookmarked: false }).bookmarked).toBe(false);
  });

  const withReaction: EngagementState = {
    ...base,
    reactionCounts: { love: null, laugh: 3 },
    reactionTotalCount: null,
  };

  it("reaction-select keeps null per-kind counts and a null total null", () => {
    const s = engagementReducer(withReaction, { kind: "reaction-select", reactionKind: "love" });
    expect(s.viewerReaction).toBe("love");
    expect(s.reactionCounts).toEqual({ love: null, laugh: 3 });
    expect(s.reactionTotalCount).toBeNull();
    const swapped = engagementReducer(s, { kind: "reaction-select", reactionKind: "laugh" });
    expect(swapped.reactionCounts).toEqual({ love: null, laugh: 4 });
    expect(swapped.reactionTotalCount).toBeNull();
    const cleared = engagementReducer(swapped, { kind: "reaction-select", reactionKind: null });
    expect(cleared.viewerReaction).toBeNull();
    expect(cleared.reactionCounts).toEqual({ love: null, laugh: 3 });
    expect(cleared.reactionTotalCount).toBeNull();
  });

  it("reaction-select updates known counts and total, never below 0", () => {
    const known: EngagementState = { ...base, reactionCounts: { love: 0, laugh: 3 }, reactionTotalCount: 3 };
    const s = engagementReducer(known, { kind: "reaction-select", reactionKind: "love" });
    expect(s.reactionCounts).toEqual({ love: 1, laugh: 3 });
    expect(s.reactionTotalCount).toBe(4);
    const drift: EngagementState = { ...known, viewerReaction: "love", reactionCounts: { love: 0, laugh: 3 }, reactionTotalCount: 0 };
    const c = engagementReducer(drift, { kind: "reaction-select", reactionKind: null });
    expect(c.reactionCounts?.love).toBe(0);
    expect(c.reactionTotalCount).toBe(0);
  });

  it("reaction-select with the same kind, or without a reaction action, is a no-op (identity)", () => {
    expect(engagementReducer(withReaction, { kind: "reaction-select", reactionKind: null })).toBe(withReaction);
    expect(engagementReducer(base, { kind: "reaction-select", reactionKind: "love" })).toBe(base);
  });

  it("reset returns the given state", () => {
    const next = { ...base, liked: true };
    expect(engagementReducer(base, { kind: "reset", next })).toBe(next);
  });
});

describe("deriveStateFromActions: absent counts are withheld", () => {
  it("no actions: everything null / false", () => {
    expect(deriveStateFromActions([])).toEqual(base);
  });

  it("absent / undefined / NaN counts derive null; real counts (including 0) are kept", () => {
    const s = deriveStateFromActions([
      { kind: "like" },
      { kind: "comment", count: undefined },
      { kind: "share", count: Number.NaN },
      { kind: "view-count", count: 0 },
    ]);
    expect(s.likeCount).toBeNull();
    expect(s.commentCount).toBeNull();
    expect(s.shareCount).toBeNull();
    expect(s.viewCount).toBe(0);
  });

  it("explicit counts and seed flags are read", () => {
    const s = deriveStateFromActions([
      { kind: "like", liked: true, count: 12 },
      { kind: "comment", count: 3 },
      { kind: "bookmark", bookmarked: true },
    ]);
    expect(s).toMatchObject({ liked: true, likeCount: 12, commentCount: 3, bookmarked: true });
  });

  it("reaction: kinds without a count derive null, total absent derives null, reactionCounts null without a reaction action", () => {
    const s = deriveStateFromActions([
      {
        kind: "reaction",
        kinds: [
          { key: "love", icon: "L", label: "Love", count: 5 },
          { key: "laugh", icon: "H", label: "Laugh" },
          { key: "wow", icon: "W", label: "Wow", count: null },
        ],
        viewerReaction: "love",
      },
    ]);
    expect(s.reactionCounts).toEqual({ love: 5, laugh: null, wow: null });
    expect(s.reactionTotalCount).toBeNull();
    expect(s.viewerReaction).toBe("love");
    expect(deriveStateFromActions([{ kind: "like", count: 1 }]).reactionCounts).toBeNull();
  });
});
