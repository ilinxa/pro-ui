/**
 * story-viewer 0.5.4 — layers + gestures (reproductions P5–P12).
 *
 *  SV5  layers pause the timer and restore the pre-open paused state (P5, P6)
 *  SV6  Escape closes only the top layer, focus is contained + returned (P7–P9)
 *  SV8  the click that ends a long press is swallowed (P10)
 *  SV9  gestures ignore form controls / layers; the stale click flag clears (P11, P12)
 */
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StoryViewer } from "../story-viewer";
import type { Story, StoryViewerHandle } from "../types";

const item = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  type: "image" as const,
  src: `${id}.jpg`,
  ...extra,
});
const story = (id: string, items: ReturnType<typeof item>[]): Story => ({
  id,
  userId: `u-${id}`,
  username: id,
  items,
  createdAt: "2026-01-01T00:00:00Z",
});

// 0.5.4 ready gate: progress waits for the image to load. jsdom never loads
// images (`complete` is false), so model already-loaded images here — without
// it every "progress didn't move" assertion would pass vacuously.
const completeDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "complete");
beforeEach(() => {
  vi.useFakeTimers();
  Object.defineProperty(HTMLImageElement.prototype, "complete", {
    configurable: true,
    get: () => true,
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  if (completeDescriptor) {
    Object.defineProperty(HTMLImageElement.prototype, "complete", completeDescriptor);
  }
});

function mount(stories: Story[], extra: Record<string, unknown> = {}) {
  const ref = createRef<StoryViewerHandle>();
  const onClose = vi.fn();
  render(
    <StoryViewer
      ref={ref}
      stories={stories}
      isOpen
      initialStoryIndex={0}
      onClose={onClose}
      disableStoryTransition
      {...extra}
    />,
  );
  return { ref, onClose };
}

const viewer = {
  viewerMode: "viewer" as const,
  currentUser: { id: "me", name: "Me" },
  onReport: () => {},
};

const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const isPausedUi = () => !!document.querySelector('[aria-label="Play"]');
const maxProgress = () =>
  Math.max(
    0,
    ...screen
      .queryAllByRole("progressbar")
      .map((p) => Number(p.getAttribute("aria-valuenow"))),
  );
const sheet = (heading: string) =>
  document.querySelector<HTMLElement>(`[role="dialog"][aria-label="${heading}"]`)!;
const sheetOpen = (heading: string) => sheet(heading).getAttribute("aria-hidden") !== "true";
const engagementButtons = () =>
  Array.from(document.querySelectorAll<HTMLButtonElement>('button[data-slot="button"][data-size="sm"]'));
/** like · comment · share (the reaction picker is absent without reactionKinds). */
function openComments() {
  fireEvent.click(document.querySelector('[aria-label="Show reactions"]')!);
  const opener = engagementButtons()[1];
  act(() => opener.focus());
  fireEvent.click(opener);
  return opener;
}
const pauseToggle = () =>
  document.querySelector<HTMLElement>('[aria-label="Pause"], [aria-label="Play"]')!;
const zones = () =>
  Array.from(document.querySelectorAll<HTMLButtonElement>("div[aria-hidden='true'].absolute.inset-0.z-10 > button"));
const pointer = (type: string, target: Element, init: Record<string, unknown> = {}) =>
  fireEvent(
    target,
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      pointerType: "mouse",
      button: 0,
      ...init,
    }),
  );
const escape = () => fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });

const one = [story("A", [item("a1"), item("a2")])];

describe("SV5 — layers pause the timer and restore the pre-open state", () => {
  it("P5 kebab: pauses while open, resumes on close", () => {
    mount(one, viewer);
    fireEvent.click(screen.getByLabelText("Story actions"));
    expect(isPausedUi()).toBe(true);
    const before = maxProgress();
    tick(3000);
    expect(maxProgress()).toBe(before);
    fireEvent.click(document.querySelector('[role="menu"] [aria-label="Close"]')!);
    expect(isPausedUi()).toBe(false);
  });

  it("P5 owner viewers list: pauses while open, resumes on close", () => {
    mount(one, { viewerMode: "owner" });
    fireEvent.click(document.querySelector('button[aria-expanded="false"]')!);
    expect(isPausedUi()).toBe(true);
    const close = screen.getByText("Viewers").parentElement!.querySelector("button")!;
    fireEvent.click(close);
    expect(isPausedUi()).toBe(false);
  });

  it("P5 link drawer: pauses while open, resumes on close", () => {
    mount([story("A", [item("a1", { link: { url: "https://example.com/x" } }), item("a2")])], viewer);
    fireEvent.click(document.querySelector('button[aria-label="Open link"]')!);
    expect(isPausedUi()).toBe(true);
    fireEvent.click(screen.getByLabelText("Close link"));
    expect(isPausedUi()).toBe(false);
  });

  it("P6 a host pause survives opening + closing a sheet", () => {
    const { ref } = mount(one, viewer);
    act(() => ref.current!.setPaused(true));
    expect(isPausedUi()).toBe(true);
    openComments();
    expect(sheetOpen("Comments")).toBe(true);
    fireEvent.click(sheet("Comments").querySelector("[aria-label=\"Close comments\"]")!);
    expect(sheetOpen("Comments")).toBe(false);
    expect(isPausedUi()).toBe(true);
  });
});

