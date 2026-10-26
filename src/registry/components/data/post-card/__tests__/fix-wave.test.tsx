/**
 * 0.6.0 fix wave: each block is a regression test written to fail without its fix.
 * (numbers follow the architect's verdict list)
 */
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { EngagementDelta } from "../../engagement-bar/types";
import type { PostCardHandle, PostCardProps } from "../types";
import { card, deferred, installDomStubs, KINDS, likeButton, makePost } from "./support";

let restore: () => void;
beforeEach(() => {
  restore = installDomStubs();
});
afterEach(() => restore());

const settleAll = async (action: () => void) => {
  await act(async () => {
    action();
    await Promise.resolve();
    await Promise.resolve();
  });
};

function makeSubscribe() {
  let handler: ((d: EngagementDelta) => void) | null = null;
  return {
    subscribe: (h: (d: EngagementDelta) => void) => {
      handler = h;
      return () => {
        handler = null;
      };
    },
    emit: (d: EngagementDelta) => handler?.(d),
  };
}

const media = [{ id: "m", type: "image" as const, url: "https://x.test/a.jpg" }];
const stubMedia: NonNullable<PostCardProps["renderMedia"]> = (_m, h) => (
  <button type="button" data-testid="media" onClick={() => h.onDoubleTap?.()}>
    media
  </button>
);
const poll = (over: Record<string, unknown> = {}) => ({
  options: [
    { id: "a", label: "Cats", voteCount: 3 },
    { id: "b", label: "Dogs", voteCount: 1 },
  ],
  totalVotes: 4,
  ...over,
});

describe("#1 two changes accepted before a commit both land", () => {
  const like: EngagementDelta = { kind: "like-changed", count: 25, liked: true };
  const comments: EngagementDelta = { kind: "comment-count-changed", count: 9 };

  it.each([
    ["like then comment-count", [like, comments]],
    ["comment-count then like", [comments, like]],
  ] as const)("deltas in one frame (%s)", (_name, frame) => {
    const sub = makeSubscribe();
    const onPostChange = vi.fn();
    render(card({ engagementSubscribe: sub.subscribe, onPostChange }));
    act(() => {
      for (const d of frame) sub.emit(d);
    });
    expect(onPostChange).toHaveBeenCalledTimes(2);
    const last = onPostChange.mock.calls[1]![0];
    expect(last).toMatchObject({ likes: 25, isLiked: true, comments: 9 });
  });

  it.each([
    ["like first", true],
    ["bookmark first", false],
  ] as const)("a like and a bookmark resolving in one task (%s)", async (_name, likeFirst) => {
    const dl = deferred();
    const db = deferred();
    const onPostChange = vi.fn();
    render(card({ onPostChange, onLike: () => dl.promise, onBookmark: () => db.promise }));
    fireEvent.click(likeButton(screen));
    fireEvent.click(screen.getByRole("button", { name: /^Bookmark/ }));
    await settleAll(() => {
      if (likeFirst) {
        dl.resolve();
        db.resolve();
      } else {
        db.resolve();
        dl.resolve();
      }
    });
    expect(onPostChange).toHaveBeenCalledTimes(2);
    expect(onPostChange.mock.calls[1]![0]).toMatchObject({ isLiked: true, isBookmarked: true });
  });

  it("a host that does not adopt a change can ask for it again", () => {
    const onPostChange = vi.fn();
    render(card({ onPostChange }));
    fireEvent.click(likeButton(screen));
    return new Promise<void>((done) =>
      setTimeout(() => {
        fireEvent.click(likeButton(screen));
        expect(onPostChange).toHaveBeenCalledTimes(2);
        done();
      }, 10),
    );
  });
});

