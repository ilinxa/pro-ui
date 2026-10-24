/**
 * U4 adversarial-review regressions (engagement-bar 0.5.0). Each test reproduces a CONFIRMED
 * finding from `docs/procomps/engagement-bar-procomp/engagement-bar-loop.md` §Findings and failed
 * before its fix.
 */
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EngagementBar } from "../engagement-bar";
import { formatEngagementCount, resolveLocale } from "../lib/format-count";
import { LikersStrip } from "../parts/likers-strip";
import { ShareMenu } from "../parts/share-menu";
import type { EngagementAction, EngagementBarHandle, EngagementDelta } from "../types";
import { installDomStubs, KINDS, makeSubscribe } from "./support";

let restore: () => void;
beforeEach(() => {
  restore = installDomStubs();
});
afterEach(() => {
  vi.useRealTimers();
  restore();
});

const flush = () => act(async () => {});
const picker = () => screen.queryByRole("group", { name: "Pick a reaction" });

describe("F1: an uncontrolled count that starts withheld counts from the prop once it arrives", () => {
  it("like: mount without a count, rerender with 10, click → 11", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<EngagementBar actions={[{ kind: "like" }]} />);
    rerender(<EngagementBar actions={[{ kind: "like", count: 10 }]} />);
    await user.click(screen.getByRole("button", { name: "Like 10" }));
    expect(screen.getByRole("button", { name: "Unlike 11" })).toBeInTheDocument();
  });

  it("reaction total: mount withheld, rerender with 9, pick → 10", async () => {
    const user = userEvent.setup();
    const action = (total: number | null): EngagementAction => ({
      kind: "reaction",
      kinds: KINDS,
      totalCount: total,
    });
    const { rerender } = render(<EngagementBar actions={[action(null)]} />);
    rerender(<EngagementBar actions={[action(9)]} />);
    await user.click(screen.getByRole("button", { name: "React 9" }));
    await user.click(screen.getByRole("button", { name: "Love 5" }));
    await flush();
    expect(screen.getByRole("button", { name: "Love 10" })).toHaveAttribute("aria-pressed", "true");
  });
});

describe("F2 / F2b: a reaction (or kind) added after mount works and keeps its counts", () => {
  it("F2: a reaction action added after mount can be picked", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<EngagementBar actions={[{ kind: "like", count: 1 }]} />);
    rerender(
      <EngagementBar
        actions={[
          { kind: "like", count: 1 },
          { kind: "reaction", kinds: KINDS, totalCount: 9 },
        ]}
      />,
    );
    await user.click(screen.getByRole("button", { name: "React 9" }));
    await user.click(screen.getByRole("button", { name: "Love 5" }));
    await flush();
    expect(screen.getByRole("button", { name: "Love 10" })).toHaveAttribute("aria-pressed", "true");
  });

  it("F2b: a kind added after mount starts from its prop count (40 → 41, not 1)", async () => {
    const user = userEvent.setup();
    const sad = { key: "sad", icon: "S", label: "Sad", count: 40 };
    const action = (kinds = KINDS): EngagementAction => ({
      kind: "reaction",
      kinds,
      totalCount: 49,
      clearOnTap: false,
    });
    const { rerender } = render(<EngagementBar actions={[action()]} />);
    rerender(<EngagementBar actions={[action([...KINDS, sad])]} />);
    await user.click(screen.getByRole("button", { name: "React 49" }));
    await user.click(screen.getByRole("button", { name: "Sad 40" }));
    await flush();
    await user.click(screen.getByRole("button", { name: "Sad 50" }));
    expect(screen.getByRole("button", { name: "Sad 41" })).toHaveAttribute("aria-pressed", "true");
  });
});

describe("F3: direction resolves when the bar's first render was null", () => {
  it("hidden → visible inside dir=rtl gives the picker dir=rtl", async () => {
    const user = userEvent.setup();
    const action = (hidden: boolean): EngagementAction => ({
      kind: "reaction",
      kinds: KINDS,
      totalCount: 9,
      hidden,
    });
    const { rerender } = render(
      <div dir="rtl">
        <EngagementBar actions={[action(true)]} />
      </div>,
    );
    rerender(
      <div dir="rtl">
        <EngagementBar actions={[action(false)]} />
      </div>,
    );
    await user.click(screen.getByRole("button", { name: "React 9" }));
    expect(picker()?.closest("[dir]")).toHaveAttribute("dir", "rtl");
  });
});

describe("F4: the long-press timer never leaks", () => {
  const trigger = () => screen.getAllByRole("button")[0]!;

  it("a second pointer cancels the pending long-press (no picker after both lift)", () => {
    vi.useFakeTimers();
    render(<EngagementBar actions={[{ kind: "reaction", kinds: KINDS, totalCount: 9 }]} />);
    fireEvent.pointerDown(trigger(), { pointerId: 1 });
    fireEvent.pointerDown(trigger(), { pointerId: 2 });
    fireEvent.pointerUp(trigger(), { pointerId: 2 });
    fireEvent.pointerUp(trigger(), { pointerId: 1 });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(picker()).toBeNull();
  });

  it("a right mouse button never starts a long-press", () => {
    vi.useFakeTimers();
    render(<EngagementBar actions={[{ kind: "reaction", kinds: KINDS, totalCount: 9 }]} />);
    fireEvent.pointerDown(trigger(), { pointerId: 1, pointerType: "mouse", button: 2 });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(picker()).toBeNull();
  });

  it("a pending long-press does not fire after the action becomes disabled", () => {
    vi.useFakeTimers();
    const action = (disabled: boolean): EngagementAction => ({
      kind: "reaction",
      kinds: KINDS,
      totalCount: 9,
      disabled,
    });
    const { rerender } = render(<EngagementBar actions={[action(false)]} />);
    fireEvent.pointerDown(trigger(), { pointerId: 1 });
    rerender(<EngagementBar actions={[action(true)]} />);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(picker()).toBeNull();
  });
});

