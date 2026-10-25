/**
 * story-viewer 0.6.0 presentation & a11y features (slice D), part 2.
 *
 *  SV12 caption / item time / locale   renderHeaderBadge   SV13 reduced motion   SV14 card + arrows
 *  SV15 AT item buttons + live region  SV19 RTL            F-03 late inert        F-05 tokens
 */
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StoryViewer } from "../story-viewer";
import type { Story, StoryViewerHandle, StoryViewerProps } from "../types";

const item = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  type: "image" as const,
  src: `${id}.jpg`,
  ...extra,
});
const story = (id: string, itemIds: string[]): Story => ({
  id,
  userId: `u-${id}`,
  username: id,
  items: itemIds.map((i) => item(i)),
  createdAt: "2026-01-01T00:00:00Z",
});

const completeDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "complete");
const realMatchMedia = window.matchMedia;
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
  document.documentElement.removeAttribute("dir");
  window.matchMedia = realMatchMedia;
  if (completeDescriptor) {
    Object.defineProperty(HTMLImageElement.prototype, "complete", completeDescriptor);
  }
});

function reduceMotion(reduce: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduce && query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

function mount(stories: Story[], extra: Partial<StoryViewerProps> = {}) {
  const ref = createRef<StoryViewerHandle>();
  const utils = render(
    <StoryViewer
      ref={ref}
      stories={stories}
      isOpen
      initialStoryIndex={0}
      onClose={() => {}}
      {...extra}
    />,
  );
  return { ref, ...utils };
}

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
const zones = () =>
  Array.from(document.querySelectorAll<HTMLButtonElement>("[data-story-tapzone]"));
const three = () => [story("A", ["a1", "a2"]), story("B", ["b1", "b2"]), story("C", ["c1"])];
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]')!;
const noTransition = { disableStoryTransition: true } as const;

describe("SV12 — caption, item time, locale", () => {
  it("caption is a plain text node with dir=auto (HTML in it is not parsed)", () => {
    const s = story("A", ["a1"]);
    s.items[0] = item("a1", { caption: "<b>bold</b> مرحبا" }) as Story["items"][number];
    mount([s], noTransition);
    const cap = document.querySelector("[data-story-caption] p")!;
    expect(cap.getAttribute("dir")).toBe("auto");
    expect(cap.textContent).toContain("<b>bold</b>");
    expect(cap.querySelector("b")).toBeNull();
  });

  it("the header time uses item.createdAt over story.createdAt", () => {
    vi.setSystemTime(new Date("2026-01-01T03:00:00Z"));
    const s = story("A", ["a1"]);
    s.items[0] = item("a1", { createdAt: "2026-01-01T02:30:00Z" }) as Story["items"][number];
    mount([s], noTransition);
    const expected = new Intl.RelativeTimeFormat("en", { numeric: "auto", style: "short" }).format(
      -30,
      "minute",
    );
    expect(dialog().textContent).toContain(expected);
  });

  it("locale drives the default relative time; invalid falls back to en; labels.formatTime wins", () => {
    vi.setSystemTime(new Date("2026-01-01T00:30:00Z"));
    const fmt = (loc: string) =>
      new Intl.RelativeTimeFormat(loc, { numeric: "auto", style: "short" }).format(-30, "minute");
    expect(fmt("tr")).not.toBe(fmt("en"));
    mount([story("A", ["a1"])], { ...noTransition, locale: "tr" });
    expect(dialog().textContent).toContain(fmt("tr"));
    cleanup();
    mount([story("A", ["a1"])], { ...noTransition, locale: "not a locale!!" });
    expect(dialog().textContent).toContain(fmt("en"));
    cleanup();
    mount([story("A", ["a1"])], {
      ...noTransition,
      locale: "tr",
      labels: { formatTime: () => "CUSTOM-TIME" },
    });
    expect(dialog().textContent).toContain("CUSTOM-TIME");
  });
});

