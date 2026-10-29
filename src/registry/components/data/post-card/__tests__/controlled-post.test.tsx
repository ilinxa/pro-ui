/**
 * PC1: controlled `post`. `post` wins every render; like / bookmark / poll vote show over it while
 * the handler's promise is in flight; accepted changes are reported through `onPostChange`.
 */
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { EngagementDelta } from "../../engagement-bar/types";
import type { PostCardHandle, PostChange } from "../types";
import { card, deferred, installDomStubs, likeButton, makePost } from "./support";

let restore: () => void;
beforeEach(() => {
  restore = installDomStubs();
});
afterEach(() => restore());

const settle = async (action: () => void) => {
  await act(async () => {
    action();
    await Promise.resolve();
  });
};

describe("controlled post: like", () => {
  it("shows the like while the promise is in flight, then reports it once and lets the prop win", async () => {
    const d = deferred();
    const onPostChange = vi.fn();
    render(card({ onPostChange, onLike: () => d.promise }));
    expect(likeButton(screen)).toHaveAccessibleName("Like 10");

    fireEvent.click(likeButton(screen));
    expect(likeButton(screen)).toHaveAccessibleName("Unlike 11");
    expect(onPostChange).not.toHaveBeenCalled();

    await settle(() => d.resolve());
    expect(onPostChange).toHaveBeenCalledTimes(1);
    const [next, change] = onPostChange.mock.calls[0] as [ReturnType<typeof makePost>, PostChange];
    expect(change).toEqual({ kind: "like", liked: true });
    expect(next.isLiked).toBe(true);
    expect(next.likes).toBe(11);
    // The host did not adopt the change: the prop still wins.
    expect(likeButton(screen)).toHaveAccessibleName("Like 10");
  });

  it("rolls a rejected like back and reports nothing", async () => {
    const d = deferred();
    const onPostChange = vi.fn();
    render(card({ onPostChange, onLike: () => d.promise }));
    fireEvent.click(likeButton(screen));
    expect(likeButton(screen)).toHaveAccessibleName("Unlike 11");

    await settle(() => d.reject(new Error("nope")));
    expect(onPostChange).not.toHaveBeenCalled();
    expect(likeButton(screen)).toHaveAccessibleName("Like 10");
  });

  it("optimistic={false}: nothing shows until the host adopts the reported change", async () => {
    const d = deferred();
    const onPostChange = vi.fn();
    render(card({ onPostChange, optimistic: false, onLike: () => d.promise }));
    fireEvent.click(likeButton(screen));
    expect(likeButton(screen)).toHaveAccessibleName("Like 10");
    await settle(() => d.resolve());
    expect(onPostChange).toHaveBeenCalledTimes(1);
  });

  it("latest wins: with two quick toggles, the first settling last is not reported", async () => {
    const first = deferred();
    const second = deferred();
    const queue = [first, second];
    const onPostChange = vi.fn();
    render(card({ onPostChange, onLike: () => queue.shift()!.promise }));

    fireEvent.click(likeButton(screen)); // like -> first
    fireEvent.click(likeButton(screen)); // unlike -> second (changes nothing against the prop: not reported)
    await settle(() => second.resolve());
    expect(onPostChange).not.toHaveBeenCalled();

    // The older "like" settles last: a stale request must not be reported over the newer one.
    await settle(() => first.resolve());
    expect(onPostChange).not.toHaveBeenCalled();
    expect(likeButton(screen)).toHaveAccessibleName("Like 10");
  });

  it("a synchronous handler is reported at once and not shown until the prop changes", () => {
    const onLike = vi.fn();
    const onPostChange = vi.fn();
    const { rerender } = render(card({ onPostChange, onLike }));
    fireEvent.click(likeButton(screen));
    // 0.7.0: a click also passes the click event as a third argument.
    expect(onLike.mock.calls[0]!.slice(0, 2)).toEqual(["p1", true]);
    expect(onPostChange).toHaveBeenCalledTimes(1);
    expect(onPostChange.mock.calls[0]![1]).toEqual({ kind: "like", liked: true });
    expect(likeButton(screen)).toHaveAccessibleName("Like 10");

    rerender(card({ onPostChange, onLike, post: makePost({ isLiked: true, likes: 11 }) }));
    expect(likeButton(screen)).toHaveAccessibleName("Unlike 11");
  });

  it("reports a like even when no onLike handler is wired", () => {
    const onPostChange = vi.fn();
    render(card({ onPostChange }));
    fireEvent.click(likeButton(screen));
    expect(onPostChange).toHaveBeenCalledTimes(1);
  });
});

