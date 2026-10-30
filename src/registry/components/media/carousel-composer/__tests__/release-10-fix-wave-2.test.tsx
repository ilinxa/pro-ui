/**
 * carousel-composer 0.5.0 fix wave 2 (release 10, browser pass): F-1 Escape guard armed
 * synchronously + late-delivered keydowns, F-2 pan arrow on an axis without overflow.
 */
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

vi.mock("@/registry/components/media/media-editor/media-editor", () => ({
  MediaEditor: forwardRef(function MockMediaEditor(_props: Record<string, unknown>, ref) {
    useImperativeHandle(ref, () => ({
      exportImage: () => new Promise(() => {}), // never settles: Done stays in flight
      getState: () => ({}),
      getSourceBlob: () => null,
      loadState: () => {},
    }) as never);
    return null;
  }),
}));

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CarouselComposer } from "../carousel-composer";
import { CarouselEditPanel } from "../features/editing";
import type { CarouselEditorPanelProps, MediaCarouselItem } from "../types";

const IMG = (id: string, w = 200, h = 100): MediaCarouselItem => ({
  id,
  kind: "image",
  url: `https://example.test/${id}.jpg`,
  fileName: `${id}.jpg`,
  width: w,
  height: h,
});

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.useRealTimers();
  cleanup();
  vi.restoreAllMocks();
});

describe("F-1 edit panel arms the guard synchronously at Done", () => {
  it("onBusyChange(true) fires inside the click handler, before the export and before any effect", () => {
    const onBusyChange = vi.fn();
    render(
      <CarouselEditPanel
        item={IMG("a")}
        aspect="1:1"
        aspectRatio={null}
        labels={{ editDone: "Done", editCancel: "Cancel", editSaving: "Saving", editError: "Error" }}
        onApply={() => {}}
        onCancel={() => {}}
        onBusyChange={onBusyChange}
      />,
    );
    onBusyChange.mockClear();
    // A bare DOM click (no act): React runs the handler synchronously but flushes no effect.
    screen.getByRole("button", { name: "Done" }).click();
    expect(onBusyChange).toHaveBeenCalledWith(true);
  });
});

describe("F-1 Escape guard (real Radix dialog)", () => {
  let reportBusy: (b: boolean) => void = () => {};
  function Panel({ onBusyChange, onCancel }: CarouselEditorPanelProps) {
    useEffect(() => {
      reportBusy = (b) => onBusyChange?.(b);
    }, [onBusyChange]);
    return (
      <button type="button" onClick={onCancel}>
        close-panel
      </button>
    );
  }
  function Host() {
    const [open, setOpen] = useState(true);
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>host</DialogTitle>
          <CarouselComposer defaultValue={[IMG("a")]} editing={{ Panel }} />
        </DialogContent>
      </Dialog>
    );
  }
  const escape = (timeStamp?: number) => {
    const ev = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    if (timeStamp !== undefined) Object.defineProperty(ev, "timeStamp", { value: timeStamp });
    act(() => {
      document.dispatchEvent(ev);
    });
  };
  const open = () => {
    render(<Host />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
  };

  it("busy set in the same task: an Escape dispatched right after is swallowed (no render in between)", async () => {
    open();
    reportBusy(true); // outside act: only a ref can have changed by now
    const ev = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    document.dispatchEvent(ev);
    // let any dismissal the dialog queued outside act() render
    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });
    expect(screen.queryByRole("dialog")).not.toBeNull();
  });

  it("an Escape pressed while busy but delivered after the panel unmounted is swallowed", () => {
    open();
    const pressedAt = performance.now();
    act(() => reportBusy(true));
    fireEvent.click(screen.getByRole("button", { name: "close-panel" })); // edit closes while busy
    expect(screen.queryByRole("button", { name: "close-panel" })).toBeNull();
    escape(pressedAt); // queued behind the blocking work, delivered late
    expect(screen.queryByRole("dialog")).not.toBeNull();
  });

  it("an Escape pressed after busy ended behaves as 0.4.0 (closes the dialog)", () => {
    open();
    act(() => reportBusy(true));
    act(() => reportBusy(false));
    escape(performance.now() + 50);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("an Escape pressed after the edit closed (busy ended with it) closes the dialog", () => {
    open();
    act(() => reportBusy(true));
    fireEvent.click(screen.getByRole("button", { name: "close-panel" }));
    escape(performance.now() + 50);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("the listener outlives the edit by the grace period, then is removed", () => {
    vi.useFakeTimers();
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const keydown = (spy: typeof add) =>
      spy.mock.calls.filter((c) => c[0] === "keydown" && c[2] === true).length;
    render(<CarouselComposer defaultValue={[IMG("a")]} editing={{ Panel }} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(keydown(add)).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: "close-panel" }));
    expect(keydown(remove)).toBe(0);
    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(keydown(remove)).toBe(0);
    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(keydown(remove)).toBe(1);
  });
});

describe("F-2 pan ignores an arrow on an axis without overflow", () => {
  const frame = (c: HTMLElement) => {
    const el = c.querySelector<HTMLElement>("[data-pan]")!;
    expect(el).toBeTruthy();
    el.getBoundingClientRect = () =>
      ({ width: 100, height: 100, top: 0, left: 0, right: 100, bottom: 100, x: 0, y: 0 }) as DOMRect;
    return el;
  };
  const press = (item: MediaCarouselItem, key: string) => {
    const onCropOffsetChange = vi.fn();
    const { container } = render(
      <CarouselComposer defaultValue={[item]} aspect="1:1" enablePan onCropOffsetChange={onCropOffsetChange} />,
    );
    const f = frame(container);
    f.focus();
    const notPrevented = fireEvent.keyDown(f, { key });
    cleanup();
    return { notPrevented, calls: onCropOffsetChange.mock.calls.length };
  };

  it("exactly fitted axis: ArrowLeft/Right on a tall item, ArrowUp/Down on a wide item", () => {
    for (const key of ["ArrowLeft", "ArrowRight"]) {
      expect(press(IMG("t", 1000, 2000), key)).toEqual({ notPrevented: true, calls: 0 });
    }
    for (const key of ["ArrowUp", "ArrowDown"]) {
      expect(press(IMG("w", 2000, 1000), key)).toEqual({ notPrevented: true, calls: 0 });
    }
  });

  it("sub-pixel overflow (float noise / rounding) counts as no overflow, both axes", () => {
    // 1003 x 1000 in a 100 x 100 frame overflows x by 0.3 px
    expect(press(IMG("w", 1003, 1000), "ArrowRight")).toEqual({ notPrevented: true, calls: 0 });
    // 1000 x 1003 overflows y by 0.3 px
    expect(press(IMG("t", 1000, 1003), "ArrowDown")).toEqual({ notPrevented: true, calls: 0 });
  });

  it("an axis that does overflow still pans (and is prevented)", () => {
    const wide = press(IMG("w", 2000, 1000), "ArrowRight");
    expect(wide.calls).toBe(1);
    expect(wide.notPrevented).toBe(false);
    const tall = press(IMG("t", 1000, 2000), "ArrowDown");
    expect(tall.calls).toBe(1);
    expect(tall.notPrevented).toBe(false);
  });
});