describe("renderHeaderBadge", () => {
  it("renders after the author name and before the time", () => {
    mount([story("A", ["a1"])], {
      ...noTransition,
      renderHeaderBadge: (s: Story) => <span data-testid="badge">verified-{s.id}</span>,
    });
    const badge = screen.getByTestId("badge");
    const name = screen.getByText("A", { selector: "p" });
    const time = name.closest("div")!.parentElement!.querySelector("p.text-xs")!;
    expect(name.compareDocumentPosition(badge) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(badge.compareDocumentPosition(time) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  it("renders nothing extra by default", () => {
    mount([story("A", ["a1"])], noTransition);
    expect(screen.queryByTestId("badge")).toBeNull();
  });
});

describe("SV13 — reduced motion", () => {
  it("no cube structure on a story change (instant swap); the control still animates", () => {
    reduceMotion(false);
    const a = mount(three());
    act(() => a.ref.current!.goToStory(1));
    expect(document.querySelector(".transform-3d")).not.toBeNull();
    cleanup();
    reduceMotion(true);
    const b = mount(three());
    act(() => b.ref.current!.goToStory(1));
    expect(document.querySelector(".transform-3d")).toBeNull();
    expect(b.ref.current!.getCursor().storyIndex).toBe(1);
  });

  it("the swipe preview mounts no neighbour media, and a swipe still navigates on release", () => {
    reduceMotion(false);
    mount(three(), { initialStoryIndex: 1 });
    pointer("pointerdown", zones()[1], { clientX: 200, clientY: 100 });
    pointer("pointermove", zones()[1], { clientX: 120, clientY: 100 });
    expect(document.querySelectorAll("img").length).toBeGreaterThan(1);
    cleanup();

    reduceMotion(true);
    const { ref } = mount(three(), { initialStoryIndex: 1 });
    pointer("pointerdown", zones()[1], { clientX: 200, clientY: 100 });
    pointer("pointermove", zones()[1], { clientX: 120, clientY: 100 });
    expect(document.querySelectorAll("img").length).toBe(1);
    pointer("pointerup", zones()[1], { clientX: 120, clientY: 100 });
    expect(ref.current!.getCursor().storyIndex).toBe(2);
  });

  it("the open-sheet scale carries motion-reduce overrides", () => {
    mount([story("A", ["a1"])], {
      ...noTransition,
      viewerMode: "viewer",
      currentUser: { id: "me", name: "Me" },
    });
    fireEvent.click(document.querySelector('[aria-label="Show reactions"]')!);
    const buttons = Array.from(
      document.querySelectorAll<HTMLButtonElement>('button[data-slot="button"][data-size="sm"]'),
    );
    fireEvent.click(buttons[1]);
    const scaled = document.querySelector(".origin-top")!;
    expect(scaled.className).toContain("motion-reduce:scale-100");
    expect(scaled.className).toContain("motion-reduce:transition-none");
  });
});

describe("SV14 — card size + arrows placement", () => {
  it("the card reads --story-viewer-card-w/-h and never exceeds the window height", () => {
    mount([story("A", ["a1"])], noTransition);
    const cls = dialog().className;
    expect(cls).toContain("md:h-[var(--story-viewer-card-h,700px)]!");
    expect(cls).toContain("md:w-[var(--story-viewer-card-w,400px)]!");
    expect(cls).toContain("md:max-h-[calc(100dvh-2rem)]!");
    expect(cls).toContain("overflow-hidden");
  });
  it("navArrowsPlacement='outside' moves the arrows beside the card (and lets the card overflow)", () => {
    mount(three(), noTransition);
    expect(document.querySelector('[data-story-nav-arrow="prev"]')!.className).toContain("start-4");
    cleanup();
    mount(three(), { ...noTransition, navArrowsPlacement: "outside" });
    expect(document.querySelector('[data-story-nav-arrow="prev"]')!.className).toContain("-start-16");
    expect(document.querySelector('[data-story-nav-arrow="next"]')!.className).toContain("-end-16");
    expect(dialog().className).toContain("overflow-visible");
  });
  it("the chevrons mirror under rtl", () => {
    mount(three(), noTransition);
    expect(
      document.querySelector('[data-story-nav-arrow="prev"] svg')!.getAttribute("class"),
    ).toContain("rtl:-scale-x-100");
  });
});

describe("SV15 — assistive-tech item buttons + position announcement", () => {
  it("labelled previous / next item buttons work and the polite region announces the position", () => {
    const { ref } = mount([story("A", ["a1", "a2", "a3"])], noTransition);
    const region = document.querySelector("[data-story-position]")!;
    expect(region.getAttribute("aria-live")).toBe("polite");
    expect(region.textContent).toBe("A, 1 of 3");
    fireEvent.click(screen.getByRole("button", { name: "Next item" }));
    expect(ref.current!.getCursor().itemIndex).toBe(1);
    expect(region.textContent).toBe("A, 2 of 3");
    fireEvent.click(screen.getByRole("button", { name: "Previous item" }));
    expect(ref.current!.getCursor().itemIndex).toBe(0);
  });
  it("labels override the names and the announcement", () => {
    mount([story("A", ["a1", "a2"])], {
      ...noTransition,
      labels: {
        prevItem: "Onceki",
        nextItem: "Sonraki",
        position: (a: string, i: number, t: number) => `${a} ${i + 1}/${t}`,
      },
    });
    expect(screen.getByRole("button", { name: "Sonraki" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Onceki" })).toBeTruthy();
    expect(document.querySelector("[data-story-position]")!.textContent).toBe("A 1/2");
  });
});

describe("SV19 — RTL", () => {
  const key = (k: string) => fireEvent.keyDown(document.body, { key: k });

  it("ArrowLeft / ArrowRight swap under dir=rtl; LTR is unchanged", () => {
    const ltr = mount([story("A", ["a1", "a2", "a3"])], noTransition);
    key("ArrowRight");
    expect(ltr.ref.current!.getCursor().itemIndex).toBe(1);
    key("ArrowLeft");
    expect(ltr.ref.current!.getCursor().itemIndex).toBe(0);
    cleanup();

    document.documentElement.dir = "rtl";
    const rtl = mount([story("A", ["a1", "a2", "a3"])], noTransition);
    key("ArrowLeft");
    expect(rtl.ref.current!.getCursor().itemIndex).toBe(1);
    key("ArrowRight");
    expect(rtl.ref.current!.getCursor().itemIndex).toBe(0);
  });

  it("swiping left goes to the next story in LTR and the previous one in RTL", () => {
    const ltr = mount(three(), { initialStoryIndex: 1 });
    pointer("pointerdown", zones()[1], { clientX: 200, clientY: 100 });
    pointer("pointermove", zones()[1], { clientX: 120, clientY: 100 });
    pointer("pointerup", zones()[1], { clientX: 120, clientY: 100 });
    act(() => void vi.advanceTimersByTime(500));
    expect(ltr.ref.current!.getCursor().storyIndex).toBe(2);
    cleanup();

    document.documentElement.dir = "rtl";
    const rtl = mount(three(), { initialStoryIndex: 1 });
    pointer("pointerdown", zones()[1], { clientX: 200, clientY: 100 });
    pointer("pointermove", zones()[1], { clientX: 120, clientY: 100 });
    // The LEFT wall (rotateY(-90deg)) holds the NEXT story under RTL.
    const leftWall = document.querySelector('[style*="rotateY(-90deg)"] img');
    expect(leftWall?.getAttribute("src")).toBe("c1.jpg");
    pointer("pointerup", zones()[1], { clientX: 120, clientY: 100 });
    act(() => void vi.advanceTimersByTime(500));
    expect(rtl.ref.current!.getCursor().storyIndex).toBe(0);
  });

  it("the auto cube mirrors: the incoming face enters from the left wall under RTL", () => {
    const incoming = (ref: React.RefObject<StoryViewerHandle | null>) => {
      act(() => ref.current!.goToStory(1));
      return Array.from(document.querySelectorAll<HTMLElement>(".backface-hidden")).map(
        (e) => e.style.transform,
      );
    };
    const a = mount(three());
    expect(incoming(a.ref)).toContain("rotateY(90deg) translateZ(50cqw)");
    cleanup();
    document.documentElement.dir = "rtl";
    const b = mount(three());
    expect(incoming(b.ref)).toContain("rotateY(-90deg) translateZ(50cqw)");
  });
});

describe("F-03 — late-mounting siblings are inert while a sheet is open", () => {
  it("a node added to the dialog while the kebab is open becomes inert", async () => {
    vi.useRealTimers();
    const { ref } = mount([story("A", ["a1"])], {
      ...noTransition,
      viewerMode: "viewer",
      currentUser: { id: "me", name: "Me" },
      onReport: () => {},
    });
    act(() => ref.current!.openKebab());
    expect(document.querySelector('[role="menu"]')).not.toBeNull();
    const late = document.createElement("div");
    await act(async () => {
      dialog().appendChild(late);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(late.hasAttribute("inert")).toBe(true);
  });
});

describe("F-05 — reply pill + tokens", () => {
  it("the reply input carries its own scrim tokens; the liked heart uses a token", () => {
    mount([story("A", ["a1"])], {
      ...noTransition,
      viewerMode: "viewer",
      currentUser: { id: "me", name: "Me" },
    });
    expect(document.querySelector("[class*=\"bg-media-overlay!\"]")).not.toBeNull();
    fireEvent.click(document.querySelector('[aria-label="Show reactions"]')!);
    expect(dialog().innerHTML).not.toContain("text-rose-400");
    expect(dialog().innerHTML).toContain("text-destructive");
  });
});
