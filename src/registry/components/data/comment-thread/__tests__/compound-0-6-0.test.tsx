/**
 * 0.6.0 compound: hand-assembled parts, auto-mode load-more (IntersectionObserver), the scroll
 * area, `useCommentThread`, the composer part, F-02 (load-more focus waits for the page).
 * The unchanged 0.5.0 suites are the proof that the `CommentThread` assembly's DOM did not move.
 */
import { createRef, useState } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CommentThreadComposer,
  CommentThreadList,
  CommentThreadLoadMore,
  CommentThreadRoot,
  CommentThreadScrollArea,
  useCommentThread,
  type CommentPage,
  type CommentThreadHandle,
  type CommentThreadRootProps,
} from "../index";
import type { Comment } from "../types";
import { ME, NOW, comment, deferred, flush, installDomStubs } from "./support";

let restore: () => void;
let restoreIO: () => void;
beforeEach(() => {
  restore = installDomStubs();
  restoreIO = installIO();
});
afterEach(() => {
  restoreIO();
  restore();
});

// ─── A controllable IntersectionObserver ─────────────────────────────────────
interface FakeIO {
  cb: IntersectionObserverCallback;
  options?: IntersectionObserverInit;
  target: Element | null;
  disconnected: boolean;
}
let observers: FakeIO[] = [];
function installIO(): () => void {
  const original = globalThis.IntersectionObserver;
  observers = [];
  class FakeObserver {
    private rec: FakeIO;
    constructor(cb: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      this.rec = { cb, options, target: null, disconnected: false };
      observers.push(this.rec);
    }
    observe(el: Element) {
      this.rec.target = el;
    }
    unobserve() {}
    disconnect() {
      this.rec.disconnected = true;
    }
    takeRecords() {
      return [];
    }
  }
  globalThis.IntersectionObserver = FakeObserver as unknown as typeof IntersectionObserver;
  return () => {
    globalThis.IntersectionObserver = original;
  };
}
const live = () => observers.filter((o) => !o.disconnected);
/** Reports "visible" to every live observer. */
function intersect() {
  for (const o of live()) {
    o.cb([{ isIntersecting: true, target: o.target! } as IntersectionObserverEntry], {} as IntersectionObserver);
  }
}

const many = (n: number, prefix = "c"): Comment[] =>
  Array.from({ length: n }, (_, i) => comment(`${prefix}${i}`));

type RootProps = Omit<CommentThreadRootProps, "children">;

function Panel(props: RootProps & { mode?: "auto" | "button"; ref?: React.Ref<CommentThreadHandle> }) {
  const { mode = "auto", ...rest } = props;
  return (
    <CommentThreadRoot now={NOW} currentUser={ME} {...rest}>
      <CommentThreadScrollArea data-testid="area">
        <CommentThreadList />
        <CommentThreadLoadMore mode={mode} />
      </CommentThreadScrollArea>
      <CommentThreadComposer />
    </CommentThreadRoot>
  );
}

