/**
 * Media double-tap vs. the like state — v0.5.1.
 *
 * Double-tap used to call the engagement bar's `triggerLike()` (a TOGGLE) and
 * then play the heart burst unconditionally, so on an already-liked post it
 * UNLIKED while the heart animated, and with no applicable like action (custom
 * `engagementActions` without `like`, or a `renderEngagementBar` takeover) it
 * burst with no effect. The handle's `triggerLike()` had the same
 * burst-without-effect on the unlike path.
 */
import { createRef } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PostCard } from "../post-card";
import type { Post, PostCardHandle } from "../types";

beforeAll(() => {
  if (!("ResizeObserver" in globalThis)) {
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

afterEach(() => cleanup());

function makePost(isLiked: boolean): Post {
  return {
    id: "p1",
    author: { id: "u1", name: "Ada", username: "ada" },
    content: "hello",
    media: [{ id: "m1", type: "image", url: "https://example.test/a.jpg", alt: "a" }],
    createdAt: new Date("2026-01-01T00:00:00Z"),
    likes: 10,
    isLiked,
    comments: 0,
    shares: 0,
  };
}

/** Deterministic double-tap: a media slot button that fires the wired trigger. */
const renderMedia: NonNullable<React.ComponentProps<typeof PostCard>["renderMedia"]> = (
  _media,
  helpers,
) => (
  <button type="button" data-testid="media" onClick={() => helpers.onDoubleTap?.()}>
    media
  </button>
);

const burst = (c: HTMLElement) => c.querySelector(".engagement-heart-burst-icon");
const likedState = (c: HTMLElement) =>
  c.querySelector('button[aria-pressed="true"]') !== null;

describe("PostCard media double-tap", () => {
  it("keeps an already-liked post liked and still shows the burst", () => {
    const onLike = vi.fn();
    const { container } = render(
      <PostCard post={makePost(true)} variant="feed" onLike={onLike} renderMedia={renderMedia} />,
    );
    expect(likedState(container)).toBe(true);
    fireEvent.click(screen.getByTestId("media"));
    expect(onLike).not.toHaveBeenCalled();
    expect(likedState(container)).toBe(true);
    expect(burst(container)).not.toBeNull();
  });

  it("likes an unliked post and shows the burst", () => {
    const onLike = vi.fn();
    const { container } = render(
      <PostCard post={makePost(false)} variant="feed" onLike={onLike} renderMedia={renderMedia} />,
    );
    expect(likedState(container)).toBe(false);
    fireEvent.click(screen.getByTestId("media"));
    expect(onLike).toHaveBeenCalledTimes(1);
    expect(onLike).toHaveBeenCalledWith("p1", true);
    expect(likedState(container)).toBe(true);
    expect(burst(container)).not.toBeNull();
  });

  it("shows no burst when the actions slot has no like action", () => {
    const onLike = vi.fn();
    const { container } = render(
      <PostCard
        post={makePost(false)}
        variant="feed"
        onLike={onLike}
        renderMedia={renderMedia}
        engagementActions={() => [{ kind: "comment", count: 0 }]}
      />,
    );
    fireEvent.click(screen.getByTestId("media"));
    expect(onLike).not.toHaveBeenCalled();
    expect(burst(container)).toBeNull();
  });

  // v0.5.3 — engagement-bar 0.5.0 added `disabled` / `hidden`; a gated like ignores
  // `triggerLike()`, so the burst must not play either.
  it.each([
    ["disabled", { disabled: true }],
    ["hidden", { hidden: true }],
  ] as const)("shows no burst when the like action is %s", (_name, gate) => {
    const onToggle = vi.fn();
    const { container } = render(
      <PostCard
        post={makePost(false)}
        variant="feed"
        renderMedia={renderMedia}
        engagementActions={() => [{ kind: "like", count: 10, liked: false, onToggle, ...gate }]}
      />,
    );
    fireEvent.click(screen.getByTestId("media"));
    expect(onToggle).not.toHaveBeenCalled();
    expect(burst(container)).toBeNull();
  });

  it("shows no burst under a renderEngagementBar takeover", () => {
    const onLike = vi.fn();
    const { container } = render(
      <PostCard
        post={makePost(false)}
        variant="feed"
        onLike={onLike}
        renderMedia={renderMedia}
        renderEngagementBar={() => <div>custom bar</div>}
      />,
    );
    fireEvent.click(screen.getByTestId("media"));
    expect(onLike).not.toHaveBeenCalled();
    expect(burst(container)).toBeNull();
  });
});

describe("PostCard handle triggerLike", () => {
  it("unlikes a liked post with no burst", () => {
    const onLike = vi.fn();
    const ref = createRef<PostCardHandle>();
    const { container } = render(
      <PostCard ref={ref} post={makePost(true)} variant="feed" onLike={onLike} renderMedia={renderMedia} />,
    );
    act(() => ref.current!.triggerLike());
    expect(onLike).toHaveBeenCalledWith("p1", false);
    expect(likedState(container)).toBe(false);
    expect(burst(container)).toBeNull();
  });

  it("likes an unliked post with the burst", () => {
    const onLike = vi.fn();
    const ref = createRef<PostCardHandle>();
    const { container } = render(
      <PostCard ref={ref} post={makePost(false)} variant="feed" onLike={onLike} renderMedia={renderMedia} />,
    );
    act(() => ref.current!.triggerLike());
    expect(onLike).toHaveBeenCalledWith("p1", true);
    expect(burst(container)).not.toBeNull();
  });
});
