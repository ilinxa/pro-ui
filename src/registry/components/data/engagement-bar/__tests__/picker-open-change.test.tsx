/** `onReactionPickerOpenChange` - fires on picker open / close, changes only. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EngagementBar } from "../engagement-bar";
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
  ({ kind: "reaction", kinds: KINDS, totalCount: 9, ...over }) as EngagementAction;
const trigger = () => screen.getAllByRole("button")[0]!;
const picker = () => screen.queryByRole("group", { name: "Pick a reaction" });

describe("onReactionPickerOpenChange", () => {
  it("does not fire on mount", () => {
    const spy = vi.fn();
    render(<EngagementBar actions={[reaction()]} onReactionPickerOpenChange={spy} />);
    expect(spy).not.toHaveBeenCalled();
  });

  it("fires true when a tap opens the picker, false when a pick closes it", async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    render(<EngagementBar actions={[reaction()]} onReactionPickerOpenChange={spy} />);
    await user.click(trigger());
    expect(picker()).toBeInTheDocument();
    expect(spy.mock.calls).toEqual([[true]]);
    await user.click(screen.getByRole("button", { name: /Love/ }));
    await act(async () => {});
    expect(spy.mock.calls).toEqual([[true], [false]]);
  });

  it("fires true on a long-press open", () => {
    vi.useFakeTimers();
    const spy = vi.fn();
    render(<EngagementBar actions={[reaction()]} onReactionPickerOpenChange={spy} />);
    fireEvent.pointerDown(trigger(), { clientX: 0, clientY: 0, pointerId: 1 });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(spy.mock.calls).toEqual([[true]]);
  });

  it("fires false when Escape closes the picker", async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    render(<EngagementBar actions={[reaction()]} onReactionPickerOpenChange={spy} />);
    await user.click(trigger());
    await user.keyboard("{Escape}");
    expect(picker()).toBeNull();
    expect(spy.mock.calls).toEqual([[true], [false]]);
  });

  it("fires false when the bar unmounts with the picker open", async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    const { unmount } = render(
      <EngagementBar actions={[reaction()]} onReactionPickerOpenChange={spy} />,
    );
    await user.click(trigger());
    unmount();
    expect(spy.mock.calls).toEqual([[true], [false]]);
  });

  it("a tap that clears the reaction leaves the picker closed (any transient open is closed again)", async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    render(
      <EngagementBar
        actions={[reaction({ viewerReaction: "love" })]}
        onReactionPickerOpenChange={spy}
      />,
    );
    await user.click(trigger());
    await act(async () => {});
    expect(picker()).toBeNull();
    const calls = spy.mock.calls.map((c) => c[0]);
    expect(calls.length === 0 || calls[calls.length - 1] === false).toBe(true);
  });
});