describe("F5: hiding one action never remounts another", () => {
  it("an open picker stays open when an earlier action is hidden", async () => {
    const user = userEvent.setup();
    const actions = (hideLike: boolean): EngagementAction[] => [
      { kind: "like", count: 1, hidden: hideLike },
      { kind: "reaction", kinds: KINDS, totalCount: 9, clearOnTap: false },
    ];
    const { rerender } = render(<EngagementBar actions={actions(false)} />);
    await user.click(screen.getByRole("button", { name: "React 9" }));
    expect(picker()).toBeInTheDocument();
    rerender(<EngagementBar actions={actions(true)} />);
    expect(picker()).toBeInTheDocument();
  });
});

describe("L1: a newer sync / throwing request never leaves an older overlay stuck", () => {
  it("controlled: async request, then a sync one, then the older rejects → props show", async () => {
    const user = userEvent.setup();
    let reject!: () => void;
    let calls = 0;
    const onToggle = () => {
      calls += 1;
      if (calls === 1) return new Promise<void>((_, rej) => (reject = () => rej(new Error("x"))));
      return undefined;
    };
    render(<EngagementBar actions={[{ kind: "like", liked: false, count: 3, onToggle }]} />);
    await user.click(screen.getByRole("button", { name: "Like 3" }));
    expect(screen.getByRole("button", { name: "Unlike 4" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Unlike 4" }));
    await act(async () => {
      reject();
    });
    expect(screen.getByRole("button", { name: "Like 3" })).toBeInTheDocument();
  });

  it("a throwing handler drops a pending overlay and rethrows", async () => {
    const user = userEvent.setup();
    const ref = createRef<EngagementBarHandle>();
    let calls = 0;
    const onToggle = () => {
      calls += 1;
      if (calls === 1) return new Promise<void>(() => {});
      throw new Error("host bug");
    };
    render(<EngagementBar ref={ref} actions={[{ kind: "like", liked: false, count: 3, onToggle }]} />);
    await user.click(screen.getByRole("button", { name: "Like 3" }));
    expect(screen.getByRole("button", { name: "Unlike 4" })).toBeInTheDocument();
    let thrown: unknown;
    act(() => {
      try {
        ref.current!.triggerLike();
      } catch (error) {
        thrown = error;
      }
    });
    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).toBe("host bug");
    expect(screen.getByRole("button", { name: "Like 3" })).toBeInTheDocument();
  });
});

describe("L2: malformed delta counts never render", () => {
  it.each([NaN, Infinity])("comment-count-changed %s keeps the current count", (bad) => {
    const { subscribe, emit } = makeSubscribe<EngagementDelta>();
    render(<EngagementBar actions={[{ kind: "comment", count: 4 }]} subscribe={subscribe} />);
    act(() => emit({ kind: "comment-count-changed", count: bad }));
    expect(screen.getByRole("button", { name: "Comment 4" })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/NaN|∞/);
  });

  it("like-changed NaN keeps the uncontrolled count", () => {
    const { subscribe, emit } = makeSubscribe<EngagementDelta>();
    render(<EngagementBar actions={[{ kind: "like", count: 4 }]} subscribe={subscribe} />);
    act(() => emit({ kind: "like-changed", count: NaN }));
    expect(screen.getByRole("button", { name: "Like 4" })).toBeInTheDocument();
  });
});

describe("L3: a keyboard click never acts on a stale long-press flag", () => {
  it("long-press fired, then pointercancel (scroll), then Enter → clear-on-tap, not open", async () => {
    vi.useFakeTimers();
    const onSelect = vi.fn();
    render(
      <EngagementBar
        actions={[{ kind: "reaction", kinds: KINDS, totalCount: 9, viewerReaction: "love", onSelect }]}
      />,
    );
    const trigger = screen.getAllByRole("button")[0]!;
    fireEvent.pointerDown(trigger, { pointerId: 1 });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    fireEvent.pointerCancel(trigger, { pointerId: 1 });
    // Close the picker the long-press opened, then activate by keyboard (click with detail 0).
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    vi.useRealTimers();
    fireEvent.click(trigger, { detail: 0 });
    await flush();
    expect(onSelect).toHaveBeenCalledWith(null);
  });
});

describe("G3: an invalid locale falls back to English instead of throwing", () => {
  it("resolveLocale", () => {
    expect(resolveLocale("en_US")).toBe("en");
    expect(resolveLocale(undefined)).toBe("en");
    expect(resolveLocale("tr")).toBe("tr");
    expect(formatEngagementCount(1200, "en_US")).toBe("1.2K");
  });

  it("EngagementBar, LikersStrip and ShareMenu render with locale='en_US'", () => {
    expect(() =>
      render(
        <>
          <EngagementBar locale="en_US" actions={[{ kind: "like", count: 1200 }]} />
          <LikersStrip locale="en_US" totalCount={5} likers={[{ id: "a", name: "ilker" }]} />
          <ShareMenu locale="en_US" users={[{ id: "a", name: "Ada" }]} onShareTo={() => {}} />
        </>,
      ),
    ).not.toThrow();
    expect(screen.getByRole("button", { name: "Like 1.2K" })).toBeInTheDocument();
  });
});

describe("G2: view-count is display-only", () => {
  it("takes no `disabled` (type-level)", () => {
    // @ts-expect-error — `disabled` is not accepted on the display-only view-count action.
    const action: EngagementAction = { kind: "view-count", count: 1, disabled: true };
    expect(action.kind).toBe("view-count");
  });
});
