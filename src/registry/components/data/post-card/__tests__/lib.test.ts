/** Pure logic: relative-time formatting, label resolution, post-state helpers, permissions. */
import { describe, expect, it } from "vitest";
import {
  createRelativeTimeFormatter,
  defaultRelativeTime,
  resolveLocale,
} from "../../comment-thread/lib/format-time";
import { mergeLabels, resolveLabels } from "../lib/labels";
import { PERMISSION_DEFAULTS_BY_MODE, resolvePostPermissions } from "../lib/permissions";
import { applyBookmark, applyDelta, applyLike, applyVote } from "../hooks/use-post-state";
import { defaultPostCardLabels, type Post } from "../types";

const NOW = new Date("2026-03-10T12:00:00Z");
const ago = (ms: number) => new Date(NOW.getTime() - ms);
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe("createRelativeTimeFormatter", () => {
  it('"en" without a time zone is exactly the English formatter', () => {
    expect(createRelativeTimeFormatter("en")).toBe(defaultRelativeTime);
    expect(createRelativeTimeFormatter(undefined)).toBe(defaultRelativeTime);
    expect(defaultRelativeTime(ago(10_000), NOW)).toBe("Just now");
    expect(defaultRelativeTime(ago(5 * MIN), NOW)).toBe("5m");
    expect(defaultRelativeTime(ago(2 * HOUR), NOW)).toBe("2h");
    expect(defaultRelativeTime(ago(3 * DAY), NOW)).toBe("3d");
    expect(defaultRelativeTime(ago(14 * DAY), NOW)).toBe("2w");
  });

  it("Turkish uses Intl.RelativeTimeFormat, then a spelled-out date beyond five weeks", () => {
    const tr = createRelativeTimeFormatter("tr");
    expect(tr(ago(5 * MIN), NOW)).toBe("5 dk. önce");
    expect(tr(ago(2 * HOUR), NOW)).toBe("2 sa. önce");
    expect(tr(ago(3 * DAY), NOW)).toBe("3 gün önce");
    expect(tr(new Date("2026-01-05T12:00:00Z"), NOW)).toBe("5 Ocak");
    expect(tr(new Date("2025-01-05T12:00:00Z"), NOW)).toBe("5 Ocak 2025");
  });

  it("a time zone moves the day (and the year boundary) it prints", () => {
    const fmt = createRelativeTimeFormatter("en", "Pacific/Auckland");
    // 2025-12-31 20:00Z is already January 1 in Auckland (UTC+13).
    expect(fmt(new Date("2025-12-31T20:00:00Z"), NOW)).toBe("January 1, 2026".replace(", 2026", ""));
  });

  it("reads a future date as 'in …'", () => {
    const tr = createRelativeTimeFormatter("tr");
    expect(tr(new Date(NOW.getTime() + 3 * HOUR), NOW)).toBe("3 sa. sonra");
  });

  it("an invalid locale or time zone falls back instead of throwing", () => {
    expect(resolveLocale("en_US")).toBe("en");
    expect(createRelativeTimeFormatter("en_US")).toBe(defaultRelativeTime);
    expect(createRelativeTimeFormatter("en", "Not/AZone")).toBe(defaultRelativeTime);
  });

  it("an unparsable date renders nothing", () => {
    expect(createRelativeTimeFormatter("tr")(new Date("nope"), NOW)).toBe("");
  });
});