describe("#2 controlled state is bound to post.id", () => {
  const A = makePost({ id: "A", likes: 10 });
  const B = makePost({ id: "B", likes: 5 });

  it("a like pending on A does not show on B and its settle is not reported", async () => {
    const d = deferred();
    const onPostChange = vi.fn();
    const props = { onPostChange, onLike: () => d.promise };
    const { rerender } = render(card({ ...props, post: A }));
    fireEvent.click(likeButton(screen));
    expect(likeButton(screen)).toHaveAccessibleName("Unlike 11");
    rerender(card({ ...props, post: B }));
    expect(likeButton(screen)).toHaveAccessibleName("Like 5");
    await settleAll(() => d.resolve());
    expect(onPostChange).not.toHaveBeenCalled();
    expect(likeButton(screen)).toHaveAccessibleName("Like 5");
  });

  it("the sensitive reveal does not carry over", () => {
    const sensitive = (id: string) => makePost({ id, isSensitive: true, media });
    const props = { onPostChange: vi.fn(), renderMedia: stubMedia };
    const { rerender } = render(card({ ...props, post: sensitive("A") }));
    fireEvent.click(screen.getByRole("button", { name: "Show" }));
    expect(screen.queryByRole("button", { name: "Show" })).toBeNull();
    rerender(card({ ...props, post: sensitive("B") }));
    expect(screen.getByRole("button", { name: "Show" })).toBeInTheDocument();
  });

  it("the inline panel goes back to defaultInlinePanel", () => {
    const props = {
      onPostChange: vi.fn(),
      engagementMode: "inline" as const,
      defaultInlinePanel: "likes" as const,
      likers: [],
    };
    const { rerender } = render(card({ ...props, post: A }));
    fireEvent.click(screen.getByRole("button", { name: "Hide" }));
    expect(screen.queryByRole("button", { name: "Hide" })).toBeNull();
    rerender(card({ ...props, post: B }));
    expect(screen.getByRole("button", { name: "Hide" })).toBeInTheDocument();
  });

  it("a poll vote pending on A does not show on B", async () => {
    const d = deferred();
    const props = { onPostChange: vi.fn(), onVotePoll: () => d.promise };
    const { rerender } = render(card({ ...props, post: makePost({ id: "A", poll: poll() }) }));
    fireEvent.click(screen.getByRole("button", { name: "Cats" }));
    expect(screen.queryByRole("button", { name: "Cats" })).toBeNull();
    rerender(card({ ...props, post: makePost({ id: "B", poll: poll() }) }));
    expect(screen.getByRole("button", { name: "Cats" })).toBeInTheDocument();
    await settleAll(() => d.resolve());
    expect(props.onPostChange).not.toHaveBeenCalled();
  });
});

describe("#4 the nested repost follows its prop", () => {
  it("a controlled outer card shows the new original when post.repostOf changes", () => {
    const outer = (content: string) =>
      card({ onPostChange: vi.fn(), post: makePost({ repostOf: makePost({ id: "p0", content }) }) });
    const { rerender } = render(outer("first original"));
    expect(screen.getByText("first original")).toBeInTheDocument();
    rerender(outer("second original"));
    expect(screen.getByText("second original")).toBeInTheDocument();
    expect(screen.queryByText("first original")).toBeNull();
  });
});

describe("#6 / #7 reactions and the double-tap, likers pill", () => {
  it("reactions without onReact: onLike alone does not wire the burst", async () => {
    const { container } = render(
      card({
        post: makePost({ media }),
        renderMedia: stubMedia,
        onLike: vi.fn(),
        reactions: { kinds: KINDS, viewerReaction: null },
      }),
    );
    await act(async () => {
      fireEvent.click(screen.getByTestId("media"));
      await Promise.resolve();
    });
    expect(container.querySelectorAll(".engagement-heart-burst-icon")).toHaveLength(0);
  });

  const inline = (totalCount: number | null | undefined) =>
    card({
      engagementMode: "inline",
      defaultInlinePanel: "likes",
      post: makePost({ likes: 40 }),
      likers: [{ id: "a", name: "Ayşe Kaya" }],
      onLoadMoreLikers: async () => [],
      reactions: { kinds: KINDS, viewerReaction: null, totalCount },
    });

  it("the likers pill follows reactions.totalCount, and null stays withheld", () => {
    const { unmount } = render(inline(100));
    expect(screen.getByRole("button", { name: "+99 more" })).toBeInTheDocument();
    unmount();
    render(inline(null));
    expect(screen.getByRole("button", { name: "More" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^\+\d/ })).toBeNull();
  });
});

describe("#8 renderCommentSection gets the merged handlers", () => {
  it("includes the ones from commentThreadProps", () => {
    const fromBag = vi.fn();
    const loader = vi.fn();
    const renderCommentSection = vi.fn(() => <div>custom thread</div>);
    render(
      card({
        variant: "detail",
        renderCommentSection,
        commentThreadProps: { onAddComment: fromBag, onLikeComment: fromBag, onDeleteComment: fromBag, onLoadMore: loader },
      }),
    );
    expect(renderCommentSection).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        onAddComment: fromBag,
        onLikeComment: fromBag,
        onDeleteComment: fromBag,
        onLoadMoreComments: loader,
      }),
    );
  });
});

describe("#9 poll votes in flight and focus", () => {
  it("optimistic={false}: a second tap while a vote is in flight sends no second vote", async () => {
    const d = deferred();
    const onVotePoll = vi.fn(() => d.promise);
    render(card({ optimistic: false, post: makePost({ poll: poll() }), onVotePoll }));
    const cats = screen.getByRole("button", { name: "Cats" });
    fireEvent.click(cats);
    expect(cats).toHaveAttribute("aria-disabled", "true");
    expect(cats).not.toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Dogs" }));
    expect(onVotePoll).toHaveBeenCalledTimes(1);
    await settleAll(() => d.resolve());
    expect(onVotePoll).toHaveBeenCalledTimes(1);
  });

  it("the handle ignores a second vote while one is in flight", () => {
    const d = deferred();
    const onVotePoll = vi.fn(() => d.promise);
    const ref = createRef<PostCardHandle>();
    render(card({ ref, post: makePost({ poll: poll() }), onVotePoll }));
    act(() => ref.current!.votePoll("a"));
    act(() => ref.current!.votePoll("b"));
    expect(onVotePoll).toHaveBeenCalledTimes(1);
  });

  it("focus moves to the poll group when the vote button unmounts", async () => {
    const user = userEvent.setup();
    render(card({ post: makePost({ poll: poll() }), onVotePoll: vi.fn() }));
    await user.click(screen.getByRole("button", { name: "Cats" }));
    const group = screen.getByRole("group", { name: "Poll" });
    expect(group).toHaveAttribute("tabindex", "-1");
    expect(document.activeElement).toBe(group);
  });
});

