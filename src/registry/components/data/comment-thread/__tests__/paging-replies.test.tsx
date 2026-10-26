/**
 * Paging (CT2): the "Load more" button, cursor loaders, explicit `hasMore` / `nextCursor`, the
 * legacy heuristic's fixes; and per-comment reply loading with its states.
 */
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommentThread } from "../comment-thread";
import type { Comment, CommentPage, CommentThreadProps } from "../types";
import { ME, NOW, comment, deferred, flush, installDomStubs, rowCount, rowQueries } from "./support";

let restore: () => void;
beforeEach(() => {
  restore = installDomStubs();
});
afterEach(() => restore());

const many = (n: number, prefix = "c"): Comment[] =>
  Array.from({ length: n }, (_, i) => comment(`${prefix}${i}`));

function setup(props: Partial<CommentThreadProps> & { comments: Comment[] }) {
  const utils = render(<CommentThread now={NOW} currentUser={ME} {...props} />);
  return { user: userEvent.setup(), ...utils };
}
const loadButton = () => screen.queryByRole("button", { name: /^Load older comments/ });

describe("the legacy `onLoadMore` heuristic", () => {
  it("shows Load more for a first page of ANY size >= pageSize (it used to need exactly pageSize)", () => {
    setup({ comments: many(5), pageSize: 3, onLoadMore: async () => [] });
    expect(loadButton()).toBeInTheDocument();
  });

  it("hides it while the thread holds fewer comments than a page", () => {
    setup({ comments: many(2), pageSize: 3, onLoadMore: async () => [] });
    expect(loadButton()).not.toBeInTheDocument();
  });

  it("an async first load that brings a full page then shows it", () => {
    const onLoadMore = async () => [];
    const { rerender } = render(
      <CommentThread now={NOW} comments={[]} pageSize={3} onLoadMore={onLoadMore} onCommentsChange={() => {}} />,
    );
    expect(loadButton()).not.toBeInTheDocument();
    rerender(
      <CommentThread now={NOW} comments={many(3)} pageSize={3} onLoadMore={onLoadMore} onCommentsChange={() => {}} />,
    );
    expect(loadButton()).toBeInTheDocument();
  });

  it("an exact last page: a short (empty) answer removes the button", async () => {
    const onLoadMore = vi.fn(async () => [] as Comment[]);
    const { user } = setup({ comments: many(3), pageSize: 3, onLoadMore });
    await user.click(loadButton()!);
    expect(onLoadMore).toHaveBeenCalledWith(2);
    expect(loadButton()).not.toBeInTheDocument();
  });

  it("a full page keeps the button and asks for the next page number", async () => {
    const onLoadMore = vi.fn(async (page: number) => many(3, `p${page}-`));
    const { user } = setup({ comments: many(3), pageSize: 3, onLoadMore });
    await user.click(loadButton()!);
    expect(rowCount("Body p2-0")).toBe(1);
    expect(loadButton()).toBeInTheDocument();
    await user.click(loadButton()!);
    expect(onLoadMore).toHaveBeenLastCalledWith(3);
  });

  it("dedupes a page that repeats known comments", async () => {
    const { user } = setup({
      comments: [comment("a"), comment("b")],
      pageSize: 2,
      onLoadMore: async () => [comment("b"), comment("c")],
    });
    await user.click(loadButton()!);
    expect(rowCount("Body b")).toBe(1);
    expect(rowCount("Body c")).toBe(1);
  });

  it("explicit `hasMore` wins on every render", () => {
    const { rerender } = render(
      <CommentThread now={NOW} comments={many(5)} pageSize={3} hasMore={false} onLoadMore={async () => []} />,
    );
    expect(loadButton()).not.toBeInTheDocument();
    rerender(<CommentThread now={NOW} comments={many(1)} pageSize={3} hasMore onLoadMore={async () => []} />);
    expect(loadButton()).toBeInTheDocument();
  });

  it("without a loader there is no button, whatever the count", () => {
    setup({ comments: many(5), pageSize: 3 });
    expect(loadButton()).not.toBeInTheDocument();
  });
});