describe("resolveLabels", () => {
  it("returns the defaults without input", () => {
    expect(resolveLabels(undefined)).toEqual(defaultPostCardLabels);
  });

  it("an explicit undefined keeps the default", () => {
    expect(resolveLabels({ edit: undefined }).edit).toBe("Edit");
  });

  it("keeps a function label, drops a non-function value for a function label", () => {
    const fn = () => "x";
    expect(resolveLabels({ listLikes: fn }).listLikes).toBe(fn);
    const stale = { likersMoreLabel: "+{count} more" } as never;
    expect(resolveLabels(stale).likersMoreLabel).toBe(defaultPostCardLabels.likersMoreLabel);
  });

  it("leaves the nested and deprecated keys out of the flat labels", () => {
    const out = resolveLabels({ commentLabels: { composerSend: "x" }, formatRelativeTime: () => "x" });
    expect(out).not.toHaveProperty("commentLabels");
    expect(out).not.toHaveProperty("formatRelativeTime");
  });

  it("default label functions pluralise", () => {
    expect(defaultPostCardLabels.pollTotalVotesLabel(1, "1")).toBe("1 vote");
    expect(defaultPostCardLabels.pollTotalVotesLabel(2, "2")).toBe("2 votes");
    expect(defaultPostCardLabels.listShares(1, "1")).toBe("1 share");
    expect(defaultPostCardLabels.likersMoreLabel(3, "3")).toBe("+3 more");
    expect(defaultPostCardLabels.pollClosesAtLabel("in 2h")).toBe("Closes in 2h");
  });

  it("mergeLabels skips undefined overrides", () => {
    expect(mergeLabels({ a: "1", b: "2" }, { a: undefined, b: "3" })).toEqual({ a: "1", b: "3" });
    const base = { a: "1" };
    expect(mergeLabels(base, undefined)).toBe(base);
  });
});

const post = (over: Partial<Post> = {}): Post => ({
  id: "p",
  author: { id: "u", name: "U" },
  content: "c",
  createdAt: 0,
  likes: 2,
  comments: 0,
  ...over,
});

describe("post-state helpers", () => {
  it("applyLike is idempotent and never goes below zero", () => {
    const liked = applyLike(post(), true);
    expect(liked).toMatchObject({ isLiked: true, likes: 3 });
    expect(applyLike(liked, true)).toBe(liked);
    expect(applyLike(post({ likes: 0, isLiked: true }), false).likes).toBe(0);
  });

  it("applyBookmark is idempotent", () => {
    const marked = applyBookmark(post(), true);
    expect(marked.isBookmarked).toBe(true);
    expect(applyBookmark(marked, true)).toBe(marked);
  });

  it("applyVote bumps the option and the total once, and leaves a voted poll alone", () => {
    const poll = {
      options: [
        { id: "a", label: "A", voteCount: 1 },
        { id: "b", label: "B", voteCount: 1 },
      ],
      totalVotes: 2,
    };
    const voted = applyVote(post({ poll }), "a");
    expect(voted.poll).toMatchObject({ hasVoted: true, viewerVoteOptionId: "a", totalVotes: 3 });
    expect(voted.poll!.options[0]!.voteCount).toBe(2);
    expect(voted.poll!.options[1]!.voteCount).toBe(1);
    expect(applyVote(voted, "b")).toBe(voted);
    expect(applyVote(post(), "a")).toEqual(post());
  });

  it("applyDelta folds the deltas a post has fields for, and returns the post for the rest", () => {
    const p = post();
    expect(applyDelta(p, { kind: "like-changed", count: 9, liked: true })).toMatchObject({ likes: 9, isLiked: true });
    expect(applyDelta(p, { kind: "comment-count-changed", count: 4 }).comments).toBe(4);
    expect(applyDelta(p, { kind: "liker-removed", userId: "x" })).toBe(p);
  });
});

describe("permissions.disabled", () => {
  it("is additive: the matrix keeps its booleans and carries the disabled map", () => {
    const m = resolvePostPermissions("owner", { canDelete: false, disabled: { edit: true } });
    expect(m.canDelete).toBe(false);
    expect(m.canEdit).toBe(true);
    expect(m.disabled).toEqual({ edit: true });
  });

  it("does not leak into the shared defaults", () => {
    resolvePostPermissions("viewer", { disabled: { report: true } });
    expect(PERMISSION_DEFAULTS_BY_MODE.viewer.disabled).toEqual({});
  });
});
