/**
 * Data modes of StoryRail (v0.4.0): legacy `items`, uncontrolled
 * `defaultItems`, controlled `items` + `onItemsChange`. Invariants I1-I3, R2.
 */
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { StoryRail } from "../story-rail";
import type {
  StoryRailDelta,
  StoryRailHandle,
  StoryRailItem,
  Subscribe,
} from "../types";

// Embla needs layout jsdom lacks; the data modes never touch it.
vi.mock("embla-carousel-react", () => ({
  default: () => [() => {}, null],
}));

const ADA: StoryRailItem = { id: "a", username: "ada", hasUnread: true };
const BOB: StoryRailItem = { id: "b", username: "bob", hasUnread: true };
const CY: StoryRailItem = { id: "c", username: "cy", hasUnread: false };

const tile = (name: string) => screen.getByRole("button", { name });
const names = () =>
  screen
    .getAllByRole("button")
    .map((b) => b.getAttribute("aria-label"))
    .filter(Boolean);

let warn: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  warn.mockRestore();
});

const storyRailWarnings = () =>
  warn.mock.calls.filter((c: unknown[]) => String(c[0]).includes("[story-rail]"));

describe("I1: legacy `items` without `onItemsChange`", () => {
  it("I1: reads items once; a later new array is ignored", () => {
    const { rerender } = render(<StoryRail items={[ADA]} />);
    expect(names()).toEqual(["ada, unread story"]);
    rerender(<StoryRail items={[ADA, BOB]} />);
    expect(names()).toEqual(["ada, unread story"]);
  });

  it("I1: markViewed still mutates the DOM", () => {
    const ref = createRef<StoryRailHandle>();
    render(<StoryRail ref={ref} items={[ADA, BOB]} />);
    act(() => ref.current!.markViewed("a"));
    expect(tile("ada, viewed")).toBeInTheDocument();
    expect(tile("bob, unread story")).toBeInTheDocument();
  });

  it("I1: reset and dispatch still mutate the DOM", () => {
    const ref = createRef<StoryRailHandle>();
    render(<StoryRail ref={ref} items={[ADA]} />);
    act(() => ref.current!.dispatch({ kind: "add", item: BOB, position: "end" }));
    expect(names()).toEqual(["ada, unread story", "bob, unread story"]);
    act(() => ref.current!.reset([CY]));
    expect(names()).toEqual(["cy, viewed"]);
  });

  it("I1: realtime deltas still mutate the DOM", () => {
    let push: (d: StoryRailDelta) => void = () => {};
    const subscribe: Subscribe<StoryRailDelta> = (h) => {
      push = h;
      return () => {};
    };
    render(<StoryRail items={[ADA]} subscribe={subscribe} />);
    act(() => push({ kind: "added", item: BOB }));
    expect(names()).toEqual(["bob, unread story", "ada, unread story"]);
  });

  it("I1: console.warn fires exactly once per mount, naming the migration path", () => {
    const { rerender } = render(<StoryRail items={[ADA]} />);
    rerender(<StoryRail items={[ADA, BOB]} />);
    rerender(<StoryRail items={[ADA]} />);
    const calls = storyRailWarnings();
    expect(calls).toHaveLength(1);
    expect(String(calls[0][0])).toContain("defaultItems");
    expect(String(calls[0][0])).toContain("onItemsChange");
  });

  it("I1: a second mount warns again (per mount, not per module)", () => {
    const first = render(<StoryRail items={[ADA]} />);
    first.unmount();
    render(<StoryRail items={[ADA]} />);
    expect(storyRailWarnings()).toHaveLength(2);
  });
});

describe("I2: `defaultItems`", () => {
  it("I2: seeds once and ignores later prop changes", () => {
    const { rerender } = render(<StoryRail defaultItems={[ADA]} />);
    rerender(<StoryRail defaultItems={[ADA, BOB]} />);
    expect(names()).toEqual(["ada, unread story"]);
  });

  it("I2: markViewed / reset / dispatch mutate the DOM", () => {
    const ref = createRef<StoryRailHandle>();
    render(<StoryRail ref={ref} defaultItems={[ADA, BOB]} />);
    act(() => ref.current!.markViewed("b"));
    expect(tile("bob, viewed")).toBeInTheDocument();
    act(() => ref.current!.dispatch({ kind: "remove", itemId: "a" }));
    expect(names()).toEqual(["bob, viewed"]);
    act(() => ref.current!.reset([CY, ADA]));
    expect(names()).toEqual(["cy, viewed", "ada, unread story"]);
    expect(ref.current!.getCurrentItems().map((i) => i.id)).toEqual(["c", "a"]);
  });

  it("I2: emits NO warning", () => {
    render(<StoryRail defaultItems={[ADA]} />);
    expect(storyRailWarnings()).toHaveLength(0);
  });

  it("I2: controlled mode (items + onItemsChange) emits NO warning either", () => {
    render(<StoryRail items={[ADA]} onItemsChange={() => {}} />);
    expect(storyRailWarnings()).toHaveLength(0);
  });
});

