/** EB5 (touch + long-press, I9) and axe on the open picker. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createEvent, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EngagementBar } from "../engagement-bar";
import type { EngagementAction } from "../types";
import { expectNoAxeViolations } from "../../../../../../tests/helpers";
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
  ({ kind: "reaction", kinds: KINDS, totalCount: 9, ...over }) as EngagementAction;
// The picker portals to the end of the body, so the trigger is the first button.
const trigger = () => screen.getAllByRole("button")[0]!;
const picker = () => screen.queryByRole("group", { name: "Pick a reaction" });
const down = (x = 0, y = 0) => fireEvent.pointerDown(trigger(), { clientX: x, clientY: y, pointerId: 1 });
const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

describe("EB5 / I9: touch + long-press", () => {
  it("R7: the trigger has touch-manipulation and no touch-none", () => {
    render(<EngagementBar actions={[reaction()]} />);
    const cls = trigger().className;
    expect(cls).toContain("touch-manipulation");
    expect(cls.split(/\s+/)).not.toContain("touch-none");
  });

  it("a long-press (350 ms) opens the picker; 300 ms does not", () => {
    vi.useFakeTimers();
    render(<EngagementBar actions={[reaction()]} />);
    down();
    advance(300);
    expect(picker()).toBeNull();
    advance(60);
    expect(picker()).toBeInTheDocument();
  });

  it("a long-press opens the picker even when a reaction is set and clearOnTap is on", () => {
    vi.useFakeTimers();
    render(<EngagementBar actions={[reaction({ viewerReaction: "love" })]} />);
    down();
    advance(400);
    expect(picker()).toBeInTheDocument();
  });

  it("pointermove > 10 px before 350 ms cancels the long-press", () => {
    vi.useFakeTimers();
    render(<EngagementBar actions={[reaction()]} />);
    down(0, 0);
    fireEvent.pointerMove(trigger(), { clientX: 0, clientY: 20, pointerId: 1 });
    advance(500);
    expect(picker()).toBeNull();
  });

  it("pointermove within the 10 px tolerance does not cancel it", () => {
    vi.useFakeTimers();
    render(<EngagementBar actions={[reaction()]} />);
    down(0, 0);
    fireEvent.pointerMove(trigger(), { clientX: 4, clientY: 4, pointerId: 1 });
    advance(400);
    expect(picker()).toBeInTheDocument();
  });

  it("pointercancel (the browser starting a scroll) cancels the long-press", () => {
    vi.useFakeTimers();
    render(<EngagementBar actions={[reaction()]} />);
    down();
    fireEvent.pointerCancel(trigger(), { pointerId: 1 });
    advance(500);
    expect(picker()).toBeNull();
  });

  it("pointerup before 350 ms cancels the long-press", () => {
    vi.useFakeTimers();
    render(<EngagementBar actions={[reaction()]} />);
    down();
    fireEvent.pointerUp(trigger(), { pointerId: 1 });
    advance(500);
    expect(picker()).toBeNull();
  });

  it("a contextmenu event during a long-press is defaultPrevented", () => {
    vi.useFakeTimers();
    render(<EngagementBar actions={[reaction()]} />);
    down();
    const ev = createEvent.contextMenu(trigger());
    fireEvent(trigger(), ev);
    expect(ev.defaultPrevented).toBe(true);
  });

  it("a contextmenu event right after the long-press fired is defaultPrevented", () => {
    vi.useFakeTimers();
    render(<EngagementBar actions={[reaction()]} />);
    down();
    advance(400);
    const ev = createEvent.contextMenu(trigger());
    fireEvent(trigger(), ev);
    expect(ev.defaultPrevented).toBe(true);
  });

  it("a contextmenu event with no long-press is NOT prevented", () => {
    render(<EngagementBar actions={[reaction()]} />);
    const ev = createEvent.contextMenu(trigger());
    fireEvent(trigger(), ev);
    expect(ev.defaultPrevented).toBe(false);
  });
});

describe("reaction tap matrix and selection", () => {
  it("tap with no reaction opens the picker", async () => {
    const user = userEvent.setup();
    render(<EngagementBar actions={[reaction()]} />);
    await user.click(trigger());
    expect(picker()).toBeInTheDocument();
  });

  it("tap with a reaction and the default clearOnTap clears it (onSelect(null)) without opening the picker", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<EngagementBar actions={[reaction({ viewerReaction: "love", onSelect })]} />);
    await user.click(trigger());
    await act(async () => {});
    expect(onSelect).toHaveBeenCalledWith(null);
    expect(picker()).toBeNull();
  });

  it("tap with a reaction and clearOnTap=false opens the picker", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<EngagementBar actions={[reaction({ viewerReaction: "love", clearOnTap: false, onSelect })]} />);
    await user.click(trigger());
    expect(picker()).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("keyboard: Enter on a picker kind selects it and closes the picker", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<EngagementBar actions={[reaction({ onSelect })]} />);
    await user.click(trigger());
    const laugh = await screen.findByRole("button", { name: /^Laugh/ });
    laugh.focus();
    await user.keyboard("{Enter}");
    await act(async () => {});
    expect(onSelect).toHaveBeenCalledWith("laugh");
    expect(picker()).toBeNull();
  });

  it("the Remove button clears the reaction", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<EngagementBar actions={[reaction({ viewerReaction: "love", clearOnTap: false, onSelect })]} />);
    await user.click(trigger());
    await user.click(await screen.findByRole("button", { name: "Remove reaction" }));
    await act(async () => {});
    expect(onSelect).toHaveBeenCalledWith(null);
  });
});

describe("axe on the OPEN picker", () => {
  const scenarios: Array<[string, boolean, Record<string, unknown>, "ltr" | "rtl" | undefined]> = [
    ["default (no reaction)", false, {}, undefined],
    [
      "reaction set (Remove button) and withheld counts",
      false,
      { viewerReaction: "love", clearOnTap: false, totalCount: null, kinds: KINDS.map((k) => ({ ...k, count: null })) },
      undefined,
    ],
    ["RTL", false, {}, "rtl"],
  ];

  async function open(over: Record<string, unknown>, dir: "ltr" | "rtl" | undefined) {
    const user = userEvent.setup();
    const view = render(<EngagementBar dir={dir} actions={[reaction(over)]} />);
    await user.click(trigger());
    await screen.findByRole("group", { name: "Pick a reaction" });
    return view;
  }

  for (const [name, , over, dir] of scenarios) {
    it(`open picker, ${name}: the bar subtree has no violations`, async () => {
      const { container } = await open(over, dir);
      await expectNoAxeViolations(container);
    });

    // Regression (U2 test pass): the portalled popover content (role="dialog") had no accessible
    // name → axe aria-dialog-name. Axe on the container misses the portal, so check document.body.
    it(`open picker, ${name}: the portalled popover dialog has no violations (aria-dialog-name)`, async () => {
      await open(over, dir);
      await expectNoAxeViolations(document.body);
    });
  }
});
