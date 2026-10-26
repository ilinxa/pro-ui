/**
 * media-editor 0.6.0 slice A - EditorCanvas: crop frame fits the photo (#1),
 * image node re-cached on a fitted-size change (#11), onMediaRect /
 * onImagePainted / onImageError.
 */
import * as React from "react";
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EditorCanvas } from "../parts/editor-canvas";
import { fitCropToStage } from "../parts/tool-crop-overlay";

const h = vi.hoisted(() => ({
  size: { width: 400, height: 300 },
  nodes: [] as Array<{
    cache: ReturnType<typeof vi.fn>;
    clearCache: ReturnType<typeof vi.fn>;
    filters: ReturnType<typeof vi.fn>;
    batchDraw: ReturnType<typeof vi.fn>;
  }>,
}));

vi.mock("react-konva", () => {
  const Box = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  const Nothing = () => null;
  const ImageNode = ({ ref }: { ref?: React.Ref<unknown> }) => {
    React.useLayoutEffect(() => {
      const batchDraw = vi.fn();
      const node = {
        cache: vi.fn(),
        clearCache: vi.fn(),
        batchDraw,
        filters: vi.fn(),
        brightness: vi.fn(() => 0),
        contrast: vi.fn(() => 0),
        saturation: vi.fn(() => 0),
        hue: vi.fn(() => 0),
        blurRadius: vi.fn(() => 0),
        getLayer: () => ({ batchDraw }),
      };
      h.nodes.push(node);
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<unknown>).current = node;
    }, [ref]);
    return null;
  };
  return { Stage: Box, Layer: Box, Image: ImageNode, Line: Nothing, Text: Nothing, Transformer: Nothing };
});
vi.mock("../hooks/use-konva-stage-size", () => ({
  useKonvaStageSize: () => h.size,
}));

// ─── Fake image loading + rAF ─────────────────────────────────────────

class FakeImage {
  static all: FakeImage[] = [];
  static natural = { width: 800, height: 400 };
  crossOrigin = "";
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = FakeImage.natural.width;
  naturalHeight = FakeImage.natural.height;
  src = "";
  constructor() {
    FakeImage.all.push(this);
  }
  finish() {
    this.onload?.();
  }
  fail() {
    this.onerror?.();
  }
}

let rafQueue: Array<[number, FrameRequestCallback]> = [];
let rafId = 0;
function flushRaf() {
  const q = rafQueue;
  rafQueue = [];
  act(() => q.forEach(([, cb]) => cb(0)));
}

let originalImage: typeof window.Image;
beforeEach(() => {
  h.size = { width: 400, height: 300 };
  h.nodes = [];
  FakeImage.all = [];
  FakeImage.natural = { width: 800, height: 400 };
  rafQueue = [];
  rafId = 0;
  originalImage = window.Image;
  window.Image = FakeImage as unknown as typeof window.Image;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    rafQueue.push([++rafId, cb]);
    return rafId;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    rafQueue = rafQueue.filter(([i]) => i !== id);
  });
});
afterEach(() => {
  window.Image = originalImage;
  vi.unstubAllGlobals();
});

function load(index = FakeImage.all.length - 1) {
  act(() => FakeImage.all[index].finish());
}

// 800x400 photo in a 400x300 stage -> fit {0, 50, 400, 200}
const FIT = { x: 0, y: 50, width: 400, height: 200 };

describe("onMediaRect", () => {
  it("fires with the fitted rect once the image is shown, on change only", () => {
    const onMediaRect = vi.fn();
    const { rerender } = render(<EditorCanvas imageUrl="a.png" onMediaRect={onMediaRect} />);
    expect(onMediaRect).not.toHaveBeenCalled(); // nothing shown yet (null -> null is no change)
    load();
    expect(onMediaRect).toHaveBeenCalledTimes(1);
    expect(onMediaRect).toHaveBeenLastCalledWith(FIT);
    rerender(<EditorCanvas imageUrl="a.png" onMediaRect={onMediaRect} adjustments={undefined} className="x" />);
    expect(onMediaRect).toHaveBeenCalledTimes(1);
  });

  it("follows a stage resize and reports null when the image is cleared", () => {
    const onMediaRect = vi.fn();
    const { rerender } = render(<EditorCanvas imageUrl="a.png" onMediaRect={onMediaRect} />);
    load();
    h.size = { width: 200, height: 300 };
    rerender(<EditorCanvas imageUrl="a.png" onMediaRect={onMediaRect} />);
    expect(onMediaRect).toHaveBeenLastCalledWith({ x: 0, y: 100, width: 200, height: 100 });
    rerender(<EditorCanvas imageUrl={null} onMediaRect={onMediaRect} />);
    expect(onMediaRect).toHaveBeenLastCalledWith(null);
  });
});

