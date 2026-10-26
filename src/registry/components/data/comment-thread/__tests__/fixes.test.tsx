/**
 * Regressions from the 0.4.0 fix wave (architect verdicts #1-#15, #17). Each test was written to
 * fail without its fix.
 */
import { StrictMode, createRef, useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommentThread } from "../comment-thread";
import { CommentComposer } from "../parts/comment-composer";
import { commentModeration } from "../features/moderation";
import { commentReducer } from "../hooks/use-comment-state";
import type {
  Comment,
  CommentDelta,
  CommentPage,
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
  row,
  rowCount,
  rowQueries,
} from "./support";

void StrictMode;

let restore: () => void;
beforeEach(() => {
  restore = installDomStubs();
});
afterEach(() => restore());

const PLACEHOLDER = "Write a comment…";
const settle = () => new Promise<void>((r) => setTimeout(r, 40)); // lets requestAnimationFrame run

function makeStream() {
  let handler: ((delta: CommentDelta) => void) | undefined;
  return {
    subscribe: (h: (delta: CommentDelta) => void) => {
      handler = h;
      return () => {
        handler = undefined;
      };
    },
    /** Deliver several deltas inside ONE tick. */
    pushAll: (...deltas: CommentDelta[]) =>
      act(async () => {
        for (const d of deltas) handler?.(d);
      }),
  };
}

function setup(props: Partial<CommentThreadProps> & { comments: Comment[]; ref?: React.Ref<CommentThreadHandle> }) {
  const utils = render(<CommentThread now={NOW} currentUser={ME} {...props} />);
  const user = userEvent.setup();
  return { user, ...utils };
}
const type = (user: ReturnType<typeof userEvent.setup>, text: string) =>
  user.type(screen.getByPlaceholderText(PLACEHOLDER), `${text}{Enter}`);

function trackUnhandled() {
  const seen: unknown[] = [];
  const handler = (reason: unknown) => seen.push(reason);
  process.on("unhandledRejection", handler);
  return { seen, stop: () => process.off("unhandledRejection", handler) };
}

describe("#1 a void add handler and the server's echo", () => {
  it("the echo lands BEFORE the void result: no second row, nothing left unconfirmed", async () => {
    const stream = makeStream();
    const add = deferred<void>();
    let clientId = "";
    const { user } = setup({
      comments: [comment("a")],
      subscribe: stream.subscribe,
      onAddComment: (_c, _p, o) => {
        clientId = o!.clientId;
        return add.promise;
      },
    });
    await type(user, "echo first");
    await stream.pushAll({ kind: "added", comment: mine("real-1", { content: "echo first", clientId }) });
    await act(async () => add.resolve());
    expect(rowCount("echo first")).toBe(1);
    expect(rowQueries("echo first").getByRole("button", { name: /^Like/ })).not.toHaveAttribute("aria-disabled");
  });

  it("the echo lands AFTER the void result: still one row", async () => {
    const stream = makeStream();
    let clientId = "";
    const { user } = setup({
      comments: [comment("a")],
      subscribe: stream.subscribe,
      onAddComment: (_c, _p, o) => {
        clientId = o!.clientId;
      },
    });
    await type(user, "echo later");
    await flush();
    await stream.pushAll({ kind: "added", comment: mine("real-2", { content: "echo later", clientId }) });
    expect(rowCount("echo later")).toBe(1);
  });
});