describe("cursor paging", () => {
  it("starts from null, follows nextCursor, and stops when it is null", async () => {
    const pages: Record<string, CommentPage> = {
      null: { items: [comment("p1")], nextCursor: "c2" },
      c2: { items: [comment("p2")], nextCursor: null },
    };
    const onLoadMoreCursor = vi.fn(async (cursor: string | null) => pages[String(cursor)]!);
    const { user } = setup({ comments: many(3), pageSize: 3, onLoadMoreCursor });
    await user.click(loadButton()!);
    expect(onLoadMoreCursor).toHaveBeenLastCalledWith(null);
    await user.click(loadButton()!);
    expect(onLoadMoreCursor).toHaveBeenLastCalledWith("c2");
    expect(rowCount("Body p1")).toBe(1);
    expect(rowCount("Body p2")).toBe(1);
    expect(loadButton()).not.toBeInTheDocument();
  });

  it("the `nextCursor` prop is the first cursor and decides hasMore on every render", async () => {
    const onLoadMoreCursor = vi.fn(async () => ({ items: [comment("n")], nextCursor: "later" }));
    const { user, rerender } = setup({ comments: [comment("a")], nextCursor: "start", onLoadMoreCursor });
    expect(loadButton()).toBeInTheDocument(); // one comment < pageSize, but the host says more
    await user.click(loadButton()!);
    expect(onLoadMoreCursor).toHaveBeenCalledWith("start");
    rerender(
      <CommentThread
        now={NOW}
        currentUser={ME}
        comments={[comment("a")]}
        nextCursor={null}
        onLoadMoreCursor={onLoadMoreCursor}
      />,
    );
    expect(loadButton()).not.toBeInTheDocument();
  });

  it("the page's `hasMore: false` ends it even with a cursor", async () => {
    const { user } = setup({
      comments: many(3),
      pageSize: 3,
      onLoadMoreCursor: async () => ({ items: [comment("z")], nextCursor: "x", hasMore: false }),
    });
    await user.click(loadButton()!);
    expect(loadButton()).not.toBeInTheDocument();
  });

  it("wins over `onLoadMore` when both are passed", async () => {
    const onLoadMore = vi.fn(async () => []);
    const onLoadMoreCursor = vi.fn(async () => ({ items: [], nextCursor: null }));
    const { user } = setup({ comments: many(3), pageSize: 3, onLoadMore, onLoadMoreCursor });
    await user.click(loadButton()!);
    expect(onLoadMoreCursor).toHaveBeenCalled();
    expect(onLoadMore).not.toHaveBeenCalled();
  });
});

