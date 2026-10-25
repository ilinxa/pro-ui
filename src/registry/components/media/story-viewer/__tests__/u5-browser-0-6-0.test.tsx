/**
 * story-viewer 0.6.0 — U5 browser-review fixes.
 *
 *  F1  desktop nav arrows were hidden by the shell's close-button selector
 *  F2  header needs its own top scrim (white-on-bright-photo)
 *  F4  Tab wraps at the dialog level (the focus scope ignores `inert`)
 *  F6  on open, focus lands on the dialog, not the hidden "Previous item" button
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { StoryViewer } from "../story-viewer";
import type { Story } from "../types";

const story: Story = {
  id: "s1",
  userId: "u1",
  username: "s1",
  createdAt: "2026-01-01T00:00:00Z",
  items: [
    { id: "a", type: "image", src: "a.jpg" },
    { id: "b", type: "image", src: "b.jpg" },
  ],
};
const story2: Story = { ...story, id: "s2", userId: "u2", username: "s2" };

const completeDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "complete");
beforeEach(() => {
  Object.defineProperty(HTMLImageElement.prototype, "complete", {
    configurable: true,
    get: () => true,
  });
});
afterEach(() => {
  cleanup();
  if (completeDescriptor) {
    Object.defineProperty(HTMLImageElement.prototype, "complete", completeDescriptor);
  }
});

const viewer = {
  viewerMode: "viewer" as const,
  currentUser: { id: "me", name: "Me" },
  onReport: () => {},
};

/** jsdom has no Tailwind: model the shell's close-button hiding rule as real CSS. */
function injectHidingRule(content: HTMLElement) {
  const sel = hidingSelector(content);
  const style = document.createElement("style");
  style.textContent = `[data-slot="dialog-content"] > ${sel} { display: none; }`;
  document.head.appendChild(style);
  return style;
}

function mount(extra: Record<string, unknown> = {}, stories: Story[] = [story, story2]) {
  render(
    <StoryViewer stories={stories} initialStoryIndex={0} isOpen onClose={vi.fn()} disableStoryTransition {...extra} />,
  );
  return document.querySelector<HTMLElement>('[data-slot="dialog-content"]')!;
}

const TABBABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';
const realTabbables = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLElement>(TABBABLE)).filter(
    (el) =>
      !el.closest("[inert]") &&
      !el.closest('[aria-hidden="true"]') &&
      getComputedStyle(el).display !== "none",
  );

/** The Tailwind arbitrary variant `[&>SEL]:hidden` applied by the shell, as a plain selector. */
function hidingSelector(content: HTMLElement): string {
  const cls = Array.from(content.classList).find((c) => c.startsWith("[&>button.absolute"))!;
  expect(cls).toBeTruthy();
  return cls.replace(/^\[&>/, "").replace(/\]:hidden$/, "");
}

describe("F1 — nav arrows are not swallowed by the close-button hiding rule", () => {
  it("the hiding selector matches the built-in close button but not the nav arrows", () => {
    const content = mount();
    const sel = hidingSelector(content);
    const direct = Array.from(content.children);
    const close = direct.find((c) => c.matches('[data-slot="dialog-close"]'))!;
    expect(close).toBeTruthy();
    expect(close.matches(sel)).toBe(true);
    const arrows = Array.from(content.querySelectorAll("[data-story-nav-arrow]"));
    expect(arrows).toHaveLength(2);
    for (const a of arrows) {
      expect(a.parentElement).toBe(content); // direct absolute children: the original collision
      expect(a.classList.contains("absolute")).toBe(true);
      expect(a.matches(sel)).toBe(false);
      expect(a.className).toContain("md:flex");
    }
  });

  it('navArrowsPlacement="outside" moves the arrows beside the card and lets it overflow', () => {
    let content = mount({ navArrowsPlacement: "inside" });
    let prev = content.querySelector<HTMLElement>('[data-story-nav-arrow="prev"]')!;
    expect(prev.className).toMatch(/(^|\s)start-4(\s|$)/);
    expect(content.className).toContain("overflow-hidden");
    cleanup();
    content = mount({ navArrowsPlacement: "outside" });
    prev = content.querySelector<HTMLElement>('[data-story-nav-arrow="prev"]')!;
    const next = content.querySelector<HTMLElement>('[data-story-nav-arrow="next"]')!;
    expect(prev.className).toContain("-start-16");
    expect(next.className).toContain("-end-16");
    expect(content.className).toContain("overflow-visible");
    expect(prev.matches(hidingSelector(content))).toBe(false);
  });
});

describe("F2 — header top scrim", () => {
  it("exists behind the header controls, never takes pointer events, uses the overlay token", () => {
    const content = mount();
    const scrim = content.querySelector<HTMLElement>("[data-story-header-scrim]")!;
    expect(scrim).toBeTruthy();
    expect(scrim.className).toContain("pointer-events-none");
    expect(scrim.className).toContain("bg-linear-to-b");
    expect(scrim.className).toContain("from-media-overlay");
    expect(scrim.className).toContain("-z-10");
    expect(scrim.getAttribute("aria-hidden")).toBe("true");
    // lives in the header region, i.e. alongside the close button
    const header = scrim.parentElement!;
    expect(header.querySelector('[aria-label="Close"]')).toBeTruthy();
  });
});

describe("F4 — Tab wraps at the dialog level (collapsed rail is inert)", () => {
  it("Tab from the last real control goes to the first; Shift+Tab from the first goes to the last", () => {
    const content = mount(viewer);
    // the built-in close button is the LAST dom tabbable but is CSS-hidden in a browser
    const style = injectHidingRule(content);
    const toggle = document.querySelector<HTMLElement>('[aria-label="Show reactions"]')!;
    const items = realTabbables(content);
    // the rail's buttons are inert, so the heart toggle is the last REAL control
    expect(items[items.length - 1]).toBe(toggle);
    const first = items[0];
    expect(first).not.toBe(toggle);
    act(() => toggle.focus());
    expect(fireEvent.keyDown(toggle, { key: "Tab" })).toBe(false);
    expect(document.activeElement).toBe(first);
    expect(fireEvent.keyDown(first, { key: "Tab", shiftKey: true })).toBe(false);
    expect(document.activeElement).toBe(toggle);
    style.remove();
  });

  it("controls inside the inert rail are never wrap candidates", () => {
    const content = mount(viewer);
    const railButtons = Array.from(
      document.querySelectorAll<HTMLButtonElement>('button[data-slot="button"][data-size="sm"]'),
    );
    expect(railButtons.length).toBeGreaterThan(0);
    expect(railButtons.every((b) => !!b.closest("[inert]"))).toBe(true);
    const toggle = document.querySelector<HTMLElement>('[aria-label="Show reactions"]')!;
    act(() => toggle.focus());
    fireEvent.keyDown(toggle, { key: "Tab" });
    expect(railButtons).not.toContain(document.activeElement as HTMLButtonElement);
    expect(content.contains(document.activeElement)).toBe(true);
  });
});

describe("F6 — initial focus", () => {
  it("lands on the dialog content, not the visually hidden previous-item button", async () => {
    const content = mount();
    expect(content.getAttribute("tabindex")).toBe("-1");
    await waitFor(() => expect(document.activeElement).toBe(content));
    expect(document.activeElement).not.toBe(document.querySelector("[data-story-sr-nav-prev]"));
  });
});
