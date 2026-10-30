/**
 * carousel-composer 0.5.0: alt for videos (CC-4), pan (CC-5), Escape guard (CC-6),
 * non-drag reorder (CC-7). jsdom has no layout, so the pan frame's rect is stubbed.
 */
import { createRef, useEffect, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CarouselComposer } from "../carousel-composer";
import { offsetCropRect, centredCropRect } from "../lib/aspect";
import type {
  CarouselComposerHandle,
  CarouselEditorPanelProps,
  MediaCarouselItem,
} from "../types";

const IMG = (id: string, w = 200, h = 100): MediaCarouselItem => ({
  id,
  kind: "image",
  url: `https://example.test/${id}.jpg`,
  fileName: `${id}.jpg`,
  width: w,
  height: h,
});
const VID: MediaCarouselItem = {
  id: "v",
  kind: "video",
  url: "https://example.test/v.mp4",
  fileName: "v.mp4",
  alt: "A dog",
};

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const thumbBtn = (n: number) =>
  screen
    .getAllByRole("button")
    .find((b) => (b.getAttribute("aria-label") ?? "").startsWith(`Media item ${n} of`))!;

describe("CC-4 alt for videos", () => {
  it('"all" shows the field + counter for a video with the video placeholder; the video is named', () => {
    const { container } = render(
      <CarouselComposer defaultValue={[VID]} enableAltText="all" />,
    );
    const input = screen.getByPlaceholderText("Describe this video for people who can't see it");
    expect(input).toHaveValue("A dog");
    expect(screen.getByText("5/200")).toBeTruthy();
    expect(container.querySelector("video")).toHaveAttribute("aria-label", "A dog");
  });

  it('true / "images" leave a video without a field; the predicate form decides per item', () => {
    const { rerender } = render(<CarouselComposer defaultValue={[VID]} enableAltText />);
    expect(screen.queryByRole("textbox")).toBeNull();
    rerender(<CarouselComposer defaultValue={[VID]} enableAltText="images" />);
    expect(screen.queryByRole("textbox")).toBeNull();
    rerender(<CarouselComposer defaultValue={[VID]} enableAltText={(it) => it.kind === "video"} />);
    expect(screen.getByRole("textbox")).toBeTruthy();
  });

  it("still shows images for true", () => {
    render(<CarouselComposer defaultValue={[IMG("a")]} enableAltText />);
    expect(screen.getByPlaceholderText("Describe this image for people who can't see it")).toBeTruthy();
  });
});