describe("auto-mode load more", () => {
  it("observes inside the scroll area, loads once per intersection, single-flight", async () => {
    const page = deferred<CommentPage>();
    const onLoadMoreCursor = vi.fn(() => page.promise);
    render(<Panel comments={many(3)} pageSize={3} onLoadMoreCursor={onLoadMoreCursor} />);
    await waitFor(() => expect(live().length).toBe(1));
    expect(live()[0].options?.root).toBe(screen.getByTestId("area"));
    expect(live()[0].options?.rootMargin).toBe("0px 0px 200px 0px");

    act(() => intersect());
    act(() => intersect()); // a second report while the first is loading
    expect(onLoadMoreCursor).toHaveBeenCalledTimes(1);
    expect(live().length).toBe(0); // disconnected while loading
    await act(async () => {
      page.resolve({ items: [], hasMore: false });
      await flush();
    });
  });

  it("loads again when the sentinel is still visible after a short page", async () => {
    const pages = [deferred<CommentPage>(), deferred<CommentPage>()];
    let n = 0;
    const onLoadMoreCursor = vi.fn(() => pages[n++].promise);
    render(<Panel comments={many(3)} pageSize={3} onLoadMoreCursor={onLoadMoreCursor} />);
    await waitFor(() => expect(live().length).toBe(1));
    act(() => intersect());
    await act(async () => {
      pages[0].resolve({ items: [comment("n0")], hasMore: true, nextCursor: "2" });
      await flush();
    });
    await waitFor(() => expect(live().length).toBe(1)); // re-observed once loading ended
    act(() => intersect());
    expect(onLoadMoreCursor).toHaveBeenCalledTimes(2);
    await act(async () => {
      pages[1].resolve({ items: [], hasMore: false });
      await flush();
    });
    expect(screen.queryByRole("button", { name: /Load older comments/ })).toBeNull();
  });

  it("never retries a failed page; the Retry button does", async () => {
    const onLoadMoreCursor = vi
      .fn<() => Promise<CommentPage>>()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValue({ items: [], hasMore: false });
    const user = userEvent.setup();
    render(<Panel comments={many(3)} pageSize={3} onLoadMoreCursor={onLoadMoreCursor} />);
    await waitFor(() => expect(live().length).toBe(1));
    act(() => intersect());
    await screen.findByRole("alert");
    expect(live().length).toBe(0);
    act(() => intersect());
    expect(onLoadMoreCursor).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onLoadMoreCursor).toHaveBeenCalledTimes(2);
  });

  it("announces the load in a polite status present from mount; the button stays", async () => {
    const page = deferred<CommentPage>();
    render(<Panel comments={many(3)} pageSize={3} onLoadMoreCursor={() => page.promise} />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent("");
    await waitFor(() => expect(live().length).toBe(1));
    act(() => intersect());
    await waitFor(() => expect(status).toHaveTextContent("Load older comments…"));
    expect(screen.getByRole("button", { name: "Load older comments…" })).toBeInTheDocument();
    await act(async () => {
      page.resolve({ items: [], hasMore: false });
      await flush();
    });
  });

  it('mode="button" never observes', async () => {
    render(<Panel mode="button" comments={many(3)} pageSize={3} onLoadMoreCursor={async () => ({ items: [] })} />);
    await flush();
    expect(observers.length).toBe(0);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("outside a scroll area it watches the scrollRoot prop, else the viewport", async () => {
    const holder = document.createElement("div");
    const { unmount } = render(
      <CommentThreadRoot now={NOW} comments={many(3)} pageSize={3} onLoadMoreCursor={async () => ({ items: [] })}>
        <CommentThreadLoadMore mode="auto" scrollRoot={holder} rootMargin="10px" />
      </CommentThreadRoot>,
    );
    await waitFor(() => expect(live().length).toBe(1));
    expect(live()[0].options?.root).toBe(holder);
    expect(live()[0].options?.rootMargin).toBe("10px");
    unmount();
    render(
      <CommentThreadRoot now={NOW} comments={many(3)} pageSize={3} onLoadMoreCursor={async () => ({ items: [] })}>
        <CommentThreadLoadMore mode="auto" />
      </CommentThreadRoot>,
    );
    await waitFor(() => expect(live().length).toBe(1));
    expect(live()[0].options?.root).toBeNull();
  });
});

describe("CommentThreadScrollArea", () => {
  it("is a focusable named region, named by labels.commentsRegion inside a thread", () => {
    render(
      <CommentThreadRoot now={NOW} comments={[]} labels={{ commentsRegion: "Yorumlar" }}>
        <CommentThreadScrollArea className="h-40" />
      </CommentThreadRoot>,
    );
    const region = screen.getByRole("region", { name: "Yorumlar" });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(region.className).toContain("overflow-y-auto");
    expect(region.className).toContain("h-40");
  });

  it("works outside a thread: default name, aria-label prop wins, forwards props and ref", () => {
    const ref = createRef<HTMLDivElement>();
    const { rerender } = render(<CommentThreadScrollArea ref={ref} data-x="1" />);
    expect(screen.getByRole("region", { name: "Comments" })).toHaveAttribute("data-x", "1");
    expect(ref.current).toBe(screen.getByRole("region"));
    rerender(<CommentThreadScrollArea ref={ref} aria-label="Replies" />);
    expect(screen.getByRole("region", { name: "Replies" })).toBeInTheDocument();
  });
});

describe("hand-assembled thread", () => {
  it("the composer outside the scroll region still posts", async () => {
    const onAddComment = vi.fn(async () => undefined);
    const user = userEvent.setup();
    render(<Panel comments={many(1)} onAddComment={onAddComment} />);
    const area = screen.getByTestId("area");
    const box = screen.getByRole("textbox");
    expect(area.contains(box)).toBe(false);
    await user.type(box, "hello");
    await user.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(onAddComment).toHaveBeenCalled());
    expect(await screen.findByText("hello")).toBeInTheDocument();
  });

  it("handle.focusComposer reaches the composer part", () => {
    const ref = createRef<CommentThreadHandle>();
    render(<Panel ref={ref} comments={many(1)} />);
    act(() => ref.current!.focusComposer());
    expect(document.activeElement).toBe(screen.getByRole("textbox"));
  });

  it("Root + List only (no composer part): renders, focusComposer is harmless", () => {
    const ref = createRef<CommentThreadHandle>();
    render(
      <CommentThreadRoot ref={ref} now={NOW} currentUser={ME} comments={many(2)}>
        <CommentThreadList />
      </CommentThreadRoot>,
    );
    expect(screen.getByText("Body c0")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(() => act(() => ref.current!.focusComposer())).not.toThrow();
  });

  it("the composer part: closed notice, signed-out slot, wrapper only with className", () => {
    const { container, rerender } = render(
      <CommentThreadRoot now={NOW} currentUser={ME} comments={[]} closed>
        <CommentThreadComposer />
      </CommentThreadRoot>,
    );
    expect(screen.getByText("Comments are turned off.")).toBeInTheDocument();
    expect(container.querySelector("p")?.parentElement?.tagName).toBe("DIV"); // the root div
    expect(container.querySelector("[data-wrap]")).toBeNull();
    rerender(
      <CommentThreadRoot now={NOW} comments={[]} composerEmptyState={<i>sign in</i>}>
        <CommentThreadComposer className="wrap" />
      </CommentThreadRoot>,
    );
    expect(screen.getByText("sign in").parentElement).toHaveClass("wrap");
  });

  it("the list part: empty state and className", () => {
    const { unmount } = render(
      <CommentThreadRoot now={NOW} comments={[]}>
        <CommentThreadList />
      </CommentThreadRoot>,
    );
    expect(screen.getByText("No comments yet", { exact: false })).toBeInTheDocument();
    unmount();
    render(
      <CommentThreadRoot now={NOW} comments={many(1)}>
        <CommentThreadList className="extra" />
      </CommentThreadRoot>,
    );
    expect(screen.getByRole("list")).toHaveClass("extra");
  });

  it('size="touch" gives the Load more button a 44px hit area', () => {
    render(
      <CommentThreadRoot now={NOW} size="touch" comments={many(3)} pageSize={3} onLoadMore={async () => []}>
        <CommentThreadLoadMore />
      </CommentThreadRoot>,
    );
    expect(screen.getByRole("button", { name: /Load older comments/ })).toHaveClass("min-h-11", "min-w-11");
  });

  it("parts throw a clear error outside a Root", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<CommentThreadList />)).toThrow("CommentThreadList must be used inside CommentThreadRoot");
    expect(() => render(<CommentThreadLoadMore />)).toThrow("CommentThreadLoadMore must be used inside CommentThreadRoot");
    expect(() => render(<CommentThreadComposer />)).toThrow("CommentThreadComposer must be used inside CommentThreadRoot");
    function Bare() {
      useCommentThread();
      return null;
    }
    expect(() => render(<Bare />)).toThrow("useCommentThread must be used inside CommentThreadRoot");
    spy.mockRestore();
  });
});

