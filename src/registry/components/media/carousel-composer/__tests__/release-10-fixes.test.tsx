/**
 * carousel-composer 0.5.0 fix wave (release 10, finder B): B2 trim keeps the pan framing,
 * B3 re-edit busy ordering, B4/B7 move pair geometry + reveal, B5 touch-action per axis,
 * B6 TR / AR label coverage, B8 stale focus request, B9 pan edges.
 * jsdom has no layout: geometry is asserted on classes (the browser pass measures).
 */
import { forwardRef, useImperativeHandle } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const hooks = vi.hoisted(() => ({
  editor: null as null | Record<string, unknown>,
}));
vi.mock("@/registry/components/media/media-editor/media-editor", () => ({
  MediaEditor: forwardRef(function MockMediaEditor(_props: Record<string, unknown>, ref) {
    useImperativeHandle(ref, () => hooks.editor as never);
    return null;
  }),
}));

import { CarouselComposer } from "../carousel-composer";
import { CarouselEditPanel } from "../features/editing";
import { arabicLabels, turkishLabels } from "../dummy-data";
import { defaultCarouselComposerLabels } from "../types";
import type { MediaCarouselItem } from "../types";

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
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const panelLabels = { editDone: "Done", editCancel: "Cancel", editSaving: "Saving", editError: "Error" };

describe("B2 edit panel trims with the author's cropOffset", () => {
  it("an item panned to x 0 is cut from x 0, not from the centre", async () => {
    const drawImage = vi.fn();
    vi.stubGlobal("createImageBitmap", vi.fn(async () => ({ close() {} })));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage } as never);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((cb) =>
      cb(new Blob(["x"], { type: "image/jpeg" })),
    );
    URL.createObjectURL = vi.fn(() => "blob:cut");
    const exportImage = vi.fn(async () => ({
      blob: new Blob(["full"], { type: "image/jpeg" }),
      metadata: { width: 200, height: 100, mimeType: "image/jpeg" },
    }));
    hooks.editor = {
      exportImage,
      getState: () => ({}),
      getSourceBlob: () => null,
      loadState: () => {},
    };
    const onApply = vi.fn();
    render(
      <CarouselEditPanel
        item={{ ...IMG("a"), cropOffset: { x: 0, y: 0.5 } }}
        aspect="1:1"
        aspectRatio={1}
        labels={panelLabels}
        onApply={onApply}
        onCancel={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    await waitFor(() => expect(onApply).toHaveBeenCalled());
    expect(drawImage).toHaveBeenCalledTimes(1);
    const args = drawImage.mock.calls[0] as unknown[];
    expect(args.slice(1)).toEqual([0, 0, 100, 100, 0, 0, 100, 100]); // sx starts at 0
    expect(onApply.mock.calls[0][1]).toMatchObject({ width: 100, height: 100 });
  });
});

