/**
 * 0.6.0 rows: delete goes through `ctx.requestDelete`, `helpers.onDelete` everywhere, the kebab
 * hook for focus return, `size="touch"` hit areas, the timestamp contrast, composer `size`.
 * Rows are rendered against a hand-built thread context (independent of the root).
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommentNode } from "../parts/comment-node";
import { CommentComposer } from "../parts/comment-composer";
import { CommentThreadContext, type CommentThreadContextValue } from "../parts/thread-context";
import { resolveLabels } from "../lib/labels";
import type { Comment } from "../types";
import { ME, NOW, comment, installDomStubs, mine } from "./support";

let restore: () => void;
beforeEach(() => {
  restore = installDomStubs();
});
afterEach(() => restore());

function ctxValue(over: Partial<CommentThreadContextValue> = {}): CommentThreadContextValue {
  return {
    currentUser: ME,
    labels: resolveLabels(undefined),
    variant: "default",
    maxDepth: 3,
    indentPx: 24,
    bodyMaxLines: 4,
    composerMinRows: 1,
    composerMaxRows: 6,
    submitOnEnter: true,
    closed: false,
    linkComponent: "a",
    size: "default",
    requestDelete: vi.fn(),
    replyComposer: CommentComposer,
    locale: "en",
    formatTime: () => "1h",
    pendingMap: new Map(),
    replyParentId: null,
    openReply: vi.fn(),
    cancelReply: vi.fn(),
    submitReply: vi.fn(async () => {}),
    like: vi.fn(),
    react: vi.fn(),
    remove: vi.fn(),
    edit: vi.fn(async () => {}),
    report: vi.fn(),
    hasReport: false,
    canEditAtAll: false,
    hasReact: false,
    moderation: null,
    hasLoadReplies: false,
    replyLoads: {},
    loadReplies: vi.fn(),
    ...over,
  };
}

function renderRow(c: Comment, over: Partial<CommentThreadContextValue> = {}) {
  const value = ctxValue(over);
  const utils = render(
    <CommentThreadContext.Provider value={value}>
      <CommentNode comment={c} depth={0} />
    </CommentThreadContext.Provider>,
  );
  return { value, user: userEvent.setup(), ...utils };
}

const hit44 = (el: HTMLElement) => {
  expect(el.className).toContain("min-h-11");
  expect(el.className).toContain("min-w-11");
};

describe("delete goes through requestDelete", () => {
  it("the built-in Delete item calls requestDelete, not remove", async () => {
    const { value, user } = renderRow(mine("a"));
    await user.click(screen.getByRole("button", { name: /Comment actions for/ }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
    expect(value.requestDelete).toHaveBeenCalledWith("a");
    expect(value.remove).not.toHaveBeenCalled();
  });

  it("helpers.onDelete reaches commentActions, extraActions, engagementActions and renderNode", async () => {
    const seen: Array<() => void> = [];
    const { value, user, unmount } = renderRow(mine("a"), {
      commentActions: (_c, h) => {
        seen.push(h.onDelete);
        return [{ label: "Mine", onClick: h.onDelete }];
      },
      engagementActions: (_c, h) => {
        seen.push(h.onDelete);
        return h.defaultActions;
      },
    });
    await user.click(screen.getByRole("button", { name: /Comment actions for/ }));
    await user.click(await screen.findByRole("menuitem", { name: "Mine" }));
    expect(value.requestDelete).toHaveBeenCalledTimes(1);
    seen.forEach((fn) => fn());
    expect(value.requestDelete).toHaveBeenCalledTimes(1 + seen.length);
    unmount();

    const extra: Array<() => void> = [];
    const r2 = renderRow(mine("b"), {
      extraActions: (_c, h) => {
        extra.push(h.onDelete);
        return [];
      },
    });
    extra[0]();
    expect(r2.value.requestDelete).toHaveBeenCalledWith("b");
    r2.unmount();

    let nodeDelete: () => void = () => {};
    const r3 = renderRow(mine("c"), {
      renderNode: (_c, _d, h) => {
        nodeDelete = h.onDelete;
        return <div>custom</div>;
      },
    });
    nodeDelete();
    expect(r3.value.requestDelete).toHaveBeenCalledWith("c");
  });

  it("a pending comment's onDelete does nothing", () => {
    let del: () => void = () => {};
    const { value } = renderRow(mine("p"), {
      pendingMap: new Map([["p", "sending" as const]]),
      extraActions: (_c, h) => {
        del = h.onDelete;
        return [];
      },
    });
    del();
    expect(value.requestDelete).not.toHaveBeenCalled();
  });
});

describe("kebab hook", () => {
  it("carries data-comment-kebab and sits inside the element with data-comment-id", () => {
    renderRow(mine("a"));
    const kebab = screen.getByRole("button", { name: /Comment actions for/ });
    expect(kebab).toHaveAttribute("data-comment-kebab", "");
    expect(document.querySelector('[data-comment-id="a"] [data-comment-kebab]')).toBe(kebab);
  });
});

describe('size="touch"', () => {
  const rich = (): Comment => mine("t", { replyCount: 3 });

  it("gives every row control a 44px hit area, always-visible kebab", () => {
    renderRow(rich(), {
      size: "touch",
      hasLoadReplies: true,
      getAuthorHref: () => "/u/me",
    });
    hit44(screen.getByRole("button", { name: /Comment actions for/ }));
    hit44(screen.getByRole("button", { name: "Reply" }));
    hit44(screen.getByRole("button", { name: /replies/i }));
    hit44(screen.getByRole("link", { name: /Ada Lovelace/ }));
    expect(screen.getByRole("button", { name: /Comment actions for/ }).className).not.toContain(
      "opacity-0",
    );
  });

  it("default size changes nothing", () => {
    renderRow(rich(), { hasLoadReplies: true });
    const kebab = screen.getByRole("button", { name: /Comment actions for/ });
    expect(kebab.className).toContain("opacity-0");
    expect(kebab.className).not.toContain("min-h-11");
    expect(screen.getByRole("button", { name: "Reply" }).className).not.toContain("min-h-11");
  });

  it("the inline reply composer is touch-sized", () => {
    renderRow(mine("t"), { size: "touch", replyParentId: "t" });
    hit44(screen.getByRole("button", { name: "Send" }));
    hit44(screen.getByRole("button", { name: "Cancel" }));
  });
});

describe("CommentComposer size", () => {
  it("touch gives Send and Cancel 44px; default markup keeps h-7 w-7", () => {
    const { rerender } = render(<CommentComposer onSubmit={() => {}} onCancel={() => {}} size="touch" />);
    hit44(screen.getByRole("button", { name: "Send" }));
    hit44(screen.getByRole("button", { name: "Cancel" }));
    rerender(<CommentComposer onSubmit={() => {}} onCancel={() => {}} />);
    expect(screen.getByRole("button", { name: "Send" }).className).toContain("h-7 w-7");
    expect(screen.getByRole("button", { name: "Cancel" }).className).not.toContain("min-h-11");
  });
});

describe("meta text contrast (FU-6)", () => {
  it("the timestamp, edited suffix and handle use the plain muted token, never /80", () => {
    renderRow(comment("e", { edited: true, author: { id: "x", name: "Xy", username: "xy" } }));
    const time = screen.getByText("1h").closest("span") as HTMLElement;
    expect(time.className).toContain("text-muted-foreground");
    expect(time.innerHTML).not.toContain("muted-foreground/80");
    expect(document.body.innerHTML).not.toContain("muted-foreground/80");
    void NOW;
  });
});
