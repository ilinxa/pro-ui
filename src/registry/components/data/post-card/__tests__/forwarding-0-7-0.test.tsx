/**
 * 0.7.0: the heart tap that opens the likers panel takes the heart as the opener (FU-1), the
 * `engagementActions` slot receives the inline disclosure (FU-2), the likers / share panels take the
 * forwarded engagement-bar 0.8.0 options, and the inline thread scrolls in a focusable named region.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { card, installDomStubs, makePost } from "./support";
import { defaultPostEngagementActions } from "../lib/defaults";

vi.mock("../../comment-thread/comment-thread", () => ({
  CommentThread: () => <input data-testid="thread-input" aria-label="Write a comment" />,
}));

let restore: () => void;
beforeEach(() => {
  restore = installDomStubs();
});
afterEach(() => restore());

const inline = (over: Parameters<typeof card>[0] = {}) =>
  card({
    engagementMode: "inline",
    post: makePost({ likes: 12 }),
    likers: [{ id: "a", name: "Ayşe Kaya" }],
    onLoadMoreLikers: async () => [],
    shareSuggestions: [{ id: "b", name: "Bora Demir" }],
    ...over,
  });
const heart = () => screen.getByRole("button", { name: /^Like$/ });
const likersBtn = () => screen.getByRole("button", { name: /^Show likers/ });
const commentBtn = () => screen.getByRole("button", { name: /comment/i });
const shareBtn = () => screen.getByRole("button", { name: /share/i });

describe("FU-1: the heart that opens the likers panel is its opener", () => {
  it("closing the panel from inside returns focus to the heart (the heart never took focus)", () => {
    render(inline());
    // fireEvent.click never focuses the button: focus stays on <body>, as in Safari.
    fireEvent.click(heart());
    expect(document.activeElement).toBe(document.body);
    const hide = screen.getByRole("button", { name: "Hide" });
    hide.focus();
    fireEvent.click(hide);
    // The button is now "Unlike" (liked).
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /^Unlike$/ }));
  });
});

describe("FU-1: the host's onLike receives the heart's click event", () => {
  it("third argument is the click event, its currentTarget the heart (read inside the handler)", () => {
    let target: EventTarget | null = null;
    let calls = 0;
    render(
      inline({
        onLike: (_id, _next, event) => {
          calls += 1;
          target = event?.currentTarget ?? null;
        },
      }),
    );
    const btn = heart();
    fireEvent.click(btn);
    expect(calls).toBe(1);
    expect(target).toBe(btn);
  });
});

describe("reactions forward the engagement-bar 0.8.0 tap mode", () => {
  it("tapAction primary: one tap reacts with the primary kind, the trigger is named by it", async () => {
    const onReact = vi.fn();
    render(
      inline({
        reactions: {
          kinds: [
            { key: "love", icon: <span>♥</span>, label: "Love" },
            { key: "wow", icon: <span>!</span>, label: "Wow" },
          ],
          viewerReaction: null,
          onReact,
          tapAction: "primary",
        },
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: /^Love/ }));
    await Promise.resolve();
    await Promise.resolve();
    expect(onReact).toHaveBeenCalledWith("p1", "love");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("FU-2: the engagementActions slot gets the inline disclosure", () => {
  it("passes it in inline mode; actions built from it report and open the panels", () => {
    const seen: unknown[] = [];
    render(
      inline({
        engagementActions: (post, handlers, variant, disclosure) => {
          seen.push(disclosure);
          return defaultPostEngagementActions(post, handlers, variant, undefined, undefined, disclosure);
        },
      }),
    );
    expect(seen.at(-1)).toMatchObject({ open: "none", shareOpens: true });
    expect(commentBtn().getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(commentBtn());
    expect(commentBtn().getAttribute("aria-expanded")).toBe("true");
    // The likers panel opens from the count through `disclosure.likes` (no count handler passed).
    fireEvent.click(likersBtn());
    expect(likersBtn().getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("Likes")).toBeTruthy();
  });

  it("navigate mode: the fourth argument is undefined", () => {
    const seen: unknown[] = [];
    render(
      card({
        engagementMode: "navigate",
        engagementActions: (post, handlers, variant, disclosure) => {
          seen.push(disclosure);
          return defaultPostEngagementActions(post, handlers, variant);
        },
      }),
    );
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every((d) => d === undefined)).toBe(true);
  });
});

describe("forwarded likers / share options (engagement-bar 0.8.0)", () => {
  it("likersStripProps.getProfileHref turns a liker into a link named by the full name", () => {
    render(inline({ likersStripProps: { getProfileHref: (p) => `/u/${p.id}` } }));
    fireEvent.click(likersBtn());
    const link = screen.getByRole("link", { name: /Ayşe Kaya/ });
    expect(link.getAttribute("href")).toBe("/u/a");
  });

  it("without send state a pick closes the share panel", () => {
    const onShareTo = vi.fn();
    render(inline({ onShareTo }));
    fireEvent.click(shareBtn());
    fireEvent.click(screen.getByRole("button", { name: /Bora Demir/ }));
    expect(onShareTo).toHaveBeenCalledWith("p1", expect.objectContaining({ id: "b" }));
    expect(screen.queryByRole("button", { name: /Bora Demir/ })).toBeNull();
  });

  it("with shareMenuProps send state the panel stays open and the header renders", () => {
    const onShareTo = vi.fn();
    render(
      inline({
        onShareTo,
        shareMenuProps: { sentIds: [], header: <button type="button">Copy link</button> },
      }),
    );
    fireEvent.click(shareBtn());
    expect(screen.getByRole("button", { name: "Copy link" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Bora Demir/ }));
    expect(onShareTo).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /Bora Demir/ })).toBeTruthy();
  });
});

describe("the inline thread scrolls in a focusable named region", () => {
  it("region, tabIndex 0, the comments heading as its name, capped height", () => {
    render(inline({ inlineCommentsMaxHeight: "10rem" }));
    fireEvent.click(commentBtn());
    const region = screen.getByRole("region", { name: "Comments" });
    expect(region.getAttribute("tabindex")).toBe("0");
    expect(region.style.maxHeight).toBe("10rem");
    expect(region.contains(screen.getByTestId("thread-input"))).toBe(true);
  });

  it("commentLabels.commentsRegion names it", () => {
    render(inline({ labels: { commentLabels: { commentsRegion: "Yorumlar" } } }));
    fireEvent.click(commentBtn());
    expect(screen.getByRole("region", { name: "Yorumlar" })).toBeTruthy();
  });
});
