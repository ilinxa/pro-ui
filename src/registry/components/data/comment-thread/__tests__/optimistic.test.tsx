/**
 * Posting, pending rows, rollback (CT3) and idempotence at the component level. Every test here
 * is a regression for a bug the old thread had: the own-post echo race, a temp id reaching the
 * server, an unhandled rejection, an optimistic change that never came back.
 */
import { StrictMode, createRef } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommentThread } from "../comment-thread";
import type {
  Comment,
  CommentComposerHelpers,
  CommentDelta,
  CommentThreadHandle,
  CommentThreadProps,
} from "../types";
import {
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

/** A stream the test can push deltas into. */
function makeStream() {
  let handler: ((delta: CommentDelta) => void) | undefined;
  return {
    subscribe: (h: (delta: CommentDelta) => void) => {
      handler = h;
      return () => {
        handler = undefined;
      };
    },
    push: (delta: CommentDelta) => act(async () => handler?.(delta)),
  };
}

function setup(props: Partial<CommentThreadProps> = {}) {
  const ref = createRef<CommentThreadHandle>();
  const utils = render(
    <CommentThread
      ref={ref}
      now={NOW}
      comments={[comment("a")]}
      currentUser={ME}
      {...props}
    />,
  );
  const user = userEvent.setup();
  const post = async (text: string) => {
    await user.type(screen.getByPlaceholderText(PLACEHOLDER), `${text}{Enter}`);
  };
  return { ref, user, post, ...utils };
}

function trackUnhandled() {
  const seen: unknown[] = [];
  const handler = (reason: unknown) => seen.push(reason);
  process.on("unhandledRejection", handler);
  return { seen, stop: () => process.off("unhandledRejection", handler) };
}

describe("a pending comment", () => {
  it("shows at once with `Sending…`, carries a clientId, and the add call receives it", async () => {
    const add = deferred<Comment | void>();
    const onAddComment = vi.fn(() => add.promise);
    const { ref, post } = setup({ onAddComment });
    await post("hello there");

    expect(rowQueries("hello there").getByText("Sending…")).toBeInTheDocument();
    const [content, parentId, options] = onAddComment.mock.calls[0] as unknown as [
      string,
      string | undefined,
      { clientId: string },
    ];
    expect(content).toBe("hello there");
    expect(parentId).toBeUndefined();
    expect(options.clientId).toEqual(expect.any(String));
    const pending = ref.current!.getCurrentComments().find((c) => c.content === "hello there")!;
    expect(pending.clientId).toBe(options.clientId);
    expect(pending.id).not.toBe(options.clientId);
  });

  it("never lets a temp id reach a handler: like / reply / delete / report are off", async () => {
    const add = deferred<Comment | void>();
    const onLikeComment = vi.fn();
    const onDeleteComment = vi.fn();
    const onReportComment = vi.fn();
    const { post, user } = setup({
      onAddComment: () => add.promise,
      onLikeComment,
      onDeleteComment,
      onReportComment,
    });
    await post("pending one");
    const row = rowQueries("pending one");

    expect(row.getByRole("button", { name: /^Like/ })).toHaveAttribute("aria-disabled", "true");
    await user.click(row.getByRole("button", { name: /^Like/ }));
    expect(row.getByRole("button", { name: "Reply" })).toBeDisabled();

    await user.click(row.getByRole("button", { name: /Comment actions for Ada/ }));
    const del = await screen.findByRole("menuitem", { name: "Delete" });
    expect(del).toHaveAttribute("aria-disabled", "true");
    await user.click(del);

    expect(onLikeComment).not.toHaveBeenCalled();
    expect(onDeleteComment).not.toHaveBeenCalled();
    expect(onReportComment).not.toHaveBeenCalled();
  });

  it("does not hand a temp id to renderNode helpers either (and says isPending)", async () => {
    const add = deferred<Comment | void>();
    const onLikeComment = vi.fn();
    const onDeleteComment = vi.fn();
    let pendingHelpers: { onLike: (n: boolean) => void; onDelete: () => void; isPending: boolean } | undefined;
    const { post } = setup({
      onAddComment: () => add.promise,
      onLikeComment,
      onDeleteComment,
      renderNode: (c, _depth, helpers) => {
        if (c.content === "slot pending") pendingHelpers = helpers;
        return <div data-testid="slot-row">{c.content}</div>;
      },
    });
    await post("slot pending");
    expect(pendingHelpers?.isPending).toBe(true);
    act(() => {
      pendingHelpers?.onLike(true);
      pendingHelpers?.onDelete();
    });
    expect(onLikeComment).not.toHaveBeenCalled();
    expect(onDeleteComment).not.toHaveBeenCalled();
  });

  it("gives extraActions / commentActions helpers isPending: true", async () => {
    const add = deferred<Comment | void>();
    const seen: boolean[] = [];
    const { post } = setup({
      onAddComment: () => add.promise,
      extraActions: (c, helpers) => {
        if (c.content === "helper row") seen.push(helpers.isPending);
        return [];
      },
    });
    await post("helper row");
    expect(seen).toContain(true);
  });

  it("is swapped for the returned comment: one copy, no pending left", async () => {
    const add = deferred<Comment | void>();
    const { post, ref } = setup({ onAddComment: () => add.promise });
    await post("hello");
    await act(async () => add.resolve(mine("real-1", { content: "hello" })));
    expect(ids(ref.current!.getCurrentComments())).toEqual(["real-1", "a"]);
    expect(screen.queryByText("Sending…")).not.toBeInTheDocument();
    expect(rowQueries("hello").getByRole("button", { name: /^Like/ })).not.toHaveAttribute(
      "aria-disabled",
    );
  });

  it("without an add handler result (void) the comment stays, its actions off", async () => {
    const { post } = setup({ onAddComment: () => undefined });
    await post("void result");
    await flush();
    const row = rowQueries("void result");
    expect(row.queryByText("Sending…")).not.toBeInTheDocument();
    expect(row.getByRole("button", { name: /^Like/ })).toHaveAttribute("aria-disabled", "true");
  });

  it("a void result is later replaced by a delta carrying its clientId", async () => {
    const stream = makeStream();
    let sentClientId = "";
    const { post, ref } = setup({
      subscribe: stream.subscribe,
      onAddComment: (_content, _parent, options) => {
        sentClientId = options!.clientId;
      },
    });
    await post("will be echoed");
    await flush();
    await stream.push({
      kind: "added",
      comment: mine("real-9", { content: "will be echoed", clientId: sentClientId }),
    });
    expect(ids(ref.current!.getCurrentComments())).toEqual(["real-9", "a"]);
    expect(rowQueries("will be echoed").getByRole("button", { name: /^Like/ })).not.toHaveAttribute(
      "aria-disabled",
    );
  });

  it("optimistic={false}: no temp row; the comment appears once the server returns it", async () => {
    const add = deferred<Comment | void>();
    const { post, ref } = setup({ optimistic: false, onAddComment: () => add.promise });
    await post("slow one");
    expect(rowCount("slow one")).toBe(0);
    await act(async () => add.resolve(mine("real-2", { content: "slow one" })));
    expect(rowCount("slow one")).toBe(1);
    expect(ids(ref.current!.getCurrentComments())).toEqual(["real-2", "a"]);
  });
});

describe("own-post echo race", () => {
  it("with a clientId: the echo arrives before onAddComment resolves — one copy throughout the end state", async () => {
    const stream = makeStream();
    const add = deferred<Comment | void>();
    let sentClientId = "";
    const { post, ref } = setup({
      subscribe: stream.subscribe,
      onAddComment: (_c, _p, options) => {
        sentClientId = options!.clientId;
        return add.promise;
      },
    });
    await post("racing");
    const real = mine("real-5", { content: "racing", clientId: sentClientId });
    await stream.push({ kind: "added", comment: real });
    // The pending row is gone the moment the echo lands.
    expect(rowCount("racing")).toBe(1);
    expect(screen.queryByText("Sending…")).not.toBeInTheDocument();
    await act(async () => add.resolve(real));
    expect(rowCount("racing")).toBe(1);
    expect(ids(ref.current!.getCurrentComments())).toEqual(["real-5", "a"]);
  });

  it("without a clientId: the echo wins the race — after the call resolves there is one copy", async () => {
    const stream = makeStream();
    const add = deferred<Comment | void>();
    const { post, ref } = setup({
      subscribe: stream.subscribe,
      onAddComment: () => add.promise,
    });
    await post("no client id");
    const real = mine("real-6", { content: "no client id" });
    await stream.push({ kind: "added", comment: real });
    await act(async () => add.resolve(real));
    expect(rowCount("no client id")).toBe(1);
    expect(ids(ref.current!.getCurrentComments())).toEqual(["real-6", "a"]);
  });

  it("the echo of a reply keeps one copy under the parent", async () => {
    const stream = makeStream();
    const add = deferred<Comment | void>();
    let sentClientId = "";
    const { user, ref } = setup({
      subscribe: stream.subscribe,
      onAddComment: (_c, _p, options) => {
        sentClientId = options!.clientId;
        return add.promise;
      },
    });
    await user.click(rowQueries("Body a").getByRole("button", { name: "Reply" }));
    await user.type(screen.getByLabelText("Reply to User a"), "a reply{Enter}");
    const real = mine("real-7", { content: "a reply", clientId: sentClientId });
    await stream.push({ kind: "added", comment: real, parentId: "a" });
    await act(async () => add.resolve(real));
    expect(rowCount("a reply")).toBe(1);
    expect(ids(ref.current!.getCurrentComments())).toEqual(["a", "real-7"]);
  });
});

describe("duplicate deltas", () => {
  it("delivering the same `added` delta twice renders one row", async () => {
    const stream = makeStream();
    const { ref } = setup({ subscribe: stream.subscribe });
    const delta: CommentDelta = { kind: "added", comment: comment("live-1", { content: "live!" }) };
    await stream.push(delta);
    await stream.push(delta);
    expect(rowCount("live!")).toBe(1);
    expect(ids(ref.current!.getCurrentComments())).toEqual(["live-1", "a"]);
  });

  it("an `added` delta with an unknown parentId is dropped with ONE dev warning", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const stream = makeStream();
    const { ref } = setup({ subscribe: stream.subscribe });
    await stream.push({ kind: "added", comment: comment("orphan-1"), parentId: "nope" });
    await stream.push({ kind: "added", comment: comment("orphan-2"), parentId: "nope" });
    expect(ids(ref.current!.getCurrentComments())).toEqual(["a"]);
    expect(warn.mock.calls.filter((c) => String(c[0]).includes("parentId"))).toHaveLength(1);
    warn.mockRestore();
  });
});

