/**
 * commentReducer — idempotence (a duplicate delta, the own-post echo race), the new actions
 * (`like-set`, `patch`, `restore`, `append-replies`) and the delta kinds added in 0.4.0.
 * Pure: no DOM.
 */
import { describe, expect, it } from "vitest";
import { commentReducer } from "../hooks/use-comment-state";
import type { Comment } from "../types";

const comment = (id: string, over: Partial<Comment> = {}): Comment => ({
  id,
  author: { id: `u-${id}`, name: `User ${id}` },
  content: `Body ${id}`,
  createdAt: "2026-01-01T00:00:00Z",
  likes: 0,
  ...over,
});
const ids = (tree: Comment[]): string[] =>
  tree.flatMap((c) => [c.id, ...ids(c.replies ?? [])]);

describe("idempotence", () => {
  it("a duplicate `added` delta changes nothing (same array back)", () => {
    const start = [comment("a"), comment("b")];
    const delta = { kind: "added", comment: comment("a", { content: "again" }) } as const;
    expect(commentReducer(start, { kind: "subscribe-delta", delta })).toBe(start);
  });

  it("a duplicate `added` reply delta changes nothing", () => {
    const start = [comment("a", { replies: [comment("r1")] })];
    const delta = { kind: "added", comment: comment("r1"), parentId: "a" } as const;
    expect(commentReducer(start, { kind: "subscribe-delta", delta })).toBe(start);
  });

  it("`add` skips an id that is already anywhere in the tree", () => {
    const start = [comment("a", { replies: [comment("r1")] })];
    expect(commentReducer(start, { kind: "add", comment: comment("r1") })).toBe(start);
    expect(commentReducer(start, { kind: "add", comment: comment("r1"), parentId: "a" })).toBe(start);
  });

  it("`append-page` skips known ids and duplicates inside the page", () => {
    const start = [comment("a"), comment("b")];
    const next = commentReducer(start, {
      kind: "append-page",
      comments: [comment("b"), comment("c"), comment("c")],
    });
    expect(ids(next)).toEqual(["a", "b", "c"]);
    expect(commentReducer(start, { kind: "append-page", comments: [comment("a")] })).toBe(start);
  });

  it("`append-replies` appends under the parent and skips known ids", () => {
    const start = [comment("a", { replies: [comment("r1")] })];
    const next = commentReducer(start, {
      kind: "append-replies",
      parentId: "a",
      comments: [comment("r1"), comment("r2")],
    });
    expect(ids(next)).toEqual(["a", "r1", "r2"]);
    expect(
      commentReducer(next, { kind: "append-replies", parentId: "a", comments: [comment("r2")] }),
    ).toBe(next);
  });
});

describe("own-post echo (clientId)", () => {
  const pending = comment("temp-1", { clientId: "cid-1", content: "hi" });

  it("an `added` delta carrying a pending comment's clientId replaces it in place", () => {
    const start = [comment("x"), pending];
    const real = comment("real-1", { clientId: "cid-1", content: "hi" });
    const next = commentReducer(start, {
      kind: "subscribe-delta",
      delta: { kind: "added", comment: real },
    });
    expect(ids(next)).toEqual(["x", "real-1"]);
  });

  it("keeps the replies the pending comment collected", () => {
    const start = [{ ...pending, replies: [comment("r1")] }];
    const real = comment("real-1", { clientId: "cid-1" });
    const next = commentReducer(start, {
      kind: "subscribe-delta",
      delta: { kind: "added", comment: real },
    });
    expect(ids(next)).toEqual(["real-1", "r1"]);
  });

  it("matches the id first: a known id wins over a clientId match", () => {
    const start = [comment("real-1"), pending];
    const echo = comment("real-1", { clientId: "cid-1" });
    expect(
      commentReducer(start, { kind: "subscribe-delta", delta: { kind: "added", comment: echo } }),
    ).toBe(start);
  });

  it("an unknown clientId adds the comment as usual", () => {
    const next = commentReducer([pending], {
      kind: "subscribe-delta",
      delta: { kind: "added", comment: comment("real-2", { clientId: "cid-2" }) },
    });
    expect(ids(next)).toEqual(["real-2", "temp-1"]);
  });
});

describe("swap-temp", () => {
  it("replaces the temp and keeps its replies when the real comment has none", () => {
    const start = [comment("temp-1", { replies: [comment("r1")] })];
    const next = commentReducer(start, { kind: "swap-temp", tempId: "temp-1", real: comment("real") });
    expect(ids(next)).toEqual(["real", "r1"]);
  });

  it("uses the real comment's replies when it has some", () => {
    const start = [comment("temp-1", { replies: [comment("r1")] })];
    const next = commentReducer(start, {
      kind: "swap-temp",
      tempId: "temp-1",
      real: comment("real", { replies: [comment("r9")] }),
    });
    expect(ids(next)).toEqual(["real", "r9"]);
  });

  it("removes the temp when the real id already arrived (the echo won the race)", () => {
    const start = [comment("temp-1"), comment("real")];
    const next = commentReducer(start, { kind: "swap-temp", tempId: "temp-1", real: comment("real") });
    expect(ids(next)).toEqual(["real"]);
  });
});