describe("SV6 — Escape closes only the top layer; focus is contained", () => {
  it("P7 sheet Escape: sheet closes, viewer stays, draft + focus survive; second Escape closes the viewer", () => {
    const { onClose } = mount(one, viewer);
    const textarea = screen.getByLabelText("Reply to A") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "my draft" } });
    const opener = openComments();
    expect(sheetOpen("Comments")).toBe(true);

    escape();
    expect(onClose).not.toHaveBeenCalled();
    expect(sheetOpen("Comments")).toBe(false);
    expect((screen.getByLabelText("Reply to A") as HTMLTextAreaElement).value).toBe("my draft");
    expect(document.activeElement).toBe(opener);

    escape();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("P8b with a layer open, Space and arrow keys don't toggle or navigate the story behind it", () => {
    mount(one, viewer);
    tick(1000);
    openComments();
    expect(isPausedUi()).toBe(true);
    const target = document.activeElement ?? document.body;
    fireEvent.keyDown(target, { key: " " });
    expect(isPausedUi()).toBe(true);
    fireEvent.keyDown(target, { key: "ArrowRight" });
    tick(10);
    expect(document.querySelector('img[src="a1.jpg"]')).not.toBeNull();
    expect(sheetOpen("Comments")).toBe(true);
  });

  it("P8 kebab Escape closes only the kebab", () => {
    const { onClose } = mount(one, viewer);
    fireEvent.click(screen.getByLabelText("Story actions"));
    expect(document.querySelector('[role="menu"]')).not.toBeNull();
    escape();
    expect(document.querySelector('[role="menu"]')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("P9 everything behind an open sheet is inert; closed sheets are inert; focus moves in and back", () => {
    mount(one, viewer);
    expect(sheet("Comments").hasAttribute("inert")).toBe(true);
    expect(sheet("Share").hasAttribute("inert")).toBe(true);
    expect(pauseToggle().closest("[inert]")).toBeNull();

    const opener = openComments();
    expect(sheet("Comments").hasAttribute("inert")).toBe(false);
    expect(sheet("Comments").closest("[inert]")).toBeNull();
    expect(sheet("Share").hasAttribute("inert")).toBe(true);
    expect(pauseToggle().closest("[inert]")).not.toBeNull();
    expect(screen.getByLabelText("Reply to A").closest("[inert]")).not.toBeNull();
    expect(sheet("Comments").contains(document.activeElement)).toBe(true);

    fireEvent.click(sheet("Comments").querySelector("[aria-label=\"Close comments\"]")!);
    expect(sheet("Comments").hasAttribute("inert")).toBe(true);
    expect(pauseToggle().closest("[inert]")).toBeNull();
    expect(document.activeElement).toBe(opener);
  });
});

describe("SV8 / SV9 — gestures", () => {
  it("P10 releasing a long press on the right zone resumes without advancing", () => {
    const { ref } = mount(one);
    const right = zones()[2];
    pointer("pointerdown", right);
    tick(300);
    expect(isPausedUi()).toBe(true);
    pointer("pointerup", right);
    fireEvent.click(right); // the browser fires this after pointerup
    expect(isPausedUi()).toBe(false);
    expect(ref.current!.getCursor()).toEqual({ storyIndex: 0, itemIndex: 0 });
  });

  it("P11 a drag that starts in the reply input neither swipes nor long-press-pauses", () => {
    mount([...one, story("B", [item("b1")])], { ...viewer, disableStoryTransition: false });
    const input = screen.getByLabelText("Reply to A");
    pointer("pointerdown", input, { clientX: 100, clientY: 100 });
    tick(300);
    expect(isPausedUi()).toBe(false);
    pointer("pointermove", input, { clientX: 180, clientY: 100 });
    expect(document.querySelector(".touch-pan-y")!.className).not.toContain("perspective-distant");
    pointer("pointerup", input, { clientX: 180, clientY: 100 });
  });

  it("P11 control: the same drag from a tap zone does engage the swipe and the long press", () => {
    mount([...one, story("B", [item("b1")])], { ...viewer, disableStoryTransition: false });
    pointer("pointerdown", zones()[1], { clientX: 100, clientY: 100 });
    tick(300);
    expect(isPausedUi()).toBe(true);
    pointer("pointermove", zones()[1], { clientX: 180, clientY: 100 });
    expect(document.querySelector(".touch-pan-y")!.className).toContain("perspective-distant");
  });

  it("P12 a swipe that ends off the zone does not swallow the next real click", () => {
    const { ref } = mount(one, { disableStoryTransition: false });
    pointer("pointerdown", zones()[1], { clientX: 100, clientY: 100 });
    pointer("pointermove", zones()[1], { clientX: 160, clientY: 100 });
    // pointer capture routes the release to the wrapper, not a zone: no click follows
    pointer("pointerup", document.querySelector(".touch-pan-y")!, { clientX: 160, clientY: 100 });
    tick(1000);

    const right = zones()[2];
    pointer("pointerdown", right, { clientX: 300, clientY: 100 });
    pointer("pointerup", right, { clientX: 300, clientY: 100 });
    fireEvent.click(right);
    expect(ref.current!.getCursor()).toEqual({ storyIndex: 0, itemIndex: 1 });
  });
});

// ─── U4 review fixes ─────────────────────────────────────────────────────
const linked = [story("A", [item("a1", { link: { url: "https://example.com/x" } }), item("a2")])];
const linkChip = () => document.querySelector<HTMLElement>('button[aria-label="Open link"]')!;
const viewersChip = () => document.querySelector<HTMLElement>('button[aria-expanded]')!;
const tap = (target: Element) => {
  pointer("pointerdown", target, { clientX: 50, clientY: 50 });
  pointer("pointerup", target, { clientX: 50, clientY: 50 });
  fireEvent.click(target);
};

describe("U4 #3 — a tap that dismisses a non-modal layer only dismisses", () => {
  for (const [name, setup, open] of [
    ["link drawer", () => mount(linked, viewer), () => fireEvent.click(linkChip())],
    ["owner viewers list", () => mount(one, { viewerMode: "owner" }), () => fireEvent.click(viewersChip())],
  ] as const) {
    it(`${name}: tapping the middle zone dismisses without toggling pause`, () => {
      const { ref } = setup();
      open();
      expect(isPausedUi()).toBe(true);
      tap(zones()[1]);
      expect(isPausedUi()).toBe(false);
      expect(ref.current!.getCursor().itemIndex).toBe(0);
    });
    it(`${name}: tapping the right zone dismisses without advancing`, () => {
      const { ref } = setup();
      open();
      tap(zones()[2]);
      expect(isPausedUi()).toBe(false);
      expect(ref.current!.getCursor().itemIndex).toBe(0);
      tap(zones()[2]); // the next tap is a normal tap
      expect(ref.current!.getCursor().itemIndex).toBe(1);
    });
  }
});

describe("U4 #5 — focus returns to the opener for the viewers list and the link drawer", () => {
  it("viewers list", () => {
    mount(one, { viewerMode: "owner" });
    const chip = viewersChip();
    act(() => chip.focus());
    fireEvent.click(chip);
    const close = screen.getByText("Viewers").parentElement!.querySelector("button")!;
    act(() => close.focus());
    fireEvent.click(close);
    expect(document.activeElement).toBe(chip);
  });
  it("link drawer", () => {
    mount(linked, viewer);
    const chip = linkChip();
    act(() => chip.focus());
    fireEvent.click(chip);
    const close = screen.getByLabelText("Close link");
    act(() => close.focus());
    fireEvent.click(close);
    expect(document.activeElement).toBe(chip);
  });
});

describe("U4 #6 — layer order, Escape per layer, inert lifecycle, item change", () => {
  it("(a) Escape closes the most recently opened layer first", () => {
    const { ref, onClose } = mount(one, viewer);
    openComments();
    act(() => ref.current!.openKebab());
    expect(document.querySelector('[role="menu"]')).not.toBeNull();
    escape();
    expect(document.querySelector('[role="menu"]')).toBeNull();
    expect(sheetOpen("Comments")).toBe(true);
    escape();
    expect(sheetOpen("Comments")).toBe(false);
    expect(onClose).not.toHaveBeenCalled();
    escape();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("(b) Escape closes only the viewers list / only the link drawer", () => {
    const owner = mount(one, { viewerMode: "owner" });
    act(() => viewersChip().focus());
    fireEvent.click(viewersChip());
    expect(screen.queryByText("Viewers")).not.toBeNull();
    escape();
    expect(screen.queryByText("Viewers")).toBeNull();
    expect(owner.onClose).not.toHaveBeenCalled();
    cleanup();

    const link = mount(linked, viewer);
    act(() => linkChip().focus());
    fireEvent.click(linkChip());
    expect(linkChip().getAttribute("aria-expanded")).toBe("true");
    escape();
    expect(linkChip().getAttribute("aria-expanded")).toBe("false");
    expect(link.onClose).not.toHaveBeenCalled();
  });

  it("(c) closing the viewer with a sheet open lifts inert; a reopen starts clean", () => {
    const props = { stories: one, initialStoryIndex: 0, onClose: () => {}, disableStoryTransition: true, ...viewer };
    const { rerender } = render(<StoryViewer isOpen {...props} />);
    openComments();
    expect(pauseToggle().closest("[inert]")).not.toBeNull();
    rerender(<StoryViewer isOpen={false} {...props} />);
    expect(document.querySelector("[inert]")).toBeNull();
    rerender(<StoryViewer isOpen {...props} />);
    expect(isPausedUi()).toBe(false);
    expect(sheetOpen("Comments")).toBe(false);
    expect(pauseToggle().closest("[inert]")).toBeNull();
    const inert = Array.from(document.querySelectorAll("[inert]"));
    expect(inert.every((el) => el.getAttribute("data-story-layer") === "sheet")).toBe(true);
  });

  it("(f) a layer open across an item change resumes on the new item", () => {
    const { ref } = mount(one, viewer);
    act(() => ref.current!.setPaused(true));
    fireEvent.click(screen.getByLabelText("Story actions"));
    expect(document.querySelector('[role="menu"]')).not.toBeNull();
    act(() => ref.current!.goToItem(1));
    expect(document.querySelector('[role="menu"]')).toBeNull();
    expect(ref.current!.getCursor().itemIndex).toBe(1);
    expect(isPausedUi()).toBe(false);
  });
});

describe("U4 #10 — the click-swallow flag expires on its own", () => {
  it("a held press that fires no click does not eat a later click", () => {
    const { ref } = mount(one);
    const right = zones()[2];
    pointer("pointerdown", right);
    tick(300);
    pointer("pointerup", right); // long hold on touch: no click follows
    tick(500);
    fireEvent.click(right); // a later keyboard / programmatic click
    expect(ref.current!.getCursor().itemIndex).toBe(1);
  });
});

describe("U5 — Tab wraps inside an open layer; the collapsed reaction rail is not focusable", () => {
  const tabbables = (root: Element) =>
    Array.from(
      root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.closest("[inert]"));

  it("sheet: Tab from the last control wraps to the first, Shift+Tab from the first wraps to the last", () => {
    mount(one, viewer);
    openComments();
    const root = sheet("Comments");
    const items = tabbables(root);
    expect(items.length).toBeGreaterThan(0);
    const first = items[0];
    const last = items[items.length - 1];
    act(() => last.focus());
    // `fireEvent` returns false when the handler called preventDefault: the
    // browser's own Tab (which would leave the layer) is cancelled.
    expect(fireEvent.keyDown(last, { key: "Tab" })).toBe(false);
    expect(document.activeElement).toBe(first);
    expect(fireEvent.keyDown(first, { key: "Tab", shiftKey: true })).toBe(false);
    expect(document.activeElement).toBe(last);
  });

  it("actions menu: Tab from the last item wraps to the first", () => {
    mount(one, viewer);
    fireEvent.click(screen.getByLabelText("Story actions"));
    const menu = document.querySelector<HTMLElement>('[role="menu"]')!;
    const items = tabbables(menu);
    expect(items.length).toBeGreaterThan(1);
    act(() => items[items.length - 1].focus());
    fireEvent.keyDown(items[items.length - 1], { key: "Tab" });
    expect(document.activeElement).toBe(items[0]);
  });

  it("the collapsed reaction rail is inert; expanding it makes its buttons reachable", () => {
    mount(one, viewer);
    const toggle = document.querySelector<HTMLElement>('[aria-label="Show reactions"]')!;
    // Target the rail's own buttons (a closed sheet is also aria-hidden + inert,
    // so a generic `[aria-hidden][inert]` query would match it instead).
    const railButtons = engagementButtons();
    expect(railButtons.length).toBeGreaterThan(0);
    expect(railButtons.every((b) => !!b.closest("[inert]"))).toBe(true);
    expect(railButtons.every((b) => !b.closest("[data-story-layer]"))).toBe(true);
    fireEvent.click(toggle);
    expect(engagementButtons().every((b) => !b.closest("[inert]"))).toBe(true);
  });
});