describe("I3 / R2: controlled `items` + `onItemsChange`", () => {
  it("I3: a new array updates the DOM without remounting (same tile node survives)", () => {
    const onItemsChange = vi.fn();
    const { rerender } = render(<StoryRail items={[ADA, BOB]} onItemsChange={onItemsChange} />);
    const adaNode = tile("ada, unread story");
    const bobNode = tile("bob, unread story");

    // hasUnread flipped
    rerender(<StoryRail items={[{ ...ADA, hasUnread: false }, BOB]} onItemsChange={onItemsChange} />);
    expect(tile("ada, viewed")).toBe(adaNode);

    // item added
    rerender(<StoryRail items={[{ ...ADA, hasUnread: false }, BOB, CY]} onItemsChange={onItemsChange} />);
    expect(names()).toEqual(["ada, viewed", "bob, unread story", "cy, viewed"]);
    expect(tile("ada, viewed")).toBe(adaNode);
    expect(tile("bob, unread story")).toBe(bobNode);

    // reordered
    rerender(<StoryRail items={[CY, BOB, { ...ADA, hasUnread: false }]} onItemsChange={onItemsChange} />);
    expect(names()).toEqual(["cy, viewed", "bob, unread story", "ada, viewed"]);
    expect(tile("ada, viewed")).toBe(adaNode);
    expect(tile("bob, unread story")).toBe(bobNode);
    expect(onItemsChange).not.toHaveBeenCalled();
  });

  it("I3: ref.markViewed calls onItemsChange(next) and leaves the DOM unchanged until rerender", () => {
    const onItemsChange = vi.fn();
    const ref = createRef<StoryRailHandle>();
    const items = [ADA, BOB];
    const { rerender } = render(<StoryRail ref={ref} items={items} onItemsChange={onItemsChange} />);
    act(() => ref.current!.markViewed("a"));
    expect(onItemsChange).toHaveBeenCalledTimes(1);
    const next = onItemsChange.mock.calls[0][0] as StoryRailItem[];
    expect(next.map((i) => [i.id, i.hasUnread])).toEqual([["a", false], ["b", true]]);
    expect(items[0].hasUnread).toBe(true); // input not mutated
    expect(tile("ada, unread story")).toBeInTheDocument(); // DOM unchanged
    rerender(<StoryRail ref={ref} items={next} onItemsChange={onItemsChange} />);
    expect(tile("ada, viewed")).toBeInTheDocument();
  });

  it("I3: ref.reset calls onItemsChange(next) and leaves the DOM unchanged", () => {
    const onItemsChange = vi.fn();
    const ref = createRef<StoryRailHandle>();
    render(<StoryRail ref={ref} items={[ADA]} onItemsChange={onItemsChange} />);
    act(() => ref.current!.reset([CY, BOB]));
    expect(onItemsChange).toHaveBeenCalledTimes(1);
    expect((onItemsChange.mock.calls[0][0] as StoryRailItem[]).map((i) => i.id)).toEqual(["c", "b"]);
    expect(names()).toEqual(["ada, unread story"]);
  });

  it("I3: ref.dispatch calls onItemsChange(next) and leaves the DOM unchanged", () => {
    const onItemsChange = vi.fn();
    const ref = createRef<StoryRailHandle>();
    render(<StoryRail ref={ref} items={[ADA]} onItemsChange={onItemsChange} />);
    act(() => ref.current!.dispatch({ kind: "add", item: BOB, position: "end" }));
    expect(onItemsChange).toHaveBeenCalledTimes(1);
    expect((onItemsChange.mock.calls[0][0] as StoryRailItem[]).map((i) => i.id)).toEqual(["a", "b"]);
    expect(names()).toEqual(["ada, unread story"]);
  });

  it("I3: a no-op mutation does not call onItemsChange", () => {
    const onItemsChange = vi.fn();
    const ref = createRef<StoryRailHandle>();
    render(<StoryRail ref={ref} items={[ADA]} onItemsChange={onItemsChange} />);
    act(() => ref.current!.markViewed("nope"));
    expect(onItemsChange).not.toHaveBeenCalled();
  });

  it("I3: two realtime deltas before any rerender both land (second call holds both)", () => {
    const onItemsChange = vi.fn();
    const onSubscribeDelta = vi.fn();
    let push: (d: StoryRailDelta) => void = () => {};
    const subscribe: Subscribe<StoryRailDelta> = (h) => {
      push = h;
      return () => {};
    };
    render(
      <StoryRail
        items={[ADA]}
        onItemsChange={onItemsChange}
        subscribe={subscribe}
        onSubscribeDelta={onSubscribeDelta}
      />,
    );
    act(() => {
      push({ kind: "added", item: BOB });
      push({ kind: "viewed", itemId: "a" });
    });
    expect(onSubscribeDelta).toHaveBeenCalledTimes(2);
    expect(onItemsChange).toHaveBeenCalledTimes(2);
    const second = onItemsChange.mock.calls[1][0] as StoryRailItem[];
    expect(second.map((i) => [i.id, i.hasUnread])).toEqual([["b", true], ["a", false]]);
    expect(names()).toEqual(["ada, unread story"]); // DOM still the prop
  });

  it("I3: after a rerender the prop wins again (chain restarts from the prop)", () => {
    const onItemsChange = vi.fn();
    const ref = createRef<StoryRailHandle>();
    const { rerender } = render(<StoryRail ref={ref} items={[ADA]} onItemsChange={onItemsChange} />);
    act(() => ref.current!.dispatch({ kind: "add", item: BOB }));
    // host rejects the change and re-renders with its own list
    rerender(<StoryRail ref={ref} items={[ADA, CY]} onItemsChange={onItemsChange} />);
    act(() => ref.current!.markViewed("a"));
    const next = onItemsChange.mock.calls[1][0] as StoryRailItem[];
    expect(next.map((i) => i.id)).toEqual(["a", "c"]);
    expect(ref.current!.getCurrentItems().map((i) => i.id)).toEqual(["a", "c"]);
  });
});

