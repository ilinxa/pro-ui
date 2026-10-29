/**
 * Release 7b U4 fix wave on comment-thread 0.6.0. Each test was written to fail without its fix.
 */
import { createRef, useEffect, useState } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommentThread } from "../comment-thread";
import {
  CommentThreadComposer,
  CommentThreadList,
  CommentThreadLoadMore,
  CommentThreadRoot,
  CommentThreadScrollArea,
  type CommentDeleteDialogProps,
  type CommentPage,
  type CommentThreadHandle,
  type CommentThreadRootProps,
} from "../index";
import { CommentDeleteConfirmDialog } from "../features/confirm-delete";
import { resolveLabels } from "../lib/labels";
import { useThreadContext } from "../parts/thread-context";
import { mockLayout } from "../../../../../../tests/helpers";
import { ME, NOW, comment, deferred, flush, installDomStubs, mine, rowCount } from "./support";

let restore: () => void;
beforeEach(() => {
  restore = installDomStubs();
});
afterEach(() => restore());

function Asker({ ids }: { ids: string[] }) {
  const ctx = useThreadContext();
  return (
    <div>
      {ids.map((id) => (
        <button key={id} onClick={() => ctx.requestDelete(id)}>
          ask-{id}
        </button>
      ))}
    </div>
  );
}
const ask = (id: string) => userEvent.setup().click(screen.getByRole("button", { name: `ask-${id}` }));

function FakeDialog({ request, onResolve }: CommentDeleteDialogProps) {
  if (!request) return null;
  return (
    <div data-testid="fake-dialog">
      <button onClick={() => onResolve(true)}>yes</button>
      <button onClick={() => onResolve(false)}>no</button>
    </div>
  );
}
const extension = { Dialog: FakeDialog };

type RootProps = Omit<CommentThreadRootProps, "children" | "comments"> & {
  comments?: CommentThreadRootProps["comments"];
};
function Thread(props: RootProps & { ref?: React.Ref<CommentThreadHandle>; ids?: string[] }) {
  const { ids = ["a", "b", "c", "a1"], ...rest } = props;
  return (
    <CommentThreadRoot
      now={NOW}
      currentUser={ME}
      comments={[mine("a", { replies: [mine("a1")] }), mine("b"), mine("c")]}
      {...rest}
    >
      <Asker ids={ids} />
      <CommentThreadList />
      <CommentThreadLoadMore />
      <CommentThreadComposer />
    </CommentThreadRoot>
  );
}

const ownKebab = (id: string) => {
  const rowEl = document.querySelector(`[data-comment-id="${id}"]`)!;
  return Array.from(rowEl.querySelectorAll("[data-comment-kebab]")).find(
    (k) => k.closest("[data-comment-id]") === rowEl,
  );
};

describe("1. delete focus hand-off inside a host dialog", () => {
  it("confirm focuses the neighbour row, cancel the row's kebab, though the thread sits in a role=dialog", async () => {
    const user = userEvent.setup();
    render(
      <div role="dialog" aria-label="host sheet">
        <Thread confirmDelete={extension} />
      </div>,
    );
    await ask("b");
    await user.click(screen.getByRole("button", { name: "no" }));
    await waitFor(() => expect(document.activeElement).toBe(ownKebab("b")));
    await ask("b");
    await user.click(screen.getByRole("button", { name: "yes" }));
    await waitFor(() => expect(rowCount("Body b")).toBe(0));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByText("Body c").closest("article")));
  });

  it("still waits for a foreign open dialog", async () => {
    const user = userEvent.setup();
    render(
      <>
        <div role="alertdialog" aria-label="other" />
        <Thread confirmDelete={extension} />
      </>,
    );
    await ask("b");
    await user.click(screen.getByRole("button", { name: "no" }));
    await new Promise((r) => setTimeout(r, 200));
    expect(document.activeElement).toBe(document.body);
  });
});

