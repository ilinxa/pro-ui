/**
 * B5 — `onExternalDrop` is accepted but never wired. It is now self-disclosing:
 * exactly one dev warning per mount when passed, none when absent.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { EventCalendar } from "../event-calendar";
import { buildCalendarDummyData } from "../dummy-data";

const NOW = new Date("2026-10-15T12:00:00");

beforeEach(() => {
  // jsdom has no ResizeObserver; the month view measures its cells with one.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const hits = (warn: { mock: { calls: unknown[][] } }) =>
  warn.mock.calls.filter((c) => String(c[0]).includes("onExternalDrop"));

describe("EventCalendar onExternalDrop disclosure", () => {
  it("emits exactly one dev warning when the prop is passed (across re-renders)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const data = buildCalendarDummyData(NOW);
    const onExternalDrop = vi.fn();
    const { rerender } = render(
      <EventCalendar data={data} onExternalDrop={onExternalDrop} />,
    );
    rerender(<EventCalendar data={[...data]} onExternalDrop={onExternalDrop} />);

    expect(hits(warn)).toHaveLength(1);
    expect(String(hits(warn)[0][0])).toContain("not implemented");
    expect(onExternalDrop).not.toHaveBeenCalled();
  });

  it("stays silent when the prop is absent", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<EventCalendar data={buildCalendarDummyData(NOW)} />);
    expect(hits(warn)).toHaveLength(0);
  });
});
