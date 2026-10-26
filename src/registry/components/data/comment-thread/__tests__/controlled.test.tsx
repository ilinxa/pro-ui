/**
 * Controlled mode (CT1): `comments` wins every render, accepted changes are REPORTED through
 * `onCommentsChange(next, change)` and never applied locally, pending operations are an overlay
 * a refetch replaces. Plus the dev warnings for the two ways to misuse the pair.
 */
import { createRef } from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommentThread } from "../comment-thread";
import type {
  Comment,
  CommentsChange,
  CommentThreadHandle,
  CommentThreadProps,
} from "../types";
import {
  ControlledHost,
  ME,
  NOW,
  comment,
  deferred,
  flush,
  ids,
  installDomStubs,
  mine,
  rowCount,
  rowQueries,
} from "./support";

let restore: () => void;
beforeEach(() => {
  restore = installDomStubs();
});
afterEach(() => restore());

const PLACEHOLDER = "Write a comment…";

function setup(
  props: Partial<CommentThreadProps> & { comments: Comment[]; ref?: React.Ref<CommentThreadHandle> },
) {
  const onCommentsChange = vi.fn();
  const utils = render(
    <CommentThread now={NOW} currentUser={ME} onCommentsChange={onCommentsChange} {...props} />,
  );
  return { onCommentsChange, user: userEvent.setup(), ...utils };
}

