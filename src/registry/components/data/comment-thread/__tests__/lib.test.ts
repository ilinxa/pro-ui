/**
 * Pure helpers: label resolution (an explicit `undefined` keeps the default — C2), permission
 * defaults and overrides (CT4), and the reaction arithmetic behind the optimistic pick (CT5).
 */
import { describe, expect, it } from "vitest";
import { resolveLabels } from "../lib/labels";
import { resolvePermissions } from "../lib/permissions";
import { nextReactions } from "../lib/reactions";
import { defaultCommentThreadLabels, type Comment } from "../types";

const comment = (authorId: string, over: Partial<Comment> = {}): Comment => ({
  id: "c",
  author: { id: authorId, name: authorId },
  content: "x",
  createdAt: 0,
  likes: 0,
  ...over,
});

describe("resolveLabels", () => {
  it("returns the English defaults for no labels", () => {
    expect(resolveLabels(undefined)).toEqual(defaultCommentThreadLabels);
  });

  it("merges a partial over the defaults", () => {
    const labels = resolveLabels({ reply: "Yanıtla", replyTo: (name) => `→ ${name}` });
    expect(labels.reply).toBe("Yanıtla");
    expect(labels.replyTo("Ada")).toBe("→ Ada");
    expect(labels.delete).toBe("Delete");
  });

  it("an explicit undefined keeps the default instead of erasing it", () => {
    const labels = resolveLabels({ reply: undefined, viewReplies: undefined, tombstone: undefined });
    expect(labels.reply).toBe("Reply");
    expect(labels.viewReplies(2)).toBe("View 2 replies");
    expect(labels.tombstone("hidden")).toBe("This comment was hidden");
  });

  it("does not carry the deprecated formatter into the string labels", () => {
    const labels = resolveLabels({ formatRelativeTime: () => "x" }) as unknown as Record<string, unknown>;
    expect("formatRelativeTime" in labels).toBe(false);
  });

  it("label functions pluralize and order words themselves", () => {
    expect(defaultCommentThreadLabels.viewReplies(1)).toBe("View 1 reply");
    expect(defaultCommentThreadLabels.kebabAriaLabel("Ada")).toBe("Comment actions for Ada");
    expect(defaultCommentThreadLabels.tombstone("deleted")).toBe("This comment was deleted");
    expect(defaultCommentThreadLabels.tombstone("removed")).toBe("This comment was removed");
  });
});

describe("resolvePermissions", () => {
  const viewer = { id: "me", name: "Me" };

  it("defaults for your own comment", () => {
    expect(resolvePermissions(comment("me"), viewer)).toEqual({
      canEdit: true,
      canDelete: true,
      canPin: false,
      canHide: false,
      canReply: true,
      canReact: true,
      canReport: false,
    });
  });

  it("defaults for someone else's comment", () => {
    expect(resolvePermissions(comment("them"), viewer)).toMatchObject({
      canEdit: false,
      canDelete: false,
      canReply: true,
      canReport: true,
    });
  });

  it("signed out: no reply, no ownership", () => {
    expect(resolvePermissions(comment("them"), undefined)).toMatchObject({
      canReply: false,
      canDelete: false,
      canReport: true,
    });
  });

  it("each defined key wins, an omitted key keeps the default", () => {
    const p = resolvePermissions(
      comment("them", { permissions: { canDelete: true, canReport: false, canPin: true } }),
      viewer,
    );
    expect(p).toMatchObject({ canDelete: true, canReport: false, canPin: true, canEdit: false, canReply: true });
  });

  it("an explicit false beats an ownership default", () => {
    expect(resolvePermissions(comment("me", { permissions: { canDelete: false } }), viewer).canDelete).toBe(false);
  });
});

describe("nextReactions", () => {
  it("picking a reaction moves the tallies and the total", () => {
    const next = nextReactions({ viewerReaction: null, counts: { love: 2, laugh: 1 }, totalCount: 3 }, "love");
    expect(next).toEqual({ viewerReaction: "love", counts: { love: 3, laugh: 1 }, totalCount: 4 });
  });

  it("switching moves one tally to the other and keeps the total", () => {
    const next = nextReactions({ viewerReaction: "love", counts: { love: 3, laugh: 1 }, totalCount: 4 }, "laugh");
    expect(next).toEqual({ viewerReaction: "laugh", counts: { love: 2, laugh: 2 }, totalCount: 4 });
  });

  it("clearing lowers the tally and the total, never below zero", () => {
    const next = nextReactions({ viewerReaction: "love", counts: { love: 0 }, totalCount: 0 }, null);
    expect(next).toEqual({ viewerReaction: null, counts: { love: 0 }, totalCount: 0 });
  });

  it("a withheld tally or total stays withheld", () => {
    const next = nextReactions({ viewerReaction: null, counts: { love: null }, totalCount: null }, "love");
    expect(next.counts).toEqual({ love: null });
    expect(next.totalCount).toBeNull();
  });

  it("picking the current reaction again changes nothing but is stable", () => {
    const current = { viewerReaction: "love", counts: { love: 2 }, totalCount: 2 };
    expect(nextReactions(current, "love")).toEqual(current);
  });

  it("works from no reaction data at all", () => {
    expect(nextReactions(undefined, "love").viewerReaction).toBe("love");
  });
});
