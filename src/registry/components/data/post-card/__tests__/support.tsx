import type { ReactElement } from "react";
import { PostCard } from "../post-card";
import type { Post, PostCardProps } from "../types";

/** Fixed "now" so relative times are deterministic: the sample post was created 3 hours earlier. */
export const NOW = new Date("2026-03-10T12:00:00Z");

/** jsdom lacks what Radix menus and the expandable text need. Returns a restore function. */
export function installDomStubs(): () => void {
  const originalRO = globalThis.ResizeObserver;
  class StubResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = StubResizeObserver as unknown as typeof ResizeObserver;
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  const saved = {
    setPointerCapture: proto.setPointerCapture,
    releasePointerCapture: proto.releasePointerCapture,
    hasPointerCapture: proto.hasPointerCapture,
    scrollIntoView: proto.scrollIntoView,
  };
  proto.setPointerCapture = () => {};
  proto.releasePointerCapture = () => {};
  proto.hasPointerCapture = () => false;
  proto.scrollIntoView = () => {};
  return () => {
    globalThis.ResizeObserver = originalRO;
    Object.assign(proto, saved);
  };
}

export interface Deferred<T = void> {
  promise: Promise<T>;
  resolve: (v: T) => void;
  reject: (e?: unknown) => void;
}
export function deferred<T = void>(): Deferred<T> {
  let resolve!: (v: T) => void;
  let reject!: (e?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

export function makePost(over: Partial<Post> = {}): Post {
  return {
    id: "p1",
    author: { id: "u1", name: "Ada Lovelace", username: "ada" },
    content: "Hello from the analytical engine.",
    createdAt: "2026-03-10T09:00:00Z",
    likes: 10,
    isLiked: false,
    comments: 3,
    shares: 2,
    isBookmarked: false,
    ...over,
  };
}

export const KINDS = [
  { key: "love", icon: "L", label: "Love", count: 5 },
  { key: "laugh", icon: "H", label: "Laugh", count: 3 },
];

/** A feed card (navigate mode: one like button) with a fixed `now`; `props` win over the defaults. */
export function card(props: Partial<PostCardProps> = {}): ReactElement {
  const { post, ...rest } = props;
  return <PostCard variant="feed" engagementMode="navigate" post={post ?? makePost()} now={NOW} {...rest} />;
}

/** The controlled like button: its name carries the count ("Like 10" / "Unlike 11"). */
export const likeButton = (s: typeof import("@testing-library/react").screen) =>
  s.getByRole("button", { name: /^(Like|Unlike|Beğen)/ });