describe("U5: the hand-off waits for a dialog that animates closed", () => {
  // Like a Radix dialog: it stays mounted (data-state="closed") for its exit animation, and its focus
  // scope moves focus once more on unmount (here: away from wherever it is, to <body>).
  function LingeringDialog({ request, onResolve }: CommentDeleteDialogProps) {
    const [shown, setShown] = useState(request);
    if (request && request !== shown) setShown(request);
    useEffect(() => {
      if (request) return;
      const id = setTimeout(() => setShown(null), 150); // the exit animation
      return () => clearTimeout(id);
    }, [request]);
    if (!shown) return null;
    return (
      <Lingering state={request ? "open" : "closed"}>
        <button onClick={() => onResolve(true)}>yes</button>
        <button onClick={() => onResolve(false)}>no</button>
      </Lingering>
    );
  }
  function Lingering({ state, children }: { state: string; children: React.ReactNode }) {
    // On unmount the focus scope moves focus once more, a tick later.
    useEffect(() => () => void setTimeout(() => (document.activeElement as HTMLElement | null)?.blur(), 0), []);
    return (
      <div role="alertdialog" data-state={state}>
        {children}
      </div>
    );
  }

  it("cancel: focus ends on the row's kebab after the dialog left the DOM", async () => {
    const user = userEvent.setup();
    render(<Thread confirmDelete={{ Dialog: LingeringDialog }} />);
    await ask("b");
    await user.click(screen.getByRole("button", { name: "no" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull(), { timeout: 1000 });
    await waitFor(() => expect(document.activeElement).toBe(ownKebab("b")), { timeout: 1500 });
  });

  it("confirm: focus ends on the neighbour row after the dialog left the DOM", async () => {
    const user = userEvent.setup();
    render(<Thread confirmDelete={{ Dialog: LingeringDialog }} />);
    await ask("b");
    await user.click(screen.getByRole("button", { name: "yes" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull(), { timeout: 1000 });
    await waitFor(
      () => expect(document.activeElement).toBe(screen.getByText("Body c").closest("article")),
      { timeout: 1500 },
    );
  });
});

describe("2. cancel focuses the row's own kebab when replies are loaded", () => {
  it("parent with an expanded reply", async () => {
    const user = userEvent.setup();
    render(<Thread confirmDelete={extension} />);
    expect(rowCount("Body a1")).toBe(1);
    await ask("a");
    await user.click(screen.getByRole("button", { name: "no" }));
    await waitFor(() => expect(document.activeElement).toBe(ownKebab("a")));
    expect(document.activeElement).not.toBe(ownKebab("a1"));
  });
});

describe("3. touch size", () => {
  it("Show more gets a 44 px hit area and the composer field is at least 44 px tall", () => {
    const restoreLayout = mockLayout({ scrollHeight: 400, lineHeight: "20px" });
    try {
      render(
        <CommentThread
          now={NOW}
          currentUser={ME}
          size="touch"
          comments={[comment("a", { content: "word ".repeat(120).trim() })]}
        />,
      );
      expect(screen.getByRole("button", { name: "Show more" })).toHaveClass("min-h-11", "min-w-11");
      expect(screen.getByRole("textbox")).toHaveClass("min-h-11");
    } finally {
      restoreLayout();
    }
  });
});

describe("4. confirm-delete add-on", () => {
  it("styles Delete through buttonVariants and marks the dialog data-keyboard-ignore", async () => {
    render(
      <CommentDeleteConfirmDialog
        request={{ comment: comment("a"), hasReplies: false }}
        labels={resolveLabels(undefined)}
        onResolve={() => {}}
      />,
    );
    await act(async () => void (await new Promise((r) => setTimeout(r, 20))));
    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveAttribute("data-keyboard-ignore");
    const del = screen.getByRole("button", { name: "Delete" });
    expect(del.className).toMatch(/bg-destructive/);
    // U5 (browser, dark mode 1.46:1): no default-variant classes merged in (an AlertDialogAction that wraps a
    // default Button with asChild concatenated them, and they won over the destructive ones).
    expect(del.className).not.toMatch(/text-primary-foreground/);
  });
});

describe("5/6. Load older comments hand-off", () => {
  it("an empty last page leaves nothing armed: a later realtime comment does not take focus", async () => {
    const ref = createRef<CommentThreadHandle>();
    const user = userEvent.setup();
    render(
      <>
        <input aria-label="elsewhere" />
        <Thread ref={ref} ids={[]} pageSize={3} onLoadMore={async () => []} />
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Load older comments" }));
    await act(async () => void (await new Promise((r) => setTimeout(r, 1200))));
    screen.getByLabelText("elsewhere").focus();
    act(() => ref.current!.dispatch({ kind: "add", comment: comment("rt") }));
    await act(async () => void (await new Promise((r) => setTimeout(r, 100))));
    expect(screen.getByLabelText("elsewhere")).toHaveFocus();
  });

  it("focus that moved outside the thread is not pulled back when the page arrives", async () => {
    const page = deferred<Comment[]>();
    const user = userEvent.setup();
    render(
      <>
        <input aria-label="elsewhere" />
        <Thread ids={[]} pageSize={3} onLoadMore={() => page.promise} />
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Load older comments" }));
    screen.getByLabelText("elsewhere").focus();
    await act(async () => {
      page.resolve([comment("n")]);
      await flush();
    });
    await waitFor(() => expect(rowCount("Body n")).toBe(1));
    expect(screen.getByLabelText("elsewhere")).toHaveFocus();
  });

  it("still focuses the first new row when focus stayed on the button", async () => {
    const user = userEvent.setup();
    render(<Thread ids={[]} pageSize={3} onLoadMore={async () => [comment("n")]} />);
    await user.click(screen.getByRole("button", { name: "Load older comments" }));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByText("Body n").closest("article")));
  });
});

type Comment = ReturnType<typeof comment>;

// ─── 7. auto-load ────────────────────────────────────────────────────────────
interface FakeIO {
  cb: IntersectionObserverCallback;
  target: Element | null;
  disconnected: boolean;
}
let observers: FakeIO[] = [];
let restoreIO: () => void = () => {};
function installIO() {
  const original = globalThis.IntersectionObserver;
  observers = [];
  class FakeObserver {
    private rec: FakeIO;
    constructor(cb: IntersectionObserverCallback) {
      this.rec = { cb, target: null, disconnected: false };
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
  restoreIO = () => {
    globalThis.IntersectionObserver = original;
  };
}
const intersect = () => {
  for (const o of observers.filter((x) => !x.disconnected)) {
    o.cb([{ isIntersecting: true, target: o.target! } as IntersectionObserverEntry], {} as IntersectionObserver);
  }
};
const many = (n: number) => Array.from({ length: n }, (_, i) => comment(`c${i}`));

describe("7. auto-load does not re-request the same page", () => {
  beforeEach(installIO);
  afterEach(() => restoreIO());

  it("a controlled host that has not applied the page yet: one request, not two", async () => {
    const onLoadMoreCursor = vi.fn(async (): Promise<CommentPage> => ({
      items: [comment("n0")],
      hasMore: true,
      nextCursor: "2",
    }));
    render(
      <CommentThreadRoot
        now={NOW}
        comments={many(3)}
        onCommentsChange={() => {}} // the host never applies it
        pageSize={3}
        hasMore
        nextCursor="1"
        onLoadMoreCursor={onLoadMoreCursor}
      >
        <CommentThreadScrollArea>
          <CommentThreadList />
          <CommentThreadLoadMore mode="auto" />
        </CommentThreadScrollArea>
      </CommentThreadRoot>,
    );
    await waitFor(() => expect(observers.some((o) => !o.disconnected)).toBe(true));
    act(() => intersect());
    await act(async () => void (await flush()));
    await waitFor(() => expect(observers.some((o) => !o.disconnected)).toBe(true));
    act(() => intersect());
    expect(onLoadMoreCursor).toHaveBeenCalledTimes(1);
  });

  it("a page with no visible rows and hasMore stops auto-loading; the button still loads", async () => {
    const onLoadMoreCursor = vi.fn(async (): Promise<CommentPage> => ({ items: [], hasMore: true, nextCursor: "x" }));
    const user = userEvent.setup();
    render(
      <CommentThreadRoot now={NOW} comments={many(3)} pageSize={3} onLoadMoreCursor={onLoadMoreCursor}>
        <CommentThreadScrollArea>
          <CommentThreadList />
          <CommentThreadLoadMore mode="auto" />
        </CommentThreadScrollArea>
      </CommentThreadRoot>,
    );
    await waitFor(() => expect(observers.some((o) => !o.disconnected)).toBe(true));
    act(() => intersect());
    await act(async () => void (await flush()));
    await waitFor(() => expect(observers.some((o) => !o.disconnected)).toBe(true));
    act(() => intersect());
    act(() => intersect());
    expect(onLoadMoreCursor).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: /Load older comments/ }));
    expect(onLoadMoreCursor).toHaveBeenCalledTimes(2);
  });
});

describe("9. a confirmDelete that never settles", () => {
  it("a request for another comment supersedes it; the stale answer is ignored", async () => {
    const first = deferred<boolean>();
    const confirmDelete = vi.fn((r: { comment: { id: string } }) => (r.comment.id === "a" ? first.promise : Promise.resolve(true)));
    render(<Thread confirmDelete={confirmDelete as never} />);
    await ask("a");
    await ask("b");
    expect(confirmDelete).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(rowCount("Body b")).toBe(0));
    await act(async () => {
      first.resolve(true);
      await flush();
    });
    expect(rowCount("Body a")).toBe(1);
  });

  it("the same comment asked twice while pending is still ignored", async () => {
    const never = new Promise<boolean>(() => {});
    const confirmDelete = vi.fn(() => never);
    render(<Thread confirmDelete={confirmDelete} />);
    await ask("b");
    await ask("b");
    expect(confirmDelete).toHaveBeenCalledTimes(1);
  });

  it("a pending request for a comment that vanished is dropped, so it can be asked again", async () => {
    const never = new Promise<boolean>(() => {});
    const confirmDelete = vi.fn(() => never);
    const ref = createRef<CommentThreadHandle>();
    render(<Thread ref={ref} confirmDelete={confirmDelete} />);
    await ask("b");
    act(() => ref.current!.dispatch({ kind: "remove", commentId: "b" }));
    act(() => ref.current!.dispatch({ kind: "add", comment: mine("b") }));
    await ask("b");
    expect(confirmDelete).toHaveBeenCalledTimes(2);
  });
});

describe("10. function form after unmount", () => {
  it("a late true neither removes nor arms timers", async () => {
    const answer = deferred<boolean>();
    const onDeleteComment = vi.fn(async () => undefined);
    const { unmount } = render(<Thread confirmDelete={() => answer.promise} onDeleteComment={onDeleteComment} />);
    await ask("b");
    unmount();
    const timers = vi.spyOn(globalThis, "setTimeout");
    await act(async () => {
      answer.resolve(true);
      await flush();
    });
    expect(onDeleteComment).not.toHaveBeenCalled();
    expect(timers.mock.calls.filter(([, ms]) => ms === 50)).toHaveLength(0);
    timers.mockRestore();
  });
});

describe("12. CommentThreadScrollArea", () => {
  it("keeps a stable callback ref across re-renders", () => {
    const calls: Array<HTMLDivElement | null> = [];
    const cb = (node: HTMLDivElement | null) => void calls.push(node);
    function Host() {
      const [, force] = useState(0);
      return (
        <>
          <button onClick={() => force((n) => n + 1)}>again</button>
          <CommentThreadScrollArea ref={cb}>x</CommentThreadScrollArea>
        </>
      );
    }
    render(<Host />);
    const before = calls.length;
    act(() => screen.getByRole("button", { name: "again" }).click());
    act(() => screen.getByRole("button", { name: "again" }).click());
    expect(calls.length).toBe(before);
    expect(screen.getByRole("region", { name: "Comments" })).toBeInTheDocument();
  });
});

describe("15. handle.focusComposer without a composer part", () => {
  it("warns once in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const ref = createRef<CommentThreadHandle>();
    render(
      <CommentThreadRoot ref={ref} now={NOW} currentUser={ME} comments={[comment("a")]}>
        <CommentThreadList />
      </CommentThreadRoot>,
    );
    ref.current!.focusComposer();
    ref.current!.focusComposer();
    expect(warn.mock.calls.filter(([m]) => String(m).includes("focusComposer() found no mounted"))).toHaveLength(1);
    warn.mockRestore();
    vi.unstubAllEnvs();
  });

  it("survives a second composer part unmounting", () => {
    const ref = createRef<CommentThreadHandle>();
    function Host({ both }: { both: boolean }) {
      return (
        <CommentThreadRoot ref={ref} now={NOW} currentUser={ME} comments={[comment("a")]}>
          <CommentThreadList />
          {both ? <CommentThreadComposer /> : null}
          <CommentThreadComposer />
        </CommentThreadRoot>
      );
    }
    const { rerender } = render(<Host both />);
    rerender(<Host both={false} />);
    act(() => ref.current!.focusComposer());
    expect(document.activeElement).toBe(screen.getByRole("textbox"));
  });
});
