// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type Konva from "konva";
import { exportPhotoBlob, renderPhoto } from "../lib/export-blob";

type Call = [string, ...unknown[]];
let log: Call[];
let outSize: { width: number; height: number } | null;

beforeEach(() => {
  log = [];
  outSize = null;
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation((() => {
    const ctx: Record<string, unknown> = {
      fillRect: (...a: unknown[]) => log.push(["fillRect", ...a]),
      drawImage: (...a: unknown[]) => log.push(["drawImage", ...a.slice(1)]),
    };
    Object.defineProperty(ctx, "fillStyle", { set: (v) => log.push(["fillStyle", v]), get: () => "" });
    Object.defineProperty(ctx, "globalCompositeOperation", {
      set: (v) => log.push(["composite", v]),
      get: () => "source-over",
    });
    return ctx;
  }) as never);
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (
    this: HTMLCanvasElement,
    cb: BlobCallback,
    type?: string,
  ) {
    outSize = { width: this.width, height: this.height };
    log.push(["toBlob", type]);
    cb(new Blob(["x"], { type }));
  } as never);
});
afterEach(() => vi.restoreAllMocks());

function fakeStage(src = { width: 600, height: 400 }) {
  const toCanvas = vi.fn((cfg: unknown) => {
    log.push(["toCanvas", cfg]);
    const c = document.createElement("canvas");
    c.width = src.width;
    c.height = src.height;
    return c;
  });
  const stage = { toCanvas, width: () => 300, height: () => 200 } as unknown as Konva.Stage;
  return { stage, toCanvas };
}

/** A stand-in for a Konva node's `visible()` accessor. */
function fakeNode(initial: boolean | "inherit") {
  let v = initial;
  return {
    visible: vi.fn((next?: boolean | "inherit") => {
      if (next === undefined) return v;
      v = next;
      return undefined;
    }),
    get current() {
      return v;
    },
  };
}

/** A stage that knows the editor's named nodes; `toCanvas` records the scene state. */
function sceneStage(
  opts: { cached?: boolean; imgW?: number; imgH?: number; throwOnRender?: boolean } = {},
) {
  const { cached = true, imgW = 400, imgH = 300, throwOnRender = false } = opts;
  const layer = fakeNode("inherit");
  const transformer = fakeNode(true);
  let isCached = cached;
  const image = {
    isCached: vi.fn(() => isCached),
    clearCache: vi.fn(() => {
      isCached = false;
      log.push(["clearCache"]);
    }),
    cache: vi.fn((cfg?: { pixelRatio?: number }) => {
      isCached = true;
      log.push(["cache", cfg?.pixelRatio]);
    }),
    width: () => imgW,
    height: () => imgH,
  };
  const toCanvas = vi.fn(() => {
    log.push(["toCanvas", layer.current, transformer.current]);
    if (throwOnRender) throw new Error("boom");
    const c = document.createElement("canvas");
    c.width = 600;
    c.height = 400;
    return c;
  });
  const stage = {
    toCanvas,
    width: () => 300,
    height: () => 200,
    find: (sel: string) =>
      sel === ".media-editor-ui-layer" ? [layer] : sel === ".media-editor-transformer" ? [transformer] : [],
    findOne: (sel: string) => (sel === ".media-editor-base-image" ? image : undefined),
  } as unknown as Konva.Stage;
  return { stage, layer, transformer, image, toCanvas };
}

const RECT = { x: 0, y: 0, width: 300, height: 200 };

describe("renderPhoto", () => {
  it("renders the rect at pixelRatio, then draws into exactly width x height", async () => {
    const { stage, toCanvas } = fakeStage();
    const onProgress = vi.fn();
    const r = await renderPhoto({
      stage,
      rect: { x: 10, y: 20, width: 300, height: 200 },
      pixelRatio: 2,
      width: 123,
      height: 77,
      mimeType: "image/png",
      onProgress,
    });
    expect(toCanvas).toHaveBeenCalledWith({ x: 10, y: 20, width: 300, height: 200, pixelRatio: 2 });
    expect([r.width, r.height]).toEqual([123, 77]);
    expect(outSize).toEqual({ width: 123, height: 77 });
    expect(log.find((c) => c[0] === "drawImage")).toEqual(["drawImage", 0, 0, 600, 400, 0, 0, 123, 77]);
    expect(onProgress.mock.calls).toEqual([[0], [1]]);
    expect(log.find((c) => c[0] === "toBlob")?.[1]).toBe("image/png");
  });

  it("fills the background before drawing, only when given", async () => {
    const { stage } = fakeStage();
    // 300x200 target vs the 600x400 render -> the re-draw path
    const base = { stage, rect: RECT, pixelRatio: 2, width: 300, height: 200 };
    await renderPhoto({ ...base, backgroundColor: "teal" });
    const names = log.map((c) => c[0]);
    expect(log.find((c) => c[0] === "fillStyle")?.[1]).toBe("rgb(0, 128, 128)"); // resolved via computed style
    expect(names.indexOf("fillRect")).toBeGreaterThan(-1);
    expect(names.indexOf("fillRect")).toBeLessThan(names.indexOf("drawImage"));
    log.length = 0;
    await renderPhoto(base);
    expect(log.some((c) => c[0] === "fillRect")).toBe(false);
  });

  it("defaults to jpeg", async () => {
    const { stage } = fakeStage();
    await renderPhoto({ stage, rect: { x: 0, y: 0, width: 1, height: 1 }, pixelRatio: 1, width: 1, height: 1 });
    expect(log.find((c) => c[0] === "toBlob")?.[1]).toBe("image/jpeg");
  });
});