describe("useCommentThread", () => {
  it("returns the shown comments, paging flags, closed, user and labels", async () => {
    const seen: ReturnType<typeof useCommentThread>[] = [];
    function Probe() {
      seen.push(useCommentThread());
      return null;
    }
    const page = deferred<CommentPage>();
    render(
      <CommentThreadRoot
        now={NOW}
        currentUser={ME}
        closed
        labels={{ loadMore: "More!" }}
        comments={many(3)}
        pageSize={3}
        onLoadMoreCursor={() => page.promise}
      >
        <Probe />
      </CommentThreadRoot>,
    );
    const first = seen.at(-1)!;
    expect(first.comments.map((c) => c.id)).toEqual(["c0", "c1", "c2"]);
    expect(first).toMatchObject({ hasMore: true, loadingMore: false, loadMoreFailed: false, closed: true, currentUser: ME });
    expect(first.labels.loadMore).toBe("More!");
    act(() => first.loadMore());
    act(() => seen.at(-1)!.loadMore()); // single-flight
    expect(seen.at(-1)!.loadingMore).toBe(true);
    await act(async () => {
      page.resolve({ items: [comment("z")], hasMore: false });
      await flush();
    });
    expect(seen.at(-1)!.comments.map((c) => c.id)).toEqual(["c0", "c1", "c2", "z"]);
    expect(seen.at(-1)!.hasMore).toBe(false);
  });
});


describe("F-02: the load-more focus hand-off waits for the page to be in the tree", () => {
  /** A controlled host that folds the page into its state `delayMs` AFTER the load promise resolved. */
  function LateHost({ delayMs }: { delayMs: number }) {
    const [state, setState] = useState({ comments: many(3), more: true });
    return (
      <CommentThreadRoot
        now={NOW}
        comments={state.comments}
        hasMore={state.more}
        pageSize={3}
        onCommentsChange={(next) => setState((s) => ({ ...s, comments: next }))}
        onLoadMoreCursor={async () => {
          setTimeout(
            () => setState({ comments: [...state.comments, comment("late0"), comment("late1")], more: false }),
            delayMs,
          );
          return { items: [] };
        }}
      >
        <CommentThreadList />
        <CommentThreadLoadMore />
      </CommentThreadRoot>
    );
  }

  it("focuses the first new row although loading ended before the page arrived", async () => {
    const user = userEvent.setup();
    render(<LateHost delayMs={60} />);
    await user.click(screen.getByRole("button", { name: /Load older comments/ }));
    await waitFor(() => expect(screen.getByText("Body late0")).toBeInTheDocument());
    await waitFor(() => expect(document.activeElement).toBe(screen.getByText("Body late0").closest("article")));
  });

  it("is dropped when the user moves focus elsewhere first", async () => {
    const user = userEvent.setup();
    render(<LateHost delayMs={150} />);
    await user.click(screen.getByRole("button", { name: /Load older comments/ }));
    await user.click(screen.getByText("Body c0")); // a press on another part of the thread
    await waitFor(() => expect(screen.getByText("Body late0")).toBeInTheDocument());
    await flush();
    expect(document.activeElement).not.toBe(screen.getByText("Body late0").closest("article"));
  });
});