describe("onImagePainted / onImageError", () => {
  it("fires once per loaded url, after the node is drawn and one frame", () => {
    const onImagePainted = vi.fn();
    render(<EditorCanvas imageUrl="a.png" onImagePainted={onImagePainted} />);
    load();
    expect(onImagePainted).not.toHaveBeenCalled(); // waits a frame
    expect(h.nodes[0].batchDraw).toHaveBeenCalled();
    flushRaf();
    expect(onImagePainted).toHaveBeenCalledTimes(1);
    expect(onImagePainted).toHaveBeenCalledWith("a.png", { width: 800, height: 400 });
    flushRaf();
    expect(onImagePainted).toHaveBeenCalledTimes(1);
  });

  it("does not report the previous image as the new url during a src change", () => {
    const onImagePainted = vi.fn();
    const { rerender } = render(<EditorCanvas imageUrl="a.png" onImagePainted={onImagePainted} />);
    load();
    flushRaf();
    onImagePainted.mockClear();
    rerender(<EditorCanvas imageUrl="b.png" onImagePainted={onImagePainted} />);
    flushRaf(); // old image still displayed, new one not loaded
    expect(onImagePainted).not.toHaveBeenCalled();
    FakeImage.natural = { width: 300, height: 300 };
    act(() => {
      FakeImage.all[1].naturalWidth = 300;
      FakeImage.all[1].naturalHeight = 300;
    });
    load();
    flushRaf();
    expect(onImagePainted).toHaveBeenCalledTimes(1);
    expect(onImagePainted).toHaveBeenCalledWith("b.png", { width: 300, height: 300 });
  });

  it("onImageError reports the failing url and never paints it", () => {
    const onImageError = vi.fn();
    const onImagePainted = vi.fn();
    render(<EditorCanvas imageUrl="bad.png" onImageError={onImageError} onImagePainted={onImagePainted} />);
    act(() => FakeImage.all[0].fail());
    flushRaf();
    expect(onImageError).toHaveBeenCalledWith("bad.png");
    expect(onImagePainted).not.toHaveBeenCalled();
  });
});

const ACTIVE = { brightness: 0.3, contrast: 0, saturation: 0, blur: 0 };
const NEUTRAL = { brightness: 0, contrast: 0, saturation: 0, blur: 0 };

describe("filter cache (#11)", () => {
  it("re-caches when the fitted size changes and not when it does not", () => {
    const { rerender } = render(<EditorCanvas imageUrl="a.png" adjustments={ACTIVE} />);
    load();
    const node = h.nodes[0];
    const before = node.cache.mock.calls.length;
    expect(before).toBeGreaterThan(0);
    rerender(<EditorCanvas imageUrl="a.png" adjustments={ACTIVE} className="same-size" />);
    expect(node.cache.mock.calls.length).toBe(before);
    h.size = { width: 200, height: 300 };
    rerender(<EditorCanvas imageUrl="a.png" adjustments={ACTIVE} />);
    expect(node.cache.mock.calls.length).toBe(before + 1);
    expect(node.clearCache).toHaveBeenCalled();
  });
});