describe("the prop wins", () => {
  it("renders the new `comments` on every re-render", () => {
    const { rerender } = setup({ comments: [comment("a")] });
    expect(screen.getByText("Body a")).toBeInTheDocument();
    rerender(
      <CommentThread
        now={NOW}
        currentUser={ME}
        onCommentsChange={() => {}}
        comments={[comment("b")]}
      />,
    );
    expect(screen.queryByText("Body a")).not.toBeInTheDocument();
    expect(screen.getByText("Body b")).toBeInTheDocument();
  });

  it("a sync handler reports the next tree and the change — and the prop still wins", async () => {
    const onLikeComment = vi.fn();
    const { onCommentsChange, user } = setup({
      comments: [comment("a", { likes: 3 })],
      onLikeComment,
    });
    await user.click(rowQueries("Body a").getByRole("button", { name: /^Like/ }));
    expect(onLikeComment).toHaveBeenCalledWith("a", true);
    expect(onCommentsChange).toHaveBeenCalledTimes(1);
    const [next, change] = onCommentsChange.mock.calls[0] as unknown as [Comment[], CommentsChange];
    expect(change).toEqual({ kind: "liked", commentId: "a", liked: true });
    expect(next[0]).toMatchObject({ isLiked: true, likes: 4 });
    // The host did not apply it: the row still shows the prop.
    expect(rowQueries("Body a").getByRole("button", { name: /^Like/ })).toHaveAccessibleName("Like 3");
  });

  it("delete reports { kind: deleted } with the tree without it", async () => {
    const { onCommentsChange, user } = setup({
      comments: [mine("a"), mine("b")],
      onDeleteComment: () => {},
    });
    await user.click(rowQueries("Body a").getByRole("button", { name: /Comment actions/ }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
    const [next, change] = onCommentsChange.mock.calls[0] as unknown as [Comment[], CommentsChange];
    expect(change).toEqual({ kind: "deleted", commentId: "a" });
    expect(ids(next)).toEqual(["b"]);
    expect(screen.getByText("Body a")).toBeInTheDocument();
  });
});

describe("once accepted", () => {
  it("a promise handler shows an overlay, reports after it resolves, then follows the prop", async () => {
    const like = deferred<unknown>();
    const log: CommentsChange[] = [];
    const user = userEvent.setup();
    render(
      <ControlledHost
        initial={[comment("a", { likes: 3 })]}
        log={log}
        currentUser={ME}
        onLikeComment={() => like.promise}
      />,
    );
    const row = rowQueries("Body a");
    await user.click(row.getByRole("button", { name: /^Like/ }));
    expect(row.getByRole("button", { name: /^Unlike/ })).toHaveAccessibleName("Unlike 4"); // overlay
    expect(log).toEqual([]); // nothing reported yet
    await act(async () => like.resolve(undefined));
    expect(log).toEqual([{ kind: "liked", commentId: "a", liked: true }]);
    expect(row.getByRole("button", { name: /^Unlike/ })).toHaveAccessibleName("Unlike 4"); // the host applied it
  });

  it("a rejection drops the overlay, reports nothing and calls onError", async () => {
    const like = deferred<unknown>();
    const onError = vi.fn();
    const { onCommentsChange, user } = setup({
      comments: [comment("a", { likes: 3 })],
      onLikeComment: () => like.promise,
      onError,
    });
    const row = rowQueries("Body a");
    await user.click(row.getByRole("button", { name: /^Like/ }));
    await act(async () => like.reject(new Error("no")));
    expect(onCommentsChange).not.toHaveBeenCalled();
    expect(row.getByRole("button", { name: /^Like/ })).toHaveAccessibleName("Like 3");
    expect(onError).toHaveBeenCalledWith(expect.any(Error), { kind: "like", commentId: "a" });
  });

  it("a refetch replaces stale optimism: the overlay never double-counts a like the server already has", async () => {
    const like = deferred<unknown>();
    const onLikeComment = () => like.promise;
    const user = userEvent.setup();
    const { rerender } = render(
      <CommentThread
        now={NOW}
        currentUser={ME}
        onCommentsChange={() => {}}
        comments={[comment("a", { likes: 3 })]}
        onLikeComment={onLikeComment}
      />,
    );
    await user.click(rowQueries("Body a").getByRole("button", { name: /^Like/ }));
    rerender(
      <CommentThread
        now={NOW}
        currentUser={ME}
        onCommentsChange={() => {}}
        comments={[comment("a", { likes: 4, isLiked: true })]}
        onLikeComment={onLikeComment}
      />,
    );
    expect(rowQueries("Body a").getByRole("button", { name: /^Unlike/ })).toHaveAccessibleName("Unlike 4");
  });

  it("add: the pending comment shows, the resolved comment is reported, the temp never is", async () => {
    const add = deferred<Comment | void>();
    const log: CommentsChange[] = [];
    const user = userEvent.setup();
    render(
      <ControlledHost
        initial={[comment("a")]}
        log={log}
        currentUser={ME}
        onAddComment={() => add.promise}
      />,
    );
    await user.type(screen.getByPlaceholderText(PLACEHOLDER), "hello{Enter}");
    expect(rowCount("hello")).toBe(1);
    expect(log).toEqual([]);
    const real = mine("real-1", { content: "hello" });
    await act(async () => add.resolve(real));
    expect(log).toEqual([{ kind: "added", comment: real, parentId: undefined }]);
    expect(rowCount("hello")).toBe(1);
    expect(screen.queryByText("Sending…")).not.toBeInTheDocument();
  });

  it("add with a void result: the pending comment is removed when the call returns, nothing is reported", async () => {
    const add = deferred<void>();
    const { onCommentsChange, user } = setup({
      comments: [comment("a")],
      onAddComment: () => add.promise,
    });
    await user.type(screen.getByPlaceholderText(PLACEHOLDER), "gone soon{Enter}");
    expect(rowCount("gone soon")).toBe(1);
    await act(async () => add.resolve());
    expect(rowCount("gone soon")).toBe(0);
    expect(onCommentsChange).not.toHaveBeenCalled();
  });

  it("a rejected add reports nothing and removes the pending comment", async () => {
    const { onCommentsChange, user } = setup({
      comments: [comment("a")],
      onAddComment: () => Promise.reject(new Error("no")),
    });
    await user.type(screen.getByPlaceholderText(PLACEHOLDER), "nope{Enter}");
    await flush();
    expect(rowCount("nope")).toBe(0);
    expect(onCommentsChange).not.toHaveBeenCalled();
  });
});

describe("reported at once", () => {
  it("a realtime delta is reported as { kind: delta } and not applied locally", async () => {
    let push: ((d: Parameters<NonNullable<CommentThreadProps["subscribe"]>>[0] extends (d: infer D) => void ? D : never) => void) | undefined;
    const subscribe: CommentThreadProps["subscribe"] = (h) => {
      push = h;
      return () => {};
    };
    const { onCommentsChange } = setup({ comments: [comment("a")], subscribe });
    const delta = { kind: "added", comment: comment("live") } as const;
    await act(async () => push?.(delta));
    const [next, change] = onCommentsChange.mock.calls[0] as unknown as [Comment[], CommentsChange];
    expect(change).toEqual({ kind: "delta", delta });
    expect(ids(next)).toEqual(["live", "a"]);
    expect(screen.queryByText("Body live")).not.toBeInTheDocument();
  });

  it("reset and dispatch are reported as { kind: dispatch }", () => {
    const ref = createRef<CommentThreadHandle>();
    const { onCommentsChange } = setup({ comments: [comment("a")], ref });
    act(() => ref.current!.reset([comment("z")]));
    act(() => ref.current!.dispatch({ kind: "add", comment: comment("y") }));
    const [first, second] = onCommentsChange.mock.calls as unknown as [Comment[], CommentsChange][];
    expect(first![1]).toEqual({ kind: "dispatch", action: { kind: "reset", next: [expect.objectContaining({ id: "z" })] } });
    expect(ids(first![0])).toEqual(["z"]);
    expect(ids(second![0])).toEqual(["y", "a"]);
    expect(screen.getByText("Body a")).toBeInTheDocument();
  });

  it("a loaded page is reported as { kind: page }, not applied", async () => {
    const { onCommentsChange, user } = setup({
      comments: [comment("a")],
      pageSize: 1,
      onLoadMore: async () => [comment("older")],
    });
    await user.click(screen.getByRole("button", { name: "Load older comments" }));
    const [next, change] = onCommentsChange.mock.calls[0] as unknown as [Comment[], CommentsChange];
    expect(change.kind).toBe("page");
    expect(ids(next)).toEqual(["a", "older"]);
    expect(screen.queryByText("Body older")).not.toBeInTheDocument();
  });

  it("a duplicate delta reports nothing (the tree would not change)", async () => {
    let push: ((d: { kind: "added"; comment: Comment }) => void) | undefined;
    const subscribe: CommentThreadProps["subscribe"] = (h) => {
      push = h as typeof push;
      return () => {};
    };
    const { onCommentsChange } = setup({ comments: [comment("a")], subscribe });
    await act(async () => push?.({ kind: "added", comment: comment("a") }));
    expect(onCommentsChange).not.toHaveBeenCalled();
  });
});

describe("misuse warnings", () => {
  it("warns ONCE when `comments` changes identity while uncontrolled", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(<CommentThread now={NOW} comments={[comment("a")]} />);
    rerender(<CommentThread now={NOW} comments={[comment("b")]} />);
    rerender(<CommentThread now={NOW} comments={[comment("c")]} />);
    const hits = warn.mock.calls.filter((c) => String(c[0]).includes("read once"));
    expect(hits).toHaveLength(1);
    // And it is still read once: the first tree is what shows.
    expect(screen.getByText("Body a")).toBeInTheDocument();
    warn.mockRestore();
  });

  it("does not warn when the same array is passed again", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const comments = [comment("a")];
    const { rerender } = render(<CommentThread now={NOW} comments={comments} />);
    rerender(<CommentThread now={NOW} comments={comments} className="x" />);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("warns ONCE when switching between controlled and uncontrolled after mount", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const comments = [comment("a")];
    const { rerender } = render(<CommentThread now={NOW} comments={comments} />);
    rerender(<CommentThread now={NOW} comments={comments} onCommentsChange={() => {}} />);
    rerender(<CommentThread now={NOW} comments={comments} />);
    const hits = warn.mock.calls.filter((c) => String(c[0]).includes("switched"));
    expect(hits).toHaveLength(1);
    warn.mockRestore();
  });
});