describe("#2 changes in one tick build on each other", () => {
  it("controlled: two promises resolving together keep both changes", async () => {
    const one = deferred<unknown>();
    const two = deferred<unknown>();
    const queue = [one, two];
    const log: unknown[] = [];
    const user = userEvent.setup();
    render(
      <ControlledHost
        initial={[comment("a", { likes: 1 }), comment("b", { likes: 1 })]}
        log={log as never}
        currentUser={ME}
        onLikeComment={() => queue.shift()!.promise}
      />,
    );
    await user.click(rowQueries("Body a").getByRole("button", { name: /^Like/ }));
    await user.click(rowQueries("Body b").getByRole("button", { name: /^Like/ }));
    await act(async () => {
      one.resolve(undefined);
      two.resolve(undefined);
    });
    expect(rowQueries("Body a").getByRole("button", { name: /^Unlike/ })).toHaveAccessibleName("Unlike 2");
    expect(rowQueries("Body b").getByRole("button", { name: /^Unlike/ })).toHaveAccessibleName("Unlike 2");
    expect(log).toHaveLength(2);
  });

  it("controlled: two deltas in one frame both land", async () => {
    const stream = makeStream();
    render(
      <ControlledHost
        initial={[comment("a", { likes: 1 })]}
        currentUser={ME}
        subscribe={stream.subscribe}
      />,
    );
    await stream.pushAll(
      { kind: "added", comment: comment("x") },
      { kind: "added", comment: comment("y") },
    );
    expect(rowCount("Body x")).toBe(1);
    expect(rowCount("Body y")).toBe(1);
  });

  it("uncontrolled: `added` parent then its child in one tick keeps the child", async () => {
    const stream = makeStream();
    const ref = createRef<CommentThreadHandle>();
    setup({ comments: [comment("a")], subscribe: stream.subscribe, ref });
    await stream.pushAll(
      { kind: "added", comment: comment("P") },
      { kind: "added", comment: comment("child"), parentId: "P" },
    );
    expect(ids(ref.current!.getCurrentComments())).toEqual(["P", "child", "a"]);
  });

  it("controlled: `added` parent then its child in one tick keeps the child", async () => {
    const stream = makeStream();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <ControlledHost initial={[comment("a")]} currentUser={ME} subscribe={stream.subscribe} />,
    );
    await stream.pushAll(
      { kind: "added", comment: comment("P") },
      { kind: "added", comment: comment("child"), parentId: "P" },
    );
    expect(rowCount("Body child")).toBe(1);
    expect(warn.mock.calls.filter((c) => String(c[0]).includes("parentId"))).toHaveLength(0);
    warn.mockRestore();
  });

  it("controlled: when the host ignores a report, the next change builds on the prop again", async () => {
    const onCommentsChange = vi.fn();
    const stream = makeStream();
    render(
      <CommentThread
        now={NOW}
        comments={[comment("a")]}
        onCommentsChange={onCommentsChange}
        subscribe={stream.subscribe}
      />,
    );
    await stream.pushAll({ kind: "added", comment: comment("x") });
    await flush();
    await stream.pushAll({ kind: "added", comment: comment("y") });
    const second = onCommentsChange.mock.calls[1]![0] as Comment[];
    expect(ids(second)).toEqual(["y", "a"]);
  });
});

describe("#3 a finished reply does not close another reply composer", () => {
  it("opening B while A's post is in flight: B stays open and focused when A resolves", async () => {
    const add = deferred<void>();
    const { user } = setup({
      comments: [comment("a"), comment("b")],
      onAddComment: () => add.promise,
    });
    await user.click(rowQueries("Body a").getByRole("button", { name: "Reply" }));
    await user.type(screen.getByLabelText("Reply to User a"), "to a{Enter}");
    await user.click(rowQueries("Body b").getByRole("button", { name: "Reply" }));
    await act(async () => add.resolve());
    await settle();
    const boxB = screen.getByLabelText("Reply to User b");
    expect(boxB).toBeInTheDocument();
    expect(boxB).toHaveFocus();
  });
});

