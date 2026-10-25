/**
 * story-viewer 0.6.0 - SV11 handlers + `like` permission + initial per-item counts (lib tier).
 */
import { describe, expect, it, vi } from "vitest";
import { defaultStoryKebabActions } from "../lib/kebab";
import {
  canPerformStoryActionInternal,
  resolveStoryPermissions,
} from "../lib/permissions";
import { buildStoryEngagementActionsWithMatrix } from "../lib/engagement-actions";
import { seedToState, storyEngagementReducer } from "../hooks/use-story-engagement-state";
import { DEFAULT_STORY_VIEWER_LABELS } from "../types";
import type { Story, StoryItem } from "../types";

const item: StoryItem = { id: "i1", type: "image", src: "a.jpg" };
const story: Story = {
  id: "s1",
  userId: "author-1",
  username: "ada",
  items: [item],
  createdAt: "2026-01-01T00:00:00Z",
};

describe("SV11: item-level handlers receive { story, item }", () => {
  it("onDeleteStory / onReport / onCopyLink / onSaveToHighlights / onShareToFeed get the objects", () => {
    const onDeleteStory = vi.fn();
    const onSaveToHighlights = vi.fn();
    const onShareToFeed = vi.fn();
    const onReport = vi.fn();
    const onCopyLink = vi.fn();
    const labels = DEFAULT_STORY_VIEWER_LABELS;
    const run = (viewerMode: "owner" | "viewer") =>
      defaultStoryKebabActions({
        story,
        item,
        handlers: { onDeleteStory, onSaveToHighlights, onShareToFeed, onReport, onCopyLink },
        labels,
        viewerMode,
      });
    for (const entry of run("owner")) entry.onClick?.();
    for (const entry of run("viewer")) entry.onClick?.();
    for (const fn of [onDeleteStory, onSaveToHighlights, onShareToFeed, onReport, onCopyLink]) {
      expect(fn).toHaveBeenCalled();
      for (const call of fn.mock.calls) expect(call).toEqual([{ story, item }]);
    }
  });

  it("onMuteAuthor / onBlockAuthor keep receiving the author id", () => {
    const onMuteAuthor = vi.fn();
    const onBlockAuthor = vi.fn();
    const entries = defaultStoryKebabActions({
      story,
      item,
      handlers: { onMuteAuthor, onBlockAuthor },
      labels: DEFAULT_STORY_VIEWER_LABELS,
      viewerMode: "viewer",
    });
    for (const entry of entries) entry.onClick?.();
    expect(onMuteAuthor).toHaveBeenCalledWith("author-1");
    expect(onBlockAuthor).toHaveBeenCalledWith("author-1");
  });
});

describe("the `like` permission action", () => {
  const matrix = (permissions?: Parameters<typeof resolveStoryPermissions>[1]) =>
    resolveStoryPermissions("viewer", permissions);

  it("defaults to the same answer as react", () => {
    expect(matrix().canLike).toBe(matrix().canReact);
    expect(resolveStoryPermissions("owner", undefined).canLike).toBe(false);
    expect(matrix({ canReact: false }).canLike).toBe(false);
    expect(matrix({ canReact: false, canLike: true }).canLike).toBe(true);
  });

  it("a canPerformAction that only knows `react` still gates likes", () => {
    const canPerform = (action: string) => (action === "react" ? false : undefined);
    expect(
      canPerformStoryActionInternal("like", story, item, matrix(), canPerform),
    ).toBe(false);
  });

  it("canPerformAction(\"like\") wins over react", () => {
    const canPerform = (action: string) => (action === "like" ? false : true);
    expect(
      canPerformStoryActionInternal("like", story, item, matrix(), canPerform),
    ).toBe(false);
    expect(
      canPerformStoryActionInternal("react", story, item, matrix(), canPerform),
    ).toBe(true);
  });

  it("an explicit canLike separates likes from reactions", () => {
    const canPerform = (action: string) => (action === "react" ? false : undefined);
    expect(
      canPerformStoryActionInternal("like", story, item, matrix({ canLike: true, canReact: false }), canPerform),
    ).toBe(true);
  });

  it("the engagement bar: like gates on `like`, reaction on `react`", () => {
    const state = seedToState(undefined);
    const kinds = [{ key: "love", icon: "L", label: "Love" }];
    const build = (canPerformAction: (a: string) => boolean | undefined) =>
      buildStoryEngagementActionsWithMatrix({
        story,
        item,
        state,
        viewerMode: "viewer",
        reactionKinds: kinds,
        canPerformAction,
      }).map((a) => a.kind);
    expect(build(() => undefined)).toEqual(["like", "reaction", "comment", "share"]);
    expect(build((a) => (a === "like" ? false : undefined))).toEqual(["reaction", "comment", "share"]);
    expect(build((a) => (a === "react" ? false : a === "like" ? true : undefined))).toEqual([
      "like",
      "comment",
      "share",
    ]);
  });
});

