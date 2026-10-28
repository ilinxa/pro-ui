/**
 * 0.6.1: the inline panels carry disclosure state, and the opener is the clicked control (Safari and
 * macOS Firefox do not focus a clicked button, so `document.activeElement` is <body> there).
 * aria-expanded / aria-controls assertions on the buttons depend on engagement-bar 0.7.0 rendering them.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { expectNoAxeViolations } from "../../../../../../tests/helpers";
import { card, installDomStubs, makePost } from "./support";

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
    shareSuggestions: [],
    ...over,
  });
const likersBtn = () => screen.getByRole("button", { name: /^Show likers/ });
const commentBtn = () => screen.getByRole("button", { name: /comment/i });
const shareBtn = () => screen.getByRole("button", { name: /share/i });

describe("disclosure state on the inline panels (needs engagement-bar 0.7.0 slice)", () => {
  const cases: Array<[string, () => HTMLElement]> = [
    ["comments", commentBtn],
    ["share", shareBtn],
    ["likers", likersBtn],
  ];
  it.each(cases)("%s: expanded flips with the panel; controls names the panel root", (_n, btn) => {
    render(inline());
    expect(btn().getAttribute("aria-expanded")).toBe("false");
    expect(btn().hasAttribute("aria-controls")).toBe(false);
    fireEvent.click(btn());
    expect(btn().getAttribute("aria-expanded")).toBe("true");
    const id = btn().getAttribute("aria-controls");
    expect(id).toBeTruthy();
    const panel = document.getElementById(id!);
    expect(panel).not.toBeNull();
    expect(panel!.closest("article")).not.toBeNull();
    fireEvent.click(btn());
    expect(btn().getAttribute("aria-expanded")).toBe("false");
  });

  it("each panel gets its own id", () => {
    render(inline());
    const ids = new Set<string | null>();
    for (const [, btn] of cases) {
      fireEvent.click(btn());
      ids.add(btn().getAttribute("aria-controls"));
      fireEvent.click(btn());
    }
    expect(ids.size).toBe(3);
  });

  it("navigate mode: no aria-expanded on those buttons", () => {
    render(card({ engagementMode: "navigate", shareSuggestions: [] }));
    expect(commentBtn().hasAttribute("aria-expanded")).toBe(false);
    expect(shareBtn().hasAttribute("aria-expanded")).toBe(false);
  });

  it("axe clean with the comments panel open", async () => {
    const { container } = render(inline());
    fireEvent.click(commentBtn());
    await expectNoAxeViolations(container);
  });
});

describe("opener comes from the event, not activeElement (Safari)", () => {
  // fireEvent.click never focuses the button: focus stays on <body>, as in Safari.
  it.each([
    ["comments", commentBtn],
    ["share", shareBtn],
    ["likers", likersBtn],
  ] as Array<[string, () => HTMLElement]>)("%s: closing from inside the panel returns focus to the opener", (_n, btn) => {
    render(inline());
    expect(document.activeElement).toBe(document.body);
    fireEvent.click(btn());
    expect(document.activeElement).toBe(document.body);
    const opener = btn();
    const panelId = opener.getAttribute("aria-controls");
    const panel = panelId ? document.getElementById(panelId) : document.querySelector("article");
    // Focus moves into the panel (a user tabbing in), then the opener is clicked again to close.
    const inside = panel!.querySelector<HTMLElement>("button, input");
    inside?.focus();
    fireEvent.click(opener);
    expect(document.activeElement).toBe(opener);
  });

  it("a host calling without an event falls back to activeElement (no throw)", () => {
    render(inline());
    const b = commentBtn();
    b.focus();
    fireEvent.click(b);
    fireEvent.click(b);
    expect(document.activeElement).toBe(b);
  });
});