describe("CC-5 pan", () => {
  const pointer = (el: Element, type: string, x: number, y = 0) =>
    act(() => {
      el.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          pointerId: 1,
          pointerType: "mouse",
          button: 0,
          clientX: x,
          clientY: y,
        }),
      );
    });
  const frame = (c: HTMLElement) => {
    const el = c.querySelector<HTMLElement>("[data-pan]")!;
    expect(el).toBeTruthy();
    el.getBoundingClientRect = () =>
      ({ width: 100, height: 100, top: 0, left: 0, right: 100, bottom: 100, x: 0, y: 0 }) as DOMRect;
    return el;
  };

  it("maths: 0.5 equals the 0.4.0 centred crop; offsets move the window", () => {
    expect(offsetCropRect(200, 100, 1, { x: 0.5, y: 0.5 })).toEqual(centredCropRect(200, 100, 1));
    expect(offsetCropRect(201, 100, 1)).toEqual({ x: 50, y: 0, width: 100, height: 100 });
    expect(offsetCropRect(200, 100, 1, { x: 0.75, y: 0 })).toEqual({ x: 75, y: 0, width: 100, height: 100 });
    expect(offsetCropRect(200, 100, 1, { x: 9, y: -3 })).toEqual({ x: 100, y: 0, width: 100, height: 100 });
  });

  it("drag moves the preview AND its rail thumb identically; export crop matches; callback fires", async () => {
    const ref = createRef<CarouselComposerHandle>();
    const onCropOffsetChange = vi.fn();
    const { container } = render(
      <CarouselComposer
        ref={ref}
        defaultValue={[IMG("a"), IMG("b")]}
        aspect="1:1"
        enablePan
        onCropOffsetChange={onCropOffsetChange}
      />,
    );
    fireEvent.click(thumbBtn(2));
    const f = frame(container);
    pointer(f, "pointerdown", 50);
    pointer(f, "pointermove", 25);
    // live, not committed yet
    expect(f.querySelector("img")!.style.objectPosition).toBe("75% 50%");
    expect(onCropOffsetChange).not.toHaveBeenCalled();
    pointer(f, "pointerup", 25);
    expect(onCropOffsetChange).toHaveBeenCalledWith("b", { x: 0.75, y: 0.5 });
    expect(f.querySelector("img")!.style.objectPosition).toBe("75% 50%");
    const railImg = thumbBtn(2).querySelector("img")!;
    expect(railImg.style.objectPosition).toBe("75% 50%");
    const out = await ref.current!.export();
    expect(out[1].crop).toEqual({ x: 75, y: 0, width: 100, height: 100 });
    expect(out[0].crop).toEqual({ x: 50, y: 0, width: 100, height: 100 });
  });

  it("keyboard: arrows move 5 %, Shift 20 %, physical axes; no overflow axis = ignored", () => {
    const onCropOffsetChange = vi.fn();
    const { container } = render(
      <CarouselComposer
        defaultValue={[IMG("a")]}
        aspect="1:1"
        enablePan
        onCropOffsetChange={onCropOffsetChange}
      />,
    );
    const f = frame(container);
    expect(f).toHaveAttribute("aria-label", "Reposition photo. Drag, or use the arrow keys.");
    expect(f.className).toContain("touch-pan-y"); // wide image: only x overflows
    expect(f.className).not.toContain("touch-none");
    f.focus();
    fireEvent.keyDown(f, { key: "ArrowRight" });
    expect(onCropOffsetChange).toHaveBeenLastCalledWith("a", { x: expect.closeTo(0.55, 5), y: 0.5 });
    fireEvent.keyDown(f, { key: "ArrowRight", shiftKey: true });
    expect(onCropOffsetChange).toHaveBeenLastCalledWith("a", { x: expect.closeTo(0.75, 5), y: 0.5 });
    const calls = onCropOffsetChange.mock.calls.length;
    const down = fireEvent.keyDown(f, { key: "ArrowDown" }); // image only overflows horizontally
    expect(down).toBe(true); // not prevented
    expect(onCropOffsetChange).toHaveBeenCalledTimes(calls);
  });

  it("a pointerdown on an overlay button does not start a pan", () => {
    const onCropOffsetChange = vi.fn();
    const { container } = render(
      <CarouselComposer
        defaultValue={[IMG("a")]}
        aspect="1:1"
        aspectOptions={["1:1", "4:5"]}
        enablePan
        onCropOffsetChange={onCropOffsetChange}
      />,
    );
    const f = frame(container);
    const btn = f.querySelector("button")!;
    expect(btn).toBeTruthy();
    pointer(btn, "pointerdown", 50);
    pointer(f, "pointermove", 10);
    pointer(f, "pointerup", 10);
    expect(onCropOffsetChange).not.toHaveBeenCalled();
  });

  it("not pannable: off by default, or the image already matches the ratio", () => {
    const off = render(<CarouselComposer defaultValue={[IMG("a")]} aspect="1:1" />);
    expect(off.container.querySelector("[data-pan]")).toBeNull();
    off.unmount();
    const on = render(<CarouselComposer defaultValue={[IMG("a")]} aspect="1:1" enablePan />);
    expect(on.container.querySelector("[data-pan]")).not.toBeNull();
    on.unmount();
    const match = render(<CarouselComposer defaultValue={[IMG("a", 100, 100)]} aspect="1:1" enablePan />);
    expect(match.container.querySelector("[data-pan]")).toBeNull();
  });

  it("updateItem: a url-only patch keeps the offset; a new size clears it unless the patch sets it", () => {
    const ref = createRef<CarouselComposerHandle>();
    render(
      <CarouselComposer
        ref={ref}
        defaultValue={[{ ...IMG("a"), cropOffset: { x: 0.2, y: 0.5 } }]}
        aspect="1:1"
      />,
    );
    act(() => ref.current!.updateItem("a", { alt: "x" }));
    expect(ref.current!.getItems()[0].cropOffset).toEqual({ x: 0.2, y: 0.5 });
    // an upload: same image, remote url
    act(() => ref.current!.updateItem("a", { url: "https://example.test/new.jpg", status: "uploaded" }));
    expect(ref.current!.getItems()[0].cropOffset).toEqual({ x: 0.2, y: 0.5 });
    // a different image (new pixel size)
    act(() => ref.current!.updateItem("a", { url: "https://example.test/n2.jpg", width: 300, height: 100 }));
    expect(ref.current!.getItems()[0].cropOffset).toBeUndefined();
    // new size AND an offset in the same patch: the patch wins
    act(() =>
      ref.current!.updateItem("a", { width: 50, height: 90, cropOffset: { x: 1, y: 1 } }),
    );
    expect(ref.current!.getItems()[0].cropOffset).toEqual({ x: 1, y: 1 });
  });

  it("clears the offset when an edit is applied", async () => {
    const ref = createRef<CarouselComposerHandle>();
    URL.createObjectURL = vi.fn(() => "blob:edited");
    URL.revokeObjectURL = vi.fn();
    function Panel({ item, onApply }: CarouselEditorPanelProps) {
      return (
        <button type="button" onClick={() => onApply(item.id, { url: "blob:edited", width: 100, height: 100 })}>
          apply
        </button>
      );
    }
    render(
      <CarouselComposer
        ref={ref}
        defaultValue={[{ ...IMG("a"), cropOffset: { x: 0.2, y: 0.5 } }]}
        aspect="1:1"
        editing={{ Panel }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.click(screen.getByRole("button", { name: "apply" }));
    expect(ref.current!.getItems()[0].cropOffset).toBeUndefined();
  });
});