describe("cache only when filtered (R2)", () => {
  it("never caches a plain image (full-resolution draw), and clears the filter list", () => {
    render(<EditorCanvas imageUrl="a.png" adjustments={NEUTRAL} />);
    load();
    const node = h.nodes[0];
    expect(node.cache).not.toHaveBeenCalled();
    expect(node.clearCache).toHaveBeenCalled();
    expect(node.filters).toHaveBeenLastCalledWith([]);
  });

  it("caches when an adjustment is active, and drops the cache when it is reset", () => {
    const { rerender } = render(<EditorCanvas imageUrl="a.png" adjustments={ACTIVE} />);
    load();
    const node = h.nodes[0];
    expect(node.cache).toHaveBeenCalledTimes(1);
    expect(node.filters.mock.lastCall?.[0]).toHaveLength(1);
    node.clearCache.mockClear();
    rerender(<EditorCanvas imageUrl="a.png" adjustments={NEUTRAL} />);
    expect(node.cache).toHaveBeenCalledTimes(1);
    expect(node.clearCache).toHaveBeenCalled();
    expect(node.filters).toHaveBeenLastCalledWith([]);
  });

  it("caches when a filter preset is active", () => {
    const preset = { id: "p", label: "P", konvaFilters: [{ name: "Grayscale" }] };
    render(<EditorCanvas imageUrl="a.png" activeFilter={preset} adjustments={NEUTRAL} />);
    load();
    expect(h.nodes[0].cache).toHaveBeenCalledTimes(1);
  });

  it("an empty preset (Original) is a plain image", () => {
    const preset = { id: "original", label: "Original", konvaFilters: [] };
    render(<EditorCanvas imageUrl="a.png" activeFilter={preset} adjustments={NEUTRAL} />);
    load();
    expect(h.nodes[0].cache).not.toHaveBeenCalled();
  });
});

describe("hidden container (R4)", () => {
  it("a 0x0 stage with a loaded image does not report a null media rect", () => {
    const onMediaRect = vi.fn();
    const { rerender } = render(<EditorCanvas imageUrl="a.png" onMediaRect={onMediaRect} />);
    load();
    expect(onMediaRect).toHaveBeenLastCalledWith(FIT);
    onMediaRect.mockClear();
    h.size = { width: 0, height: 0 };
    rerender(<EditorCanvas imageUrl="a.png" onMediaRect={onMediaRect} />);
    expect(onMediaRect).not.toHaveBeenCalled();
    // visible again -> reports the new rect
    h.size = { width: 200, height: 300 };
    rerender(<EditorCanvas imageUrl="a.png" onMediaRect={onMediaRect} />);
    expect(onMediaRect).toHaveBeenLastCalledWith({ x: 0, y: 100, width: 200, height: 100 });
  });

  it("still reports null when no image is shown", () => {
    const onMediaRect = vi.fn();
    const { rerender } = render(<EditorCanvas imageUrl="a.png" onMediaRect={onMediaRect} />);
    load();
    rerender(<EditorCanvas imageUrl={null} onMediaRect={onMediaRect} />);
    expect(onMediaRect).toHaveBeenLastCalledWith(null);
  });
});