describe("initial per-item counts (StoryItem.engagement)", () => {
  it("seedToState: omitted fields default, null is kept", () => {
    expect(seedToState(undefined)).toEqual({
      likeCount: 0,
      liked: false,
      reactionCount: 0,
      viewerReaction: null,
      replyCount: 0,
    });
    expect(
      seedToState({ likeCount: 12, liked: true, reactionCount: null, viewerReaction: "love" }),
    ).toEqual({
      likeCount: 12,
      liked: true,
      reactionCount: null,
      viewerReaction: "love",
      replyCount: 0,
    });
  });

  it("a like toggle applies on top of the seed", () => {
    const next = storyEngagementReducer(
      {},
      { kind: "like-toggle", storyId: "s1", itemId: "i1", nextLiked: true, seed: { likeCount: 12 } },
    );
    expect(next["s1:i1"]).toMatchObject({ liked: true, likeCount: 13 });
  });

  it("a withheld (null) count stays withheld under local changes; a delta supplies a number", () => {
    const seed = { likeCount: null, reactionCount: null, replyCount: null } as const;
    let state = storyEngagementReducer(
      {},
      { kind: "like-toggle", storyId: "s1", itemId: "i1", nextLiked: true, seed },
    );
    expect(state["s1:i1"]!.likeCount).toBeNull();
    state = storyEngagementReducer(state, {
      kind: "reaction-select",
      storyId: "s1",
      itemId: "i1",
      reactionKind: "love",
      seed,
    });
    expect(state["s1:i1"]!.reactionCount).toBeNull();
    state = storyEngagementReducer(state, {
      kind: "subscribe-delta",
      delta: { kind: "like-changed", storyId: "s1", itemId: "i1", count: 40 },
      seed,
    });
    expect(state["s1:i1"]!.likeCount).toBe(40);
  });

  it("a reply delta and a reaction pick apply on top of the seed", () => {
    let state = storyEngagementReducer(
      {},
      {
        kind: "subscribe-delta",
        delta: { kind: "reply-added", storyId: "s1", itemId: "i1", replyId: "r" },
        seed: { replyCount: 4 },
      },
    );
    expect(state["s1:i1"]!.replyCount).toBe(5);
    state = storyEngagementReducer(
      {},
      {
        kind: "reaction-select",
        storyId: "s1",
        itemId: "i1",
        reactionKind: "wow",
        seed: { reactionCount: 7, viewerReaction: null },
      },
    );
    expect(state["s1:i1"]).toMatchObject({ viewerReaction: "wow", reactionCount: 8 });
  });

  it("the builder shows seeded counts and omits withheld ones", () => {
    const kinds = [{ key: "love", icon: "L", label: "Love" }];
    const withSeed = buildStoryEngagementActionsWithMatrix({
      story,
      item,
      state: seedToState({ likeCount: 12, reactionCount: 30, replyCount: 3 }),
      viewerMode: "viewer",
      reactionKinds: kinds,
    });
    expect(withSeed.find((a) => a.kind === "like")).toMatchObject({ count: 12 });
    expect(withSeed.find((a) => a.kind === "reaction")).toMatchObject({ totalCount: 30 });
    expect(withSeed.find((a) => a.kind === "comment")).toMatchObject({ count: 3 });
    const withheld = buildStoryEngagementActionsWithMatrix({
      story,
      item,
      state: seedToState({ likeCount: null, reactionCount: null, replyCount: null }),
      viewerMode: "viewer",
      reactionKinds: kinds,
    });
    expect(withheld.find((a) => a.kind === "like")).toMatchObject({ count: null });
    expect(withheld.find((a) => a.kind === "reaction")).toMatchObject({ totalCount: null });
    expect(withheld.find((a) => a.kind === "comment")).toMatchObject({ count: undefined });
  });
});