describe("#4 a thread without onAddComment", () => {
  it("a posted comment is a normal comment (actions on) — uncontrolled", async () => {
    const { user } = setup({ comments: [comment("a")] });
    await type(user, "local only");
    await flush();
    expect(rowQueries("local only").getByRole("button", { name: /^Like/ })).not.toHaveAttribute("aria-disabled");
    expect(rowQueries("local only").getByRole("button", { name: "Reply" })).not.toBeDisabled();
  });

  it("controlled: it is reported as added", async () => {
    const log: { kind: string }[] = [];
    const user = userEvent.setup();
    render(<ControlledHost initial={[comment("a")]} log={log as never} currentUser={ME} />);
    await type(user, "local only");
    await flush();
    expect(log.map((c) => c.kind)).toEqual(["added"]);
    expect(rowCount("local only")).toBe(1);
  });
});

describe("#5 IME composition", () => {
  it("Enter while composing does not submit (isComposing and keyCode 229)", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<CommentComposer onSubmit={onSubmit} />);
    const box = screen.getByRole("textbox");
    await user.type(box, "ni");
    fireEvent.keyDown(box, { key: "Enter", isComposing: true });
    fireEvent.keyDown(box, { key: "Enter", keyCode: 229 });
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.keyDown(box, { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledWith("ni");
  });
});