describe("onImagePainted without rAF (R16)", () => {
  it("falls back to a short timer when requestAnimationFrame never fires, once", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    try {
      const onImagePainted = vi.fn();
      render(<EditorCanvas imageUrl="a.png" onImagePainted={onImagePainted} />);
      load();
      expect(onImagePainted).not.toHaveBeenCalled();
      act(() => {
        vi.advanceTimersByTime(99);
      });
      expect(onImagePainted).not.toHaveBeenCalled();
      act(() => {
        vi.advanceTimersByTime(2);
      });
      expect(onImagePainted).toHaveBeenCalledTimes(1);
      flushRaf(); // a late frame must not fire it again
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(onImagePainted).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("the frame wins when it comes first, and the timer then stays quiet", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    try {
      const onImagePainted = vi.fn();
      render(<EditorCanvas imageUrl="a.png" onImagePainted={onImagePainted} />);
      load();
      flushRaf();
      expect(onImagePainted).toHaveBeenCalledTimes(1);
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(onImagePainted).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("crop frame (#1)", () => {
  it("auto-inits at 80 % of the photo's displayed rect, centred on it", () => {
    const onCropChange = vi.fn();
    render(<EditorCanvas imageUrl="a.png" cropActive cropRect={null} onCropChange={onCropChange} />);
    onCropChange.mockClear(); // any stage-fallback init before the photo is known
    load();
    expect(onCropChange).toHaveBeenLastCalledWith({ x: 40, y: 70, width: 320, height: 160 });
  });

  it("honours the aspect lock inside the 80 % box", () => {
    const onCropChange = vi.fn();
    render(<EditorCanvas imageUrl="a.png" cropActive cropRect={null} cropAspectRatio={1} onCropChange={onCropChange} />);
    onCropChange.mockClear();
    load();
    expect(onCropChange).toHaveBeenLastCalledWith({ x: 120, y: 70, width: 160, height: 160 });
  });

  it("sizes the frame from the photo, not the stage, for a tall photo", () => {
    FakeImage.natural = { width: 400, height: 800 }; // fit {125, 0, 150, 300}
    const onCropChange = vi.fn();
    render(<EditorCanvas imageUrl="a.png" cropActive cropRect={null} onCropChange={onCropChange} />);
    onCropChange.mockClear();
    act(() => {
      FakeImage.all[0].naturalWidth = 400;
      FakeImage.all[0].naturalHeight = 800;
    });
    load();
    expect(onCropChange).toHaveBeenLastCalledWith({ x: 140, y: 30, width: 120, height: 240 });
  });

  it("falls back to 80 % of the stage when no image is shown", () => {
    const onCropChange = vi.fn();
    render(<EditorCanvas imageUrl={null} cropActive cropRect={null} onCropChange={onCropChange} />);
    expect(onCropChange).toHaveBeenLastCalledWith({ x: 40, y: 30, width: 320, height: 240 });
  });

  function dragFrame(container: HTMLElement, from: [number, number], to: [number, number], handle?: string) {
    const target = handle
      ? container.querySelector<HTMLElement>(`button[aria-label*="${handle}"]`)!
      : container.querySelector<HTMLElement>(".cursor-move")!;
    const root = target.closest(".pointer-events-none") as HTMLElement;
    const ev = (type: string, x: number, y: number) =>
      new MouseEvent(type, { bubbles: true, clientX: x, clientY: y });
    fireEvent(target, ev("pointerdown", ...from));
    fireEvent(root, ev("pointermove", ...to));
    fireEvent(root, ev("pointerup", ...to));
  }

  it("clamps a move to the photo's rect, not the stage", () => {
    const onCropChange = vi.fn();
    const { container } = render(
      <EditorCanvas imageUrl="a.png" cropActive cropRect={{ x: 100, y: 100, width: 100, height: 50 }} onCropChange={onCropChange} />,
    );
    load();
    onCropChange.mockClear();
    dragFrame(container, [0, 0], [0, 500]); // far down
    expect(onCropChange).toHaveBeenLastCalledWith({ x: 100, y: FIT.y + FIT.height - 50, width: 100, height: 50 });
    dragFrame(container, [0, 0], [0, -500]); // far up
    expect(onCropChange).toHaveBeenLastCalledWith({ x: 100, y: FIT.y, width: 100, height: 50 });
  });

  it("clamps a corner resize to the photo's rect", () => {
    const onCropChange = vi.fn();
    const { container } = render(
      <EditorCanvas imageUrl="a.png" cropActive cropRect={{ x: 100, y: 100, width: 100, height: 50 }} onCropChange={onCropChange} />,
    );
    load();
    onCropChange.mockClear();
    dragFrame(container, [0, 0], [900, 900], "SE");
    const last = onCropChange.mock.calls.at(-1)![0];
    // grows to the photo's bottom-right (250), not the stage's (300), without sliding the anchor
    expect(last).toEqual({ x: 100, y: 100, width: 300, height: 150 });
  });
});

describe("fitCropToStage bounds", () => {
  it("is unchanged without bounds", () => {
    expect(fitCropToStage("1:1", 400, 300)).toEqual({ x: 50, y: 0, width: 300, height: 300 });
    expect(fitCropToStage("free", 400, 300)).toEqual({ x: 0, y: 0, width: 400, height: 300 });
  });

  it("fits inside bounds when given", () => {
    expect(fitCropToStage("1:1", 400, 300, FIT)).toEqual({ x: 100, y: 50, width: 200, height: 200 });
    expect(fitCropToStage("free", 400, 300, FIT)).toEqual(FIT);
    expect(fitCropToStage("16:9", 400, 300, { x: 10, y: 10, width: 160, height: 160 })).toEqual({
      x: 10,
      y: 10 + (160 - 90) / 2,
      width: 160,
      height: 90,
    });
  });
});