describe("U4 review regressions: labels, notified-uncontrolled, reject, warnings", () => {
  it("F-A: labels with explicit undefined values do not crash and keep the defaults", () => {
    render(
      <StoryRail
        defaultItems={[ADA]}
        labels={{ thumbnailAriaLabel: undefined, railLabel: undefined, previousLabel: undefined }}
      />,
    );
    expect(screen.getByRole("region", { name: "Stories" })).toBeInTheDocument();
    expect(tile("ada, unread story")).toBeInTheDocument();
  });

  it("F-B: defaultItems + onItemsChange is uncontrolled but notified, with no warning", () => {
    const onItemsChange = vi.fn();
    const ref = createRef<StoryRailHandle>();
    render(<StoryRail ref={ref} defaultItems={[ADA, BOB]} onItemsChange={onItemsChange} />);
    expect(names()).toEqual(["ada, unread story", "bob, unread story"]);
    act(() => ref.current!.markViewed("a"));
    expect(tile("ada, viewed")).toBeInTheDocument(); // DOM updated
    expect(onItemsChange).toHaveBeenCalledTimes(1);
    const next = onItemsChange.mock.calls[0][0] as StoryRailItem[];
    expect(next.map((i) => [i.id, i.hasUnread])).toEqual([["a", false], ["b", true]]);
    expect(storyRailWarnings()).toHaveLength(0);
  });

  it("F-G: a host that rejects a change re-renders with a fresh equal array; the rejected add is gone", () => {
    const onItemsChange = vi.fn();
    const ref = createRef<StoryRailHandle>();
    const { rerender } = render(<StoryRail ref={ref} items={[ADA]} onItemsChange={onItemsChange} />);
    act(() => ref.current!.dispatch({ kind: "add", item: BOB }));
    expect((onItemsChange.mock.calls[0][0] as StoryRailItem[]).map((i) => i.id)).toEqual(["b", "a"]);
    rerender(<StoryRail ref={ref} items={[{ ...ADA }]} onItemsChange={onItemsChange} />);
    act(() => ref.current!.markViewed("a"));
    const next = onItemsChange.mock.calls[1][0] as StoryRailItem[];
    expect(next.map((i) => i.id)).toEqual(["a"]);
  });

  it("F-H: items + defaultItems (no onItemsChange) warns that items is ignored", () => {
    render(<StoryRail items={[ADA]} defaultItems={[BOB]} />);
    const calls = storyRailWarnings();
    expect(calls).toHaveLength(1);
    expect(String(calls[0][0])).toContain("ignored");
    expect(names()).toEqual(["bob, unread story"]);
  });

  it("F-H: items alone warns that it is read once", () => {
    render(<StoryRail items={[ADA]} />);
    const calls = storyRailWarnings();
    expect(calls).toHaveLength(1);
    expect(String(calls[0][0])).toContain("read once");
  });

  it("F-I: renderThumbnail gets showRing=false for muted+unread (isUnread stays raw), true for unread", () => {
    const seen: Record<string, { isUnread: boolean; showRing: boolean }> = {};
    render(
      <StoryRail
        defaultItems={[{ ...ADA, muted: true }, BOB]}
        renderThumbnail={(item, isUnread, helpers) => {
          seen[item.id] = { isUnread, showRing: helpers.showRing };
          return <span>{item.username}</span>;
        }}
      />,
    );
    expect(seen.a).toEqual({ isUnread: true, showRing: false });
    expect(seen.b).toEqual({ isUnread: true, showRing: true });
  });
});