describe("#6 focus is handed on when the focused control unmounts", () => {
  it("(a) Save, Cancel and Escape of the editor return focus to the row's actions menu", async () => {
    const { user } = setup({
      comments: [mine("a", { content: "orig" })],
      onEditComment: async () => {},
      moderation: commentModeration,
    });
    const kebab = () => screen.getByRole("button", { name: /Comment actions for/ });
    const openEditor = async () => {
      await user.click(kebab());
      await user.click(await screen.findByRole("menuitem", { name: "Edit" }));
      await flush();
      await screen.findByLabelText("Edit");
    };
    await openEditor();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await settle();
    expect(kebab()).toHaveFocus();

    await openEditor();
    await user.keyboard("{Escape}");
    await settle();
    expect(kebab()).toHaveFocus();

    await openEditor();
    const editor = screen.getByLabelText("Edit");
    await user.clear(editor);
    await user.type(editor, "changed");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await settle();
    expect(kebab()).toHaveFocus();
  });

  it("(b) the replies link that unmounts after its load hands focus to the first new reply", async () => {
    const onLoadReplies = async (): Promise<CommentPage> => ({
      items: [comment("r1"), comment("r2")],
      nextCursor: null,
    });
    const { user } = setup({ comments: [comment("a", { replyCount: 2 })], onLoadReplies });
    await user.click(screen.getByRole("button", { name: "View 2 replies" }));
    await settle();
    expect(document.activeElement).toBe(row("Body r1"));
    expect(row("Body r1")).toHaveAttribute("tabindex", "-1");
  });

  it("(b) a link that stays (more pages) keeps focus", async () => {
    const { user } = setup({
      comments: [comment("a", { replyCount: 4 })],
      onLoadReplies: async () => ({ items: [comment("r1")], nextCursor: "more" }),
    });
    const link = screen.getByRole("button", { name: "View 4 replies" });
    await user.click(link);
    await settle();
    expect(link).toHaveFocus();
  });

  it("(c) Load older comments unmounting on the last page hands focus to the first new comment", async () => {
    const { user } = setup({
      comments: [comment("a"), comment("b")],
      pageSize: 2,
      onLoadMore: async () => [comment("c")],
    });
    await user.click(screen.getByRole("button", { name: "Load older comments" }));
    await settle();
    expect(screen.queryByRole("button", { name: /Load older/ })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(row("Body c"));
  });
});

describe("#7 replyCount stays in step with the loaded replies", () => {
  const parent = (over: Partial<Comment> = {}) =>
    comment("p", { replyCount: 2, replies: [comment("r1"), comment("r2")], ...over });

  it("deleting a loaded reply lowers the parent's replyCount", () => {
    const next = commentReducer([parent()], { kind: "remove", commentId: "r1" });
    expect(next[0]!.replyCount).toBe(1);
  });

  it("adding a reply (local, delta, restore) raises it; never below what is loaded", () => {
    expect(commentReducer([parent()], { kind: "add", comment: comment("r3"), parentId: "p" })[0]!.replyCount).toBe(3);
    expect(
      commentReducer([parent()], {
        kind: "subscribe-delta",
        delta: { kind: "added", comment: comment("r4"), parentId: "p" },
      })[0]!.replyCount,
    ).toBe(3);
    expect(
      commentReducer([parent({ replyCount: 1 })], { kind: "add", comment: comment("r5"), parentId: "p" })[0]!.replyCount,
    ).toBe(3);
    expect(
      commentReducer([parent({ replies: [comment("r2")], replyCount: 1 })], {
        kind: "restore",
        comment: comment("r1"),
        parentId: "p",
        index: 0,
      })[0]!.replyCount,
    ).toBe(2);
  });

  it("loading replies never leaves replyCount below the loaded count; a comment without replyCount stays without", () => {
    const next = commentReducer([comment("p", { replyCount: 1 })], {
      kind: "append-replies",
      parentId: "p",
      comments: [comment("r1"), comment("r2"), comment("r3")],
    });
    expect(next[0]!.replyCount).toBe(3);
    const plain = commentReducer([comment("p")], { kind: "add", comment: comment("r"), parentId: "p" });
    expect(plain[0]!.replyCount).toBeUndefined();
  });

  it("component: deleting a loaded reply leaves no spurious `View more replies` link", async () => {
    const { user } = setup({
      comments: [comment("p", { replyCount: 2, replies: [mine("r1"), comment("r2")] })],
      onLoadReplies: async () => ({ items: [] }),
      onDeleteComment: () => {},
    });
    expect(screen.queryByRole("button", { name: /View more replies|View \d+ repl/ })).not.toBeInTheDocument();
    await user.click(rowQueries("Body r1").getByRole("button", { name: /Comment actions for Ada/ }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
    expect(screen.queryByRole("button", { name: /View more replies|View \d+ repl/ })).not.toBeInTheDocument();
  });
});

describe("#9 a throwing host callback never turns success into failure", () => {
  it("onCommentsChange throwing after a successful post: no alert, text cleared, no unhandled rejection", async () => {
    const unhandled = trackUnhandled();
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { user } = setup({
      comments: [comment("a")],
      onCommentsChange: () => {
        throw new Error("host");
      },
      onAddComment: async () => mine("real", { content: "ok" }),
    });
    await type(user, "ok");
    await flush();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect((screen.getByPlaceholderText(PLACEHOLDER) as HTMLTextAreaElement).value).toBe("");
    expect(error).toHaveBeenCalled();
    error.mockRestore();
    unhandled.stop();
    expect(unhandled.seen).toEqual([]);
  });

  it("onCommentsChange throwing after a resolved like: no unhandled rejection", async () => {
    const unhandled = trackUnhandled();
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { user } = setup({
      comments: [comment("a")],
      onCommentsChange: () => {
        throw new Error("host");
      },
      onLikeComment: async () => {},
    });
    await user.click(rowQueries("Body a").getByRole("button", { name: /^Like/ }));
    await flush();
    await flush();
    error.mockRestore();
    unhandled.stop();
    expect(unhandled.seen).toEqual([]);
  });

  it("onSubscribeDelta throwing does not stop the delta", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const stream = makeStream();
    setup({
      comments: [comment("a")],
      subscribe: stream.subscribe,
      onSubscribeDelta: () => {
        throw new Error("host");
      },
    });
    await stream.pushAll({ kind: "added", comment: comment("x") });
    expect(rowCount("Body x")).toBe(1);
    error.mockRestore();
  });
});

describe("#10 the legacy Load more heuristic counts server-delivered comments only", () => {
  it("9 loaded + 1 posted by the viewer does not reach pageSize 10", async () => {
    const nine = Array.from({ length: 9 }, (_, i) => comment(`c${i}`));
    const { user } = setup({
      comments: nine,
      pageSize: 10,
      onLoadMore: async () => [],
      onAddComment: async () => mine("mine-1", { content: "mine" }),
    });
    expect(screen.queryByRole("button", { name: /Load older/ })).not.toBeInTheDocument();
    await type(user, "mine");
    await flush();
    expect(rowCount("mine")).toBe(1);
    expect(screen.queryByRole("button", { name: /Load older/ })).not.toBeInTheDocument();
  });

  it("a pending post does not count either", async () => {
    const nine = Array.from({ length: 9 }, (_, i) => comment(`c${i}`));
    const add = deferred<Comment | void>();
    const { user } = setup({
      comments: nine,
      pageSize: 10,
      onLoadMore: async () => [],
      onAddComment: () => add.promise,
    });
    await type(user, "pending");
    expect(screen.queryByRole("button", { name: /Load older/ })).not.toBeInTheDocument();
    await act(async () => add.resolve());
  });

  it("a comment from another user (delta) does count", async () => {
    const stream = makeStream();
    const nine = Array.from({ length: 9 }, (_, i) => comment(`c${i}`));
    setup({ comments: nine, pageSize: 10, onLoadMore: async () => [], subscribe: stream.subscribe });
    await stream.pushAll({ kind: "added", comment: comment("other") });
    expect(screen.getByRole("button", { name: /Load older/ })).toBeInTheDocument();
  });
});

describe("#11 reset forgets paging and reply state", () => {
  it("a replies load that settles after reset appends nothing and the link starts over", async () => {
    const page = deferred<CommentPage>();
    const ref = createRef<CommentThreadHandle>();
    const { user } = setup({
      ref,
      comments: [comment("a", { replyCount: 2 })],
      onLoadReplies: () => page.promise,
    });
    await user.click(screen.getByRole("button", { name: "View 2 replies" }));
    act(() => ref.current!.reset([comment("a", { replyCount: 2 })]));
    await act(async () => page.resolve({ items: [comment("r1"), comment("r2")], nextCursor: null }));
    expect(rowCount("Body r1")).toBe(0);
    expect(screen.getByRole("button", { name: "View 2 replies" })).toHaveTextContent("View 2 replies");
  });

  it("a top-level load that settles after reset is dropped and the button is usable again", async () => {
    const page = deferred<Comment[]>();
    const onLoadMore = vi.fn(() => page.promise);
    const ref = createRef<CommentThreadHandle>();
    const { user } = setup({ ref, comments: [comment("a")], pageSize: 1, onLoadMore });
    await user.click(screen.getByRole("button", { name: "Load older comments" }));
    act(() => ref.current!.reset([comment("z")]));
    await act(async () => page.resolve([comment("stale")]));
    expect(rowCount("Body stale")).toBe(0);
    const button = screen.getByRole("button", { name: "Load older comments" });
    expect(button).not.toHaveAttribute("aria-busy");
    await user.click(button);
    expect(onLoadMore).toHaveBeenLastCalledWith(2); // the page counter started over too
    await act(async () => page.resolve([]));
  });

  it("a cursor load that settles after reset is dropped and the cursor starts over", async () => {
    const page = deferred<CommentPage>();
    const onLoadMoreCursor = vi.fn(() => page.promise);
    const ref = createRef<CommentThreadHandle>();
    const { user } = setup({ ref, comments: [comment("a")], pageSize: 1, onLoadMoreCursor });
    await user.click(screen.getByRole("button", { name: "Load older comments" }));
    act(() => ref.current!.reset([comment("z")]));
    await act(async () => page.resolve({ items: [comment("stale")], nextCursor: "later" }));
    expect(rowCount("Body stale")).toBe(0);
    await user.click(screen.getByRole("button", { name: "Load older comments" }));
    expect(onLoadMoreCursor).toHaveBeenLastCalledWith(null);
    await act(async () => page.resolve({ items: [] }));
  });

  it("a changed repliesCursor invalidates the cached reply cursor", async () => {
    const onLoadReplies = vi
      .fn<(id: string, cursor: string | null) => Promise<CommentPage>>()
      .mockResolvedValueOnce({ items: [comment("r1")], nextCursor: "n1" })
      .mockResolvedValue({ items: [comment("r9")], nextCursor: null });
    const user = userEvent.setup();
    const props = { now: NOW, onCommentsChange: () => {}, onLoadReplies };
    const { rerender } = render(
      <CommentThread {...props} comments={[comment("a", { replyCount: 4, repliesCursor: "c1" })]} />,
    );
    await user.click(screen.getByRole("button", { name: "View 4 replies" }));
    expect(onLoadReplies).toHaveBeenLastCalledWith("a", "c1");
    rerender(<CommentThread {...props} comments={[comment("a", { replyCount: 4, repliesCursor: "c9" })]} />);
    await user.click(screen.getByRole("button", { name: "View 4 replies" }));
    expect(onLoadReplies).toHaveBeenLastCalledWith("a", "c9");
  });
});

describe("#12 handle.openReply and the focus target", () => {
  it("does not send focus back to an earlier row's Reply button", async () => {
    const ref = createRef<CommentThreadHandle>();
    const { user } = setup({ ref, comments: [comment("a"), comment("b")] });
    const replyA = rowQueries("Body a").getByRole("button", { name: "Reply" });
    await user.click(replyA);
    act(() => ref.current!.openReply("b"));
    const boxB = await screen.findByLabelText("Reply to User b");
    boxB.focus();
    await user.keyboard("{Escape}");
    await settle();
    expect(replyA).not.toHaveFocus();
  });
});

describe("#13 labels.signInPrompt is self-disclosing", () => {
  it("one dev warning per instance when passed, none otherwise", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(<CommentThread now={NOW} comments={[comment("a")]} />);
    expect(warn).not.toHaveBeenCalled();
    rerender(<CommentThread now={NOW} comments={[comment("a")]} labels={{ signInPrompt: "Sign in" }} />);
    rerender(<CommentThread now={NOW} comments={[comment("a")]} labels={{ signInPrompt: "Sign in!" }} />);
    const hits = warn.mock.calls.filter((c) => String(c[0]).includes("signInPrompt"));
    expect(hits).toHaveLength(1);
    expect(String(hits[0]![0])).toContain("composerEmptyState");
    warn.mockRestore();
  });
});

describe("#15 a reaction row never borrows the catalog's tally", () => {
  it("kinds[].count is not another row's count when comment.reactions.counts lacks the key", async () => {
    const { user } = setup({
      comments: [comment("a", { reactions: { viewerReaction: null, counts: {} } })],
      reactionKinds: [{ key: "love", icon: <span>L</span>, label: "Love", count: 99 }],
      onReactComment: () => {},
    });
    await user.click(rowQueries("Body a").getByRole("button", { name: /^React/ }));
    const option = await screen.findByRole("button", { name: /^Love/ });
    expect(option.textContent).not.toContain("99");
    expect(option).not.toHaveAccessibleName(/99/);
  });
});

describe("#17 a controlled composer value replaced from outside clears the old failure", () => {
  function Host() {
    const [value, setValue] = useState("");
    return (
      <>
        <button type="button" onClick={() => setValue("prefilled draft")}>
          prefill
        </button>
        <CommentComposer value={value} onChange={setValue} onSubmit={() => Promise.reject(new Error("x"))} />
      </>
    );
  }

  it("typing keeps working; a prefill removes the alert", async () => {
    const user = userEvent.setup();
    render(<Host />);
    await user.type(screen.getByRole("textbox"), "first{Enter}");
    expect(screen.getByRole("alert")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "prefill" }));
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("prefilled draft");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-invalid");
  });

  it("a failed submit that leaves the value alone keeps the alert", async () => {
    const user = userEvent.setup();
    render(<Host />);
    await user.type(screen.getByRole("textbox"), "again{Enter}");
    await flush();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
