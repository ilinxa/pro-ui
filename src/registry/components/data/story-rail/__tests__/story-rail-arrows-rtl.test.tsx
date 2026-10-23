/**
 * Arrows, scroll-aware fades, RTL, Add-tile labels, scrollTo offset, SSR.
 * Invariants I7-I11 and regressions R1, R3, R6.
 *
 * Embla is replaced by a controllable fake exposing exactly the surface
 * story-rail.tsx calls: on / off / scrollSnapList / scrollProgress /
 * slidesInView / scrollTo / scrollNext / scrollPrev.
 */
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { StoryRail } from "../story-rail";
import { AddStoryThumbnail } from "../parts/add-story-thumbnail";
import type { StoryRailHandle, StoryRailItem } from "../types";

interface FakeApi {
  snaps: number;
  progress: number;
  inView: number[];
  handlers: Record<string, Array<() => void>>;
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  scrollSnapList: ReturnType<typeof vi.fn>;
  scrollProgress: ReturnType<typeof vi.fn>;
  slidesInView: ReturnType<typeof vi.fn>;
  scrollTo: ReturnType<typeof vi.fn>;
  scrollNext: ReturnType<typeof vi.fn>;
  scrollPrev: ReturnType<typeof vi.fn>;
  slideNodes: ReturnType<typeof vi.fn>;
}

const h = vi.hoisted(() => ({
  api: null as unknown,
  options: [] as Array<Record<string, unknown>>,
}));

vi.mock("embla-carousel-react", () => ({
  default: (options: Record<string, unknown>) => {
    h.options.push(options);
    return [() => {}, h.api];
  },
}));

function makeApi(init: Partial<Pick<FakeApi, "snaps" | "progress" | "inView">> = {}): FakeApi {
  const api: FakeApi = {
    snaps: 6,
    progress: 0,
    inView: [0, 1, 2],
    ...init,
    handlers: {},
    on: vi.fn((evt: string, fn: () => void) => {
      (api.handlers[evt] ??= []).push(fn);
      return api;
    }),
    off: vi.fn((evt: string, fn: () => void) => {
      api.handlers[evt] = (api.handlers[evt] ?? []).filter((f) => f !== fn);
      return api;
    }),
    scrollSnapList: vi.fn(() => Array.from({ length: api.snaps }, (_, i) => i)),
    scrollProgress: vi.fn(() => api.progress),
    slidesInView: vi.fn(() => api.inView),
    scrollTo: vi.fn(),
    scrollNext: vi.fn(),
    scrollPrev: vi.fn(),
    // Real Embla returns the slide wrappers (children of the scroll container).
    slideNodes: vi.fn(() => Array.from(document.querySelectorAll(".flex.gap-3 > div"))),
  };
  return api;
}

/** Change fake state, then fire the registered scroll + select handlers. */
function emit(api: FakeApi, patch: Partial<Pick<FakeApi, "snaps" | "progress" | "inView">>) {
  Object.assign(api, patch);
  act(() => {
    for (const evt of ["scroll", "select"]) for (const fn of [...(api.handlers[evt] ?? [])]) fn();
  });
}