describe("exportPhotoBlob backgroundColor", () => {
  it("fills the background and keeps the region x pixelRatio size", async () => {
    const { stage } = fakeStage();
    const blob = await exportPhotoBlob({ stage, cropRect: { x: 0, y: 0, width: 150, height: 100 }, pixelRatio: 2, backgroundColor: "navy" });
    expect(blob).toBeInstanceOf(Blob);
    expect(outSize).toEqual({ width: 300, height: 200 });
    expect(log.find((c) => c[0] === "fillStyle")?.[1]).toBe("rgb(0, 0, 128)");
  });

  it("without a background it stays on the original path (no fill, no re-draw)", async () => {
    const { stage } = fakeStage();
    await exportPhotoBlob({ stage, pixelRatio: 2 });
    expect(log.some((c) => c[0] === "fillRect" || c[0] === "drawImage")).toBe(false);
  });
});

describe("renderPhoto single-canvas reuse (R3)", () => {
  it("encodes the Konva canvas itself when it already has the target size", async () => {
    const { stage } = fakeStage();
    const r = await renderPhoto({ stage, rect: RECT, pixelRatio: 2, width: 600, height: 400 });
    expect([r.width, r.height]).toEqual([600, 400]);
    expect(log.some((c) => c[0] === "drawImage")).toBe(false);
    expect(outSize).toEqual({ width: 600, height: 400 });
  });

  it("with a fill, paints behind the existing pixels on that same canvas", async () => {
    const { stage } = fakeStage();
    await renderPhoto({ stage, rect: RECT, pixelRatio: 2, width: 600, height: 400, backgroundColor: "teal" });
    const names = log.map((c) => c[0]);
    expect(log.find((c) => c[0] === "composite")?.[1]).toBe("destination-over");
    expect(names.indexOf("composite")).toBeLessThan(names.indexOf("fillRect"));
    expect(names).not.toContain("drawImage");
  });

  it("re-draws into a new canvas when the sizes differ by a pixel", async () => {
    const { stage } = fakeStage({ width: 599, height: 400 });
    await renderPhoto({ stage, rect: RECT, pixelRatio: 2, width: 600, height: 400 });
    expect(log.some((c) => c[0] === "drawImage")).toBe(true);
    expect(outSize).toEqual({ width: 600, height: 400 });
  });
});

describe("export scene: cached base image (R2)", () => {
  it("re-caches the image at the export ratio for the render, then restores the normal cache", async () => {
    const s = sceneStage();
    await renderPhoto({ stage: s.stage, rect: RECT, pixelRatio: 5, width: 600, height: 400 });
    const seq = log
      .filter((c) => ["clearCache", "cache", "toCanvas"].includes(c[0] as string))
      .map((c) => (c[0] === "cache" ? ["cache", c[1]] : [c[0]]));
    expect(seq).toEqual([["clearCache"], ["cache", 5], ["toCanvas"], ["clearCache"], ["cache", undefined]]);
  });

  it("caps the cache ratio so the cache canvas stays under the pixel limit", async () => {
    const s = sceneStage({ imgW: 4000, imgH: 3000 }); // 12 MP node at ratio 1
    await renderPhoto({ stage: s.stage, rect: RECT, pixelRatio: 4, width: 600, height: 400 });
    const ratio = log.find((c) => c[0] === "cache")![1] as number;
    expect(ratio).toBeLessThan(4);
    expect(4000 * 3000 * ratio * ratio).toBeLessThanOrEqual(16_777_216 * 1.0001);
  });

  it("leaves an uncached image untouched", async () => {
    const s = sceneStage({ cached: false });
    await renderPhoto({ stage: s.stage, rect: RECT, pixelRatio: 2, width: 600, height: 400 });
    expect(s.image.clearCache).not.toHaveBeenCalled();
    expect(s.image.cache).not.toHaveBeenCalled();
  });

  it("restores the cache even when the render throws", async () => {
    const s = sceneStage({ throwOnRender: true });
    expect(() =>
      renderPhoto({ stage: s.stage, rect: RECT, pixelRatio: 2, width: 600, height: 400 }),
    ).toThrow("boom");
    expect(s.image.cache).toHaveBeenLastCalledWith();
    expect(s.image.clearCache).toHaveBeenCalledTimes(2);
  });

  it("exportPhotoBlob does the same on its direct path", async () => {
    const s = sceneStage();
    await exportPhotoBlob({ stage: s.stage, pixelRatio: 3 });
    expect(s.image.cache).toHaveBeenNthCalledWith(1, { pixelRatio: 3 });
    expect(s.image.cache).toHaveBeenLastCalledWith();
  });
});