describe("B3 re-edit reports busy until the editor settles after loadState", () => {
  it("whenSettled is awaited only after loadState has started", async () => {
    let loaded = false;
    let settle: () => void = () => {};
    hooks.editor = {
      loadState: () => {
        loaded = true;
      },
      // Before loadState the editor looks settled already — the old ordering read that.
      whenSettled: () => (loaded ? new Promise<void>((r) => (settle = r)) : Promise.resolve()),
      exportImage: async () => null,
      getState: () => ({}),
      getSourceBlob: () => null,
    };
    const onBusyChange = vi.fn();
    render(
      <CarouselEditPanel
        item={{ ...IMG("a"), editorState: { imageSrc: "blob:dead" } as never }}
        aspect="1:1"
        aspectRatio={1}
        labels={panelLabels}
        onApply={() => {}}
        onCancel={() => {}}
        onBusyChange={onBusyChange}
      />,
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(loaded).toBe(true);
    expect(onBusyChange.mock.calls.every((c) => c[0] === true)).toBe(true);
    await act(async () => {
      settle();
    });
    expect(onBusyChange).toHaveBeenLastCalledWith(false);
  });
});

describe("B4 / B7 move pair", () => {
  const pairOf = (c: HTMLElement) => c.querySelector<HTMLElement>("[data-thumb-move-pair]")!;

  it("is revealed on thumb hover (the thumb is a group) and gets pointer events then", () => {
    const { container } = render(
      <CarouselComposer defaultValue={[IMG("a"), IMG("b")]} aspect="1:1" reorderButtons />,
    );
    const pair = pairOf(container);
    expect(pair).toBeTruthy();
    expect(pair.className).toContain("pointer-events-none"); // hidden at rest: no stray hits
    expect(pair.className).toContain("group-hover:pointer-events-auto");
    expect(pair.className).toContain("group-hover:opacity-100");
    expect(pair.className).toContain("focus-within:opacity-100");
    expect(pair.parentElement!.className.split(/\s+/)).toContain("group");
  });

  it("narrow thumbs (9:16, 4:5) put the pair in the band between remove and grip; wide ones on the bottom row", () => {
    for (const aspect of ["9:16", "4:5"] as const) {
      const { container, unmount } = render(
        <CarouselComposer defaultValue={[IMG("a", 90, 160)]} aspect={aspect} reorderButtons />,
      );
      const pair = pairOf(container);
      expect(pair.className).toContain("top-5");
      expect(pair.className).not.toContain("top-0.5");
      expect(pair.className).not.toContain("start-0.5");
      const btn = pair.querySelector("button")!;
      expect(btn.className).toContain("size-4");
      unmount();
    }
    const wide = render(<CarouselComposer defaultValue={[IMG("a")]} aspect="16:9" reorderButtons />);
    const wpair = pairOf(wide.container);
    expect(wpair.className).toContain("bottom-0.5");
    expect(wpair.className).not.toContain("top-5");
  });
});

describe("B5 touch-action follows the overflow axis", () => {
  const frameOf = (c: HTMLElement) => c.querySelector<HTMLElement>("[data-pan]")!;
  it("wide image in a square frame: touch-pan-y; tall image: touch-pan-x; never touch-none", () => {
    const wide = render(<CarouselComposer defaultValue={[IMG("a", 200, 100)]} aspect="1:1" enablePan />);
    expect(frameOf(wide.container).className).toContain("touch-pan-y");
    expect(frameOf(wide.container).className).not.toContain("touch-none");
    wide.unmount();
    const tall = render(<CarouselComposer defaultValue={[IMG("a", 100, 200)]} aspect="1:1" enablePan />);
    expect(frameOf(tall.container).className).toContain("touch-pan-x");
    expect(frameOf(tall.container).className).not.toContain("touch-none");
  });
});

describe("B6 TR / AR bundles cover every label key", () => {
  const keysOf = (o: object, prefix = ""): string[] =>
    Object.entries(o).flatMap(([k, v]) =>
      v !== null && typeof v === "object" ? keysOf(v, `${prefix}${k}.`) : [`${prefix}${k}`],
    );
  it.each([
    ["turkish", turkishLabels],
    ["arabic", arabicLabels],
  ])("%s has every key of the defaults", (_n, bundle) => {
    const expected = keysOf(defaultCarouselComposerLabels);
    expect(expected.length).toBeGreaterThan(20);
    const have = new Set(keysOf(bundle));
    expect(expected.filter((k) => !have.has(k))).toEqual([]);
  });
});

describe("B8 a stale focus request never steals focus", () => {
  it("a controlled host that ignores onChange: a later unrelated change leaves focus alone", () => {
    const onChange = vi.fn();
    const a = IMG("a");
    const items = [a, IMG("b"), IMG("c")];
    const { rerender } = render(<CarouselComposer value={items} onChange={onChange} reorderButtons />);
    const later = screen.getByRole("button", { name: "Move item 1 later" });
    later.focus();
    fireEvent.click(later);
    expect(onChange).toHaveBeenCalledTimes(1); // the move was asked for, then rejected
    const elsewhere = screen.getAllByRole("button").find((b) => b.hasAttribute("data-thumb-select"))!;
    elsewhere.focus();
    expect(document.activeElement).toBe(elsewhere);
    // unrelated change: alt of item c
    rerender(
      <CarouselComposer value={[a, IMG("b"), { ...IMG("c"), alt: "x" }]} onChange={onChange} reorderButtons />,
    );
    expect(document.activeElement).toBe(elsewhere);
  });
});

describe("B9 pan edges", () => {
  const pointer = (el: Element, type: string, x: number, id = 1) =>
    act(() => {
      el.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          pointerId: id,
          pointerType: "mouse",
          button: 0,
          clientX: x,
          clientY: 0,
        }),
      );
    });
  const frame = (c: HTMLElement) => {
    const el = c.querySelector<HTMLElement>("[data-pan]")!;
    el.getBoundingClientRect = () =>
      ({ width: 100, height: 100, top: 0, left: 0, right: 100, bottom: 100, x: 0, y: 0 }) as DOMRect;
    return el;
  };
  const pos = (f: HTMLElement) => f.querySelector("img")!.style.objectPosition;

  it("(a) the dragged offset stays until the host's value catches up (no snap-back)", () => {
    const onChange = vi.fn();
    const onCrop = vi.fn();
    const base = [IMG("a")];
    const { container, rerender } = render(
      <CarouselComposer value={base} onChange={onChange} aspect="1:1" enablePan onCropOffsetChange={onCrop} />,
    );
    const f = frame(container);
    pointer(f, "pointerdown", 50);
    pointer(f, "pointermove", 25);
    pointer(f, "pointerup", 25);
    expect(onCrop).toHaveBeenCalledWith("a", { x: 0.75, y: 0.5 });
    expect(pos(f)).toBe("75% 50%"); // host has not echoed yet
    rerender(
      <CarouselComposer
        value={[{ ...IMG("a"), cropOffset: { x: 0.75, y: 0.5 } }]}
        onChange={onChange}
        aspect="1:1"
        enablePan
        onCropOffsetChange={onCrop}
      />,
    );
    expect(pos(f)).toBe("75% 50%");
  });

  it("(b) rapid arrow presses step from the pending offset, not the stale committed one", () => {
    const onCrop = vi.fn();
    const { container } = render(
      <CarouselComposer value={[IMG("a")]} onChange={() => {}} aspect="1:1" enablePan onCropOffsetChange={onCrop} />,
    );
    const f = frame(container);
    f.focus();
    fireEvent.keyDown(f, { key: "ArrowRight" });
    fireEvent.keyDown(f, { key: "ArrowRight" });
    expect(onCrop.mock.calls[0][1].x).toBeCloseTo(0.55, 5);
    expect(onCrop.mock.calls[1][1].x).toBeCloseTo(0.6, 5);
  });

  it("(c) losing pointer capture cancels the drag", () => {
    const onCrop = vi.fn();
    const { container } = render(
      <CarouselComposer defaultValue={[IMG("a")]} aspect="1:1" enablePan onCropOffsetChange={onCrop} />,
    );
    const f = frame(container);
    pointer(f, "pointerdown", 50);
    pointer(f, "pointermove", 25);
    expect(pos(f)).toBe("75% 50%");
    pointer(f, "lostpointercapture", 25);
    pointer(f, "pointerup", 25);
    expect(onCrop).not.toHaveBeenCalled();
    expect(f.querySelector("img")!.style.objectPosition).toBe("");
  });

  it("(d) a second pointer does not overwrite the drag in progress", () => {
    const onCrop = vi.fn();
    const { container } = render(
      <CarouselComposer defaultValue={[IMG("a")]} aspect="1:1" enablePan onCropOffsetChange={onCrop} />,
    );
    const f = frame(container);
    pointer(f, "pointerdown", 50, 1);
    pointer(f, "pointermove", 25, 1);
    pointer(f, "pointerdown", 90, 2);
    pointer(f, "pointermove", 25, 1);
    pointer(f, "pointerup", 25, 1);
    expect(onCrop).toHaveBeenCalledWith("a", { x: 0.75, y: 0.5 });
  });
});
