/**
 * Fix wave 2 (real-browser pass): focus returns from the inline panels (B3), and the actions menu
 * follows the card's direction although it is portaled out of the card (B4).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithContext } from "../../../../../../tests/helpers";
import { card, installDomStubs, makePost } from "./support";

// The thread is replaced by a focusable stand-in: this file tests where focus goes, not the thread.
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
const showLikers = () => screen.getByRole("button", { name: /^Show likers/ });
const hide = () => screen.getByRole("button", { name: "Hide" });

describe("B3 focus returns from the inline panels", () => {
  it("likers panel: clicking Hide returns focus to the 'Show likers' button", async () => {
    const user = userEvent.setup();
    render(inline());
    await user.click(showLikers());
    await user.click(hide());
    expect(screen.queryByRole("button", { name: "Hide" })).toBeNull();
    expect(document.activeElement).toBe(showLikers());
  });

  it("likers panel: Enter on Hide returns focus too", async () => {
    const user = userEvent.setup();
    render(inline());
    await user.click(showLikers());
    hide().focus();
    await user.keyboard("{Enter}");
    expect(document.activeElement).toBe(showLikers());
  });

  it("a click that leaves focus on <body> (Safari) still restores it", async () => {
    const user = userEvent.setup();
    render(inline());
    await user.click(showLikers());
    (document.activeElement as HTMLElement).blur();
    fireEvent.click(hide());
    expect(document.activeElement).toBe(showLikers());
  });

  it("share panel: Hide returns focus to the Share button", async () => {
    const user = userEvent.setup();
    render(inline());
    const share = () => screen.getByRole("button", { name: /^Share/ });
    await user.click(share());
    await user.click(hide());
    expect(document.activeElement).toBe(share());
  });

  it("comments panel toggled closed from the bar while focus is inside it", async () => {
    const user = userEvent.setup();
    render(inline());
    const comment = () => screen.getByRole("button", { name: /^Comment/ });
    await user.click(comment());
    const input = screen.getByTestId("thread-input");
    input.focus();
    expect(document.activeElement).toBe(input);
    fireEvent.click(comment()); // toggled closed without moving focus off the panel
    expect(screen.queryByTestId("thread-input")).toBeNull();
    expect(document.activeElement).toBe(comment());
  });

  it("falls back to the card when nothing opened the panel", async () => {
    const user = userEvent.setup();
    render(inline({ defaultInlinePanel: "likes" }));
    await user.click(hide());
    expect(document.activeElement).toBe(screen.getByRole("article"));
    expect(screen.getByRole("article")).toHaveAttribute("tabindex", "-1");
  });

  it("falls back to the card when the opener is gone", async () => {
    const user = userEvent.setup();
    const { rerender } = render(inline());
    await user.click(showLikers());
    // The like-count button disappears (a custom actions slot without it) while the panel stays open.
    rerender(inline({ engagementActions: () => [{ kind: "comment", count: 1 }] }));
    await user.click(hide());
    expect(document.activeElement).toBe(screen.getByRole("article"));
  });

  it("does not move focus when the panel switches while focus is elsewhere", () => {
    render(inline({ defaultInlinePanel: "likes" }));
    const kebab = screen.getByRole("button", { name: "Post actions" });
    kebab.focus();
    fireEvent.click(screen.getByRole("button", { name: /^Comment/ })); // switches panel, not a close from inside
    expect(document.activeElement).toBe(kebab);
  });
});

describe("B4 the actions menu follows the card's direction", () => {
  it("is dir=rtl and aligned to the start inside a dir=rtl wrapper", async () => {
    const user = userEvent.setup();
    renderWithContext(card(), { dir: "rtl", locale: "ar" });
    await user.click(screen.getByRole("button", { name: "Post actions" }));
    const menu = await screen.findByRole("menu");
    expect(menu).toHaveAttribute("dir", "rtl");
    expect(menu).toHaveAttribute("data-align", "end");
    // floating-ui mirrors "end" for an RTL floating element: the positioned wrapper must carry dir=rtl.
    expect(menu.closest("[data-radix-popper-content-wrapper]")).toHaveAttribute("dir", "rtl");
  });

  it("stays dir=ltr and aligned to the end in LTR", async () => {
    const user = userEvent.setup();
    renderWithContext(card(), { dir: "ltr" });
    await user.click(screen.getByRole("button", { name: "Post actions" }));
    const menu = await screen.findByRole("menu");
    expect(menu).toHaveAttribute("dir", "ltr");
    expect(menu).toHaveAttribute("data-align", "end");
  });
});
