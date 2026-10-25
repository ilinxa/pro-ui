/**
 * story-viewer 0.6.0 - `useStoryProgress({ seedPct })` is a public hook option the viewer itself
 * no longer passes (the hand-over moved into the item pipeline). It must still behave as
 * documented: it raises the accumulator and never lowers it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useStoryProgress } from "../hooks/use-story-progress";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

type Props = { seedPct?: number; itemKey?: string; isPaused?: boolean };
function mount(initial: Props = {}) {
  return renderHook(
    (p: Props) =>
      useStoryProgress({
        isOpen: true,
        isPaused: p.isPaused ?? false,
        itemKey: p.itemKey ?? "a:1",
        itemDurationMs: 1000,
        onComplete: () => {},
        seedPct: p.seedPct,
      }),
    { initialProps: initial },
  );
}

describe("useStoryProgress seedPct", () => {
  it("without a seed the bar starts at 0", () => {
    const { result } = mount();
    tick(100);
    expect(result.current).toBeLessThan(15);
  });

  it("a seed raises progress: 50% seeded + 100 ms of a 1000 ms item reads about 60", () => {
    const { result } = mount({ seedPct: 50 });
    tick(100);
    expect(result.current).toBeGreaterThanOrEqual(59);
    expect(result.current).toBeLessThanOrEqual(61);
  });

  it("a later, smaller seed never lowers the accumulator", () => {
    const { result, rerender } = mount({ seedPct: 80 });
    tick(100); // ~90
    rerender({ seedPct: 20 });
    tick(100); // still climbing from ~90, never back to ~30
    expect(result.current).toBeGreaterThanOrEqual(99);
  });

  it("a later, larger seed raises it mid-run", () => {
    const { result, rerender } = mount({ seedPct: 10 });
    tick(100); // ~20
    rerender({ seedPct: 70 });
    tick(50);
    expect(result.current).toBeGreaterThanOrEqual(70);
  });

  it("resets with the item: a new item starts from its own seed", () => {
    const { result, rerender } = mount({ seedPct: 80 });
    tick(50);
    rerender({ seedPct: undefined, itemKey: "a:2" });
    expect(result.current).toBe(0);
    tick(100);
    expect(result.current).toBeLessThan(15);
  });
});