describe("rollback", () => {
  it("a rejected add removes the pending comment, reports onError, keeps the text and shows the alert", async () => {
    const add = deferred<Comment | void>();
    const onError = vi.fn();
    const unhandled = trackUnhandled();
    const { post, user, ref } = setup({ onAddComment: () => add.promise, onError });
    await post("will fail");
    expect(screen.getAllByText("will fail").length).toBeGreaterThan(0);
    await act(async () => add.reject(new Error("offline")));

    expect(ids(ref.current!.getCurrentComments())).toEqual(["a"]);
    const box = screen.getByPlaceholderText(PLACEHOLDER) as HTMLTextAreaElement;
    expect(box.value).toBe("will fail");
    expect(screen.getByRole("alert")).toHaveTextContent("Couldn't post your comment. Try again.");
    const [error, context] = onError.mock.calls[0] as unknown as [Error, { kind: string; commentId: string }];
    expect(error.message).toBe("offline");
    expect(context.kind).toBe("add");
    expect(context.commentId).toMatch(/^temp-/);

    // The next keystroke clears the alert.
    await user.type(box, "!");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await flush();
    unhandled.stop();
    expect(unhandled.seen).toEqual([]);
  });

  it("a rejected reply closes nothing: the inline composer stays with its text and alert", async () => {
    const onError = vi.fn();
    const { user } = setup({ onAddComment: () => Promise.reject(new Error("no")), onError });
    await user.click(rowQueries("Body a").getByRole("button", { name: "Reply" }));
    await user.type(screen.getByLabelText("Reply to User a"), "oops{Enter}");
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(onError).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ kind: "add", parentId: "a" }));
    expect((screen.getByLabelText("Reply to User a") as HTMLTextAreaElement).value).toBe("oops");
  });

  it("a rejected like restores the state and the count, and reports onError", async () => {
    const like = deferred<unknown>();
    const onError = vi.fn();
    const { user } = setup({
      comments: [comment("a", { likes: 3 })],
      onLikeComment: () => like.promise,
      onError,
    });
    const row = rowQueries("Body a");
    await user.click(row.getByRole("button", { name: /^Like/ }));
    expect(row.getByRole("button", { name: /^Unlike/ })).toHaveAccessibleName("Unlike 4");
    await act(async () => like.reject(new Error("x")));
    expect(row.getByRole("button", { name: /^Like/ })).toHaveAccessibleName("Like 3");
    expect(onError).toHaveBeenCalledWith(expect.any(Error), { kind: "like", commentId: "a" });
  });

  it("a rejected delete brings the subtree back at its old position", async () => {
    const del = deferred<unknown>();
    const { user, ref } = setup({
      comments: [mine("first"), mine("second", { replies: [comment("kid")] }), mine("third")],
      onDeleteComment: () => del.promise,
    });
    await user.click(rowQueries("Body second").getByRole("button", { name: /Comment actions for/ }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
    expect(ids(ref.current!.getCurrentComments())).toEqual(["first", "third"]);
    await act(async () => del.reject(new Error("no")));
    expect(ids(ref.current!.getCurrentComments())).toEqual(["first", "second", "kid", "third"]);
  });

  it("a rejected reaction restores the reaction and the counts", async () => {
    const react = deferred<unknown>();
    const { user } = setup({
      comments: [comment("a", { reactions: { viewerReaction: null, counts: { love: 2 }, totalCount: 2 } })],
      reactionKinds: [{ key: "love", icon: <span>♥</span>, label: "Love" }],
      onReactComment: () => react.promise,
    });
    const row = rowQueries("Body a");
    await user.click(row.getByRole("button", { name: /^React/ }));
    await user.click(await screen.findByRole("button", { name: /^Love/ }));
    await waitFor(() => expect(row.getByRole("button", { name: /^Remove|Love/ })).toBeInTheDocument());
    await act(async () => react.reject(new Error("no")));
    expect(row.getByRole("button", { name: /^React/ })).toHaveAccessibleName("React 2");
  });

  it("the latest request wins: an older like settling late never overrides a newer one", async () => {
    const first = deferred<unknown>();
    const second = deferred<unknown>();
    const queue = [first, second];
    const onLikeComment = vi.fn(() => queue.shift()!.promise);
    const { user } = setup({ comments: [comment("a", { likes: 3 })], onLikeComment });
    const row = rowQueries("Body a");
    await user.click(row.getByRole("button", { name: /^Like/ })); // like
    await user.click(row.getByRole("button", { name: /^Unlike/ })); // unlike
    await act(async () => second.resolve(undefined)); // the newer settles first
    await act(async () => first.resolve(undefined)); // the older settles late
    expect(row.getByRole("button", { name: /^Like/ })).toHaveAccessibleName("Like 3");
    expect(onLikeComment).toHaveBeenCalledTimes(2);
  });

  it("optimistic={false}: a like waits for its promise", async () => {
    const like = deferred<unknown>();
    const { user } = setup({
      optimistic: false,
      comments: [comment("a", { likes: 3 })],
      onLikeComment: () => like.promise,
    });
    const row = rowQueries("Body a");
    await user.click(row.getByRole("button", { name: /^Like/ }));
    expect(row.getByRole("button", { name: /^Like/ })).toHaveAccessibleName("Like 3");
    await act(async () => like.resolve(undefined));
    expect(row.getByRole("button", { name: /^Unlike/ })).toHaveAccessibleName("Unlike 4");
  });
});