const originalMatchMedia = window.matchMedia;
function mockMedia(flags: { fine?: boolean; reduced?: boolean }) {
  window.matchMedia = ((query: string) => ({
    matches: query.includes("pointer: fine")
      ? !!flags.fine
      : query.includes("prefers-reduced-motion")
        ? !!flags.reduced
        : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

let api: FakeApi;
beforeEach(() => {
  api = makeApi();
  h.api = api;
  h.options.length = 0;
  mockMedia({});
});
afterEach(() => {
  window.matchMedia = originalMatchMedia;
  h.api = null;
});

const ITEMS: StoryRailItem[] = [
  { id: "a", username: "ada", hasUnread: true },
  { id: "b", username: "bob", hasUnread: true },
  { id: "c", username: "cy", hasUnread: false },
];

const prevBtn = () => screen.queryByRole("button", { name: "Previous stories" });
const nextBtn = () => screen.queryByRole("button", { name: "Next stories" });
const fade = (c: HTMLElement, side: "start" | "end") =>
  c.querySelector(`[data-slot="story-rail-fade-${side}"]`)!;
const lastOptions = () => h.options[h.options.length - 1];

describe("I7: arrows", () => {
  it("I7: absent by default, even with overflow", () => {
    render(<StoryRail defaultItems={ITEMS} />);
    expect(prevBtn()).toBeNull();
    expect(nextBtn()).toBeNull();
  });

  it("I7: arrows='always' at progress 0 shows only 'next'", () => {
    render(<StoryRail defaultItems={ITEMS} arrows="always" />);
    expect(prevBtn()).toBeNull();
    expect(nextBtn()).not.toBeNull();
  });

  it("I7: mid-scroll shows both; at the end only 'previous'", () => {
    render(<StoryRail defaultItems={ITEMS} arrows="always" />);
    emit(api, { progress: 0.5 });
    expect(prevBtn()).not.toBeNull();
    expect(nextBtn()).not.toBeNull();
    emit(api, { progress: 1 });
    expect(prevBtn()).not.toBeNull();
    expect(nextBtn()).toBeNull();
  });

  it("I7: accessible names come from labels.previousLabel / nextLabel", () => {
    render(
      <StoryRail
        defaultItems={ITEMS}
        arrows="always"
        labels={{ previousLabel: "Onceki", nextLabel: "Sonraki" }}
      />,
    );
    emit(api, { progress: 0.5 });
    expect(screen.getByRole("button", { name: "Onceki" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sonraki" })).toBeInTheDocument();
    expect(prevBtn()).toBeNull();
  });

  it("I7: next scrolls one page: api.scrollTo(first + span, false)", () => {
    render(<StoryRail defaultItems={ITEMS} arrows="always" />);
    // inView [0,1,2] -> first 0, span 2 -> target slide 2
    fireEvent.click(nextBtn()!);
    expect(api.scrollTo).toHaveBeenCalledTimes(1);
    expect(api.scrollTo).toHaveBeenCalledWith(2, false);
  });

  it("I7: previous scrolls one page back: api.scrollTo(first - span, false)", () => {
    render(<StoryRail defaultItems={ITEMS} arrows="always" />);
    emit(api, { progress: 0.6, inView: [3, 4, 5] });
    fireEvent.click(prevBtn()!);
    expect(api.scrollTo).toHaveBeenCalledWith(1, false);
  });

  it("I7: next past the end clamps to the last snap", () => {
    render(<StoryRail defaultItems={ITEMS} arrows="always" />);
    emit(api, { progress: 0.5, inView: [3, 4, 5] });
    fireEvent.click(nextBtn()!);
    expect(api.scrollTo).toHaveBeenCalledWith(5, false);
  });

  it("I7: with prefers-reduced-motion the jump flag is true", () => {
    mockMedia({ reduced: true });
    render(<StoryRail defaultItems={ITEMS} arrows="always" />);
    fireEvent.click(nextBtn()!);
    expect(api.scrollTo).toHaveBeenCalledWith(2, true);
  });

  it("I7: with nothing in view, next falls back to api.scrollNext(jump)", () => {
    render(<StoryRail defaultItems={ITEMS} arrows="always" />);
    emit(api, { inView: [] });
    fireEvent.click(nextBtn()!);
    expect(api.scrollNext).toHaveBeenCalledWith(false);
    expect(api.scrollTo).not.toHaveBeenCalled();
  });

  it("I7: focus moves to the surviving arrow when the focused one unmounts at the end", () => {
    render(<StoryRail defaultItems={ITEMS} arrows="always" />);
    emit(api, { progress: 0.5 });
    nextBtn()!.focus();
    expect(document.activeElement).toBe(nextBtn());
    emit(api, { progress: 1 });
    expect(nextBtn()).toBeNull();
    expect(document.activeElement).toBe(prevBtn());
  });

  it("I7: arrows='fine-pointer' with a coarse pointer renders none", () => {
    mockMedia({ fine: false });
    render(<StoryRail defaultItems={ITEMS} arrows="fine-pointer" />);
    expect(prevBtn()).toBeNull();
    expect(nextBtn()).toBeNull();
  });

  it("I7: arrows='fine-pointer' with a fine pointer renders them", () => {
    mockMedia({ fine: true });
    render(<StoryRail defaultItems={ITEMS} arrows="fine-pointer" />);
    expect(nextBtn()).not.toBeNull();
  });

  it("I7: no overflow -> no arrows and both fades hidden", () => {
    api = makeApi({ snaps: 1 });
    h.api = api;
    const { container } = render(<StoryRail defaultItems={ITEMS} arrows="always" />);
    expect(prevBtn()).toBeNull();
    expect(nextBtn()).toBeNull();
    expect(fade(container, "start")).toHaveAttribute("data-visible", "false");
    expect(fade(container, "end")).toHaveAttribute("data-visible", "false");
  });

  it("I7: fades follow scroll position (start hidden at rest, end hidden at the end)", () => {
    const { container } = render(<StoryRail defaultItems={ITEMS} />);
    expect(fade(container, "start")).toHaveAttribute("data-visible", "false");
    expect(fade(container, "end")).toHaveAttribute("data-visible", "true");
    emit(api, { progress: 0.5 });
    expect(fade(container, "start")).toHaveAttribute("data-visible", "true");
    expect(fade(container, "end")).toHaveAttribute("data-visible", "true");
    emit(api, { progress: 1 });
    expect(fade(container, "start")).toHaveAttribute("data-visible", "true");
    expect(fade(container, "end")).toHaveAttribute("data-visible", "false");
  });

  it("I7: unsubscribes its Embla listeners on unmount", () => {
    const { unmount } = render(<StoryRail defaultItems={ITEMS} />);
    expect(api.on).toHaveBeenCalled();
    unmount();
    expect(api.off.mock.calls.length).toBe(api.on.mock.calls.length);
    expect(Object.values(api.handlers).every((l) => l.length === 0)).toBe(true);
  });
});

describe("I11: first render matches the server render", () => {
  it("I11: before Embla exists, start fade hidden and end fade shown", () => {
    h.api = null;
    const { container } = render(<StoryRail defaultItems={ITEMS} />);
    expect(fade(container, "start")).toHaveAttribute("data-visible", "false");
    expect(fade(container, "end")).toHaveAttribute("data-visible", "true");
  });

  it("I11: renderToString with arrows='fine-pointer' contains no arrow buttons (even on a fine-pointer client)", () => {
    mockMedia({ fine: true });
    const html = renderToString(<StoryRail defaultItems={ITEMS} arrows="fine-pointer" />);
    expect(html).toContain("ada, unread story");
    expect(html).not.toContain("Previous stories");
    expect(html).not.toContain("Next stories");
    expect(html).toContain('data-slot="story-rail-fade-start"');
    expect(html).toMatch(/data-slot="story-rail-fade-start"[^>]*data-visible="false"/);
    expect(html).toMatch(/data-slot="story-rail-fade-end"[^>]*data-visible="true"/);
  });
});

describe("I8: direction", () => {
  it("I8: dir='rtl' prop -> Embla direction rtl and <section dir='rtl'>", () => {
    render(<StoryRail defaultItems={ITEMS} dir="rtl" />);
    expect(lastOptions()).toMatchObject({ direction: "rtl" });
    expect(screen.getByRole("region", { name: "Stories" })).toHaveAttribute("dir", "rtl");
  });

  it("I8: default -> direction ltr and no dir attribute", () => {
    render(<StoryRail defaultItems={ITEMS} />);
    expect(lastOptions()).toMatchObject({ direction: "ltr" });
    expect(screen.getByRole("region", { name: "Stories" })).not.toHaveAttribute("dir");
  });

  it("I8: no prop but an ancestor [dir=rtl] -> Embla direction rtl; the section itself gets no dir", async () => {
    render(
      <div dir="rtl">
        <StoryRail defaultItems={ITEMS} />
      </div>,
    );
    await waitFor(() => expect(lastOptions()).toMatchObject({ direction: "rtl" }));
    expect(screen.getByRole("region", { name: "Stories" })).not.toHaveAttribute("dir");
  });

  it("I8: the dir prop wins over an ancestor", async () => {
    render(
      <div dir="rtl">
        <StoryRail defaultItems={ITEMS} dir="ltr" />
      </div>,
    );
    expect(lastOptions()).toMatchObject({ direction: "ltr" });
    expect(screen.getByRole("region", { name: "Stories" })).toHaveAttribute("dir", "ltr");
  });

  it("I8: edge fades and the next arrow use logical placement; arrow chevrons mirror", () => {
    const { container } = render(<StoryRail defaultItems={ITEMS} arrows="always" dir="rtl" />);
    expect(fade(container, "start").className).toContain("start-0");
    expect(fade(container, "start").className).toContain("rtl:bg-linear-to-l");
    expect(fade(container, "end").className).toContain("end-0");
    expect(nextBtn()!.className).toContain("end-1");
    expect(nextBtn()!.querySelector("svg")!.getAttribute("class")).toContain("rtl:-scale-x-100");
  });
});

describe("I9 / R1: Add tile labels", () => {
  it("R1/I9: rail labels reach <AddStoryThumbnail/> in `leading` (text and accessible name, no English)", () => {
    render(
      <StoryRail
        defaultItems={ITEMS}
        labels={{ addStoryLabel: "Hikaye ekle", addStoryAriaLabel: "Yeni hikaye ekle" }}
        leading={<AddStoryThumbnail />}
      />,
    );
    const btn = screen.getByRole("button", { name: "Yeni hikaye ekle" });
    expect(btn).toHaveTextContent("Hikaye ekle");
    expect(screen.queryByText("Add story")).toBeNull();
    expect(screen.queryByRole("button", { name: "Add story" })).toBeNull();
  });

  it("I9: the tile's own label / ariaLabel props win over the rail labels", () => {
    render(
      <StoryRail
        defaultItems={ITEMS}
        labels={{ addStoryLabel: "Hikaye ekle", addStoryAriaLabel: "Yeni hikaye ekle" }}
        leading={<AddStoryThumbnail label="Mine" ariaLabel="Create mine" />}
      />,
    );
    const btn = screen.getByRole("button", { name: "Create mine" });
    expect(btn).toHaveTextContent("Mine");
    expect(screen.queryByText("Hikaye ekle")).toBeNull();
  });

  it("I9: standalone (no rail) uses the English defaults", () => {
    render(<AddStoryThumbnail />);
    const btn = screen.getByRole("button", { name: "Add story" });
    expect(btn).toHaveTextContent("Add story");
  });

  it("I9: inside a rail with no label overrides it still shows the English defaults", () => {
    render(<StoryRail defaultItems={ITEMS} leading={<AddStoryThumbnail />} />);
    expect(screen.getByRole("button", { name: "Add story" })).toHaveTextContent("Add story");
  });
});

describe("I10 / R3: handle.scrollTo offsets for `leading`", () => {
  it("R3/I10: with leading, scrollTo(2) targets slide 3", () => {
    const ref = createRef<StoryRailHandle>();
    render(<StoryRail ref={ref} defaultItems={ITEMS} leading={<AddStoryThumbnail />} />);
    act(() => ref.current!.scrollTo(2));
    expect(api.scrollTo).toHaveBeenCalledWith(3, false);
  });

  it("R3/I10: without leading, scrollTo(2) targets slide 2", () => {
    const ref = createRef<StoryRailHandle>();
    render(<StoryRail ref={ref} defaultItems={ITEMS} />);
    act(() => ref.current!.scrollTo(2));
    expect(api.scrollTo).toHaveBeenCalledWith(2, false);
  });

  it("I10: an index past the end clamps to the last snap", () => {
    const ref = createRef<StoryRailHandle>();
    render(<StoryRail ref={ref} defaultItems={ITEMS} leading={<AddStoryThumbnail />} />);
    act(() => ref.current!.scrollTo(99));
    expect(api.scrollTo).toHaveBeenCalledWith(api.snaps - 1, false);
  });

  it("I10: a negative index clamps to 0", () => {
    const ref = createRef<StoryRailHandle>();
    render(<StoryRail ref={ref} defaultItems={ITEMS} />);
    act(() => ref.current!.scrollTo(-4));
    expect(api.scrollTo).toHaveBeenCalledWith(0, false);
  });

  it("I10: scrollTo honours reduced motion (jump = true)", () => {
    mockMedia({ reduced: true });
    const ref = createRef<StoryRailHandle>();
    render(<StoryRail ref={ref} defaultItems={ITEMS} />);
    act(() => ref.current!.scrollTo(1));
    expect(api.scrollTo).toHaveBeenCalledWith(1, true);
  });
});

describe("R6: Add tile keyboard focus", () => {
  it("R6: the Add tile button has a focus-visible ring", () => {
    render(<AddStoryThumbnail />);
    const cls = screen.getByRole("button", { name: "Add story" }).className;
    expect(cls).toContain("focus-visible:ring-2");
    expect(cls).toContain("focus-visible:ring-ring");
  });

  it("R6: the Add tile is reachable and activatable (click calls onClick)", () => {
    const onClick = vi.fn();
    render(<AddStoryThumbnail onClick={onClick} />);
    const btn = screen.getByRole("button", { name: "Add story" });
    btn.focus();
    expect(document.activeElement).toBe(btn);
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("U4 review regressions: arrows, focus, direction", () => {
  it("F-F: an unrelated commit between two controlled mutations does not drop the first", () => {
    const onItemsChange = vi.fn();
    const ref = createRef<StoryRailHandle>();
    render(<StoryRail ref={ref} items={ITEMS} onItemsChange={onItemsChange} />);
    act(() => ref.current!.markViewed("a")); // host has not re-rendered yet
    emit(api, { progress: 0.5 }); // unrelated rail commit (fade state flips)
    act(() => ref.current!.markViewed("b"));
    expect(onItemsChange).toHaveBeenCalledTimes(2);
    const second = onItemsChange.mock.calls[1][0] as StoryRailItem[];
    expect(second.find((i) => i.id === "a")?.hasUnread).toBe(false);
    expect(second.find((i) => i.id === "b")?.hasUnread).toBe(false);
  });

  it("F-J: when BOTH arrows disappear while one is focused, focus lands on the first tile", () => {
    render(<StoryRail defaultItems={ITEMS} arrows="always" />);
    nextBtn()!.focus();
    expect(document.activeElement).toBe(nextBtn());
    emit(api, { snaps: 1 });
    expect(nextBtn()).toBeNull();
    expect(prevBtn()).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "ada, unread story" }));
  });

  it("F-K: tab order is previous arrow, tiles, next arrow", () => {
    render(<StoryRail defaultItems={ITEMS} arrows="always" />);
    emit(api, { progress: 0.5 });
    const order = within(screen.getByRole("region", { name: "Stories" }))
      .getAllByRole("button")
      .map((b) => b.getAttribute("aria-label"));
    expect(order).toEqual([
      "Previous stories",
      "ada, unread story",
      "bob, unread story",
      "cy, viewed",
      "Next stories",
    ]);
  });

  it("F-L: an intermediate dir='auto' does not hide an rtl ancestor", async () => {
    render(
      <div dir="rtl">
        <div dir="auto">
          <StoryRail defaultItems={ITEMS} />
        </div>
      </div>,
    );
    await waitFor(() => expect(lastOptions()).toMatchObject({ direction: "rtl" }));
  });

  it("F-L: an explicit dir='ltr' inside an rtl ancestor stays ltr", () => {
    render(
      <div dir="rtl">
        <div dir="ltr">
          <StoryRail defaultItems={ITEMS} />
        </div>
      </div>,
    );
    expect(lastOptions()).toMatchObject({ direction: "ltr" });
    expect(h.options.some((o) => o.direction === "rtl")).toBe(false);
  });

  it("F-M: progress 0.0005 is treated as the start (no previous arrow)", () => {
    render(<StoryRail defaultItems={ITEMS} arrows="always" />);
    emit(api, { progress: 0.0005 });
    expect(prevBtn()).toBeNull();
  });

  it("F-M: progress 0.002 shows the previous arrow", () => {
    render(<StoryRail defaultItems={ITEMS} arrows="always" />);
    emit(api, { progress: 0.002 });
    expect(prevBtn()).not.toBeNull();
  });
});