describe("likes", () => {
  it("like-toggle moves the count and is idempotent", () => {
    const start = [comment("a", { likes: 3 })];
    const liked = commentReducer(start, { kind: "like-toggle", commentId: "a", nextLiked: true });
    expect(liked[0]).toMatchObject({ isLiked: true, likes: 4 });
    expect(commentReducer(liked, { kind: "like-toggle", commentId: "a", nextLiked: true })).toBe(liked);
    expect(
      commentReducer(liked, { kind: "like-toggle", commentId: "a", nextLiked: false })[0],
    ).toMatchObject({ isLiked: false, likes: 3 });
  });

  it("a withheld count (null) stays null", () => {
    const start = [comment("a", { likes: null })];
    const liked = commentReducer(start, { kind: "like-toggle", commentId: "a", nextLiked: true });
    expect(liked[0]).toMatchObject({ isLiked: true, likes: null });
    expect(
      commentReducer(liked, { kind: "like-toggle", commentId: "a", nextLiked: false })[0].likes,
    ).toBeNull();
  });

  it("like-set sets the state exactly", () => {
    const start = [comment("a", { likes: 3, isLiked: false })];
    expect(
      commentReducer(start, { kind: "like-set", commentId: "a", liked: true, likes: 9 })[0],
    ).toMatchObject({ isLiked: true, likes: 9 });
    expect(
      commentReducer(start, { kind: "like-set", commentId: "a", liked: true, likes: null })[0].likes,
    ).toBeNull();
  });

  it("a `liked` delta accepts count: null", () => {
    const next = commentReducer([comment("a", { likes: 5 })], {
      kind: "subscribe-delta",
      delta: { kind: "liked", commentId: "a", liked: true, count: null },
    });
    expect(next[0]).toMatchObject({ isLiked: true, likes: null });
  });
});

describe("patch / restore / deltas", () => {
  it("patch changes fields and keeps id and replies", () => {
    const start = [comment("a", { replies: [comment("r1")] })];
    const next = commentReducer(start, {
      kind: "patch",
      commentId: "a",
      patch: { content: "new", edited: true, isPinned: true },
    });
    expect(next[0]).toMatchObject({ id: "a", content: "new", edited: true, isPinned: true });
    expect(ids(next)).toEqual(["a", "r1"]);
  });

  it("patch-content does not flip `edited`", () => {
    const next = commentReducer([comment("a")], { kind: "patch-content", commentId: "a", content: "x" });
    expect(next[0].content).toBe("x");
    expect(next[0].edited).toBeUndefined();
  });

  it("restore re-inserts a removed top-level comment at its index", () => {
    const start = [comment("a"), comment("c")];
    const next = commentReducer(start, { kind: "restore", comment: comment("b"), index: 1 });
    expect(ids(next)).toEqual(["a", "b", "c"]);
  });

  it("restore re-inserts a reply under its parent at its index, with its subtree", () => {
    const start = [comment("a", { replies: [comment("r1"), comment("r3")] })];
    const next = commentReducer(start, {
      kind: "restore",
      comment: comment("r2", { replies: [comment("deep")] }),
      parentId: "a",
      index: 1,
    });
    expect(ids(next)).toEqual(["a", "r1", "r2", "deep", "r3"]);
  });

  it("restore is idempotent", () => {
    const start = [comment("a")];
    expect(commentReducer(start, { kind: "restore", comment: comment("a"), index: 0 })).toBe(start);
  });

  it("`edited` delta sets content and edited: true", () => {
    const next = commentReducer([comment("a")], {
      kind: "subscribe-delta",
      delta: { kind: "edited", commentId: "a", content: "hello" },
    });
    expect(next[0]).toMatchObject({ content: "hello", edited: true });
  });

  it("`state` delta sets the state (the subtree stays)", () => {
    const start = [comment("a", { replies: [comment("r1")] })];
    const next = commentReducer(start, {
      kind: "subscribe-delta",
      delta: { kind: "state", commentId: "a", state: "hidden" },
    });
    expect(next[0].state).toBe("hidden");
    expect(ids(next)).toEqual(["a", "r1"]);
  });

  it("`reacted` delta sets the reactions", () => {
    const reactions = { viewerReaction: "love", counts: { love: 2 }, totalCount: 2 };
    const next = commentReducer([comment("a")], {
      kind: "subscribe-delta",
      delta: { kind: "reacted", commentId: "a", reactions },
    });
    expect(next[0].reactions).toEqual(reactions);
  });

  it("`removed` delta prunes the comment with its replies", () => {
    const start = [comment("a", { replies: [comment("r1")] }), comment("b")];
    const next = commentReducer(start, {
      kind: "subscribe-delta",
      delta: { kind: "removed", commentId: "a" },
    });
    expect(ids(next)).toEqual(["b"]);
  });

  it("reset replaces the tree", () => {
    const next = [comment("z")];
    expect(commentReducer([comment("a")], { kind: "reset", next })).toBe(next);
  });
});