describe("CC-6 Escape guard + onEditingChange", () => {
  let reportBusy: (b: boolean) => void = () => {};
  function SlowPanel({ onBusyChange, onCancel }: CarouselEditorPanelProps) {
    useEffect(() => {
      reportBusy = (b) => onBusyChange?.(b);
      onBusyChange?.(true);
    }, [onBusyChange]);
    return <button type="button" onClick={onCancel}>cancel-edit</button>;
  }
  function Host({ onEditingChange }: { onEditingChange?: (e: boolean) => void }) {
    const [open, setOpen] = useState(true);
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>host</DialogTitle>
          <CarouselComposer
            defaultValue={[IMG("a")]}
            editing={{ Panel: SlowPanel }}
            onEditingChange={onEditingChange}
          />
        </DialogContent>
      </Dialog>
    );
  }
  const esc = () =>
    act(() => {
      document.activeElement?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
      );
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
      );
    });

  it("Escape while busy keeps the Radix dialog open; after busy=false it closes (0.4.0)", () => {
    const onEditingChange = vi.fn();
    render(<Host onEditingChange={onEditingChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(onEditingChange).toHaveBeenCalledWith(true);
    esc();
    expect(screen.queryByRole("dialog")).not.toBeNull();
    act(() => reportBusy(false));
    esc();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("without any edit, Escape closes the dialog (not busy)", () => {
    render(<Host />);
    esc();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("removes its window listener on unmount and when the edit closes", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(
      <CarouselComposer defaultValue={[IMG("a")]} editing={{ Panel: SlowPanel }} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    const keydownAdds = () => add.mock.calls.filter((c) => c[0] === "keydown" && c[2] === true).length;
    const keydownRemoves = () => remove.mock.calls.filter((c) => c[0] === "keydown" && c[2] === true).length;
    expect(keydownAdds()).toBe(1);
    vi.useFakeTimers();
    unmount();
    // fix wave 2: the listener outlives the edit by a grace period (late-delivered Escape)
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    vi.useRealTimers();
    expect(keydownRemoves()).toBe(1);
  });

  it("onEditingChange: true on open, false on close; unmount while editing reports false once", () => {
    const onEditingChange = vi.fn();
    const first = render(
      <CarouselComposer
        defaultValue={[IMG("a")]}
        editing={{ Panel: SlowPanel }}
        onEditingChange={onEditingChange}
      />,
    );
    expect(onEditingChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.click(screen.getByRole("button", { name: "cancel-edit" }));
    expect(onEditingChange.mock.calls).toEqual([[true], [false]]);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    first.unmount();
    expect(onEditingChange.mock.calls).toEqual([[true], [false], [true], [false]]);
  });
});

describe("CC-7 reorderButtons", () => {
  const names = (ref: React.RefObject<CarouselComposerHandle | null>) =>
    ref.current!.getItems().map((i) => i.id);
  const items = () => [IMG("a"), IMG("b"), IMG("c")];

  it("renders nothing by default; the pair per thumb when on; hidden while editing", () => {
    const { container, rerender } = render(<CarouselComposer defaultValue={items()} />);
    expect(container.querySelectorAll("[data-thumb-move]")).toHaveLength(0);
    rerender(<CarouselComposer defaultValue={items()} reorderButtons />);
    expect(container.querySelectorAll("[data-thumb-move]")).toHaveLength(6);
  });

  it("move later reorders, fires onReorder + onMove, announces, keeps focus on the same button", async () => {
    const ref = createRef<CarouselComposerHandle>();
    const onReorder = vi.fn();
    const onMove = vi.fn();
    const { container } = render(
      <CarouselComposer ref={ref} defaultValue={items()} reorderButtons onReorder={onReorder} onMove={onMove} />,
    );
    const later1 = screen.getByRole("button", { name: "Move item 1 later" });
    later1.focus();
    await act(async () => {
      fireEvent.click(later1);
    });
    expect(names(ref)).toEqual(["b", "a", "c"]);
    expect(onReorder).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalledWith("a", 1);
    expect(container.querySelector("output")!.textContent).toBe("Item moved to position 2 of 3.");
    const active = document.activeElement as HTMLElement;
    expect(active.getAttribute("data-thumb-move")).toBe("later");
    expect(active.getAttribute("data-thumb-id")).toBe("a");
  });

  it("at the ends the button is aria-disabled, focusable, and a no-op", () => {
    const ref = createRef<CarouselComposerHandle>();
    const onMove = vi.fn();
    render(<CarouselComposer ref={ref} defaultValue={items()} reorderButtons onMove={onMove} />);
    const earlier1 = screen.getByRole("button", { name: "Move item 1 earlier" });
    expect(earlier1).toHaveAttribute("aria-disabled", "true");
    expect(earlier1).not.toBeDisabled();
    earlier1.focus();
    fireEvent.click(earlier1);
    expect(onMove).not.toHaveBeenCalled();
    expect(names(ref)).toEqual(["a", "b", "c"]);
    expect(document.activeElement).toBe(earlier1);
  });

  it("direction is logical: in RTL, earlier still moves towards item 1", async () => {
    const ref = createRef<CarouselComposerHandle>();
    render(<CarouselComposer ref={ref} defaultValue={items()} reorderButtons dir="rtl" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Move item 3 earlier" }));
    });
    expect(names(ref)).toEqual(["a", "c", "b"]);
  });

  it("handle.moveItem: clamps, ignores 0 / unknown ids, ignored while editing", () => {
    const ref = createRef<CarouselComposerHandle>();
    const onMove = vi.fn();
    function Panel() {
      return <div>panel</div>;
    }
    render(<CarouselComposer ref={ref} defaultValue={items()} onMove={onMove} editing={{ Panel }} />);
    act(() => ref.current!.moveItem("a", 99));
    expect(names(ref)).toEqual(["b", "c", "a"]);
    expect(onMove).toHaveBeenCalledWith("a", 2);
    act(() => ref.current!.moveItem("a", 0));
    act(() => ref.current!.moveItem("nope", 1));
    expect(onMove).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    act(() => ref.current!.moveItem("b", 1));
    expect(names(ref)).toEqual(["b", "c", "a"]);
  });
});