describe("#10 no-op changes are not reported", () => {
  it("an echo delta equal to the shown values", () => {
    const sub = makeSubscribe();
    const onPostChange = vi.fn();
    render(card({ engagementSubscribe: sub.subscribe, onPostChange }));
    act(() => sub.emit({ kind: "like-changed", count: 10, liked: false }));
    act(() => sub.emit({ kind: "comment-count-changed", count: 3 }));
    act(() => sub.emit({ kind: "bookmark-changed", bookmarked: false }));
    expect(onPostChange).not.toHaveBeenCalled();
  });

  it("a vote on a poll the viewer already voted on: handler runs, nothing is reported", () => {
    const onVotePoll = vi.fn();
    const onPostChange = vi.fn();
    const ref = createRef<PostCardHandle>();
    render(
      card({
        ref,
        onPostChange,
        onVotePoll,
        post: makePost({ poll: poll({ hasVoted: true, viewerVoteOptionId: "a" }) }),
      }),
    );
    act(() => ref.current!.votePoll("b"));
    expect(onVotePoll).toHaveBeenCalledTimes(1);
    expect(onPostChange).not.toHaveBeenCalled();
  });
});

describe("#11 a template-string label warns once per key", () => {
  it("keeps the default and warns once, naming the key", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const bad = () => ({ pollTotalVotesLabel: "{count} votes" as never, listLikes: "x" as never });
    const post = makePost({ poll: poll({ hasVoted: true }) });
    const { rerender } = render(card({ post, labels: bad() }));
    rerender(card({ post, labels: bad() }));
    rerender(card({ post, labels: bad() }));
    expect(screen.getByText("4 votes")).toBeInTheDocument();
    const messages = warn.mock.calls.map((c) => String(c[0]));
    expect(messages.filter((m) => m.includes("labels.pollTotalVotesLabel"))).toHaveLength(1);
    expect(messages.filter((m) => m.includes("labels.listLikes"))).toHaveLength(1);
    expect(messages[0]).toMatch(/0\.6\.0/);
    warn.mockRestore();
  });

  it("valid function labels do not warn", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(card({ labels: { listLikes: (n) => `${n}` } }));
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("#12 the imperative handle is stable", () => {
  it("keeps one identity across re-renders with inline handlers", () => {
    const seen: PostCardHandle[] = [];
    const refCb = (h: PostCardHandle | null) => {
      if (h) seen.push(h);
    };
    const render1 = () =>
      card({ ref: refCb, onVotePoll: () => {}, onLike: () => {}, post: makePost({ poll: poll() }) });
    const { rerender } = render(render1());
    rerender(render1());
    rerender(render1());
    expect(new Set(seen).size).toBe(1);
  });
});

describe("#14 poll percentages follow the locale", () => {
  const voted = makePost({
    poll: poll({
      hasVoted: true,
      options: [
        { id: "a", label: "Cats", voteCount: 42 },
        { id: "b", label: "Dogs", voteCount: 58 },
      ],
      totalVotes: 100,
    }),
  });
  it("English stays 42%", () => {
    render(card({ post: voted }));
    expect(screen.getByText("42%")).toBeInTheDocument();
  });
  it("Turkish is %42", () => {
    render(card({ post: voted, locale: "tr" }));
    expect(screen.getByText("%42")).toBeInTheDocument();
    expect(screen.getByText("%58")).toBeInTheDocument();
  });
});

describe("#15 openKebab with no kebab", () => {
  it("is a no-op, and the menu does not pop open when an item appears later", () => {
    const ref = createRef<PostCardHandle>();
    const { rerender } = render(card({ ref, kebabActions: () => [{ label: "x", hidden: true }] }));
    act(() => ref.current!.openKebab());
    rerender(card({ ref, kebabActions: () => [{ label: "x" }] }));
    expect(screen.getByRole("button", { name: "Post actions" })).toHaveAttribute("aria-expanded", "false");
  });
});

describe("#18 fixtures use a fixed 'now'", () => {
  it("does not follow the clock", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2031-05-05T00:00:00Z"));
    vi.resetModules();
    const m = await import("../dummy-data");
    vi.useRealTimers();
    expect(m.DUMMY_NOW.toISOString()).toBe("2026-10-26T12:00:00.000Z");
    expect(new Date(m.DUMMY_TEXT_ONLY_POST.createdAt).getTime()).toBeLessThan(m.DUMMY_NOW.getTime());
  });
});