describe("the Load more button", () => {
  it("shows the loading text, is aria-busy, does not double-fetch, and keeps focus", async () => {
    const page = deferred<Comment[]>();
    const onLoadMore = vi.fn(() => page.promise);
    const { user } = setup({ comments: many(3), pageSize: 3, onLoadMore });
    const button = loadButton()!;
    await user.click(button);
    expect(button).toHaveTextContent("Load older comments…");
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toHaveFocus();
    await user.click(button);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    await act(async () => page.resolve(many(3, "x")));
    expect(button).toHaveFocus();
    expect(button).not.toHaveAttribute("aria-busy");
  });

  it("a failure shows the alert and a Retry button, reports onError, and Retry loads again", async () => {
    const onError = vi.fn();
    const onLoadMore = vi
      .fn<(page: number) => Promise<Comment[]>>()
      .mockRejectedValueOnce(new Error("down"))
      .mockResolvedValueOnce([comment("late")]);
    const { user } = setup({ comments: many(3), pageSize: 3, onLoadMore, onError });
    await user.click(loadButton()!);
    expect(screen.getByRole("alert")).toHaveTextContent("Couldn't load comments.");
    expect(onError).toHaveBeenCalledWith(expect.any(Error), { kind: "load-more" });
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onLoadMore).toHaveBeenLastCalledWith(2); // the same page, retried
    expect(rowCount("Body late")).toBe(1);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("replies", () => {
  const withCount = [comment("a", { replyCount: 3 })];

  it("shows `View 3 replies` when replyCount > loaded, even with no replies loaded (it used to show nothing)", () => {
    setup({ comments: withCount, onLoadReplies: async () => ({ items: [] }) });
    expect(screen.getByRole("button", { name: "View 3 replies" })).toBeInTheDocument();
  });

  it("is not shown without a loader", () => {
    setup({ comments: withCount });
    expect(screen.queryByRole("button", { name: /View 3 replies/ })).not.toBeInTheDocument();
  });

  it("loads from the comment's repliesCursor, appends, and offers `View more replies` while more exist", async () => {
    const onLoadReplies = vi
      .fn<(id: string, cursor: string | null) => Promise<CommentPage>>()
      .mockResolvedValueOnce({ items: [comment("r1"), comment("r2")], nextCursor: "next" })
      .mockResolvedValueOnce({ items: [comment("r3")], nextCursor: null });
    const { user } = setup({
      comments: [comment("a", { replyCount: 3, repliesCursor: "first" })],
      onLoadReplies,
    });
    await user.click(screen.getByRole("button", { name: "View 3 replies" }));
    expect(onLoadReplies).toHaveBeenLastCalledWith("a", "first");
    expect(rowCount("Body r1")).toBe(1);
    expect(rowCount("Body r2")).toBe(1);
    await user.click(screen.getByRole("button", { name: "View more replies" }));
    expect(onLoadReplies).toHaveBeenLastCalledWith("a", "next");
    expect(rowCount("Body r3")).toBe(1);
    expect(screen.queryByRole("button", { name: /replies/ })).not.toBeInTheDocument();
  });

  it("the first cursor is null when the comment has none", async () => {
    const onLoadReplies = vi.fn(async () => ({ items: [comment("r1")] }));
    const { user } = setup({ comments: withCount, onLoadReplies });
    await user.click(screen.getByRole("button", { name: "View 3 replies" }));
    expect(onLoadReplies).toHaveBeenCalledWith("a", null);
  });

  it("shows a loading state per node, does not double-fetch, and keeps focus", async () => {
    const page = deferred<CommentPage>();
    const onLoadReplies = vi.fn(() => page.promise);
    const { user } = setup({ comments: withCount, onLoadReplies });
    const link = screen.getByRole("button", { name: "View 3 replies" });
    await user.click(link);
    expect(link).toHaveTextContent("Loading replies…");
    expect(link).toHaveAttribute("aria-busy", "true");
    await user.click(link);
    expect(onLoadReplies).toHaveBeenCalledTimes(1);
    expect(link).toHaveFocus();
    await act(async () => page.resolve({ items: [comment("r1")], nextCursor: null }));
    expect(rowCount("Body r1")).toBe(1);
  });

  it("a failure shows the alert + Retry, reports onError, and Retry loads again from the same cursor", async () => {
    const onError = vi.fn();
    const onLoadReplies = vi
      .fn<(id: string, cursor: string | null) => Promise<CommentPage>>()
      .mockRejectedValueOnce(new Error("down"))
      .mockResolvedValueOnce({ items: [comment("r1")], nextCursor: null });
    const { user } = setup({ comments: withCount, onLoadReplies, onError });
    await user.click(screen.getByRole("button", { name: "View 3 replies" }));
    expect(rowQueries("Body a").getByRole("alert")).toHaveTextContent("Couldn't load replies.");
    expect(onError).toHaveBeenCalledWith(expect.any(Error), {
      kind: "load-replies",
      commentId: "a",
      parentId: "a",
    });
    await user.click(rowQueries("Body a").getByRole("button", { name: "Retry" }));
    expect(onLoadReplies).toHaveBeenLastCalledWith("a", null);
    expect(rowCount("Body r1")).toBe(1);
  });

  it("state lives in the instance: loading one thread does not touch another", async () => {
    const page = deferred<CommentPage>();
    render(
      <>
        <CommentThread now={NOW} comments={[comment("a", { replyCount: 1 })]} onLoadReplies={() => page.promise} />
        <CommentThread now={NOW} comments={[comment("b", { replyCount: 1 })]} onLoadReplies={async () => ({ items: [] })} />
      </>,
    );
    const user = userEvent.setup();
    const [first, second] = screen.getAllByRole("button", { name: "View 1 reply" });
    await user.click(first!);
    expect(first).toHaveTextContent("Loading replies…");
    expect(second).toHaveTextContent("View 1 reply");
    await act(async () => page.resolve({ items: [comment("r1")], nextCursor: null }));
    expect(rowCount("Body r1")).toBe(1);
    expect(second).toHaveTextContent("View 1 reply");
    await flush();
  });
});
