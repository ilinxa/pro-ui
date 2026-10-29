/** 0.8.0 (bar slice): reaction tapAction "primary" + hoverOpenDelay (EB-2), size "touch" (EB-4),
 *  toggle event (FU-1), liked-count contrast (FU-6). */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { EngagementBar } from "../engagement-bar";
import type {
  EngagementAction,
  EngagementBarHandle,
  EngagementBarVariant,
} from "../types";
import { installDomStubs, KINDS } from "./support";

let restore: () => void;
beforeEach(() => {
  restore = installDomStubs();
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  restore();
});

const reaction = (over: Record<string, unknown> = {}): EngagementAction =>
  ({ kind: "reaction", kinds: KINDS, totalCount: 9, ...over }) as EngagementAction;
const trigger = () => screen.getAllByRole("button")[0]!;
const picker = () => screen.queryByRole("group", { name: "Pick a reaction" });
const mouse = { pointerType: "mouse", pointerId: 1 };

describe("EB-2 reaction tapAction: primary", () => {
  it("idle tap selects the primary kind (default kinds[0]) and never opens the picker", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const open = vi.fn();
    render(
      <EngagementBar
        actions={[reaction({ tapAction: "primary", viewerReaction: null, onSelect })]}
        onReactionPickerOpenChange={open}
      />,
    );
    await user.click(trigger());
    await act(async () => {});
    expect(onSelect.mock.calls).toEqual([["love"]]);
    expect(picker()).toBeNull();
    expect(open).not.toHaveBeenCalled();
  });

  it("primaryKey picks the kind; keyboard Enter is a tap too", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const open = vi.fn();
    render(
      <EngagementBar
        actions={[reaction({ tapAction: "primary", primaryKey: "wow", viewerReaction: null, onSelect })]}
        onReactionPickerOpenChange={open}
      />,
    );
    trigger().focus();
    await user.keyboard("{Enter}");
    await act(async () => {});
    expect(onSelect.mock.calls).toEqual([["wow"]]);
    expect(open).not.toHaveBeenCalled();
  });

  it("a tap with any reaction set clears it, whatever clearOnTap says", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const open = vi.fn();
    render(
      <EngagementBar
        actions={[
          reaction({ tapAction: "primary", clearOnTap: false, viewerReaction: "wow", onSelect }),
        ]}
        onReactionPickerOpenChange={open}
      />,
    );
    await user.click(trigger());
    await act(async () => {});
    expect(onSelect.mock.calls).toEqual([[null]]);
    expect(picker()).toBeNull();
    expect(open).not.toHaveBeenCalled();
  });

  it("an unknown primaryKey falls back to kinds[0] with ONE development warning", async () => {
    const user = userEvent.setup();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const onSelect = vi.fn();
    const { rerender } = render(
      <EngagementBar
        actions={[reaction({ tapAction: "primary", primaryKey: "nope", viewerReaction: null, onSelect })]}
      />,
    );
    rerender(
      <EngagementBar
        actions={[reaction({ tapAction: "primary", primaryKey: "nope", viewerReaction: null, onSelect })]}
      />,
    );
    await user.click(trigger());
    await act(async () => {});
    expect(onSelect.mock.calls).toEqual([["love"]]);
    expect(warn.mock.calls.filter((c) => String(c[0]).includes("primaryKey"))).toHaveLength(1);
  });

  it("idle: shows the primary kind's icon and is named by its label; set: the viewer's kind", () => {
    const { container, rerender } = render(
      <EngagementBar
        actions={[reaction({ tapAction: "primary", primaryKey: "laugh", viewerReaction: null })]}
      />,
    );
    expect(screen.getByRole("button", { name: /^Laugh/ })).toHaveAttribute("aria-pressed", "false");
    expect(trigger()).toHaveTextContent("H");
    expect(container.querySelector("svg.lucide-smile")).toBeNull();
    rerender(
      <EngagementBar
        actions={[reaction({ tapAction: "primary", primaryKey: "laugh", viewerReaction: "wow" })]}
      />,
    );
    expect(screen.getByRole("button", { name: /^Wow/ })).toHaveAttribute("aria-pressed", "true");
    expect(trigger()).toHaveTextContent("W");
  });

  it('"picker" (default) keeps the Smile icon and the react label', () => {
    const { container } = render(<EngagementBar actions={[reaction({ viewerReaction: null })]} />);
    expect(screen.getByRole("button", { name: /^React/ })).toBeInTheDocument();
    expect(container.querySelector("svg.lucide-smile")).not.toBeNull();
  });

  it.each([
    ["ArrowUp", { key: "ArrowUp" }],
    ["ContextMenu", { key: "ContextMenu" }],
    ["Shift+F10", { key: "F10", shiftKey: true }],
  ])("%s on the focused trigger opens the picker (default prevented)", (_name, init) => {
    const open = vi.fn();
    render(
      <EngagementBar
        actions={[reaction({ tapAction: "primary", viewerReaction: null })]}
        onReactionPickerOpenChange={open}
      />,
    );
    trigger().focus();
    const notPrevented = fireEvent.keyDown(trigger(), init);
    expect(notPrevented).toBe(false);
    expect(picker()).toBeInTheDocument();
    expect(open.mock.calls).toEqual([[true]]);
  });

  it("ArrowUp does nothing in picker mode", () => {
    render(<EngagementBar actions={[reaction({ viewerReaction: null })]} />);
    fireEvent.keyDown(trigger(), { key: "ArrowUp" });
    expect(picker()).toBeNull();
  });

  it("a long-press (350 ms) still opens the picker in primary mode", () => {
    vi.useFakeTimers();
    const onSelect = vi.fn();
    render(
      <EngagementBar
        actions={[reaction({ tapAction: "primary", viewerReaction: null, onSelect })]}
      />,
    );
    fireEvent.pointerDown(trigger(), { clientX: 0, clientY: 0, pointerId: 1 });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(picker()).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe("EB-2 hoverOpenDelay", () => {
  const hoverBar = (over: Record<string, unknown> = {}, open = vi.fn()) =>
    render(
      <EngagementBar
        actions={[reaction({ hoverOpenDelay: 200, viewerReaction: null, ...over })]}
        onReactionPickerOpenChange={open}
      />,
    );
  const content = () => picker()!.closest("[data-slot='popover-content']") as HTMLElement;

  it("a mouse pointer resting for the delay opens the picker", () => {
    vi.useFakeTimers();
    const open = vi.fn();
    hoverBar({}, open);
    fireEvent.pointerEnter(trigger(), mouse);
    act(() => void vi.advanceTimersByTime(199));
    expect(picker()).toBeNull();
    act(() => void vi.advanceTimersByTime(2));
    expect(picker()).toBeInTheDocument();
    expect(open.mock.calls).toEqual([[true]]);
  });

  it("leaving before the delay cancels it; touch and pen never hover-open", () => {
    vi.useFakeTimers();
    hoverBar();
    fireEvent.pointerEnter(trigger(), mouse);
    act(() => void vi.advanceTimersByTime(100));
    fireEvent.pointerLeave(trigger(), mouse);
    act(() => void vi.advanceTimersByTime(500));
    expect(picker()).toBeNull();
    fireEvent.pointerEnter(trigger(), { pointerType: "touch", pointerId: 2 });
    fireEvent.pointerEnter(trigger(), { pointerType: "pen", pointerId: 3 });
    act(() => void vi.advanceTimersByTime(500));
    expect(picker()).toBeNull();
  });

  it("without hoverOpenDelay a mouse pointer never opens it", () => {
    vi.useFakeTimers();
    render(<EngagementBar actions={[reaction({ viewerReaction: null })]} />);
    fireEvent.pointerEnter(trigger(), mouse);
    act(() => void vi.advanceTimersByTime(2000));
    expect(picker()).toBeNull();
  });

  it("a hover-opened picker closes ~300 ms after the pointer leaves both; re-entering the picker cancels it", () => {
    vi.useFakeTimers();
    const open = vi.fn();
    hoverBar({}, open);
    fireEvent.pointerEnter(trigger(), mouse);
    act(() => void vi.advanceTimersByTime(250));
    expect(picker()).toBeInTheDocument();

    // trigger -> picker: the grace covers the gap.
    fireEvent.pointerLeave(trigger(), mouse);
    act(() => void vi.advanceTimersByTime(250));
    fireEvent.pointerEnter(content(), mouse);
    act(() => void vi.advanceTimersByTime(1000));
    expect(picker()).toBeInTheDocument();

    // leaving the picker starts the close.
    fireEvent.pointerLeave(content(), mouse);
    act(() => void vi.advanceTimersByTime(290));
    expect(picker()).toBeInTheDocument();
    act(() => void vi.advanceTimersByTime(20));
    expect(picker()).toBeNull();
    expect(open.mock.calls).toEqual([[true], [false]]);
  });

  it("re-entering the trigger during the grace keeps it open", () => {
    vi.useFakeTimers();
    hoverBar();
    fireEvent.pointerEnter(trigger(), mouse);
    act(() => void vi.advanceTimersByTime(250));
    fireEvent.pointerLeave(trigger(), mouse);
    act(() => void vi.advanceTimersByTime(200));
    fireEvent.pointerEnter(trigger(), mouse);
    act(() => void vi.advanceTimersByTime(1000));
    expect(picker()).toBeInTheDocument();
  });

  it("Escape closes a hover-opened picker", () => {
    vi.useFakeTimers();
    hoverBar();
    fireEvent.pointerEnter(trigger(), mouse);
    act(() => void vi.advanceTimersByTime(250));
    expect(picker()).toBeInTheDocument();
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    expect(picker()).toBeNull();
  });

  it("a keyboard / long-press / click open is not closed by pointer leave", () => {
    vi.useFakeTimers();
    hoverBar({ tapAction: "primary" });
    fireEvent.keyDown(trigger(), { key: "ArrowUp" });
    expect(picker()).toBeInTheDocument();
    fireEvent.pointerEnter(trigger(), mouse);
    fireEvent.pointerLeave(trigger(), mouse);
    act(() => void vi.advanceTimersByTime(1000));
    expect(picker()).toBeInTheDocument();
  });

  it("clears its timers on unmount", () => {
    vi.useFakeTimers();
    const open = vi.fn();
    const { unmount } = hoverBar({}, open);
    fireEvent.pointerEnter(trigger(), mouse);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    act(() => void vi.advanceTimersByTime(1000));
    expect(open).not.toHaveBeenCalled();
  });

  it("a click during the pending hover cancels the open (primary tap stays closed)", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const onSelect = vi.fn();
    const open = vi.fn();
    hoverBar({ tapAction: "primary", onSelect }, open);
    fireEvent.pointerEnter(trigger(), mouse);
    fireEvent.click(trigger());
    await act(async () => void vi.advanceTimersByTime(1000));
    expect(picker()).toBeNull();
    expect(open).not.toHaveBeenCalled();
    expect(onSelect.mock.calls).toEqual([["love"]]);
  });
});

const ALL_ACTIONS: EngagementAction[] = [
  { kind: "like", count: 4, liked: false, onCountClick: () => {} },
  { kind: "comment", count: 2 },
  { kind: "share", count: 1 },
  { kind: "bookmark" },
  { kind: "custom", id: "c", label: "Custom", icon: "C", count: 3 },
  reaction({ viewerReaction: "love", onCountClick: () => {} }),
];

describe("EB-4 size touch", () => {
  const variants: EngagementBarVariant[] = ["default", "compact", "stacked"];

  it.each(variants)("every button has min-h-11 min-w-11 (%s)", async (variant) => {
    const user = userEvent.setup();
    render(<EngagementBar actions={ALL_ACTIONS} variant={variant} size="touch" />);
    // open the picker so its kind + Remove buttons are in the DOM too
    await user.click(screen.getAllByRole("button", { name: /^Love/ })[0]!);
    // clearOnTap default clears; long-press instead:
    if (!picker()) fireEvent.keyDown(trigger(), { key: "ArrowUp" });
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(8);
    for (const b of buttons) {
      expect(b.className, b.outerHTML.slice(0, 120)).toContain("min-h-11");
      expect(b.className).toContain("min-w-11");
    }
  });

  it("the picker's kind buttons and Remove button are touch-sized", () => {
    render(
      <EngagementBar
        actions={[reaction({ tapAction: "primary", viewerReaction: "love" })]}
        size="touch"
      />,
    );
    fireEvent.keyDown(trigger(), { key: "ArrowUp" });
    const group = picker()!;
    const inner = group.querySelectorAll("button");
    expect(inner.length).toBe(KINDS.length + 1);
    inner.forEach((b) => expect(b.className).toContain("min-h-11"));
    expect(screen.getByRole("button", { name: "Remove reaction" }).className).toContain("min-w-11");
  });

  it.each(variants)('"default" adds no touch classes (%s)', (variant) => {
    render(<EngagementBar actions={ALL_ACTIONS} variant={variant} />);
    for (const b of screen.getAllByRole("button")) {
      expect(b.className).not.toContain("min-h-11");
    }
  });

  it("stacked keeps exactly one child per visible action; actionClassName still lands", () => {
    const { container } = render(
      <EngagementBar
        actions={ALL_ACTIONS}
        variant="stacked"
        size="touch"
        actionClassName="my-action"
      />,
    );
    expect(container.firstElementChild!.children).toHaveLength(ALL_ACTIONS.length);
    expect(container.querySelectorAll(".my-action").length).toBeGreaterThanOrEqual(ALL_ACTIONS.length);
  });
});

describe("FU-1 toggle event", () => {
  it("like onToggle receives the click event, read synchronously inside the click", async () => {
    const user = userEvent.setup();
    const seen: Array<{ next: boolean; target: unknown; type: string | undefined }> = [];
    render(
      <EngagementBar
        actions={[
          {
            kind: "like",
            count: 1,
            onToggle: (next, event) => {
              seen.push({ next, target: event?.currentTarget, type: event?.type });
            },
          },
        ]}
      />,
    );
    const heart = trigger();
    await user.click(heart);
    expect(seen).toEqual([{ next: true, target: heart, type: "click" }]);
  });

  it("split heart + bookmark pass the event; the imperative handle passes undefined", async () => {
    const user = userEvent.setup();
    const ref = createRef<EngagementBarHandle>();
    const like = vi.fn();
    const bookmark = vi.fn();
    render(
      <EngagementBar
        ref={ref}
        actions={[
          { kind: "like", count: 1, onCountClick: () => {}, onToggle: like },
          { kind: "bookmark", onToggle: bookmark },
        ]}
      />,
    );
    await user.click(screen.getByRole("button", { name: /^Like/ }));
    await user.click(screen.getByRole("button", { name: /^Bookmark/ }));
    expect(like.mock.calls[0]![1]).toMatchObject({ type: "click" });
    expect(bookmark.mock.calls[0]![1]).toMatchObject({ type: "click" });
    act(() => ref.current!.triggerLike());
    act(() => ref.current!.triggerBookmark());
    expect(like.mock.calls[1]![0]).toBe(false);
    expect(like.mock.calls[1]![1]).toBeUndefined();
    expect(bookmark.mock.calls[1]![0]).toBe(false);
    expect(bookmark.mock.calls[1]![1]).toBeUndefined();
  });

  it("a one-argument handler still works", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn((next: boolean) => void next);
    render(<EngagementBar actions={[{ kind: "like", count: 0, onToggle }]} />);
    await user.click(trigger());
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle.mock.calls[0]![0]).toBe(true);
  });
});