describe("no unhandled rejections", () => {
  it("a failing handler, load-more and replies loader reject into onError, never into the void", async () => {
    const unhandled = trackUnhandled();
    const onError = vi.fn();
    const { user } = setup({
      comments: [comment("a", { replyCount: 2, likes: 1 })],
      pageSize: 1,
      onError,
      onLikeComment: () => Promise.reject(new Error("like")),
      onDeleteComment: () => Promise.reject(new Error("delete")),
      onLoadMore: () => Promise.reject(new Error("more")),
      onLoadReplies: () => Promise.reject(new Error("replies")),
    });
    await user.click(rowQueries("Body a").getByRole("button", { name: /^Like/ }));
    await user.click(screen.getByRole("button", { name: "Load older comments" }));
    await user.click(screen.getByRole("button", { name: /View 2 replies/ }));
    await flush();
    await flush();
    unhandled.stop();
    expect(unhandled.seen).toEqual([]);
    const kinds = onError.mock.calls.map((c) => (c[1] as { kind: string }).kind).sort();
    expect(kinds).toEqual(["like", "load-more", "load-replies"]);
  });

  it("a throwing onError is swallowed too", async () => {
    const unhandled = trackUnhandled();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { user } = setup({
      comments: [comment("a")],
      onError: () => {
        throw new Error("boom");
      },
      onLikeComment: () => Promise.reject(new Error("like")),
    });
    await user.click(rowQueries("Body a").getByRole("button", { name: /^Like/ }));
    await flush();
    unhandled.stop();
    spy.mockRestore();
    expect(unhandled.seen).toEqual([]);
  });
});