describe("controlled post: bookmark and poll vote", () => {
  it("reports an accepted bookmark with the next post", async () => {
    const d = deferred();
    const onPostChange = vi.fn();
    render(card({ onPostChange, onBookmark: () => d.promise }));
    const bookmark = () => screen.getByRole("button", { name: /^(Bookmark|Remove bookmark)/ });
    fireEvent.click(bookmark());
    expect(bookmark()).toHaveAccessibleName("Remove bookmark");
    await settle(() => d.resolve());
    expect(onPostChange).toHaveBeenCalledTimes(1);
    const [next, change] = onPostChange.mock.calls[0] as [ReturnType<typeof makePost>, PostChange];
    expect(change).toEqual({ kind: "bookmark", bookmarked: true });
    expect(next.isBookmarked).toBe(true);
    expect(bookmark()).toHaveAccessibleName("Bookmark");
  });

  const poll = {
    options: [
      { id: "a", label: "Cats", voteCount: 3 },
      { id: "b", label: "Dogs", voteCount: 1 },
    ],
    totalVotes: 4,
  };

  it("shows a poll vote while in flight and reports it once accepted", async () => {
    const d = deferred();
    const onPostChange = vi.fn();
    render(card({ onPostChange, post: makePost({ poll }), onVotePoll: () => d.promise }));
    fireEvent.click(screen.getByRole("button", { name: "Cats" }));
    // Results view: the vote buttons are gone and the total counts the viewer's vote.
    expect(screen.queryByRole("button", { name: "Cats" })).toBeNull();
    expect(screen.getByText("5 votes")).toBeInTheDocument();

    await settle(() => d.resolve());
    expect(onPostChange).toHaveBeenCalledTimes(1);
    const [next, change] = onPostChange.mock.calls[0] as [ReturnType<typeof makePost>, PostChange];
    expect(change).toEqual({ kind: "poll-vote", optionId: "a" });
    expect(next.poll?.totalVotes).toBe(5);
    expect(next.poll?.viewerVoteOptionId).toBe("a");
    expect(screen.getByRole("button", { name: "Cats" })).toBeInTheDocument();
  });

  it("drops a rejected poll vote", async () => {
    const d = deferred();
    const onPostChange = vi.fn();
    render(card({ onPostChange, post: makePost({ poll }), onVotePoll: () => d.promise }));
    fireEvent.click(screen.getByRole("button", { name: "Dogs" }));
    await settle(() => d.reject(new Error("closed")));
    expect(onPostChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Dogs" })).toBeInTheDocument();
  });
});

describe("uncontrolled post (no onPostChange)", () => {
  it("rolls a rejected like back", async () => {
    const d = deferred();
    render(card({ onLike: () => d.promise }));
    fireEvent.click(likeButton(screen));
    expect(likeButton(screen)).toHaveAccessibleName("Unlike 11");
    await settle(() => d.reject(new Error("nope")));
    expect(likeButton(screen)).toHaveAccessibleName("Like 10");
  });

  it("keeps a like once its promise resolves", async () => {
    const d = deferred();
    render(card({ onLike: () => d.promise }));
    fireEvent.click(likeButton(screen));
    await settle(() => d.resolve());
    expect(likeButton(screen)).toHaveAccessibleName("Unlike 11");
  });

  it("latest wins: an older rejection does not undo a newer accepted toggle", async () => {
    const first = deferred();
    const second = deferred();
    const queue = [first, second];
    render(card({ onLike: () => queue.shift()!.promise }));
    fireEvent.click(likeButton(screen)); // like
    fireEvent.click(likeButton(screen)); // unlike
    await settle(() => second.resolve());
    await settle(() => first.reject(new Error("late")));
    expect(likeButton(screen)).toHaveAccessibleName("Like 10");
  });

  it("reads `post` once at mount; later prop changes are ignored", () => {
    const { rerender } = render(card({ post: makePost({ likes: 10 }) }));
    rerender(card({ post: makePost({ likes: 99 }) }));
    expect(likeButton(screen)).toHaveAccessibleName("Like 10");
  });

  it("applies a poll vote to the mirror and keeps it", () => {
    const poll = {
      options: [
        { id: "a", label: "Cats", voteCount: 3 },
        { id: "b", label: "Dogs", voteCount: 1 },
      ],
      totalVotes: 4,
    };
    const ref = createRef<PostCardHandle>();
    render(card({ ref, post: makePost({ poll }), onVotePoll: vi.fn() }));
    fireEvent.click(screen.getByRole("button", { name: "Cats" }));
    expect(screen.getByText("5 votes")).toBeInTheDocument();
    expect(ref.current!.getCurrentPost().poll?.viewerVoteOptionId).toBe("a");
  });
});

describe("handle: reset / getCurrentPost", () => {
  it("getCurrentPost returns the shown post, in flight included", async () => {
    const d = deferred();
    const ref = createRef<PostCardHandle>();
    render(card({ ref, onPostChange: vi.fn(), onLike: () => d.promise }));
    fireEvent.click(likeButton(screen));
    expect(ref.current!.getCurrentPost().isLiked).toBe(true);
    await settle(() => d.resolve());
    expect(ref.current!.getCurrentPost().isLiked).toBe(false);
  });

  it("reset(next) replaces the uncontrolled mirror", () => {
    const ref = createRef<PostCardHandle>();
    render(card({ ref }));
    act(() => ref.current!.reset(makePost({ isLiked: true, likes: 42 })));
    expect(likeButton(screen)).toHaveAccessibleName("Unlike 42");
  });

  it("reset(next) in controlled mode drops in-flight changes and the sensitive reveal", async () => {
    const d = deferred();
    const onPostChange = vi.fn();
    const ref = createRef<PostCardHandle>();
    render(
      card({
        ref,
        onPostChange,
        onLike: () => d.promise,
        post: makePost({ isSensitive: true, media: [{ id: "m", type: "image", url: "https://x.test/a.jpg" }] }),
        renderMedia: () => <div data-testid="media" />,
      }),
    );
    expect(screen.getByRole("button", { name: "Show" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show" }));
    expect(screen.queryByRole("button", { name: "Show" })).toBeNull();

    fireEvent.click(likeButton(screen));
    expect(likeButton(screen)).toHaveAccessibleName("Unlike 11");
    act(() => ref.current!.reset(makePost()));
    expect(likeButton(screen)).toHaveAccessibleName("Like 10");
    expect(screen.getByRole("button", { name: "Show" })).toBeInTheDocument();

    // The change settling after the reset is stale: it is not reported.
    await settle(() => d.resolve());
    expect(onPostChange).not.toHaveBeenCalled();
  });
});

describe("realtime engagement deltas", () => {
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

  it("uncontrolled: a delta is applied to the mirror", () => {
    const sub = makeSubscribe();
    render(card({ engagementSubscribe: sub.subscribe }));
    act(() => sub.emit({ kind: "like-changed", count: 25 }));
    expect(likeButton(screen)).toHaveAccessibleName("Like 25");
  });

  it("controlled: a delta is reported with kind delta and not applied", () => {
    const sub = makeSubscribe();
    const onPostChange = vi.fn();
    const onSubscribeEngagementDelta = vi.fn();
    render(card({ engagementSubscribe: sub.subscribe, onPostChange, onSubscribeEngagementDelta }));
    const delta: EngagementDelta = { kind: "like-changed", count: 25 };
    act(() => sub.emit(delta));
    expect(onSubscribeEngagementDelta).toHaveBeenCalledWith(delta);
    expect(onPostChange).toHaveBeenCalledTimes(1);
    const [next, change] = onPostChange.mock.calls[0] as [ReturnType<typeof makePost>, PostChange];
    expect(change).toEqual({ kind: "delta", delta });
    expect(next.likes).toBe(25);
    expect(likeButton(screen)).toHaveAccessibleName("Like 10");
  });

  it("controlled: a delta the post has no field for is not reported", () => {
    const sub = makeSubscribe();
    const onPostChange = vi.fn();
    render(card({ engagementSubscribe: sub.subscribe, onPostChange }));
    act(() => sub.emit({ kind: "liker-removed", userId: "u9" }));
    expect(onPostChange).not.toHaveBeenCalled();
  });
});