describe("export scene: selection UI hidden (R15)", () => {
  it("hides the UI layer and the transformer for the render and restores their state", async () => {
    const s = sceneStage();
    await renderPhoto({ stage: s.stage, rect: RECT, pixelRatio: 2, width: 600, height: 400 });
    expect(log.find((c) => c[0] === "toCanvas")).toEqual(["toCanvas", false, false]);
    expect(s.layer.current).toBe("inherit");
    expect(s.transformer.current).toBe(true);
  });

  it("restores visibility when the render throws", async () => {
    const s = sceneStage({ throwOnRender: true });
    expect(() => exportPhotoBlob({ stage: s.stage })).toThrow("boom");
    expect(s.layer.current).toBe("inherit");
    expect(s.transformer.current).toBe(true);
  });

  it("exportPhotoBlob (no background) hides them too", async () => {
    const s = sceneStage();
    await exportPhotoBlob({ stage: s.stage });
    expect(log.find((c) => c[0] === "toCanvas")).toEqual(["toCanvas", false, false]);
  });
});

describe("backgroundColor resolution (R13)", () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  const base = { rect: RECT, pixelRatio: 2, width: 300, height: 200 };

  it("resolves var() / oklch() through computed style", async () => {
    vi.spyOn(window, "getComputedStyle").mockReturnValue({ backgroundColor: "rgb(10, 20, 30)" } as CSSStyleDeclaration);
    const { stage } = fakeStage();
    await renderPhoto({ ...base, stage, backgroundColor: "var(--surface)" });
    expect(log.find((c) => c[0] === "fillStyle")?.[1]).toBe("rgb(10, 20, 30)");
    expect(warn).not.toHaveBeenCalled();
  });

  it("an invalid colour -> no fill and one dev warning, never black", async () => {
    const { stage } = fakeStage();
    await renderPhoto({ ...base, stage, backgroundColor: "definitely not a colour" });
    expect(log.some((c) => c[0] === "fillRect")).toBe(false);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("a var() that resolves to nothing -> no fill and a warning", async () => {
    vi.spyOn(window, "getComputedStyle").mockReturnValue({ backgroundColor: "rgba(0, 0, 0, 0)" } as CSSStyleDeclaration);
    const { stage } = fakeStage();
    await renderPhoto({ ...base, stage, backgroundColor: "var(--missing)" });
    expect(log.some((c) => c[0] === "fillRect")).toBe(false);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("transparent is simply no fill, no warning", async () => {
    vi.spyOn(window, "getComputedStyle").mockReturnValue({ backgroundColor: "rgba(0, 0, 0, 0)" } as CSSStyleDeclaration);
    const { stage } = fakeStage();
    await renderPhoto({ ...base, stage, backgroundColor: "transparent" });
    expect(log.some((c) => c[0] === "fillRect")).toBe(false);
    expect(warn).not.toHaveBeenCalled();
  });

  it("a var() resolving to the space-syntax transparent rgb(0 0 0 / 0) -> no fill and a warning", async () => {
    vi.spyOn(window, "getComputedStyle").mockReturnValue({ backgroundColor: "rgb(0 0 0 / 0)" } as CSSStyleDeclaration);
    const { stage } = fakeStage();
    await renderPhoto({ ...base, stage, backgroundColor: "var(--missing)" });
    expect(log.some((c) => c[0] === "fillRect")).toBe(false);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("exportPhotoBlob resolves too", async () => {
    vi.spyOn(window, "getComputedStyle").mockReturnValue({ backgroundColor: "rgb(1, 2, 3)" } as CSSStyleDeclaration);
    const { stage } = fakeStage();
    await exportPhotoBlob({ stage, pixelRatio: 2, backgroundColor: "var(--x)" });
    expect(log.find((c) => c[0] === "fillStyle")?.[1]).toBe("rgb(1, 2, 3)");
  });
});