describe("the handle", () => {
  it("reset replaces the tree; dispatch drives the reducer", async () => {
    const { ref } = setup();
    act(() => ref.current!.reset([comment("z")]));
    expect(ids(ref.current!.getCurrentComments())).toEqual(["z"]);
    act(() => ref.current!.dispatch({ kind: "add", comment: comment("y") }));
    expect(ids(ref.current!.getCurrentComments())).toEqual(["y", "z"]);
  });

  it("openReply on a pending comment does nothing", async () => {
    const add = deferred<Comment | void>();
    const { ref, post } = setup({ onAddComment: () => add.promise });
    await post("pending parent");
    const pendingId = ref.current!.getCurrentComments()[0]!.id;
    act(() => ref.current!.openReply(pendingId));
    expect(screen.getAllByPlaceholderText(PLACEHOLDER)).toHaveLength(1);
  });
});

describe("ids and StrictMode", () => {
  it("falls back to a per-instance counter when crypto.randomUUID is missing", async () => {
    vi.stubGlobal("crypto", {});
    const sent: string[] = [];
    let helpers!: CommentComposerHelpers;
    setup({
      onAddComment: (_content, _parent, options) => {
        sent.push(options!.clientId);
        return new Promise<void>(() => {});
      },
      renderComposer: (_state, h) => {
        helpers = h;
        return <div />;
      },
    });
    await act(async () => {
      void helpers.submit("one");
      void helpers.submit("two");
    });
    vi.unstubAllGlobals();
    expect(sent).toHaveLength(2);
    expect(new Set(sent).size).toBe(2);
  });

  it("under StrictMode the subscription is balanced and an echoed post is still one row", async () => {
    let live = 0;
    let push: ((d: CommentDelta) => void) | undefined;
    const subscribe = (h: (d: CommentDelta) => void) => {
      live++;
      push = h;
      return () => {
        live--;
      };
    };
    const add = deferred<Comment | void>();
    let clientId = "";
    const user = userEvent.setup();
    const { unmount } = render(
      <StrictMode>
        <CommentThread
          now={NOW}
          comments={[comment("a")]}
          currentUser={ME}
          subscribe={subscribe}
          onAddComment={(_c, _p, o) => {
            clientId = o!.clientId;
            return add.promise;
          }}
        />
      </StrictMode>,
    );
    expect(live).toBe(1);
    await user.type(screen.getByPlaceholderText(PLACEHOLDER), "strict{Enter}");
    const real = mine("real-s", { content: "strict", clientId });
    await act(async () => push?.({ kind: "added", comment: real }));
    await act(async () => add.resolve(real));
    expect(rowCount("strict")).toBe(1);
    unmount();
    expect(live).toBe(0);
  });
});
