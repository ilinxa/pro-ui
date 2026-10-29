/**
 * 0.8.0 U4 fixes: a hover-opened picker leaves focus where it was; primary mode names its picker
 * keys; the ContextMenu key's native menu is swallowed; ShareMenu re-announces a re-sent person and
 * never reads an id; LikersStrip never renders an unnamed tile and takes whole code points for
 * initials.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { EngagementBar } from "../engagement-bar";
import { LikersStrip } from "../parts/likers-strip";
import { ShareMenu } from "../parts/share-menu";
import type { EngagementAction } from "../types";
import { installDomStubs, KINDS } from "./support";

let restore: () => void;
beforeEach(() => {
  restore = installDomStubs();
});
afterEach(() => {
  vi.useRealTimers();
  restore();
});

const reaction = (over: Record<string, unknown> = {}): EngagementAction =>
  ({ kind: "reaction", kinds: KINDS, totalCount: 3, viewerReaction: null, ...over }) as EngagementAction;
const trigger = () => screen.getAllByRole("button").find((b) => b.hasAttribute("aria-pressed"))!;
const picker = () => screen.queryByRole("group", { name: "Pick a reaction" });
const frames = () =>
  act(
    () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );

describe("hover open keeps focus where it was (WCAG 3.2.1)", () => {
  it("a focused input keeps focus while the picker opens on hover", async () => {
    render(
      <>
        <input aria-label="Write" />
        <EngagementBar actions={[reaction({ hoverOpenDelay: 0 })]} />
      </>,
    );
    const input = screen.getByRole("textbox", { name: "Write" });
    input.focus();
    fireEvent.pointerEnter(trigger(), { pointerType: "mouse", pointerId: 1 });
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 10)));
    expect(picker()).not.toBeNull();
    await frames();
    expect(document.activeElement).toBe(input);
    // U5 (browser): handing focus back read as "focus outside" and closed the picker 114 ms later.
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 50)));
    expect(picker()).not.toBeNull();
  });

  it("a keyboard open still moves focus into the picker", async () => {
    render(<EngagementBar actions={[reaction({ tapAction: "primary" })]} />);
    trigger().focus();
    fireEvent.keyDown(trigger(), { key: "ArrowUp" });
    expect(picker()).not.toBeNull();
    await frames();
    expect(picker()!.closest("[data-slot='popover-content']")!.contains(document.activeElement)).toBe(true);
  });
});

describe("primary mode keyboard", () => {
  it("names its picker keys; picker mode does not", () => {
    const { rerender } = render(<EngagementBar actions={[reaction({ tapAction: "primary" })]} />);
    expect(trigger().getAttribute("aria-keyshortcuts")).toBe("ArrowUp Shift+F10");
    rerender(<EngagementBar actions={[reaction()]} />);
    expect(trigger().hasAttribute("aria-keyshortcuts")).toBe(false);
  });

  it("the ContextMenu key swallows the native context menu that follows it", () => {
    render(<EngagementBar actions={[reaction({ tapAction: "primary" })]} />);
    fireEvent.keyDown(trigger(), { key: "ContextMenu" });
    const native = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    document.body.dispatchEvent(native);
    expect(native.defaultPrevented).toBe(true);
    // One-shot: the next context menu is the browser's again.
    const later = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    document.body.dispatchEvent(later);
    expect(later.defaultPrevented).toBe(false);
  });
});

describe("ShareMenu announcements", () => {
  const users = [
    { id: "1", name: "Ada Lovelace" },
    { id: "2", name: "Bob" },
  ];
  const announcer = () => document.querySelector<HTMLElement>("[data-share-announcer]")!;

  it("an id removed and sent again is announced again", () => {
    const { rerender } = render(<ShareMenu users={users} onShareTo={vi.fn()} sentIds={[]} />);
    rerender(<ShareMenu users={users} onShareTo={vi.fn()} sentIds={["1"]} />);
    expect(announcer()).toHaveTextContent("Sent to Ada Lovelace");
    rerender(<ShareMenu users={users} onShareTo={vi.fn()} sentIds={["2"]} />);
    expect(announcer()).toHaveTextContent("Sent to Bob");
    rerender(<ShareMenu users={users} onShareTo={vi.fn()} sentIds={["2", "1"]} />);
    expect(announcer()).toHaveTextContent("Sent to Ada Lovelace");
  });

  it("an id the menu never listed is announced as 'Sent', never by its id", () => {
    const { rerender } = render(<ShareMenu users={users} onShareTo={vi.fn()} sentIds={[]} />);
    rerender(<ShareMenu users={users} onShareTo={vi.fn()} sentIds={["u_8f3a"]} />);
    expect(announcer().textContent).toBe("Sent");
  });
});

describe("LikersStrip names", () => {
  it("a blank name falls back to the username, so a linked tile is named", () => {
    render(
      <LikersStrip
        totalCount={1}
        likers={[{ id: "x", name: "   ", username: "ghost" }]}
        getProfileHref={() => "/u/ghost"}
      />,
    );
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/u/ghost");
    // The name line itself shows the username (not only the "@ghost" line below it).
    expect(screen.getAllByText("ghost", { exact: true }).length).toBeGreaterThan(0);
  });

  it("initials take the first code point of each word", () => {
    render(<LikersStrip totalCount={1} likers={[{ id: "e", name: "𝒜da Lovelace" }]} />);
    expect(screen.getByText("𝒜L")).toBeTruthy();
  });
});
