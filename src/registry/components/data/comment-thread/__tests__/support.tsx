import { useState } from "react";
import { screen, within } from "@testing-library/react";
import { CommentThread } from "../comment-thread";
import type { Comment, CommentsChange, CommentThreadProps } from "../types";

/** jsdom lacks what Radix menus + the composer's autosize need. Returns a restore function. */
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
  resolve: (value: T) => void;
  reject: (error?: unknown) => void;
}
export function deferred<T = void>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

export const ME = { id: "me", name: "Ada Lovelace" };
export const NOW = new Date("2026-01-01T01:00:00Z");

export const comment = (id: string, over: Partial<Comment> = {}): Comment => ({
  id,
  author: { id: `u-${id}`, name: `User ${id}` },
  content: `Body ${id}`,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  likes: 0,
  ...over,
});
export const mine = (id: string, over: Partial<Comment> = {}): Comment =>
  comment(id, { author: ME, ...over });

export const ids = (tree: Comment[]): string[] =>
  tree.flatMap((c) => [c.id, ...ids(c.replies ?? [])]);

/** The `<article>` row of a comment, found by its body text. */
export function row(body: string): HTMLElement {
  const article = screen
    .getAllByText(body)
    .map((el) => el.closest("article"))
    .find((el): el is HTMLElement => el !== null);
  if (!article) throw new Error(`no row for "${body}"`);
  return article;
}
/** How many comment rows (not the composer's textarea) show this body text. */
export const rowCount = (body: string): number =>
  screen.queryAllByText(body).filter((el) => el.closest("article") !== null).length;

export const rowQueries = (body: string) => within(row(body));

/** Waits are explicit microtask flushes: the thread settles handler promises on microtasks. */
export const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/** A controlled host: keeps the tree in state, applies every reported change, and logs them. */
export function ControlledHost({
  initial,
  log,
  ...props
}: { initial: Comment[]; log?: CommentsChange[] } & Partial<CommentThreadProps>) {
  const [comments, setComments] = useState(initial);
  return (
    <CommentThread
      now={NOW}
      {...props}
      comments={comments}
      onCommentsChange={(next, change) => {
        log?.push(change);
        setComments(next);
      }}
    />
  );
}