describe("FU-6 liked count contrast", () => {
  const countText = (container: HTMLElement) =>
    Array.from(container.querySelectorAll("span")).find((s) => s.textContent === "5")!;

  it("stacked single button: the count inherits the button colour (media overlays set their own)", () => {
    const { container } = render(
      <EngagementBar variant="stacked" actions={[{ kind: "like", count: 5, liked: true }]} />,
    );
    expect(countText(container).className).not.toContain("text-foreground");
  });

  it.each(["default", "compact"] as const)(
    "single button (%s): count text-foreground when liked, heart keeps text-destructive",
    (variant) => {
      const { container } = render(
        <EngagementBar variant={variant} actions={[{ kind: "like", count: 5, liked: true }]} />,
      );
      expect(countText(container).className).toContain("text-foreground");
      expect(trigger().className).toContain("text-destructive");
    },
  );

  it.each(["default", "compact", "stacked"] as const)(
    "split count button (%s): text-foreground when liked, not text-destructive",
    (variant) => {
      render(
        <EngagementBar
          variant={variant}
          actions={[{ kind: "like", count: 5, liked: true, onCountClick: () => {} }]}
        />,
      );
      const [heart, count] = screen.getAllByRole("button");
      expect(count!.className).toContain("text-foreground");
      expect(count!.className).not.toContain("text-destructive");
      expect(heart!.className).toContain("text-destructive");
    },
  );

  it("unliked count span has no text-foreground override", () => {
    const { container } = render(
      <EngagementBar actions={[{ kind: "like", count: 5, liked: false }]} />,
    );
    expect(countText(container).className).not.toContain("text-foreground");
  });
});
